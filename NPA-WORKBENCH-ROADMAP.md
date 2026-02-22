# NPA Agentic Workbench — Detailed Roadmap & Checklist

> **Project:** COO Agentic Workbench — NPA (New Product Approval) Module
> **Version:** RMG OR Template Jun 2025
> **Last Updated:** 2026-02-23
> **Status:** Phase 2 In Progress

---

## Current State Summary

| Metric | Value |
|--------|-------|
| Golden Template Fields | 87 (needs expansion to ~250+) |
| Field Types Rendered in UI | 2 (text, textarea) — needs 14 |
| Dify Agents Defined | 13 (0 wired to Draft Builder chat) |
| Draft Builder Status | 3-column layout working, icons fixed, basic field rendering |
| Backend Endpoints | ~15 routes operational |
| DB Tables | ~12 tables active |
| Agent Orchestration Waves | W0→W1→W2→W3 pipeline coded (detail page) |

---

## Phase 1: Foundation — Golden Template Expansion *(Current Priority)*

> **Goal:** Align `npa-template-definition.ts` (87 fields) with the full NPA Template spec (250+ fields)

### 1.1 Part A & Part B — Header Fields

- [ ] Add Part A fields to template definition (13 fields: Product/Service Name, Locations/BU, Product Manager, Group Product Head, Proposal Preparer, Business Case Approved, NPA/Lite toggle, PAC date, First/Full sign-off, Biz champion, Approving Authority, Group COO)
- [ ] Add Part B sign-off party routing table (6 checkbox rows: RMG, COO/Ops, T&O, Finance, LCS, Other)
- [ ] Implement conditional logic — NPA Lite justification fields (8a, 8b) only visible when field 7 = "NPA Lite"

### 1.2 Section I — Product Specifications (Basic Information)

- [ ] **1.Description** — Expand from 5 to 8 fields:
  - [ ] a. Purpose/Rationale (textarea)
  - [ ] b.i Role of Proposing Unit (dropdown: Originator, Distributor, Market-Maker, Service Provider)
  - [ ] b.ii Product Features — currency, form, classification codes (textarea)
  - [ ] b.iii Variation comparison / existing product trigger (textarea, conditional)
  - [ ] b.iv Expected transaction volume, market size, market liquidity (textarea)
  - [ ] c. Business Model (textarea)
  - [ ] d. SPV details — country, control, booking responsibilities (textarea)
- [ ] **2.Target Customer** — Add 7 sub-fields (a–g):
  - [ ] a. Target customer segment (dropdown: institutional, accredited, retail)
  - [ ] b. Regulatory-driven restrictions (textarea)
  - [ ] c. Domicile of customers (textarea)
  - [ ] d. Target customer profile — turnover, risk-based (textarea)
  - [ ] e. Customer objectives and risk profile (textarea)
  - [ ] f. Target markets/locations (textarea)
  - [ ] g. Key risks faced by target customers (textarea)
- [ ] **3.Commercialization** — Add 5 sub-fields (a–e):
  - [ ] a. Channel availability (multi-select: digibank, iBanking, Branch, etc.)
  - [ ] b. Sales suitability — screening process (textarea + file attach)
  - [ ] c. Marketing & communication strategy (textarea + file attach)
  - [ ] d. Sales surveillance process (textarea + file attach)
  - [ ] e. Staff training (textarea + file attach)
- [ ] **4.PAC Conditions** — Dynamic bullet list (add/remove condition items)
- [ ] **5.External Parties** — Repeatable section block:
  - [ ] a. Name (text)
  - [ ] b. Risk Profiling ID - GRC (text)
  - [ ] c. Risk Review ID - GRC (text)
  - [ ] d. Commercially-related risk? (yes/no + textarea)
  - [ ] e. Documents attached (file upload)

### 1.3 Section II — Operational & Technology Information

