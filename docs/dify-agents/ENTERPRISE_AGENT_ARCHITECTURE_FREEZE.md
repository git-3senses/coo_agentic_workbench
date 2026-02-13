# Enterprise Dify Agent Architecture (Phase 0 Target)
## NPA Multi-Agent Workbench — Dify Cloud + Railway Tools + Angular Frontend

**Status:** Phase 0 target (validate before freeze)  
**Last updated:** 2026-02-13  
**Primary UI:** Angular (not Dify WebApp)  
**Agent host/orchestrator:** Dify Cloud (`https://cloud.dify.ai`)  
**Tools (data layer):** Railway MCP Tools Server (OpenAPI, 71 tools)

This document is the **single source of truth** for how we will build and wire Dify apps for the NPA workbench in an enterprise-grade manner. It intentionally prioritizes determinism, auditability, least privilege, and frontend contracts.

---

## 1) Non-Negotiable Principles

1. **Angular is the product UI.** Dify WebApp is not used by end users.
2. **Deterministic contracts.** Every Dify app returns a machine-readable output that Angular can render into cards/panels.
3. **Least privilege.** Orchestrator is a router + orchestrator; specialists do specialist work; tool access is minimized per app.
4. **Auditability by default.** All write actions log via `audit_log_action` and session/routing tools.
5. **Environment parity.** Cloud is the proving ground; self-hosted (OpenShift) must be a drop-in replacement with the same contracts.
6. **One major action per turn.** Create, classify, risk, autofill, governance are separate user-visible steps with a human checkpoint.

---

## 2) System Context (Cloud)

```mermaid
flowchart LR
  UI["Angular UI (Port 4200)"] -->|HTTP| API["Express API (Port 3000)"]
  API -->|POST /v1/chat-messages| DIFY["Dify Cloud"]
  API -->|POST /v1/workflows/run| DIFY

  DIFY -->|Custom Tools (OpenAPI)| TOOLS["Railway Tools Server (HTTPS)"]
  TOOLS -->|SQL| DB["MariaDB (npa_workbench)"]
```

Key URLs for Phase 0:
- Dify base API: `https://api.dify.ai/v1`
- Tools OpenAPI: `https://mcp-tools-server-production.up.railway.app/openapi.json`
- Tools list: `https://mcp-tools-server-production.up.railway.app/tools` (returns `"count": 71`)

Note:
- The Railway `.../mcp/sse` endpoint is **SSE transport**; Phase 0 uses the **OpenAPI tool provider** for maximum compatibility.

---

## 3) Logical Agents vs Dify Apps (Phase 0 Target Mapping)

We keep the **13 logical agent identities** stable for UI/analytics (see `src/app/lib/agent-interfaces.ts` and `server/config/dify-agents.js`), but we deploy a smaller set of **Dify apps** for Phase 0 execution.

### Logical agent IDs (frontend/back-end registry)
- Tier 1: `MASTER_COO`
- Tier 2: `NPA_ORCHESTRATOR`
- Tier 3: `IDEATION`, `CLASSIFIER`, `AUTOFILL`, `ML_PREDICT`, `RISK`, `GOVERNANCE`, `DILIGENCE`, `DOC_LIFECYCLE`, `MONITORING`
- Tier 4: `KB_SEARCH`, `NOTIFICATION`

### Dify Apps to create (Phase 0)

| Dify App | Type | Primary purpose | Logical agents mapped |
|---|---|---|---|
| `CF_NPA_Orchestrator` | Chatflow | Multi-turn routing + intent gating + orchestration | `MASTER_COO`, `NPA_ORCHESTRATOR` |
| `CF_NPA_Ideation` | Chatflow | Conversational discovery (clarify) + create NPA | `IDEATION` |
| `CF_NPA_Query_Assistant` | Chatflow | Read-only Q&A + citations + status/audit | `DILIGENCE`, `KB_SEARCH`, `NOTIFICATION` (read) |
| `WF_NPA_Classify_Predict` | Workflow | Intake + classification + routing rules + prediction writeback | `CLASSIFIER`, `ML_PREDICT` |
| `WF_NPA_Autofill` | Workflow | Template fields + lineage | `AUTOFILL` |
| `WF_NPA_Risk` | Workflow | Risk assessment + prerequisites | `RISK` |
| `WF_NPA_Governance_Ops` | Workflow | Signoffs + docs + stage advance + monitoring ops | `GOVERNANCE`, `DOC_LIFECYCLE`, `MONITORING`, `NOTIFICATION` (write) |

---

## 4) Tooling Layer (Phase 0 Target)

