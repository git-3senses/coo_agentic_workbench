# User Flow & Information Architecture
## DBS COO Agent Command Hub - Agent-First Design

---

## 1. Sitemap / Information Architecture

```
COO AGENT COMMAND HUB
│
├── 🏠 HOME (Command Center)                          /
│   ├── Hero + System Status
│   ├── Quick Launch Cards (NPA Agent, Risk Agent...)
│   ├── Active Work Items Summary
│   └── Intelligence Highlights
│
├── 📋 MY WORKSPACE                                    /workbench/
│   ├── My Work Items                                  /workbench/my-work
│   │   ├── NPAs I Own (Maker view)
│   │   ├── Approvals Pending My Action
│   │   └── Monitoring Alerts Assigned to Me
│   ├── Agent Insights                                 /workbench/agent-insights
│   │   ├── Recommendations for me
│   │   ├── Predicted bottlenecks
│   │   └── Optimization suggestions
│   └── Cross-Function View                            /workbench/cross-function
│       ├── NPAs touching my department
│       └── Shared dependencies
│
├── ✅ APPROVALS                                       /approvals
│   ├── Pending My Decision
│   ├── Awaiting Others
│   ├── Recently Decided
│   └── SLA Dashboard
│
├── 🤖 NPA AGENT                                      /agents/npa
│   │
│   ├── [A] AGENT DASHBOARD (Landing)                  /agents/npa
│   │   ├── Agent Stats (1,784 learned, 95% success)
│   │   ├── Capability Cards (8 domain + 9 utility agents)
│   │   ├── Knowledge Bases (4 sources)
│   │   ├── Connected Services
│   │   ├── Active Work Items
│   │   └── NPA Pipeline Table
│   │
│   ├── [B] CREATE NPA (Agent-Driven)                  /agents/npa?mode=create
│   │   │
│   │   ├── B1. IDEATION CHAT                          (Ideation Agent)
│   │   │   ├── Conversational intake (7 questions)
│   │   │   ├── Real-time KB search (similar NPAs)
│   │   │   ├── Product summary card
│   │   │   └── "Generate Draft" trigger
│   │   │
│   │   ├── B2. CLASSIFICATION RESULT                  (Classification Agent)
│   │   │   ├── NTG vs Variation vs Existing result
│   │   │   ├── Confidence score + criteria breakdown
│   │   │   ├── Approval track assignment
│   │   │   └── Override option (human can reclassify)
│   │   │
│   │   ├── B3. RISK CHECK RESULT                      (Risk Agent)
│   │   │   ├── 4-layer check visualization
│   │   │   │   ├── Layer 1: Internal Policy ✅/❌
│   │   │   │   ├── Layer 2: Regulatory ✅/❌
│   │   │   │   ├── Layer 3: Sanctions ✅/❌
│   │   │   │   └── Layer 4: Dynamic ✅/❌
│   │   │   ├── HARD STOP screen (if any layer fails)
│   │   │   └── PASS → continue to template
│   │   │
│   │   ├── B4. TEMPLATE AUTOFILL REVIEW               (Template AutoFill Agent)
│   │   │   ├── 3-bucket field view
│   │   │   │   ├── 🟢 GREEN (AUTO): 78% - agent filled, high confidence
│   │   │   │   ├── 🟡 YELLOW (ADAPTED): 15% - agent adapted, review recommended
│   │   │   │   └── 🔴 RED (MANUAL): 7% - human must fill
│   │   │   ├── Field-level lineage (source, confidence, agent tip)
│   │   │   ├── Section-by-section editor
│   │   │   │   ├── Part A: Basic Product Information
│   │   │   │   ├── Part B: Sign-off Parties
│   │   │   │   ├── Part C.I: Product Specifications
│   │   │   │   ├── Part C.II: Operational & Technology
│   │   │   │   ├── Part C.III: Pricing Model
│   │   │   │   ├── Part C.IV: Risk Analysis
│   │   │   │   ├── Part C.V: Data Management
│   │   │   │   ├── Part C.VI: Other Risks
│   │   │   │   ├── Part C.VII: Trading Products
│   │   │   │   ├── Appendix 1: Entity/Location
│   │   │   │   ├── Appendix 2: IP
│   │   │   │   ├── Appendix 3: Financial Crime
│   │   │   │   ├── Appendix 4: Risk Data
│   │   │   │   └── Appendix 5: Trading Info
│   │   │   └── ML Prediction sidebar (timeline, bottleneck, likelihood)
│   │   │
│   │   ├── B5. PREREQUISITE SCORECARD                  (Pre-Req checks)
│   │   │   ├── 9-category readiness radar
│   │   │   │   ├── Strategic Alignment (15%)
│   │   │   │   ├── Classification (10%)
│   │   │   │   ├── Stakeholder Readiness (20%)
│   │   │   │   ├── Technical Infrastructure (15%)
│   │   │   │   ├── Regulatory & Compliance (15%)
│   │   │   │   ├── Risk Management (10%)
│   │   │   │   ├── Data Management (5%)
│   │   │   │   ├── Financial Framework (5%)
│   │   │   │   └── Project Management (5%)
│   │   │   ├── Per-check pass/fail with evidence
│   │   │   └── Overall score (85+ = Ready, 60-84 = Conditional, <60 = Not Ready)
│   │   │
│   │   └── B6. DOCUMENT CHECKLIST                      (Document Lifecycle Agent)
│   │       ├── Critical docs (blocks approval) 🔴
│   │       ├── Important docs (may delay) 🟡
│   │       ├── Optional docs 🟢
│   │       ├── Upload zone with OCR validation
│   │       └── Version tracking
│   │
│   ├── [C] NPA DETAIL / WORK ITEM                     /agents/npa?mode=detail&npaId=X
│   │   │
│   │   ├── C1. HEADER BAR
│   │   │   ├── NPA ID + Title + Status badge
│   │   │   ├── Classification badge (NTG/Variation/Existing)
│   │   │   ├── Approval track badge (Full NPA/Lite/Bundling/Evergreen)
│   │   │   ├── Risk level indicator
│   │   │   └── Quick actions (Edit, Export, Submit)
│   │   │
│   │   ├── C2. LEFT RAIL: Stage Progress
│   │   │   ├── Phase 0: Ideation ✅/🔄/⏳
│   │   │   ├── Phase 1: Ingestion & Triage
│   │   │   ├── Phase 2: Sign-Off Orchestration
│   │   │   ├── Phase 3: Launch Preparation
│   │   │   ├── Phase 4: Launched
│   │   │   └── Phase 5: PIR / Monitoring
│   │   │
│   │   ├── C3. MAIN CONTENT (Tabbed)
│   │   │   ├── Tab: Product Specs
│   │   │   │   ├── All template sections (Part A through Appendix 5)
│   │   │   │   ├── Field lineage indicators (AUTO/ADAPTED/MANUAL)
│   │   │   │   ├── Inline editing for MANUAL/ADAPTED fields
│   │   │   │   └── KB source match sidebar
│   │   │   │
│   │   │   ├── Tab: Classification & Risk
│   │   │   │   ├── Classification criteria scorecard (20 NTG / 8 Variation)
│   │   │   │   ├── 4-layer risk check results
│   │   │   │   ├── Market risk factor matrix
│   │   │   │   ├── External parties & vendors
│   │   │   │   └── ML predictions (approval likelihood, timeline, bottleneck)
│   │   │   │
│   │   │   ├── Tab: Approvals
│   │   │   │   ├── Sign-off routing visualization
│   │   │   │   │   ├── Parallel track (Credit + MLR + Ops)
│   │   │   │   │   └── Sequential track (Legal → Finance)
│   │   │   │   ├── Per-approver status card
│   │   │   │   │   ├── Name, department, SLA deadline
│   │   │   │   │   ├── Status (Pending/Reviewing/Approved/Rejected)
│   │   │   │   │   ├── ML-predicted completion time
│   │   │   │   │   └── Clarification Q&A thread
│   │   │   │   ├── Loop-back history
│   │   │   │   │   ├── Loop-back count + circuit breaker status (x/3)
│   │   │   │   │   ├── Per-loopback: type, reason, routing, resolution
│   │   │   │   │   └── AI prevention stats
│   │   │   │   ├── Escalation history
│   │   │   │   └── Post-approval conditions
│   │   │   │
│   │   │   ├── Tab: Documents
│   │   │   │   ├── Required documents checklist (from ref_document_requirements)
│   │   │   │   ├── Upload interface with drag & drop
│   │   │   │   ├── Validation status per doc (6 stages)
│   │   │   │   ├── Version history per doc
│   │   │   │   └── Missing document alerts (per stage gate)
│   │   │   │
│   │   │   ├── Tab: Monitoring (visible after launch)
│   │   │   │   ├── KPI vs Target dashboard
│   │   │   │   │   ├── Trading volume vs projection
│   │   │   │   │   ├── P&L vs business case
│   │   │   │   │   ├── Risk limit utilization
│   │   │   │   │   └── Counterparty exposure
│   │   │   │   ├── Breach alerts (active + historical)
│   │   │   │   ├── Threshold configuration
│   │   │   │   ├── Post-launch conditions tracker
│   │   │   │   └── PIR report (at PIR due date)
│   │   │   │
│   │   │   └── Tab: Agent Chat
│   │   │       ├── Conversational Diligence interface
│   │   │       ├── Ask questions about this NPA
│   │   │       ├── Citation-backed answers
│   │   │       └── Agent identity switching
│   │   │
│   │   ├── C4. RIGHT RAIL: Active Agents
│   │   │   ├── Currently processing agents (with spinner)
│   │   │   ├── Standby agents
│   │   │   ├── Agent health metrics
│   │   │   └── Notification feed
│   │   │
│   │   └── C5. BOTTOM DRAWER: Audit Log
│   │       ├── Full audit trail with timestamps
│   │       ├── Agent decisions with reasoning + confidence
│   │       ├── Human actions
│   │       └── Expand/collapse toggle
│   │
│   └── [D] AGENT CHAT (Standalone)                    /agents/npa?mode=chat
│       ├── General NPA questions (not tied to specific NPA)
│       ├── "How do I classify a product?"
│       ├── "Show me similar NPAs to green bonds"
│       └── "What's the approval timeline for NPA Lite?"
│
├── 📊 COO FUNCTIONS                                   /functions/
│   ├── NPA Control Tower                              /functions/npa
│   │   ├── Tab: Overview
│   │   │   ├── KPI Cards (Active NPAs, Approval Rate, Avg Cycle, Risk Count)
│   │   │   ├── Pipeline Flow (Discovery → DCE → Risk → Sign-Off → Launch)
│   │   │   ├── Ageing Analysis (by stage)
│   │   │   ├── Revenue Opportunity
│   │   │   ├── Market Clusters (2x2 grid)
│   │   │   └── Product Prospects
│   │   ├── Tab: NPA Pool
│   │   │   ├── Full sortable/filterable table (12 NPAs)
│   │   │   ├── Classification filter (NTG/Variation/Existing)
│   │   │   ├── Stage filter
│   │   │   ├── Status filter (On Track/At Risk/Blocked/Completed)
│   │   │   └── Click row → NPA Detail
│   │   └── Tab: Monitoring
│   │       ├── Launched product health (2 products)
│   │       ├── Breach alert dashboard (7 alerts)
│   │       ├── Post-launch condition compliance
│   │       └── PIR calendar
│   ├── Desk Support                                   /functions/desk-support
│   ├── DCE Client Services                            /functions/dce
│   ├── Operational Risk                               /functions/orm
│   ├── Strategic Product Mgmt                         /functions/strategic-pm
│   ├── Business Leads                                 /functions/business-lead
│   └── Business Analysis                              /functions/business-analysis
│
├── 🧠 KNOWLEDGE & EVIDENCE                            /knowledge/
│   ├── Knowledge Base                                 /knowledge/base
│   │   ├── Golden Sources (5 docs)
│   │   ├── Historical NPAs (1,784 indexed)
│   │   ├── Regulatory Documents
│   │   ├── Policy Documents
│   │   └── Search (powered by KB Search Agent / RAG)
│   └── Evidence Library                               /knowledge/evidence
│       ├── Precedent NPAs
│       └── Decision reasoning archive
│
├── 📈 REPORTING & GOVERNANCE                          /reporting/
│   └── Dashboards                                     /reporting/dashboards
│       ├── Executive Summary
│       ├── Agent Performance
│       ├── SLA Compliance
│       └── Classification Distribution
│
├── 🔍 AUDIT CONTROL                                   /audit/
│   ├── Audit Trails                                   /audit/trails
│   │   ├── Full event log (all 42 tables)
│   │   ├── Agent decision log with reasoning chains
│   │   └── Filter by NPA, agent, user, date
│   ├── Agent Action Logs                              /audit/agent-logs
│   │   ├── Routing decisions with confidence scores
│   │   ├── Classification assessments
│   │   └── Risk check results
│   └── Maker-Checker Log                              /audit/maker-checker
│
├── ⚙️ ADMIN                                           /admin/
│   ├── Workflow Config                                /admin/workflows
│   │   ├── Signoff routing rules editor
│   │   ├── Escalation rules editor
│   │   └── SLA thresholds
│   ├── Agent Config                                   /admin/agents
│   │   ├── Agent enable/disable
│   │   ├── Confidence thresholds
│   │   └── Model versions
│   └── System Integrations                            /admin/integrations
│
└── ❓ HELP                                            /help/
    ├── How Agents Work                                /help/agents
    ├── Explainability Guide                           /help/explainability
    └── Best Practices                                 /help/best-practices
```

