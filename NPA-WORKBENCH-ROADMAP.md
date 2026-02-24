# NPA Agentic Workbench — Detailed Roadmap & Checklist

> **Project:** COO Agentic Workbench — NPA (New Product Approval) Module
> **Version:** RMG OR Template Jun 2025
> **Last Updated:** 2026-02-24
> **Status:** Phase 3 COMPLETE — All 5 sign-off agents live on Dify Cloud, tested end-to-end

---

## Current State Summary

| Metric                     | Value                                                                                                                                                                                                                                                   |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Golden Template Fields     | **339** (expanded from 87→251→339, target 250+ exceeded) ✅                                                                                                                                                                                             |
| Field Types Rendered in UI | 14 of 16 implemented (text, textarea, dropdown, multiselect, yesno, checkbox_group, bullet_list, date, currency, header, table_grid, reference_link, conditional, file_upload) — 2 deferred (flowchart→textarea alias, repeatable→textarea fallback) ✅ |
| Dify Agents Defined        | 18 in backend config — all 18 live on Dify Cloud (17 HEALTHY, 1 AUTOFILL ERROR expected) ✅                                                                                                                                                             |
| Draft Builder Status       | 3-column layout refactored into 5 sub-components, field rendering working, 5 sign-off chat agents live                                                                                                                                                  |
| Backend Endpoints          | ~15 routes operational                                                                                                                                                                                                                                  |
| DB Tables                  | ~12 tables active                                                                                                                                                                                                                                       |
| Agent Orchestration Waves  | W0→W1→W2→W3 pipeline coded (detail page)                                                                                                                                                                                                                |
| Strategy Distribution      | RULE=63, COPY=60, LLM=149, MANUAL=67                                                                                                                                                                                                                    |
| Fields with dependsOn      | 26 conditional fields                                                                                                                                                                                                                                   |
| Fields marked required     | 7 (adequate for MVP)                                                                                                                                                                                                                                    |
| Template tree coverage     | All registry fields now mapped to tree nodes ✅                                                                                                                                                                                                         |

---

## Phase 4: Grounding & Citations _(New Priority — 2026-02-24)_

> **Goal:** Ensure ALL agents (COO/NPA orchestrators, Ideation, Query Assistant, 5 sign-off agents) answer using **PDF + KB datasets only**, with **inline citations** (e.g. `[1]`) and a **Sources panel**, backed by deterministic gates and auditability.

- [ ] Define a single response contract: `answer_markdown` + `citations[]` (doc_id/title/dataset/page/section/excerpt/confidence/chunk_id)
- [ ] Enforce **RAG-only** grounding (no web, no uncited policy claims; “not found” → ask for upload)
- [ ] Implement deterministic **Truth Table** gates (eligibility/prohibited/cross-border/required docs/sign-offs)
- [ ] Implement **Automated Reasoning** (rule-based orchestration: next question, missing prerequisites, readiness state)
- [ ] Implement **Weights** only for ranking evidence/confidence/prioritization (never for compliance decisions)
- [ ] Persist citations per message in DB; render citations consistently across all chat surfaces + history
- [ ] Add QA gates + strict mode flags (per agent) to prevent uncited compliance assertions

**Checklist:** `docs/2026-02-24_Grounding_Citations_TruthTables_Checklist.md`

### Phase 1 Audit — Gap Resolution (completed 2026-02-23)

