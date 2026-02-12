# Multi-Agent NPA System Architecture
## DBS COO Command Hub - Agent-First Design

---

## 1. System Overview

```
                          +---------------------------+
                          |     Angular Frontend      |
                          |   (COO Command Hub UI)    |
                          +-------------+-------------+
                                        |
                                        | HTTP / WebSocket
                                        v
                          +---------------------------+
                          |    Express API Gateway     |
                          |      (Port 3000)          |
                          +-------------+-------------+
                                        |
                      +-----------------+-----------------+
                      |                                   |
                      v                                   v
          +-----------+-----------+           +-----------+-----------+
          |    MariaDB (npa_db)   |           |   Dify Agent Platform |
          |   Structured State    |           |   LLM Orchestration   |
          +-----------------------+           +-----------+-----------+
                                                          |
                                              +-----------+-----------+
                                              |  TIER 1: Master COO   |
                                              |    Orchestrator       |
                                              +-----------+-----------+
                                                          |
                                              +-----------+-----------+
                                              |  TIER 2: NPA Domain   |
                                              |    Orchestrator       |
                                              +-----------+-----------+
                                                          |
                    +----------+----------+----------+----+----+----------+----------+----------+
                    |          |          |          |         |          |          |          |
                    v          v          v          v         v          v          v          v
                 Ideation  Classif.  Template   Risk     Governance  Conv.     Document   Monitoring
                 Agent     Agent     AutoFill   Agent    Agent       Diligence Agent      Agent
                                     Agent                          Agent     (NEW)      (NEW)
                    |          |          |          |         |          |          |          |
                    +----------+----------+----------+---------+----------+----------+----------+
                                                          |
                                              +-----------+-----------+
                                              |   TIER 4: Shared      |
                                              |   Utilities           |
                                              |  - KB Search (RAG)    |
                                              |  - Notification Agent |
                                              |  - Audit Trail Agent  |
                                              |  - Jurisdiction Adapt.|
                                              +-----------------------+
```

---

## 2. Agent Roster (13 Agents, 4 Tiers)

### TIER 1 - Global Router
| # | Agent | Role | Trigger |
|---|-------|------|---------|
| 1 | **Master COO Orchestrator** | Air Traffic Controller - routes user messages to correct domain | Every user message enters here first |

### TIER 2 - Domain Router
| # | Agent | Role | Trigger |
|---|-------|------|---------|
| 2 | **NPA Domain Orchestrator** | NPA lifecycle coordinator - routes to correct sub-agent based on NPA stage | Master Orchestrator identifies NPA intent |

### TIER 3 - Execution Agents (9)
| # | Agent | NPA Stage | Role |
|---|-------|-----------|------|
| 3 | **Ideation Agent** | Phase 0: Ideation | Conversational intake, 7 discovery questions, creates draft NPA |
| 4 | **Classification Agent** | Phase 0: Classification | 2-stage classification (Product Type + Approval Track), 20 NTG criteria |
| 5 | **Template AutoFill Agent** | Phase 1: Discovery | Fills 37/47 fields, field lineage (AUTO/ADAPTED/MANUAL), confidence scoring |
| 6 | **Risk Agent** | Phase 2: Risk Assessment | 4-layer prohibited check (Policy > Regulatory > Sanctions > Dynamic), HARD STOP |
| 7 | **ML Prediction Agent** | Phase 2: Prediction | XGBoost 28-feature model: approval likelihood, timeline, bottleneck detection |
| 8 | **Governance Agent** | Phase 3: Sign-Off | Approval routing, parallel sign-offs, loop-back circuit breaker (3-strike), SLA monitoring |
| 9 | **Conversational Diligence** | Cross-phase | Real-time Q&A, 5 interaction modes, citation transparency, smart clarification |
| 10 | **Document Lifecycle Agent** | Cross-phase | **(NEW)** Document assembly, completeness validation, version tracking, regulatory packages |
| 11 | **Post-Launch Monitoring Agent** | Phase 5: PIR | **(NEW)** KPI breach detection, covenant monitoring, drift detection, auto-escalation |

### TIER 4 - Shared Utilities (3)
| # | Agent | Scope | Role |
|---|-------|-------|------|
| 12 | **KB Search Agent (RAG)** | Cross-domain | Semantic search, 1,784 historical NPAs, 3 modes (user/agent/contextual) |
| 13 | **Notification Agent** | Cross-domain | **(NEW)** SLA alerts, deadline warnings, escalation comms, status digests |
| 14 | **Audit Trail Agent** | Cross-domain | **(ENHANCED)** Decision reasoning chains, confidence scores, model versions, compliance-grade immutable log |

