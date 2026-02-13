# NPA Task Agents: Finalized vs AI-Powered Ideation Requirements

## Previously Finalized Architecture (from COO Tech Doc v1.1)

### **TIER 3: TASK AGENTS (Stage-Based Sub-Agents)**

Organized by 5-Stage AI Pipeline Pattern:

---

## **STAGE 1: INGESTION & TRIAGE** (4 Sub-Agents)

### 1. **Document Ingestion Sub-Agent**
- **Purpose:** Extract structured data from all document types
- **Technology:** GPT-4V, Claude 3.5 Sonnet Vision
- **Inputs:** PDF, Word, Excel, PNG, JPG, TIFF, scanned images, emails
- **Outputs:** Structured data (JSON), confidence scores
- **Performance:** 96% success rate, 8.2 seconds average processing
- **Key Capabilities:**
  - Tables, forms, charts, handwriting extraction
  - Multi-format support
  - Quality scoring (>0.90 threshold for auto-acceptance)

### 2. **Completeness Triage Sub-Agent**
- **Purpose:** Check if NPA submission is complete
- **Rules:** 47 field checks, 12 document type checks
- **Output:** Complete (proceed) / Incomplete (notify Maker)
- **Performance:** 98% success rate
- **Actions:** Sends notifications to Makers for missing documents (5 sent today)

### 3. **Auto-Population Sub-Agent**
- **Purpose:** Pre-fill NPA form with extracted data
- **Coverage:** 78% of fields auto-populated
- **Confidence Threshold:** >0.90 for auto-fill, else flag for review
- **Status:** Active

### 4. **Missing Field Detector Sub-Agent**
- **Purpose:** Identify gaps and generate follow-up questions
- **Output:** Natural language requests for missing information
- **Status:** Active

---

## **STAGE 2: DILIGENCE** (5 Sub-Agents)

### 5. **Review Assistant Sub-Agent**
- **Purpose:** Help Checker review NPAs efficiently
- **Outputs:** Executive summary, key risks, recommendations
- **Performance:** 4.5/5 Checker satisfaction
- **Capabilities:**
  - Highlight issues (Critical/High/Medium/Low color-coded)
  - Generate comprehensive summaries

### 6. **KB Search Sub-Agent**
- **Purpose:** Find similar historical NPAs and policies
- **Technology:** Hybrid search (semantic + keyword), RAG engine
- **Performance:** 92% retrieval accuracy
- **Data Sources:** 1,784 historical NPAs (2020-2025), policies, templates
- **Output:** Top 5 similar cases with citations

### 7. **Validation Sub-Agent**
- **Purpose:** Validate compliance and policies
- **Rules Checked:** 47 business rules
- **Regulatory Coverage:** MAS 656, MAS 643, CFTC, internal risk framework
- **Output:** Pass/Fail with specific violations flagged
- **Performance:** 100% compliance coverage

### 8. **Conversational Diligence Sub-Agent**
- **Purpose:** Answer Checker/Maker questions in natural language
- **Performance:** 2.3s average response time
- **Capabilities:**
  - Multi-turn conversations
  - Context awareness
  - Citations with confidence scores
- **Availability:** 24/7

### 9. **Calculation Support Sub-Agent**
- **Purpose:** Perform financial/risk calculations
- **Formulas:** ROAE, capital utilization, risk-weighted assets
- **Validation:** Cross-check against historical benchmarks
- **Status:** Active

---

## **STAGE 3: DECISIONING** (6 Sub-Agents)

### 10. **Rule-Based Decision Sub-Agent**
- **Purpose:** Apply hard-coded business rules
- **Rules:** 23 core rules for NPA
- **Examples:**
  - "If notional > $1M → CFO approval required"
  - "If rating < BBB → Credit escalation"
- **Performance:** <500ms execution time, deterministic
- **Output:** Pass/Fail + violated rules
- **Transparency:** Clear rule execution report

### 11. **ML-Based Prediction Sub-Agent**
- **Purpose:** Predict approval likelihood from historical patterns
- **Training Data:** 500+ historical NPAs (2020-2025)
- **Model:** XGBoost (Gradient Boosting)
- **Accuracy:** 89% approval prediction
- **Features:** 47 extracted (product type, risk, notional, counterparty, approver behavior, market conditions)
- **Output:** Approve/Clarify/Reject + confidence score + reasoning
- **Retraining:** Quarterly or when accuracy drops below 85%

