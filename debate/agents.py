"""Debate committee agents: Bear, Bull, FactChecker, and Judge."""

from typing import List, Dict, Any, Tuple
from quant.models import QuantAuditBundle
from ingest.models import FilingChunk
from retrieval.models import Citation
from retrieval.citation_validator import CitationValidator
from debate.schemas import (
    AgentRole,
    DebateTurn,
    FactCheckVerdict,
    JudgeVerdict,
)


class BearAgent:
    """Forensic short-seller agent hunting for accounting red flags and solvency distress."""

    @classmethod
    def argue(
        cls,
        quant_bundle: QuantAuditBundle,
        retrieved_chunks: List[FilingChunk],
    ) -> DebateTurn:
        claims: Dict[str, float] = {
            "Beneish_M_Score": quant_bundle.beneish.m_score,
            "Sloan_Accrual_Ratio": quant_bundle.sloan.accrual_ratio,
            "Altman_Z_Score": quant_bundle.altman.z_score,
        }

        citations: List[Citation] = []
        if retrieved_chunks:
            chunk = retrieved_chunks[0]
            excerpt_len = min(60, len(chunk.text))
            citations.append(
                Citation(
                    chunk_id=chunk.chunk_id,
                    ticker=chunk.ticker,
                    item=chunk.item,
                    char_span=(0, excerpt_len),
                    excerpt=chunk.text[:excerpt_len],
                )
            )

        if quant_bundle.red_flag_count >= 2:
            thesis = "High likelihood of earnings manipulation and severe structural debt distress."
            argument = (
                f"Bear thesis: {quant_bundle.ticker} exhibits {quant_bundle.red_flag_count} red flags. "
                f"Beneish M-Score of {quant_bundle.beneish.m_score:.2f} signals manipulation. "
                f"Sloan accrual ratio ({quant_bundle.sloan.accrual_ratio:.1%}) demonstrates cash-earnings decoupling."
            )
        else:
            thesis = "Routine financial posture, though monitoring receivables and working capital is advised."
            argument = (
                f"Bear thesis: While {quant_bundle.ticker} passes primary screens, "
                f"leverage headroom stands at {quant_bundle.covenants.leverage_headroom_turns:.2f} turns."
            )

        return DebateTurn(
            speaker=AgentRole.BEAR,
            thesis=thesis,
            argument=argument,
            quantitative_claims=claims,
            citations=citations,
        )


class BullAgent:
    """Long-side analyst seeking business model resiliency and management explanations."""

    @classmethod
    def argue(
        cls,
        quant_bundle: QuantAuditBundle,
        retrieved_chunks: List[FilingChunk],
        bear_turn: DebateTurn,
    ) -> DebateTurn:
        claims: Dict[str, float] = {
            "Adjusted_EBITDA": quant_bundle.ebitda_bridge.adjusted_ebitda,
            "Interest_Coverage": quant_bundle.covenants.interest_coverage,
        }

        citations: List[Citation] = []
        target_chunk = retrieved_chunks[-1] if retrieved_chunks else None
        if target_chunk:
            excerpt_len = min(50, len(target_chunk.text))
            citations.append(
                Citation(
                    chunk_id=target_chunk.chunk_id,
                    ticker=target_chunk.ticker,
                    item=target_chunk.item,
                    char_span=(0, excerpt_len),
                    excerpt=target_chunk.text[:excerpt_len],
                )
            )

        if quant_bundle.altman.z_score >= 2.99:
            thesis = "Robust solvency buffer and resilient core operating cash generation."
            argument = (
                f"Bull thesis: Altman Z-score ({quant_bundle.altman.z_score:.2f}) sits safely in the safe zone. "
                f"Adjusted EBITDA of ${quant_bundle.ebitda_bridge.adjusted_ebitda:,.0f} supports interest coverage "
                f"of {quant_bundle.covenants.interest_coverage:.2f}x."
            )
        else:
            thesis = "Turnaround underway with restructuring investments poised to stabilize margins."
            argument = (
                f"Bull thesis: Near-term pressure is explained by planned capital expenditures and restructuring, "
                f"with covenant compliance status currently rated as {quant_bundle.covenants.overall_covenant_status}."
            )

        return DebateTurn(
            speaker=AgentRole.BULL,
            thesis=thesis,
            argument=argument,
            quantitative_claims=claims,
            citations=citations,
        )