| Gap                                                | Resolution                                                                                                                                                                         |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Part A (13 fields) & Part B (routing table) absent | ✅ By design — handled outside template editor                                                                                                                                     |
| 8 of 16 NpaFieldType values unused                 | ✅ Fixed: checkbox_group now used (ops_adequacy, tp_certifications). 6 remaining (file_upload, table_grid, flowchart, repeatable, conditional, reference_link) are Phase 2 UI work |
| Section I.2 Target Customer: flat                  | ✅ Fixed: Restructured with a-g sub-question children                                                                                                                              |
| Section I.3 Commercialization: missing d, e        | ✅ Fixed: Added sales_surveillance (d) and staff_training (e)                                                                                                                      |
| Section II.1: only a-b                             | ✅ Fixed: Added c-j (ops adequacy, account controls, limits, manual fallback, collateral mgmt, custody, trade repository, SFEMC)                                                   |
| Section II.5 BCM: 3 fields                         | ✅ Fixed: Expanded to 12 fields                                                                                                                                                    |
| Section IV.A.3 Financial Crimes: missing           | ✅ Fixed: Added 5 fields + tree node                                                                                                                                               |
| Section IV.A.D Funding Liquidity Risk: missing     | ✅ Fixed: Added 5 fields + tree node                                                                                                                                               |
| Appendix 3: 7 fields                               | ✅ Fixed: Expanded to 19 fields across 4 sub-sections                                                                                                                              |
| Appendix 6: 5 fields                               | ✅ Fixed: Expanded to 30 fields across 6 sub-sections                                                                                                                              |
| Strategy comment inaccurate                        | ✅ Fixed: Updated to RULE=63, COPY=60, LLM=149, MANUAL=67                                                                                                                          |
| 40 orphan registry fields                          | ✅ Fixed: All fields now mapped to tree nodes                                                                                                                                      |
| Duplicate `valuation_model` in tree                | ✅ Fixed: Renamed to `app5_valuation_model` for APP.5.4                                                                                                                            |

---

## Phase 1: Foundation — Golden Template Expansion _(Current Priority)_

> **Goal:** Align `npa-template-definition.ts` (87 fields) with the full NPA Template spec (250+ fields)

### 1.1 Part A & Part B — Header Fields

- [x] ~~Add Part A fields to template definition~~ — **SKIPPED: intentionally handled outside template editor per design** (lines 7-10 of npa-template-definition.ts)
- [x] ~~Add Part B sign-off party routing table~~ — **SKIPPED: handled outside template editor per design**
- [x] ~~Implement conditional logic — NPA Lite justification fields~~ — **SKIPPED: Part A scope**

### 1.2 Section I — Product Specifications (Basic Information)

- [x] **1.Description** — Expanded to 30+ fields across 5 sub-questions (a-e):
  - [x] a. Purpose/Rationale — 5 fields (business_rationale, problem_statement, value_proposition, customer_benefit, bu_benefit)
  - [x] b. Scope & Parameters — 12 fields (product_name, product_type, underlying_asset, currency_denomination, tenor, funding_type, repricing_info, product_role, product_maturity, product_lifecycle, product_features)
  - [x] c. Transaction Volume & Revenue — 8 fields (notional_amount, revenue_year1/2/3 gross & net, expected_volume)
  - [x] d. Business Model — 4 fields (target_roi, revenue_streams, gross_margin_split, cost_allocation)
  - [x] e. SPV details — 4 fields with conditional (spv_involved, spv_details, spv_arranger, spv_country)
- [ ] **2.Target Customer** — 6 fields exist but need a-g sub-question structure:
  - [x] a. Target customer segment — `customer_segments` (multiselect) ✅
  - [x] b. Regulatory restrictions — `customer_restrictions` (textarea) ✅
  - [x] c. Suitability criteria — `customer_suitability` (textarea) ✅ (covers domicile)
  - [x] d. Minimum turnover — `customer_min_turnover` (currency) ✅
  - [x] e. Geographic scope — `customer_geographic` (multiselect) ✅
  - [x] f. Customer objectives — `customer_objectives` (textarea, LLM) ✅ ADDED
  - [x] g. Key risks faced by target customers — `customer_key_risks` (textarea, LLM) ✅ ADDED
  - [x] Template tree restructured with a-g sub-question children ✅
- [x] **3.Commercialization** — All 5 sub-questions present ✅:
  - [x] a. Channel availability — `distribution_channels` (multiselect) + `channel_rationale` (textarea) ✅
  - [x] b. Sales suitability — `sales_suitability` + `onboarding_process` + `kyc_requirements` + `complaints_handling` ✅
  - [x] c. Marketing strategy — `marketing_plan` (textarea) ✅
  - [x] d. Sales surveillance — `sales_surveillance` (textarea, COPY) ✅ ADDED
  - [x] e. Staff training — `staff_training` (textarea, COPY) ✅ ADDED
