# COO Multi-Agent Workbench

AI-powered New Product Approval (NPA) platform for banking operations. 13 AI agents orchestrate the end-to-end product approval lifecycle — from ideation through classification, risk assessment, governance sign-off, and post-launch monitoring.

> **Current Status:** Core agent flow working end-to-end (Master COO → Ideation → Classification). See [docs/PROGRESS.md](docs/PROGRESS.md) for full details.

---

## Architecture

```
┌─────────────────────┐      ┌───────────────────┐      ┌──────────────────┐
│  Angular Frontend    │      │  Express API       │      │  Dify Cloud       │
│  (Port 4200)         │─────▶│  (Port 3000)       │─────▶│  (Agent Engine)   │
│                      │ /api │                    │ HTTP │                   │
│  • Command Center    │      │  • Dify Proxy      │      │  • 3 Chatflows    │
│  • Ideation Chat     │      │  • SSE Collector   │      │  • 4 Workflows    │
│  • Agent Cards       │      │  • Envelope Parser │      │  • Claude LLM     │
│  • Stop Button       │      │  • 3-Retry Logic   │      │                   │
└─────────────────────┘      └───────────────────┘      └────────┬──────────┘
                                                                  │ MCP SSE
                                                                  ▼
                                                         ┌──────────────────┐
                                                         │  MCP Tools Server │
                                                         │  (Railway, 3002)  │
                                                         │                   │
                                                         │  71 tools │ Python│
                                                         │  ASGI Path Router │
                                                         └────────┬──────────┘
                                                                  │ aiomysql
                                                                  ▼
                                                         ┌──────────────────┐
                                                         │  MariaDB (42 tbl) │
                                                         │  Railway MySQL     │
                                                         └──────────────────┘
```

| Component | Tech | Port | Description |
|-----------|------|------|-------------|
| **Frontend** | Angular 19 + Tailwind | 4200 | COO dashboard, NPA forms, agent chat, approvals |
| **Express API** | Node.js + Express 5 | 3000 | REST API + Dify proxy with SSE stream collection |
| **MCP Tools Server** | Python 3.12 + FastAPI | 3002 | 71 database tools via ASGI Path Router (REST + MCP SSE) |
| **Dify** | Self-hosted (Docker) | 80 | Agent orchestration engine — hosts the 13 AI agents |
| **Database** | MariaDB 10.6 | 3306 | 42 tables — NPA lifecycle, reference data, audit trail |

---

## Quick Start

### Prerequisites
- Node.js 18+, Python 3.12+, Docker
- MariaDB with `npa_workbench` database (optional — fallback users if unavailable)

### 1. Express API
```bash
cd server
npm install
cp .env.example .env               # Edit with Dify keys + DB credentials
node index.js                       # Runs on port 3000
```

### 2. Angular Frontend
```bash
npm install
npx ng serve --port 4200            # Proxies /api/* to localhost:3000
```

### 3. MCP Tools Server (Railway — already deployed)
```bash
# Health check:
curl https://coo-mcp-tools.up.railway.app/health
# Returns: { "status": "ok", "tools": 71 }
```

### 4. Database (optional for local dev)
```bash
cd database
mysql -u root -p -e "CREATE DATABASE npa_workbench"
mysql -u root -p npa_workbench < npa_workbench_full_export.sql
```

### 5. Dify (self-hosted)
```bash
cd ~/dify/docker && docker compose up -d
# Import MCP tools: https://coo-mcp-tools.up.railway.app/openapi.json
```

### Verify
```bash
curl http://localhost:3000/api/dify/agents/status    # Agent health
curl -s -o /dev/null -w "%{http_code}" http://localhost:4200/  # Angular
```

---

## The 13 AI Agents

| Tier | Agent | Purpose | Status |
|------|-------|---------|--------|
| **1 — Strategic** | Master COO Orchestrator | Routes all user messages, manages sessions | ✅ Live |
| **2 — Domain** | NPA Domain Orchestrator | NPA lifecycle routing, stage management | ✅ Configured |
| **3 — Specialist** | Ideation Agent | Product conceptualization, prohibited screening | ✅ Live |
| | Classification Agent | NPA type scoring (NTG/Variation/Existing) | ✅ Live |
| | ML Prediction Agent | Approval likelihood, timeline prediction | ✅ Configured |
| | AutoFill Agent | 47-field template auto-fill with RAG | ⚠️ Pending |
| | Risk Agent | 4-layer risk validation cascade | ⚠️ Pending |
| | Governance Agent | Sign-offs, SLA, loop-backs, circuit breaker | ⚠️ Pending |
| | Diligence Agent | Deep Q&A with regulatory citations | ⚠️ Pending |
| | Doc Lifecycle Agent | Document upload, validation, completeness | ⚠️ Pending |
| | Monitoring Agent | Post-launch metrics, breach alerts | ⚠️ Pending |
| **4 — Utility** | KB Search Agent | Shared knowledge base retrieval (RAG) | ⚠️ Pending |
| | Notification Agent | Cross-domain alert delivery | ⚠️ Pending |