### Tool provider
- Dify `Custom Tools` provider imported from:
  - `https://mcp-tools-server-production.up.railway.app/openapi.json`
- The OpenAPI exposes **71 tools** as `POST /tools/<tool_name>`.

### Tool authentication (Phase 0)
- Use API-key auth at the tool-provider level (header-based).
- The auth mechanism is an implementation detail of the Railway server; Dify configuration must be consistent across all apps.

### Tool assignment policy
- Orchestrator tools: **read context + log routing** only.
- Specialists: the minimum set required for their responsibility.
- Every write-capable workflow must include `audit_log_action` and session logging where applicable.

---

## 5) Knowledge Bases (Phase 0 Target Minimum)

Even routing needs enterprise consistency (policy language, stage gate descriptions, clarifying questions).

Create these datasets in Dify Cloud:

1. `KB_NPA_CORE_CLOUD`
- Contents: NPA policies, approval matrix, classification rules, state machine, templates.
- Source in repo: `docs/knowledge-base/`

2. `KB_NPA_AGENT_KBS_CLOUD`
- Contents: agent operating guides/prompts as KB reference material.
- Source in repo: `Context/Dify_Agent_KBs/`

Attachment policy:
- `CF_NPA_Orchestrator`: `KB_NPA_CORE_CLOUD`
- Specialists: attach only if they need citations or template reasoning; otherwise prefer tools + structured rules.
- `CF_NPA_Query_Assistant`: attach both datasets.

---

## 6) Enterprise Output Contracts (Angular-First)

### Why we need a contract
Angular renders results as cards/panels using the types and actions defined in:
- `src/app/lib/agent-interfaces.ts` (`AgentAction`, `ClassificationResult`, `RiskAssessment`, etc.)

Dify APIs do not guarantee propagation of arbitrary application-defined metadata in all configurations. Therefore we freeze an **answer-envelope pattern** that is robust across deployments:

### Chatflow answer envelope (required)
Every chatflow response must include a final line:

```text
@@NPA_META@@{...valid json...}
```

Envelope schema:
```json
{
  "agent_action": "ROUTE_DOMAIN|ASK_CLARIFICATION|SHOW_CLASSIFICATION|SHOW_RISK|SHOW_PREDICTION|SHOW_AUTOFILL|SHOW_GOVERNANCE|SHOW_DOC_STATUS|SHOW_MONITORING|HARD_STOP|SHOW_RAW_RESPONSE|SHOW_ERROR",
  "agent_id": "MASTER_COO",
  "payload": {
    "projectId": "uuid-or-empty",
    "intent": "create_npa|classify_npa|autofill_npa|risk_assessment|governance|query_data",
    "target_agent": "IDEATION|CLASSIFIER|AUTOFILL|RISK|GOVERNANCE|QUERY_ASSISTANT",
    "uiRoute": "/agents/npa"
  },
  "trace": {
    "session_id": "uuid",
    "conversation_id": "dify-conversation-id"
  }
}
```

### Fallback contract (Express-enforced)
If Express cannot parse `@@NPA_META@@{json}` from a Dify answer, it must degrade gracefully and return:
```json
{
  "agent_action": "SHOW_RAW_RESPONSE",
  "agent_id": "UNKNOWN",
  "payload": { "raw_answer": "<full answer text>" },
  "trace": { "error": "META_PARSE_FAILED" }
}
```

For tool/workflow failures, Express must return:
```json
{
  "agent_action": "SHOW_ERROR",
  "agent_id": "UNKNOWN",
  "payload": {
    "error_type": "TOOL_FAILURE|WORKFLOW_TIMEOUT|LLM_ERROR",
    "message": "<human-safe error>",
    "retry_allowed": true
  }
}
```

### Workflow outputs contract (required)
Every workflow must return:
- `outputs.agent_action`
- `outputs.payload`
- `outputs.trace`

Example:
```json
{
  "agent_action": "SHOW_CLASSIFICATION",
  "payload": { "classification": { "type": "Variation", "track": "NPA Lite", "scores": [] } },
  "trace": { "project_id": "uuid", "workflow_run_id": "..." }
}
```

---

## 7) Orchestrator Orchestration Pattern (Phase 0 Target)

`CF_NPA_Orchestrator` must:

1. Maintain conversation state in variables:
   - `current_project_id`, `current_stage`, `user_role`, `session_id`
2. Create an agent session for traceability:
   - `session_create` once per new conversation (Phase 0)
3. Classify intent deterministically (JSON-only output).
4. Enforce **one major action per turn** with human checkpoints:
   - Turn A: create project (ideation) only
   - Turn B: classify/predict only
   - Turn C: risk only
   - Turn D: autofill only
   - Turn E: governance/docs/stage advance only
