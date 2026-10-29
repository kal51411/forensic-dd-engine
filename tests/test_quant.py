"""Comprehensive unit tests for the deterministic quant engine.

Tests Beneish M-Score, Sloan Accruals, Altman Z, EBITDA bridge, and debt covenants.
Includes historical forensic benchmarks (Enron 2000, Apple 2023 healthy control, and distressed debtor).
"""

import pytest
from quant.models import FinancialLineItems
from quant.beneish import calculate_beneish_m_score
from quant.sloan import calculate_sloan_accrual
from quant.altman import calculate_altman_z_score
from quant.ebitda_bridge import calculate_ebitda_bridge
from quant.covenants import calculate_covenant_headroom
from quant.engine import run_quant_audit


@pytest.fixture
def apple_2023_financials():
    """Healthy control financial profile (in millions USD)."""
    t_minus_1 = FinancialLineItems(
        ticker="AAPL",
        fiscal_year=2022,
        revenue=394328.0,
        cogs=223546.0,
        sga=25094.0,
        depreciation_amortization=11104.0,
        operating_income_ebit=119437.0,
        interest_expense=2931.0,
        tax_expense=19300.0,
        net_income=99803.0,
        cash_and_equivalents=23646.0,
        marketable_securities=24658.0,
        receivables=28184.0,
        inventory=4946.0,
        current_assets=135405.0,
        ppe_net=42117.0,
        total_assets=352755.0,
        current_liabilities=153982.0,
        long_term_debt=98959.0,
        total_liabilities=302083.0,
        retained_earnings=-3068.0,
        total_equity=50672.0,
        market_value_equity=2800000.0,
        cfo=122151.0,
        cfi=-22354.0,
        capex=10708.0,
        stock_based_compensation=9038.0,
    )

    t = FinancialLineItems(
        ticker="AAPL",
        fiscal_year=2023,
        revenue=383285.0,
        cogs=214137.0,
        sga=24932.0,
        depreciation_amortization=11519.0,
        operating_income_ebit=114301.0,
        interest_expense=3933.0,
        tax_expense=16741.0,
        net_income=96995.0,
        cash_and_equivalents=29965.0,
        marketable_securities=31590.0,
        receivables=29508.0,
        inventory=6331.0,
        current_assets=143566.0,
        ppe_net=43715.0,
        total_assets=352583.0,
        current_liabilities=145308.0,
        long_term_debt=95281.0,
        total_liabilities=290437.0,
        retained_earnings=-214.0,
        total_equity=62146.0,
        market_value_equity=2950000.0,
        cfo=110543.0,
        cfi=3705.0,
        capex=10959.0,
        stock_based_compensation=10833.0,
    )
    return t, t_minus_1


@pytest.fixture
def enron_manipulator_financials():
    """Historical fraud benchmark: Enron (1999 vs 2000, millions USD)."""
    t_minus_1 = FinancialLineItems(
        ticker="ENRN",
        fiscal_year=1999,
        revenue=40112.0,
        cogs=38100.0,
        sga=1800.0,
        depreciation_amortization=650.0,
        operating_income_ebit=1300.0,
        interest_expense=650.0,
        tax_expense=200.0,
        net_income=893.0,
        cash_and_equivalents=288.0,
        marketable_securities=0.0,
        receivables=3030.0,
        inventory=400.0,
        current_assets=7255.0,
        ppe_net=11460.0,
        total_assets=33381.0,
        current_liabilities=6600.0,
        long_term_debt=7151.0,
        total_liabilities=23800.0,
        retained_earnings=2900.0,
        total_equity=9581.0,
        market_value_equity=45000.0,
        cfo=1228.0,
        cfi=-2500.0,
        capex=1800.0,
    )

    t = FinancialLineItems(
        ticker="ENRN",
        fiscal_year=2000,
        revenue=100789.0,  # Massive 150% SGI jump
        cogs=98400.0,
        sga=2800.0,
        depreciation_amortization=855.0,
        operating_income_ebit=1953.0,
        interest_expense=838.0,
        tax_expense=434.0,
        net_income=979.0,
        cash_and_equivalents=1374.0,
        marketable_securities=0.0,
        receivables=10396.0,  # Huge surge in uncollected receivables
        inventory=900.0,
        current_assets=30381.0,
        ppe_net=11735.0,
        total_assets=65503.0,
        current_liabilities=10500.0,
        long_term_debt=8550.0,
        total_liabilities=54000.0,
        retained_earnings=3200.0,
        total_equity=11503.0,
        market_value_equity=60000.0,
        cfo=-4779.0,  # Severe negative operating cash flow despite positive net income
        cfi=-3800.0,
        capex=2400.0,
    )
    return t, t_minus_1


