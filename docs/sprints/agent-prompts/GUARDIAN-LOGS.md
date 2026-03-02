# QA Guardian — Running Audit Logs

> **Maintainer:** QA Guardian (Claude Sonnet — 4th agent on the team)
> **Purpose:** Running record of all audits for the lead agent. Updated after every audit session.
> **Format:** Newest entry at top. Each entry links to the session date and finding counts.

---

## Sprint 2 — Lead Fixes Applied (2026-03-02)

**Applied by:** Claude Code (Architect / Lead)
**Trigger:** Phase 1 audit FAIL — 2 CRITICALs + carryover findings

**Fixes applied:**

| Finding | Fix Applied | File(s) Changed |
|---------|------------|-----------------|
| C-002 (CRITICAL) | `scope_by_role()` now defaults unclassified items to `"RESTRICTED"` (deny-by-default). Dead code path for provenance fallback fixed. | `scoper.py` line 107 |
| C-001 (CRITICAL) | Added `scope_by_temporal()` import + 7 tests + 4 deny-by-default tests (11 new tests total). | `test_scoper.py` |
| H-001 (S2-P0) | Added `now: datetime | None = None` parameter to `merge_provenance()` for deterministic testing. | `provenance.py` |
| M-001 (S2-P0) | Fixed misleading docstring: renamed `test_zero_ttl_always_expired` → `test_zero_ttl_not_expired_at_exact_moment`. | `test_provenance.py` |
| M-002 (S2-P0) | Added `"sha256:"` prefix to `compute_chunk_hash()` output per blueprint §4.3. Updated 3 hash tests. | `provenance.py`, `test_provenance.py` |
| M-003 (S2-P0) | Added bounds-check: `classification_order.index()` now uses safe fallback for unknown values. | `provenance.py` |
| M-005 (S2-P0) | Renamed `test_empty_dict_raises_valueerror` → `test_empty_dict_raises_typeerror` to match actual behavior. | `test_provenance.py` |

**Also fixed (Gemini S2-009 bug):**
- `test_budget_trim_trigger` referenced `budget.get_budget_profile` (wrong module) and monkeypatched wrong target. Fixed to patch `assembler` module references.

**Test suite:** 239/239 passing (was 181 before S2-005, S2-007, S2-009 deliveries + 11 new fix tests)

**Remaining open findings:** H-002, H-003, M-004, M-006–M-012, L-001, L-002 (token_counter + scoper mediums/lows — tracked for sprint end)

---

## Sprint 2 — Phase 1 Audit (2026-03-01)

**Trigger:** Gemini delivered S2-003 (token_counter.py) + S2-006 (scoper.py); Codex delivered S2-007 (test_scoper.py).

**Files Audited:**
- `packages/context-engine/context_engine/token_counter.py` (S2-003, Gemini)
- `packages/context-engine/context_engine/scoper.py` (S2-006, Gemini)
- `packages/context-engine/tests/test_scoper.py` (S2-007, Codex)
- `packages/context-engine/context_engine/provenance.py` (carryover re-check)
- `packages/context-engine/tests/test_provenance.py` (carryover re-check)

**Result: FAIL**

| Severity | New | Carryover | Total |
|----------|-----|-----------|-------|
| CRITICAL | 2   | 0         | 2     |
| HIGH     | 2   | 1         | 3     |
| MEDIUM   | 7   | 5         | 12    |
| LOW      | 2   | 0         | 2     |
| **TOTAL**| **13** | **6**  | **19** |

**Story Verdicts:**

| Story | Owner | Result | Reason |
|-------|-------|--------|--------|
| S2-003 token_counter.py | Gemini | ❌ FAIL | No test file; wrong blueprint section ref; model inconsistency; get_model_limit wrong value |
| S2-006 scoper.py | Gemini | ❌ FAIL | Security violation in scope_by_role() (deny-by-default); temporal dimension untested; stub config loader |
| S2-007 test_scoper.py | Codex | ❌ FAIL | scope_by_temporal() not tested at all; "unknown domain → error" AC not validated |

**Critical Findings (must fix before merge):**

