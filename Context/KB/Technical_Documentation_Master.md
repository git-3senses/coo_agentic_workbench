# COO Multi-Agent Workbench: Technical Documentation

## 1. Context & Why This Document Exists

This document consolidates my understanding of the **COO Multi-Agent Workbench** project after reviewing all files in the `Context/` and `docs/` folders. It serves as a **personal working reference** for the project owner, covering vision, goals, tech stack, current progress, outstanding items, API contracts, and strategic questions.

**Project Stage:** Funding Prototype - being built to secure budget and leadership buy-in. This means the demo must be visually compelling and narratively coherent, but can use mock data and simulated agent responses where real infrastructure isn't ready yet. The goal is to prove the concept convincingly enough to unlock investment.

---

## 2. Vision

**One-line:** An Agent-Centric Operating System for the COO's office that replaces siloed tools, manual emails, and disjointed spreadsheets with a unified command center powered by AI agents.

**Core Philosophy:** *"Agents assist, Humans decide, and everything is auditable."*

**The Paradigm Shift:**
- **From:** NPA House, ROBO, RICO, DEGA, BCP trackers, spreadsheets, email chains
- **To:** A single workbench where 8+ specialized AI agents act as digital employees, handling functional tasks while humans retain full decision-making authority

**The Innovation (Phase 0 - Ideation):** Before any formal process begins, users have a conversational intake with the Product Ideation Agent. The system classifies, validates, searches precedents, predicts outcomes, and auto-fills 78% of the NPA template - transforming a 85-minute manual form into a 38-minute guided conversation.

---

## 3. Goals & Success Metrics

### Primary Goals
| # | Goal | Measure |
|---|------|---------|
| 1 | **Orchestration, Not Just Chat** | Agents execute workflows (ingest docs, validate rules, draft memos) |
| 2 | **Radical Efficiency** | NPA processing: 12 days --> 4 days (67% reduction) |
| 3 | **Audit-First Design** | Every agent action logged in immutable evidence trail (MAS 656/643 compliance) |
| 4 | **Scalability** | Single architecture across all 7 COO functions |

### Target Outcomes (Year 1)
| Metric | Current State | Target | Improvement |
|--------|--------------|--------|-------------|
| NPA processing time | 12 days | 4 days | 67% reduction |
| Form completion time | 60-90 min | 15-20 min | 78% reduction |
| First-time approval rate | 52% | 75% | 44% improvement |
| Classification accuracy | 72% | 92% | 28% improvement |
| Compliance violations | 8/month | 0/month | 100% elimination |
| User satisfaction | 2.1/5.0 | 4.3/5.0 | 105% improvement |
| Annual hours saved | - | 15,000+ hours | - |

---

## 4. Architecture

### 4-Tier Hierarchical Agent Architecture (Frozen v1.0)

```
Tier 1: Master Orchestrator ("The Brain")
  - Routes user intent to correct functional domain
  - Manages context switching between functions

Tier 2: Domain Agents ("The Managers")
  - NPA Agent, Desk Support Agent, DCE Agent, ORM Agent
  - Strategic PM Agent, Biz Analysis Agent, Planning Agent

Tier 3: Task Agents ("The Specialists")
  - Function-specific: DocIngestion, CompletenessChecker, RiskMemoGenerator, etc.

Tier 4: Utility Agents ("Shared Services")
  - RAG/Knowledge Base, Notification, Doc Processing, Audit Logger
```

### The 8 NPA Agents (Phase 0 Focus)
1. **Product Ideation Agent** - Conversational orchestrator (15-20 min interview)
2. **Classification Router Agent** - Two-stage classification with confidence scoring
3. **Template Auto-Fill Engine** - 78% field coverage (37/47 fields)
4. **ML-Based Prediction Sub-Agent** - XGBoost model on 1,784 historical NPAs
5. **KB Search Sub-Agent** - Semantic RAG search across historical NPAs
6. **Conversational Diligence Sub-Agent** - Real-time Q&A and contextual help
7. **Approval Orchestration Sub-Agent** - Parallel sign-offs, smart loop-back routing
8. **Prohibited List Checker Agent** - 4-layer compliance validation (<1s)

### Core Building Blocks (Frozen, Non-Negotiable)
1. **Work Item** - Universal operational unit (NPA, Risk Event, Desk Query)
2. **Workflow / Stage** - Lifecycle control
3. **Task** - Actionable unit of work
4. **Artifact** - Documents, data, evidence (versioned)
5. **Audit Event** - Immutable history (human + agent)

### Work Item Modes
- **Approval** (NPA): Linear stages, sign-offs
- **Monitoring** (Risk): Continuous surveillance
- **Recurring**: Periodic obligations
- **Reporting**: Data aggregation
- **Exception** (Desk Query): Ticket-based resolution

---

## 5. Tech Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| Angular | 20.0.0 | Core framework (standalone components) |
| TypeScript | 5.9.2 | Type system |
| TailwindCSS | 3.4.19 | Utility-first styling |
| Lucide Angular | 0.562.0 | Icon library |
| ngx-markdown | 20.1.0 | Markdown rendering |
| RxJS | 7.8.0 | Reactive programming |
| Vitest | 3.0.0 | Testing |

### Backend / AI Platform
| Technology | Purpose |
|------------|---------|
| **Dify** (Cloud -> Self-hosted) | Agent framework (Chatflows + Workflows-as-Tools) |
| **MariaDB** | Relational database (12 core data-only tables) |
| **MCP Servers** | Bridge layer connecting Dify <-> MariaDB <-> Angular frontend |
| **Redis** (planned) | Cache for prohibited lists, hot data |
| **External APIs** (planned) | OFAC, MAS, Bloomberg |

### MCP (Model Context Protocol) Architecture
```
Angular Frontend <--HTTP/SSE--> MCP Server(s) <---> Dify Cloud API
                                    |
                                    +-----------> MariaDB
                                    |
                                    +-----------> File Storage (docs/artifacts)
```