@pytest.fixture
def distressed_debtor():
    """Distressed borrower with covenant breaches and aggressive adjustments."""
    t_minus_1 = FinancialLineItems(
        ticker="FAIL",
        fiscal_year=2022,
        revenue=500.0,
        cogs=350.0,
        sga=100.0,
        depreciation_amortization=30.0,
        operating_income_ebit=20.0,
        interest_expense=25.0,
        tax_expense=2.0,
        net_income=-7.0,
        cash_and_equivalents=15.0,
        marketable_securities=0.0,
        receivables=60.0,
        inventory=50.0,
        current_assets=140.0,
        ppe_net=200.0,
        total_assets=380.0,
        current_liabilities=120.0,
        long_term_debt=220.0,
        total_liabilities=350.0,
        retained_earnings=-40.0,
        total_equity=30.0,
        market_value_equity=25.0,
        cfo=10.0,
        cfi=-15.0,
        capex=20.0,
    )

    t = FinancialLineItems(
        ticker="FAIL",
        fiscal_year=2023,
        revenue=420.0,
        cogs=340.0,
        sga=95.0,
        depreciation_amortization=35.0,
        operating_income_ebit=-50.0,
        interest_expense=30.0,
        tax_expense=0.0,
        net_income=-80.0,
        cash_and_equivalents=5.0,
        marketable_securities=0.0,
        receivables=45.0,
        inventory=40.0,
        current_assets=100.0,
        ppe_net=170.0,
        total_assets=310.0,
        current_liabilities=140.0,
        long_term_debt=250.0,
        total_liabilities=400.0,
        retained_earnings=-120.0,
        total_equity=-90.0,
        market_value_equity=10.0,
        cfo=-35.0,
        cfi=-5.0,
        capex=15.0,
        stock_based_compensation=15.0,
        restructuring_charges=25.0,
        litigation_settlements=10.0,
        asset_impairments=12.0,
    )
    return t, t_minus_1


def test_beneish_healthy_control(apple_2023_financials):
    t, t_minus_1 = apple_2023_financials
    res = calculate_beneish_m_score(t, t_minus_1)
    assert not res.is_manipulator_suspect
    assert res.m_score < -1.78
    assert "BENIGN" in res.interpretation


def test_beneish_enron_manipulator(enron_manipulator_financials):
    t, t_minus_1 = enron_manipulator_financials
    res = calculate_beneish_m_score(t, t_minus_1)
    assert res.is_manipulator_suspect
    assert res.m_score > -1.78
    assert res.dsri > 1.2
    assert res.sgi > 2.0
    assert "HIGH RISK" in res.interpretation


def test_sloan_healthy_vs_red_flag(apple_2023_financials, enron_manipulator_financials):
    t_aapl, t_prev_aapl = apple_2023_financials
    res_aapl = calculate_sloan_accrual(t_aapl, t_prev_aapl)
    assert not res_aapl.is_red_flag
    assert res_aapl.accrual_ratio < 0.10

    t_enrn, t_prev_enrn = enron_manipulator_financials
    res_enrn = calculate_sloan_accrual(t_enrn, t_prev_enrn)
    assert res_enrn.is_red_flag
    assert res_enrn.accrual_ratio > 0.10
    assert "DANGER" in res_enrn.explanation


