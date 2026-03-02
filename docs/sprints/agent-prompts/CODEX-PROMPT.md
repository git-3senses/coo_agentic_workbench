# Codex — Builder Agent Prompt

> **Last updated:** 2026-03-02 (Full backlog edition — S2 through S6)
> **Instruction:** Read this file top-to-bottom, then proceed with the NEXT PENDING task.
> **Mode:** Execute ALL pending tasks in sequence. Do NOT stop between sprints.

---

## YOUR IDENTITY

```
+============================================================================+
|  AGENT:   Codex (Builder)                                                   |
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
|    - Use jest, mocha, or any JS test framework                               |
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
│   ├── token_counter.py                 # ✅ S2 — 4 functions (Gemini)
│   ├── budget.py                        # ✅ S2 — 4 public functions
│   ├── scoper.py                        # ✅ S2 — 8 public functions (Gemini)
│   ├── assembler.py                     # ✅ S2 — 3 public functions (7-stage pipeline)
│   ├── memory.py                        # ⬜ STUB (Sprint 3 — Claude builds)
│   ├── delegation.py                    # ⬜ STUB (Sprint 3 — Claude builds)
│   ├── tracer.py                        # ⬜ STUB (Sprint 3 — Gemini builds)
│   ├── circuit_breaker.py              # ⬜ STUB (Sprint 4 — Gemini builds)
│   ├── mcp_provenance.py              # ⬜ STUB (Sprint 4 — Gemini builds)
│   ├── grounding.py                     # ⬜ STUB (Sprint 5 — Claude builds)
│   └── rag.py                           # ⬜ STUB (Sprint 5 — Claude builds)
└── tests/
    ├── __init__.py
    ├── conftest.py                      # Shared fixtures
    ├── test_trust.py                    # ✅ 42 tests
    ├── test_contracts.py                # ✅ 52 tests
    ├── test_provenance.py               # ✅ 66 tests
    ├── test_scoper.py                   # ✅ 32 tests (21 original + 11 fix tests)
    ├── test_assembler_happy.py          # ✅ Gemini delivered (S2-009)
    ├── test_budget.py                   # ⬜ YOUR S2-005 task
    └── test_assembler_edge.py           # ⬜ YOUR S2-010 task
```

**Test command:** `cd packages/context-engine && python3 -m pytest tests/ -v`
**Current status:** 239/239 tests passing

---

## CODING RULES (TESTS)

```
1. All test files go under packages/context-engine/tests/
2. File naming: test_<module>.py (e.g., test_budget.py)
3. Use pytest (NOT unittest classes unless grouping with TestXxx classes)
4. Import from context_engine.<module> (e.g., from context_engine.budget import allocate_budget)
5. Use fixtures from conftest.py where applicable
6. Use realistic NPA/banking domain data in test fixtures (not {"a": 1})
7. Test edge cases: None, empty string, empty list, empty dict, unknown values
8. Test error paths: invalid input should raise ValueError/TypeError with meaningful messages
9. NEVER import from server/, src/app/, or shared/
10. Ensure tests are independent — no test should depend on another test's state
```

---

## CODING RULES (CONFIG FILES)

```
1. All config files go under packages/context-engine/config/ or domains/
2. Must be valid JSON, parseable by json.loads()
3. Use snake_case for all keys
4. Realistic domain values (NPA projects, ORM incidents, Desk counterparties)
```

---

## CODING RULES (ANGULAR DASHBOARD COMPONENTS — Sprint 5-6)

```
1. Dashboard components go under src/app/platform/components/admin/
2. Follow existing Angular patterns in the codebase
3. Use standalone components (Angular 17+ style)
4. Import HttpClient for API calls
5. Handle loading, error, and empty states
6. Use existing SCSS variables and styling patterns
```

---

## REFERENCE: How Existing Tests Are Written

Look at these files for style/pattern reference:
- `tests/test_trust.py` — TestXxx class grouping, comprehensive edge cases
- `tests/test_provenance.py` — most thorough (66 tests), use as gold standard
- `tests/conftest.py` — shared fixtures (config_dir, contracts_dir, sample_provenance_tag)