- [x] **4.PAC Conditions** — 3 fields: `pac_reference` (text), `pac_conditions` (bullet_list ✅), `pac_date` (date) ✅
- [x] **5.External Parties** — 5 fields with conditional visibility ✅:
  - [x] `external_parties_involved` (yesno) ✅
  - [x] `ip_considerations` (textarea, conditional) ✅
  - [x] `external_party_names` (bullet_list, conditional) ✅
  - [x] `rasp_reference` (text, conditional) ✅
  - [x] `esg_data_used` (yesno) ✅
  - Note: `repeatable` fieldType deferred to Phase 2 UI — flat structure works for MVP

### 1.3 Section II — Operational & Technology Information (60+ fields, DONE)

- [x] **1.Operational Information** — All a-j sub-questions present ✅:
  - [x] a. Operating Model — 5 fields ✅
  - [x] b. Booking Process — 11 fields (incl. stp_rate, nostro_accounts) ✅
  - [x] c. Operational Adequacy — `ops_adequacy_checklist` (checkbox_group, 7 items) ✅ ADDED
  - [x] d. Operating Account Controls — `operating_account_controls` (textarea) ✅ ADDED
  - [x] e. Limit Structure — `limit_structure` + `limit_monitoring` ✅ ADDED
  - [x] f. Manual Fallback — `manual_fallback` (yesno) + `manual_fallback_details` (conditional) ✅ ADDED
  - [x] g. Collateral Mgmt — 4 fields (eligibility, haircuts, frequency, disputes) ✅ ADDED
  - [x] h. Custody Account — `custody_required` (yesno) + `custody_details` (conditional) ✅ ADDED
  - [x] i. Trade Repository — `trade_repository_reporting` (textarea) ✅ ADDED
  - [x] j. SFEMC — `sfemc_references` (textarea) ✅ ADDED
- [x] **2.Service Platform** — 12 fields across 3 sub-questions (incl. trade_capture, risk_system, reporting_system) ✅
- [x] **3.Information Security** — 4 fields (adequate for MVP) ✅
- [x] **4.Technology Resiliency** — 5 fields ✅
- [x] **5.Business Continuity Management** — 12 fields (expanded from 3) ✅ ADDED

### 1.4 Section III — Pricing Model Details (15 fields, DONE)

- [x] **1.Pricing model validation** — 8 fields (incl. fva_adjustment, xva_treatment, day_count_convention) ✅
- [x] **2.Model name & validation date** — 4 fields ✅
- [x] **3.SIMM treatment** — 3 fields (incl. simm_backtesting) ✅ ADDED

### 1.5 Section IV — Risk Analysis _(Most Complex)_ (80+ fields, DONE)

- [x] **A.1 Legal & Compliance** — 9 fields covering a-g with MAS references ✅
- [x] **A.2 Finance and Tax** — 12 fields ✅ EXPANDED:
  - [x] a-d basic fields ✅
  - [x] e. Service output fees — 3 fields (service_output_fees, service_fee_structure, service_fee_allocation) ✅ ADDED
  - [x] f. Tax considerations ✅
  - [x] g. Regulatory matching — 4 fields (reg_matching_ifrs, \_mas, \_gst, \_wht) ✅ ADDED
- [x] **A.3 Financial Crimes & Financial Security** — 5 fields ✅ NEW:
  - [x] a. Conduct considerations — `fc_conduct_considerations` ✅
  - [x] b. MAR assessment — `fc_mar_assessment` + `fc_mar_sub_items` (bullet_list) ✅
  - [x] c. MRA boundary test — `fc_mra_boundary_test` (yesno) + `fc_mra_details` (conditional) ✅
- [x] **A.D Funding Liquidity Risk** — 5 fields ✅ NEW:
  - [x] LCR/NSFR/EAFL metrics — `flr_lcr_nsfr_metrics` ✅
  - [x] HQLA qualification — `flr_hqla_qualification` (yesno) ✅
  - [x] Cashflow modeling — `flr_cashflow_modeling` ✅
  - [x] Liquidity facility — `flr_liquidity_facility` (yesno) ✅
  - [x] Limit implementation — `flr_limit_implementation` ✅
