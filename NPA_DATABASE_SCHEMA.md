# NPA Module - Database Schema Design

## Overview
This document defines the complete database schema required to support all NPA (New Product Approval) module UI components across both Angular and React applications.

---

## Core Tables

### 1. `npa_instances`
**Purpose**: Main table storing each NPA workflow instance

| Column | Type | Description |
|--------|------|-------------|
| id | VARCHAR(20) | Primary key (e.g., "NPA210921") |
| product_name | VARCHAR(255) | Product name |
| product_type | VARCHAR(100) | Product type/category |
| asset_class | VARCHAR(100) | Asset class |
| business_unit | VARCHAR(100) | Owning business unit |
| owner_id | VARCHAR(50) | Foreign key to users table |
| owner_name | VARCHAR(100) | Owner's full name |
| current_stage | VARCHAR(50) | Current lifecycle stage |
| overall_status | VARCHAR(50) | on-track, at-risk, blocked, completed, draft |
| classification | VARCHAR(20) | Complex, Standard, Light |
| template_id | VARCHAR(50) | Foreign key to npa_templates |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |
| kickoff_date | DATE | Date of kickoff meeting |
| target_completion_date | DATE | Expected completion date |
| actual_completion_date | DATE | Actual completion date (nullable) |
| days_in_current_stage | INTEGER | Days spent in current stage |
| total_age_days | INTEGER | Total days since creation |
| location | VARCHAR(100) | Geographic location |
| notional_amount | DECIMAL(15,2) | Notional value (nullable) |
| currency | VARCHAR(3) | Currency code |
| counterparty | VARCHAR(255) | Counterparty name (nullable) |
| credit_rating | VARCHAR(10) | Credit rating (nullable) |

**Indexes**: id (PK), owner_id, current_stage, overall_status, business_unit, created_at

---

### 2. `npa_templates`
**Purpose**: Template definitions for different product types

| Column | Type | Description |
|--------|------|-------------|
| id | VARCHAR(50) | Primary key |
| title | VARCHAR(255) | Template name |
| description | TEXT | Template description |
| category | VARCHAR(100) | Category name |
| version | VARCHAR(10) | Template version (e.g., "v2.1") |
| success_rate | DECIMAL(5,2) | Historical success rate (0-100) |
| avg_completion_time | VARCHAR(20) | Average completion time (e.g., "4.2 days") |
| icon | VARCHAR(50) | Icon identifier |
| icon_bg_color | VARCHAR(20) | Background color |
| total_fields | INTEGER | Total number of fields |
| is_active | BOOLEAN | Active status |
| created_at | TIMESTAMP | Creation timestamp |

**Indexes**: id (PK), category, is_active

---

### 3. `npa_template_inputs`
**Purpose**: Input fields required for each template

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| template_id | VARCHAR(50) | Foreign key to npa_templates |
| field_key | VARCHAR(100) | Unique field identifier |
| label | VARCHAR(255) | Display label |
| placeholder | TEXT | Placeholder text |
| field_type | VARCHAR(50) | text, textarea, select, date, number |
| is_required | BOOLEAN | Required field flag |
| display_order | INTEGER | Display sequence |
| validation_rules | JSONB | Validation configuration |

**Indexes**: template_id, display_order

---

### 4. `npa_product_attributes`
**Purpose**: Product specifications and attributes for each NPA

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| npa_id | VARCHAR(20) | Foreign key to npa_instances |
| attribute_key | VARCHAR(100) | Attribute identifier |
| attribute_label | VARCHAR(255) | Display label |
| attribute_value | TEXT | Attribute value |
| confidence_score | DECIMAL(5,2) | AI confidence (0-100) |
| data_source | VARCHAR(100) | Source of data (Manual, AI, KB) |
| is_verified | BOOLEAN | Human verification flag |
| updated_at | TIMESTAMP | Last update timestamp |

**Indexes**: npa_id, attribute_key

---

### 5. `npa_lifecycle_stages`
**Purpose**: Stage configuration and metadata

