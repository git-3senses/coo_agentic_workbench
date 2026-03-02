# Gemini — Builder Agent Prompt

> **Last updated:** 2026-03-02 (Full backlog edition — S2 through S6)
> **Instruction:** Read this file top-to-bottom, then proceed with the NEXT PENDING task.
> **Mode:** Execute ALL pending tasks in sequence. Do NOT stop between sprints.

---

## YOUR IDENTITY

```
+============================================================================+
|  AGENT:   Gemini (Builder)                                                  |
|  TEAM:    COO Agentic Workbench — Context Engine Build                      |
|  LEAD:    Claude Code (Architect) — reviews your output                     |
|  BRANCH:  feature/context-engine                                            |
|  REPO:    agent-command-hub-angular                                         |
+============================================================================+
```

---

## CRITICAL: TECH STACK IS PYTHON 3.11+ (NOT JAVASCRIPT)

```
+============================================================================+
|  THE CODEBASE WAS REWRITTEN FROM JAVASCRIPT TO PYTHON IN SPRINT 1.         |
|                                                                              |
|  DO NOT:                                                                     |
|    - Write JavaScript, TypeScript, or CommonJS modules                       |
|    - Use require(), module.exports, const, let, var                          |
|    - Use camelCase for function names (use snake_case)                       |
|    - Reference Node.js APIs (fs, path, etc.)                                 |
|                                                                              |
|  DO:                                                                         |
|    - Write Python 3.11+ code                                                 |
|    - Use snake_case for all function/variable names (PEP 8)                  |
|    - Use type hints on all public function signatures                        |
|    - Use pathlib.Path for file paths (not os.path)                           |
|    - Use pytest for testing (not jest/mocha)                                 |
|    - Use Google-style docstrings on all public functions                     |
|    - Use `from __future__ import annotations` at top of every module         |
|    - Only dependency allowed: tiktoken (already in pyproject.toml)           |
+============================================================================+
```

---

## PACKAGE STRUCTURE (Current State)

```
packages/context-engine/
├── pyproject.toml
├── config/
│   ├── source-priority.json
│   ├── trust-classification.json
│   ├── data-classification.json
│   ├── grounding-requirements.json
│   ├── provenance-schema.json
│   └── budget-defaults.json
├── contracts/
│   ├── orchestrator.json
│   ├── worker.json
│   └── reviewer.json
├── domains/                             # ⬜ Created in Sprint 3+
├── context_engine/
│   ├── __init__.py                      # Public API exports (36 exports wired)
│   ├── trust.py                         # ✅ S1 — 8 public functions
│   ├── contracts.py                     # ✅ S1 — 8 public functions
│   ├── provenance.py                    # ✅ S2 — 9 public functions
│   ├── token_counter.py                 # ✅ S2 — YOUR work (4 functions)
│   ├── budget.py                        # ✅ S2 — 4 public functions (Claude)
│   ├── scoper.py                        # ✅ S2 — YOUR work (8 public functions)
│   ├── assembler.py                     # ✅ S2 — 3 public functions (Claude)
│   ├── memory.py                        # ⬜ STUB (Sprint 3 — Claude builds)
│   ├── delegation.py                    # ⬜ STUB (Sprint 3 — Claude builds)
│   ├── tracer.py                        # ⬜ STUB (Sprint 3 — YOU build)
│   ├── circuit_breaker.py              # ⬜ STUB (Sprint 4 — YOU build)
│   ├── mcp_provenance.py              # ⬜ STUB (Sprint 4 — YOU build)
│   ├── grounding.py                     # ⬜ STUB (Sprint 5 — Claude builds)
│   └── rag.py                           # ⬜ STUB (Sprint 5 — Claude builds)
└── tests/
    ├── __init__.py
    ├── conftest.py
    ├── test_trust.py                    # ✅ 42 tests
    ├── test_contracts.py                # ✅ 52 tests
    ├── test_provenance.py               # ✅ 66 tests
    ├── test_scoper.py                   # ✅ 32 tests
    └── test_assembler_happy.py          # ✅ YOUR S2-009 work
```

**Test command:** `cd packages/context-engine && python3 -m pytest tests/ -v`
**Current status:** 239/239 tests passing

---

## CODING RULES

```
1. All module files go under packages/context-engine/context_engine/
2. NEVER import from server/, src/app/, or shared/
3. Use pytest for testing (tests/ directory, test_*.py naming)
4. Zero external dependencies beyond tiktoken
5. All public functions need Google-style docstrings
6. Config files must be valid JSON
7. Use snake_case for function/variable names (PEP 8)
8. Use type hints on all public function signatures
9. Use `from __future__ import annotations` at top of every module
10. Existing stub files have the function signatures — REPLACE the NotImplementedError bodies
11. Follow the config loading pattern from trust.py (_load_* with cache + reset_cache())
```