- [ ] **1.Operational Information** — Expand to 10+ sub-fields:
  - [ ] a. Operating Model — roles, functional responsibilities (textarea + flowchart)
  - [ ] b. Booking Process — end-to-end transaction flow (textarea + flowchart/mermaid)
  - [ ] b.ii GL alignment (textarea)
  - [ ] b.iii Internal Deposit Account Controls (textarea)
  - [ ] c. Operational Adequacy — 7 checkbox items (c.i–c.vii)
  - [ ] d. Operating Account Controls (textarea)
  - [ ] e. Limit Structure and Monitoring (textarea)
  - [ ] f. Manual process fallback (yes/no + textarea)
  - [ ] g. Collateral Management — 4 sub-fields (g.i–g.iv)
  - [ ] h. Custody account (yes/no + sub-questions)
  - [ ] i. Trade repository/ESFR reporting (textarea)
  - [ ] j. SFEMC/Code of Conduct references (textarea)
- [ ] **2.Service Platform** — Add asset classes table grid + 5 system fields
- [ ] **3.Information Security** — Expand to 6 sub-fields (a–f)
- [ ] **4.Technology Resiliency** — Expand to 4+ sub-fields with DR sub-questions
- [ ] **5.Business Continuity Management** — Expand to 12 sub-fields (a–l)

### 1.4 Section III — Pricing Model Details

- [ ] **1.Pricing model validation** — 1 field (yes/no + text)
- [ ] **2.Model name & validation date** — 2 fields (a, b) with MAS Notice refs
- [ ] **3.SIMM treatment** — 3 fields (a, b, c) including backtesting

### 1.5 Section IV — Risk Analysis *(Most Complex)*

- [ ] **A.1 Legal & Compliance** — 7 sub-fields (a–g) with MAS references
- [ ] **A.2 Finance and Tax** — Expand to full structure:
  - [ ] a–d basic fields
  - [ ] e. Service output fees (3 sub-fields: e.i, e.ii, e.iii)
  - [ ] f. Tax considerations (textarea)
  - [ ] g. Regulatory matching (4 sub-fields: g.i–g.iv)
- [ ] **A.3 Financial Crimes & Financial Security** — NEW section (was missing):
  - [ ] a. Conduct considerations (textarea)
  - [ ] b. MAR assessment with MAS references (textarea + 3 sub-items)
  - [ ] c. MRA boundary test (yes/no + text)
- [ ] **A.D Funding Liquidity Risk** — NEW section (was missing):
  - [ ] LCR/NSFR/EAFL metrics (textarea)
  - [ ] Liquidity Coverage Ratio table
  - [ ] HQLA qualification (yes/no + text)
  - [ ] Cashflow modeling (textarea)
  - [ ] Liquidity facility (yes/no + text)
  - [ ] Limit implementation (textarea)
- [ ] **B.1 Market Risk** — Expand risk factor table:
  - [ ] Add Cross Gamma, Commodity Vega, Near/Far Market rows
  - [ ] Add SIMM, VaR, Historical VaR, PSAR sub-fields (d–g)
- [ ] **B.2 Market Risk Regulatory Capital** — 3 fields (a–c) with MAS refs
- [ ] **B.3 Funding/Liquidity Risk** — link to A.D or merge
- [ ] **C. Credit Risk** — Expand to 6 sub-sections:
  - [ ] C.1 Potential risks (4 fields: a–d)
  - [ ] C.2 Risk mitigation (2 fields: a–b)
  - [ ] C.3 Limits to cover exposure (6 fields: a–f)
  - [ ] C.4 Credit Risk Capital calculation (3 fields: a–c) — NEW
  - [ ] C.5 Regulatory considerations (2 fields: a–b) — NEW
  - [ ] C.6 Counterparty credit risk (4 fields: a–d with SA-CCR) — NEW
- [ ] **D. Reputational Risk** — 6 fields (1–6)

### 1.6 Section V — Data Management

- [ ] **1.D4D requirements** — 3 fields
- [ ] **2.PURE principles** — Expand to 5 fields (was 2)
- [ ] **3.Risk Data Aggregation** — 3 fields

