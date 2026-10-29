"""Cypher Template Registry with strict allowlist enforcement.

Enforces HARD CONSTRAINT: Zero model-generated Cypher.
All graph queries must resolve to a pre-compiled, parameterized template Enum.
"""

from enum import Enum
from typing import Dict, Any, Optional


class CypherTemplate(str, Enum):
    GET_COMPANY_FILINGS = "GET_COMPANY_FILINGS"
    GET_METRIC_TIME_SERIES = "GET_METRIC_TIME_SERIES"
    GET_AUDITOR_OPINION_HISTORY = "GET_AUDITOR_OPINION_HISTORY"
    GET_OFFICER_CHANGES = "GET_OFFICER_CHANGES"
    GET_RELATED_RISKS = "GET_RELATED_RISKS"
    GET_ITEM_CHUNKS_FOR_FILING = "GET_ITEM_CHUNKS_FOR_FILING"


# Strict query definitions with required parameter validation schemas
_TEMPLATE_REGISTRY: Dict[CypherTemplate, Dict[str, Any]] = {
    CypherTemplate.GET_COMPANY_FILINGS: {
        "cypher": (
            "MATCH (c:Company {ticker: $ticker})-[:FILED]->(f:Filing) "
            "RETURN f.accession_number AS accession, f.fiscal_year AS year, f.form_type AS form "
            "ORDER BY f.fiscal_year DESC"
        ),
        "required_params": {"ticker"},
    },
    CypherTemplate.GET_METRIC_TIME_SERIES: {
        "cypher": (
            "MATCH (c:Company {ticker: $ticker})-[:HAS_METRIC]->(m:FinancialMetric) "
            "WHERE m.name = $metric_name AND m.year >= $start_year AND m.year <= $end_year "
            "RETURN m.year AS year, m.value AS value, m.is_red_flag AS red_flag "
            "ORDER BY m.year ASC"
        ),
        "required_params": {"ticker", "metric_name", "start_year", "end_year"},
    },
    CypherTemplate.GET_AUDITOR_OPINION_HISTORY: {
        "cypher": (
            "MATCH (c:Company {ticker: $ticker})-[:FILED]->(f:Filing)-[:AUDITED_BY]->(a:Auditor) "
            "RETURN f.fiscal_year AS year, a.name AS auditor, a.opinion AS opinion, a.is_adverse_opinion AS adverse "
            "ORDER BY f.fiscal_year DESC"
        ),
        "required_params": {"ticker"},
    },
    CypherTemplate.GET_OFFICER_CHANGES: {
        "cypher": (
            "MATCH (c:Company {ticker: $ticker})-[:HAS_OFFICER]->(o:Officer) "
            "RETURN o.name AS name, o.title AS title, o.tenure_years AS tenure"
        ),
        "required_params": {"ticker"},
    },
    CypherTemplate.GET_RELATED_RISKS: {
        "cypher": (
            "MATCH (c:Company {ticker: $ticker})-[:FILED]->(f:Filing)-[:HAS_ITEM]->(ch:ItemChunk)-[:DISCLOSES_RISK]->(r:RiskFactor) "
            "WHERE r.topic CONTAINS $topic "
            "RETURN ch.chunk_id AS chunk_id, r.topic AS topic, r.severity AS severity "
            "LIMIT 10"
        ),
        "required_params": {"ticker", "topic"},
    },
    CypherTemplate.GET_ITEM_CHUNKS_FOR_FILING: {
        "cypher": (
            "MATCH (c:Company {ticker: $ticker})-[:FILED]->(f:Filing {fiscal_year: $year})-[:HAS_ITEM]->(ch:ItemChunk) "
            "WHERE ch.item = $item "
            "RETURN ch.chunk_id AS chunk_id, ch.char_start AS start, ch.char_end AS end, ch.text AS text "
            "ORDER BY ch.chunk_id ASC"
        ),
        "required_params": {"ticker", "year", "item"},
    },
}


class DisallowedCypherError(ValueError):
    """Raised when an unauthorized or ad-hoc dynamic Cypher query is attempted."""
    pass


def get_template(template_name: CypherTemplate, params: Dict[str, Any]) -> str:
    """Retrieve and validate a parameterized Cypher template from the allowlist.

    Args:
        template_name: Approved CypherTemplate Enum key.
        params: Dictionary of parameters required by the template.

    Returns:
        The validated Cypher query string.

    Raises:
        DisallowedCypherError: If template_name is not in the allowlist.
        ValueError: If required parameters are missing.
    """
    if not isinstance(template_name, CypherTemplate):
        raise DisallowedCypherError(
            f"FORBIDDEN: '{template_name}' is not in the approved CypherTemplate allowlist. "
            "Model-authored dynamic Cypher is strictly banned."
        )

    meta = _TEMPLATE_REGISTRY[template_name]
    missing = meta["required_params"] - set(params.keys())
    if missing:
        raise ValueError(
            f"Missing required parameters for {template_name.value}: {missing}"
        )

    return meta["cypher"]