- [x] **B.1 Market Risk** — 14 fields including risk factor matrix + model_risk ✅
- [x] **B.2 Market Risk Regulatory Capital** — 4 fields ✅
- [x] **B.3 Funding/Liquidity Risk** — 4 fields ✅
- [x] **C. Credit Risk** — 20+ fields incl. wrong_way_risk, netting_agreements, isda_master, csa, cva_dva ✅
- [x] **D. Reputational Risk** — 7 fields (incl. country_risk) ✅

### 1.6 Section V — Data Management (18 fields, DONE)

- [x] **1.D4D requirements** — 9 fields (incl. data_lineage, data_classification) ✅
- [x] **2.PURE principles** — 5 fields ✅
- [x] **3.Risk Data Aggregation** — 3 fields (incl. rda_reporting_frequency) ✅ ADDED

### 1.7 Section VI & VII (5 fields, DONE)

- [x] **VI. Other Risk** — 3 fields (yesno + 2 conditional textarea) — exceeds roadmap's 1 ✅
- [x] **VII. Trading Products** — 2 fields (yesno + conditional) ✅
  - [ ] Nice-to-have: `appendix5_required` could use `reference_link` fieldType instead of `yesno`

### 1.8 Appendices 1–6

- [x] **Appendix 1: Entity/Location** — 15 fields + table node with 4 rows + additional entity topic ✅
- [x] **Appendix 2: IP** — 5 fields matching Part A (2) + Part B (3) ✅
- [x] **Appendix 3: Financial Crime** — 19 fields across 4 sub-sections ✅ EXPANDED:
  - [x] Risk Assessment — 7 fields (aml, terrorism, sanctions, fraud, bribery, rating, mitigation) ✅
  - [x] Policies & Controls — 7 fields (policy, screening, monitoring, reporting, records, training, testing) ✅ ADDED
  - [x] Validation & Surveillance — 3 fields ✅ ADDED
  - [x] Data Privacy — 2 fields ✅ ADDED
- [x] **Appendix 4: RDAR** — 4 fields (incl. rda_data_quality) ✅ ADDED
- [x] **Appendix 5: Trading Products** — 24 fields across 7 topics (incl. app5_valuation_model, margin, netting, reporting) ✅
- [x] **Appendix 6: Third-Party Platforms** — 30 fields across 6 sub-sections ✅ EXPANDED:
  - [x] Part A: Description — 4 fields (platform toggle, name, use case, justification) ✅
  - [x] Part B: Risk Assessment — 3 fields (assessment, rating, mitigants) ✅
  - [x] Part C.1: Context Questions — 5 fields ✅
  - [x] Part C.2: Information Security — 7 fields (incl. certifications checkbox_group) ✅
  - [x] Part C.3: Cybersecurity — 4 fields ✅
  - [x] Part C.4: IP/Data/Privacy — 10 fields ✅

### 1.9 Template Infrastructure

- [x] Add `NpaFieldType` union type — 16 values defined in `npa-interfaces.ts` ✅
  ```
  text | textarea | dropdown | multiselect | yesno | checkbox_group |
  bullet_list | file_upload | table_grid | flowchart | date |
  repeatable | conditional | reference_link | currency | header
  ```
- [x] Add `options` array property for dropdowns and multi-selects ✅ (16 dropdown, 4 multiselect fields use it)
- [x] Add `dependsOn` property (`{ field: string, value: string }`) ✅ (22 fields use it)
- [x] ~~Add `repeatable` boolean~~ — deferred to Phase 2 (flat structure works for MVP) ✅
- [ ] Add `attachable` boolean for fields that support file attachments — Phase 2
- [ ] Add `referenceUrl` property for reference link fields — Phase 2
- [x] Add `tableColumns` and `tableRows` for table_grid fields ✅ (on TemplateNode, 2 tables defined)
- [x] Every field has explicit `fieldType` — all 251 fields ✅
- [x] Fix: All orphan registry fields integrated into tree nodes ✅
- [x] Fix: Duplicate `valuation_model` renamed to `app5_valuation_model` for APP.5.4 ✅
- [x] Fix: Strategy distribution comment updated to match actual counts ✅

---

## Phase 2: UI Field Type Rendering

> **Goal:** Draft Builder renders all 16 field types correctly

### 2.1 Basic Field Types

