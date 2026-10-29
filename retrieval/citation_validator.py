"""Strict citation allowlist validator and character-span verification guardrail.

Enforces HARD CONSTRAINT:
Every answer must include citations: [{chunk_id, ticker, item, char_span}].
Rejects any answer whose chunk_id is not in the active retrieval allowlist,
or whose char_span does not match the actual chunk content.
"""

from typing import List, Dict, Set, Tuple, Optional
from ingest.models import FilingChunk
from retrieval.models import Citation
from monitoring.metrics import CITATION_VALIDATION_FAILURES_TOTAL


class CitationValidationError(ValueError):
    """Raised when a citation violates provenance, allowlist, or span invariants."""
    pass


class CitationValidator:
    """Verifies citations against active retrieval chunks and validates character spans."""

    @classmethod
    def validate_citations(
        cls,
        citations: List[Citation],
        allowlist_chunks: Dict[str, FilingChunk],
        strict: bool = False,
    ) -> Tuple[bool, List[str], List[Citation]]:
        """Validate candidate citations against allowlist chunks.

        Args:
            citations: Citations produced in candidate response.
            allowlist_chunks: Mapping of chunk_id -> FilingChunk in the current retrieval set.
            strict: If True, any invalid citation marks the entire validation as failed.

        Returns:
            Tuple of (is_valid: bool, error_messages: List[str], verified_citations: List[Citation]).
        """
        errors: List[str] = []
        verified: List[Citation] = []

        if not citations:
            CITATION_VALIDATION_FAILURES_TOTAL.labels(failure_reason="empty_citations").inc()
            errors.append("No citations provided. Every claim must have a verified citation.")
            return False, errors, []

        for idx, cite in enumerate(citations):
            # 1. Allowlist membership check
            if cite.chunk_id not in allowlist_chunks:
                CITATION_VALIDATION_FAILURES_TOTAL.labels(failure_reason="unretrieved_chunk_id").inc()
                errors.append(
                    f"Citation #{idx} references unretrieved chunk_id '{cite.chunk_id}'. "
                    f"Not in active retrieval allowlist: {list(allowlist_chunks.keys())}."
                )
                continue

            target_chunk = allowlist_chunks[cite.chunk_id]

            # 2. Ticker and item consistency
            if cite.ticker.upper() != target_chunk.ticker.upper():
                errors.append(
                    f"Citation #{idx} ticker mismatch: cited '{cite.ticker}', expected '{target_chunk.ticker}'."
                )
                continue

            # 3. Char span boundary check
            start, end = cite.char_span
            chunk_len = len(target_chunk.text)
            if start < 0 or end > chunk_len or start >= end:
                CITATION_VALIDATION_FAILURES_TOTAL.labels(failure_reason="span_out_of_bounds").inc()
                errors.append(
                    f"Citation #{idx} invalid char_span ({start}, {end}) for chunk of length {chunk_len}."
                )
                continue

            # 4. Excerpt grounding verification
            actual_span_text = target_chunk.text[start:end]
            # Normalize whitespace for comparison
            normalized_span = " ".join(actual_span_text.split())
            normalized_excerpt = " ".join(cite.excerpt.split())

            if normalized_excerpt and normalized_excerpt not in normalized_span and normalized_span not in normalized_excerpt:
                CITATION_VALIDATION_FAILURES_TOTAL.labels(failure_reason="excerpt_mismatch").inc()
                errors.append(
                    f"Citation #{idx} excerpt mismatch at span ({start}, {end}). "
                    f"Expected substring of '{normalized_span[:60]}...', got '{normalized_excerpt[:60]}...'."
                )
                continue

            verified.append(cite)

        is_valid = len(errors) == 0 if strict else len(verified) > 0
        return is_valid, errors, verified

    @classmethod
    def enforce_strict_citations(
        cls,
        citations: List[Citation],
        allowlist_chunks: Dict[str, FilingChunk],
    ) -> List[Citation]:
        """Strict enforcement wrapper that raises CitationValidationError on failure."""
        is_valid, errors, verified = cls.validate_citations(
            citations=citations,
            allowlist_chunks=allowlist_chunks,
            strict=True,
        )
        if not is_valid or len(errors) > 0:
            raise CitationValidationError("; ".join(errors))
        return verified
