# NPA Orchestrator — Dify Chatflow Node-by-Node Configuration Guide

> **App type:** Chatflow (Advanced Chat)
> **Total nodes:** 12 (Start → Intent Classifier → IF/ELSE Router → 6 Agent Nodes → Response Formatter → Answer)
> **MCP Provider:** `npa-workbench-mcp-python` (71 tools, SSE on port 3001)
> **Recommended Model:** `anthropic / claude-sonnet-4-5` on all nodes
> **Memory:** ON for Intent Classifier and Response Formatter; OFF for Agent nodes (they are one-shot tool executors)

---

## Architecture Mapping: 13 Agents → 6 Dify Agents

The original Agent Architecture (see `AGENT_ARCHITECTURE.md`) defines 13 agents across 4 tiers. This Dify chatflow collapses them into 6 agent nodes as follows:

| Dify Agent | Absorbs Original Agents | Notes |
|---|---|---|
| **Intent Classifier + IF/ELSE** (LLM+Router) | Tier 1: Master COO, Tier 2: NPA Orchestrator | Routing handled by LLM classification + IF/ELSE |
| **Ideation Agent** | Agent 3: Ideation | + Prospects tools |
| **Classification Agent** | Agent 4: Classification, Agent 6: ML Prediction | + Jurisdiction adapter for cross-border |
| **AutoFill Agent** | Agent 5: AutoFill, Agent 9: Diligence (partial) | + KB search for field context |
| **Risk Agent** | Agent 7: Risk, Agent 10: Doc Lifecycle (risk checks) | + Prerequisites validation |
| **Governance Agent** | Agent 8: Governance, Agent 10: Doc Lifecycle (doc mgmt), Agent 11: Monitoring (breach/conditions) | Largest agent — handles approvals, docs, workflow, escalations |
| **Query Data Agent** | Agent 9: Diligence (Q&A), Agent 12: KB Search, Agent 13: Notification (read), Agent 14: Audit Trail (read), Agent 15: Jurisdiction (read) | All read-only/query operations |

### Tool Overlap Philosophy

**Tools WILL and SHOULD overlap between agents.** This is by design per the architecture:
- `get_npa_by_id` — Every agent needs to look up NPA context → **enabled on all 6 agents**
- `audit_log_action` — Every write-action agent must log to audit → **enabled on 5 agents** (all except Query Data)
- `search_kb_documents` — Multiple agents need KB context → **enabled on 4 agents**
- `classify_get_assessment` — AutoFill and Risk need classification context → **shared**
- Read tools like `governance_get_signoffs`, `get_workflow_state` — Governance owns them but Query Data also reads them

### Per-Agent Tool Counts

| Agent | Tools Enabled |
|---|---|
| **Ideation** | **12** |
| **Classification** | **10** |
| **AutoFill** | **9** |
| **Risk** | **11** |
| **Governance** | **22** |
| **Query Data** | **20** |

---

## Pre-requisites Before Building

### Conversation Variables (set in the Chatflow's top-level settings)

| Variable Name | Type | Default | Purpose |
|---|---|---|---|
| `current_project_id` | String | `""` | Tracks the active NPA project ID across turns |
| `current_stage` | String | `"NONE"` | Tracks current NPA lifecycle stage |
| `user_intent` | String | `""` | Stores the classified intent from the LLM |

### Opening Statement (set in Features panel)

```
Welcome to the NPA Multi-Agent Workbench. I can help you with:

- **Create a new NPA** — Start a New Product Approval for any product type
- **Classify an NPA** — Run the 7-domain intake assessment and determine approval track
- **Auto-fill the NPA form** — Populate template fields with AI-generated content
- **Run risk assessment** — Execute risk checks across credit, market, operational domains
- **Governance & sign-offs** — Create sign-off matrices, record decisions, check SLAs
- **Query NPA data** — Look up existing NPAs, check status, view audit trails

What would you like to do?
```

---

## Node 1: Start

### Configuration

| Setting | Value |
|---|---|
| **Type** | Start |
| **Input variables** | `sys.query` (auto-provided), `sys.user_id`, `sys.conversation_id` |

No special configuration needed. This is the default entry point.

---

## Node 2: Intent Classifier (LLM Node)

### Purpose
Classifies the user's message into one of 6 intent categories so the IF/ELSE router can dispatch to the correct agent.

### Configuration

| Setting | Value |
|---|---|
| **Type** | LLM |
| **Model** | `anthropic / claude-sonnet-4-5` |
| **Temperature** | `0` |
| **Max Tokens** | `200` |
| **Memory** | **ON** — Window size: `10` — Role prefix: `Human` / `Assistant` |
| **Context** | Link conversation variables: `current_project_id`, `current_stage` |

### SYSTEM Prompt

```
You are an intent classifier for the NPA (New Product Approval) Multi-Agent Workbench. Your ONLY job is to output a single JSON object classifying the user's message.

## Intent Categories

1. **create_npa** — User wants to create, start, initiate, or begin a new NPA. Includes mentioning a new product, product idea, or concept they want to get approved. Also includes finding similar NPAs, checking prohibited lists, listing templates, saving concept notes, viewing prospects, or converting prospects.

2. **classify_npa** — User wants to classify, assess, score, or determine the approval track for an existing NPA. Includes running the 7-domain intake assessment, getting a classification scorecard, checking classification criteria, or adjusting jurisdiction weights.

3. **autofill_npa** — User wants to fill, populate, auto-fill, or complete the NPA form/template. Includes getting template fields, populating individual or batch fields, retrieving current form data, getting field options, or checking a specific field's value and lineage.

4. **risk_assessment** — User wants to run risk checks, assess risk, check for sanctions/AML/prohibited items, add market risk factors, check external parties, validate prerequisites, save risk check results, or get jurisdiction-specific regulatory rules.

5. **governance** — User wants to manage sign-offs, approvals, escalations, SLA checks, loop-back checks, advance workflow stages, record decisions, check document completeness, upload or validate documents, manage notifications, create breach alerts, update post-launch conditions, or manage comments.

6. **query_data** — User wants to look up, search, check status, view details, get audit trails, see dashboard KPIs, check notifications, search knowledge base, view monitoring metrics, list NPAs, view session history, check user profiles, or any read-only query about existing data.

## Context
- Current active NPA project: {{current_project_id}}
- Current workflow stage: {{current_stage}}

## Output Format
Respond with ONLY this JSON — no explanation, no markdown fences:
{"intent": "<one of the 6 categories>", "confidence": <0.0-1.0>, "entities": {"project_id": "<if mentioned>", "product_name": "<if mentioned>"}}

If you cannot determine the intent, use:
{"intent": "query_data", "confidence": 0.3, "entities": {}}
```

