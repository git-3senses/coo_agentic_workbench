# COO Multi-Agent Workbench — Roadmap, Issues & Phase Plan
**Date**: 2026-02-22
**Status**: Brutally Honest Assessment + Phase-wise Execution Plan

---

## SECTION A: CURRENT STATE — GAP ANALYSIS

### A1. What Actually Works (Real)
| Component | Status | Notes |
|-----------|--------|-------|
| Chat tab (Orchestrator) | REAL | Live Dify chat with conversation persistence |
| Agent wave orchestration | REAL | RISK -> CLASSIFIER+ML -> AUTOFILL+GOVERNANCE -> DOC+MONITORING |
| DB persistence layer | PARTIAL | Agent results persist but autofill field save is unreliable |
| Template Editor (Doc/Form views) | REAL | Save works, field editing works |
| AUTOFILL Live stream | PARTIAL | Streams 53 fields but only 8 map to template (key mismatch) |
| Dify proxy (server) | REAL | Chat + workflow endpoints with 502/503/504 retry logic |
| Backend API routes | REAL | 19 route files, ~60+ endpoints (npas, documents, approvals, etc.) |
| Document upload endpoint | EXISTS | `POST /documents/npas/:id/upload` with multer — exists but UI not wired |
| Approval endpoints | EXISTS | `server/routes/approvals.js` — exists but UI not wired |

### A2. What's Fake / Mock / Broken

#### CRITICAL — User-Facing Lies
| # | Problem | Severity | Tab | File & Lines |
|---|---------|----------|-----|-------------|
| P1 | Document Preview (left panel) is 100% mock — fake PDF skeleton, hardcoded filenames, no viewer | CRITICAL | All | `npa-detail.component.ts` lines 116-209 |
| P2 | Workflow tab is 100% hardcoded — fake stages, fake assignees ("Sarah Lim", "Jane Tan"), fake dates | CRITICAL | Workflow | `npa-workflow-visualizer.component.ts` lines 118-152 |
| P3 | Approve & Sign-Off, Reject, Save Draft buttons have NO click handlers — do nothing | CRITICAL | Header | `npa-detail.component.ts` lines 94-108 |
| P9 | Docs tab has no document uploader UI — shows fake completion status (complete/in-progress/risk) without user ever uploading anything | CRITICAL | Docs | `npa-detail.component.ts` lines 358-373 |
| P10 | Sign-Off tab — no assign, notify, or nudge actions — pure read-only showcase | CRITICAL | Sign-Off | `npa-detail.component.ts` lines 456-493 |

#### HIGH — Broken Agent Integration
| # | Problem | Severity | Tab | File & Lines |
|---|---------|----------|-----|-------------|
| P5 | Risk Analysis section never shows up — empty unless DB has pre-seeded data | HIGH | Analysis | `npa-detail.component.ts` lines 378-402 |
| P6 | Operational Readiness section always empty | HIGH | Analysis | `npa-detail.component.ts` lines 405-428 |
| P7 | ML Prediction Agent — unclear purpose, questionable display | HIGH | Analysis | `npa-detail.component.ts` lines 431-441 |
| P8 | Classification Agent — unreliable output, shows random/useless data | HIGH | Analysis | `npa-detail.component.ts` lines 337-354 |
| P11 | AUTOFILL Live stream not relatable to NPA Draft Template at all | HIGH | Proposal | `npa-template-editor.component.ts` |
| P13 | DB save failure — autofill results not properly persisted across page reloads | HIGH | Proposal | `npa-detail.component.ts` persistAgentResult() |

#### MEDIUM — UX / Performance
| # | Problem | Severity | Tab | File & Lines |
|---|---------|----------|-----|-------------|
| P4 | Help button does nothing | MEDIUM | Header | `npa-detail.component.ts` lines 94-97 |
| P12 | AUTOFILL stream latency ~8 min (3 parallel LLMs but no real speedup) | MEDIUM | Proposal | Dify workflow config |
| P14 | Cannot revisit stream once editor closed or switched away | MEDIUM | Proposal | `npa-template-editor.component.ts` |
| P15 | Monitoring query input — send button does nothing | MEDIUM | Monitor | `npa-detail.component.ts` lines 551-563 |
| P17 | 53 fields stream but only 8 land in Doc/Form (field_key mismatch) | MEDIUM | Proposal | `npa-template-definition.ts` vs Dify prompts |

#### LOW — Architecture / Tech Debt
| # | Problem | Severity | Impact |
|---|---------|----------|--------|
| P16 | God file — npa-detail.component.ts is 1997 lines with inline template, all 7 tabs, all agent logic | LOW | Maintainability |
| P18 | Parallel workflow takes same wall-clock time as sequential | LOW | Performance |