### 12. **Credit Decision Sub-Agent**
- **Purpose:** Credit risk assessment
- **Average Decision Time:** 1.2 days
- **Output:** Credit analysis + recommendation
- **Status:** Active

### 13. **Finance Decision Sub-Agent**
- **Purpose:** Financial viability assessment
- **Average Decision Time:** 1.8 days
- **Output:** Financial analysis + ROAE impact
- **Status:** Active

### 14. **Legal Decision Sub-Agent**
- **Purpose:** Legal compliance check
- **Average Decision Time:** 1.1 days
- **Output:** Legal analysis + compliance status
- **Status:** Active

### 15. **Approval Orchestration Sub-Agent**
- **Purpose:** Coordinate multi-department parallel approvals
- **Logic:**
  - Determine approval paths (product risk, value, complexity)
  - Parallel processing (Credit/Finance/Legal simultaneously)
  - Loop-back detection (smart routing)
  - Circuit breaker (escalate after 3 iterations)
- **SLA Tracking:** Real-time monitoring
- **Status:** Active

---

## **STAGE 4: REPORTING & DOCUMENTATION** (4 Sub-Agents)

### 16. **Credit Memo Generation Sub-Agent**
- **Purpose:** Auto-generate comprehensive memos
- **Template:** Executive summary, borrower profile, cash flow analysis, risks, recommendation
- **Performance:** 4.3 minutes average generation time, 47 memos generated
- **Quality:** Matches human-written memos (validated by checkers)

### 17. **Approval Documentation Sub-Agent**
- **Purpose:** Create final approval documents
- **Output:** Immutable audit trail (blockchain-inspired)
- **Details Captured:** Name, timestamp, comments, conditions
- **Performance:** 47 docs created

### 18. **Status Report Sub-Agent**
- **Purpose:** Generate pipeline reports
- **Frequency:** Weekly/monthly
- **Formats:** PowerPoint, PDF, Excel
- **Distribution:** Auto-email to stakeholders

### 19. **Notification Sub-Agent**
- **Purpose:** Send state-aware notifications
- **Performance:** 78 notifications sent today
- **Channels:** Email (89%), Slack (8%), In-App (3%)
- **Delivery Rate:** 99.1%
- **Types:** State transitions, approvals required, SLA warnings, escalations

---

## **TOTAL: 19 FINALIZED TASK AGENTS**
- Stage 1 (Ingestion & Triage): 4 agents
- Stage 2 (Diligence): 5 agents
- Stage 3 (Decisioning): 6 agents
- Stage 4 (Reporting): 4 agents

---

# NEW REQUIREMENTS: AI-Powered Ideation Workflow

## **PHASE 0: PRODUCT IDEATION (NEW STAGE)**

Based on the 11-step AI-powered workflow we designed, we need **ADDITIONAL/ENHANCED agents**:

### ✅ **KEEP - Already Exists (can be reused)**

All 19 existing agents remain relevant and operational for Steps 5-11 of the workflow.

### 🆕 **NEW AGENTS NEEDED (for Steps 1-4)**

---

## **NEW AGENT 1: Product Ideation Agent** ⭐ CRITICAL
**Purpose:** Conduct conversational intake interview (replaces manual 47-field form)

**Capabilities:**
- **Conversational Interview:** Ask 10-15 intelligent questions
- **Information Extraction:**
  - Product type, structure, payoff
  - Notional value, tenor
  - Counterparty details
  - Desk/location origin
  - Business rationale
- **Immediate Checks:**
  - Prohibited List validation (hard-stop)
  - Similar NPA search (semantic search across 1,784 NPAs)
  - Capital threshold check
- **Classification:**
  - Auto-classify: NTG / Variation / Existing
  - Confidence score (>0.85 for auto-classification)
- **Template Selection:**
  - Full NPA / NPA Lite / Bundling / Fast-Track / Evergreen / NLNOC
- **Predictive Analytics:**
  - Approval likelihood (ML-based: 89% accurate)
  - Timeline estimate (4-6 weeks typical)
  - Identify similar approved cases (top 5)
  - Flag potential blockers

**Technology:**
- NLP framework: Dify conversational agent
- Classification model: Fine-tuned transformer (trained on 1,784 NPAs)
- Backend: Connects to KB Search, Prohibited List, ML Prediction

**Performance Targets:**
- Interview completion: 5-10 minutes
- Classification accuracy: >92%
- User satisfaction: >4.3/5

**Status:** 🆕 NEW (does not exist in current architecture)

---

## **NEW AGENT 2: Classification Router Agent** ⭐ CRITICAL
**Purpose:** Auto-classify products with high confidence

