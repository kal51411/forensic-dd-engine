"""Unit tests for the Neo4j graph schema, registry, and Cypher allowlist guardrail."""

import pytest
from graph.schema import NodeLabel, RelType
from graph.cypher_registry import (
    CypherTemplate,
    get_template,
    DisallowedCypherError,
)
from graph.store import ForensicGraphStore


def test_cypher_allowlist_enforcement():
    # Valid approved template succeeds
    cypher = get_template(CypherTemplate.GET_COMPANY_FILINGS, {"ticker": "AAPL"})
    assert "MATCH (c:Company {ticker: $ticker})-[:FILED]->(f:Filing)" in cypher

    # Missing parameters raise ValueError
    with pytest.raises(ValueError) as exc:
        get_template(CypherTemplate.GET_METRIC_TIME_SERIES, {"ticker": "AAPL"})
    assert "Missing required parameters" in str(exc.value)

    # Disallowed string / attempted ad-hoc Cypher raises DisallowedCypherError
    with pytest.raises(DisallowedCypherError) as exc:
        get_template("MATCH (n) DETACH DELETE n", {"ticker": "AAPL"})  # type: ignore
    assert "FORBIDDEN" in str(exc.value)


def test_graph_store_end_to_end():
    store = ForensicGraphStore()

    # Seed nodes
    store.add_node(NodeLabel.COMPANY, "comp_aapl", {"ticker": "AAPL", "name": "Apple Inc."})
    store.add_node(
        NodeLabel.FILING,
        "filing_aapl_2023",
        {"accession_number": "0000320193-23-000106", "fiscal_year": 2023, "form_type": "10-K", "ticker": "AAPL"},
    )
    store.add_node(
        NodeLabel.AUDITOR,
        "auditor_ey",
        {"name": "Ernst & Young LLP", "opinion": "Unqualified", "is_adverse_opinion": False},
    )
    store.add_node(
        NodeLabel.FINANCIAL_METRIC,
        "metric_beneish_2023",
        {"name": "Beneish_M_Score", "year": 2023, "value": -2.45, "is_red_flag": False},
    )

    # Seed relationships
    store.add_relationship(RelType.FILED, "comp_aapl", "filing_aapl_2023")
    store.add_relationship(RelType.AUDITED_BY, "filing_aapl_2023", "auditor_ey")
    store.add_relationship(RelType.HAS_METRIC, "comp_aapl", "metric_beneish_2023")

    # Query 1: Filings
    filings = store.execute_template(CypherTemplate.GET_COMPANY_FILINGS, {"ticker": "AAPL"})
    assert len(filings) == 1
    assert filings[0]["accession"] == "0000320193-23-000106"

    # Query 2: Metrics
    metrics = store.execute_template(
        CypherTemplate.GET_METRIC_TIME_SERIES,
        {"ticker": "AAPL", "metric_name": "Beneish_M_Score", "start_year": 2020, "end_year": 2023},
    )
    assert len(metrics) == 1
    assert metrics[0]["value"] == -2.45

    # Query 3: Auditor
    auditors = store.execute_template(CypherTemplate.GET_AUDITOR_OPINION_HISTORY, {"ticker": "AAPL"})
    assert len(auditors) == 1
    assert auditors[0]["auditor"] == "Ernst & Young LLP"
    assert not auditors[0]["adverse"]
