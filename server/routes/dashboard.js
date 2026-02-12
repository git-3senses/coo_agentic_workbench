const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/dashboard/kpis — Dashboard KPI metrics
router.get('/kpis', async (req, res) => {
    try {
        const [latest] = await db.query('SELECT * FROM npa_kpi_snapshots ORDER BY snapshot_date DESC LIMIT 1');
        const [previous] = await db.query('SELECT * FROM npa_kpi_snapshots ORDER BY snapshot_date DESC LIMIT 1 OFFSET 1');

        const current = latest[0] || {};
        const prev = previous[0] || {};

        const kpis = [
            {
                label: 'Pipeline Value',
                value: `$${((current.pipeline_value || 0) / 1000000).toFixed(1)}M`,
                subValue: `${current.active_npas || 0} Active NPAs`,
                trend: prev.pipeline_value ? `${(((current.pipeline_value - prev.pipeline_value) / prev.pipeline_value) * 100).toFixed(0)}% YoY` : 'N/A',
                trendUp: (current.pipeline_value || 0) > (prev.pipeline_value || 0),
                icon: 'DollarSign'
            },
            {
                label: 'Avg Cycle Time',
                value: `${current.avg_cycle_days || 0} Days`,
                subValue: 'From Initiation to Launch',
                trend: prev.avg_cycle_days ? `${(((prev.avg_cycle_days - current.avg_cycle_days) / prev.avg_cycle_days) * 100).toFixed(0)}% improved` : 'N/A',
                trendUp: (current.avg_cycle_days || 0) < (prev.avg_cycle_days || 0),
                icon: 'Clock'
            },
            {
                label: 'Approval Rate',
                value: `${current.approval_rate || 0}%`,
                subValue: `${current.approvals_completed || 0}/${current.approvals_total || 0} completed`,
                trend: prev.approval_rate ? `${((current.approval_rate - prev.approval_rate)).toFixed(0)}pp vs prev` : 'N/A',
                trendUp: (current.approval_rate || 0) > (prev.approval_rate || 0),
                icon: 'CheckCircle'
            },
            {
                label: 'Critical Risks',
                value: `${current.critical_risks || 0}`,
                subValue: 'Requiring immediate attention',
                trend: prev.critical_risks ? `${prev.critical_risks - current.critical_risks > 0 ? '-' : '+'}${Math.abs(prev.critical_risks - current.critical_risks)} vs prev` : 'N/A',
                trendUp: (current.critical_risks || 0) < (prev.critical_risks || 0),
                icon: 'AlertTriangle'
            }
        ];
        res.json(kpis);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/dashboard/pipeline — Pipeline stages distribution
router.get('/pipeline', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT current_stage as stage,
                   COUNT(*) as count,
                   SUM(CASE WHEN status IN ('At Risk', 'Blocked') THEN 1 ELSE 0 END) as risk_count
            FROM npa_projects
            WHERE status != 'Stopped'
            GROUP BY current_stage
            ORDER BY FIELD(current_stage, 'DISCOVERY','INITIATION','DCE_REVIEW','RISK_ASSESSMENT','PENDING_SIGN_OFFS','PENDING_FINAL_APPROVAL','APPROVED','LAUNCHED','PROHIBITED')
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/dashboard/classification-mix — Classification donut chart data
router.get('/classification-mix', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT npa_type as label, COUNT(*) as count
            FROM npa_projects
            WHERE status != 'Stopped'
            GROUP BY npa_type
        `);
        const colors = { 'New-to-Group': '#6366f1', 'Variation': '#f59e0b', 'Existing': '#10b981', 'NPA Lite': '#3b82f6', 'PROHIBITED': '#ef4444' };
        res.json(rows.map(r => ({ ...r, color: colors[r.label] || '#94a3b8' })));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/dashboard/ageing — Ageing analysis buckets
router.get('/ageing', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT
                SUM(CASE WHEN DATEDIFF(NOW(), created_at) <= 7 THEN 1 ELSE 0 END) as '0-7 days',
                SUM(CASE WHEN DATEDIFF(NOW(), created_at) BETWEEN 8 AND 30 THEN 1 ELSE 0 END) as '8-30 days',
                SUM(CASE WHEN DATEDIFF(NOW(), created_at) BETWEEN 31 AND 90 THEN 1 ELSE 0 END) as '31-90 days',
                SUM(CASE WHEN DATEDIFF(NOW(), created_at) > 90 THEN 1 ELSE 0 END) as '90+ days'
            FROM npa_projects
            WHERE current_stage NOT IN ('LAUNCHED', 'APPROVED', 'PROHIBITED')
        `);
        const row = rows[0];
        res.json([
            { label: '0-7 days', count: row['0-7 days'] || 0 },
            { label: '8-30 days', count: row['8-30 days'] || 0 },
            { label: '31-90 days', count: row['31-90 days'] || 0 },
            { label: '90+ days', count: row['90+ days'] || 0 }
        ]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/dashboard/clusters — Market cluster data
router.get('/clusters', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM npa_market_clusters ORDER BY npa_count DESC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/dashboard/prospects — Product opportunities
router.get('/prospects', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM npa_prospects ORDER BY estimated_value DESC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/dashboard/revenue — Top revenue NPAs
router.get('/revenue', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT id, title, estimated_revenue, product_manager, current_stage, status,
                   predicted_approval_likelihood
            FROM npa_projects
            WHERE estimated_revenue > 0
            ORDER BY estimated_revenue DESC
            LIMIT 5
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/dashboard/npa-pool — Full NPA pool for COO dashboard table
router.get('/npa-pool', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT p.id, p.title as productName, p.product_category,
                   GROUP_CONCAT(DISTINCT j.jurisdiction_code) as location,
                   p.pm_team as businessUnit, p.kickoff_date as kickoffDate,
                   p.product_manager as productManager, p.pm_team as pmTeam,
                   p.pac_approval_status as pacApproval,
                   p.proposal_preparer as proposalPreparer,
                   p.template_name as template,
                   p.npa_type as classification,
                   p.current_stage as stage,
                   p.status,
                   DATEDIFF(NOW(), p.created_at) as ageDays,
                   p.notional_amount, p.currency, p.estimated_revenue,
                   p.predicted_approval_likelihood, p.predicted_timeline_days,
                   p.approval_track
            FROM npa_projects p
            LEFT JOIN npa_jurisdictions j ON p.id = j.project_id
            GROUP BY p.id
            ORDER BY p.created_at DESC
        `);
        const pool = rows.map(r => ({
            ...r,
            location: r.location || ''
        }));
        res.json(pool);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
