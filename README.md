# NPA Multi-Agent Workbench

AI-powered New Product Approval (NPA) platform for banking operations. 13 AI agents orchestrate the end-to-end product approval lifecycle — from ideation through classification, risk assessment, governance sign-off, and post-launch monitoring.

## Architecture

```
Angular Frontend (UI)  ──REST/WS──▶  Express API (Port 3000)  ──▶  Dify (Agent Engine)
                                                                        │
                                                                        ▼
                                                                   Claude API (LLM)
                                                                        │
                                                                        ▼
                                                              MCP Tools Server (Port 3002)
                                                                   71 tools │ Python
                                                                        │
                                                                        ▼
                                                                MariaDB (42 tables)
```

| Component | Tech | Port | Description |
|-----------|------|------|-------------|
| **Frontend** | Angular 21 + Tailwind | 4200 | COO dashboard, NPA forms, agent chat, approvals |
| **Express API** | Node.js + Express | 3000 | REST API for Angular + WebSocket for real-time chat |
| **MCP Tools Server** | Python 3.12 + FastAPI | 3002 | 71 database tools for AI agents (the data layer) |
| **Dify** | Docker | 80 | Agent orchestration engine — hosts the 13 AI agents |
| **Database** | MariaDB | 3306 | 42 tables — NPA lifecycle, reference data, audit trail |

## Quick Start

### Prerequisites
- Node.js 18+, Python 3.12+, Docker
- MariaDB with `npa_workbench` database

### 1. Database
```bash
cd database
mysql -u root -p -e "CREATE DATABASE npa_workbench"
mysql -u root -p npa_workbench < npa_workbench_full_export.sql
```

### 2. Express API
```bash
cd server
npm install
node index.js                    # Runs on port 3000
```

### 3. MCP Tools Server
```bash
cd server/mcp-python
python3.12 -m venv .venv
.venv/bin/pip install -r requirements.txt
cp .env.example .env             # Edit with your DB credentials
.venv/bin/python3 rest_server.py # Runs on port 3002
```

### 4. Angular Frontend
```bash
npm install
ng serve                         # Runs on port 4200
```

### 5. Dify
```bash
cd ~/dify/docker && docker compose up -d
# Import OpenAPI spec: http://localhost:3002/openapi.json
```

## Project Structure

```
.
├── src/                        # Angular frontend source
├── server/
│   ├── index.js                # Express API (port 3000)
│   ├── routes/                 # Express REST routes
│   └── mcp-python/             # MCP Tools Server (port 3002)
│       ├── rest_server.py      # FastAPI server
│       ├── db.py               # aiomysql connection pool
│       ├── registry.py         # Tool registry
│       ├── tools/              # 18 modules, 71 tools
│       ├── Dockerfile          # Production container
│       ├── Jenkinsfile         # CI/CD for OpenShift
│       └── openshift/          # K8s manifests
├── database/
│   ├── schema-only.sql         # 42 table DDL
│   ├── seed-data-only.sql      # Reference + sample data
│   └── npa_workbench_full_export.sql  # Full export (schema + data)
├── docs/                       # All documentation
│   ├── architecture/           # System design, agent hierarchy, UI integration
│   ├── mcp-server/             # MCP tools technical reference (71 tools)
│   ├── dify-agents/            # Dify agent setup and chatflow guides
│   ├── knowledge-base/         # KB content (policies, rules, templates)
│   └── database/               # Database schema documentation
└── Context/                    # Research & planning context (internal)
```

## Documentation

| Document | Location | Audience |
|----------|----------|----------|
| **MCP Tools Documentation** | `docs/mcp-server/MCP_TOOLS_DOCUMENTATION.md` | DevOps, Backend Engineers |
| **Agent Architecture** | `docs/architecture/AGENT_ARCHITECTURE.md` | Architects, Tech Leads |
| **Dify Agent Setup** | `docs/dify-agents/DIFY_AGENT_SETUP_GUIDE.md` | AI Engineers, Dify Admins |
| **Chatflow Node Guide** | `docs/dify-agents/DIFY_CHATFLOW_NODE_GUIDE.md` | Dify Agent Builders |
| **Database Schema** | `docs/database/database_schema.md` | DBAs, Backend Engineers |
| **UI Integration** | `docs/architecture/UI_CHANGES_FOR_AGENT_INTEGRATION.md` | Frontend Engineers |
| **KB Strategy** | `docs/knowledge-base/` | AI Engineers, Domain Experts |

## The 13 AI Agents

| Tier | Agent | Purpose |
|------|-------|---------|
| **1 — Strategic** | Master COO Orchestrator | Routes all user messages, manages sessions |
| **2 — Domain** | NPA Domain Orchestrator | NPA lifecycle routing, stage management |
| **3 — Specialist** | Ideation Agent | Product conceptualization, prohibited screening |
| | Classification Agent | NPA type scoring, track determination |
| | AutoFill Agent | 47-field template auto-fill with RAG |
| | ML Prediction Agent | Approval likelihood, timeline prediction |
| | Risk Agent | 4-layer risk validation cascade |
| | Governance Agent | Sign-offs, SLA, loop-backs, circuit breaker |
| | Diligence Agent | Deep Q&A with regulatory citations |
| | Doc Lifecycle Agent | Document upload, validation, completeness |
| | Monitoring Agent | Post-launch metrics, breach alerts |
| **4 — Utility** | KB Search Agent | Shared knowledge base retrieval (RAG) |
| | Notification Agent | Cross-domain alert delivery |
| | Audit Trail Agent | Immutable compliance logging |
| | Jurisdiction Adapter | Multi-jurisdiction rule adaptation |

## MCP Tools Server — 71 Tools

| Category | Tools | Primary Agent |
|----------|-------|---------------|
| Session | 2 | Master COO, NPA Orchestrator |
| Ideation | 5 | Ideation Agent |
| Classification | 5 | Classification Agent |
| AutoFill | 5 | AutoFill Agent |
| Risk | 4 | Risk Agent |
| Governance | 5 | Governance Agent |
| Audit | 4 | Audit Trail Agent |
| NPA Data | 4 | NPA Orchestrator, ML Predict |
| Workflow | 5 | NPA Orchestrator |
| Monitoring | 6 | Monitoring Agent |
| Documents | 4 | Doc Lifecycle Agent |
| Governance Ext. | 6 | Governance Agent |
| Risk Ext. | 4 | Risk Agent |
| KB Search | 3 | KB Search Agent |
| Prospects | 2 | Ideation Agent |
| Dashboard | 1 | Master COO |
| Notifications | 3 | Notification Agent |
| Jurisdiction | 3 | Jurisdiction Adapter |

## Deployment (OpenShift)

The MCP Tools Server deploys to OpenShift via Jenkins CI/CD:

```bash
# Jenkins pipeline: Build → Push → Deploy → Health Check
# Files: Dockerfile, Jenkinsfile, openshift/*.yaml
```

See `server/mcp-python/openshift/` for manifests and `server/mcp-python/Jenkinsfile` for the pipeline.

**Configuration required:**
- `openshift/secret.yaml` — External MariaDB credentials
- `openshift/configmap.yaml` — Public URL, port
- `Jenkinsfile` — Registry, OpenShift project name