def test_sloan_low_accruals():
    """Test conservative high-cash company where accrual ratio is < -10%."""
    t_prev = FinancialLineItems(
        ticker="CASH", fiscal_year=2022, revenue=100.0, cogs=50.0, sga=20.0,
        operating_income_ebit=30.0, net_income=20.0, cash_and_equivalents=50.0,
        receivables=10.0, current_assets=70.0, ppe_net=30.0, total_assets=100.0,
        current_liabilities=20.0, total_liabilities=20.0, total_equity=80.0, cfo=50.0
    )
    t = FinancialLineItems(
        ticker="CASH", fiscal_year=2023, revenue=120.0, cogs=60.0, sga=25.0,
        operating_income_ebit=35.0, net_income=25.0, cash_and_equivalents=80.0,
        receivables=12.0, current_assets=100.0, ppe_net=35.0, total_assets=135.0,
        current_liabilities=25.0, total_liabilities=25.0, total_equity=110.0, cfo=60.0
    )
    sloan = calculate_sloan_accrual(t, t_prev)
    assert sloan.accrual_ratio < -0.10
    assert "EXCELLENT" in sloan.explanation


def test_altman_z_score_distress(apple_2023_financials, distressed_debtor):
    t_aapl, _ = apple_2023_financials
    z_aapl = calculate_altman_z_score(t_aapl)
    assert z_aapl.z_score > 2.99
    assert not z_aapl.is_distressed
    assert "Safe" in z_aapl.zone

    t_distress, _ = distressed_debtor
    z_distress = calculate_altman_z_score(t_distress)
    assert z_distress.is_distressed
    assert z_distress.z_score < 1.81
    assert "Distress" in z_distress.zone


def test_altman_grey_zone():
    t_grey = FinancialLineItems(
        ticker="GREY", fiscal_year=2023, revenue=100.0, cogs=70.0, sga=15.0,
        operating_income_ebit=15.0, net_income=8.0, cash_and_equivalents=10.0,
        receivables=20.0, current_assets=40.0, ppe_net=60.0, total_assets=100.0,
        current_liabilities=30.0, total_liabilities=60.0, retained_earnings=10.0,
        total_equity=40.0, market_value_equity=50.0, cfo=10.0
    )
    z = calculate_altman_z_score(t_grey)
    assert 1.81 <= z.z_score <= 2.99
    assert "Grey" in z.zone


def test_ebitda_bridge_aggressive_addbacks(distressed_debtor):
    t, _ = distressed_debtor
    bridge = calculate_ebitda_bridge(t)
    assert bridge.gaap_ebitda < 0
    assert bridge.adjusted_ebitda > bridge.gaap_ebitda
    assert bridge.is_aggressive_adjustment
    assert "Goodwill / Asset Impairment" in bridge.add_backs
    assert len(bridge.flags) >= 1


def test_ebitda_dilution_hazard():
    """Test case where stock-based comp is > 50% of Adjusted EBITDA."""
    t = FinancialLineItems(
        ticker="TECH", fiscal_year=2023, revenue=100.0, cogs=40.0, sga=50.0,
        operating_income_ebit=10.0, interest_expense=2.0, tax_expense=1.0,
        net_income=7.0, depreciation_amortization=3.0, cash_and_equivalents=20.0,
        receivables=15.0, current_assets=45.0, ppe_net=20.0, total_assets=65.0,
        current_liabilities=15.0, total_liabilities=15.0, total_equity=50.0, cfo=5.0,
        stock_based_compensation=15.0  # Big SBC relative to EBITDA
    )
    bridge = calculate_ebitda_bridge(t)
    assert any("DILUTION HAZARD" in f for f in bridge.flags)


