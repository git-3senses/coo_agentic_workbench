# NPA Functional Agent — Multi‑Agent Lifecycle UI (POC)

---

## 1. Objective of This Canvas

This document **redefines the NPA (New Product Approval) experience** by **amalgamating**:
- The **existing DBS NPA House lifecycle** (stages, templates, forms, BU sign‑offs)
- The **Multi‑Agent / AgentFlow model** inspired by Automodal / Multimodal
- Your **COO Multi‑Agent Workbench architecture**

The goal is **not to replace NPA**, but to:
> Elevate it into an **Agent‑orchestrated, auditable, intelligent control system**.

This canvas describes **what the NPA Functional Agent page should look like and do** in the new workbench.

---

## 2. Core Design Principle

**NPA remains process‑driven, not chat‑driven.**

Agents do not replace:
- Stages
- Forms
- BU approvals
- Templates

Instead, agents:
- Sit **inside each stage**
- Assist with ingestion, validation, analysis, decisioning, and reporting
- Make the lifecycle **faster, safer, and more explainable**

Think of it as:
> “The same NPA house — now powered by invisible specialists working continuously.”

---

## 3. NPA Functional Agent — Page Entry Point

When a user clicks **NPA Functional Agent** from the Command Center:

### 3.1 Header Context

- **NPA Name / ID** (e.g., NPA210921 – Simple Option on Crypto Loan)
- Product Type / Asset Class
- Business Unit (Treasury & Markets, etc.)
- Selected **NPA Template**
- Overall Status (Discover / Review / Sign‑Off / Launched / Monitoring)

This reassures users:
> “I am still in NPA — just smarter.”

---

## 4. Template‑Driven Lifecycle (Unchanged, but Smarter)

### 4.1 NPA Template as the Backbone

- User selects an **NPA Template** at creation
- Template defines:
  - Stage structure
  - Required forms per stage
  - Mandatory BU sign‑offs
  - Documents required
  - PIR & Monitoring rules

Agents **do not alter the template** — they **operate within it**.

### 4.2 Template Agent (New — Control Plane Agent)

The **Template Agent** is a **system‑level orchestration agent** responsible for ensuring that every NPA instance faithfully follows its selected template.

**What the Template Agent does:**
- Instantiates stages automatically when a template is selected
- Activates the correct **Form Agents** and **Stage Sub‑Agents** per stage
- Enforces mandatory stage sequencing (cannot skip sign‑offs)
- Validates template compliance as the NPA progresses

**What the user sees in UI:**
- Selected template clearly visible in header
- Template health indicator (e.g., *"Template‑compliant"*, *"Deviation detected"*)
- Read‑only view of template definition (for transparency)

This ensures:
> “Every NPA behaves exactly as designed — no tribal overrides.”


---

## 5. Lifecycle Navigation (Stage Rail)

Left‑side vertical rail (same mental model as today):

1A – Discover
1B – Review
2 – Sign Off
3A – Preparing for Launch
3B – Ready for Launch
4 – Launched
5 – PIR
6 – Monitoring

Each stage shows:
- Status (Not Started / In Progress / Completed)
- Agent activity indicator (⚙️)
- Human approval indicator (👤)

---

## 6. Stage = Container of Forms + Agents

Each stage page is composed of **three layers**:

### Layer 1: Human Forms & Documents (Existing)
- Forms created via Form Builder
- Document uploads
- Comments & conditions

### Layer 2: Embedded Sub‑Agents (New)
- Agents observe, validate, analyze, and assist

### Layer 3: Governance & Audit (Always visible)
- Who approved what
- Why a decision was suggested
- What evidence was used

### Layer 4: Form Agent (New — Execution‑Aware Agent)

The **Form Agent** sits *inside each stage* and works alongside human‑filled forms.

**What the Form Agent does:**
- Watches form inputs in real time
- Validates completeness and internal consistency
- Auto‑extracts structured data from uploaded documents into form fields
- Flags contradictions between form entries and documents

**What the user sees in UI:**
- Inline suggestions next to form fields
- Soft warnings ("This value deviates from similar NPAs")
- Auto‑filled fields with clear AI attribution

The Form Agent:
- **Never submits on behalf of the user**
- **Never changes values silently**