Key patterns:
```python
# Test class grouping pattern
class TestAllocateBudget:
    def test_normal_allocation(self):
        result = allocate_budget(...)
        assert result["total"] <= 128000

    def test_overflow_triggers_compression(self):
        ...

# Edge case pattern
def test_none_input_raises(self):
    with pytest.raises(TypeError):
        some_function(None)
```

---

## SPRINT HISTORY

### Sprint 1 — COMPLETE ✅ (35/35 pts)
All 15 stories delivered. 160 tests passing. Guardian audit passed.
Your S1 work: S1-002, S1-003, S1-007, S1-008, S1-012, S1-015 — all done.

---

## FULL BACKLOG — Execute All Pending Tasks Below

> **Execute order:** Work through tasks top-to-bottom. Skip any marked ✅ DONE.
> If a task says BLOCKED, skip it and come back after its dependency is delivered.
> When a stub module exists, read it first before writing tests.

---

## SPRINT 2 — Core Pipeline (40 pts)

### S2-002 — Provenance Tests ✅ DONE
66 tests for provenance.py. Already passing.

### S2-005 — Budget Allocator Tests (2 pts) ⬜ PENDING

**Prerequisite:** Read `context_engine/budget.py` first. It has 4 public functions:
- `get_budget_limits(profile_name)` — returns budget limits for a profile
- `allocate_budget(draft_context, contract, model)` — allocates tokens across slots
- `check_budget(context_package, contract, model)` — checks if within budget
- `trim_to_budget(context_package, contract, model)` — trims lowest-priority slots

It loads `config/budget-defaults.json` and uses `token_counter` for measurement.

**File to create:** `packages/context-engine/tests/test_budget.py`

**Acceptance Criteria:**
```
[ ] Tests for allocate_budget():
    - Normal allocation within limits
    - Overflow triggers compression strategy
    - Never-compress items (system_prompt, entity_data) preserved during overflow
    - Empty context package -> minimal allocation
[ ] Tests for check_budget():
    - Within budget -> {"within_budget": True, ...}
    - Over budget -> {"within_budget": False, "overflow_slots": [...]}
[ ] Tests for trim_to_budget():
    - Trims lowest-priority slots first (conversation_hist before entity_data)
    - Stops trimming when within budget
    - Never trims never_compress items
[ ] Tests for get_budget_limits():
    - "lightweight" profile -> reduced allocations
    - "standard" profile -> default allocations
    - "compact" profile -> minimal allocations
    - Unknown profile -> raises ValueError
[ ] Minimum 20 tests
```

---

### S2-007 — Context Scoper Tests ✅ DONE (32 tests passing)

### S2-010 — Assembler Edge Case Tests (4 pts) ⬜ PENDING

**Prerequisite:** Read `context_engine/assembler.py` first. It has 3 public functions:
- `assemble_context(request, archetype, domain, user_context, adapters)` — 7-stage pipeline
- `validate_assembled_context(context_package, archetype)` — validates against contract
- `create_assembler(config)` — factory returning `{assemble, validate, config}`

Adapters dict: `{retrieve: fn, get_entity_data: fn, get_kb_chunks: fn}`

**File to create:** `packages/context-engine/tests/test_assembler_edge.py`

**Acceptance Criteria:**
```
[ ] Tests for failure scenarios:
    - Adapter raises exception -> graceful degradation (no crash)
    - Adapter returns empty -> handle missing data
    - Adapter returns None -> handle gracefully
[ ] Tests for edge cases:
    - Zero entity data -> still assembles (with empty entity slot)
    - Massive data -> budget overflow handled
    - No KB chunks returned -> still valid context package
    - Unknown archetype -> raises ValueError
    - Missing required context after assembly -> validation reports it
[ ] Tests for adapter interface:
    - Mock adapter called with correct params
    - Adapter results tagged with provenance
    - Multiple adapters can be provided
[ ] Tests for pipeline integrity:
    - Every stage in _metadata.stages (7 stages)
    - trace_id is present and unique
    - Budget report is present
[ ] Minimum 15 tests
```

