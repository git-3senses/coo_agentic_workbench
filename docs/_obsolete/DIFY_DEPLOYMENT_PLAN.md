# Dify Agent Deployment Plan — NPA Multi-Agent Workbench
## 15 Agents, 4 Tiers, 9 Dify Apps

---

## Part 1: How Agents Power the Frontend

Before any Dify configuration — understand the three UX patterns that drive everything.

### Pattern A: The Conversational Flow (Chat Pages)

This is the primary experience. The user **talks** to agents and sees structured results inline.

```
┌─────────────────────────────────────────────────────────────────────┐
│  IDEATION CHAT PAGE                                                  │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │ 🤖 Master COO: "What product would you like to launch?"     │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │ 👤 User: "FX Option on USD/SGD, $75M, for Singapore desk"  │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  ┌─ Agent Activity Strip ──────────────────────────────────────┐    │
│  │  ● IDEATION running  ● KB_SEARCH running  ○ CLASSIFIER idle │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │ 🤖 Ideation Agent:                                          │    │
│  │ "I found 3 similar products. TSG1917 is a 94% match.       │    │
│  │  Prohibited check: CLEAR. Let me classify this..."          │    │
│  │                                                              │    │
│  │  ┌─── CLASSIFICATION CARD ────────────────────────────┐     │    │
│  │  │ Type: Existing (Variation)  Track: NPA Lite         │     │    │
│  │  │ Confidence: 92%                                     │     │    │
│  │  │                                                     │     │    │
│  │  │ New Asset Class     ████████░░  4/5                 │     │    │
│  │  │ Cross-Border        ██████████  5/5                 │     │    │
│  │  │ Novel Risk Profile  ██████░░░░  3/5                 │     │    │
│  │  │ ...                                                 │     │    │
│  │  └─────────────────────────────────────────────────────┘     │    │
│  │                                                              │    │
│  │  ┌─── PREDICTION CARD ────────────────────────────────┐     │    │
│  │  │ Approval Likelihood: 78%  Timeline: 4.2 days        │     │    │
│  │  │ Bottleneck: Finance (ROAE analysis)                 │     │    │
│  │  └─────────────────────────────────────────────────────┘     │    │
│  │                                                              │    │
│  │ "Do you agree with this classification? Should I proceed    │    │
│  │  to auto-fill the template?"                                │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  ┌──────────────────────────────────────────────┐  ┌──────────┐    │
│  │ Type a message...                             │  │  Send ➤  │    │
│  └──────────────────────────────────────────────┘  └──────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

**How it works under the hood:**

```
1. User types message
       │
       ▼
2. Angular → POST /api/dify/chat { query, agent: "MASTER_COO", conversation_id }
       │
       ▼
3. Express proxy → Dify Orchestrator Chatflow (SSE streaming)
       │
       ▼
4. Dify Orchestrator:
   a. LLM Intent Classifier → "create_npa"
   b. Calls NPA Ideation Chatflow via HTTP → agent runs MCP tools against MariaDB
   c. Ideation returns structured JSON
   d. Orchestrator optionally chains → Classification Workflow → ML Prediction
   e. Response Formatter wraps everything with metadata
       │
       ▼
5. Dify returns SSE stream:
   {
     "answer": "I found 3 similar products...",
     "metadata": {
       "agent_action": "SHOW_CLASSIFICATION",    ← tells Angular which card
       "agent_id": "CLASSIFIER",
       "payload": {                               ← the actual typed data
         "type": "Existing",
         "track": "NPA Lite",
         "overallConfidence": 92,
         "scores": [...]
       }
     }
   }
       │
       ▼
6. Angular ideation-chat.component.ts:
   - Reads metadata.agent_action
   - "SHOW_CLASSIFICATION" → renders <app-classification-result [result]="payload">
   - "SHOW_PREDICTION" → renders <app-ml-prediction-result [result]="payload">
   - "HARD_STOP" → renders prohibited product alert card
   - Plain text → renders as chat bubble
       │
       ▼
7. User sees: conversational message + rich inline data cards
   User responds → loop back to step 1 (same conversation_id = memory preserved)
```

**Key insight:** The chat is NOT just text. Every Dify response carries `metadata.agent_action` which Angular uses to render the correct display component with real data. The user experiences a conversation with embedded interactive cards.

### Pattern B: The Dashboard Panels (Detail Pages)

No chat. Agents run silently in the background. Panels populate with live data.

```
┌─────────────────────────────────────────────────────────────────────┐
│  NPA DETAIL PAGE — Analysis Tab                                      │
│                                                                      │
│  User navigates to NPA-2026-0042 detail page                       │
│  Angular fires 6 parallel workflow calls:                           │
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │ ML PREDICTION │  │ RISK AGENT   │  │ DOC LIFECYCLE│             │
│  │               │  │              │  │              │             │
│  │ Likelihood:   │  │ Layer 1: ✅  │  │ 4/5 docs ✅  │             │
│  │   78%         │  │ Layer 2: ✅  │  │ 1 BLOCKING   │             │
│  │ Timeline:     │  │ Layer 3: ✅  │  │              │             │
│  │   4.2 days    │  │ Layer 4: ⚠️  │  │ Stage Gate:  │             │
│  │ Bottleneck:   │  │              │  │   BLOCKED    │             │
│  │   Finance     │  │ Score: 72    │  │              │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │ GOVERNANCE   │  │ MONITORING   │  │ NOTIFICATION │             │
│  │              │  │              │  │              │             │
│  │ 0/6 signed   │  │ Health: ⚠️   │  │ 3 pending    │             │
│  │ SLA: on_track│  │ 2 breaches   │  │ 1 critical   │             │
│  │              │  │ PIR: due 2/28│  │              │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
└─────────────────────────────────────────────────────────────────────┘
```

**How it works:**

```
1. User navigates to NPA Detail page
       │
       ▼
