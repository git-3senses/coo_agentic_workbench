/**
 * Dify Proxy Routes
 * Proxies Angular requests → Dify APIs, keeping API keys server-side
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

/**
 * POST /api/dify/chat
 * Forward chat messages to Dify Chatflow agents (Tier 1 & 2)
 * Supports SSE streaming when response_mode='streaming'
 */
router.post('/chat', async (req, res) => {
    try {
        const { agent_id, query, inputs = {}, conversation_id, user = 'default-user', response_mode = 'streaming' } = req.body;

        if (!agent_id || !query) {
            return res.status(400).json({ error: 'agent_id and query are required' });
        }

        const agent = getAgent(agent_id);
        if (agent.type !== 'chat') {
            return res.status(400).json({ error: `Agent ${agent_id} is a ${agent.type} agent, use /workflow endpoint instead` });
        }

        if (!agent.key) {
            return res.status(503).json({ error: `Agent ${agent_id} is not configured (missing API key)` });
        }

        const difyPayload = {
            query,
            inputs,
            user,
            response_mode,
            ...(conversation_id && { conversation_id })
        };

        if (response_mode === 'streaming') {
            // SSE streaming response
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
            // Blocking response
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

            res.json(response.data);
        }
    } catch (err) {
        console.error('Dify chat proxy error:', err.response?.data || err.message);
        const status = err.response?.status || 500;
        res.status(status).json({
            error: 'Dify chat request failed',
            detail: err.response?.data?.message || err.message
        });
    }
});

/**
 * POST /api/dify/workflow
 * Forward workflow execution to Dify Workflow agents (Tier 3 & 4)
 */
router.post('/workflow', async (req, res) => {
    try {
        const { agent_id, inputs = {}, user = 'default-user', response_mode = 'blocking' } = req.body;

        if (!agent_id) {
            return res.status(400).json({ error: 'agent_id is required' });
        }

        const agent = getAgent(agent_id);
        if (agent.type !== 'workflow') {
            return res.status(400).json({ error: `Agent ${agent_id} is a ${agent.type} agent, use /chat endpoint instead` });
        }

        if (!agent.key) {
            return res.status(503).json({ error: `Agent ${agent_id} is not configured (missing API key)` });
        }

        const difyPayload = {
            inputs,
            user,
            response_mode
        };

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

            res.json(response.data);
        }
    } catch (err) {
        console.error('Dify workflow proxy error:', err.response?.data || err.message);
        const status = err.response?.status || 500;
        res.status(status).json({
            error: 'Dify workflow request failed',
            detail: err.response?.data?.message || err.message
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
