"""Prometheus custom metrics collectors for the Forensic Due Diligence Engine."""

from prometheus_client import Counter, Histogram, Gauge

# 1. Token Usage by Agent Role
LLM_TOKENS_TOTAL = Counter(
    "llm_tokens_total",
    "Total number of tokens consumed by agent operations",
    ["agent_role", "token_type"],  # token_type: prompt | completion | total
)

# 2. LLM Cost Accumulator in USD
LLM_COST_USD_TOTAL = Counter(
    "llm_cost_usd_total",
    "Total accumulated LLM spend in USD across all forensic audits",
    ["agent_role"],
)

# 3. Citation Validation Failures Counter
CITATION_VALIDATION_FAILURES_TOTAL = Counter(
    "citation_validation_failures_total",
    "Count of candidate citations rejected by the strict allowlist validator",
    ["failure_reason"],  # e.g., 'unretrieved_chunk_id', 'span_out_of_bounds', 'text_mismatch'
)

# 4. Retrieval Latency Histogram (Differentiating Graph vs Vector)
RETRIEVAL_LATENCY_SECONDS = Histogram(
    "retrieval_latency_seconds",
    "Time taken to execute retrieval across storage tiers",
    ["tier"],  # tier: 'vector' | 'graph' | 'hybrid'
    buckets=[0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5],
)

# 5. Agent Execution Latency
AGENT_EXECUTION_LATENCY_SECONDS = Histogram(
    "agent_execution_latency_seconds",
    "Execution latency for individual debate committee agents",
    ["agent_role"],
    buckets=[0.01, 0.05, 0.1, 0.2, 0.5, 1.0, 2.0, 5.0],
)

# 6. Cost Guardrail Aborts
COST_GUARDRAIL_ABORTS_TOTAL = Counter(
    "cost_guardrail_aborts_total",
    "Number of requests aborted due to exceeding the per-query spend budget threshold",
    ["ticker"],
)
