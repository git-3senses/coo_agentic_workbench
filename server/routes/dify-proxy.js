/**
 * Dify Proxy Routes
 * Proxies Angular requests → Dify APIs, keeping API keys server-side
 *
 * Contract enforcement (ENTERPRISE_AGENT_ARCHITECTURE_FREEZE.md §6 & §10):
 *   - Chatflow responses: parse @@NPA_META@@{json} from answer text
 *   - Workflow responses: extract outputs.agent_action, outputs.payload, outputs.trace
 *   - Fallback: SHOW_RAW_RESPONSE when envelope missing
 *   - Errors: SHOW_ERROR envelope on Dify API failures
 *
 * Endpoints:
 *   POST /api/dify/chat           → Dify Chat API (Chatflow agents)
 *   POST /api/dify/workflow        → Dify Workflow Run API (Workflow agents)
 *   GET  /api/dify/conversations/:id → Dify conversation history
 *   GET  /api/dify/agents/status   → Aggregate agent health
 */

const express = require('express');
const axios = require('axios');
const { DIFY_BASE_URL, getAgent, getAllAgents } = require('../config/dify-agents');

const router = express.Router();

// ─── Valid AgentAction values (source: agent-interfaces.ts + Freeze doc §6) ───

const VALID_AGENT_ACTIONS = new Set([
    'ROUTE_DOMAIN', 'ASK_CLARIFICATION', 'SHOW_CLASSIFICATION', 'SHOW_RISK',
    'SHOW_PREDICTION', 'SHOW_AUTOFILL', 'SHOW_GOVERNANCE', 'SHOW_DOC_STATUS',
    'SHOW_MONITORING', 'SHOW_KB_RESULTS', 'HARD_STOP', 'STOP_PROCESS',
    'FINALIZE_DRAFT', 'ROUTE_WORK_ITEM', 'SHOW_RAW_RESPONSE', 'SHOW_ERROR'
]);

// ─── @@NPA_META@@ Envelope Parsing ───────────────────────────────────────────

const META_REGEX = /@@NPA_META@@(\{[\s\S]*\})$/;

/**
 * Parse @@NPA_META@@{json} from a chatflow answer string.
 * Returns { answer, metadata } where answer has the meta line stripped.
 */
function parseEnvelope(rawAnswer) {
    if (!rawAnswer || typeof rawAnswer !== 'string') {
        return {
            answer: rawAnswer || '',
            metadata: makeFallback(rawAnswer)
        };
    }

    const match = rawAnswer.match(META_REGEX);
    if (!match) {
        return {
            answer: rawAnswer,
            metadata: makeFallback(rawAnswer)
        };
    }

    try {
        const meta = JSON.parse(match[1]);

        // Validate agent_action is known
        if (meta.agent_action && !VALID_AGENT_ACTIONS.has(meta.agent_action)) {
            console.warn(`Unknown agent_action: ${meta.agent_action}`);
        }

        // Strip the @@NPA_META@@ line from human-readable answer
        const cleanAnswer = rawAnswer.slice(0, match.index).trimEnd();

        return {
            answer: cleanAnswer,
            metadata: {
                agent_action: meta.agent_action || 'SHOW_RAW_RESPONSE',
                agent_id: meta.agent_id || 'UNKNOWN',
                payload: meta.payload || {},
                trace: meta.trace || {}
            }
        };
    } catch (parseErr) {
        console.warn('@@NPA_META@@ JSON parse failed:', parseErr.message);
        return {
            answer: rawAnswer,
            metadata: {
                ...makeFallback(rawAnswer),
                trace: { error: 'META_PARSE_FAILED', detail: parseErr.message }
            }
        };
    }
}

/**
 * Build SHOW_RAW_RESPONSE fallback envelope.
 */
function makeFallback(rawAnswer) {
    return {
        agent_action: 'SHOW_RAW_RESPONSE',
        agent_id: 'UNKNOWN',
        payload: { raw_answer: rawAnswer || '' },
        trace: { error: 'META_PARSE_FAILED' }
    };
}

/**
 * Build SHOW_ERROR envelope.
 */