| Column | Type | Description |
|--------|------|-------------|
| stage_id | VARCHAR(50) | Primary key (e.g., "1a-discover") |
| stage_name | VARCHAR(100) | Display name |
| stage_description | TEXT | Description |
| display_order | INTEGER | Sequence number |
| icon | VARCHAR(50) | Icon identifier |
| color | VARCHAR(20) | Color code |
| is_active | BOOLEAN | Active status |

**Indexes**: stage_id (PK), display_order

---

### 6. `npa_stage_history`
**Purpose**: Track stage transitions for each NPA

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| npa_id | VARCHAR(20) | Foreign key to npa_instances |
| stage_id | VARCHAR(50) | Foreign key to npa_lifecycle_stages |
| status | VARCHAR(50) | not-started, in-progress, completed, blocked |
| started_at | TIMESTAMP | Stage entry timestamp |
| completed_at | TIMESTAMP | Stage completion timestamp (nullable) |
| days_spent | INTEGER | Days in this stage |
| completed_by | VARCHAR(50) | User who completed stage |

**Indexes**: npa_id, stage_id, status

---

## Forms & Documents

### 7. `npa_forms`
**Purpose**: Form definitions and templates

| Column | Type | Description |
|--------|------|-------------|
| id | VARCHAR(50) | Primary key |
| form_name | VARCHAR(255) | Form name |
| form_description | TEXT | Description |
| stage_id | VARCHAR(50) | Foreign key to npa_lifecycle_stages |
| is_required | BOOLEAN | Required form flag |
| template_content | JSONB | Form template structure |
| created_at | TIMESTAMP | Creation timestamp |

**Indexes**: id (PK), stage_id

---

### 8. `npa_form_submissions`
**Purpose**: Form completion records for each NPA

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| npa_id | VARCHAR(20) | Foreign key to npa_instances |
| form_id | VARCHAR(50) | Foreign key to npa_forms |
| status | VARCHAR(50) | draft, completed, pending-review, approved |
| form_data | JSONB | Submitted form data |
| completed_by | VARCHAR(50) | User who completed form |
| completed_at | TIMESTAMP | Completion timestamp |
| reviewed_by | VARCHAR(50) | Reviewer user ID |
| reviewed_at | TIMESTAMP | Review timestamp |

**Indexes**: npa_id, form_id, status

---

### 9. `npa_documents`
**Purpose**: Document uploads and attachments

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| npa_id | VARCHAR(20) | Foreign key to npa_instances |
| stage_id | VARCHAR(50) | Stage where uploaded |
| document_name | VARCHAR(255) | File name |
| document_type | VARCHAR(100) | Document category |
| file_path | VARCHAR(500) | Storage path/URL |
| file_size | BIGINT | File size in bytes |
| mime_type | VARCHAR(100) | MIME type |
| status | VARCHAR(50) | uploaded, processing, validated, error |
| validation_message | TEXT | Validation result |
| uploaded_by | VARCHAR(50) | User who uploaded |
| uploaded_at | TIMESTAMP | Upload timestamp |
| validated_at | TIMESTAMP | Validation timestamp |

**Indexes**: npa_id, stage_id, status

---

## Agents & Automation

### 10. `sub_agents`
**Purpose**: Sub-agent definitions and capabilities

| Column | Type | Description |
|--------|------|-------------|
| id | VARCHAR(50) | Primary key (e.g., "agent-doc-intake") |
| agent_name | VARCHAR(255) | Agent display name |
| agent_description | TEXT | Description of capabilities |
| task_type | VARCHAR(50) | Ingest, Analyze, Decide, Review, Report, Validate, Monitor |
| stage_id | VARCHAR(50) | Primary stage where agent operates |
| version | VARCHAR(10) | Agent version |
| model_type | VARCHAR(100) | AI model used |
| icon | VARCHAR(50) | Icon identifier |
| color | VARCHAR(20) | Color code |
| is_active | BOOLEAN | Active status |
| created_at | TIMESTAMP | Creation timestamp |