---

## 2. Primary User Flows

### Flow 1: CREATE NEW NPA (Happy Path - Agent-Driven)

```
┌─────────────────────────────────────────────────────────────────┐
│ ENTRY POINTS:                                                    │
│  • Home → "Create New NPA" card                                 │
│  • NPA Agent Dashboard → "Start New NPA" button                 │
│  • Sidebar → NPA Agent → Create                                 │
│  • URL: /agents/npa?mode=create                                 │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 1: MODE SELECTION                                           │
│                                                                   │
│  ┌──────────────┐    ┌──────────────┐                           │
│  │  🤖 AGENT    │    │  📋 TEMPLATE │                           │
│  │  MODE        │    │  MODE        │                           │
│  │              │    │              │                           │
│  │ Conversational│   │ Pick template│                           │
│  │ AI-guided    │    │ Fill manually│                           │
│  │ (recommended)│    │              │                           │
│  └──────┬───────┘    └──────┬───────┘                           │
│         │                   │                                    │
│         ▼                   ▼                                    │
│    IDEATION CHAT      TEMPLATE BROWSER                          │
└─────────┬───────────────────┬───────────────────────────────────┘
          │                   │
          ▼                   │
┌─────────────────────────────┤
│ STEP 2: IDEATION CHAT      │
│ (Ideation Agent)            │
│                             │
│ Agent asks 7 questions:     │
│  Q1: Product structure      │
│  Q2: Business context       │
│  Q3: Operational details    │
│  Q4: Risk & regulatory      │
│  Q5: Target customers       │
│  Q6: Timeline & urgency     │
│  Q7: Special considerations │
│                             │
│ PARALLEL (background):      │
│  → KB Search finds similar  │
│  → Risk Agent quick check   │
│                             │
│ OUTPUT: Product summary card│
│ USER: "Generate Draft" ──┐  │
└──────────────────────────┤  │
                           │  │
                           ▼  ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 3: CLASSIFICATION (< 1 minute, automated)                   │
│ (Classification Agent)                                           │
│                                                                   │
│ ┌────────────────────────────────────────────────────────┐      │
│ │  CLASSIFICATION RESULT                                  │      │
│ │                                                         │      │
│ │  Type: New-to-Group          Confidence: 92%           │      │
│ │  Criteria Met: 12/20         Category Breakdown:       │      │
│ │  Track: Full NPA             ┌─────────┬─────┐         │      │
│ │                              │Product  │ 4/5 │         │      │
│ │  ┌──────────────┐            │Market   │ 3/5 │         │      │
│ │  │ ✅ Accept    │            │Risk/Reg │ 3/5 │         │      │
│ │  │ ✏️ Override  │            │Fin/Ops  │ 2/5 │         │      │
│ │  └──────────────┘            └─────────┴─────┘         │      │
│ └────────────────────────────────────────────────────────┘      │
│                                                                   │
│ IF confidence < 75% → Route to human for manual classification   │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 4: RISK CHECK (< 1 second, automated)                      │
│ (Risk Agent)                                                     │
│                                                                   │
│ ┌────────────────────────────────────────────────────────┐      │
│ │  4-LAYER PROHIBITED CHECK                               │      │
│ │                                                         │      │
│ │  Layer 1: Internal Policy  ✅ CLEAR                    │      │
│ │  Layer 2: Regulatory       ✅ CLEAR                    │      │
│ │  Layer 3: Sanctions        ✅ CLEAR                    │      │
│ │  Layer 4: Dynamic          ✅ CLEAR                    │      │
│ │                                                         │      │
│ │  Result: ✅ PASSED                                     │      │
│ └────────────────────────────────────────────────────────┘      │
│                                                                   │
│ IF ANY LAYER = FAIL:                                             │
│ ┌────────────────────────────────────────────────────────┐      │
│ │  🚫 HARD STOP                                          │      │
│ │  This product is PROHIBITED                             │      │
│ │  Reason: [matched prohibited items]                     │      │
│ │  NPA TERMINATED. No override available.                 │      │
│ └────────────────────────────────────────────────────────┘      │
└───────────────────────────┬─────────────────────────────────────┘
                            │ PASS
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 5: TEMPLATE AUTOFILL (1-5 minutes)                          │
│ (Template AutoFill Agent + ML Prediction Agent)                  │
│                                                                   │
│ SPLIT SCREEN:                                                     │
│ ┌────────────────────────┬──────────────────────────────┐       │
│ │   LEFT: Field Editor   │   RIGHT: Agent Intelligence  │       │
│ │                        │                              │       │
│ │ Part A: Basic Info     │   📊 ML Predictions:        │       │
│ │  🟢 Product Name ✓    │   Approval: 89%             │       │
│ │  🟢 Business Unit ✓   │   Timeline: 12-16 weeks     │       │
│ │  🟡 GPH (review) △    │   Bottleneck: Finance       │       │
│ │  🔴 PAC Date [___]    │                              │       │
│ │                        │   📚 Similar NPA:           │       │
│ │ Part C.I: Product      │   TSG2025-089 (87% match)  │       │
│ │  🟢 Description ✓     │   Approved in 14 weeks      │       │
│ │  🟡 Volume (scaled) △ │                              │       │
│ │  🔴 Counterparties []  │   💡 Agent Tips:            │       │
│ │                        │   "Consider PBOC filing     │       │
│ │ [Continue editing...]  │    10 days before launch"   │       │
│ └────────────────────────┴──────────────────────────────┘       │
│                                                                   │
│ PROGRESS BAR: 78% Auto-filled │ 15% Adapted │ 7% Manual        │
│                                                                   │
│ ┌──────────────┐                                                 │
│ │ Submit Draft → (moves to Checker Review)                      │
│ └──────────────┘                                                 │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 6: PREREQUISITE SCORECARD                                   │
│                                                                   │
│ ┌────────────────────────────────────────────────────────┐      │
│ │  READINESS SCORE: 87/100 ✅ READY                      │      │
│ │                                                         │      │
│ │  Strategic Alignment    ██████████████░  14/15          │      │
│ │  Classification         ██████████     10/10           │      │
│ │  Stakeholder Readiness  █████████████░░ 17/20          │      │
│ │  Technical Infra        █████████████░░ 13/15          │      │
│ │  Regulatory             ████████████░░░ 12/15          │      │
│ │  Risk Management        ██████████     10/10           │      │
│ │  Data Management        ████░░░░░░      4/5            │      │
│ │  Financial Framework    ████░░░░░░      4/5            │      │
│ │  Project Management     ███░░░░░░░      3/5            │      │
│ │                                                         │      │
│ │  3 items need attention (expand to see)                 │      │
│ └────────────────────────────────────────────────────────┘      │
│                                                                   │
│ IF score < 60 → BLOCKED (must resolve before proceeding)        │
│ IF score 60-84 → CONDITIONAL (can proceed with caveats)         │
│ IF score 85+ → READY (proceed to workflow)                      │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 7: DOCUMENT UPLOAD                                          │
│ (Document Lifecycle Agent)                                       │
│                                                                   │
│ ┌────────────────────────────────────────────────────────┐      │
│ │  DOCUMENT CHECKLIST                                     │      │
│ │                                                         │      │
│ │  🔴 CRITICAL (Blocks Approval):                        │      │
│ │    ☑ Final Term Sheet          [uploaded] ✅           │      │
│ │    ☑ Risk Assessment Memo      [uploaded] ✅           │      │
│ │    ☐ External Legal Opinion    [missing]  ⚠️           │      │
│ │    ☑ Business Case Document    [uploaded] ✅           │      │
│ │    ☐ Compliance Assessment     [missing]  ⚠️           │      │
│ │                                                         │      │
│ │  🟡 IMPORTANT (May Delay):                             │      │
│ │    ☑ Credit Risk Report        [uploaded] ✅           │      │
│ │    ☐ Tech Specification        [missing]               │      │
│ │    ...                                                  │      │
│ │                                                         │      │
│ │  [📁 Drag & Drop Upload Zone]                          │      │
│ │  Supported: PDF, DOC, XLS | Max 10MB                   │      │
│ │  🤖 Agent: OCR auto-validates uploaded docs            │      │
│ └────────────────────────────────────────────────────────┘      │
│                                                                   │
│ ┌──────────────┐                                                 │
│ │ Submit to Workflow → (NPA enters Phase 1: Checker Review)     │
│ └──────────────┘                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### Flow 2: APPROVE NPA (Checker / Sign-Off Party)

```
┌─────────────────────────────────────────────────────────────────┐
│ ENTRY POINTS:                                                    │
│  • Approvals page → Pending item                                │
│  • Email notification (link to NPA detail)                      │
│  • Sidebar badge (3)                                            │
│  • Home → Active Work Items                                     │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ APPROVAL VIEW: NPA Detail (Approver Perspective)                 │
│                                                                   │
│ ┌─────────────────────────────────────────────────────────┐     │
│ │ HEADER:                                                  │     │
│ │ NPA-2026-001 │ Digital Asset Custody │ 🟡 At Risk       │     │
│ │ NTG │ Full NPA │ SLA: 36h remaining                     │     │
│ └─────────────────────────────────────────────────────────┘     │
│                                                                   │
│ ┌──────────────┬──────────────────────────┬──────────────┐      │
│ │ LEFT RAIL:   │  MAIN: Review Content    │  RIGHT RAIL: │      │
│ │              │                          │              │      │
│ │ Stage:       │  Product Specs (read-only)│ 🤖 Agents:  │      │
│ │ ✅ Ideation  │  Risk Analysis           │ CD: Ready   │      │
│ │ ✅ Classify  │  Classification result   │ KB: 3 refs  │      │
│ │ 🔄 Checker  │  ML Prediction           │ ML: 89%     │      │
│ │ ⏳ Sign-Off  │                          │              │      │
│ │ ⏳ Launch    │  ┌──────────────────────┐│ 💬 Ask Agent│      │
│ │ ⏳ Monitor   │  │ MY DECISION:         ││ about this  │      │
│ │              │  │                      ││ NPA...      │      │
│ │              │  │ ✅ Approve           ││              │      │
│ │              │  │ ⚠️ Approve w/ conds  ││              │      │
│ │              │  │ ❓ Request clarify   ││              │      │
│ │              │  │ ❌ Reject            ││              │      │
│ │              │  │                      ││              │      │
│ │              │  │ Comments: [________] ││              │      │
│ │              │  └──────────────────────┘│              │      │
│ └──────────────┴──────────────────────────┴──────────────┘      │
│                                                                   │
│ IF "Request Clarification":                                      │
│   → Governance Agent routes to Conversational Diligence          │
│   → If CD can answer (68%) → auto-reply with citations           │
│   → If not → loop-back to Maker                                 │
│                                                                   │
│ IF "Reject":                                                     │
│   → Loop-back initiated (count: x/3)                            │
│   → If count >= 3 → Circuit breaker → COO escalation            │
│                                                                   │
│ ┌──────────────────────────────────────────────────────────┐    │
│ │ BOTTOM: Audit Log (collapsible)                          │    │
│ │ 09:14 │ 🤖 Ideation Agent │ Created draft │ 92% conf   │    │
│ │ 09:15 │ 🤖 Classification │ NTG (12/20)  │ 91% conf   │    │
│ │ 09:15 │ 🤖 Risk Agent     │ 4-layer PASS │ 98% conf   │    │
│ │ 09:16 │ 🤖 AutoFill       │ 78% complete │ 94% conf   │    │
│ │ 14:30 │ 👤 Sarah Chen     │ Started review│            │    │
│ └──────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

