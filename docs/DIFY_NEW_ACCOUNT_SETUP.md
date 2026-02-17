# Dify New Account Setup Guide
## Creating WF_NPA_Governance_Ops (Workflow) & CF_NPA_Query_Assistant (Chatflow)

**Account:** New Dify Cloud free account
**Purpose:** Build the 2 remaining Dify apps that power 6 logical agents
**Prerequisites:** Anthropic API key already configured in the new account

---

## Overview: What We're Building

| # | Dify App | Type | Logical Agents | Priority |
|---|----------|------|----------------|----------|
| 1 | `WF_NPA_Governance_Ops` | **Workflow** | GOVERNANCE, DOC_LIFECYCLE, MONITORING, NOTIFICATION | High |
| 2 | `CF_NPA_Query_Assistant` | **Chatflow** | DILIGENCE, KB_SEARCH | High |

These 2 apps serve 6 of our 13 logical agents. Once created, drop the API keys into `server/.env` as `DIFY_KEY_GOVERNANCE` and `DIFY_KEY_DILIGENCE`.

---

## STEP 1: Import MCP Tools (Custom Tool Provider)

This gives all your Dify apps access to our 71 Railway-hosted database tools.

### 1.1 Navigate to Custom Tools
1. Go to **Dify Dashboard** → **Tools** (left sidebar, wrench icon)
2. Click **"Custom"** tab at the top
3. Click **"+ Create Custom Tool"**

### 1.2 Import via OpenAPI Schema
1. Click **"Import from URL"**
2. Enter URL:
   ```
   https://mcp-tools-server-production.up.railway.app/openapi.json
   ```
3. Click **"Import"** — Dify will discover all 71 tools across 15 categories
4. **Name:** `NPA MCP Tools`
5. **Authentication:** Select **"None"** (Phase 0 — no auth required)
6. Click **"Save"**

### 1.3 Verify Import
After import, you should see 71 tools organized by these categories:
- `session` (2 tools)
- `ideation` (5 tools)
- `classification` (5 tools)
- `autofill` (5 tools)
- `risk` (4 tools)
- `governance` (5 tools)
- `audit` (4 tools)
- `npa_data` (4 tools)
- `workflow` (5 tools)
- `monitoring` (6 tools)
- `documents` (4 tools)
- `governance_ext` (6 tools — signoff routing, SLA, escalation)
- `risk_ext` (4 tools)
- `kb_search` (3 tools)
- `notifications` (3 tools)
- `jurisdiction` (3 tools)
- `dashboard` (1 tool)
- `prospects` (2 tools)

> **Important:** All tools use `POST /tools/{tool_name}` with JSON body. They return `{ success, data, error }`.

---

## STEP 2: Create Knowledge Bases

We need 2 Knowledge Bases for the Chatflow agent (`CF_NPA_Query_Assistant`). The Workflow agent (`WF_NPA_Governance_Ops`) does NOT need KBs — it uses tools for structured data.

### 2.1 Create KB: `KB_NPA_CORE`

This KB contains NPA policies, classification rules, approval matrix, and state machine.

1. Go to **Knowledge** (left sidebar, book icon)
2. Click **"+ Create Knowledge"**
3. Name: `KB_NPA_CORE`
4. Description: `Core NPA policies, classification rules, approval matrix, workflow state machine`
5. Upload these files from your repo:

| File (repo path) | Content |
|-------------------|---------|
| `docs/knowledge-base/KB_NPA_Policies.md` | NPA policies, prohibited products, approval thresholds |
| `docs/knowledge-base/KB_NPA_Classification_Rules.md` | 28 classification criteria, scoring methodology |
| `docs/knowledge-base/KB_NPA_Approval_Matrix.md` | Sign-off routing rules by track |
| `docs/knowledge-base/KB_NPA_State_Machine.md` | Workflow stages, transitions, gate conditions |
| `docs/knowledge-base/KB_NPA_Templates.md` | 47-field template structure |

6. **Indexing Settings:**
   - Chunk size: **800 tokens**
   - Chunk overlap: **100 tokens**
   - Indexing mode: **High Quality** (uses embedding model)
   - Retrieval mode: **Hybrid Search** (keyword + semantic)
7. Click **"Save & Process"** — wait for indexing to complete

### 2.2 Create KB: `KB_NPA_AGENT_KBS`

This KB contains agent-specific operating guides and domain expertise.

1. Click **"+ Create Knowledge"**
2. Name: `KB_NPA_AGENT_KBS`
3. Description: `Agent operating guides — system prompt context and domain expertise for all 13 agents`
4. Upload these files from `Context/Dify_Agent_KBs/`:

| File | Agent |
|------|-------|
| `KB_Master_COO_Orchestrator.md` | Orchestrator routing logic |
| `KB_Domain_Orchestrator_NPA.md` | NPA domain orchestration |
| `KB_Ideation_Agent.md` | Ideation discovery patterns |
| `KB_Classification_Agent.md` | Classification criteria interpretation |
| `KB_Template_Autofill_Agent.md` | Autofill lineage rules |
| `KB_ML_Prediction.md` | Prediction feature engineering |
| `KB_Risk_Agent.md` | 4-layer risk cascade logic |
| `KB_Governance_Agent.md` | Sign-off routing decisions |
| `KB_Conversational_Diligence.md` | Q&A with citations |
| `KB_Doc_Lifecycle.md` | Document validation rules |
| `KB_Monitoring_Agent.md` | Post-launch monitoring logic |
| `KB_Search_Agent.md` | KB search strategies |
| `KB_Notification_Agent.md` | Notification routing |

5. **Indexing Settings:** Same as KB_NPA_CORE (800 tokens, hybrid search)
6. Click **"Save & Process"**

---

## STEP 3: Create WF_NPA_Governance_Ops (Workflow)

This is a **Workflow** app — it takes structured inputs and returns structured outputs. No conversation memory needed.

### 3.1 Create the App
1. Go to **Studio** (left sidebar)
2. Click **"+ Create App"** → Select **"Workflow"**
3. Name: `WF_NPA_Governance_Ops`
4. Description: `Deterministic governance operations: signoffs, documents, stage advance, monitoring, notifications`

### 3.2 Define Input Variables
In the **Start** node, add these input variables:

| Variable | Type | Required | Description |
|----------|------|----------|-------------|
| `project_id` | String | Yes | NPA project ID (e.g., "NPA-2026-003") |
| `action` | String | Yes | One of: `create_signoff_matrix`, `check_signoffs`, `record_decision`, `advance_stage`, `check_documents`, `check_sla`, `create_escalation`, `check_monitoring`, `send_notification` |
| `user_role` | String | No | User role: MAKER/CHECKER/APPROVER/COO |
| `action_params` | String | No | JSON string with action-specific parameters |

### 3.3 Build the Workflow

#### Node 1: Start → LLM Node (Action Router)

**LLM Node Name:** `governance_router`
**Model:** Claude 3.5 Sonnet (or Claude 3 Haiku for speed)

**System Prompt:**
```
You are the Governance Operations Agent for the NPA Multi-Agent Workbench.

Your role: Execute governance operations deterministically based on the action requested.

## Available Actions

1. **create_signoff_matrix** — Generate sign-off requests for departments based on project classification and approval track
2. **check_signoffs** — Get current sign-off status for all departments
3. **record_decision** — Record an approve/reject/loop-back decision
4. **advance_stage** — Move project to next workflow stage
5. **check_documents** — Verify document completeness for current stage
6. **check_sla** — Check SLA compliance for pending sign-offs
7. **create_escalation** — Trigger escalation when SLA breached or circuit breaker hit
8. **check_monitoring** — Check post-launch monitoring thresholds and breaches
9. **send_notification** — Send notification to stakeholders

## Execution Rules

1. ALWAYS call `get_npa_by_id` first to load project context
2. Based on the `action`, call the appropriate MCP tools
3. Return structured JSON output (NO conversational text)
4. Log every action via `audit_log_action`
5. If action fails, return error with retry_allowed=true

## Output Format (MANDATORY)

Return ONLY valid JSON in this exact format:
{
  "agent_action": "<SHOW_GOVERNANCE|SHOW_DOC_STATUS|SHOW_MONITORING|SHOW_ERROR>",
  "agent_id": "<GOVERNANCE|DOC_LIFECYCLE|MONITORING|NOTIFICATION>",
  "payload": {
    "projectId": "<project_id>",
    "data": { ... action-specific result data ... }
  },
  "trace": {
    "project_id": "<project_id>",
    "action": "<action>",
    "tools_called": ["tool1", "tool2"]
  }
}
```

**User Prompt:**
```
Project: {{#start.project_id#}}
Action: {{#start.action#}}
User Role: {{#start.user_role#}}
Parameters: {{#start.action_params#}}

Execute the requested governance action and return structured JSON output.
```

#### Tools to Enable on this LLM Node
From your imported "NPA MCP Tools", enable these 18 tools:

**Governance Core (5):**
- `governance_create_signoff_matrix`
- `governance_get_signoffs`
- `governance_record_decision`
- `governance_check_loopbacks`
- `governance_advance_stage`

**Governance Extension (6):**
- `get_signoff_routing_rules`
- `check_sla_status`
- `create_escalation`
- `get_escalation_rules`
- `save_approval_decision`
- `add_comment`

**Document Lifecycle (4):**
- `check_document_completeness`
- `get_document_requirements`
- `upload_document_metadata`
- `validate_document`

**Monitoring (6):**
- `get_performance_metrics`
- `check_breach_thresholds`
- `create_breach_alert`
- `get_monitoring_thresholds`
- `get_post_launch_conditions`
- `update_condition_status`

**Shared (3):**
- `get_npa_by_id` (load project context)
- `audit_log_action` (audit trail)
- `send_notification` (stakeholder alerts)

**Total: 24 tools** (covers GOVERNANCE + DOC_LIFECYCLE + MONITORING + NOTIFICATION agents)

#### Node 2: LLM Node → End

**End Node Output Variables:**

| Variable | Type | Source |
|----------|------|--------|
| `agent_action` | String | Extract from LLM JSON output |
| `agent_id` | String | Extract from LLM JSON output |
| `payload` | String | Extract from LLM JSON output (the payload object as string) |
| `trace` | String | Extract from LLM JSON output (the trace object as string) |

> **Tip:** Use a **Code** node between the LLM and End to parse the JSON and extract these fields reliably.

#### Optional: Add Code Node for JSON Parsing

Between the LLM node and End node, add a **Code** node:

**Name:** `parse_output`
**Language:** Python
**Code:**
```python
import json

def main(llm_output: str) -> dict:
    try:
        # Try to parse JSON from the LLM output
        # Handle case where LLM wraps in markdown code fence
        text = llm_output.strip()
        if text.startswith('```'):
            text = text.split('\n', 1)[1]
            text = text.rsplit('```', 1)[0]

        result = json.loads(text)
        return {
            "agent_action": result.get("agent_action", "SHOW_ERROR"),
            "agent_id": result.get("agent_id", "GOVERNANCE"),
            "payload": json.dumps(result.get("payload", {})),
            "trace": json.dumps(result.get("trace", {}))
        }
    except Exception as e:
        return {
            "agent_action": "SHOW_ERROR",
            "agent_id": "GOVERNANCE",
            "payload": json.dumps({
                "error_type": "PARSE_ERROR",
                "message": str(e),
                "retry_allowed": True
            }),
            "trace": json.dumps({"error": str(e)})
        }