**Indexes**: id (PK), task_type, stage_id

---

### 11. `npa_agent_executions`
**Purpose**: Track agent execution instances

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| npa_id | VARCHAR(20) | Foreign key to npa_instances |
| agent_id | VARCHAR(50) | Foreign key to sub_agents |
| execution_state | VARCHAR(50) | idle, running, waiting, escalated, completed, error |
| confidence_level | VARCHAR(20) | low, medium, high |
| started_at | TIMESTAMP | Execution start time |
| completed_at | TIMESTAMP | Execution end time |
| duration_ms | INTEGER | Execution duration |
| input_data | JSONB | Input parameters |
| output_data | JSONB | Output results |
| error_message | TEXT | Error details (nullable) |
| escalation_reason | TEXT | Escalation reason (nullable) |

**Indexes**: npa_id, agent_id, execution_state

---

### 12. `agent_activity_log`
**Purpose**: Detailed activity log for all agent actions

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| npa_id | VARCHAR(20) | Foreign key to npa_instances |
| agent_id | VARCHAR(50) | Foreign key to sub_agents |
| activity_type | VARCHAR(100) | Activity category |
| activity_message | TEXT | Activity description |
| severity | VARCHAR(20) | info, warning, error, critical |
| metadata | JSONB | Additional context data |
| created_at | TIMESTAMP | Activity timestamp |

**Indexes**: npa_id, agent_id, created_at DESC

---

## Approvals & Governance

### 13. `business_units`
**Purpose**: Business unit master data

| Column | Type | Description |
|--------|------|-------------|
| id | VARCHAR(50) | Primary key |
| unit_name | VARCHAR(255) | Business unit name |
| unit_code | VARCHAR(20) | Short code |
| parent_unit_id | VARCHAR(50) | Parent unit (nullable) |
| head_user_id | VARCHAR(50) | Unit head user ID |
| is_active | BOOLEAN | Active status |

**Indexes**: id (PK), parent_unit_id

---

### 14. `npa_approvals`
**Purpose**: Approval workflow and sign-offs

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| npa_id | VARCHAR(20) | Foreign key to npa_instances |
| business_unit_id | VARCHAR(50) | Foreign key to business_units |
| approver_user_id | VARCHAR(50) | User who must approve |
| approval_status | VARCHAR(50) | pending, approved, rejected, conditional, viewing-now |
| approval_type | VARCHAR(100) | Type of approval required |
| approval_conditions | TEXT | Conditions for approval |
| confidence_level | VARCHAR(20) | AI prediction confidence |
| risk_notes | TEXT | Risk assessment notes |
| approval_comment | TEXT | Approver's comment |
| requested_at | TIMESTAMP | Approval request timestamp |
| responded_at | TIMESTAMP | Response timestamp |
| sequence_order | INTEGER | Approval sequence |

**Indexes**: npa_id, business_unit_id, approval_status

---

### 15. `npa_governance_items`
**Purpose**: Governance records, audit trails, conditions

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| npa_id | VARCHAR(20) | Foreign key to npa_instances |
| item_type | VARCHAR(50) | approval, audit, condition, flag |
| item_category | VARCHAR(100) | Category/classification |
| severity | VARCHAR(20) | low, medium, high, critical |
| title | VARCHAR(255) | Item title |
| description | TEXT | Detailed description |
| status | VARCHAR(50) | open, resolved, waived |
| assigned_to | VARCHAR(50) | User responsible |
| created_by | VARCHAR(50) | User who created item |
| created_at | TIMESTAMP | Creation timestamp |
| resolved_at | TIMESTAMP | Resolution timestamp |
| resolution_notes | TEXT | Resolution details |

**Indexes**: npa_id, item_type, severity, status

---

## Team & Users

### 16. `users`
**Purpose**: User/employee master data