### Flow 3: MONITOR LAUNCHED PRODUCT (Post-Launch Agent)

```
┌─────────────────────────────────────────────────────────────────┐
│ ENTRY POINTS:                                                    │
│  • COO NPA Dashboard → Monitoring tab                           │
│  • NPA Detail → Monitoring tab (for launched NPAs)              │
│  • Breach alert notification                                    │
│  • Home → Active Alerts                                         │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ MONITORING DASHBOARD                                             │
│                                                                   │
│ ┌─────────────┬─────────────┬─────────────┬─────────────┐      │
│ │ Products: 2 │ Breaches: 3 │ Conditions: │ PIR Due: 1  │      │
│ │ Active      │ Active      │ 7/10 Met    │ April 2026  │      │
│ └─────────────┴─────────────┴─────────────┴─────────────┘      │
│                                                                   │
│ PER-PRODUCT CARDS:                                               │
│ ┌────────────────────────────────────────────────────────┐      │
│ │ NPA-2026-007: FX Accumulator USD/SGD  │ ⚠️ WARNING   │      │
│ │                                                         │      │
│ │ Volume:      ████████░░  68% of target ($340M/$500M)  │      │
│ │ P&L:         ██████████  On track ($2.1M)             │      │
│ │ VaR:         █████████░  73% utilization ⚠️           │      │
│ │ Exposure:    █████████▓  90% of limit ($180M/$200M) ⚠️│      │
│ │                                                         │      │
│ │ Active Breaches:                                        │      │
│ │  🔴 Counterparty concentration - Bank ABC at 96% limit │      │
│ │                                                         │      │
│ │ Post-Launch Conditions:                                 │      │
│ │  ✅ VaR reporting (completed)                          │      │
│ │  ✅ Staff training (completed)                         │      │
│ │  ⏳ Quarterly report (due Mar 31)                      │      │
│ │  ⏳ 90-day PIR (due Apr 20)                           │      │
│ └────────────────────────────────────────────────────────┘      │
│                                                                   │
│ ┌────────────────────────────────────────────────────────┐      │
│ │ NPA-2026-006: Multi-Currency Deposit  │ ✅ HEALTHY    │      │
│ │                                                         │      │
│ │ All metrics within thresholds                          │      │
│ │ Post-Launch: 7/8 conditions met                        │      │
│ └────────────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────────┘
```