> **Jurisdiction Adapter** deferred to Phase 1 (post-Singapore rollout). Schema supports it now.

---

## 3. Mock Conversation Mapped to Agent Architecture

Below is the **TSG2026-015 CNY IRS Swap Connect** mock conversation mapped step-by-step to which agent fires, what it reads/writes, and what the user sees.

---

### Phase 0: Product Ideation (22 minutes)

```
USER: "I need to create an NPA for CNY Interest Rate Swaps via Swap Connect"
  │
  ▼
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 1: MASTER COO ORCHESTRATOR (Tier 1)                           │
│                                                                     │
│ ACTION:  Tokenize message → extract "NPA", "create", "product"     │
│ ROUTE:   NPA_DOMAIN_AGENT (confidence: 0.97)                       │
│ CONTEXT: Packages user_context, conversation_history, entities      │
│ DB:      INSERT agent_sessions (new session)                        │
│ DB:      INSERT agent_messages (user message)                       │
│ AUDIT:   Log routing decision + confidence                         │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 2: NPA DOMAIN ORCHESTRATOR (Tier 2)                           │
│                                                                     │
│ ACTION:  Detect intent = "create new NPA"                          │
│ ROUTE:   IDEATION_AGENT (sub-agent)                                │
│ STATE:   Phase 0 initiated                                         │
│ DB:      INSERT npa_projects (status=DRAFT, stage=IDEATION)        │
│ DB:      INSERT npa_workflow_states (stage=IDEATION, status=ACTIVE) │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 3: IDEATION AGENT (Tier 3) ← 7 Discovery Questions           │
│                                                                     │
│ Q1: Product structure → "FR007, SHIBOR 3M, 1-5Y tenors"           │
│ Q2: Business context  → "SG FX desk, risk mgmt, RMB 500M/month"   │
│ Q3: Operational       → "Bloomberg execution, existing ISDA"       │
│ Q4: Risk/Regulatory   → "IG only (A-), RMB 2B gross, Q1 target"   │
│                                                                     │
│ PARALLEL CALLS (during conversation):                               │
│   → KB SEARCH AGENT: "CNY IRS Swap Connect" → TSG2339 (95% match) │
│   → RISK AGENT: Quick prohibited check → PASSED                    │
│                                                                     │
│ DB WRITES:                                                          │
│   UPDATE npa_projects (title, product_category, npa_type, etc.)    │
│   INSERT npa_form_data × 7 (field answers, lineage=MANUAL)         │
│   INSERT npa_jurisdictions (SG, HK, CN)                            │
│   INSERT agent_messages × 8 (full conversation)                    │
│                                                                     │
│ OUTPUT → Structured product summary to user                        │
│ HANDOFF → CLASSIFICATION_AGENT                                     │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 4: CLASSIFICATION AGENT (Tier 3) ← 2-Stage Classification     │
│                                                                     │
│ STAGE 1 - Product Type:                                            │
│   INPUT:  Product attributes from Ideation                         │
│   LOGIC:  20 NTG criteria check → 4/20 met (below 6 threshold)    │
│           8 Variation questions → Material change detected          │
│   RESULT: "Existing (Variation)" with 87% confidence               │
│                                                                     │
│ STAGE 2 - Approval Track:                                          │
│   INPUT:  Classification + cross-border flag + notional             │
│   LOGIC:  Variation + cross-border = NPA Lite + enhancements       │
│   RESULT: "NPA_LITE" approval track                                │
│                                                                     │
│ DB WRITES:                                                          │
│   INSERT npa_classification_scorecards (score, tier, breakdown)    │
│   UPDATE npa_projects (npa_type=Variation, approval_track=NPA_LITE)│
│                                                                     │
│ AUDIT:   Log classification decision + 20 criteria scores          │
│ OUTPUT → Classification card shown to user                         │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 5: RISK AGENT (Tier 3) ← 4-Layer Prohibited Check            │
│                                                                     │
│ LAYER 1 - Internal Policy:  CNY IRS → ALLOWED                     │
│ LAYER 2 - Regulatory:       MAS/PBOC/SFC → ALLOWED (with conds)   │
│ LAYER 3 - Sanctions:        OFAC/EU/UN → CLEAR                    │
│ LAYER 4 - Dynamic:          No emerging restrictions               │
│                                                                     │
│ RESULT: PASSED (all 4 layers clear)                                │
│                                                                     │
│ DB WRITES:                                                          │
│   INSERT npa_intake_assessments (domain=RISK, status=PASS)         │
│   INSERT npa_intake_assessments (domain=LEGAL, status=PASS)        │
│                                                                     │
│ NOTE: If ANY layer = FAIL → HARD STOP, NPA terminated immediately  │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           ▼
USER: "Yes, generate the NPA draft"
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 6: TEMPLATE AUTOFILL AGENT (Tier 3)                           │
│                                                                     │
│ INPUT:   Classification (Variation/NPA_LITE) + TSG2339 template    │
│                                                                     │
│ CALLS:                                                              │
│   → KB SEARCH: Retrieve TSG2339 field values                       │
│   → ML PREDICTION: Scale risk parameters for RMB 500M volume       │
│                                                                     │
│ FILL LOGIC (3 buckets):                                            │
│   GREEN (37 fields, 78%): Direct copy or trivial adapt from TSG2339│
│     - Product Name, BU, Booking System, Clearing, Regulatory       │
│     - Each tagged: lineage=AUTO, confidence=95-100%                │
│   YELLOW (7 fields, 15%): Adapted with scaling logic               │
│     - Volume (200M→500M), Risk Limits, Benchmarks (add SHIBOR 3M) │
│     - Each tagged: lineage=ADAPTED, confidence=85-92%              │
│   RED (3 fields, 7%): Cannot fill, needs human                     │
│     - Term Sheet, Counterparty Names, Go-Live Date                 │
│     - Each tagged: lineage=MANUAL, confidence=0%                   │
│                                                                     │
│ DB WRITES:                                                          │
│   INSERT npa_form_data × 47 (all fields with lineage + confidence) │
│   UPDATE npa_projects (template_name=TSG2339)                      │
│   UPDATE npa_workflow_states (IDEATION→COMPLETED)                  │
│   INSERT npa_workflow_states (DISCOVERY→ACTIVE)                    │
│                                                                     │
│ OUTPUT → Draft summary + manual field list to user                 │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 7: ML PREDICTION AGENT (Tier 3)                               │
│                                                                     │
│ INPUT:   28-feature vector (product attrs + classification + desk)  │
│                                                                     │
│ PREDICTIONS:                                                        │
│   1. Approval Likelihood: 89% (high - existing variation)          │
│   2. Timeline: 6-8 days (cross-border adds 1-2 days)              │
│   3. Bottleneck: Finance (transfer pricing = longest path)         │
│                                                                     │
│ DB WRITES:                                                          │
│   UPDATE npa_projects (predicted_approval_likelihood=89,            │
│     predicted_timeline_days=7, predicted_bottleneck=Finance)        │
│                                                                     │
│ OUTPUT → Prediction card shown to user                             │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 8: DOCUMENT LIFECYCLE AGENT (Tier 3) ← NEW                   │
│                                                                     │
│ TRIGGER: NPA draft generated, entering workflow                    │
│                                                                     │
│ ACTIONS:                                                            │
│   1. Generate document checklist from ref_document_rules           │
│      - 3 CRITICAL (blocks approval)                                │
│      - 3 IMPORTANT (may delay)                                     │
│      - 3 OPTIONAL (good to have)                                   │
│   2. Track upload status for each document                         │
│   3. Auto-validate uploaded documents (OCR + completeness)         │
│   4. Flag missing documents before each phase gate                 │
│                                                                     │
│ DB WRITES:                                                          │
│   INSERT npa_documents × 9 (checklist items, status=PENDING)      │
│                                                                     │
│ ONGOING: Watches for uploads, validates, updates status            │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
USER: "Proceed to workflow"
                           │
                           ▼
```