It behaves like:
> “A senior reviewer quietly checking the form while you type.”
- Who approved what
- Why a decision was suggested
- What evidence was used

---

## 7. Stage‑Wise Agent Orchestration (Mapped to Your 5‑Step Model)

### 7.1 Ingestion (Primarily Stage 1A – Discover)

**What already exists:**
- Product details forms
- Initial documents
- Kick‑off comments

**New Embedded Sub‑Agents:**
- Document Ingestion Agent
- Specification Extraction Agent
- Email & Comment Capture Agent

**What the UI shows (side panel / inline):**
- Extracted key product attributes
- Detected risks keywords
- Missing mandatory documents (based on template)

Agents are **read‑only assistants** at this stage.

---

### 7.2 Triage (Stage 1B – Review)

**Existing reality:**
- Manual review of completeness

**New Sub‑Agents:**
- Completeness Validator Agent
- Template Compliance Agent

**UI Enhancements:**
- Completeness score per stage
- Auto‑flagged gaps (with references to forms/docs)
- “Ready for Sign‑Off” recommendation (non‑binding)

Human still decides when to move forward.

---

### 7.3 Diligence (Across Stage 1B & 2)

**Existing reality:**
- Heavy manual reading
- Historical comparisons done offline

**New Sub‑Agents:**
- Historical NPA Comparison Agent
- Conversational Diligence Agent (scoped)
- Risk Theme Analyzer

**UI Pattern (inspired by Automodal):**
- Conversational query box scoped to:
  - This NPA
  - Similar historical NPAs
  - Approved policy corpus
- Side‑by‑side comparison panels

Agents answer questions like:
> “Has a similar product been approved before with these conditions?”

---

### 7.4 Decisioning (Stage 2 – Sign‑Off)

This is **the most critical stage**.

#### Existing Model (Preserved)
- BU‑wise approvals:
  - Credit
  - Finance
  - L&C
  - MLR
  - T&O
  - T&M
- Conditions per BU
- Mandatory / Optional flags

#### New Agent Overlay

**Rule‑Based Decision Agents**
- Validate conditions against policy
- Check mandatory approvals completeness

**Practice‑Based Decision Agents**
- Learn from past approval patterns
- Highlight abnormal deviations

**UI Enhancements:**
- Per‑BU approval card shows:
  - Human status
  - Agent confidence indicator
  - Risk notes (read‑only)

Agents **cannot approve** — they **support approvers**.

---

### 7.5 Report & Launch Readiness (Stages 3 & 4)

**New Sub‑Agents:**
- Launch Readiness Agent
- Memo Generation Agent
- Condition Fulfilment Tracker

**UI Enhancements:**
- Auto‑generated approval memo preview
- Launch checklist with live status
- Traceability: condition → evidence → approver

---

## 8. PIR & Monitoring (Stages 5 & 6)

**Existing reality:**
- PIR often manual, delayed, or ad‑hoc

**New Sub‑Agents:**
- PIR Trigger Agent
- Performance Drift Agent
- Compliance Deviation Agent

**UI View:**
- Timeline of post‑launch metrics
- Comparison vs approved assumptions
- Auto‑triggered PIR alerts

---

## 9. Agent Governance & Extensibility

### 9.1 Sub‑Agent Management

Admins / Power Users can:
- Add a new sub‑agent to a stage
- Enable / disable agents per template
- Configure agent scope (read‑only vs advisory)

### 9.2 Audit Readiness (Non‑Negotiable)

Every agent action logs:
- Input used
- Output generated
- Confidence score
- Timestamp

This ensures:
> “Regulators can replay the story end‑to‑end.”

---

## 10. What Makes This Approach Powerful

- Respects existing NPA muscle memory
- Adds intelligence without disruption
- Makes approvals faster but safer
- Scales across products, regions, and regulators

This is not a UI facelift.

This is:
> **NPA as a Living, Learning, Governed System.**

---

## 11. Why This Will Sell Internally

Business will feel:
- Familiarity
- Control
- Reduced cognitive load

Technology will see:
- Clear agent boundaries
- Template‑driven orchestration
- Safe extensibility

Leadership will see:
- Auditability
- Speed
- Strategic leverage

---

**This canvas is now the canonical reference for the NPA Functional Agent in the COO Multi‑Agent Workbench.**