---

### Flow 4: COO EXECUTIVE OVERVIEW

```
┌─────────────────────────────────────────────────────────────────┐
│ ENTRY: /functions/npa (COO NPA Control Tower)                    │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ TAB 1: OVERVIEW                                                  │
│                                                                   │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐               │
│ │Active:12│ │Rate:75% │ │Cycle:42d│ │Risks: 3 │               │
│ │ +2 new  │ │ ↑ 5%    │ │ ↓ 3d    │ │ 1 crit  │               │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘               │
│                                                                   │
│ PIPELINE FLOW:                                                   │
│ Discovery(2) → DCE Review(1) → Risk(2) → Sign-Off(3) →        │
│ Launch Prep(0) → Launched(2) → [Prohibited(1) / Completed(1)]  │
│                                                                   │
│ AGEING CHART:   REVENUE:          CLUSTERS:                      │
│ █ <7d: 3        Top 3:            ┌────┬────┐                   │
│ █ 7-14d: 2      1. $75M Digital   │FX  │Dgtl│                   │
│ █ 14-30d: 4     2. $35M ESG       │    │    │                   │
│ █ 30d+: 3       3. $15M Carbon    ├────┼────┤                   │
│                                    │ESG │Trd │                   │
│                                    └────┴────┘                   │
│                                                                   │
│ TAB 2: NPA POOL (full table - 12 rows, 13 columns)              │
│ TAB 3: MONITORING (launched products + breaches)                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### Flow 5: HARD STOP (Prohibited Product)

```
User creates NPA for "Leveraged Crypto CFD Product"
    │
    ▼
