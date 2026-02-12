"""
Risk Tools — 4 tools
Powers the Risk Agent: risk assessments, market factors, external parties.
Mirrors server/mcp/src/tools/risk.ts exactly.
"""
import json

from registry import ToolDefinition, ToolResult, registry
from db import execute, query


# ─── Tool 1: risk_run_assessment ──────────────────────────────────

RUN_ASSESSMENT_SCHEMA = {
    "type": "object",
    "properties": {
        "project_id": {"type": "string", "description": "NPA project ID"},
        "risk_domains": {
            "type": "array",
            "description": "Array of risk domain assessments",
            "items": {
                "type": "object",
                "properties": {
                    "domain": {"type": "string", "description": "Risk domain name (e.g., CREDIT, MARKET, OPERATIONAL, LIQUIDITY, LEGAL, REPUTATIONAL, CYBER)"},
                    "status": {"type": "string", "enum": ["PASS", "FAIL", "WARN"], "description": "Assessment result"},
                    "score": {"type": "number", "minimum": 0, "maximum": 100, "description": "Risk readiness score 0-100"},
                    "findings": {"type": "array", "items": {"type": "string"}, "description": "Specific risk findings or gaps"},
                },
                "required": ["domain", "status", "score"],
            },
        },
        "overall_risk_rating": {"type": "string", "enum": ["LOW", "MEDIUM", "HIGH", "CRITICAL"], "description": "Overall risk rating"},
    },
    "required": ["project_id", "risk_domains", "overall_risk_rating"],
}


async def risk_run_assessment_handler(inp: dict) -> ToolResult:
    results = []
    for domain in inp["risk_domains"]:
        # Write to npa_risk_checks per architecture spec
        row_id = await execute(
            """INSERT INTO npa_risk_checks (project_id, check_layer, result, matched_items, checked_by, checked_at)
               VALUES (%s, %s, %s, %s, %s, NOW())""",
            [inp["project_id"], domain["domain"], domain["status"],
             json.dumps(domain["findings"]) if domain.get("findings") else None,
             "RISK_AGENT"],
        )
        results.append({"id": row_id, "domain": domain["domain"], "status": domain["status"], "score": domain["score"]})

    await execute(
        "UPDATE npa_projects SET risk_level = %s WHERE id = %s",
        [inp["overall_risk_rating"], inp["project_id"]],
    )

    return ToolResult(success=True, data={
        "project_id": inp["project_id"],
        "assessments": results,
        "overall_risk_rating": inp["overall_risk_rating"],
        "domains_assessed": len(results),
        "critical_domains": [d["domain"] for d in inp["risk_domains"] if d["status"] == "FAIL"],
    })


# ─── Tool 2: risk_get_market_factors ──────────────────────────────

GET_MARKET_FACTORS_SCHEMA = {
    "type": "object",
    "properties": {
        "project_id": {"type": "string", "description": "NPA project ID"},
    },
    "required": ["project_id"],
}


async def risk_get_market_factors_handler(inp: dict) -> ToolResult:
    factors = await query(
        "SELECT * FROM npa_market_risk_factors WHERE project_id = %s ORDER BY risk_factor",
        [inp["project_id"]],
    )
    applicable = [f for f in factors if f.get("is_applicable")]
    uncaptured = [f for f in applicable if not f.get("var_capture") and not f.get("stress_capture")]

    return ToolResult(success=True, data={
        "project_id": inp["project_id"],
        "factors": factors,
        "summary": {
            "total": len(factors),
            "applicable": len(applicable),
            "var_captured": sum(1 for f in applicable if f.get("var_capture")),
            "stress_captured": sum(1 for f in applicable if f.get("stress_capture")),
            "uncaptured_risks": [f["risk_factor"] for f in uncaptured],
        },
    })


# ─── Tool 3: risk_add_market_factor ───────────────────────────────

