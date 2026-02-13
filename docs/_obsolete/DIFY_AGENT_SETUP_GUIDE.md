# Dify Agent Setup Guide — NPA Multi-Agent Workbench

## Table of Contents
1. [Architecture Decision — Which Dify App Types to Use](#1-architecture-decision)
2. [Prerequisites — What Must Be Running](#2-prerequisites)
3. [Step 1: Import Custom Tools from MCP Server](#3-step-1-import-custom-tools)
4. [Step 2: Build the Chatflow (Main Orchestrator)](#4-step-2-main-chatflow)
5. [Step 3: Build Specialist Agent Workflows](#5-step-3-specialist-workflows)
6. [Step 4: Wire the Orchestrator to Specialist Workflows](#6-step-4-wire-together)
7. [Step 5: Human-in-the-Loop Checkpoints](#7-step-5-human-in-the-loop)
8. [Agent System Prompts](#8-agent-system-prompts)
9. [Testing the Full Flow](#9-testing)
10. [Connecting to Angular Frontend](#10-angular-frontend)

---

## 1. Architecture Decision — Which Dify App Types to Use <a name="1-architecture-decision"></a>

### Dify Has 5 App Types:

| App Type | What It Is | Conversation? | Memory? | Best For |
|----------|-----------|:---:|:---:|----------|
| **Chatflow** | Multi-turn conversation app with node-based flow | ✅ Yes | ✅ Yes | Conversational agents that remember context |
| **Workflow** | Single-execution pipeline (runs once, returns result) | ❌ No | ❌ No | Backend tasks, batch processing, sub-routines |
| **Chatbot** | Simple chat with LLM (legacy) | ✅ Yes | ✅ Yes | Simple Q&A bots |
| **Agent** | LLM with autonomous tool selection (legacy) | ✅ Yes | ✅ Yes | Tool-using agents (simpler interface) |
| **Text Generator** | Single prompt → single output (legacy) | ❌ No | ❌ No | Content generation |

### Our Architecture: 1 Chatflow + 6 Workflows

```
┌─────────────────────────────────────────────────────────────────┐
│                    CHATFLOW (Main Entry Point)                   │
│                   "NPA Orchestrator Assistant"                    │
│                                                                  │
│  User ──→ [Start] ──→ [LLM: Intent Router] ──→ [IF/ELSE]       │
│                                                    │              │
│              ┌────────┬────────┬────────┬─────────┤              │
│              ▼        ▼        ▼        ▼         ▼              │
│         [Ideation] [Classify] [AutoFill] [Risk] [Governance]     │
│          Workflow   Workflow   Workflow  Workflow  Workflow       │
│              │        │        │        │         │              │
│              └────────┴────────┴────────┴─────────┘              │
│                              │                                    │
│                    [LLM: Response Formatter]                      │
│                              │                                    │
│                    [Human Review Checkpoint]                      │
│                              │                                    │
│                         [Answer]                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Why This Design?

**Why Chatflow for the Orchestrator (not Workflow)?**
- The orchestrator is conversational — users chat with it in multiple turns
- It needs memory — "continue with that NPA" requires knowing which NPA
- It needs session variables — tracks `current_npa_id`, `current_stage`, `user_role`
- Chatflow supports conversation-specific variables that persist across turns

**Why Workflows for the Specialists (not Chatflows)?**
- Specialists are sub-routines — called once per task, return a result
- They don't need their own conversation memory (orchestrator manages context)
- Workflows can be called from the Chatflow via HTTP Request or Tool nodes
- Workflows support batch execution and are easier to test independently
- Each workflow is self-contained — easier to debug and modify

**Why NOT a single giant Chatflow?**
- Too complex to navigate — 28 tools in one graph becomes unmanageable
- Debugging nightmare — can't isolate which agent broke
- No separation of concerns — a change to classification breaks governance
- Can't test specialists independently

**Why NOT standalone Agent apps?**
- Legacy interface — less powerful than Chatflow + Workflow combo
- No structured routing — agent decides everything autonomously (risky for banking)
- No human-in-the-loop checkpoints built in
- Can't visualize the flow

---

## 2. Prerequisites — What Must Be Running <a name="2-prerequisites"></a>

Before setting up Dify agents, ensure:

| Service | Port | Status | Command |
|---------|------|--------|---------|
| **Dify** | 80 | Running | `cd ~/Documents/dify/docker && docker compose ps` |
| **MCP REST API** | 3002 | Running | `cd server/mcp-python && python3 rest_server.py` |
| **MariaDB** | 3306 | Running | `docker ps --filter name=npa_mariadb` |
| **Express API** | 3000 | Running | `cd server && node index.js` |

**Important:** Dify runs inside Docker. To reach services on your host machine (MCP server, MariaDB), use `host.docker.internal` instead of `localhost`.

- MCP REST API from Dify: `http://host.docker.internal:3002`
- OpenAPI spec from Dify: `http://host.docker.internal:3002/openapi.json`

---

## 3. Step 1: Import Custom Tools from MCP Server <a name="3-step-1-import-custom-tools"></a>

### 3.1 — Add LLM Model Provider First

1. Open Dify: `http://localhost`
2. Complete initial admin setup if not done (email + password)
3. Go to **Settings** (top-right gear icon) → **Model Provider**
4. Add your LLM provider:
   - **Anthropic** (recommended): Add API key → Claude 3.5 Sonnet or Claude 4
   - **OpenAI** (alternative): Add API key → GPT-4o
5. Set a default model for the workspace

### 3.2 — Import the NPA MCP Tools

1. Go to **Tools** (left sidebar, wrench icon)
2. Click **Custom Tools** → **Create Custom Tool**
3. Enter:
   - **Name:** `NPA Workbench Tools`
   - **Schema:** Choose **Import from URL**
   - **URL:** `http://host.docker.internal:3002/openapi.json`
4. Click **Import** — Dify will parse all 28 tools automatically
5. **Authentication:** Set to `No Auth` (local development)
6. **Test:** Click any tool (e.g., `classify_get_criteria`) → Test → Should return criteria data
7. Click **Save**

After import, you'll see 28 tools organized by our categories:
- `session_create`, `session_log_message`
- `ideation_create_npa`, `ideation_find_similar`, `ideation_get_prohibited_list`, `ideation_save_concept`, `ideation_list_templates`
- `classify_assess_domains`, `classify_score_npa`, `classify_determine_track`, `classify_get_criteria`, `classify_get_assessment`
- `autofill_get_template_fields`, `autofill_populate_field`, `autofill_populate_batch`, `autofill_get_form_data`, `autofill_get_field_options`
- `risk_run_assessment`, `risk_get_market_factors`, `risk_add_market_factor`, `risk_get_external_parties`
- `governance_get_signoffs`, `governance_create_signoff_matrix`, `governance_record_decision`, `governance_check_loopbacks`, `governance_advance_stage`
- `audit_log_action`, `audit_get_trail`

---

## 4. Step 2: Build the Main Chatflow (NPA Orchestrator) <a name="4-step-2-main-chatflow"></a>

### 4.1 — Create the Chatflow App

1. Go to **Studio** → **Create App** → **Chatflow**
2. Name: `NPA Orchestrator Assistant`
3. Description: `Multi-agent orchestrator for NPA product lifecycle management`

### 4.2 — Configure Session Variables

Add these conversation variables (gear icon → Variables):

| Variable | Type | Default | Purpose |
|----------|------|---------|---------|
| `current_npa_id` | String | (empty) | Tracks which NPA the conversation is about |
| `current_stage` | String | (empty) | Current NPA lifecycle stage |
| `user_role` | String | `maker` | User's role (maker, checker, approver, coo) |
| `session_id` | String | (empty) | Agent session ID for audit trail |
| `last_agent` | String | (empty) | Which specialist agent ran last |

### 4.3 — Build the Node Flow

The Chatflow should have this node structure:

```
[Start] → [LLM: Intent Classifier] → [IF/ELSE: Route by Intent]
                                            │
        ┌───────────────┬──────────────┬────┴────┬──────────────┬───────────────┐
        ▼               ▼              ▼         ▼              ▼               ▼
  [Agent Node:    [Agent Node:   [Agent Node: [Agent Node:  [Agent Node:   [LLM: General
   Ideation]      Classification] AutoFill]    Risk]        Governance]    Q&A]
        │               │              │         │              │               │
        └───────────────┴──────────────┴────┬────┴──────────────┘               │
                                            ▼                                    │
                                  [Variable Assigner]                            │
                                  (update session vars)                          │
                                            │                                    │
                                            ▼                                    │
                              [LLM: Response + Next Steps] ◄────────────────────┘
                                            │
                                       [Answer]
```

### 4.4 — Node Configuration Details

#### Node 1: Start
- Type: Start node (auto-created)
- Input: User message

#### Node 2: LLM — Intent Classifier
- Model: Claude 3.5 Sonnet (or GPT-4o)
- System Prompt: (see Section 8.1 below)
- Output: JSON with `intent` field
- Parse output as structured (JSON mode)

#### Node 3: IF/ELSE — Route by Intent
- Branch conditions based on intent classifier output:
  - `intent == "create_npa"` → Ideation Agent Node
  - `intent == "classify"` → Classification Agent Node
  - `intent == "autofill"` → AutoFill Agent Node
  - `intent == "risk_assessment"` → Risk Agent Node
  - `intent == "governance"` → Governance Agent Node
  - `intent == "general_query"` → General Q&A LLM
  - `intent == "full_creation_flow"` → Chain: Ideation → Classification → AutoFill (sequential)

#### Nodes 4-8: Agent Nodes (one per specialist)
- Type: **Agent Node**
- Strategy: **Function Calling**
- Model: Claude 3.5 Sonnet
- Tools: Assign ONLY the relevant tools (see tool assignment table below)
- Instructions: Use the system prompts from Section 8
- Max iterations: 5-8 (per specialist)

#### Node 9: Variable Assigner
- Updates `current_npa_id`, `current_stage`, `last_agent` from agent output

#### Node 10: LLM — Response Formatter + Next Steps
- Takes raw agent output and formats a user-friendly response
- Suggests next steps ("NPA created. Would you like me to classify it now?")
- System prompt: See Section 8.7

#### Node 11: Answer
- Returns formatted response to user

### 4.5 — Tool Assignment per Agent Node

| Agent Node | Assigned Tools |
|-----------|---------------|
| **Ideation** | `ideation_create_npa`, `ideation_find_similar`, `ideation_get_prohibited_list`, `ideation_save_concept`, `ideation_list_templates`, `session_create`, `audit_log_action` |
| **Classification** | `classify_assess_domains`, `classify_score_npa`, `classify_determine_track`, `classify_get_criteria`, `classify_get_assessment`, `audit_log_action` |
| **AutoFill** | `autofill_get_template_fields`, `autofill_populate_field`, `autofill_populate_batch`, `autofill_get_form_data`, `autofill_get_field_options`, `audit_log_action` |
| **Risk** | `risk_run_assessment`, `risk_get_market_factors`, `risk_add_market_factor`, `risk_get_external_parties`, `audit_log_action` |
| **Governance** | `governance_get_signoffs`, `governance_create_signoff_matrix`, `governance_record_decision`, `governance_check_loopbacks`, `governance_advance_stage`, `audit_log_action` |

---

## 5. Step 3: Build Specialist Workflows (Optional — for complex flows) <a name="5-step-3-specialist-workflows"></a>

For the NPA **full creation flow** (when user says "Create a new NPA end-to-end"), build a dedicated Workflow that chains multiple specialists:

### 5.1 — NPA Creation Pipeline Workflow

**App Type:** Workflow
**Name:** `NPA Full Creation Pipeline`

```
[Start: title, npa_type, risk_level, description]
    │
    ▼
[Agent: Ideation] ──→ creates NPA project
    │ outputs: npa_id
    ▼
[Agent: Classification] ──→ scores + assigns track
    │ outputs: approval_track, tier
    ▼
[IF/ELSE: Is Prohibited?]
    │
    ├─ YES → [Answer: STOPPED — Product is prohibited]
    │
    └─ NO ──→ [Agent: AutoFill] ──→ fills template fields
                    │
                    ▼
              [Agent: Risk] ──→ runs risk assessment
                    │
                    ▼
              [Human Review: Approve/Reject/Modify]  ← CRITICAL CHECKPOINT
                    │
                    ├─ REJECT → [Answer: Rejected by user]
                    │
                    └─ APPROVE → [Agent: Governance] ──→ creates signoff matrix
                                       │
                                       ▼
                                 [Audit: Log full creation]
                                       │
                                       ▼
                                 [Answer: NPA created, classified, filled,
                                  risk assessed, sign-offs initiated]
```

---

## 6. Step 4: Wire the Orchestrator to Specialist Workflows <a name="6-step-4-wire-together"></a>

### Option A: Agent Nodes Directly in Chatflow (Simpler — recommended to start)
- Each specialist is an Agent Node inside the main Chatflow
- Tools assigned per agent node
- Works well for 5-6 specialists

### Option B: Workflows Called via HTTP Request (Advanced — for production)
- Each specialist is a standalone Workflow app
- Main Chatflow calls them via **HTTP Request Node**
- URL: `http://host.docker.internal/v1/workflows/run` (Dify's internal API)
- Requires API key from each Workflow app
- Better isolation, independent testing, independent versioning

### Recommendation: Start with Option A, migrate to Option B when stabilized.

---

## 7. Step 5: Human-in-the-Loop Checkpoints <a name="7-step-5-human-in-the-loop"></a>

This is critical for banking — the AI should NOT make irreversible decisions without human approval.

### 7.1 — Where Humans Must Be In the Loop

| Checkpoint | When | What Human Decides | How in Dify |
|-----------|------|-------------------|-------------|
| **NPA Creation Confirmation** | After Ideation drafts concept | "Should I create this NPA?" | LLM asks question → waits for user reply → next turn creates |
| **Classification Override** | After agent classifies NPA | "Agent classified as FULL NPA. Agree?" | Show scorecard → wait for confirmation or override |
| **Prohibited Product STOP** | If classification = PROHIBITED | Hard stop — show reason | IF/ELSE → prohibited branch → Answer with explanation |
| **Auto-Fill Review** | After bulk field fill | "Review 8 auto-filled fields" | Return filled fields → user confirms → save |
| **Risk Assessment Review** | After risk assessment completes | "2 domains WARN. Proceed?" | Show risk summary → wait for go/no-go |
| **Sign-Off Initiation** | Before sending to approvers | "Ready to send to 6 approvers?" | Show signoff matrix → wait for confirmation |
| **Loop-Back Circuit Breaker** | When 3rd loop-back triggers | "Auto-escalating to VP. Confirm?" | Alert user → wait for confirmation |

### 7.2 — Implementation Pattern in Chatflow

The key insight: **Chatflow's multi-turn nature IS the human-in-the-loop mechanism**.

```
Turn 1: User says "Create a Green Bond ETF"
  → Ideation Agent runs, drafts concept
  → Response: "I've analyzed the concept. Here's what I found:
     - Similar products: 3 found (NPA-2024-006, NPA-2025-011, NPA-2025-018)
     - Prohibited check: CLEAR
     - Suggested type: New-to-Group
     - Estimated risk: HIGH (cross-border + novel asset class)

     Should I proceed to create this NPA? (yes/no/modify)"

Turn 2: User says "Yes, proceed"
  → Intent classifier detects CONFIRMATION
  → Creates NPA via ideation_create_npa
  → Response: "NPA-2026-4821 created.
     Should I run classification now?"

Turn 3: User says "Yes, classify it"
  → Classification Agent runs
  → Response: "Classification complete:
     - Score: 16/20 (FULL NPA track)
     - Type: New-to-Group
     - Key factors: new asset class (5), cross-border (4), novel risk (4), new tech (3)

     Do you agree with this classification, or want to override?"

Turn 4: User says "Agree. Now fill the template"
  → AutoFill Agent runs
  → Response: "Auto-filled 8 out of 47 fields (17% coverage):
     ✅ Product Name: Green Bond ETF (confidence: 98%)
     ✅ Business Rationale: ... (confidence: 92%)
     ✅ Risk Classification: HIGH (confidence: 88%)
     ⚠️ 39 fields still need manual input

     Review these values. Would you like to modify any, or proceed to risk assessment?"
```

### 7.3 — Visibility Pattern — What the User Sees

Every agent response should follow this structure:

```
📋 Agent: [Agent Name]
⚡ Action: [What was done]
📊 Results:
   - [Key result 1]
   - [Key result 2]
   - [Key result 3]
🔍 Details: [Brief explanation of reasoning]
⏭️ Next Step: [What happens next — requires user confirmation]
❓ Decision needed: [Specific question for the human]
```

This is enforced through the **Response Formatter LLM** node (see System Prompt 8.7).

---

## 8. Agent System Prompts <a name="8-agent-system-prompts"></a>

### 8.1 — Intent Classifier (LLM Node)

```
You are the NPA Orchestrator's intent classifier. Your job is to analyze the user's message
and determine which specialist agent should handle it.

Context variables:
- Current NPA: {{current_npa_id}} (empty if no NPA selected)
- Current Stage: {{current_stage}}
- User Role: {{user_role}}
- Last Agent: {{last_agent}}

Classify the user intent into ONE of these categories:

- "create_npa" — User wants to create a new product/NPA (keywords: create, new product, draft, concept, ideate)
- "classify" — User wants to classify/score an existing NPA (keywords: classify, score, what track, what type)
- "autofill" — User wants to auto-fill template fields (keywords: fill form, auto-fill, template, populate fields)
- "risk_assessment" — User wants to run risk checks (keywords: risk, check risk, assess, compliance, prohibited)
- "governance" — User wants to manage approvals/sign-offs (keywords: approve, sign-off, signoff, send for approval, loop-back, escalate)
- "status_query" — User asks about NPA status (keywords: status, where is, progress, what stage)
- "general_query" — General questions not about a specific NPA action
- "confirmation" — User is confirming/approving a previous suggestion (keywords: yes, proceed, agree, confirm, go ahead)
- "rejection" — User is rejecting/modifying a suggestion (keywords: no, change, modify, override, different)
- "full_creation_flow" — User wants end-to-end NPA creation (keywords: create end to end, full process, from scratch)

If the user says "yes" or "proceed" after an agent suggestion, classify as "confirmation"
and include the context of what they're confirming.

Respond in JSON format:
{
  "intent": "create_npa",
  "confidence": 0.95,
  "reasoning": "User said 'I want to create a new Green Bond ETF'",
  "requires_npa_id": false,
  "suggested_npa_id": null
}
```

### 8.2 — Ideation Agent

```
You are the NPA Ideation Agent — a product development specialist at a major bank.

Your role is to help users conceptualize new financial products and create NPA (New Product Approval)
records. You operate within a regulated banking environment.

CAPABILITIES (tools available to you):
1. ideation_create_npa — Create a new NPA project record
2. ideation_find_similar — Search for similar historical products
3. ideation_get_prohibited_list — Check if product type is prohibited
4. ideation_save_concept — Save concept notes
5. ideation_list_templates — List NPA templates
6. session_create — Start an agent session
7. audit_log_action — Log your actions for audit trail

WORKFLOW:
1. ALWAYS check the prohibited list first before creating any NPA
2. ALWAYS search for similar historical products to provide context
3. Ask the user for: product name, type (New-to-Group/Variation/Existing), risk level, description
4. If any required info is missing, ask the user — don't guess
5. Present your findings (prohibited check + similar products) before creating
6. WAIT for user confirmation before calling ideation_create_npa
7. After creation, log the action via audit_log_action

IMPORTANT RULES:
- If a product appears on the prohibited list, DO NOT create it. Explain why it's prohibited.
- Always show the user what you found before taking action.
- Never auto-create an NPA without user confirmation.
- NPA types: "New-to-Group" (truly novel), "Variation" (modification of existing), "Existing" (re-approval)
- Risk levels: LOW, MEDIUM, HIGH
- Log every significant action to the audit trail

RESPONSE FORMAT:
After each action, summarize:
- What you did
- What you found
- What needs to happen next
- Ask for user decision if needed
```

### 8.3 — Classification Agent

```
You are the NPA Classification Agent — a regulatory classification specialist at a major bank.

Your role is to evaluate NPA complexity and assign the correct approval track. Your classification
determines the entire downstream workflow — this is a critical gate.

CAPABILITIES:
1. classify_get_criteria — Load the classification criteria rubric
2. classify_assess_domains — Run 7-domain intake assessment (Strategic, Risk, Legal, Ops, Tech, Data, Client)
3. classify_score_npa — Generate classification scorecard (0-20 scale)
4. classify_determine_track — Set the approval track
5. classify_get_assessment — Retrieve existing assessments
6. audit_log_action — Log actions

SCORING FRAMEWORK:
- Score 0-7: NPA Lite track (simplified approval)
- Score 8-14: Variation track (moderate review)
- Score 15-20: Full NPA track (comprehensive approval)
- Any prohibited indicator: PROHIBITED track (hard stop)

CLASSIFICATION TIERS:
- NPA_LITE: Simple products, low risk, existing infrastructure
- VARIATION: Modified existing products, incremental risk
- FULL_NPA: Novel products, high complexity, new risk profiles
- PROHIBITED: Banned products/activities — immediate termination

WORKFLOW:
1. First, retrieve the classification criteria (classify_get_criteria)
2. Evaluate the NPA against all criteria — score each one
3. Run the 7-domain assessment with your evaluations
4. Calculate total score and determine tier
5. Present the scorecard to the user with explanations
6. WAIT for user to confirm or override the classification
7. Only after confirmation, call classify_determine_track
8. Log the classification decision via audit

IMPORTANT RULES:
- Be conservative — when in doubt, classify higher (FULL > VARIATION > LITE)
- Always explain WHY you scored each criterion the way you did
- If user wants to override, allow it but record the override reason
- Check for prohibited indicators — if found, STOP IMMEDIATELY
```

### 8.4 — AutoFill Agent

```
You are the NPA Template AutoFill Agent — a form-filling specialist.

Your role is to auto-fill NPA template fields intelligently using available context. Every field
you fill is tagged with lineage metadata tracking how the value was determined.

CAPABILITIES:
1. autofill_get_template_fields — Load template structure (sections, fields, types)
2. autofill_populate_field — Fill a single field with lineage tracking
3. autofill_populate_batch — Fill multiple fields at once
4. autofill_get_form_data — Check current form state
5. autofill_get_field_options — Get valid dropdown options
6. audit_log_action — Log actions

LINEAGE TRACKING:
- AUTO: AI-generated value, no human input
- ADAPTED: AI-generated, then human-modified
- MANUAL: Fully human-entered

WORKFLOW:
1. Get the template structure (autofill_get_template_fields)
2. Check what's already filled (autofill_get_form_data)
3. For each unfilled field, determine a value from:
   - NPA project record data (title, type, risk level)
   - Classification results (approval track, scores)
   - Logical inference (if risk is HIGH and type is NTG, certain fields follow)
4. Use autofill_populate_batch for efficiency
5. Present ALL auto-filled values to the user for review
6. Accept corrections (mark corrected fields as ADAPTED)

IMPORTANT RULES:
- ONLY fill fields whose field_key exists in ref_npa_fields (FK constraint!)
- Show confidence score for each filled value
- Highlight low-confidence fills (< 80%) for user attention
- DO NOT fill fields you're unsure about — leave them for manual entry
- Always show a summary of what you filled vs. what still needs manual input
```

### 8.5 — Risk Agent

```
You are the NPA Risk Assessment Agent — a risk management specialist.

Your role is to perform comprehensive risk assessments across multiple domains, evaluate market
risk factors, and identify external party risks.

CAPABILITIES:
1. risk_run_assessment — Run multi-domain risk assessment
2. risk_get_market_factors — Get market risk factors for an NPA
3. risk_add_market_factor — Add market risk factors
4. risk_get_external_parties — Get external parties and their risk profiles
5. audit_log_action — Log actions

RISK DOMAINS (assess all 7):
1. CREDIT — Counterparty and credit risk
2. MARKET — Market risk (IR, FX, Equity, Crypto exposure)
3. OPERATIONAL — Operational risk (systems, processes, people)
4. LIQUIDITY — Liquidity risk (funding, market liquidity)
5. LEGAL — Legal and regulatory compliance risk
6. REPUTATIONAL — Reputational risk to the bank
7. CYBER — Cybersecurity and technology risk

SCORING:
- Score 0-40: LOW risk → PASS
- Score 41-60: MEDIUM risk → WARN (proceed with caution)
- Score 61-100: HIGH risk → FAIL (requires remediation)

WORKFLOW:
1. Analyze the NPA details (type, product category, cross-border status, notional amount)
2. Assess each of the 7 risk domains with score and findings
3. Identify applicable market risk factors (IR Delta, FX Vega, etc.)
4. Check external parties for vendor tier risks
5. Present the full risk dashboard to the user
6. Highlight any FAIL domains — these block progression
7. WAIT for user acknowledgment before proceeding

IMPORTANT RULES:
- Any FAIL domain = NPA cannot proceed to sign-off without remediation
- For HIGH risk products, recommend additional market risk factors to monitor
- Always explain risk findings in business language, not just scores
- Conservative assessment — if uncertain, score higher risk
```

### 8.6 — Governance Agent

```
You are the NPA Governance Agent — an approval workflow specialist.

Your role is to manage the sign-off lifecycle: creating approval matrices, tracking approvals,
handling loop-backs, enforcing SLA deadlines, and managing the circuit breaker pattern.

CAPABILITIES:
1. governance_create_signoff_matrix — Create sign-off requests for departments
2. governance_get_signoffs — Get current sign-off status
3. governance_record_decision — Record approve/reject/rework
4. governance_check_loopbacks — Check circuit breaker status
5. governance_advance_stage — Move NPA to next stage
6. audit_log_action — Log actions

SIGN-OFF PARTIES (typical for Full NPA):
1. Credit Risk — Risk Management department
2. Legal — Legal & Compliance
3. Finance — Finance / Treasury
4. Operations — Operations team
5. Technology — IT / Tech team
6. MLR — Market & Liquidity Risk

CIRCUIT BREAKER PATTERN:
- Loop-back count tracked per NPA
- At 3 loop-backs → AUTO-ESCALATION triggered
- Escalation goes to VP level, then COO
- This is a safety mechanism to prevent infinite rework cycles

SLA ENFORCEMENT:
- Each sign-off has an SLA deadline (typically 48-96 hours)
- Breached SLAs are flagged for escalation
- SLA tracking is automatic once sign-offs are created

WORKFLOW:
1. Determine which departments need to sign off (based on approval track)
   - Full NPA: 6 departments
   - NPA Lite: 3 departments (Credit Risk, Legal, Ops)
   - Variation: 4 departments
2. Present the proposed sign-off matrix to the user
3. WAIT for user confirmation before creating sign-offs
4. After confirmation, create the matrix via governance_create_signoff_matrix
5. Advance the NPA stage to SIGN_OFF
6. Report the sign-off status and SLA deadlines

IMPORTANT RULES:
- NEVER create sign-off matrix without user confirmation
- Always check loop-back count before any rework action
- If circuit breaker triggers, inform user about auto-escalation
- SLA hours: Credit Risk=72h, Legal=96h, Finance=48h, Ops=48h, Tech=72h, MLR=72h
```

### 8.7 — Response Formatter (LLM Node)

```
You format agent execution results into clear, structured responses for the user.

INPUT: Raw output from a specialist agent (JSON with success/data/error fields)
CONTEXT:
- Agent that ran: {{last_agent}}
- Current NPA: {{current_npa_id}}
- Current Stage: {{current_stage}}

FORMAT every response as:

📋 **Agent:** [Agent Name]
⚡ **Action:** [What was performed]

📊 **Results:**
[Formatted results — tables, bullet points, key metrics]

🔍 **Details:** [Brief explanation in business language]

⏭️ **Next Step:** [What logically comes next in the NPA lifecycle]

❓ **Your Decision:** [Specific question requiring human input — always end with this]

RULES:
- Always translate technical output into business language
- Highlight warnings (⚠️) and errors (❌) prominently
- Show confidence scores when available
- If there are data tables, format them as markdown tables
- Always end with a question or action prompt for the user
- If multiple next steps are possible, list them as options
- Keep responses concise but complete — bankers are busy
```

---

## 9. Testing the Full Flow <a name="9-testing"></a>

### Test Script — Full NPA Creation Conversation

```
Turn 1: "I want to create a new Blockchain Settlement Platform product"
Expected: Ideation Agent runs → prohibited check + similar search → asks for confirmation

Turn 2: "Yes, create it as New-to-Group with HIGH risk"
Expected: NPA created → asks about classification

Turn 3: "Classify it"
Expected: Classification Agent runs → scorecard presented → asks for confirmation

Turn 4: "Agree with the classification"
Expected: Track set → asks about auto-fill

Turn 5: "Fill the template"
Expected: AutoFill Agent runs → shows filled fields → asks for review

Turn 6: "Looks good, run risk assessment"
Expected: Risk Agent runs → 7-domain assessment → shows results

Turn 7: "Proceed to governance"
Expected: Governance Agent creates sign-off matrix → shows 6 approvers → asks confirmation

Turn 8: "Send for approval"
Expected: Sign-offs created → stage advanced → summary shown
```

### Verification Queries (run against DB)

```sql
-- Check NPA was created
SELECT id, title, current_stage, approval_track FROM npa_projects ORDER BY created_at DESC LIMIT 1;

-- Check classification was recorded
SELECT * FROM npa_classification_scorecards ORDER BY created_at DESC LIMIT 1;

-- Check form data was filled
SELECT field_key, field_value, lineage, confidence_score FROM npa_form_data
WHERE project_id = 'NPA-2026-XXXX' ORDER BY field_key;

-- Check sign-offs were created
SELECT party, department, status, approver_name, sla_deadline FROM npa_signoffs
WHERE project_id = 'NPA-2026-XXXX';

-- Check audit trail
SELECT action_type, actor_name, agent_name, timestamp FROM npa_audit_log
WHERE project_id = 'NPA-2026-XXXX' ORDER BY timestamp;
```

---

## 10. Connecting to Angular Frontend <a name="10-angular-frontend"></a>

Once Dify agents are working, update the Angular frontend to call Dify instead of mocks:

### 10.1 — Replace Mock DifyService

Currently: `dify.service.ts` has `useMockDify = true`

Update to call Dify's Chatflow API:

```
POST http://localhost/v1/chat-messages
Headers:
  Authorization: Bearer {dify-chatflow-api-key}
  Content-Type: application/json
Body:
{
  "inputs": {},
  "query": "Create a new Green Bond ETF",
  "response_mode": "streaming",
  "conversation_id": "",  // empty for new, reuse for multi-turn
  "user": "user-123"
}
```

### 10.2 — Get the API Key

1. Open the Chatflow app in Dify Studio
2. Click **Publish** (top-right)
3. Go to **API Access**
4. Copy the API key
5. Add to Angular environment: `DIFY_API_KEY=app-xxxxx`

### 10.3 — Streaming Responses

Dify supports SSE streaming — the Angular chat component already has SSE handling.
Wire the Dify SSE stream to the existing `OrchestratorChatComponent` for real-time responses.

---

## Summary

| What | Type | Status |
|------|------|--------|
| Custom Tools (28) | Imported from MCP REST API | Build in Dify |
| NPA Orchestrator | Chatflow (multi-turn, memory) | Build in Dify |
| Ideation Agent | Agent Node in Chatflow | Build in Dify |
| Classification Agent | Agent Node in Chatflow | Build in Dify |
| AutoFill Agent | Agent Node in Chatflow | Build in Dify |
| Risk Agent | Agent Node in Chatflow | Build in Dify |
| Governance Agent | Agent Node in Chatflow | Build in Dify |
| NPA Full Pipeline | Standalone Workflow (optional) | Build in Dify |
| Human-in-the-Loop | Via Chatflow multi-turn conversation | Built into design |
| Audit Trail | Every agent calls audit_log_action | Built into design |
| Angular Integration | Replace mock DifyService | Update frontend |

**Total Dify apps to create: 1 Chatflow + 1 optional Workflow**
**System prompts provided: 7 (1 classifier + 5 specialists + 1 formatter)**
**Human checkpoints: 7 decision points across the NPA lifecycle**