| Column | Type | Description |
|--------|------|-------------|
| id | VARCHAR(50) | Primary key (employee ID) |
| full_name | VARCHAR(255) | Full name |
| email | VARCHAR(255) | Email address |
| department | VARCHAR(100) | Department |
| role | VARCHAR(100) | Job role/title |
| business_unit_id | VARCHAR(50) | Foreign key to business_units |
| manager_id | VARCHAR(50) | Manager's user ID |
| is_active | BOOLEAN | Active status |
| created_at | TIMESTAMP | Creation timestamp |

**Indexes**: id (PK), email, business_unit_id

---

### 17. `npa_team_members`
**Purpose**: Team assignments for each NPA

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| npa_id | VARCHAR(20) | Foreign key to npa_instances |
| user_id | VARCHAR(50) | Foreign key to users |
| role | VARCHAR(100) | Product Manager, PM Team, Proposal Preparer, etc. |
| assigned_at | TIMESTAMP | Assignment timestamp |
| removed_at | TIMESTAMP | Removal timestamp (nullable) |

**Indexes**: npa_id, user_id, role

---

## Knowledge Base & Reference

### 18. `knowledge_base_documents`
**Purpose**: Policy documents, historical NPAs, reference materials

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| document_title | VARCHAR(255) | Document name |
| document_type | VARCHAR(100) | policy, historical_npa, template, guideline |
| content | TEXT | Document content |
| content_vector | VECTOR | Embedding for semantic search |
| source_url | VARCHAR(500) | Source reference |
| version | VARCHAR(20) | Document version |
| is_active | BOOLEAN | Active status |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

**Indexes**: id (PK), document_type, is_active
**Special**: Vector index on content_vector for similarity search

---

### 19. `npa_kb_matches`
**Purpose**: Track KB document matches/references for NPAs

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| npa_id | VARCHAR(20) | Foreign key to npa_instances |
| kb_document_id | INTEGER | Foreign key to knowledge_base_documents |
| match_score | DECIMAL(5,2) | Similarity score (0-100) |
| match_type | VARCHAR(50) | historical, policy, template |
| context | TEXT | Why this document was matched |
| created_at | TIMESTAMP | Match timestamp |

**Indexes**: npa_id, kb_document_id, match_score DESC

---

### 20. `prohibited_list_items`
**Purpose**: Prohibited products, jurisdictions, counterparties

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| item_type | VARCHAR(50) | product, jurisdiction, counterparty, keyword |
| item_value | VARCHAR(255) | Prohibited value |
| reason | TEXT | Prohibition reason |
| severity | VARCHAR(20) | blocking, warning, informational |
| effective_date | DATE | When prohibition starts |
| expiry_date | DATE | When prohibition ends (nullable) |
| is_active | BOOLEAN | Active status |

**Indexes**: item_type, item_value, is_active

---

## Analytics & Reporting

### 21. `npa_kpi_snapshots`
**Purpose**: Daily/periodic KPI snapshots for dashboards

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| snapshot_date | DATE | Snapshot date |
| metric_name | VARCHAR(100) | KPI name |
| metric_value | DECIMAL(15,2) | Numeric value |
| metric_unit | VARCHAR(50) | Unit (days, percentage, count, currency) |
| comparison_period | VARCHAR(50) | YoY, MoM, WoW |
| comparison_value | DECIMAL(15,2) | Prior period value |
| trend_direction | VARCHAR(10) | up, down, stable |
| business_unit_id | VARCHAR(50) | BU filter (nullable for global) |
| created_at | TIMESTAMP | Snapshot timestamp |

**Indexes**: snapshot_date DESC, metric_name, business_unit_id

---

### 22. `npa_market_clusters`
**Purpose**: Strategic market clusters and themes

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| cluster_name | VARCHAR(255) | Cluster/theme name |
| description | TEXT | Description |
| product_count | INTEGER | Number of products in cluster |
| growth_rate | DECIMAL(5,2) | Growth percentage |
| intensity_score | DECIMAL(5,2) | Market intensity (0-100) |
| color_code | VARCHAR(20) | Display color |
| is_active | BOOLEAN | Active status |
| updated_at | TIMESTAMP | Last update timestamp |

