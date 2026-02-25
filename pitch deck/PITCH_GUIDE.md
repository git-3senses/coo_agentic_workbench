# Pitching the NPA Agentic Workbench: The "One Intelligent Workbench"

This document aggregates the core principles, architecture, design rationale, and step-by-step breakdown of the New Product Approval (NPA) Agentic Workbench. Use this guide to pitch the system, answer anticipated "Why" and "How" questions, and explain the architecture from the highest strategic level down to the granular execution layer.

---

## 1. The Core Vision: The Paradigm Shift
**"Agents assist, Humans decide, and everything is auditable."**

**What it is:** The COO Multi-Agent Workbench is not just a dashboard; it is an **Agent-Centric Operating System** designed to orchestrate the complex operations of the COO's office.
**The Shift:** We are moving from siloed tools (NPA House, ROBO, RICO), manual emails, and disjointed spreadsheets to a unified command center. Here, **AI Agents act as digital employees**, handling specific functional tasks, enforcing rules, and retrieving knowledge, while humans retain absolute decision-making authority.

### Key Value Propositions
*   **Orchestration, Not Just Chat:** Agents execute concrete workflows (ingest docs, validate rules, draft memos), they do not just answer questions.
*   **Radical Efficiency:** Target is a 60% reduction in manual overhead (e.g., NPA processing from 12 days → 4 days).
*   **Audit-First Design:** 100% automated coverage of mandatory regulatory checks with an immutable evidence trail for regulators (e.g., MAS 656/643).
*   **Scalability:** A single architecture pattern that starts with NPA approval but scales across all 7 COO functions (Risk, Desk Support, etc.).

---

## 2. Key Documents to Reference
When pitching or defending the architecture, rely on these single sources of truth. They contain the definitive specifications.

1.  **`01_Project_Vision.md`** (*Location: `.claude/worktrees/nostalgic-archimedes/Context/KB/01_Project_Vision.md`*)
    *   **Use when:** Explaining the high-level business goals, the "Phase 0 Ideation" innovation, the "Work Item" concept, and the overall paradigm shift.
2.  **`AGENT_ARCHITECTURE.md`** (*Location: `.claude/worktrees/nostalgic-archimedes/docs/architecture/AGENT_ARCHITECTURE.md`*)
    *   **Use when:** Explaining the 4-Tier, 15-Agent system design. This lists what every specific agent does, what tools it has, and what database tables it touches.
3.  **`ENTERPRISE_AGENT_ARCHITECTURE_FREEZE.md`** (*Location: `.claude/worktrees/nostalgic-archimedes/docs/dify-agents/ENTERPRISE_AGENT_ARCHITECTURE_FREEZE.md`*)
    *   **Use when:** Explaining the Dify integration strategy. Covers why we map the 13 logical agents into 7 Dify Apps (Chatflows vs Workflows), the output payload contracts (`@@NPA_META@@`), and the principle of **Least Privilege**.
4.  **`Tech_Rationale_Dify_vs_Express.md`** (*Location: `Archive/2026-02-18_Architecture_Gap_Analysis/Tech_Rationale_Dify_vs_Express.md`*)
    *   **Use when:** Defending the separation of concerns between Dify (The Brain) and Express (The Gatekeeper). Explains why business rules and database state transitions are hardcoded in Express instead of relying on LLMs.
5.  **`WIRING.md`** (*Location: `WIRING.md`*)
    *   **Use when:** Explaining the production topology (Angular UI -> Express App API -> Python MCP Tools). Explains how keys are kept secure and APIs are proxy-routed.

---

## 3. Architecture Breakdown (Top to Bottom)

The architecture is divided into two distinct responsibilities: **Intelligence (Dify)** and **Enforcement (Express API)**.

### The 4-Tier Agent Hierarchy (The Intelligence)
The system utilizes 15 specialized agents organized into 4 logical tiers.

*   **Tier 1: Strategic Command (Master COO Orchestrator)**
    *   **Role:** The supreme commander. Every user message enters here. It understands intent and routes the user to the correct domain (e.g., NPA vs Desk Support).
*   **Tier 2: Domain Orchestration (NPA Domain Orchestrator)**
    *   **Role:** The project manager. Decomposes large NPA tasks into sub-tasks and calls the Tier 3 specialist agents in the correct order based on the current workflow stage.
*   **Tier 3: Specialist Agents (The Workers)**
    *   **Role:** Execute specific tasks. Includes the Ideation Agent (drafts concepts), Classification Agent (scores NTG vs Variation), Risk Agent (4-layer validation cascade), AutoFill Agent, Governance Agent, Diligence Agent (Q&A), and Doc Lifecycle Agent.
*   **Tier 4: Shared Utility Agents**
    *   **Role:** Cross-cutting services available to all agents. Includes KB Search (RAG), Notification, Audit Trail (immutable logging), and Jurisdiction rule adaptation.

### The Separation of Concerns: Dify vs. Express
This is the most critical architectural decision to understand.

*   **Dify (The Brain):** Handles natural language understanding, semantic classification, risk narrative analysis, RAG over policy documents, and intelligent routing. Dify uses **Chatflows** for multi-turn conversations and **Workflows** for deterministic, single-step tasks.
*   **Express API (The Gatekeeper):** Enforces hard business rules. LLMs are probabilistic; compliance requires 100% determinism. Express handles atomic database transactions (e.g., advancing a stage only if all sign-offs are complete), enforces hard stops for prohibited products, runs scheduled cron jobs for SLA monitoring, and maintains the immutable audit trail.

---

## 4. Anticipated Questions & Answers (Why & How)

### Q: Why use Dify instead of just coding it all in Python/Express?
**A:** Dify provides the orchestration platform to quickly build, iterate, and monitor LLM logic. It gives us visual prompt chaining, built-in RAG capabilities, and a managed execution environment for complex, multi-agent reasoning, drastically reducing time-to-market for the "intelligence" layer.

### Q: Why not let Dify agents enforce the business rules directly?
**A:** Because LLMs are probabilistic (even at 99.9% accuracy, that 0.1% failure rate is a regulatory violation waiting to happen). Dify's code nodes also run in sandboxes without direct database access, and Dify workflows cannot act as middleware to intercept UI clicks. Express provides 100% deterministic, <1ms validation, and atomic database transactions needed for strict compliance.

### Q: How do the Agents actually interact with our secure data?
**A:** Using MCP (Model Context Protocol) Tools. We run a separate Python FastMCP server inside our secure network. Dify, acting as the client, calls these OpenAPI endpoints. We’ve built 71 granular tools. We enforce **Least Privilege**: The Orchestrator only has read tools, while the Risk Agent only has risk-related tools.

### Q: How does Angular (the UI) know what the Agent just did?
**A:** Through a strict **Envelope Contract**. Every Dify agent must return a final line like `@@NPA_META@@{"agent_action": "SHOW_CLASSIFICATION", "payload": {...}}`. The Express proxy intercepts this, strips it from the chat text, and passes it to Angular as structured JSON metadata. Angular reads `SHOW_CLASSIFICATION` and instantly renders a native UI card, not just a block of text.

### Q: What is "Phase 0 Ideation"?
**A:** It’s an innovation where users don't start by filling out a 45-field form. They start by *chatting* with the Ideation Agent ("I want to trade a vanilla FX option"). The agent interviews them, builds the context, checks for prohibited items upfront, and then *auto-fills* the formal NPA request draft for them. It shifts the burden of data entry from the human to the AI.
