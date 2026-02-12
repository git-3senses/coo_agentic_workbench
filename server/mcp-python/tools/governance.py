"""
Governance Tools — 5 tools
Powers the Governance Agent: sign-off matrix, approvals, loop-backs, stage advancement.
Mirrors server/mcp/src/tools/governance.ts exactly.
"""
from datetime import datetime, timedelta, timezone

from registry import ToolDefinition, ToolResult, registry
from db import execute, query


# ─── Tool 1: governance_get_signoffs ──────────────────────────────

GET_SIGNOFFS_SCHEMA = {
    "type": "object",
    "properties": {
        "project_id": {"type": "string", "description": "NPA project ID"},
    },
    "required": ["project_id"],
}


async def governance_get_signoffs_handler(inp: dict) -> ToolResult:
    signoffs = await query(
        """SELECT id, party, department, status, approver_name, approver_email,
                  decision_date, sla_deadline, sla_breached, started_review_at,
                  comments, clarification_question, clarification_answer,
                  clarification_answered_by, loop_back_count, created_at
           FROM npa_signoffs
           WHERE project_id = %s
           ORDER BY created_at""",
        [inp["project_id"]],
    )

    pending = [s for s in signoffs if s.get("status") == "PENDING"]
    approved = [s for s in signoffs if s.get("status") == "APPROVED"]
    rejected = [s for s in signoffs if s.get("status") == "REJECTED"]
    rework = [s for s in signoffs if s.get("status") == "REWORK"]
    sla_breached = [s for s in signoffs if s.get("sla_breached")]

    return ToolResult(success=True, data={
        "project_id": inp["project_id"],
        "signoffs": signoffs,
        "summary": {
            "total": len(signoffs),
            "pending": len(pending),
            "approved": len(approved),
            "rejected": len(rejected),
            "rework": len(rework),
            "sla_breached": len(sla_breached),
            "completion_percentage": round((len(approved) / len(signoffs)) * 100) if signoffs else 0,
            "blocking_parties": [s["party"] for s in pending],
        },
    })


# ─── Tool 2: governance_create_signoff_matrix ─────────────────────

CREATE_SIGNOFF_MATRIX_SCHEMA = {
    "type": "object",
    "properties": {
        "project_id": {"type": "string", "description": "NPA project ID"},
        "signoffs": {
            "type": "array",
            "description": "Array of required sign-offs (typically 6-8 for Full NPA)",
            "items": {
                "type": "object",
                "properties": {
                    "party": {"type": "string", "description": "Sign-off party (e.g., Credit Risk, Legal, Finance, Ops, Tech, MLR)"},
                    "department": {"type": "string", "description": "Department name"},
                    "approver_name": {"type": "string", "description": "Name of the assigned approver"},
                    "approver_email": {"type": "string", "description": "Email of the approver"},
                    "sla_hours": {"type": "number", "description": "SLA deadline in hours from creation", "default": 72},
                },
                "required": ["party", "department", "approver_name"],
            },
        },
    },
    "required": ["project_id", "signoffs"],
}


async def governance_create_signoff_matrix_handler(inp: dict) -> ToolResult:
    results = []
    for signoff in inp["signoffs"]:
        sla_hours = signoff.get("sla_hours", 72)
        sla_deadline = datetime.now(timezone.utc) + timedelta(hours=sla_hours)
        sla_str = sla_deadline.strftime("%Y-%m-%d %H:%M:%S")

        row_id = await execute(
            """INSERT INTO npa_signoffs (project_id, party, department, status, approver_name, approver_email, sla_deadline, created_at)
               VALUES (%s, %s, %s, 'PENDING', %s, %s, %s, NOW())""",
            [inp["project_id"], signoff["party"], signoff["department"],
             signoff["approver_name"], signoff.get("approver_email"), sla_str],
        )
        results.append({
            "id": row_id,
            "party": signoff["party"],
            "approver": signoff["approver_name"],
            "sla_deadline": sla_deadline.isoformat(),
        })

    return ToolResult(success=True, data={
        "project_id": inp["project_id"],
        "signoffs_created": results,
        "count": len(results),
    })


# ─── Tool 3: governance_record_decision ───────────────────────────

RECORD_DECISION_SCHEMA = {
    "type": "object",
    "properties": {
        "signoff_id": {"type": "integer", "description": "Sign-off record ID"},
        "decision": {"type": "string", "enum": ["APPROVED", "REJECTED", "REWORK"], "description": "Decision"},
        "comments": {"type": "string", "description": "Approver comments or rejection reason"},
        "clarification_question": {"type": "string", "description": "Question to send back to maker"},
    },
    "required": ["signoff_id", "decision"],
}


