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

module.exports = router;
