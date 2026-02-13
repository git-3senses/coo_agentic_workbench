# Dify Agent Setup Guide: COO Agentic Workbench

**Goal**: Create a unified "Agentic OS" where a single Global Orchestrator manages multiple Domains (NPA, Desk Support) without creating dozens of disparate Chatbots.

**Strategy**: **"Workflows as Tools"**.
*   **Orchestrators** are **Chatflow Apps** (Stateful, conversational).
*   **Functional Agents** are **Workflow Apps** (Stateless, logic-heavy) published as **Tools**.

---

## 🏗️ Architecture Overview

| Tier | Agent Name | Dify App Type | System Context Source |
| :--- | :--- | :--- | :--- |
| **1. Global** | **COO Master Orchestrator** | **Chatflow** | `KB_Master_COO_Orchestrator.md` |
| **2. Domain** | **NPA Domain Orchestrator** | **Worflow as Tool** (Called by Global) *OR* **Chatflow** (if standalone) | `KB_Domain_Orchestrator_NPA.md` |
| **3. Functional** | **Ideation Agent** | **Workflow as Tool** | `KB_Ideation_Agent.md` |
| **3. Functional** | **Risk Agent** | **Workflow as Tool** | `KB_Risk_Agent.md` |
| **3. Functional** | **Governance Agent** | **Workflow as Tool** | `KB_Governance_Agent.md` |
| ... | (Other 5 Agents) | **Workflow as Tool** | (Respective KBs) |

*(Note: "Workflow as Tool" means you create a Workflow App in Dify, then publish it as a Tool to be called by the Orchestrator).*

---

## 🚀 Phase 1: Create the "Worker" Workflows
*Create these first so the Orchestrators have tools to call.*

### Step 1.1: Create Functional Workflows
Repeat this process for all 8 Functional Agents (Risk, Ideation, Classification, Governance, Autofill, Diligence, Search, Prediction).

1.  **Dify**: Create New App -> **Workflow** -> Name: `[Agent Name] (Worker)`.
2.  **Start Node**: Define Variables needed (e.g., `user_query`, `product_context`).
3.  **LLM Node**:
    *   **System Prompt**: Copy content from the corresponding **KB File** (e.g., `KB_Risk_Agent.md`).
    *   **User Prompt**: `{{user_query}}`
4.  **End Node**: Return the LLM output.
5.  **Publish**:
    *   Go to **Tools** -> **Custom Tool**.
    *   Import from Workflow.
    *   Name it `tool_[agent_name]`.

**Optimization Tip**: For `Ideation Agent`, since it performs an Interview, you might want to keep it as a **Chatflow** and have the NPA Orchestrator route the user to it via a URL redirect or specialized handover, OR implement the interview logic as a multi-step Workflow loop.

---

## 🧠 Phase 2: Create the NPA Domain Orchestrator
*The Specialist Manager for New Products.*

1.  **Dify**: Create New App -> **Chatflow** -> Name: `NPA Domain Orchestrator`.
2.  **Context**: Copy `KB_Domain_Orchestrator_NPA.md` into the "Instructions" / System Prompt.
3.  **Tools**: Add the 8 Custom Tools you created in Phase 1 (e.g., `tool_risk_agent`, `tool_classification_agent`).
4.  **Logic**:
    *   The LLM will use the **Routing Table** in the KB to decide which Tool to call.
    *   *Example*: User says "Is Bitcoin allowed?", LLM sees "Risk Agent" in KB, calls `tool_risk_agent` with input "Bitcoin".

---

## 👑 Phase 3: Create the Global COO Orchestrator
*The Single Entry Point.*

1.  **Dify**: Create New App -> **Chatflow** -> Name: `COO Global Orchestrator`.
2.  **Context**: Copy `KB_Master_COO_Orchestrator.md` into the System Prompt.
3.  **Tools**:
    *   Add `tool_npa_orchestrator` (if you published Phase 2 as a tool/workflow).
    *   *Alternatively*: Use **Dify's "Agent Mode" features** to define "NPA Manager" as a Sub-Agent.
4.  **Routing**:
    *   The Global Orchestrator uses the logic: "If intent related to NPA, call NPA Manager".

---

## 📝 KB File Reference
Use these files for the **System Prompts**:

*   **Global**: `Context/Dify_Agent_KBs/KB_Master_COO_Orchestrator.md`
*   **NPA Domain**: `Context/Dify_Agent_KBs/KB_Domain_Orchestrator_NPA.md`
*   **Ideation**: `Context/Dify_Agent_KBs/KB_Ideation_Agent.md`
*   **Risk**: `Context/Dify_Agent_KBs/KB_Risk_Agent.md`
*   **Classification**: `Context/Dify_Agent_KBs/KB_Classification_Agent.md`
*   **Governance**: `Context/Dify_Agent_KBs/KB_Governance_Agent.md`
*   **Autofill**: `Context/Dify_Agent_KBs/KB_Template_Autofill_Agent.md`
*   **Diligence**: `Context/Dify_Agent_KBs/KB_Conversational_Diligence.md`
*   **Search**: `Context/Dify_Agent_KBs/KB_Search_Agent.md`
*   **Prediction**: `Context/Dify_Agent_KBs/KB_ML_Prediction.md`

---

## 💡 Best Practices

1.  **Strict Inputs**: In your `KB_*.md` files, review the **Input/Output Schema**. Ensure your Dify Workflow Start/End nodes match these JSON structures exactly.
2.  **Temperature**:
    *   **Orchestrators**: `0.0` (Strict Routing).
    *   **Ideation/Diligence**: `0.7` (Creative/Conversational).
    *   **Risk/Governance**: `0.0` (Strict Rules).
3.  **Testing**:
    *   Test the **Risk Agent Workflow** independently first.
    *   Then test the **NPA Orchestrator's** ability to call the Risk Agent.
    *   Finally, test the **Global Orchestrator**.