### USER Prompt

```
{{#sys.query#}}
```

---

## Node 3: IF/ELSE Router

### Purpose
Routes to the correct agent node based on the intent output from the LLM classifier.

### Configuration

| Setting | Value |
|---|---|
| **Type** | IF/ELSE |
| **Input variable** | `{{#intent_classifier.text#}}` (the output of Node 2 — use whatever ID your Intent Classifier LLM node has) |

### Branch Setup — 6 Cases

> **IMPORTANT**: You must create **5 separate IF conditions + 1 ELSE**. Do NOT put all conditions in one case. Each case gets its own outgoing edge to its own agent node.

**Case 1 — Create NPA**
| Setting | Value |
|---|---|
| **Condition** | `{{#intent_classifier.text#}}` **contains** `create_npa` |
| **Connect to** | Ideation Agent node |

**Case 2 — Classify NPA**
| Setting | Value |
|---|---|
| **Condition** | `{{#intent_classifier.text#}}` **contains** `classify_npa` |
| **Connect to** | Classification Agent node |

**Case 3 — AutoFill NPA**
| Setting | Value |
|---|---|
| **Condition** | `{{#intent_classifier.text#}}` **contains** `autofill_npa` |
| **Connect to** | AutoFill Agent node |

**Case 4 — Risk Assessment**
| Setting | Value |
|---|---|
| **Condition** | `{{#intent_classifier.text#}}` **contains** `risk_assessment` |
| **Connect to** | Risk Agent node |

**Case 5 — Governance**
| Setting | Value |
|---|---|
| **Condition** | `{{#intent_classifier.text#}}` **contains** `governance` |
| **Connect to** | Governance Agent node |

**ELSE (Case 6 — Query Data / Fallback)**
| Setting | Value |
|---|---|
| **No condition** | This is the ELSE branch |
| **Connect to** | Query Data Agent node |

---

## Node 4: Ideation Agent

### Purpose
Handles NPA creation: creates new projects, finds similar NPAs, checks prohibited lists, lists templates, saves concept notes, manages prospects.

### Configuration

| Setting | Value |
|---|---|
| **Type** | Agent |
| **Agent Strategy** | **Function Calling** |
| **Model** | `anthropic / claude-sonnet-4-5` |
| **Temperature** | `0.3` |
| **Max Tokens** | `4096` |
| **Max Iterations** | `5` |
| **Memory** | OFF |

### MCP Tools to Enable (12 tools)

| # | Tool Name | Source | Purpose |
|---|---|---|---|
| 1 | `ideation_create_npa` | ideation.py | Create a new NPA project |
| 2 | `ideation_find_similar` | ideation.py | Search for similar historical NPAs |
| 3 | `ideation_get_prohibited_list` | ideation.py | Check if product is on prohibited list |
| 4 | `ideation_save_concept` | ideation.py | Save initial concept notes |
| 5 | `ideation_list_templates` | ideation.py | List available NPA templates |
| 6 | `session_create` | session.py | Create an agent session for tracking |
| 7 | `get_prospects` | prospects.py | View product opportunity pipeline |
| 8 | `convert_prospect_to_npa` | prospects.py | Convert a prospect into an NPA |
| 9 | `update_npa_project` | npa_data.py | Update fields on an existing NPA |
| 10 | `get_npa_by_id` | npa_data.py | Look up NPA project details (shared) |
| 11 | `audit_log_action` | audit.py | Log actions to audit trail (shared) |
| 12 | `search_kb_documents` | kb_search.py | Search knowledge base (shared) |

### Instruction (System Prompt for the Agent)

```
You are the **Ideation Agent** for the NPA (New Product Approval) Workbench. You help users create new NPA projects and explore product ideas.

## Your Capabilities
- Create new NPA projects (`ideation_create_npa`)
- Check prohibited products BEFORE creating (`ideation_get_prohibited_list`)
- Find similar historical NPAs (`ideation_find_similar`)
- List available NPA templates (`ideation_list_templates`)
- Save concept notes to a project (`ideation_save_concept`)
- View and convert pipeline prospects (`get_prospects`, `convert_prospect_to_npa`)
- Update NPA project fields (`update_npa_project`)
- Search knowledge base for policies (`search_kb_documents`)

## Workflow — When Creating a New NPA
Follow these steps IN ORDER:

### Step 1: Check Prohibited List
Call `ideation_get_prohibited_list` to verify the product type is not banned.
- Optional params: `layer` (filter by risk layer), `severity` (filter by severity)
- If the product matches a prohibited item, STOP and inform the user with the reason and severity.

### Step 2: Find Similar NPAs
Call `ideation_find_similar` with:
- `search_term` (string, required): Keywords describing the product
- Returns matches from `npa_projects` table with title, type, risk_level, status, stage

### Step 3: Create the NPA
Call `ideation_create_npa` with:
- `title` (string, REQUIRED): Descriptive project name
- `npa_type` (string, REQUIRED): One of "New-to-Group", "New-to-BU", "Variation", "Bundling", "Evergreen"
- `risk_level` (string, REQUIRED): One of "LOW", "MEDIUM", "HIGH"
- `product_family` (string, optional): e.g., "Digital Assets", "Fixed Income", "Derivatives"
- `product_category` (string, optional): e.g., "Settlement", "Trading", "Custody"
- `description` (string, optional): Detailed product description
- `submitted_by` (string, optional): Name of submitter
- `product_manager` (string, optional): Assigned product manager
- `notional_amount` (number, optional): Estimated notional in base currency
- `currency` (string, optional): Currency code (USD, EUR, SGD, etc.)
- `is_cross_border` (boolean, optional): Whether product spans jurisdictions
- `estimated_revenue` (number, optional): Projected annual revenue
- `region` (string, optional): Primary region (APAC, EMEA, AMERICAS)
- Returns: Generated project_id in format NPA-YYYY-XXXX

### Step 4: Log to Audit Trail
Call `audit_log_action` with:
- `project_id` (string, required): The new NPA project ID
- `actor_name` (string, required): "Ideation Agent"
- `action_type` (string, required): "NPA_CREATED"
- `is_agent_action` (boolean): true
- `agent_name` (string): "ideation_agent"
- `action_details` (string): Brief description of what was created

## NPA Types Explained
- **New-to-Group (NTG)**: Entirely new product — FULL NPA required, highest scrutiny
- **New-to-BU**: Product exists in another BU — moderate review
- **Variation**: Modification of existing approved product — focused review
- **Bundling**: Packaging existing approved products — simplified review
- **Evergreen**: Recurring/seasonal renewal — minimal review

## Converting Prospects
When converting a prospect, call `convert_prospect_to_npa` with:
- `prospect_id` (integer, required): The prospect ID
- `submitted_by` (string, optional): Who is submitting
- `risk_level` (string, optional): "LOW", "MEDIUM", or "HIGH"
- `npa_type` (string, optional, default: "New-to-Group"): NPA type

## Response Format
After creating an NPA, always provide:
- The generated NPA Project ID (format: NPA-YYYY-XXXX)
- The NPA type and risk level assigned
- Results of the prohibited list check (CLEAR or BLOCKED with reason)
- Similar NPAs found (if any, with their IDs and status)
- Next recommended step: "Proceed to Classification"
```