class FactCheckerAgent:
    """Rigorous gatekeeper validating mathematical provenance and citation grounding."""

    @classmethod
    def verify_turn(
        cls,
        turn: DebateTurn,
        quant_bundle: QuantAuditBundle,
        allowlist_chunks: Dict[str, FilingChunk],
    ) -> FactCheckVerdict:
        discrepancies: List[str] = []

        # 1. Zero-Arithmetic mathematical verification
        known_quant_values = {
            "Beneish_M_Score": quant_bundle.beneish.m_score,
            "Sloan_Accrual_Ratio": quant_bundle.sloan.accrual_ratio,
            "Altman_Z_Score": quant_bundle.altman.z_score,
            "Adjusted_EBITDA": quant_bundle.ebitda_bridge.adjusted_ebitda,
            "Interest_Coverage": quant_bundle.covenants.interest_coverage,
        }

        for claim_key, claim_val in turn.quantitative_claims.items():
            if claim_key in known_quant_values:
                expected = known_quant_values[claim_key]
                if abs(claim_val - expected) > 0.01:
                    discrepancies.append(
                        f"Mathematical discrepancy on '{claim_key}': claimed {claim_val}, verified {expected}."
                    )

        # 2. Citation verification against active allowlist
        is_valid, cite_errors, verified_cites = CitationValidator.validate_citations(
            citations=turn.citations,
            allowlist_chunks=allowlist_chunks,
        )

        return FactCheckVerdict(
            all_quant_claims_verified=len(discrepancies) == 0,
            all_citations_verified=is_valid,
            verified_citations=verified_cites,
            discrepancies=discrepancies,
            hallucinated_citations=cite_errors,
        )


class JudgeAgent:
    """Impartial senior judicial auditor delivering the final binding audit verdict."""

    @classmethod
    def deliberate(
        cls,
        audit_id: str,
        ticker: str,
        fiscal_year: int,
        quant_bundle: QuantAuditBundle,
        bear_turn: DebateTurn,
        bull_turn: DebateTurn,
        bear_fc: FactCheckVerdict,
        bull_fc: FactCheckVerdict,
    ) -> JudgeVerdict:
        all_verified_cites = bear_fc.verified_citations + bull_fc.verified_citations

        # Deduplicate citations by (chunk_id, char_span)
        seen_keys = set()
        deduped_cites: List[Citation] = []
        for c in all_verified_cites:
            key = (c.chunk_id, c.char_span)
            if key not in seen_keys:
                deduped_cites.append(c)
                seen_keys.add(key)

        agreed_facts = [
            f"Beneish M-Score: {quant_bundle.beneish.m_score:.2f} ({quant_bundle.beneish.interpretation[:45]}...)",
            f"Sloan Accruals: {quant_bundle.sloan.accrual_ratio:.1%} ({quant_bundle.sloan.percentile_bucket})",
            f"Altman Z-Score: {quant_bundle.altman.z_score:.2f} ({quant_bundle.altman.zone})",
            f"Debt Covenant Compliance: {quant_bundle.covenants.overall_covenant_status}",
        ]

        disputed_theses = [
            f"Bear stance: {bear_turn.thesis}",
            f"Bull stance: {bull_turn.thesis}",
        ]

        if quant_bundle.audit_verdict == "HIGH_RISK":
            composite = "CRITICAL_RED_FLAG"
            conf = 0.96
            summary = (
                f"Audit failed for {ticker} (FY{fiscal_year}). Critical anomalies detected across "
                f"{quant_bundle.red_flag_count} deterministic indicators. Beneish M-Score and cash-flow "
                "accruals exhibit statistical fingerprints characteristic of historical accounting restatements."
            )
            human_review = True
        elif quant_bundle.audit_verdict == "MODERATE_RISK":
            composite = "ELEVATED_RISK"
            conf = 0.88
            summary = (
                f"Elevated risk flagged for {ticker} (FY{fiscal_year}). Specific attention required regarding "
                f"non-GAAP add-backs and working capital accrual expansion."
            )
            human_review = False
        else:
            composite = "CLEAN_AUDIT"
            conf = 0.94
            summary = (
                f"Clean audit profile for {ticker} (FY{fiscal_year}). All solvency and accruals indicators "
                "fall within normal statistical bounds with healthy covenant headroom."
            )
            human_review = False

        return JudgeVerdict(
            audit_id=audit_id,
            ticker=ticker,
            fiscal_year=fiscal_year,
            composite_verdict=composite,
            confidence_score=conf,
            executive_summary=summary,
            agreed_facts=agreed_facts,
            disputed_theses=disputed_theses,
            quant_red_flag_count=quant_bundle.red_flag_count,
            validated_citations=deduped_cites,
            human_review_required=human_review,
        )