### 1.7 Section VI & VII

- [ ] **VI. Other Risk** — 1 catch-all textarea
- [ ] **VII. Trading Products** — Reference link to Appendix 5

### 1.8 Appendices 1–6

- [ ] **Appendix 1: Entity/Location** — 5 column table (Legal Entity, Country, Booking, Risk Taking, Servicing)
- [ ] **Appendix 2: IP** — Part A (2 fields), Part B (3 fields)
- [ ] **Appendix 3: Financial Crime** — Expand fully:
  - [ ] Risk Assessment — 7 questions (a–g) with yes/no + details
  - [ ] Policies — 3 fields
  - [ ] Controls — 4 fields
  - [ ] Validation & Surveillance — 3 fields
  - [ ] Data Privacy — 2 fields
- [ ] **Appendix 4: RDAR** — 4 fields
- [ ] **Appendix 5: Trading Products** — 6 sub-sections (A–F):
  - [ ] A. Authorisations (2 checkboxes)
  - [ ] B. Product Information (2 fields)
  - [ ] C. Evidence & Pledged Owners (1–2 fields)
  - [ ] D. Situation, Funding & Others (3 fields)
  - [ ] E. Additional Finance Considerations (5 fields)
  - [ ] F. Additional Considerations (2 fields)
- [ ] **Appendix 6: Third-Party Platforms** — Full structure:
  - [ ] Part A: Description of Use Case (2 fields)
  - [ ] Part B: Preliminary Risk Assessment (risk matrix grid)
  - [ ] Part C Section 1: Context Questions (5 fields)
  - [ ] Part C Section 2: Information Security Assessment (7 field groups)
  - [ ] Part C Section 3: Cybersecurity / Communication Archives (4 fields)
  - [ ] Part C Section 4: IP, Data Ownership & Privacy (10 fields)

### 1.9 Template Infrastructure

- [ ] Add `FieldType` enum to template definition:
  ```
  text | textarea | dropdown | multiselect | yesno | checkbox_group |
  bullet_list | file_upload | table_grid | flowchart | date |
  repeatable_section | conditional | reference_link
  ```
- [ ] Add `options` array property for dropdowns and multi-selects
- [ ] Add `conditional` property (`{ dependsOn: fieldKey, showWhen: value }`)
- [ ] Add `repeatable` boolean for repeatable section blocks
- [ ] Add `attachable` boolean for fields that support file attachments
- [ ] Add `referenceUrl` property for reference link fields
- [ ] Add `tableColumns` and `tableRows` for table_grid fields
- [ ] Update `inferFieldType()` to use explicit type from template node

---

## Phase 2: UI Field Type Rendering

> **Goal:** Draft Builder renders all 14 field types correctly

### 2.1 Basic Field Types

- [ ] **Text Input** — Single line, already working ✅
- [ ] **Text Area** — Multi-line with auto-resize, already working ✅
- [ ] **Date Picker** — Angular Material or native date input
- [ ] **Currency Input** — Number format with currency prefix (SGD, USD, etc.)

### 2.2 Selection Fields

- [ ] **Dropdown (Single Select)** — `<select>` with options from template
- [ ] **Multi-Select** — Checkbox dropdown or tag input (e.g. channel availability)
- [ ] **Yes/No Radio** — Radio button pair, triggers conditional fields
- [ ] **Checkbox Group** — Multiple checkboxes (operational adequacy checklist)

### 2.3 Complex Fields

- [ ] **Dynamic Bullet List** — Add/remove items (PAC conditions)
- [ ] **File Upload** — Drag-and-drop zone, file list, progress indicator
- [ ] **Table Grid** — Editable table (market risk factor matrix, asset classes, entity/location)
  - [ ] Support configurable columns and rows
  - [ ] Cell types: text, yes/no/na dropdown
  - [ ] Add/remove row capability