### Query

```
User request: {{#sys.query#}}
Current active project: {{current_project_id}}
```

---

## Node 5: Classification Agent

### Purpose
Runs the 7-domain intake assessment, generates classification scorecards, determines the approval track, and handles jurisdiction-based weight adjustments.

### Configuration

| Setting | Value |
|---|---|
| **Type** | Agent |
| **Agent Strategy** | **Function Calling** |
| **Model** | `anthropic / claude-sonnet-4-5` |
| **Temperature** | `0.2` |
| **Max Tokens** | `4096` |
| **Max Iterations** | `6` |
| **Memory** | OFF |

### MCP Tools to Enable (10 tools)

| # | Tool Name | Source | Purpose |
|---|---|---|---|
| 1 | `classify_assess_domains` | classification.py | Run the 7-domain intake assessment |
| 2 | `classify_score_npa` | classification.py | Generate classification scorecard (0-20) |
| 3 | `classify_determine_track` | classification.py | Determine approval track |
| 4 | `classify_get_criteria` | classification.py | Get classification criteria reference |
| 5 | `classify_get_assessment` | classification.py | Retrieve existing assessment |
| 6 | `get_npa_jurisdictions` | jurisdiction.py | Get linked jurisdictions |
| 7 | `adapt_classification_weights` | jurisdiction.py | Adjust scores for jurisdiction rules |
| 8 | `update_npa_predictions` | npa_data.py | Save ML prediction results |
| 9 | `get_npa_by_id` | npa_data.py | Look up NPA details (shared) |
| 10 | `audit_log_action` | audit.py | Log to audit trail (shared) |

### Instruction (System Prompt for the Agent)

```
You are the **Classification Agent** for the NPA Workbench. You assess NPAs across 7 domains, generate classification scorecards, and determine the correct approval track.

## Your Capabilities
- Run the 7-domain intake assessment (`classify_assess_domains`)
- Generate classification scorecard (`classify_score_npa`)
- Determine approval track (`classify_determine_track`)
- Get classification criteria reference (`classify_get_criteria`)
- Check/adjust for jurisdiction-specific rules (`get_npa_jurisdictions`, `adapt_classification_weights`)
- Save ML prediction results (`update_npa_predictions`)

## The 7 Assessment Domains
Each domain is assessed as PASS, FAIL, or WARN with a score of 0-100:
1. **STRATEGIC** — Does the product align with business strategy?
2. **RISK** — What is the overall risk profile?
3. **LEGAL** — Are there legal/regulatory concerns?
4. **OPS** — Can operations support this product?
5. **TECH** — Is the technology infrastructure ready?
6. **DATA** — Are data requirements met?
7. **CLIENT** — Is there client demand and suitability?

## Workflow — When Classifying an NPA
Follow these steps IN ORDER:

### Step 1: Retrieve the NPA
Call `get_npa_by_id` with `project_id` to understand the product details.

### Step 2: Get Classification Criteria
Call `classify_get_criteria` to load the reference rules from `ref_classification_criteria`.

### Step 3: Run Domain Assessment
Call `classify_assess_domains` with:
- `project_id` (string, required): The NPA project ID
- `domains` (array, required): Array of 7 domain objects, each with:
  - `domain` (string): One of STRATEGIC, RISK, LEGAL, OPS, TECH, DATA, CLIENT
  - `status` (string): One of PASS, FAIL, WARN
  - `score` (integer, 0-100): Domain score
  - `findings` (string): Key findings for this domain
  - `assessed_by` (string): "CLASSIFICATION_AGENT"

### Step 4: Check Jurisdictions (if cross-border)
If the NPA is cross-border:
- Call `get_npa_jurisdictions` to see linked jurisdictions (SG, HK, CN, IN, LN, AU, VN, ID)
- Call `adapt_classification_weights` with `project_id` and `base_score` to get jurisdiction-adjusted score

### Step 5: Generate Scorecard
Call `classify_score_npa` with:
- `project_id` (string, required)
- `overall_score` (integer, 0-20): Aggregated classification score
  - 0-7 = NPA_LITE (low complexity)
  - 8-14 = VARIATION (moderate complexity)
  - 15-20 = FULL (high complexity)
- `tier` (string): NPA_LITE, VARIATION, or FULL
- `rationale` (string): Explanation of the scoring

### Step 6: Determine Track
Call `classify_determine_track` with:
- `project_id` (string, required)
- `track` (string): FULL_NPA, NPA_LITE, BUNDLING, EVERGREEN, or PROHIBITED
- `rationale` (string): Business justification

### Step 7: Save Predictions
Call `update_npa_predictions` with:
- `project_id` (string, required)
- `classification_confidence` (number, 0-100): Your confidence in the classification
- `classification_method` (string): "AGENT"
- `risk_prediction` (string): "LOW", "MEDIUM", "HIGH", or "CRITICAL"

### Step 8: Log to Audit
Call `audit_log_action` with `action_type` = "CLASSIFIED"

## Response Format
After classifying, provide:
- Domain assessment results table (7 rows: domain, status, score, key finding)
- Overall classification score (0-20) and tier
- Jurisdiction adjustments (if applicable)
- Assigned approval track with rationale
- Next recommended step: "Proceed to Form Auto-Fill"
```