---

## SECTION B: DETAILED COMPONENT ANALYSIS

### B1. Header Buttons Analysis
**File**: `npa-detail.component.ts` lines 87-109

| Button | Line | Click Handler | Backend Endpoint | Status |
|--------|------|---------------|-----------------|--------|
| Refresh Analysis | 88-93 | `refreshAgentAnalysis()` | N/A (triggers agents) | WORKING |
| Help | 94-97 | NONE | N/A | DEAD BUTTON |
| Save Draft | 98-101 | NONE | `PUT /api/npas/:id` exists | DEAD BUTTON — backend ready |
| Reject | 103-105 | NONE | `POST /api/approvals` exists | DEAD BUTTON — backend ready |
| Approve & Sign-Off | 106-108 | NONE | `POST /api/approvals` exists | DEAD BUTTON — backend ready |

**Fix Effort**: LOW — just add `(click)` handlers + HTTP calls. Backend already exists.

### B2. Document Preview Left Panel Analysis
**File**: `npa-detail.component.ts` lines 116-209

| Element | Lines | What It Shows | Reality |
|---------|-------|---------------|---------|
| PDF skeleton | 140-151 | Fake paper with gray lines simulating text | 100% MOCK — no PDF viewer |
| Filename | 151 | `FX_Option_Term_Sheet_v1.pdf` | HARDCODED string |
| Upload icon | ~128 | Cloud upload icon | NO click handler — decorative only |
| Attachments list | 154-209 | "Attachments (13)" with file items | HARDCODED count and file names |
| File items | 165-180 | `Term_Sheet_Final.pdf` with status badges | FAKE status (no real validation) |

**Fix Effort**: MEDIUM — Need PDF viewer library (ngx-extended-pdf-viewer or pdf.js), wire to `documents` DB table, wire upload icon to `POST /documents/npas/:id/upload`.

### B3. Workflow Tab Analysis
**File**: `npa-workflow-visualizer.component.ts` lines 118-152

| Element | Line | Hardcoded Value |
|---------|------|----------------|
| Stage date | 120 | `new Date('2025-12-16')` |
| Assignee 1 | 122 | `'Sarah Lim'` — Product Ideation Interview |
| Assignee 2 | 130 | `'Jane Tan'` — RMG-Credit Approval |
| Assignee 3 | 131 | `'Mike Ross'` — RMG-Market Approval |
| Assignee 4 | 132 | `'Mark Lee'` — Finance (Product Control) |
| Assignee 5 | 133 | `'Rachel Green'` — Legal & Compliance |
| Assignee 6 | 134 | `'Ops Team'` — Ops Readiness |
| Target completion | 152 | `new Date('2025-12-25')` |
| All stage statuses | 119-140 | Hardcoded COMPLETED/IN_PROGRESS/PENDING |

**Fix Effort**: MEDIUM — Wire to `stage_transitions` table, `signoffs` table, `npas.stage` field. Backend routes in `transitions.js` already exist.

### B4. Analysis Tab Analysis
**File**: `npa-detail.component.ts` lines 375-454

| Section | Lines | Data Source | Problem |
|---------|-------|------------|---------|
| Risk Analysis grid | 378-402 | `riskAssessments` array | Empty unless RISK agent runs AND output maps correctly |
| Operational Readiness | 405-428 | `opsAssessments` array | ALWAYS EMPTY — no mapping from RISK agent domains |
| ML Prediction | 431-441 | `mlPrediction` object | Unclear what it predicts; display is confusing |
| Classification | 337-354 | `classificationResult` | Unreliable output format from CLASSIFIER agent |
| Risk 4-Layer Cascade | 444-453 | `riskAssessmentResult` | Delegates to child component; data quality issues |

**Fix Effort**: HIGH — Need to fix agent output parsing, map RISK domains to operational readiness, clarify ML prediction display, validate CLASSIFIER output format.

### B5. Docs Tab Analysis
**File**: `npa-detail.component.ts` lines 358-373

| Component | What It Shows | Reality |
|-----------|---------------|---------|
| `<app-document-dependency-matrix>` | Document dependency grid | Shows fake completion status without any upload |
| `<app-doc-completeness>` | Completeness badges | Shows "complete/in-progress/risk" WITHOUT user uploading anything |
| Upload functionality | Nothing | NO file upload UI exists on this tab |

**Fix Effort**: MEDIUM — Add drag-and-drop uploader, wire to `POST /documents/npas/:id/upload`, remove fake badges, show real status only AFTER upload + agent analysis.

