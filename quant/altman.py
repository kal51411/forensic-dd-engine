"""Altman Z-Score module for balance sheet solvency and insolvency risk.

Edward Altman (1968) discriminant analysis model for predicting corporate bankruptcy.
Distress cutoffs:
- Z < 1.81: Distress Zone (high default probability)
- 1.81 <= Z <= 2.99: Grey Zone
- Z > 2.99: Safe Zone
"""

from quant.models import FinancialLineItems, AltmanZResult


def calculate_altman_z_score(
    t: FinancialLineItems,
) -> AltmanZResult:
    """Calculate the 5 ratios and composite Altman Z-Score.

    Args:
        t: Financial statement line items for current period.

    Returns:
        AltmanZResult containing ratios, score, zone classification, and distress flag.
    """
    total_assets = max(t.total_assets, 1.0)
    total_liabilities = max(t.total_liabilities, 1.0)

    # X1: Working Capital / Total Assets
    working_capital = t.current_assets - t.current_liabilities
    x1 = working_capital / total_assets

    # X2: Retained Earnings / Total Assets
    x2 = t.retained_earnings / total_assets

    # X3: EBIT / Total Assets
    x3 = t.operating_income_ebit / total_assets

    # X4: Market Value of Equity (or Book Value if unlisted) / Total Liabilities
    equity_val = (
        t.market_value_equity
        if t.market_value_equity is not None and t.market_value_equity > 0
        else t.total_equity
    )
    x4 = max(equity_val, 0.0) / total_liabilities

    # X5: Sales / Total Assets
    x5 = t.revenue / total_assets

    # Composite Z-Score
    z_score = 1.2 * x1 + 1.4 * x2 + 3.3 * x3 + 0.6 * x4 + 0.999 * x5

    if z_score < 1.81:
        zone = "Distress Zone (High Insolvency Risk)"
        is_distressed = True
    elif z_score <= 2.99:
        zone = "Grey Zone (Moderate Solvency Risk)"
        is_distressed = False
    else:
        zone = "Safe Zone (Low Default Risk)"
        is_distressed = False

    return AltmanZResult(
        x1_working_capital_to_assets=round(x1, 4),
        x2_retained_earnings_to_assets=round(x2, 4),
        x3_ebit_to_assets=round(x3, 4),
        x4_equity_to_liabilities=round(x4, 4),
        x5_sales_to_assets=round(x5, 4),
        z_score=round(z_score, 4),
        zone=zone,
        is_distressed=is_distressed,
    )
