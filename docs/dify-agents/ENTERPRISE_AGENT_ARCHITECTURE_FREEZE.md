# Enterprise Dify Agent Architecture (Frozen)
## NPA Multi-Agent Workbench — Phase 0 (Dify Cloud + Railway Tools) + Angular Frontend

**Status:** Frozen for Phase 0 build-out  
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

## 3) Logical Agents vs Dify Apps (Frozen Mapping)

We keep the **13 logical agent identities** stable for UI/analytics (see `src/app/lib/agent-interfaces.ts` and `server/config/dify-agents.js`), but we deploy a smaller set of **Dify apps** for Phase 0 execution.

### Logical agent IDs (frontend/back-end registry)
- Tier 1: `MASTER_COO`
- Tier 2: `NPA_ORCHESTRATOR`
- Tier 3: `IDEATION`, `CLASSIFIER`, `AUTOFILL`, `ML_PREDICT`, `RISK`, `GOVERNANCE`, `DILIGENCE`, `DOC_LIFECYCLE`, `MONITORING`
- Tier 4: `KB_SEARCH`, `NOTIFICATION`

### Dify Apps to create (Phase 0)

| Dify App | Type | Primary purpose | Logical agents mapped |
|---|---|---|---|
| `CF_NPA_Orchestrator` | Chatflow | Multi-turn routing + orchestrated execution | `MASTER_COO`, `NPA_ORCHESTRATOR` |
| `WF_NPA_Ideation_CreateProject` | Workflow | Create project + prohibited/similar | `IDEATION` |
| `WF_NPA_Classify_Predict` | Workflow | Intake + classification + routing rules + prediction writeback | `CLASSIFIER`, `ML_PREDICT` |
| `WF_NPA_Autofill` | Workflow | Template fields + lineage | `AUTOFILL` |
| `WF_NPA_Risk` | Workflow | Risk assessment + prerequisites | `RISK` |
| `WF_NPA_Governance_Ops` | Workflow | Signoffs + docs + stage advance + monitoring ops | `GOVERNANCE`, `DOC_LIFECYCLE`, `MONITORING`, `NOTIFICATION` (write) |
| `CF_NPA_Query_Assistant` | Chatflow | Read-only Q&A + citations + status/audit | `DILIGENCE`, `KB_SEARCH`, `NOTIFICATION` (read) |

---

## 4) Tooling Layer (Frozen)

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

## 5) Knowledge Bases (Frozen Minimum)

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
  "agent_action": "ROUTE_DOMAIN|ASK_CLARIFICATION|SHOW_CLASSIFICATION|SHOW_RISK|SHOW_PREDICTION|SHOW_AUTOFILL|SHOW_GOVERNANCE|SHOW_DOC_STATUS|SHOW_MONITORING|HARD_STOP",
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

## 7) Orchestrator Orchestration Pattern (Frozen)

`CF_NPA_Orchestrator` must:

1. Maintain conversation state in variables:
   - `current_project_id`, `current_stage`, `user_role`, `session_id`
2. Create an agent session for traceability:
   - `session_create` once per new conversation (Phase 0)
3. Classify intent deterministically (JSON-only output).
4. For `create_npa`, orchestrate a pipeline:
   - Call `WF_NPA_Ideation_CreateProject`
   - Set `current_project_id`
   - Call `WF_NPA_Classify_Predict`
   - Compose an Angular-friendly response + envelope
5. Log routing:
   - `log_routing_decision` for each specialist call

### Calling workflows from Orchestrator (inside Dify)
Orchestrator calls specialist workflows via Dify API using an `HTTP Request` node:
- `POST https://api.dify.ai/v1/workflows/run`
- `Authorization: Bearer <WORKFLOW_APP_KEY>`
- Body shape:
```json
{ "inputs": { ... }, "response_mode": "blocking", "user": "<stable-user-id>" }
```

---

## 8) Express + Angular Wiring (Frozen)

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

## 9) Environment Configuration (Cloud)

Backend (Express) must be configured with:
- `DIFY_BASE_URL=https://api.dify.ai/v1`
- `DIFY_KEY_MASTER_COO=<CF_NPA_Orchestrator key>`
- Workflow keys mapped to their logical agents in `server/.env` and `server/config/dify-agents.js`

Tools provider in Dify points to Railway:
- `https://mcp-tools-server-production.up.railway.app/openapi.json`

---

## 10) What Changes for Self-Hosted Later (Not Phase 0)

Self-hosted Dify (OpenShift) swaps:
- Dify base URL: `https://<company-dify>/v1`
- Tools base URL: `https://<openshift-route>/openapi.json`

No changes to:
- Logical agent IDs
- Output contracts
- Angular integration patterns