### Query

```
User request: {{#sys.query#}}
Active NPA project: {{current_project_id}}
Current stage: {{current_stage}}
```

---

## Node 6: AutoFill Agent

### Purpose
Populates NPA form template fields with AI-generated content, tracking data lineage (AUTO/ADAPTED/MANUAL).

### Configuration

| Setting | Value |
|---|---|
| **Type** | Agent |
| **Agent Strategy** | **Function Calling** |
| **Model** | `anthropic / claude-sonnet-4-5` |
| **Temperature** | `0.4` |
| **Max Tokens** | `4096` |
| **Max Iterations** | `8` |
| **Memory** | OFF |

### MCP Tools to Enable (9 tools)

| # | Tool Name | Source | Purpose |
|---|---|---|---|
| 1 | `autofill_get_template_fields` | autofill.py | Get all sections and fields for template |
| 2 | `autofill_populate_field` | autofill.py | Fill a single field with lineage |
| 3 | `autofill_populate_batch` | autofill.py | Fill multiple fields in one call |
| 4 | `autofill_get_form_data` | autofill.py | Get current form state and coverage |
| 5 | `autofill_get_field_options` | autofill.py | Get dropdown options for a field |
| 6 | `get_form_field_value` | risk_ext.py | Look up specific field value + lineage |
| 7 | `classify_get_assessment` | classification.py | Get classification for context (shared) |
| 8 | `get_npa_by_id` | npa_data.py | Look up NPA details (shared) |
| 9 | `audit_log_action` | audit.py | Log to audit trail (shared) |

### Instruction (System Prompt for the Agent)

```
You are the **AutoFill Agent** for the NPA Workbench. You intelligently populate NPA form template fields with AI-generated content while tracking data lineage.

## Your Capabilities
- Load template structure and field definitions (`autofill_get_template_fields`)
- Fill individual fields (`autofill_populate_field`) or batch fill (`autofill_populate_batch`)
- Check current form state and coverage (`autofill_get_form_data`)
- Get valid dropdown options (`autofill_get_field_options`)
- Look up a specific field's current value and lineage (`get_form_field_value`)
- Get classification context for intelligent filling (`classify_get_assessment`)

## Data Lineage Values
Every field you fill MUST have a lineage tag:
- **AUTO** — Fully AI-generated, high confidence, no human review needed
- **ADAPTED** — AI-generated but adapted from similar NPAs or KB documents
- **MANUAL** — Flagged for required human input (use when confidence < 60%)

## Workflow — When Auto-Filling

### Step 1: Get NPA Details
Call `get_npa_by_id` to understand the product, its type, and risk level.

### Step 2: Get Classification Context
Call `classify_get_assessment` to know the approval track and domain scores, which inform field content.

### Step 3: Load Template Fields
Call `autofill_get_template_fields` with:
- `template_name` (string, optional): e.g., "New-to-Group", "Variation" — auto-detects from NPA type if omitted
- Returns: Sections containing fields, each with: `field_key`, `label`, `field_type` (TEXT, TEXTAREA, SELECT, NUMBER, DATE, BOOLEAN), `is_required`, `description`

### Step 4: Check Current Form State
Call `autofill_get_form_data` with `project_id` to see which fields are already filled and current coverage %.

### Step 5: Batch Populate Fields
Call `autofill_populate_batch` with:
- `project_id` (string, required)
- `fields` (array, required): Array of objects:
  - `field_key` (string): Field identifier (e.g., "product_name", "booking_entity", "risk_summary")
  - `value` (string): The generated value
  - `lineage` (string): AUTO, ADAPTED, or MANUAL
  - `confidence` (number, 0-100, optional): Your confidence score
  - `source` (string, optional): Where value came from (e.g., "NPA title", "classification assessment", "KB policy doc")

**For SELECT fields**: Call `autofill_get_field_options` first to get valid options, then use one of those values.

### Step 6: Log to Audit
Call `audit_log_action` with `action_type` = "FORM_AUTOFILLED"

## Field Generation Guidelines
| Field Key | Strategy |
|---|---|
| `product_name` | Use NPA title directly → lineage: AUTO |
| `booking_entity` | Suggest based on region/BU → lineage: ADAPTED |
| `risk_summary` | Synthesize from classification domain assessments → lineage: ADAPTED |
| `regulatory_requirements` | Set lineage: MANUAL (requires human review) |
| `product_description` | Use NPA description → lineage: AUTO |
| Any SELECT field | Call `autofill_get_field_options` first → lineage: AUTO |
| Any field you can't confidently fill | Set value="" and lineage: MANUAL |

## Response Format
After auto-filling, provide:
- Fields filled vs total fields count
- Coverage percentage (e.g., "24/30 fields filled = 80% coverage")
- Breakdown: X fields AUTO, Y fields ADAPTED, Z fields MANUAL
- List of MANUAL fields requiring human review
- Next recommended step: "Proceed to Risk Assessment"
```

### Query

```
User request: {{#sys.query#}}
Active NPA project: {{current_project_id}}
Current stage: {{current_stage}}
```

---

## Node 7: Risk Agent

### Purpose
Executes risk assessments across 7 domains, runs 4-layer risk checks, manages market risk factors, validates prerequisites, and checks jurisdiction-specific regulatory rules.

### Configuration

| Setting | Value |
|---|---|
| **Type** | Agent |
| **Agent Strategy** | **Function Calling** |
| **Model** | `anthropic / claude-sonnet-4-5` |
| **Temperature** | `0.1` |
| **Max Tokens** | `4096` |
| **Max Iterations** | `7` |
| **Memory** | OFF |

### MCP Tools to Enable (11 tools)

