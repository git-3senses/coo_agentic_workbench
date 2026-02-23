const express = require('express');
const router = express.Router();
const db = require('../db');
const { getNpaProfiles } = require('./seed-npas');
const { validatePersistMiddleware } = require('../validation/autofill-schema');

// GET /api/npas — List all NPAs (with optional filters)
router.get('/', async (req, res) => {
    try {
        const { status, stage, type, track } = req.query;
        let sql = `
            SELECT p.*,
                   GROUP_CONCAT(DISTINCT j.jurisdiction_code) as jurisdictions,
                   (SELECT COUNT(*) FROM npa_signoffs s WHERE s.project_id = p.id AND s.status = 'APPROVED') as approved_signoffs,
                   (SELECT COUNT(*) FROM npa_signoffs s WHERE s.project_id = p.id) as total_signoffs,
                   (SELECT COUNT(*) FROM npa_breach_alerts b WHERE b.project_id = p.id AND b.status != 'RESOLVED') as active_breaches
            FROM npa_projects p
            LEFT JOIN npa_jurisdictions j ON p.id = j.project_id
        `;
        const conditions = [];
        const params = [];

        if (status) { conditions.push('p.status = ?'); params.push(status); }
        if (stage) { conditions.push('p.current_stage = ?'); params.push(stage); }
        if (type) { conditions.push('p.npa_type = ?'); params.push(type); }
        if (track) { conditions.push('p.approval_track = ?'); params.push(track); }

        if (conditions.length > 0) {
            sql += ' WHERE ' + conditions.join(' AND ');
        }
        sql += ' GROUP BY p.id ORDER BY p.created_at DESC';

        const [rows] = await db.query(sql, params);
        const projects = rows.map(row => ({
            ...row,
            jurisdictions: row.jurisdictions ? row.jurisdictions.split(',') : []
        }));
        res.json(projects);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/npas/:id — Full NPA detail
router.get('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const [project] = await db.query('SELECT * FROM npa_projects WHERE id = ?', [id]);
        if (project.length === 0) return res.status(404).json({ error: 'NPA not found' });

        const [jurisdictions] = await db.query('SELECT jurisdiction_code FROM npa_jurisdictions WHERE project_id = ?', [id]);
        const [assessments] = await db.query('SELECT * FROM npa_intake_assessments WHERE project_id = ?', [id]);
        const [scorecard] = await db.query('SELECT * FROM npa_classification_scorecards WHERE project_id = ? ORDER BY created_at DESC LIMIT 1', [id]);
        const [signoffs] = await db.query('SELECT * FROM npa_signoffs WHERE project_id = ? ORDER BY created_at', [id]);
        const [loopbacks] = await db.query('SELECT * FROM npa_loop_backs WHERE project_id = ? ORDER BY loop_back_number', [id]);
        const [comments] = await db.query('SELECT * FROM npa_comments WHERE project_id = ? ORDER BY created_at', [id]);
        const [formData] = await db.query('SELECT * FROM npa_form_data WHERE project_id = ?', [id]);
        const [documents] = await db.query('SELECT * FROM npa_documents WHERE project_id = ? ORDER BY uploaded_at DESC', [id]);
        const [workflowStates] = await db.query('SELECT * FROM npa_workflow_states WHERE project_id = ? ORDER BY FIELD(stage_id, "INITIATION","REVIEW","SIGN_OFF","LAUNCH","MONITORING")', [id]);
        const [breaches] = await db.query('SELECT * FROM npa_breach_alerts WHERE project_id = ? ORDER BY triggered_at DESC', [id]);
        const [metrics] = await db.query('SELECT * FROM npa_performance_metrics WHERE project_id = ? ORDER BY snapshot_date DESC LIMIT 1', [id]);
        const [approvals] = await db.query('SELECT * FROM npa_approvals WHERE project_id = ? ORDER BY created_at', [id]);
        const [postConditions] = await db.query('SELECT * FROM npa_post_launch_conditions WHERE project_id = ?', [id]);

        res.json({
            ...project[0],
            jurisdictions: jurisdictions.map(j => j.jurisdiction_code),
            assessments,
            scorecard: scorecard[0] || null,
            signoffs,
            loopbacks,
            comments,
            formData,
            documents,
            workflowStates,
            breaches,
            metrics: metrics[0] || null,
            approvals,
            postLaunchConditions: postConditions
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ═══════════════════════════════════════════════════════════════
// GET /api/npas/:id/prefill — AUTOFILL Step 1: Deterministic pre-fill
// ═══════════════════════════════════════════════════════════════
//
// Returns pre-filled values for RULE + COPY fields WITHOUT calling an LLM.
// RULE fields: resolved from the NPA record, product config, or lookup tables.
// COPY fields: copied from the most similar previously-approved NPA.
// LLM/MANUAL fields: returned as empty (to be filled by Dify Chatflow later).
//
// Query params:
//   ?similar_npa_id=xxx  — optional: explicit ID of the NPA to copy from
//
router.get('/:id/prefill', async (req, res) => {
    try {
        const id = req.params.id;
        const similarNpaId = req.query.similar_npa_id;

        // ── 1. Load the NPA record (source for RULE fields) ──
        const [npaRows] = await db.query('SELECT * FROM npa_projects WHERE id = ?', [id]);
        if (npaRows.length === 0) return res.status(404).json({ error: 'NPA not found' });
        const npa = npaRows[0];

        // Load jurisdictions for jurisdiction-based lookups
        const [jurisdictionRows] = await db.query(
            'SELECT jurisdiction_code FROM npa_jurisdictions WHERE project_id = ?', [id]
        );
        const jurisdictions = jurisdictionRows.map(j => j.jurisdiction_code);

        // ── 2. Find the most similar approved NPA (for COPY fields) ──
        let similarNpa = null;
        let similarFormData = [];

        if (similarNpaId) {
            // Explicit: use the provided similar NPA
            const [rows] = await db.query('SELECT * FROM npa_projects WHERE id = ?', [similarNpaId]);
            if (rows.length > 0) similarNpa = rows[0];
        } else {
            // Auto: find best match by product_type + product_category
            const [candidates] = await db.query(`
                SELECT * FROM npa_projects
                WHERE id != ? AND status IN ('Approved', 'Launched', 'In Monitoring')
                ORDER BY
                    (CASE WHEN product_category = ? THEN 2 ELSE 0 END) +
                    (CASE WHEN npa_type = ? THEN 2 ELSE 0 END) +
                    (CASE WHEN risk_level = ? THEN 1 ELSE 0 END) DESC,
                    created_at DESC
                LIMIT 1
            `, [id, npa.product_category || '', npa.npa_type || '', npa.risk_level || '']);

            if (candidates.length > 0) similarNpa = candidates[0];
        }

        // Load the similar NPA's form data (for COPY fields)
        if (similarNpa) {
            const [rows] = await db.query(
                'SELECT field_key, field_value, lineage, confidence_score FROM npa_form_data WHERE project_id = ?',
                [similarNpa.id]
            );
            similarFormData = rows;
        }
        const similarDataMap = new Map(similarFormData.map(r => [r.field_key, r.field_value]));

        // ── 3. Build the RULE field values ──
        // These are deterministic: derived from the NPA record, org config, or lookup tables.
        const ruleValues = {};

        // From npa_projects record
        if (npa.title) ruleValues['product_name'] = npa.title;
        if (npa.npa_type) ruleValues['product_type'] = npa.npa_type;
        if (npa.notional) ruleValues['notional_amount'] = String(npa.notional);

        // From product config (heuristic based on product_category/type)
        const category = (npa.product_category || '').toLowerCase();
        const npaType = (npa.npa_type || '').toLowerCase();

        // Booking system — deterministic by product family
        if (category.includes('derivative') || category.includes('ird') || category.includes('swap')) {
            ruleValues['booking_system'] = 'Murex (MX.3) - IRD Module';
            ruleValues['booking_family'] = 'OTC Derivatives';
            ruleValues['booking_typology'] = 'ISDA Master Agreement';
            ruleValues['settlement_method'] = 'T+2 Standard Settlement';
            ruleValues['funding_type'] = 'Unfunded';
        } else if (category.includes('fx') || category.includes('foreign exchange')) {
            ruleValues['booking_system'] = 'Murex (MX.3) - FX Module';
            ruleValues['booking_family'] = 'FX Spot/Forward';
            ruleValues['booking_typology'] = 'FX Standard';
            ruleValues['settlement_method'] = 'CLS / T+2';
            ruleValues['funding_type'] = 'Unfunded';
        } else if (category.includes('structured') || category.includes('note')) {
            ruleValues['booking_system'] = 'Murex (MX.3) - Structured Products';
            ruleValues['booking_family'] = 'Structured Notes';
            ruleValues['booking_typology'] = 'EMTN Programme';
            ruleValues['settlement_method'] = 'Euroclear / Clearstream';
            ruleValues['funding_type'] = 'Funded';
        } else {
            ruleValues['booking_system'] = 'Murex (MX.3)';
            ruleValues['booking_family'] = 'General';
            ruleValues['booking_typology'] = 'Standard';
            ruleValues['settlement_method'] = 'T+2 Standard Settlement';
            ruleValues['funding_type'] = npa.is_funded ? 'Funded' : 'Unfunded';
        }

        // Booking entity — from org chart (by jurisdiction)
        if (jurisdictions.includes('SG')) {
            ruleValues['booking_entity'] = 'DBS Bank Ltd (Singapore)';
            ruleValues['booking_legal_form'] = 'DBS Bank Ltd';
            ruleValues['counterparty'] = 'Institutional / Corporate (SG)';
        } else if (jurisdictions.includes('HK')) {
            ruleValues['booking_entity'] = 'DBS Bank (Hong Kong) Ltd';
            ruleValues['booking_legal_form'] = 'DBS Bank (Hong Kong) Ltd';
            ruleValues['counterparty'] = 'Institutional / Corporate (HK)';
        } else if (jurisdictions.includes('CN')) {
            ruleValues['booking_entity'] = 'DBS Bank (China) Ltd';
            ruleValues['booking_legal_form'] = 'DBS Bank (China) Ltd';
            ruleValues['counterparty'] = 'Institutional / Corporate (CN)';
        } else {
            ruleValues['booking_entity'] = 'DBS Bank Ltd';
            ruleValues['booking_legal_form'] = 'DBS Bank Ltd';
            ruleValues['counterparty'] = 'Institutional / Corporate';
        }

        // Portfolio allocation — by risk level
        ruleValues['portfolio_allocation'] = npa.risk_level === 'HIGH'
            ? 'Trading Book — Market Risk Capital Required'
            : 'Banking Book — Standard Allocation';

        // Market Risk Factor matrix — defaults based on product type
        const isIRD = category.includes('ird') || category.includes('swap') || category.includes('rate');
        const isFX = category.includes('fx') || category.includes('currency');
        const isEquity = category.includes('equity') || category.includes('eq');
        const isCredit = category.includes('credit') || category.includes('cds');
        const isCommodity = category.includes('commodity');

        ruleValues['mrf_ir_delta'] = (isIRD || isFX) ? 'Yes | Yes | Yes | Yes' : 'No | No | No | No';
        ruleValues['mrf_ir_vega'] = isIRD ? 'Yes | Yes | No | No' : 'No | No | No | No';
        ruleValues['mrf_fx_delta'] = isFX ? 'Yes | Yes | Yes | Yes' : 'No | No | No | No';
        ruleValues['mrf_fx_vega'] = isFX ? 'Yes | Yes | No | No' : 'No | No | No | No';
        ruleValues['mrf_eq_delta'] = isEquity ? 'Yes | Yes | Yes | Yes' : 'No | No | No | No';
        ruleValues['mrf_commodity'] = isCommodity ? 'Yes | Yes | No | No' : 'No | No | No | No';
        ruleValues['mrf_credit'] = isCredit ? 'Yes | Yes | Yes | No' : 'No | No | No | No';
        ruleValues['mrf_correlation'] = (isIRD && isFX) ? 'Yes | Yes | No | No' : 'No | No | No | No';

        // Regulation lookup — by jurisdiction
        if (jurisdictions.includes('SG')) {
            ruleValues['primary_regulation'] = 'Monetary Authority of Singapore (MAS) — Securities and Futures Act';
            ruleValues['secondary_regulations'] = 'MAS Notice SFA 04-N12 (OTC Derivatives), MAS Guidelines on Risk Management Practices';
            ruleValues['regulatory_reporting'] = 'DTCC (MAS-mandated trade repository), MAS Form 25A/25B';
            ruleValues['sanctions_check'] = 'MAS Sanctions List + OFAC/EU/UN consolidated list screening required';
        } else if (jurisdictions.includes('HK')) {
            ruleValues['primary_regulation'] = 'Hong Kong Monetary Authority (HKMA) — Securities and Futures Ordinance (SFO)';
            ruleValues['secondary_regulations'] = 'HKMA CR-G-14 (Counterparty Risk), SFC Code of Conduct';
            ruleValues['regulatory_reporting'] = 'HKTR (HKMA Trade Repository), SFC Large Position Reporting';
            ruleValues['sanctions_check'] = 'HKMA Sanctions List + OFAC/EU/UN consolidated list screening required';
        } else {
            ruleValues['primary_regulation'] = 'Local regulatory authority — Securities and Banking regulations';
            ruleValues['secondary_regulations'] = 'Applicable OTC derivatives and risk management regulations';
            ruleValues['regulatory_reporting'] = 'Trade repository reporting per local requirements';
            ruleValues['sanctions_check'] = 'OFAC/EU/UN consolidated list screening required';
        }

        // Pricing model (from NPA record or product config)
        ruleValues['pricing_model_name'] = category.includes('derivative')
            ? 'Black-Scholes / Monte Carlo Simulation'
            : category.includes('structured')
                ? 'Discounted Cash Flow + Monte Carlo'
                : 'Mark-to-Market / Fair Value';
        ruleValues['model_validation_date'] = new Date().toISOString().slice(0, 10);

        // Misc RULE fields from NPA record
        if (npa.underlying_asset) ruleValues['underlying_asset'] = npa.underlying_asset;
        if (npa.tenor) ruleValues['tenor'] = npa.tenor;
        ruleValues['booking_schema'] = ruleValues['booking_family'] + ' — ' + ruleValues['booking_typology'];

        // ── 4. Build COPY field values (from similar NPA) ──
        const copyFieldKeys = [
            'product_role', 'product_maturity', 'product_lifecycle', 'distribution_channels',
            'sales_suitability', 'front_office_model', 'middle_office_model', 'back_office_model',
            'confirmation_process', 'reconciliation', 'legal_opinion', 'tax_impact',
            'data_privacy', 'data_retention', 'gdpr_compliance', 'data_ownership',
            'collateral_types', 'valuation_method', 'funding_source'
        ];

        const copyValues = {};
        for (const key of copyFieldKeys) {
            const val = similarDataMap.get(key);
            if (val && val.trim()) {
                copyValues[key] = val;
            }
        }

        // ── 5. Merge and return ──
        const filledFields = [];

        // Add RULE fields
        for (const [key, value] of Object.entries(ruleValues)) {
            if (value) {
                filledFields.push({
                    field_key: key,
                    value: value,
                    lineage: 'AUTO',
                    confidence: 95,
                    source: 'deterministic_rule',
                    strategy: 'RULE'
                });
            }
        }

        // Add COPY fields
        for (const [key, value] of Object.entries(copyValues)) {
            filledFields.push({
                field_key: key,
                value: value,
                lineage: 'AUTO',
                confidence: 75,
                source: similarNpa ? `copied_from_npa:${similarNpa.id}` : 'similar_npa',
                strategy: 'COPY'
            });
        }

        // Return summary
        res.json({
            npa_id: id,
            similar_npa_id: similarNpa?.id || null,
            similar_npa_title: similarNpa?.title || null,
            filled_fields: filledFields,
            summary: {
                rule_count: Object.keys(ruleValues).length,
                copy_count: Object.keys(copyValues).length,
                total_prefilled: filledFields.length,
                remaining_for_llm: 'Use POST /api/dify/workflow with app=WF_NPA_Autofill for LLM fields'
            }
        });

    } catch (err) {
        console.error('[PREFILL] Error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// ═══════════════════════════════════════════════════════════════
// POST /api/npas/:id/prefill/persist — Persist pre-filled values to DB
// ═══════════════════════════════════════════════════════════════
router.post('/:id/prefill/persist', validatePersistMiddleware, async (req, res) => {
    try {
        const id = req.params.id;
        const { filled_fields } = req.validatedBody;

        const conn = await db.getConnection();
        try {
            await conn.beginTransaction();

            for (const field of filled_fields) {
                if (!field.field_key || !field.value) continue;

                // Upsert into npa_form_data
                await conn.query(`
                    INSERT INTO npa_form_data (project_id, field_key, field_value, lineage, confidence_score, metadata)
                    VALUES (?, ?, ?, ?, ?, ?)
                    ON DUPLICATE KEY UPDATE
                        field_value = VALUES(field_value),
                        lineage = VALUES(lineage),
                        confidence_score = VALUES(confidence_score),
                        metadata = VALUES(metadata)
                `, [
                    id,
                    field.field_key,
                    field.value,
                    field.lineage || 'AUTO',
                    field.confidence || null,
                    JSON.stringify({
                        source: field.source || 'prefill',
                        strategy: field.strategy || 'RULE',
                        prefilled_at: new Date().toISOString()
                    })
                ]);
            }

            await conn.commit();

            res.json({
                status: 'PERSISTED',
                npa_id: id,
                fields_saved: filled_fields.length
            });
        } catch (err) {
            await conn.rollback();
            throw err;
        } finally {
            conn.release();
        }
    } catch (err) {
        console.error('[PREFILL-PERSIST] Error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/npas/:id/form-sections — NPA form data organized by sections
router.get('/:id/form-sections', async (req, res) => {
    try {
        const id = req.params.id;
        const [sections] = await db.query(`
            SELECT s.id, s.title, s.description, s.order_index
            FROM ref_npa_sections s
            WHERE s.template_id = 'STD_NPA_V2'
            ORDER BY s.order_index
        `);

        const [fields] = await db.query(`
            SELECT f.field_key, f.label, f.field_type, f.is_required, f.tooltip, f.section_id, f.order_index,
                   fd.field_value, fd.lineage, fd.confidence_score, fd.metadata
            FROM ref_npa_fields f
            LEFT JOIN npa_form_data fd ON f.field_key = fd.field_key AND fd.project_id = ?
            ORDER BY f.order_index
        `, [id]);

        const result = sections.map(section => ({
            ...section,
            fields: fields
                .filter(f => f.section_id === section.id)
                .map(f => ({
                    key: f.field_key,
                    label: f.label,
                    type: f.field_type,
                    required: !!f.is_required,
                    tooltip: f.tooltip,
                    value: f.field_value || '',
                    lineage: f.lineage || 'MANUAL',
                    confidenceScore: f.confidence_score,
                    metadata: f.metadata ? JSON.parse(f.metadata) : null
                }))
        }));

        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/npas/seed-demo — Clear ALL NPA data (wipe slate for fresh seeding)
router.delete('/seed-demo', async (req, res) => {
    console.log('[NPA SEED-CLEAR] Wiping all NPA data...');
    const conn = await db.getConnection();
    try {
        await conn.query(`SET sql_mode = ''`);
        await conn.query('SET FOREIGN_KEY_CHECKS = 0');
        await conn.beginTransaction();

        const tables = [
            'npa_loop_backs', 'npa_post_launch_conditions', 'npa_performance_metrics',
            'npa_breach_alerts', 'npa_classification_scorecards', 'npa_intake_assessments',
            'npa_workflow_states', 'npa_signoffs', 'npa_documents', 'npa_jurisdictions',
            'npa_form_data', 'npa_approvals', 'npa_comments', 'npa_projects'
        ];
        for (const table of tables) {
            try { await conn.query(`DELETE FROM ${table}`); } catch (_) { /* table may not exist */ }
        }

        await conn.commit();
        await conn.query('SET FOREIGN_KEY_CHECKS = 1');
        console.log('[NPA SEED-CLEAR] All NPA data wiped successfully');
        res.json({ status: 'CLEARED', message: 'All NPA data has been removed' });
    } catch (err) {
        await conn.rollback();
        await conn.query('SET FOREIGN_KEY_CHECKS = 1');
        console.error('[NPA SEED-CLEAR] Error:', err.message);
        res.status(500).json({ error: err.message });
    } finally {
        conn.release();
    }
});

// POST /api/npas/seed-demo — Create 8 diverse NPAs covering all NPA types, product categories, risk levels
// Aligned with KB_NPA_Templates.md — modeled after real TSG examples (TSG1917, TSG2042, TSG2339, TSG2055)
router.post('/seed-demo', async (req, res) => {
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    console.log('[NPA SEED-DEMO] Creating 8 diverse NPAs...');
    const profiles = getNpaProfiles(now);
    const conn = await db.getConnection();
    const results = [];

    try {
        await conn.query(`SET sql_mode = ''`);
        await conn.query('SET FOREIGN_KEY_CHECKS = 0');
        await conn.beginTransaction();

        // ── Insert any missing field_keys into ref_npa_fields so FK is satisfied ──
        const allFieldKeys = new Set();
        for (const p of profiles) {
            for (const fd of (p.formData || [])) { allFieldKeys.add(fd[0]); }
        }
        const [existingKeys] = await conn.query('SELECT field_key FROM ref_npa_fields');
        const existingSet = new Set(existingKeys.map(r => r.field_key));
        const missing = [...allFieldKeys].filter(k => !existingSet.has(k));
        if (missing.length > 0) {
            // Map field_keys to their correct template sections
            const fieldSectionMap = {
                // SEC_PROD — sub-headers + fields
                hdr_prod_basic: 'SEC_PROD', hdr_prod_revenue: 'SEC_PROD',
                trade_date: 'SEC_PROD', pac_reference: 'SEC_PROD', funding_type: 'SEC_PROD',
                product_maturity: 'SEC_PROD', product_lifecycle: 'SEC_PROD',
                revenue_year1: 'SEC_PROD', revenue_year2: 'SEC_PROD', revenue_year3: 'SEC_PROD',
                target_roi: 'SEC_PROD', spv_details: 'SEC_PROD', product_role: 'SEC_PROD',
                // SEC_OPS — sub-headers + fields
                hdr_ops_operational: 'SEC_OPS', hdr_ops_booking: 'SEC_OPS', hdr_ops_bcp: 'SEC_OPS',
                valuation_model: 'SEC_OPS', confirmation_process: 'SEC_OPS', reconciliation: 'SEC_OPS',
                tech_requirements: 'SEC_OPS', front_office_model: 'SEC_OPS', middle_office_model: 'SEC_OPS',
                back_office_model: 'SEC_OPS', booking_legal_form: 'SEC_OPS', booking_family: 'SEC_OPS',
                booking_typology: 'SEC_OPS', portfolio_allocation: 'SEC_OPS', hsm_required: 'SEC_OPS',
                pentest_status: 'SEC_OPS', iss_deviations: 'SEC_OPS',
                // SEC_RISK — sub-headers + fields
                hdr_risk_market: 'SEC_RISK', hdr_risk_credit: 'SEC_RISK',
                hdr_risk_operational: 'SEC_RISK', hdr_risk_capital: 'SEC_RISK',
                credit_risk: 'SEC_RISK', operational_risk: 'SEC_RISK', liquidity_risk: 'SEC_RISK',
                reputational_risk: 'SEC_RISK', var_capture: 'SEC_RISK', stress_scenarios: 'SEC_RISK',
                counterparty_default: 'SEC_RISK', custody_risk: 'SEC_RISK', esg_assessment: 'SEC_RISK',
                // SEC_PRICE — sub-header + fields
                hdr_price_methodology: 'SEC_PRICE',
                roae_analysis: 'SEC_PRICE', pricing_assumptions: 'SEC_PRICE', bespoke_adjustments: 'SEC_PRICE',
                pricing_model_name: 'SEC_PRICE', model_validation_date: 'SEC_PRICE', simm_treatment: 'SEC_PRICE',
                // SEC_DATA — sub-header + fields
                hdr_data_principles: 'SEC_DATA',
                data_retention: 'SEC_DATA', reporting_requirements: 'SEC_DATA', pure_assessment_id: 'SEC_DATA',
                gdpr_compliance: 'SEC_DATA', data_ownership: 'SEC_DATA',
                // SEC_REG — sub-header + fields
                hdr_reg_compliance: 'SEC_REG',
                primary_regulation: 'SEC_REG', secondary_regulations: 'SEC_REG',
                regulatory_reporting: 'SEC_REG', sanctions_check: 'SEC_REG',
                // SEC_PROD — Commercialization (PC.I.3)
                distribution_channels: 'SEC_PROD', sales_suitability: 'SEC_PROD', marketing_plan: 'SEC_PROD',
                // SEC_RISK — Market Risk Factor Matrix (PC.IV.B.1.table)
                mrf_ir_delta: 'SEC_RISK', mrf_ir_vega: 'SEC_RISK', mrf_fx_delta: 'SEC_RISK',
                mrf_fx_vega: 'SEC_RISK', mrf_eq_delta: 'SEC_RISK', mrf_commodity: 'SEC_RISK',
                mrf_credit: 'SEC_RISK', mrf_correlation: 'SEC_RISK',
                // SEC_REG — Financial Crime Risk Areas (Appendix 3)
                aml_assessment: 'SEC_REG', terrorism_financing: 'SEC_REG',
                sanctions_assessment: 'SEC_REG', fraud_risk: 'SEC_REG', bribery_corruption: 'SEC_REG',
                // SEC_ENTITY — Appendix 5 Trading Products
                booking_entity: 'SEC_ENTITY', counterparty: 'SEC_ENTITY', counterparty_rating: 'SEC_ENTITY',
                strike_price: 'SEC_ENTITY', ip_considerations: 'SEC_ENTITY',
                collateral_types: 'SEC_ENTITY', valuation_method: 'SEC_ENTITY',
                funding_source: 'SEC_ENTITY', booking_schema: 'SEC_ENTITY',
                // SEC_SIGN
                required_signoffs: 'SEC_SIGN', signoff_order: 'SEC_SIGN',
                // SEC_LEGAL — sub-header + fields
                hdr_legal_docs: 'SEC_LEGAL',
                isda_agreement: 'SEC_LEGAL', tax_impact: 'SEC_LEGAL',
                // SEC_DOCS
                term_sheet: 'SEC_DOCS', supporting_documents: 'SEC_DOCS',
                // Missing template field_keys (Part C + Appendices alignment)
                data_privacy: 'SEC_DATA', booking_system: 'SEC_OPS',
                risk_classification: 'SEC_RISK', regulatory_capital: 'SEC_RISK'
            };
            console.log(`[NPA SEED-DEMO] Adding ${missing.length} missing field keys to ref_npa_fields:`, missing);
            for (const key of missing) {
                const sectionId = fieldSectionMap[key] || 'SEC_PROD';
                const fieldType = key.startsWith('hdr_') ? 'header' :
                    ['business_rationale', 'legal_opinion', 'market_risk', 'credit_risk', 'operational_risk',
                        'liquidity_risk', 'reputational_risk', 'var_capture', 'stress_scenarios', 'counterparty_default',
                        'custody_risk', 'esg_assessment', 'roae_analysis', 'pricing_assumptions', 'supporting_documents',
                        'isda_agreement', 'tax_impact', 'npa_process_type', 'business_case_status', 'product_role',
                        'underlying_asset', 'customer_segments', 'bundling_rationale',
                        'distribution_channels', 'sales_suitability', 'marketing_plan',
                        'aml_assessment', 'terrorism_financing', 'sanctions_assessment', 'fraud_risk', 'bribery_corruption',
                        'collateral_types', 'valuation_method', 'funding_source', 'booking_schema',
                        'data_privacy', 'risk_classification', 'regulatory_capital'].includes(key) ? 'textarea' : 'text';
                // Header labels come from seed data (the 'value' field), regular labels auto-generated from key
                const headerLabels = {
                    hdr_prod_basic: 'Product Specifications (Basic Information)',
                    hdr_prod_revenue: 'Revenue & Commercial Viability',
                    hdr_ops_operational: 'Operational Information',
                    hdr_ops_booking: 'Booking & Settlement',
                    hdr_ops_bcp: 'Business Continuity & Security',
                    hdr_risk_market: 'A. Market & Liquidity Risk',
                    hdr_risk_credit: 'B. Credit Risk & Counterparty Credit Risk',
                    hdr_risk_operational: 'C. Operational & Reputational Risk',
                    hdr_risk_capital: 'D. Regulatory Capital & Stress Testing',
                    hdr_price_methodology: 'Pricing Model Validation / Assurance',
                    hdr_data_principles: 'Data Principles & Management Requirements',
                    hdr_reg_compliance: 'Legal & Compliance Considerations',
                    hdr_legal_docs: 'Documentation Requirements'
                };
                const label = headerLabels[key] || key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                // Headers get specific order_index to position them correctly within sections
                const headerOrder = {
                    hdr_prod_basic: 1, hdr_prod_revenue: 50,
                    hdr_ops_operational: 1, hdr_ops_booking: 30, hdr_ops_bcp: 60,
                    hdr_risk_market: 1, hdr_risk_credit: 20, hdr_risk_operational: 40, hdr_risk_capital: 60,
                    hdr_price_methodology: 1,
                    hdr_data_principles: 1,
                    hdr_reg_compliance: 1,
                    hdr_legal_docs: 1
                };
                const orderIdx = headerOrder[key] || (fieldType === 'header' ? 10 : 999);
                // Generate a unique ID: FLD_ + uppercase abbreviation of the field key
                const fldId = 'FLD_' + key.replace(/^hdr_/, 'H_').toUpperCase().substring(0, 40);
                // Per-field guidance text (tooltip) from official NPA template
                const tooltipMap = {
                    business_rationale: 'Describe the purpose or rationale for the proposal — what problem does it solve and what are the benefits?',
                    product_name: 'Official product/service name as registered with the PAC.',
                    product_type: 'Product category classification (e.g. FX Derivatives, Credit Derivatives, Fund Products).',
                    product_role: 'Role of Proposing Unit — manufacturer, distributor, principal, or agent.',
                    underlying_asset: 'Describe the underlying reference asset(s) including denomination and settlement index.',
                    tenor: 'Product maturity/tenor range, standard tenors, and roll dates.',
                    funding_type: 'Funded position vs unfunded derivative.',
                    product_maturity: 'Standard maturities offered and any maturity restrictions.',
                    product_lifecycle: 'Lifecycle stage — new launch, reactivation, or extension.',
                    revenue_year1: 'Expected revenue in Year 1.',
                    revenue_year2: 'Expected revenue in Year 2.',
                    revenue_year3: 'Expected revenue in Year 3.',
                    target_roi: 'Target return on allocated equity (ROAE).',
                    spv_details: 'Describe any SPVs including arranger, country of incorporation, and monitoring responsibility.',
                    customer_segments: 'Target customer segments, regulatory restrictions, suitability criteria.',
                    distribution_channels: 'Which channels will distribute this product and the rationale for multi-channel approach.',
                    sales_suitability: 'Customer qualification, onboarding, and suitability assessment process.',
                    marketing_plan: 'Go-to-market strategy, materials, and communication plan.',
                    pac_reference: 'PAC approval reference number and any conditions imposed.',
                    ip_considerations: 'External parties involved in the initiative — include Risk Profiling ID references.',
                    front_office_model: 'Front Office system and functional responsibilities.',
                    middle_office_model: 'Middle Office responsibilities including P&L attribution and IPV.',
                    back_office_model: 'Back Office settlement, SWIFT/CLS, and nostro reconciliation.',
                    booking_legal_form: 'Legal form of the transaction (e.g. OTC bilateral, unit trust).',
                    booking_family: 'Product family for booking classification.',
                    booking_typology: 'Booking system typology code (Family|Group|Type).',
                    portfolio_allocation: 'Portfolio assignment in the booking system.',
                    confirmation_process: 'Electronic confirmation process and unconfirmed trade aging policy.',
                    reconciliation: 'Daily P&L, monthly position, and quarterly regulatory reconciliation.',
                    tech_requirements: 'New system builds or configuration changes required.',
                    booking_system: 'Primary booking system and integration details.',
                    valuation_model: 'Front Office pricing/valuation model used.',
                    settlement_method: 'End-to-end settlement process including payment and confirmation.',
                    iss_deviations: 'Any deviations from Information Security Standards policies.',
                    pentest_status: 'Status of security penetration testing for new/changed systems.',
                    hsm_required: 'Whether HSM (High-Security Module) review is required.',
                    pricing_methodology: 'Pricing model, Greeks, and spread structure.',
                    roae_analysis: 'ROAE calculation, capital consumption, and revenue/capital ratio.',
                    pricing_assumptions: 'Market data sources, calibration window, and key assumptions.',
                    bespoke_adjustments: 'Any bespoke pricing adjustments vs standard pricing grid.',
                    pricing_model_name: 'Model name used for pricing validation.',
                    model_validation_date: 'Date of most recent model validation.',
                    simm_treatment: 'ISDA SIMM risk class and margin components.',
                    legal_opinion: 'Legal documentation requirements and enforceability assessment.',
                    primary_regulation: 'Primary regulatory framework governing this product.',
                    secondary_regulations: 'Additional regulatory requirements and frameworks.',
                    regulatory_reporting: 'Trade repository and regulatory reporting obligations.',
                    sanctions_check: 'Sanctions screening process and list coverage.',
                    market_risk: 'Key market risk factors and sensitivities.',
                    risk_classification: 'Overall risk classification and rationale.',
                    credit_risk: 'Counterparty credit risk assessment and mitigation.',
                    operational_risk: 'Operational risk factors and key controls.',
                    liquidity_risk: 'Funding/liquidity risk and stress behavior.',
                    reputational_risk: 'Reputational risk assessment including ESG considerations.',
                    var_capture: 'VaR model, coverage, holding period, and back-testing.',
                    stress_scenarios: 'Stress testing scenarios and ALCO reporting.',
                    counterparty_default: 'EAD, LGD, and wrong-way risk assessment.',
                    custody_risk: 'Securities custody arrangements and reconciliation.',
                    esg_assessment: 'Environmental, Social, and Governance risk assessment.',
                    regulatory_capital: 'Regulatory capital treatment and model validation.',
                    data_privacy: 'Data privacy framework and cross-border data transfer.',
                    data_retention: 'Data retention periods per regulatory requirements.',
                    gdpr_compliance: 'PDPA/GDPR compliance and cross-border data governance.',
                    data_ownership: 'Data ownership roles across Front/Middle/Back Office.',
                    pure_assessment_id: 'PURE assessment reference ID.',
                    reporting_requirements: 'Regulatory and internal reporting obligations.',
                    tax_impact: 'Withholding tax, GST, income tax, and transfer pricing impact.',
                    isda_agreement: 'ISDA Master Agreement status and special provisions.',
                    mrf_ir_delta: 'Interest Rate Delta: Applicable? | Sensitivity Reports? | VaR Capture? | Stress Capture?',
                    mrf_ir_vega: 'Interest Rate Vega: Applicable? | Sensitivity Reports? | VaR Capture? | Stress Capture?',
                    mrf_fx_delta: 'FX Delta: Applicable? | Sensitivity Reports? | VaR Capture? | Stress Capture?',
                    mrf_fx_vega: 'FX Vega: Applicable? | Sensitivity Reports? | VaR Capture? | Stress Capture?',
                    mrf_eq_delta: 'Equity Delta: Applicable? | Sensitivity Reports? | VaR Capture? | Stress Capture?',
                    mrf_commodity: 'Commodity Risk: Applicable? | Sensitivity Reports? | VaR Capture? | Stress Capture?',
                    mrf_credit: 'Credit Risk: Applicable? | Sensitivity Reports? | VaR Capture? | Stress Capture?',
                    mrf_correlation: 'Correlation Risk: Applicable? | Sensitivity Reports? | VaR Capture? | Stress Capture?',
                    aml_assessment: 'Anti-Money Laundering risk assessment and controls.',
                    terrorism_financing: 'Terrorism Financing risk assessment and screening procedures.',
                    sanctions_assessment: 'Comprehensive sanctions screening framework and escalation procedures.',
                    fraud_risk: 'Fraud risk rating, key risks, and preventive controls.',
                    bribery_corruption: 'Bribery & corruption risk assessment and compliance controls.',
                    collateral_types: 'Eligible collateral types, haircuts, and custody arrangements.',
                    valuation_method: 'Independent price verification methodology and valuation adjustments.',
                    funding_source: 'Funding structure, FTP rate, and liquidity contingency.',
                    booking_schema: 'Booking architecture, lifecycle management, and cross-product integration.'
                };
                const tooltip = tooltipMap[key] || null;
                await conn.query(
                    `INSERT IGNORE INTO ref_npa_fields (id, field_key, label, field_type, section_id, order_index, is_required, tooltip)
                     VALUES (?, ?, ?, ?, ?, ?, 0, ?)`,
                    [fldId, key, label, fieldType, sectionId, orderIdx, tooltip]
                );
            }
            // Also fix any previously mis-assigned field_keys (e.g. section_id='business_case')
            for (const [key, sectionId] of Object.entries(fieldSectionMap)) {
                await conn.query(
                    `UPDATE ref_npa_fields SET section_id = ? WHERE field_key = ? AND section_id NOT LIKE 'SEC_%'`,
                    [sectionId, key]
                );
            }
        }

        // Backfill tooltip for ALL existing fields (runs regardless of missing fields)
        const tooltipBackfill = {
            business_rationale: 'Describe the purpose or rationale for the proposal — what problem does it solve and what are the benefits?',
            product_name: 'Official product/service name as registered with the PAC.',
            product_type: 'Product category classification (e.g. FX Derivatives, Credit Derivatives, Fund Products).',
            product_role: 'Role of Proposing Unit — manufacturer, distributor, principal, or agent.',
            underlying_asset: 'Describe the underlying reference asset(s) including denomination and settlement index.',
            tenor: 'Product maturity/tenor range, standard tenors, and roll dates.',
            funding_type: 'Funded position vs unfunded derivative.',
            product_maturity: 'Standard maturities offered and any maturity restrictions.',
            product_lifecycle: 'Lifecycle stage — new launch, reactivation, or extension.',
            revenue_year1: 'Expected revenue in Year 1.',
            revenue_year2: 'Expected revenue in Year 2.',
            revenue_year3: 'Expected revenue in Year 3.',
            target_roi: 'Target return on allocated equity (ROAE).',
            spv_details: 'Describe any SPVs including arranger, country of incorporation, and monitoring responsibility.',
            customer_segments: 'Target customer segments, regulatory restrictions, suitability criteria.',
            distribution_channels: 'Which channels will distribute this product and the rationale for multi-channel approach.',
            sales_suitability: 'Customer qualification, onboarding, and suitability assessment process.',
            marketing_plan: 'Go-to-market strategy, materials, and communication plan.',
            pac_reference: 'PAC approval reference number and any conditions imposed.',
            ip_considerations: 'External parties involved in the initiative — include Risk Profiling ID references.',
            front_office_model: 'Front Office system and functional responsibilities.',
            middle_office_model: 'Middle Office responsibilities including P&L attribution and IPV.',
            back_office_model: 'Back Office settlement, SWIFT/CLS, and nostro reconciliation.',
            booking_legal_form: 'Legal form of the transaction (e.g. OTC bilateral, unit trust).',
            booking_family: 'Product family for booking classification.',
            booking_typology: 'Booking system typology code (Family|Group|Type).',
            portfolio_allocation: 'Portfolio assignment in the booking system.',
            confirmation_process: 'Electronic confirmation process and unconfirmed trade aging policy.',
            reconciliation: 'Daily P&L, monthly position, and quarterly regulatory reconciliation.',
            tech_requirements: 'New system builds or configuration changes required.',
            booking_system: 'Primary booking system and integration details.',
            valuation_model: 'Front Office pricing/valuation model used.',
            settlement_method: 'End-to-end settlement process including payment and confirmation.',
            iss_deviations: 'Any deviations from Information Security Standards policies.',
            pentest_status: 'Status of security penetration testing for new/changed systems.',
            hsm_required: 'Whether HSM (High-Security Module) review is required.',
            pricing_methodology: 'Pricing model, Greeks, and spread structure.',
            roae_analysis: 'ROAE calculation, capital consumption, and revenue/capital ratio.',
            pricing_assumptions: 'Market data sources, calibration window, and key assumptions.',
            bespoke_adjustments: 'Any bespoke pricing adjustments vs standard pricing grid.',
            pricing_model_name: 'Model name used for pricing validation.',
            model_validation_date: 'Date of most recent model validation.',
            simm_treatment: 'ISDA SIMM risk class and margin components.',
            legal_opinion: 'Legal documentation requirements and enforceability assessment.',
            primary_regulation: 'Primary regulatory framework governing this product.',
            secondary_regulations: 'Additional regulatory requirements and frameworks.',
            regulatory_reporting: 'Trade repository and regulatory reporting obligations.',
            sanctions_check: 'Sanctions screening process and list coverage.',
            market_risk: 'Key market risk factors and sensitivities.',
            risk_classification: 'Overall risk classification and rationale.',
            credit_risk: 'Counterparty credit risk assessment and mitigation.',
            operational_risk: 'Operational risk factors and key controls.',
            liquidity_risk: 'Funding/liquidity risk and stress behavior.',
            reputational_risk: 'Reputational risk assessment including ESG considerations.',
            var_capture: 'VaR model, coverage, holding period, and back-testing.',
            stress_scenarios: 'Stress testing scenarios and ALCO reporting.',
            counterparty_default: 'EAD, LGD, and wrong-way risk assessment.',
            custody_risk: 'Securities custody arrangements and reconciliation.',
            esg_assessment: 'Environmental, Social, and Governance risk assessment.',
            regulatory_capital: 'Regulatory capital treatment and model validation.',
            data_privacy: 'Data privacy framework and cross-border data transfer.',
            data_retention: 'Data retention periods per regulatory requirements.',
            gdpr_compliance: 'PDPA/GDPR compliance and cross-border data governance.',
            data_ownership: 'Data ownership roles across Front/Middle/Back Office.',
            pure_assessment_id: 'PURE assessment reference ID.',
            reporting_requirements: 'Regulatory and internal reporting obligations.',
            tax_impact: 'Withholding tax, GST, income tax, and transfer pricing impact.',
            isda_agreement: 'ISDA Master Agreement status and special provisions.',
            notional_amount: 'Expected notional amount in base currency.',
            desk: 'Trading desk assignment.',
            business_unit: 'Business unit classification.',
            npa_process_type: 'NPA classification — Full NPA, NPA Lite, Bundling, or Evergreen.',
            business_case_status: 'PAC approval status and reference.',
            mrf_ir_delta: 'Interest Rate Delta: Applicable? | Sensitivity Reports? | VaR Capture? | Stress Capture?',
            mrf_ir_vega: 'Interest Rate Vega: Applicable? | Sensitivity Reports? | VaR Capture? | Stress Capture?',
            mrf_fx_delta: 'FX Delta: Applicable? | Sensitivity Reports? | VaR Capture? | Stress Capture?',
            mrf_fx_vega: 'FX Vega: Applicable? | Sensitivity Reports? | VaR Capture? | Stress Capture?',
            mrf_eq_delta: 'Equity Delta: Applicable? | Sensitivity Reports? | VaR Capture? | Stress Capture?',
            mrf_commodity: 'Commodity Risk: Applicable? | Sensitivity Reports? | VaR Capture? | Stress Capture?',
            mrf_credit: 'Credit Risk: Applicable? | Sensitivity Reports? | VaR Capture? | Stress Capture?',
            mrf_correlation: 'Correlation Risk: Applicable? | Sensitivity Reports? | VaR Capture? | Stress Capture?',
            aml_assessment: 'Anti-Money Laundering risk assessment and controls.',
            terrorism_financing: 'Terrorism Financing risk assessment and screening procedures.',
            sanctions_assessment: 'Comprehensive sanctions screening framework and escalation procedures.',
            fraud_risk: 'Fraud risk rating, key risks, and preventive controls.',
            bribery_corruption: 'Bribery & corruption risk assessment and compliance controls.',
            collateral_types: 'Eligible collateral types, haircuts, and custody arrangements.',
            valuation_method: 'Independent price verification methodology and valuation adjustments.',
            funding_source: 'Funding structure, FTP rate, and liquidity contingency.',
            booking_schema: 'Booking architecture, lifecycle management, and cross-product integration.'
        };
        for (const [fk, tip] of Object.entries(tooltipBackfill)) {
            await conn.query('UPDATE ref_npa_fields SET tooltip = ? WHERE field_key = ? AND (tooltip IS NULL OR tooltip = "")', [tip, fk]);
        }

        for (const p of profiles) {
            const proj = p.project;
            const id = proj.id;

            // ── 1. npa_projects ──
            await conn.query(`
                INSERT INTO npa_projects
                    (id, title, description, product_category, npa_type, risk_level,
                     is_cross_border, notional_amount, currency, current_stage, status,
                     submitted_by, product_manager, pm_team, template_name, kickoff_date,
                     proposal_preparer, pac_approval_status, approval_track,
                     estimated_revenue, predicted_approval_likelihood,
                     predicted_timeline_days, predicted_bottleneck,
                     classification_confidence, classification_method,
                     ${proj.launched_at ? 'launched_at,' : ''}
                     created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?,
                        ?, ?, ?, ?, ?,
                        ?, ?, ?, ?, ?,
                        ?, ?, ?,
                        ?, ?,
                        ?, ?,
                        ?, ?,
                        ${proj.launched_at ? '?,' : ''}
                        NOW(), NOW())
            `, [
                id, proj.title, proj.description, proj.product_category, proj.npa_type, proj.risk_level,
                proj.is_cross_border, proj.notional_amount, proj.currency, proj.current_stage, proj.status,
                proj.submitted_by, proj.product_manager, proj.pm_team, proj.template_name, proj.kickoff_date,
                proj.proposal_preparer, proj.pac_approval_status, proj.approval_track,
                proj.estimated_revenue, proj.predicted_approval_likelihood,
                proj.predicted_timeline_days, proj.predicted_bottleneck,
                proj.classification_confidence, proj.classification_method,
                ...(proj.launched_at ? [proj.launched_at] : [])
            ]);

            // ── 2. npa_form_data ──
            for (const fd of (p.formData || [])) {
                await conn.query(
                    `INSERT INTO npa_form_data (project_id, field_key, field_value, lineage, confidence_score, metadata) VALUES (?, ?, ?, ?, ?, ?)`,
                    [id, fd[0], fd[1], fd[2], fd[3], fd[4] || null]
                );
            }

            // ── 3. npa_jurisdictions ──
            for (const jur of (p.jurisdictions || [])) {
                await conn.query(`INSERT INTO npa_jurisdictions (project_id, jurisdiction_code) VALUES (?, ?)`, [id, jur]);
            }

            // ── 4. npa_documents ──
            for (const doc of (p.documents || [])) {
                await conn.query(
                    `INSERT INTO npa_documents (project_id, document_name, document_type, file_size, file_extension, category, validation_status, uploaded_by, uploaded_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [id, doc[0], doc[1], doc[2], doc[3], doc[4], doc[5], doc[6], now]
                );
            }

            // ── 5. npa_signoffs ──
            for (const so of (p.signoffs || [])) {
                await conn.query(
                    `INSERT INTO npa_signoffs (project_id, party, department, status, approver_user_id, approver_name, approver_email, decision_date, sla_deadline, sla_breached, comments, loop_back_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [id, so[0], so[1], so[2], so[3], so[4], so[5], so[6], so[7], so[8], so[9], so[10]]
                );
            }

            // ── 6. npa_workflow_states ──
            for (const ws of (p.workflowStates || [])) {
                await conn.query(
                    `INSERT INTO npa_workflow_states (project_id, stage_id, status, started_at, completed_at, blockers) VALUES (?, ?, ?, ?, ?, ?)`,
                    [id, ws[0], ws[1], ws[2], ws[3], ws[4]]
                );
            }

            // ── 7. npa_classification_scorecards ──
            if (p.scorecard) {
                await conn.query(
                    `INSERT INTO npa_classification_scorecards (project_id, total_score, calculated_tier, breakdown, created_at) VALUES (?, ?, ?, ?, NOW())`,
                    [id, p.scorecard.total_score, p.scorecard.calculated_tier, JSON.stringify(p.scorecard.breakdown)]
                );
            }

            // ── 8. npa_intake_assessments ──
            for (const ia of (p.assessments || [])) {
                await conn.query(
                    `INSERT INTO npa_intake_assessments (project_id, domain, status, score, findings, assessed_at) VALUES (?, ?, ?, ?, ?, NOW())`,
                    [id, ia[0], ia[1], ia[2], ia[3]]
                );
            }

            // ── 9. npa_breach_alerts ──
            for (let i = 0; i < (p.breaches || []).length; i++) {
                const br = p.breaches[i];
                const brId = `BR-${id}-${i + 1}`;
                await conn.query(
                    `INSERT INTO npa_breach_alerts (id, project_id, title, severity, description, threshold_value, actual_value, escalated_to, sla_hours, status, triggered_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
                    [brId, id, br[0], br[1], br[2], br[3], br[4], br[5], br[6], br[7]]
                );
            }

            // ── 10. npa_performance_metrics ──
            if (p.metrics) {
                const m = p.metrics;
                await conn.query(
                    `INSERT INTO npa_performance_metrics (project_id, days_since_launch, total_volume, volume_currency, realized_pnl, active_breaches, counterparty_exposure, var_utilization, collateral_posted, next_review_date, health_status, snapshot_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
                    [id, m.days_since_launch, m.total_volume, m.volume_currency, m.realized_pnl, m.active_breaches, m.counterparty_exposure, m.var_utilization, m.collateral_posted, m.next_review_date, m.health_status]
                );
            } else {
                // Default pre-launch metrics
                await conn.query(
                    `INSERT INTO npa_performance_metrics (project_id, days_since_launch, total_volume, volume_currency, realized_pnl, active_breaches, counterparty_exposure, var_utilization, collateral_posted, next_review_date, health_status, snapshot_date) VALUES (?, 0, 0.00, 'USD', 0.00, ?, 0.00, 0.00, 0.00, DATE_ADD(NOW(), INTERVAL 6 MONTH), 'healthy', NOW())`,
                    [id, (p.breaches || []).length]
                );
            }

            // ── 11. npa_post_launch_conditions ──
            for (const plc of (p.postLaunchConditions || [])) {
                await conn.query(
                    `INSERT INTO npa_post_launch_conditions (project_id, condition_text, owner_party, due_date, status) VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 3 MONTH), 'PENDING')`,
                    [id, plc[0], plc[1]]
                );
            }

            results.push({ id: proj.id, title: proj.title, npa_type: proj.npa_type, track: proj.approval_track, product: proj.product_category, stage: proj.current_stage, risk: proj.risk_level });
        }

        await conn.commit();
        await conn.query('SET FOREIGN_KEY_CHECKS = 1');
        console.log(`[NPA SEED-DEMO] Success: ${results.length} NPAs created`);
        res.json({ status: 'SEEDED', count: results.length, npas: results });
    } catch (err) {
        await conn.rollback();
        await conn.query('SET FOREIGN_KEY_CHECKS = 1');
        console.error('[NPA SEED-DEMO] Error:', err.message);
        res.status(500).json({ error: err.message });
    } finally {
        conn.release();
    }
});

// PUT /api/npas/:id — Update existing NPA (Unified Persistence)
router.put('/:id', async (req, res) => {
    const id = req.params.id;
    const { title, description, npa_type, stage, status, formData } = req.body;
    console.log(`[NPA UPDATE] ID: ${id}, fields:`, Object.keys(req.body));

    try {
        const conn = await db.getConnection();
        try {
            await conn.beginTransaction();

            // 1. Update project metadata
            const updateFields = [];
            const params = [];
            if (title) { updateFields.push('title = ?'); params.push(title); }
            if (description) { updateFields.push('description = ?'); params.push(description); }
            if (npa_type) { updateFields.push('npa_type = ?'); params.push(npa_type); }
            if (stage) { updateFields.push('current_stage = ?'); params.push(stage); }
            if (status) { updateFields.push('status = ?'); params.push(status); }
            updateFields.push('updated_at = NOW()');

            if (updateFields.length > 0) {
                await conn.query(
                    `UPDATE npa_projects SET ${updateFields.join(', ')} WHERE id = ?`,
                    [...params, id]
                );
            }

            // 2. Update form data (field-by-field)
            if (formData && Array.isArray(formData)) {
                for (const field of formData) {
                    const key = field.field_key || field.key;
                    const val = field.field_value || field.value;
                    const lineage = field.lineage || 'MANUAL';
                    const confidence = field.confidence_score !== undefined ? field.confidence_score : (field.confidence || null);
                    const metadata = field.metadata ? (typeof field.metadata === 'string' ? field.metadata : JSON.stringify(field.metadata)) : null;

                    await conn.query(`
                        INSERT INTO npa_form_data (project_id, field_key, field_value, lineage, confidence_score, metadata)
                        VALUES (?, ?, ?, ?, ?, ?)
                        ON DUPLICATE KEY UPDATE
                            field_value = VALUES(field_value),
                            lineage = VALUES(lineage),
                            confidence_score = VALUES(confidence_score),
                            metadata = VALUES(metadata)
                    `, [id, key, val, lineage, confidence, metadata]);
                }
            }

            await conn.commit();
            console.log(`[NPA UPDATE] Success for ${id}`);
            res.json({ id, status: 'UPDATED' });
        } catch (err) {
            await conn.rollback();
            throw err;
        } finally {
            conn.release();
        }
    } catch (err) {
        console.error('[NPA UPDATE] Error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// POST /api/npas — Create new NPA
router.post('/', async (req, res) => {
    console.log('[NPA CREATE] Received:', JSON.stringify(req.body));
    const { title, description, submitted_by, npa_type } = req.body;
    const id = 'NPA-2026-' + String(Date.now()).slice(-3);
    try {
        const conn = await db.getConnection();
        try {
            await conn.query(`SET sql_mode = ''`);
            await conn.query(
                `INSERT INTO npa_projects (id, title, description, submitted_by, npa_type, current_stage, status, created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, 'INITIATION', 'On Track', NOW(), NOW())`,
                [id, title, description, submitted_by || 'system', npa_type || 'STANDARD']
            );
            console.log('[NPA CREATE] Success:', id);
            res.json({ id, status: 'CREATED' });
        } finally {
            conn.release();
        }
    } catch (err) {
        console.error('[NPA CREATE] Error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