- [x] **Text Input** — Single line, `<input type="text">` with ngModel, lineage-aware borders ✅
- [x] **Text Area** — Auto-resize on input, `resize-none overflow-hidden`, `autoResize()` method ✅
- [x] **Date Picker** — Native `<input type="date">` ✅
- [x] **Currency Input** — Dynamic prefix `{{ field.currencyCode || 'SGD' }}`, `currencyCode` on FieldState ✅

### 2.2 Selection Fields

- [x] **Dropdown (Single Select)** — `<select>` with options from template ✅
- [x] **Multi-Select** — Tag-style input with clickable option pills ✅
- [x] **Yes/No Radio** — Custom radio-style buttons with conditional detail textarea ✅
- [x] **Checkbox Group** — Native checkboxes from `field.options` ✅

### 2.3 Complex Fields

- [x] **Dynamic Bullet List** — Add/remove/edit items with numbered inputs ✅
- [x] **File Upload** — Drag-and-drop UI with upload-cloud icon, multi-file support, remove individual files ✅
- [x] **Table Grid** — Full editable table with configurable columns, add/remove rows, cell editing ✅
  - [x] Support configurable columns via `field.tableColumns` ✅
  - [x] Cell types: text input per cell ✅
  - [x] Add/remove row capability ✅
  - [x] Fallback textarea when no columns defined ✅
- [x] **Flowchart / Mermaid** — Aliased to textarea with auto-resize ✅ (Mermaid rendering deferred to Phase 5)
- [x] **Repeatable Section** — Textarea with "Repeatable section" hint ✅ (full "Add Another" block deferred to Phase 5)
- [x] **Conditional Fields** — Show/hide via `dependsOn` works in parent `shouldShowField()` ✅
  - [x] `dependsOn` → watches field value changes ✅
  - [ ] Smooth show/hide animation (CSS class defined but never applied) — nice-to-have
- [x] **Reference Link** — Clickable `<a>` link with `referenceUrl`, fallback to read-only span ✅
- [x] **Header** — Display-only section header with italic placeholder text ✅

### 2.4 Field Chrome (Shared Features)

- [x] Lineage badge (AUTO / ADAPTED / MANUAL) ✅
- [x] Strategy badge (RULE / COPY / LLM / MANUAL) ✅
- [x] Confidence score indicator ✅
- [x] Streaming animation ✅
- [x] Tooltip/guidance text — field-level tooltip with hover popup (info icon + absolute positioned tooltip) ✅
- [x] Required field indicator — asterisk shown ✅ + red border (`border-red-300`) on empty required fields ✅
- [x] Validation error messages — inline red alert below field with `field.validationError`, cleared on edit ✅
- [x] "Ask Agent" button — sparkles icon, emits event ✅
- [ ] Field-level comments / annotations — deferred to Phase 5
- [x] Attach file to any field (where `attachable: true`) ✅

---

## Phase 3: Draft Builder Chat — Sign-Off Party Agents

> **Goal:** Wire the right-panel chat to 5 real Dify Chat Agent apps

### 3.1 Dify Chat Agent Apps (Create in Dify)

- [x] **AG_NPA_BIZ** — Business/Proposing Unit agent ✅ _Created on Dify Cloud, claude-sonnet-4-5, tested_
  - Owns: Section I (Product Specs), Section VII (Trading Info)
  - Knowledge: Product catalogs, PAC minutes, market analysis
  - Capabilities: Product description drafting, market sizing, customer profiling
  - Backend config: ✅ `dify-agents.js` + env var `DIFY_KEY_AG_NPA_BIZ`
  - Dify app: `cloud.dify.ai/app/5ab6ddbc-1eb5-4d94-a761-227e7891818c`
- [x] **AG_NPA_TECH_OPS** — Technology & Operations agent ✅ _Created on Dify Cloud, claude-sonnet-4-5, tested_
  - Owns: Section II (Operational & Technology)
  - Knowledge: System architecture docs, BCP templates, DR runbooks
  - Capabilities: Operating model drafting, system impact assessment, BCM planning
  - Backend config: ✅ `dify-agents.js` + env var `DIFY_KEY_AG_NPA_TECH_OPS`