2. Angular component ngOnInit fires parallel requests:
   Promise.all([
     POST /api/dify/workflow { agent: "CLASSIFIER",    inputs: { npa_id } }
     POST /api/dify/workflow { agent: "ML_PREDICT",    inputs: { npa_id } }
     POST /api/dify/workflow { agent: "RISK",          inputs: { npa_id } }
     POST /api/dify/workflow { agent: "DOC_LIFECYCLE", inputs: { npa_id } }
     POST /api/dify/workflow { agent: "GOVERNANCE",    inputs: { npa_id } }
     POST /api/dify/workflow { agent: "MONITORING",    inputs: { npa_id } }
   ])
       │
       ▼
3. Express routes each to the correct Dify Workflow app (by agent ID → API key)
   Each workflow calls MCP tools → queries/writes MariaDB → returns typed JSON
       │
       ▼
4. Results flow back. Angular binds to display components:

   Analysis Tab:
     this.mlPrediction = results[1]     → <app-ml-prediction-result [result]="mlPrediction">
     this.riskAssessment = results[2]   → <app-risk-assessment-result [result]="riskAssessment">

   Documents Tab:
     this.docCompleteness = results[3]  → <app-doc-completeness [result]="docCompleteness">

   Approvals Tab:
     this.governanceState = results[4]  → <app-governance-status [result]="governanceState">

   Monitoring Tab:
     this.monitoringResult = results[5] → <app-monitoring-alerts [result]="monitoringResult">
```

**Key insight:** The user doesn't know agents are running. They see a dashboard that loads with real data. No chat needed — it's a silent multi-agent fetch.

### Pattern C: Embedded Conversational Panels (Mini-Chats)

Specific areas in the UI have their own chat-like interfaces connected to individual conversational agents.

```
┌─────────────────────────────────────────────────────────────────────┐
│  MONITORING TAB                                                      │
│                                                                      │
│  [Breach alerts, metrics grid, etc. from Pattern B above]           │
│                                                                      │
│  ┌─── Ask the Monitoring Agent ─────────────────────────────────┐   │
│  │                                                               │   │
│  │  👤 "What caused the volume breach on Jan 15?"               │   │
│  │                                                               │   │
│  │  🤖 "The volume breach was triggered by a block trade of     │   │
│  │      $45M from counterparty XYZ Corp. This exceeded the      │   │
│  │      $40M daily threshold by 12.5%..."                       │   │
│  │                                                               │   │
│  │      📎 Source: npa_breach_alerts (alert_id: BRH-2026-0089) │   │
│  │      📎 Source: npa_performance_metrics (Jan 15 snapshot)    │   │
│  │                                                               │   │
│  │  👤 "Are there any regulatory implications?"                 │   │
│  │                                                               │   │
│  │  🤖 "Under MAS Notice 656, volume breaches exceeding 10%    │   │
│  │      require notification within 24 hours..."                │   │
│  │                                                               │   │
│  │      📎 Source: KB — MAS Notice 656, Section 4.3            │   │
│  │                                                               │   │
│  │  Related: "What is the escalation path?" | "Show PIR status"│   │
│  │                                                               │   │
│  │  ┌──────────────────────────────────────┐  ┌──────────┐     │   │
│  │  │ Ask a follow-up question...           │  │  Send ➤  │     │   │
│  │  └──────────────────────────────────────┘  └──────────┘     │   │
│  └───────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

**Which pages use which conversational agents:**

| UI Location | Agent | Dify App | What It Does |
|-------------|-------|----------|-------------|
| Ideation Chat page | Master COO → chains all | NPA Orchestrator Chatflow | Full NPA creation conversation |
| Monitoring tab "Ask" input | KB Explorer | KB Explorer Chatflow | Query monitoring data, regulatory docs |
| NPA Detail "Assistant" tab | Diligence Agent | Diligence Chatflow | Q&A about this specific NPA with citations |
| Approval Dashboard | Governance Agent | Governance Chatflow | "Why was this rejected?" → loop-back negotiations |
| Any search bar | KB Search | KB Explorer Chatflow | Iterative document search and drill-down |

**How it works:**

