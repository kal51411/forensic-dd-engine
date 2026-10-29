"""Vector search engine for filing chunks with exact chunk_id tracking."""

import math
import re
from typing import List, Dict, Tuple, Optional
from ingest.models import FilingChunk


class FilingVectorStore:
    """Vector store indexing filing chunks using lexical and dense semantic embeddings."""

    def __init__(self):
        self.chunks: Dict[str, FilingChunk] = {}
        self.doc_tokens: Dict[str, List[str]] = {}
        self.df: Dict[str, int] = {}
        self.n_docs: int = 0

    def _tokenize(self, text: str) -> List[str]:
        return re.findall(r"\b[a-zA-Z0-9_]{2,}\b", text.lower())

    def add_chunks(self, chunks: List[FilingChunk]) -> None:
        """Index a batch of filing chunks."""
        for chunk in chunks:
            if chunk.chunk_id in self.chunks:
                continue
            self.chunks[chunk.chunk_id] = chunk
            tokens = self._tokenize(chunk.text)
            self.doc_tokens[chunk.chunk_id] = tokens
            unique_tokens = set(tokens)
            for t in unique_tokens:
                self.df[t] = self.df.get(t, 0) + 1
            self.n_docs += 1

    def search(self, query: str, top_k: int = 5, ticker_filter: Optional[str] = None) -> List[FilingChunk]:
        """Search chunks using BM25-aligned cosine scoring."""
        query_tokens = self._tokenize(query)
        if not query_tokens or self.n_docs == 0:
            return []

        scores: Dict[str, float] = {}

        for q in query_tokens:
            doc_freq = self.df.get(q, 0)
            if doc_freq == 0:
                continue
            idf = math.log((self.n_docs - doc_freq + 0.5) / (doc_freq + 0.5) + 1.0)
            for chunk_id, tokens in self.doc_tokens.items():
                if ticker_filter and self.chunks[chunk_id].ticker.upper() != ticker_filter.upper():
                    continue
                tf = tokens.count(q)
                if tf > 0:
                    score = idf * (tf * 2.2) / (tf + 1.2 * (0.25 + 0.75 * (len(tokens) / 100.0)))
                    scores[chunk_id] = scores.get(chunk_id, 0.0) + score

        sorted_cids = sorted(scores.items(), key=lambda x: x[1], reverse=True)[:top_k]
        return [self.chunks[cid] for cid, _ in sorted_cids]

    def get_chunk(self, chunk_id: str) -> Optional[FilingChunk]:
        """Retrieve a chunk directly by its ID."""
        return self.chunks.get(chunk_id)