**Capabilities:**
- **Input Analysis:** Product description, structure, notional, desk
- **Decision Trees:** Bundling Approval, Product Classification
- **Outputs:**
  - Classification: NTG / Variation / Existing
  - Confidence score
  - Reasoning (explainability)
  - Recommended template
  - Required sign-off parties

**Technology:**
- Decision tree engine + ML classifier ensemble
- Rule-based logic (for clear cases)
- ML fallback (for edge cases)

**Performance Targets:**
- Processing time: <3 seconds
- Accuracy: >95% (high confidence cases)
- Handles edge cases: Escalates to human if confidence <0.75

**Status:** 🆕 NEW (partial overlap with existing Validation Sub-Agent but much more sophisticated)

---

## **NEW AGENT 3: Prohibited List Checker Agent**
**Purpose:** Instant validation against prohibited products

**Capabilities:**
- **Input:** Product description, counterparty, jurisdiction
- **Check:** Against prohibited list (constantly updated)
- **Output:** Pass / HARD-STOP with reason
- **Action:** If HARD-STOP, immediately notify user + escalate to compliance

**Technology:**
- Real-time API integration to compliance database
- Keyword matching + semantic understanding

**Performance:**
- Check time: <1 second
- False positive rate: <2%

**Status:** 🆕 NEW (can be part of Validation Sub-Agent but needs to be front-loaded)

---

## **NEW AGENT 4: Template Auto-Fill Engine** ⭐ CRITICAL
**Purpose:** Pre-populate NPA template with 78%+ accuracy

**Capabilities:**
- **Content Retrieval:** Find similar approved NPAs
- **Content Adaptation:**
  - Copy boilerplate sections
  - Adapt product-specific sections
  - Insert extracted data from interview
- **Smart Population:**
  - Auto-fill 37 of 47 fields (typical)
  - Flag 7-10 fields requiring manual input
  - Pre-populate risk assessments
  - Pre-select sign-off parties
- **Quality Check:**
  - Confidence score per field
  - Highlight low-confidence fields for human review

**Technology:**
- RAG-based content retrieval
- Template mapping engine
- Confidence scoring per field

**Performance Targets:**
- Auto-fill coverage: 78%+ of fields
- Accuracy: >92%
- Processing time: 2-3 minutes

**Status:** 🆕 NEW (enhanced version of Auto-Population Sub-Agent)

---

## **ENHANCED AGENT 5: KB Search Sub-Agent (UPGRADE NEEDED)**
**Existing Agent:** #6 KB Search Sub-Agent
**Enhancement Required:** Expose to user in Phase 0 (Ideation)

**New Capabilities:**
- **Proactive Search:** Automatically triggered during ideation interview
- **User-Facing:** Maker can ask "Show me similar NPAs" during conversation
- **Richer Output:**
  - Not just top 5 similar NPAs
  - Include: approval timeline, outcome, conditions imposed
  - Show trend analysis (e.g., "85% of FX options approved first-time")

**Status:** 🔄 ENHANCE (already exists but needs to be exposed earlier in workflow)

---

## **ENHANCED AGENT 6: Conversational Diligence Sub-Agent (UPGRADE NEEDED)**
**Existing Agent:** #8 Conversational Diligence Sub-Agent
**Enhancement Required:** Active during Phase 0 (Ideation)

**New Capabilities:**
- **Contextual Help:** Available during ideation interview
- **Proactive Guidance:**
  - "Based on your product description, you'll need Finance + Legal + Credit sign-offs"
  - "Similar NPAs took 4-6 weeks on average"
  - "This product may require PAC approval"

**Status:** 🔄 ENHANCE (already exists but needs to be active in Phase 0)

---

## **ENHANCED AGENT 7: ML-Based Prediction Sub-Agent (UPGRADE NEEDED)**
**Existing Agent:** #11 ML-Based Prediction Sub-Agent
**Enhancement Required:** Provide early predictions during Phase 0

**New Capabilities:**
- **Early Prediction:** Estimate approval likelihood before NPA submission
- **Feature Engineering:** Use partial data from interview (not full 47 fields)
- **Timeline Forecasting:** Break down by department (Credit: 1-2d, Finance: 2-3d, Legal: 1d)

**Status:** 🔄 ENHANCE (already exists but needs to work with partial data)

---

# SUMMARY: REQUIRED CHANGES