Ideation Agent → Classification Agent → Risk Agent
    │
    ▼
┌─────────────────────────────────────────────────────────────────┐
│  🚫 PROHIBITED - HARD STOP                                      │
│                                                                   │
│  ┌────────────────────────────────────────────────────────┐     │
│  │                                                         │     │
│  │   ⛔ THIS PRODUCT IS PROHIBITED                        │     │
│  │                                                         │     │
│  │   Layer 1: Internal Policy  ❌ FAILED                  │     │
│  │     → PRH_IP_02: CFDs for Retail prohibited            │     │
│  │     → PRH_IP_03: Leveraged Crypto >5x prohibited      │     │
│  │                                                         │     │
│  │   Layer 2: Regulatory       ❌ FAILED                  │     │
│  │     → PRH_RG_01: Unregistered securities (SG)          │     │
│  │                                                         │     │
│  │   This NPA has been TERMINATED.                         │     │
│  │   No override is available for prohibited products.     │     │
│  │                                                         │     │
│  │   ┌──────────────┐  ┌──────────────┐                  │     │
│  │   │ View Details  │  │ Return Home  │                  │     │
│  │   └──────────────┘  └──────────────┘                  │     │
│  │                                                         │     │
│  │   Audit: Logged as NPA-2026-012 with PROHIBITED status  │     │
│  └────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. User Personas & Their Primary Flows

