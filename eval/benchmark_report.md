## Forensic Due Diligence Benchmark: Accuracy & Grounding

| Evaluation Metric | Mathematical Denominator | Vector-Only Baseline | Hybrid (Graph + Vector) |
| :--- | :--- | :--- | :--- |
| Hop-0 Lookup Accuracy | `Total Hop-0 Questions (10)` | **90.0%** (9/10) | **100.0%** (10/10) |
| Hop-1 Single-Hop Reasoning | `Total Hop-1 Questions (10)` | **90.0%** (9/10) | **90.0%** (9/10) |
| Hop-2 Multi-Hop Forensic Linkage | `Total Hop-2 Questions (10)` | **100.0%** (10/10) | **100.0%** (10/10) |
| Out-of-Scope Refusal Rate | `Total Out-of-Scope Prompts (10)` | **100.0%** (10/10) | **100.0%** (10/10) |
| Adversarial / Messy Stress Test | `Total Adversarial Inquiries (5)` | **20.0%** (1/5) | **80.0%** (4/5) |
| Graceful Degradation Rate (Low-Conf -> Review Queue) | `Total Low-Confidence/Degraded Extractions (2)` | **0.0%** (0/2) | **100.0%** (2/2) |
| Citation Groundedness Precision | `Total Generated Citations (30-33)` | **100.0%** (35/35) | **100.0%** (33/33) |
| Composite Benchmark Score | `Total Benchmark Dataset (45)` | **86.7%** (39/45) | **95.6%** (43/45) |

## Cost & Performance Observability Benchmarks

| Observability Metric | Vector-Only Baseline | Hybrid (Graph + Vector) Committee | SLA Target / Guardrail |
| :--- | :--- | :--- | :--- |
| **Average Cost per Audit (USD)** | `$0.0131` | `$0.0272` | `< $0.10` hard cap |
| **P50 Retrieval Latency** | `0.12 ms` | `0.12 ms` | `< 10.0 ms` |
| **P95 Retrieval Latency** | `0.31 ms` | `0.83 ms` | `< 25.0 ms` |
| **P50 Total Query Latency** | `0.2 ms` | `0.17 ms` | `< 50.0 ms` |
| **P95 Total Query Latency** | `0.79 ms` | `1.16 ms` | `< 100.0 ms` |
| **Bear Agent Tokens / Audit** | — | `236 tokens` | Expected ~400-800 |
| **Bull Agent Tokens / Audit** | — | `248 tokens` | Expected ~400-800 |
| **Fact-Checker Tokens / Audit** | — | `171 tokens` | Expected ~200-400 |
| **Judge Deliberation Tokens** | — | `372 tokens` | Expected ~500-1,000 |
| **Total Tokens per Audit** | `314 tokens` | `1,027 tokens` | `< 3,500 tokens` |