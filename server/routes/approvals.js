const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/approvals — All pending approval items (for approval dashboard)
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT p.id, p.title, p.description, p.submitted_by, p.risk_level,
                   p.npa_type, p.current_stage, p.status, p.created_at,
                   p.notional_amount, p.currency, p.approval_track,
                   (SELECT COUNT(*) FROM npa_signoffs s WHERE s.project_id = p.id AND s.status IN ('PENDING','UNDER_REVIEW','CLARIFICATION_NEEDED')) as pending_signoffs,
                   (SELECT COUNT(*) FROM npa_signoffs s WHERE s.project_id = p.id AND s.status = 'APPROVED') as completed_signoffs,
                   (SELECT COUNT(*) FROM npa_signoffs s WHERE s.project_id = p.id) as total_signoffs
            FROM npa_projects p
            WHERE p.current_stage IN ('PENDING_SIGN_OFFS', 'PENDING_FINAL_APPROVAL', 'DCE_REVIEW', 'RISK_ASSESSMENT', 'RETURNED_TO_MAKER')
              AND p.status != 'Stopped'
            ORDER BY p.created_at DESC
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/approvals/npas/:id/signoffs — Sign-offs for specific NPA
router.get('/npas/:id/signoffs', async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT * FROM npa_signoffs WHERE project_id = ? ORDER BY created_at',
            [req.params.id]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/approvals/npas/:id/loopbacks — Loop-backs for specific NPA
router.get('/npas/:id/loopbacks', async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT * FROM npa_loop_backs WHERE project_id = ? ORDER BY loop_back_number',
            [req.params.id]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/approvals/npas/:id/comments — Comments for specific NPA
router.get('/npas/:id/comments', async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT * FROM npa_comments WHERE project_id = ? ORDER BY created_at',
            [req.params.id]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/approvals/npas/:id/comments — Add comment
router.post('/npas/:id/comments', async (req, res) => {
    const { comment_type, comment_text, author_name, author_role } = req.body;
    try {
        const [result] = await db.query(
            `INSERT INTO npa_comments (project_id, comment_type, comment_text, author_name, author_role)
             VALUES (?, ?, ?, ?, ?)`,
            [req.params.id, comment_type, comment_text, author_name, author_role]
        );
        res.json({ id: result.insertId, status: 'CREATED' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/approvals/npas/:id/signoffs/:party/decide — Make sign-off decision
router.post('/npas/:id/signoffs/:party/decide', async (req, res) => {
    const { decision, comments, approver_user_id, approver_name } = req.body;
    try {
        await db.query(
            `UPDATE npa_signoffs
             SET status = ?, decision_date = NOW(), comments = ?, approver_user_id = ?, approver_name = ?
             WHERE project_id = ? AND party = ?`,
            [decision, comments, approver_user_id, approver_name, req.params.id, req.params.party]
        );
        res.json({ status: 'UPDATED' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