- [ ] **Flowchart / Mermaid** — Mermaid diagram editor or attach diagram
- [ ] **Repeatable Section** — "Add Another" button creates new block of fields
  - [ ] Each block has its own field instances
  - [ ] Remove block with confirmation
- [ ] **Conditional Fields** — Show/hide based on parent field value
  - [ ] `dependsOn` → watch field value changes
  - [ ] Smooth show/hide animation
- [ ] **Reference Link** — Read-only link to external resource (PURE guidelines, etc.)

### 2.4 Field Chrome (Shared Features)

- [ ] Lineage badge (AUTO / ADAPTED / MANUAL) — already implemented ✅
- [ ] Strategy badge (RULE / COPY / LLM / MANUAL) — already implemented ✅
- [ ] Confidence score indicator — already implemented ✅
- [ ] Streaming animation — already implemented ✅
- [ ] Tooltip/guidance text — already implemented ✅
- [ ] Required field indicator (asterisk + red border)
- [ ] Validation error messages (inline below field)
- [ ] "Ask Agent" button — sends field context to right-panel chat agent
- [ ] Field-level comments / annotations
- [ ] Attach file to any field (where `attachable: true`)

---

## Phase 3: Draft Builder Chat — Sign-Off Party Agents

> **Goal:** Wire the right-panel chat to 5 real Dify Chat Agent apps

### 3.1 Dify Chat Agent Apps (Create in Dify)

- [ ] **AG_NPA_BIZ** — Business/Proposing Unit agent
  - Owns: Section I (Product Specs), Section VII (Trading Info)
  - Knowledge: Product catalogs, PAC minutes, market analysis
  - Capabilities: Product description drafting, market sizing, customer profiling
- [ ] **AG_NPA_TECH_OPS** — Technology & Operations agent
  - Owns: Section II (Operational & Technology)
  - Knowledge: System architecture docs, BCP templates, DR runbooks
  - Capabilities: Operating model drafting, system impact assessment, BCM planning
- [ ] **AG_NPA_FINANCE** — Finance agent
  - Owns: Section III (Pricing), Section V (Data Management)
  - Knowledge: Pricing models, SIMM docs, RDAR policies, PURE guidelines
  - Capabilities: Pricing methodology, model validation, tax impact analysis
- [ ] **AG_NPA_RMG** — Risk Management Group agent
  - Owns: Section IV (Risk Analysis), Section VI (Other Risks)
  - Knowledge: MAS Notice 637, risk frameworks, capital calc methods, stress scenarios
  - Capabilities: Market risk assessment, credit risk analysis, liquidity risk, reputational risk
- [ ] **AG_NPA_LCS** — Legal, Compliance & Secretariat agent
  - Owns: Appendix 1–6
  - Knowledge: Banking Act, AML/CFT regs, IP law, PDPA, sanctions lists
  - Capabilities: Legal opinion drafting, compliance checklists, financial crime assessment

### 3.2 Backend Integration

- [ ] Add Dify API keys for 5 new Chat Agent apps in `server/config/dify-agents.js`
- [ ] Add proxy route entries in `server/routes/dify-proxy.js`
- [ ] Create conversation management per agent per NPA project
- [ ] Implement SSE streaming from Dify Chat API to frontend
- [ ] Add context injection — send current section fields as system context to agent

### 3.3 Frontend Wiring

- [ ] Replace mock `sendChatMessage()` with real Dify Chat API call
- [ ] Stream agent responses token-by-token into chat panel
- [ ] Auto-switch active agent tab when user navigates to a section owned by different group
- [ ] Parse `@@NPA_META@@{json}` from agent responses for structured field suggestions
- [ ] "Apply Suggestion" button — agent suggests field values, user clicks to apply
- [ ] Conversation history persistence (per agent, per NPA)
- [ ] Agent typing indicator during streaming
- [ ] Error handling — show friendly message if agent is unavailable

---

## Phase 4: Autofill Pipeline Enhancement

> **Goal:** 2-phase autofill covers all 250+ fields with correct strategies

### 4.1 Phase 1 — RULE + COPY (Express Backend)