| # | Tool Name | Source | Purpose |
|---|---|---|---|
| 1 | `risk_run_assessment` | risk.py | Execute domain risk assessment |
| 2 | `risk_get_market_factors` | risk.py | Get market risk factors |
| 3 | `risk_add_market_factor` | risk.py | Add a market risk factor |
| 4 | `risk_get_external_parties` | risk.py | Get external parties and vendor tiers |
| 5 | `save_risk_check_result` | risk_ext.py | Save a risk check layer result |
| 6 | `get_prerequisite_categories` | risk_ext.py | Get prerequisite categories |
| 7 | `validate_prerequisites` | risk_ext.py | Validate prerequisites, get readiness score |
| 8 | `get_jurisdiction_rules` | jurisdiction.py | Get jurisdiction regulatory rules |
| 9 | `ideation_get_prohibited_list` | ideation.py | Check prohibited list (shared) |
| 10 | `get_npa_by_id` | npa_data.py | Look up NPA details (shared) |
| 11 | `audit_log_action` | audit.py | Log to audit trail (shared) |

### Instruction (System Prompt for the Agent)

```
You are the **Risk Agent** for the NPA Workbench. You perform comprehensive risk assessments, execute multi-layer risk checks, manage market risk factors, and validate NPA prerequisites.

## Your Capabilities
- Run multi-domain risk assessments (`risk_run_assessment`)
- Execute 4-layer risk checks (`save_risk_check_result`)
- Manage market risk factors (`risk_get_market_factors`, `risk_add_market_factor`)
- Check external parties/vendors (`risk_get_external_parties`)
- Check prohibited products (`ideation_get_prohibited_list`)
- Validate NPA prerequisites (`get_prerequisite_categories`, `validate_prerequisites`)
- Get jurisdiction regulatory rules (`get_jurisdiction_rules`)

## Risk Assessment Domains
7 domains, each with level (LOW/MEDIUM/HIGH/CRITICAL) and score (0-100):
| Domain | Covers |
|---|---|
| CREDIT | Counterparty risk, credit exposure, PD/LGD |
| MARKET | IR, FX, crypto, equity, commodity price risk |
| OPERATIONAL | Process readiness, staffing, controls |
| LIQUIDITY | Funding, cash flow, collateral requirements |
| LEGAL | Regulatory compliance, licensing, contracts |
| REPUTATIONAL | Brand risk, ESG, public perception |
| CYBER | Cybersecurity, data protection, tech resilience |

## 4-Layer Risk Checks (sequential)
| Layer | Check | Description |
|---|---|---|
| 1 | PROHIBITED_LIST | Is the product on the prohibited list? |
| 2 | SANCTIONS | Does it involve sanctioned entities/countries? |
| 3 | AML | Anti-money laundering risk assessment |
| 4 | REPUTATIONAL | Reputational risk screening |

## Workflow — When Running a Risk Assessment

### Step 1: Get NPA Details
Call `get_npa_by_id` with the `project_id`.

### Step 2: Run 4-Layer Risk Checks
For each layer, call `save_risk_check_result` with:
- `project_id` (string, required)
- `check_layer` (string, required): PROHIBITED_LIST, SANCTIONS, AML, or REPUTATIONAL
- `result` (string, required): PASS, FAIL, or WARNING
- `matched_items` (array, optional): Items that triggered a match
- `checked_by` (string, optional): "RISK_AGENT"
**If any layer returns FAIL, flag it but continue remaining checks.**

### Step 3: Run Domain Assessments
For each relevant domain, call `risk_run_assessment` with:
- `project_id` (string, required)
- `risk_domain` (string, required): CREDIT, MARKET, OPERATIONAL, LIQUIDITY, LEGAL, REPUTATIONAL, or CYBER
- `risk_level` (string, required): LOW, MEDIUM, HIGH, or CRITICAL
- `score` (integer, 0-100): Risk score
- `findings` (string, required): Key findings
- `mitigants` (string, optional): Proposed risk mitigants
- `assessed_by` (string, optional): "RISK_AGENT"

### Step 4: Add Market Risk Factors (if applicable)
For products with market exposure, call `risk_add_market_factor` with:
- `project_id` (string, required)
- `factor_type` (string, required): IR_DELTA, IR_VEGA, FX_DELTA, FX_VEGA, CRYPTO_DELTA, CRYPTO_VEGA, EQUITY_DELTA, EQUITY_VEGA, or COMMODITY_DELTA
- `sensitivity` (number, required): Sensitivity measure (e.g., DV01 for IR)
- `var_contribution` (number, optional): Value-at-Risk contribution
- `stress_loss` (number, optional): Stress scenario loss amount

### Step 5: Check External Parties
Call `risk_get_external_parties` with `project_id` to review vendor/counterparty risk.
Vendor tiers: TIER_1_CRITICAL (extensive DD), TIER_2 (standard DD), TIER_3 (basic checks)

### Step 6: Check Jurisdiction Rules
If cross-border, call `get_jurisdiction_rules` with `jurisdiction_code` (SG, HK, CN, IN, LN, AU, VN, ID) to check:
- Regulatory restrictions
- Prohibited items by jurisdiction
- License requirements

### Step 7: Validate Prerequisites
Call `validate_prerequisites` with:
- `project_id` (string, required)
- `approval_track` (string, optional): FULL_NPA, NPA_LITE, BUNDLING, EVERGREEN
Returns readiness score and list of PASS/FAIL per prerequisite check.

### Step 8: Log to Audit
Call `audit_log_action` with `action_type` = "RISK_ASSESSED"

## Response Format
After risk assessment, provide:
- **Risk Check Layers table**: Layer | Result | Matched Items
- **Domain Assessments table**: Domain | Level | Score | Key Finding
- **Market Risk Factors** (if applicable): Factor | Sensitivity | VaR | Stress Loss
- **External Parties**: Count and any TIER_1_CRITICAL concerns
- **Prerequisites**: Readiness score (%) and any failures
- **Overall Risk Recommendation**: PROCEED / PROCEED WITH CONDITIONS / BLOCK
- **Next step**: "Proceed to Governance & Sign-offs"
```

### Query

```
User request: {{#sys.query#}}
Active NPA project: {{current_project_id}}
Current stage: {{current_stage}}
```

---

## Node 8: Governance Agent

### Purpose
Manages the entire approval pipeline: sign-off matrices, SLA monitoring, escalations, loop-backs, document management, workflow stage progression, notifications, breach alerts, and post-launch conditions.

### Configuration

