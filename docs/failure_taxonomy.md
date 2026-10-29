# Failure Taxonomy & Defense Catalog

This document categorizes common failure modes when applying AI to SEC financial auditing, along with the deterministic defenses and guardrails implemented in this engine.

---

## 1. Accounting Sign Inversions & Tag Aliasing
* **Failure Mode**: SEC XBRL filings frequently flip sign conventions between statements (e.g. Cost of Goods Sold reported as negative expense, or credit balances reported with inverted signs). Unverified extraction results in negative revenues or reversed margins.
* **Defense**: The `XBRLParser` applies deterministic sign normalization (`positive_only` guards on revenue, COGS, assets) and cross-verifies fundamental accounting equations:
  $$Assets = Liabilities + Shareholders' Equity \quad (\pm 1\%)$$
  Discrepancies exceeding 1% are automatically routed to `human_review_queue.jsonl`.

---

## 2. LLM Arithmetic Drift & Hallucination
* **Failure Mode**: When prompted to compute non-trivial financial formulas (e.g. Altman Z discriminant components or 8-factor Beneish indices), language models make rounding errors, hallucinate denominators, or approximate ratios.
* **Defense**: **Zero LLM arithmetic**. Calculations are performed strictly by pure Python functions with pytest test fixtures. Downstream agents in `debate/` receive an immutable `QuantAuditBundle`, and the `FactCheckerAgent` programmatically verifies that any numeric claim matches the precomputed bundle.

---

## 3. Character Span Drift & Phantom Citations
* **Failure Mode**: Standard RAG pipelines return chunk IDs but cannot verify whether the cited sentence exists in the chunk or has been modified.
* **Defense**: `CitationValidator` requires character boundaries `char_span: (start, end)`. It verifies:
  1. `chunk_id` is an element of the active retrieval set (`allowlist_chunk_ids`).
  2. `0 <= start < end <= len(chunk.text)`.
  3. The verbatim excerpt is an exact substring of `chunk.text[start:end]`.
  Any citation violating these conditions causes immediate request rejection.

---

## 4. Graph Injection & Schema Hallucination
* **Failure Mode**: Allowing LLMs to write dynamic Cypher queries results in syntax errors, Cartesian explosion timeouts, or destructive database commands (`DETACH DELETE`).
* **Defense**: The `CypherTemplate` registry maintains a closed, pre-compiled Enum allowlist. Any attempt to pass ad-hoc Cypher strings raises `DisallowedCypherError`.

---

## 5. False Confidence on Ambiguous Extractions
* **Failure Mode**: Standard AI pipelines silently guess missing or conflicting line items.
* **Defense**: Low confidence cells ($< 0.85$) generate `HumanReviewItem` records in `human_review_queue.jsonl`. Analysts can inspect and resolve these cells via the `/review-queue` API endpoints.

---

## 6. RED TEAM ADVERSARIAL EDGE CASES

### Edge Case A: Acquisition Accounting & Purchase Price Allocation (PPA) Distortion (`MEGA`)
* **Failure Mode**: A massive merger creates huge headline revenue growth (e.g. +85%) and multi-billion-dollar goodwill step-ups. Naïve vector search extracts the headline consolidated growth rate and misses that organic business revenue was essentially flat (0.2%), misrepresenting organic growth.
* **Defense**: Hybrid multi-hop routing connects Note 4 Purchase Price Allocation adjustments with Item 7 MD&A disclosures. The `CitationValidator` rejects answers that quote consolidated revenue when asked for organic revenue, requiring exact chunk citations to the PPA carve-out disclosure.

### Edge Case B: Non-Standard & Foreign Issuer Taxonomy Drift (`FRGN`)
* **Failure Mode**: Foreign Private Issuers (Form 20-F) report under IFRS or non-standard taxonomies (e.g. `ifrs-full:ResultFromOperatingActivities` instead of US-GAAP `OperatingIncomeLoss`). Generic LLMs hallucinate a US-GAAP EBIT number by guessing or converting inappropriate sub-line items.
* **Defense**: When `XBRLParser` cannot resolve standard US-GAAP concepts, the confidence score drops to $0.45 (< 0.85)$. The system refuses to silently guess, triggers **Graceful Degradation**, and routes the extraction to `human_review_queue.jsonl` with flag `Missing required XBRL concept: operating_income_ebit`.

### Edge Case C: Scanned Bitmaps & Corrupted OCR Artifacts (`SCAN`)
* **Failure Mode**: Historical or microfiche filings scanned as lossy bitmaps yield noisy or corrupted text (e.g. `[SCANNED_BITMAP_UNREADABLE_OCR: T0t@l R3v_nu3: ??? Diluted EPS: ##.##]`). LLMs encounter garbage tokens and hallucinate plausible-sounding EPS numbers.
* **Defense**: The chunker flags corrupted text with `is_ocr_degraded = True` and sets chunk confidence to $0.20 (< 0.85)$. The `CitationValidator` refuses to ground citations on degraded text chunks, and the query is diverted to the Human Review Queue for visual manual verification by accounting staff.

### Edge Case D: Dual-Class Capital Structure & Governance/Economic Divergence (`DUAL`)
* **Failure Mode**: Companies with multi-class common stock often decouple voting power from cash flow rights (e.g. Class B carries 10 votes per share). Language models frequently hallucinate that super-voting shares enjoy dividend priority.
* **Defense**: The system requires exact sentence grounding in Note 12 Section 12.4, which explicitly states Class B shares carry *no dividend priority* over Class A. Unverified assertions of economic seniority are blocked by `CitationValidator`.

### Edge Case E: Retroactive Discontinued Operations Restatements (`REST`)
* **Failure Mode**: Discontinued operations restatements retrospectively lower historical EBITDA, creating pro forma credit agreement covenant defaults that were subsequently cured or waived by lenders after year-end. LLMs often report either false compliance or unmitigated default.
* **Defense**: Adversarial committee isolation: The `BearAgent` surfaces the pro forma covenant breach while the `FactCheckerAgent` forces attribution to the post-balance-sheet lender waiver footnote, isolating accounting restatement non-comparability.
