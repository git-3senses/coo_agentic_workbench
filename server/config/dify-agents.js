/**
 * Dify Agent Registry
 * Maps logical agent identities → Dify API keys + endpoint types
 *
 * Source of truth: ENTERPRISE_AGENT_ARCHITECTURE_FREEZE.md §3 & §11
 *
 * 18 logical agents across 5 tiers, deployed as 16 Dify apps:
 *   - CF_COO_Orchestrator     (Chatflow)  → MASTER_COO
 *   - CF_NPA_Orchestrator     (Chatflow)  → NPA_ORCHESTRATOR
 *   - CF_NPA_Ideation         (Chatflow)  → IDEATION
 *   - CF_NPA_Query_Assistant  (Chatflow)  → DILIGENCE, KB_SEARCH
 *   - WF_NPA_Classify_Predict (Workflow)  → CLASSIFIER, ML_PREDICT
 *   - WF_NPA_Risk             (Workflow)  → RISK
 *   - WF_NPA_Autofill         (Workflow)  → AUTOFILL
 *   - WF_NPA_Governance       (Workflow)  → GOVERNANCE
 *   - WF_NPA_Doc_Lifecycle    (Workflow)  → DOC_LIFECYCLE
 *   - WF_NPA_Monitoring       (Workflow)  → MONITORING
 *   - WF_NPA_Notification     (Workflow)  → NOTIFICATION
 *
 * Draft Builder Chat Agents (5 Chatflow apps for NPA section sign-off):
 *   - CF_NPA_BIZ              (Chatflow)  → AG_NPA_BIZ
 *   - CF_NPA_TECH_OPS         (Chatflow)  → AG_NPA_TECH_OPS
 *   - CF_NPA_FINANCE          (Chatflow)  → AG_NPA_FINANCE
 *   - CF_NPA_RMG              (Chatflow)  → AG_NPA_RMG
 *   - CF_NPA_LCS              (Chatflow)  → AG_NPA_LCS
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });

const DIFY_BASE_URL = process.env.DIFY_BASE_URL || 'http://localhost/v1';

const DIFY_AGENTS = {
    // ─── Tier 1 — Strategic Command ──────────────────────────────────
    // Dify App: CF_COO_Orchestrator (Chatflow) — separate app
    MASTER_COO: {
        key: process.env.DIFY_KEY_MASTER_COO || '',
        type: 'chat',
        difyApp: 'CF_COO_Orchestrator',
        name: 'Master COO Orchestrator',
        tier: 1,
        icon: 'brain-circuit',
        color: 'bg-violet-50 text-violet-600'
    },

    // ─── Tier 2 — Domain Orchestration ───────────────────────────────
    // Dify App: CF_NPA_Orchestrator (Chatflow) — separate app, own API key
    NPA_ORCHESTRATOR: {
        key: process.env.DIFY_KEY_NPA_ORCHESTRATOR || '',
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

    // Dify App: WF_NPA_Governance (Workflow) — dedicated app
    // Sign-off orchestration, SLA management, loop-backs, escalations, PAC gating
    GOVERNANCE: {
        key: process.env.DIFY_KEY_GOVERNANCE || '',
        type: 'workflow',
        difyApp: 'WF_NPA_Governance',
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

    // Dify App: WF_NPA_Doc_Lifecycle (Workflow) — dedicated app
    // Document completeness, upload tracking, validation, expiry enforcement
    DOC_LIFECYCLE: {
        key: process.env.DIFY_KEY_DOC_LIFECYCLE || '',
        type: 'workflow',
        difyApp: 'WF_NPA_Doc_Lifecycle',
        name: 'Document Lifecycle Agent',
        tier: 3,
        icon: 'scan-search',
        color: 'bg-teal-50 text-teal-600'
    },

    // Dify App: WF_NPA_Monitoring (Workflow) — dedicated app
    // Post-launch monitoring, breach detection, PIR scheduling, dormancy, approximate bookings
    MONITORING: {
        key: process.env.DIFY_KEY_MONITORING || '',
        type: 'workflow',
        difyApp: 'WF_NPA_Monitoring',
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

    // Dify App: WF_NPA_Notification (Workflow) — dedicated app
    // Alert delivery, deduplication, escalation chains, severity-based routing
    NOTIFICATION: {
        key: process.env.DIFY_KEY_NOTIFICATION || '',
        type: 'workflow',
        difyApp: 'WF_NPA_Notification',
        name: 'Notification Agent',
        tier: 4,
        icon: 'bell',
        color: 'bg-pink-50 text-pink-600'
    },

    // ─── Tier 3B — Draft Builder Sign-Off Chat Agents ──────────────
    // 5 dedicated Chatflow apps for section-level NPA guidance & drafting

    // Dify App: CF_NPA_BIZ (Chatflow) — Business/Proposing Unit
    // Owns: Section I (Product Specs), Section VII (Trading Info)
    // Knowledge: Product catalogs, PAC minutes, market analysis
    AG_NPA_BIZ: {
        key: process.env.DIFY_KEY_AG_NPA_BIZ || '',
        type: 'chat',
        difyApp: 'CF_NPA_BIZ',
        name: 'NPA Business Agent',
        tier: 3,
        icon: 'briefcase',
        color: 'bg-blue-50 text-blue-600'
    },

    // Dify App: CF_NPA_TECH_OPS (Chatflow) — Technology & Operations + ISS
    // Owns: Section II (Operational & Technology)
    // Knowledge: System architecture docs, BCP templates, DR runbooks
    AG_NPA_TECH_OPS: {
        key: process.env.DIFY_KEY_AG_NPA_TECH_OPS || '',
        type: 'chat',
        difyApp: 'CF_NPA_TECH_OPS',
        name: 'NPA Tech & Ops Agent',
        tier: 3,
        icon: 'settings',
        color: 'bg-indigo-50 text-indigo-600'
    },

    // Dify App: CF_NPA_FINANCE (Chatflow) — Group Finance
    // Owns: Section III (Pricing), Section V (Data Management)
    // Knowledge: Pricing models, SIMM docs, RDAR policies, PURE guidelines
    AG_NPA_FINANCE: {
        key: process.env.DIFY_KEY_AG_NPA_FINANCE || '',
        type: 'chat',
        difyApp: 'CF_NPA_FINANCE',
        name: 'NPA Finance Agent',
        tier: 3,
        icon: 'calculator',
        color: 'bg-emerald-50 text-emerald-600'
    },

    // Dify App: CF_NPA_RMG (Chatflow) — Risk Management Group
    // Owns: Section IV (Risk Analysis), Section VI (Other Risks)
    // Knowledge: MAS Notice 637, risk frameworks, capital calc methods, stress scenarios
    AG_NPA_RMG: {
        key: process.env.DIFY_KEY_AG_NPA_RMG || '',
        type: 'chat',
        difyApp: 'CF_NPA_RMG',
        name: 'NPA Risk Management Agent',
        tier: 3,
        icon: 'shield-alert',
        color: 'bg-red-50 text-red-600'
    },

    // Dify App: CF_NPA_LCS (Chatflow) — Legal, Compliance & Secretariat
    // Owns: Appendix 1–6
    // Knowledge: Banking Act, AML/CFT regs, IP law, PDPA, sanctions lists
    AG_NPA_LCS: {
        key: process.env.DIFY_KEY_AG_NPA_LCS || '',
        type: 'chat',
        difyApp: 'CF_NPA_LCS',
        name: 'NPA Legal & Compliance Agent',
        tier: 3,
        icon: 'scale',
        color: 'bg-amber-50 text-amber-600'
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