ADD_MARKET_FACTOR_SCHEMA = {
    "type": "object",
    "properties": {
        "project_id": {"type": "string", "description": "NPA project ID"},
        "risk_factor": {"type": "string", "description": "Risk factor type (e.g., IR_DELTA, FX_VEGA, CRYPTO_DELTA, EQ_DELTA, CREDIT_SPREAD)"},
        "is_applicable": {"type": "boolean", "description": "Whether this risk factor applies to the product"},
        "sensitivity_report": {"type": "boolean", "description": "Whether sensitivity report is available", "default": False},
        "var_capture": {"type": "boolean", "description": "Whether VaR model captures this risk", "default": False},
        "stress_capture": {"type": "boolean", "description": "Whether stress testing captures this risk", "default": False},
        "notes": {"type": "string", "description": "Additional notes about this risk factor"},
    },
    "required": ["project_id", "risk_factor", "is_applicable"],
}


async def risk_add_market_factor_handler(inp: dict) -> ToolResult:
    existing = await query(
        "SELECT id FROM npa_market_risk_factors WHERE project_id = %s AND risk_factor = %s",
        [inp["project_id"], inp["risk_factor"]],
    )

    if existing:
        await execute(
            """UPDATE npa_market_risk_factors
               SET is_applicable = %s, sensitivity_report = %s, var_capture = %s, stress_capture = %s, notes = %s
               WHERE project_id = %s AND risk_factor = %s""",
            [inp["is_applicable"], inp.get("sensitivity_report", False),
             inp.get("var_capture", False), inp.get("stress_capture", False),
             inp.get("notes"), inp["project_id"], inp["risk_factor"]],
        )
        return ToolResult(success=True, data={
            "action": "updated", "project_id": inp["project_id"], "risk_factor": inp["risk_factor"],
        })

    row_id = await execute(
        """INSERT INTO npa_market_risk_factors (project_id, risk_factor, is_applicable, sensitivity_report, var_capture, stress_capture, notes)
           VALUES (%s, %s, %s, %s, %s, %s, %s)""",
        [inp["project_id"], inp["risk_factor"], inp["is_applicable"],
         inp.get("sensitivity_report", False), inp.get("var_capture", False),
         inp.get("stress_capture", False), inp.get("notes")],
    )
    return ToolResult(success=True, data={
        "id": row_id, "action": "created",
        "project_id": inp["project_id"], "risk_factor": inp["risk_factor"],
    })


# ─── Tool 4: risk_get_external_parties ────────────────────────────

GET_EXTERNAL_PARTIES_SCHEMA = {
    "type": "object",
    "properties": {
        "project_id": {"type": "string", "description": "NPA project ID"},
    },
    "required": ["project_id"],
}


async def risk_get_external_parties_handler(inp: dict) -> ToolResult:
    parties = await query(
        "SELECT * FROM npa_external_parties WHERE project_id = %s ORDER BY party_name",
        [inp["project_id"]],
    )
    critical = [p for p in parties if p.get("vendor_tier") == "TIER_1_CRITICAL"]

    return ToolResult(success=True, data={
        "project_id": inp["project_id"],
        "parties": parties,
        "summary": {
            "total": len(parties),
            "critical_vendors": len(critical),
            "tier_breakdown": {
                "tier_1": len(critical),
                "tier_2": sum(1 for p in parties if p.get("vendor_tier") == "TIER_2"),
                "tier_3": sum(1 for p in parties if p.get("vendor_tier") == "TIER_3"),
            },
        },
    })


# ── Register ──────────────────────────────────────────────────────
registry.register_all([
    ToolDefinition(name="risk_run_assessment", description="Execute a comprehensive risk assessment for an NPA across multiple risk domains (Credit, Market, Operational, etc.).", category="risk", input_schema=RUN_ASSESSMENT_SCHEMA, handler=risk_run_assessment_handler),
    ToolDefinition(name="risk_get_market_factors", description="Get all market risk factors for an NPA (IR Delta, FX Vega, Crypto Delta, etc.) with their capture status.", category="risk", input_schema=GET_MARKET_FACTORS_SCHEMA, handler=risk_get_market_factors_handler),
    ToolDefinition(name="risk_add_market_factor", description="Add or update a market risk factor for an NPA. Tracks VaR and stress test capture status.", category="risk", input_schema=ADD_MARKET_FACTOR_SCHEMA, handler=risk_add_market_factor_handler),
    ToolDefinition(name="risk_get_external_parties", description="Get external parties (vendors, counterparties, custodians) involved in an NPA with their risk profiles.", category="risk", input_schema=GET_EXTERNAL_PARTIES_SCHEMA, handler=risk_get_external_parties_handler),
])