### Phase 1: Ingestion & Triage (Day 1-2)

```
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 9: GOVERNANCE AGENT (Tier 3) ← Checker Review                │
│                                                                     │
│ ACTION:  Assign Checker (Sarah Chen) for NPA review               │
│ SLA:     4 hours (17:00 deadline)                                  │
│                                                                     │
│ DB WRITES:                                                          │
│   INSERT npa_signoffs (party=CHECKER, approver=Sarah Chen,         │
│     status=PENDING, sla_deadline=17:00)                            │
│   UPDATE npa_workflow_states (DISCOVERY→COMPLETED)                 │
│   INSERT npa_workflow_states (DCE_REVIEW→ACTIVE)                   │
│                                                                     │
│ PARALLEL TRIGGERS:                                                  │
│   → NOTIFICATION AGENT: Alert Sarah Chen (email + in-app)          │
│   → DOCUMENT AGENT: Validate document completeness for checker     │
│   → CONV. DILIGENCE: Standby for checker questions                 │
│                                                                     │
│ IF checker has question:                                           │
│   → Smart route to CONV. DILIGENCE (AI answers 68% of questions)  │
│   → OR route back to MAKER (if human judgment needed)              │
│                                                                     │
│ IF checker approves:                                               │
│   → Advance to Phase 2 (Sign-Off Orchestration)                   │
│                                                                     │
│ IF checker rejects:                                                │
│   → INSERT npa_loop_backs (type=CHECKER_REJECTION)                 │
│   → Loop back to Maker (loop_back_count++)                         │
│   → IF loop_back_count >= 3 → CIRCUIT BREAKER → Escalate to COO   │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│ NOTIFICATION AGENT (Tier 4) ← NEW, fires throughout               │
│                                                                     │
│ 15:45 → PBOC deadline alert (10 days before trading)               │
│ 16:15 → SLA warning (90% of checker SLA consumed)                 │
│ 16:30 → Optimization tip (CFETS registration can start parallel)  │
│                                                                     │
│ DB WRITES:                                                          │
│   INSERT npa_audit_log (action_type=NOTIFICATION_SENT)             │
│   INSERT npa_breach_alerts (if SLA breached)                       │
└─────────────────────────────────────────────────────────────────────┘
```