### B6. Sign-Off Tab Analysis
**File**: `npa-detail.component.ts` lines 456-493

| Feature | Status |
|---------|--------|
| Display sign-off requirements | Works (from GOVERNANCE agent) |
| Assign signoff to person | NOT IMPLEMENTED |
| Send notification/nudge | NOT IMPLEMENTED |
| Mark as signed | NOT IMPLEMENTED |
| Escalate overdue | NOT IMPLEMENTED |
| Track SLA | NOT IMPLEMENTED |

**Fix Effort**: MEDIUM — Backend `approvals.js` and `escalations.js` routes exist. Need UI buttons + HTTP calls.

### B7. Monitoring Tab Analysis
**File**: `npa-detail.component.ts` lines 551-563

| Element | Line | Status |
|---------|------|--------|
| Query input field | 558 | Exists but NOT bound to component property |
| Send button | 559-561 | NO click handler |
| Chat response area | N/A | Does not exist |

**Fix Effort**: LOW — Wire send button to Dify MONITORING agent, add chat-like response display.

---

## SECTION C: PHASE-WISE VISION & GOALS

### Phase 1: "STOP LYING" — Remove Fakes, Wire Real Backend (1-2 weeks)
**Goal**: Every pixel on screen must reflect real data or be honestly empty. No more mock data pretending to be real.

#### 1.1 Document Preview Panel (P1)
- [ ] Replace fake PDF skeleton with real PDF viewer (ngx-extended-pdf-viewer or pdf.js)
- [ ] Wire to actual uploaded documents from `documents` DB table
- [ ] Show "No documents uploaded" state honestly when empty
- [ ] Wire the upload cloud icon to actual file upload (backend `POST /documents/npas/:id/upload` already exists)

#### 1.2 Header Buttons (P3, P4)
- [ ] **Save Draft** -> call `PUT /api/npas/:id` with current form state
- [ ] **Approve & Sign-Off** -> open approval modal, call `POST /api/approvals`
- [ ] **Reject** -> open rejection modal with reason field, call backend
- [ ] **Help** -> open contextual help panel or link to documentation

#### 1.3 Document Upload (P9)
- [ ] Add drag-and-drop file upload component to Docs tab
- [ ] Wire to existing `POST /documents/npas/:id/upload` endpoint
- [ ] Show real upload status, file size, validation results
- [ ] Remove fake completion badges — only show status AFTER actual document analysis

#### 1.4 Workflow Tab (P2)
- [ ] Remove all hardcoded stage data
- [ ] Wire to real NPA stage from DB (`npas.stage` field)
- [ ] Show actual timestamps from `stage_transitions` table
- [ ] Show real assignees from `signoffs` table
- [ ] If no workflow data exists, show honest "Workflow not started" state

#### 1.5 Sign-Off Tab (P10)
- [ ] Wire "Assign" button to `POST /api/approvals` endpoint
- [ ] Add notification action (email/nudge) — backend `notifications` table exists
- [ ] Show real signoff status from `signoffs` DB table
- [ ] Add "Remind" / "Escalate" buttons with real backend calls

**Phase 1 Exit Criteria**: Zero hardcoded/mock data on any tab. Every component either shows real data or shows an honest empty state.

---

### Phase 2: "MAKE AGENTS USEFUL" — Fix Agent Output Quality (1-2 weeks)
**Goal**: Every agent must return data that is accurate, relevant, and directly usable.

#### 2.1 Fix Analysis Tab (P5, P6, P7, P8)
- [ ] **Risk Analysis**: Ensure RISK agent output maps correctly to risk domain grid; show real scores, not empty
- [ ] **Operational Readiness**: Map RISK agent's operational domains to this section (OPS, TECH, DATA)
- [ ] **ML Prediction**: Clarify what it predicts (approval likelihood? timeline?), show meaningful display
- [ ] **Classification Agent**: Validate output format; show product type, track, and classification with explanation
- [ ] Add loading skeletons that say "Agent analyzing..." instead of empty placeholder forever

#### 2.2 Fix AUTOFILL Field Key Mapping (P17, P11)
- [ ] Audit all 96 template field keys in `npa-template-definition.ts`
- [ ] Map Dify LLM prompt field_key names to match EXACTLY
- [ ] Target: 53 streamed fields -> 50+ land in Doc/Form view (not 8)
- [ ] Make Live stream cards clickable -> jump to that field in Doc view

