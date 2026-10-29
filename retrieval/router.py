from typing import List, Dict, Any, Optional
import time
from ingest.models import FilingChunk
from graph.store import ForensicGraphStore
from graph.cypher_registry import CypherTemplate
from retrieval.vector_store import FilingVectorStore
from retrieval.models import RetrievalBundle
from monitoring.metrics import RETRIEVAL_LATENCY_SECONDS


class HybridRouter:
    """Routes forensic questions across deterministic Graph and Vector stores."""

    GRAPH_KEYWORDS = {
        "trend", "history", "time-series", "auditor", "opinion",
        "officer", "cfo", "ceo", "board", "year over year",
        "metric", "ratio", "score", "beneish", "altman", "sloan"
    }

    VECTOR_KEYWORDS = {
        "risk", "disclosure", "note", "footnote", "litigation",
        "investigation", "weakness", "internal control", "inventory",
        "revenue recognition", "related party", "commentary", "covenant",
        "threshold", "zone", "headroom", "operating cash flow", "sales"
    }

    def __init__(self, vector_store: FilingVectorStore, graph_store: ForensicGraphStore):
        self.vector_store = vector_store
        self.graph_store = graph_store

    def classify_route(self, query: str) -> str:
        """Classify question into 'graph', 'vector', or 'both'."""
        q_lower = query.lower()
        has_graph = any(kw in q_lower for kw in self.GRAPH_KEYWORDS)
        has_vector = any(kw in q_lower for kw in self.VECTOR_KEYWORDS)
        has_multihop = any(kw in q_lower for kw in ["how", "why", "trace", "link", "contribute", "assess", "evaluate", "cross-reference"])

        if (has_graph and has_vector) or has_multihop:
            return "both"
        elif has_graph:
            return "graph"
        elif has_vector:
            return "vector"
        else:
            return "both"  # Default to hybrid for thorough forensic coverage

    def retrieve(
        self,
        query: str,
        ticker: str,
        top_k: int = 5,
        year: Optional[int] = None,
    ) -> RetrievalBundle:
        """Execute hybrid retrieval and assemble the active citation allowlist."""
        t_start = time.perf_counter()
        route = self.classify_route(query)
        chunks: List[FilingChunk] = []
        graph_facts: List[Dict[str, Any]] = []

        # 1. Vector Retrieval
        if route in ("vector", "both"):
            t_vec_start = time.perf_counter()
            chunks = self.vector_store.search(query, top_k=top_k, ticker_filter=ticker)
            RETRIEVAL_LATENCY_SECONDS.labels(tier="vector").observe(time.perf_counter() - t_vec_start)

        # 2. Graph Retrieval via pre-compiled templates
        if route in ("graph", "both"):
            t_graph_start = time.perf_counter()
            q_lower = query.lower()
            if "audit" in q_lower:
                graph_facts = self.graph_store.execute_template(
                    CypherTemplate.GET_AUDITOR_OPINION_HISTORY,
                    {"ticker": ticker},
                )
            elif "officer" in q_lower or "cfo" in q_lower or "ceo" in q_lower:
                graph_facts = self.graph_store.execute_template(
                    CypherTemplate.GET_OFFICER_CHANGES,
                    {"ticker": ticker},
                )
            elif "filing" in q_lower:
                graph_facts = self.graph_store.execute_template(
                    CypherTemplate.GET_COMPANY_FILINGS,
                    {"ticker": ticker},
                )
            else:
                metric_name = "Beneish_M_Score"
                if "altman" in q_lower:
                    metric_name = "Altman_Z_Score"
                elif "sloan" in q_lower or "accrual" in q_lower:
                    metric_name = "Sloan_Accrual_Ratio"

                graph_facts = self.graph_store.execute_template(
                    CypherTemplate.GET_METRIC_TIME_SERIES,
                    {
                        "ticker": ticker,
                        "metric_name": metric_name,
                        "start_year": year - 3 if year else 2020,
                        "end_year": year if year else 2023,
                    },
                )
            RETRIEVAL_LATENCY_SECONDS.labels(tier="graph").observe(time.perf_counter() - t_graph_start)

        # Record total hybrid route latency
        RETRIEVAL_LATENCY_SECONDS.labels(tier=route).observe(time.perf_counter() - t_start)

        # Build active allowlist containing all retrieved chunk IDs
        allowlist_ids = [c.chunk_id for c in chunks]

        return RetrievalBundle(
            query=query,
            route=route,
            chunks=chunks,
            graph_facts=graph_facts,
            allowlist_chunk_ids=allowlist_ids,
        )