### Phase 2: Sign-Off Orchestration (Day 2-5)

```
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 10: GOVERNANCE AGENT ← Approval Routing Engine                │
│                                                                     │
│ INPUT:  Risk level + notional + cross-border + classification      │
│                                                                     │
│ ROUTING DECISION (5 parties):                                      │
│   PARALLEL TRACK A (Day 2-4):                                      │
│     ├── Credit (Jane Tan)    - ML predicts 1.5 days               │
│     ├── MLR (David Wong)     - ML predicts 1.5 days               │
│     └── Operations (Lisa Tan)- ML predicts 1 day                  │
│                                                                     │
│   SEQUENTIAL AFTER TRACK A:                                        │
│     ├── Finance (Mark Chen)  - ML predicts 2 days (bottleneck)    │
│     └── Technology (Alex Kumar) - ML predicts 1 day               │
│                                                                     │
│ OPTIMIZATION:                                                       │
│   - Finance gets "heads-up" during checker phase (pre-seeding)     │
│   - Credit + MLR + Ops run in parallel (saves 0.5 days)           │
│   - Auto-escalation at 36h per approver                           │
│                                                                     │
│ DB WRITES:                                                          │
│   INSERT npa_signoffs × 5 (one per approver, status=PENDING)      │
│   UPDATE npa_workflow_states (DCE_REVIEW→COMPLETED)                │
│   INSERT npa_workflow_states (SIGN_OFFS→ACTIVE)                    │
│                                                                     │
│ FOR EACH APPROVER:                                                  │
│   → NOTIFICATION AGENT: Send approval request                     │
│   → KB SEARCH: Pre-load similar deal precedents for each reviewer │
│   → ML PREDICTION: Per-department timeline forecast               │
│   → CONV. DILIGENCE: Standby for approver questions               │
│                                                                     │
│ LOOP-BACK HANDLING:                                                │
│   IF approver asks clarification question:                         │
│     → CONV. DILIGENCE auto-answers (89% prevention rate)          │
│     → IF can't answer → route to MAKER                            │
│   IF approver rejects:                                             │
│     → INSERT npa_loop_backs (type=APPROVAL_CLARIFICATION)         │
│     → Targeted loop-back (only affected section, not full NPA)    │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           ▼ (all 5 approved)
```

### Phase 3: Launch Preparation (Day 5-7)