- [x] **AG_NPA_FINANCE** — Finance agent ✅ _Created on Dify Cloud, claude-sonnet-4-5, tested_
  - Owns: Section III (Pricing), Section V (Data Management)
  - Knowledge: Pricing models, SIMM docs, RDAR policies, PURE guidelines
  - Capabilities: Pricing methodology, model validation, tax impact analysis
  - Backend config: ✅ `dify-agents.js` + env var `DIFY_KEY_AG_NPA_FINANCE`
  - Dify app: `cloud.dify.ai/app/d256d4ed-0b0c-4262-ab46-45a60b56dfd1`
- [x] **AG_NPA_RMG** — Risk Management Group agent ✅ _Created on Dify Cloud, claude-sonnet-4-5, tested_
  - Owns: Section IV (Risk Analysis), Section VI (Other Risks)
  - Knowledge: MAS Notice 637, risk frameworks, capital calc methods, stress scenarios
  - Capabilities: Market risk assessment, credit risk analysis, liquidity risk, reputational risk
  - Backend config: ✅ `dify-agents.js` + env var `DIFY_KEY_AG_NPA_RMG`
  - Dify app: `cloud.dify.ai/app/b0eb2daf-6bd1-41db-9499-cea5f88207eb`
- [x] **AG_NPA_LCS** — Legal, Compliance & Secretariat agent ✅ _Created on Dify Cloud, claude-sonnet-4-5, tested_
  - Owns: Appendix 1–6
  - Knowledge: Banking Act, AML/CFT regs, IP law, PDPA, sanctions lists
  - Capabilities: Legal opinion drafting, compliance checklists, financial crime assessment
  - Backend config: ✅ `dify-agents.js` + env var `DIFY_KEY_AG_NPA_LCS`
  - Dify app: `cloud.dify.ai/app/3894b0f4-ad5c-40d6-8e2e-7259934dd1cc`

### 3.2 Backend Integration

- [x] Add Dify API keys for 5 new Chat Agent apps in `server/config/dify-agents.js` ✅
  - All 5 agents added with `type: 'chat'`, Tier 3, proper icons/colors
  - Env vars: `DIFY_KEY_AG_NPA_BIZ`, `DIFY_KEY_AG_NPA_TECH_OPS`, `DIFY_KEY_AG_NPA_FINANCE`, `DIFY_KEY_AG_NPA_RMG`, `DIFY_KEY_AG_NPA_LCS`
- [x] Proxy routes already handle chat generically via `/api/dify/chat` — no changes needed ✅
- [x] Conversation management: DifyService maintains per-agent conversation_id Map ✅
- [x] SSE streaming: `sendMessageStreamed()` pipes SSE to Observable<StreamEvent> ✅
- [x] Context injection: `buildAgentContext()` sends current section field values as prompt context ✅

### 3.3 Frontend Wiring

- [x] Real Dify Chat API call via `difyService.sendMessageStreamed()` — already wired ✅
- [x] Stream agent responses token-by-token — `chat.streamText` shows live text in chat bubble ✅
- [x] Auto-switch active agent tab on section navigation — `selectSection()` calls `getSectionOwner()` ✅
- [x] Parse `@@NPA_META@@{json}` — `parseNpaMeta()` extracts field suggestions from response ✅
- [x] "Apply Suggestion" button — per-suggestion "Apply" + "Apply All" buttons in chat panel ✅
  - `onApplySuggestion()` emits to parent → `onApplyFieldSuggestion()` updates fieldMap
  - Sets lineage to 'ADAPTED', applies confidence, clears validation errors
- [ ] Conversation history persistence (per agent, per NPA) — in-memory only, lost on refresh
- [x] Agent typing indicator with live streaming text (cursor blink animation) ✅
- [x] Error handling — shows helpful message with Dify app name + env var to configure ✅
- [x] 5 agents added to `AGENT_REGISTRY` in `agent-interfaces.ts` ✅

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

