"""Item-level filing chunker with character-span provenance tracking."""

import re
from typing import List, Dict
from ingest.models import FilingChunk


def sanitize_item_key(item_name: str) -> str:
    """Normalize item names for deterministic chunk IDs."""
    clean = re.sub(r"[^a-zA-Z0-9]", "_", item_name.strip().lower())
    return re.sub(r"_+", "_", clean).strip("_")


def chunk_filing_item(
    ticker: str,
    accession_number: str,
    fiscal_year: int,
    item_name: str,
    item_text: str,
    chunk_size: int = 1500,
    overlap: int = 200,
    filing_type: str = "10-K",
    fiscal_period: str = "FY",
) -> List[FilingChunk]:
    """Chunk a specific item of an SEC filing preserving exact character spans.

    Args:
        ticker: Stock symbol (e.g. AAPL)
        accession_number: SEC EDGAR accession number (e.g. 0000320193-23-000106)
        fiscal_year: Fiscal year (e.g. 2023)
        item_name: Section name (e.g. 'Item 7 - MD&A')
        item_text: Full raw text of this section
        chunk_size: Target characters per chunk
        overlap: Character overlap between contiguous chunks
        filing_type: 10-K or 10-Q
        fiscal_period: FY or Q1/Q2/Q3

    Returns:
        List of FilingChunk models with verified character offsets.
    """
    chunks: List[FilingChunk] = []
    text_len = len(item_text)
    item_key = sanitize_item_key(item_name)

    if text_len == 0:
        return chunks

    # Handle short texts that fit in one chunk
    if text_len <= chunk_size:
        cid = f"{ticker.upper()}_{accession_number}_{item_key}_000"
        return [
            FilingChunk(
                chunk_id=cid,
                ticker=ticker.upper(),
                accession_number=accession_number,
                filing_type=filing_type,
                fiscal_year=fiscal_year,
                fiscal_period=fiscal_period,
                item=item_name,
                text=item_text,
                char_start=0,
                char_end=text_len,
                tokens=max(1, len(item_text.split())),
            )
        ]

    start = 0
    seq = 0
    while start < text_len:
        end = min(start + chunk_size, text_len)

        # Snap to sentence or whitespace boundaries if not at EOF
        if end < text_len:
            boundary = item_text.rfind(". ", start + chunk_size // 2, end)
            if boundary != -1:
                end = boundary + 1  # include the period
            else:
                space_boundary = item_text.rfind(" ", start + chunk_size // 2, end)
                if space_boundary != -1:
                    end = space_boundary

        chunk_text = item_text[start:end]
        cid = f"{ticker.upper()}_{accession_number}_{item_key}_{seq:03d}"

        chunks.append(
            FilingChunk(
                chunk_id=cid,
                ticker=ticker.upper(),
                accession_number=accession_number,
                filing_type=filing_type,
                fiscal_year=fiscal_year,
                fiscal_period=fiscal_period,
                item=item_name,
                text=chunk_text,
                char_start=start,
                char_end=end,
                tokens=max(1, len(chunk_text.split())),
            )
        )

        seq += 1
        if end >= text_len:
            break
        start = max(end - overlap, start + 1)

    return chunks
