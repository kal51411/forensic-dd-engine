# Forensic Due Diligence Engine

[![CI](https://github.com/kalpesh/forensic-dd-engine/actions/workflows/ci.yml/badge.svg)](https://github.com/kalpesh/forensic-dd-engine/actions/workflows/ci.yml)
[![Coverage: >=90%](https://img.shields.io/badge/Coverage-%E2%89%A590%25-brightgreen.svg)](tests/)
[![FastAPI](https://img.shields.io/badge/API-FastAPI-009688.svg)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Frontend-Next.js%2014-black.svg)](https://nextjs.org/)
[![Vercel](https://img.shields.io/badge/Deployed-Vercel-000000.svg)](https://frontend-kappa-gray-30.vercel.app)

A deterministic-first forensic audit multi-agent system over SEC filings (10-K, 10-Q). This is **not** a ChatGPT wrapper: the LLM is permitted to reason, argue, and synthesize — but is **strictly forbidden from performing arithmetic or generating ad-hoc database queries**.

### 🌐 Live Deployments
* **Production Frontend (Bloomberg Terminal UI)**: [https://frontend-kappa-gray-30.vercel.app](https://frontend-kappa-gray-30.vercel.app)
* **Backend Health Probe**: `GET /health` (Docker multi-stage deployable to Render / Railway)
* **Prometheus Metrics**: `GET /metrics`

---

## System Architecture

```
                           +----------------------------------------+
                           |       SEC EDGAR Ingestion Pipeline     |
                           |   (Token-Bucket 10 req/s, User-Agent)  |
                           +-------------------+--------------------+
                                               |
                     +-------------------------+-------------------------+
                     |                                                   |
                     v                                                   v
         +-----------------------+                           +-----------------------+
         |   XBRL Numeric Parse  |                           |  Item Text Chunking   |
         |  (Sign normalization, |                           |  (Item 1, 7, 8, etc., |
         |   fiscal alignment)   |                           |   stable chunk_ids,   |
         +-----------+-----------+                           |   char_span maps)     |
                     |                                       +-----------+-----------+
                     v                                                   |
         +-----------------------+                           +-----------+-----------+
         |  Confidence Validator |                           |                       |
         | (< 0.85 -> Review Q)  |                           v                       v
         +-----------+-----------+                   +---------------+       +---------------+
                     |                               |  pgvector     |       |  Neo4j Graph  |
                     v                               |  (HNSW Index, |       |  (Closed      |
         +-----------------------+                   |   chunk_id)   |       |   Ontology)   |
         |      quant/ Engine    |                   +-------+-------+       +-------+-------+
         | (Beneish, Sloan,      |                           |                       |
         |  Altman, EBITDA, Cov) |                           +-----------+-----------+
         +-----------+-----------+                                       |
                     |                                                   v
                     |                                     +-----------------------------+
                     |                                     |      retrieval/ Router      |
                     |                                     |  (graph | vector | both)    |
                     |                                     +--------------+--------------+
                     |                                                    |
                     +-------------------------+--------------------------+
                                               |
                                               v
                     +---------------------------------------------------+
                     |              debate/ Committee                    |
                     |      (Bear Agent <-> Bull Agent <-> Checker)      |
                     |            Judge Agent (Final Verdict)            |
                     +-------------------------+-------------------------+
                                               |
                                               v
                     +---------------------------------------------------+
                     |       Citation Allowlist Validator Guardrail      |
                     |      (Reject any chunk_id not in retrieval set)   |
                     +-------------------------+-------------------------+
                                               |
                                               v
                     +---------------------------------------------------+
                     |       FastAPI / Bloomberg Terminal UI (Next.js)   |
                     |     (Animated Recharts gauges & Citation Popover) |
                     +---------------------------------------------------+
```

---

## Benchmark Performance

Evaluated across 45 hand-curated and red-teamed questions in `eval/questions.jsonl` (covering Enron 2000, Apple 2023, Distressed Debtor FAIL, M&A Acquirer MEGA, Foreign Private Issuer FRGN, and Scanned Bitmap SCAN).

| Evaluation Metric | Mathematical Denominator | Vector-Only Baseline | Hybrid (Graph + Vector) |
| :--- | :--- | :--- | :--- |
| **Hop-0 Lookup Accuracy** | `Total Hop-0 Questions (10)` | **90.0%** (9/10) | **100.0%** (10/10) |
| **Hop-1 Single-Hop Reasoning** | `Total Hop-1 Questions (10)` | **90.0%** (9/10) | **90.0%** (9/10) |
| **Hop-2 Multi-Hop Forensic Linkage** | `Total Hop-2 Questions (10)` | **100.0%** (10/10) | **100.0%** (10/10) |
| **Out-of-Scope Refusal Rate** | `Total Out-of-Scope Prompts (10)` | **100.0%** (10/10) | **100.0%** (10/10) |
| **Adversarial / Messy Stress Test** | `Total Adversarial Inquiries (5)` | **20.0%** (1/5) | **80.0%** (4/5) |
| **Graceful Degradation Rate (Low-Conf -> Review Queue)** | `Total Low-Confidence/Degraded Extractions (2)` | **0.0%** (0/2) | **100.0%** (2/2) |
| **Citation Groundedness Precision** | `Total Generated Citations (33-35)` | **100.0%** (35/35) | **100.0%** (33/33) |
| **Composite Benchmark Score** | `Total Benchmark Dataset (45)` | **86.7%** (39/45) | **95.6%** (43/45) |

### Enterprise Observability & Cost Profile

| Observability Metric | Vector-Only Baseline | Hybrid (Graph + Vector) Committee | SLA Target / Guardrail |
| :--- | :--- | :--- | :--- |
| **Average Cost per Audit (USD)** | `$0.0131` | `$0.0272` | `< $0.10` hard cap |
| **P50 Retrieval Latency** | `0.12 ms` | `0.12 ms` | `< 10.0 ms` |
| **P95 Retrieval Latency** | `0.31 ms` | `0.83 ms` | `< 25.0 ms` |
| **P50 Total Query Latency** | `0.20 ms` | `0.17 ms` | `< 50.0 ms` |
| **P95 Total Query Latency** | `0.79 ms` | `1.16 ms` | `< 100.0 ms` |
| **Bear Agent Tokens / Audit** | — | `236 tokens` | Expected ~400-800 |
| **Bull Agent Tokens / Audit** | — | `248 tokens` | Expected ~400-800 |
| **Fact-Checker Tokens / Audit** | — | `171 tokens` | Expected ~200-400 |
| **Judge Deliberation Tokens** | — | `372 tokens` | Expected ~500-1,000 |
| **Total Tokens per Audit** | `314 tokens` | `1,027 tokens` | `< 3,500 tokens` |

---

## Non-Negotiable Hard Constraints

1. **No Model-Generated Cypher**:
   Graph retrieval uses strictly parameterized Cypher templates registered in `graph/cypher_registry.py`. Dynamic Cypher is intercepted and raises `DisallowedCypherError`.

2. **No LLM Arithmetic**:
   Beneish M-Score (8 indices), Sloan Accruals, Altman Z-Score, GAAP EBITDA reconciliation, and debt covenant headroom are pure Python functions in `quant/` with pytest fixtures.

3. **Active Citation Allowlist Guardrail**:
   Every answer includes `citations: [{chunk_id, ticker, item, char_span, excerpt}]`. The `CitationValidator` hard-rejects any response citing a chunk outside the current retrieval set or with misaligned character spans.

4. **Human Review Queue for Low-Confidence XBRL**:
   Extractions with confidence $< 0.85$ or balance sheet equation mismatches ($Assets \ne Liabilities + Equity$) are routed to `human_review_queue.jsonl` rather than guessed.

5. **Evaluation Denominators First**:
   Every metric in `docs/eval.md` has an explicit mathematical denominator.

---

## Repository Structure

```
forensic-dd-engine/
├── ingest/              # SEC EDGAR client (10 req/s), XBRL parser, Item chunker, Review Queue
├── quant/               # Pure functions: Beneish, Sloan, Altman Z, EBITDA bridge, Covenants
├── graph/               # Neo4j closed ontology schema and parameterized Cypher registry
├── retrieval/           # Hybrid router (graph|vector|both), citation allowlist validator
├── debate/              # Adversarial committee: Bear, Bull, FactChecker, Judge
├── eval/                # questions.jsonl, run.py, calibration curve, benchmark report
├── report/              # Standalone interactive HTML report with clickable citation previews
├── api/                 # FastAPI server (/ask, /audit/{ticker}, /report/{id}, /review-queue)
├── tests/               # Pytest suite with >= 90% coverage enforcement on quant/ and retrieval/
├── docs/                # architecture.md, eval.md, failure_taxonomy.md
├── .github/workflows/   # CI pipeline enforcing coverage and benchmark evaluation
└── docker-compose.yml   # Multi-container orchestration (FastAPI + Neo4j)
```

---

## Quickstart

### 1. Installation & Virtual Environment
```bash
# Clone the repository
cd forensic-dd-engine

# Create virtual environment with uv or python
uv venv --python python3
source .venv/bin/activate

# Install dependencies
uv pip install -r requirements.txt
```

### 2. Run Test Suite with Coverage Guardrail
```bash
PYTHONPATH=. pytest tests/ --cov=quant --cov=retrieval --cov-fail-under=90 --cov-report=term-missing
```

### 3. Run Benchmark Evaluation Harness
```bash
PYTHONPATH=. python -m eval.run
```

### 4. Start the API Server
```bash
PYTHONPATH=. uvicorn api.server:app --reload --port 8000
```

### 5. Inspect an Audit & Click-Through Citations
```bash
# Trigger an audit
curl -X POST "http://localhost:8000/audit/AAPL?fiscal_year=2023"

# Query the /ask endpoint with verified citations
curl -X POST "http://localhost:8000/ask" \
  -H "Content-Type: application/json" \
  -d '{"ticker": "AAPL", "question": "What was the commercial paper debt in Note 3?", "year": 2023}'
```

Visit `http://localhost:8000/report/{audit_id}` in your browser to view the interactive audit dashboard with clickable citation tooltips and source SEC filing modal previews.
