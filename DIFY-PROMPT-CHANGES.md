# Dify Agent Configuration Changes Required

**Date:** 2026-02-27
**Purpose:** Fix iteration limits and output format issues causing 5 of 6 agents to fail

---

## Critical Changes for ALL ReAct Agents

### Add to System Prompt (ALL agents except RISK which is a Workflow):

Add this to the END of the system prompt for: CLASSIFIER, ML_PREDICT, GOVERNANCE, DOC_LIFECYCLE, MONITORING

```
## OUTPUT REQUIREMENTS (CRITICAL)

1. You MUST produce your final structured JSON output before running out of iterations.
2. Reserve your LAST iteration for outputting the final JSON response.
3. If a tool call fails or times out, do NOT retry it. Use whatever data you have and proceed to output.
4. Your final response MUST be a valid JSON object wrapped in ```json ``` code fences.
5. If you could not gather enough data, include a "warnings" array listing what was missing.
6. NEVER end the conversation without producing structured JSON output.

Example final output format:
```json
{
  "status": "completed",
  "warnings": ["Tool X failed, using defaults"],
  "data": { ... your structured result ... }
}
```
```

---

## Per-Agent Changes

### 1. CLASSIFIER (WF_NPA_Classify_Predict)

**Current iteration limit:** 3
**Required iteration limit:** 6

**Rationale:** Agent makes 2 tool calls (prohibited list + criteria), needs 2 more rounds to analyze 28 criteria + 1 to produce final JSON. Current limit of 3 means it exhausts at the thinking stage.

**Input enrichment needed:** The frontend currently sends sparse inputs. After FIX 1 (NPA creation), the agent will receive richer product data including:
- Full product description (not just "NPA Product")
- Asset class, target market, distribution channel
- Risk features, jurisdictions, notional amount

### 2. ML_PREDICT (WF_NPA_Classify_Predict — same app)

**Current iteration limit:** 3
**Required iteration limit:** 5

**Rationale:** Agent calls `ideation_find_similar` which often returns 0 matches for new products. Needs iterations to build baseline predictions from general rules.

### 3. GOVERNANCE (WF_NPA_Governance)

**Current iteration limit:** 5
**Required iteration limit:** 8

**Rationale:** Agent makes 5 tool calls but 2 are wasted on MCP endpoint failures (`governance_create_signoff_matrix` at mcp-tools-ppjv.onrender.com). Even with the MCP fix, the agent needs at least 6 iterations (3 tool calls + 2 analysis + 1 output).

**Additional prompt change — add to system prompt:**
```
IMPORTANT: If the governance_create_signoff_matrix tool fails or times out,
generate the signoff matrix yourself from the routing rules you already retrieved.
Do NOT waste iterations retrying a failed tool call. Move on and produce output
with the data you have.
```

**MCP Tools Fix:** The external MCP server at `mcp-tools-ppjv.onrender.com` needs to be:
- Option A: Brought online and kept warm (it's on Render free tier which sleeps)
- Option B: Replaced with direct REST calls to our Express API (localhost:3000/api/governance/*)
- Option C: The MCP tool logic should be embedded in the Dify prompt itself

### 4. DOC_LIFECYCLE (WF_NPA_Doc_Lifecycle)

**Current iteration limit:** 3
**Required iteration limit:** 6

**Rationale:** Agent makes 2 tool calls (document requirements + completeness check) but needs at least 2 more iterations to analyze results and produce final JSON. The current limit of 3 means the agent hits the limit right after the second tool call.

**Additional note:** This agent has TWO output keys: `outputs.results` (trace array) and `outputs.result` (Python repr of trace). The Dify workflow output mapping should be configured to output a single `result` key containing the final structured JSON, not the trace.

### 5. MONITORING (WF_NPA_Monitoring)

**Current iteration limit:** 3
**Required iteration limit:** 5

**Rationale:** Agent makes 3 tool calls (get NPA, get metrics, get thresholds) and needs 2 more iterations to analyze and produce output.

**Additional prompt change:**
```
If the NPA is in INITIATION or REVIEW stage (pre-launch), produce a monitoring
setup report instead of active monitoring data. Include:
- Recommended monitoring thresholds based on product type and risk level
- Recommended KPIs for post-launch monitoring
- Set product_health to "NOT_LAUNCHED"
```

---

## RISK Agent (No Changes Needed)

The RISK agent is configured as a Dify **Workflow** (not ReAct Agent), so it always produces deterministic output. It correctly returns markdown-fenced JSON every time.

**However**, the RISK agent currently rates the test NPA as CRITICAL/hard_stop=true because the input data is sparse. Once the NPA creation fix populates more fields, the risk assessment should be more accurate.

---

## Architecture Recommendation

Consider converting all 5 failing ReAct agents to **Dify Workflows** (like RISK) if possible. Workflows:
- Always produce deterministic output
- Don't have iteration limits
- Are faster (no LLM reasoning loops)
- Are more predictable

If agent reasoning is needed (e.g., for classification scoring), use a Workflow with an embedded LLM node that receives pre-collected tool data as input, rather than letting the agent dynamically decide which tools to call.

---

## Verification Steps After Changes

1. Increase iteration limits in Dify UI for each agent
2. Add the output requirement prompt text to each agent's system prompt
3. Test each agent individually using the Express proxy:
   ```bash
   curl -X POST http://localhost:3000/api/dify/workflow \
     -H "Content-Type: application/json" \
     -d '{"agent_id": "CLASSIFIER", "inputs": {"project_id": "NPA-f2d96cc5538c452ba501ab5efc27d5ec", "product_name": "Green Bond ETF", "product_type": "Variation", "risk_level": "MEDIUM"}}'
   ```
4. Verify each agent now returns structured JSON in `outputs.result` (not a trace array)
5. Reload the NPA detail page and verify all tabs display real data
