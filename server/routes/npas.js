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