---

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

---

## Project Structure

```
.
├── src/                        # Angular frontend source
│   └── app/
│       ├── pages/              # 4 page components
│       ├── components/         # 30+ UI components (chat, cards, dashboard)
│       ├── services/           # 12 services (DifyService, NPA, Approval, etc.)
│       └── lib/                # Interfaces (13-agent registry, 17 action types)
├── server/
│   ├── index.js                # Express API (port 3000) — crash-protected
│   ├── db.js                   # MySQL pool (3s fast-fail timeout)
│   ├── config/dify-agents.js   # 13 agent Dify API key mappings
│   ├── routes/                 # 12 Express route modules
│   │   └── dify-proxy.js       # Dify SSE collector + envelope parser + 3-retry
│   └── mcp-python/             # MCP Tools Server (port 3002)
│       ├── rest_server.py      # ASGI Path Router (REST + MCP SSE)
│       ├── main.py             # FastMCP with 71 tools
│       └── tools/              # 18 tool modules
├── database/
│   ├── schema-only.sql         # 42 table DDL
│   ├── seed-data-only.sql      # Reference + sample data
│   └── npa_workbench_full_export.sql
├── docs/                       # Enterprise documentation
│   ├── PROGRESS.md             # ⭐ Detailed progress, bugs, troubleshooting
│   ├── SHIPPING_CHECKLIST.md   # Delivery criteria
│   ├── architecture/           # System design, agent hierarchy
│   ├── mcp-server/             # MCP tools technical reference
│   ├── dify-agents/            # Dify agent setup guides
│   ├── knowledge-base/         # KB content (policies, rules, templates)
│   └── database/               # Database schema documentation
└── Context/                    # Research & planning context (internal)
```

---

## Documentation

| Document | Location | Audience |
|----------|----------|----------|
| **Progress Report** | [`docs/PROGRESS.md`](docs/PROGRESS.md) | All Engineers |
| **Project Context** | [`PROJECT_CONTEXT.md`](PROJECT_CONTEXT.md) | New session bootstrap |
| **Agent Architecture** | [`docs/architecture/AGENT_ARCHITECTURE.md`](docs/architecture/AGENT_ARCHITECTURE.md) | Architects, Tech Leads |
| **MCP Tools Reference** | [`docs/mcp-server/MCP_TOOLS_DOCUMENTATION.md`](docs/mcp-server/MCP_TOOLS_DOCUMENTATION.md) | Backend, DevOps |
| **Dify Agent Setup** | [`docs/dify-agents/ENTERPRISE_AGENT_ARCHITECTURE_FREEZE.md`](docs/dify-agents/ENTERPRISE_AGENT_ARCHITECTURE_FREEZE.md) | AI Engineers |
| **Database Schema** | [`docs/database/database_schema.md`](docs/database/database_schema.md) | DBAs |
| **UI Integration** | [`docs/architecture/UI_CHANGES_FOR_AGENT_INTEGRATION.md`](docs/architecture/UI_CHANGES_FOR_AGENT_INTEGRATION.md) | Frontend Engineers |
| **KB Strategy** | [`docs/knowledge-base/`](docs/knowledge-base/) | AI Engineers, Domain Experts |
| **Railway Deployment** | [`RAILWAY_DEPLOYMENT_STATUS.md`](RAILWAY_DEPLOYMENT_STATUS.md) | DevOps |

---

## Deployment

### Railway (Current)
MCP Tools Server + MySQL deployed on Railway. See [`RAILWAY_DEPLOYMENT_STATUS.md`](RAILWAY_DEPLOYMENT_STATUS.md).

### OpenShift/Kubernetes (Alternative)
Drop-in replacement at `server/mcp-python/openshift/`:
```
openshift/
├── deployment.yaml    # Pod spec + replicas
├── service.yaml       # ClusterIP service
├── route.yaml         # External route (HTTPS)
├── configmap.yaml     # Environment config
├── secret.yaml        # Credentials
└── Jenkinsfile        # CI/CD pipeline
```

---

## Environment Variables

### Express API (`server/.env`)
```
DIFY_BASE_URL=http://dify.3senses.social/v1
DIFY_KEY_MASTER_COO=app-xxxxx
DIFY_KEY_IDEATION=app-xxxxx
DIFY_KEY_CLASSIFIER=app-xxxxx
# ... see server/.env.example for full list
```

### MCP Tools Server (`server/mcp-python/.env`)
```
DB_HOST=mysql.railway.internal
DB_PORT=3306
DB_USER=root
DB_NAME=railway
# ... auto-populated by Railway service variables
```

---

## License

Proprietary — Internal use only.