MCP servers act as the middleware/API layer, eliminating the need to build custom REST APIs:
- **Dify MCP Server**: Proxies agent conversations, manages sessions, streams responses
- **Database MCP Server**: CRUD operations on MariaDB (NPA records, audit logs, approvals)
- **Utility MCP Servers**: File handling, notifications, health checks

### Deployment
| Technology | Purpose |
|------------|---------|
| GitHub Pages | Current frontend deployment target |
| angular-cli-ghpages | Frontend deployment tooling |
| Corporate internal environment | Final deployment target (code shipped, integration handled elsewhere) |
| No CI/CD pipeline yet | No `.github/workflows` directory |

### Key Architecture Decisions
- **LLM-First, Zero-Code Business Logic**: All business rules live in Knowledge Bases (markdown), NOT in code or database triggers. Database stores only data.
- **Dify Strategy**: Orchestrators as Chatflows, Functional Agents as Workflows-turned-Tools
- **MariaDB (confirmed)**: Enterprise-grade relational DB; compatible with corporate environment
- **MCP Servers as middleware**: Frontend and Dify both communicate through MCP servers to the database
- **27 Knowledge Bases**: 4 Global + 13 Domain + 10 Agent-specific
- **Vector search**: Since MariaDB doesn't have native vector support, RAG/vector search will be handled by Dify's built-in Knowledge Base retrieval (embedding + similarity search within Dify itself)

---

## 6. Current Progress

### What's Built (Frontend)
- **Application Shell**: Main layout with sidebar, top bar, routing
- **Command Center**: Home dashboard page
- **NPA Dashboard**: With sub-components:
  - `npa-dashboard.component.ts` - Main NPA control tower
  - `npa-pipeline-table.component.ts` - Pipeline tracking
  - `npa-process-tracker.component.ts` - Process tracking
  - `agent-health-panel.component.ts` - Agent health monitoring
  - `capability-card.component.ts` - Agent capability cards
  - `sub-agent-card.component.ts` - Sub-agent status
  - `work-item-list.component.ts` - Work item management
- **Chat Interface**: `chat-interface/` and `ideation-chat/` components
- **Source Inspector**: Recently added (latest commit)
- **Common Components**: Audit log, stage progress
- **Dify Service Integration**: Mock + real API support
  - `dify.service.ts` - Message sending with mock mode
  - `dify-agent.service.ts` - Agent capabilities & health metrics
- **Mock Data**: Full mock infrastructure for development without backend
- **Routing**: Lazy-loaded routes for NPA agent, COO NPA dashboard, workbench sections

