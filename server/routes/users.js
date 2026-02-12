const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/users — List all users
router.get('/', async (req, res) => {
    try {
        const { role, department } = req.query;
        let sql = 'SELECT * FROM users WHERE is_active = TRUE';
        const params = [];

        if (role) { sql += ' AND role = ?'; params.push(role); }
        if (department) { sql += ' AND department = ?'; params.push(department); }

        sql += ' ORDER BY full_name';
        const [rows] = await db.query(sql, params);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/users/:id — Single user
router.get('/:id', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
