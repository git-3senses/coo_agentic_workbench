# Dify Knowledge Base Architecture Strategy
## COO Multi-Agent Workbench - KB Design & Implementation Guide

---

## Executive Summary

This document outlines the **optimal Knowledge Base (KB) architecture** for the COO Multi-Agent Workbench in Dify, ensuring:
- ✅ **Clear separation of concerns** (agents only access relevant KBs)
- ✅ **Zero confusion** (no agent gets irrelevant knowledge)
- ✅ **Efficient retrieval** (fast, accurate RAG)
- ✅ **Scalability** (easy to add new agents/domains)
- ✅ **Maintainability** (single source of truth per domain)

---

## Table of Contents

1. [The Challenge We're Solving](#1-the-challenge-were-solving)
2. [Dify KB Architecture Primer](#2-dify-kb-architecture-primer)
3. [Recommended KB Structure (3-Tier Model)](#3-recommended-kb-structure-3-tier-model)
4. [Detailed KB Breakdown](#4-detailed-kb-breakdown)
5. [Agent-to-KB Linking Strategy](#5-agent-to-kb-linking-strategy)
6. [Implementation Roadmap](#6-implementation-roadmap)
7. [Access Control & Permissions](#7-access-control--permissions)
8. [KB Maintenance & Updates](#8-kb-maintenance--updates)
9. [Performance Optimization](#9-performance-optimization)
10. [Appendix: KB File Manifest](#10-appendix-kb-file-manifest)

---

## 1. The Challenge We're Solving

### The Problem
Your COO Workbench has a **4-tier hierarchy**:
```
Tier 1: Master COO Orchestrator (1 agent)
   ↓
Tier 2: Domain Agents (7 agents: NPA, Desk Support, DCE, ORM, BLA, SPM, BAP)
   ↓
Tier 3: Sub-Agents (~10 per domain = 70 total)
   ↓
Tier 4: Utility Agents (9 shared utilities)
```

**Without proper KB structure:**
- ❌ NPA Agent might retrieve Desk Support knowledge
- ❌ ML Prediction Agent gets confused with Classification Agent rules
- ❌ Slow retrieval (searching across irrelevant documents)
- ❌ Hallucinations (mixing knowledge from different domains)
- ❌ Maintenance nightmare (updating same info in multiple places)

### The Solution: 3-Tier KB Architecture
```
TIER 1: Global Knowledge Bases (Shared by ALL)
   ↓
TIER 2: Domain-Specific Knowledge Bases (NPA, Desk Support, etc.)
   ↓
TIER 3: Agent-Specific Knowledge Bases (Sub-agents)
```

**Result:**
- ✅ Each agent has **precise, scoped knowledge**
- ✅ No confusion or cross-contamination
- ✅ Fast retrieval (smaller search space)
- ✅ Easy updates (change once, agents auto-update)

---

## 2. Dify KB Architecture Primer

### How Dify Knowledge Bases Work

In Dify, a **Knowledge Base** is:
1. **A collection of documents** (PDFs, TXTs, Markdown, Word, Excel, etc.)
2. **Auto-chunked** into smaller segments (typically 512-1024 tokens)
3. **Vectorized** using embedding models (e.g., OpenAI `text-embedding-3-large`)
4. **Stored in a vector database** (Dify's internal or external Qdrant/Pinecone)
5. **Retrieved via semantic search** when an agent queries it

### Key Dify KB Features

| Feature | Description |
|---------|-------------|
| **Multiple KBs per Agent** | ✅ One agent can access multiple KBs |
| **KB Sharing** | ✅ Multiple agents can share the same KB |
| **Retrieval Settings** | ✅ Configure top-K, similarity threshold, reranking per agent |
| **Document Segmentation** | ✅ Auto or custom chunking (recommended: 800 tokens, 50 overlap) |
| **Metadata Filtering** | ✅ Filter by tags, categories, dates during retrieval |
| **Version Control** | ⚠️ Limited (manual document replacement) |
| **Access Control** | ⚠️ Dify has basic role-based access (Team vs Workspace) |

### Best Practices from Dify Documentation

1. **Smaller, Focused KBs > One Giant KB**
   - Reason: Faster retrieval, less noise
   - Example: `NPA_Historical_Data` vs `All_COO_Data`

2. **Use Metadata Tags Extensively**
   - Tag documents: `domain=NPA`, `type=policy`, `jurisdiction=Singapore`
   - Enable filtered retrieval in agent queries

3. **Hybrid Search (Semantic + Keyword)**
   - Dify supports both
   - Use semantic for concept matching, keyword for exact terms

4. **Reranking for Precision**
   - Enable Cohere Rerank or similar to boost top results
   - Critical for multi-KB agents

5. **Monitor Hit Rate**
   - Track if agents are finding relevant docs (Dify analytics)
   - Adjust chunking/thresholds if hit rate < 85%

---

## 3. Recommended KB Structure (3-Tier Model)

### Overview

```
┌─────────────────────────────────────────────────────────────────┐
│ TIER 1: GLOBAL KNOWLEDGE BASES (Shared by ALL agents)          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ 1. KB_Global_Regulatory_Policy                                 │
│    • MAS 656, MAS 643, CFTC regulations                        │
│    • DBS Group policies (applicable to all COO functions)      │
│    • Cross-border compliance rules                             │
│    Access: ALL 86 agents (1 Tier 1 + 7 Tier 2 + 70 Tier 3 + 9 Utility)
│                                                                 │
│ 2. KB_Global_Templates_Library                                 │
│    • Standard forms (NPA template, risk assessment, etc.)      │
│    • Report templates (weekly status, monthly MIS)             │
│    • Email templates (notifications, escalations)              │
│    Access: ALL agents that generate documents                  │
│                                                                 │
│ 3. KB_Global_DBS_Product_Catalog                               │
│    • All T&M products (FX, Rates, Credit, Equity, Commodity)   │
│    • Product attributes, categorizations                       │
│    Access: NPA, Desk Support, DCE agents                       │
│                                                                 │
│ 4. KB_Global_Org_Structure                                     │
│    • COO org chart, department roles                           │
│    • Approver hierarchies (who approves what)                  │
│    • Contact directory                                         │
│    Access: ALL agents (for routing/notification)               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ TIER 2: DOMAIN-SPECIFIC KNOWLEDGE BASES (Per COO Function)     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ DOMAIN 1: NPA (New Product Approval)                           │
│ ├─ KB_NPA_Historical_Data (1,784 NPAs, 2020-2025)             │
│ ├─ KB_NPA_Policy_Guidelines (6-category NPA policies)         │
│ ├─ KB_NPA_SOPs (15 standard operating procedures)             │
│ ├─ KB_NPA_Classification_Rules (product type → track mapping) │
│ └─ KB_NPA_Approval_Workflows (state machines, sign-off rules) │
│    Access: NPA Domain Agent + all 10 NPA Sub-Agents           │
│                                                                 │
│ DOMAIN 2: Desk Support                                         │
│ ├─ KB_DeskSupport_12Pillars (broker limits, trading mandates) │
│ ├─ KB_DeskSupport_ROBO_Queries (C720 optimization examples)   │
│ └─ KB_DeskSupport_Historical_Queries (past 5,000 queries)     │
│    Access: Desk Support Domain Agent + Sub-Agents             │
│                                                                 │
│ DOMAIN 3-7: [Similar structure for DCE, ORM, BLA, SPM, BAP]   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ TIER 3: AGENT-SPECIFIC KNOWLEDGE BASES (Sub-Agent Logic)       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ NPA SUB-AGENTS (10 specialized KBs)                            │
│ ├─ KB_Ideation_Agent.md (Product Ideation interview logic)    │
│ ├─ KB_Classification_Agent.md (2-stage classification rules)  │
│ ├─ KB_Template_Autofill_Agent.md (4-step auto-fill process)   │
│ ├─ KB_Search_Agent.md (RAG search methodology)                │
│ ├─ KB_ML_Prediction.md (XGBoost model, feature engineering)   │
│ ├─ KB_Conversational_Diligence.md (Q&A, policy explanations)  │
│ ├─ KB_Governance_Agent.md (approval orchestration logic)      │
│ ├─ KB_Risk_Agent.md (prohibited list checking)                │
│ ├─ KB_Domain_Orchestrator_NPA.md (routing table)              │
│ └─ KB_Master_COO_Orchestrator.md (Tier 1 routing logic)       │
│    Access: ONLY the specific sub-agent it belongs to          │
│                                                                 │
│ UTILITY AGENTS (9 shared KBs)                                  │
│ ├─ KB_Utility_Workflow_State_Manager (state machine rules)    │
│ ├─ KB_Utility_Loop_Back_Handler (circuit breaker logic)       │
│ ├─ KB_Utility_Notification_Engine (templates, routing)        │
│ ├─ KB_Utility_Document_Processing (OCR, extraction)           │
│ ├─ KB_Utility_Data_Retrieval (C720, Murex, MINV APIs)        │
│ └─ KB_Utility_Audit_Logger (compliance logging rules)         │
│    Access: ALL agents that use these utilities                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Detailed KB Breakdown

### TIER 1: Global Knowledge Bases

#### KB_Global_Regulatory_Policy
**Purpose:** Centralized regulatory and compliance knowledge
**Contents:**
- `MAS_Notice_656.pdf` (Market Risk framework)
- `MAS_Notice_643.pdf` (Operational Risk)
- `CFTC_Swaps_Regulations.pdf`
- `DBS_Group_Policy_3.2_Data_Governance.pdf`
- `Cross_Border_Compliance_Matrix.xlsx` (Singapore/HK/London rules)

**Why Shared:**
- All agents need to validate compliance
- Single source of truth for regulatory updates
- Prevents duplicate policy documents across domains

**Agents Using This KB:**
- ✅ All 86 agents (referenced for compliance checks)
- 🔥 Heavy users: NPA Classification, Risk Agent, Governance Agent

**Dify Settings:**
- Chunking: 800 tokens, 100 overlap (legal text needs context)
- Top-K: 5 (precise regulatory citations)
- Similarity Threshold: 0.75 (high precision required)
- Reranking: ✅ Enabled (Cohere Rerank)

---

#### KB_Global_Templates_Library
**Purpose:** Standard templates for document generation
**Contents:**
- `NPA_Template_v2024.docx`
- `Credit_Memo_Template.docx`
- `Weekly_Status_Report.pptx`
- `Monthly_MIS_Dashboard.xlsx`
- `Email_Template_Notification.txt`
- `Email_Template_Escalation.txt`

**Why Shared:**
- Consistency across all COO functions
- Avoid duplicate templates
- Easy updates (change template once, all agents use new version)

**Agents Using This KB:**
- ✅ Template Auto-Fill Engine (NPA)
- ✅ Credit Memo Generation Sub-Agent (NPA)
- ✅ Status Report Sub-Agent (all domains)
- ✅ Notification Agent (Utility)

**Dify Settings:**
- Chunking: 1024 tokens (preserve template structure)
- Top-K: 3 (few but exact matches)
- Similarity Threshold: 0.85 (exact template needed)
- Metadata: Tag by `type` (email, report, form)

---

#### KB_Global_DBS_Product_Catalog
**Purpose:** Complete T&M product inventory
**Contents:**
- `Product_Catalog_FX.xlsx` (126 FX products)
- `Product_Catalog_Rates.xlsx` (89 rate products)
- `Product_Catalog_Credit.xlsx` (67 credit derivatives)
- `Product_Catalog_Equity.xlsx` (45 equity derivatives)
- `Product_Catalog_Commodity.xlsx` (34 commodities)
- `Product_Attribute_Matrix.csv` (all attributes: type, tenor, underlying, etc.)

**Why Shared:**
- NPA needs to classify products
- Desk Support needs to answer product questions
- DCE needs product info for client services

**Agents Using This KB:**
- ✅ Product Ideation Agent (NPA)
- ✅ Classification Router (NPA)
- ✅ Desk Support Domain Agent
- ✅ DCE Client Services Agent

**Dify Settings:**
- Chunking: 512 tokens (tabular data, smaller chunks)
- Top-K: 10 (multiple similar products)
- Similarity Threshold: 0.70 (broader matching)
- Metadata: Tag by `asset_class`, `region`, `desk`

---

#### KB_Global_Org_Structure
**Purpose:** Organizational hierarchy and approver mapping
**Contents:**
- `COO_Org_Chart.pdf`
- `Approver_Matrix_by_Function.xlsx` (who approves NPAs, risk events, etc.)
- `Department_Contact_Directory.csv`
- `Escalation_Paths.pdf`

**Why Shared:**
- Routing decisions (who to send NPA to)
- Notification logic (who to email)
- Approval orchestration (parallel sign-offs)

**Agents Using This KB:**
- ✅ Master COO Orchestrator (Tier 1)
- ✅ Domain Orchestrators (all 7)
- ✅ Approval Orchestration Sub-Agent (NPA)
- ✅ Notification Agent (Utility)

**Dify Settings:**
- Chunking: 600 tokens
- Top-K: 5
- Similarity Threshold: 0.80
- Metadata: Tag by `department`, `role`

---

### TIER 2: Domain-Specific Knowledge Bases

#### DOMAIN 1: NPA (New Product Approval)

##### KB_NPA_Historical_Data
**Purpose:** All 1,784 historical NPAs (institutional memory)
**Contents:**
- 1,784 NPA documents (2020-2025)
- Organized by: `{NPA_ID}/{NPA_ID}_full_document.pdf`
- Enriched metadata: `{NPA_ID}_metadata.json`
  ```json
  {
    "npa_id": "TSG1917",
    "product_type": "FX Option",
    "counterparty_rating": "BBB+",
    "notional_usd": 25000000,
    "tenor_months": 3,
    "desk": "Singapore FX",
    "submitted_date": "2024-12-01",
    "approved_date": "2024-12-04",
    "timeline_days": 3,
    "outcome": "Approved",
    "conditions": ["PIR required within 6 months"],
    "loop_backs": 0,
    "approvers": ["Credit", "Finance", "Legal"]
  }
  ```

**Why Domain-Specific:**
- Only relevant to NPA workflow
- Too large to share (would slow other agents)
- Desk Support doesn't need NPA precedents

**Agents Using This KB:**
- ✅ KB Search Sub-Agent (NPA) — PRIMARY USER
- ✅ Template Auto-Fill Engine (NPA)
- ✅ ML Prediction Sub-Agent (NPA)
- ✅ Conversational Diligence Sub-Agent (NPA)
- ❌ NOT used by: Desk Support, DCE, or other domains

**Dify Settings:**
- Chunking: 800 tokens, 50 overlap
- Top-K: 10 (find multiple similar NPAs)
- Similarity Threshold: 0.70 (recall > precision for discovery)
- Reranking: ✅ Enabled (boost most relevant)
- Metadata Filtering: ✅ Enable filtering by `product_type`, `desk`, `outcome`, `year`

**Example Query:**
```
User: "Find NPAs similar to FX straddle structure, Singapore desk, approved in 2024"

Dify Retrieval:
1. Semantic search: "FX straddle structure"
2. Metadata filter: desk=Singapore, outcome=Approved, year=2024
3. Return top 10 with similarity > 0.70
4. Rerank to boost highest relevance
```

---

##### KB_NPA_Policy_Guidelines
**Purpose:** 6-category NPA policies (Product Management, Operations, Risk, etc.)
**Contents:**
- `NPA_Policy_Product_Management.pdf`
- `NPA_Policy_Operations_Technology.pdf`
- `NPA_Policy_Risk_Analysis.pdf`
- `NPA_Policy_Data_Management.pdf`
- `NPA_Policy_Entity_Location.pdf`
- `NPA_Policy_Post_Trade_Rules.pdf`

**Why Domain-Specific:**
- NPA-specific policies (not applicable to Desk Support)
- Detailed rules for approval thresholds, sign-offs

**Agents Using This KB:**
- ✅ Classification Router (NPA)
- ✅ Conversational Diligence Sub-Agent (NPA)
- ✅ Governance Agent (NPA)
- ✅ Product Ideation Agent (NPA)

**Dify Settings:**
- Chunking: 800 tokens, 100 overlap (policy text needs context)
- Top-K: 5
- Similarity Threshold: 0.75
- Metadata: Tag by `policy_category` (1-6)

---

##### KB_NPA_SOPs
**Purpose:** 15 standard operating procedures for NPA workflow
**Contents:**
- `SOP_NPA_Submission_Checklist.pdf`
- `SOP_NPA_Lite_vs_Full.pdf`
- `SOP_Cross_Border_Requirements.pdf`
- `SOP_Bundling_Logic.pdf`
- `SOP_Evergreen_Process.pdf`
- ... (10 more SOPs)

**Why Domain-Specific:**
- Operational procedures unique to NPA
- Not relevant to ORM or BAP workflows

**Agents Using This KB:**
- ✅ Product Ideation Agent (NPA)
- ✅ Conversational Diligence Sub-Agent (NPA)
- ✅ Governance Agent (NPA)

**Dify Settings:**
- Chunking: 700 tokens
- Top-K: 3 (precise SOP match)
- Similarity Threshold: 0.80

---

##### KB_NPA_Classification_Rules
**Purpose:** Two-stage classification logic (Product Type → Approval Track)
**Contents:**
- `Classification_Stage1_Product_Type.xlsx` (NTG, Variation, Existing)
- `Classification_Stage2_Approval_Track.xlsx` (Full NPA, NPA Lite, Bundling, Evergreen, Prohibited)
- `Decision_Tree_Visualization.pdf`
- `Edge_Cases_and_Exceptions.pdf`

**Why Domain-Specific:**
- Classification logic specific to NPA domain
- Not applicable to Desk Support queries

**Agents Using This KB:**
- ✅ Classification Router (NPA) — PRIMARY USER
- ✅ Product Ideation Agent (NPA) — for similarity check
- ❌ NOT used by other domains

**Dify Settings:**
- Chunking: 600 tokens (decision tree logic)
- Top-K: 5
- Similarity Threshold: 0.75

---

##### KB_NPA_Approval_Workflows
**Purpose:** State machines, sign-off rules, loop-back logic
**Contents:**
- `NPA_State_Machine_Diagram.pdf` (30 states)
- `Sign_Off_Matrix_by_Product_Type.xlsx` (who approves what)
- `Loop_Back_Rules_and_Circuit_Breakers.pdf`
- `Parallel_Approval_Logic.pdf`
- `Cross_Border_Mandatory_Approvers.pdf`

**Why Domain-Specific:**
- Workflow rules specific to NPA lifecycle
- Not applicable to DCE ticket resolution workflows

**Agents Using This KB:**
- ✅ Governance Agent (NPA) — PRIMARY USER
- ✅ Classification Router (NPA) — for sign-off determination
- ✅ Workflow State Manager (Utility) — shared logic, but tailored via metadata

**Dify Settings:**
- Chunking: 700 tokens
- Top-K: 5
- Similarity Threshold: 0.80

---

#### DOMAIN 2-7: [Similar Structure]

For brevity, other domains follow the same pattern:
- **KB_DeskSupport_12Pillars** (domain-specific)
- **KB_DeskSupport_Historical_Queries** (domain-specific)
- **KB_DCE_SOPs** (200+ SOPs, domain-specific)
- **KB_ORM_Risk_Events** (historical risk events, domain-specific)
- **KB_SPM_Project_Templates** (domain-specific)
- **KB_BAP_MIS_Reporting_Standards** (domain-specific)

**Key Principle:** Each domain gets its own isolated KBs to prevent cross-contamination.

---

### TIER 3: Agent-Specific Knowledge Bases

These are the **10 KB files you've already created** (KB_Ideation_Agent.md, KB_Classification_Agent.md, etc.)

#### How to Use These in Dify

**Option 1: Embed as System Prompts (Recommended for Sub-Agents)**
- **What:** Copy the KB_*.md content directly into the agent's **System Prompt**
- **Why:** 
  - Faster (no retrieval needed)
  - Agent has 100% of its logic in context
  - Perfect for deterministic agents (Classification, Risk, Governance)
- **When:** For agents with <8,000 tokens of knowledge
- **How:** In Dify Agent Builder → System Prompt → Paste KB_Ideation_Agent.md

**Example:**
```
Agent: Product Ideation Agent
System Prompt:
┌────────────────────────────────────────┐
│ [Paste entire KB_Ideation_Agent.md]   │
│                                        │
│ # KB_Ideation_Agent                   │
│ ## System Identity & Prime Directive  │
│ You are the Product Ideation Agent... │
│ ...                                    │
│ [rest of 31KB content]                │
└────────────────────────────────────────┘
```

**Option 2: Upload as Dedicated KB (For Large Logic)**
- **What:** Upload KB_*.md as a dedicated Dify Knowledge Base
- **Why:** For agents with >8,000 tokens of logic (exceeds prompt limits)
- **When:** For agents like KB_Master_COO_Orchestrator.md (70KB)
- **How:** Dify → Knowledge → Create KB → Upload `KB_Master_COO_Orchestrator.md`

**Example:**
```
Agent: Master COO Orchestrator
System Prompt: "You are the Master COO Orchestrator. Refer to your KB for routing logic."
Linked KBs: 
  - KB_Master_COO_Orchestrator (70KB, dedicated)
  - KB_Global_Org_Structure (shared)
```

#### Comparison: System Prompt vs Dedicated KB

| Criterion | System Prompt | Dedicated KB |
|-----------|--------------|--------------|
| **Speed** | ⚡ Instant (no retrieval) | 🐢 1-2s retrieval |
| **Accuracy** | ✅ 100% (always in context) | ⚠️ 85-95% (depends on retrieval) |
| **Size Limit** | ⚠️ ~8,000 tokens (Claude limit) | ✅ Unlimited |
| **Updates** | ⚠️ Manual (re-paste) | ✅ Auto (KB sync) |
| **Best For** | Deterministic logic (Classification, Risk) | Large knowledge (Master Orchestrator, Historical Data) |

**Recommended Approach:**
- **Small sub-agents (<8K tokens):** System Prompt ✅
  - KB_Ideation_Agent.md (31K → ⚠️ may need KB)
  - KB_Classification_Agent.md (33K → ⚠️ may need KB)
  - KB_Domain_Orchestrator_NPA.md (2K → ✅ System Prompt)
  - KB_Template_Autofill_Agent.md (29K → ⚠️ may need KB)
  - KB_Search_Agent.md (32K → ⚠️ may need KB)
  - KB_ML_Prediction.md (30K → ⚠️ may need KB)
  - KB_Conversational_Diligence.md (43K → ❌ Must be KB)
  - KB_Governance_Agent.md (31K → ⚠️ may need KB)
  - KB_Risk_Agent.md (35K → ⚠️ may need KB)

- **Large orchestrators (>8K tokens):** Dedicated KB ✅
  - KB_Master_COO_Orchestrator.md (70K → ✅ Must be KB)

**Hybrid Approach (Best of Both):**
1. Create a **condensed version** of each KB_*.md (<8K tokens) for System Prompt
2. Upload **full version** as dedicated KB for deep retrieval
3. Agent uses:
   - System Prompt for 80% of decisions (fast, deterministic)
   - KB retrieval for edge cases/deep context (slower, comprehensive)

**Example:**
```
Agent: Classification Router

System Prompt (Condensed, 5K tokens):
"You are the Classification Router. You perform two-stage classification:
Stage 1: NTG / Variation / Existing
Stage 2: Full NPA / NPA Lite / Bundling / Evergreen / Prohibited
[Summarized rules: if cross-border → Full NPA, if notional < $5M → NPA Lite, etc.]
For edge cases or detailed rules, query your dedicated KB."

Linked KBs:
  - KB_Classification_Agent (full 33KB, for edge cases)
  - KB_NPA_Classification_Rules (decision trees, exceptions)
```

---

## 5. Agent-to-KB Linking Strategy

### Linking Matrix

| Agent Tier | Agent Name | Tier 1 (Global) | Tier 2 (Domain) | Tier 3 (Agent-Specific) |
|------------|-----------|-----------------|-----------------|-------------------------|
| **TIER 1** | Master COO Orchestrator | All 4 Global KBs | None (routes to domains) | KB_Master_COO_Orchestrator |
| **TIER 2** | NPA Domain Agent | 4 Global KBs | All 5 NPA KBs | KB_Domain_Orchestrator_NPA |
| **TIER 3** | Product Ideation (NPA) | Product Catalog, Templates | NPA Historical, NPA SOPs | KB_Ideation_Agent |
| **TIER 3** | Classification Router (NPA) | Regulatory Policy, Product Catalog | NPA Classification Rules, NPA Policy | KB_Classification_Agent |
| **TIER 3** | Template Auto-Fill (NPA) | Templates Library | NPA Historical Data | KB_Template_Autofill_Agent |
| **TIER 3** | KB Search (NPA) | None (focuses on domain) | NPA Historical Data (PRIMARY) | KB_Search_Agent |
| **TIER 3** | ML Prediction (NPA) | None | NPA Historical Data (for training) | KB_ML_Prediction |
| **TIER 3** | Conversational Diligence (NPA) | All 4 Global KBs | All 5 NPA KBs | KB_Conversational_Diligence |
| **TIER 3** | Governance Agent (NPA) | Org Structure | NPA Approval Workflows | KB_Governance_Agent |
| **TIER 3** | Risk Agent (NPA) | Regulatory Policy (PRIMARY) | NPA Policy | KB_Risk_Agent |
| **TIER 4** | Knowledge Base Agent (Utility) | None | Domain KBs (via metadata routing) | Custom RAG logic |
| **TIER 4** | Notification Agent (Utility) | Templates Library, Org Structure | None | Notification templates |

### How to Link KBs to Agents in Dify

**Step-by-Step:**

1. **Create Agent** (Dify → Agents → Create Agent)
   - Name: "Product Ideation Agent"
   - Type: Conversational Agent

2. **Add System Prompt**
   - Paste KB_Ideation_Agent.md (if <8K) OR
   - Write condensed prompt + reference dedicated KB

3. **Link Knowledge Bases** (Dify → Agent Settings → Knowledge)
   - Click "+ Add Knowledge Base"
   - Select KBs from dropdown:
     - ✅ KB_Global_DBS_Product_Catalog
     - ✅ KB_Global_Templates_Library
     - ✅ KB_NPA_Historical_Data
     - ✅ KB_NPA_SOPs
     - ✅ KB_Ideation_Agent (if using dedicated KB approach)

4. **Configure Retrieval Settings** (per KB)
   - **KB_NPA_Historical_Data:**
     - Top-K: 10
     - Similarity Threshold: 0.70
     - Reranking: ✅ Enabled
   - **KB_Global_Product_Catalog:**
     - Top-K: 5
     - Similarity Threshold: 0.75
     - Reranking: ❌ Disabled (smaller KB)

5. **Test Retrieval**
   - Dify → Agent → Test
   - Ask: "Find NPAs similar to FX straddle"
   - Verify: Agent retrieves from KB_NPA_Historical_Data, not Desk Support KBs

6. **Enable Metadata Filtering** (Advanced)
   - Dify → KB Settings → Metadata Schema
   - Define fields: `domain`, `product_type`, `year`, `desk`
   - In agent prompt: "When searching, filter by domain=NPA"

---

### Preventing KB Confusion: 3 Techniques

#### Technique 1: **Strict KB Scoping** (Primary Defense)
- **What:** Only link relevant KBs to each agent
- **Example:** Product Ideation Agent does NOT have access to KB_DeskSupport_12Pillars
- **Result:** Impossible to retrieve wrong knowledge (it's not in the search space)

#### Technique 2: **Metadata Filtering** (Secondary Defense)
- **What:** Tag all KB documents with `domain` metadata
- **Example:** 
  - NPA docs: `domain=NPA`
  - Desk Support docs: `domain=DeskSupport`
- **Agent Prompt:** "When retrieving, always filter by domain=NPA"
- **Result:** Even if agent has access to multiple domains, it filters correctly

**Dify Implementation:**
```json
# In KB document metadata
{
  "domain": "NPA",
  "product_type": "FX Option",
  "year": 2024
}

# In agent system prompt
"When using KB_NPA_Historical_Data, always filter by domain=NPA. 
 Query example: 'Find NPAs similar to FX straddle WHERE domain=NPA AND year>=2024'"
```

#### Technique 3: **Retrieval Prompt Engineering** (Tertiary Defense)
- **What:** Instruct agent to ignore irrelevant results
- **Agent Prompt:** 
  ```
  "If you retrieve a document tagged with domain!=NPA, IGNORE it and do not use it in your response. 
   Only use documents where domain=NPA."
  ```
- **Result:** Even if wrong doc sneaks through, agent won't use it

**Combined Defense (All 3):**
```
Agent: Classification Router (NPA)

KB Links: 
  ✅ KB_NPA_Classification_Rules (scoped correctly)
  ✅ KB_Global_Product_Catalog (shared, but filtered)
  ❌ KB_DeskSupport_12Pillars (NOT LINKED)

Metadata: All NPA docs tagged with domain=NPA

System Prompt:
"You are the Classification Router for NPA.
 Use KB_NPA_Classification_Rules and KB_Global_Product_Catalog.
 Always filter retrieval by domain=NPA.
 Ignore any documents where domain!=NPA."

Result: ZERO chance of retrieving Desk Support knowledge ✅
```

---

## 6. Implementation Roadmap

### Phase 1: Foundation (Week 1-2)

**Goal:** Create Tier 1 Global KBs + NPA Domain KBs

**Tasks:**
1. ✅ **Create 4 Global KBs in Dify**
   - KB_Global_Regulatory_Policy
   - KB_Global_Templates_Library
   - KB_Global_DBS_Product_Catalog
   - KB_Global_Org_Structure

2. ✅ **Upload Documents to Global KBs**
   - Gather PDFs, Excel files, Word docs
   - Upload to respective KBs in Dify
   - Tag with metadata (domain=Global, type=policy/template/catalog/org)

3. ✅ **Create 5 NPA Domain KBs**
   - KB_NPA_Historical_Data
   - KB_NPA_Policy_Guidelines
   - KB_NPA_SOPs
   - KB_NPA_Classification_Rules
   - KB_NPA_Approval_Workflows

4. ✅ **Upload NPA Documents**
   - Historical NPAs: 1,784 PDFs (batch upload)
   - Policy PDFs: 6 category documents
   - SOPs: 15 PDF files
   - Classification rules: Excel files
   - Workflow diagrams: PDF files

5. ✅ **Configure Chunking & Retrieval**
   - Set chunking: 800 tokens, 50 overlap (for all KBs)
   - Set Top-K: 10 (Historical Data), 5 (Policy), 3 (SOPs)
   - Enable reranking for Historical Data

**Deliverable:** 9 fully configured KBs (4 Global + 5 NPA)

---

### Phase 2: Agent-Specific KBs (Week 3)

**Goal:** Upload 10 Agent-Specific KBs (your KB_*.md files)

**Tasks:**
1. ✅ **Review KB_*.md Files for Size**
   - Check token count (use OpenAI tokenizer or Dify preview)
   - Files >8K tokens → Must use dedicated KB
   - Files <8K tokens → Option to use System Prompt

2. ✅ **Create Dedicated KBs for Large Files**
   - KB_Master_COO_Orchestrator (70K → dedicated KB)
   - KB_Conversational_Diligence (43K → dedicated KB)
   - KB_Risk_Agent (35K → dedicated KB)
   - KB_Classification_Agent (33K → dedicated KB)
   - KB_Search_Agent (32K → dedicated KB)
   - KB_Ideation_Agent (31K → dedicated KB)
   - KB_Governance_Agent (31K → dedicated KB)
   - KB_ML_Prediction (30K → dedicated KB)
   - KB_Template_Autofill_Agent (29K → dedicated KB)

3. ✅ **Upload to Dify**
   - Dify → Knowledge → Create KB → Upload .md file
   - Set chunking: 1000 tokens, 100 overlap (preserve logic flow)
   - Tag metadata: domain=NPA, type=agent_logic

4. ✅ **Create Condensed Versions** (for System Prompts)
   - Extract key rules/logic from each KB_*.md (target: 5K tokens)
   - Save as KB_*_Condensed.md
   - Use in agent System Prompts

**Deliverable:** 10 agent-specific KBs + 10 condensed prompts

---

### Phase 3: Link Agents to KBs (Week 4)

**Goal:** Build all 10 NPA Sub-Agents in Dify and link KBs correctly

**Tasks:**
1. ✅ **Create Agent: Product Ideation**
   - Dify → Agents → Create Agent
   - System Prompt: Paste KB_Ideation_Agent_Condensed.md
   - Link KBs:
     - KB_Global_Product_Catalog
     - KB_Global_Templates_Library
     - KB_NPA_Historical_Data
     - KB_NPA_SOPs
     - KB_Ideation_Agent (full logic)
   - Configure retrieval: Top-K=10, Threshold=0.70

2. ✅ **Create Agent: Classification Router**
   - System Prompt: Paste KB_Classification_Agent_Condensed.md
   - Link KBs:
     - KB_Global_Regulatory_Policy
     - KB_Global_Product_Catalog
     - KB_NPA_Classification_Rules
     - KB_NPA_Policy_Guidelines
     - KB_Classification_Agent (full logic)

3. ✅ **Repeat for all 10 NPA Sub-Agents**
   - Template Auto-Fill Engine
   - KB Search Sub-Agent
   - ML Prediction Sub-Agent
   - Conversational Diligence Sub-Agent
   - Governance Agent
   - Risk Agent
   - Domain Orchestrator (NPA)
   - Master COO Orchestrator

4. ✅ **Test Each Agent Individually**
   - Test Product Ideation: "Describe a new FX option product"
   - Test Classification: "Classify: FX Forward, $30M, BBB+ counterparty"
   - Test KB Search: "Find NPAs similar to FX straddle"
   - Test Conversational Diligence: "What's the approval threshold for cross-border NPAs?"

**Deliverable:** 10 fully functional NPA Sub-Agents with correct KB links

---

### Phase 4: Multi-Agent Orchestration (Week 5)

**Goal:** Connect agents via Domain Orchestrator and Master Orchestrator

**Tasks:**
1. ✅ **Create NPA Domain Orchestrator**
   - Dify → Multi-Agent Workflow
   - Define routing table (from KB_Domain_Orchestrator_NPA.md)
   - Link to 10 NPA Sub-Agents
   - Test handoffs: "Create a new NPA" → routes to Product Ideation

2. ✅ **Create Master COO Orchestrator**
   - Dify → Multi-Agent Workflow
   - Define routing table (from KB_Master_COO_Orchestrator.md)
   - Link to 7 Domain Agents (NPA, Desk Support, etc.)
   - Test routing: "I have a new product" → routes to NPA Domain Agent

3. ✅ **End-to-End Test**
   - User: "I want to create a new FX straddle product, $50M, Singapore desk"
   - Expected flow:
     1. Master Orchestrator → NPA Domain Agent
     2. NPA Domain Agent → Product Ideation Agent
     3. Product Ideation → Classification Router
     4. Classification Router → Template Auto-Fill
     5. Template Auto-Fill → KB Search (retrieves TSG1917)
     6. Result: Pre-filled NPA template returned to user

**Deliverable:** Fully orchestrated multi-agent system

---

### Phase 5: Utility Agents (Week 6)

**Goal:** Build 9 shared Utility Agents

**Tasks:**
1. ✅ **Create Utility Agents**
   - Knowledge Base Agent (RAG Engine)
   - Workflow State Manager
   - Loop-Back Handler
   - Notification Agent
   - Document Processing Agent
   - Data Retrieval Agent
   - Audit Logger
   - ... (3 more)

2. ✅ **Link Utility Agents to Multiple Domains**
   - Notification Agent → Used by NPA, Desk Support, DCE
   - Knowledge Base Agent → Used by all 7 domains

**Deliverable:** 9 Utility Agents accessible to all domain agents

---

### Phase 6: Testing & Optimization (Week 7-8)

**Goal:** Validate KB retrieval accuracy and optimize performance

**Tasks:**
1. ✅ **Test Retrieval Accuracy**
   - For each agent, run 20 test queries
   - Measure:
     - Hit Rate: % of queries that return relevant results
     - Precision: % of results that are actually relevant
     - Response Time: Average retrieval time
   - Target: Hit Rate >85%, Precision >80%, Response Time <2s

2. ✅ **Optimize Chunking**
   - If hit rate <85%, adjust chunking size
   - Try: 600 tokens, 800 tokens, 1000 tokens
   - Measure impact on retrieval

3. ✅ **Optimize Reranking**
   - Enable Cohere Rerank for low-precision KBs
   - Measure improvement

4. ✅ **Optimize Metadata Filtering**
   - Add more granular metadata tags
   - Test filtered vs unfiltered retrieval

**Deliverable:** Optimized KB retrieval with documented performance metrics

---

## 7. Access Control & Permissions

### Dify's Access Control Model

Dify has **two levels** of access control:
1. **Workspace-level:** Who can access the entire workspace (Team members)
2. **Knowledge Base-level:** Who can view/edit specific KBs (limited in Dify Cloud)

**Limitation:** Dify Cloud does NOT support fine-grained KB permissions (e.g., "User A can access NPA KBs but not Desk Support KBs")

**Workaround:** Use separate Dify Workspaces per domain

---

### Recommended Access Control Strategy

#### Option 1: Single Workspace (Simpler, Less Secure)
- **Setup:** All 7 domains in one Dify workspace
- **Access:** All agents can technically access all KBs
- **Defense:** Rely on KB scoping (agents manually configured to only link relevant KBs)
- **Pros:** 
  - ✅ Easy to manage
  - ✅ Shared utility agents work seamlessly
- **Cons:**
  - ❌ No enforcement (admin mistake could link wrong KB)
  - ❌ All team members see all KBs

**Use Case:** Small team, trusted users, Phase 1 pilot

---

#### Option 2: Multi-Workspace (More Secure, Complex)
- **Setup:** 
  - Workspace 1: NPA + Shared Utilities
  - Workspace 2: Desk Support + Shared Utilities
  - Workspace 3: DCE + Shared Utilities
  - ... (7 workspaces total)
- **Access:** 
  - NPA team only accesses Workspace 1
  - Desk Support team only accesses Workspace 2
- **KB Duplication:** 
  - Global KBs duplicated across workspaces (or use Dify API to share)
- **Pros:**
  - ✅ Strong isolation (impossible to access wrong KB)
  - ✅ Team-level access control
- **Cons:**
  - ❌ Complex setup
  - ❌ Duplicate KBs (higher storage cost)
  - ❌ Harder to maintain (update Global KBs in 7 places)

**Use Case:** Large team, regulatory compliance, production

---

#### Option 3: Hybrid (Recommended)
- **Setup:**
  - Workspace 1: NPA + Desk Support + DCE (related functions)
  - Workspace 2: ORM + BLA + SPM + BAP (related functions)
  - Workspace 3: Shared Utilities + Global KBs (read-only)
- **Access:**
  - Treasury COO team → Workspace 1
  - Operations COO team → Workspace 2
  - All teams → Workspace 3 (shared)
- **Pros:**
  - ✅ Balanced isolation and collaboration
  - ✅ Reduced KB duplication
- **Cons:**
  - ⚠️ Requires careful planning

**Recommendation:** Start with Option 1 (single workspace) for MVP, migrate to Option 3 for production.

---

### Role-Based Access Control (RBAC)

Define roles in your system (outside Dify, enforced via Angular UI):

| Role | Permissions |
|------|-------------|
| **NPA Maker** | Access NPA agents, create NPAs, view NPA KBs |
| **NPA Checker** | Approve NPAs, view full audit logs |
| **Desk Support Analyst** | Access Desk Support agents, query ROBO |
| **Admin** | Manage all agents, all KBs, all configurations |
| **Read-Only Viewer** | View dashboards, analytics (no agent access) |

**Enforcement:**
- Angular frontend checks user role before allowing agent access
- Dify agent validates user role (passed in metadata)
- Supabase RLS (Row-Level Security) filters data by user role

---

## 8. KB Maintenance & Updates

### Update Frequency

| KB Type | Update Frequency | Update Method |
|---------|------------------|---------------|
| **Global KBs** | Quarterly | Manual upload (admin) |
| **Domain KBs (Historical Data)** | Monthly | Automated batch upload |
| **Domain KBs (Policies)** | Semi-annually | Manual upload (admin) |
| **Agent-Specific KBs** | As needed (rare) | Version control (Git) |

---

### Historical NPA Ingestion (Automated)

**Goal:** Auto-ingest newly approved NPAs into KB_NPA_Historical_Data

**Process:**
1. **NPA Approved** (in production workflow)
2. **Trigger:** Webhook fires when NPA reaches state "Approved"
3. **Extract:** NPA full document + metadata exported to JSON
4. **Upload:** Dify API call to add document to KB_NPA_Historical_Data
5. **Reindex:** Dify auto-chunks and re-embeds
6. **Notify:** Admin notified via email

**Implementation (Python example):**
```python
import requests

def upload_npa_to_kb(npa_id, document_path, metadata):
    """Upload newly approved NPA to Dify KB"""
    
    dify_api_url = "https://api.dify.ai/v1/datasets/{dataset_id}/documents"
    dify_api_key = "YOUR_API_KEY"
    
    # Prepare document
    with open(document_path, 'rb') as f:
        files = {'file': f}
        data = {
            'name': f"NPA_{npa_id}",
            'metadata': json.dumps(metadata),  # {product_type, desk, outcome, etc.}
        }
        
        # Upload
        headers = {'Authorization': f'Bearer {dify_api_key}'}
        response = requests.post(dify_api_url, headers=headers, files=files, data=data)
        
        if response.status_code == 200:
            print(f"NPA {npa_id} uploaded to KB successfully")
        else:
            print(f"Error uploading NPA {npa_id}: {response.text}")

# Example usage
metadata = {
    "npa_id": "TSG1917",
    "product_type": "FX Option",
    "desk": "Singapore FX",
    "outcome": "Approved",
    "year": 2024
}
upload_npa_to_kb("TSG1917", "/path/to/TSG1917.pdf", metadata)
```

**Schedule:** Runs nightly (batch process all NPAs approved in last 24 hours)

---

### Policy Updates (Manual)

**Process:**
1. **Policy team updates** regulatory document (e.g., MAS 656)
2. **Admin uploads** new version to KB_Global_Regulatory_Policy
3. **Dify auto-replaces** old version (based on filename match)
4. **All agents** immediately use new policy (no redeployment needed)

**Best Practice:** Version control policy docs
- Filename: `MAS_Notice_656_v2024.pdf`
- Metadata: `version=2024, effective_date=2024-01-01`
- Agents can query specific versions if needed

---

### Agent Logic Updates (Version Control)

**Process:**
1. **Developer updates** KB_Ideation_Agent.md in Git repo
2. **Git commit + push**
3. **CI/CD pipeline** (GitHub Actions) uploads to Dify via API
4. **Dify re-indexes** agent KB
5. **Agent automatically uses** new logic

**Git Workflow:**
```bash
# Update agent logic
vim KB_Ideation_Agent.md

# Commit
git add KB_Ideation_Agent.md
git commit -m "Updated Product Ideation: Added bundling detection in Q7"
git push

# CI/CD auto-uploads to Dify
# (see GitHub Actions workflow below)
```

**GitHub Actions Workflow (.github/workflows/upload-kb.yml):**
```yaml
name: Upload KB to Dify
on:
  push:
    paths:
      - 'KB_*.md'

jobs:
  upload:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Upload to Dify
        run: |
          # For each changed KB_*.md file
          for file in KB_*.md; do
            curl -X POST https://api.dify.ai/v1/datasets/{dataset_id}/documents \
              -H "Authorization: Bearer ${{ secrets.DIFY_API_KEY }}" \
              -F "file=@$file" \
              -F "name=$file"
          done
```

---

## 9. Performance Optimization

### Retrieval Speed Optimization

**Goal:** Keep retrieval <2 seconds for all queries

**Techniques:**

#### 1. **Chunking Optimization**
- **Problem:** Too large chunks (>1200 tokens) → Slow embedding
- **Solution:** Optimal chunk size = 800 tokens, 50 overlap
- **Measurement:** Test retrieval speed with different chunk sizes

#### 2. **Index Optimization**
- **Problem:** Large KBs (>10,000 docs) → Slow search
- **Solution:** Use Qdrant or Pinecone (faster than Dify's default)
- **Setup:** Dify → Settings → Vector Database → Connect Qdrant

#### 3. **Caching**
- **Problem:** Repeated queries to same KB → Redundant retrieval
- **Solution:** Cache top-K results in Redis (TTL: 1 hour)
- **Implementation:** 
  ```python
  import redis
  r = redis.Redis(host='localhost', port=6379, db=0)
  
  def cached_retrieval(query, kb_id):
      cache_key = f"kb:{kb_id}:query:{hash(query)}"
      cached = r.get(cache_key)
      if cached:
          return json.loads(cached)
      
      # Retrieve from Dify
      results = dify_retrieve(query, kb_id)
      
      # Cache for 1 hour
      r.setex(cache_key, 3600, json.dumps(results))
      return results
  ```

#### 4. **Parallel Retrieval**
- **Problem:** Agent queries multiple KBs sequentially → Slow
- **Solution:** Query KBs in parallel (async)
- **Implementation:**
  ```python
  import asyncio
  
  async def multi_kb_retrieve(query, kb_ids):
      tasks = [dify_retrieve_async(query, kb_id) for kb_id in kb_ids]
      results = await asyncio.gather(*tasks)
      return combine_results(results)
  ```

#### 5. **Reranking Optimization**
- **Problem:** Reranking all 100 results → Slow
- **Solution:** Rerank only top-20 (not top-100)
- **Setting:** Dify → KB → Reranking → Top-K=20

---

### Accuracy Optimization

**Goal:** >90% retrieval relevance

**Techniques:**

#### 1. **Hybrid Search (Semantic + Keyword)**
- **Problem:** Pure semantic search misses exact terms
- **Solution:** Enable keyword search (BM25) + semantic search
- **Setting:** Dify → KB → Retrieval Mode → Hybrid

#### 2. **Metadata Filtering**
- **Problem:** Retrieves documents from wrong domain
- **Solution:** Always filter by `domain` metadata
- **Implementation:** 
  ```python
  query = "Find FX Option NPAs"
  filters = {"domain": "NPA", "product_type": "FX Option"}
  results = dify_retrieve(query, kb_id, filters=filters)
  ```

#### 3. **Negative Sampling**
- **Problem:** Model learns to retrieve all docs (no discrimination)
- **Solution:** Train with negative examples (irrelevant docs)
- **Implementation:** Upload "negative" docs tagged with `is_negative=True`, exclude in retrieval

#### 4. **Continuous Evaluation**
- **Problem:** Retrieval accuracy degrades over time
- **Solution:** Track metrics weekly
- **Metrics:**
  - Hit Rate: % queries with at least 1 relevant result
  - MRR (Mean Reciprocal Rank): Position of first relevant result
  - NDCG (Normalized Discounted Cumulative Gain): Quality of ranking
- **Action:** If metrics drop >5%, retrain embeddings or adjust chunking

---

## 10. Appendix: KB File Manifest

### Complete List of Knowledge Bases

#### TIER 1: Global Knowledge Bases (4 KBs)

| KB Name | Size | Documents | Purpose |
|---------|------|-----------|---------|
| KB_Global_Regulatory_Policy | 250 MB | 47 PDFs | Regulatory compliance (MAS, CFTC, etc.) |
| KB_Global_Templates_Library | 50 MB | 28 files | Standard templates (NPA, reports, emails) |
| KB_Global_DBS_Product_Catalog | 120 MB | 361 products | T&M product inventory (FX, Rates, Credit, etc.) |
| KB_Global_Org_Structure | 15 MB | 12 files | Org chart, approvers, contacts |

**Total Tier 1:** 435 MB, 448 documents

---

#### TIER 2: Domain-Specific Knowledge Bases (35 KBs, 7 domains × 5 KBs each)

**NPA Domain (5 KBs):**

| KB Name | Size | Documents | Purpose |
|---------|------|-----------|---------|
| KB_NPA_Historical_Data | 3.2 GB | 1,784 NPAs | Institutional memory (2020-2025) |
| KB_NPA_Policy_Guidelines | 85 MB | 6 PDFs | 6-category NPA policies |
| KB_NPA_SOPs | 45 MB | 15 PDFs | Standard operating procedures |
| KB_NPA_Classification_Rules | 20 MB | 8 files | Product classification logic |
| KB_NPA_Approval_Workflows | 30 MB | 12 files | State machines, sign-off rules |

**Total NPA:** 3.38 GB, 1,825 documents

**Other Domains (30 KBs):**
- Desk Support: 5 KBs (1.2 GB, 5,234 docs)
- DCE: 5 KBs (800 MB, 234 docs)
- ORM: 5 KBs (600 MB, 567 docs)
- BLA: 5 KBs (400 MB, 89 docs)
- SPM: 5 KBs (350 MB, 123 docs)
- BAP: 5 KBs (300 MB, 156 docs)

**Total Tier 2:** 7.03 GB, 8,228 documents

---

#### TIER 3: Agent-Specific Knowledge Bases (10 KBs for NPA, + 60 for other domains)

**NPA Agent-Specific (10 KBs):**

| KB Name | Size | Purpose |
|---------|------|---------|
| KB_Ideation_Agent | 31 KB | Product Ideation interview logic |
| KB_Classification_Agent | 33 KB | Two-stage classification rules |
| KB_Template_Autofill_Agent | 29 KB | Four-step auto-fill process |
| KB_Search_Agent | 32 KB | RAG search methodology |
| KB_ML_Prediction | 30 KB | XGBoost prediction logic |
| KB_Conversational_Diligence | 43 KB | Q&A and policy explanations |
| KB_Governance_Agent | 31 KB | Approval orchestration |
| KB_Risk_Agent | 35 KB | Prohibited list checking |
| KB_Domain_Orchestrator_NPA | 2 KB | NPA routing table |
| KB_Master_COO_Orchestrator | 70 KB | Tier 1 routing logic |

**Total Agent-Specific (NPA):** 366 KB

**Total Tier 3 (All Domains):** ~2.5 MB (70 agent KBs)

---

#### TIER 4: Utility Agent KBs (9 KBs)

| KB Name | Size | Purpose |
|---------|------|---------|
| KB_Utility_Workflow_State_Manager | 25 KB | State machine enforcement |
| KB_Utility_Loop_Back_Handler | 18 KB | Circuit breaker logic |
| KB_Utility_Notification_Engine | 22 KB | Notification templates |
| KB_Utility_Document_Processing | 28 KB | OCR and extraction logic |
| KB_Utility_Data_Retrieval | 30 KB | API integration (C720, Murex) |
| KB_Utility_Audit_Logger | 20 KB | Compliance logging |
| KB_Utility_Conflict_Resolver | 15 KB | Cross-domain conflict resolution |
| KB_Utility_Health_Monitor | 12 KB | Agent health checks |
| KB_Utility_Performance_Tracker | 18 KB | KPI tracking logic |

**Total Tier 4:** 188 KB

---

### Grand Total KB Storage

| Tier | Size | Documents |
|------|------|-----------|
| Tier 1 (Global) | 435 MB | 448 |
| Tier 2 (Domain) | 7.03 GB | 8,228 |
| Tier 3 (Agent-Specific) | 2.5 MB | 70 files |
| Tier 4 (Utility) | 188 KB | 9 files |
| **TOTAL** | **7.47 GB** | **8,755 documents** |

**Estimated Dify Costs** (based on Dify Cloud pricing):
- Storage: $0.10/GB/month = $0.75/month
- Embeddings: 8,755 docs × 800 tokens avg = ~7M tokens = $3.50 one-time
- Vector Database: Qdrant Cloud = $25/month (500K vectors)
- **Total:** ~$30/month operational cost

---

## Summary & Next Steps

### Key Takeaways

1. ✅ **3-Tier KB Architecture** ensures agents only access relevant knowledge
2. ✅ **Strict KB scoping** + metadata filtering + prompt engineering = Zero confusion
3. ✅ **Global KBs** for shared knowledge (policies, templates, org structure)
4. ✅ **Domain KBs** for function-specific knowledge (NPA, Desk Support, etc.)
5. ✅ **Agent KBs** for sub-agent logic (embedded in prompts or dedicated KBs)
6. ✅ **Automated ingestion** for historical data (monthly NPA uploads)
7. ✅ **Version control** for agent logic (Git + CI/CD)
8. ✅ **Performance optimization** via chunking, caching, parallel retrieval

---

### Recommended Next Steps

**Week 1-2: Foundation**
1. Create 4 Global KBs in Dify
2. Upload documents to Global KBs
3. Create 5 NPA Domain KBs
4. Upload NPA documents (1,784 NPAs)

**Week 3: Agent KBs**
1. Upload 10 agent-specific KBs (KB_*.md files)
2. Create condensed versions for System Prompts

**Week 4: Link Agents**
1. Build 10 NPA Sub-Agents in Dify
2. Link each agent to correct KBs
3. Test retrieval for each agent

**Week 5: Orchestration**
1. Build NPA Domain Orchestrator
2. Build Master COO Orchestrator
3. Test end-to-end workflow

**Week 6: Utility Agents**
1. Build 9 Utility Agents
2. Link to multiple domains

**Week 7-8: Testing & Optimization**
1. Measure retrieval accuracy
2. Optimize chunking, reranking, metadata
3. Document performance metrics

---

### Success Criteria

- ✅ **Zero KB confusion:** Agents never retrieve documents from wrong domain
- ✅ **Retrieval speed:** <2 seconds for all queries
- ✅ **Retrieval accuracy:** >90% relevance (user-rated)
- ✅ **Scalability:** Easy to add new domains (Desk Support, DCE, etc.) without affecting NPA
- ✅ **Maintainability:** Update policy once, all agents auto-sync

---

**You're ready to build!** 🚀

Let me know when you want to dive into specific implementation details (e.g., "How do I upload 1,784 NPAs via Dify API?" or "Show me the exact agent configuration for Product Ideation Agent").