```
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 11: DOCUMENT LIFECYCLE AGENT ← Launch Package Assembly        │
│                                                                     │
│ ACTIONS:                                                            │
│   1. Verify all CRITICAL documents uploaded and validated          │
│   2. Assemble final NPA submission package                         │
│   3. Generate regulatory filing package (PBOC notification)        │
│   4. Create audit-ready compliance bundle                          │
│                                                                     │
│ LAUNCH CHECKLIST (tracked by Governance Agent):                    │
│   □ PBOC notification submitted                                    │
│   □ CFETS trader registration complete                             │
│   □ Bloomberg platform configured                                  │
│   □ Risk limits live in Murex                                      │
│   □ Staff training signed off                                      │
│   □ UAT passed                                                     │
│                                                                     │
│ DB WRITES:                                                          │
│   UPDATE npa_documents (validation_status for each)                │
│   INSERT npa_post_launch_conditions (from approval conditions)     │
│   UPDATE npa_projects (status=LAUNCHING)                           │
│   UPDATE npa_workflow_states (LAUNCH_PREP→ACTIVE)                  │
│                                                                     │
│ → NOTIFICATION AGENT: Launch readiness summary to all stakeholders │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           ▼ (all checklist items complete)
                           │
        UPDATE npa_projects (launched_at=NOW(), status=LAUNCHED)
        UPDATE npa_workflow_states (LAUNCH_PREP→COMPLETED, PIR→ACTIVE)
```

### Phase 4-5: Post-Launch Monitoring (Ongoing)

```
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 12: POST-LAUNCH MONITORING AGENT (Tier 3) ← NEW              │
│                                                                     │
│ TRIGGER: Product launched (npa_projects.launched_at IS NOT NULL)    │
│ CADENCE: Continuous monitoring with daily snapshots                 │
│                                                                     │
│ MONITORS:                                                           │
│   1. Trading volume vs projections (RMB 500M target)               │
│   2. P&L performance vs business case                              │
│   3. Risk limit utilization (VaR, counterparty exposure)           │
│   4. Breach detection (threshold violations)                       │
│   5. Post-launch condition compliance                              │
│   6. Covenant adherence from conditional approvals                 │
│                                                                     │
│ DB READS:                                                           │
│   npa_performance_metrics (volume, PnL, VaR)                      │
│   npa_breach_alerts (active breaches)                              │
│   npa_post_launch_conditions (condition status)                    │
│                                                                     │
│ DB WRITES:                                                          │
│   INSERT npa_performance_metrics (daily snapshot)                  │
│   INSERT npa_breach_alerts (if threshold exceeded)                 │
│   UPDATE npa_projects (pir_status based on performance)            │
│                                                                     │
│ ESCALATION:                                                         │
│   - WARNING: Volume < 70% projection → NOTIFICATION AGENT alert   │
│   - CRITICAL: Risk limit > 90% → Auto-escalate to Risk Committee  │
│   - BREACH: Any hard limit violated → HARD STOP + COO notification│
│                                                                     │
│ PIR REVIEW:                                                         │
│   At pir_due_date:                                                 │
│     → Generate PIR report (performance vs business case)           │
│     → IF underperforming → Trigger amendment loop-back (Type 4)    │
│     → IF performing → Close PIR, mark product as BAU               │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 4. Inter-Agent Communication Map

```
                    ┌──────────────────┐
         ┌─────────│  Master COO      │─────────┐
         │         │  Orchestrator    │         │
         │         └────────┬─────────┘         │
         │                  │                    │
         │         ┌────────▼─────────┐         │
         │    ┌────│  NPA Domain      │────┐    │
         │    │    │  Orchestrator    │    │    │
         │    │    └────────┬─────────┘    │    │
         │    │             │              │    │
    ┌────▼────▼─┐  ┌───────▼────┐  ┌─────▼────▼──┐
    │ Ideation  │  │ Classif.   │  │ Governance   │
    │ Agent     │  │ Agent      │  │ Agent        │
    └─────┬─────┘  └─────┬──────┘  └──┬───┬───┬──┘
          │              │             │   │   │
          │   ┌──────────┘             │   │   │
          │   │                        │   │   │
    ┌─────▼───▼─┐  ┌──────────┐  ┌───▼───┘   │
    │ Template  │  │ Risk     │  │ Conv.      │
    │ AutoFill  │  │ Agent    │  │ Diligence  │
    └─────┬─────┘  └──────────┘  └────────────┘
          │                            │
    ┌─────▼─────┐  ┌──────────┐  ┌────▼───────┐
    │ ML        │  │ Document │  │ Monitoring │
    │ Prediction│  │ Lifecycle│  │ Agent      │
    └───────────┘  └──────────┘  └────────────┘

    ═══════════════════════════════════════════
    TIER 4 SHARED (called by any Tier 3 agent)
    ═══════════════════════════════════════════
    ┌───────────┐  ┌──────────┐  ┌────────────┐
    │ KB Search │  │ Notific. │  │ Audit Trail│
    │ (RAG)     │  │ Agent    │  │ Agent      │
    └───────────┘  └──────────┘  └────────────┘
