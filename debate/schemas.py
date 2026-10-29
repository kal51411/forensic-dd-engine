"""Pydantic schemas for multi-agent adversarial forensic debate committee."""

from enum import Enum
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from retrieval.models import Citation


class AgentRole(str, Enum):
    BULL = "BULL"
    BEAR = "BEAR"
    FACT_CHECKER = "FACT_CHECKER"
    JUDGE = "JUDGE"


class DebateTurn(BaseModel):
    """A structured argument turn submitted by an agent."""
    speaker: AgentRole
    thesis: str
    argument: str
    quantitative_claims: Dict[str, float] = Field(
        default_factory=dict,
        description="Quantitative figures cited; must match deterministic quant bundle",
    )
    citations: List[Citation] = Field(default_factory=list)


class FactCheckVerdict(BaseModel):
    """Verification output from the FactChecker agent."""
    all_quant_claims_verified: bool
    all_citations_verified: bool
    verified_citations: List[Citation] = []
    discrepancies: List[str] = []
    hallucinated_citations: List[str] = []


class JudgeVerdict(BaseModel):
    """Final synthesis and binding audit verdict produced by the Judge."""
    audit_id: str
    ticker: str
    fiscal_year: int
    composite_verdict: str = Field(
        ...,
        description="'CRITICAL_RED_FLAG' | 'ELEVATED_RISK' | 'CLEAN_AUDIT'",
    )
    confidence_score: float = Field(..., ge=0.0, le=1.0)
    executive_summary: str
    agreed_facts: List[str]
    disputed_theses: List[str]
    quant_red_flag_count: int
    validated_citations: List[Citation]
    human_review_required: bool = False
