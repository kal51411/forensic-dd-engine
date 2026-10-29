"""Sloan Accruals Anomaly module.

Richard Sloan (1996) 'Do Stock Prices Fully Reflect Information in Accruals and Cash Flows?'.
Measures the proportion of earnings driven by non-cash accounting accruals vs. realized cash.
High accrual ratio (> 10% of total assets) is a major red flag for earnings quality degradation.
"""

from quant.models import FinancialLineItems, SloanAccrualResult


def calculate_sloan_accrual(
    t: FinancialLineItems,
    t_minus_1: FinancialLineItems,
) -> SloanAccrualResult:
    """Calculate Sloan Accruals and Accrual Ratio against Average Total Assets.

    Args:
        t: Financial statement line items for current period.
        t_minus_1: Financial statement line items for prior period.

    Returns:
        SloanAccrualResult with ratio, anomaly classification, and explanation.
    """
    avg_total_assets = (t.total_assets + t_minus_1.total_assets) / 2.0
    if avg_total_assets <= 0:
        avg_total_assets = max(t.total_assets, 1.0)

    # Cash Flow statement method: Net Income - CFO
    # Incorporates net non-cash earnings adjustments
    accrual_amount = t.net_income - t.cfo
    accrual_ratio = accrual_amount / avg_total_assets

    if accrual_ratio > 0.10:
        bucket = "High Accrual Anomaly (Top Decile > +10%)"
        is_red_flag = True
        explanation = (
            f"DANGER: Accrual ratio is {accrual_ratio:.1%}. Net income significantly exceeds "
            f"operating cash flow (Gap: ${accrual_amount:,.0f}). Earnings are largely composed of "
            "paper accounting accruals rather than cash generation."
        )
    elif accrual_ratio < -0.10:
        bucket = "Low Accrual / High Cash Conversion (< -10%)"
        is_red_flag = False
        explanation = (
            f"EXCELLENT: Accrual ratio is {accrual_ratio:.1%}. Cash generation significantly "
            "exceeds recognized net income, signaling conservative accounting."
        )
    else:
        bucket = "Normal Accrual Distribution (-10% to +10%)"
        is_red_flag = False
        explanation = (
            f"NORMAL: Accrual ratio is {accrual_ratio:.1%}. Earnings are supported by "
            "commensurate operating cash flows."
        )

    return SloanAccrualResult(
        accrual_amount=round(accrual_amount, 2),
        accrual_ratio=round(accrual_ratio, 4),
        percentile_bucket=bucket,
        is_red_flag=is_red_flag,
        explanation=explanation,
    )
