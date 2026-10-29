"""Data models for hybrid retrieval, router bundles, and verified citations."""

from typing import List, Dict, Any, Tuple, Set
from pydantic import BaseModel, Field
from ingest.models import FilingChunk


class Citation(BaseModel):
    """Verified citation pointing to an exact character span in an SEC filing chunk."""
    chunk_id: str = Field(..., description="Unique ID of the cited chunk")
    ticker: str
    item: str
    char_span: Tuple[int, int] = Field(..., description="(start_char, end_char) in the chunk text")
    excerpt: str = Field(..., description="Verbatim text excerpt extracted from the span")


class RetrievalBundle(BaseModel):
    """Result of hybrid routing containing retrieved chunks and active citation allowlist."""
    query: str
    route: str  # "graph" | "vector" | "both"
    chunks: List[FilingChunk] = []
    graph_facts: List[Dict[str, Any]] = []
    allowlist_chunk_ids: List[str] = Field(
        default_factory=list,
        description="Strict set of chunk IDs permitted to be cited by downstream LLMs",
    )
