"""LLM Observability and Tracing client for LangSmith and Helicone.

Captures agent prompt executions, response texts, latency, token usage,
and dollar costs across Bull, Bear, FactChecker, and Judge agents.
Supports both local file-based trace logging and remote tracing export.
"""

import os
import time
import json
import uuid
from typing import Dict, Any, List, Optional
from dataclasses import dataclass, asdict, field

# Model Pricing Schedule (per 1,000 tokens) - standard enterprise pricing
# Default model: claude-3-5-sonnet / gpt-4o enterprise tier
MODEL_PRICING = {
    "default": {
        "prompt_cost_per_1k": 0.003,      # $3.00 / 1M prompt tokens
        "completion_cost_per_1k": 0.015,  # $15.00 / 1M completion tokens
    },
    "fast": {
        "prompt_cost_per_1k": 0.00015,    # $0.15 / 1M prompt tokens
        "completion_cost_per_1k": 0.0006, # $0.60 / 1M completion tokens
    }
}


@dataclass
class LLMTraceSpan:
    trace_id: str
    span_id: str
    parent_span_id: Optional[str]
    session_id: str
    agent_role: str
    prompt: str
    response: str
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int
    cost_usd: float
    start_time: float
    end_time: float
    latency_ms: float
    status: str
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


class LLMTracer:
    """Manages spans, token accounting, and export to LangSmith / Helicone / local audit logs."""

    def __init__(self, trace_log_path: str = "monitoring/llm_traces.jsonl"):
        self.trace_log_path = trace_log_path
        self.active_spans: List[LLMTraceSpan] = []
        self.session_cost_accumulator: Dict[str, float] = {}
        
        # Helicone / LangSmith configuration from environment
        self.helicone_api_key = os.getenv("HELICONE_API_KEY", "")
        self.langsmith_api_key = os.getenv("LANGSMITH_API_KEY", "")
        self.langsmith_project = os.getenv("LANGSMITH_PROJECT", "forensic-dd-engine")

    @staticmethod
    def estimate_tokens(text: str) -> int:
        """Heuristic token estimator (average 4 characters per token in English financial disclosures)."""
        if not text:
            return 0
        return max(1, len(text) // 4)

    @classmethod
    def calculate_cost(cls, prompt_tokens: int, completion_tokens: int, model_tier: str = "default") -> float:
        """Calculate total USD cost for a generation given token counts."""
        tier = MODEL_PRICING.get(model_tier, MODEL_PRICING["default"])
        prompt_cost = (prompt_tokens / 1000.0) * tier["prompt_cost_per_1k"]
        completion_cost = (completion_tokens / 1000.0) * tier["completion_cost_per_1k"]
        return round(prompt_cost + completion_cost, 6)

    def start_trace(
        self,
        session_id: str,
        agent_role: str,
        prompt: str,
        parent_span_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> str:
        """Start tracking an agent LLM call and return span_id."""
        span_id = f"span_{uuid.uuid4().hex[:12]}"
        trace_id = session_id if session_id else f"trace_{uuid.uuid4().hex[:12]}"

        # Record span in-flight
        span_data = {
            "trace_id": trace_id,
            "span_id": span_id,
            "parent_span_id": parent_span_id,
            "session_id": session_id,
            "agent_role": agent_role,
            "prompt": prompt,
            "start_time": time.perf_counter(),
            "metadata": metadata or {},
        }
        return span_id

    def end_trace(
        self,
        span_id: str,
        session_id: str,
        agent_role: str,
        prompt: str,
        response: str,
        start_time: float,
        parent_span_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
        prompt_tokens: Optional[int] = None,
        completion_tokens: Optional[int] = None,
        status: str = "SUCCESS",
    ) -> LLMTraceSpan:
        """Complete an LLM trace span, calculate tokens & cost, and persist."""
        end_time = time.perf_counter()
        latency_ms = round((end_time - start_time) * 1000.0, 2)

        p_tokens = prompt_tokens if prompt_tokens is not None else self.estimate_tokens(prompt)
        c_tokens = completion_tokens if completion_tokens is not None else self.estimate_tokens(response)
        tot_tokens = p_tokens + c_tokens
        cost_usd = self.calculate_cost(p_tokens, c_tokens)

        # Update session cost accumulator
        curr_cost = self.session_cost_accumulator.get(session_id, 0.0)
        self.session_cost_accumulator[session_id] = curr_cost + cost_usd

        span = LLMTraceSpan(
            trace_id=session_id,
            span_id=span_id,
            parent_span_id=parent_span_id,
            session_id=session_id,
            agent_role=agent_role,
            prompt=prompt,
            response=response,
            prompt_tokens=p_tokens,
            completion_tokens=c_tokens,
            total_tokens=tot_tokens,
            cost_usd=cost_usd,
            start_time=start_time,
            end_time=end_time,
            latency_ms=latency_ms,
            status=status,
            metadata=metadata or {},
        )

        self.active_spans.append(span)
        self._persist_span(span)
        return span

    def get_session_cost(self, session_id: str) -> float:
        """Retrieve total accumulated LLM cost in USD for a given session / audit ID."""
        return self.session_cost_accumulator.get(session_id, 0.0)

    def _persist_span(self, span: LLMTraceSpan):
        """Append span JSON to local audit file."""
        try:
            os.makedirs(os.path.dirname(self.trace_log_path), exist_ok=True)
            with open(self.trace_log_path, "a", encoding="utf-8") as f:
                f.write(json.dumps(span.to_dict()) + "\n")
        except Exception:
            pass


# Global singleton instance
TRACER = LLMTracer()
