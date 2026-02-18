const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../db');

// ─── Chat Session CRUD ─────────────────────────────────────────────────────

// GET /api/agents/sessions — Get recent chat sessions (optionally filtered by project/user)
router.get('/sessions', async (req, res) => {
    try {
        const { project_id, user_id } = req.query;
        let sql = `SELECT id, project_id, user_id, title, preview, started_at, updated_at,
                          agent_identity, domain_agent_json, current_stage, handoff_from, ended_at,
                          (SELECT COUNT(*) FROM agent_messages m WHERE m.session_id = s.id) as message_count
                   FROM agent_sessions s`;
        const conditions = [];
        const params = [];

        if (project_id) {
            conditions.push('project_id = ?');
            params.push(project_id);
        }
        if (user_id) {
            conditions.push('user_id = ?');
            params.push(user_id);
        }

        if (conditions.length > 0) {
            sql += ' WHERE ' + conditions.join(' AND ');
        }

        sql += ' ORDER BY updated_at DESC LIMIT 50';

        const [rows] = await db.query(sql, params);
        // Parse domain_agent_json from string to object
        const sessions = rows.map(r => ({
            ...r,
            domain_agent_json: r.domain_agent_json ? (typeof r.domain_agent_json === 'string' ? JSON.parse(r.domain_agent_json) : r.domain_agent_json) : null
        }));
        res.json(sessions);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/agents/sessions/:id — Get a single session with its messages
router.get('/sessions/:id', async (req, res) => {
    try {
        const [sessionRows] = await db.query(
            `SELECT id, project_id, user_id, title, preview, started_at, updated_at,
                    agent_identity, domain_agent_json, current_stage, handoff_from, ended_at
             FROM agent_sessions WHERE id = ?`,
            [req.params.id]
        );
        if (sessionRows.length === 0) {
            return res.status(404).json({ error: 'Session not found' });
        }
        const session = sessionRows[0];
        session.domain_agent_json = session.domain_agent_json
            ? (typeof session.domain_agent_json === 'string' ? JSON.parse(session.domain_agent_json) : session.domain_agent_json)
            : null;

        const [messages] = await db.query(
            'SELECT * FROM agent_messages WHERE session_id = ? ORDER BY timestamp',
            [req.params.id]
        );
        // Parse metadata/citations JSON
        session.messages = messages.map(m => ({
            ...m,
            metadata: m.metadata ? (typeof m.metadata === 'string' ? JSON.parse(m.metadata) : m.metadata) : null,
            citations: m.citations ? (typeof m.citations === 'string' ? JSON.parse(m.citations) : m.citations) : null
        }));
        session.message_count = messages.length;

        res.json(session);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/agents/sessions — Create a new chat session
router.post('/sessions', async (req, res) => {
    try {
        const { id: clientId, title, preview, agent_identity, domain_agent_json, user_id, project_id } = req.body;
        // Use client-provided ID if available, otherwise generate one
        const id = clientId || `cs_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

        await db.query(
            `INSERT INTO agent_sessions (id, title, preview, agent_identity, domain_agent_json, user_id, project_id)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [id, title || 'New Chat', preview || null, agent_identity || null,
             domain_agent_json ? JSON.stringify(domain_agent_json) : null,
             user_id || 'default_user', project_id || null]
        );

        const [rows] = await db.query('SELECT * FROM agent_sessions WHERE id = ?', [id]);
        const session = rows[0];
        session.domain_agent_json = session.domain_agent_json
            ? (typeof session.domain_agent_json === 'string' ? JSON.parse(session.domain_agent_json) : session.domain_agent_json)
            : null;
        session.message_count = 0;
        session.messages = [];

        res.status(201).json(session);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/agents/sessions/:id — Update session metadata (title, agent, stage, etc.)
router.put('/sessions/:id', async (req, res) => {
    try {
        const { title, preview, agent_identity, domain_agent_json, current_stage, ended_at } = req.body;
        const updates = [];
        const params = [];

        if (title !== undefined) { updates.push('title = ?'); params.push(title); }
        if (preview !== undefined) { updates.push('preview = ?'); params.push(preview); }
        if (agent_identity !== undefined) { updates.push('agent_identity = ?'); params.push(agent_identity); }
        if (domain_agent_json !== undefined) {
            updates.push('domain_agent_json = ?');
            params.push(domain_agent_json ? JSON.stringify(domain_agent_json) : null);
        }
        if (current_stage !== undefined) { updates.push('current_stage = ?'); params.push(current_stage); }
        if (ended_at !== undefined) { updates.push('ended_at = ?'); params.push(ended_at); }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        // updated_at is auto-updated by ON UPDATE CURRENT_TIMESTAMP
        params.push(req.params.id);
        await db.query(`UPDATE agent_sessions SET ${updates.join(', ')} WHERE id = ?`, params);

        const [rows] = await db.query('SELECT * FROM agent_sessions WHERE id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Session not found' });

        const session = rows[0];
        session.domain_agent_json = session.domain_agent_json
            ? (typeof session.domain_agent_json === 'string' ? JSON.parse(session.domain_agent_json) : session.domain_agent_json)
            : null;
        res.json(session);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/agents/sessions/:id — Delete a session (CASCADE deletes messages)
router.delete('/sessions/:id', async (req, res) => {
    try {
        const [result] = await db.query('DELETE FROM agent_sessions WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Session not found' });
        }
        res.json({ success: true, deleted: req.params.id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/agents/sessions — Delete ALL sessions (clear history)
router.delete('/sessions', async (req, res) => {
    try {
        const { user_id } = req.query;
        let sql = 'DELETE FROM agent_sessions';
        const params = [];
        if (user_id) {
            sql += ' WHERE user_id = ?';
            params.push(user_id);
        }
        const [result] = await db.query(sql, params);
        res.json({ success: true, deleted: result.affectedRows });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/agents/sessions/:id/messages — Get messages for a specific session
router.get('/sessions/:id/messages', async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT * FROM agent_messages WHERE session_id = ? ORDER BY timestamp',
            [req.params.id]
        );
        const messages = rows.map(m => ({
            ...m,
            metadata: m.metadata ? (typeof m.metadata === 'string' ? JSON.parse(m.metadata) : m.metadata) : null,
            citations: m.citations ? (typeof m.citations === 'string' ? JSON.parse(m.citations) : m.citations) : null
        }));
        res.json(messages);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/agents/sessions/:id/messages — Add a message to a session
router.post('/sessions/:id/messages', async (req, res) => {
    try {
        const { role, content, agent_identity_id, metadata } = req.body;

        if (!role || !content) {
            return res.status(400).json({ error: 'role and content are required' });
        }

        const [result] = await db.query(
            `INSERT INTO agent_messages (session_id, role, content, agent_identity_id, metadata)
             VALUES (?, ?, ?, ?, ?)`,
            [req.params.id, role, content, agent_identity_id || null,
             metadata ? JSON.stringify(metadata) : null]
        );

        // Also touch the session's updated_at and update preview if it's the first user message
        if (role === 'user') {
            await db.query(
                `UPDATE agent_sessions
                 SET updated_at = CURRENT_TIMESTAMP,
                     preview = COALESCE(preview, SUBSTRING(?, 1, 255))
                 WHERE id = ?`,
                [content, req.params.id]
            );
        } else {
            await db.query(
                'UPDATE agent_sessions SET updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [req.params.id]
            );
        }

        const [rows] = await db.query('SELECT * FROM agent_messages WHERE id = ?', [result.insertId]);
        res.status(201).json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/agents/sessions/:id/messages/batch — Add multiple messages at once (for session save)
router.post('/sessions/:id/messages/batch', async (req, res) => {
    try {
        const { messages } = req.body;
        if (!Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({ error: 'messages array is required' });
        }

        // Delete existing messages for this session (full replace)
        await db.query('DELETE FROM agent_messages WHERE session_id = ?', [req.params.id]);

        // Insert all messages
        const values = messages.map(m => [
            req.params.id,
            m.role,
            m.content,
            m.agent_identity_id || null,
            m.metadata ? JSON.stringify(m.metadata) : null
        ]);

        if (values.length > 0) {
            const placeholders = values.map(() => '(?, ?, ?, ?, ?)').join(', ');
            const flatValues = values.flat();
            await db.query(
                `INSERT INTO agent_messages (session_id, role, content, agent_identity_id, metadata)
                 VALUES ${placeholders}`,
                flatValues
            );
        }

        // Update session's updated_at
        await db.query(
            'UPDATE agent_sessions SET updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [req.params.id]
        );

        res.json({ success: true, count: values.length });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/agents/npas/:id/routing — Get agent routing decisions for an NPA
router.get('/npas/:id/routing', async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT * FROM npa_agent_routing_decisions WHERE project_id = ? ORDER BY decided_at DESC',
            [req.params.id]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/agents/npas/:id/escalations — Get escalations for an NPA
router.get('/npas/:id/escalations', async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT * FROM npa_escalations WHERE project_id = ? ORDER BY escalated_at DESC',
            [req.params.id]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/agents/npas/:id/external-parties — Get external parties for an NPA
router.get('/npas/:id/external-parties', async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT * FROM npa_external_parties WHERE project_id = ? ORDER BY party_name',
            [req.params.id]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/agents/npas/:id/market-risk-factors — Get market risk factors for an NPA
router.get('/npas/:id/market-risk-factors', async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT * FROM npa_market_risk_factors WHERE project_id = ? ORDER BY risk_factor',
            [req.params.id]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/agents/npas/:id/monitoring-thresholds — Get monitoring thresholds
router.get('/npas/:id/monitoring-thresholds', async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT * FROM npa_monitoring_thresholds WHERE project_id = ? ORDER BY metric_name',
            [req.params.id]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/agents/npas/:id/post-launch-conditions — Get post-launch conditions
router.get('/npas/:id/post-launch-conditions', async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT * FROM npa_post_launch_conditions WHERE project_id = ? ORDER BY due_date',
            [req.params.id]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/agents/npas/:id/documents/requirements — Get document requirements and uploaded documents
router.get('/npas/:id/documents/requirements', async (req, res) => {
    try {
        const [requirements] = await db.query(`
            SELECT * FROM ref_document_requirements
            ORDER BY required_by_stage, order_index
        `);
        const [documents] = await db.query(`
            SELECT * FROM npa_documents
            WHERE project_id = ?
            ORDER BY uploaded_at DESC
        `, [req.params.id]);
        res.json({ requirements, documents });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/agents/notifications — Get aggregated notifications (breaches + SLA warnings + escalations)
router.get('/notifications', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT 'BREACH' as type, id, project_id, title, severity, triggered_at as created_at, status
            FROM npa_breach_alerts WHERE status != 'RESOLVED'
            UNION ALL
            SELECT 'SLA_WARNING' as type, id, project_id, CONCAT(party, ' SLA Breach') as title, 'WARNING' as severity, created_at, 'OPEN' as status
            FROM npa_signoffs WHERE sla_breached = TRUE AND status NOT IN ('APPROVED','REJECTED')
            UNION ALL
            SELECT 'ESCALATION' as type, id, project_id, trigger_detail as title, escalation_level as severity, escalated_at as created_at, status
            FROM npa_escalations WHERE status != 'RESOLVED'
            ORDER BY created_at DESC
            LIMIT 50
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============================================================
// SPRINT 2: Agent Result Persistence Endpoints (Obs 1)
// Each agent type saves its outputs to the appropriate DB tables
// so results survive page navigation/refresh.
// ============================================================

// POST /api/agents/npas/:id/persist/classifier — Save CLASSIFIER results
router.post('/npas/:id/persist/classifier', async (req, res) => {
    const { total_score, calculated_tier, breakdown, override_reason, approval_track } = req.body;
    try {
        // Upsert classification scorecard
        await db.query('DELETE FROM npa_classification_scorecards WHERE project_id = ?', [req.params.id]);
        const [result] = await db.query(
            `INSERT INTO npa_classification_scorecards (project_id, total_score, calculated_tier, breakdown, override_reason)
             VALUES (?, ?, ?, ?, ?)`,
            [req.params.id, total_score || 0, calculated_tier || 'Variation', JSON.stringify(breakdown || {}), override_reason || null]
        );

        // Update project classification fields
        if (calculated_tier || approval_track) {
            await db.query(
                `UPDATE npa_projects SET npa_type = COALESCE(?, npa_type), approval_track = COALESCE(?, approval_track),
                 classification_confidence = ?, updated_at = NOW() WHERE id = ?`,
                [calculated_tier, approval_track, total_score || null, req.params.id]
            );
        }

        // Audit log
        await db.query(
            `INSERT INTO npa_audit_log (project_id, actor_name, action_type, action_details, is_agent_action, agent_name)
             VALUES (?, 'CLASSIFIER_AGENT', 'AGENT_CLASSIFIED', ?, 1, 'CLASSIFIER')`,
            [req.params.id, JSON.stringify({ calculated_tier, total_score, approval_track })]
        );

        res.json({ id: result.insertId, status: 'PERSISTED' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/agents/npas/:id/persist/risk — Save RISK assessment results
router.post('/npas/:id/persist/risk', async (req, res) => {
    const { layers, overall_score, hard_stop } = req.body;
    try {
        // Clear old risk checks for this project, then insert new ones
        await db.query('DELETE FROM npa_risk_checks WHERE project_id = ? AND checked_by = ?', [req.params.id, 'RISK_AGENT']);

        if (Array.isArray(layers)) {
            for (const layer of layers) {
                await db.query(
                    `INSERT INTO npa_risk_checks (project_id, check_layer, result, matched_items, checked_by)
                     VALUES (?, ?, ?, ?, 'RISK_AGENT')`,
                    [req.params.id, layer.layer || layer.check_layer, layer.result || 'PASS', JSON.stringify(layer.matched_items || layer.findings || [])]
                );
            }
        }

        // Upsert intake assessments for RISK domain
        await db.query('DELETE FROM npa_intake_assessments WHERE project_id = ? AND domain = ?', [req.params.id, 'RISK']);
        await db.query(
            `INSERT INTO npa_intake_assessments (project_id, domain, status, score, findings)
             VALUES (?, 'RISK', ?, ?, ?)`,
            [req.params.id, hard_stop ? 'FAIL' : 'PASS', overall_score || 0, JSON.stringify(layers || [])]
        );

        // Update project risk_level based on score
        if (overall_score !== undefined) {
            const riskLevel = overall_score >= 70 ? 'HIGH' : overall_score >= 40 ? 'MEDIUM' : 'LOW';
            await db.query('UPDATE npa_projects SET risk_level = ?, updated_at = NOW() WHERE id = ?', [riskLevel, req.params.id]);
        }

        await db.query(
            `INSERT INTO npa_audit_log (project_id, actor_name, action_type, action_details, is_agent_action, agent_name)
             VALUES (?, 'RISK_AGENT', 'AGENT_RISK_ASSESSED', ?, 1, 'RISK')`,
            [req.params.id, JSON.stringify({ overall_score, hard_stop, layer_count: layers?.length })]
        );

        res.json({ status: 'PERSISTED', layers_saved: layers?.length || 0 });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/agents/npas/:id/persist/autofill — Save AUTOFILL results to npa_form_data
router.post('/npas/:id/persist/autofill', async (req, res) => {
    const { fields } = req.body;
    try {
        if (!Array.isArray(fields) || fields.length === 0) {
            return res.status(400).json({ error: 'fields array is required' });
        }

        let saved = 0;
        for (const field of fields) {
            if (!field.field_key || field.value === undefined) continue;
            // Upsert: update if exists, insert if not
            const [existing] = await db.query(
                'SELECT id FROM npa_form_data WHERE project_id = ? AND field_key = ?',
                [req.params.id, field.field_key]
            );
            if (existing.length > 0) {
                await db.query(
                    `UPDATE npa_form_data SET field_value = ?, lineage = 'AUTO', confidence_score = ?, metadata = ?
                     WHERE project_id = ? AND field_key = ?`,
                    [String(field.value), field.confidence || null, field.metadata ? JSON.stringify(field.metadata) : null, req.params.id, field.field_key]
                );
            } else {
                await db.query(
                    `INSERT INTO npa_form_data (project_id, field_key, field_value, lineage, confidence_score, metadata)
                     VALUES (?, ?, ?, 'AUTO', ?, ?)`,
                    [req.params.id, field.field_key, String(field.value), field.confidence || null, field.metadata ? JSON.stringify(field.metadata) : null]
                );
            }
            saved++;
        }

        await db.query(
            `INSERT INTO npa_audit_log (project_id, actor_name, action_type, action_details, is_agent_action, agent_name)
             VALUES (?, 'AUTOFILL_AGENT', 'AGENT_AUTOFILLED', ?, 1, 'AUTOFILL')`,
            [req.params.id, JSON.stringify({ fields_saved: saved })]
        );

        res.json({ status: 'PERSISTED', fields_saved: saved });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/agents/npas/:id/persist/ml-predict — Save ML_PREDICT results
router.post('/npas/:id/persist/ml-predict', async (req, res) => {
    const { approval_likelihood, timeline_days, bottleneck, risk_score } = req.body;
    try {
        await db.query(
            `UPDATE npa_projects SET predicted_approval_likelihood = ?, predicted_timeline_days = ?,
             predicted_bottleneck = ?, updated_at = NOW() WHERE id = ?`,
            [approval_likelihood || null, timeline_days || null, bottleneck || null, req.params.id]
        );

        await db.query(
            `INSERT INTO npa_audit_log (project_id, actor_name, action_type, action_details, is_agent_action, agent_name)
             VALUES (?, 'ML_PREDICT_AGENT', 'AGENT_ML_PREDICTED', ?, 1, 'ML_PREDICT')`,
            [req.params.id, JSON.stringify({ approval_likelihood, timeline_days, bottleneck, risk_score })]
        );

        res.json({ status: 'PERSISTED' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/agents/npas/:id/persist/governance — Save GOVERNANCE sign-off status
router.post('/npas/:id/persist/governance', async (req, res) => {
    const { signoffs } = req.body;
    try {
        // Don't replace signoffs managed by transitions.js — only update metadata
        if (Array.isArray(signoffs)) {
            for (const so of signoffs) {
                if (!so.party) continue;
                // Only update fields that don't conflict with transition-managed state
                await db.query(
                    `UPDATE npa_signoffs SET department = COALESCE(?, department)
                     WHERE project_id = ? AND party = ?`,
                    [so.department || null, req.params.id, so.party]
                );
            }
        }

        await db.query(
            `INSERT INTO npa_audit_log (project_id, actor_name, action_type, action_details, is_agent_action, agent_name)
             VALUES (?, 'GOVERNANCE_AGENT', 'AGENT_GOVERNANCE_CHECKED', ?, 1, 'GOVERNANCE')`,
            [req.params.id, JSON.stringify({ signoff_count: signoffs?.length })]
        );

        res.json({ status: 'PERSISTED' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/agents/npas/:id/persist/doc-lifecycle — Save DOC_LIFECYCLE results
router.post('/npas/:id/persist/doc-lifecycle', async (req, res) => {
    const { documents } = req.body;
    try {
        if (Array.isArray(documents)) {
            for (const doc of documents) {
                if (!doc.document_name) continue;
                // Check if document already exists
                const [existing] = await db.query(
                    'SELECT id FROM npa_documents WHERE project_id = ? AND document_name = ?',
                    [req.params.id, doc.document_name]
                );
                if (existing.length > 0) {
                    await db.query(
                        `UPDATE npa_documents SET validation_status = ?, validation_notes = ?, updated_at = NOW()
                         WHERE project_id = ? AND document_name = ?`,
                        [doc.status || 'PENDING', doc.notes || null, req.params.id, doc.document_name]
                    );
                } else {
                    await db.query(
                        `INSERT INTO npa_documents (project_id, document_name, document_type, required_by_stage, validation_status, validation_notes)
                         VALUES (?, ?, ?, ?, ?, ?)`,
                        [req.params.id, doc.document_name, doc.document_type || 'OTHER', doc.required_by_stage || 'INITIATION', doc.status || 'PENDING', doc.notes || null]
                    );
                }
            }
        }

        await db.query(
            `INSERT INTO npa_audit_log (project_id, actor_name, action_type, action_details, is_agent_action, agent_name)
             VALUES (?, 'DOC_LIFECYCLE_AGENT', 'AGENT_DOC_CHECKED', ?, 1, 'DOC_LIFECYCLE')`,
            [req.params.id, JSON.stringify({ document_count: documents?.length })]
        );

        res.json({ status: 'PERSISTED', documents_saved: documents?.length || 0 });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/agents/npas/:id/persist/monitoring — Save MONITORING results
router.post('/npas/:id/persist/monitoring', async (req, res) => {
    const { metrics, thresholds } = req.body;
    try {
        // Upsert monitoring thresholds
        if (Array.isArray(thresholds)) {
            for (const t of thresholds) {
                if (!t.metric_name) continue;
                const [existing] = await db.query(
                    'SELECT id FROM npa_monitoring_thresholds WHERE project_id = ? AND metric_name = ?',
                    [req.params.id, t.metric_name]
                );
                if (existing.length > 0) {
                    await db.query(
                        `UPDATE npa_monitoring_thresholds SET warning_value = ?, critical_value = ?, comparison = ?
                         WHERE project_id = ? AND metric_name = ?`,
                        [t.warning_value || 0, t.critical_value || 0, t.comparison || 'GT', req.params.id, t.metric_name]
                    );
                } else {
                    await db.query(
                        `INSERT INTO npa_monitoring_thresholds (project_id, metric_name, warning_value, critical_value, comparison)
                         VALUES (?, ?, ?, ?, ?)`,
                        [req.params.id, t.metric_name, t.warning_value || 0, t.critical_value || 0, t.comparison || 'GT']
                    );
                }
            }
        }

        // Save performance metrics if provided
        if (Array.isArray(metrics)) {
            for (const m of metrics) {
                await db.query(
                    `INSERT INTO npa_performance_metrics (project_id, metric_name, metric_value, period_start, period_end)
                     VALUES (?, ?, ?, ?, ?)`,
                    [req.params.id, m.metric_name, m.metric_value || 0, m.period_start || null, m.period_end || null]
                );
            }
        }

        await db.query(
            `INSERT INTO npa_audit_log (project_id, actor_name, action_type, action_details, is_agent_action, agent_name)
             VALUES (?, 'MONITORING_AGENT', 'AGENT_MONITORING_SET', ?, 1, 'MONITORING')`,
            [req.params.id, JSON.stringify({ threshold_count: thresholds?.length, metric_count: metrics?.length })]
        );

        res.json({ status: 'PERSISTED' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