**Indexes**: id (PK), growth_rate DESC

---

### 23. `npa_cluster_assignments`
**Purpose**: Link NPAs to market clusters

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| npa_id | VARCHAR(20) | Foreign key to npa_instances |
| cluster_id | INTEGER | Foreign key to npa_market_clusters |
| assignment_confidence | DECIMAL(5,2) | AI confidence (0-100) |
| assigned_at | TIMESTAMP | Assignment timestamp |

**Indexes**: npa_id, cluster_id

---

### 24. `npa_prospects`
**Purpose**: Future product opportunities and pipeline

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| prospect_name | VARCHAR(255) | Opportunity name |
| theme | VARCHAR(100) | Related theme/cluster |
| probability | DECIMAL(5,2) | Success probability (0-100) |
| estimated_value | DECIMAL(15,2) | Estimated revenue |
| currency | VARCHAR(3) | Currency code |
| target_date | DATE | Expected launch date |
| status | VARCHAR(50) | Status |
| created_at | TIMESTAMP | Creation timestamp |

**Indexes**: id (PK), probability DESC, estimated_value DESC

---

## Chat & Conversations

### 25. `npa_chat_messages`
**Purpose**: Chat conversation history

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| npa_id | VARCHAR(20) | Foreign key to npa_instances |
| message_role | VARCHAR(20) | user, agent, system |
| agent_id | VARCHAR(50) | Foreign key to sub_agents (if agent message) |
| message_content | TEXT | Message text (supports markdown) |
| message_metadata | JSONB | Additional context |
| parent_message_id | INTEGER | For threaded conversations |
| created_at | TIMESTAMP | Message timestamp |

**Indexes**: npa_id, created_at ASC

---

## System Configuration

### 26. `system_integrations`
**Purpose**: External system connections

| Column | Type | Description |
|--------|------|-------------|
| id | VARCHAR(50) | Primary key |
| integration_name | VARCHAR(255) | Integration name |
| integration_type | VARCHAR(100) | bloomberg, policy_engine, sharepoint, sendgrid, etc. |
| status | VARCHAR(50) | active, inactive, error |
| endpoint_url | VARCHAR(500) | API endpoint |
| auth_type | VARCHAR(50) | oauth, api_key, basic |
| last_sync_at | TIMESTAMP | Last successful sync |
| is_active | BOOLEAN | Active status |

**Indexes**: id (PK), integration_type

---

### 27. `npa_audit_log`
**Purpose**: Complete audit trail for all NPA changes

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| npa_id | VARCHAR(20) | Foreign key to npa_instances |
| action_type | VARCHAR(100) | create, update, delete, approve, reject, etc. |
| table_name | VARCHAR(100) | Affected table |
| record_id | VARCHAR(100) | Affected record ID |
| old_value | JSONB | Previous value |
| new_value | JSONB | New value |
| changed_by | VARCHAR(50) | User who made change |
| changed_at | TIMESTAMP | Change timestamp |
| ip_address | VARCHAR(45) | IP address |
| user_agent | TEXT | Browser/client info |

**Indexes**: npa_id, changed_at DESC, action_type

---

## Data Relationships Summary

### Primary Relationships:
```
npa_instances (1) -> (N) npa_product_attributes
npa_instances (1) -> (N) npa_stage_history
npa_instances (1) -> (N) npa_form_submissions
npa_instances (1) -> (N) npa_documents
npa_instances (1) -> (N) npa_agent_executions
npa_instances (1) -> (N) npa_approvals
npa_instances (1) -> (N) npa_governance_items
npa_instances (1) -> (N) npa_team_members
npa_instances (1) -> (N) npa_chat_messages
npa_instances (1) -> (N) npa_kb_matches
npa_instances (1) -> (N) npa_cluster_assignments

npa_templates (1) -> (N) npa_instances
npa_templates (1) -> (N) npa_template_inputs

business_units (1) -> (N) npa_instances
business_units (1) -> (N) npa_approvals
business_units (1) -> (N) users

users (1) -> (N) npa_instances (as owner)
users (1) -> (N) npa_team_members
users (1) -> (N) npa_approvals (as approver)

sub_agents (1) -> (N) npa_agent_executions
sub_agents (1) -> (N) agent_activity_log

npa_lifecycle_stages (1) -> (N) npa_stage_history
npa_lifecycle_stages (1) -> (N) npa_forms

npa_market_clusters (1) -> (N) npa_cluster_assignments

knowledge_base_documents (1) -> (N) npa_kb_matches
```