---

## SPRINT 3 — Memory, Observability & Domain Config (8 pts)

### S3-005 — Observability Tracer Tests (2 pts) ⬜ BLOCKED → needs S3-004 (Gemini: tracer.py)

**When unblocked:** Read `context_engine/tracer.py` first.

**File to create:** `packages/context-engine/tests/test_tracer.py`

**Acceptance Criteria:**
```
[ ] Tests for create_trace():
    - Returns trace object with unique trace_id
    - trace_id is UUID format
[ ] Tests for add_stage_event():
    - Adds stage event with all required fields
    - stage_name, started_at, duration_ms, items_in, items_out, tokens_in, tokens_out
    - Multiple events can be added
[ ] Tests for finalize_trace():
    - Calculates totals (total_duration_ms, total_tokens)
    - Marks trace as finalized
[ ] Tests for get_trace_metrics():
    - Returns stages[], total_duration_ms, total_tokens, per_stage_tokens{}
[ ] Tests for serialize_trace():
    - Returns valid JSON string
    - Round-trips correctly
[ ] Minimum 12 tests
```

---

### S3-006 — NPA Domain Config (3 pts) ⬜ PENDING

**File to create:** `packages/context-engine/domains/npa.json`

**Acceptance Criteria:**
```
[ ] domains/npa.json exists with:
    - domain_id: "NPA"
    - primary_entity: "project_id"
    - context_sources: [
        { source_id: "npa_project_api", source_type: "system_of_record", authority_tier: 1 },
        { source_id: "bank_sops", source_type: "bank_sop", authority_tier: 2 },
        { source_id: "industry_standards", source_type: "industry_standard", authority_tier: 3 }
      ]
    - scoping_fields: ["project_id", "jurisdiction", "product_type"]
    - untrusted_content: ["user_free_text", "uploaded_documents"]
    - agents: list of NPA agents with their archetypes
    - grounding_overrides: NPA-specific citation requirements
[ ] Valid JSON, parseable
[ ] Can be loaded by assembler
```

---

### S3-008 — Demo Domain Config (1 pt) ⬜ PENDING

**File to create:** `packages/context-engine/domains/demo.json`

**Acceptance Criteria:**
```
[ ] domains/demo.json exists with:
    - domain_id: "DEMO"
    - primary_entity: "demo_id"
    - Minimal context_sources (1 source)
    - Simple scoping (1 field)
    - Comments explaining each field purpose
[ ] Can be loaded by assembler for testing
```

---

## SPRINT 4 — Integration Bridge & Hardening (10 pts)

### S4-004 — Circuit Breaker Tests (3 pts) ⬜ BLOCKED → needs S4-003 (Gemini: circuit_breaker.py)

**When unblocked:** Read `context_engine/circuit_breaker.py` first.

**File to create:** `packages/context-engine/tests/test_circuit_breaker.py`

**Acceptance Criteria:**
```
[ ] Tests for state transitions:
    - CLOSED -> OPEN (after N consecutive failures)
    - OPEN -> HALF_OPEN (after cooldown period)
    - HALF_OPEN -> CLOSED (on success)
    - HALF_OPEN -> OPEN (on failure)
[ ] Tests for behavior:
    - Calls pass through in CLOSED state
    - Calls short-circuit to fallback in OPEN state
    - Single probe call in HALF_OPEN state
    - Fallback invoked on open circuit
[ ] Tests for configuration:
    - Custom failure threshold
    - Custom cooldown period
    - Reset to CLOSED
[ ] Tests for stats:
    - Tracks failures, successes, last_failure, last_success
[ ] Minimum 15 tests
```

---

### S4-005 — Failure Mode Tests (5 pts) ⬜ BLOCKED → needs S4-001 (Claude: bridge) + S4-003 (Gemini: circuit breaker)

**File to create:** `packages/context-engine/tests/test_failure_modes.py`

