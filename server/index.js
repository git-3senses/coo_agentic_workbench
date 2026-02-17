
require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ─── Request timeout: abort any API request that takes longer than 30s ───────
// Dify workflow/chat routes are exempt — they use server-side SSE streaming
// which can take 30-120s depending on the agent.
app.use('/api', (req, res, next) => {
    const isDifyRoute = req.path.startsWith('/dify/');
    const timeout = isDifyRoute ? 180000 : 30000; // 3 min for Dify, 30s for others
    req.setTimeout(timeout, () => {
        if (!res.headersSent) {
            res.status(504).json({ error: 'Request timeout — server took too long to respond' });
        }
    });
    next();
});

// Import Routes
const governanceRoutes = require('./routes/governance');
const npasRoutes = require('./routes/npas');
const usersRoutes = require('./routes/users');
const approvalsRoutes = require('./routes/approvals');
const monitoringRoutes = require('./routes/monitoring');
const dashboardRoutes = require('./routes/dashboard');
const auditRoutes = require('./routes/audit');
const classificationRoutes = require('./routes/classification');
const riskChecksRoutes = require('./routes/risk-checks');
const prerequisitesRoutes = require('./routes/prerequisites');
const agentsRoutes = require('./routes/agents');
const difyProxyRoutes = require('./routes/dify-proxy');

// Use Routes
app.use('/api/governance', governanceRoutes);
app.use('/api/npas', npasRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/approvals', approvalsRoutes);
app.use('/api/monitoring', monitoringRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/classification', classificationRoutes);
app.use('/api/risk-checks', riskChecksRoutes);
app.use('/api/prerequisites', prerequisitesRoutes);
app.use('/api/agents', agentsRoutes);
app.use('/api/dify', difyProxyRoutes);

// Health Check (always returns 200 so Railway healthcheck passes; DB status is informational)
app.get('/api/health', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT 1');
        res.json({ status: 'UP', db: 'CONNECTED' });
    } catch (err) {
        res.json({ status: 'UP', db: 'DISCONNECTED', error: err.message });
    }
});

// ─── Serve Angular static files in production ────────────────────────────────
// The Angular build output lives at ../dist/agent-command-hub-angular/browser
// When deployed on Railway, Express serves both the API and the Angular SPA.
const ANGULAR_DIST = path.join(__dirname, '..', 'dist', 'agent-command-hub-angular', 'browser');

app.use(express.static(ANGULAR_DIST));

// SPA fallback: any non-API route returns index.html so Angular router handles it
app.get(/^\/(?!api\/).*/, (req, res) => {
    res.sendFile(path.join(ANGULAR_DIST, 'index.html'), (err) => {
        if (err) {
            res.status(404).json({ error: 'Angular build not found. Run: npx ng build' });
        }
    });
});

// ─── Express error-handling middleware (must be AFTER all routes) ─────────────
app.use((err, req, res, next) => {
    console.error('[EXPRESS ERROR]', err.stack || err.message);
    res.status(500).json({ error: 'Internal server error' });
});

// ─── Global crash protection ─────────────────────────────────────────────────
process.on('uncaughtException', (err) => {
    console.error('[FATAL] Uncaught Exception:', err.stack || err.message);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('[FATAL] Unhandled Rejection at:', promise, 'reason:', reason);
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);

    // ─── DB keepalive ping: every 60s, run SELECT 1 to detect stale connections ──
    setInterval(async () => {
        try {
            await db.query('SELECT 1');
        } catch (err) {
            console.warn('[DB KEEPALIVE] Ping failed:', err.message);
        }
    }, 60_000);
});