```

### Call Matrix

| Caller → | KB Search | Notification | Audit Trail | Conv. Diligence | ML Prediction |
|----------|-----------|-------------|-------------|-----------------|---------------|
| **Ideation** | calls (find similar NPAs) | - | logs | - | - |
| **Classification** | calls (precedent lookup) | - | logs | - | - |
| **Template AutoFill** | calls (retrieve field values) | - | logs | - | calls (scale params) |
| **Risk** | calls (policy docs) | calls (if HARD STOP) | logs | - | - |
| **Governance** | calls (deal precedents) | calls (SLA alerts, approvals) | logs | calls (answer questions) | calls (per-dept forecast) |
| **Document** | calls (doc templates) | calls (missing doc alerts) | logs | - | - |
| **Monitoring** | - | calls (breach alerts) | logs | - | calls (drift detection) |

---

## 5. Data Flow: Complete NPA Lifecycle

```
TIME     AGENT                    DB TABLE                          UI COMPONENT
─────    ─────                    ────────                          ────────────
09:14    Master Orchestrator      agent_sessions (INSERT)           ChatInterface
         │
09:14    NPA Domain Orchestrator  npa_projects (INSERT DRAFT)       ChatInterface
         │
09:14    Ideation Agent           npa_form_data × 7 (INSERT)       ChatInterface
─09:20   (7 questions)            agent_messages × 8 (INSERT)       (typing indicators)
         │                        npa_jurisdictions (INSERT)
         │
09:20    Classification Agent     npa_classification_scorecards     ClassificationCard
         │                        npa_projects (UPDATE type/track)
         │
09:20    Risk Agent               npa_intake_assessments × 2        RiskCheckPanel
         │
09:21    Template AutoFill        npa_form_data × 47 (UPSERT)      TemplateFieldStatus
         │                        npa_workflow_states (UPDATE)
         │
09:21    ML Prediction            npa_projects (UPDATE predictions)  PredictionCard
         │
09:21    Document Agent           npa_documents × 9 (INSERT)        DocumentChecklist
         │
09:22    Governance Agent         npa_signoffs (INSERT checker)      WorkflowDashboard
         │                        npa_workflow_states (UPDATE)
         │
─Day 2─  Governance Agent         npa_signoffs × 5 (INSERT)         ApprovalPanel
         │                        npa_loop_backs (INSERT if needed)
         │
─Day 6─  Document Agent           npa_documents (UPDATE validated)   LaunchChecklist
         │                        npa_post_launch_conditions
         │
─Day 7─  Monitoring Agent         npa_performance_metrics (INSERT)   MonitoringDashboard
         │                        npa_breach_alerts (INSERT)
         │
