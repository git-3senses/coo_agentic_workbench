"""Tests for context_engine.scoper (S2-007)."""

from __future__ import annotations

from copy import deepcopy

from context_engine.scoper import (
    apply_all_scopes,
    scope_by_classification,
    scope_by_domain,
    scope_by_entity,
    scope_by_jurisdiction,
    scope_by_role,
    scope_by_temporal,
)


SAMPLE_DATA = [
    {
        "id": "d1",
        "domain": "NPA",
        "entity_id": "PRJ-001",
        "entity_type": "project",
        "jurisdiction": "SG",
        "data_classification": "CONFIDENTIAL",
    },
    {
        "id": "d2",
        "domain": "ORM",
        "entity_id": "INC-042",
        "entity_type": "incident",
        "jurisdiction": "HK",
        "data_classification": "INTERNAL",
    },
    {
        "id": "d3",
        "domain": "NPA",
        "entity_id": "PRJ-001",
        "entity_type": "project",
        "jurisdiction": "GLOBAL",
        "data_classification": "PUBLIC",
    },
    {
        "id": "d4",
        "domain": "NPA",
        "entity_id": "PRJ-002",
        "entity_type": "project",
        "jurisdiction": "SG",
        "data_classification": "RESTRICTED",
    },
    {
        "id": "d5",
        "domain": "platform",
        "jurisdiction": "GLOBAL",
        "data_classification": "INTERNAL",
    },
    {
        "id": "d6",
        "jurisdiction": "GLOBAL",
        "data_classification": "PUBLIC",
    },
]


class TestScopeByDomain:
    def test_npa_filters_to_npa_platform_and_none_domain(self) -> None:
        result = scope_by_domain(deepcopy(SAMPLE_DATA), "NPA")
        assert {item["id"] for item in result} == {"d1", "d3", "d4", "d5", "d6"}

    def test_orm_filters_to_orm_platform_and_none_domain(self) -> None:
        result = scope_by_domain(deepcopy(SAMPLE_DATA), "ORM")
        assert {item["id"] for item in result} == {"d2", "d5", "d6"}

    def test_unknown_domain_keeps_platform_and_none_domain_only(self) -> None:
        result = scope_by_domain(deepcopy(SAMPLE_DATA), "UNKNOWN")
        assert {item["id"] for item in result} == {"d5", "d6"}

    def test_empty_data_returns_empty(self) -> None:
        assert scope_by_domain([], "NPA") == []


class TestScopeByEntity:
    def test_project_scoping_for_npa_entity(self) -> None:
        result = scope_by_entity(deepcopy(SAMPLE_DATA), entity_id="PRJ-001", entity_type="project")
        assert {item["id"] for item in result} == {"d1", "d3", "d5", "d6"}

    def test_incident_scoping_for_orm_entity(self) -> None:
        result = scope_by_entity(deepcopy(SAMPLE_DATA), entity_id="INC-042", entity_type="incident")
        assert {item["id"] for item in result} == {"d2", "d5", "d6"}

    def test_none_entity_id_returns_all_data(self) -> None:
        result = scope_by_entity(deepcopy(SAMPLE_DATA), entity_id=None)
        assert len(result) == len(SAMPLE_DATA)

    def test_no_matching_entity_returns_empty_when_no_global_items(self) -> None:
        bound_only = [
            {"id": "x1", "entity_id": "PRJ-001", "entity_type": "project"},
            {"id": "x2", "entity_id": "PRJ-002", "entity_type": "project"},
        ]
        result = scope_by_entity(bound_only, entity_id="PRJ-999", entity_type="project")
        assert result == []


class TestScopeByJurisdiction:
    def test_sg_jurisdiction_keeps_sg_and_global(self) -> None:
        result = scope_by_jurisdiction(deepcopy(SAMPLE_DATA), "SG")
        assert {item["id"] for item in result} == {"d1", "d3", "d4", "d5", "d6"}

    def test_unknown_jurisdiction_keeps_global_only(self) -> None:
        no_none = [
            {"id": "g1", "jurisdiction": "GLOBAL"},
            {"id": "h1", "jurisdiction": "HK"},
            {"id": "s1", "jurisdiction": "SG"},
        ]
        result = scope_by_jurisdiction(no_none, "JP")
        assert {item["id"] for item in result} == {"g1"}

    def test_empty_jurisdiction_returns_all(self) -> None:
        result = scope_by_jurisdiction(deepcopy(SAMPLE_DATA), "")
        assert len(result) == len(SAMPLE_DATA)