| Persona | Role | Primary Screens | Key Actions |
|---------|------|----------------|-------------|
| **Product Manager (Maker)** | USR-001 Sarah Lim | NPA Agent → Create NPA → Detail | Ideation chat, review autofill, upload docs, respond to loop-backs |
| **Checker** | USR-006 David Chen | Approvals → NPA Detail | Review draft, validate completeness, approve/reject, ask clarifications |
| **Approver (Credit)** | USR-008 Jane Tan | Approvals → NPA Detail (Approvals tab) | Review risk sections, approve/reject/conditional, Q&A with agent |
| **Approver (Finance)** | USR-009 Mark Lee | Approvals → NPA Detail (Approvals tab) | Review pricing/P&L, approve with conditions |
| **COO** | USR-015 Elena Torres | COO NPA Dashboard → Overview/Pool/Monitoring | Executive overview, escalation handling, PIR reviews |
| **Risk Manager** | USR-012 Ahmad Razak | Approvals → NPA Detail (Classification & Risk tab) | Review risk checks, VaR, market risk factors |
| **Compliance** | USR-011 Lisa Wong | Approvals → NPA Detail (Documents tab) | Legal doc review, regulatory compliance sign-off |

---

## 4. Current UI vs Required UI - Gap Matrix

| Screen / Feature | Current Status | Agent That Needs It | Priority |
|-----------------|---------------|-------------------|----------|
| **Home / Command Center** | ✅ Built | - | - |
| **NPA Agent Dashboard** | ✅ Built | All agents | - |
| **Ideation Chat** | ✅ Built (template + agent mode) | Ideation Agent | - |
| **NPA Detail - Product Specs** | ✅ Built | Template AutoFill | - |
| **NPA Detail - Approvals tab** | ✅ Built | Governance Agent | - |
| **NPA Detail - Monitoring tab** | ✅ Built | Monitoring Agent | - |
| **NPA Detail - Chat tab** | ✅ Built | Conv. Diligence | - |
| **COO NPA Dashboard** | ✅ Built (3 tabs) | Dashboard API | - |
| **Approval Dashboard** | ✅ Built | Approval API | - |
| **NPA Pipeline Table** | ✅ Built | NPA API | - |
| **Audit Log** | ✅ Built | Audit Trail Agent | - |
| **Stage Progress** | ✅ Built | Governance Agent | - |
| | | | |
| **Classification Result Card** | ❌ Missing | Classification Agent | 🔴 HIGH |
| **4-Layer Risk Check Panel** | ❌ Missing | Risk Agent | 🔴 HIGH |
| **HARD STOP Screen** | ❌ Missing | Risk Agent | 🔴 HIGH |
| **Template AutoFill 3-Bucket View** | ❌ Missing (has editor, no lineage viz) | Template AutoFill | 🔴 HIGH |
| **Prerequisite Scorecard** | ❌ Missing | Pre-Req Engine | 🟡 MEDIUM |
| **Document Checklist (structured)** | ❌ Missing (has upload, no req matching) | Document Lifecycle Agent | 🟡 MEDIUM |
| **NPA Detail - Classification & Risk tab** | ⚠️ Partial (has Analysis, no criteria breakdown) | Classification + Risk | 🟡 MEDIUM |
| **NPA Detail - Documents tab** | ⚠️ Partial (has file list, no requirement matching) | Document Agent | 🟡 MEDIUM |
| **Sign-off Routing Visualization** | ❌ Missing (has list, no parallel/sequential viz) | Governance Agent | 🟡 MEDIUM |
| **Loop-back History Panel** | ❌ Missing | Governance Agent | 🟡 MEDIUM |
| **Escalation History** | ❌ Missing | Governance Agent | 🟡 MEDIUM |
| **ML Prediction Sidebar** | ⚠️ Partial (has predictions, not in autofill context) | ML Prediction | 🟢 LOW |
| **Notification Center** | ❌ Missing | Notification Agent | 🟡 MEDIUM |
| **Agent Routing Decision Log** | ❌ Missing | Audit Trail Agent | 🟢 LOW |
| **Knowledge Base Browser** | ❌ Placeholder | KB Search Agent | 🟢 LOW |
| **Admin - Routing Rules Editor** | ❌ Placeholder | Governance Agent | 🟢 LOW |
| **Post-Launch Condition Tracker** | ❌ Missing (in DB, not in UI) | Monitoring Agent | 🟡 MEDIUM |
| **Market Risk Factor Matrix** | ❌ Missing (in DB, not in UI) | Risk Agent | 🟢 LOW |
| **External Parties Panel** | ❌ Missing (in DB, not in UI) | Document Agent | 🟢 LOW |