- [ ] Update `/api/npas/:id/prefill` route for new fields
- [ ] Map RULE strategy fields — fields derivable from product config / org data:
  - Product name, BU, product manager, product type, booking entity
  - Regulatory reporting requirements, jurisdiction codes
  - Sign-off party routing (based on product type)
- [ ] Map COPY strategy fields — fields copyable from similar past NPA:
  - Operating model, booking process, settlement method
  - Legal opinions, compliance assessments
  - Distribution channels, marketing approach
- [ ] Implement similarity search for finding reference NPA
- [ ] Return filled fields with lineage metadata

### 4.2 Phase 2 — LLM (Dify Workflow)

- [ ] Update AUTOFILL Dify workflow with new field definitions
- [ ] Generate LLM fields:
  - Risk analysis narratives, stress scenarios
  - Business rationale, market analysis
  - Reputational risk assessment, ESG assessment
  - Financial crime risk evaluation
- [ ] Stream field-by-field generation to Draft Builder
- [ ] Apply confidence scores to each LLM-generated field

### 4.3 Validation Layer

- [ ] Client-side field validation rules:
  - Required fields check
  - Format validation (date, currency, email)
  - Cross-field consistency (e.g., total revenue vs. breakdown)
- [ ] Server-side Zod schema validation on persist
- [ ] Warning vs. Error distinction (warnings don't block save)
- [ ] Validation summary panel in Draft Builder

---

## Phase 5: Advanced Features

> **Goal:** Production-grade capabilities

### 5.1 NPA Lite vs. Full NPA

- [ ] Conditional section visibility based on approval_track
- [ ] NPA Lite skips certain sections (reduced field set)
- [ ] Dynamic required fields based on track selection
- [ ] Track selection drives sign-off party requirements

### 5.2 Document Management

- [ ] Required documents list per product type
- [ ] Document upload with drag-and-drop in Draft Builder
- [ ] Document validation status indicators
- [ ] Auto-extraction of key data from uploaded documents (via DILIGENCE agent)
- [ ] Document expiry tracking

### 5.3 Approval Workflow

- [ ] Real sign-off party routing (replace hardcoded 'current_user')
- [ ] Email/notification on sign-off request
- [ ] Loop-back workflow — rejection → re-edit → re-submit
- [ ] Parallel sign-off tracking (multiple parties sign simultaneously)
- [ ] SLA countdown timers per sign-off party
- [ ] Escalation path when SLA breached

### 5.4 Audit & Compliance

- [ ] Field-level change history (who changed what, when)
- [ ] Version comparison between NPA drafts
- [ ] Compliance gap report generation
- [ ] Banking Act Section 47 warning enforcement
- [ ] MAS Notice 637 reference validation

### 5.5 Post-Launch Monitoring

- [ ] PIR (Post-Implementation Review) automation
- [ ] Evergreen product renewal scheduling
- [ ] Dormancy detection and enforcement
- [ ] Breach alert escalation workflow
- [ ] Performance metric dashboards

---

## Phase 6: Polish & Production Readiness

> **Goal:** Enterprise-grade UX and reliability

### 6.1 UX Improvements

- [ ] Keyboard navigation through fields (Tab, Enter, Escape)
- [ ] Auto-save draft every 30 seconds
- [ ] Undo/redo for field changes
- [ ] Print-friendly NPA document export (PDF)
- [ ] Progress percentage on stepper (visual)
- [ ] Mobile-responsive layout adjustments

### 6.2 Performance

- [ ] Lazy-load sections (only render active section DOM)
- [ ] Virtual scrolling for sections with 50+ fields
- [ ] Debounced field updates (avoid excessive saves)
- [ ] Optimistic UI updates for chat messages
- [ ] Cache agent responses for repeated queries

### 6.3 Testing

- [ ] Unit tests for template definition (field count, structure)
- [ ] Unit tests for field type rendering components
- [ ] Integration tests for autofill pipeline
- [ ] E2E tests for Draft Builder workflow
- [ ] Agent response parsing tests

### 6.4 Security & Access Control

- [ ] Role-based field visibility (sign-off parties see only their sections)
- [ ] Read-only mode for submitted NPAs
- [ ] Audit log for all field modifications
- [ ] Session timeout handling
- [ ] Data encryption for sensitive fields

---

## Implementation Priority Matrix

| Phase | Effort | Impact | Priority | ETA |
|-------|--------|--------|----------|-----|
| **Phase 1:** Golden Template Expansion | High (3-5 days) | Critical | P0 — Do First | Week 1 |
| **Phase 2:** UI Field Type Rendering | High (3-4 days) | Critical | P0 — Do First | Week 1-2 |
| **Phase 3:** Sign-Off Party Agents | Medium (2-3 days) | High | P1 — Do Next | Week 2-3 |
| **Phase 4:** Autofill Enhancement | Medium (2-3 days) | High | P1 — Do Next | Week 3 |
| **Phase 5:** Advanced Features | High (5-7 days) | Medium | P2 — Plan | Week 4-5 |
| **Phase 6:** Polish & Production | Medium (3-4 days) | Medium | P2 — Plan | Week 5-6 |

---

## File Impact Map

| File | Phase | Changes |
|------|-------|---------|
| `src/app/lib/npa-template-definition.ts` | 1 | Expand from 87 to 250+ fields, add field type metadata |
| `src/app/pages/npa-agent/npa-draft-builder/npa-draft-builder.component.ts` | 2, 3 | Add field type renderers, wire chat agents |
| `src/app/pages/npa-agent/npa-draft-builder/npa-draft-builder.component.html` | 2 | Add templates for 14 field types |
| `src/app/pages/npa-agent/npa-draft-builder/npa-draft-builder.component.css` | 2 | Styles for new field types |
| `src/app/pages/npa-agent/npa-detail/npa-detail.component.ts` | 4 | Update autofill pipeline for new fields |
| `src/app/services/dify/dify.service.ts` | 3 | Add 5 new agent IDs, conversation mgmt |
| `src/app/services/dify/dify-agent.service.ts` | 3 | Register 5 chat agents in capability map |
| `server/config/dify-agents.js` | 3 | Add API keys for 5 new agents |
| `server/routes/dify-proxy.js` | 3 | Ensure chat proxy supports new agents |
| `server/routes/npas.js` | 4 | Update prefill logic for 250+ fields |
| `src/app/shared/icons/shared-icons.module.ts` | 2 | Add icons for new field types |

---

## Quick Reference: Field Type Count by Section

| Section | Text | Textarea | Dropdown | Multi-select | Yes/No | Checkbox | Bullet List | File Upload | Table Grid | Flowchart | Date | Repeatable | Conditional | Ref Link | **Total** |
|---------|------|----------|----------|--------------|--------|----------|-------------|-------------|------------|-----------|------|------------|-------------|----------|-----------|
| Part A | 8 | 1 | 2 | — | 1 | — | — | — | — | — | 1 | — | 1 | — | **14** |
| Part B | 1 | — | — | — | — | 5 | — | — | — | — | — | — | — | — | **6** |
| Sec I | 3 | 12 | 2 | 1 | 1 | — | 1 | 4 | — | — | — | 1 | 1 | — | **26** |
| Sec II | 2 | 20 | 1 | — | 8 | 7 | — | — | 1 | 2 | — | — | — | 1 | **42** |
| Sec III | 1 | 3 | — | — | 3 | — | — | — | — | — | 1 | — | — | — | **8** |
| Sec IV | 2 | 35 | 3 | — | 15 | — | — | — | 2 | — | — | — | — | — | **57** |
| Sec V | — | 5 | — | — | 3 | — | — | — | — | — | — | — | — | 2 | **10** |
| Sec VI | — | 1 | — | — | — | — | — | — | — | — | — | — | — | — | **1** |
| Sec VII | — | — | — | — | — | — | — | — | — | — | — | — | — | 1 | **1** |
| App 1 | 5 | — | — | — | — | — | — | — | 1 | — | — | — | — | — | **6** |
| App 2 | — | 1 | — | — | 3 | — | — | — | — | — | — | — | — | — | **4** |
| App 3 | — | 8 | — | — | 9 | — | — | — | — | — | — | — | — | 1 | **18** |
| App 4 | — | 2 | — | — | 2 | — | — | — | — | — | — | — | — | — | **4** |
| App 5 | — | 8 | — | — | 5 | 2 | — | — | — | — | — | — | — | — | **15** |
| App 6 | — | 12 | — | — | 15 | 2 | — | — | 1 | — | — | — | — | — | **30** |
| **TOTAL** | **22** | **108** | **8** | **1** | **65** | **16** | **1** | **4** | **5** | **2** | **2** | **1** | **2** | **5** | **~242** |

---

## Dependencies & Prerequisites

| Dependency | Status | Blocker For |
|------------|--------|-------------|
| Angular 20 dev server | ✅ Running (port 4200) | All frontend work |
| Express backend | ✅ Running (port 3000) | API calls, autofill |
| PostgreSQL DB | ✅ Active | Persistence |
| Dify platform | ✅ Accessible | Agent chat, workflows |
| SharedIconsModule | ✅ Fixed | Icon rendering |
| NPA Template Specification | ✅ Extracted (250+ fields) | Phase 1 |
| 5 Dify Chat Agent Apps | ❌ Not created yet | Phase 3 |
| MAS Notice 637 reference text | ❌ Not ingested | Phase 3 agent knowledge |

---

## Definition of Done (per Phase)

### Phase 1 Done When:
- [ ] `npa-template-definition.ts` has 240+ field definitions
- [ ] Every field has explicit `fieldType` property (not inferred)
- [ ] Every field has `strategy` assignment (RULE/COPY/LLM/MANUAL)
- [ ] Conditional fields have `dependsOn` metadata
- [ ] Repeatable sections marked with `repeatable: true`
- [ ] Table fields have `tableColumns` / `tableRows` defined
- [ ] File compiles with zero TypeScript errors
- [ ] Draft Builder renders all sections in stepper (no crashes)

### Phase 2 Done When:
- [ ] All 14 field types render correctly in Draft Builder
- [ ] User can interact with every field type (edit, select, upload, add rows)
- [ ] Field chrome (badges, tooltips, streaming) works for all types
- [ ] Responsive layout maintained with complex fields
- [ ] Zero console errors during normal usage

### Phase 3 Done When:
- [ ] 5 Dify Chat Agent apps created and responding
- [ ] Chat panel sends real messages to correct agent based on active section
- [ ] Agent responses stream token-by-token
- [ ] "Apply Suggestion" parses agent field suggestions and fills fields
- [ ] Conversation history persists across page refreshes

### Phase 4 Done When:
- [ ] Phase 1 prefill (RULE+COPY) covers all applicable fields
- [ ] Phase 2 autofill (LLM) generates content for all LLM strategy fields
- [ ] Streaming autofill works in Draft Builder live view
- [ ] Field validation runs on save with clear error messages
- [ ] Coverage percentage reaches 70%+ on autofill

### Phase 5 Done When:
- [ ] NPA Lite track shows reduced field set
- [ ] Document upload integrated into Draft Builder
- [ ] Approval workflow routes to real sign-off parties
- [ ] Loop-back re-submission works end-to-end
- [ ] Audit trail captures all field changes

### Phase 6 Done When:
- [ ] PDF export produces formatted NPA document
- [ ] Auto-save prevents data loss
- [ ] All unit tests pass
- [ ] E2E test covers create → fill → submit → approve flow
- [ ] Performance: Draft Builder loads < 2 seconds
- [ ] No accessibility violations (WCAG 2.1 AA)

---

*This roadmap is a living document. Update checkboxes as tasks are completed.*
