# CLASSIFIER Workflow — Dify Setup Guide

## Dify App Type: WORKFLOW (not Agent/Chat)

The Classifier is a **Tier 3 stateless workflow** — it receives structured input, runs classification logic, and returns structured output. No conversation state.

---

## Step 1: Create Workflow App in Dify Cloud

1. Go to Dify Cloud > Studio > Create App > **Workflow**
2. Name: `NPA_Classifier`
3. Description: "Classifies NPA products into NTG/Variation/Existing with 28-criteria scorecard"

## Step 2: Workflow Node Layout

```
[START] → [LLM Node: Classifier] → [END]
           ↑
    [Knowledge Retrieval]
    [MCP Tools: 7 tools]
```

### Node 1: START
Input variables (define in Workflow input schema):

```json
{
  "product_description": { "type": "string", "required": true },
  "product_category": { "type": "string", "required": false, "default": "" },
  "underlying_asset": { "type": "string", "required": false, "default": "" },
  "notional_amount": { "type": "number", "required": false, "default": 0 },
  "currency": { "type": "string", "required": false, "default": "USD" },
  "customer_segment": { "type": "string", "required": false, "default": "" },
  "booking_location": { "type": "string", "required": false, "default": "" },
  "counterparty_location": { "type": "string", "required": false, "default": "" },
  "is_cross_border": { "type": "boolean", "required": false, "default": false },
  "project_id": { "type": "string", "required": false, "default": "" }
}
```

### Node 2: Knowledge Retrieval (Optional but recommended)
- **Dataset**: "NPA Classification" (upload the 3 KB docs)
  - `KB_Classification_Criteria.md`
  - `KB_Prohibited_Items.md`
  - `KB_Product_Taxonomy.md`
- **Query**: `{{product_description}} {{product_category}} {{underlying_asset}}`
- **Top K**: 5
- **Score Threshold**: 0.5

### Node 3: LLM Node (Classifier)
- **Model**: Claude 3.5 Sonnet (or GPT-4o) — needs strong reasoning for scoring
- **System Prompt**: Copy from `WF_NPA_Classifier_Prompt.md`
- **User Message Template**:
```
Classify this product:

Product Description: {{product_description}}
Product Category: {{product_category}}
Underlying Asset: {{underlying_asset}}
Notional Amount: {{notional_amount}} {{currency}}
Customer Segment: {{customer_segment}}
Booking Location: {{booking_location}}
Counterparty Location: {{counterparty_location}}
Cross-Border: {{is_cross_border}}
Project ID: {{project_id}}

{{#context#}}
Reference Knowledge:
{{context}}
{{/context#}}

Return ONLY a valid JSON object with the classification result.
```
- **Temperature**: 0.1 (we want deterministic, consistent classification)
- **Max Tokens**: 4000

### Node 4: END
Output variables:
- `result`: The full LLM response (JSON string)

Map the LLM output to workflow output.

## Step 3: Connect MCP Tools

Add these tools to the LLM Node (via Dify's MCP integration):

| Tool | Purpose |
|------|---------|
| `classify_get_criteria` | Read the 28 criteria from DB |
| `classify_assess_domains` | Write domain assessments to DB |
| `classify_score_npa` | Save scorecard to DB |
| `classify_determine_track` | Set approval track on project |
| `classify_get_assessment` | Read existing assessments |
| `ideation_get_prohibited_list` | Screen against prohibited items |
| `ideation_find_similar` | Find similar historical NPAs |

**MCP Server URL**: `{MCP_SERVER_URL}/mcp/sse`

**NOTE**: Tools are optional for classification. The LLM has the full criteria in its prompt and KB. Tools are for DB persistence when `project_id` is provided.

## Step 4: Upload KB Documents to Dify

1. Go to Dify > Knowledge > Create Dataset: "NPA Classification"
2. Upload these 3 files:
   - `Context/Dify_KB_Docs/KB_Classification_Criteria.md`
   - `Context/Dify_KB_Docs/KB_Prohibited_Items.md`
   - `Context/Dify_KB_Docs/KB_Product_Taxonomy.md`
3. Settings:
   - Indexing mode: High Quality
   - Chunk size: 1000 tokens
   - Chunk overlap: 100 tokens
   - Retrieval: Hybrid (keyword + semantic)

## Step 5: Get API Key

After publishing the workflow:
1. Go to App > API Access
2. Copy the API key
3. Add to `.env`: `DIFY_KEY_CLASSIFIER=app-xxxxx`
4. Add to `server/config/dify-agents.js` under the CLASSIFIER entry

## Step 6: Test via Express Proxy

```bash
curl -X POST http://localhost:3000/api/dify/workflow \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "CLASSIFIER",
    "inputs": {
      "product_description": "FX Option on GBP/USD with 6-month European expiry, knock-out barrier at 1.35, for corporate hedging",
      "product_category": "FX",
      "underlying_asset": "GBP/USD",
      "notional_amount": 25000000,
      "currency": "USD",
      "customer_segment": "Corporate",
      "booking_location": "Singapore",
      "counterparty_location": "London",
      "is_cross_border": true
    }
  }'
```

Expected output: JSON with `type: "Variation"`, `track: "NPA_LITE"`, cross-border flags, 28 scored criteria.

## Step 7: Integration with Orchestrator

The NPA Orchestrator (MASTER_COO) calls the Classifier workflow after the Ideation Agent completes:

1. Ideation Agent returns `FINALIZE_DRAFT` with product data
2. Orchestrator extracts product fields from the NPA draft
3. Orchestrator calls `CLASSIFIER` workflow via `DifyService.runWorkflow()`
4. Classification result is displayed as a CLASSIFICATION card in the chat UI
5. If PROHIBITED, show HARD_STOP card

The Express proxy already has the `/api/dify/workflow` endpoint ready. The Angular `DifyService.runWorkflow()` method is also ready. Just needs the API key.