**Acceptance Criteria:**
```
[ ] Tests for each of the 8 failure modes (Blueprint Section 12):
    1. MCP tool unreachable -> stale cache / fallback
    2. KB search returns empty -> proceed without KB
    3. Token budget exceeded -> overflow compression
    4. Provenance missing -> flag as ungrounded
    5. Trust classification ambiguous -> default UNTRUSTED
    6. Session state corrupted -> start fresh session
    7. Cross-domain conflict -> domain boundary enforcement
    8. Source authority conflict -> higher tier wins
[ ] Each mode tests: Detection, Degradation, Mitigation, Logging
[ ] Minimum 24 tests (3 per mode)
```

---

### S4-007 — MCP Provenance Wrapper Tests (2 pts) ⬜ BLOCKED → needs S4-006 (Gemini: mcp_provenance.py)

**File to create:** `packages/context-engine/tests/test_mcp_provenance.py`

**Acceptance Criteria:**
```
[ ] Tests for wrap_tool_result():
    - Adds provenance tags to tool results
    - source_type set to "system_of_record"
    - authority_tier set to 1
    - trust_class set to "TRUSTED"
    - fetched_at is current timestamp
[ ] Tests for batch_wrap_results():
    - Multiple results tagged correctly
[ ] Tests for error handling:
    - Tool errors propagated correctly
    - Empty tool results handled
    - None result handled
[ ] Minimum 10 tests
```

---

## SPRINT 5 — Admin Dashboard & RAG (9 pts)

### S5-003 — Grounding Scorer Tests (3 pts) ⬜ BLOCKED → needs S5-002 (Claude: grounding.py)

**File to create:** `packages/context-engine/tests/test_grounding.py`

**Acceptance Criteria:**
```
[ ] Tests for score_grounding():
    - Fully grounded response -> score 1.0
    - Partially grounded -> score 0.5-0.9
    - No citations -> score 0.0
    - Mixed grounded/ungrounded claims
[ ] Tests for identify_claims():
    - Extracts claims from response text
    - Handles no claims (general text)
[ ] Tests for verify_claim():
    - 5 verification steps each tested
    - Expired source -> step 4 fails
    - Insufficient authority -> step 5 fails
[ ] Minimum 18 tests
```

---

### S5-006 — Dashboard: Context Traces Tab (3 pts) ⬜ BLOCKED → needs S5-001 (Claude: admin API)

**Files to create:**
- `src/app/platform/components/admin/context-traces-tab.component.ts`
- `src/app/platform/components/admin/context-traces-tab.component.html`
- `src/app/platform/components/admin/context-traces-tab.component.scss`

**Acceptance Criteria:**
```
[ ] Angular standalone component
[ ] Shows table: trace_id | agent | domain | stages | duration
[ ] Click trace -> expands to show 7-stage breakdown
[ ] Each stage shows: name, duration_ms, items_processed, items_kept, tokens_used
[ ] Calls GET /api/context/traces
[ ] Loading + error states handled
[ ] Uses existing Angular styling patterns
```

---

### S5-007 — Dashboard: Context Quality Tab (3 pts) ⬜ BLOCKED → needs S5-001 + S5-002 (Claude)

**Files to create:**
- `src/app/platform/components/admin/context-quality-tab.component.ts`
- `src/app/platform/components/admin/context-quality-tab.component.html`
- `src/app/platform/components/admin/context-quality-tab.component.scss`

**Acceptance Criteria:**
```
[ ] Angular standalone component
[ ] Shows: overall grounding score (0-1), per-agent scores
[ ] Shows: claims checked, claims grounded, ungrounded claims list
[ ] Calls GET /api/context/quality
[ ] Loading + error states handled
```

---

## SPRINT 6 — Multi-Domain & Polish (7 pts)

### S6-001 — Desk Support Domain Config (2 pts) ⬜ PENDING (after S3-006 NPA config is your template)

**File to create:** `packages/context-engine/domains/desk.json`