─Day 90─ Monitoring Agent         npa_projects (UPDATE pir_status)   PIRReport
```

---

## 6. Agent State Machine

Each NPA progresses through these stages. Each stage has an **owning agent**.

```
  ┌─────────────┐
  │  IDEATION   │  Owner: Ideation Agent
  │  (Phase 0)  │  Duration: 10-30 min
  └──────┬──────┘
         │ User confirms "generate draft"
         ▼
  ┌─────────────┐
  │CLASSIFICATION│  Owner: Classification Agent
  │  (Phase 0)  │  Duration: < 1 min (automated)
  └──────┬──────┘
         │ Classification result
         ▼
  ┌─────────────┐
  │ RISK CHECK  │  Owner: Risk Agent
  │  (Phase 0)  │  Duration: < 1 sec
  └──────┬──────┘
         │ PASS ──────────────────┐
         │                        │ FAIL → HARD STOP (NPA terminated)
         ▼                        │
  ┌─────────────┐                 │
  │  TEMPLATE   │  Owner: Template AutoFill + ML Prediction
  │  AUTOFILL   │  Duration: 1-5 min
  │  (Phase 1)  │
  └──────┬──────┘
         │ Draft generated
         ▼
  ┌─────────────┐
  │  CHECKER    │  Owner: Governance Agent
  │  REVIEW     │  Duration: 2-4 hours (SLA)
  │  (Phase 1)  │
  └──────┬──────┘
         │ Approved ───────────┐
         │                     │ Rejected → LOOP BACK (max 3)
         ▼                     │            → Circuit breaker → COO
  ┌─────────────┐              │
  │  SIGN-OFF   │  Owner: Governance Agent
  │ORCHESTRATION│  Duration: 2-5 days
  │  (Phase 2)  │  Parallel: Credit + MLR + Ops
  └──────┬──────┘  Sequential: Finance → Tech
         │ All 5 approved
         ▼
  ┌─────────────┐
  │   LAUNCH    │  Owner: Document Lifecycle Agent + Governance Agent
  │PREPARATION  │  Duration: 1-2 days
  │  (Phase 3)  │
  └──────┬──────┘
         │ All checklist items complete
         ▼
  ┌─────────────┐
  │  LAUNCHED   │  Owner: Post-Launch Monitoring Agent
  │  (Phase 4)  │  Duration: Ongoing
  └──────┬──────┘
         │ PIR due date reached
         ▼
  ┌─────────────┐
  │ PIR REVIEW  │  Owner: Post-Launch Monitoring Agent
  │  (Phase 5)  │  Duration: 2-4 weeks
  └──────┬──────┘
         │
         ├── Performing → CLOSED (BAU)
         └── Underperforming → AMENDMENT LOOP-BACK (Type 4)
```

---

## 7. Failure Modes & Mitigations

### 7.1 Cascading Error: Misclassification
```
Classification Agent says "Variation" but product is actually "NTG"
  → Template AutoFill uses wrong template (NPA Lite vs Full NPA)
  → ML Prediction uses wrong historical cohort
  → Governance routes to wrong approval track (5 approvers vs 8)
  → Risk Agent applies wrong rule set

MITIGATION:
  1. Classification confidence < 75% → Route to human for manual classification
  2. Checker review explicitly validates classification (Phase 1 gate)
  3. Governance Agent cross-checks classification against notional/risk thresholds
  4. Audit Trail logs classification reasoning for post-hoc review
```

### 7.2 Loop-Back Spiral
```
Approver rejects → Maker fixes → Resubmit → Approver rejects again → ...

MITIGATION:
  Circuit breaker: loop_back_count >= 3 → Auto-escalate to COO
  Smart routing: 68% of clarifications answered by Conv. Diligence (avoids loop)
  Prevention: Template AutoFill pre-validates sections (72% fewer checker loop-backs)
```

### 7.3 SLA Breach Cascade
```
One approver delays → Shifts all downstream timelines → Misses Q1 deadline

MITIGATION:
  36-hour warning via Notification Agent
  Auto-escalation to approver's manager at SLA breach
  Parallel routing saves 0.5 days on critical path
  Pre-seeding (Finance gets heads-up during checker phase)
```

### 7.4 Document Version Desync
```
Approver A reviews doc v1, approver B reviews doc v2 after loop-back

MITIGATION:
  Document Lifecycle Agent tracks versions per document
  All approvers notified when document version changes
  Approval invalidated if underlying document changes after sign-off
