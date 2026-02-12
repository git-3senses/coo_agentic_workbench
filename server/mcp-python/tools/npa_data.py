"""
NPA Data Tools — 3 tools
Core CRUD operations for NPA projects.
"""
import json

from registry import ToolDefinition, ToolResult, registry
from db import execute, query


# ─── Tool 1: get_npa_by_id ───────────────────────────────────────

GET_NPA_BY_ID_SCHEMA = {
    "type": "object",
    "properties": {
        "project_id": {"type": "string", "description": "NPA project ID (e.g. NPA-2025-1234)"},
    },
    "required": ["project_id"],
}


async def get_npa_by_id_handler(inp: dict) -> ToolResult:
    rows = await query(
        "SELECT * FROM npa_projects WHERE id = %s",
        [inp["project_id"]],
    )
    if not rows:
        return ToolResult(success=False, error=f"NPA '{inp['project_id']}' not found")

    npa = rows[0]

    # Fetch latest workflow state
    states = await query(
        """SELECT stage_id, status, started_at, completed_at
           FROM npa_workflow_states
           WHERE project_id = %s ORDER BY started_at DESC LIMIT 1""",
        [inp["project_id"]],
    )

    # Fetch signoff summary
    signoffs = await query(
        """SELECT status, COUNT(*) as cnt FROM npa_signoffs
           WHERE project_id = %s GROUP BY status""",
        [inp["project_id"]],
    )
    signoff_summary = {row["status"]: row["cnt"] for row in signoffs}

    return ToolResult(success=True, data={
        "project": npa,
        "current_workflow": states[0] if states else None,
        "signoff_summary": signoff_summary,
    })


# ─── Tool 2: list_npas ──────────────────────────────────────────

LIST_NPAS_SCHEMA = {
    "type": "object",
    "properties": {
        "status": {"type": "string", "description": "Filter by status (ACTIVE, COMPLETED, BLOCKED, etc.)"},
        "current_stage": {"type": "string", "description": "Filter by workflow stage"},
        "risk_level": {"type": "string", "enum": ["LOW", "MEDIUM", "HIGH"], "description": "Filter by risk level"},
        "submitted_by": {"type": "string", "description": "Filter by submitter"},
        "limit": {"type": "integer", "description": "Max results (default 50)", "default": 50},
        "offset": {"type": "integer", "description": "Pagination offset", "default": 0},
    },
}


async def list_npas_handler(inp: dict) -> ToolResult:
    conditions = []
    params = []

    if inp.get("status"):
        conditions.append("status = %s")
        params.append(inp["status"])
    if inp.get("current_stage"):
        conditions.append("current_stage = %s")
        params.append(inp["current_stage"])
    if inp.get("risk_level"):
        conditions.append("risk_level = %s")
        params.append(inp["risk_level"])
    if inp.get("submitted_by"):
        conditions.append("submitted_by = %s")
        params.append(inp["submitted_by"])

    where = f" WHERE {' AND '.join(conditions)}" if conditions else ""
    limit = inp.get("limit", 50)
    offset = inp.get("offset", 0)

    npas = await query(
        f"""SELECT id, title, npa_type, risk_level, current_stage, status,
                   submitted_by, approval_track, created_at, updated_at
            FROM npa_projects{where}
            ORDER BY created_at DESC
            LIMIT %s OFFSET %s""",
        params + [limit, offset],
    )

    count_rows = await query(
        f"SELECT COUNT(*) as total FROM npa_projects{where}",
        params,
    )
    total = count_rows[0]["total"] if count_rows else 0

    return ToolResult(success=True, data={
        "npas": npas,
        "pagination": {"total": total, "limit": limit, "offset": offset, "returned": len(npas)},
    })


# ─── Tool 3: update_npa_project ──────────────────────────────────

UPDATE_NPA_SCHEMA = {
    "type": "object",
    "properties": {
        "project_id": {"type": "string", "description": "NPA project ID"},
        "updates": {
            "type": "object",
            "description": "Fields to update on the NPA project",
            "properties": {
                "title": {"type": "string"},
                "description": {"type": "string"},
                "product_category": {"type": "string"},
                "npa_type": {"type": "string"},
                "risk_level": {"type": "string", "enum": ["LOW", "MEDIUM", "HIGH"]},
                "status": {"type": "string"},
                "product_manager": {"type": "string"},
                "pm_team": {"type": "string"},
                "template_name": {"type": "string"},
                "kickoff_date": {"type": "string"},
                "approval_track": {"type": "string"},
                "estimated_revenue": {"type": "number"},
                "is_cross_border": {"type": "boolean"},
                "notional_amount": {"type": "number"},
                "currency": {"type": "string"},
            },
        },
    },
    "required": ["project_id", "updates"],
}