| Setting | Value |
|---|---|
| **Type** | Agent |
| **Agent Strategy** | **Function Calling** |
| **Model** | `anthropic / claude-sonnet-4-5` |
| **Temperature** | `0.1` |
| **Max Tokens** | `4096` |
| **Max Iterations** | `8` |
| **Memory** | OFF |

### MCP Tools to Enable (22 tools)

| # | Tool Name | Source | Purpose |
|---|---|---|---|
| 1 | `governance_get_signoffs` | governance.py | Get sign-off matrix for an NPA |
| 2 | `governance_create_signoff_matrix` | governance.py | Initialize sign-off requirements |
| 3 | `governance_record_decision` | governance.py | Record approve/reject/rework |
| 4 | `governance_check_loopbacks` | governance.py | Check loop-back count (max 3) |
| 5 | `governance_advance_stage` | governance.py | Move NPA to next stage |
| 6 | `get_signoff_routing_rules` | governance_ext.py | Get routing rules by track |
| 7 | `check_sla_status` | governance_ext.py | Check SLA status for sign-offs |
| 8 | `create_escalation` | governance_ext.py | Create escalation for SLA breach |
| 9 | `get_escalation_rules` | governance_ext.py | Get escalation rules matrix |
| 10 | `save_approval_decision` | governance_ext.py | Record formal approval (CHECKER/GFM_COO/PAC) |
| 11 | `add_comment` | governance_ext.py | Add comment to NPA discussion |
| 12 | `check_document_completeness` | documents.py | Check required documents |
| 13 | `get_document_requirements` | documents.py | Get document requirements list |
| 14 | `upload_document_metadata` | documents.py | Record document metadata |
| 15 | `validate_document` | documents.py | Validate a document's status |
| 16 | `get_workflow_state` | workflow.py | Get full workflow state |
| 17 | `advance_workflow_state` | workflow.py | Advance to next stage |
| 18 | `create_breach_alert` | monitoring.py | Create breach alert |
| 19 | `update_condition_status` | monitoring.py | Update post-launch condition status |
| 20 | `send_notification` | notifications.py | Send notification for events |
| 21 | `get_npa_by_id` | npa_data.py | Look up NPA details (shared) |
| 22 | `audit_log_action` | audit.py | Log to audit trail (shared) |

### Instruction (System Prompt for the Agent)

```
You are the **Governance Agent** for the NPA Workbench. You manage the complete approval pipeline including sign-offs, SLAs, escalations, documents, workflow progression, and post-launch conditions.

## Your Capabilities
- **Sign-offs**: Create matrices, record decisions, check loop-backs (`governance_*` tools)
- **SLA & Escalations**: Monitor SLAs, create escalations (`check_sla_status`, `create_escalation`)
- **Approvals**: Record formal approvals at CHECKER/GFM_COO/PAC level (`save_approval_decision`)
- **Documents**: Check completeness, record metadata, validate (`*document*` tools)
- **Workflow**: Get state, advance stages (`get_workflow_state`, `advance_workflow_state`)
- **Monitoring**: Create breach alerts, update conditions (`create_breach_alert`, `update_condition_status`)
- **Communications**: Add comments, send notifications (`add_comment`, `send_notification`)

## Workflow Stages (in order)
| # | Stage | Description | Gate to Next |
|---|---|---|---|
| 1 | INITIATION | NPA created, concept captured | Prohibited list clear |
| 2 | CLASSIFICATION | 7-domain assessment complete | Track determined |
| 3 | REVIEW | Form populated, risk assessed | All reviews done |
| 4 | SIGN_OFF | Approvals being collected | All sign-offs approved |
| 5 | LAUNCH | Preparing to go live | Documents complete |
| 6 | MONITORING | Post-launch monitoring | Ongoing |

## Sign-off Parties (standard, varies by track)
| Party | SLA (hours) | Mandatory for FULL_NPA | Mandatory for NPA_LITE |
|---|---|---|---|
| Credit Risk | 120 | Yes | No |
| Legal | 96 | Yes | Yes |
| Finance | 72 | Yes | No |
| Operations | 48 | Yes | Yes |
| Technology | 48 | Yes | No |
| MLR | 120 | Yes | No |

## Escalation Levels & Triggers
Levels: 1=Dept Head, 2=BU Head, 3=GPH, 4=Group COO, 5=CEO
Triggers: SLA_BREACH, LOOP_BACK_LIMIT (3 reworks), DISAGREEMENT, RISK_THRESHOLD

## Key Workflows

### Creating Sign-off Matrix
1. Call `get_signoff_routing_rules` with `approval_track` to get required parties
2. Call `governance_create_signoff_matrix` with:
   - `project_id` (string, required)
   - `parties` (array, required): [{`party_name`, `sla_hours`, `required`}]

### Recording a Decision
1. Call `governance_record_decision` with:
   - `project_id` (string, required)
   - `signoff_id` (integer, required)
   - `decision` (string): APPROVED, REJECTED, or REWORK
   - `comments` (string, optional)
   - `decided_by` (string, optional)

### Checking & Handling SLA Breaches
1. Call `check_sla_status` with `project_id`
2. If SLA breached, call `create_escalation` with:
   - `project_id`, `escalation_level` (1-5), `trigger_type` ("SLA_BREACH"), `reason`

### Advancing Workflow Stage
1. Call `check_document_completeness` with `project_id` (and optionally `stage`)
2. Call `governance_check_loopbacks` to ensure < 3 reworks
3. Call `governance_advance_stage` with `project_id` and `new_stage`

### Managing Documents
- `get_document_requirements` — Get required docs for a track/category
- `upload_document_metadata` — Record doc with `document_type` (TERM_SHEET, CREDIT_REPORT, RISK_MEMO, LEGAL_OPINION, ISDA, TAX_ASSESSMENT)
- `validate_document` — Update validation status (VALID/INVALID/WARNING) and stage (AUTOMATED/BUSINESS/RISK/COMPLIANCE/LEGAL/FINAL)

## Response Format
After governance actions, provide:
- **Sign-off Status table**: Party | Status | SLA Hours | Decided By
- **SLA Status**: On Track / At Risk / Breached (with counts)
- **Loop-back Count**: X/3 (circuit breaker threshold)
- **Document Completeness**: X/Y required docs present
- **Current Workflow Stage** and **Next Step**
```

### Query

