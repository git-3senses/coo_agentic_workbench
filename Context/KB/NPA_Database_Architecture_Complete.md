# NPA Multi-Agent Workbench: Database Architecture
## Complete Schema Design for Supabase PostgreSQL

**Version:** 1.0  
**Date:** December 26, 2025  
**Technology Stack:** Supabase (PostgreSQL 15 + pgvector + PostgREST + Realtime)

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Core Schema Design](#core-schema-design)
3. [Table Definitions](#table-definitions)
4. [Relationships & Foreign Keys](#relationships--foreign-keys)
5. [Indexes & Performance](#indexes--performance)
6. [Vector Storage for RAG](#vector-storage-for-rag)
7. [Audit & Compliance](#audit--compliance)
8. [Data Flow Examples](#data-flow-examples)

---

## Architecture Overview

### Database Technology Choice: Supabase

**Why Supabase?**
- ✅ **PostgreSQL Foundation** - Enterprise-grade RDBMS with ACID compliance
- ✅ **pgvector Extension** - Native vector storage for RAG (KB Search Agent)
- ✅ **Real-time Subscriptions** - Live dashboard updates (Approval Orchestration)
- ✅ **Row-Level Security** - Built-in access control (RBAC)
- ✅ **Auto-generated REST APIs** - No backend coding needed (PostgREST)
- ✅ **Scalability** - Handles millions of rows, auto-scaling
- ✅ **Backup & Recovery** - Point-in-time recovery, daily backups

### Three-Layer Architecture

```
┌─────────────────────────────────────────────────────────────┐
│              APPLICATION LAYER (Angular Frontend)            │
│  • NPA Workbench UI                                          │
│  • Real-time Dashboard                                       │
│  • Document Upload Interface                                 │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│              AGENT LAYER (Dify + Python Services)            │
│  • 8 Core Agents                                             │
│  • Document Processing                                       │
│  • ML Prediction Models                                      │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│           DATABASE LAYER (Supabase PostgreSQL)               │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Core Tables  │  │ Vector Store │  │  Audit Logs  │      │
│  │ (18 tables)  │  │  (pgvector)  │  │  (Immutable) │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Core Schema Design

### Database Schema Organization

```
npa_workbench_db
│
├── public (Main Schema)
│   ├── Core NPA Tables (7 tables)
│   ├── User & Access Tables (3 tables)
│   ├── Document Tables (3 tables)
│   ├── Workflow Tables (3 tables)
│   └── Configuration Tables (2 tables)
│
├── vector_store (Vector Embeddings Schema)
│   ├── npa_embeddings (1 table)
│   └── document_embeddings (1 table)
│
└── audit (Audit Trail Schema)
    ├── activity_log (Immutable)
    ├── agent_decisions (Immutable)
    └── data_access_log (Immutable)
```

### Table Count: 21 Total Tables

**Core NPA Tables (7):**
1. npas
2. npa_properties
3. npa_classifications
4. npa_approvals
5. npa_sign_offs
6. npa_loop_backs
7. npa_comments

**User & Access Tables (3):**
8. users
9. roles
10. user_roles

**Document Tables (3):**
11. documents
12. document_categories
13. document_validations

**Workflow Tables (3):**
14. workflow_states
15. workflow_transitions
16. notifications

**Configuration Tables (2):**
17. approval_tracks
18. prohibited_items

**Vector Storage (2):**
19. npa_embeddings (pgvector)
20. document_embeddings (pgvector)

**Audit Tables (3):**
21. activity_log
22. agent_decisions
23. data_access_log

---

## Table Definitions

### 1. Core NPA Tables

#### Table: `npas`
**Purpose:** Main NPA record - one row per NPA

```sql
CREATE TABLE npas (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- NPA Identification
    npa_id VARCHAR(50) UNIQUE NOT NULL, -- e.g., "TSG2025-042"
    npa_number SERIAL UNIQUE, -- Auto-incrementing: 1, 2, 3...
    
    -- Basic Info
    product_name VARCHAR(255) NOT NULL,
    product_type VARCHAR(100) NOT NULL, -- "FX_OPTION", "SWAP", etc.
    product_description TEXT,
    
    -- Classification (from Classification Router Agent)
    classification VARCHAR(50) NOT NULL, -- "NTG", "VARIATION", "EXISTING"
    sub_classification VARCHAR(100), -- "DORMANT_REACTIVATION", "NEW_TO_LOCATION"
    classification_confidence DECIMAL(3,2), -- 0.88 = 88%
    classification_reasoning TEXT,
    
    -- Approval Track (from Classification Router Stage 2)
    approval_track VARCHAR(50) NOT NULL, -- "FULL_NPA", "NPA_LITE", "BUNDLING", "EVERGREEN"
    approval_track_reasoning TEXT,
    
    -- Business Details
    desk VARCHAR(100), -- "Singapore FX Desk"
    location VARCHAR(100), -- "Singapore"
    counterparty_name VARCHAR(255),
    counterparty_rating VARCHAR(10), -- "A-", "BBB+"
    notional_currency VARCHAR(3), -- "USD"
    notional_amount DECIMAL(20,2), -- 75000000.00
    
    -- Cross-Border
    is_cross_border BOOLEAN DEFAULT FALSE,
    booking_entities TEXT[], -- ["DBS Singapore", "DBS Hong Kong"]
    
    -- Prohibited Check
    prohibited_check_status VARCHAR(20), -- "PASSED", "FAILED"
    prohibited_check_timestamp TIMESTAMP WITH TIME ZONE,
    prohibited_check_details JSONB,
    
    -- ML Predictions (from ML Prediction Agent)
    predicted_approval_likelihood DECIMAL(3,2), -- 0.78 = 78%
    predicted_timeline_days DECIMAL(4,2), -- 4.2 days
    predicted_bottlenecks JSONB, -- [{"dept": "Finance", "days": 1.8, "reason": "ROAE"}]
    prediction_confidence DECIMAL(3,2),
    prediction_timestamp TIMESTAMP WITH TIME ZONE,
    
    -- Workflow Status
    workflow_status VARCHAR(50) NOT NULL, -- "DRAFT", "CHECKER_REVIEW", "SIGN_OFF", "APPROVED", "REJECTED", "LAUNCHED"
    current_stage VARCHAR(50), -- "PHASE_0_IDEATION", "PHASE_1_DRAFT", "PHASE_2_CHECKER", "PHASE_3_SIGNOFF"
    
    -- Timeline Tracking
    submitted_at TIMESTAMP WITH TIME ZONE,
    checker_reviewed_at TIMESTAMP WITH TIME ZONE,
    all_signoffs_completed_at TIMESTAMP WITH TIME ZONE,
    approved_at TIMESTAMP WITH TIME ZONE,
    launched_at TIMESTAMP WITH TIME ZONE,
    
    -- Actual Timeline (for ML model training)
    actual_timeline_days DECIMAL(4,2), -- Calculated from submitted_at to approved_at
    loop_back_count INTEGER DEFAULT 0,
    
    -- Validity
    validity_period_months INTEGER DEFAULT 12,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- PIR (Post-Implementation Review)
    pir_required BOOLEAN DEFAULT FALSE,
    pir_due_date DATE,
    pir_completed_at TIMESTAMP WITH TIME ZONE,
    pir_status VARCHAR(50), -- "NOT_REQUIRED", "PENDING", "COMPLETED"
    
    -- Users
    maker_id UUID REFERENCES users(id),
    checker_id UUID REFERENCES users(id),
    npa_champion_id UUID REFERENCES users(id),
    
    -- Audit Fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    
    -- Soft Delete
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_by UUID REFERENCES users(id),
    
    -- Source NPA (for template auto-fill)
    source_npa_id UUID REFERENCES npas(id), -- e.g., TSG1917
    similarity_score DECIMAL(3,2), -- 0.94 = 94% similar to source
    
    CONSTRAINT valid_classification CHECK (classification IN ('NTG', 'VARIATION', 'EXISTING')),
    CONSTRAINT valid_approval_track CHECK (approval_track IN ('FULL_NPA', 'NPA_LITE', 'BUNDLING', 'EVERGREEN', 'PROHIBITED')),
    CONSTRAINT valid_workflow_status CHECK (workflow_status IN ('DRAFT', 'CHECKER_REVIEW', 'SIGN_OFF', 'APPROVED', 'REJECTED', 'LAUNCHED', 'EXPIRED'))
);

-- Indexes
CREATE INDEX idx_npas_npa_id ON npas(npa_id);
CREATE INDEX idx_npas_workflow_status ON npas(workflow_status);
CREATE INDEX idx_npas_desk ON npas(desk);
CREATE INDEX idx_npas_created_at ON npas(created_at DESC);
CREATE INDEX idx_npas_maker ON npas(maker_id);
CREATE INDEX idx_npas_product_type ON npas(product_type);

-- Trigger for updated_at
CREATE TRIGGER update_npas_updated_at
    BEFORE UPDATE ON npas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

---

#### Table: `npa_properties`
**Purpose:** Dynamic key-value properties for NPA (47 template fields)

```sql
CREATE TABLE npa_properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    npa_id UUID NOT NULL REFERENCES npas(id) ON DELETE CASCADE,
    
    -- Property Details
    property_key VARCHAR(100) NOT NULL, -- "strike_price", "settlement_method", "roae_base"
    property_value TEXT, -- Stores any value (string, number as text, JSON)
    property_type VARCHAR(50), -- "STRING", "NUMBER", "DATE", "JSON", "BOOLEAN"
    
    -- Categorization (maps to 10 document categories)
    category INTEGER, -- 1-10 (Category 1 = Product Specs, etc.)
    section VARCHAR(100), -- "Section I: Product Overview"
    
    -- Auto-Fill Status (from Template Auto-Fill Engine)
    auto_filled BOOLEAN DEFAULT FALSE,
    auto_fill_source VARCHAR(20), -- "DIRECT_COPY", "INTELLIGENT_ADAPT", "USER_INPUT"
    auto_fill_confidence DECIMAL(3,2), -- 0.95 = 95% confidence
    source_npa_id UUID REFERENCES npas(id), -- Where value was copied from
    
    -- Validation Status
    is_validated BOOLEAN DEFAULT FALSE,
    validated_by UUID REFERENCES users(id),
    validated_at TIMESTAMP WITH TIME ZONE,
    
    -- Field Status (for UI color-coding)
    field_status VARCHAR(20), -- "GREEN", "YELLOW", "RED"
    
    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_npa_property UNIQUE(npa_id, property_key)
);

-- Indexes
CREATE INDEX idx_npa_properties_npa ON npa_properties(npa_id);
CREATE INDEX idx_npa_properties_key ON npa_properties(property_key);
CREATE INDEX idx_npa_properties_category ON npa_properties(category);
```

**Example Rows:**

```sql
-- Sarah's FX Option NPA properties
INSERT INTO npa_properties (npa_id, property_key, property_value, property_type, category, auto_filled, auto_fill_source, field_status) VALUES
('uuid-of-TSG2025-042', 'strike_price', '1.2750', 'NUMBER', 1, FALSE, 'USER_INPUT', 'GREEN'),
('uuid-of-TSG2025-042', 'settlement_method', 'Cash-settled, T+2', 'STRING', 2, TRUE, 'DIRECT_COPY', 'GREEN'),
('uuid-of-TSG2025-042', 'booking_system', 'Murex', 'STRING', 2, TRUE, 'DIRECT_COPY', 'GREEN'),
('uuid-of-TSG2025-042', 'var_amount', '540000', 'NUMBER', 4, TRUE, 'INTELLIGENT_ADAPT', 'YELLOW'),
('uuid-of-TSG2025-042', 'roae_base', '5.1', 'NUMBER', 4, TRUE, 'INTELLIGENT_ADAPT', 'YELLOW');
```

---

#### Table: `npa_classifications`
**Purpose:** Detailed classification reasoning (from Classification Router)

```sql
CREATE TABLE npa_classifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    npa_id UUID NOT NULL REFERENCES npas(id) ON DELETE CASCADE,
    
    -- Stage 1: Product Type Classification
    stage INTEGER NOT NULL, -- 1 or 2
    
    -- Classification Decision
    classification VARCHAR(50) NOT NULL,
    confidence_score DECIMAL(3,2) NOT NULL,
    
    -- Reasoning (for transparency)
    reasoning_factors JSONB, -- [{"factor": "similarity_to_TSG1917", "weight": 0.22, "direction": "positive"}]
    reasoning_text TEXT,
    
    -- Rules Applied
    rules_matched TEXT[], -- ["RULE_1_EXACT_MATCH", "RULE_2_ACTIVE_STATUS"]
    rules_confidence JSONB, -- {"RULE_1": 0.95, "RULE_2": 0.90}
    
    -- Similar NPAs Analyzed (from KB Search)
    similar_npas JSONB, -- [{"npa_id": "TSG1917", "similarity": 0.94, "status": "ACTIVE"}]
    
    -- Agent Decision
    agent_model_version VARCHAR(50), -- "classification-router-v1.2"
    agent_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Human Override (if any)
    overridden BOOLEAN DEFAULT FALSE,
    override_reason TEXT,
    overridden_by UUID REFERENCES users(id),
    overridden_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_npa_classifications_npa ON npa_classifications(npa_id);
CREATE INDEX idx_npa_classifications_stage ON npa_classifications(stage);
```

---

#### Table: `npa_approvals`
**Purpose:** Overall approval status and final decision

```sql
CREATE TABLE npa_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    npa_id UUID NOT NULL REFERENCES npas(id) ON DELETE CASCADE,
    
    -- Approval Details
    approval_status VARCHAR(50) NOT NULL, -- "PENDING", "APPROVED", "REJECTED", "CONDITIONAL"
    approval_type VARCHAR(50), -- "CHECKER", "GFM_COO", "PAC"
    
    -- Approver
    approver_id UUID REFERENCES users(id),
    approver_role VARCHAR(100), -- "Checker", "GFM COO", "PAC Member"
    
    -- Decision
    decision VARCHAR(20) NOT NULL, -- "APPROVE", "REJECT", "CONDITIONAL_APPROVE"
    decision_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Comments
    comments TEXT,
    conditions_imposed TEXT[], -- ["PIR within 6 months", "Quarterly reporting"]
    
    -- Validity
    approval_valid_until TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_approval_status CHECK (approval_status IN ('PENDING', 'APPROVED', 'REJECTED', 'CONDITIONAL')),
    CONSTRAINT valid_decision CHECK (decision IN ('APPROVE', 'REJECT', 'CONDITIONAL_APPROVE'))
);

-- Indexes
CREATE INDEX idx_npa_approvals_npa ON npa_approvals(npa_id);
CREATE INDEX idx_npa_approvals_status ON npa_approvals(approval_status);
CREATE INDEX idx_npa_approvals_approver ON npa_approvals(approver_id);
```

---

#### Table: `npa_sign_offs`
**Purpose:** Individual sign-offs from Credit, Finance, Legal, MLR, Ops, Tech

```sql
CREATE TABLE npa_sign_offs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    npa_id UUID NOT NULL REFERENCES npas(id) ON DELETE CASCADE,
    
    -- Sign-Off Party
    department VARCHAR(100) NOT NULL, -- "CREDIT", "FINANCE", "FINANCE_VP", "LEGAL", "MLR", "OPERATIONS", "TECHNOLOGY"
    sign_off_party VARCHAR(100) NOT NULL, -- "RMG-Credit", "Group Product Control"
    
    -- Approver
    approver_id UUID REFERENCES users(id),
    approver_name VARCHAR(255), -- "Jane Tan"
    approver_email VARCHAR(255),
    
    -- Status
    status VARCHAR(50) NOT NULL, -- "PENDING", "UNDER_REVIEW", "APPROVED", "REJECTED", "CLARIFICATION_NEEDED"
    
    -- Timeline
    notified_at TIMESTAMP WITH TIME ZONE, -- When approver was notified
    started_review_at TIMESTAMP WITH TIME ZONE, -- When approver opened NPA
    decision_at TIMESTAMP WITH TIME ZONE, -- When decision was made
    
    -- SLA Tracking (from Approval Orchestration Agent)
    sla_deadline TIMESTAMP WITH TIME ZONE, -- 48 hours from notified_at
    sla_warning_sent BOOLEAN DEFAULT FALSE,
    sla_warning_sent_at TIMESTAMP WITH TIME ZONE,
    sla_breached BOOLEAN DEFAULT FALSE,
    sla_breach_duration_hours DECIMAL(5,2), -- How many hours past deadline
    
    -- Decision
    decision VARCHAR(20), -- "APPROVE", "REJECT", "REQUEST_CLARIFICATION"
    comments TEXT,
    conditions TEXT[], -- Conditions imposed by this sign-off party
    
    -- Clarification (if needed)
    clarification_requested BOOLEAN DEFAULT FALSE,
    clarification_question TEXT,
    clarification_answered BOOLEAN DEFAULT FALSE,
    clarification_answer TEXT,
    clarification_answered_by VARCHAR(50), -- "AI" or "MAKER"
    
    -- Processing Mode
    processing_mode VARCHAR(20), -- "PARALLEL", "SEQUENTIAL"
    depends_on_department VARCHAR(100), -- If sequential: "FINANCE" (must wait for Finance)
    
    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_status CHECK (status IN ('PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'CLARIFICATION_NEEDED')),
    CONSTRAINT unique_npa_department UNIQUE(npa_id, department)
);

-- Indexes
CREATE INDEX idx_npa_sign_offs_npa ON npa_sign_offs(npa_id);
CREATE INDEX idx_npa_sign_offs_status ON npa_sign_offs(status);
CREATE INDEX idx_npa_sign_offs_approver ON npa_sign_offs(approver_id);
CREATE INDEX idx_npa_sign_offs_sla_deadline ON npa_sign_offs(sla_deadline);
CREATE INDEX idx_npa_sign_offs_department ON npa_sign_offs(department);
```

**Example Rows:**

```sql
-- Sarah's NPA sign-offs
INSERT INTO npa_sign_offs (npa_id, department, sign_off_party, approver_id, approver_name, status, notified_at, decision_at, sla_deadline, decision) VALUES
('uuid-TSG2025-042', 'CREDIT', 'RMG-Credit', 'uuid-jane-tan', 'Jane Tan', 'APPROVED', '2025-12-16 14:00:00+08', '2025-12-17 10:30:00+08', '2025-12-18 14:00:00+08', 'APPROVE'),
('uuid-TSG2025-042', 'FINANCE', 'Group Product Control', 'uuid-mark-lee', 'Mark Lee', 'APPROVED', '2025-12-16 14:00:00+08', '2025-12-17 16:00:00+08', '2025-12-18 14:00:00+08', 'APPROVE'),
('uuid-TSG2025-042', 'MLR', 'Market & Liquidity Risk', 'uuid-sarah-chen', 'Sarah Chen', 'APPROVED', '2025-12-16 14:00:00+08', '2025-12-17 10:00:00+08', '2025-12-18 14:00:00+08', 'APPROVE');
```

---

#### Table: `npa_loop_backs`
**Purpose:** Track all loop-backs for circuit breaker logic

```sql
CREATE TABLE npa_loop_backs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    npa_id UUID NOT NULL REFERENCES npas(id) ON DELETE CASCADE,
    
    -- Loop-Back Details
    loop_back_number INTEGER NOT NULL, -- 1, 2, 3 (circuit breaker at 3)
    loop_back_type VARCHAR(50) NOT NULL, -- "CHECKER_REJECTION", "APPROVAL_CLARIFICATION", "LAUNCH_PREP_ISSUE", "PIR_AMENDMENT"
    
    -- Reason
    initiated_by VARCHAR(50), -- "CHECKER", "FINANCE", "LEGAL", etc.
    initiator_id UUID REFERENCES users(id),
    reason TEXT NOT NULL,
    
    -- Loop-Back Routing (from Approval Orchestration Agent)
    requires_npa_changes BOOLEAN, -- TRUE = loop to Maker, FALSE = AI can handle
    routed_to VARCHAR(20), -- "MAKER", "AI", "CHECKER"
    routing_reasoning TEXT,
    
    -- Timeline Impact
    initiated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    delay_days DECIMAL(4,2), -- Calculated: resolved_at - initiated_at
    
    -- Resolution
    resolution_type VARCHAR(50), -- "MAKER_FIXED", "AI_ANSWERED", "CHECKER_REVIEWED"
    resolution_details TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_npa_loop_backs_npa ON npa_loop_backs(npa_id);
CREATE INDEX idx_npa_loop_backs_type ON npa_loop_backs(loop_back_type);
CREATE INDEX idx_npa_loop_backs_number ON npa_loop_backs(loop_back_number);
```

---

#### Table: `npa_comments`
**Purpose:** All comments/discussions on NPA

```sql
CREATE TABLE npa_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    npa_id UUID NOT NULL REFERENCES npas(id) ON DELETE CASCADE,
    
    -- Comment Details
    comment_type VARCHAR(50), -- "APPROVER_QUESTION", "MAKER_RESPONSE", "CHECKER_NOTE", "SYSTEM_ALERT"
    comment_text TEXT NOT NULL,
    
    -- Author
    author_id UUID REFERENCES users(id),
    author_name VARCHAR(255),
    author_role VARCHAR(100), -- "Finance Approver", "Maker", "Checker"
    
    -- Thread (for multi-turn conversations)
    parent_comment_id UUID REFERENCES npa_comments(id), -- NULL if top-level comment
    thread_id UUID, -- Groups related comments
    
    -- Visibility
    visibility VARCHAR(50) DEFAULT 'ALL', -- "ALL", "APPROVERS_ONLY", "MAKER_CHECKER_ONLY"
    
    -- AI Generation (if applicable)
    generated_by_ai BOOLEAN DEFAULT FALSE,
    ai_agent VARCHAR(100), -- "Conversational Diligence Sub-Agent"
    ai_confidence DECIMAL(3,2),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Soft Delete (allow comment editing)
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX idx_npa_comments_npa ON npa_comments(npa_id);
CREATE INDEX idx_npa_comments_author ON npa_comments(author_id);
CREATE INDEX idx_npa_comments_thread ON npa_comments(thread_id);
CREATE INDEX idx_npa_comments_created ON npa_comments(created_at DESC);
```

---

### 2. User & Access Tables

#### Table: `users`
**Purpose:** All users of the NPA Workbench

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identity
    email VARCHAR(255) UNIQUE NOT NULL,
    employee_id VARCHAR(50) UNIQUE,
    
    -- Profile
    full_name VARCHAR(255) NOT NULL,
    display_name VARCHAR(100),
    department VARCHAR(100), -- "Singapore FX Desk", "GFM COO Office"
    job_title VARCHAR(255),
    location VARCHAR(100), -- "Singapore", "Hong Kong", "London"
    
    -- Authentication (Supabase Auth handles this, but we store reference)
    auth_user_id UUID UNIQUE, -- Links to Supabase auth.users table
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    
    -- Preferences (for Product Ideation Agent)
    preferences JSONB, -- {"language": "en", "timezone": "Asia/Singapore", "notifications_enabled": true}
    
    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deactivated_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_department ON users(department);
CREATE INDEX idx_users_active ON users(is_active);
```

---

#### Table: `roles`
**Purpose:** Role definitions (RBAC)

```sql
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Role Details
    role_name VARCHAR(100) UNIQUE NOT NULL, -- "MAKER", "CHECKER", "FINANCE_APPROVER", "GFM_COO", "ADMIN"
    role_description TEXT,
    
    -- Permissions (JSONB for flexibility)
    permissions JSONB, -- {"can_create_npa": true, "can_approve_npa": false, "can_view_all_npas": false}
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pre-populate roles
INSERT INTO roles (role_name, role_description, permissions) VALUES
('MAKER', 'NPA creator/submitter', '{"can_create_npa": true, "can_edit_own_npa": true, "can_view_own_npa": true}'),
('CHECKER', 'NPA reviewer before sign-off', '{"can_review_npa": true, "can_approve_for_signoff": true, "can_reject_npa": true}'),
('APPROVER_CREDIT', 'Credit sign-off party', '{"can_approve_credit": true, "can_view_assigned_npas": true}'),
('APPROVER_FINANCE', 'Finance sign-off party', '{"can_approve_finance": true, "can_view_assigned_npas": true}'),
('GFM_COO', 'Final approval authority', '{"can_view_all_npas": true, "can_override_classification": true, "can_final_approve": true}'),
('ADMIN', 'System administrator', '{"can_manage_users": true, "can_view_all_data": true, "can_configure_system": true}');
```

---

#### Table: `user_roles`
**Purpose:** Many-to-many relationship (users can have multiple roles)

```sql
CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    
    -- Validity
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assigned_by UUID REFERENCES users(id),
    valid_until TIMESTAMP WITH TIME ZONE, -- NULL = permanent
    
    CONSTRAINT unique_user_role UNIQUE(user_id, role_id)
);

-- Indexes
CREATE INDEX idx_user_roles_user ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role_id);
```

---

### 3. Document Tables

#### Table: `documents`
**Purpose:** All documents uploaded to NPAs

```sql
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    npa_id UUID NOT NULL REFERENCES npas(id) ON DELETE CASCADE,
    
    -- Document Identification
    document_name VARCHAR(255) NOT NULL,
    document_type VARCHAR(100), -- "TERM_SHEET", "CREDIT_REPORT", "ROAE_MODEL", "ISDA_AGREEMENT"
    
    -- File Details
    file_path TEXT NOT NULL, -- Supabase Storage path: "npas/2025/TSG2025-042/term_sheet.pdf"
    file_size_bytes BIGINT,
    file_extension VARCHAR(10), -- "pdf", "xlsx", "docx"
    mime_type VARCHAR(100),
    
    -- Storage
    storage_bucket VARCHAR(100) DEFAULT 'npa-documents', -- Supabase Storage bucket
    
    -- Category (maps to 10 NPA categories)
    category INTEGER, -- 1-10
    category_name VARCHAR(100), -- "Product Specs", "Risk Analysis", etc.
    
    -- Checklist Tracking (from Document Checklist Agent)
    checklist_item_id INTEGER, -- Links to checklist that required this doc
    is_required BOOLEAN DEFAULT FALSE,
    upload_priority VARCHAR(20), -- "CRITICAL", "IMPORTANT", "RECOMMENDED"
    
    -- Validation (from Document Checklist Agent)
    validation_status VARCHAR(50), -- "PENDING", "VALID", "INVALID", "WARNING"
    validation_errors JSONB, -- [{"error": "File too old", "severity": "CRITICAL"}]
    validation_warnings JSONB,
    validated_at TIMESTAMP WITH TIME ZONE,
    
    -- Content Extraction (from Document Ingestion Agent)
    extracted_text TEXT, -- OCR/parsed text
    extraction_status VARCHAR(50), -- "PENDING", "SUCCESS", "FAILED"
    extraction_metadata JSONB, -- {"page_count": 3, "has_signatures": true, "doc_date": "2025-12-15"}
    
    -- Auto-Fill Contributions (from Template Auto-Fill Engine)
    contributed_to_autofill BOOLEAN DEFAULT FALSE,
    autofill_fields TEXT[], -- ["strike_price", "expiry_date", "counterparty"]
    
    -- Uploaded By
    uploaded_by UUID REFERENCES users(id),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Versioning (if document replaced)
    version INTEGER DEFAULT 1,
    replaced_by_document_id UUID REFERENCES documents(id),
    is_latest_version BOOLEAN DEFAULT TRUE,
    
    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX idx_documents_npa ON documents(npa_id);
CREATE INDEX idx_documents_type ON documents(document_type);
CREATE INDEX idx_documents_category ON documents(category);
CREATE INDEX idx_documents_validation ON documents(validation_status);
CREATE INDEX idx_documents_uploaded_by ON documents(uploaded_by);
```

---

#### Table: `document_categories`
**Purpose:** Master list of 10 document categories + required documents per category

```sql
CREATE TABLE document_categories (
    id SERIAL PRIMARY KEY,
    
    -- Category Details
    category_number INTEGER UNIQUE NOT NULL, -- 1-10
    category_name VARCHAR(100) NOT NULL,
    category_description TEXT,
    
    -- Current System Mapping
    current_system_category VARCHAR(100), -- "PRODUCT_MANAGEMENT", "PRE_TRADE_RULES", "POST_TRADE_RULES", "DOCUMENTS"
    
    -- Required Documents (template)
    required_documents JSONB, -- [{"name": "Product term sheet", "required": true, "formats": ["PDF", "Word"]}]
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pre-populate 10 categories
INSERT INTO document_categories (category_number, category_name, category_description, current_system_category) VALUES
(1, 'Product Specs', 'Target customers, PAC conditions, justifications, external parties', 'PRODUCT_MANAGEMENT'),
(2, 'Operational & Technological Information', 'Booking system, settlement, technology requirements', 'PRODUCT_MANAGEMENT'),
(3, 'Pricing Model Details', 'Pricing methodology, valuation models, market data', 'PRE_TRADE_RULES'),
(4, 'Risk Analysis', 'Operational, market, credit, reputational risks', 'PRODUCT_MANAGEMENT'),
(5, 'Data Management', 'Data fields, quality standards, PURE principles', 'POST_TRADE_RULES'),
(6, 'Entity/Location Info', 'Legal entities, cross-border, jurisdictions', 'PRODUCT_MANAGEMENT'),
(7, 'Intellectual Property Info', 'Proprietary models, third-party licenses', 'PRODUCT_MANAGEMENT'),
(8, 'Financial Crime Risk Areas', 'AML/KYC, sanctions screening, fraud risk', 'PRODUCT_MANAGEMENT'),
(9, 'Risk Data Aggregation and Reporting', 'Regulatory reporting, aggregation methodologies', 'POST_TRADE_RULES'),
(10, 'Additional Information for Trading Products', 'Trading limits, hedge accounting, margin', 'PRE_TRADE_RULES');
```

---

#### Table: `document_validations`
**Purpose:** Validation results from Document Checklist Agent

```sql
CREATE TABLE document_validations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    
    -- Validation Details
    validation_type VARCHAR(50), -- "FORMAT_CHECK", "CONTENT_VALIDATION", "DATE_CHECK", "SIGNATURE_CHECK"
    validation_result VARCHAR(20), -- "PASS", "FAIL", "WARNING"
    
    -- Results
    validation_message TEXT,
    validation_details JSONB, -- {"expected_format": ["PDF"], "actual_format": "PDF", "match": true}
    
    -- Auto-Fix Suggested
    auto_fix_available BOOLEAN DEFAULT FALSE,
    auto_fix_suggestion TEXT,
    
    -- Validator
    validated_by_agent VARCHAR(100), -- "Document Checklist & Validation Agent"
    validated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_document_validations_document ON document_validations(document_id);
CREATE INDEX idx_document_validations_result ON document_validations(validation_result);
```

---

### 4. Workflow Tables

#### Table: `workflow_states`
**Purpose:** Current state of each NPA in the workflow

```sql
CREATE TABLE workflow_states (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    npa_id UUID UNIQUE NOT NULL REFERENCES npas(id) ON DELETE CASCADE,
    
    -- Current State
    current_phase VARCHAR(50) NOT NULL, -- "PHASE_0_IDEATION", "PHASE_1_DRAFT", "PHASE_2_CHECKER", "PHASE_3_SIGNOFF", "PHASE_4_LAUNCH"
    current_stage VARCHAR(100), -- "Product Ideation Interview", "Document Upload", "Checker Review", "Parallel Sign-Offs"
    current_step VARCHAR(100), -- "Question 5 of 10", "Uploading Document 3 of 13", "Awaiting Finance Approval"
    
    -- Progress
    progress_percentage DECIMAL(3,0), -- 0-100%
    
    -- Next Actions
    next_action TEXT, -- "Complete remaining 4 NPA fields", "Upload 2 more documents", "Await Finance approval"
    next_action_owner VARCHAR(50), -- "MAKER", "CHECKER", "APPROVER_FINANCE"
    
    -- Workflow Metadata
    workflow_metadata JSONB, -- {"interview_completed": true, "documents_uploaded": 13, "approvals_pending": 2}
    
    -- Timestamps
    phase_started_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_workflow_states_npa ON workflow_states(npa_id);
CREATE INDEX idx_workflow_states_phase ON workflow_states(current_phase);
```

---

#### Table: `workflow_transitions`
**Purpose:** Audit trail of all state changes

```sql
CREATE TABLE workflow_transitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    npa_id UUID NOT NULL REFERENCES npas(id) ON DELETE CASCADE,
    
    -- Transition Details
    from_phase VARCHAR(50),
    to_phase VARCHAR(50) NOT NULL,
    from_stage VARCHAR(100),
    to_stage VARCHAR(100),
    
    -- Trigger
    trigger_type VARCHAR(50), -- "USER_ACTION", "AGENT_DECISION", "AUTOMATIC", "MANUAL_OVERRIDE"
    trigger_details TEXT,
    
    -- Outcome
    transition_successful BOOLEAN DEFAULT TRUE,
    failure_reason TEXT,
    
    -- Who/What
    triggered_by_user_id UUID REFERENCES users(id),
    triggered_by_agent VARCHAR(100), -- "Approval Orchestration Sub-Agent"
    
    -- Audit
    transitioned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_workflow_transitions_npa ON workflow_transitions(npa_id);
CREATE INDEX idx_workflow_transitions_timestamp ON workflow_transitions(transitioned_at DESC);
```

---

#### Table: `notifications`
**Purpose:** All notifications sent to users

```sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Recipient
    user_id UUID NOT NULL REFERENCES users(id),
    
    -- Notification Details
    notification_type VARCHAR(50), -- "NPA_SUBMITTED", "APPROVAL_REQUEST", "SLA_WARNING", "APPROVAL_COMPLETE"
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    
    -- Related Entity
    npa_id UUID REFERENCES npas(id),
    
    -- Delivery
    delivery_method VARCHAR(50)[], -- ["EMAIL", "IN_APP", "SLACK"]
    email_sent BOOLEAN DEFAULT FALSE,
    email_sent_at TIMESTAMP WITH TIME ZONE,
    in_app_read BOOLEAN DEFAULT FALSE,
    in_app_read_at TIMESTAMP WITH TIME ZONE,
    
    -- Priority
    priority VARCHAR(20) DEFAULT 'NORMAL', -- "LOW", "NORMAL", "HIGH", "URGENT"
    
    -- Action URL
    action_url TEXT, -- Deep link: "/npas/TSG2025-042"
    
    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_npa ON notifications(npa_id);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX idx_notifications_unread ON notifications(user_id, in_app_read) WHERE in_app_read = FALSE;
```

---

### 5. Configuration Tables

#### Table: `approval_tracks`
**Purpose:** Configuration for different approval tracks

```sql
CREATE TABLE approval_tracks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Track Details
    track_name VARCHAR(50) UNIQUE NOT NULL, -- "FULL_NPA", "NPA_LITE", "BUNDLING", "EVERGREEN"
    track_description TEXT,
    
    -- Requirements
    required_sign_offs VARCHAR(100)[], -- ["CREDIT", "FINANCE", "LEGAL", "MLR", "OPERATIONS", "TECHNOLOGY"]
    optional_sign_offs VARCHAR(100)[],
    
    -- Thresholds
    notional_thresholds JSONB, -- {"50000000": ["FINANCE_VP"], "100000000": ["CFO"]}
    
    -- PAC Requirement
    requires_pac_approval BOOLEAN,
    
    -- PIR Requirement
    requires_pir BOOLEAN,
    pir_timeframe_months INTEGER, -- 6 months for NTG
    
    -- Validity
    validity_period_months INTEGER DEFAULT 12,
    
    -- SLA
    target_timeline_days DECIMAL(4,2), -- 4 days for NPA Lite
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pre-populate approval tracks
INSERT INTO approval_tracks (track_name, track_description, required_sign_offs, requires_pac_approval, requires_pir, target_timeline_days) VALUES
('FULL_NPA', 'Full NPA process for high-risk/complex products', ARRAY['CREDIT', 'FINANCE', 'LEGAL', 'MLR', 'OPERATIONS', 'TECHNOLOGY', 'COMPLIANCE'], FALSE, FALSE, 12.0),
('NPA_LITE', 'Streamlined process for existing/low-risk variations', ARRAY['CREDIT', 'FINANCE', 'MLR'], FALSE, FALSE, 4.0),
('BUNDLING', 'Process for bundled product combinations', ARRAY['BUNDLING_ARBITRATION_TEAM'], FALSE, FALSE, 8.0),
('EVERGREEN', 'Pre-approved recurring product (log-only)', ARRAY[], FALSE, FALSE, 0.5),
('NTG', 'New-to-Group products (requires PAC)', ARRAY['CREDIT', 'FINANCE', 'LEGAL', 'MLR', 'OPERATIONS', 'TECHNOLOGY', 'COMPLIANCE'], TRUE, TRUE, 20.0);
```

---

#### Table: `prohibited_items`
**Purpose:** Prohibited products/jurisdictions/counterparties

```sql
CREATE TABLE prohibited_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Prohibited Item
    prohibition_type VARCHAR(50) NOT NULL, -- "PRODUCT", "JURISDICTION", "COUNTERPARTY", "ACTIVITY"
    prohibited_value VARCHAR(255) NOT NULL, -- "Cryptocurrency derivatives", "Iran", "ABC Sanctioned Corp"
    
    -- Prohibition Details
    prohibition_layer VARCHAR(50), -- "INTERNAL_POLICY", "REGULATORY", "SANCTIONS", "DYNAMIC"
    prohibition_source VARCHAR(255), -- "DBS Risk Policy 2023-001", "OFAC SDN List", "MAS Notice SFA04-N12"
    effective_date DATE,
    expiry_date DATE, -- NULL = permanent
    
    -- Reason
    reason TEXT,
    
    -- Matching Logic
    match_type VARCHAR(50), -- "EXACT", "CONTAINS", "REGEX", "FUZZY"
    match_pattern TEXT, -- For regex or fuzzy matching
    
    -- Actions
    action_on_match VARCHAR(50) DEFAULT 'HARD_STOP', -- "HARD_STOP", "WARNING", "MANUAL_REVIEW"
    
    -- Last Sync (for dynamic lists like OFAC)
    last_synced_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_prohibited_items_type ON prohibited_items(prohibition_type);
CREATE INDEX idx_prohibited_items_layer ON prohibited_items(prohibition_layer);
CREATE INDEX idx_prohibited_items_value ON prohibited_items(prohibited_value);

-- Pre-populate some examples
INSERT INTO prohibited_items (prohibition_type, prohibited_value, prohibition_layer, prohibition_source, reason, match_type) VALUES
('PRODUCT', 'Cryptocurrency derivatives', 'INTERNAL_POLICY', 'DBS Risk Policy 2023-001', 'Extreme volatility risk', 'CONTAINS'),
('PRODUCT', 'Binary options', 'REGULATORY', 'MAS Notice SFA04-N12', 'Prohibited for retail distribution', 'EXACT'),
('JURISDICTION', 'Iran', 'SANCTIONS', 'OFAC Comprehensive Sanctions', 'U.S. sanctions program', 'EXACT'),
('JURISDICTION', 'North Korea', 'SANCTIONS', 'UN Security Council Sanctions', 'UN sanctions program', 'EXACT');
```

---

### 6. Vector Storage for RAG (KB Search Agent)

#### Table: `npa_embeddings`
**Purpose:** Vector embeddings of historical NPAs for semantic search

```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE npa_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    npa_id UUID UNIQUE NOT NULL REFERENCES npas(id) ON DELETE CASCADE,
    
    -- Embedding
    embedding vector(1536), -- 1536 dimensions (OpenAI text-embedding-3-small)
    
    -- Source Text
    embedding_source TEXT, -- Combined text: product description + risk assessment + key properties
    
    -- Metadata for filtering
    product_type VARCHAR(100),
    classification VARCHAR(50),
    approval_track VARCHAR(50),
    desk VARCHAR(100),
    notional_amount DECIMAL(20,2),
    is_approved BOOLEAN,
    approval_date DATE,
    
    -- Embedding Metadata
    embedding_model VARCHAR(100) DEFAULT 'text-embedding-3-small',
    embedding_version VARCHAR(20) DEFAULT 'v1.0',
    
    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vector similarity search index (HNSW for fast approximate nearest neighbor)
CREATE INDEX idx_npa_embeddings_vector ON npa_embeddings 
USING hnsw (embedding vector_cosine_ops);

-- Additional indexes for filtered search
CREATE INDEX idx_npa_embeddings_product_type ON npa_embeddings(product_type);
CREATE INDEX idx_npa_embeddings_approved ON npa_embeddings(is_approved);
CREATE INDEX idx_npa_embeddings_approval_date ON npa_embeddings(approval_date DESC);
```

**Usage Example:**

```sql
-- Find top 5 similar NPAs to a query
WITH query_embedding AS (
    -- This would come from your application after calling OpenAI embedding API
    SELECT '[0.123, -0.456, 0.789, ...]'::vector(1536) AS embedding
)
SELECT 
    ne.npa_id,
    n.npa_id AS npa_number,
    n.product_name,
    1 - (ne.embedding <=> qe.embedding) AS similarity_score
FROM npa_embeddings ne
JOIN npas n ON ne.npa_id = n.id
CROSS JOIN query_embedding qe
WHERE ne.is_approved = TRUE
ORDER BY ne.embedding <=> qe.embedding
LIMIT 5;
```

---

#### Table: `document_embeddings`
**Purpose:** Vector embeddings of documents for semantic document search

```sql
CREATE TABLE document_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    
    -- Chunk Details (documents split into chunks for better retrieval)
    chunk_number INTEGER NOT NULL,
    chunk_text TEXT NOT NULL,
    
    -- Embedding
    embedding vector(1536),
    
    -- Metadata
    npa_id UUID NOT NULL REFERENCES npas(id),
    document_type VARCHAR(100),
    category INTEGER,
    
    -- Embedding Metadata
    embedding_model VARCHAR(100) DEFAULT 'text-embedding-3-small',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_document_chunk UNIQUE(document_id, chunk_number)
);

-- Vector index
CREATE INDEX idx_document_embeddings_vector ON document_embeddings 
USING hnsw (embedding vector_cosine_ops);

-- Metadata indexes
CREATE INDEX idx_document_embeddings_doc ON document_embeddings(document_id);
CREATE INDEX idx_document_embeddings_npa ON document_embeddings(npa_id);
```

---

### 7. Audit Tables (Immutable Logs)

#### Table: `activity_log`
**Purpose:** Immutable log of all user actions (append-only)

```sql
CREATE TABLE activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Who
    user_id UUID REFERENCES users(id),
    user_email VARCHAR(255),
    user_name VARCHAR(255),
    
    -- What
    action_type VARCHAR(100) NOT NULL, -- "NPA_CREATED", "NPA_SUBMITTED", "DOCUMENT_UPLOADED", "APPROVAL_GRANTED"
    action_details JSONB, -- Full details of the action
    
    -- Where
    npa_id UUID REFERENCES npas(id),
    document_id UUID REFERENCES documents(id),
    
    -- When
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Context
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(255),
    
    -- Immutability
    hash VARCHAR(64) -- SHA-256 hash of previous row (blockchain-style)
);

-- Indexes (no UPDATE or DELETE allowed - trigger enforced)
CREATE INDEX idx_activity_log_user ON activity_log(user_id);
CREATE INDEX idx_activity_log_npa ON activity_log(npa_id);
CREATE INDEX idx_activity_log_timestamp ON activity_log(timestamp DESC);
CREATE INDEX idx_activity_log_action ON activity_log(action_type);

-- Trigger to prevent updates/deletes
CREATE OR REPLACE FUNCTION prevent_activity_log_modification()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Activity log is immutable. No updates or deletes allowed.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER activity_log_immutable_update
    BEFORE UPDATE ON activity_log
    FOR EACH ROW
    EXECUTE FUNCTION prevent_activity_log_modification();

CREATE TRIGGER activity_log_immutable_delete
    BEFORE DELETE ON activity_log
    FOR EACH ROW
    EXECUTE FUNCTION prevent_activity_log_modification();
```

---

#### Table: `agent_decisions`
**Purpose:** Immutable log of all AI agent decisions (for transparency)

```sql
CREATE TABLE agent_decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Which Agent
    agent_name VARCHAR(100) NOT NULL, -- "Classification Router Agent", "ML Prediction Agent"
    agent_version VARCHAR(50),
    
    -- Decision Context
    npa_id UUID REFERENCES npas(id),
    decision_type VARCHAR(100), -- "CLASSIFICATION", "APPROVAL_PREDICTION", "DOCUMENT_VALIDATION"
    
    -- Input
    input_data JSONB, -- What data was fed to the agent
    
    -- Output
    output_data JSONB, -- Agent's decision/prediction
    confidence_score DECIMAL(3,2),
    
    -- Reasoning (for explainability)
    reasoning TEXT,
    reasoning_factors JSONB, -- Structured reasoning (e.g., feature importance for ML)
    
    -- Performance
    processing_time_ms INTEGER,
    
    -- Outcome Validation (filled in later for ML training)
    actual_outcome JSONB, -- What actually happened (for retraining ML models)
    outcome_validated_at TIMESTAMP WITH TIME ZONE,
    
    -- Audit
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    hash VARCHAR(64) -- Immutability hash
);

-- Indexes
CREATE INDEX idx_agent_decisions_agent ON agent_decisions(agent_name);
CREATE INDEX idx_agent_decisions_npa ON agent_decisions(npa_id);
CREATE INDEX idx_agent_decisions_timestamp ON agent_decisions(timestamp DESC);
CREATE INDEX idx_agent_decisions_type ON agent_decisions(decision_type);

-- Immutability triggers (same as activity_log)
CREATE TRIGGER agent_decisions_immutable_update
    BEFORE UPDATE ON agent_decisions
    FOR EACH ROW
    EXECUTE FUNCTION prevent_activity_log_modification();

CREATE TRIGGER agent_decisions_immutable_delete
    BEFORE DELETE ON agent_decisions
    FOR EACH ROW
    EXECUTE FUNCTION prevent_activity_log_modification();
```

---

#### Table: `data_access_log`
**Purpose:** Immutable log of all data access (GDPR compliance)

```sql
CREATE TABLE data_access_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Who
    user_id UUID REFERENCES users(id),
    user_email VARCHAR(255),
    
    -- What
    access_type VARCHAR(50), -- "VIEW", "EXPORT", "DOWNLOAD"
    resource_type VARCHAR(50), -- "NPA", "DOCUMENT", "REPORT"
    resource_id UUID, -- ID of the NPA/document/etc
    
    -- Context
    access_reason VARCHAR(255), -- "User clicked 'View NPA'", "Downloaded approval report"
    
    -- Audit
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    hash VARCHAR(64)
);

-- Indexes
CREATE INDEX idx_data_access_log_user ON data_access_log(user_id);
CREATE INDEX idx_data_access_log_resource ON data_access_log(resource_type, resource_id);
CREATE INDEX idx_data_access_log_timestamp ON data_access_log(timestamp DESC);

-- Immutability triggers
CREATE TRIGGER data_access_log_immutable_update
    BEFORE UPDATE ON data_access_log
    FOR EACH ROW
    EXECUTE FUNCTION prevent_activity_log_modification();

CREATE TRIGGER data_access_log_immutable_delete
    BEFORE DELETE ON data_access_log
    FOR EACH ROW
    EXECUTE FUNCTION prevent_activity_log_modification();
```

---

## Relationships & Foreign Keys

### Entity Relationship Diagram (ERD)

```
┌─────────────┐
│    users    │◄──────┐
└─────────────┘       │
       │              │
       │ created_by   │ maker_id
       │              │
       ▼              │
┌─────────────┐       │
│    npas     │───────┘
└─────────────┘
       │
       │ npa_id (1:N)
       ├──────────────────┐
       │                  │
       ▼                  ▼
┌──────────────┐   ┌──────────────┐
│npa_properties│   │  documents   │
└──────────────┘   └──────────────┘
       │                  │
       │                  │ document_id (1:N)
       │                  ▼
       │           ┌──────────────────┐
       │           │document_embeddings│
       │           └──────────────────┘
       │
       ├──────────────────┬──────────────────┬──────────────────┐
       ▼                  ▼                  ▼                  ▼
┌──────────────┐   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│npa_signoffs  │   │npa_approvals │  │npa_loopbacks │  │npa_comments  │
└──────────────┘   └──────────────┘  └──────────────┘  └──────────────┘

       │
       ▼
┌──────────────┐
│npa_embeddings│ (pgvector)
└──────────────┘
```

### Key Relationships

**1. NPA → Properties (1:N)**
- One NPA has many properties (47 template fields)
- CASCADE delete: If NPA deleted, all properties deleted

**2. NPA → Documents (1:N)**
- One NPA has many documents (term sheets, credit reports, etc.)
- CASCADE delete: If NPA deleted, all documents deleted

**3. NPA → Sign-Offs (1:N)**
- One NPA has multiple sign-offs (Credit, Finance, Legal, etc.)
- Each sign-off is independent and tracked separately

**4. NPA → Embeddings (1:1)**
- One NPA has one embedding vector for semantic search
- Used by KB Search Agent for similarity matching

**5. Document → Chunks/Embeddings (1:N)**
- One document split into multiple chunks
- Each chunk has its own embedding for fine-grained retrieval

**6. User → Roles (N:N)**
- Users can have multiple roles (e.g., Maker + Checker)
- Implemented via user_roles junction table

---

## Indexes & Performance Optimization

### Index Strategy

**1. Primary Keys (Automatic)**
- All tables use UUID primary keys
- Auto-indexed by PostgreSQL

**2. Foreign Keys (Manual)**
- All foreign key columns indexed for join performance
- Example: `idx_npa_sign_offs_npa ON npa_sign_offs(npa_id)`

**3. Query Optimization Indexes**
- Workflow status: `idx_npas_workflow_status` (most common filter)
- Created date: `idx_npas_created_at DESC` (for recent NPAs queries)
- Desk: `idx_npas_desk` (for desk-specific views)

**4. Vector Indexes (HNSW)**
- `idx_npa_embeddings_vector` using HNSW algorithm
- Approximate nearest neighbor search (ANN) for speed
- 99%+ recall with 10-100x faster than exact search

**5. Composite Indexes**
- `(user_id, in_app_read)` on notifications (for unread count queries)
- `(document_id, chunk_number)` on document_embeddings (unique constraint + query optimization)

### Performance Targets

- **Simple queries (<3 tables):** <50ms
- **Complex joins (3-5 tables):** <200ms
- **Vector similarity search:** <500ms for top 10 results
- **Dashboard real-time updates:** <100ms via Supabase Realtime
- **Bulk inserts (activity_log):** 10,000+ rows/sec

---

## Data Flow Examples

### Example 1: Sarah Creates NPA (Complete Flow)

```sql
-- Step 1: Product Ideation Agent creates NPA record
INSERT INTO npas (
    npa_id, product_name, product_type, classification, approval_track,
    desk, location, notional_currency, notional_amount, is_cross_border,
    workflow_status, current_stage, maker_id, created_by
) VALUES (
    'TSG2025-042',
    'FX Put Option GBP/USD',
    'FX_OPTION',
    'EXISTING',
    'NPA_LITE',
    'Singapore FX Desk',
    'Singapore',
    'USD',
    75000000.00,
    TRUE,
    'DRAFT',
    'PHASE_0_IDEATION',
    'uuid-sarah-lim',
    'uuid-sarah-lim'
) RETURNING id;
-- Returns: uuid-TSG2025-042

-- Step 2: Document Checklist Agent creates workflow state
INSERT INTO workflow_states (npa_id, current_phase, current_stage, progress_percentage)
VALUES ('uuid-TSG2025-042', 'PHASE_0_IDEATION', 'Document Upload', 35);

-- Step 3: Template Auto-Fill Engine populates properties
INSERT INTO npa_properties (npa_id, property_key, property_value, property_type, category, auto_filled, auto_fill_source, field_status)
VALUES
('uuid-TSG2025-042', 'strike_price', '1.2750', 'NUMBER', 1, TRUE, 'USER_INPUT', 'GREEN'),
('uuid-TSG2025-042', 'settlement_method', 'Cash-settled, T+2', 'STRING', 2, TRUE, 'DIRECT_COPY', 'GREEN'),
('uuid-TSG2025-042', 'booking_system', 'Murex', 'STRING', 2, TRUE, 'DIRECT_COPY', 'GREEN');
-- ... 37 more rows

-- Step 4: Sarah uploads documents
INSERT INTO documents (npa_id, document_name, document_type, file_path, category, uploaded_by)
VALUES
('uuid-TSG2025-042', 'GBP_USD_FX_Option_Term_Sheet.pdf', 'TERM_SHEET', 'npas/2025/TSG2025-042/term_sheet.pdf', 1, 'uuid-sarah-lim'),
('uuid-TSG2025-042', 'ROAE_Sensitivity_Model.xlsx', 'ROAE_MODEL', 'npas/2025/TSG2025-042/roae_model.xlsx', 4, 'uuid-sarah-lim');
-- ... 11 more documents

-- Step 5: ML Prediction Agent updates predictions
UPDATE npas
SET 
    predicted_approval_likelihood = 0.78,
    predicted_timeline_days = 4.2,
    predicted_bottlenecks = '[{"dept": "Finance", "days": 1.8, "reason": "ROAE"}]',
    prediction_confidence = 0.92,
    prediction_timestamp = NOW()
WHERE id = 'uuid-TSG2025-042';

-- Step 6: Sarah submits (transition to Checker review)
UPDATE npas
SET 
    workflow_status = 'CHECKER_REVIEW',
    current_stage = 'PHASE_2_CHECKER',
    submitted_at = NOW()
WHERE id = 'uuid-TSG2025-042';

-- Step 7: Log workflow transition
INSERT INTO workflow_transitions (npa_id, from_phase, to_phase, trigger_type, triggered_by_user_id)
VALUES ('uuid-TSG2025-042', 'PHASE_1_DRAFT', 'PHASE_2_CHECKER', 'USER_ACTION', 'uuid-sarah-lim');

-- Step 8: Log activity
INSERT INTO activity_log (user_id, user_email, user_name, action_type, npa_id, action_details)
VALUES ('uuid-sarah-lim', 'sarah.lim@dbs.com', 'Sarah Lim', 'NPA_SUBMITTED', 'uuid-TSG2025-042', 
        '{"submission_time": "2025-12-16T09:42:00+08:00", "completeness": "100%"}');
```

---

### Example 2: KB Search Agent Finds Similar NPAs

```sql
-- Step 1: Generate embedding for user's product description
-- (This happens in application code, calling OpenAI API)
-- Result: embedding vector [0.123, -0.456, 0.789, ...]

-- Step 2: Search for top 5 similar NPAs
WITH query AS (
    SELECT '[0.123, -0.456, 0.789, ...]'::vector(1536) AS embedding
)
SELECT 
    n.npa_id,
    n.product_name,
    n.classification,
    n.approval_track,
    n.approved_at,
    n.actual_timeline_days,
    1 - (ne.embedding <=> q.embedding) AS similarity_score
FROM npa_embeddings ne
JOIN npas n ON ne.npa_id = n.id
CROSS JOIN query q
WHERE 
    ne.is_approved = TRUE
    AND ne.product_type = 'FX_OPTION'
    AND n.approved_at >= NOW() - INTERVAL '2 years'
ORDER BY ne.embedding <=> q.embedding
LIMIT 5;

-- Returns:
-- npa_id       | similarity | timeline | status
-- TSG1917      | 0.94       | 3.0 days | APPROVED
-- TSG1823      | 0.88       | 4.0 days | APPROVED
-- TSG2044      | 0.82       | 6.0 days | APPROVED
```

---

### Example 3: Approval Orchestration Tracks Sign-Offs

```sql
-- Step 1: Checker approves, trigger sign-offs
-- Create sign-off records for 6 approvers
INSERT INTO npa_sign_offs (npa_id, department, sign_off_party, approver_id, approver_name, status, notified_at, sla_deadline, processing_mode)
VALUES
('uuid-TSG2025-042', 'CREDIT', 'RMG-Credit', 'uuid-jane-tan', 'Jane Tan', 'PENDING', NOW(), NOW() + INTERVAL '48 hours', 'PARALLEL'),
('uuid-TSG2025-042', 'FINANCE', 'Group Product Control', 'uuid-mark-lee', 'Mark Lee', 'PENDING', NOW(), NOW() + INTERVAL '48 hours', 'PARALLEL'),
('uuid-TSG2025-042', 'MLR', 'Market & Liquidity Risk', 'uuid-sarah-chen', 'Sarah Chen', 'PENDING', NOW(), NOW() + INTERVAL '48 hours', 'PARALLEL'),
('uuid-TSG2025-042', 'OPERATIONS', 'Operations', 'uuid-david-lim', 'David Lim', 'PENDING', NOW(), NOW() + INTERVAL '48 hours', 'PARALLEL'),
('uuid-TSG2025-042', 'TECHNOLOGY', 'Technology', 'uuid-emily-wong', 'Emily Wong', 'PENDING', NOW(), NOW() + INTERVAL '48 hours', 'PARALLEL'),
('uuid-TSG2025-042', 'FINANCE_VP', 'Finance VP', 'uuid-jane-tan', 'Jane Tan', 'PENDING', NULL, NULL, 'SEQUENTIAL'); -- Waits for Finance

-- Step 2: Finance approves (26 hours later)
UPDATE npa_sign_offs
SET 
    status = 'APPROVED',
    decision_at = NOW(),
    decision = 'APPROVE',
    comments = 'ROAE acceptable at 5.2%, approved'
WHERE npa_id = 'uuid-TSG2025-042' AND department = 'FINANCE';

-- Step 3: Unlock Finance VP sequential gate
UPDATE npa_sign_offs
SET 
    notified_at = NOW(),
    sla_deadline = NOW() + INTERVAL '24 hours' -- Expedited VP SLA
WHERE npa_id = 'uuid-TSG2025-042' AND department = 'FINANCE_VP';

-- Step 4: Query for dashboard real-time updates
SELECT 
    department,
    approver_name,
    status,
    EXTRACT(EPOCH FROM (NOW() - notified_at))/3600 AS hours_elapsed,
    EXTRACT(EPOCH FROM (sla_deadline - NOW()))/3600 AS hours_remaining
FROM npa_sign_offs
WHERE npa_id = 'uuid-TSG2025-042'
ORDER BY 
    CASE WHEN status = 'APPROVED' THEN 1 ELSE 0 END,
    hours_elapsed DESC;

-- Returns real-time status for dashboard:
-- dept      | approver  | status    | elapsed | remaining
-- CREDIT    | Jane Tan  | APPROVED  | 20.5    | N/A
-- FINANCE   | Mark Lee  | APPROVED  | 26.0    | N/A
-- FINANCE_VP| Jane Tan  | PENDING   | 0.0     | 24.0
-- MLR       | Sarah Chen| APPROVED  | 20.0    | N/A
-- OPERATIONS| David Lim | APPROVED  | 3.5     | N/A
-- TECHNOLOGY| Emily Wong| APPROVED  | 19.2    | N/A
```

---

## Summary: Database Architecture Benefits

### 1. **Complete NPA Lifecycle Tracking**
- From Product Ideation → Approval → Launch → PIR
- All 47 template fields stored as flexible key-value properties
- Full audit trail (immutable logs)

### 2. **Multi-Agent Integration**
- Each agent has dedicated tables/columns for its outputs
- Classification Router → `npa_classifications` table
- ML Prediction → `predicted_*` columns in `npas`
- Document Checklist → `documents` + `document_validations`
- Approval Orchestration → `npa_sign_offs` + `workflow_states`

### 3. **RAG/Vector Search Support**
- Native pgvector for KB Search Agent
- HNSW indexes for fast similarity search
- Separate embeddings for NPAs and documents

### 4. **Regulatory Compliance**
- Immutable audit logs (activity_log, agent_decisions, data_access_log)
- 7-year retention via triggers preventing deletes
- Blockchain-style hashing for tamper evidence
- GDPR-compliant data access logging

### 5. **Real-Time Capabilities**
- Supabase Realtime subscriptions for live dashboard
- Workflow state changes broadcast instantly
- SLA warnings trigger in real-time

### 6. **Scalability**
- UUID primary keys (distributed-friendly)
- Proper indexes on all query patterns
- Vector indexes (HNSW) for millions of embeddings
- Horizontal scaling via Supabase

**Total Tables: 21**  
**Total Indexes: 60+**  
**Storage Estimate (1,000 NPAs):** ~500MB (including vectors)  
**Query Performance:** <200ms for 99% of queries

This architecture supports the complete NPA Multi-Agent Workbench from Phase 0 through PIR! 🎉

---
