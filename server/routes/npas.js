const express = require('express');
const router = express.Router();
const db = require('../db');

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
        const [conditions] = await db.query('SELECT * FROM npa_post_launch_conditions WHERE project_id = ?', [id]);

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
            postLaunchConditions: conditions
        });
    } catch (err) {
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

// POST /api/npas/seed-demo — Create a fully-equipped demo NPA with rich data across all 12 tables
// This seeds comprehensive data so all 7 Dify agents produce non-zero, realistic results.
router.post('/seed-demo', async (req, res) => {
    const id = 'NPA-DEMO-' + String(Date.now()).slice(-3);
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    console.log('[NPA SEED-DEMO] Creating fully-equipped demo NPA:', id);

    const conn = await db.getConnection();
    try {
        await conn.query(`SET sql_mode = ''`);
        await conn.beginTransaction();

        // ── 1. npa_projects — Full row with all columns populated ───────
        // Product: TSG2026 Digital Currency Trading Platform (matches NPA Golden Source template)
        await conn.query(`
            INSERT INTO npa_projects
                (id, title, description, product_category, npa_type, risk_level,
                 is_cross_border, notional_amount, currency, current_stage, status,
                 submitted_by, product_manager, pm_team, template_name, kickoff_date,
                 proposal_preparer, pac_approval_status, approval_track,
                 estimated_revenue, predicted_approval_likelihood,
                 predicted_timeline_days, predicted_bottleneck,
                 classification_confidence, classification_method,
                 created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?,
                    ?, ?, ?, ?, ?,
                    ?, ?, ?, ?, ?,
                    ?, ?, ?,
                    ?, ?,
                    ?, ?,
                    ?, ?,
                    NOW(), NOW())
        `, [
            id,
            'TSG2026 Digital Currency Trading Platform',
            'The TSG2026 Digital Currency Trading Platform is a comprehensive institutional-grade digital asset trading and custody solution designed to address the rapidly growing demand for secure, regulated cryptocurrency trading services. The platform enables DBS to offer professional-grade digital currency trading capabilities covering BTC, ETH, ADA, SOL, and major stablecoins (USDT, USDC) with real-time settlement and 24/7 operations. It is operated as a principal trader and platform operator through a dedicated SPV (DBS Digital Assets Trading Pte Ltd) incorporated in Singapore for regulatory segregation and risk isolation. The platform targets institutional investors, corporate treasury departments, high net worth individuals (>$10M AUM), and professional trading firms across Singapore, Hong Kong, and selected international markets. Revenue is driven through trading spreads (0.25-0.75%), custody fees (0.15% annually), and platform access fees, with a target ROI of 35% by Year 3. The business case was approved by the Executive Committee on January 15, 2026, and this proposal follows the Full NPA (New-to-Group) process given the novel nature of the product and its risk profile.',
            'Digital Assets',
            'New-to-Group',
            'HIGH',
            true,                   // is_cross_border — SG, HK, LN
            500000000.00,           // notional_amount — Year 1 transaction volume target $500M
            'USD',
            'RISK_ASSESSMENT',      // mid-flow stage for richest agent output
            'At Risk',
            'Sarah Chen',
            'Sarah Chen',
            'Digital Assets Trading Team',
            'Full NPA v1.0',
            '2026-02-01',
            'Sarah Chen',
            'In Review',
            'FULL_NPA',
            15000000.00,            // estimated_revenue Year 1
            68.00,                  // predicted_approval_likelihood — novel product, more uncertainty
            21.00,                  // predicted_timeline_days — complex cross-border
            'Legal & Compliance',   // predicted_bottleneck — multi-jurisdictional licensing
            89.0,                   // classification_confidence
            'AGENT'                 // classification_method
        ]);

        // ── 2. npa_form_data — Comprehensive field coverage matching NPA Golden Source template ──
        // Maps to NPA_Filled_Template.md: Part A (Basic Info) + Part C (7 sections + 5 appendices)
        // Each field has narrative depth: rationale, explanation, decision-making context
        const formRows = [
            // ─── SEC_BASIC: Part A — Basic Product Information ────────────────
            [id, 'product_manager_name', 'Sarah Chen / Digital Assets Trading Team', 'MANUAL', 100.0, null],
            [id, 'group_product_head',   'William Tan / Global Financial Markets (GFM)', 'MANUAL', 100.0, null],
            [id, 'proposal_preparer',    'Sarah Chen', 'MANUAL', 100.0, null],
            [id, 'business_case_status', 'Yes - Approved by Executive Committee on January 15, 2026. The business case demonstrated a compelling revenue opportunity of $2.3B annually in the digital assets market, with DBS positioned to capture significant institutional demand given existing banking infrastructure, regulatory relationships, and client trust. The Executive Committee endorsed the strategic rationale of positioning DBS as a leader in digital finance innovation while maintaining conservative risk management standards.', 'MANUAL', 100.0, null],
            [id, 'npa_process_type',     'Full NPA — New-to-Group Product. Digital currency trading represents an entirely new asset class for DBS with no existing internal precedent. The novel nature of the product, the regulatory complexity across multiple jurisdictions, and the unique operational and technology requirements necessitate the full NPA review process with all sign-off parties engaged.', 'MANUAL', 100.0, null],
            [id, 'pac_approval_date',    'Pending NPA completion', 'MANUAL', 100.0, null],
            [id, 'kickoff_date',         '2026-02-01', 'MANUAL', 100.0, null],
            [id, 'mtj_journey',          'Singapore Digital Trading Journey (IBG) and Hong Kong Institutional Trading (IBG). These MtJ journeys were selected because the platform directly impacts the institutional banking group\'s digital capability roadmap and client experience for cross-border trading activities.', 'AUTO', 92.0, '{"source": "Ideation Agent"}'],
            [id, 'approving_authority',  'Group COO of GFM — Peter Soh. As a New-to-Group product with cross-border operations spanning Singapore, Hong Kong, and London, the approval authority sits at the Group COO level per the NPA governance framework.', 'MANUAL', 100.0, null],

            // ─── SEC_PROD: Part C Section I — Product Specifications ──────────
            [id, 'product_name',         'TSG2026 Digital Currency Trading Platform', 'AUTO', 96.0, '{"source": "Ideation Agent"}'],
            [id, 'product_type',         'Digital Assets', 'AUTO', 97.0, '{"source": "Classification Agent"}'],
            [id, 'desk',                 'Digital Assets Trading Desk (newly established under GFM)', 'AUTO', 99.0, null],
            [id, 'business_unit',        'Global Financial Markets (GFM)', 'AUTO', 99.0, null],
            [id, 'underlying_asset',     'BTC (Bitcoin), ETH (Ethereum), ADA (Cardano), SOL (Solana), and major stablecoins including USDT (Tether) and USDC (Circle). The asset selection was determined through a rigorous evaluation of market liquidity, institutional demand patterns, regulatory clarity, and custodial infrastructure availability. Assets were chosen based on their institutional adoption maturity, trading volume depth, and the existence of robust pricing feeds from multiple independent sources.', 'AUTO', 95.0, '{"source": "Ideation Agent"}'],
            [id, 'tenor',               'Spot trading with T+0 settlement. Unlike traditional FX or derivatives products, the digital asset trading platform operates on immediate settlement cycles enabled by blockchain infrastructure. This eliminates counterparty settlement risk inherent in T+1 or T+2 cycles while introducing unique operational requirements around 24/7 availability and real-time custody management.', 'MANUAL', 100.0, null],
            [id, 'notional_amount',      '500000000', 'MANUAL', 100.0, null],
            [id, 'strike_price',         'N/A — Spot trading only. No derivatives or structured products in initial launch scope.', 'MANUAL', 100.0, null],
            [id, 'trade_date',           '2026-08-01', 'MANUAL', 100.0, null],
            [id, 'product_role',         'Principal Trader and Platform Operator. DBS acts as the principal counterparty to all trades, providing liquidity through market-making arrangements with institutional liquidity providers. The platform operator role encompasses client onboarding, custody, compliance monitoring, and regulatory reporting across all operating jurisdictions.', 'AUTO', 94.0, null],
            [id, 'funding_type',         'Funded trading with real-time settlement. Clients must maintain pre-funded accounts before executing trades. This funding model eliminates credit risk on the client side and ensures DBS maintains full collateral coverage at all times, consistent with the conservative risk appetite for a new asset class.', 'AUTO', 91.0, null],
            [id, 'product_maturity',     'Spot trading with T+0 settlement cycle. The platform operates 24/7 with planned maintenance windows (Saturday 02:00-04:00 SGT). Positions are marked to market continuously with real-time pricing from CoinMetrics and cross-validated against multiple exchange data feeds.', 'AUTO', 90.0, null],
            [id, 'product_lifecycle',    'Phase 1: Platform setup and regulatory approval (6 months, Feb-Jul 2026) — Technology build, MAS licensing, security certification, operational readiness. Phase 2: Pilot launch with select clients (3 months, Aug-Oct 2026) — 10-15 institutional clients, controlled trading limits, enhanced monitoring. Phase 3: Full commercial launch (Nov 2026 onwards) — Open to all qualified institutional clients, expanded asset coverage. Phase 4: Continuous enhancement — Addition of derivatives, DeFi products, and expanded jurisdiction coverage based on regulatory developments.', 'MANUAL', 100.0, null],
            [id, 'revenue_year1',        '15000000', 'MANUAL', 100.0, null],
            [id, 'revenue_year2',        '35000000', 'MANUAL', 100.0, null],
            [id, 'revenue_year3',        '75000000', 'MANUAL', 100.0, null],
            [id, 'target_roi',           '35% by Year 3. The ROI target reflects the significant upfront technology and compliance investment ($8.5M) amortized over the 3-year horizon against projected revenue growth from $15M (Y1) to $75M (Y3). Revenue drivers include trading spreads (0.25-0.75% per transaction), custody fees (0.15% annually on AUM), and premium platform access fees for API trading clients.', 'MANUAL', 100.0, null],
            [id, 'spv_details',          'DBS Digital Assets Trading Pte Ltd — Singapore incorporated Special Purpose Vehicle for regulatory segregation and risk isolation. The SPV structure was chosen to (1) ringfence digital asset operations from core banking activities, (2) provide a clean regulatory perimeter for MAS Digital Payment Token licensing, (3) facilitate independent capital allocation and performance measurement, and (4) limit contagion risk to the parent entity in the event of digital asset market stress.', 'MANUAL', 100.0, null],
            [id, 'pac_reference',        'ExCo-2026-DA-001', 'MANUAL', 100.0, null],
            [id, 'business_rationale',   'The Digital Currency Trading Platform addresses a critical strategic imperative for DBS. Institutional demand for secure, regulated digital asset trading capabilities has grown 340% year-over-year, with an estimated addressable market of $2.3B annually across APAC. DBS\'s existing institutional client base of 2,500+ qualified investors has expressed strong demand, with 47% indicating they would allocate 3-5% of their portfolios to digital assets if offered through a trusted banking partner. The platform positions DBS as a first-mover among APAC\'s regulated banks in offering institutional-grade digital asset trading. Competitive analysis shows that while several global banks have entered the space (Goldman Sachs, JP Morgan), no APAC-headquartered bank currently offers a comparable institutional platform. The proposal leverages DBS\'s existing advantages: strong regulatory relationships with MAS and HKMA, trusted brand reputation among institutional clients, and proven operational infrastructure for complex trading products. The business model generates revenue through three channels: trading spreads (0.25-0.75% estimated based on market benchmarks), custody fees (0.15% annually), and platform access fees. The conservative revenue projections assume Year 1 transaction volume of $500M growing to $2.8B by Year 3 as the client base expands and additional assets are onboarded.', 'MANUAL', 100.0, null],

            // ─── SEC_CUST: Target Customers ───────────────────────────────────
            [id, 'customer_segments',    'Institutional Investors (hedge funds, family offices, pension funds seeking regulated digital asset exposure); Corporate Treasury departments seeking digital asset diversification and hedging capabilities; High Net Worth Individuals (>$10M AUM) with sophisticated investment mandates; Professional trading firms and market makers requiring institutional-grade execution and custody infrastructure.', 'AUTO', 93.0, '{"source": "Ideation Agent"}'],
            [id, 'customer_restrictions', 'Accredited Investors only as defined under the Singapore Securities and Futures Act (SFA). Institutional Professional Investor qualification required under HKMA guidelines for Hong Kong operations. Enhanced KYC and AML requirements apply specifically for digital asset clients, including source of funds verification for cryptocurrency holdings, wallet address screening against sanctions lists, and ongoing transaction monitoring using blockchain analytics. Retail investors are explicitly excluded from the initial launch scope.', 'AUTO', 90.0, null],
            [id, 'customer_profile',     'Target clients have annual turnover exceeding $100M, are sophisticated investors with demonstrable digital asset experience or willingness to complete DBS\'s mandatory education program, maintain strong compliance and risk management frameworks within their own organizations, and are domiciled in or operating from Singapore, Hong Kong, or selected international markets with clear regulatory frameworks for digital asset participation.', 'AUTO', 88.0, null],
            [id, 'geographic_scope',     'Primary: Singapore and Hong Kong. Secondary: Selected international markets including UK (London-based institutional clients), Japan, and Australia. Geographic expansion is phased based on regulatory clarity and licensing progress in each jurisdiction. Singapore serves as the primary booking and operations center, with Hong Kong as a secondary execution venue for regional clients.', 'AUTO', 91.0, null],

            // ─── SEC_COMM: Commercialization ──────────────────────────────────
            [id, 'distribution_channels', 'Dedicated digital asset trading portal accessible via web and API interfaces, providing institutional-grade order management, real-time market data, and portfolio analytics. Relationship Manager support for client onboarding, education, and ongoing advisory. 24/7 trading desk staffed with digital asset specialists for institutional clients requiring voice execution or complex order types. API connectivity for programmatic trading supporting FIX protocol and REST interfaces for systematic strategies.', 'AUTO', 89.0, null],
            [id, 'sales_suitability',    'Comprehensive digital asset risk assessment administered during onboarding to evaluate client understanding of digital asset risks including price volatility, technology risk, regulatory uncertainty, and liquidity risk. Mandatory client education program covering blockchain fundamentals, custody mechanics, and DBS-specific trading procedures. Sophisticated investor qualification process verified through documentation of prior digital asset trading experience, investment mandates, and risk tolerance frameworks. Enhanced suitability documentation retained for regulatory compliance across all operating jurisdictions.', 'AUTO', 87.0, null],
            [id, 'marketing_plan',       'Institutional client seminars and education sessions hosted quarterly in Singapore and Hong Kong. Digital asset market research reports published monthly providing institutional-grade analysis and insights. Thought leadership content series on regulatory developments, market structure, and institutional adoption trends. Targeted outreach program to qualified institutional investors through existing RM relationships with warm introductions to the digital assets team.', 'AUTO', 85.0, null],

            // ─── SEC_OPS: Part C Section II — Operational & Technology ────────
            [id, 'booking_system',       'Custom-built Digital Asset Trading Platform (cloud-native architecture on AWS). The platform was purpose-built rather than adapting existing systems (Murex, Calypso) because digital asset trading requires fundamentally different capabilities: 24/7 operation, blockchain settlement integration, multi-signature custody operations, and real-time on-chain monitoring that cannot be retrofitted into traditional trading platforms.', 'AUTO', 92.0, null],
            [id, 'front_office_model',   'Client onboarding through enhanced digital KYC workflow with blockchain analytics verification. Trading interface supporting both web-based execution and programmatic API access. Relationship management team providing institutional clients with dedicated coverage, market insights, and execution support. Real-time market pricing with dynamic spreads adjusted based on market volatility, liquidity conditions, and position risk.', 'AUTO', 90.0, null],
            [id, 'middle_office_model',  'Real-time risk monitoring with automated position limit checks and margin calculations. Compliance oversight including transaction surveillance, market manipulation detection, and regulatory reporting. Trade surveillance using Elliptic blockchain analytics for AML screening, sanctions compliance, and suspicious activity detection. Daily reconciliation of on-chain positions against internal booking records.', 'AUTO', 88.0, null],
            [id, 'back_office_model',    'Automated settlement via Fireblocks custody infrastructure with multi-signature approval workflows. Custody operations including hot/warm/cold wallet management, key ceremony procedures, and insurance coverage. T+0 settlement with real-time confirmation and client reporting. Automated regulatory transaction reporting to MAS, HKMA, and other applicable regulators.', 'AUTO', 87.0, null],
            [id, 'booking_legal_form',   'ISDA Master Agreement with Digital Assets Annex. The standard ISDA framework was extended with a purpose-built Digital Assets Annex covering custody provisions, fork event handling, airdrop treatment, network congestion delays, and digital-asset-specific close-out netting provisions.', 'AUTO', 95.0, null],
            [id, 'booking_family',       'CRY (Cryptocurrency)', 'AUTO', 99.0, null],
            [id, 'booking_typology',     'CRY_SPOT_TRADE. New typology created for digital asset spot transactions, accommodating unique attributes including wallet address tracking, blockchain transaction IDs, network fee allocation, and confirmation block requirements.', 'AUTO', 96.0, null],
            [id, 'portfolio_allocation', 'DBSSG_GFM_CRYPTO — Dedicated portfolio within GFM for digital asset positions, segregated from traditional trading books for risk management, capital allocation, and P&L attribution purposes.', 'AUTO', 97.0, null],
            [id, 'settlement_method',    'Real-time settlement via blockchain with fiat settlement through core banking integration. Digital asset legs settle on-chain through Fireblocks custody infrastructure. Fiat legs settle through DBS core banking systems with same-day value. Cross-currency settlement supported for SGD, HKD, USD, and EUR funding.', 'AUTO', 90.0, null],
            [id, 'confirmation_process', 'Automated trade confirmation generated immediately upon execution, delivered via platform notification, email, and API webhook. Blockchain transaction confirmation tracked in real-time with configurable confirmation block thresholds (BTC: 3 blocks, ETH: 12 blocks). Client-facing confirmation includes trade details, wallet addresses, transaction hashes, and settlement status.', 'AUTO', 88.0, null],
            [id, 'reconciliation',       'Daily reconciliation across three dimensions: (1) On-chain wallet balances vs internal position records, (2) Client account balances vs trading system records, (3) Fiat settlement records vs core banking entries. Automated exception detection with T+0 escalation for material breaks. Monthly full-scope reconciliation reviewed by Operations team lead.', 'AUTO', 86.0, null],
            [id, 'valuation_model',      'Real-time market pricing aggregated from multiple institutional-grade data sources (CoinMetrics primary, supplemented by Kaiko and CryptoCompare). Volume-weighted average pricing with outlier detection and circuit breaker mechanisms. Mark-to-market valuations calculated continuously with end-of-day official NAV for reporting. Stablecoin valuation monitored against peg with automated alerts for depegging events exceeding 0.5%.', 'AUTO', 91.0, null],
            [id, 'tech_requirements',    'New systems required: (1) Cloud-native digital asset trading platform on AWS with multi-region deployment, (2) Fireblocks cryptocurrency custody infrastructure integration with HSM key management, (3) Real-time risk monitoring and compliance systems purpose-built for 24/7 digital asset operations, (4) Elliptic blockchain analytics and monitoring tools for AML compliance. Integration requirements: Core banking systems for fiat settlement, risk management system connections for firm-wide risk aggregation, regulatory reporting infrastructure adaptation for digital asset transaction types, client onboarding and KYC systems extended with blockchain-specific verification capabilities.', 'AUTO', 90.0, '{"source": "Classification Agent"}'],
            [id, 'iss_deviations',       'No deviations from Information Security Standards (ISS) policies. All requirements fully compliant with DBS security standards. Additional security controls implemented above baseline ISS requirements including: multi-signature wallet technology, hardware security modules (HSMs) for cryptographic key management, end-to-end encryption for all transaction data, and advanced threat detection with 24/7 SOC monitoring specific to cryptocurrency operations.', 'AUTO', 95.0, null],
            [id, 'pentest_status',       'Comprehensive security assessment completed including external penetration testing by CrowdStrike (Feb 2026), internal red team exercise, smart contract audit (for custody integration), and blockchain-specific attack surface assessment. All critical and high findings remediated. Ongoing quarterly penetration testing scheduled.', 'AUTO', 93.0, null],
            [id, 'hsm_required',         'Yes — Hardware Security Modules required for cryptographic key management. Thales Luna HSMs deployed in Singapore and Hong Kong data centers for custodial key generation, storage, and signing operations. HSM architecture follows FIPS 140-2 Level 3 certification standards with geographic key distribution and M-of-N signing ceremonies.', 'AUTO', 96.0, null],

            // ─── SEC_PRICE: Part C Section III — Pricing Model Details ────────
            [id, 'pricing_methodology',  'Dynamic spread-based pricing model incorporating real-time market conditions, liquidity depth, volatility regime, and position risk factors. Base spreads range from 0.25% (BTC/ETH in normal conditions) to 0.75% (altcoins or elevated volatility). Pricing model validated through backtesting against 24 months of historical data across multiple market regimes including the May 2024 correction and Q4 2025 rally.', 'AUTO', 89.0, '{"source": "KB Match: Digital Asset Pricing Framework v2"}'],
            [id, 'pricing_model_name',   'DBS-CRYPTO-PRC-2026-v1.0. Validated January 20, 2026. Model incorporates dynamic spread adjustment algorithms, real-time volatility surface estimation, and liquidity-adjusted pricing with circuit breaker mechanisms for extreme market conditions.', 'AUTO', 87.0, null],
            [id, 'pricing_assumptions',  'Key pricing assumptions: (1) Institutional trading volume follows a 60/40 BTC/ETH split with 20% allocation to altcoins and stablecoins, (2) Average daily volatility of 3-5% for major cryptocurrencies based on trailing 12-month realized volatility, (3) Liquidity depth sufficient for institutional-size orders up to $5M per execution without material market impact, (4) Spread compression of 10-15% annually as market matures and competition increases. Sensitivity analysis performed across stress scenarios including 50% drawdown, liquidity crisis, and exchange outage events.', 'AUTO', 85.0, null],
            [id, 'bespoke_adjustments',  'Volume-tiered pricing for clients exceeding $50M monthly volume with negotiated spread reductions. Market-making rebates for clients providing two-sided liquidity. Custody fee waivers during initial 6-month pilot period for founding clients.', 'AUTO', 82.0, null],
            [id, 'roae_analysis',        'ROAE projected at 22.5% by Year 3 (above the 12% institutional hurdle rate). Capital allocation: $12M regulatory capital plus $8.5M technology investment. Revenue trajectory: Year 1 $15M (trading spreads $10M + custody $3M + platform fees $2M), Year 2 $35M, Year 3 $75M. Sensitivity analysis shows ROAE remains above hurdle even under conservative scenario (30% volume reduction) at 14.2%. Key risk to ROAE: regulatory-driven spread compression and increased capital requirements under evolving digital asset prudential frameworks. Transfer pricing for cross-entity operations (SG-HK) follows arm\'s length principles with agreed allocation methodology reviewed by Group Tax.', 'AUTO', 86.0, null],
            [id, 'simm_treatment',       'SIMM sensitivities validated for digital asset exposures with appropriate risk factor mapping. Digital asset positions mapped to new SIMM risk class with calibrated risk weights reflecting the higher volatility profile compared to traditional asset classes. Margin calculations incorporate crypto-specific scenarios including flash crash events, blockchain network congestion, and stablecoin depegging scenarios.', 'AUTO', 84.0, null],
            [id, 'model_validation_date', '2026-01-20', 'AUTO', 99.0, null],

            // ─── SEC_RISK: Part C Section IV — Risk Analysis ─────────────────
            [id, 'risk_classification',  'HIGH — Multi-dimensional risk profile encompassing market risk (extreme price volatility), credit risk (counterparty default and custody risk), operational risk (24/7 technology operations, cybersecurity), regulatory risk (evolving multi-jurisdictional framework), and reputational risk (digital asset market perception). Risk classification driven by the novel nature of the asset class, cross-border operational complexity, and regulatory uncertainty.', 'AUTO', 91.0, '{"source": "Risk Agent"}'],
            [id, 'market_risk',          'Digital asset market risk is characterized by significantly higher volatility compared to traditional asset classes, with daily price movements of 5-15% not uncommon and drawdowns of 50-80% observed in historical cycles. Risk factors include: Crypto Delta (direct price exposure to BTC, ETH, ADA, SOL), Crypto Vega (implied volatility risk from spread dynamics), FX Delta (fiat-crypto conversion exposure across SGD, HKD, USD, EUR), and Correlation Risk (inter-asset correlations that spike during market stress, reducing diversification benefits). VaR is calculated using Monte Carlo simulation with 99% confidence interval calibrated to crypto-specific fat-tailed distributions. Comprehensive stress testing scenarios include: 50% single-day crash (replicating March 2020), exchange outage with forced position hold, stablecoin depegging cascade, and correlated liquidation spiral.', 'AUTO', 88.0, '{"source": "Risk Agent"}'],
            [id, 'var_capture',          'Full VaR capture across all risk factors: Crypto Delta, Crypto Vega, FX Delta, and Correlation Risk. Sensitivity reports generated hourly during active trading. VaR model uses Monte Carlo simulation with 10,000 scenarios, calibrated to crypto-specific return distributions (Student-t with 4 degrees of freedom to capture fat tails). Daily VaR reporting to Risk Management with real-time breach alerting. Backtesting performed monthly with model recalibration trigger if exceptions exceed Basel traffic light thresholds.', 'AUTO', 92.0, null],
            [id, 'stress_scenarios',     'Stress testing framework includes: (1) Crypto Winter scenario — 80% drawdown over 6 months with 95% volume reduction, (2) Flash Crash — 50% intraday decline replicating March 2020 COVID crash, (3) Exchange Contagion — major exchange failure (FTX-style) with associated liquidity freeze, (4) Regulatory Shock — sudden ban on institutional crypto trading in key jurisdiction, (5) Stablecoin Depeg — USDT/USDC loses peg with cascading liquidations, (6) Cyber Attack — custody breach requiring emergency wallet migration. Stress P&L impact quantified for each scenario with identified risk mitigants and capital buffer requirements.', 'AUTO', 87.0, null],
            [id, 'regulatory_capital',   'Trading Book assignment confirmed. Capital requirements calculated under standardized approach for digital assets with a 1,250% risk weight applied to cryptocurrency exposures per MAS Notice 637 interim guidance on crypto-assets. Regular model validation and backtesting procedures with annual Independent Price Verification (IPV).', 'AUTO', 85.0, null],
            [id, 'credit_risk',          'Counterparty default risk mitigated through pre-funded trading model (clients must maintain 100% collateral before execution). Custody risk addressed through Fireblocks institutional-grade infrastructure with $30M insurance coverage, multi-signature wallets, and geographic key distribution. Settlement risk during fiat-crypto conversions mitigated through atomic settlement where possible and escrow mechanisms for manual settlements. Technology provider credit risk managed through diversified vendor relationships and contractual SLA protections with financial penalties.', 'AUTO', 89.0, null],
            [id, 'counterparty_default', 'Pre-funded model eliminates traditional counterparty credit exposure. Residual settlement risk limited to intraday FX settlement window (< 4 hours). Custody counterparty risk (Fireblocks) managed through: $30M professional indemnity insurance, SOC 2 Type II certification, geographic redundancy of key material, and contractual right to migrate to alternative custodian within 30 days.', 'AUTO', 86.0, null],
            [id, 'custody_risk',         'Digital asset custody represents a novel risk category requiring purpose-built controls. Risks include: private key compromise (mitigated by HSMs and multi-sig), insider threat (mitigated by M-of-N signing ceremony), smart contract vulnerability (mitigated by formal verification and audit), and blockchain network risk (mitigated by multi-chain support). Fireblocks custody infrastructure provides institutional-grade security with $30M insurance, SOC 2 certification, and 24/7 security monitoring.', 'AUTO', 88.0, null],
            [id, 'operational_risk',     'Key operational risks: (1) 24/7 operational requirement with no natural market close — addressed through shift-based staffing and automated monitoring, (2) Blockchain network congestion causing settlement delays — addressed through dynamic fee estimation and priority transaction routing, (3) Fork events creating duplicate assets — addressed through fork response playbook and client communication protocols, (4) Cybersecurity threats specific to cryptocurrency operations — addressed through defense-in-depth architecture with HSMs, multi-sig, cold storage rotation, and 24/7 SOC monitoring. Operational risk capital allocated under basic indicator approach with enhanced qualitative adjustments for novel technology risks.', 'AUTO', 87.0, null],
            [id, 'liquidity_risk',       'Digital asset liquidity risk manifests differently from traditional markets: 24/7 trading means liquidity can evaporate during off-peak hours, concentrated liquidity in a small number of venues creates dependency risk, and market-wide deleveraging events can cause correlated liquidity withdrawal across all assets. Mitigants include: diversified liquidity provider network (5+ institutional market makers), dynamic spread widening during low-liquidity periods, position limits calibrated to average daily volume, and emergency circuit breakers that halt trading if bid-ask spreads exceed 5%.', 'AUTO', 85.0, null],
            [id, 'reputational_risk',    'Digital assets carry inherent reputational risks due to historical association with fraud, money laundering, and speculative excess. Comprehensive ESG assessment completed addressing environmental concerns around proof-of-work energy consumption (BTC) and social concerns around market manipulation. Mitigation strategy: institutional-only focus with rigorous client qualification, proactive regulatory engagement and transparency, conservative launch approach with controlled client onboarding, strong AML/CFT framework with blockchain analytics, and active participation in industry standards bodies (MAS Project Guardian, HKMA sandbox).', 'AUTO', 84.0, null],
            [id, 'esg_assessment',       'Environmental: Bitcoin mining energy consumption concern addressed by offering carbon offset program for BTC trades. Ethereum transitioned to proof-of-stake (Sept 2022) with 99.95% energy reduction. Social: Enhanced customer protection through mandatory education, suitability assessments, and conservative position limits. Governance: Dedicated digital assets governance committee with quarterly reviews, independent risk oversight, and regulatory reporting transparency.', 'AUTO', 83.0, null],

            // ─── SEC_LEGAL: Legal Considerations ─────────────────────────────
            [id, 'legal_opinion',        'External legal opinion obtained from Allen & Gledhill (Singapore) and Linklaters (London) confirming the regulatory perimeter, licensing requirements, and cross-border operational framework. Key conclusions: (1) DBS Digital Assets Trading Pte Ltd requires MAS Digital Payment Token Service License (application filed), (2) HKMA consultation on virtual asset regulations confirmed institutional trading exemption pathway, (3) Cross-border data transfer arrangements compliant with PDPA and UK GDPR under Standard Contractual Clauses. Legal opinion reference: AG-DBS-DA-2026-001.', 'AUTO', 91.0, null],
            [id, 'isda_agreement',       'New Digital Asset Master Trading Agreement extending the ISDA framework with bespoke Digital Assets Annex. The annex covers: (1) Custody provisions including key management responsibilities and insurance requirements, (2) Fork event handling with election and notification procedures, (3) Airdrop treatment with default allocation to custodial entity, (4) Network congestion delays with grace period definitions, (5) Close-out netting provisions adapted for blockchain settlement finality, (6) Regulatory change provisions allowing termination or amendment upon material regulatory change.', 'AUTO', 89.0, null],
            [id, 'tax_impact',           'Digital asset tax treatment varies by jurisdiction and remains an evolving area. Comprehensive tax analysis completed with PwC as external advisor. Singapore: Digital tokens are not subject to GST as of January 2020 per IRAS guidance; trading gains taxed as income for entities. Hong Kong: Profits from digital asset trading taxable under profits tax for entities carrying on trade in HK. Cross-border transfer pricing: Arm\'s length principle applied to SG-HK intercompany transactions with benchmarking study completed. Withholding tax: No WHT applicable on digital asset transactions between SG and HK entities under existing DTA.', 'AUTO', 87.0, null],

            // ─── SEC_REG: Regulatory Requirements ────────────────────────────
            [id, 'primary_regulation',   'MAS Digital Payment Token Service License (Payment Services Act 2019) — Application filed January 2026 with targeted approval by June 2026. The DPT license is required for any entity operating a digital payment token exchange or providing custodial services in Singapore. DBS has maintained proactive engagement with MAS through Project Guardian participation and pre-submission consultations.', 'AUTO', 89.0, null],
            [id, 'secondary_regulations', 'HKMA consultation on virtual asset regulations with institutional trading framework expected Q3 2026. UK FCA authorization assessment for London-based counterparty servicing. Basel III/MAS Notice 637 interim guidance on crypto-asset prudential treatment (1,250% risk weight for Group 2 cryptoassets). FATF Travel Rule compliance for digital asset transfers exceeding $1,000 SGD equivalent.', 'AUTO', 86.0, null],
            [id, 'regulatory_reporting', 'Automated regulatory reporting covering: MAS Form 7 (digital asset positions and exposures), MAS suspicious transaction reports (STRs) for digital asset activity, HKMA regulatory returns adapted for virtual asset operations, daily transaction reporting to MAS Financial Supervision Department, and quarterly risk metrics reporting including VaR, stress test results, and capital adequacy for digital asset positions.', 'AUTO', 85.0, null],
            [id, 'sanctions_check',      'CLEAR — All entities, counterparties, and wallet addresses screened against OFAC SDN List, UN Security Council Consolidated List, EU Consolidated Financial Sanctions List, MAS Sanctions List, and HKMA designated list. Enhanced screening using Elliptic blockchain analytics for on-chain wallet address screening including: direct sanctions matches, indirect exposure through mixing services, darknet marketplace associations, and high-risk jurisdiction flagging.', 'AUTO', 94.0, null],

            // ─── SEC_DATA: Part C Section V — Data Management ────────────────
            [id, 'data_privacy',         'Comprehensive data governance framework established covering digital asset transaction data, client personal data, and blockchain analytics data. GDPR compliance required for EU/UK counterparties with Data Protection Impact Assessment (DPIA) completed. PDPA compliance for Singapore client data with consent management framework. Cross-border data transfer: Standard Contractual Clauses (SCCs) in place for SG-HK and SG-UK data flows. Blockchain data (public by nature) excluded from personal data scope per legal analysis, but wallet-to-client mapping treated as sensitive personal data with enhanced protection.', 'AUTO', 90.0, null],
            [id, 'data_retention',       'Digital asset transaction records: 7 years (MAS requirement). Blockchain transaction hashes and wallet addresses: Indefinite (immutable on-chain). Client KYC and suitability documentation: 7 years post-relationship. Trading platform logs: 5 years. Compliance monitoring data: 7 years. All data stored in encrypted form with key management through HSM infrastructure. Data destruction follows DBS Group data lifecycle policy with digital shredding for sensitive records.', 'AUTO', 88.0, null],
            [id, 'reporting_requirements', 'Real-time risk data aggregation capabilities across digital and traditional asset portfolios. Automated regulatory reporting for digital asset positions and transactions. Comprehensive management reporting dashboard covering: trading volume, revenue, risk metrics, compliance alerts, and operational KPIs. Stress testing data availability validated for all crypto-specific stress scenarios including flash crash, stablecoin depeg, and exchange contagion.', 'AUTO', 86.0, null],
            [id, 'pure_assessment_id',   'PURE-DIG-2026-001. Assessment completed confirming: Purposeful (clear business case for digital asset data usage with defined processing purposes), Unsurprising (transparent data collection and usage communicated through client agreements), Respectful (client privacy and data protection maintained with enhanced controls for blockchain-derived data), Explainable (clear documentation of all data processing activities with lineage tracking from source to reporting).', 'AUTO', 92.0, null],
            [id, 'gdpr_compliance',      'Yes — Required for UK/EU counterparty servicing. DPIA completed. DPO consulted. Lawful basis: Contractual necessity (Article 6(1)(b)) for trade execution, Legitimate interest (Article 6(1)(f)) for AML/compliance monitoring, Legal obligation (Article 6(1)(c)) for regulatory reporting. Records of Processing Activities (ROPA) updated to include digital asset data flows.', 'AUTO', 91.0, null],
            [id, 'data_ownership',       'Defined — Data ownership matrix established: Trading data owned by GFM Digital Assets desk, Client data owned by Client Management function, Compliance data co-owned by Compliance and Digital Assets teams, Market data licensed from CoinMetrics/Kaiko with defined usage rights. Data stewards appointed for each domain with quarterly data quality reviews.', 'AUTO', 89.0, null],

            // ─── SEC_ENTITY: Appendix 1 — Entity/Location Information ────────
            [id, 'booking_entity',       'DBS Digital Assets Trading Pte Ltd — Singapore-incorporated SPV under MAS Digital Payment Token Service License. The entity structure provides regulatory segregation from DBS Bank Ltd core banking operations while maintaining the DBS brand and institutional credibility.', 'AUTO', 99.0, null],
            [id, 'counterparty',         'Institutional clients with appropriate digital asset trading agreements across Singapore, Hong Kong, and selected international markets. Primary counterparty profile: regulated institutional investors, corporate treasuries, family offices, and professional trading firms.', 'MANUAL', 100.0, null],
            [id, 'counterparty_rating',  'A-', 'ADAPTED', 88.0, '{"adaptation_logic": "Minimum counterparty rating for platform access. Clients below A- rating require enhanced due diligence and reduced position limits."}'],
            [id, 'ip_considerations',    'DBS IP created: Proprietary trading algorithms and risk management systems for digital assets, custom digital asset trading platform interface, enhanced security protocols and custody procedures. Third-party IP used: Fireblocks custody technology (licensed), Elliptic compliance and monitoring tools (licensed), CoinMetrics market data (licensed), various blockchain and cryptocurrency technologies (open source under MIT/Apache licenses). All necessary IP licenses obtained with territory and use case restrictions documented and managed. Comprehensive IP clearance completed by DBS Legal IP team.', 'AUTO', 90.0, null],

            // ─── SEC_BCP: Business Continuity ────────────────────────────────
            [id, 'rto_hours',            '4', 'AUTO', 95.0, null],
            [id, 'rpo_minutes',          '15', 'AUTO', 95.0, null],
            [id, 'bia_completed',        'Yes — New Business Impact Analysis completed covering digital asset operations with 24/7 availability requirements. Key findings: (1) Trading platform classified as Critical (must be available 99.9% during market hours), (2) Custody operations classified as Critical (private key availability required for client withdrawals), (3) Risk monitoring classified as Essential (automated monitoring can degrade gracefully). Updated BCP incorporates 24/7 operational requirements with shift-based staffing, alternative trading mechanisms during planned maintenance, and crisis communication procedures for digital asset-specific incidents (exchange outage, blockchain fork, cyber attack).', 'AUTO', 93.0, null],
            [id, 'dr_test_frequency',    'Quarterly DR testing with annual full-scope failover exercise. DR architecture: Multi-region deployment (Singapore primary, Hong Kong secondary) with active-active configuration. Comprehensive disaster recovery testing includes: application failover (quarterly), data recovery validation (quarterly), custody key recovery ceremony (semi-annual), and full business continuity exercise (annual). Cloud-native architecture on AWS with automatic failover capabilities and cross-region data replication with RPO of 15 minutes.', 'AUTO', 91.0, null],

            // ─── SEC_FINCRIME: Appendix 3 — Financial Crime Risk Areas ───────
            [id, 'aml_assessment',       'Enhanced AML framework for digital asset trading incorporating both traditional banking AML controls and blockchain-specific measures. Enhanced ID&V requirements including source of funds verification for cryptocurrency holdings and wallet address provenance analysis. Blockchain analytics through Elliptic provides real-time transaction screening against known illicit addresses, mixing services, darknet marketplaces, and high-risk exchanges. Ongoing transaction monitoring rules calibrated for digital asset patterns including structuring detection, rapid movement across chains, and privacy coin conversion attempts.', 'AUTO', 90.0, null],
            [id, 'terrorism_financing',  'Digital asset terrorism financing risk assessed as Medium-High given the pseudonymous nature of blockchain transactions and potential for cross-border value transfer outside traditional banking channels. Enhanced controls include: real-time wallet screening against OFAC, UN, and regional sanctions/terrorism designations; Elliptic risk scoring for counterparty wallets with automatic blocking of high-risk scores; transaction pattern analysis for known TF typologies; and mandatory SAR filing for any transaction involving sanctioned jurisdictions or flagged wallet clusters.', 'AUTO', 88.0, null],
            [id, 'sanctions_assessment', 'Multi-layered sanctions screening: (1) Client-level screening at onboarding and ongoing (daily batch + real-time trigger), (2) Wallet address screening against Elliptic sanctions database for every deposit/withdrawal, (3) Transaction-level screening for cross-chain transfers, (4) Counterparty exchange screening for withdrawal destinations. Sanctions framework covers OFAC, UN, EU, MAS, and HKMA designated lists with automated blocking and escalation procedures.', 'AUTO', 92.0, null],
            [id, 'fraud_risk',           'Digital asset fraud risk assessment covers: (1) Account takeover — mitigated by multi-factor authentication, hardware security keys, and withdrawal whitelisting with 24hr cooling period, (2) Market manipulation — mitigated by trade surveillance algorithms calibrated for crypto market patterns, wash trading detection, and spoofing/layering detection, (3) Social engineering — mitigated by mandatory callback verification for withdrawal requests exceeding $100K, (4) Internal fraud — mitigated by M-of-N signing requirements for all custodial operations and mandatory dual control for system administration.', 'AUTO', 87.0, null],
            [id, 'bribery_corruption',   'Standard DBS ABC framework applied with enhanced due diligence for digital asset ecosystem participants. Enhanced screening for Politically Exposed Persons (PEPs) seeking digital asset trading access. Gift and entertainment policy extended to cover digital asset-related events and conferences. Third-party intermediary review for any referral arrangements involving digital asset clients.', 'AUTO', 85.0, null],

            // ─── SEC_RISKDATA: Appendix 4 — Risk Data Aggregation ────────────
            // (Covered through data_privacy, reporting_requirements, and risk fields above)

            // ─── SEC_TRADING: Appendix 5 — Trading Products Additional Info ──
            [id, 'collateral_types',     'Digital assets held in secure multi-tier custody: Hot wallets (< 5% of AUM) for immediate trading liquidity, Warm wallets (15-20% of AUM) for intraday settlement needs, Cold storage (75-80% of AUM) for long-term custody with HSM-secured offline key material. Fiat collateral held in segregated DBS Bank accounts. Insurance coverage: $30M through Fireblocks custody insurance, supplemented by DBS group operational risk insurance.', 'AUTO', 89.0, null],
            [id, 'valuation_method',     'Real-time market pricing with multiple source validation. Primary: CoinMetrics institutional data feed with volume-weighted pricing across major exchanges. Secondary: Kaiko aggregated order book data. Tertiary: CryptoCompare reference rates. Pricing methodology: Volume-Weighted Average Price (VWAP) calculated across top 5 exchanges by volume, with outlier detection (>3 standard deviations) and circuit breaker mechanisms. End-of-day official NAV calculated at 16:00 SGT for reporting purposes.', 'AUTO', 90.0, null],
            [id, 'funding_source',       'Segregated digital asset funding with fiat settlement capabilities. Client funds held in segregated accounts (digital and fiat) with no commingling with DBS proprietary funds. Fiat on-ramp through DBS core banking (SGD, HKD, USD, EUR). Digital asset on-ramp through verified wallet transfers with blockchain analytics screening.', 'AUTO', 88.0, null],
            [id, 'hedging_purpose',      'Client facilitation and market making. DBS acts as principal counterparty with hedging through institutional liquidity providers (Cumberland, B2C2, Jump Crypto, Galaxy Digital, Wintermute). Hedging strategy: delta-neutral market making with inventory management limits and automated rebalancing. Proprietary position limits: $10M per asset, $25M aggregate across all digital assets.', 'AUTO', 87.0, null],
            [id, 'booking_schema',       'Segregated digital asset booking with full trade lifecycle from execution to settlement to custody. Booking architecture: Independent ledger for digital asset positions within GFM systems, real-time position synchronization with custody platform, automated reconciliation between trading system and blockchain state. Cross-product integration: FX hedging positions linked to digital asset inventory, margin calculations incorporating cross-asset netting where applicable.', 'AUTO', 86.0, null]
        ];
        for (const row of formRows) {
            await conn.query(
                `INSERT INTO npa_form_data (project_id, field_key, field_value, lineage, confidence_score, metadata) VALUES (?, ?, ?, ?, ?, ?)`,
                row
            );
        }

        // ── 3. npa_jurisdictions — Cross-border ─────────────────────────
        await conn.query(`INSERT INTO npa_jurisdictions (project_id, jurisdiction_code) VALUES (?, 'SG'), (?, 'HK'), (?, 'LN')`, [id, id, id]);

        // ── 4. npa_documents — 12 docs at mixed statuses (Digital Currency Platform) ──
        await conn.query(`
            INSERT INTO npa_documents (project_id, document_name, document_type, file_size, file_extension, category, validation_status, uploaded_by, uploaded_at) VALUES
            (?, 'TSG2026_Digital_Currency_Platform_Term_Sheet_v2.pdf',     'TERM_SHEET',     '4.2 MB',  'pdf',  'Product Specs',   'VALID',   'Sarah Chen',   '${now}'),
            (?, 'Digital_Asset_Risk_Framework_Assessment.pdf',              'RISK_MEMO',      '3.1 MB',  'pdf',  'Risk Analysis',   'VALID',   'Jane Tan',     '${now}'),
            (?, 'DBS_CRYPTO_PRC_2026_Pricing_Model_v1.xlsx',              'RISK_MEMO',      '1.8 MB',  'xlsx', 'Pricing Model',   'VALID',   'Mark Lee',     '${now}'),
            (?, 'MAS_DPT_License_Application_Filing.pdf',                  'LEGAL_OPINION',  '5.6 MB',  'pdf',  'Regulatory',      'PENDING', 'Lisa Wong',    '${now}'),
            (?, 'ISDA_Digital_Assets_Annex_Master_Agreement.pdf',          'ISDA',           '3.4 MB',  'pdf',  'Legal',           'PENDING', 'David Chen',   '${now}'),
            (?, 'Cross_Border_Tax_Assessment_SG_HK_UK.pdf',               'RISK_MEMO',      '1.5 MB',  'pdf',  'Finance',         'WARNING', 'Mark Lee',     '${now}'),
            (?, 'Fireblocks_Custody_Integration_Security_Audit.pdf',      'RISK_MEMO',      '2.3 MB',  'pdf',  'Technology',      'VALID',   'Rachel Ng',    '${now}'),
            (?, 'Elliptic_AML_Compliance_Integration_Report.pdf',          'RISK_MEMO',      '1.1 MB',  'pdf',  'Compliance',      'VALID',   'Ahmad Razak',  '${now}'),
            (?, 'Digital_Asset_Client_Suitability_Framework.pdf',          'RISK_MEMO',      '890 KB',  'pdf',  'Risk Analysis',   'VALID',   'Sarah Chen',   '${now}'),
            (?, 'VaR_Stress_Testing_Digital_Assets_Report.pdf',            'RISK_MEMO',      '1.6 MB',  'pdf',  'Risk Analysis',   'VALID',   'Jane Tan',     '${now}'),
            (?, 'BCP_DR_Assessment_24x7_Operations.pdf',                   'TERM_SHEET',     '780 KB',  'pdf',  'Operational',     'PENDING', 'Rachel Ng',    '${now}'),
            (?, 'PRIIPs_KID_Digital_Asset_Trading.pdf',                    'TERM_SHEET',     '420 KB',  'pdf',  'Regulatory',      'PENDING', 'Lisa Wong',    '${now}')
        `, [id, id, id, id, id, id, id, id, id, id, id, id]);

        // ── 5. npa_signoffs — Matches Part B sign-off parties from NPA template ─────
        const slaBase = new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString().slice(0, 19).replace('T', ' ');
        await conn.query(`
            INSERT INTO npa_signoffs (project_id, party, department, status, approver_user_id, approver_name, approver_email, decision_date, sla_deadline, sla_breached, comments, loop_back_count) VALUES
            (?, 'Market & Liquidity Risk', 'Risk Management',        'APPROVED',      'jane.tan',    'Jane Tan',     'jane.tan@dbs.com',      '${now}', '${slaBase}', 0, 'Digital asset market risk framework approved. VaR model calibration for crypto-specific fat-tailed distributions validated. Position limits set at $10M per asset, $25M aggregate. Stress testing scenarios including 50% flash crash and stablecoin depeg reviewed and accepted.', 0),
            (?, 'Credit Risk',             'Risk Management',        'APPROVED',      'mike.ross',   'Mike Ross',    'mike.ross@dbs.com',     '${now}', '${slaBase}', 0, 'Pre-funded model eliminates traditional counterparty credit exposure. Custody counterparty risk (Fireblocks) assessed with $30M insurance coverage deemed adequate. Residual settlement risk limited to intraday FX window.', 0),
            (?, 'Technology Architecture', 'Technology & Operations', 'APPROVED',      'rachel.ng',   'Rachel Ng',    'rachel.ng@dbs.com',     '${now}', '${slaBase}', 0, 'Cloud-native architecture on AWS validated. Fireblocks custody integration security audit passed. HSM deployment confirmed. Penetration testing by CrowdStrike completed with all critical findings remediated. RTO 4hrs / RPO 15min achievable with multi-region active-active deployment.', 0),
            (?, 'Operations',              'Technology & Operations', 'UNDER_REVIEW',  'peter.loh',   'Peter Loh',    'peter.loh@dbs.com',     NULL,     '${slaBase}', 0, 'Reviewing 24/7 operational staffing model and shift coverage. Settlement reconciliation procedures under validation. Blockchain monitoring runbook in draft.', 0),
            (?, 'Legal',                   'Legal, Compliance & Secretariat', 'PENDING', NULL,        NULL,           NULL,                    NULL,     '${slaBase}', 0, 'Awaiting ISDA Digital Assets Annex finalization and MAS DPT license application review completion.', 0),
            (?, 'Compliance',              'Legal, Compliance & Secretariat', 'UNDER_REVIEW', 'ahmad.razak', 'Ahmad Razak', 'ahmad.razak@dbs.com', NULL, '${slaBase}', 0, 'AML/CFT framework for digital assets under review. Elliptic blockchain analytics integration validated. Travel Rule compliance implementation in progress.', 0),
            (?, 'Finance',                 'Finance',                'UNDER_REVIEW',  'mark.lee',    'Mark Lee',     'mark.lee@dbs.com',      NULL,     '${slaBase}', 0, 'ROAE analysis indicates 22.5% by Year 3 above 12% hurdle. Reviewing capital treatment under MAS Notice 637 interim guidance (1,250% risk weight). Cross-border transfer pricing methodology under validation with Group Tax.', 1),
            (?, 'Cybersecurity',           'Information Security',   'APPROVED',      'david.chen',  'David Chen',   'david.chen@dbs.com',    '${now}', '${slaBase}', 0, 'Comprehensive security assessment completed. HSM key management architecture validated. Multi-signature wallet protocol approved. Penetration testing passed. SOC monitoring coverage for 24/7 crypto operations confirmed.', 0)
        `, [id, id, id, id, id, id, id, id]);

        // ── 6. npa_workflow_states — 5 stages ───────────────────────────
        await conn.query(`
            INSERT INTO npa_workflow_states (project_id, stage_id, status, started_at, completed_at, blockers) VALUES
            (?, 'INITIATION',  'COMPLETED',    '2026-01-15 09:00:00', '2026-01-18 17:00:00', NULL),
            (?, 'REVIEW',      'COMPLETED',    '2026-01-19 09:00:00', '2026-02-01 17:00:00', NULL),
            (?, 'SIGN_OFF',    'IN_PROGRESS',  '2026-02-02 09:00:00', NULL,                  '${JSON.stringify(["Legal pending — ISDA Digital Assets Annex finalization and MAS DPT license review", "Compliance — AML/CFT framework for digital assets under review", "Finance — ROAE recalculation required under 1,250% RW interim guidance", "Operations — 24/7 staffing model and blockchain reconciliation procedures under validation"])}'),
            (?, 'LAUNCH',      'NOT_STARTED',  NULL,                  NULL,                  NULL),
            (?, 'MONITORING',  'NOT_STARTED',  NULL,                  NULL,                  NULL)
        `, [id, id, id, id, id]);

        // ── 7. npa_classification_scorecards — Digital Currency Platform ──
        await conn.query(`
            INSERT INTO npa_classification_scorecards (project_id, total_score, calculated_tier, breakdown, created_at) VALUES
            (?, 28, 'New-to-Group', ?, NOW())
        `, [id, JSON.stringify({
            criteria: [
                { criterion: 'Product Innovation', score: 5, maxScore: 5, reasoning: 'Digital currency trading is an entirely new asset class for DBS with no internal precedent. Requires purpose-built technology, custody, and operational frameworks.' },
                { criterion: 'Market Expansion', score: 4, maxScore: 5, reasoning: 'Targets new institutional digital asset market segment across 3 jurisdictions (SG, HK, London). Opens a $2.3B addressable market opportunity.' },
                { criterion: 'Risk Complexity', score: 5, maxScore: 5, reasoning: 'Novel risk profile: extreme price volatility (5-15% daily), 24/7 operational risk, custody/key management risk, blockchain-specific risks (forks, network congestion, smart contract), and multi-jurisdictional regulatory uncertainty.' },
                { criterion: 'Regulatory Impact', score: 4, maxScore: 5, reasoning: 'MAS DPT License required (new licensing regime). HKMA virtual asset consultation pending. Basel III interim crypto-asset guidance with 1,250% risk weight. FATF Travel Rule compliance for digital assets.' },
                { criterion: 'Technology Change', score: 4, maxScore: 5, reasoning: 'Entirely new technology stack: cloud-native trading platform, Fireblocks custody integration, HSM key management, Elliptic blockchain analytics, and 24/7 monitoring infrastructure.' },
                { criterion: 'Operational Complexity', score: 4, maxScore: 5, reasoning: '24/7 operations with no natural market close, blockchain settlement with fork/congestion handling, multi-tier custody management (hot/warm/cold), and cross-border data flows under PDPA/GDPR.' },
                { criterion: 'Financial Impact', score: 2, maxScore: 5, reasoning: '$8.5M technology investment with $500M Y1 transaction volume target. ROAE 22.5% by Y3 above 12% hurdle rate but requires 1,250% RWA capital charge under interim guidance.' }
            ],
            overall_confidence: 89,
            prohibited_match: { matched: false },
            mandatory_signoffs: ['Market & Liquidity Risk', 'Credit Risk', 'Technology Architecture', 'Operations', 'Legal', 'Compliance', 'Finance', 'Cybersecurity']
        })]);

        // ── 8. npa_intake_assessments — 7 domains (Digital Currency Platform) ──
        await conn.query(`
            INSERT INTO npa_intake_assessments (project_id, domain, status, score, findings, assessed_at) VALUES
            (?, 'STRATEGIC', 'PASS', 92, '{"observation": "Strong strategic alignment with DBS digital transformation roadmap and GFM growth strategy. $2.3B addressable institutional digital asset market with 340% YoY growth. 47% of existing institutional clients have expressed interest in regulated digital asset trading. First-mover advantage among APAC regulated banks."}', NOW()),
            (?, 'RISK',      'WARN', 58, '{"observation": "Novel risk profile with no internal precedent. Extreme price volatility (5-15% daily), 24/7 operational risk, custody key management risk, blockchain-specific risks (forks, network congestion, smart contract vulnerabilities). Crypto-specific VaR model requires ongoing calibration. 1,250% risk weight under Basel III interim guidance significantly impacts capital efficiency."}', NOW()),
            (?, 'LEGAL',     'WARN', 52, '{"observation": "Multi-jurisdictional regulatory complexity. MAS DPT License application filed but not yet approved. HKMA virtual asset framework still in consultation. ISDA Digital Assets Annex is bespoke and untested in close-out scenarios. Cross-border legal opinion for UK jurisdiction pending from Linklaters. FATF Travel Rule implementation requires industry coordination."}', NOW()),
            (?, 'FINANCE',   'PASS', 75, '{"observation": "ROAE of 22.5% by Year 3 exceeds 12% hurdle rate. However, 1,250% RWA risk weight under MAS Notice 637 interim guidance significantly impacts capital efficiency. Transfer pricing for SG-HK-UK intercompany transactions under validation. Digital asset tax treatment varies by jurisdiction with evolving regulatory guidance."}', NOW()),
            (?, 'OPS',       'WARN', 60, '{"observation": "24/7 operational requirement is unprecedented for DBS trading operations. Shift-based staffing model needs validation. Blockchain settlement reconciliation procedures not yet operational. Fork event and airdrop handling playbooks in draft. Multi-tier custody management (hot/warm/cold wallet) introduces new operational workflows with no existing runbook precedent."}', NOW()),
            (?, 'TECH',      'PASS', 82, '{"observation": "Cloud-native architecture on AWS validated with multi-region active-active deployment. Fireblocks custody integration security audit passed. HSM deployment confirmed in SG and HK. CrowdStrike penetration testing completed with all critical findings remediated. RTO 4hrs / RPO 15min achievable. Elliptic blockchain analytics integration tested successfully."}', NOW()),
            (?, 'DATA',      'PASS', 88, '{"observation": "Comprehensive data governance framework established. PDPA and UK GDPR compliance confirmed with Standard Contractual Clauses for cross-border data transfers. PURE assessment completed (PURE-DIG-2026-001). Blockchain public data vs personal data boundary clearly defined in legal analysis. Data ownership matrix established across all data domains."}', NOW())
        `, [id, id, id, id, id, id, id]);

        // ── 9. npa_breach_alerts — 3 alerts (Digital Currency Platform) ──
        const brId1 = 'BR-DEMO-' + String(Date.now()).slice(-3) + 'a';
        const brId2 = 'BR-DEMO-' + String(Date.now()).slice(-3) + 'b';
        const brId3 = 'BR-DEMO-' + String(Date.now()).slice(-3) + 'c';
        await conn.query(`
            INSERT INTO npa_breach_alerts (id, project_id, title, severity, description, threshold_value, actual_value, escalated_to, sla_hours, status, triggered_at) VALUES
            (?, ?, 'MAS DPT License Approval Timeline Risk', 'CRITICAL', 'MAS Digital Payment Token Service License application filed January 2026 with 6-month target. Current review stage indicates potential delays due to additional information requests on custody framework. Platform launch date at risk if license not granted by July 2026.', 'License by June 2026', 'Review pending — MAS additional queries received', 'Head of Compliance + Group COO', 4, 'ACKNOWLEDGED', NOW()),
            (?, ?, 'Regulatory Capital Impact — 1,250% Risk Weight', 'WARNING', 'Basel III interim guidance applies 1,250% risk weight to Group 2 crypto-assets. At $500M Y1 transaction volume, capital consumption significantly exceeds initial planning assumptions. Finance team reviewing capital optimization strategies and Group 1 crypto-asset qualification pathway.', '$12M capital allocation', '$18.5M projected under 1,250% RW', 'Finance + CRO Office', 24, 'OPEN', NOW()),
            (?, ?, 'ISDA Digital Assets Annex — Legal Precedent Gap', 'WARNING', 'Bespoke ISDA Digital Assets Annex has no market precedent for close-out netting enforcement in digital asset default scenarios. Legal opinion from Linklaters pending on cross-border enforceability under Singapore and English law.', 'Annex finalized by March 2026', 'Draft v3 under Legal review', 'Legal & Compliance', 48, 'OPEN', NOW())
        `, [brId1, id, brId2, id, brId3, id]);

        // ── 10. npa_performance_metrics — 1 snapshot (pre-launch) ────────
        await conn.query(`
            INSERT INTO npa_performance_metrics (project_id, days_since_launch, total_volume, volume_currency, realized_pnl, active_breaches, counterparty_exposure, var_utilization, collateral_posted, next_review_date, health_status, snapshot_date) VALUES
            (?, 0, 0.00, 'USD', 0.00, 3, 0.00, 0.00, 0.00, '2026-08-15', 'warning', NOW())
        `, [id]);

        // ── 11. npa_post_launch_conditions — 5 conditions (from template PAC) ──
        await conn.query(`
            INSERT INTO npa_post_launch_conditions (project_id, condition_text, owner_party, due_date, status) VALUES
            (?, 'Monthly digital asset position and risk exposure report to Risk Committee covering VaR utilization, stress test results, custody holdings distribution, and client concentration metrics', 'Market & Liquidity Risk', DATE_ADD(NOW(), INTERVAL 1 MONTH), 'PENDING'),
            (?, 'Quarterly regulatory compliance review covering MAS DPT license conditions, AML/CFT effectiveness metrics, blockchain analytics alert disposition rates, and Travel Rule compliance statistics', 'Compliance', DATE_ADD(NOW(), INTERVAL 3 MONTH), 'PENDING'),
            (?, 'Semi-annual product performance review (PIR) with Digital Assets desk head covering revenue vs projections, client onboarding pipeline, technology stability metrics, and competitive landscape assessment', 'Product Manager', DATE_ADD(NOW(), INTERVAL 6 MONTH), 'PENDING'),
            (?, 'Quarterly security assessment including penetration testing of trading platform, custody infrastructure audit, and SOC monitoring effectiveness review', 'Cybersecurity', DATE_ADD(NOW(), INTERVAL 3 MONTH), 'PENDING'),
            (?, 'Annual comprehensive BCP/DR failover exercise covering full-scope trading platform recovery, custody key ceremony, and cross-region data replication validation', 'Operations', DATE_ADD(NOW(), INTERVAL 12 MONTH), 'PENDING')
        `, [id, id, id, id, id]);

        // ── 12. npa_loop_backs — 1 record ───────────────────────────────
        await conn.query(`
            INSERT INTO npa_loop_backs (project_id, loop_back_number, loop_back_type, initiated_by_party, initiator_name, reason, requires_npa_changes, routed_to, routing_reasoning, initiated_at, delay_days) VALUES
            (?, 1, 'APPROVAL_CLARIFICATION', 'Finance', 'Mark Lee', 'Require updated ROAE sensitivity analysis reflecting the 1,250% risk weight under MAS Notice 637 interim guidance for crypto-assets. Current ROAE projection of 22.5% needs recalculation under conservative capital scenario. Also requesting clarification on Group 1 crypto-asset qualification pathway that could reduce capital charge.', 1, 'Product Manager', 'Capital treatment under interim Basel III guidance materially impacts ROAE. Finance cannot sign off until capital optimization strategy is documented and sensitivity analysis updated.', NOW(), 3)
        `, [id]);

        await conn.commit();
        console.log('[NPA SEED-DEMO] Success:', id, '— 12 tables populated');
        res.json({ id, status: 'SEEDED', message: 'Demo NPA created with full data across all tables' });
    } catch (err) {
        await conn.rollback();
        console.error('[NPA SEED-DEMO] Error:', err.message);
        res.status(500).json({ error: err.message });
    } finally {
        conn.release();
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
