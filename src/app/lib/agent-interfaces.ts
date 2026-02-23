/**
 * Agent Interfaces — 18 Agents across 4 Tiers
 * Source of truth: ENTERPRISE_AGENT_ARCHITECTURE_FREEZE.md
 * + 5 Draft Builder Sign-Off Chat Agents (BIZ, TECH_OPS, FINANCE, RMG, LCS)
 */

// ─── Agent Registry ──────────────────────────────────────────────

export interface AgentDefinition {
    id: string;
    name: string;
    tier: 1 | 2 | 3 | 4;
    icon: string;
    color: string;
    difyType: 'chat' | 'workflow';
    description: string;
}

export const AGENT_REGISTRY: AgentDefinition[] = [
    // Tier 1 — Strategic Command
    { id: 'MASTER_COO', name: 'Master COO Orchestrator', tier: 1, icon: 'brain-circuit', color: 'bg-violet-50 text-violet-600', difyType: 'chat', description: 'Routes all user requests to appropriate domain orchestrators' },

    // Tier 2 — Domain Orchestration
    { id: 'NPA_ORCHESTRATOR', name: 'NPA Domain Orchestrator', tier: 2, icon: 'target', color: 'bg-orange-50 text-orange-600', difyType: 'chat', description: 'Decomposes NPA tasks into ordered sub-agent calls' },

    // Tier 3 — Specialist Workers
    { id: 'IDEATION', name: 'Ideation Agent', tier: 3, icon: 'lightbulb', color: 'bg-indigo-50 text-indigo-600', difyType: 'chat', description: 'Product concept development and NPA creation' },
    { id: 'CLASSIFIER', name: 'Classification Agent', tier: 3, icon: 'git-branch', color: 'bg-purple-50 text-purple-600', difyType: 'workflow', description: 'NTG/Variation/Existing classification and approval track assignment' },
    { id: 'ML_PREDICT', name: 'ML Prediction Agent', tier: 3, icon: 'trending-up', color: 'bg-amber-50 text-amber-600', difyType: 'workflow', description: 'Approval likelihood, timeline, and bottleneck prediction' },
    { id: 'RISK', name: 'Risk Agent', tier: 3, icon: 'shield-alert', color: 'bg-red-50 text-red-600', difyType: 'workflow', description: '5-layer risk cascade + 7-domain assessment: Credit, Market, Operational, Liquidity, Legal, Reputational, Cyber' },
    { id: 'GOVERNANCE', name: 'Governance Agent', tier: 3, icon: 'workflow', color: 'bg-slate-50 text-slate-600', difyType: 'workflow', description: 'Sign-off routing, SLA monitoring, loop-back, circuit breaker' },
    { id: 'DILIGENCE', name: 'Conversational Diligence', tier: 3, icon: 'message-square', color: 'bg-cyan-50 text-cyan-600', difyType: 'chat', description: 'Q&A with KB citations and regulatory context' },
    { id: 'DOC_LIFECYCLE', name: 'Document Lifecycle', tier: 3, icon: 'scan-search', color: 'bg-teal-50 text-teal-600', difyType: 'workflow', description: 'Document validation, completeness, expiry tracking' },
    { id: 'MONITORING', name: 'Post-Launch Monitoring', tier: 3, icon: 'activity', color: 'bg-emerald-50 text-emerald-600', difyType: 'workflow', description: 'Performance metrics, breach detection, PIR scheduling' },

    // Tier 3B — Draft Builder Sign-Off Chat Agents
    { id: 'AG_NPA_BIZ', name: 'NPA Business Agent', tier: 3, icon: 'briefcase', color: 'bg-blue-50 text-blue-600', difyType: 'chat', description: 'Section I (Product Specs) + VII (Trading) — product description, market sizing, customer profiling' },
    { id: 'AG_NPA_TECH_OPS', name: 'NPA Tech & Ops Agent', tier: 3, icon: 'settings', color: 'bg-indigo-50 text-indigo-600', difyType: 'chat', description: 'Section II (Operational & Technology) — operating model, system impact, BCM planning' },
    { id: 'AG_NPA_FINANCE', name: 'NPA Finance Agent', tier: 3, icon: 'calculator', color: 'bg-emerald-50 text-emerald-600', difyType: 'chat', description: 'Section III (Pricing) + V (Data Management) — pricing methodology, model validation, tax' },
    { id: 'AG_NPA_RMG', name: 'NPA Risk Management Agent', tier: 3, icon: 'shield-alert', color: 'bg-red-50 text-red-600', difyType: 'chat', description: 'Section IV (Risk Analysis) + VI (Other Risks) — market, credit, operational, liquidity risk' },
    { id: 'AG_NPA_LCS', name: 'NPA Legal & Compliance Agent', tier: 3, icon: 'scale', color: 'bg-amber-50 text-amber-600', difyType: 'chat', description: 'Appendix 1-6 — legal opinions, compliance checklists, financial crime assessment' },

    // Tier 4 — Shared Utilities
    { id: 'KB_SEARCH', name: 'KB Search Agent', tier: 4, icon: 'search', color: 'bg-fuchsia-50 text-fuchsia-600', difyType: 'chat', description: 'Semantic/hybrid search over knowledge base' },
    { id: 'NOTIFICATION', name: 'Notification Agent', tier: 4, icon: 'bell', color: 'bg-pink-50 text-pink-600', difyType: 'workflow', description: 'Alert aggregation, deduplication, and multi-channel delivery' },
];

