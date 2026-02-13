# COO Multi-Agent Workbench — Full Project Transfer Summary

> **Use this file to resume work in a new Claude Code session.** Paste its contents as the first message.

## Project

**Name:** `agent-command-hub-angular`
**Stack:** Angular 20 + Express.js + Python FastMCP + MariaDB 10.6 + Dify 1.12.1
**Purpose:** COO Multi-Agent Workbench with 15 agents across 4 tiers for NPA (New Product Approval) processing

---

## Architecture — 15 Agents, 4 Tiers

| Tier | Agent | Role |
|------|-------|------|
| **T1** | Master COO | Routes user intent to domain agents |
| **T2** | NPA Orchestrator | Orchestrates NPA workflow |
| **T3** | Product Ideation | New product concept development |
| **T3** | Classification Router | NTG/Variation/Existing classification |
| **T3** | Template Auto-Fill | 47-field RAG-based auto-fill |
| **T3** | ML Prediction | Approval likelihood & timeline |
| **T3** | Risk Assessment | 4-layer risk cascade |
| **T3** | Governance Engine | Sign-off routing & SLA |
| **T3** | Conversational Diligence | KB-powered Q&A |
| **T3** | Document Lifecycle | Doc validation & completeness |
| **T3** | Post-Launch Monitoring | Performance & breach detection |
| **T4** | KB Search | Knowledge base retrieval |
| **T4** | Notification Hub | Multi-channel alerts |
| **T4** | Session Manager | Agent session tracking |
| **T4** | Audit Logger | Full audit trail |

---

## Live Deployments

### MCP Tools Server (Railway)

- **Base URL:** `https://mcp-tools-server-production.up.railway.app`
- **Health:** `/health` — 71 tools, 15 categories
- **REST API:** `/tools/{tool_name}` (POST) + `/openapi.json`
- **MCP SSE:** `/mcp/sse` (Dify native MCP connection — tested & working)
- **Railway Dashboard:** `https://railway.com/project/f9a1e7d9-fb38-4b37-9d7f-64ec4c6177e2`

### Railway MySQL

- **Public:** `mysql://root:ayedQvKIGeFVzeatmXhfKngbCwMdmeet@mainline.proxy.rlwy.net:19072/railway`
- **Internal:** `mysql.railway.internal:3306` (used by MCP server)
- **42 tables** with seed data (12 NPAs, 20 KB documents, 9 prohibited items, 28 classification criteria, etc.)

### Dify (Self-hosted)

- **URL:** `http://localhost` (Docker, port 80)
- **MCP Tool connected:** All 71 tools discovered via SSE at `/mcp/sse`
- **Agent API keys:** All 13 `DIFY_KEY_*` vars in `server/.env` are empty — no Chatflow apps created yet

### Local Services (development)

- Angular Frontend: `ng serve` (port 4200)
- Express API: port 3000
- MCP Python Server: port 3002 (REST + MCP SSE unified)
- MariaDB: port 3306 (Docker)
- PhpMyAdmin: port 8081

---

## Codebase Structure

```
agent-command-hub-angular/
├── src/app/
│   ├── pages/                    # 4 pages
│   │   ├── command-center/       # Master COO global chat (LANDING + CHAT modes)
│   │   ├── npa-agent/            # NPA workspace (DASHBOARD/IDEATION/WORK_ITEM views)
│   │   ├── approval-dashboard/   # Inbox/Drafts/Watchlist
│   │   └── coo-npa/              # COO NPA Control Tower
│   ├── components/               # 30 components (dashboard, agent-results, chat, layout)
│   ├── services/                 # 5 services (dify, layout, user, governance, dify-agent)
│   └── lib/                      # Interfaces (agent-interfaces.ts, npa-interfaces.ts, mocks)
├── server/
│   ├── mcp-python/               # Python MCP Tools Server
│   │   ├── tools/                # 18 modules, 71 tools, 3,619 lines
│   │   ├── main.py               # FastMCP SSE server
│   │   ├── rest_server.py        # FastAPI + mounted MCP SSE at /mcp
│   │   ├── start.py              # Unified launcher
│   │   ├── db.py                 # aiomysql pool with SSL support
│   │   ├── registry.py           # Self-registering tool registry
│   │   ├── Dockerfile            # Python 3.12, single port 3002
│   │   ├── railway.toml          # Railway deploy config
│   │   └── db_dump.sql           # 42 tables full export
│   ├── routes/                   # 14 Express route files
│   ├── config/dify-agents.js     # 13 agent Dify key mappings
│   └── .env                      # DB + Dify keys (keys empty)
├── database/
│   └── npa_workbench_full_export.sql  # Authoritative 42-table dump
└── docker-compose.yml            # MariaDB + PhpMyAdmin
```