---

## Query Patterns for Common UI Components

### 1. COO Dashboard - Overview Tab
```sql
-- KPI Cards
SELECT metric_name, metric_value, metric_unit, trend_direction
FROM npa_kpi_snapshots
WHERE snapshot_date = CURRENT_DATE
  AND business_unit_id IS NULL
ORDER BY metric_name;

-- Pipeline Stages
SELECT stage_id, COUNT(*) as count, AVG(days_spent) as avg_time
FROM npa_stage_history
WHERE status = 'in-progress'
GROUP BY stage_id;

-- Ageing Analysis
SELECT
  CASE
    WHEN total_age_days < 30 THEN '< 30d'
    WHEN total_age_days BETWEEN 30 AND 60 THEN '30-60d'
    WHEN total_age_days BETWEEN 60 AND 90 THEN '60-90d'
    ELSE '> 90d'
  END as age_bucket,
  COUNT(*) as count
FROM npa_instances
WHERE overall_status != 'completed'
GROUP BY age_bucket;
```

### 2. COO Dashboard - NPA Pool Tab
```sql
SELECT
  ni.id,
  ni.product_name,
  ni.location,
  ni.business_unit,
  ni.kickoff_date,
  ni.classification,
  ni.current_stage,
  ni.overall_status,
  ni.total_age_days,
  u_pm.full_name as product_manager,
  tm_pm_team.role as pm_team,
  a.approval_status as pac_approval,
  u_preparer.full_name as proposal_preparer,
  t.title as template
FROM npa_instances ni
LEFT JOIN users u_pm ON ni.owner_id = u_pm.id
LEFT JOIN npa_team_members tm_pm_team ON ni.id = tm_pm_team.npa_id AND tm_pm_team.role = 'PM Team'
LEFT JOIN npa_approvals a ON ni.id = a.npa_id AND a.business_unit_id = 'PAC'
LEFT JOIN npa_team_members tm_prep ON ni.id = tm_prep.npa_id AND tm_prep.role = 'Proposal Preparer'
LEFT JOIN users u_preparer ON tm_prep.user_id = u_preparer.id
LEFT JOIN npa_templates t ON ni.template_id = t.id
ORDER BY ni.created_at DESC;
```

### 3. NPA Pipeline Table
```sql
SELECT
  ni.id,
  ni.product_name as name,
  ni.product_type,
  ni.business_unit,
  ni.current_stage,
  ni.overall_status as status,
  ni.days_in_current_stage as days_in_stage,
  u.full_name as owner,
  ni.updated_at as last_updated
FROM npa_instances ni
JOIN users u ON ni.owner_id = u.id
WHERE ni.overall_status != 'completed'
ORDER BY ni.days_in_current_stage DESC;
```

### 4. NPA Detail - Product Specs
```sql
SELECT
  attribute_label,
  attribute_value,
  confidence_score,
  data_source,
  is_verified
FROM npa_product_attributes
WHERE npa_id = :npa_id
ORDER BY attribute_key;

-- Template completion stats
SELECT
  t.total_fields,
  COUNT(CASE WHEN fs.status = 'completed' THEN 1 END) as completed_fields
FROM npa_instances ni
JOIN npa_templates t ON ni.template_id = t.id
LEFT JOIN npa_form_submissions fs ON ni.id = fs.npa_id
WHERE ni.id = :npa_id
GROUP BY t.total_fields;
```