function makeError(agentId, errorType, message, detail) {
    return {
        agent_action: 'SHOW_ERROR',
        agent_id: agentId || 'UNKNOWN',
        payload: {
            error_type: errorType,
            message: message,
            retry_allowed: true
        },
        trace: { error_detail: detail || '' }
    };
}

/**
 * Extract structured metadata from workflow outputs.
 * Workflows return agent_action, agent_id, payload, trace as output variables.
 */
function extractWorkflowMeta(outputs, agentId) {
    if (!outputs) {
        return makeError(agentId, 'WORKFLOW_FAILURE', 'Workflow returned no outputs');
    }

    // Workflows should set these output variables directly
    if (outputs.agent_action) {
        return {
            agent_action: outputs.agent_action,
            agent_id: outputs.agent_id || agentId,
            payload: outputs.payload || outputs,
            trace: outputs.trace || {}
        };
    }

    // Fallback: wrap entire output as payload (for workflows that return raw data)
    return {
        agent_action: 'SHOW_RAW_RESPONSE',
        agent_id: agentId,
        payload: outputs,
        trace: {}
    };
}

// ─── Routes ──────────────────────────────────────────────────────────────────

/**
 * POST /api/dify/chat
 * Forward chat messages to Dify Chatflow agents.
 * Parses @@NPA_META@@ envelope from answer before returning to Angular.
 */