// ─── Agent Activity ──────────────────────────────────────────────

export type AgentStatus = 'idle' | 'running' | 'done' | 'error';

export interface AgentActivityUpdate {
    agentId: string;
    status: AgentStatus;
    message?: string;
    timestamp?: Date;
}

// ─── Agent Actions (from Dify metadata) ──────────────────────────

export type AgentAction =
    | 'ROUTE_DOMAIN'
    | 'DELEGATE_AGENT'
    | 'ASK_CLARIFICATION'
    | 'SHOW_CLASSIFICATION'
    | 'SHOW_RISK'
    | 'SHOW_PREDICTION'
    | 'SHOW_GOVERNANCE'
    | 'SHOW_DOC_STATUS'
    | 'SHOW_MONITORING'
    | 'SHOW_KB_RESULTS'
    | 'HARD_STOP'
    | 'STOP_PROCESS'
    | 'FINALIZE_DRAFT'
    | 'ROUTE_WORK_ITEM'
    | 'SHOW_RAW_RESPONSE'
    | 'SHOW_ERROR';

// ─── Classification Agent (#4) ──────────────────────────────────

export interface ClassificationScore {
    criterion: string;
    score: number;
    maxScore: number;
    reasoning: string;
}

export interface ClassificationResult {
    type: 'NTG' | 'Variation' | 'Existing';
    track: 'Full NPA' | 'NPA Lite' | 'Bundling' | 'Evergreen' | 'Prohibited';
    scores: ClassificationScore[];
    overallConfidence: number;
    prohibitedMatch?: {
        matched: boolean;
        item?: string;
        layer?: 'INTERNAL_POLICY' | 'REGULATORY' | 'SANCTIONS' | 'DYNAMIC';
    };
    mandatorySignOffs: string[];
}

// ─── Risk Agent (#7) — 5-Layer Cascade + 7-Domain Assessment ────

export interface RiskLayer {
    name: 'Internal Policy' | 'Regulatory' | 'Sanctions' | 'Dynamic' | 'Finance & Tax' | string;
    status: 'PASS' | 'FAIL' | 'WARNING';
    details: string;
    checks: { name: string; status: 'PASS' | 'FAIL' | 'WARNING'; detail: string }[];
}

export interface RiskDomainAssessment {
    domain: 'CREDIT' | 'MARKET' | 'OPERATIONAL' | 'LIQUIDITY' | 'LEGAL' | 'REPUTATIONAL' | 'CYBER' | string;
    score: number;          // 0-100
    rating: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | string;
    keyFindings: string[];
    mitigants: string[];
}

export interface RiskAssessment {
    layers: RiskLayer[];
    domainAssessments: RiskDomainAssessment[];
    overallScore: number;
    overallRating: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | string;
    hardStop: boolean;
    hardStopReason?: string;
    prerequisites: { name: string; status: 'PASS' | 'FAIL'; category: string }[];
    pirRequirements?: { required: boolean; type?: string; deadline_months?: number; conditions?: string[] };
    validityRisk?: { valid: boolean; expiry_date?: string; extension_eligible?: boolean; notes?: string };
    circuitBreaker?: { triggered: boolean; loop_back_count?: number; threshold?: number; escalation_target?: string };
    evergreenLimits?: { eligible: boolean; notional_remaining?: number; deal_count_remaining?: number; flags?: string[] };
    npaLiteRiskProfile?: { subtype?: string; eligible: boolean; conditions_met?: string[]; conditions_failed?: string[] };
    sopBottleneckRisk?: { bottleneck_parties?: string[]; estimated_days?: number; critical_path?: string };
    notionalFlags?: { finance_vp_required?: boolean; cfo_required?: boolean; roae_required?: boolean; threshold_breached?: string };
    mandatorySignoffs?: string[];
    recommendations?: string[];
}