```
User request: {{#sys.query#}}
Active NPA project: {{current_project_id}}
Current stage: {{current_stage}}
```

---

## Node 9: Query Data Agent

### Purpose
Handles ALL read-only queries: NPA lookups, audit trails, dashboard KPIs, knowledge base search, monitoring metrics, notifications, session history, user profiles, prospects, jurisdictions, and general data retrieval.

### Configuration

| Setting | Value |
|---|---|
| **Type** | Agent |
| **Agent Strategy** | **Function Calling** |
| **Model** | `anthropic / claude-sonnet-4-5` |
| **Temperature** | `0.3` |
| **Max Tokens** | `4096` |
| **Max Iterations** | `5` |
| **Memory** | OFF |

### MCP Tools to Enable (20 tools)

| # | Tool Name | Source | Purpose |
|---|---|---|---|
| 1 | `get_npa_by_id` | npa_data.py | Get full NPA project details (shared) |
| 2 | `list_npas` | npa_data.py | List NPAs with filters |
| 3 | `audit_get_trail` | audit.py | Get audit trail for an NPA |
| 4 | `check_audit_completeness` | audit.py | Check required audits exist |
| 5 | `generate_audit_report` | audit.py | Generate compliance report |
| 6 | `get_dashboard_kpis` | dashboard.py | Get executive dashboard KPIs |
| 7 | `search_kb_documents` | kb_search.py | Search knowledge base |
| 8 | `get_kb_document_by_id` | kb_search.py | Get specific KB document |
| 9 | `list_kb_sources` | kb_search.py | List KB sources |
| 10 | `get_performance_metrics` | monitoring.py | Post-launch performance metrics |
| 11 | `check_breach_thresholds` | monitoring.py | Check threshold breaches |
| 12 | `get_monitoring_thresholds` | monitoring.py | View configured thresholds |
| 13 | `get_post_launch_conditions` | monitoring.py | Track post-launch conditions |
| 14 | `get_pending_notifications` | notifications.py | Get pending notifications |
| 15 | `mark_notification_read` | notifications.py | Acknowledge a notification |
| 16 | `get_session_history` | workflow.py | Past agent conversation sessions |
| 17 | `log_routing_decision` | workflow.py | Log agent routing decisions |
| 18 | `get_user_profile` | workflow.py | Look up user profile |
| 19 | `session_log_message` | session.py | Log messages to sessions |
| 20 | `get_workflow_state` | workflow.py | Get workflow state (shared) |

### Instruction (System Prompt for the Agent)

```
You are the **Query Data Agent** for the NPA Workbench. You handle all read-only data queries, information retrieval, and general inquiries.

## Your Capabilities

### NPA Project Queries
- `get_npa_by_id` — Full details of an NPA (project_id required)
- `list_npas` — List with filters:
  - `status`: ACTIVE, COMPLETED, BLOCKED
  - `current_stage`: INITIATION, CLASSIFICATION, REVIEW, SIGN_OFF, LAUNCH, MONITORING
  - `risk_level`: LOW, MEDIUM, HIGH
  - `submitted_by`: Filter by submitter name
  - `limit` (default 50), `offset` (default 0)

### Audit & Compliance
- `audit_get_trail` — Chronological audit trail (filter by `action_type`, `agent_only`)
- `check_audit_completeness` — Verify all required audit entries exist (NPA_CREATED, CLASSIFIED, FORM_AUTOFILLED, SIGNOFF_APPROVED, STAGE_ADVANCED)
- `generate_audit_report` — Full compliance report with timeline, actor summary, agent reasoning chains

### Dashboard & KPIs
- `get_dashboard_kpis` — Executive metrics:
  - `snapshot_date` (optional, YYYY-MM-DD)
  - `include_live` (default true): Include real-time computed metrics
  - Returns: pipeline value, active NPAs, cycle times, approval rates, status distribution

### Knowledge Base
- `search_kb_documents` — Keyword search: `search_term` (required), `doc_type` (POLICY/REGULATION/GUIDELINE/TEMPLATE/FAQ), `limit`
- `get_kb_document_by_id` — Get specific document by `doc_id`
- `list_kb_sources` — Browse all sources by `doc_type`

### Monitoring (Post-Launch)
- `get_performance_metrics` — Volume, PnL, VaR, health status for launched NPAs
- `check_breach_thresholds` — Identify threshold breaches
- `get_monitoring_thresholds` — View configured thresholds
- `get_post_launch_conditions` — Track post-launch conditions and overdue detection

### Notifications
- `get_pending_notifications` — Get pending items filtered by `project_id`, `user_role` (MAKER/CHECKER/APPROVER/COO/ADMIN)
- `mark_notification_read` — Acknowledge a notification

### Session & User Data
- `get_session_history` — Past agent conversation sessions for a project
- `get_user_profile` — Look up user by `user_id`, `email`, or `employee_id`
- `session_log_message` — Log a message to an existing session
- `log_routing_decision` — Log an agent routing decision

### Workflow
- `get_workflow_state` — Full workflow state with stage statuses, progress, and blockers

## Response Format
- Present data in clear, structured tables when appropriate
- Highlight any issues: breached SLAs, overdue conditions, failed audits
- For dashboard KPIs, use summary statistics with key metrics bolded
- Always suggest next actions when relevant
```

### Query

```
User request: {{#sys.query#}}
Active NPA project: {{current_project_id}}
Current stage: {{current_stage}}
```

---

## Node 10: Response Formatter (LLM Node)

### Purpose
Takes the raw agent output and formats it into a clean, professional response for the user. Extracts project_id and stage for context tracking.

### Configuration

| Setting | Value |
|---|---|
| **Type** | LLM |
| **Model** | `anthropic / claude-sonnet-4-5` |
| **Temperature** | `0.3` |
| **Max Tokens** | `2048` |
| **Memory** | **ON** — Window size: `5` |

### Context Variables

Connect the output of ALL 6 agent nodes as context. Since only ONE agent runs per turn (due to the IF/ELSE router), the formatter will receive output from whichever agent was activated — the others will be empty.

### SYSTEM Prompt

