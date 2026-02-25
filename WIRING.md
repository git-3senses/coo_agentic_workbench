# Production Wiring Guide (Single Source of Truth)

This repo deploys three components:

1) **Web App (Angular UI)**
2) **App API (Node/Express)** — serves Angular in “monolith” mode
3) **MCP Tools Service (Python)** — REST + MCP SSE for Dify tool-calls (optional but recommended)

External dependencies:
- **MySQL**
- **Dify (Agents + Knowledge Base / Datasets API)**

---

## 1) Recommended Production Topology

**Monolith UI+API** + **separate MCP service**

- Browser → `https://<APP_DOMAIN>/` (Angular served by Express)
- Angular → `https://<APP_DOMAIN>/api/...` (same origin)
- Express → MySQL (private network)
- Express → Dify Cloud (or Dify internal) via `DIFY_BASE_URL` / `DIFY_API_BASE`
- Dify → MCP service (tool calls) via:
  - `https://<MCP_DOMAIN>/openapi.json` (Custom Tools import), and/or
  - `https://<MCP_DOMAIN>/mcp/sse` (MCP SSE transport)

This avoids front-end endpoint rewrites and keeps keys server-side.

---

## 2) Angular UI Wiring

### A) Monolith (recommended)
No URL changes. The UI uses relative paths like `/api/...`.

Local dev proxy:
- `proxy.conf.json` proxies `/api` → `http://localhost:3000`

### B) Split deploy (UI domain != API domain)
You must introduce a single API base and prefix every `/api/...` call.

Files:
- `src/environments/environment.ts`
- `src/environments/environment.production.ts`

Search for hardcoded API paths:
- In `src/app/**`, search for strings starting with `/api`.

---

## 3) Node/Express API Wiring (App Service)

Entry:
- `server/index.js`

### Required environment variables

**DB**
- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`

**Auth**
- `JWT_SECRET` (must be stable across deployments; otherwise sessions lose continuity)

**Dify (agents)**
- `DIFY_BASE_URL` (default: `https://api.dify.ai/v1`)

Agent keys (must match `shared/agent-registry.json` `envKey` fields):
- `DIFY_KEY_MASTER_COO`
- `DIFY_KEY_NPA_ORCHESTRATOR`
- `DIFY_KEY_IDEATION`
- `DIFY_KEY_DILIGENCE`
- `DIFY_KEY_CLASSIFIER`
- `DIFY_KEY_AUTOFILL`
- `DIFY_KEY_RISK`
- `DIFY_KEY_GOVERNANCE`
- `DIFY_KEY_DOC_LIFECYCLE`
- `DIFY_KEY_MONITORING`
- `DIFY_KEY_NOTIFICATION`
- `DIFY_KEY_AG_NPA_BIZ`
- `DIFY_KEY_AG_NPA_TECH_OPS`
- `DIFY_KEY_AG_NPA_FINANCE`
- `DIFY_KEY_AG_NPA_RMG`
- `DIFY_KEY_AG_NPA_LCS`

**Dify (datasets / KB)**
- `DIFY_API_BASE` (default: `https://api.dify.ai/v1`)
- `DIFY_DATASET_API_KEY` (Bearer token for datasets API)

**Uploads / Studio**
- `UPLOADS_DIR` (absolute path; should point to persistent storage in prod)

### Useful health endpoints
- `GET /api/health`
- `GET /api/dify/agents/health`
- `GET /api/dify/agents/status`

---

## 4) MCP Tools Service Wiring (Python)

Location:
- `server/mcp-python/`

It serves both protocols on one port (single service):
- REST OpenAPI: `GET /openapi.json`
- REST tool calls: `POST /tools/<tool_name>`
- MCP SSE: `GET /mcp/sse`
- MCP messages: `POST /mcp/messages`
- Health: `GET /health`

### Required environment variables
- `PORT` (or `REST_PORT`)
- `PUBLIC_URL` (must be the externally reachable base URL)
- `ENV` (optional label)

DB:
- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`

Optional DB SSL:
- `DB_SSL_MODE`
- `DB_SSL_CA_FILE`

### What to configure in Dify
- Custom Tools import: `https://<MCP_DOMAIN>/openapi.json`
- MCP transport: `https://<MCP_DOMAIN>/mcp/sse`

---

## 5) Dify Datasets API: “dataset-...” vs UUID (Important)

The Dify datasets API uses a **Bearer token** (your `DIFY_DATASET_API_KEY`) to list datasets:

- `GET /v1/datasets` → returns dataset objects with `id` (UUID)

Document endpoints require the dataset **UUID**:
- `GET /v1/datasets/<DATASET_UUID>/documents?...`

If you use the Bearer token string (e.g. `dataset-...`) as the path id, you will get 404.

---

## 6) Airgapped PROD (No Internet)

### Fonts / external CDNs
Google fonts must not be used. This repo vendors fonts offline under:
- `src/assets/fonts/**`
- `src/assets/fonts/fonts.css`

If the bank cannot reach `api.dify.ai`, you must either:
- host Dify internally and set `DIFY_BASE_URL` + `DIFY_API_BASE`, or
- replace Dify calls with an internal gateway that matches the same API contract.