| Phase                                  | Effort            | Impact   | Priority      | ETA      |
| -------------------------------------- | ----------------- | -------- | ------------- | -------- |
| **Phase 1:** Golden Template Expansion | High (3-5 days)   | Critical | P0 — Do First | Week 1   |
| **Phase 2:** UI Field Type Rendering   | High (3-4 days)   | Critical | P0 — Do First | Week 1-2 |
| **Phase 3:** Sign-Off Party Agents     | Medium (2-3 days) | High     | P1 — Do Next  | Week 2-3 |
| **Phase 4:** Autofill Enhancement      | Medium (2-3 days) | High     | P1 — Do Next  | Week 3   |
| **Phase 5:** Advanced Features         | High (5-7 days)   | Medium   | P2 — Plan     | Week 4-5 |
| **Phase 6:** Polish & Production       | Medium (3-4 days) | Medium   | P2 — Plan     | Week 5-6 |

---

## File Impact Map

| File                                                                         | Phase | Changes                                                |
| ---------------------------------------------------------------------------- | ----- | ------------------------------------------------------ |
| `src/app/lib/npa-template-definition.ts`                                     | 1     | Expand from 87 to 250+ fields, add field type metadata |
| `src/app/pages/npa-agent/npa-draft-builder/npa-draft-builder.component.ts`   | 2, 3  | Add field type renderers, wire chat agents             |
| `src/app/pages/npa-agent/npa-draft-builder/npa-draft-builder.component.html` | 2     | Add templates for 14 field types                       |
| `src/app/pages/npa-agent/npa-draft-builder/npa-draft-builder.component.css`  | 2     | Styles for new field types                             |
| `src/app/pages/npa-agent/npa-detail/npa-detail.component.ts`                 | 4     | Update autofill pipeline for new fields                |
| `src/app/services/dify/dify.service.ts`                                      | 3     | Add 5 new agent IDs, conversation mgmt                 |
| `src/app/services/dify/dify-agent.service.ts`                                | 3     | Register 5 chat agents in capability map               |
| `server/config/dify-agents.js`                                               | 3     | Add API keys for 5 new agents                          |
| `server/routes/dify-proxy.js`                                                | 3     | Ensure chat proxy supports new agents                  |
| `server/routes/npas.js`                                                      | 4     | Update prefill logic for 250+ fields                   |
| `src/app/shared/icons/shared-icons.module.ts`                                | 2     | Add icons for new field types                          |

---

## Quick Reference: Field Type Count by Section

| Section   | Text   | Textarea | Dropdown | Multi-select | Yes/No | Checkbox | Bullet List | File Upload | Table Grid | Flowchart | Date  | Repeatable | Conditional | Ref Link | **Total** |
| --------- | ------ | -------- | -------- | ------------ | ------ | -------- | ----------- | ----------- | ---------- | --------- | ----- | ---------- | ----------- | -------- | --------- |
| Part A    | 8      | 1        | 2        | —            | 1      | —        | —           | —           | —          | —         | 1     | —          | 1           | —        | **14**    |
| Part B    | 1      | —        | —        | —            | —      | 5        | —           | —           | —          | —         | —     | —          | —           | —        | **6**     |
| Sec I     | 3      | 12       | 2        | 1            | 1      | —        | 1           | 4           | —          | —         | —     | 1          | 1           | —        | **26**    |
| Sec II    | 2      | 20       | 1        | —            | 8      | 7        | —           | —           | 1          | 2         | —     | —          | —           | 1        | **42**    |
| Sec III   | 1      | 3        | —        | —            | 3      | —        | —           | —           | —          | —         | 1     | —          | —           | —        | **8**     |
| Sec IV    | 2      | 35       | 3        | —            | 15     | —        | —           | —           | 2          | —         | —     | —          | —           | —        | **57**    |
| Sec V     | —      | 5        | —        | —            | 3      | —        | —           | —           | —          | —         | —     | —          | —           | 2        | **10**    |
| Sec VI    | —      | 1        | —        | —            | —      | —        | —           | —           | —          | —         | —     | —          | —           | —        | **1**     |
| Sec VII   | —      | —        | —        | —            | —      | —        | —           | —           | —          | —         | —     | —          | —           | 1        | **1**     |
| App 1     | 5      | —        | —        | —            | —      | —        | —           | —           | 1          | —         | —     | —          | —           | —        | **6**     |
| App 2     | —      | 1        | —        | —            | 3      | —        | —           | —           | —          | —         | —     | —          | —           | —        | **4**     |
| App 3     | —      | 8        | —        | —            | 9      | —        | —           | —           | —          | —         | —     | —          | —           | 1        | **18**    |
| App 4     | —      | 2        | —        | —            | 2      | —        | —           | —           | —          | —         | —     | —          | —           | —        | **4**     |
| App 5     | —      | 8        | —        | —            | 5      | 2        | —           | —           | —          | —         | —     | —          | —           | —        | **15**    |
| App 6     | —      | 12       | —        | —            | 15     | 2        | —           | —           | 1          | —         | —     | —          | —           | —        | **30**    |
| **TOTAL** | **22** | **108**  | **8**    | **1**        | **65** | **16**   | **1**       | **4**       | **5**      | **2**     | **2** | **1**      | **2**       | **5**    | **~242**  |