def test_covenant_headroom_breaches_and_tight_headroom(distressed_debtor):
    t, _ = distressed_debtor
    bridge = calculate_ebitda_bridge(t)
    cov = calculate_covenant_headroom(t, bridge)
    assert cov.overall_covenant_status == "TECHNICAL_DEFAULT"
    assert cov.interest_coverage_breached

    # Tight headroom scenario
    t_tight = FinancialLineItems(
        ticker="TIGHT", fiscal_year=2023, revenue=200.0, cogs=120.0, sga=40.0,
        operating_income_ebit=40.0, interest_expense=12.0, tax_expense=5.0,
        net_income=23.0, depreciation_amortization=10.0, cash_and_equivalents=10.0,
        receivables=25.0, current_assets=50.0, ppe_net=100.0, total_assets=150.0,
        current_liabilities=40.0, long_term_debt=170.0, total_liabilities=210.0,
        total_equity=-60.0, cfo=30.0, capex=10.0
    )
    bridge_tight = calculate_ebitda_bridge(t_tight)
    cov_tight = calculate_covenant_headroom(t_tight, bridge_tight, leverage_threshold=3.75)
    assert cov_tight.overall_covenant_status in ["TIGHT_HEADROOM", "TECHNICAL_DEFAULT"]


def test_quant_engine_orchestration(apple_2023_financials, enron_manipulator_financials):
    t_aapl, t_prev_aapl = apple_2023_financials
    bundle_aapl = run_quant_audit(t_aapl, t_prev_aapl)
    assert bundle_aapl.audit_verdict == "CLEAN"
    assert bundle_aapl.red_flag_count == 0

    t_enrn, t_prev_enrn = enron_manipulator_financials
    bundle_enrn = run_quant_audit(t_enrn, t_prev_enrn)
    assert bundle_enrn.audit_verdict == "HIGH_RISK"
    assert bundle_enrn.red_flag_count >= 3
    assert len(bundle_enrn.critical_signals) >= 2


def test_quant_engine_moderate_risk():
    """Test an entity with 1-2 red flags yielding MODERATE_RISK."""
    # Clean company except for an aggressive non-GAAP restructuring add-back (+1 red flag)
    t_prev = FinancialLineItems(
        ticker="MOD", fiscal_year=2022, revenue=100.0, cogs=50.0, sga=20.0,
        operating_income_ebit=30.0, interest_expense=2.0, tax_expense=4.0, net_income=24.0,
        cash_and_equivalents=20.0, receivables=15.0, current_assets=50.0, ppe_net=50.0,
        total_assets=100.0, current_liabilities=30.0, total_liabilities=30.0,
        retained_earnings=40.0, total_equity=70.0, market_value_equity=300.0, cfo=25.0
    )
    t = FinancialLineItems(
        ticker="MOD", fiscal_year=2023, revenue=105.0, cogs=52.0, sga=21.0,
        operating_income_ebit=30.0, interest_expense=2.0, tax_expense=4.0, net_income=24.0,
        depreciation_amortization=5.0, cash_and_equivalents=20.0, receivables=15.0,
        current_assets=55.0, ppe_net=50.0, total_assets=105.0, current_liabilities=30.0,
        total_liabilities=30.0, retained_earnings=45.0, total_equity=75.0,
        market_value_equity=300.0, cfo=24.0,
        restructuring_charges=15.0,  # > 25% of GAAP EBITDA (35.0) -> +1 flag
    )
    bundle = run_quant_audit(t, t_prev)
    assert bundle.audit_verdict == "MODERATE_RISK"
    assert bundle.red_flag_count == 1


def test_edge_case_zero_division():
    """Ensure safe guards against division by zero."""
    t_zero = FinancialLineItems(
        ticker="ZERO",
        fiscal_year=2023,
        revenue=0.0,
        cogs=0.0,
        sga=0.0,
        depreciation_amortization=0.0,
        operating_income_ebit=0.0,
        net_income=0.0,
        cash_and_equivalents=0.0,
        receivables=0.0,
        current_assets=0.0,
        ppe_net=0.0,
        total_assets=0.0,
        current_liabilities=0.0,
        total_liabilities=0.0,
        total_equity=0.0,
        cfo=0.0,
    )
    t_prev = t_zero.model_copy()
    bundle = run_quant_audit(t_zero, t_prev)
    assert bundle is not None