// ─── ML Prediction Agent (#6) ───────────────────────────────────

export interface PredictionFeature {
    name: string;
    importance: number;
    value: string;
}

export interface MLPrediction {
    approvalLikelihood: number;
    timelineDays: number;
    bottleneckDept: string;
    riskScore: number;
    features: PredictionFeature[];
    comparisonInsights: string[];
}

// ─── Governance Agent (#8) ──────────────────────────────────────

export interface SignoffItem {
    department: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'REWORK';
    assignee?: string;
    slaDeadline?: string;
    slaBreached?: boolean;
    decidedAt?: string;
}

export interface GovernanceState {
    signoffs: SignoffItem[];
    slaStatus: 'on_track' | 'at_risk' | 'breached';
    loopBackCount: number;
    circuitBreaker: boolean;
    circuitBreakerThreshold: number;
    escalation?: { level: number; escalatedTo: string; reason: string };
}


// ─── Monitoring Agent (#11) ─────────────────────────────────────

export interface MonitoringMetric {
    name: string;
    value: number;
    unit: string;
    threshold?: number;
    trend: 'up' | 'down' | 'stable';
}

export interface MonitoringBreach {
    metric: string;
    threshold: number;
    actual: number;
    severity: 'CRITICAL' | 'WARNING';
    message: string;
    firstDetected: string;
    trend: 'worsening' | 'stable' | 'improving';
}

export interface MonitoringResult {
    productHealth: 'HEALTHY' | 'WARNING' | 'CRITICAL';
    metrics: MonitoringMetric[];
    breaches: MonitoringBreach[];
    conditions: { type: string; description: string; deadline: string; status: string; daysRemaining: number }[];
    pirStatus: string;
    pirDueDate?: string;
}

// ─── KB Search Agent (#12) ──────────────────────────────────────

export interface KBSearchResult {
    docId: string;
    title: string;
    snippet: string;
    similarity: number;
    source: string;
    docType?: string;
}

// ─── Document Lifecycle Agent (#10) ─────────────────────────────

export interface DocCompletenessResult {
    completenessPercent: number;
    totalRequired: number;
    totalPresent: number;
    totalValid: number;
    missingDocs: { docType: string; reason: string; priority: 'BLOCKING' | 'WARNING' }[];
    invalidDocs: { docType: string; reason: string; action: string }[];
    conditionalRules: { condition: string; requiredDoc: string; status: string }[];
    expiringDocs: { docType: string; expiryDate: string; daysRemaining: number; alertLevel: string }[];
    stageGateStatus: 'CLEAR' | 'WARNING' | 'BLOCKED';
}

// ─── Diligence Agent (#9) ───────────────────────────────────────

export interface DiligenceResponse {
    answer: string;
    citations: { source: string; snippet: string; relevance: number }[];
    relatedQuestions: string[];
    reasoningChain?: string;
}

// ─── Notification Agent (#13) ───────────────────────────────────

export interface NotificationResult {
    sentCount: number;
    channels: string[];
    deduplicated: number;
    notifications: { id: string; type: string; severity: string; message: string; recipients: string[] }[];
}

// ─── Dify Response Types ─────────────────────────────────────────

export interface AgentMetadata {
    agent_action: AgentAction;
    agent_id: string;
    payload: any;
    trace: Record<string, any>;
}

export interface DifyChatResponse {
    answer: string;
    conversation_id: string;
    message_id: string;
    metadata: AgentMetadata;
}

export interface DifyWorkflowResponse {
    workflow_run_id: string;
    task_id: string;
    data: {
        outputs: Record<string, any>;
        status: 'succeeded' | 'failed' | 'running';
        error?: string;
    };
    metadata: AgentMetadata;
}

export interface DifyStreamChunk {
    event: 'message' | 'agent_message' | 'agent_thought' | 'message_end' | 'error';
    answer?: string;
    conversation_id?: string;
    message_id?: string;
    metadata?: Record<string, any>;
}

// ─── Workflow SSE Stream Events (for Live view) ─────────────────
export type WorkflowStreamEvent =
    | { type: 'workflow_started'; workflowRunId: string; taskId: string }
    | { type: 'node_started'; nodeId: string; nodeType: string; title: string }
    | { type: 'node_finished'; nodeId: string; nodeType: string; title: string; status: string; elapsedMs: number }
    | { type: 'text_chunk'; text: string }
    | { type: 'workflow_finished'; outputs: Record<string, any>; status: string }
    | { type: 'error'; code: string; message: string };