async def governance_record_decision_handler(inp: dict) -> ToolResult:
    await execute(
        """UPDATE npa_signoffs
           SET status = %s, decision_date = NOW(), comments = %s, clarification_question = %s
           WHERE id = %s""",
        [inp["decision"], inp.get("comments"), inp.get("clarification_question"), inp["signoff_id"]],
    )

    if inp["decision"] == "REWORK":
        await execute(
            "UPDATE npa_signoffs SET loop_back_count = loop_back_count + 1 WHERE id = %s",
            [inp["signoff_id"]],
        )
        signoff = await query(
            "SELECT project_id, party, approver_name, loop_back_count FROM npa_signoffs WHERE id = %s",
            [inp["signoff_id"]],
        )
        if signoff:
            s = signoff[0]
            await execute(
                """INSERT INTO npa_loop_backs (project_id, loop_back_number, loop_back_type, initiated_by_party, initiator_name, reason, initiated_at)
                   VALUES (%s, %s, 'APPROVAL_CLARIFICATION', %s, %s, %s, NOW())""",
                [s["project_id"], s["loop_back_count"], s["party"],
                 s["approver_name"], inp.get("comments", "Rework requested")],
            )

    return ToolResult(success=True, data={
        "signoff_id": inp["signoff_id"],
        "decision": inp["decision"],
        "comments": inp.get("comments"),
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })


# ─── Tool 4: governance_check_loopbacks ───────────────────────────

CHECK_LOOPBACKS_SCHEMA = {
    "type": "object",
    "properties": {
        "project_id": {"type": "string", "description": "NPA project ID"},
    },
    "required": ["project_id"],
}


async def governance_check_loopbacks_handler(inp: dict) -> ToolResult:
    loopbacks = await query(
        """SELECT lb.*, ns.party, ns.approver_name
           FROM npa_loop_backs lb
           LEFT JOIN npa_signoffs ns ON ns.project_id = lb.project_id AND ns.party = lb.initiated_by_party
           WHERE lb.project_id = %s
           ORDER BY lb.initiated_at DESC""",
        [inp["project_id"]],
    )

    total = len(loopbacks)
    circuit_breaker = total >= 3
    unresolved = sum(1 for lb in loopbacks if not lb.get("resolved_at"))

    action = "AUTO_ESCALATE_TO_COO" if circuit_breaker else (
        "RESOLVE_PENDING_LOOPBACKS" if unresolved > 0 else "NONE"
    )

    return ToolResult(success=True, data={
        "project_id": inp["project_id"],
        "loopbacks": loopbacks,
        "summary": {
            "total": total,
            "unresolved": unresolved,
            "circuit_breaker_triggered": circuit_breaker,
            "circuit_breaker_threshold": 3,
            "action_required": action,
        },
    })


# ─── Tool 5: governance_advance_stage ─────────────────────────────

ADVANCE_STAGE_SCHEMA = {
    "type": "object",
    "properties": {
        "project_id": {"type": "string", "description": "NPA project ID"},
        "new_stage": {"type": "string", "description": "New workflow stage (e.g., INITIATION, CLASSIFICATION, REVIEW, SIGN_OFF, LAUNCH, MONITORING)"},
        "reason": {"type": "string", "description": "Reason for stage transition"},
    },
    "required": ["project_id", "new_stage"],
}


async def governance_advance_stage_handler(inp: dict) -> ToolResult:
    project = await query(
        "SELECT current_stage FROM npa_projects WHERE id = %s",
        [inp["project_id"]],
    )
    previous_stage = project[0].get("current_stage", "UNKNOWN") if project else "UNKNOWN"

    await execute(
        """UPDATE npa_workflow_states SET status = 'COMPLETED', completed_at = NOW()
           WHERE project_id = %s AND stage_id = %s AND status = 'IN_PROGRESS'""",
        [inp["project_id"], previous_stage],
    )
    await execute(
        """INSERT INTO npa_workflow_states (project_id, stage_id, status, started_at)
           VALUES (%s, %s, 'IN_PROGRESS', NOW())""",
        [inp["project_id"], inp["new_stage"]],
    )
    await execute(
        "UPDATE npa_projects SET current_stage = %s, updated_at = NOW() WHERE id = %s",
        [inp["new_stage"], inp["project_id"]],
    )

    return ToolResult(success=True, data={
        "project_id": inp["project_id"],
        "previous_stage": previous_stage,
        "new_stage": inp["new_stage"],
        "reason": inp.get("reason"),
        "transitioned_at": datetime.now(timezone.utc).isoformat(),
    })


# ── Register ──────────────────────────────────────────────────────
registry.register_all([
    ToolDefinition(name="governance_get_signoffs", description="Get the full sign-off matrix for an NPA including all department approvals, SLA status, and clarification threads.", category="governance", input_schema=GET_SIGNOFFS_SCHEMA, handler=governance_get_signoffs_handler),
    ToolDefinition(name="governance_create_signoff_matrix", description="Initialize the sign-off matrix for an NPA with all required department approvals and SLA deadlines.", category="governance", input_schema=CREATE_SIGNOFF_MATRIX_SCHEMA, handler=governance_create_signoff_matrix_handler),
    ToolDefinition(name="governance_record_decision", description="Record an approve/reject/rework decision for a specific sign-off. Updates the sign-off status and timestamps.", category="governance", input_schema=RECORD_DECISION_SCHEMA, handler=governance_record_decision_handler),
    ToolDefinition(name="governance_check_loopbacks", description="Check loop-back count for an NPA. Circuit breaker triggers at 3 loop-backs, forcing auto-escalation to COO.", category="governance", input_schema=CHECK_LOOPBACKS_SCHEMA, handler=governance_check_loopbacks_handler),
    ToolDefinition(name="governance_advance_stage", description="Move an NPA to the next workflow stage. Updates project record and creates workflow state entry.", category="governance", input_schema=ADVANCE_STAGE_SCHEMA, handler=governance_advance_stage_handler),
])
