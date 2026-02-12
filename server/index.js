
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

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

// Health Check
app.get('/api/health', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT 1');
        res.json({ status: 'UP', db: 'CONNECTED' });
    } catch (err) {
        res.status(500).json({ status: 'DOWN', db: 'DISCONNECTED', error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