```
1. User types question in embedded chat panel
       │
       ▼
2. Angular → POST /api/dify/chat { query, agent: "KB_SEARCH", conversation_id }
   (Each embedded panel maintains its OWN conversation_id — separate from main chat)
       │
       ▼
3. Express → Dify KB Explorer Chatflow (with the panel's conversation_id)
   Agent searches KB, queries MariaDB, builds answer with citations
       │
       ▼
4. Response streams back with citations
   Angular renders answer + citation badges + related questions
       │
       ▼
5. User clicks related question or types follow-up
   → Same conversation_id → agent remembers context → refined answer
```

**Key insight:** Each embedded panel is a **separate Dify conversation**. The KB Explorer remembers "we were talking about volume breaches" when the user asks a follow-up. The Diligence agent remembers "we were discussing NPA-2026-0042" across multiple questions.

---

## Part 2: The 15 Agents — Conversational vs Workflow

### The Decision Framework

**Make it a Chatflow if:** The agent needs multi-turn dialogue, memory, follow-up questions, or user confirmation loops.

**Make it a Workflow if:** Input in → result out. No conversation. No memory needed between calls.

### All 15 Agents Mapped

```
TIER 1 — STRATEGIC COMMAND
┌─────────────────────────────────────────────────────────────┐
│ #1  Master COO Orchestrator    │ CHATFLOW │ Conversational  │
│     Routes all requests, manages conversation state         │
│     Memory: tracks npa_id, stage, last_agent across turns   │
└─────────────────────────────────────────────────────────────┘

TIER 2 — DOMAIN ORCHESTRATION
┌─────────────────────────────────────────────────────────────┐
│ #2  NPA Domain Orchestrator    │ CHATFLOW │ Fused with #1   │
│     NPA-specific routing, lifecycle management              │
│     (Same Dify app as #1 — no reason to separate)          │
└─────────────────────────────────────────────────────────────┘

TIER 3 — SPECIALIST WORKERS
┌─────────────────────────────────────────────────────────────┐
│ #3  Ideation Agent             │ CHATFLOW │ Conversational  │
│     6-step product interview with adaptive questioning      │
│     Needs memory: "You said $75M — is that USD or SGD?"    │
├─────────────────────────────────────────────────────────────┤
│ #4  Classification Agent       │ WORKFLOW │ Single-shot     │
│     NPA data in → scorecard out. No dialogue.              │
├─────────────────────────────────────────────────────────────┤
│ #5  Template AutoFill Agent    │ WORKFLOW │ Single-shot     │
│     NPA context in → 47 filled fields out. No dialogue.    │
├─────────────────────────────────────────────────────────────┤
│ #6  ML Prediction Agent        │ WORKFLOW │ Single-shot     │
│     NPA data in → approval %, timeline, bottleneck out.    │
├─────────────────────────────────────────────────────────────┤
│ #7  Risk Agent                 │ WORKFLOW │ Single-shot     │
│     Run 4-layer cascade → pass/fail per layer out.         │
├─────────────────────────────────────────────────────────────┤
│ #8  Governance Agent           │ CHATFLOW │ Conversational  │
│     Loop-back negotiations: "Finance rejected because..."  │
│     User responds → agent escalates or re-routes           │
│     Circuit breaker decisions need back-and-forth           │
├─────────────────────────────────────────────────────────────┤
│ #9  Conversational Diligence   │ CHATFLOW │ Conversational  │
│     Q&A with citations and follow-up chains                │
│     "What does MAS 656 say?" → answer → "Any exceptions?" │
├─────────────────────────────────────────────────────────────┤
│ #10 Document Lifecycle         │ WORKFLOW │ Single-shot     │
│     Check completeness → missing/invalid/expiring out.     │
├─────────────────────────────────────────────────────────────┤
│ #11 Post-Launch Monitoring     │ WORKFLOW │ Single-shot     │
│     Check metrics vs thresholds → breaches out.            │
└─────────────────────────────────────────────────────────────┘

TIER 4 — SHARED UTILITIES
┌─────────────────────────────────────────────────────────────┐
│ #12 KB Search Agent            │ CHATFLOW │ Conversational  │
│     Iterative search refinement, document drill-down       │
│     "Show me FX policies" → results → "Drill into #3"     │
├─────────────────────────────────────────────────────────────┤
│ #13 Notification Agent         │ WORKFLOW │ Single-shot     │
│     Fire alerts, return confirmation. No dialogue.         │
├─────────────────────────────────────────────────────────────┤
│ #14 Audit Trail Agent          │ NO APP   │ Tool-only       │
│     audit_* tools assigned to every other agent            │
│     No Dify app needed — it's a cross-cutting tool set     │
├─────────────────────────────────────────────────────────────┤
│ #15 Jurisdiction Adapter       │ NO APP   │ Tool-only       │
│     jurisdiction_* tools assigned to Classification, Risk  │
│     No Dify app needed — 3 tools used by other agents      │
└─────────────────────────────────────────────────────────────┘
```

### Summary Count

