const { loadEnv } = require('./utils/load-env');
const envPath = loadEnv();
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');

// ─── Security: Helmet (security headers) ─────────────────────────────────────
let helmet;
try {
    helmet = require('helmet');
} catch (e) {
    console.warn('[SECURITY] helmet not installed. Run: npm install helmet. Skipping security headers.');
}

// ─── Security: Rate Limiting ──────────────────────────────────────────────────
let rateLimit;
try {
    rateLimit = require('express-rate-limit');
} catch (e) {
    console.warn('[SECURITY] express-rate-limit not installed. Run: npm install express-rate-limit. Skipping rate limiting.');
}

const app = express();
const PORT = process.env.PORT || 3000;
console.log('[ENV] Loaded:', envPath);

// ─── Helmet: Security Headers ─────────────────────────────────────────────────
if (helmet) {
    app.use(helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],  // Angular needs inline styles
                imgSrc: ["'self'", "data:", "blob:"],
                connectSrc: ["'self'"],
                fontSrc: ["'self'"],
                objectSrc: ["'none'"],
                frameAncestors: ["'none'"],               // Equivalent to X-Frame-Options DENY
            }
        },
        hsts: {
            maxAge: 31536000,       // 1 year
            includeSubDomains: true,
            preload: true
        },
        frameguard: { action: 'deny' },                   // X-Frame-Options: DENY
        noSniff: true,                                     // X-Content-Type-Options: nosniff
        referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
    }));
}

app.use(cors());
app.use(express.json({ limit: process.env.JSON_BODY_LIMIT || '2mb' }));

// ─── Rate Limiting Middleware ─────────────────────────────────────────────────
if (rateLimit) {
    // General API rate limit: 100 requests per 15 minutes per IP
    const apiLimiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 100,
        standardHeaders: true,
        legacyHeaders: false,
        message: { error: 'Too many requests, please try again later.' }
    });
    app.use('/api/', apiLimiter);

    // Auth rate limit: 10 requests per 15 minutes per IP (stricter)
    const authLimiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 10,
        standardHeaders: true,
        legacyHeaders: false,
        message: { error: 'Too many authentication attempts, please try again later.' }
    });
    app.use('/api/auth', authLimiter);

    // Agent/streaming rate limit: 30 requests per 15 minutes per IP
    const agentLimiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 30,
        standardHeaders: true,
        legacyHeaders: false,
        message: { error: 'Too many agent requests, please try again later.' }
    });
    app.use('/api/agents', agentLimiter);
}

