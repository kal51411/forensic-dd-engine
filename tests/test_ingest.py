"""Unit tests for the SEC EDGAR ingestion, chunking, and review queue."""

import os
import pytest
from ingest.chunker import chunk_filing_item, sanitize_item_key
from ingest.xbrl_parser import XBRLParser
from ingest.review_queue import HumanReviewQueue
from ingest.models import HumanReviewItem


def test_sanitize_item_key():
    assert sanitize_item_key("Item 7 - Management's Discussion") == "item_7_management_s_discussion"
    assert sanitize_item_key("Note 4: Long-Term Debt") == "note_4_long_term_debt"


def test_chunk_filing_item_exact_offsets():
    raw_text = (
        "Item 7. Management's Discussion and Analysis. The Company recorded total revenue "
        "of $10,000 million in 2023 compared to $8,500 million in 2022. Gross margin increased by "
        "15% primarily due to supply chain efficiency. Selling, general, and administrative expenses "
        "were $2,100 million. Operating cash flows remained robust at $2,400 million, while accounts "
        "receivable grew 12% in line with seasonal holiday shipments. Capital expenditures were "
        "$850 million for manufacturing facility expansion in Ohio."
    )

    chunks = chunk_filing_item(
        ticker="XYZ",
        accession_number="0001234567-23-000001",
        fiscal_year=2023,
        item_name="Item 7",
        item_text=raw_text,
        chunk_size=120,
        overlap=30,
    )

    assert len(chunks) > 1
    for chunk in chunks:
        # Crucial provenance invariant: chunk text must exactly match slice from raw text
        assert raw_text[chunk.char_start : chunk.char_end] == chunk.text
        assert chunk.chunk_id.startswith("XYZ_0001234567-23-000001_item_7_")
        assert chunk.tokens > 0


def test_chunk_filing_short_text():
    raw_text = "Short note disclosure."
    chunks = chunk_filing_item(
        ticker="XYZ",
        accession_number="0001234567-23-000001",
        fiscal_year=2023,
        item_name="Note 1",
        item_text=raw_text,
        chunk_size=500,
    )
    assert len(chunks) == 1
    assert chunks[0].char_start == 0
    assert chunks[0].char_end == len(raw_text)
    assert chunks[0].text == raw_text


def test_xbrl_parser_balanced_facts():
    facts = {
        "revenue": 1000.0,
        "cogs": 600.0,
        "sga": 150.0,
        "operating_income_ebit": 250.0,
        "net_income": 180.0,
        "cash_and_equivalents": 200.0,
        "receivables": 150.0,
        "current_assets": 500.0,
        "ppe_net": 700.0,
        "total_assets": 1200.0,
        "current_liabilities": 300.0,
        "total_liabilities": 400.0,
        "total_equity": 800.0,  # 400 + 800 == 1200
        "cfo": 220.0,
    }
    line_items, confidences, review_items = XBRLParser.parse_and_validate("TEST", 2023, facts)
    assert line_items.total_assets == 1200.0
    assert len(review_items) == 0
    assert all(not c.is_flagged for c in confidences)


def test_xbrl_parser_balance_equation_mismatch():
    facts = {
        "revenue": 1000.0,
        "cogs": 600.0,
        "sga": 150.0,
        "operating_income_ebit": 250.0,
        "net_income": 180.0,
        "cash_and_equivalents": 200.0,
        "receivables": 150.0,
        "current_assets": 500.0,
        "ppe_net": 700.0,
        "total_assets": 1200.0,
        "current_liabilities": 300.0,
        "total_liabilities": 400.0,
        "total_equity": 500.0,  # 400 + 500 == 900 != 1200 -> $300 mismatch
        "cfo": 220.0,
    }
    line_items, confidences, review_items = XBRLParser.parse_and_validate("TEST", 2023, facts)
    assert len(review_items) >= 1
    mismatch_item = next(it for it in review_items if it.cell_name == "BALANCE_CHECK_EQUATION")
    assert mismatch_item.confidence_score < 0.85
    assert "Fundamental equation breach" in mismatch_item.flag_reason


def test_xbrl_parser_sign_normalization():
    facts = {
        "revenue": -1000.0,  # Reported as negative credit
        "cogs": -600.0,
        "sga": 150.0,
        "operating_income_ebit": 250.0,
        "net_income": 180.0,
        "cash_and_equivalents": 200.0,
        "receivables": 150.0,
        "current_assets": 500.0,
        "ppe_net": 700.0,
        "total_assets": 1200.0,
        "current_liabilities": 400.0,
        "total_liabilities": 400.0,
        "total_equity": 800.0,
        "cfo": 220.0,
    }
    line_items, confidences, _ = XBRLParser.parse_and_validate("TEST", 2023, facts)
    assert line_items.revenue == 1000.0
    assert line_items.cogs == 600.0


def test_human_review_queue_lifecycle(tmp_path):
    queue_file = str(tmp_path / "review_queue.jsonl")
    queue = HumanReviewQueue(queue_file)

    items = [
        HumanReviewItem(
            item_id="ACME_2023_rev",
            ticker="ACME",
            fiscal_year=2023,
            cell_name="revenue",
            extracted_value=0.0,
            confidence_score=0.5,
            source_item="Item 8",
            flag_reason="Missing tag",
        )
    ]
    queue.enqueue(items)
    pending = queue.list_all(status="PENDING")
    assert len(pending) == 1
    assert pending[0].item_id == "ACME_2023_rev"

    # Resolve
    resolved = queue.resolve("ACME_2023_rev", resolved_value=12500.0)
    assert resolved
    assert len(queue.list_all(status="PENDING")) == 0
    resolved_items = queue.list_all(status="RESOLVED")
    assert len(resolved_items) == 1
    assert resolved_items[0].resolved_value == 12500.0