| Type | Count | Agents |
|------|-------|--------|
| Chatflow (conversational) | 5 | #1+#2, #3, #8, #9, #12 |
| Workflow (single-shot) | 2 (fused) | #4+#6, #5+#7+#10+#11+#13 |
| Tool-only (no Dify app) | 2 | #14, #15 |
| **Total agents** | **15** | |
| **Total Dify apps** | **7** | 5 Chatflows + 2 Workflows |

---

## Part 3: The 9 Dify Apps — Architecture

```
═══════════════════════════════════════════════════════════════════════
                         5 CHATFLOWS (Conversational)
═══════════════════════════════════════════════════════════════════════

CHATFLOW 1: "NPA Orchestrator"
Agents: Master COO (#1) + NPA Domain Orchestrator (#2)
Purpose: Main entry point — routes to all other apps

  [Start]
     │
     ▼
  [LLM: Intent Classifier]  →  JSON { intent, confidence }
     │
     ▼
  [IF/ELSE Router]
     │
     ├─ "create_npa" ──────→ [HTTP: Ideation Chatflow]
     ├─ "classify" ────────→ [HTTP: Classify+Predict Workflow]
     ├─ "autofill" ────────→ [HTTP: Ops Pipeline Workflow]
     ├─ "risk_assessment" ─→ [HTTP: Ops Pipeline Workflow]
     ├─ "governance" ──────→ [HTTP: Governance Chatflow]
     ├─ "search_kb" ───────→ [HTTP: KB Explorer Chatflow]
     ├─ "ask_question" ────→ [HTTP: Diligence Chatflow]
     ├─ "check_documents" ─→ [HTTP: Ops Pipeline Workflow]
     ├─ "monitoring" ──────→ [HTTP: Ops Pipeline Workflow]
     ├─ "confirmation" ────→ [Variable Assigner] → re-route to last_agent's next
     └─ "general_query" ───→ [Agent Node: General Q&A]
     │
     ▼
  [Variable Assigner]  →  update npa_id, stage, last_agent
     │
     ▼
  [LLM: Response Formatter]  →  wraps result with agent_action + payload metadata
     │
     ▼
  [Answer]  →  streamed to Angular via SSE

Conversation Variables:
  - current_npa_id (String)
  - current_stage (String)
  - user_role (String, default: "maker")
  - session_id (String)
  - last_agent (String)
  - last_next_action (String)

───────────────────────────────────────────────────────────────────────

CHATFLOW 2: "NPA Ideation"
Agent: Ideation (#3)
Purpose: Multi-turn product discovery interview

  [Start]
     │
     ▼
  [Agent Node: Ideation Specialist]
     Model: Claude Sonnet 4
     Strategy: Function Calling
     Max Iterations: 10
     Tools (8):
       - ideation_create_npa
       - ideation_find_similar
       - ideation_get_prohibited_list
       - ideation_save_concept
       - ideation_list_templates
       - search_kb_documents
       - session_create
       - audit_log_action
     │
     ▼
  [Answer]

  System Prompt: KB_Ideation_Agent.md (1,146 lines)
  Conversation: Multi-turn — remembers previous answers across the 6-step interview
  Called by: Orchestrator via HTTP (Dify chat-messages API, not workflows/run)

───────────────────────────────────────────────────────────────────────

CHATFLOW 3: "NPA Governance"
Agent: Governance (#8)
Purpose: Approval negotiations, loop-backs, escalation decisions

  [Start]
     │
     ▼
  [Agent Node: Governance Specialist]
     Model: Claude Sonnet 4
     Strategy: Function Calling
     Max Iterations: 12
     Tools (13):
       - governance_create_signoff_matrix
       - governance_get_signoffs
       - governance_record_decision
       - governance_check_loopbacks
       - governance_advance_stage
       - check_sla_status
       - create_escalation
       - get_escalation_rules
       - get_signoff_routing_rules
       - save_approval_decision
       - add_comment
       - send_notification
       - audit_log_action
     │
     ▼
  [Answer]

  System Prompt: KB_Governance_Agent.md
  Conversation: Multi-turn — "Finance rejected. Do you want to address or escalate?"
  → User: "Escalate" → Agent checks circuit breaker → "Escalated to VP. Confirm?"

───────────────────────────────────────────────────────────────────────

CHATFLOW 4: "Conversational Diligence"
Agent: Diligence (#9)
Purpose: Q&A with KB citations, regulatory context, follow-up chains

  [Start]
     │
     ▼
  [Agent Node: Diligence Specialist]
     Model: Claude Sonnet 4
     Strategy: Function Calling
     Max Iterations: 8
     Tools (5):
       - search_kb_documents
       - get_kb_document_by_id
       - list_kb_sources
       - get_npa_by_id
       - audit_log_action
     │
     ▼
  [Answer]

  System Prompt: KB_Conversational_Diligence.md
  Conversation: Multi-turn — user asks regulatory questions, agent provides
  cited answers, user drills deeper with follow-ups
  Used in: NPA Detail "Assistant" tab, any contextual Q&A panel

───────────────────────────────────────────────────────────────────────

CHATFLOW 5: "KB Explorer"
Agent: KB Search (#12)
Purpose: Iterative knowledge base search and document exploration

  [Start]
     │
     ▼
  [Agent Node: KB Search Specialist]
     Model: Claude Sonnet 4
     Strategy: Function Calling
     Max Iterations: 8
     Tools (4):
       - search_kb_documents
       - get_kb_document_by_id
       - list_kb_sources
       - audit_log_action
     │
     ▼
  [Answer]

  System Prompt: KB_Search_Agent.md
  Conversation: Multi-turn — "Show FX policies" → results → "Drill into #3"
  → "What about cross-border?" → refined search using previous context
  Used in: Monitoring tab "Ask" input, any search bar in the UI


═══════════════════════════════════════════════════════════════════════
                       2 WORKFLOWS (Single-Shot)
═══════════════════════════════════════════════════════════════════════

WORKFLOW 1: "NPA Classify + Predict"
Agents: Classification (#4) + ML Prediction (#6)
Purpose: Score NPA, assign track, predict outcome — one execution

  [Start: npa_id, npa_context, user_id]
     │
     ▼
  [Agent Node: Classification]
     Tools (7):
       - classify_get_criteria
       - classify_assess_domains
       - classify_score_npa
       - classify_determine_track
       - classify_get_assessment
       - get_npa_by_id
       - audit_log_action
     │
     ▼
  [Code Node: Extract classification result + feed to prediction]
     │
     ▼
  [Agent Node: ML Prediction]
     Tools (3):
       - get_npa_by_id (re-reads with classification data now saved)
       - search_kb_documents (historical comparison)
       - audit_log_action
     │
     ▼
  [End: JSON output matching ClassificationResult + MLPrediction]

  Jurisdiction tools also available:
    - get_jurisdiction_rules
    - adapt_classification_weights

───────────────────────────────────────────────────────────────────────

WORKFLOW 2: "NPA Ops Pipeline"
Agents: AutoFill (#5) + Risk (#7) + Doc Lifecycle (#10) + Monitoring (#11) + Notification (#13)
Purpose: All single-shot operations, routed by operation parameter

  [Start: npa_id, operation, npa_context, user_id]
     │
     ▼
  [IF/ELSE: operation]
     │
     ├─ "autofill" ────────→ [Agent: AutoFill Specialist]
     │                         Tools (7):
     │                           - autofill_get_template_fields
     │                           - autofill_populate_field
     │                           - autofill_populate_batch
     │                           - autofill_get_form_data
     │                           - autofill_get_field_options
     │                           - search_kb_documents
     │                           - audit_log_action
     │
     ├─ "risk_assessment" ─→ [Agent: Risk Specialist]
     │                         Tools (8):
     │                           - risk_run_assessment
     │                           - risk_get_market_factors
     │                           - risk_add_market_factor
     │                           - risk_get_external_parties
     │                           - validate_prerequisites
     │                           - get_prerequisite_categories
     │                           - save_risk_check_result
     │                           - audit_log_action
     │                         Jurisdiction tools also available:
     │                           - get_jurisdiction_rules
     │                           - adapt_classification_weights
     │
     ├─ "check_documents" ─→ [Agent: Document Lifecycle]
     │                         Tools (5):
     │                           - check_document_completeness
     │                           - upload_document_metadata
     │                           - get_document_requirements
     │                           - validate_document
     │                           - audit_log_action
     │
     ├─ "run_monitoring" ──→ [Agent: Monitoring]
     │                         Tools (7):
     │                           - get_performance_metrics
     │                           - check_breach_thresholds
     │                           - create_breach_alert
     │                           - get_monitoring_thresholds
     │                           - get_post_launch_conditions
     │                           - update_condition_status
     │                           - audit_log_action
     │
     └─ "send_notification" → [Agent: Notification]
                                Tools (4):
                                  - get_pending_notifications
                                  - send_notification
                                  - mark_notification_read
                                  - audit_log_action
     │
     ▼
  [End: JSON output matching the relevant TypeScript interface]

═══════════════════════════════════════════════════════════════════════
                       2 TOOL-ONLY AGENTS (No Dify App)
═══════════════════════════════════════════════════════════════════════

AUDIT TRAIL (#14):
  Not a Dify app. The tools audit_log_action, audit_get_trail,
  check_audit_completeness, generate_audit_report are assigned
  to EVERY agent node above. Every action is logged automatically.

JURISDICTION ADAPTER (#15):
  Not a Dify app. The tools get_npa_jurisdictions, get_jurisdiction_rules,
  adapt_classification_weights are assigned to Classification and Risk
  agent nodes. Called when cross-border NPAs are detected.
```