router.post('/chat', async (req, res) => {
    const { agent_id, query, inputs = {}, conversation_id, user = 'default-user', response_mode = 'streaming' } = req.body;

    if (!agent_id || !query) {
        return res.status(400).json({ error: 'agent_id and query are required' });
    }

    let agent;
    try {
        agent = getAgent(agent_id);
    } catch (err) {
        return res.status(400).json({ error: err.message });
    }

    // Route by difyEndpoint (chat or workflow) rather than strict type check
    // This allows agents registered as 'workflow' to be called via chat if their
    // Dify app is actually a Chatflow (e.g. IDEATION, DILIGENCE, KB_SEARCH).
    const endpoint = agent.difyEndpoint || (agent.type === 'chat' ? 'chat-messages' : 'chat-messages');

    if (!agent.key) {
        return res.status(503).json({
            error: `Agent ${agent_id} is not configured (missing API key)`,
            metadata: makeError(agent_id, 'DIFY_API_ERROR', `Agent ${agent_id} not configured`)
        });
    }

    const difyPayload = {
        query,
        inputs,
        user,
        response_mode,
        ...(conversation_id && { conversation_id })
    };

    try {
        if (response_mode === 'streaming') {
            // SSE streaming — pipe through, Angular parses @@NPA_META@@ from final chunk
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');

            const response = await axios.post(
                `${DIFY_BASE_URL}/chat-messages`,
                difyPayload,
                {
                    headers: {
                        'Authorization': `Bearer ${agent.key}`,
                        'Content-Type': 'application/json'
                    },
                    responseType: 'stream'
                }
            );

            response.data.pipe(res);
            response.data.on('end', () => res.end());
            response.data.on('error', (err) => {
                console.error(`Dify stream error for ${agent_id}:`, err.message);
                res.end();
            });
        } else {
            // Blocking response — parse envelope server-side
            const response = await axios.post(
                `${DIFY_BASE_URL}/chat-messages`,
                difyPayload,
                {
                    headers: {
                        'Authorization': `Bearer ${agent.key}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            const difyData = response.data;
            const { answer, metadata } = parseEnvelope(difyData.answer);

            res.json({
                answer,
                conversation_id: difyData.conversation_id,
                message_id: difyData.message_id,
                metadata
            });
        }
    } catch (err) {
        console.error('Dify chat proxy error:', err.response?.data || err.message);
        const status = err.response?.status || 500;
        res.status(status).json({
            answer: '',
            conversation_id: conversation_id || null,
            message_id: null,
            metadata: makeError(
                agent_id,
                'DIFY_API_ERROR',
                'Dify chat request failed',
                err.response?.data?.message || err.message
            )
        });
    }
});

/**
 * POST /api/dify/workflow
 * Forward workflow execution to Dify Workflow agents.
 * Extracts structured outputs and wraps in metadata envelope.
 */
router.post('/workflow', async (req, res) => {
    const { agent_id, inputs = {}, user = 'default-user', response_mode = 'blocking' } = req.body;

    if (!agent_id) {
        return res.status(400).json({ error: 'agent_id is required' });
    }

    let agent;
    try {
        agent = getAgent(agent_id);
    } catch (err) {
        return res.status(400).json({ error: err.message });
    }

    if (!agent.key) {
        return res.status(503).json({
            error: `Agent ${agent_id} is not configured (missing API key)`,
            metadata: makeError(agent_id, 'DIFY_API_ERROR', `Agent ${agent_id} not configured`)
        });
    }

    const difyPayload = {
        inputs,
        user,
        response_mode
    };

    try {
        if (response_mode === 'streaming') {
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');

            const response = await axios.post(
                `${DIFY_BASE_URL}/workflows/run`,
                difyPayload,
                {
                    headers: {
                        'Authorization': `Bearer ${agent.key}`,
                        'Content-Type': 'application/json'
                    },
                    responseType: 'stream'
                }
            );

            response.data.pipe(res);
            response.data.on('end', () => res.end());
            response.data.on('error', (err) => {
                console.error(`Dify workflow stream error for ${agent_id}:`, err.message);
                res.end();
            });
        } else {
            const response = await axios.post(
                `${DIFY_BASE_URL}/workflows/run`,
                difyPayload,
                {
                    headers: {
                        'Authorization': `Bearer ${agent.key}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            const difyData = response.data;
            const outputs = difyData.data?.outputs || {};
            const workflowStatus = difyData.data?.status || 'unknown';

            // Handle workflow failure
            if (workflowStatus === 'failed') {
                return res.json({
                    workflow_run_id: difyData.workflow_run_id,
                    task_id: difyData.task_id,
                    data: difyData.data,
                    metadata: makeError(
                        agent_id,
                        'WORKFLOW_FAILURE',
                        difyData.data?.error || 'Workflow execution failed',
                        difyData.data?.error
                    )
                });
            }

            const metadata = extractWorkflowMeta(outputs, agent_id);

            res.json({
                workflow_run_id: difyData.workflow_run_id,
                task_id: difyData.task_id,
                data: {
                    outputs,
                    status: workflowStatus
                },
                metadata
            });
        }
    } catch (err) {
        console.error('Dify workflow proxy error:', err.response?.data || err.message);
        const status = err.response?.status || 500;
        res.status(status).json({
            workflow_run_id: null,
            task_id: null,
            data: { outputs: {}, status: 'failed' },
            metadata: makeError(
                agent_id,
                'DIFY_API_ERROR',
                'Dify workflow request failed',
                err.response?.data?.message || err.message
            )
        });
    }
});

/**
 * GET /api/dify/conversations/:conversationId
 * Retrieve conversation history from Dify
 */
router.get('/conversations/:conversationId', async (req, res) => {
    try {
        const { agent_id } = req.query;
        if (!agent_id) {
            return res.status(400).json({ error: 'agent_id query parameter is required' });
        }

        const agent = getAgent(agent_id);
        if (!agent.key) {
            return res.status(503).json({ error: `Agent ${agent_id} is not configured` });
        }

        const response = await axios.get(
            `${DIFY_BASE_URL}/messages`,
            {
                params: {
                    conversation_id: req.params.conversationId,
                    user: req.query.user || 'default-user',
                    limit: req.query.limit || 20
                },
                headers: {
                    'Authorization': `Bearer ${agent.key}`
                }
            }
        );

        res.json(response.data);
    } catch (err) {
        console.error('Dify conversation fetch error:', err.response?.data || err.message);
        const status = err.response?.status || 500;
        res.status(status).json({
            error: 'Failed to fetch conversation',
            detail: err.response?.data?.message || err.message
        });
    }
});

/**
 * GET /api/dify/agents/status
 * Return status of all 13 agents with configuration state
 */
router.get('/agents/status', (req, res) => {
    const agents = getAllAgents();
    const summary = {
        total: agents.length,
        configured: agents.filter(a => a.configured).length,
        unconfigured: agents.filter(a => !a.configured).length,
        agents: agents.map(a => ({
            id: a.id,
            name: a.name,
            tier: a.tier,
            type: a.type,
            icon: a.icon,
            color: a.color,
            status: a.configured ? 'ready' : 'unconfigured'
        }))
    };
    res.json(summary);
});

module.exports = router;
