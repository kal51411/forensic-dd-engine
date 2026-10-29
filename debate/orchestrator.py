"""Forensic debate committee orchestrator managing the state machine."""

import time
import uuid
from typing import Dict, Any, List
from quant.models import QuantAuditBundle
from ingest.models import FilingChunk
from debate.schemas import DebateTurn, FactCheckVerdict, JudgeVerdict
from debate.agents import BearAgent, BullAgent, FactCheckerAgent, JudgeAgent
from monitoring.tracer import TRACER
from monitoring.metrics import (
    LLM_TOKENS_TOTAL,
    LLM_COST_USD_TOTAL,
    AGENT_EXECUTION_LATENCY_SECONDS,
)


class ForensicDebateOrchestrator:
    """Coordinates the 4-stage forensic committee debate with full observability."""

    @classmethod
    def run_debate(
        cls,
        ticker: str,
        fiscal_year: int,
        quant_bundle: QuantAuditBundle,
        allowlist_chunks: Dict[str, FilingChunk],
    ) -> Dict[str, Any]:
        """Execute complete adversarial debate with verification and judicial ruling.

        Args:
            ticker: Ticker symbol.
            fiscal_year: Fiscal year under audit.
            quant_bundle: Deterministic financial calculations.
            allowlist_chunks: Current retrieved chunks.

        Returns:
            Dictionary with audit_id, debate_turns, fact_checks, judge_verdict, and total_cost_usd.
        """
        audit_id = f"audit_{ticker}_{fiscal_year}_{uuid.uuid4().hex[:8]}"
        chunk_list = list(allowlist_chunks.values())
        context_prompt = (
            f"Audit Context: Ticker={ticker}, FY={fiscal_year}, "
            f"M-Score={quant_bundle.beneish.m_score:.2f}, Z-Score={quant_bundle.altman.z_score:.2f}, "
            f"Accruals={quant_bundle.sloan.accrual_ratio:.1%}, Chunks={len(chunk_list)}"
        )

        # -------------------------------------------------------------
        # Stage 1: Bear argument
        # -------------------------------------------------------------
        t0 = time.perf_counter()
        span_id_bear = TRACER.start_trace(audit_id, "BEAR", context_prompt)
        bear_turn = BearAgent.argue(quant_bundle, chunk_list)
        span_bear = TRACER.end_trace(
            span_id=span_id_bear,
            session_id=audit_id,
            agent_role="BEAR",
            prompt=context_prompt,
            response=f"Thesis: {bear_turn.thesis} | Argument: {bear_turn.argument}",
            start_time=t0,
            metadata={"claims_count": len(bear_turn.quantitative_claims)},
        )
        AGENT_EXECUTION_LATENCY_SECONDS.labels(agent_role="BEAR").observe(time.perf_counter() - t0)
        LLM_TOKENS_TOTAL.labels(agent_role="BEAR", token_type="prompt").inc(span_bear.prompt_tokens)
        LLM_TOKENS_TOTAL.labels(agent_role="BEAR", token_type="completion").inc(span_bear.completion_tokens)
        LLM_TOKENS_TOTAL.labels(agent_role="BEAR", token_type="total").inc(span_bear.total_tokens)
        LLM_COST_USD_TOTAL.labels(agent_role="BEAR").inc(span_bear.cost_usd)

        # Bear Fact-Check
        t0_fc1 = time.perf_counter()
        span_id_fc1 = TRACER.start_trace(audit_id, "FACT_CHECKER", f"Verify Bear: {bear_turn.argument}")
        bear_fc = FactCheckerAgent.verify_turn(bear_turn, quant_bundle, allowlist_chunks)
        span_fc1 = TRACER.end_trace(
            span_id=span_id_fc1,
            session_id=audit_id,
            agent_role="FACT_CHECKER",
            prompt=f"Verify Bear claims: {bear_turn.quantitative_claims}",
            response=f"Verified: {bear_fc.all_quant_claims_verified}, Cites Verified: {bear_fc.all_citations_verified}",
            start_time=t0_fc1,
        )
        AGENT_EXECUTION_LATENCY_SECONDS.labels(agent_role="FACT_CHECKER").observe(time.perf_counter() - t0_fc1)
        LLM_TOKENS_TOTAL.labels(agent_role="FACT_CHECKER", token_type="total").inc(span_fc1.total_tokens)
        LLM_COST_USD_TOTAL.labels(agent_role="FACT_CHECKER").inc(span_fc1.cost_usd)

        # -------------------------------------------------------------
        # Stage 2: Bull argument
        # -------------------------------------------------------------
        t1 = time.perf_counter()
        bull_prompt = f"{context_prompt} | Rebut Bear: {bear_turn.thesis}"
        span_id_bull = TRACER.start_trace(audit_id, "BULL", bull_prompt)
        bull_turn = BullAgent.argue(quant_bundle, chunk_list, bear_turn)
        span_bull = TRACER.end_trace(
            span_id=span_id_bull,
            session_id=audit_id,
            agent_role="BULL",
            prompt=bull_prompt,
            response=f"Thesis: {bull_turn.thesis} | Argument: {bull_turn.argument}",
            start_time=t1,
            metadata={"claims_count": len(bull_turn.quantitative_claims)},
        )
        AGENT_EXECUTION_LATENCY_SECONDS.labels(agent_role="BULL").observe(time.perf_counter() - t1)
        LLM_TOKENS_TOTAL.labels(agent_role="BULL", token_type="prompt").inc(span_bull.prompt_tokens)
        LLM_TOKENS_TOTAL.labels(agent_role="BULL", token_type="completion").inc(span_bull.completion_tokens)
        LLM_TOKENS_TOTAL.labels(agent_role="BULL", token_type="total").inc(span_bull.total_tokens)
        LLM_COST_USD_TOTAL.labels(agent_role="BULL").inc(span_bull.cost_usd)

        # Bull Fact-Check
        t1_fc2 = time.perf_counter()
        span_id_fc2 = TRACER.start_trace(audit_id, "FACT_CHECKER", f"Verify Bull: {bull_turn.argument}")
        bull_fc = FactCheckerAgent.verify_turn(bull_turn, quant_bundle, allowlist_chunks)
        span_fc2 = TRACER.end_trace(
            span_id=span_id_fc2,
            session_id=audit_id,
            agent_role="FACT_CHECKER",
            prompt=f"Verify Bull claims: {bull_turn.quantitative_claims}",
            response=f"Verified: {bull_fc.all_quant_claims_verified}, Cites Verified: {bull_fc.all_citations_verified}",
            start_time=t1_fc2,
        )
        AGENT_EXECUTION_LATENCY_SECONDS.labels(agent_role="FACT_CHECKER").observe(time.perf_counter() - t1_fc2)
        LLM_TOKENS_TOTAL.labels(agent_role="FACT_CHECKER", token_type="total").inc(span_fc2.total_tokens)
        LLM_COST_USD_TOTAL.labels(agent_role="FACT_CHECKER").inc(span_fc2.cost_usd)

        # -------------------------------------------------------------
        # Stage 3: Judge deliberation
        # -------------------------------------------------------------
        t2 = time.perf_counter()
        judge_prompt = f"Deliberate: Bear({bear_turn.thesis}) vs Bull({bull_turn.thesis}) on {ticker}"
        span_id_judge = TRACER.start_trace(audit_id, "JUDGE", judge_prompt)
        judge_verdict = JudgeAgent.deliberate(
            audit_id=audit_id,
            ticker=ticker,
            fiscal_year=fiscal_year,
            quant_bundle=quant_bundle,
            bear_turn=bear_turn,
            bull_turn=bull_turn,
            bear_fc=bear_fc,
            bull_fc=bull_fc,
        )
        span_judge = TRACER.end_trace(
            span_id=span_id_judge,
            session_id=audit_id,
            agent_role="JUDGE",
            prompt=judge_prompt,
            response=f"Verdict: {judge_verdict.composite_verdict} | Summary: {judge_verdict.executive_summary}",
            start_time=t2,
            metadata={"confidence": judge_verdict.confidence_score},
        )
        AGENT_EXECUTION_LATENCY_SECONDS.labels(agent_role="JUDGE").observe(time.perf_counter() - t2)
        LLM_TOKENS_TOTAL.labels(agent_role="JUDGE", token_type="prompt").inc(span_judge.prompt_tokens)
        LLM_TOKENS_TOTAL.labels(agent_role="JUDGE", token_type="completion").inc(span_judge.completion_tokens)
        LLM_TOKENS_TOTAL.labels(agent_role="JUDGE", token_type="total").inc(span_judge.total_tokens)
        LLM_COST_USD_TOTAL.labels(agent_role="JUDGE").inc(span_judge.cost_usd)

        total_audit_cost = TRACER.get_session_cost(audit_id)

        return {
            "audit_id": audit_id,
            "ticker": ticker,
            "fiscal_year": fiscal_year,
            "debate_turns": [bear_turn, bull_turn],
            "fact_checks": [bear_fc, bull_fc],
            "judge_verdict": judge_verdict,
            "total_cost_usd": total_audit_cost,
            "token_usage": {
                "bear": span_bear.total_tokens,
                "bull": span_bull.total_tokens,
                "fact_checker": span_fc1.total_tokens + span_fc2.total_tokens,
                "judge": span_judge.total_tokens,
                "total": (
                    span_bear.total_tokens
                    + span_bull.total_tokens
                    + span_fc1.total_tokens
                    + span_fc2.total_tokens
                    + span_judge.total_tokens
                ),
            },
        }