- **C-001:** `scope_by_temporal()` has zero test coverage. Called unconditionally by `apply_all_scopes()` but not imported or tested in `test_scoper.py`. SAMPLE_DATA has no temporal fields — function is completely dark.

- **C-002:** `scope_by_role()` line 107 defaults unclassified items to `"PUBLIC"` — violates blueprint §5/§6 "deny by default". The provenance fallback (`if not classification`) is dead code because `"PUBLIC"` is truthy. Unknown classification → exposed to all roles.

**Security Alert (for lead agent):**
C-002 is a banking compliance violation. Any context item without a `data_classification` key silently becomes visible to all roles including `employee`. This was NOT caught by test_scoper.py. The role filter tests all use SAMPLE_DATA which has explicit classification fields — the missing-key path was never exercised.

**Carryover Status:**
All 6 findings from the Sprint 2 Phase 0 provenance audit (H-001, M-001 through M-005) remain open. No fixes applied to provenance.py since the last audit.

**Recommended Action:**
- Block S2-004 (budget.py) and S2-008 (assembler.py) until C-001 and C-002 are resolved.
- Assign test_token_counter.py to Codex (aligns with their test ownership pattern).
- Fix scope_by_role() default to RESTRICTED or deny, not PUBLIC.
- Add scope_by_temporal() test class to test_scoper.py.

---

## Sprint 2 — Phase 0 Audit (2026-02-28)

**Trigger:** Claude delivered S2-001 (provenance.py) + S2-002 (test_provenance.py).

**Files Audited:**
- `packages/context-engine/context_engine/provenance.py` (S2-001, Claude)
- `packages/context-engine/tests/test_provenance.py` (S2-002, Codex)

**Result: PASS WITH CONDITIONS**

| Severity | Count |
|----------|-------|
| HIGH     | 1     |
| MEDIUM   | 5     |
| **TOTAL**| **6** |

**Key Findings:**

- **H-001:** `merge_provenance()` missing `now: datetime | None = None` parameter. Every other datetime-sensitive function in the module accepts this parameter for testability. Inconsistency breaks deterministic test patterns.
- **M-001:** TTL=0 test comment says "never expires" but assertion confirms tag IS expired — inverted semantics in docstring.
- **M-002:** `compute_chunk_hash()` outputs raw hex hash without `"sha256:"` prefix — blueprint §4.3 specifies the prefix.
- **M-003:** `merge_provenance()` accesses `source_index` without bounds checking.
- **M-004:** `validate_provenance()` error message text unverified against blueprint spec.
- **M-005:** `test_empty_dict_raises_valueerror` test name says ValueError but uses `pytest.raises(TypeError)`.

**Recommended Action:** Fix H-001 before assembler build. M-001 through M-005 before sprint end.

**Status:** All 6 findings carried into Phase 1 — NONE fixed as of 2026-03-01.

---

## Sprint 1 — Final Audit (2026-02-22)

**Trigger:** All Sprint 1 stories delivered. Full suite: 141/141 tests passing.

**Files Audited (original JS stack):**
- `packages/context-engine/src/trust.js`
- `packages/context-engine/src/contracts.js`
- `packages/context-engine/src/index.js`
- `packages/context-engine/config/trust-classification.json`
- `packages/context-engine/config/budget-defaults.json`
- `packages/context-engine/tests/unit/contracts.test.js`
- `packages/context-engine/contracts/orchestrator.json`
- `packages/context-engine/contracts/worker.json`
- `packages/context-engine/contracts/reviewer.json`

**Result: PASS ✅** (after fixes verified)

| Severity | Found | Fixed | Remaining |
|----------|-------|-------|-----------|
| CRITICAL | 1     | 1     | 0         |
| HIGH     | 4     | 4     | 0         |
| MEDIUM   | 4     | 1     | 3         |
| LOW      | 2     | 0     | 2         |

**Findings and Fix Status:**