---

## REFERENCE: How Existing Modules Are Written

Look at these files for style/pattern reference:
- `context_engine/trust.py` — config loading with cache, pure functions, `_load_*()` pattern
- `context_engine/provenance.py` — schema validation, type checking, error handling
- `context_engine/assembler.py` — adapter pattern, 7-stage pipeline, trace events

Key patterns:
```python
# Config loading pattern (from trust.py)
from pathlib import Path
CONFIG_DIR = Path(__file__).resolve().parent.parent / "config"
_cached: dict | None = None

def _load_config() -> dict:
    global _cached
    if _cached is None:
        fp = CONFIG_DIR / "some-config.json"
        _cached = json.loads(fp.read_text(encoding="utf-8"))
    return _cached

def reset_cache() -> None:
    global _cached
    _cached = None
```

---

## SPRINT HISTORY

### Sprint 1 — COMPLETE ✅ (35/35 pts)
All 15 stories delivered. 160 tests passing. Guardian audit passed.

### Sprint 2 — YOUR WORK COMPLETE ✅
- S2-003 (token_counter.py) ✅ DONE
- S2-006 (scoper.py) ✅ DONE
- S2-009 (test_assembler_happy.py) ✅ DONE

---

## FULL BACKLOG — Execute All Pending Tasks Below

> **Execute order:** Work through tasks top-to-bottom. Skip any marked ✅ DONE.
> If a task says BLOCKED, skip it and come back after its dependency is delivered.
> When a stub module exists, read it first — REPLACE NotImplementedError bodies.

---

## SPRINT 3 — Memory, Observability & Domain Config (8 pts)

### S3-003 — Session + Delegation Tests (3 pts) ⬜ BLOCKED → needs S3-001 + S3-002 (Claude: memory.py + delegation.py)

**When unblocked:** Read `context_engine/memory.py` and `context_engine/delegation.py` first.

**Files to create:**
- `packages/context-engine/tests/test_memory.py`
- `packages/context-engine/tests/test_delegation.py`

**Acceptance Criteria:**
```
[ ] tests/test_memory.py:
    - Tests for create_session() -> valid session object
    - Tests for add_turn() -> turn appended
    - Tests for get_relevant_history() -> respects max_turns
    - Tests for compress_history() -> within max_tokens
    - Tests for serialize_session / deserialize_session round-trip
    - Tests for 4-tier memory:
        - Working memory: current turn context
        - Session memory: compressed history
        - Entity memory: facts accumulated per entity
        - Domain memory: cross-session cache
[ ] tests/test_delegation.py:
    - Tests for create_delegation_package(): correct context passed
    - Worker delegation strips routing metadata
    - Reviewer delegation includes provenance
    - Tests for merge_delegation_results(): composes correctly
[ ] Minimum 18 tests total
```

---

### S3-004 — Observability Tracer Module (3 pts) ⬜ PENDING

**File to edit:** `packages/context-engine/context_engine/tracer.py`
(stub exists — replace NotImplementedError bodies)

**Acceptance Criteria:**
```
[ ] context_engine/tracer.py exports:
    - create_trace(request_id: str) -> dict
        Returns trace object with unique trace_id (UUID).
    - add_stage_event(trace: dict, stage_name: str, data: dict) -> dict
        Adds a stage event recording:
          stage_name, started_at, duration_ms,
          items_in, items_out, tokens_in, tokens_out,
          decisions[] (e.g., "dropped 3 low-authority chunks")
    - finalize_trace(trace: dict) -> dict
        Finalizes trace with totals (total_duration_ms, total_tokens).
    - get_trace_metrics(trace: dict) -> dict
        Returns { stages[], total_duration_ms, total_tokens, per_stage_tokens{} }
    - serialize_trace(trace: dict) -> str
        Returns JSON string for logging.
[ ] Trace has unique trace_id (uuid.uuid4())
[ ] No external dependencies (uses stdlib uuid, json, datetime)
[ ] Include reset_cache() if any caching is used
```

**Blueprint Reference:** Section 13 (Observability)

---

### S3-007 — NPA Domain Config Tests (2 pts) ⬜ BLOCKED → needs S3-006 (Codex: NPA domain config)

**When unblocked:** Read `domains/npa.json` first.

**File to create:** `packages/context-engine/tests/test_npa_config.py`

**Acceptance Criteria:**
```
[ ] Tests:
    - domain_id is "NPA"
    - primary_entity is "project_id"
    - context_sources contains system_of_record type
    - context_sources contains bank_sops type
    - scoping_fields includes project_id and jurisdiction
    - untrusted_content is non-empty array
    - agents list contains NPA agent names
    - Config can be loaded by assembler
[ ] Minimum 10 tests
```