---

## Part 4: The Data Contract

This is the bridge between Dify and Angular. Every Dify app MUST return JSON that Angular can parse.

### For Chatflows (Pattern A + C): Metadata-Wrapped Responses

The Orchestrator's Response Formatter LLM wraps every response:

```json
{
  "answer": "Human-readable message the user sees as chat text...",
  "metadata": {
    "agent_action": "SHOW_CLASSIFICATION",
    "agent_id": "CLASSIFIER",
    "payload": { ... matches TypeScript interface exactly ... }
  }
}
```

**`agent_action` → Angular display component mapping:**

| agent_action | TypeScript Interface | Angular Component | Used In |
|-------------|---------------------|-------------------|---------|
| `SHOW_CLASSIFICATION` | `ClassificationResult` | `<app-classification-result>` | Chat inline card |
| `SHOW_RISK` | `RiskAssessment` | `<app-risk-assessment-result>` | Chat inline card |
| `SHOW_PREDICTION` | `MLPrediction` | `<app-ml-prediction-result>` | Chat inline card |
| `HARD_STOP` | `{ prohibitedMatch }` | Inline alert (no component) | Chat inline card |
| `SHOW_AUTOFILL` | `AutoFillSummary` | `<app-autofill-summary>` | Chat inline card |
| `SHOW_GOVERNANCE` | `GovernanceState` | `<app-governance-status>` | Chat inline card |
| `SHOW_MONITORING` | `MonitoringResult` | `<app-monitoring-alerts>` | Chat inline card |
| `SHOW_KB_RESULTS` | `KBSearchResult[]` | `<app-kb-search-results>` | Chat inline card |
| `SHOW_DOC_STATUS` | `DocCompletenessResult` | `<app-doc-completeness>` | Chat inline card |
| `ASK_CLARIFICATION` | `{ question: string }` | Text bubble with prompt | Chat inline |
| `FINALIZE_DRAFT` | `{ npa_id, summary }` | Success card with link | Chat inline |