// ─── Request timeout: abort any API request that takes longer than 30s ───────
// Dify workflow/chat routes are exempt — they use server-side SSE streaming
// which can take 30-120s depending on the agent.
app.use('/api', (req, res, next) => {
    const isDifyRoute = req.path.startsWith('/dify/');
    const isSeedRoute = req.path.includes('seed-demo');
    const timeout = (isDifyRoute || isSeedRoute) ? 600000 : 30000; // 10 min for Dify/seed (AUTOFILL takes ~8 min), 30s for others
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
const transitionsRoutes = require('./routes/transitions');
const pirRoutes = require('./routes/pir');
const bundlingRoutes = require('./routes/bundling');
const evergreenRoutes = require('./routes/evergreen');
const escalationsRoutes = require('./routes/escalations');
const documentsRoutes = require('./routes/documents');
const knowledgeRoutes = require('./routes/knowledge');
const evidenceRoutes = require('./routes/evidence');
const kbRoutes = require('./routes/kb');
const studioRoutes = require('./routes/studio');
const { startMonitor: startSlaMonitor } = require('./jobs/sla-monitor');
const { startHealthMonitor, getHealthStatus } = require('./jobs/agent-health');
const { auditMiddleware } = require('./middleware/audit');
const { authMiddleware, router: authRoutes } = require('./middleware/auth');

// Global auth middleware — parses JWT and attaches req.user (non-blocking)
app.use('/api', authMiddleware());

// Auth routes (login, me) — must be before other routes
app.use('/api/auth', authRoutes);

// Use Routes — auditMiddleware auto-logs POST/PUT/PATCH/DELETE on success (GAP-017)
app.use('/api/governance', auditMiddleware('GOV'), governanceRoutes);
app.use('/api/npas', auditMiddleware('NPA'), npasRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/approvals', auditMiddleware('APPROVAL'), approvalsRoutes);
app.use('/api/monitoring', monitoringRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/classification', auditMiddleware('CLASSIFY'), classificationRoutes);
app.use('/api/risk-checks', auditMiddleware('RISK'), riskChecksRoutes);
app.use('/api/prerequisites', auditMiddleware('PREREQ'), prerequisitesRoutes);
app.use('/api/agents', auditMiddleware('AGENT'), agentsRoutes);
app.use('/api/dify', difyProxyRoutes);
app.use('/api/transitions', auditMiddleware('TRANSITION'), transitionsRoutes);
app.use('/api/pir', auditMiddleware('PIR'), pirRoutes);
app.use('/api/bundling', auditMiddleware('BUNDLING'), bundlingRoutes);
app.use('/api/evergreen', auditMiddleware('EVERGREEN'), evergreenRoutes);
app.use('/api/escalations', auditMiddleware('ESCALATION'), escalationsRoutes);
app.use('/api/documents', auditMiddleware('DOCUMENT'), documentsRoutes);
app.use('/api/knowledge', auditMiddleware('KNOWLEDGE'), knowledgeRoutes);
app.use('/api/evidence', auditMiddleware('EVIDENCE'), evidenceRoutes);
app.use('/api/kb', auditMiddleware('KB'), kbRoutes);
app.use('/api/studio', auditMiddleware('STUDIO'), studioRoutes);

// GAP-022: Agent health endpoint — live Dify agent availability metrics + Dashboard Stats
app.get('/api/dify/agents/health', async (req, res) => {
    try {
        const baseStatus = getHealthStatus();

        // Fetch dynamic metrics for the dashboard
        const [[{ avgConfidence, totalDecisions }]] = await db.query(`
            SELECT 
                AVG(classification_confidence) as avgConfidence,
                COUNT(*) as totalDecisions
            FROM npa_projects 
            WHERE status != 'Stopped'
        `);

        const [[{ kbsConnected, kbRecords }]] = await db.query(`
            SELECT 
                COUNT(DISTINCT doc_type) as kbsConnected,
                COUNT(*) as kbRecords
            FROM kb_documents
        `);

        res.json({
            ...baseStatus,
            metrics: {
                confidenceScore: Math.round(Number(avgConfidence) || 87), // Fallback if no NPAs
                toolsUsed: 54, // Remaining static for now, representing MCPs/Plugins
                kbsConnected: Number(kbsConnected) || 0,
                kbRecords: Number(kbRecords) || 0,
                totalDecisions: Number(totalDecisions) || 0
            }
        });
    } catch (err) {
        console.error('[HEALTH API] Error fetching metrics:', err.message);
        res.json(getHealthStatus()); // Fallback to just Agent up/down status
    }
});

// Health Check (always returns 200 so Railway healthcheck passes; DB status is informational)
app.get('/api/health', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT 1');
        res.json({ status: 'UP', db: 'CONNECTED' });
    } catch (err) {
        console.error('[HEALTH] DB check failed:', err.message);
        const errorMsg = process.env.NODE_ENV === 'production' ? 'DB check failed' : err.message;
        res.json({ status: 'UP', db: 'DISCONNECTED', error: errorMsg });
    }
});

// ─── Serve Angular static files in production ────────────────────────────────
// Angular build output can be either:
//   - dist/<app>/browser (SSR-style output structure)
//   - dist/<app>         (single-page build output)
// Express serves both the API and the Angular SPA.
const fs = require('fs');
const ANGULAR_DIST_BROWSER = path.join(__dirname, '..', 'dist', 'agent-command-hub-angular', 'browser');
const ANGULAR_DIST_FLAT = path.join(__dirname, '..', 'dist', 'agent-command-hub-angular');
const ANGULAR_DIST = fs.existsSync(ANGULAR_DIST_BROWSER) ? ANGULAR_DIST_BROWSER : ANGULAR_DIST_FLAT;

if (fs.existsSync(ANGULAR_DIST)) {
    console.log('[STATIC] Angular dist found at:', ANGULAR_DIST);
} else {
    console.warn('[STATIC] ⚠️  Angular dist NOT found at:', ANGULAR_DIST);
    console.warn('[STATIC] __dirname:', __dirname);
    console.warn('[STATIC] Looking for parent dist dirs...');
    try { console.log('[STATIC] ../dist contents:', fs.readdirSync(path.join(__dirname, '..', 'dist'))); } catch (e) { console.warn('[STATIC] ../dist does not exist'); }
}

app.use(express.static(ANGULAR_DIST));

// SPA fallback: any non-API route returns index.html so Angular router handles it
app.get(/^\/(?!api\/).*/, (req, res) => {
    // Prevent stale SPA shells being cached (common cause of "old UI even after refresh")
    // Hashed JS/CSS assets can still be cached safely via their filenames.
    res.setHeader('Cache-Control', 'no-store');
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

// ─── Migration: Add display_id column to npa_projects ────────────────────────
async function migrateDisplayId() {
    try {
        // Add display_id column if it doesn't exist
        await db.query(`
            ALTER TABLE npa_projects ADD COLUMN IF NOT EXISTS display_id VARCHAR(20) DEFAULT NULL
        `);
        console.log('[MIGRATION] display_id column ensured on npa_projects');

        // Add a unique index if it doesn't already exist
        try {
            await db.query(`
                CREATE UNIQUE INDEX idx_npa_display_id ON npa_projects(display_id)
            `);
            console.log('[MIGRATION] Unique index on display_id created');
        } catch (idxErr) {
            // Index likely already exists — ignore
            if (!String(idxErr?.message || '').includes('Duplicate key name')) {
                console.warn('[MIGRATION] Index creation note:', idxErr.message);
            }
        }

        // Backfill existing NPAs that don't have a display_id
        const [rows] = await db.query(`
            SELECT id, created_at FROM npa_projects WHERE display_id IS NULL ORDER BY created_at ASC
        `);
        if (rows.length > 0) {
            console.log(`[MIGRATION] Backfilling display_id for ${rows.length} existing NPAs...`);
            for (const row of rows) {
                const year = new Date(row.created_at).getFullYear() || new Date().getFullYear();
                // Get current max sequence for this year
                const [[{ max_seq }]] = await db.query(`
                    SELECT COALESCE(MAX(CAST(SUBSTRING(display_id, LENGTH(CONCAT('NPA-', ?, '-')) + 1) AS UNSIGNED)), 0) as max_seq
                    FROM npa_projects
                    WHERE display_id LIKE CONCAT('NPA-', ?, '-%')
                `, [year, year]);
                const nextSeq = (max_seq || 0) + 1;
                const displayId = `NPA-${year}-${String(nextSeq).padStart(5, '0')}`;
                await db.query('UPDATE npa_projects SET display_id = ? WHERE id = ?', [displayId, row.id]);
            }
            console.log(`[MIGRATION] Backfilled display_id for ${rows.length} NPAs`);
        }
    } catch (err) {
        console.error('[MIGRATION] display_id migration failed:', err.message);
    }
}

// ─── Migration: Create agent summary tables needed by persist routes ──────────
async function migrateAgentSummaryTables() {
    // 1. npa_risk_assessment_summary
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS npa_risk_assessment_summary (
                id INT AUTO_INCREMENT PRIMARY KEY,
                project_id VARCHAR(36) NOT NULL,
                overall_score INT DEFAULT 0,
                overall_rating VARCHAR(20) DEFAULT 'LOW',
                hard_stop TINYINT(1) DEFAULT 0,
                hard_stop_reason TEXT,
                domain_assessments LONGTEXT,
                pir_requirements LONGTEXT,
                notional_flags LONGTEXT,
                mandatory_signoffs LONGTEXT,
                recommendations LONGTEXT,
                circuit_breaker LONGTEXT,
                evergreen_limits LONGTEXT,
                validity_risk LONGTEXT,
                npa_lite_risk_profile LONGTEXT,
                sop_bottleneck_risk LONGTEXT,
                prerequisites LONGTEXT,
                raw_json LONGTEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY uq_risk_summary_project (project_id)
            )
        `);
        console.log('[MIGRATION] npa_risk_assessment_summary table ensured');
    } catch (err) {
        console.error('[MIGRATION] npa_risk_assessment_summary creation failed:', err.message);
    }

    // 2. npa_ml_predictions
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS npa_ml_predictions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                project_id VARCHAR(36) NOT NULL,
                approval_likelihood DECIMAL(5,2) DEFAULT 0,
                timeline_days DECIMAL(5,2) DEFAULT 0,
                bottleneck_dept VARCHAR(100),
                risk_score DECIMAL(5,2) DEFAULT 0,
                features LONGTEXT,
                comparison_insights LONGTEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY uq_ml_project (project_id)
            )
        `);
        console.log('[MIGRATION] npa_ml_predictions table ensured');
    } catch (err) {
        console.error('[MIGRATION] npa_ml_predictions creation failed:', err.message);
    }

    // 3. npa_doc_lifecycle_summary
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS npa_doc_lifecycle_summary (
                id INT AUTO_INCREMENT PRIMARY KEY,
                project_id VARCHAR(36) NOT NULL,
                completeness_percent DECIMAL(5,2) DEFAULT 0,
                total_required INT DEFAULT 0,
                total_present INT DEFAULT 0,
                total_valid INT DEFAULT 0,
                stage_gate_status VARCHAR(30) DEFAULT 'BLOCKED',
                missing_documents LONGTEXT,
                invalid_documents LONGTEXT,
                conditional_rules LONGTEXT,
                expiring_documents LONGTEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY uq_doc_summary_project (project_id)
            )
        `);
        console.log('[MIGRATION] npa_doc_lifecycle_summary table ensured');
    } catch (err) {
        console.error('[MIGRATION] npa_doc_lifecycle_summary creation failed:', err.message);
    }

    // 4. npa_monitoring_results
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS npa_monitoring_results (
                id INT AUTO_INCREMENT PRIMARY KEY,
                project_id VARCHAR(36) NOT NULL,
                product_health VARCHAR(30) DEFAULT 'HEALTHY',
                metrics LONGTEXT,
                breaches LONGTEXT,
                conditions_data LONGTEXT,
                pir_status VARCHAR(50) DEFAULT 'Not Scheduled',
                pir_due_date DATE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY uq_monitoring_project (project_id)
            )
        `);
        console.log('[MIGRATION] npa_monitoring_results table ensured');
    } catch (err) {
        console.error('[MIGRATION] npa_monitoring_results creation failed:', err.message);
    }

    // 5. Add validation_notes column to npa_documents (needed by doc-lifecycle persist route)
    try {
        await db.query(`
            ALTER TABLE npa_documents ADD COLUMN IF NOT EXISTS validation_notes TEXT DEFAULT NULL
        `);
        console.log('[MIGRATION] npa_documents.validation_notes column ensured');
    } catch (err) {
        console.error('[MIGRATION] npa_documents.validation_notes migration failed:', err.message);
    }

    // 6. Add missing columns to npa_classification_scorecards (needed by classifier persist route)
    try {
        await db.query(`ALTER TABLE npa_classification_scorecards ADD COLUMN IF NOT EXISTS approval_track VARCHAR(50) DEFAULT NULL`);
        await db.query(`ALTER TABLE npa_classification_scorecards ADD COLUMN IF NOT EXISTS raw_json LONGTEXT DEFAULT NULL`);
        await db.query(`ALTER TABLE npa_classification_scorecards ADD COLUMN IF NOT EXISTS workflow_run_id VARCHAR(100) DEFAULT NULL`);
        console.log('[MIGRATION] npa_classification_scorecards columns ensured');
    } catch (err) {
        console.error('[MIGRATION] npa_classification_scorecards migration failed:', err.message);
    }

    // 7. Add missing columns to npa_performance_metrics (needed by monitoring persist route)
    try {
        await db.query(`ALTER TABLE npa_performance_metrics ADD COLUMN IF NOT EXISTS metric_name VARCHAR(100) DEFAULT NULL`);
        await db.query(`ALTER TABLE npa_performance_metrics ADD COLUMN IF NOT EXISTS metric_value DECIMAL(18,2) DEFAULT NULL`);
        await db.query(`ALTER TABLE npa_performance_metrics ADD COLUMN IF NOT EXISTS period_start DATE DEFAULT NULL`);
        await db.query(`ALTER TABLE npa_performance_metrics ADD COLUMN IF NOT EXISTS period_end DATE DEFAULT NULL`);
        console.log('[MIGRATION] npa_performance_metrics columns ensured');
    } catch (err) {
        console.error('[MIGRATION] npa_performance_metrics migration failed:', err.message);
    }
}

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);

    // Run display_id migration at startup
    migrateDisplayId();
    migrateAgentSummaryTables();

    // ─── DB keepalive ping: every 60s, run SELECT 1 to detect stale connections ──
    setInterval(async () => {
        try {
            await db.query('SELECT 1');
        } catch (err) {
            console.warn('[DB KEEPALIVE] Ping failed:', err.message);
        }
    }, 60_000);

    // ─── Sprint 3: SLA Monitor (GAP-006) — every 15 min ────────────────────────
    startSlaMonitor(15 * 60 * 1000);

    // ─── GAP-022: Agent Health Monitor — every 5 min ──────────────────────────
    startHealthMonitor(5 * 60 * 1000);
});