---

## Dependencies & Prerequisites

| Dependency                    | Status                                                                          | Blocker For             |
| ----------------------------- | ------------------------------------------------------------------------------- | ----------------------- |
| Angular 20 dev server         | ✅ Running (port 4200)                                                          | All frontend work       |
| Express backend               | ✅ Running (port 3000)                                                          | API calls, autofill     |
| PostgreSQL DB                 | ✅ Active                                                                       | Persistence             |
| Dify platform                 | ✅ Accessible                                                                   | Agent chat, workflows   |
| SharedIconsModule             | ✅ Fixed                                                                        | Icon rendering          |
| NPA Template Specification    | ✅ Extracted (250+ fields)                                                      | Phase 1                 |
| 5 Dify Chat Agent Apps        | ✅ All 5 created on Dify Cloud, claude-sonnet-4-5, keys in .env, health-checked | Phase 3                 |
| MAS Notice 637 reference text | ❌ Not ingested                                                                 | Phase 3 agent knowledge |

---

## Definition of Done (per Phase)

### Phase 1 Done When:

- [x] `npa-template-definition.ts` has 240+ field definitions — **339 fields** ✅
- [x] Every field has explicit `fieldType` property (not inferred) — **all 339** ✅
- [x] Every field has `strategy` assignment (RULE/COPY/LLM/MANUAL) — **all 339** ✅
- [x] Conditional fields have `dependsOn` metadata — **26 fields** ✅
- [x] ~~Repeatable sections marked with `repeatable: true`~~ — deferred to Phase 2 UI (External Parties I.5 structure works without repeatable for MVP)
- [x] Table fields have `tableColumns` / `tableRows` defined — **2 table nodes** ✅
- [x] File compiles with zero TypeScript errors ✅
- [x] Draft Builder renders all sections in stepper (no crashes) ✅
- [x] Strategy comment matches actual distribution — **RULE=63, COPY=60, LLM=149, MANUAL=67** ✅
- [x] All orphan fields integrated into template tree — **0 orphans** ✅
- [x] No duplicate field keys in template tree — **fixed (app5_valuation_model)** ✅
- [x] All roadmap sections have corresponding fields — **all gaps filled** ✅

### Phase 2 Done When:

- [x] All 14 field types render correctly in Draft Builder ✅ (14 of 16 fully implemented, 2 aliased to textarea)
- [x] User can interact with every field type (edit, select, upload, add rows) ✅
- [x] Field chrome (badges, tooltips, streaming) works for all types ✅
- [x] Responsive layout maintained with complex fields ✅
- [x] Zero TypeScript errors during build ✅ (0 errors, 2 pre-existing budget warnings)

### Phase 3 Done When:

- [x] 5 Dify Chat Agent apps created on Dify platform and responding ✅ _(All 5 on Dify Cloud, claude-sonnet-4-5, health-checked HEALTHY, chat-tested with real domain answers)_
- [x] Chat panel sends real messages to correct agent based on active section ✅
- [x] Agent responses stream token-by-token with live text display ✅
- [x] "Apply Suggestion" parses `@@NPA_META@@` and fills fields with Apply/Apply All buttons ✅
- [ ] Conversation history persists across page refreshes _(in-memory only — deferred to Phase 6)_

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

_This roadmap is a living document. Update checkboxes as tasks are completed._
