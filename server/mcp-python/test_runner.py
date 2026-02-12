"""
Test all 71 MCP tools via the REST API.
Works on Windows, Linux, Mac — uses only Python stdlib (no pip install needed).

Usage:
    python test_runner.py                                            # localhost:3002
    python test_runner.py https://mcp-tools-npa.apps.your-cluster.com
    python test_runner.py http://10.0.1.50:3002
"""

import json
import sys
import urllib.request
import urllib.error

BASE_URL = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:3002"
TOOLS_URL = f"{BASE_URL}/tools"
PASS = 0
FAIL = 0
TOTAL = 0


def post(url: str, data: dict, timeout: int = 15):
    """POST JSON and return parsed response."""
    body = json.dumps(data).encode("utf-8")
    req = urllib.request.Request(
        url, data=body, headers={"Content-Type": "application/json"}, method="POST"
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except Exception as e:
        return {"success": False, "error": str(e)}


def test_tool(name: str, data: dict):
    """Test a single tool and print PASS/FAIL."""
    global PASS, FAIL, TOTAL
    TOTAL += 1
    resp = post(f"{TOOLS_URL}/{name}", data)
    if resp.get("success") is True:
        print(f"  PASS  {name}")
        PASS += 1
    else:
        print(f"  FAIL  {name}")
        err = json.dumps(resp, default=str)[:300]
        print(f"        Response: {err}")
        FAIL += 1
    return resp


def extract(resp, *keys):
    """Safely drill into nested response dict."""
    obj = resp
    for k in keys:
        if isinstance(obj, dict):
            obj = obj.get(k)
        elif isinstance(obj, list) and isinstance(k, int) and k < len(obj):
            obj = obj[k]
        else:
            return None
    return obj


# ═══════════════════════════════════════════════════════════════════
#  Preflight: Health Check
# ═══════════════════════════════════════════════════════════════════
print("--- Preflight: Health Check ---")
try:
    req = urllib.request.Request(f"{BASE_URL}/health")
    with urllib.request.urlopen(req, timeout=5) as resp:
        health = json.loads(resp.read().decode("utf-8"))
    print(f"  OK     Server reachable - {health.get('tool_count', '?')} tools registered")
except Exception as e:
    print(f"  FATAL  Cannot reach {BASE_URL}/health")
    print(f"         {e}")
    print("         Is the server running? Check the URL and try again.")
    sys.exit(1)

print()
print("============================================")
print("  Testing all 71 MCP Tools (Python port)")
print("============================================")
print()

# ═══════════════════════════════════════════════════════════════════
#  Step 0: Create test NPA (needed by almost everything)
# ═══════════════════════════════════════════════════════════════════
print("--- Setup: Creating test NPA ---")
npa_resp = post(f"{TOOLS_URL}/ideation_create_npa", {
    "title": "Python Test Derivative",
    "npa_type": "Variation",
    "risk_level": "MEDIUM",
    "submitted_by": "Test-Script",
})
NPA_ID = extract(npa_resp, "data", "npa_id")
print(f"  Created test NPA: {NPA_ID}")
print()

# ═══════════════════════════════════════════════════════════════════
#  1. SESSION (2 tools)
# ═══════════════════════════════════════════════════════════════════
print("--- Session Tools (2) ---")
test_tool("session_create", {"agent_id": "test-agent", "project_id": NPA_ID, "user_id": "tester"})

sess_resp = post(f"{TOOLS_URL}/session_create", {"agent_id": "test-agent-2", "project_id": NPA_ID})
SESSION_ID = extract(sess_resp, "data", "session_id")

test_tool("session_log_message", {
    "session_id": SESSION_ID, "role": "agent",
    "content": "Test message from Python MCP server",
    "agent_confidence": 95, "reasoning_chain": "Testing all tools",
    "citations": ["doc1.pdf", "doc2.pdf"],
})
print()

# ═══════════════════════════════════════════════════════════════════
#  2. IDEATION (5 tools)
# ═══════════════════════════════════════════════════════════════════
print("--- Ideation Tools (5) ---")
test_tool("ideation_create_npa", {
    "title": "Python Test Bond", "npa_type": "New-to-Group", "risk_level": "HIGH",
    "product_category": "Fixed Income", "description": "Test NPA from Python port",
    "is_cross_border": True, "notional_amount": 50000000, "currency": "USD",
    "submitted_by": "Python-Test",
})
test_tool("ideation_find_similar", {"search_term": "Python Test", "limit": 5})
test_tool("ideation_get_prohibited_list", {})
test_tool("ideation_save_concept", {
    "project_id": NPA_ID, "concept_notes": "Test concept from Python",
    "product_rationale": "Testing the port", "target_market": "Institutional",
    "estimated_revenue": 1000000,
})
test_tool("ideation_list_templates", {"active_only": True})
print()

# ═══════════════════════════════════════════════════════════════════
#  3. CLASSIFICATION (5 tools)
# ═══════════════════════════════════════════════════════════════════
print("--- Classification Tools (5) ---")
test_tool("classify_assess_domains", {
    "project_id": NPA_ID,
    "assessments": [
        {"domain": "STRATEGIC", "status": "PASS", "score": 85, "findings": ["Aligned with strategy"]},
        {"domain": "RISK", "status": "WARN", "score": 65, "findings": ["Market risk needs review"]},
        {"domain": "LEGAL", "status": "PASS", "score": 90},
        {"domain": "OPS", "status": "PASS", "score": 80},
        {"domain": "TECH", "status": "PASS", "score": 75},
        {"domain": "DATA", "status": "PASS", "score": 88},
        {"domain": "CLIENT", "status": "PASS", "score": 92},
    ],
})
test_tool("classify_score_npa", {
    "project_id": NPA_ID, "total_score": 12, "calculated_tier": "FULL",
    "breakdown": {"new_market": 5, "regulatory_complexity": 4, "tech_change": 3},
})
test_tool("classify_determine_track", {
    "project_id": NPA_ID, "approval_track": "FULL_NPA",
    "reasoning": "Score 12/20 with high regulatory complexity requires full NPA review",
})
test_tool("classify_get_criteria", {})
test_tool("classify_get_assessment", {"project_id": NPA_ID})
print()

# ═══════════════════════════════════════════════════════════════════
#  4. AUTOFILL (5 tools)
# ═══════════════════════════════════════════════════════════════════
print("--- AutoFill Tools (5) ---")
test_tool("autofill_get_template_fields", {"template_id": "FULL_NPA_V1"})
test_tool("autofill_populate_field", {
    "project_id": NPA_ID, "field_key": "product_name",
    "value": "Python Test Derivative", "lineage": "AUTO", "confidence_score": 95,
})
test_tool("autofill_populate_batch", {
    "project_id": NPA_ID,
    "fields": [
        {"field_key": "booking_entity", "value": "Test Entity", "lineage": "AUTO", "confidence_score": 90},
        {"field_key": "booking_system", "value": "Murex", "lineage": "AUTO", "confidence_score": 88},
    ],
})
test_tool("autofill_get_form_data", {"project_id": NPA_ID})
test_tool("autofill_get_field_options", {"field_id": "1"})
print()

# ═══════════════════════════════════════════════════════════════════
#  5. RISK (4 tools)
# ═══════════════════════════════════════════════════════════════════
print("--- Risk Tools (4) ---")
test_tool("risk_run_assessment", {
    "project_id": NPA_ID,
    "risk_domains": [
        {"domain": "CREDIT", "status": "PASS", "score": 80, "findings": ["Low credit exposure"]},
        {"domain": "MARKET", "status": "WARN", "score": 60, "findings": ["IR sensitivity high"]},
        {"domain": "OPERATIONAL", "status": "PASS", "score": 85},
    ],
    "overall_risk_rating": "MEDIUM",
})
test_tool("risk_get_market_factors", {"project_id": NPA_ID})
test_tool("risk_add_market_factor", {
    "project_id": NPA_ID, "risk_factor": "IR_DELTA", "is_applicable": True,
    "sensitivity_report": True, "var_capture": True, "stress_capture": False,
    "notes": "Primary interest rate risk",
})
test_tool("risk_get_external_parties", {"project_id": NPA_ID})
print()

# ═══════════════════════════════════════════════════════════════════
#  6. GOVERNANCE (5 tools)
# ═══════════════════════════════════════════════════════════════════
print("--- Governance Tools (5) ---")
test_tool("governance_create_signoff_matrix", {
    "project_id": NPA_ID,
    "signoffs": [
        {"party": "Credit Risk", "department": "Risk Management", "approver_name": "John Smith", "approver_email": "john@test.com", "sla_hours": 48},
        {"party": "Legal", "department": "Legal & Compliance", "approver_name": "Jane Doe", "sla_hours": 72},
    ],
})
test_tool("governance_get_signoffs", {"project_id": NPA_ID})

signoff_resp = post(f"{TOOLS_URL}/governance_get_signoffs", {"project_id": NPA_ID})
SIGNOFF_ID = extract(signoff_resp, "data", "signoffs", 0, "id")
print(f"  (Using signoff ID: {SIGNOFF_ID})")

test_tool("governance_record_decision", {"signoff_id": SIGNOFF_ID, "decision": "APPROVED", "comments": "Approved via test"})
test_tool("governance_check_loopbacks", {"project_id": NPA_ID})
test_tool("governance_advance_stage", {"project_id": NPA_ID, "new_stage": "CLASSIFICATION", "reason": "Initiation phase complete - tested via Python"})
print()

# ═══════════════════════════════════════════════════════════════════
#  7. AUDIT (4 tools)
# ═══════════════════════════════════════════════════════════════════
print("--- Audit Tools (4) ---")
test_tool("audit_log_action", {
    "project_id": NPA_ID, "actor_name": "Test Script", "actor_role": "AI Agent",
    "action_type": "NPA_CREATED", "action_details": "Created test NPA via Python MCP server",
    "is_agent_action": True, "agent_name": "Test Agent", "confidence_score": 99,
    "reasoning": "Comprehensive testing of all tools", "model_version": "test-v1",
    "source_citations": ["test.pdf"],
})
test_tool("audit_get_trail", {"project_id": NPA_ID, "limit": 10})
test_tool("check_audit_completeness", {"project_id": NPA_ID})
test_tool("generate_audit_report", {"project_id": NPA_ID, "include_agent_reasoning": True})
print()

# ═══════════════════════════════════════════════════════════════════
#  8. NPA DATA (4 tools)
# ═══════════════════════════════════════════════════════════════════
print("--- NPA Data Tools (4) ---")
test_tool("get_npa_by_id", {"project_id": NPA_ID})
test_tool("list_npas", {"limit": 5})
test_tool("update_npa_project", {"project_id": NPA_ID, "updates": {"description": "Updated via test script", "product_manager": "Test PM"}})
test_tool("update_npa_predictions", {"project_id": NPA_ID, "classification_confidence": 92.5, "classification_method": "AGENT", "predicted_timeline_days": 45})
print()

# ═══════════════════════════════════════════════════════════════════
#  9. WORKFLOW (5 tools)
# ═══════════════════════════════════════════════════════════════════
print("--- Workflow Tools (5) ---")
test_tool("get_workflow_state", {"project_id": NPA_ID})
test_tool("advance_workflow_state", {"project_id": NPA_ID, "new_stage": "REVIEW", "reason": "Classification complete"})
test_tool("get_session_history", {"project_id": NPA_ID})
test_tool("log_routing_decision", {
    "session_id": SESSION_ID, "project_id": NPA_ID,
    "source_agent": "classification-agent", "target_agent": "autofill-agent",
    "routing_reason": "Classification complete, proceeding to form fill", "confidence": 92,
})
test_tool("get_user_profile", {"email": "ahmad.razak@dbs.com"})
print()

# ═══════════════════════════════════════════════════════════════════
#  10. MONITORING (6 tools)
# ═══════════════════════════════════════════════════════════════════
print("--- Monitoring Tools (6) ---")
test_tool("get_performance_metrics", {"project_id": NPA_ID})
test_tool("check_breach_thresholds", {"project_id": NPA_ID})
test_tool("create_breach_alert", {
    "project_id": NPA_ID, "title": "VaR Utilization Exceeds Warning",
    "severity": "WARNING", "description": "VaR utilization at 82% exceeds 80% warning threshold",
    "threshold_value": "80%", "actual_value": "82%", "sla_hours": 24,
})
test_tool("get_monitoring_thresholds", {"project_id": NPA_ID})
test_tool("get_post_launch_conditions", {"project_id": NPA_ID})

cond_resp = post(f"{TOOLS_URL}/get_post_launch_conditions", {"project_id": NPA_ID})
conditions = extract(cond_resp, "data", "conditions") or []
CONDITION_ID = conditions[0]["id"] if conditions else 1

test_tool("update_condition_status", {"condition_id": CONDITION_ID, "status": "COMPLETED"})
print()

# ═══════════════════════════════════════════════════════════════════
#  11. DOCUMENTS (4 tools)
# ═══════════════════════════════════════════════════════════════════
print("--- Document Tools (4) ---")
test_tool("upload_document_metadata", {
    "project_id": NPA_ID, "document_name": "Test Term Sheet.pdf",
    "document_type": "TERM_SHEET", "file_size": "2.3 MB", "file_extension": "pdf",
    "uploaded_by": "Test Script", "criticality": "CRITICAL",
})
test_tool("check_document_completeness", {"project_id": NPA_ID})
test_tool("get_document_requirements", {"approval_track": "FULL_NPA"})

doc_resp = post(f"{TOOLS_URL}/upload_document_metadata", {
    "project_id": NPA_ID, "document_name": "Validation Test Doc.pdf", "document_type": "RISK_MEMO",
})
DOC_ID = extract(doc_resp, "data", "document_id")

test_tool("validate_document", {"document_id": DOC_ID, "validation_status": "VALID", "validation_stage": "AUTOMATED", "validated_by": "Test Script"})
print()

# ═══════════════════════════════════════════════════════════════════
#  12. GOVERNANCE EXT (6 tools)
# ═══════════════════════════════════════════════════════════════════
print("--- Governance Extension Tools (6) ---")
test_tool("get_signoff_routing_rules", {"approval_track": "FULL_NPA"})
test_tool("check_sla_status", {"project_id": NPA_ID})
test_tool("create_escalation", {
    "project_id": NPA_ID, "escalation_level": 1, "trigger_type": "SLA_BREACH",
    "reason": "Credit Risk signoff SLA breached by 24 hours", "escalated_by": "Test Agent",
})
test_tool("get_escalation_rules", {})
test_tool("save_approval_decision", {
    "project_id": NPA_ID, "approval_type": "CHECKER",
    "decision": "APPROVE", "comments": "All checks passed - approved via test",
})
test_tool("add_comment", {
    "project_id": NPA_ID, "comment_type": "SYSTEM_ALERT",
    "comment_text": "All 71 tools tested successfully", "author_name": "Test Script",
    "generated_by_ai": True, "ai_agent": "test-agent",
})
print()

# ═══════════════════════════════════════════════════════════════════
#  13. RISK EXT (4 tools)
# ═══════════════════════════════════════════════════════════════════
print("--- Risk Extension Tools (4) ---")
test_tool("get_prerequisite_categories", {"include_checks": True})
test_tool("validate_prerequisites", {"project_id": NPA_ID})
test_tool("save_risk_check_result", {
    "project_id": NPA_ID, "check_layer": "PROHIBITED_LIST",
    "result": "PASS", "matched_items": [], "checked_by": "RISK_AGENT",
})
test_tool("get_form_field_value", {"project_id": NPA_ID, "field_key": "product_name"})
print()

# ═══════════════════════════════════════════════════════════════════
#  14. KB SEARCH (3 tools)
# ═══════════════════════════════════════════════════════════════════
print("--- KB Search Tools (3) ---")
test_tool("search_kb_documents", {"search_term": "NPA", "limit": 5})
test_tool("get_kb_document_by_id", {"doc_id": "KB-NPA-001"})
test_tool("list_kb_sources", {})
print()

# ═══════════════════════════════════════════════════════════════════
#  15. PROSPECTS (2 tools)
# ═══════════════════════════════════════════════════════════════════
print("--- Prospect Tools (2) ---")
test_tool("get_prospects", {"limit": 5})
test_tool("convert_prospect_to_npa", {"prospect_id": 1, "submitted_by": "Test Script", "risk_level": "MEDIUM"})
print()

# ═══════════════════════════════════════════════════════════════════
#  16. DASHBOARD (1 tool)
# ═══════════════════════════════════════════════════════════════════
print("--- Dashboard Tools (1) ---")
test_tool("get_dashboard_kpis", {"include_live": True})
print()

# ═══════════════════════════════════════════════════════════════════
#  17. NOTIFICATIONS (3 tools)
# ═══════════════════════════════════════════════════════════════════
print("--- Notification Tools (3) ---")
test_tool("get_pending_notifications", {"project_id": NPA_ID, "limit": 10})
test_tool("send_notification", {
    "project_id": NPA_ID, "notification_type": "SYSTEM_ALERT",
    "title": "Test Notification", "message": "All 71 tools tested", "severity": "INFO",
})
test_tool("mark_notification_read", {"project_id": NPA_ID, "notification_type": "SYSTEM_ALERT"})
print()

# ═══════════════════════════════════════════════════════════════════
#  18. JURISDICTION (3 tools)
# ═══════════════════════════════════════════════════════════════════
print("--- Jurisdiction Tools (3) ---")
test_tool("get_npa_jurisdictions", {"project_id": NPA_ID})
test_tool("get_jurisdiction_rules", {"jurisdiction_code": "SG"})
test_tool("adapt_classification_weights", {"project_id": NPA_ID, "base_score": 10})
print()

# ═══════════════════════════════════════════════════════════════════
#  Results
# ═══════════════════════════════════════════════════════════════════
print("============================================")
print(f"  Results: {PASS} passed, {FAIL} failed, {TOTAL} total")
print("============================================")

sys.exit(1 if FAIL > 0 else 0)