### 5. NPA Detail - Approvals Tab
```sql
SELECT
  bu.unit_name as business_unit,
  u.full_name as approver_name,
  a.approval_status,
  a.approval_conditions,
  a.confidence_level,
  a.risk_notes,
  a.requested_at,
  a.responded_at
FROM npa_approvals a
JOIN business_units bu ON a.business_unit_id = bu.id
JOIN users u ON a.approver_user_id = u.id
WHERE a.npa_id = :npa_id
ORDER BY a.sequence_order;
```

### 6. Sub-Agent Status
```sql
SELECT
  sa.agent_name,
  sa.agent_description,
  sa.task_type,
  ae.execution_state,
  ae.confidence_level,
  ae.output_data,
  ae.completed_at
FROM npa_agent_executions ae
JOIN sub_agents sa ON ae.agent_id = sa.id
WHERE ae.npa_id = :npa_id
ORDER BY ae.started_at DESC;
```

---

## Estimated Data Volumes (Production)

| Table | Estimated Rows | Growth Rate |
|-------|----------------|-------------|
| npa_instances | 50,000 - 100,000 | 2,000/month |
| npa_product_attributes | 500,000 - 1,000,000 | 20,000/month |
| npa_stage_history | 400,000 - 800,000 | 16,000/month |
| npa_form_submissions | 300,000 - 600,000 | 12,000/month |
| npa_documents | 200,000 - 400,000 | 8,000/month |
| npa_agent_executions | 5,000,000+ | 200,000/month |
| agent_activity_log | 50,000,000+ | 2,000,000/month |
| npa_approvals | 300,000 - 600,000 | 12,000/month |
| npa_governance_items | 100,000 - 200,000 | 4,000/month |
| npa_chat_messages | 1,000,000+ | 40,000/month |
| npa_audit_log | 10,000,000+ | 400,000/month |
| users | 5,000 - 10,000 | Stable |
| business_units | 100 - 200 | Stable |
| sub_agents | 50 - 100 | Stable |
| knowledge_base_documents | 10,000 - 20,000 | 100/month |

---

## Performance Considerations

### Recommended Indexes:
1. **Composite indexes** for common filters:
   - `(npa_id, created_at DESC)` on activity logs
   - `(business_unit_id, overall_status)` on npa_instances
   - `(current_stage, overall_status)` on npa_instances

2. **Full-text search indexes**:
   - `product_name, product_type, business_unit` on npa_instances
   - `message_content` on npa_chat_messages

3. **Partitioning strategy**:
   - `agent_activity_log` - Partition by month
   - `npa_audit_log` - Partition by quarter
   - `npa_chat_messages` - Partition by month

4. **Archival strategy**:
   - Archive completed NPAs older than 3 years
   - Archive agent logs older than 6 months
   - Retain audit logs for 7 years (compliance)

---

## Technology Recommendations

### Database Engine:
- **PostgreSQL 15+** with extensions:
  - `pgvector` for knowledge base similarity search
  - `pg_trgm` for fuzzy text search
  - `timescaledb` for time-series KPI data

### Caching Layer:
- **Redis** for:
  - Active NPA session data
  - Dashboard KPI aggregates (TTL: 5 minutes)
  - User session state

### Search:
- **Elasticsearch** for:
  - Full-text search across NPAs
  - Knowledge base document search
  - Activity log search

### Data Warehouse:
- **Snowflake/BigQuery** for:
  - Historical analytics
  - ML model training datasets
  - Executive reporting

---

## Next Steps

1. **Phase 1**: Implement core tables (1-6, 13-17)
2. **Phase 2**: Add forms, documents, agents (7-12)
3. **Phase 3**: Add governance and approvals (14-15)
4. **Phase 4**: Implement analytics and KB (18-24)
5. **Phase 5**: Add chat and audit (25-27)

Each phase should include:
- Migration scripts
- Seed data for testing
- API endpoint implementation
- UI component integration
- Performance testing
