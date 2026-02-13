/**
 * Dify Agent Registry
 * Maps logical agent identities → Dify API keys + endpoint types
 *
 * Source of truth: ENTERPRISE_AGENT_ARCHITECTURE_FREEZE.md §3 & §11
 *
 * 13 logical agents across 4 tiers, deployed as 7 Dify apps:
 *   - CF_NPA_Orchestrator     (Chatflow)  → MASTER_COO, NPA_ORCHESTRATOR
 *   - CF_NPA_Ideation         (Chatflow)  → IDEATION
 *   - CF_NPA_Query_Assistant  (Chatflow)  → DILIGENCE, KB_SEARCH
 *   - WF_NPA_Classify_Predict (Workflow)  → CLASSIFIER, ML_PREDICT
 *   - WF_NPA_Risk             (Workflow)  → RISK
 *   - WF_NPA_Autofill         (Workflow)  → AUTOFILL
 *   - WF_NPA_Governance_Ops   (Workflow)  → GOVERNANCE, DOC_LIFECYCLE, MONITORING, NOTIFICATION
 */

require('dotenv').config();

const DIFY_BASE_URL = process.env.DIFY_BASE_URL || 'http://localhost/v1';

const DIFY_AGENTS = {
    // ─── Tier 1 — Strategic Command ──────────────────────────────────
    // Dify App: CF_NPA_Orchestrator (Chatflow)
    MASTER_COO: {
        key: process.env.DIFY_KEY_MASTER_COO || '',
        type: 'chat',
        difyApp: 'CF_NPA_Orchestrator',
        name: 'Master COO Orchestrator',
        tier: 1,
        icon: 'brain-circuit',
        color: 'bg-violet-50 text-violet-600'
    },

    // ─── Tier 2 — Domain Orchestration ───────────────────────────────
    // Dify App: CF_NPA_Orchestrator (Chatflow) — fused with MASTER_COO
    NPA_ORCHESTRATOR: {
        key: process.env.DIFY_KEY_MASTER_COO || '',
        type: 'chat',
        difyApp: 'CF_NPA_Orchestrator',
        name: 'NPA Domain Orchestrator',
        tier: 2,
        icon: 'target',
        color: 'bg-orange-50 text-orange-600'
    },

    // ─── Tier 3 — Specialist Workers ─────────────────────────────────

    // Dify App: CF_NPA_Ideation (Chatflow)
    // type='chat' because ideation is conversational (multi-turn discovery)
    IDEATION: {
        key: process.env.DIFY_KEY_IDEATION || '',
        type: 'chat',
        difyApp: 'CF_NPA_Ideation',
        name: 'Ideation Agent',
        tier: 3,
        icon: 'lightbulb',
        color: 'bg-indigo-50 text-indigo-600'
    },

    // Dify App: WF_NPA_Classify_Predict (Workflow)
    CLASSIFIER: {
        key: process.env.DIFY_KEY_CLASSIFIER || '',
        type: 'workflow',
        difyApp: 'WF_NPA_Classify_Predict',
        name: 'Classification Agent',
        tier: 3,
        icon: 'git-branch',
        color: 'bg-purple-50 text-purple-600'
    },

    // Dify App: WF_NPA_Autofill (Workflow)
    AUTOFILL: {
        key: process.env.DIFY_KEY_AUTOFILL || '',
        type: 'workflow',
        difyApp: 'WF_NPA_Autofill',
        name: 'Template AutoFill Agent',
        tier: 3,
        icon: 'file-edit',
        color: 'bg-blue-50 text-blue-600'
    },

    // Dify App: WF_NPA_Classify_Predict (Workflow) — fused with CLASSIFIER
    ML_PREDICT: {
        key: process.env.DIFY_KEY_CLASSIFIER || '',
        type: 'workflow',
        difyApp: 'WF_NPA_Classify_Predict',
        name: 'ML Prediction Agent',
        tier: 3,
        icon: 'trending-up',
        color: 'bg-amber-50 text-amber-600'
    },

    // Dify App: WF_NPA_Risk (Workflow)
    RISK: {
        key: process.env.DIFY_KEY_RISK || '',
        type: 'workflow',
        difyApp: 'WF_NPA_Risk',
        name: 'Risk Agent',
        tier: 3,
        icon: 'shield-alert',
        color: 'bg-red-50 text-red-600'
    },

    // Dify App: WF_NPA_Governance_Ops (Workflow)
    GOVERNANCE: {
        key: process.env.DIFY_KEY_GOVERNANCE || '',
        type: 'workflow',
        difyApp: 'WF_NPA_Governance_Ops',
        name: 'Governance Agent',
        tier: 3,
        icon: 'workflow',
        color: 'bg-slate-50 text-slate-600'
    },

    // Dify App: CF_NPA_Query_Assistant (Chatflow)
    // type='chat' because Query Assistant is conversational (multi-turn Q&A)
    DILIGENCE: {
        key: process.env.DIFY_KEY_DILIGENCE || '',
        type: 'chat',
        difyApp: 'CF_NPA_Query_Assistant',
        name: 'Conversational Diligence Agent',
        tier: 3,
        icon: 'message-square',
        color: 'bg-cyan-50 text-cyan-600'
    },

    // Dify App: WF_NPA_Governance_Ops (Workflow) — fused with GOVERNANCE
    DOC_LIFECYCLE: {
        key: process.env.DIFY_KEY_GOVERNANCE || '',
        type: 'workflow',
        difyApp: 'WF_NPA_Governance_Ops',
        name: 'Document Lifecycle Agent',
        tier: 3,
        icon: 'scan-search',
        color: 'bg-teal-50 text-teal-600'
    },

    // Dify App: WF_NPA_Governance_Ops (Workflow) — fused with GOVERNANCE
    MONITORING: {
        key: process.env.DIFY_KEY_GOVERNANCE || '',
        type: 'workflow',
        difyApp: 'WF_NPA_Governance_Ops',
        name: 'Post-Launch Monitoring Agent',
        tier: 3,
        icon: 'activity',
        color: 'bg-emerald-50 text-emerald-600'
    },

    // ─── Tier 4 — Shared Utilities ───────────────────────────────────

    // Dify App: CF_NPA_Query_Assistant (Chatflow) — fused with DILIGENCE
    // type='chat' because Query Assistant is conversational
    KB_SEARCH: {
        key: process.env.DIFY_KEY_DILIGENCE || '',
        type: 'chat',
        difyApp: 'CF_NPA_Query_Assistant',
        name: 'KB Search Agent',
        tier: 4,
        icon: 'search',
        color: 'bg-fuchsia-50 text-fuchsia-600'
    },

    // Dify App: WF_NPA_Governance_Ops (Workflow) — fused with GOVERNANCE
    NOTIFICATION: {
        key: process.env.DIFY_KEY_GOVERNANCE || '',
        type: 'workflow',
        difyApp: 'WF_NPA_Governance_Ops',
        name: 'Notification Agent',
        tier: 4,
        icon: 'bell',
        color: 'bg-pink-50 text-pink-600'
    }
};

function getAgent(agentId) {
    const agent = DIFY_AGENTS[agentId];
    if (!agent) {
        throw new Error(`Unknown agent: ${agentId}. Valid agents: ${Object.keys(DIFY_AGENTS).join(', ')}`);
    }
    return agent;
}

function getAllAgents() {
    return Object.entries(DIFY_AGENTS).map(([id, config]) => ({
        id,
        ...config,
        configured: !!config.key
    }));
}

module.exports = { DIFY_AGENTS, DIFY_BASE_URL, getAgent, getAllAgents };