---

## 71 MCP Tools by Category

| Category | Count | Key Tools |
|----------|-------|-----------|
| **ideation** | 7 | `ideation_create_npa`, `ideation_find_similar`, `ideation_get_prohibited_list`, `get_prospects` |
| **classification** | 5 | `classify_assess_domains`, `classify_score_npa`, `classify_determine_track`, `classify_get_criteria` |
| **governance** | 11 | `governance_get_signoffs`, `governance_create_signoff_matrix`, `governance_advance_stage`, `check_sla_status` |
| **risk** | 8 | `risk_run_assessment`, `risk_get_market_factors`, `validate_prerequisites`, `save_risk_check_result` |
| **documents** | 4 | `check_document_completeness`, `get_document_requirements`, `validate_document` |
| **monitoring** | 6 | `check_breach_thresholds`, `create_breach_alert`, `get_post_launch_conditions` |
| **workflow** | 5 | `get_workflow_state`, `advance_workflow_state`, `log_routing_decision`, `get_user_profile` |
| **audit** | 4 | `audit_log_action`, `audit_get_trail`, `check_audit_completeness` |
| **autofill** | 5 | `autofill_get_template_fields`, `autofill_populate_batch`, `autofill_get_form_data` |
| **npa_data** | 4 | `get_npa_by_id`, `list_npas`, `update_npa_project` |
| **kb_search** | 3 | `search_kb_documents`, `list_kb_sources` |
| **session** | 2 | `session_create`, `session_log_message` |
| **jurisdiction** | 3 | `get_jurisdiction_rules`, `adapt_classification_weights` |
| **notifications** | 3 | `send_notification`, `get_pending_notifications` |
| **dashboard** | 1 | `get_dashboard_kpis` |

---

## Key Implementation Details

1. **Command Center** (`command-center.component.ts`) — Dual-mode: LANDING (3 cards + chat input + quick hints) -> CHAT (full-screen, sidebar collapses). Master COO detects domain (NPA/Risk/KB/Ops/Desk) via keyword matching, emits `ROUTE_DOMAIN` action.

2. **DifyService** (`dify.service.ts`) — `useMockDify = true`. Mock logic has domain-aware routing: Step 0 (detect domain) -> Step 1 (classification) -> Step 2 (cross-border/finalize). Switch to `false` when Dify agents are created.

3. **MCP Server Architecture** — Single port 3002 serves both REST (`/tools/*`, `/openapi.json`, `/health`) and MCP SSE (`/mcp/sse`, `/mcp/messages`). `mcp_server.sse_app()` mounted on FastAPI via `app.mount("/mcp", ...)`.

4. **DB Connection** — `db.py` uses `aiomysql` with SSL context for Railway (production), plain for local. Pool reset pattern in `start.py` to avoid stale event loop references.

5. **AgentAction types:** `'ROUTE_DOMAIN' | 'SHOW_CLASSIFICATION' | 'HARD_STOP' | 'SHOW_PREDICTION' | 'FINALIZE_DRAFT' | 'SHOW_RISK_REPORT' | 'SHOW_GOVERNANCE' | 'ROUTE_WORK_ITEM'`

---

## Angular Components (30 Total)

### Page Components (4)

| Component | Selector | Purpose |
|-----------|----------|---------|
| `command-center.component.ts` | `app-command-center` | Main dashboard + Master COO global chat |
| `npa-agent.component.ts` | `app-npa-agent` | NPA workspace (DASHBOARD/IDEATION/WORK_ITEM) |
| `approval-dashboard.component.ts` | `app-approval-dashboard` | Inbox/Drafts/Watchlist |
| `coo-npa-dashboard.component.ts` | `app-coo-npa-dashboard` | COO NPA Control Tower |

### Agent Result Components (8)