### For Workflows (Pattern B): Direct JSON Responses

Workflows called from NPA Detail pages return raw typed JSON — no metadata wrapper needed:

```json
// POST /api/dify/workflow { agent: "ML_PREDICT", inputs: { npa_id } }
// Returns:
{
  "approvalLikelihood": 78,
  "timelineDays": 4.2,
  "bottleneckDept": "Finance",
  "riskScore": 42,
  "features": [
    {"name": "Product Complexity", "importance": 0.85, "value": "High"}
  ],
  "comparisonInsights": ["Similar to TSG1917 (approved in 3.8 days)"]
}
```

Angular binds directly: `this.mlPrediction = response;` → `<app-ml-prediction-result [result]="mlPrediction">`

### For Conversational Chatflows Called Independently (Pattern C)

KB Explorer and Diligence return their own format — no orchestrator wrapping:

```json
// KB Explorer response:
{
  "answer": "Here are 5 documents matching 'FX Option regulations'...",
  "metadata": {
    "agent_action": "SHOW_KB_RESULTS",
    "payload": [
      {"title": "MAS Notice 656", "snippet": "...", "similarity": 0.94, "source": "regulatory"},
      {"title": "FX Option Policy v3", "snippet": "...", "similarity": 0.87, "source": "internal"}
    ]
  }
}

// Diligence response:
{
  "answer": "Under MAS Notice 656, volume breaches exceeding 10% require...",
  "metadata": {
    "agent_action": "SHOW_DILIGENCE",
    "payload": {
      "answer": "Under MAS Notice 656...",
      "citations": [{"source": "MAS Notice 656, Section 4.3", "snippet": "...", "relevance": 0.94}],
      "relatedQuestions": ["What is the escalation path?", "Show PIR status"]
    }
  }
}
```

---

## Part 5: The Critical Challenge — Structured JSON from LLMs

The hardest part of this entire system is getting Dify's LLM nodes to **consistently return valid JSON** that matches TypeScript interfaces.

**The problem:** LLMs drift. They add extra fields, change casing, wrap in markdown code fences, or occasionally return prose instead of JSON.

**Mitigation layers (defense in depth):**

### Layer 1: Strict Output Contracts in System Prompts

Every agent node's system prompt ends with an explicit JSON schema:

```
CRITICAL OUTPUT RULES:
1. Your FINAL response MUST be valid JSON — no markdown, no explanation outside JSON
2. Follow this EXACT schema (every field required):
{
  "type": "NTG" | "Variation" | "Existing",
  "track": "Full NPA" | "NPA Lite" | "Evergreen" | "Prohibited",
  "overallConfidence": <number 0-100>,
  "scores": [ {"criterion": <string>, "score": <number>, "maxScore": <number>, "reasoning": <string>} ]
}
3. Do NOT add fields not in the schema
4. Do NOT wrap in markdown code fences
5. Do NOT include explanatory text outside the JSON object
```

### Layer 2: Dify Code Nodes for Validation

After every Agent Node, add a **Code Node** that validates and normalizes:

```python
import json

def main(agent_output: str) -> dict:
    # Strip markdown code fences if present
    cleaned = agent_output.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.split("\n", 1)[1].rsplit("```", 1)[0]

    try:
        data = json.loads(cleaned)
    except json.JSONDecodeError:
        return {"error": "Invalid JSON from agent", "raw": agent_output[:500]}

    # Validate required fields exist
    required = ["type", "track", "overallConfidence", "scores"]
    missing = [f for f in required if f not in data]
    if missing:
        return {"error": f"Missing fields: {missing}", "raw": agent_output[:500]}

    # Normalize types
    if isinstance(data.get("overallConfidence"), str):
        data["overallConfidence"] = float(data["overallConfidence"])

    return data