```

### 3.4 Publish & Get API Key
1. Click **"Publish"** (top right)
2. Go to **"API Access"** (left sidebar or monitoring section)
3. Copy the **API Key** — this is your `DIFY_KEY_GOVERNANCE`

---

## STEP 4: Create CF_NPA_Query_Assistant (Chatflow)

This is a **Chatflow** — conversational, multi-turn Q&A with knowledge base retrieval.

### 4.1 Create the App
1. Go to **Studio** → **"+ Create App"** → Select **"Chatflow"**
2. Name: `CF_NPA_Query_Assistant`
3. Description: `Read-only Q&A agent for NPA status, policies, approvals, documents, and portfolio queries`

### 4.2 Configure the Chatflow

#### Start Node → Knowledge Retrieval → LLM → Answer

**Knowledge Retrieval Node:**
1. Add node: **Knowledge Retrieval**
2. Attach both KBs:
   - `KB_NPA_CORE`
   - `KB_NPA_AGENT_KBS`
3. **Retrieval Settings:**
   - Top-K: **8**
   - Score Threshold: **0.5**
   - Retrieval Mode: **Hybrid Search**
4. **Query Variable:** `{{#sys.query#}}` (user's question)

#### LLM Node Configuration

**Model:** Claude 3.5 Sonnet
**Context:** Connect the Knowledge Retrieval node output as context

**System Prompt:**
```
You are the NPA Query Assistant — a read-only conversational agent for the NPA Multi-Agent Workbench.

## Your Role
Answer questions about NPA status, policies, signoffs, documents, risks, and portfolio metrics. You are the primary interface for 70-80% of daily enterprise interactions (reads, not writes).

## What You CAN Do
- Answer questions about NPA project status, stages, and blockers
- Explain policies, classification rules, and approval requirements
- Show signoff status and identify who hasn't signed off
- Check SLA compliance and breaches
- Show audit trails and compliance reports
- Analyze document completeness
- Provide portfolio-level KPIs and metrics
- Search knowledge base for regulatory and policy context
- Compare NPAs side by side

## What You CANNOT Do (CRITICAL)
- Create, modify, or delete any NPA data
- Record decisions or advance stages
- Upload documents or send notifications
- Make any write operations whatsoever

## How to Work

1. **Classify the question type:**
   - STATUS: "What's the status of NPA X?" → call `get_npa_by_id` + `get_workflow_state`
   - SIGNOFF: "Who hasn't signed off?" → call `governance_get_signoffs`
   - SLA: "Any SLA breaches?" → call `check_sla_status`
   - DOCUMENTS: "What documents are missing?" → call `check_document_completeness`
   - AUDIT: "Show audit trail" → call `audit_get_trail`
   - PORTFOLIO: "Pipeline overview" → call `get_dashboard_kpis` or `list_npas`
   - POLICY: "What's the policy on X?" → use KB context (already retrieved)
   - MONITORING: "Any post-launch issues?" → call `check_breach_thresholds`
   - COMPARISON: "Compare NPA-001 and NPA-003" → call `get_npa_by_id` twice

2. **Use KB context for policy/regulatory questions** — cite specific sources
3. **Use MCP tools for data questions** — call the appropriate tool
4. **Combine both for hybrid questions** — data from tools + explanation from KB

## Response Format

For every response, end with:

@@NPA_META@@{
  "agent_action": "<appropriate action>",
  "agent_id": "<DILIGENCE or KB_SEARCH>",
  "payload": {
    "projectId": "<if applicable>",
    "data": { ... structured result ... }
  },
  "trace": {
    "tools_called": ["tool1", "tool2"],
    "kb_sources": ["source1", "source2"]
  }
}

## agent_action Mapping

| Question Type | agent_action |
|--------------|-------------|
| NPA status/details | SHOW_RAW_RESPONSE |
| Signoff status | SHOW_GOVERNANCE |
| Document completeness | SHOW_DOC_STATUS |
| Risk/monitoring | SHOW_MONITORING |
| KB/policy search | SHOW_KB_RESULTS |
| Portfolio KPIs | SHOW_RAW_RESPONSE |
| Error/not found | SHOW_ERROR |

## Citation Rules
- When citing KB documents, include the source document name
- When citing tool data, include the tool name
- Format: 📌 Source: [document/tool name]

## Important
- NEVER make up data — if a tool returns no results, say so
- NEVER modify anything — you are strictly read-only
- For cross-domain queries (e.g., "which NPAs have SLA breaches AND missing docs"), call multiple tools and synthesize
- Handle "I don't know" gracefully when data is missing
```

#### Tools to Enable (17 read-only tools)

**NPA Data (3):**
- `get_npa_by_id`
- `list_npas`
- `get_workflow_state`

**Governance Read (3):**
- `governance_get_signoffs`
- `check_sla_status`
- `governance_check_loopbacks`

**Audit (3):**
- `audit_get_trail`
- `check_audit_completeness`
- `generate_audit_report`

**Documents (2):**
- `check_document_completeness`
- `get_document_requirements`

**Monitoring (3):**
- `check_breach_thresholds`
- `get_post_launch_conditions`
- `get_performance_metrics`

**KB & Dashboard (2):**
- `search_kb_documents`
- `get_dashboard_kpis`

**Notification Read (1):**
- `get_pending_notifications`

**Total: 17 read-only tools**

### 4.3 Conversation Variables

Add these conversation variables in Chatflow settings:

| Variable | Type | Default | Purpose |
|----------|------|---------|---------|
| `current_project_id` | String | "" | Active NPA being discussed |
| `query_context` | String | "" | Running context for follow-up questions |

### 4.4 Publish & Get API Key
1. Click **"Publish"**
2. Go to **"API Access"**
3. Copy the **API Key** — this is your `DIFY_KEY_DILIGENCE`

---

## STEP 5: Update server/.env

Once you have both API keys, update the Express server configuration:

```env
# WF_NPA_Governance_Ops (Workflow) — GOVERNANCE, DOC_LIFECYCLE, MONITORING, NOTIFICATION
DIFY_KEY_GOVERNANCE=app-XXXXXXXXXXXXXXXXX

# CF_NPA_Query_Assistant (Chatflow) — DILIGENCE, KB_SEARCH
DIFY_KEY_DILIGENCE=app-XXXXXXXXXXXXXXXXX
```

Then restart the Express server:
```bash
cd server && node index.js
```

Verify all agents are configured:
```bash
curl http://localhost:3000/api/dify/agents/status
```

All 13 agents should show `configured: true`.

---

## STEP 6: Test the Integration

### Test 1: Governance Workflow
```bash
curl -X POST http://localhost:3000/api/dify/workflow \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "GOVERNANCE",
    "inputs": {
      "project_id": "NPA-2026-001",
      "action": "check_signoffs",
      "user_role": "COO"
    }
  }'
```

**Expected:** Returns `SHOW_GOVERNANCE` with signoff status data

### Test 2: Query Assistant Chat
```bash
curl -X POST http://localhost:3000/api/dify/chat \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "DILIGENCE",
    "query": "What is the status of NPA-2026-001?",
    "response_mode": "blocking"
  }'
```

**Expected:** Returns answer with `@@NPA_META@@` envelope containing project status

### Test 3: Document Lifecycle (via Governance workflow)
```bash
curl -X POST http://localhost:3000/api/dify/workflow \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "DOC_LIFECYCLE",
    "inputs": {
      "project_id": "NPA-2026-001",
      "action": "check_documents",
      "user_role": "MAKER"
    }
  }'
```

**Expected:** Returns `SHOW_DOC_STATUS` with document completeness data

---

## Quick Reference: Agent → App → Key Mapping

| Logical Agent | Dify App | ENV Key | Account |
|---------------|----------|---------|---------|
| MASTER_COO | CF_NPA_Orchestrator | `DIFY_KEY_MASTER_COO` | **Old account** |
| NPA_ORCHESTRATOR | CF_NPA_Orchestrator | `DIFY_KEY_MASTER_COO` | **Old account** |
| IDEATION | CF_NPA_Ideation | `DIFY_KEY_IDEATION` | **Old account** |
| CLASSIFIER | WF_NPA_Classify_Predict | `DIFY_KEY_CLASSIFIER` | **Old account** |
| ML_PREDICT | WF_NPA_Classify_Predict | `DIFY_KEY_CLASSIFIER` | **Old account** |
| AUTOFILL | WF_NPA_Autofill | `DIFY_KEY_AUTOFILL` | **Old account** |
| RISK | WF_NPA_Risk | `DIFY_KEY_RISK` | **Old account** |
| **GOVERNANCE** | WF_NPA_Governance_Ops | `DIFY_KEY_GOVERNANCE` | **New account** ✨ |
| **DOC_LIFECYCLE** | WF_NPA_Governance_Ops | `DIFY_KEY_GOVERNANCE` | **New account** ✨ |
| **MONITORING** | WF_NPA_Governance_Ops | `DIFY_KEY_GOVERNANCE` | **New account** ✨ |
| **DILIGENCE** | CF_NPA_Query_Assistant | `DIFY_KEY_DILIGENCE` | **New account** ✨ |
| **KB_SEARCH** | CF_NPA_Query_Assistant | `DIFY_KEY_DILIGENCE` | **New account** ✨ |
| **NOTIFICATION** | WF_NPA_Governance_Ops | `DIFY_KEY_GOVERNANCE` | **New account** ✨ |

---

## Files to Upload Summary

### For KB_NPA_CORE (5 files):
```
docs/knowledge-base/KB_NPA_Policies.md
docs/knowledge-base/KB_NPA_Classification_Rules.md
docs/knowledge-base/KB_NPA_Approval_Matrix.md
docs/knowledge-base/KB_NPA_State_Machine.md
docs/knowledge-base/KB_NPA_Templates.md
```

### For KB_NPA_AGENT_KBS (13 files):
```
Context/Dify_Agent_KBs/KB_Master_COO_Orchestrator.md
Context/Dify_Agent_KBs/KB_Domain_Orchestrator_NPA.md
Context/Dify_Agent_KBs/KB_Ideation_Agent.md
Context/Dify_Agent_KBs/KB_Classification_Agent.md
Context/Dify_Agent_KBs/KB_Template_Autofill_Agent.md
Context/Dify_Agent_KBs/KB_ML_Prediction.md
Context/Dify_Agent_KBs/KB_Risk_Agent.md
Context/Dify_Agent_KBs/KB_Governance_Agent.md
Context/Dify_Agent_KBs/KB_Conversational_Diligence.md
Context/Dify_Agent_KBs/KB_Doc_Lifecycle.md
Context/Dify_Agent_KBs/KB_Monitoring_Agent.md
Context/Dify_Agent_KBs/KB_Search_Agent.md
Context/Dify_Agent_KBs/KB_Notification_Agent.md
```
