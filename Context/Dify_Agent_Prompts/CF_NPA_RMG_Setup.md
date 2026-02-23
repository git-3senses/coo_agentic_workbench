# CF_NPA_RMG — Dify Setup Guide
# Updated: 2026-02-23 | Version: 1.0
# Agent: AG_NPA_RMG | Risk Management Group
# Sections: PC.IV (Risk Analysis), PC.VI (Other Risks)

## Dify App Type: CHATFLOW (conversational, multi-turn)

The RMG Agent is a **Tier 3B conversational chatflow** for the Draft Builder. It provides sign-off guidance for the Risk Management Group (RMG-Credit, RMG-MLR, RMG-OR), helping NPA makers draft and refine fields in Section IV (Risk Analysis) and Section VI (Other Risks). It covers regulatory compliance, market risk, credit risk, liquidity risk, stress testing, ESG, reputational risk, and operational risk.

### Architecture
```
NPA Draft Builder (Angular Frontend)
  └── Agent Chat Panel > "RMG" tab
        └── DifyService.sendMessageStreamed(prompt, {}, 'AG_NPA_RMG')
              └── Express Proxy > POST /api/dify/chat { agent_id: 'AG_NPA_RMG' }
                    └── Dify Cloud > CF_NPA_RMG (Chatflow) > DIFY_KEY_AG_NPA_RMG
```

### Key Design Decisions
- **Chatflow, not Workflow**: Multi-turn conversation — users iterate on risk assessments, discuss stress scenarios, refine credit analysis
- **No MCP Tools**: Relies on system prompt knowledge + conversation context
- **@@NPA_META@@ output**: Structured field suggestions with Apply buttons
- **Context injection**: Frontend sends current Section IV + VI field values as markdown context
- **Largest field count (83 fields)**: This agent owns the most fields, requiring comprehensive risk domain knowledge

---

## Step 1: Create Chatflow App
1. Go to **Dify Cloud** > **Studio** > **Create App** > **Chatbot** (Chat mode)
2. Name: `CF_NPA_RMG`
3. Description: "NPA Draft Builder sign-off guidance agent for Risk Management Group. Helps draft and refine fields in Section IV (Risk Analysis) and Section VI (Other Risks). Covers market, credit, liquidity, operational, reputational, and ESG risk."

## Step 2: Agent Configuration

### Model Settings
- Model: **Claude 3.5 Sonnet** (or claude-sonnet-4-5) | CHAT mode
- Temperature: **0.2** (risk assessment content must be precise and conservative)
- Max Tokens: **4000**

### Instructions (System Prompt)
- Copy from `CF_NPA_RMG_Prompt.md` — everything below the `---` line

### Input — No Variables Required
Chatflow app — `query` parameter in API call. No START node needed.

## Step 3: Knowledge Base (Optional)

For enhanced performance, attach these KB datasets if available:
- MAS Notice 637, 639, 643 reference materials
- Risk framework documentation
- Stress testing methodology guides
- Capital calculation methods

**KB Settings:**
- Retrieval: Hybrid (keyword + semantic)
- Top K: 3
- Score Threshold: 0.5

## Step 4: No Tools Required

This chatflow does NOT need MCP tools.

## Step 5: Test Conversations

**Test 1: Market risk factors**
```
User: What market risk factors apply to an FX Option on GBP/USD?
Expected: Agent identifies mrf_fx_delta=Yes, mrf_fx_vega=Yes, possibly mrf_ir_delta if cross-currency, includes @@NPA_META@@ for MRF fields
```

**Test 2: Credit risk assessment**
```
User: Help me assess the credit risk for an OTC derivative with a BBB+ counterparty
Expected: Agent provides credit risk assessment, discusses PFE, CSA requirements, includes @@NPA_META@@ for credit_risk and related fields
```

**Test 3: Stress testing**
```
User: What stress scenarios should I include?
Expected: Agent suggests historical + hypothetical scenarios specific to the product type, includes @@NPA_META@@ for stress_scenarios
```

**Test 4: ESG assessment**
```
User: Does this product have any ESG implications?
Expected: Agent asks about the product's environmental/social impact, provides ESG classification guidance
```

**Test 5: Section boundary**
```
User: What's the booking system for this product?
Expected: Agent redirects to the Tech & Ops agent for Section II
```

## Step 6: API Key
1. **Publish** the Chatflow app
2. Go to App > **API Access**
3. Copy the API key
4. Add to `server/.env`: `DIFY_KEY_AG_NPA_RMG=app-xxxxx`

## Step 7: Test via Express Proxy

```bash
# Test: Market risk
curl -X POST http://localhost:3000/api/dify/chat \
  -H "Content-Type: application/json" \
  -d '{"agent_id":"AG_NPA_RMG","query":"Help me assess market risk for a 1Y EUR/USD FX Barrier Option with $50M notional","conversation_id":""}'

# Test: Regulatory guidance
curl -X POST http://localhost:3000/api/dify/chat \
  -H "Content-Type: application/json" \
  -d '{"agent_id":"AG_NPA_RMG","query":"What MAS regulations apply to cross-border OTC derivatives?","conversation_id":""}'

# Test: Credit risk with context
curl -X POST http://localhost:3000/api/dify/chat \
  -H "Content-Type: application/json" \
  -d '{"agent_id":"AG_NPA_RMG","query":"[Context: Reviewing NPA sections PC.IV, PC.VI]\n\nCurrent field values:\n### Market Risk\n- **Risk Classification**: Medium\n- **MRF IR Delta**: Yes\n\nUser question: Help me with the credit risk assessment section","conversation_id":""}'
```

## Step 8: Frontend Integration Verification

The frontend wiring is already complete:
1. `npa-agent-chat.component.ts` maps `RMG` → `AG_NPA_RMG`
2. `difyService.sendMessageStreamed()` streams SSE chunks to the chat panel
3. `parseNpaMeta()` extracts `@@NPA_META@@` → `FieldSuggestion[]` → Apply buttons
4. `onApplySuggestion()` → parent `onApplyFieldSuggestion()` → updates `fieldMap`

## Step 9: Architecture Position

```
CF_COO_Orchestrator (Tier 1) ← MASTER_COO
  └── CF_NPA_Orchestrator (Tier 2) ← NPA_ORCHESTRATOR
        ├── ... (existing Tier 3 agents) ...
        ├── CF_NPA_BIZ (Tier 3B, Chatflow) ← AG_NPA_BIZ
        ├── CF_NPA_TECH_OPS (Tier 3B, Chatflow) ← AG_NPA_TECH_OPS
        ├── CF_NPA_FINANCE (Tier 3B, Chatflow) ← AG_NPA_FINANCE
        ├── CF_NPA_RMG (Tier 3B, Chatflow) ← AG_NPA_RMG  ★ THIS APP
        └── CF_NPA_LCS (Tier 3B, Chatflow) ← AG_NPA_LCS
```