#### 2.3 Fix DB Persistence (P13)
- [ ] Audit `persistAgentResult('autofill', ...)` call chain
- [ ] Verify server `POST /agents/npas/:id/persist/autofill` actually writes to DB
- [ ] Verify page reload restores ALL autofill fields (not just 1)
- [ ] Add persistence for all agent results (risk, classification, ml-predict, governance)

#### 2.4 Stream Replay (P14)
- [ ] Store last AUTOFILL stream result in sessionStorage/localStorage
- [ ] When user re-opens template editor, show last stream result instead of blank
- [ ] Add "Re-run Autofill" button in template editor header

**Phase 2 Exit Criteria**: All 7 agents return useful, accurate data. AUTOFILL fills 50+ fields. DB persistence works across reloads.

---

### Phase 3: "MAKE IT FAST" — Performance & UX Polish (1 week)
**Goal**: Reduce latency, improve responsiveness, clean up architecture.

#### 3.1 AUTOFILL Performance (P12, P18)
- [ ] Profile: Is bottleneck in Dify LLM inference or network/proxy?
- [ ] Reduce LLM prompt size (currently contradictory: "concise" + "comprehensive")
- [ ] Consider splitting into smaller, faster workflows (e.g., 6 branches of 8 fields each)
- [ ] Add progress percentage in Live view (X/96 fields populated)

#### 3.2 Refactor God File (P16)
- [ ] Extract each tab into its own component:
  - `npa-proposal-tab.component.ts`
  - `npa-docs-tab.component.ts`
  - `npa-analysis-tab.component.ts`
  - `npa-signoff-tab.component.ts`
  - `npa-workflow-tab.component.ts`
  - `npa-monitoring-tab.component.ts`
  - `npa-chat-tab.component.ts`
- [ ] Move agent orchestration to `AgentOrchestrationService`
- [ ] Move agent result mappers to `AgentResultMapperService`
- [ ] Target: npa-detail.component.ts < 300 lines

#### 3.3 Monitoring Query (P15)
- [ ] Wire send button to Dify MONITORING agent chat endpoint
- [ ] Show streaming response in chat-like UI
- [ ] Allow follow-up questions

**Phase 3 Exit Criteria**: AUTOFILL < 4 min. Component file < 300 lines. All interactive elements functional.

---

### Phase 4: "PRODUCTION READY" — End-to-End Workflows (2-3 weeks)
**Goal**: Complete NPA lifecycle from submission to approval, with real documents and real sign-offs.

#### 4.1 Complete NPA Lifecycle
- [ ] Submission -> Classification -> Ideation -> Template Fill -> Review -> Sign-Off -> Approval
- [ ] Each stage transition recorded in `stage_transitions` table
- [ ] Notifications sent at each stage (email/in-app)
- [ ] Audit trail for every agent action and human decision

#### 4.2 Document Lifecycle
- [ ] Upload -> Validate -> Agent Analysis -> Status Update
- [ ] Real document preview with annotation support
- [ ] Version history for documents
- [ ] Completeness check tied to classification (what documents are REQUIRED)

#### 4.3 Approval Workflow
- [ ] Multi-level sign-off routing (Legal -> Risk -> Compliance -> COO)
- [ ] Conditional approvals with conditions tracking
- [ ] Loop-back workflow (rejection -> revision -> resubmission)
- [ ] SLA tracking with breach alerts

#### 4.4 Dashboard KPIs
- [ ] Real metrics from actual NPA data (not hardcoded)
- [ ] Pipeline view with real stage distribution
- [ ] Agent performance metrics (accuracy, speed, coverage)

**Phase 4 Exit Criteria**: Demo-able end-to-end NPA workflow from new submission to final approval.

---

## SECTION D: BACKEND CAPABILITIES (Already Built, Not Wired to UI)

These server routes EXIST but have NO UI wired to them:

| Route File | Endpoints | Status |
|------------|-----------|--------|
| `documents.js` | Upload, validate, delete, get requirements | Backend DONE, UI NOT wired |
| `approvals.js` | Create, update, list approvals | Backend DONE, UI NOT wired |
| `transitions.js` | Stage transitions, history | Backend DONE, UI NOT wired |
| `escalations.js` | Create, resolve escalations | Backend DONE, UI NOT wired |
| `governance.js` | Readiness check, classification, projects | Backend DONE, partially wired |
| `risk-checks.js` | Risk check CRUD | Backend DONE, partially wired |
| `monitoring.js` | Monitoring data, breaches | Backend DONE, partially wired |
| `bundling.js` | Product bundling assessment | Backend DONE, UI NOT wired |
| `evergreen.js` | Evergreen clause checks | Backend DONE, UI NOT wired |
| `pir.js` | Post-implementation review | Backend DONE, UI NOT wired |