5. Orchestrate `create_npa` by delegating to `CF_NPA_Ideation`:
   - Maintain `ideation_conversation_id` as a conversation variable
   - Forward the user message to `CF_NPA_Ideation` until it returns a `projectId`
   - Set `current_project_id`
   - Ask for confirmation before running classification
6. Log routing:
   - `log_routing_decision` for each specialist call

### Calling workflows from Orchestrator (inside Dify)
Orchestrator calls specialist workflows via Dify API using an `HTTP Request` node:
- `POST https://api.dify.ai/v1/workflows/run`
- `Authorization: Bearer <WORKFLOW_APP_KEY>`
- Body shape:
```json
{ "inputs": { ... }, "response_mode": "blocking", "user": "<stable-user-id>" }
```

### Calling chatflows from Orchestrator (inside Dify)
Orchestrator calls conversational specialists (e.g., Ideation, Query Assistant) via an `HTTP Request` node:
- `POST https://api.dify.ai/v1/chat-messages`
- `Authorization: Bearer <CHATFLOW_APP_KEY>`
- Include and persist the callee `conversation_id` (e.g., `ideation_conversation_id`) to preserve memory across turns.

---

## 8) Context Switching (Enterprise Requirement)

Users switch projects mid-conversation. The Orchestrator must:
1. Detect explicit project references (ID or known name).
2. Resolve via tools:
   - If ID present: `get_npa_by_id`
   - If name present: `ideation_find_similar` then confirm selection if multiple matches
3. Update `current_project_id` and acknowledge the switch.
4. If ambiguous, ask a single clarification question and do not execute workflows.

---

## 9) Query Assistant (First-Class Read Path)

`CF_NPA_Query_Assistant` is expected to handle the majority of daily usage (read-heavy).

### Minimum tool allowlist
- `list_npas`, `get_npa_by_id`, `get_workflow_state`
- `governance_get_signoffs`, `check_sla_status`
- `audit_get_trail`
- `get_dashboard_kpis`
- `check_document_completeness`, `get_document_requirements`
- `check_breach_thresholds`, `get_post_launch_conditions`, `get_performance_metrics`
- `search_kb_documents`, `get_kb_document_by_id`
- `get_pending_notifications`, `mark_notification_read`

### Cross-domain query examples (must support)
- "Which NPAs are blocked or at risk?"
- "Who has not signed off on NPA X?"
- "Which documents are missing for NPA X?"
- "What is the policy position on crypto-linked products?"

---

## 10) Express + Angular Wiring (Phase 0 Target)

### Express proxy (server-side key storage)
Express must remain the only holder of Dify Service API keys:
- `server/routes/dify-proxy.js`
- `server/config/dify-agents.js`

### Angular integration modes
1. **Conversational orchestration (Pattern A):**
   - Angular calls `POST /api/dify/chat` with `agent_id=MASTER_COO` (Orchestrator)
2. **Direct workflow panel loads (Pattern B):**
   - Angular calls `POST /api/dify/workflow` with specific `agent_id` (e.g., `CLASSIFIER`)

### Contract enforcement in Express (required)
Express must parse `@@NPA_META@@{json}` from `answer` and translate it to the Angular `metadata` structure (matching `AgentAction`) before returning to the frontend.

---

## 11) Environment Configuration (Cloud)

Backend (Express) must be configured with:
- `DIFY_BASE_URL=https://api.dify.ai/v1`
- `DIFY_KEY_MASTER_COO=<CF_NPA_Orchestrator key>`
- Workflow keys mapped to their logical agents in `server/.env` and `server/config/dify-agents.js`

Tools provider in Dify points to Railway:
- `https://mcp-tools-server-production.up.railway.app/openapi.json`

---

## 12) What Changes for Self-Hosted Later (Not Phase 0)

Self-hosted Dify (OpenShift) swaps:
- Dify base URL: `https://<company-dify>/v1`
- Tools base URL: `https://<openshift-route>/openapi.json`

No changes to:
- Logical agent IDs
- Output contracts
- Angular integration patterns

---

## 13) Validation Gates and Freeze Criteria

We only declare this architecture "frozen" after these pass end-to-end (Angular -> Express -> Dify -> Tools -> DB -> back):
1. Orchestrator envelope contract works and Express fallback is proven.
2. Orchestrator -> Ideation chatflow delegation works across multiple turns (callee memory preserved).
3. Query Assistant answers at least 5 cross-domain read queries using tools and/or KB with stable envelopes.