```
You are the response formatter for the NPA Multi-Agent Workbench. You receive raw output from one of six specialized agents and format it into a clean, professional response.

## Your Tasks
1. Format the agent's output into a clear, well-structured response
2. Extract any NPA project ID mentioned (format: NPA-YYYY-XXXX)
3. Extract the current workflow stage if mentioned
4. Add a "Next Steps" section when appropriate

## Formatting Rules
- Use **bold** for key labels (Project ID, Status, Risk Level, etc.)
- Use bullet points for lists of 3+ items
- Use markdown tables for multi-column data (domain scores, sign-off status, etc.)
- Keep the response concise — summarize verbose agent output
- Never expose raw JSON, tool call details, or internal error traces to the user
- If the agent encountered an error, explain it in plain language with a suggested action

## Footer Format
Always end every response with:
---
**Project:** [project_id or "None active"]  |  **Stage:** [current stage or "N/A"]  |  **Next:** [recommended next action]
```

### USER Prompt

```
Format the following agent response for the user:

{{#ideation_agent.text#}}
{{#classification_agent.text#}}
{{#autofill_agent.text#}}
{{#risk_agent.text#}}
{{#governance_agent.text#}}
{{#query_data_agent.text#}}
```

> **NOTE:** Replace `ideation_agent`, `classification_agent`, etc. with the actual node IDs assigned by Dify when you create each agent node. Only one will have output per turn; the others will be empty.

---

## Node 11: Variable Assigner (Code Node)

### Purpose
Extracts project_id and stage from the formatter output and updates conversation variables for context across turns.

### Configuration

| Setting | Value |
|---|---|
| **Type** | Code |
| **Language** | Python |

### Input Variables
| Variable | Source |
|---|---|
| `formatter_output` | `{{#response_formatter.text#}}` |

### Code

```python
import re

def main(formatter_output: str) -> dict:
    project_id = ""
    stage = ""

    # Extract project ID (format: NPA-YYYY-XXXX)
    pid_match = re.search(r'NPA-\d{4}-\d{3,5}', formatter_output)
    if pid_match:
        project_id = pid_match.group(0)

    # Extract stage
    stages = ["MONITORING", "LAUNCH", "SIGN_OFF", "REVIEW", "CLASSIFICATION", "INITIATION"]
    for s in stages:
        if s in formatter_output.upper():
            stage = s
            break

    return {
        "project_id": project_id,
        "stage": stage
    }
```

### Output Variable Assignments
| Output | Assign to Conversation Variable |
|---|---|
| `project_id` | `current_project_id` |
| `stage` | `current_stage` |

> **To wire this**: After the Code node, add two **Variable Assigner** nodes (or use the Dify Variable Assignment feature) to write `project_id` → `current_project_id` and `stage` → `current_stage`.

---

## Node 12: Answer

### Purpose
Outputs the final formatted response to the user.

### Configuration

| Setting | Value |
|---|---|
| **Type** | Answer |
| **Answer content** | `{{#response_formatter.text#}}` |

> Replace `response_formatter` with the actual node ID of your Response Formatter LLM node.

---

## Edge Connections Summary

```
Start ──────────────────────► Intent Classifier (LLM)
Intent Classifier ──────────► IF/ELSE Router
IF/ELSE [create_npa] ──────► Ideation Agent
IF/ELSE [classify_npa] ────► Classification Agent
IF/ELSE [autofill_npa] ────► AutoFill Agent
IF/ELSE [risk_assessment] ─► Risk Agent
IF/ELSE [governance] ──────► Governance Agent
IF/ELSE [ELSE] ────────────► Query Data Agent
Ideation Agent ────────────► Response Formatter (LLM)
Classification Agent ──────► Response Formatter (LLM)
AutoFill Agent ────────────► Response Formatter (LLM)
Risk Agent ────────────────► Response Formatter (LLM)
Governance Agent ──────────► Response Formatter (LLM)
Query Data Agent ──────────► Response Formatter (LLM)
Response Formatter ────────► Variable Assigner (Code)
Variable Assigner ─────────► Answer
```

**Total: 16 edges**

---

## Checklist Before Publishing

- [ ] All LLM/Agent nodes use `anthropic / claude-sonnet-4-5` (NOT Opus)
- [ ] Intent Classifier has Memory ON (window size 10)
- [ ] Response Formatter has Memory ON (window size 5)
- [ ] All 6 agent nodes have Memory OFF
- [ ] All 6 agent nodes use **Function Calling** strategy (NOT ReAct)
- [ ] IF/ELSE router has **5 separate IF cases + 1 ELSE** (not all in one case)
- [ ] IF/ELSE conditions use **contains** operator with exact strings: `create_npa`, `classify_npa`, `autofill_npa`, `risk_assessment`, `governance`
- [ ] 3 conversation variables defined: `current_project_id`, `current_stage`, `user_intent`
- [ ] Opening statement configured
- [ ] Tool counts per agent: Ideation=12, Classification=10, AutoFill=9, Risk=11, Governance=22, Query Data=20 (overlaps expected per architecture)
- [ ] Answer node references correct upstream node
- [ ] All `{{#node_id.text#}}` references use correct node IDs (underscores only, no hyphens)

---

## Test Prompts

### Test 1 — Create NPA
```
I want to create a new NPA for a Blockchain Settlement Platform product.
It's a New-to-Group product in the Digital Assets family with estimated notional of $100M.
```
**Expected:** Ideation Agent → prohibited list check → find similar → create NPA → audit log → returns NPA-YYYY-XXXX

### Test 2 — Classify NPA
```
Please classify NPA-2025-0001 and determine the approval track.
```
**Expected:** Classification Agent → get NPA → get criteria → 7-domain assessment → scorecard → track → audit log

### Test 3 — Auto-Fill Form
```
Auto-fill the NPA form for NPA-2025-0001 using the New-to-Group template.
```
**Expected:** AutoFill Agent → get NPA → get assessment → load template → batch populate → coverage report

### Test 4 — Risk Assessment
```
Run a full risk assessment for NPA-2025-0001 including market risk factors.
```
**Expected:** Risk Agent → 4-layer checks → domain assessments → market factors → prerequisites → audit log

### Test 5 — Governance
```
Create the sign-off matrix for NPA-2025-0001 and check document completeness.
```
**Expected:** Governance Agent → get routing rules → create matrix → check documents → report status

### Test 6 — Query Data
```
Show me the dashboard KPIs and list all active NPAs.
```
**Expected:** Query Data Agent → dashboard KPIs → list NPAs with status=ACTIVE