**Key Insight**: ~60% of the backend is already built but the frontend never connects to it. Phase 1 is mostly about WIRING, not building from scratch.

---

## SECTION E: DIFY AGENT INVENTORY

| Agent ID | Dify App Name | Type | Status |
|----------|---------------|------|--------|
| RISK | WF_NPA_Risk | Workflow | Working — returns score, rating, 7 domains |
| CLASSIFIER | WF_NPA_Classify_Predict | Workflow | Working — returns type, track, scores |
| ML_PREDICT | WF_NPA_Classify_Predict | Workflow | Working — returns approval likelihood |
| AUTOFILL | WF_NPA_Autofill_Parallel | Workflow (streamed) | Working — 53 fields, 8 min, merge code fixed |
| GOVERNANCE | WF_NPA_Governance | Workflow | Working — returns signoff requirements |
| DOC_LIFECYCLE | WF_NPA_Doc_Lifecycle | Workflow | Working — returns doc completeness |
| MONITORING | WF_NPA_Monitoring | Workflow | Working — returns health metrics |
| IDEATION | CF_NPA_Ideation | Chatflow | Working — 10-question guided interview |
| ORCHESTRATOR | CF_NPA_Orchestrator | Chatflow | Working — routes to sub-agents |

**All 9 agents are functional in Dify.** The problem is the UI layer, not the AI layer.

---

## SECTION F: PRIORITY MATRIX

```
                    HIGH IMPACT
                        |
     Phase 1            |           Phase 2
     (Remove Fakes)     |           (Fix Agents)
     P1,P2,P3,P9,P10   |           P5-P8,P11,P13,P17
                        |
  LOW EFFORT -----------+----------- HIGH EFFORT
                        |
     Phase 3            |           Phase 4
     (Polish)           |           (Production)
     P4,P12,P15,P16    |           Full Lifecycle
                        |
                    LOW IMPACT
```

---

## SECTION G: IMMEDIATE NEXT ACTIONS (Top 5)

1. **Wire document upload UI** to existing `POST /documents/npas/:id/upload` — backend exists, just needs UI
2. **Wire Save Draft button** to `PUT /api/npas/:id` — one click handler
3. **Fix AUTOFILL field key mapping** — audit 96 keys, align Dify prompts -> 50+ fields populate
4. **Remove Workflow tab hardcoded data** — wire to real `stage_transitions` table
5. **Fix Analysis tab empty states** — show agent loading states, wire risk/operational grids to agent output

---

## SECTION H: FILE REFERENCE MAP

### Frontend (Angular)
| File | Lines | Purpose | Issues |
|------|-------|---------|--------|
| `src/app/pages/npa-agent/npa-detail/npa-detail.component.ts` | 1997 | God file — ALL tabs, ALL agents, ALL logic | P3, P5-P10, P15, P16 |
| `src/app/pages/npa-agent/npa-template-editor/npa-template-editor.component.ts` | ~1500 | Template Editor — Live/Doc/Form views | P11, P13, P14, P17 |
| `src/app/components/npa/npa-workflow-visualizer/npa-workflow-visualizer.component.ts` | ~200 | Workflow timeline visualization | P2 — all hardcoded |
| `src/app/pages/npa-agent/npa-template-definition.ts` | ~500 | 96 template field definitions | P17 — key mismatch source |

### Backend (Express/Node)
| File | Endpoints | Wired? |
|------|-----------|--------|
| `server/routes/documents.js` | Upload, validate, delete | NO |
| `server/routes/approvals.js` | Create, update, list | NO |
| `server/routes/transitions.js` | Stage transitions | NO |
| `server/routes/escalations.js` | Create, resolve | NO |
| `server/routes/agents.js` | Persist all agent results | YES |
| `server/routes/dify-proxy.js` | Chat + workflow proxy | YES |
| `server/routes/governance.js` | Readiness, classification | PARTIAL |
| `server/routes/risk-checks.js` | Risk check CRUD | PARTIAL |
| `server/routes/monitoring.js` | Monitoring, breaches | PARTIAL |
| `server/routes/bundling.js` | Product bundling | NO |
| `server/routes/evergreen.js` | Evergreen checks | NO |
| `server/routes/pir.js` | Post-implementation review | NO |

### Dify Configuration
| File | Purpose |
|------|---------|
| `server/config/dify-agents.js` | Agent registry — API keys, endpoints, types |
| `server/.env` | Dify API keys (DIFY_KEY_AUTOFILL, etc.) |

---

*This document is the single source of truth for project status as of 2026-02-22. Update after each phase completion.*
