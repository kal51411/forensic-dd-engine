"""Graph store implementation supporting both in-memory evaluation and Neo4j."""

from typing import Dict, Any, List
from graph.cypher_registry import CypherTemplate, get_template, DisallowedCypherError
from graph.schema import NodeLabel, RelType


class ForensicGraphStore:
    """Forensic knowledge graph engine with enforced Cypher template allowlist."""

    def __init__(self):
        # In-memory graph representation
        self.nodes: Dict[str, Dict[str, Any]] = {}
        self.relationships: List[Dict[str, Any]] = []

    def add_node(self, label: NodeLabel, node_id: str, properties: Dict[str, Any]) -> None:
        """Add a typed node to the knowledge graph."""
        self.nodes[node_id] = {
            "label": label.value,
            "id": node_id,
            **properties,
        }

    def add_relationship(
        self,
        rel_type: RelType,
        source_id: str,
        target_id: str,
        properties: Dict[str, Any] = None,
    ) -> None:
        """Add a typed directed relationship between two nodes."""
        if source_id not in self.nodes or target_id not in self.nodes:
            raise KeyError(f"Both nodes must exist: {source_id} -> {target_id}")
        self.relationships.append(
            {
                "type": rel_type.value,
                "source": source_id,
                "target": target_id,
                "properties": properties or {},
            }
        )

    def execute_template(
        self,
        template: CypherTemplate,
        params: Dict[str, Any],
    ) -> List[Dict[str, Any]]:
        """Execute an approved Cypher template against the graph with strict validation.

        Args:
            template: Approved CypherTemplate Enum.
            params: Parameters matching the template requirements.

        Returns:
            List of matching records.
        """
        # Validate template & params via registry
        cypher_query = get_template(template, params)

        # Deterministic in-memory graph resolution matching the Cypher semantics
        results: List[Dict[str, Any]] = []

        if template == CypherTemplate.GET_COMPANY_FILINGS:
            ticker = params["ticker"].upper()
            for rel in self.relationships:
                if rel["type"] == RelType.FILED.value:
                    src = self.nodes.get(rel["source"], {})
                    tgt = self.nodes.get(rel["target"], {})
                    if src.get("ticker", "").upper() == ticker and tgt.get("label") == NodeLabel.FILING.value:
                        results.append(
                            {
                                "accession": tgt.get("accession_number"),
                                "year": tgt.get("fiscal_year"),
                                "form": tgt.get("form_type"),
                            }
                        )
            results.sort(key=lambda x: x["year"], reverse=True)

        elif template == CypherTemplate.GET_METRIC_TIME_SERIES:
            ticker = params["ticker"].upper()
            metric_name = params["metric_name"]
            start_year = params["start_year"]
            end_year = params["end_year"]

            for rel in self.relationships:
                if rel["type"] == RelType.HAS_METRIC.value:
                    src = self.nodes.get(rel["source"], {})
                    tgt = self.nodes.get(rel["target"], {})
                    if (
                        src.get("ticker", "").upper() == ticker
                        and tgt.get("name") == metric_name
                        and start_year <= tgt.get("year", 0) <= end_year
                    ):
                        results.append(
                            {
                                "year": tgt.get("year"),
                                "value": tgt.get("value"),
                                "red_flag": tgt.get("is_red_flag", False),
                            }
                        )
            results.sort(key=lambda x: x["year"])

        elif template == CypherTemplate.GET_AUDITOR_OPINION_HISTORY:
            ticker = params["ticker"].upper()
            for rel in self.relationships:
                if rel["type"] == RelType.AUDITED_BY.value:
                    filing = self.nodes.get(rel["source"], {})
                    auditor = self.nodes.get(rel["target"], {})
                    if filing.get("ticker", "").upper() == ticker:
                        results.append(
                            {
                                "year": filing.get("fiscal_year"),
                                "auditor": auditor.get("name"),
                                "opinion": auditor.get("opinion"),
                                "adverse": auditor.get("is_adverse_opinion", False),
                            }
                        )
            results.sort(key=lambda x: x["year"], reverse=True)

        elif template == CypherTemplate.GET_OFFICER_CHANGES:
            ticker = params["ticker"].upper()
            for rel in self.relationships:
                if rel["type"] == RelType.HAS_OFFICER.value:
                    src = self.nodes.get(rel["source"], {})
                    tgt = self.nodes.get(rel["target"], {})
                    if src.get("ticker", "").upper() == ticker:
                        results.append(
                            {
                                "name": tgt.get("name"),
                                "title": tgt.get("title"),
                                "tenure": tgt.get("tenure_years"),
                            }
                        )

        elif template == CypherTemplate.GET_RELATED_RISKS:
            ticker = params["ticker"].upper()
            topic = params["topic"].lower()
            for rel in self.relationships:
                if rel["type"] == RelType.DISCLOSES_RISK.value:
                    chunk = self.nodes.get(rel["source"], {})
                    risk = self.nodes.get(rel["target"], {})
                    if (
                        chunk.get("ticker", "").upper() == ticker
                        and topic in risk.get("topic", "").lower()
                    ):
                        results.append(
                            {
                                "chunk_id": chunk.get("chunk_id"),
                                "topic": risk.get("topic"),
                                "severity": risk.get("severity"),
                            }
                        )

        elif template == CypherTemplate.GET_ITEM_CHUNKS_FOR_FILING:
            ticker = params["ticker"].upper()
            year = params["year"]
            item = params["item"].lower()
            for rel in self.relationships:
                if rel["type"] == RelType.HAS_ITEM.value:
                    filing = self.nodes.get(rel["source"], {})
                    chunk = self.nodes.get(rel["target"], {})
                    if (
                        filing.get("ticker", "").upper() == ticker
                        and filing.get("fiscal_year") == year
                        and item in chunk.get("item", "").lower()
                    ):
                        results.append(
                            {
                                "chunk_id": chunk.get("chunk_id"),
                                "start": chunk.get("char_start"),
                                "end": chunk.get("char_end"),
                                "text": chunk.get("text"),
                            }
                        )

        return results