class TestScopeByClassification:
    def test_internal_max_excludes_confidential_and_restricted(self) -> None:
        result = scope_by_classification(deepcopy(SAMPLE_DATA), "INTERNAL")
        assert {item["id"] for item in result} == {"d2", "d3", "d5", "d6"}

    def test_restricted_max_keeps_all_levels(self) -> None:
        result = scope_by_classification(deepcopy(SAMPLE_DATA), "RESTRICTED")
        assert len(result) == len(SAMPLE_DATA)

    def test_public_max_keeps_only_public(self) -> None:
        result = scope_by_classification(deepcopy(SAMPLE_DATA), "PUBLIC")
        assert {item["id"] for item in result} == {"d3", "d6"}


class TestScopeByRole:
    def test_analyst_sees_up_to_confidential(self) -> None:
        result = scope_by_role(deepcopy(SAMPLE_DATA), "analyst")
        assert {item["id"] for item in result} == {"d1", "d2", "d3", "d5", "d6"}

    def test_employee_sees_up_to_internal(self) -> None:
        result = scope_by_role(deepcopy(SAMPLE_DATA), "employee")
        assert {item["id"] for item in result} == {"d2", "d3", "d5", "d6"}

    def test_coo_sees_everything(self) -> None:
        result = scope_by_role(deepcopy(SAMPLE_DATA), "coo")
        assert len(result) == len(SAMPLE_DATA)


class TestScopeByRoleDenyByDefault:
    """Tests for C-002 fix: missing data_classification defaults to RESTRICTED."""

    def test_missing_classification_denied_for_employee(self) -> None:
        data = [{"id": "no_class", "domain": "NPA"}]
        result = scope_by_role(data, "employee")
        assert result == []

    def test_missing_classification_denied_for_analyst(self) -> None:
        data = [{"id": "no_class", "domain": "NPA"}]
        result = scope_by_role(data, "analyst")
        assert result == []

    def test_missing_classification_allowed_for_coo(self) -> None:
        data = [{"id": "no_class", "domain": "NPA"}]
        result = scope_by_role(data, "coo")
        assert len(result) == 1

    def test_classification_from_provenance_fallback(self) -> None:
        data = [{"id": "prov_class", "provenance": {"data_classification": "PUBLIC"}}]
        result = scope_by_role(data, "employee")
        assert len(result) == 1


class TestScopeByTemporal:
    """Tests for scope_by_temporal() — C-001 fix."""

    def test_no_temporal_fields_passes_through(self) -> None:
        data = [{"id": "d1", "domain": "NPA"}]
        result = scope_by_temporal(data)
        assert len(result) == 1

    def test_future_effective_date_excluded(self) -> None:
        data = [{"id": "d1", "effective_date": "2099-01-01T00:00:00+00:00"}]
        result = scope_by_temporal(data)
        assert result == []

    def test_past_effective_date_included(self) -> None:
        data = [{"id": "d1", "effective_date": "2020-01-01T00:00:00+00:00"}]
        result = scope_by_temporal(data)
        assert len(result) == 1

    def test_past_expiry_date_excluded(self) -> None:
        data = [{"id": "d1", "expiry_date": "2020-01-01T00:00:00+00:00"}]
        result = scope_by_temporal(data)
        assert result == []

    def test_future_expiry_date_included(self) -> None:
        data = [{"id": "d1", "expiry_date": "2099-12-31T23:59:59+00:00"}]
        result = scope_by_temporal(data)
        assert len(result) == 1

    def test_temporal_fields_in_provenance(self) -> None:
        data = [{"id": "d1", "provenance": {"expiry_date": "2020-01-01T00:00:00+00:00"}}]
        result = scope_by_temporal(data)
        assert result == []

    def test_empty_list_returns_empty(self) -> None:
        assert scope_by_temporal([]) == []


class TestApplyAllScopes:
    def test_chains_domain_entity_and_jurisdiction(self) -> None:
        config = {
            "domain": "NPA",
            "entity_id": "PRJ-001",
            "entity_type": "project",
            "jurisdiction": "SG",
        }
        result = apply_all_scopes(deepcopy(SAMPLE_DATA), config)
        # d1 matches fully; d3 is GLOBAL and entity match; d5/d6 survive as unbound GLOBAL platform/none-domain data
        assert {item["id"] for item in result} == {"d1", "d3", "d5", "d6"}

    def test_partial_config_applies_only_present_scopes(self) -> None:
        config = {"domain": "ORM", "user_role": "employee"}
        result = apply_all_scopes(deepcopy(SAMPLE_DATA), config)
        assert {item["id"] for item in result} == {"d2", "d5", "d6"}

    def test_empty_config_returns_all_data(self) -> None:
        result = apply_all_scopes(deepcopy(SAMPLE_DATA), {})
        assert len(result) == len(SAMPLE_DATA)

    def test_empty_input_returns_empty(self) -> None:
        result = apply_all_scopes([], {"domain": "NPA", "entity_id": "PRJ-001"})
        assert result == []