| Component | Purpose |
|-----------|---------|
| `classification-result` | NTG/Variation/Existing display |
| `risk-assessment-result` | 4-layer risk cascade |
| `ml-prediction-result` | Approval likelihood & timeline |
| `autofill-summary` | 47-field template coverage |
| `governance-status` | Sign-off routing & SLA |
| `doc-completeness` | Document validation |
| `diligence-panel` | Q&A with KB citations |
| `monitoring-alerts` | Post-launch breaches |

### Dashboard Components (7)

`npa-dashboard`, `npa-pipeline-table`, `npa-process-tracker`, `agent-health-panel`, `capability-card`, `sub-agent-card`, `work-item-list`

### KPI/Dashboard Cards (5)

`kpi-card`, `audit-preview-panel`, `dependency-panel`, `exceptions-panel`, `live-agent-panel`

### Chat & Other (6)

`chat-interface`, `orchestrator-chat`, `document-dependency-matrix`, `npa-workflow-visualizer`, `audit-log`, `stage-progress`

---

## Database — 42 Tables

### Core Tables
`npa_projects`, `npa_form_data`, `npa_signoffs`, `npa_approvals`, `npa_workflow_states`, `npa_documents`, `npa_classification_assessments`, `npa_classification_scorecards`, `npa_risk_checks`, `npa_intake_assessments`, `npa_post_launch_conditions`, `npa_market_clusters`, `npa_monitoring_thresholds`, `npa_performance_metrics`, `npa_breach_alerts`, `npa_escalations`, `npa_loop_backs`, `npa_comments`, `npa_external_parties`, `npa_market_risk_factors`, `npa_prerequisite_results`, `npa_agent_routing_decisions`, `npa_kpi_snapshots`, `npa_prospects`

### Reference Tables
`ref_npa_templates`, `ref_npa_fields`, `ref_npa_sections`, `ref_document_requirements`, `ref_document_rules`, `ref_classification_criteria`, `ref_prerequisite_categories`, `ref_prerequisite_checks`, `ref_prohibited_items`, `ref_signoff_routing_rules`, `ref_escalation_rules`, `ref_field_options`

### Agent & System Tables
`agent_sessions`, `agent_messages`, `kb_documents`, `users`, `npa_audit_log`

---

## Routes (app.routes.ts)

```
/                           -> Command Center (default)
/agents/npa                 -> NPA Agent
/agents/npa/readiness       -> NPA Readiness
/agents/npa/classification  -> NPA Classification
/workspace/inbox            -> Approval Dashboard (INBOX)
/workspace/drafts           -> Approval Dashboard (DRAFTS)
/workspace/watchlist        -> Approval Dashboard (WATCHLIST)
/functions/npa              -> COO NPA Dashboard
/functions/desk-support     -> Placeholder
/functions/dce              -> Placeholder
/functions/orm              -> Placeholder
/functions/strategic-pm     -> Placeholder
/functions/business-lead    -> Placeholder
/functions/business-analysis -> Placeholder
/knowledge/base             -> Placeholder
/reporting/dashboards       -> Placeholder
/admin/workflows            -> Placeholder
```

---

## Git State

- **Main branch:** `main` at `776ebd1`
- **13 total commits**, working tree clean
- **Remote:** GitHub with `main` and `gh-pages` branches

---

## What's Done

- Full Angular 20 frontend with 30 components, 4 pages, routing
- Python MCP server with 71 tools across 15 categories
- Railway deployment (MCP server + MySQL, 42 tables)
- Dify connected to MCP tools via SSE (`/mcp/sse`)
- Command Center with Master COO global chat (LANDING -> CHAT mode)
- Express.js backend with 14 route files
- Docker setup for local MariaDB

## What's Pending

- **Create Dify Chatflow apps** — Start with NPA Ideation Agent, assign MCP tools, get API keys
- **Populate `DIFY_KEY_*` env vars** — Wire Dify agent keys into Express proxy
- **Switch `useMockDify` to `false`** — Connect Angular to real Dify agents
- **Build remaining Dify agents** — All 13 agents (currently 0 created in Dify)
- **End-to-end test** — User types in Command Center -> Master COO routes -> Domain agent responds with real data
- **Commit & push** — Claude worktree changes not yet merged to main