## 🆕 **NEW TASK AGENTS NEEDED: 4**
1. **Product Ideation Agent** (conversational intake)
2. **Classification Router Agent** (auto-classify with high confidence)
3. **Prohibited List Checker Agent** (instant hard-stop validation)
4. **Template Auto-Fill Engine** (pre-populate 78%+ of template)

## 🔄 **ENHANCED TASK AGENTS: 3**
5. **KB Search Sub-Agent** (expose in Phase 0, richer outputs)
6. **Conversational Diligence Sub-Agent** (active in Phase 0, proactive guidance)
7. **ML-Based Prediction Sub-Agent** (early predictions with partial data)

## ✅ **UNCHANGED TASK AGENTS: 12**
- Document Ingestion, Completeness Triage, Missing Field Detector (Stage 1: remaining 3)
- Review Assistant, Validation, Calculation Support (Stage 2: remaining 3)
- Rule-Based Decision, Credit Decision, Finance Decision, Legal Decision, Approval Orchestration (Stage 3: 5)
- Credit Memo Generation, Approval Documentation, Status Report, Notification (Stage 4: 4)

---

# REVISED TOTAL TASK AGENT COUNT

| Category | Count |
|----------|-------|
| **Existing (Unchanged)** | 12 |
| **Enhanced (Upgraded)** | 3 |
| **New (Phase 0 only)** | 4 |
| **TOTAL** | **19 agents** |

**Note:** Total count remains 19, but 4 are new and 3 require enhancement.

---

# ARCHITECTURE IMPACT

## Tier 3 Structure (Updated)

### **PHASE 0: PRODUCT IDEATION** (NEW)
- Product Ideation Agent 🆕
- Classification Router Agent 🆕
- Prohibited List Checker Agent 🆕
- Template Auto-Fill Engine 🆕
- KB Search Sub-Agent (enhanced) 🔄
- Conversational Diligence Sub-Agent (enhanced) 🔄
- ML-Based Prediction Sub-Agent (enhanced) 🔄

### **STAGE 1: INGESTION & TRIAGE**
- Document Ingestion Sub-Agent ✅
- Completeness Triage Sub-Agent ✅
- Auto-Population Sub-Agent ✅ (may be deprecated in favor of Template Auto-Fill Engine)
- Missing Field Detector Sub-Agent ✅

### **STAGE 2: DILIGENCE**
- Review Assistant Sub-Agent ✅
- KB Search Sub-Agent 🔄
- Validation Sub-Agent ✅
- Conversational Diligence Sub-Agent 🔄
- Calculation Support Sub-Agent ✅

### **STAGE 3: DECISIONING**
- Rule-Based Decision Sub-Agent ✅
- ML-Based Prediction Sub-Agent 🔄
- Credit Decision Sub-Agent ✅
- Finance Decision Sub-Agent ✅
- Legal Decision Sub-Agent ✅
- Approval Orchestration Sub-Agent ✅

### **STAGE 4: REPORTING & DOCUMENTATION**
- Credit Memo Generation Sub-Agent ✅
- Approval Documentation Sub-Agent ✅
- Status Report Sub-Agent ✅
- Notification Sub-Agent ✅

---

# KEY OBSERVATIONS

## 1. **Phase 0 is genuinely NEW**
The AI-powered ideation workflow introduces a completely new phase that doesn't exist in the current architecture. This requires 4 net-new agents.

## 2. **Reuse is HIGH**
12 of 19 existing agents remain completely unchanged. The 5-stage pipeline pattern still applies for Steps 6-11 of the workflow.

## 3. **Enhancements are STRATEGIC**
The 3 enhanced agents (KB Search, Conversational Diligence, ML Prediction) are being exposed earlier in the workflow and given richer capabilities, but their core logic remains the same.

## 4. **Auto-Population Consolidation**
The existing "Auto-Population Sub-Agent" may be deprecated/merged into the new "Template Auto-Fill Engine" which is more sophisticated.

## 5. **Classification Router is CRITICAL**
This agent is the first decision point in the new workflow. It determines:
- NPA type (Full NPA / NPA Lite / Bundling / etc.)
- Required sign-off parties
- Approval path

Without this, the conversational intake doesn't know how to route the NPA.

---

# NEXT STEPS

1. **Validate:** Confirm this agent mapping aligns with your vision
2. **Prioritize:** Which 4 new agents to build first?
3. **Specify:** Detailed requirements for each new agent
4. **Integrate:** How Phase 0 hands off to existing 5-stage pipeline
5. **UI/UX:** Design conversational interface for Product Ideation Agent