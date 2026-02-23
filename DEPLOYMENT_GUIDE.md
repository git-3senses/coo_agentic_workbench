# COO Agentic Workbench — Production Deployment Guide

> **Version:** 1.0.0
> **Date:** 2026-02-23
> **App:** NPA (New Product Approval) Multi-Agent Workbench
> **Stack:** Angular 20 + Express 5 + MySQL/MariaDB + Dify Cloud AI
> **Commit:** `c472c31` (Phase 2-3 Complete)

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Prerequisites](#2-prerequisites)
3. [Environment Variables](#3-environment-variables)
4. [Deployment Options](#4-deployment-options)
   - [Option A: Docker (Recommended)](#option-a-docker-recommended)
   - [Option B: Railway](#option-b-railway)
   - [Option C: Render](#option-c-render)
   - [Option D: Manual / VM / On-Prem](#option-d-manual--vm--on-prem)
5. [Database Setup](#5-database-setup)
6. [Dify Cloud Configuration](#6-dify-cloud-configuration)
7. [Build & Verify](#7-build--verify)
8. [Health Checks & Monitoring](#8-health-checks--monitoring)
9. [Nginx / Reverse Proxy](#9-nginx--reverse-proxy)
10. [SSL / TLS](#10-ssl--tls)
11. [Security Hardening](#11-security-hardening)
12. [Rollback Procedure](#12-rollback-procedure)
13. [Troubleshooting](#13-troubleshooting)
14. [Appendix](#14-appendix)

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    BROWSER (Client)                      │
│         Angular 20 SPA + Tailwind CSS                    │
│         Port 4200 (dev) / served by Express (prod)       │
└────────────────────────┬────────────────────────────────┘
                         │ HTTPS
┌────────────────────────▼────────────────────────────────┐
│              REVERSE PROXY (Nginx / ALB)                 │
│              SSL termination, gzip, rate limiting        │
│              Port 443 → Port 3000                        │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│              EXPRESS.JS API SERVER                        │
│              Port 3000 (configurable via PORT env)        │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐   │
│  │ /api/npas │  │/api/dify/│  │ /api/agents/health   │   │
│  │ CRUD +   │  │ chat     │  │ /api/governance      │   │
│  │ prefill  │  │ workflow │  │ /api/risk-checks     │   │
│  │ persist  │  │ health   │  │ /api/classification  │   │
│  └────┬─────┘  └────┬─────┘  └──────────────────────┘   │
│       │              │                                    │
└───────┼──────────────┼────────────────────────────────────┘
        │              │
   ┌────▼────┐   ┌─────▼──────────────────────────────┐
   │  MySQL  │   │         DIFY CLOUD (api.dify.ai)    │
   │ MariaDB │   │                                     │
   │  10.6   │   │  18 Apps (5 Chatflow + 13 Workflow) │
   │         │   │  claude-sonnet-4-5                    │
   │  ~15    │   │  SSE Streaming                      │
   │ tables  │   │  Knowledge Base (RAG)               │
   └─────────┘   └─────────────────────────────────────┘
```

### Component Summary

| Component | Technology | Port | Purpose |
|-----------|-----------|------|---------|
| Frontend | Angular 20, Tailwind CSS | — (served by Express) | SPA: NPA Draft Builder, field rendering, chat panels |
| Backend | Express 5, Node 20 | 3000 | API server, Dify proxy, DB access, static file serving |
| Database | MySQL 8 / MariaDB 10.6 | 3306 | NPA records, form data, audit trail, workflow states |
| AI Engine | Dify Cloud + Claude Sonnet 4.5 | — (SaaS) | 18 AI agents: orchestration, classification, risk, sign-off |
| MCP Server | Python 3.12, FastAPI (optional) | 10000 | Extended tool capabilities for Dify agents |

---

## 2. Prerequisites

### Runtime Requirements

| Requirement | Minimum | Recommended |
|-------------|---------|-------------|
| Node.js | 20.x LTS | 22.x LTS |
| npm | 10.x | 11.x |
| MySQL / MariaDB | 8.0 / 10.6 | 8.0 / 10.11 |
| Docker (if containerized) | 24.x | 27.x |
| Docker Compose (if containerized) | 2.20+ | 2.30+ |
| OS | Linux (Ubuntu 22.04+), macOS, Windows Server 2022 | Ubuntu 24.04 LTS |
| RAM | 1 GB | 2 GB |
| Disk | 500 MB | 2 GB |

### External Services

| Service | Required | Purpose | Account |
|---------|----------|---------|---------|
| **Dify Cloud** | YES | AI agent hosting (18 apps) | https://cloud.dify.ai |
| **Anthropic API** (via Dify) | YES | LLM inference (claude-sonnet-4-5) | Configured in Dify |
| **GitHub** | YES | Source code repository | https://github.com/git-3senses/coo_agentic_workbench |
| MySQL hosting | YES | Production database | Railway / AWS RDS / self-hosted |

---

## 3. Environment Variables

Create `server/.env` from this template. **Never commit this file** — it is in `.gitignore`.

```bash
# ============================================================
# SERVER
# ============================================================
PORT=3000
NODE_ENV=production

# ============================================================
# DATABASE — MySQL 8 or MariaDB 10.6+
# ============================================================
DB_HOST=<your-db-host>
DB_PORT=3306
DB_USER=<your-db-user>
DB_PASSWORD=<your-db-password>
DB_NAME=npa_workbench

# ============================================================
# DIFY CLOUD — AI Agent Platform
# ============================================================
DIFY_BASE_URL=https://api.dify.ai/v1

# Tier 1: Master Orchestrator
DIFY_KEY_MASTER_COO=app-xxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Tier 2: Domain Orchestrator
DIFY_KEY_NPA_ORCHESTRATOR=app-xxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Tier 3: Specialist Agents (11)
DIFY_KEY_IDEATION=app-xxxxxxxxxxxxxxxxxxxxxxxxxxxx
DIFY_KEY_CLASSIFIER=app-xxxxxxxxxxxxxxxxxxxxxxxxxxxx
DIFY_KEY_RISK=app-xxxxxxxxxxxxxxxxxxxxxxxxxxxx
DIFY_KEY_AUTOFILL=app-xxxxxxxxxxxxxxxxxxxxxxxxxxxx
DIFY_KEY_GOVERNANCE=app-xxxxxxxxxxxxxxxxxxxxxxxxxxxx
DIFY_KEY_DOC_LIFECYCLE=app-xxxxxxxxxxxxxxxxxxxxxxxxxxxx
DIFY_KEY_MONITORING=app-xxxxxxxxxxxxxxxxxxxxxxxxxxxx
DIFY_KEY_DILIGENCE=app-xxxxxxxxxxxxxxxxxxxxxxxxxxxx
DIFY_KEY_NOTIFICATION=app-xxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Tier 3B: Draft Builder Sign-Off Agents (5)
DIFY_KEY_AG_NPA_BIZ=app-xxxxxxxxxxxxxxxxxxxxxxxxxxxx
DIFY_KEY_AG_NPA_TECH_OPS=app-xxxxxxxxxxxxxxxxxxxxxxxxxxxx
DIFY_KEY_AG_NPA_FINANCE=app-xxxxxxxxxxxxxxxxxxxxxxxxxxxx
DIFY_KEY_AG_NPA_RMG=app-xxxxxxxxxxxxxxxxxxxxxxxxxxxx
DIFY_KEY_AG_NPA_LCS=app-xxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Tier 4: Shared Services
DIFY_KEY_ML_PREDICT=app-xxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Variable Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `3000` | Express server port |
| `NODE_ENV` | No | `development` | Set to `production` for prod |
| `DB_HOST` | **Yes** | `localhost` | Database hostname |
| `DB_PORT` | No | `3306` | Database port |
| `DB_USER` | **Yes** | `npa_user` | Database username |
| `DB_PASSWORD` | **Yes** | — | Database password |
| `DB_NAME` | No | `npa_workbench` | Database name |
| `DIFY_BASE_URL` | No | `https://api.dify.ai/v1` | Dify API endpoint |
| `DIFY_KEY_*` | **Yes** | — | 16 Dify API keys (see above) |

---

## 4. Deployment Options

### Option A: Docker (Recommended)

#### Step 1: Clone & Configure

```bash
git clone https://github.com/git-3senses/coo_agentic_workbench.git
cd coo_agentic_workbench

# Create environment file
cp database/.env.example server/.env
# Edit server/.env with your actual values (DB credentials, Dify API keys)
```

#### Step 2: Build Docker Image

```bash
# Build the multi-stage image
docker build -t npa-workbench:latest .

# Verify image
docker images npa-workbench
```

The Dockerfile performs a multi-stage build:
- **Stage 1:** Builds Angular production bundle (`dist/agent-command-hub-angular/browser/`)
- **Stage 2:** Copies server + Angular dist into a minimal Node 20 Alpine image

#### Step 3: Start Database

```bash
# Start MariaDB + PhpMyAdmin
docker compose up -d db phpmyadmin

# Wait for database to be healthy
docker compose exec db mysqladmin ping -h localhost -u root -prootpassword

# Verify database initialized
docker compose exec db mysql -u npa_user -pnpa_password npa_workbench -e "SHOW TABLES;"
```

#### Step 4: Run Application

```bash
# Run with environment file
docker run -d \
  --name npa-workbench \
  --env-file server/.env \
  -p 3000:3000 \
  --restart unless-stopped \
  npa-workbench:latest

# Verify
curl http://localhost:3000/api/health
curl http://localhost:3000/api/dify/agents/health
```

#### Step 5: Full Stack with Docker Compose

For a complete local stack, create `docker-compose.prod.yml`:

```yaml
version: '3.8'
services:
  db:
    image: mariadb:10.6
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_ROOT_PASSWORD:-rootpassword}
      MYSQL_DATABASE: npa_workbench
      MYSQL_USER: ${DB_USER}
      MYSQL_PASSWORD: ${DB_PASSWORD}
    ports:
      - "3306:3306"
    volumes:
      - npa_data:/var/lib/mysql
      - ./src/assets/sql/init_full_database.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 5
    command: >
      --character-set-server=utf8mb4
      --collation-server=utf8mb4_general_ci
      --max-connections=200

  app:
    build: .
    restart: unless-stopped
    env_file: server/.env
    ports:
      - "3000:3000"
    depends_on:
      db:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "node", "-e", "fetch('http://localhost:3000/api/health').then(r => process.exit(r.ok ? 0 : 1))"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 15s

volumes:
  npa_data:
```

```bash
docker compose -f docker-compose.prod.yml up -d
```

---

### Option B: Railway

Railway is pre-configured with `railway.json`.

#### Step 1: Connect Repository

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login & link
railway login
railway link
```

#### Step 2: Set Environment Variables

```bash
# Set each variable
railway variables set DB_HOST=<host>
railway variables set DB_PORT=<port>
railway variables set DB_USER=<user>
railway variables set DB_PASSWORD=<password>
railway variables set DB_NAME=npa_workbench
railway variables set DIFY_BASE_URL=https://api.dify.ai/v1
railway variables set DIFY_KEY_MASTER_COO=app-xxx
# ... (all 16 Dify keys)
```

#### Step 3: Deploy

```bash
railway up
# Or push to linked GitHub branch for automatic deployment
git push origin main
```

**Railway Config (`railway.json`):**
- Build: `npm run build` (Angular production build + server deps)
- Start: `cd server && node index.js`
- Health check: `GET /api/health` (120s timeout)
- Restart policy: `ON_FAILURE` (max 3 retries)

---

### Option C: Render

Render is pre-configured with `render.yaml` blueprint.

#### Step 1: Connect

1. Go to https://render.com
2. New → Blueprint → Connect GitHub repo
3. Select `coo_agentic_workbench`
4. Render auto-detects `render.yaml`

#### Step 2: Configure Environment

The blueprint defines 2 services:

| Service | Runtime | Port | Purpose |
|---------|---------|------|---------|
| `npa-workbench` | Node 22 | 3000 | Main app (Angular + Express) |
| `mcp-tools` | Docker (Python 3.12) | 10000 | MCP tool server (optional) |

Set environment variables in Render dashboard for each service.

#### Step 3: Deploy

Render auto-deploys on push to `main`. Manual deploy available in dashboard.

---

### Option D: Manual / VM / On-Prem

#### Step 1: System Setup

```bash
# Ubuntu 24.04 LTS
sudo apt update && sudo apt upgrade -y

# Install Node.js 22 LTS
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# Verify
node --version   # v22.x.x
npm --version    # 11.x.x

# Install MariaDB (or connect to external MySQL)
sudo apt install -y mariadb-server
sudo systemctl enable mariadb
sudo systemctl start mariadb
```

#### Step 2: Clone & Install

```bash
# Clone repository
git clone https://github.com/git-3senses/coo_agentic_workbench.git
cd coo_agentic_workbench

# Install Angular dependencies
npm ci

# Build Angular production bundle
npx ng build --configuration production

# Install server production dependencies
cd server
npm ci --omit=dev
cd ..
```

#### Step 3: Configure

```bash
# Create environment file
nano server/.env
# Add all variables from Section 3 above
```

#### Step 4: Initialize Database

```bash
# Create database and user
sudo mysql -u root <<EOF
CREATE DATABASE IF NOT EXISTS npa_workbench
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_general_ci;
CREATE USER IF NOT EXISTS 'npa_user'@'%' IDENTIFIED BY 'YOUR_SECURE_PASSWORD';
GRANT ALL PRIVILEGES ON npa_workbench.* TO 'npa_user'@'%';
FLUSH PRIVILEGES;
EOF

# Import schema
mysql -u npa_user -p npa_workbench < src/assets/sql/init_full_database.sql
```

#### Step 5: Run with Process Manager

```bash
# Install PM2
sudo npm install -g pm2

# Start application
cd server
pm2 start index.js --name npa-workbench \
  --max-memory-restart 512M \
  --exp-backoff-restart-delay=100

# Save PM2 process list (survives reboot)
pm2 save
pm2 startup systemd
# Run the command PM2 outputs

# Verify
pm2 status
pm2 logs npa-workbench
curl http://localhost:3000/api/health
```

#### PM2 Ecosystem File (Optional)

Create `ecosystem.config.js` in project root:

```javascript
module.exports = {
  apps: [{
    name: 'npa-workbench',
    cwd: './server',
    script: 'index.js',
    instances: 1,
    exec_mode: 'fork',
    max_memory_restart: '512M',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/error.log',
    out_file: './logs/output.log',
    merge_logs: true,
    time: true,
    watch: false,
    exp_backoff_restart_delay: 100
  }]
};
```

```bash
pm2 start ecosystem.config.js
```

---

## 5. Database Setup

### Schema

The application uses **~15 tables**. The schema initialization script is at:

```
src/assets/sql/init_full_database.sql
```

### Key Tables

| Table | Purpose |
|-------|---------|
| `npa_projects` | NPA project records (status, stage, classification) |
| `npa_form_data` | Field-level form data (339 fields per NPA) |
| `npa_signoffs` | Sign-off party approvals/rejections |
| `npa_classification_scorecards` | Product classification scores |
| `npa_intake_assessments` | Intake assessment data |
| `npa_documents` | Document references and metadata |
| `npa_comments` | Comments and annotations |
| `npa_workflow_states` | Workflow state machine tracking |
| `npa_approvals` | Approval chain records |
| `npa_breach_alerts` | Compliance breach alerts |
| `npa_performance_metrics` | Post-launch performance data |
| `npa_loop_backs` | Loop-back / rework tracking |
| `npa_jurisdictions` | Multi-jurisdiction mapping |
| `npa_post_launch_conditions` | Post-launch condition tracking |

### Connection Pool Settings

| Setting | Value | Notes |
|---------|-------|-------|
| `connectionLimit` | 10 | Max concurrent connections |
| `queueLimit` | 50 | Max queued connection requests |
| `connectTimeout` | 5000ms | Connection establishment timeout |
| `idleTimeout` | 60000ms | Release idle connections after 60s |
| `keepAliveInitialDelay` | 30000ms | TCP keepalive ping every 30s |

### Backup Strategy

```bash
# Daily backup (add to crontab)
mysqldump -u npa_user -p npa_workbench \
  --single-transaction \
  --routines \
  --triggers \
  --add-drop-table \
  > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore from backup
mysql -u npa_user -p npa_workbench < backup_20260223_120000.sql
```

---

## 6. Dify Cloud Configuration

### Overview

The system uses **18 Dify apps** on https://cloud.dify.ai running **claude-sonnet-4-5**.

### App Registry

| Dify App | Agent ID | Type | Sections | Status |
|----------|----------|------|----------|--------|
| CF_COO_Orchestrator | MASTER_COO | Chatflow | All | HEALTHY |
| CF_NPA_Orchestrator | NPA_ORCHESTRATOR | Chatflow | All NPA | HEALTHY |
| CF_NPA_Ideation | IDEATION | Chatflow | Ideation | HEALTHY |
| WF_NPA_Classify_Predict | CLASSIFIER + ML_PREDICT | Workflow | Classification | HEALTHY |
| WF_NPA_Risk | RISK | Workflow | Risk assessment | HEALTHY |
| WF_NPA_Autofill | AUTOFILL | Workflow | — | DEPRECATED |
| WF_NPA_Governance | GOVERNANCE | Workflow | Governance | HEALTHY |
| WF_NPA_Doc_Lifecycle | DOC_LIFECYCLE | Workflow | Documents | HEALTHY |
| WF_NPA_Monitoring | MONITORING | Workflow | Post-launch | HEALTHY |
| CF_NPA_Query_Assistant | DILIGENCE + KB_SEARCH | Chatflow | KB search | HEALTHY |
| WF_NPA_Notification | NOTIFICATION | Workflow | Notifications | HEALTHY |
| **CF_NPA_BIZ** | AG_NPA_BIZ | Chatflow | PC.I, PC.VII | **HEALTHY** |
| **CF_NPA_TECH_OPS** | AG_NPA_TECH_OPS | Chatflow | PC.II | **HEALTHY** |
| **CF_NPA_FINANCE** | AG_NPA_FINANCE | Chatflow | PC.III, PC.V | **HEALTHY** |
| **CF_NPA_RMG** | AG_NPA_RMG | Chatflow | PC.IV, PC.VI | **HEALTHY** |
| **CF_NPA_LCS** | AG_NPA_LCS | Chatflow | APP.1-6 | **HEALTHY** |

### Critical Dify Settings

| Setting | Value | Notes |
|---------|-------|-------|
| Model | claude-sonnet-4-5 | Anthropic via Dify |
| Temperature | 0.2–0.3 | Low for consistent outputs |
| Top P | **OFF** | Cannot use both temp AND top_p with Claude |
| Streaming | SSE enabled | Real-time token streaming |
| Context Window | — | Default (200K tokens) |

### API Key Management

- API keys are generated from Dify Cloud → App → API Access panel
- Keys can go stale — if health check returns `AUTH_FAILED`, regenerate from Dify Cloud
- Each app has its own API key (`app-xxx...`)
- Keys are stored in `server/.env` only — **never hardcoded in source**

### Updating Agent Prompts

The system prompt files are in `Context/Dify_Agent_Prompts/CF_NPA_*_Prompt.md`. To update:

1. Edit the prompt file locally
2. Copy the content (everything below the `---` separator)
3. Go to Dify Cloud → App → Instructions field
4. Paste and **Publish** the app
5. Test with a health check: `GET /api/dify/agents/health`

### Knowledge Base (KB) Upload

Shared KBs to upload to all 5 sign-off agent apps:

| KB Document | File Location | Upload to |
|-------------|---------------|-----------|
| Business Process Deep Knowledge | `Context/KB/NPA_Business_Process_Deep_Knowledge.md` | All 5 agents |
| Golden Template | `Context/NPA_Golden_Sources/NPA_Golden_Template.md` | All 5 agents |
| Filled Example | `Context/NPA_Golden_Sources/NPA_Filled_Template.md` | All 5 agents |

See `Context/KB_Requirements_Per_Agent.md` for the full list of 38 domain-specific KBs needed per agent.

---

## 7. Build & Verify

### Production Build

```bash
# From project root
npm run build

# This runs:
# 1. npx ng build --configuration production
#    → Outputs to dist/agent-command-hub-angular/browser/
#    → Includes tree-shaking, AOT compilation, minification
# 2. cd server && npm install --omit=dev
#    → Installs only production dependencies
```

### Build Verification

```bash
# Check build output exists
ls -la dist/agent-command-hub-angular/browser/

# Expected: index.html, main-*.js, polyfills-*.js, styles-*.css

# Check bundle sizes (warnings expected for >500KB initial bundle)
du -sh dist/agent-command-hub-angular/browser/*.js
```

### Known Build Warnings

| Warning | Severity | Action |
|---------|----------|--------|
| Initial bundle > 500kB budget | Low | Expected — rich UI with field renderers |
| Component style > 4kB budget | Low | Expected — Tailwind utilities |

**These warnings are acceptable and do not affect functionality.**

### Start & Verify

```bash
# Start server
cd server && node index.js

# Verify endpoints
curl http://localhost:3000/api/health
# Expected: {"status":"ok","uptime":...}

curl http://localhost:3000/api/dify/agents/health
# Expected: {"summary":{"total":18,"healthy":17,"unhealthy":1,...}}
# AUTOFILL agent ERROR is expected (deprecated)

curl http://localhost:3000/api/dify/agents/status
# Expected: All 18 agents listed with configuration status

# Verify Angular SPA
curl -s http://localhost:3000/ | head -5
# Expected: <!DOCTYPE html>... (Angular index.html)
```

---

## 8. Health Checks & Monitoring

### Endpoints

| Endpoint | Method | Purpose | Expected Response |
|----------|--------|---------|-------------------|
| `/api/health` | GET | Application health | `{"status":"ok"}` |
| `/api/dify/agents/health` | GET | All 18 agent health | `{"summary":{...},"agents":[...]}` |
| `/api/dify/agents/status` | GET | Agent configuration | Agent configs + key status |

### Health Check Response Structure

```json
{
  "summary": {
    "total": 18,
    "healthy": 17,
    "degraded": 0,
    "unhealthy": 1,
    "unconfigured": 0,
    "unknown": 0,
    "last_check": "2026-02-23T02:57:07.905Z"
  },
  "agents": [
    {
      "agent_id": "MASTER_COO",
      "name": "Master COO Orchestrator",
      "type": "chat",
      "tier": 1,
      "status": "HEALTHY",
      "latency_ms": 340,
      "uptime_pct": 100,
      "consecutive_failures": 0
    }
  ]
}
```

### Monitoring Schedule (Built-in)

| Monitor | Interval | Purpose |
|---------|----------|---------|
| Agent Health Monitor | Every 5 minutes | Pings all 18 Dify agents |
| SLA Monitor | Every 15 minutes | Checks response time SLAs |
| DB Keepalive | Every 60 seconds | Prevents MySQL connection timeout |

### External Monitoring (Recommended)

Set up an uptime monitor (UptimeRobot, Pingdom, AWS CloudWatch) targeting:

```
GET https://your-domain.com/api/health
Expected: HTTP 200, body contains "ok"
Interval: 60 seconds
Timeout: 10 seconds
Alert: Email/Slack on 2 consecutive failures
```

### Alerting Thresholds

| Metric | Warning | Critical |
|--------|---------|----------|
| Agent health | < 16/18 healthy | < 14/18 healthy |
| API response time | > 2s average | > 5s average |
| Dify latency | > 500ms per agent | > 2000ms per agent |
| DB connections | > 8/10 pool used | Pool exhausted |
| Memory usage | > 400MB | > 512MB (PM2 auto-restart) |

---

## 9. Nginx / Reverse Proxy

### Recommended Nginx Configuration

```nginx
upstream npa_backend {
    server 127.0.0.1:3000;
    keepalive 32;
}

server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    # SSL certificates (Let's Encrypt / ACM)
    ssl_certificate     /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         HIGH:!aNULL:!MD5;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self' https://api.dify.ai; img-src 'self' data:;";

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml;
    gzip_min_length 1000;

    # SSE streaming — critical for Dify chat
    location /api/dify/ {
        proxy_pass http://npa_backend;
        proxy_http_version 1.1;
        proxy_set_header Connection '';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # SSE-specific settings
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 600s;     # 10 min for long AI responses
        proxy_send_timeout 600s;
        chunked_transfer_encoding on;
    }

    # Regular API routes
    location /api/ {
        proxy_pass http://npa_backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 30s;
    }

    # Angular SPA — serve static files, fallback to index.html
    location / {
        proxy_pass http://npa_backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Static asset caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://npa_backend;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### Key Nginx Notes

1. **SSE Streaming:** The `/api/dify/` routes use Server-Sent Events. You **must** disable proxy buffering (`proxy_buffering off`) and set long timeouts (600s) for these routes.
2. **Timeout:** Dify AI responses can take 30-120s for complex auto-fill operations. The 600s timeout accounts for chunked multi-section fills.
3. **WebSocket:** Not needed — the app uses SSE (HTTP/1.1), not WebSockets.

---

## 10. SSL / TLS

### Option 1: Let's Encrypt (Free)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal (certbot installs a cron job automatically)
sudo certbot renew --dry-run
```

### Option 2: Cloud Provider SSL

| Platform | SSL Method |
|----------|-----------|
| Railway | Automatic SSL on custom domains |
| Render | Automatic SSL on .onrender.com and custom domains |
| AWS ALB | ACM certificate + ALB listener |
| CloudFlare | Flexible/Full SSL in front of origin |

---

## 11. Security Hardening

### Pre-Deployment Checklist

- [ ] **Environment variables** — All secrets in `server/.env`, never in source code
- [ ] **`.env` in `.gitignore`** — Verified (already configured)
- [ ] **CORS** — Review `cors()` settings in `server/index.js` for production origin whitelist
- [ ] **Dify API keys** — Valid and not expired (check via health endpoint)
- [ ] **Database credentials** — Strong password, not default
- [ ] **HTTPS enforced** — HTTP → HTTPS redirect via Nginx/ALB
- [ ] **Security headers** — X-Frame-Options, CSP, HSTS (see Nginx config above)
- [ ] **Rate limiting** — Consider adding `express-rate-limit` for API routes
- [ ] **Input validation** — Zod schemas validate API payloads (`server/package.json` includes `zod`)
- [ ] **JWT secrets** — If using auth, set strong `JWT_SECRET` environment variable
- [ ] **SQL injection** — Parameterized queries used throughout (`mysql2` prepared statements)
- [ ] **No debug endpoints** — Ensure no test routes exposed in production
- [ ] **Dependency audit** — Run `npm audit` and `cd server && npm audit`

### Recommended Additions for Production

```bash
# Install rate limiter
cd server && npm install express-rate-limit

# Add to server/index.js:
# const rateLimit = require('express-rate-limit');
# app.use('/api/', rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));
# app.use('/api/dify/', rateLimit({ windowMs: 1 * 60 * 1000, max: 20 }));
```

### CORS Configuration for Production

Update `server/index.js` to whitelist your production domain:

```javascript
// Replace: app.use(cors());
// With:
app.use(cors({
  origin: ['https://your-domain.com'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  credentials: true
}));
```

---

## 12. Rollback Procedure

### Quick Rollback

```bash
# 1. Identify the previous working commit
git log --oneline -5

# 2. Revert to previous commit
git checkout <previous-commit-hash>

# 3. Rebuild
npm run build

# 4. Restart
pm2 restart npa-workbench
# or
docker restart npa-workbench
```

### Database Rollback

```bash
# Restore from backup
mysql -u npa_user -p npa_workbench < backup_YYYYMMDD_HHMMSS.sql
```

### Dify Agent Rollback

1. Go to Dify Cloud → App → Version History
2. Restore to previous published version
3. No API key change needed — key stays the same

---

## 13. Troubleshooting

### Common Issues

| Issue | Symptom | Fix |
|-------|---------|-----|
| **Agent AUTH_FAILED** | Health check shows `status: "ERROR"` | Regenerate API key from Dify Cloud → API Access |
| **SSE streaming fails** | Chat responses don't stream | Check Nginx `proxy_buffering off` for `/api/dify/` |
| **DB connection refused** | `ECONNREFUSED` on startup | Verify `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` |
| **AUTOFILL agent ERROR** | 1 of 18 agents unhealthy | **Expected** — AUTOFILL is deprecated, ignore this |
| **Build budget warnings** | 2 warnings during `ng build` | **Expected** — bundle >500KB and style >4KB are acceptable |
| **Top P conflict** | Dify returns 400 error | Ensure Top P is **OFF** on all Dify apps (cannot use both temp AND top_p with Claude) |
| **Stale conversations** | Agent returns "I don't recall" | Conversation history is in-memory — lost on server restart. Expected behavior (Phase 6 item). |
| **Large auto-fill timeout** | RMG/LCS agent times out | Check Nginx `proxy_read_timeout 600s` for `/api/dify/`. These agents chunk at 40 fields per request. |
| **Port already in use** | `EADDRINUSE` on port 3000 | Kill existing process: `lsof -i :3000` → `kill <PID>` |

### Diagnostic Commands

```bash
# Check application logs
pm2 logs npa-workbench --lines 100

# Check agent health
curl -s http://localhost:3000/api/dify/agents/health | python3 -m json.tool

# Test specific agent
curl -X POST http://localhost:3000/api/dify/chat \
  -H "Content-Type: application/json" \
  -d '{"agent_id":"AG_NPA_BIZ","message":"Hello, are you available?","user":"test"}'

# Check database connectivity
curl -s http://localhost:3000/api/npas | head -100

# Check server process
pm2 status
pm2 monit
```

---

## 14. Appendix

### A. File Structure (Production-Relevant)

```
coo_agentic_workbench/
├── dist/                              # Angular production build (generated)
│   └── agent-command-hub-angular/
│       └── browser/
│           ├── index.html
│           ├── main-*.js
│           ├── polyfills-*.js
│           └── styles-*.css
├── server/                            # Express.js backend
│   ├── index.js                       # Entry point (port 3000)
│   ├── db.js                          # MySQL connection pool
│   ├── package.json                   # Server dependencies
│   ├── .env                           # Environment variables (NOT in git)
│   ├── config/
│   │   └── dify-agents.js             # 18 agent configurations
│   └── routes/
│       ├── dify-proxy.js              # Dify API proxy (SSE streaming)
│       ├── npas.js                    # NPA CRUD + prefill
│       ├── governance.js              # Governance endpoints
│       ├── risk-checks.js             # Risk assessment
│       ├── classification.js          # Product classification
│       └── ... (18 route modules)
├── src/                               # Angular source (for builds only)
│   └── assets/sql/
│       └── init_full_database.sql     # Database schema
├── Dockerfile                         # Multi-stage production build
├── docker-compose.yml                 # Local dev stack
├── railway.json                       # Railway deployment config
├── render.yaml                        # Render blueprint
├── package.json                       # Root (Angular + build scripts)
└── PROJECT_STATUS_REPORT.md           # Current project status
```

### B. API Route Summary

| Route | Method | Description |
|-------|--------|-------------|
| `/api/health` | GET | Application health check |
| `/api/npas` | GET | List all NPAs (with filters) |
| `/api/npas/:id` | GET | Full NPA detail |
| `/api/npas/:id/prefill` | GET | Pre-fill form fields (RULE + COPY) |
| `/api/npas` | POST | Create new NPA |
| `/api/npas/:id` | PUT | Update NPA |
| `/api/dify/chat` | POST | Send message to Dify Chatflow (SSE) |
| `/api/dify/workflow` | POST | Run Dify Workflow (SSE) |
| `/api/dify/conversations/:id` | GET | Get conversation history |
| `/api/dify/agents/health` | GET | All agent health status |
| `/api/dify/agents/status` | GET | Agent configuration status |
| `/api/governance/*` | Various | Governance operations |
| `/api/risk-checks/*` | Various | Risk assessment operations |
| `/api/classification/*` | Various | Classification operations |
| `/api/approvals/*` | Various | Approval chain |
| `/api/audit/*` | Various | Audit trail |
| `/api/monitoring/*` | Various | Post-launch monitoring |
| `/api/documents/*` | Various | Document management |

### C. Dify Agent Prompt Files

Located in `Context/Dify_Agent_Prompts/`:

| File | Agent | Copy to Dify App |
|------|-------|-----------------|
| `CF_NPA_BIZ_Prompt.md` | Business Agent | CF_NPA_BIZ → Instructions |
| `CF_NPA_TECH_OPS_Prompt.md` | Tech & Ops Agent | CF_NPA_TECH_OPS → Instructions |
| `CF_NPA_FINANCE_Prompt.md` | Finance Agent | CF_NPA_FINANCE → Instructions |
| `CF_NPA_RMG_Prompt.md` | Risk Management Agent | CF_NPA_RMG → Instructions |
| `CF_NPA_LCS_Prompt.md` | Legal & Compliance Agent | CF_NPA_LCS → Instructions |

**After editing prompts locally:** Copy content below the `---` line into Dify Cloud → App → Instructions → Publish.

### D. Request Timeouts

| Route Pattern | Timeout | Reason |
|---------------|---------|--------|
| `/api/dify/*` | 600s (10 min) | AI responses can be long for bulk auto-fill |
| `/api/npas/*/seed` | 600s (10 min) | Database seeding operations |
| All other `/api/*` | 30s | Standard API responses |
| Nginx → Express | 600s (SSE routes) | Must match Express timeout for streaming |

### E. Known Limitations (Phase 3)

| Limitation | Impact | Planned Fix |
|------------|--------|-------------|
| Conversation history in-memory only | Lost on server restart | Phase 6: Persist to DB |
| No automated tests | Manual testing required | Phase 6: Unit + E2E tests |
| AUTOFILL agent deprecated | 1/18 agents always ERROR | Remove from config in Phase 5 |
| No PDF export | Users can't export NPA as PDF | Phase 6 |
| No auto-save | Form data lost if browser closes | Phase 6 |
| No SSO/LDAP auth | Hardcoded user | Phase 5: Real auth integration |
| MAS Notice 637 not ingested | RMG agent lacks regulatory KB | Phase 4: KB upload |

---

*Deployment guide generated 2026-02-23. For project status details see `PROJECT_STATUS_REPORT.md`.*