```

### Layer 3: Express Proxy Validation

`server/routes/dify-proxy.js` validates before forwarding to Angular:

```javascript
// After receiving Dify response, before sending to Angular:
function validateAgentResponse(agentId, data) {
    const schema = RESPONSE_SCHEMAS[agentId];
    if (!schema) return data; // no schema = pass through

    const errors = [];
    for (const field of schema.required) {
        if (!(field in data)) errors.push(`Missing: ${field}`);
    }

    if (errors.length > 0) {
        console.warn(`Agent ${agentId} response validation failed:`, errors);
        // Return partial data + error flag so UI can show fallback
        return { ...data, _validationErrors: errors };
    }
    return data;
}
```

### Layer 4: Angular Fallback Rendering

Display components handle missing/invalid data gracefully:

```html
<!-- Already built into every display component -->
<div *ngIf="!result" class="bg-gray-50 rounded-xl border p-8 text-center text-gray-500">
    <lucide-icon name="loader-2" class="w-6 h-6 mx-auto mb-2 animate-spin"></lucide-icon>
    <p class="text-sm">Agent results will appear once the agent runs.</p>
</div>
```

---

## Part 6: Deployment Phases

### Phase 0: Prerequisites (15 min)

```bash
# Dify running
cd ~/Documents/dify/docker && docker compose ps

# MCP REST server with 71 tools
curl http://localhost:3002/openapi.json | python3 -m json.tool | head -5

# MariaDB with 42 tables
mysql -h 127.0.0.1 -P 3306 -u npa_user -pnpa_password \
  -e "SELECT COUNT(*) as tables FROM information_schema.tables WHERE table_schema='npa_workbench';"

# Express proxy
curl http://localhost:3000/api/dify/agents/status
```

### Phase 1: Import 71 MCP Tools into Dify (10 min)

1. Dify → Settings → Model Provider → Add Anthropic API key → Claude Sonnet 4 as default
2. Tools → Custom Tools → Create → Name: `NPA Workbench MCP Tools`
3. Import from URL: `http://host.docker.internal:3002/openapi.json`
4. Auth: No Auth → Test `classify_get_criteria` → Save

### Phase 2: Build 2 Workflows — Bottom Up (30 min)

Build workflows first — they have no dependencies.

**Workflow 1: NPA Classify + Predict**

| Setting | Value |
|---------|-------|
| App Type | Workflow |
| Name | `NPA Classify + Predict` |
| Inputs | `npa_id` (String), `npa_context` (String), `user_id` (String) |
| Node 1 | Agent Node: Classification (7 tools + jurisdiction tools) |
| Node 2 | Code Node: Extract + validate classification JSON |
| Node 3 | Agent Node: ML Prediction (3 tools) |
| Node 4 | Code Node: Merge classification + prediction into single output |
| End | JSON matching `{ classification: ClassificationResult, prediction: MLPrediction }` |

**Workflow 2: NPA Ops Pipeline**

| Setting | Value |
|---------|-------|
| App Type | Workflow |
| Name | `NPA Ops Pipeline` |
| Inputs | `npa_id`, `operation`, `npa_context`, `user_id` |
| Node 1 | IF/ELSE on `operation` |
| Branches | `autofill` → Agent (7 tools), `risk_assessment` → Agent (8+2 tools), `check_documents` → Agent (5 tools), `run_monitoring` → Agent (7 tools), `send_notification` → Agent (4 tools) |
| End | JSON matching the relevant TypeScript interface per branch |

### Phase 3: Build 4 Specialist Chatflows (60 min)

Build these before the Orchestrator — it needs to call them.

**Chatflow 2: NPA Ideation** (15 min)

| Setting | Value |
|---------|-------|
| App Type | Chatflow |
| Name | `NPA Ideation` |
| Conv Variables | `npa_id` (String), `interview_step` (Number, default: 1), `collected_data` (String) |
| Node | Agent Node: Ideation Specialist — 8 tools |
| System Prompt | Full KB_Ideation_Agent.md + output contract |
| Answer | Agent response (conversational) |

**Chatflow 3: NPA Governance** (15 min)

| Setting | Value |
|---------|-------|
| App Type | Chatflow |
| Name | `NPA Governance` |
| Conv Variables | `npa_id`, `pending_action`, `loop_back_count` |
| Node | Agent Node: Governance Specialist — 13 tools |
| System Prompt | Full KB_Governance_Agent.md + output contract |

**Chatflow 4: Conversational Diligence** (15 min)

| Setting | Value |
|---------|-------|
| App Type | Chatflow |
| Name | `Conversational Diligence` |
| Conv Variables | `npa_id`, `topic_context` |
| Node | Agent Node: Diligence — 5 tools |
| System Prompt | Full KB_Conversational_Diligence.md + output contract |

