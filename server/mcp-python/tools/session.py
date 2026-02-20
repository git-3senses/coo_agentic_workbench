"""
Session Tools — 2 tools
Manages agent conversation sessions and message logging.
Mirrors server/mcp/src/tools/session.ts exactly.
"""
import json
import uuid
from datetime import datetime, timezone

from registry import ToolDefinition, ToolResult, registry
from db import execute, query


# ─── Tool 1: session_create ───────────────────────────────────────

SESSION_CREATE_SCHEMA = {
    "type": "object",
    "properties": {
        "agent_id": {"type": "string", "description": "Identifier of the agent starting this session (e.g., 'ideation-agent')"},
        "project_id": {"type": "string", "description": "NPA project ID this session relates to"},
        "user_id": {"type": "string", "description": "User who initiated the session", "default": "system"},
        "current_stage": {"type": "string", "description": "Current NPA lifecycle stage"},
        "handoff_from": {"type": "string", "description": "Agent ID that handed off to this session"},
    },
    "required": ["agent_id"],
}


async def session_create_handler(input: dict) -> ToolResult:
    session_id = str(uuid.uuid4())
    user_id = input.get("user_id", "system")
    await execute(
        """INSERT INTO agent_sessions (id, project_id, user_id, agent_identity, current_stage, handoff_from, started_at)
           VALUES (%s, %s, %s, %s, %s, %s, NOW())""",
        [session_id, input.get("project_id"), user_id, input["agent_id"],
         input.get("current_stage"), input.get("handoff_from")],
    )
    return ToolResult(
        success=True,
        data={
            "session_id": session_id,
            "agent_id": input["agent_id"],
            "project_id": input.get("project_id"),
            "started_at": datetime.now(timezone.utc).isoformat(),
        },
    )


# ─── Tool 2: session_log_message ──────────────────────────────────

SESSION_LOG_MESSAGE_SCHEMA = {
    "type": "object",
    "properties": {
        "session_id": {"type": "string", "description": "Session ID to log message to"},
        "role": {"type": "string", "enum": ["user", "agent"], "description": "Who sent the message"},
        "content": {"type": "string", "description": "Message content (supports markdown)"},
        "agent_identity_id": {"type": "string", "description": "Which specific agent sent this message"},
        "metadata": {"type": "object", "description": "Arbitrary metadata JSON"},
        "agent_confidence": {"type": "number", "minimum": 0, "maximum": 100, "description": "Agent confidence score 0-100"},
        "reasoning_chain": {"type": "string", "description": "Why the agent made this decision"},
        "citations": {"type": "array", "items": {"type": "string"}, "description": "Source documents or NPAs referenced"},
    },
    "required": ["session_id", "role", "content"],
}


async def session_log_message_handler(input: dict) -> ToolResult:
    # Validate session exists before inserting (FK constraint protection)
    session = await query(
        "SELECT id FROM agent_sessions WHERE id = %s",
        [input["session_id"]],
    )
    if not session:
        return ToolResult(success=False, error=f"Session '{input['session_id']}' not found. Create a session first using session_create.")

    message_id = await execute(
        """INSERT INTO agent_messages (session_id, role, agent_identity_id, content, metadata, agent_confidence, reasoning_chain, citations, timestamp)
           VALUES (%s, %s, %s, %s, %s, %s, %s, %s, NOW())""",
        [
            input["session_id"],
            input["role"],
            input.get("agent_identity_id"),
            input["content"],
            json.dumps(input["metadata"]) if input.get("metadata") else None,
            input.get("agent_confidence"),
            input.get("reasoning_chain"),
            json.dumps(input["citations"]) if input.get("citations") else None,
        ],
    )
    return ToolResult(
        success=True,
        data={
            "message_id": message_id,
            "session_id": input["session_id"],
            "role": input["role"],
            "timestamp": datetime.now(timezone.utc).isoformat(),
        },
    )


# ── Register ──────────────────────────────────────────────────────
registry.register_all([
    ToolDefinition(
        name="session_create",
        description="Create a new agent conversation session. Returns session ID for subsequent message logging.",
        category="session",
        input_schema=SESSION_CREATE_SCHEMA,
        handler=session_create_handler,
    ),
    ToolDefinition(
        name="session_log_message",
        description="Log a message to an existing agent session. Tracks role, content, confidence, and reasoning.",
        category="session",
        input_schema=SESSION_LOG_MESSAGE_SCHEMA,
        handler=session_log_message_handler,
    ),
])