```

---

## 8. Database Tables per Agent

| Agent | Primary Tables (Read/Write) | Reference Tables (Read) |
|-------|---------------------------|------------------------|
| **Master Orchestrator** | agent_sessions, agent_messages | users |
| **NPA Domain Orchestrator** | npa_projects, npa_workflow_states | - |
| **Ideation** | npa_projects, npa_form_data, npa_jurisdictions, agent_messages | ref_npa_fields, ref_npa_sections |
| **Classification** | npa_classification_scorecards, npa_projects | ref_classification_criteria (NEW) |
| **Template AutoFill** | npa_form_data | ref_npa_fields, ref_npa_templates, kb_documents |
| **Risk** | npa_intake_assessments | ref_prohibited_items (NEW), ref_sanctions_list (NEW) |
| **ML Prediction** | npa_projects (predictions) | npa_performance_metrics (historical) |
| **Governance** | npa_signoffs, npa_loop_backs, npa_approvals | ref_signoff_routing_rules (NEW) |
| **Conv. Diligence** | npa_comments, agent_messages | kb_documents |
| **Document Lifecycle** | npa_documents, npa_post_launch_conditions | ref_document_rules |
| **Monitoring** | npa_performance_metrics, npa_breach_alerts | npa_post_launch_conditions |
| **KB Search (RAG)** | kb_documents | - (uses vector similarity) |
| **Notification** | npa_audit_log, npa_breach_alerts | users, npa_signoffs (SLA) |
| **Audit Trail** | npa_audit_log | ALL tables (read-only for reasoning capture) |

---

## 9. What the Schema Migration Must Add

Based on this architecture, the database needs these NEW tables to support all 13 agents:

### New Reference Tables (seed with golden source data)
1. `ref_classification_criteria` - 20 NTG criteria + 8 variation questions
2. `ref_prerequisite_categories` - 9 categories with weights
3. `ref_prerequisite_checks` - 100+ checklist items
4. `ref_signoff_routing_rules` - Approval routing logic per track
5. `ref_prohibited_items` - Prohibited product list
6. `ref_escalation_rules` - 5-level escalation framework

### New Operational Tables
7. `npa_classification_assessments` - Per-criteria scores for each NPA
8. `npa_prerequisite_results` - Per-check pass/fail for each NPA
9. `npa_escalations` - Escalation history with resolution
10. `npa_agent_routing_decisions` - Agent routing log with confidence

### Alter Existing Tables
11. `agent_sessions` - Add agent_identity, current_stage, handoff_from
12. `agent_messages` - Add agent_confidence, reasoning_chain, citations
13. `npa_documents` - Add version, validation_stage, criticality
14. `npa_audit_log` - Add confidence_score, reasoning, model_version

---

## 10. UI Component Map

```
┌─────────────────────────────────────────────────────────────────┐
│                    COO NPA Dashboard                            │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │ KPI Cards│ │ Pipeline │ │ Ageing   │ │ Revenue  │          │
│  │(dashboard│ │  Table   │ │  Chart   │ │  Chart   │          │
│  │  -api)   │ │(npa-api) │ │(dash-api)│ │(dash-api)│          │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘          │
├─────────────────────────────────────────────────────────────────┤
│                  NPA Creation (Agent-Driven)                    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ChatInterface ← Ideation Agent conversation             │   │
│  │   → ClassificationCard (after Q4 answered)              │   │
│  │   → RiskCheckPanel (prohibited check result)            │   │
│  │   → TemplateFieldStatus (78% fill summary)              │   │
│  │   → PredictionCard (timeline + bottleneck)              │   │
│  └─────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│                 NPA Workflow (Post-Draft)                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │ Workflow  │ │ Approval │ │ Document │ │ Agent    │          │
│  │ Stage    │ │ Panel    │ │ Checklist│ │ Health   │          │
│  │ Tracker  │ │(approval │ │(doc-api) │ │ Dashboard│          │
│  │(workflow)│ │  -api)   │ │          │ │          │          │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘          │
├─────────────────────────────────────────────────────────────────┤
│              Post-Launch Monitoring                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │ Product  │ │ Breach   │ │ KPI vs   │ │ PIR      │          │
│  │ Metrics  │ │ Alerts   │ │ Target   │ │ Report   │          │
│  │(monitor) │ │(monitor) │ │(monitor) │ │(monitor) │          │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘          │
├─────────────────────────────────────────────────────────────────┤
│              Cross-Cutting                                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                       │
│  │ Audit    │ │ Notific. │ │ Agent    │                       │
│  │ Log      │ │ Center   │ │ Chat     │                       │
│  │(audit)   │ │(NEW)     │ │ History  │                       │
│  └──────────┘ └──────────┘ └──────────┘                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## 11. Key Design Principles

1. **Agent-First, Not Form-First**: The agent drives the lifecycle. Humans review decisions, not fill forms.
2. **Every Field Has Lineage**: AUTO (agent-filled, 78%), ADAPTED (agent-scaled, 15%), MANUAL (human-required, 7%).
3. **Confidence Everywhere**: Every agent output carries a confidence score. Below threshold = human review.
4. **Circuit Breakers**: Max 3 loop-backs before auto-escalation. Prevents infinite cycles.
5. **Parallel by Default**: Sign-offs run in parallel unless dependency requires sequential.
6. **Tier 4 Shared**: KB Search, Notification, Audit Trail are shared utilities - any agent can call them.
7. **HARD STOP is Absolute**: Risk Agent prohibited check failure terminates the NPA immediately. No override path.
8. **Schema Supports Agents**: Every agent decision is stored with reasoning, confidence, and timestamp for audit compliance.
