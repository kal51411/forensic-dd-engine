"""Unit tests for hybrid retrieval and the citation allowlist guardrail."""

import pytest
from ingest.models import FilingChunk
from graph.store import ForensicGraphStore
from graph.schema import NodeLabel, RelType
from retrieval.vector_store import FilingVectorStore
from retrieval.citation_validator import (
    CitationValidator,
    CitationValidationError,
)
from retrieval.models import Citation
from retrieval.router import HybridRouter


@pytest.fixture
def sample_chunks():
    c1 = FilingChunk(
        chunk_id="AAPL_0000320193-23-000106_item_7_000",
        ticker="AAPL",
        accession_number="0000320193-23-000106",
        fiscal_year=2023,
        item="Item 7",
        text="Total net sales decreased 3% during fiscal year 2023 compared to fiscal 2022.",
        char_start=0,
        char_end=77,
        tokens=12,
    )
    c2 = FilingChunk(
        chunk_id="AAPL_0000320193-23-000106_item_8_001",
        ticker="AAPL",
        accession_number="0000320193-23-000106",
        fiscal_year=2023,
        item="Item 8 - Note 3",
        text="Commercial paper debt outstanding was $5,980 million as of September 30, 2023.",
        char_start=0,
        char_end=79,
        tokens=13,
    )
    return [c1, c2]


def test_vector_store_indexing_and_search(sample_chunks):
    store = FilingVectorStore()
    store.add_chunks(sample_chunks)

    # Search for net sales
    results = store.search("net sales decreased", top_k=2)
    assert len(results) > 0
    assert results[0].chunk_id == "AAPL_0000320193-23-000106_item_7_000"

    # Search with ticker filter
    assert len(store.search("commercial paper", ticker_filter="MSFT")) == 0
    assert len(store.search("commercial paper", ticker_filter="AAPL")) == 1


def test_citation_validator_valid_citation(sample_chunks):
    allowlist = {c.chunk_id: c for c in sample_chunks}

    valid_cite = Citation(
        chunk_id="AAPL_0000320193-23-000106_item_7_000",
        ticker="AAPL",
        item="Item 7",
        char_span=(0, 31),
        excerpt="Total net sales decreased 3%",
    )

    is_valid, errors, verified = CitationValidator.validate_citations([valid_cite], allowlist, strict=True)
    assert is_valid
    assert len(errors) == 0
    assert len(verified) == 1


def test_citation_validator_unretrieved_chunk_rejected(sample_chunks):
    """HARD CONSTRAINT: Reject any answer whose chunk_id is not in the retrieval allowlist."""
    allowlist = {c.chunk_id: c for c in sample_chunks}

    hallucinated_cite = Citation(
        chunk_id="AAPL_HALLUCINATED_CHUNK_999",
        ticker="AAPL",
        item="Item 7",
        char_span=(0, 20),
        excerpt="Some fake excerpt",
    )

    is_valid, errors, verified = CitationValidator.validate_citations([hallucinated_cite], allowlist)
    assert not is_valid
    assert len(verified) == 0
    assert any("unretrieved chunk_id" in err for err in errors)

    # Strict mode raises error
    with pytest.raises(CitationValidationError):
        CitationValidator.enforce_strict_citations([hallucinated_cite], allowlist)


def test_citation_validator_ticker_mismatch(sample_chunks):
    allowlist = {c.chunk_id: c for c in sample_chunks}

    cite = Citation(
        chunk_id="AAPL_0000320193-23-000106_item_7_000",
        ticker="MSFT",  # mismatch
        item="Item 7",
        char_span=(0, 20),
        excerpt="Total net sales",
    )

    is_valid, errors, verified = CitationValidator.validate_citations([cite], allowlist)
    assert not is_valid
    assert any("ticker mismatch" in err for err in errors)


def test_citation_validator_invalid_char_span(sample_chunks):
    allowlist = {c.chunk_id: c for c in sample_chunks}

    # Out of bounds span
    cite_oob = Citation(
        chunk_id="AAPL_0000320193-23-000106_item_7_000",
        ticker="AAPL",
        item="Item 7",
        char_span=(0, 5000),  # exceeds chunk length
        excerpt="Total net sales",
    )
    is_valid, errors, _ = CitationValidator.validate_citations([cite_oob], allowlist)
    assert not is_valid
    assert any("invalid char_span" in err for err in errors)

    # Inverted span
    cite_inv = Citation(
        chunk_id="AAPL_0000320193-23-000106_item_7_000",
        ticker="AAPL",
        item="Item 7",
        char_span=(20, 10),
        excerpt="Total",
    )
    is_valid, errors, _ = CitationValidator.validate_citations([cite_inv], allowlist)
    assert not is_valid


def test_citation_validator_excerpt_mismatch(sample_chunks):
    allowlist = {c.chunk_id: c for c in sample_chunks}

    # Span (0, 31) is "Total net sales decreased 3%", but excerpt is different
    cite = Citation(
        chunk_id="AAPL_0000320193-23-000106_item_7_000",
        ticker="AAPL",
        item="Item 7",
        char_span=(0, 31),
        excerpt="Completely different hallucinated claim",
    )
    is_valid, errors, _ = CitationValidator.validate_citations([cite], allowlist)
    assert not is_valid
    assert any("excerpt mismatch" in err for err in errors)


def test_citation_validator_empty():
    is_valid, errors, verified = CitationValidator.validate_citations([], {})
    assert not is_valid
    assert len(verified) == 0


def test_hybrid_router_flow(sample_chunks):
    v_store = FilingVectorStore()
    v_store.add_chunks(sample_chunks)

    g_store = ForensicGraphStore()
    g_store.add_node(NodeLabel.COMPANY, "comp_aapl", {"ticker": "AAPL", "name": "Apple Inc."})
    g_store.add_node(
        NodeLabel.FILING,
        "filing_2023",
        {"accession_number": "0000320193-23-000106", "fiscal_year": 2023, "form_type": "10-K", "ticker": "AAPL"},
    )
    g_store.add_node(
        NodeLabel.AUDITOR,
        "auditor_ey",
        {"name": "Ernst & Young LLP", "opinion": "Clean", "is_adverse_opinion": False},
    )
    g_store.add_relationship(RelType.FILED, "comp_aapl", "filing_2023")
    g_store.add_relationship(RelType.AUDITED_BY, "filing_2023", "auditor_ey")

    router = HybridRouter(vector_store=v_store, graph_store=g_store)

    # 1. Graph question
    b_graph = router.retrieve("What is the auditor opinion history?", ticker="AAPL")
    assert b_graph.route in ("graph", "both")
    assert len(b_graph.graph_facts) > 0

    # 2. Vector question
    b_vec = router.retrieve("disclose commercial paper debt risk", ticker="AAPL")
    assert b_vec.route in ("vector", "both")
    assert len(b_vec.chunks) > 0
    assert "AAPL_0000320193-23-000106_item_8_001" in b_vec.allowlist_chunk_ids
