# CF_NPA_TECH_OPS — Dify Setup Guide
# Updated: 2026-02-23 | Version: 1.0
# Agent: AG_NPA_TECH_OPS | Technology & Operations + ISS
# Section: PC.II (Operational & Technology Assessment)

## Dify App Type: CHATFLOW (conversational, multi-turn)

The TECH_OPS Agent is a **Tier 3B conversational chatflow** for the Draft Builder. It provides sign-off guidance for Technology & Operations + ISS, helping NPA makers draft and refine fields in Section II (Operational & Technology Assessment). It covers operating models, booking infrastructure, system integration, settlement, collateral management, ISS security assessment, and BCM/DR planning.

### Architecture
```
NPA Draft Builder (Angular Frontend)
  └── Agent Chat Panel > "Tech & Ops" tab
        └── DifyService.sendMessageStreamed(prompt, {}, 'AG_NPA_TECH_OPS')
              └── Express Proxy > POST /api/dify/chat { agent_id: 'AG_NPA_TECH_OPS' }
                    └── Dify Cloud > CF_NPA_TECH_OPS (Chatflow) > DIFY_KEY_AG_NPA_TECH_OPS
```

### Key Design Decisions
- **Chatflow, not Workflow**: Multi-turn conversation — users iterate on operating model, discuss system requirements, refine BCM plans
- **No MCP Tools**: Relies on system prompt knowledge + conversation context
- **@@NPA_META@@ output**: Structured field suggestions with Apply buttons
- **Context injection**: Frontend sends current Section II field values as markdown context

---

## Step 1: Create Chatflow App
1. Go to **Dify Cloud** > **Studio** > **Create App** > **Chatbot** (Chat mode)
2. Name: `CF_NPA_TECH_OPS`
3. Description: "NPA Draft Builder sign-off guidance agent for Technology & Operations + ISS. Helps draft and refine fields in Section II (Operational & Technology Assessment)."

## Step 2: Agent Configuration

### Model Settings
- Model: **Claude 3.5 Sonnet** (or claude-sonnet-4-5) | CHAT mode
- Temperature: **0.25** (technical content needs precision; less creative latitude than BIZ agent)
- Max Tokens: **4000**

### Instructions (System Prompt)
- Copy from `CF_NPA_TECH_OPS_Prompt.md` — everything below the `---` line

### Input — No Variables Required
Chatflow app — `query` parameter in API call. No START node needed.

## Step 3: Knowledge Base (Optional)

For enhanced performance, attach these KB datasets if available:
- System architecture documentation
- BCP/DR templates
- Operating model reference guides

**KB Settings:**
- Retrieval: Hybrid (keyword + semantic)
- Top K: 3
- Score Threshold: 0.5

## Step 4: No Tools Required

This chatflow does NOT need MCP tools. It provides guidance based on system prompt knowledge and conversation context.

## Step 5: Test Conversations

**Test 1: Operating model guidance**
```
User: Help me describe the front office operating model for an FX Option
Expected: Agent provides FO model description mentioning Murex, e-trading, voice execution, includes @@NPA_META@@ for front_office_model
```

**Test 2: System integration**
```
User: What booking system should I use for an interest rate swap?
Expected: Agent recommends Murex for IRS, explains trade capture flow, includes @@NPA_META@@ for booking_system and trade_capture_system
```

**Test 3: BCM/DR fields**
```
User: What RTO and RPO should I set for a trading product?
Expected: Agent recommends RTO=2hrs, RPO=0 for critical trading, includes @@NPA_META@@ for rto_target and rpo_target
```

**Test 4: Section boundary**
```
User: What's the pricing model for this product?
Expected: Agent redirects to the Finance agent for Section III pricing fields
```

## Step 6: API Key
1. **Publish** the Chatflow app
2. Go to App > **API Access**
3. Copy the API key
4. Add to `server/.env`: `DIFY_KEY_AG_NPA_TECH_OPS=app-xxxxx`

## Step 7: Test via Express Proxy

```bash
# Test: Operating model guidance
curl -X POST http://localhost:3000/api/dify/chat \
  -H "Content-Type: application/json" \
  -d '{"agent_id":"AG_NPA_TECH_OPS","query":"Help me fill the operating model fields for an FX Barrier Option","conversation_id":""}'

# Test: Technology assessment
curl -X POST http://localhost:3000/api/dify/chat \
  -H "Content-Type: application/json" \
  -d '{"agent_id":"AG_NPA_TECH_OPS","query":"What system changes are needed for a new structured product?","conversation_id":""}'

# Test: BCM/DR planning
curl -X POST http://localhost:3000/api/dify/chat \
  -H "Content-Type: application/json" \
  -d '{"agent_id":"AG_NPA_TECH_OPS","query":"Help me with the BCM section - what are the DR testing requirements?","conversation_id":""}'
```

## Step 8: Frontend Integration Verification

The frontend wiring is already complete:
1. `npa-agent-chat.component.ts` maps `TECH_OPS` → `AG_NPA_TECH_OPS`
2. `difyService.sendMessageStreamed()` streams SSE chunks to the chat panel
3. `parseNpaMeta()` extracts `@@NPA_META@@` → `FieldSuggestion[]` → Apply buttons
4. `onApplySuggestion()` → parent `onApplyFieldSuggestion()` → updates `fieldMap`

## Step 9: Architecture Position

```
CF_COO_Orchestrator (Tier 1) ← MASTER_COO
  └── CF_NPA_Orchestrator (Tier 2) ← NPA_ORCHESTRATOR
        ├── ... (existing Tier 3 agents) ...
        ├── CF_NPA_BIZ (Tier 3B, Chatflow) ← AG_NPA_BIZ
        ├── CF_NPA_TECH_OPS (Tier 3B, Chatflow) ← AG_NPA_TECH_OPS  ★ THIS APP
        ├── CF_NPA_FINANCE (Tier 3B, Chatflow) ← AG_NPA_FINANCE
        ├── CF_NPA_RMG (Tier 3B, Chatflow) ← AG_NPA_RMG
        └── CF_NPA_LCS (Tier 3B, Chatflow) ← AG_NPA_LCS
```