| ID | Issue | Fixed? |
|----|-------|--------|
| C-001 | Mock contracts under-specified (worker 3/5, reviewer 2/4 required slots) | ✅ Fixed |
| H-001 | NEVER sources dual-truth in trust-classification.json AND trust.js | ✅ Fixed — removed from JSON, trust.js sole enforcer |
| H-002 | getRequiredSources() returned string[] not source spec[] | ✅ Fixed |
| H-003 | Budget profiles missing from budget-defaults.json | ✅ Fixed — lightweight/standard/compact added |
| H-004 | validateContext() threw TypeError on null contract | ✅ Fixed — null guard added |
| M-001–3 | Various medium findings | ⚠️ Tracked for future |
| L-001–2 | Low findings | ⚠️ Tracked for future |

**Full test suite verified:** 141/141 passing after fixes.
**JS→Python rewrite noted:** Sprint 2 onwards is Python 3.11+, pytest, tiktoken, snake_case.

---

## Cumulative Finding Tracker

| Finding ID | Sprint | File | Severity | Status | Date Found | Date Fixed |
|------------|--------|------|----------|--------|------------|------------|
| C-001 (S1) | S1 | contracts.test.js | CRITICAL | ✅ Fixed | 2026-02-22 | 2026-02-22 |
| H-001 (S1) | S1 | trust-classification.json | HIGH | ✅ Fixed | 2026-02-22 | 2026-02-22 |
| H-002 (S1) | S1 | contracts.js | HIGH | ✅ Fixed | 2026-02-22 | 2026-02-22 |
| H-003 (S1) | S1 | budget-defaults.json | HIGH | ✅ Fixed | 2026-02-22 | 2026-02-22 |
| H-004 (S1) | S1 | contracts.js | HIGH | ✅ Fixed | 2026-02-22 | 2026-02-22 |
| H-001 (S2-P0) | S2 | provenance.py | HIGH | ✅ Fixed | 2026-02-28 | 2026-03-02 |
| M-001 (S2-P0) | S2 | test_provenance.py | MEDIUM | ✅ Fixed | 2026-02-28 | 2026-03-02 |
| M-002 (S2-P0) | S2 | provenance.py | MEDIUM | ✅ Fixed | 2026-02-28 | 2026-03-02 |
| M-003 (S2-P0) | S2 | provenance.py | MEDIUM | ✅ Fixed | 2026-02-28 | 2026-03-02 |
| M-004 (S2-P0) | S2 | provenance.py | MEDIUM | ❌ Open | 2026-02-28 | — |
| M-005 (S2-P0) | S2 | test_provenance.py | MEDIUM | ✅ Fixed | 2026-02-28 | 2026-03-02 |
| C-001 (S2-P1) | S2 | scoper.py / test_scoper.py | CRITICAL | ✅ Fixed | 2026-03-01 | 2026-03-02 |
| C-002 (S2-P1) | S2 | scoper.py | CRITICAL | ✅ Fixed | 2026-03-01 | 2026-03-02 |
| H-002 (S2-P1) | S2 | token_counter.py | HIGH | ❌ Open | 2026-03-01 | — |
| H-003 (S2-P1) | S2 | test_scoper.py | HIGH | ❌ Open | 2026-03-01 | — |
| M-006 (S2-P1) | S2 | token_counter.py | MEDIUM | ❌ Open | 2026-03-01 | — |
| M-007 (S2-P1) | S2 | token_counter.py | MEDIUM | ❌ Open | 2026-03-01 | — |
| M-008 (S2-P1) | S2 | token_counter.py | MEDIUM | ❌ Open | 2026-03-01 | — |
| M-009 (S2-P1) | S2 | token_counter.py | MEDIUM | ❌ Open | 2026-03-01 | — |
| M-010 (S2-P1) | S2 | scoper.py | MEDIUM | ❌ Open | 2026-03-01 | — |
| M-011 (S2-P1) | S2 | test_scoper.py | MEDIUM | ❌ Open | 2026-03-01 | — |
| M-012 (S2-P1) | S2 | scoper.py | MEDIUM | ❌ Open | 2026-03-01 | — |
| L-001 (S2-P1) | S2 | token_counter.py | LOW | ❌ Open | 2026-03-01 | — |
| L-002 (S2-P1) | S2 | scoper.py | LOW | ❌ Open | 2026-03-01 | — |

**Open findings: 12 | Fixed: 12 | Total ever raised: 24**

---

*QA Guardian — last updated 2026-03-02 by Claude Code (Lead)*