---

## 5. Implementation Priority

### Phase 1: Agent-Driven NPA Creation Flow (HIGH)
These are the screens a Maker sees when creating an NPA. The current flow jumps from chat straight to detail. We need the intermediate agent-result screens.

1. **Classification Result Card** - Shows after ideation, before autofill
2. **4-Layer Risk Check Panel** - Shows prohibited check result
3. **HARD STOP Screen** - Full-screen block for prohibited products
4. **Template AutoFill 3-Bucket View** - GREEN/YELLOW/RED field visualization with lineage
5. **Prerequisite Scorecard** - 9-category readiness radar with weighted scores

### Phase 2: Approval Intelligence (MEDIUM)
These enhance the approver experience with agent intelligence.

6. **Sign-off Routing Visualization** - Parallel vs sequential track diagram
7. **Loop-back History Panel** - Per-loopback details with circuit breaker status
8. **Escalation History** - Escalation timeline with resolution
9. **Document Checklist** - Structured checklist from ref_document_requirements
10. **Notification Center** - Central hub for all SLA alerts and agent notifications

### Phase 3: Post-Launch & Analytics (LOW)
11. **Post-Launch Condition Tracker** - Condition compliance checklist
12. **Market Risk Factor Matrix** - Grid view from npa_market_risk_factors
13. **External Parties Panel** - Vendor/third-party list with risk tiers
14. **Agent Routing Decision Log** - Routing chain visualization
15. **Knowledge Base Browser** - Search + browse KB documents
