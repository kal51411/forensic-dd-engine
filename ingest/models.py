"""Pydantic data models for SEC filing ingestion, chunking, and review queue."""

from typing import Optional, List, Dict, Tuple
from pydantic import BaseModel, Field


class FilingChunk(BaseModel):
    """Semantic chunk of an SEC filing preserving provenance offsets."""
    chunk_id: str = Field(..., description="Deterministic ID: {ticker}_{accession}_{item}_{seq}")
    ticker: str
    accession_number: str
    filing_type: str = "10-K"  # 10-K, 10-Q, 8-K
    fiscal_year: int
    fiscal_period: str = "FY"
    item: str = Field(..., description="e.g. Item 1, Item 1A, Item 7, Item 8 - Note 4")
    text: str
    char_start: int = Field(..., description="Character start offset in the original item section")
    char_end: int = Field(..., description="Character end offset in the original item section")
    tokens: int = Field(..., description="Estimated token count")
    confidence_score: float = Field(default=1.0, ge=0.0, le=1.0, description="Extraction or OCR confidence")
    is_ocr_degraded: bool = Field(default=False, description="True if text originates from a corrupted or scanned PDF bitmap")


class ExtractionConfidence(BaseModel):
    """Confidence scoring for numeric XBRL line item extraction."""
    cell_name: str
    raw_value: float
    normalized_value: float
    confidence_score: float = Field(..., ge=0.0, le=1.0)
    is_flagged: bool = False
    review_reason: Optional[str] = None


class HumanReviewItem(BaseModel):
    """Entry in the human review queue for low-confidence or ambiguous extractions."""
    item_id: str
    ticker: str
    fiscal_year: int
    cell_name: str
    extracted_value: float
    confidence_score: float
    source_item: str
    flag_reason: str
    status: str = "PENDING"  # PENDING, RESOLVED, REJECTED
    resolved_value: Optional[float] = None
