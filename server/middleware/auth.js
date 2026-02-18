/**
 * Authentication Middleware (Cross-Cutting)
 *
 * Simple JWT-based auth for the demo workbench.
 * - POST /api/auth/login — accepts user_id, returns JWT
 * - POST /api/auth/me — returns current user from JWT
 * - authMiddleware() — Express middleware that validates JWT and attaches req.user
 *
 * In production this would integrate with DBS SSO/LDAP.
 */

const jwt = require('jsonwebtoken');
const db = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'coo-workbench-dev-secret-2026';
const JWT_EXPIRY = '24h';

/**
 * Generate a JWT for a user object.
 */
function signToken(user) {
    return jwt.sign(
        { userId: user.id, email: user.email, role: user.role, name: user.full_name },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRY }
    );
}

/**
 * Express middleware: validates Bearer token, attaches req.user.
 * Non-blocking — if no token, continues but req.user is null.
 * Use requireAuth() for routes that MUST be authenticated.
 */
function authMiddleware() {
    return (req, res, next) => {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            req.user = null;
            return next();
        }

        try {
            const token = authHeader.slice(7);
            req.user = jwt.verify(token, JWT_SECRET);
            next();
        } catch (err) {
            req.user = null;
            next();
        }
    };
}

/**
 * Express middleware: requires authenticated user.
 * Returns 401 if no valid token.
 */
function requireAuth() {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        next();
    };
}

/**
 * Auth routes — mount as app.use('/api/auth', authRoutes)
 */
const express = require('express');
const router = express.Router();

// POST /api/auth/login — Login by user ID (demo mode)
router.post('/login', async (req, res) => {
    const { user_id, email } = req.body;
    try {
        let sql, params;
        if (user_id) {
            sql = 'SELECT * FROM users WHERE id = ? AND is_active = TRUE';
            params = [user_id];
        } else if (email) {
            sql = 'SELECT * FROM users WHERE email = ? AND is_active = TRUE';
            params = [email];
        } else {
            return res.status(400).json({ error: 'Provide user_id or email' });
        }

        const [rows] = await db.query(sql, params);
        if (rows.length === 0) return res.status(401).json({ error: 'User not found or inactive' });

        const user = rows[0];
        const token = signToken(user);

        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                full_name: user.full_name,
                display_name: user.display_name,
                role: user.role,
                department: user.department,
                job_title: user.job_title,
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/auth/me — Return current user from JWT
router.get('/me', authMiddleware(), requireAuth(), (req, res) => {
    res.json({ user: req.user });
});

module.exports = { authMiddleware, requireAuth, signToken, router };
