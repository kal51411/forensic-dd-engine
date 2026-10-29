"""API integration tests for /ask, /audit, and human review queue endpoints."""

import pytest
from starlette.testclient import TestClient
from api.server import app, VECTOR_STORE, REVIEW_QUEUE
from ingest.models import FilingChunk, HumanReviewItem


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture(autouse=True)
def seed_test_data():
    chunk = FilingChunk(
        chunk_id="TEST_0000000001-23-000001_item_7_000",
        ticker="TEST",
        accession_number="0000000001-23-000001",
        fiscal_year=2023,
        item="Item 7",
        text="The company generated $500 million in operating cash flow while reducing accounts receivable.",
        char_start=0,
        char_end=94,
        tokens=14,
    )
    VECTOR_STORE.add_chunks([chunk])


def test_ask_endpoint_with_verified_citations(client):
    resp = client.post(
        "/ask",
        json={"ticker": "TEST", "question": "What was the operating cash flow in 2023?", "year": 2023},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["ticker"] == "TEST"
    assert len(data["citations"]) > 0
    citation = data["citations"][0]
    assert citation["chunk_id"] == "TEST_0000000001-23-000001_item_7_000"
    assert citation["char_span"] == [0, 80]
    assert "operating cash flow" in citation["excerpt"]


def test_ask_endpoint_out_of_scope_refusal(client):
    resp = client.post(
        "/ask",
        json={"ticker": "TEST", "question": "What is the weather forecast for tomorrow?", "year": 2023},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "Refusal" in data["answer"]
    assert len(data["citations"]) == 0


def test_audit_and_report_endpoint(client):
    resp = client.post("/audit/AAPL?fiscal_year=2023")
    assert resp.status_code == 200
    audit_data = resp.json()
    assert audit_data["ticker"] == "AAPL"
    assert "audit_id" in audit_data

    # Fetch HTML report
    report_url = audit_data["report_url"]
    report_resp = client.get(report_url)
    assert report_resp.status_code == 200
    assert "text/html" in report_resp.headers["content-type"]
    assert "Forensic Diligence Audit: AAPL" in report_resp.text
    assert "Beneish M-Score" in report_resp.text


def test_review_queue_endpoints(client):
    import uuid
    uid = uuid.uuid4().hex[:6]
    test_item_id = f"API_TEST_ITEM_{uid}"
    item = HumanReviewItem(
        item_id=test_item_id,
        ticker="API_TEST",
        fiscal_year=2023,
        cell_name="cfo",
        extracted_value=0.0,
        confidence_score=0.45,
        source_item="Item 8",
        flag_reason="Ambiguous cash flow line tag",
    )
    REVIEW_QUEUE.enqueue([item])

    # List
    list_resp = client.get("/review-queue?status=PENDING")
    assert list_resp.status_code == 200
    pending_items = list_resp.json()
    assert any(it["item_id"] == test_item_id for it in pending_items)

    # Resolve
    resolve_resp = client.post(
        f"/review-queue/{test_item_id}/resolve",
        json={"resolved_value": 450.0},
    )
    assert resolve_resp.status_code == 200
    assert resolve_resp.json()["status"] == "SUCCESS"


def test_audit_live_endpoint_msft_and_cache(client):
    # First live call
    resp1 = client.post("/audit/live/MSFT")
    assert resp1.status_code == 200
    data1 = resp1.json()
    assert data1["ticker"] == "MSFT"
    assert "MICROSOFT" in data1["entity_name"].upper()
    assert "fraud_risk_score" in data1
    assert "beneish_m_score" in data1["fraud_risk_score"]
    assert data1["fraud_risk_score"]["beneish_m_score"] < -1.78  # Clean non-manipulator

    # Second call should be served directly from disk cache
    resp2 = client.post("/audit/live/MSFT")
    assert resp2.status_code == 200
    data2 = resp2.json()
    assert data2["cached"] is True
    assert data2["audit_id"] is not None


def test_audit_live_endpoint_nvda(client):
    resp = client.post("/audit/live/NVDA")
    assert resp.status_code == 200
    data = resp.json()
    assert data["ticker"] == "NVDA"
    assert "NVIDIA" in data["entity_name"].upper()
    assert "fraud_risk_score" in data
    assert "altman_z_score" in data["fraud_risk_score"]