# Allowed fields to prevent SQL injection via dynamic column names
_ALLOWED_UPDATE_FIELDS = {
    "title", "description", "product_category", "npa_type", "risk_level",
    "status", "product_manager", "pm_team", "template_name", "kickoff_date",
    "approval_track", "estimated_revenue", "is_cross_border", "notional_amount",
    "currency",
}


async def update_npa_project_handler(inp: dict) -> ToolResult:
    updates = inp["updates"]
    set_clauses = []
    params = []

    for key, val in updates.items():
        if key in _ALLOWED_UPDATE_FIELDS:
            set_clauses.append(f"{key} = %s")
            params.append(val)

    if not set_clauses:
        return ToolResult(success=False, error="No valid fields to update")

    set_clauses.append("updated_at = NOW()")
    params.append(inp["project_id"])

    await execute(
        f"UPDATE npa_projects SET {', '.join(set_clauses)} WHERE id = %s",
        params,
    )

    updated = await query("SELECT * FROM npa_projects WHERE id = %s", [inp["project_id"]])
    return ToolResult(success=True, data={
        "project_id": inp["project_id"],
        "updated_fields": list(updates.keys()),
        "project": updated[0] if updated else None,
    })


# ─── Tool 4: update_npa_predictions ──────────────────────────────

UPDATE_NPA_PREDICTIONS_SCHEMA = {
    "type": "object",
    "properties": {
        "project_id": {"type": "string", "description": "NPA project ID"},
        "classification_confidence": {"type": "number", "minimum": 0, "maximum": 100, "description": "ML classification confidence score"},
        "classification_method": {"type": "string", "enum": ["AGENT", "OVERRIDE", "HYBRID"], "description": "How classification was determined"},
        "predicted_timeline_days": {"type": "number", "description": "ML-predicted days to completion"},
        "risk_prediction": {"type": "string", "enum": ["LOW", "MEDIUM", "HIGH", "CRITICAL"], "description": "ML-predicted risk level"},
    },
    "required": ["project_id"],
}


async def update_npa_predictions_handler(inp: dict) -> ToolResult:
    set_clauses = []
    params = []

    if inp.get("classification_confidence") is not None:
        set_clauses.append("classification_confidence = %s")
        params.append(inp["classification_confidence"])
    if inp.get("classification_method"):
        set_clauses.append("classification_method = %s")
        params.append(inp["classification_method"])
    if inp.get("predicted_timeline_days") is not None:
        set_clauses.append("predicted_timeline_days = %s")
        params.append(inp["predicted_timeline_days"])
    if inp.get("risk_prediction"):
        set_clauses.append("risk_level = %s")
        params.append(inp["risk_prediction"])

    if not set_clauses:
        return ToolResult(success=False, error="No prediction fields provided")

    set_clauses.append("updated_at = NOW()")
    params.append(inp["project_id"])

    await execute(
        f"UPDATE npa_projects SET {', '.join(set_clauses)} WHERE id = %s",
        params,
    )

    return ToolResult(success=True, data={
        "project_id": inp["project_id"],
        "updated_fields": [k for k in ["classification_confidence", "classification_method", "predicted_timeline_days", "risk_prediction"] if inp.get(k) is not None],
    })


# ── Register ──────────────────────────────────────────────────────
registry.register_all([
    ToolDefinition(name="get_npa_by_id", description="Retrieve a single NPA project by ID with its current workflow state and signoff summary.", category="npa_data", input_schema=GET_NPA_BY_ID_SCHEMA, handler=get_npa_by_id_handler),
    ToolDefinition(name="list_npas", description="List NPA projects with optional filters (status, stage, risk level, submitter) and pagination.", category="npa_data", input_schema=LIST_NPAS_SCHEMA, handler=list_npas_handler),
    ToolDefinition(name="update_npa_project", description="Update fields on an existing NPA project. Supports title, description, risk level, status, and more.", category="npa_data", input_schema=UPDATE_NPA_SCHEMA, handler=update_npa_project_handler),
    ToolDefinition(name="update_npa_predictions", description="Save ML prediction results (classification confidence, completion days, risk prediction) to an NPA project.", category="npa_data", input_schema=UPDATE_NPA_PREDICTIONS_SCHEMA, handler=update_npa_predictions_handler),
])