---

## SPRINT 4 — Integration Bridge & Hardening (6 pts)

### S4-003 — Circuit Breaker Module (3 pts) ⬜ PENDING

**File to edit:** `packages/context-engine/context_engine/circuit_breaker.py`
(stub exists — replace NotImplementedError bodies)

**Acceptance Criteria:**
```
[ ] context_engine/circuit_breaker.py exports:
    - create_circuit_breaker(options: dict) -> dict
        Options: { failure_threshold: int, cooldown_ms: int, fallback: callable }
        Returns breaker instance (dict with call, get_state, get_stats, reset).
    - breaker["call"](fn: callable) -> result or fallback
    - breaker["get_state"]() -> "CLOSED" | "OPEN" | "HALF_OPEN"
    - breaker["get_stats"]() -> { failures, successes, state, last_failure, last_success }
    - breaker["reset"]() -> resets to CLOSED

[ ] State transitions:
    CLOSED: calls pass through; count failures
    -> OPEN: after failure_threshold consecutive failures
    OPEN: calls short-circuit to fallback
    -> HALF_OPEN: after cooldown_ms elapsed
    HALF_OPEN: single probe call allowed
    -> CLOSED: if probe succeeds
    -> OPEN: if probe fails

[ ] Zero external dependencies (stdlib only: time, datetime)
[ ] Include reset_cache() if any module-level state
```

**Blueprint Reference:** Section 12 (Failure Modes)

---

### S4-006 — MCP Tool Provenance Wrapper (3 pts) ⬜ PENDING

**File to create:** `packages/context-engine/context_engine/mcp_provenance.py`

**Acceptance Criteria:**
```
[ ] context_engine/mcp_provenance.py exports:
    - wrap_tool_result(tool_name: str, result: Any, metadata: dict | None = None) -> dict
        Returns tagged result with provenance.
    - create_tool_provenance(tool_name: str) -> dict
        Returns base provenance tag for a tool.
    - batch_wrap_results(results: list[dict]) -> list[dict]
        Wraps multiple results.

[ ] Auto-sets:
    - source_type: "system_of_record"
    - authority_tier: 1
    - trust_class: "TRUSTED"
    - fetched_at: current ISO timestamp
    - source_id: tool name

[ ] Handles tool errors gracefully (returns error provenance tag)
[ ] Works with any MCP tool result shape
[ ] Uses provenance.tag_provenance() internally
```

**Blueprint Reference:** Section 4 (Provenance bridge)

---

## SPRINT 5 — Admin Dashboard & RAG (9 pts)

### S5-004 — Dashboard: Pipeline Health Tab (3 pts) ⬜ BLOCKED → needs S5-001 (Claude: admin API)

**Files to create:**
- `src/app/platform/components/admin/context-health-tab.component.ts`
- `src/app/platform/components/admin/context-health-tab.component.html`
- `src/app/platform/components/admin/context-health-tab.component.scss`

**Acceptance Criteria:**
```
[ ] Angular standalone component
[ ] Shows:
    - Pipeline status (healthy/degraded/down)
    - Requests/minute throughput
    - Average assembly latency (p50, p95)
    - Circuit breaker states per adapter
    - Active domain configs loaded
[ ] Auto-refreshes every 30 seconds
[ ] Calls GET /api/context/health
[ ] Loading + error states handled
[ ] Uses existing Angular styling patterns from the workbench
```

---

### S5-005 — Dashboard: Source Registry Tab (3 pts) ⬜ BLOCKED → needs S5-001 (Claude: admin API)

**Files to create:**
- `src/app/platform/components/admin/context-sources-tab.component.ts`
- `src/app/platform/components/admin/context-sources-tab.component.html`
- `src/app/platform/components/admin/context-sources-tab.component.scss`

**Acceptance Criteria:**
```
[ ] Angular standalone component
[ ] Shows table: source_id | type | tier | trust_class | domain | last_used | hit_count
[ ] Grouped by authority tier (T1 at top)
[ ] Color coding: TRUSTED=green, UNTRUSTED=orange, NEVER=red
[ ] Calls GET /api/context/sources
[ ] Loading + error states handled
```

---

### S5-008 — Chat Citation Panel Component (3 pts) ⬜ PENDING (provenance data format already exists from S2-001)

**Files to create:**
- `src/app/platform/components/shared/citation-panel.component.ts`
- `src/app/platform/components/shared/citation-panel.component.html`
- `src/app/platform/components/shared/citation-panel.component.scss`

**Acceptance Criteria:**
```
[ ] Angular standalone component
[ ] Shows: expandable citation list under agent responses
[ ] Each citation shows:
    - Source name + type
    - Authority tier (with icon: shield for T1, doc for T2, etc.)
    - Version + effective date
    - Relevant section/clause
[ ] Collapsed by default, expandable on click
[ ] Integrates with existing chat message rendering
[ ] Uses existing Angular styling patterns
```