**Acceptance Criteria:**
```
[ ] domains/desk.json exists with:
    - domain_id: "DESK"
    - primary_entity: "counterparty_id"
    - context_sources: onboarding, credit, documentation systems
    - scoping_fields: ["counterparty_id", "business_unit", "product"]
    - untrusted_content: ["user_free_text", "retrieved_emails"]
    - agents: [DESK_ORCH, triage, resolver, escalation]
[ ] Valid JSON, parseable
[ ] Can be loaded by assembler
```

---

### S6-003 — Domain Config Validation Tests (2 pts) ⬜ BLOCKED → needs S6-001 + S6-002 (Gemini: ORM config)

**File to create:** `packages/context-engine/tests/test_domain_configs.py`

**Acceptance Criteria:**
```
[ ] Tests for each domain config (NPA, Desk, ORM):
    - Has required fields (domain_id, primary_entity, etc.)
    - context_sources are valid source types
    - scoping_fields are non-empty strings
    - agents list is non-empty
[ ] Cross-domain consistency:
    - No duplicate domain_ids
    - All use same schema structure
[ ] Minimum 15 tests
```

---

### S6-005 — Dashboard: Trust & Scoping Tab (3 pts) ⬜ BLOCKED → needs S5-001 (Claude: admin API)

**Files to create:**
- `src/app/platform/components/admin/context-trust-tab.component.ts`
- `src/app/platform/components/admin/context-trust-tab.component.html`
- `src/app/platform/components/admin/context-trust-tab.component.scss`

**Acceptance Criteria:**
```
[ ] Angular standalone component
[ ] Shows: trust classification rules (loaded from config)
[ ] Shows: recent classification decisions with input/output
[ ] Shows: active domain scoping (which domains are loaded)
[ ] Calls GET /api/context/sources
[ ] Loading + error states handled
```

---

## EXECUTION SUMMARY

| Sprint | Story | Title | Pts | Status | Deps |
|--------|-------|-------|-----|--------|------|
| S2 | S2-005 | Budget Tests | 2 | ⬜ START HERE | S2-004 ✅ |
| S2 | S2-010 | Assembler Edge Tests | 4 | ⬜ NEXT | S2-008 ✅ |
| S3 | S3-005 | Tracer Tests | 2 | ⬜ BLOCKED | S3-004 (Gemini) |
| S3 | S3-006 | NPA Domain Config | 3 | ⬜ PENDING | S2-008 ✅ |
| S3 | S3-008 | Demo Domain Config | 1 | ⬜ PENDING | S2-008 ✅ |
| S4 | S4-004 | Circuit Breaker Tests | 3 | ⬜ BLOCKED | S4-003 (Gemini) |
| S4 | S4-005 | Failure Mode Tests | 5 | ⬜ BLOCKED | S4-001 (Claude) + S4-003 (Gemini) |
| S4 | S4-007 | MCP Provenance Tests | 2 | ⬜ BLOCKED | S4-006 (Gemini) |
| S5 | S5-003 | Grounding Tests | 3 | ⬜ BLOCKED | S5-002 (Claude) |
| S5 | S5-006 | Traces Tab (Angular) | 3 | ⬜ BLOCKED | S5-001 (Claude) |
| S5 | S5-007 | Quality Tab (Angular) | 3 | ⬜ BLOCKED | S5-001 + S5-002 (Claude) |
| S6 | S6-001 | Desk Domain Config | 2 | ⬜ PENDING | S3-006 (self) |
| S6 | S6-003 | Domain Validation Tests | 2 | ⬜ BLOCKED | S6-001 (self) + S6-002 (Gemini) |
| S6 | S6-005 | Trust Tab (Angular) | 3 | ⬜ BLOCKED | S5-001 (Claude) |

**Immediate tasks (no blockers):** S2-005, S2-010, S3-006, S3-008
**After those:** S6-001 (uses S3-006 as template)

---

## AFTER COMPLETING EACH TASK

1. Run: `cd packages/context-engine && python3 -m pytest tests/ -v`
2. Confirm ALL existing tests still pass (239 + your new tests)
3. Confirm no imports from outside `packages/context-engine/`
4. Report: "S#-### DONE — N tests passing, full suite green"

---

*This file is maintained by Claude Code (Architect). Full backlog edition — S2 through S6.*