**Chatflow 5: KB Explorer** (15 min)

| Setting | Value |
|---------|-------|
| App Type | Chatflow |
| Name | `KB Explorer` |
| Conv Variables | `search_context`, `last_results` |
| Node | Agent Node: KB Search — 4 tools |
| System Prompt | Full KB_Search_Agent.md + output contract |

### Phase 4: Build the Orchestrator Chatflow (30 min)

Build this LAST — it calls all 6 apps above.

**Chatflow 1: NPA Orchestrator**

| Setting | Value |
|---------|-------|
| App Type | Chatflow |
| Name | `NPA Orchestrator` |
| Conv Variables | `current_npa_id`, `current_stage`, `user_role`, `session_id`, `last_agent`, `last_next_action` |

Node flow:
```
[Start] → [LLM: Intent Classifier] → [IF/ELSE Router]
  ├─ Chatflow calls: HTTP POST to Dify chat-messages API (for Ideation, Governance, Diligence, KB)
  ├─ Workflow calls: HTTP POST to Dify workflows/run API (for Classify, Ops Pipeline)
  └─ General: Agent Node with KB tools
→ [Variable Assigner] → [LLM: Response Formatter] → [Answer]
```

**Critical: Calling Chatflows from Chatflows**

When the Orchestrator needs to call the Ideation Chatflow (not a Workflow), the HTTP Request node uses:
```
POST http://host.docker.internal/v1/chat-messages
Authorization: Bearer {ideation-chatflow-api-key}
Body: {
  "inputs": {},
  "query": "{{user_message_with_context}}",
  "response_mode": "blocking",
  "conversation_id": "{{ideation_conversation_id}}",  // empty first time, reuse for multi-turn
  "user": "{{sys.user_id}}"
}
```

This preserves the Ideation Chatflow's own conversation memory while being orchestrated externally.

### Phase 5: Wire Express + Angular (15 min)

**Update `server/.env`:**
```env
DIFY_BASE_URL=http://localhost/v1

# Chatflows (5 apps — each has its own API key)
DIFY_KEY_MASTER_COO=app-xxxxx        # NPA Orchestrator chatflow
DIFY_KEY_NPA_ORCH=app-xxxxx          # Same as MASTER_COO (fused)
DIFY_KEY_IDEATION=app-xxxxx          # NPA Ideation chatflow
DIFY_KEY_GOVERNANCE=app-xxxxx        # NPA Governance chatflow
DIFY_KEY_DILIGENCE=app-xxxxx         # Conversational Diligence chatflow
DIFY_KEY_KB_SEARCH=app-xxxxx         # KB Explorer chatflow

# Workflows (2 apps)
DIFY_KEY_CLASSIFIER=app-xxxxx        # Classify+Predict workflow
DIFY_KEY_ML_PREDICT=app-xxxxx        # Same as CLASSIFIER (fused)
DIFY_KEY_AUTOFILL=app-xxxxx          # Ops Pipeline workflow
DIFY_KEY_RISK=app-xxxxx              # Same as AUTOFILL (fused — operation param differs)
DIFY_KEY_DOC_LIFECYCLE=app-xxxxx     # Same as AUTOFILL (fused)
DIFY_KEY_MONITORING=app-xxxxx        # Same as AUTOFILL (fused)
DIFY_KEY_NOTIFICATION=app-xxxxx      # Same as AUTOFILL (fused)
```

**Update Express proxy** to route Chatflow agents to chat-messages API and Workflow agents to workflows/run API.

**Toggle Angular:** `useMockDify = false` in `dify.service.ts`

**Update `AGENT_REGISTRY`:** Add Audit Trail (#14) and Jurisdiction Adapter (#15) to show all 15 agents in the fleet status panel.

### Phase 6: Test (30 min)

**Test 1: Individual apps** — Use Dify Studio "Run" button for each of the 7 apps

**Test 2: Orchestrator conversation** — 8-turn NPA creation flow

**Test 3: Pattern B** — Navigate to NPA Detail, verify 6 panels populate

**Test 4: Pattern C** — Use Monitoring tab "Ask" input, verify KB Explorer conversation works

**Test 5: Express proxy** — curl commands against all endpoints

**Test 6: Angular full flow** — End-to-end from UI

---

## Summary

| Phase | What | Time |
|-------|------|------|
| 0 | Verify prerequisites | 15 min |
| 1 | Import 71 MCP tools | 10 min |
| 2 | Build 2 Workflows (Classify+Predict, Ops Pipeline) | 30 min |
| 3 | Build 4 Specialist Chatflows (Ideation, Governance, Diligence, KB) | 60 min |
| 4 | Build Orchestrator Chatflow (calls all 6 apps) | 30 min |
| 5 | Wire Express + Angular | 15 min |
| 6 | Test all patterns | 30 min |
| **Total** | **7 Dify apps, 71 tools, 15 agents, 3 UX patterns** | **~3 hours** |
