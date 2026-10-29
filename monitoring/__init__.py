"""Monitoring module exposing LLM observability and Prometheus telemetry."""

from monitoring.tracer import TRACER, LLMTraceSpan, LLMTracer
from monitoring.metrics import (
    LLM_TOKENS_TOTAL,
    LLM_COST_USD_TOTAL,
    CITATION_VALIDATION_FAILURES_TOTAL,
    RETRIEVAL_LATENCY_SECONDS,
    AGENT_EXECUTION_LATENCY_SECONDS,
    COST_GUARDRAIL_ABORTS_TOTAL,
)

__all__ = [
    "TRACER",
    "LLMTraceSpan",
    "LLMTracer",
    "LLM_TOKENS_TOTAL",
    "LLM_COST_USD_TOTAL",
    "CITATION_VALIDATION_FAILURES_TOTAL",
    "RETRIEVAL_LATENCY_SECONDS",
    "AGENT_EXECUTION_LATENCY_SECONDS",
    "COST_GUARDRAIL_ABORTS_TOTAL",
]
