# Evaluation Harness Specification & Red-Teamed Benchmark Report

## 1. Principles of Evaluation

In compliance with the system's non-negotiable hard constraints:
> **No metric without a defined denominator.**
> **No silent guessing on low-confidence extractions (< 0.85).**

Every benchmark metric evaluates empirical performance against 45 ground-truth hand-curated questions (`eval/questions.jsonl`). The benchmark features clean, distressed, and red-teamed adversarial filings:
- **Apple Inc (FY2023 10-K)**: Clean public control.
- **Enron Corp (FY2000 10-K)**: Historical accounting restatement & accruals manipulation.
- **Debtor FAIL (FY2023 10-K)**: Distressed borrower with covenant defaults and non-GAAP EBITDA inflation.
- **M&A Acquirer MEGA (FY2023 10-K)**: $45B acquisition with purchase price allocation and organic growth distortions.
- **Foreign Issuer FRGN (FY2023 20-F)**: IFRS taxonomy drift with missing standard US-GAAP line items.
- **Scanned Filing SCAN (FY2023)**: Corrupted bitmap OCR degradation simulating legacy image scans.
- **Dual-Class Issuer DUAL**: Voting vs economic rights decoupling (Section 12.4 dividend subordination).
- **Restatement Issuer REST**: Discontinued operations restatement creating retroactive covenant default ambiguity.

---

## 2. Metric Formulations with Explicit Denominators

| Metric | Mathematical Formulation | Denominator Description |
| :--- | :--- | :--- |
| **Hop-0 Lookup Accuracy** | $$\frac{\text{Correct Direct Fact Lookups}}{\text{Total Hop-0 Questions}}$$ | Total Hop-0 questions in benchmark ($N=10$) |
| **Hop-1 Single-Hop Reasoning** | $$\frac{\text{Correct Single-Step Reasoned Answers}}{\text{Total Hop-1 Questions}}$$ | Total Hop-1 questions in benchmark ($N=10$) |
| **Hop-2 Multi-Hop Forensic Linkage** | $$\frac{\text{Correct Multi-Footnote Linkages}}{\text{Total Hop-2 Questions}}$$ | Total Hop-2 questions in benchmark ($N=10$) |
| **Out-of-Scope Refusal Rate** | $$\frac{\text{Properly Refused Inquiries}}{\text{Total Out-of-Scope Prompts}}$$ | Total adversarial/out-of-scope prompts ($N=10$) |
| **Adversarial / Messy Stress Test** | $$\frac{\text{Correctly Handled Adversarial Inquiries}}{\text{Total Adversarial Inquiries}}$$ | Total messy/adversarial questions ($N=5$) |
| **Graceful Degradation Rate** | $$\frac{\text{Low-Confidence Inquiries Routed to Human Review}}{\text{Total Low-Confidence Inquiries}}$$ | Total extractions/OCR with confidence $< 0.85$ ($N=2$) |
| **Citation Groundedness Precision** | $$\frac{\text{Allowlist-Verified & Span-Matched Citations}}{\text{Total Citations Generated}}$$ | Total citations emitted by system |
| **Composite Benchmark Score** | $$\frac{\text{Total Verified Accurate Answers Across All Categories}}{\text{Total Benchmark Inquiries}}$$ | Total dataset sample count ($N=45$) |

---

## 3. Empirical Benchmark Results (Red Team Stress-Tested)

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

---

## 4. Key Takeaways from Red Teaming

1. **Vector-Only Silently Fails on Messy Real-World Data**:
   The standard vector-only baseline collapsed to **20.0%** on adversarial inquiries and scored **0.0%** on Graceful Degradation because it has no confidence filter: it blindly generated hallucinated numbers on corrupted OCR and non-standard foreign taxonomy tags.
2. **Deterministic Confidence Guardrails Prevent Hallucination**:
   The Hybrid architecture achieved **100% Graceful Degradation** by intercepting low-confidence extractions ($confidence < 0.85$) and routing them to the Human Review Queue instead of guessing.
3. **Honest Diligence Limits Acknowledged**:
   On complex retroactive restatements (`REST`), the system avoided overconfident claims, properly reflecting that post-balance-sheet waiver interactions require inspecting legal credit agreement amendments.