---

## SPRINT 6 — Multi-Domain & Polish (7 pts)

### S6-002 — ORM Domain Config (2 pts) ⬜ PENDING (use S3-006 NPA config as template)

**File to create:** `packages/context-engine/domains/orm.json`

**Acceptance Criteria:**
```
[ ] domains/orm.json exists with:
    - domain_id: "ORM"
    - primary_entity: "incident_id"
    - context_sources: incident API, RCSA API, KRI API
    - scoping_fields: [incident_id, risk_category, control_id, business_line]
    - untrusted_content: [user_free_text, external_loss_data]
    - agents: [ORM_ORCH, incident, rca, rcsa, kri, loss_event, control_test, remediation]
[ ] Valid JSON, parseable
[ ] Can be loaded by assembler
```

---

### S6-004 — Domain Onboarding Playbook (2 pts) ⬜ BLOCKED → needs S6-001 (Codex: Desk config) + S6-002 (self: ORM config)

**File to create:** `docs/DOMAIN-ONBOARDING-PLAYBOOK.md`

**Acceptance Criteria:**
```
[ ] Step-by-step guide for adding a new domain:
    - Prerequisites checklist
    - Step 1: Create domain config JSON (with template)
    - Step 2: Define context sources
    - Step 3: Configure scoping rules
    - Step 4: Set up trust/grounding overrides
    - Step 5: Register agents
    - Step 6: Write domain config tests
    - Step 7: Run pipeline with mock data
[ ] Includes NPA as worked example
[ ] Includes checklist format (copy-pasteable)
[ ] Estimated time: < 1 day for simple domain
```

---

### S6-006 — Dashboard: Contracts Tab (3 pts) ⬜ BLOCKED → needs S5-001 (Claude: admin API)

**Files to create:**
- `src/app/platform/components/admin/context-contracts-tab.component.ts`
- `src/app/platform/components/admin/context-contracts-tab.component.html`
- `src/app/platform/components/admin/context-contracts-tab.component.scss`

**Acceptance Criteria:**
```
[ ] Angular standalone component
[ ] Shows: loaded contracts (orchestrator, worker, reviewer)
[ ] For each contract shows:
    - contract_id, version, archetype
    - required_context slots
    - optional_context slots
    - excluded_context items
    - budget_profile
[ ] Shows recent validation results (pass/fail per request)
[ ] Calls GET /api/context/contracts
[ ] Loading + error states handled
```

---

## EXECUTION SUMMARY

| Sprint | Story | Title | Pts | Status | Deps |
|--------|-------|-------|-----|--------|------|
| S3 | S3-003 | Session+Deleg Tests | 3 | ⬜ BLOCKED | S3-001+S3-002 (Claude) |
| S3 | S3-004 | Tracer Module | 3 | ⬜ START HERE | S2-008 ✅ |
| S3 | S3-007 | NPA Config Tests | 2 | ⬜ BLOCKED | S3-006 (Codex) |
| S4 | S4-003 | Circuit Breaker | 3 | ⬜ PENDING | S2-008 ✅ |
| S4 | S4-006 | MCP Provenance Wrapper | 3 | ⬜ PENDING | S2-001 ✅ |
| S5 | S5-004 | Health Tab (Angular) | 3 | ⬜ BLOCKED | S5-001 (Claude) |
| S5 | S5-005 | Sources Tab (Angular) | 3 | ⬜ BLOCKED | S5-001 (Claude) |
| S5 | S5-008 | Citation Panel (Angular) | 3 | ⬜ PENDING | S2-001 ✅ |
| S6 | S6-002 | ORM Domain Config | 2 | ⬜ PENDING | S3-006 (Codex) template |
| S6 | S6-004 | Onboarding Playbook | 2 | ⬜ BLOCKED | S6-001 (Codex) + S6-002 (self) |
| S6 | S6-006 | Contracts Tab (Angular) | 3 | ⬜ BLOCKED | S5-001 (Claude) |

**Immediate tasks (no blockers):** S3-004, S4-003, S4-006, S5-008
**After Codex delivers NPA config:** S3-007, S6-002
**After Claude delivers memory/delegation:** S3-003

---

## AFTER COMPLETING EACH TASK

1. Run: `cd packages/context-engine && python3 -m pytest tests/ -v`
2. Confirm ALL existing tests still pass (239 + any new tests)
3. Confirm no imports from outside `packages/context-engine/` (except Angular dashboard components)
4. Report: "S#-### DONE — description of what was built"

---

*This file is maintained by Claude Code (Architect). Full backlog edition — S2 through S6.*
