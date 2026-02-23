# CF_NPA_BIZ — Dify Setup Guide
# Updated: 2026-02-23 | Version: 1.0
# Agent: AG_NPA_BIZ | Business / Proposing Unit
# Sections: PC.I (Product Specifications), PC.VII (Trading Info)

## Dify App Type: CHATFLOW (conversational, multi-turn)

The BIZ Agent is a **Tier 3B conversational chatflow** for the Draft Builder. It provides sign-off guidance for the Business / Proposing Unit, helping NPA makers draft and refine fields in Section I (Product Specifications) and Section VII (Trading Information). It is accessed via the Draft Builder chat panel when the user selects the "Business" tab.

### Architecture
```
NPA Draft Builder (Angular Frontend)
  └── Agent Chat Panel > "Business" tab
        └── DifyService.sendMessageStreamed(prompt, {}, 'AG_NPA_BIZ')
              └── Express Proxy > POST /api/dify/chat { agent_id: 'AG_NPA_BIZ' }
                    └── Dify Cloud > CF_NPA_BIZ (Chatflow) > DIFY_KEY_AG_NPA_BIZ
```

### Key Design Decisions
- **Chatflow, not Workflow**: Multi-turn conversation needed — users ask follow-up questions, refine suggestions, iterate on field values
- **No MCP Tools**: Unlike the Query Assistant, this agent does NOT call external tools. It relies on its system prompt knowledge + conversation context to provide guidance
- **@@NPA_META@@ output**: Structured field suggestions are embedded in the response text using the `@@NPA_META@@{json}@@END_META@@` envelope, which the frontend parses into Apply buttons
- **Context injection**: The frontend sends current field values as markdown context in each message, so the agent knows what's already filled in

---

## Step 1: Create Chatflow App
1. Go to **Dify Cloud** > **Studio** > **Create App** > **Chatbot** (Chat mode)
2. Name: `CF_NPA_BIZ`
3. Description: "NPA Draft Builder sign-off guidance agent for Business / Proposing Unit. Helps draft and refine fields in Section I (Product Specifications) and Section VII (Trading Information)."

## Step 2: Agent Configuration

### Model Settings
- Model: **Claude 3.5 Sonnet** (or claude-sonnet-4-5) | CHAT mode
- Temperature: **0.3** (needs creativity for LLM-strategy fields like business_rationale, but must remain factual)
- Max Tokens: **4000** (field suggestions can be detailed with multi-paragraph content)

### Instructions (System Prompt)
- Copy from `CF_NPA_BIZ_Prompt.md` — everything below the `---` line

### Input — No Variables Required
This is a Chatflow app — the user's message arrives as the `query` parameter in the API call. No START node or User Message Template needed.

The frontend injects context like this:
```
[Context: Reviewing NPA sections PC.I, PC.VII]

Current field values:
### Description
- **Product Name**: FX Option GBP/USD 6M
- **Product Type**: FX Option
- **Underlying Asset**: GBP/USD

User question: Help me fill the business rationale field
```

## Step 3: Knowledge Base (Optional)

For enhanced performance, attach these KB datasets if available:
- `KB_NPA_Policies` — NPA policy manual (classification, governance)
- Product catalogs / historical NPA summaries

**KB Settings:**
- Retrieval: Hybrid (keyword + semantic)
- Top K: 3
- Score Threshold: 0.5

If no KB datasets are available, the agent will rely on its system prompt knowledge, which is comprehensive enough for basic guidance.

## Step 4: No Tools Required

Unlike workflow agents, this chatflow does NOT need any MCP tools. It provides guidance based on:
1. System prompt domain knowledge
2. Conversation context (field values injected by frontend)
3. Knowledge base (if attached)

## Step 5: Test Conversations

Test these scenarios in the Dify playground:

**Test 1: Field guidance**
```
User: What should I write for the business rationale field?
Expected: Agent asks about the product type and purpose, then provides a suggestion with @@NPA_META@@ envelope
```

**Test 2: Context-aware suggestion**
```
User: [Context: Reviewing NPA sections PC.I, PC.VII]

Current field values:
### Description
- **Product Name**: FX Barrier Option EUR/USD
- **Product Type**: Exotic FX Option
- **Underlying Asset**: EUR/USD
- **Notional Amount**: 75,000,000

User question: Help me with the revenue projections for Year 1-3
Expected: Agent provides revenue estimates based on FX exotic option context, flags $50M Finance VP threshold, includes @@NPA_META@@ with revenue_year1/2/3 fields
```

**Test 3: Multi-field suggestion**
```
User: Can you help me fill in the customer information section?
Expected: Agent asks clarifying questions about target customers, then suggests multiple fields (customer_segments, customer_suitability, customer_objectives) with @@NPA_META@@ envelope
```

**Test 4: Section boundary**
```
User: What's the credit risk for this product?
Expected: Agent redirects to the RMG agent for Section IV credit risk fields
```

## Step 6: API Key
1. **Publish** the Chatflow app
2. Go to App > **API Access**
3. Copy the API key
4. Add to `server/.env`: `DIFY_KEY_AG_NPA_BIZ=app-xxxxx`

## Step 7: Test via Express Proxy

```bash
# Test: Basic guidance request
curl -X POST http://localhost:3000/api/dify/chat \
  -H "Content-Type: application/json" \
  -d '{"agent_id":"AG_NPA_BIZ","query":"Help me write the business rationale for an FX Option on GBP/USD","conversation_id":""}'

# Test: Context-injected request (simulating frontend)
curl -X POST http://localhost:3000/api/dify/chat \
  -H "Content-Type: application/json" \
  -d '{"agent_id":"AG_NPA_BIZ","query":"[Context: Reviewing NPA sections PC.I, PC.VII]\n\nCurrent field values:\n### Description\n- **Product Name**: FX Barrier Option EUR/USD\n\nUser question: Help me with the value proposition","conversation_id":""}'

# Test: Multi-turn conversation
curl -X POST http://localhost:3000/api/dify/chat \
  -H "Content-Type: application/json" \
  -d '{"agent_id":"AG_NPA_BIZ","query":"What about the customer suitability criteria?","conversation_id":"<conversation_id_from_previous>"}'
```

## Step 8: Frontend Integration Verification

The frontend wiring is already complete:
1. `npa-agent-chat.component.ts` maps `BIZ` → `AG_NPA_BIZ`
2. `difyService.sendMessageStreamed()` streams SSE chunks to the chat panel
3. `parseNpaMeta()` extracts `@@NPA_META@@` → `FieldSuggestion[]` → Apply buttons
4. `onApplySuggestion()` → parent `onApplyFieldSuggestion()` → updates `fieldMap`

## Step 9: Architecture Position

```
CF_COO_Orchestrator (Tier 1) ← MASTER_COO
  └── CF_NPA_Orchestrator (Tier 2) ← NPA_ORCHESTRATOR
        ├── ... (existing Tier 3 agents) ...
        ├── CF_NPA_BIZ (Tier 3B, Chatflow) ← AG_NPA_BIZ  ★ THIS APP
        ├── CF_NPA_TECH_OPS (Tier 3B, Chatflow) ← AG_NPA_TECH_OPS
        ├── CF_NPA_FINANCE (Tier 3B, Chatflow) ← AG_NPA_FINANCE
        ├── CF_NPA_RMG (Tier 3B, Chatflow) ← AG_NPA_RMG
        └── CF_NPA_LCS (Tier 3B, Chatflow) ← AG_NPA_LCS
```
