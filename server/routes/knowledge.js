const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/knowledge
// Reads from kb_documents (UI metadata columns). Optional query: ?category=UNIVERSAL|AGENT|WORKFLOW|ALL
router.get('/', async (req, res) => {
    try {
        const category = String(req.query.category || 'ALL').toUpperCase();

        const params = [];
        let sql = `
            SELECT
                doc_id AS id,
                ui_category AS category,
                title,
                description,
                doc_type,
                display_date,
                agent_target,
                icon_name,
                last_synced
            FROM kb_documents
            WHERE ui_category IS NOT NULL
        `;

        if (category && category !== 'ALL') {
            sql += ' AND ui_category = ?';
            params.push(category);
        }

        sql += ' ORDER BY ui_category, COALESCE(updated_at, last_synced) DESC, title';

        const [rows] = await db.query(sql, params);
        res.json(rows);
    } catch (err) {
        console.error('[KNOWLEDGE] Fetch error:', err.message);
        res.status(500).json({ error: 'Failed to fetch knowledge documents.' });
    }
});

module.exports = router;