### What's Built (Documentation & Knowledge Bases)
- **23 developer KB documents** in `Context/KB/`
- **10 production-ready Dify Agent KB files** in `Context/Dify_Agent_KBs/`
- **6 business logic KB documents** in `docs/` (Classification Rules, Approval Matrix, State Machine, Templates, Policies)
- **Database schema** defined (15 core tables)
- **Complete system specification** with end-to-end journey (Sarah's $75M FX Option)
- **UI/UX action plan** with 5-level navigation design
- **Dify Agent Creation Guide** with phase-by-phase instructions

### What's NOT Built Yet
- **MCP Server layer**: No MCP servers connecting frontend <-> Dify <-> MariaDB
- **MariaDB instance**: No database provisioned or schema created
- **Dify agent deployment**: Agents designed but not deployed on Dify platform
- **Real data flow**: Currently using mock data throughout
- **Authentication**: No login gate (basic auth needed)
- **CI/CD pipeline**: No automated build/deploy
- **Testing**: Vitest configured but test coverage unclear
- **NPA Template Editor**: Page exists but completeness unknown
- **Checker/Approver queues**: Designed in UI/UX plan but not implemented
- **KPI dashboard with real metrics**: Mock metrics only
- **Cross-function collaboration**: Only NPA vertical started

---

## 7. Project Checklist

### Phase 1: NPA Pilot (Current Focus)

#### Frontend
- [x] Application shell and routing
- [x] Command Center dashboard
- [x] NPA Dashboard with pipeline view
- [x] Chat interface for ideation
- [x] Agent health and capability cards
- [x] Source Inspector
- [x] Mock data infrastructure
- [ ] NPA Template Editor (47-field form with green/yellow/red indicators)
- [x] Checker Review Queue (Level 4 in UI/UX plan)
- [x] Approver Sign-Off Queue (Level 5 in UI/UX plan)
- [x] Role-based views (Maker vs Checker vs Approver)
- [ ] Real-time WebSocket updates
- [ ] SLA countdown timers
- [ ] Aging analysis table
- [ ] KPI dashboard with drill-down
- [ ] NPA Pipeline Kanban view

#### Backend / Integration (MariaDB + MCP Architecture)
- [ ] MariaDB instance setup (local or cloud)
- [ ] Create 12-table schema from `docs/database_schema.md`
- [ ] MariaDB MCP Server (CRUD for NPAs, approvals, audit logs)
- [ ] Dify MCP Server (proxy agent API, manage sessions)
- [ ] Dify agent deployment (8 agents + 2 orchestrators as Chatflows/Workflows)
- [ ] Connect frontend to MCP servers (replace mock services)
- [ ] Upload KBs to Dify for vector search (Dify handles embeddings natively)
- [ ] Basic auth MCP middleware (simple login gate)
- [ ] Audit logging through MCP to MariaDB
- [ ] File handling MCP server (document upload/storage)

#### Knowledge Bases & AI
- [x] 10 Dify Agent KB files (production-ready, scored 9/10)
- [x] 6 business logic KBs (Classification, Approval Matrix, State Machine, Templates, Policies)
- [x] Database schema design
- [ ] Upload KBs to Dify platform
- [ ] Configure agent-KB mappings in Dify
- [ ] Train/deploy ML prediction model (XGBoost on historical data)
- [ ] Prohibited list integration (OFAC, MAS, internal)
- [ ] Historical NPA data ingestion for RAG

#### DevOps
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Environment configuration (dev/staging/prod)
- [ ] Supabase provisioning
- [ ] Dify instance provisioning
- [ ] Monitoring and alerting

### Phase 2: Expansion (Future)
- [ ] Desk Support Agent integration (ROBO)
- [ ] DCE Agent integration (DEGA)
- [ ] Cross-function Work Item dependencies
- [ ] Mobile-responsive views

---

## 8. Key Decisions (Resolved)

| # | Question | Decision | Implications |
|---|----------|----------|--------------|
| 1 | **Dify Hosting** | Dify Cloud for initial testing; self-hosted in corporate env later | Use Dify Cloud API for POC, design for portability |
| 2 | **Database** | **MariaDB** (confirmed, non-negotiable) | MCP servers handle API layer; Dify handles vector search internally |
| 3 | **Deployment** | Corporate internal environment; ship code, integration handled elsewhere | Build locally, test locally, package for handoff |
| 4 | **Authentication** | Basic auth for now (no SSO yet); explore SSO integration for future | Implement simple login gate; document SSO requirements |
| 5 | **Historical NPA Data** | No access; mock realistic data for user story flow | Create 5-10 synthetic NPAs matching Sarah's Journey narrative |
| 6 | **ML Model** | Aspirational but needs to work in POC | Simulate ML predictions with realistic mock responses from Dify agent |
| 7 | **Prohibited Lists** | Mock for now; integration-friendly architecture | Build mock service with clean interface for future OFAC/MAS API swap |
| 8 | **Project Purpose** | Funding prototype to secure buy-in | Visual polish + narrative flow > production robustness |
| 9 | **Mock vs Real** | Mock until DB is done; phase-wise integration | Frontend services abstracted with interfaces for easy swap |
| 10 | **Agent Priority** | ALL 8 NPA agents + Utility agents must work | High ambition - all agents operational for demo |
| 11 | **Design System** | Current Tailwind + Lucide is fine | No corporate design system constraint |
| 12 | **Figma** | No Figma designs; not needed | Build directly from UI/UX action plan document |
| 13 | **Mobile** | Not needed for first version | Desktop-only for funding demo |
| 14 | **Timeline** | **Feb 26, 2026** (17 days from today) | Extremely tight - needs aggressive prioritization |
| 15 | **Team** | Effectively solo (other dev exists but treat as solo) | Every feature choice must be weighed against time |
| 16 | **Budget** | No constraints on third-party services | Can use Dify Cloud, any DB hosting freely |

### MariaDB + MCP Server Stack

Since MariaDB is confirmed, here's the tech stack needed to replace what Supabase would have provided:

| Capability | Supabase (not using) | MariaDB + MCP Approach |
|------------|---------------------|----------------------|
| Database | PostgreSQL (built-in) | **MariaDB** (local or cloud) |
| REST API | PostgREST (auto-generated) | **MCP Database Server** (handles CRUD) |
| Vector search / RAG | pgvector | **Dify's built-in KB retrieval** (embeddings stored in Dify) |
| Real-time updates | Realtime subscriptions | **MCP Server + SSE/polling** from frontend |
| Authentication | Supabase Auth | **Basic auth** (custom MCP auth middleware) |
| File storage | Supabase Storage | **Local file system / MCP File Server** |

**Required MCP Servers for the project:**

| MCP Server | Purpose | Priority |
|------------|---------|----------|
| **MariaDB MCP Server** | CRUD operations: NPAs, approvals, audit logs, users | HIGH - needed for real data |
| **Dify MCP Server** | Proxy Dify agent API calls, manage conversations | HIGH - needed for agent integration |
| **File MCP Server** | Document upload/download, artifact management | MEDIUM - can mock initially |
| **Auth MCP Server** | Basic authentication, session management | MEDIUM - simple gate for demo |

**MariaDB Schema Notes:**
- The 12-table schema from `docs/database_schema.md` is MariaDB-compatible (standard SQL)
- Key difference: No native JSON column type in older MariaDB - use `LONGTEXT` with JSON validation or upgrade to MariaDB 10.2+ which supports `JSON` type
- No native vector columns - all vector/embedding operations handled by Dify's Knowledge Base engine
- Indexes needed: `npa_id`, `status`, `stage`, `maker_id`, `created_at` for dashboard queries

---

## 9. Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| **17 days to Feb 26 deadline** | CRITICAL | CERTAIN | Ruthless prioritization; mock where real isn't ready; focus on demo narrative |
| All 8 agents must work (ambitious) | HIGH | HIGH | Deploy on Dify Cloud; use KBs already written; accept imperfect responses |
| No backend/DB infrastructure | HIGH | HIGH | Use Supabase Cloud (fastest setup) unless MariaDB decision blocks this |
| MariaDB needs MCP server layer (more work than Supabase) | MEDIUM | CERTAIN | MCP servers replace Supabase's built-in API; budget 2-3 days for setup |
| Solo developer | HIGH | CERTAIN | Leverage Dify's no-code agent builder; don't build custom backend APIs |
| No historical NPA data | MEDIUM | CERTAIN | Create 5-10 synthetic NPAs; enough for demo narrative |
| Mock data throughout | LOW | CERTAIN | Acceptable for funding demo; audience cares about the story not the plumbing |
| No CI/CD | LOW | HIGH | Not needed for funding demo; local build + ship code |

---

## 10. Recommended Sprint Plan (Feb 9 - Feb 26 = 17 days)

### Week 1 (Feb 9 - Feb 15): Foundation + Agents

**Day 1-2: Infrastructure + Dify Setup**
- Set up MariaDB instance (local Docker or cloud)
- Create database schema (12 tables from `docs/database_schema.md`)
- Set up Dify Cloud account
- Deploy Product Ideation Agent (first agent) with KBs:
  - `KB_Ideation_Agent.md`
  - `KB_NPA_Classification_Rules.md`
  - `KB_NPA_Policies.md`
- Test agent conversation flow end-to-end in Dify

**Day 3-5: Deploy All 8 Agents on Dify**
- Classification Router Agent + `KB_Classification_Agent.md`
- Template Auto-Fill Agent + `KB_Template_Autofill_Agent.md`
- KB Search Agent + `KB_Search_Agent.md`
- ML Prediction Agent + `KB_ML_Prediction.md`
- Conversational Diligence Agent + `KB_Conversational_Diligence.md`
- Approval Orchestration (Governance Agent) + `KB_Governance_Agent.md`
- Risk Agent + `KB_Risk_Agent.md`
- NPA Domain Orchestrator + `KB_Domain_Orchestrator_NPA.md`
- Master COO Orchestrator + `KB_Master_COO_Orchestrator.md`

**Day 5-7: Wire Frontend via MCP Servers**
- Set up MCP server layer:
  - Dify MCP Server (proxy agent conversations to Dify Cloud)
  - MariaDB MCP Server (CRUD operations for NPA data)
- Update `dify.service.ts` to call Dify via MCP server
- Implement SSE streaming for chat responses
- Connect ideation-chat component to live agent
- Test full conversational flow: Frontend -> MCP -> Dify -> Agent -> Response

### Week 2 (Feb 16 - Feb 22): UI Completeness + Polish

**Day 8-10: Build Missing UI Components**
- NPA Template Editor (47-field form with green/yellow/red status)
- Approval dashboard with mock sign-off progress
- Basic auth gate (simple login page)
- Create 5-10 synthetic NPA records for mock data

**Day 11-12: Polish Existing Dashboard**
- Command Center visual polish
- NPA Dashboard KPI cards (impressive numbers)
- Pipeline table with realistic data
- Agent health panel connected to Dify health (or mocked)

**Day 13-14: Navigation + Flow**
- Ensure smooth flow: Command Center -> NPA Dashboard -> Create NPA -> Template -> Approvals
- Add breadcrumb navigation
- Fix any routing issues
- Responsive refinements (desktop only, but clean)

### Week 3 (Feb 23 - Feb 26): Demo Prep

**Day 15-16: Demo Script + Testing**
- Walk through the 5-7 minute demo script end-to-end
- Fix any broken flows or visual glitches
- Prepare synthetic data for demo narrative (Sarah's $75M FX Option)
- Test Dify agent responses for demo scenarios

**Day 17 (Feb 26): Demo Day**
- Final smoke test
- Demo delivery

### Parallel Track (Ongoing): Database Integration
- Seed MariaDB with synthetic NPA data (5-10 records for demo)
- Phase-wise replace mock services with real MCP -> MariaDB calls
- Priority order: NPA list/detail first, then approvals, then audit log
- Post-demo: build remaining MCP endpoints for full CRUD

---

## 11. File Reference Index

### Key Source Files
| File | Purpose |
|------|---------|
| `src/app/app.routes.ts` | Route definitions (all pages) |
| `src/app/services/dify/dify.service.ts` | Dify API integration (mock + real) |
| `src/app/services/dify/dify-agent.service.ts` | Agent capabilities & health |
| `src/app/components/npa/dashboard/npa-dashboard.component.ts` | NPA Control Tower |
| `src/app/components/npa/chat-interface/` | Chat UI for agent interaction |
| `src/app/components/npa/ideation-chat/` | Ideation flow chat |
| `src/app/lib/mock-data.ts` | All mock data |
| `src/app/pages/command-center/` | Home dashboard |
| `src/app/pages/coo-npa/` | COO NPA control tower page |

### Key Documentation Files
| File | Purpose |
|------|---------|
| `Context/KB/01_Project_Vision.md` | Vision, objectives, roadmap |
| `Context/KB/02_Architecture.md` | Frozen architecture (v1.0) |
| `Context/KB/NPA_Complete_System_Summary_Journey.md` | End-to-end journey spec |
| `Context/KB/NPA_Agent_UI_UX_Action_Plan.md` | 5-level UI/UX design |
| `docs/Dify_KB_Strategy_FINAL_LLM_First.md` | LLM-first KB strategy |
| `docs/database_schema.md` | Database schema (15 tables) |
| `docs/Dify_Agent_Creation_Guide.md` | Agent setup guide for Dify |
| `docs/KB_NPA_State_Machine.md` | 19-state workflow machine |
| `docs/KB_NPA_Classification_Rules.md` | Two-stage classification logic |
| `docs/KB_NPA_Approval_Matrix.md` | Approval tiers and sign-off rules |
| `docs/KB_NPA_Templates.md` | 47-field template specifications |

---

## 12. API Contracts (Frontend <-> MCP Servers <-> Backend)

These are the API contracts between the Angular frontend and the MCP server layer. MCP servers act as the middleware, routing requests to either Dify Cloud (for agent conversations) or MariaDB (for data persistence). For the funding prototype, many endpoints can be mocked in the frontend service layer while MCP servers are being built.

**Data Flow:**
```
Angular Frontend --HTTP/SSE--> MCP Servers ---> Dify Cloud API (agents, KBs)
                                    |
                                    +---------> MariaDB (NPA records, audit, approvals)
```

### 12.1 Dify Agent API (Chat / Conversation)

**Base URL:** `{DIFY_BASE_URL}/v1`

#### Send Message to Agent
```
POST /chat-messages
Headers:
  Authorization: Bearer {DIFY_API_KEY}
  Content-Type: application/json

Request Body:
{
  "inputs": {},
  "query": "I want to trade a vanilla FX option on GBP/USD",
  "response_mode": "streaming",       // "streaming" | "blocking"
  "conversation_id": "abc-123",       // empty for new conversation
  "user": "user-vikramaditya",
  "files": []                         // optional file uploads
}

Response (streaming - SSE):
data: {"event": "message", "message_id": "msg-001", "conversation_id": "abc-123", "answer": "Got it! An FX Option...", "created_at": 1703721600}
data: {"event": "agent_thought", "id": "thought-001", "thought": "Extracting product type...", "tool": "classification_router", "tool_input": "{...}"}
data: {"event": "message_end", "metadata": {"usage": {"tokens": 450}}}

Response (blocking):
{
  "message_id": "msg-001",
  "conversation_id": "abc-123",
  "answer": "Got it! An FX Option on GBP/USD...",
  "metadata": {
    "usage": {"prompt_tokens": 200, "completion_tokens": 250},
    "retriever_resources": [
      {"dataset_id": "kb-001", "document_name": "KB_NPA_Classification_Rules.md", "score": 0.92}
    ]
  },
  "created_at": 1703721600
}
```

#### Get Conversation History
```
GET /messages?conversation_id={id}&user={user_id}&limit=20&first_id={cursor}

Response:
{
  "data": [
    {
      "id": "msg-001",
      "conversation_id": "abc-123",
      "query": "I want to trade a vanilla FX option",
      "answer": "Got it! An FX Option...",
      "created_at": 1703721600,
      "feedback": null
    }
  ],
  "has_more": false
}
```

### 12.2 NPA CRUD API (Supabase / Custom Backend)

#### List NPAs (Dashboard / Pipeline)
```
GET /api/npas?status={status}&desk={desk}&page={page}&limit={limit}

Response:
{
  "data": [
    {
      "id": "TSG2025-042",
      "product_name": "FX Put Option GBP/USD",
      "product_type": "FX_OPTION",
      "asset_class": "FX",
      "business_unit": "Treasury & Markets",
      "desk": "Singapore FX",
      "maker": { "id": "user-001", "name": "Sarah Lim", "email": "sarah.lim@dbs.com" },
      "classification": "EXISTING_VARIATION",
      "approval_track": "NPA_LITE",
      "status": "SIGN_OFF",
      "stage": "Pending_Approvals",
      "notional": 75000000,
      "currency": "USD",
      "counterparty_rating": "A-",
      "auto_fill_coverage": 0.78,
      "prediction": {
        "approval_likelihood": 0.78,
        "predicted_timeline_days": 4.2,
        "bottleneck": "Finance"
      },
      "approvals": {
        "total": 6,
        "completed": 4,
        "pending": 2
      },
      "created_at": "2025-12-16T09:42:00Z",
      "updated_at": "2025-12-17T16:00:00Z"
    }
  ],
  "total": 23,
  "page": 1,
  "limit": 10
}
```

#### Get NPA Detail
```
GET /api/npas/{npa_id}

Response:
{
  "id": "TSG2025-042",
  "product_name": "FX Put Option GBP/USD",
  "template_type": "NPA_LITE",
  "status": "SIGN_OFF",
  "stage": "Pending_Approvals",

  "product_attributes": {
    "product_type": { "value": "FX Option", "source": "ai_extracted", "confidence": 0.95 },
    "underlying": { "value": "GBP/USD", "source": "ai_extracted", "confidence": 0.99 },
    "notional": { "value": 75000000, "source": "user_input", "confidence": 1.0 },
    "tenor": { "value": "6 months", "source": "user_input", "confidence": 1.0 },
    "strike_price": { "value": 1.2750, "source": "user_input", "confidence": 1.0 },
    "counterparty_rating": { "value": "A-", "source": "user_input", "confidence": 1.0 }
  },

  "template_fields": [
    {
      "field_id": "F001",
      "section": "Product Overview",
      "name": "Product Name",
      "value": "FX Put Option GBP/USD Vanilla",
      "fill_status": "auto_verified",    // "auto_verified" | "auto_review" | "manual_required" | "manual_filled"
      "source_npa": "TSG1917",
      "confidence": 0.94
    }
    // ... 46 more fields
  ],

  "documents": [
    {
      "id": "doc-001",
      "name": "Term_Sheet_GBP_USD.pdf",
      "category": "Product Specification",
      "size_bytes": 245000,
      "validation_status": "valid",
      "uploaded_at": "2025-12-16T09:15:00Z"
    }
  ],

  "approvals": [
    {
      "department": "Credit",
      "approver": { "id": "user-002", "name": "Jane Tan" },
      "status": "approved",
      "sla_deadline": "2025-12-18T14:00:00Z",
      "completed_at": "2025-12-17T10:30:00Z",
      "comments": "A- counterparty, daily collateral. Approved."
    },
    {
      "department": "Finance VP",
      "approver": { "id": "user-002", "name": "Jane Tan" },
      "status": "pending",
      "sla_deadline": "2025-12-18T16:00:00Z",
      "completed_at": null,
      "depends_on": "Finance"
    }
  ],

  "workflow_history": [
    {
      "from_state": "Draft",
      "to_state": "Pending_Classification",
      "triggered_by": "user-001",
      "timestamp": "2025-12-16T09:42:00Z"
    }
  ],

  "agent_activity": [
    {
      "agent": "Classification Router",
      "action": "classify_product",
      "input_summary": "FX Option GBP/USD, $75M, A-",
      "output_summary": "EXISTING (Variation), NPA Lite",
      "confidence": 0.88,
      "latency_ms": 2800,
      "timestamp": "2025-12-16T09:12:00Z"
    }
  ],

  "similar_npas": [
    {
      "npa_id": "TSG1917",
      "similarity_score": 0.94,
      "product_name": "FX Option EUR/USD",
      "status": "ACTIVE",
      "approved_at": "2024-12-04T00:00:00Z",
      "timeline_days": 3
    }
  ]
}
```

#### Create NPA (from Ideation)
```
POST /api/npas

Request Body:
{
  "conversation_id": "abc-123",        // Dify conversation that generated this
  "template_type": "NPA_LITE",
  "product_name": "FX Put Option GBP/USD Vanilla",
  "classification": "EXISTING_VARIATION",
  "approval_track": "NPA_LITE",
  "product_attributes": { ... },
  "template_fields": [ ... ],
  "similar_npa_id": "TSG1917"
}

Response:
{
  "id": "TSG2025-042",
  "status": "DRAFT",
  "created_at": "2025-12-16T09:42:00Z"
}
```

#### Update NPA Status (State Transition)
```
PATCH /api/npas/{npa_id}/transition

Request Body:
{
  "action": "submit_for_checker",      // matches state machine transitions
  "comment": "Ready for review"
}

Response:
{
  "id": "TSG2025-042",
  "previous_state": "Draft",
  "new_state": "Pending_Classification",
  "transitioned_at": "2025-12-16T09:42:00Z"
}
```

### 12.3 Dashboard KPIs API
```
GET /api/dashboard/kpis?period={7d|30d|quarter|all}

Response:
{
  "pipeline": {
    "draft": 8,
    "checker_review": 3,
    "sign_off": 7,
    "launch_prep": 2,
    "launched_this_week": 3
  },
  "kpis": {
    "approval_rate": 0.95,
    "avg_timeline_days": 4.2,
    "loop_back_rate": 0.2,
    "auto_fill_coverage": 0.78,
    "doc_completeness_first_submit": 0.89,
    "ml_prediction_accuracy": 0.92
  },
  "aging_npas": [
    {
      "npa_id": "TSG2025-820",
      "product_name": "EUR/USD Swap",
      "days_elapsed": 9,
      "stage": "Sign-Off",
      "issue": "Finance VP pending 3 days",
      "severity": "critical"
    }
  ],
  "top_performers": [
    {
      "npa_id": "TSG2025-042",
      "product_name": "FX Put Option GBP/USD",
      "notional": 75000000,
      "estimated_revenue": 2300000,
      "timeline_days": 1.1
    }
  ]
}
```

### 12.4 Agent Health API
```
GET /api/agents/health

Response:
{
  "agents": [
    {
      "id": "ideation-agent",
      "name": "Product Ideation Agent",
      "status": "healthy",
      "uptime_percent": 99.8,
      "avg_response_ms": 1200,
      "requests_24h": 47,
      "error_rate": 0.02,
      "capabilities": [
        { "name": "Create New NPA", "metric": "78% auto-fill", "status": "active" },
        { "name": "Find Similar NPAs", "metric": "94% match rate", "status": "active" }
      ]
    }
  ]
}
```

### 12.5 Audit Log API
```
GET /api/npas/{npa_id}/audit?page={page}&limit={limit}

Response:
{
  "data": [
    {
      "id": "audit-001",
      "npa_id": "TSG2025-042",
      "actor_type": "agent",              // "human" | "agent" | "system"
      "actor_id": "classification-router",
      "action": "classify_product",
      "input": "FX Option GBP/USD, $75M, A-, Singapore->HK",
      "output": "EXISTING (Variation), NPA Lite, Confidence: 88%",
      "confidence": 0.88,
      "evidence_refs": ["KB_NPA_Classification_Rules.md:Section_3.2"],
      "timestamp": "2025-12-16T09:12:00Z"
    }
  ]
}
```

### 12.6 Prototype Strategy: Mock vs Real

For the **funding prototype** (all 8 agents must work, Feb 26 deadline):

| API | Strategy | Rationale |
|-----|----------|-----------|
| Dify Chat (`/chat-messages`) | **Real Dify Cloud** (all 8 agents) | All agents deployed on Dify; real AI conversations |
| NPA CRUD (`/api/npas`) | **Mock service** (swap to DB post-demo) | Complex to build; mock data tells the story |
| Dashboard KPIs (`/api/dashboard/kpis`) | **Mock service** | Static impressive numbers are fine for demo |
| Agent Health (`/api/agents/health`) | **Mock + Dify API** | Pull real uptime from Dify where possible |
| Audit Log (`/api/npas/{id}/audit`) | **Mock service** | Pre-scripted audit trail for demo narrative |

**Minimum viable backend for funding demo:**
1. All 8 Dify agents deployed on Dify Cloud with appropriate KBs attached
2. NPA Domain Orchestrator as Chatflow, functional agents as Workflow-Tools (per Dify Agent Creation Guide)
3. Frontend mock services for CRUD/KPIs/Audit, with realistic data matching "Sarah's Journey"
4. Basic auth gate (simple username/password) to prevent unauthorized access

---

## 13. Funding Prototype Strategy

### What Makes a Convincing Funding Demo

For a funding prototype, the audience (leadership/sponsors) cares about:

1. **The narrative** - Sarah's 12-day-to-1.1-day journey must be walkable
2. **Visual polish** - Dashboard must look like a real product, not a dev prototype
3. **AI wow factor** - ALL 8 agents working with real AI conversations
4. **Scale potential** - Show the 7-function roadmap, not just NPA
5. **Numbers** - KPIs and ROI estimates must be prominent
6. **Orchestration** - Agents calling other agents, not just chat

### Recommended Demo Script (5-7 minutes)

1. **Open Command Center** (30s) - Show the unified workbench vision across 7 COO functions
2. **Click NPA Agent** (30s) - Show dashboard with pipeline, KPIs, aging NPAs
3. **Create New NPA** (2-3 min) - Live conversation with Ideation Agent calling sub-agents:
   - Prohibited List Checker fires instantly (compliance gate)
   - Classification Router determines product type + approval track
   - KB Search finds similar historical NPAs
   - ML Prediction shows approval likelihood + timeline + bottlenecks
4. **Show auto-filled template** (1 min) - Green/yellow/red indicators, 78% coverage from Template Auto-Fill
5. **Show approval dashboard** (1 min) - Parallel sign-offs, SLA timers, Approval Orchestration at work
6. **Show audit trail** (30s) - Every agent action logged with evidence, confidence scores
7. **Close with KPIs** (30s) - 67% time reduction, 44% quality improvement, 15K hours saved

### Critical Path for Demo Readiness (Feb 26)
1. Deploy all 8 agents on Dify Cloud with KBs (Week 1)
2. Wire chat interface to real Dify API with SSE streaming (Week 1)
3. Build NPA Template Editor view with mock auto-fill data (Week 2)
4. Polish existing dashboard UI + add missing components (Week 2)
5. Create synthetic NPA data matching Sarah's Journey (Week 2)
6. End-to-end demo rehearsal + fix flow issues (Week 3)

### SSO Integration Notes (For Future State)
The owner asked about SSO integration with the bank's identity provider. Key requirements:
- **Protocol:** SAML 2.0 or OIDC (most banking IdPs support both)
- **Implementation:** Angular OIDC client library (`angular-auth-oidc-client`)
- **Flow:** Redirect to bank IdP -> authenticate -> return with JWT token -> Angular guards
- **For POC:** Basic auth is sufficient (username/password stored in environment config)
- **For Production:** Would need: IdP metadata URL, client ID/secret, callback URL registration, role mapping from AD groups to Maker/Checker/Approver roles

---

## 14. IMMEDIATE NEXT STEPS (Action Document)

**Date:** Feb 9, 2026
**Deadline:** Feb 26, 2026 (17 days)
**Constraint:** Solo developer, funding prototype, all 8 NPA agents must work

### The 3 Parallel Workstreams

Given the tight timeline, work should happen across 3 parallel tracks. Each can be progressed independently and merged together in Week 3.

---

### TRACK A: Dify Agents (The AI Brain) - HIGHEST PRIORITY

**Why first:** This is the core value proposition. Without working agents, there's no demo. Dify Cloud is no-code, so agents can be built quickly using the existing KB files.

**Step A1: Dify Cloud Setup** (Today)
- Create Dify Cloud account at https://cloud.dify.ai
- Familiarize with the Chatflow and Workflow builder
- Understand the "Workflows as Tools" pattern from `docs/Dify_Agent_Creation_Guide.md`

**Step A2: Upload Knowledge Bases** (Today/Tomorrow)
Upload these files as Dify Datasets (Knowledge Bases):
1. `Context/Dify_Agent_KBs/KB_Ideation_Agent.md`
2. `Context/Dify_Agent_KBs/KB_Classification_Agent.md`
3. `Context/Dify_Agent_KBs/KB_Template_Autofill_Agent.md`
4. `Context/Dify_Agent_KBs/KB_Search_Agent.md`
5. `Context/Dify_Agent_KBs/KB_ML_Prediction.md`
6. `Context/Dify_Agent_KBs/KB_Conversational_Diligence.md`
7. `Context/Dify_Agent_KBs/KB_Governance_Agent.md`
8. `Context/Dify_Agent_KBs/KB_Risk_Agent.md`
9. `Context/Dify_Agent_KBs/KB_Domain_Orchestrator_NPA.md`
10. `Context/Dify_Agent_KBs/KB_Master_COO_Orchestrator.md`

Plus the business logic KBs:
11. `docs/KB_NPA_Classification_Rules.md`
12. `docs/KB_NPA_Approval_Matrix.md`
13. `docs/KB_NPA_State_Machine.md`
14. `docs/KB_NPA_Templates.md`
15. `docs/KB_NPA_Policies.md`

**Step A3: Build 8 Functional Agent Workflows** (Days 2-4)
Per `docs/Dify_Agent_Creation_Guide.md`, build these as **Workflows** (which become Tools):

| # | Agent Workflow | Attach KBs | Key Behavior |
|---|---------------|-----------|--------------|
| 1 | Product Ideation | KB_Ideation_Agent, KB_NPA_Policies | 6-step conversational interview, entity extraction |
| 2 | Classification Router | KB_Classification_Agent, KB_NPA_Classification_Rules | 2-stage classification: Product Type -> Approval Track |
| 3 | Template Auto-Fill | KB_Template_Autofill_Agent, KB_NPA_Templates | Map answers to 47 fields, return green/yellow/red status |
| 4 | KB Search | KB_Search_Agent | Semantic search for similar historical NPAs |
| 5 | ML Prediction | KB_ML_Prediction | Return approval likelihood, timeline, bottlenecks |
| 6 | Conversational Diligence | KB_Conversational_Diligence, KB_NPA_Policies | Q&A on NPA process, policy guidance |
| 7 | Governance/Approval | KB_Governance_Agent, KB_NPA_Approval_Matrix | Approval orchestration rules, SLA tracking |
| 8 | Risk Agent | KB_Risk_Agent | Risk assessment, prohibited list checking |

**Step A4: Build NPA Domain Orchestrator Chatflow** (Day 5)
- Create as a **Chatflow** (not Workflow)
- Add all 8 agent workflows as **Tools** available to this Chatflow
- Attach `KB_Domain_Orchestrator_NPA.md` as the orchestration knowledge
- The orchestrator decides which agent to call based on conversation context
- Test with Sarah's Journey scenario: "I want to trade a vanilla FX option on GBP/USD"

**Step A5: Build Master COO Orchestrator Chatflow** (Day 5-6)
- Wraps the NPA Orchestrator
- Routes to NPA domain (only domain for now)
- Attach `KB_Master_COO_Orchestrator.md`

**Deliverable:** All 8 agents callable through a single Dify Chatflow, tested with Sarah's Journey scenario.

---

### TRACK B: Frontend Polish & New Components (The Visual Shell)

**Why parallel:** Frontend work doesn't depend on Dify or MariaDB. Can use existing mock data.

**Step B1: Audit Existing UI State** (Today)
- Run the Angular app locally: `ng serve`
- Walk through every page and note what's broken/incomplete
- Screenshot current state for baseline

**Step B2: Build NPA Template Editor** (Days 2-5)
This is the most critical missing UI component. It should display:
- 47 fields organized in 10 collapsible sections (from `docs/KB_NPA_Templates.md`)
- Color-coded fill status: Green (auto-filled verified), Yellow (auto-filled review needed), Red (manual input required)
- Source attribution: "Copied from TSG1917" or "AI-generated, confidence: 88%"
- Use mock data initially - populate with Sarah's $75M FX Option values

**Step B3: Polish Command Center Dashboard** (Days 6-7)
- KPI cards with impressive numbers (from the target metrics)
- Pipeline summary (Draft: 8, Review: 3, Sign-Off: 7, etc.)
- Agent health panel showing all 8 agents as "healthy"

**Step B4: Polish NPA Dashboard** (Days 7-8)
- Pipeline table with 5-10 synthetic NPA records
- Aging analysis with color-coded severity
- Working navigation: click NPA row -> detail view

**Step B5: Basic Auth Gate** (Day 9)
- Simple login page (username/password)
- Hardcoded credentials for demo (e.g., `sarah.lim` / `demo2026`)
- Angular route guard to redirect unauthenticated users
- No backend auth needed - client-side gate sufficient for funding demo

**Step B6: Approval Dashboard View** (Days 10-11)
- Show 6 approver cards with status (approved/pending/rejected)
- SLA countdown timers
- Mock data matching Sarah's Journey Day 2 approval flow

**Deliverable:** Complete frontend flow from login -> Command Center -> NPA Dashboard -> Create NPA -> Template Editor -> Approval Dashboard, all navigable with polished visuals.

---

### TRACK C: MCP Servers & MariaDB (The Data Backbone)

**Why last priority for demo:** Mock data in the frontend services is sufficient for the funding demo. Real DB integration adds credibility but isn't blocking.

**Step C1: MariaDB Setup** (Days 3-4)
- Install MariaDB locally (Docker recommended: `docker run -d -p 3306:3306 mariadb`)
- Create database: `CREATE DATABASE coo_workbench;`
- Run schema from `docs/database_schema.md` (adapt Supabase types to MariaDB)
- Seed with 5-10 synthetic NPA records

**Step C2: MariaDB MCP Server** (Days 5-7)
- Build Node.js MCP server with `mysql2` driver
- Implement key operations:
  - `list_npas` (for dashboard pipeline)
  - `get_npa_detail` (for NPA detail view)
  - `create_npa` (for new NPA from ideation)
  - `update_npa_status` (for state transitions)
  - `get_audit_log` (for audit trail)
- Expose as MCP tool server

**Step C3: Dify MCP Server** (Days 7-9)
- Build Node.js MCP server that proxies to Dify Cloud API
- Handle SSE streaming from Dify -> frontend
- Manage conversation sessions (conversation_id tracking)
- API key management (don't expose Dify key to frontend)

**Step C4: Connect Frontend to MCP** (Days 10-12)
- Update Angular services to call MCP servers instead of mock data
- Phase 1: Wire chat interface to Dify MCP server (highest impact)
- Phase 2: Wire NPA list/detail to MariaDB MCP server
- Phase 3: Keep KPIs/health/audit as mock (acceptable for demo)

**Deliverable:** At minimum, live Dify agent conversations through MCP. Ideally, NPA data from MariaDB too.

---

### Week-by-Week Summary

| Week | Track A (Dify Agents) | Track B (Frontend) | Track C (MCP + DB) |
|------|----------------------|-------------------|-------------------|
| **Week 1** (Feb 9-15) | Upload KBs, build all 8 workflows, build orchestrator chatflows, test | Audit UI, build Template Editor, start dashboard polish | Set up MariaDB, create schema, seed data |
| **Week 2** (Feb 16-22) | Refine agent responses, test full Sarah's Journey flow | Polish dashboards, build auth gate, build approval view | Build MCP servers, wire chat to Dify |
| **Week 3** (Feb 23-26) | Final agent tuning | Navigation flow testing, visual polish | Connect remaining endpoints (if time) |

---

### TODAY's Immediate Actions (Feb 9)

1. **Create Dify Cloud account** and explore the interface
2. **Run `ng serve`** and audit the current frontend state
3. **Start uploading KBs to Dify** (the 15 files listed in Step A2)
4. **Build the first agent workflow** (Product Ideation Agent) and test it
5. **Start the MariaDB Docker container** and create the schema

These 5 actions set up the foundation for all 3 tracks. Everything after this builds on top.

---

### What "Done" Looks Like on Feb 26

The demo should tell this story in 5-7 minutes:

1. **Login** -> Basic auth gate (sarah.lim / demo2026)
2. **Command Center** -> Shows unified COO workbench with 7 function cards, KPIs
3. **Click NPA** -> NPA Dashboard with pipeline, agent health, aging NPAs
4. **"Create New NPA"** -> Live conversation with real Dify agent (Ideation + sub-agents fire)
5. **Classification result** -> "EXISTING (Variation), NPA Lite, 88% confidence"
6. **Similar NPAs found** -> "TSG1917 is 94% match"
7. **ML Prediction** -> "78% approval likelihood, 4.2 days, Finance is bottleneck"
8. **Template auto-filled** -> 47-field form with green/yellow/red indicators
9. **Submit** -> Approval dashboard shows 6 parallel approvers with SLA timers
10. **Audit trail** -> Every agent action logged with evidence and confidence

If this flow works smoothly with real AI responses, the funding case is compelling.

---

*Document generated from analysis of the full `Context/` and `docs/` directories of the COO Multi-Agent Workbench project.*
