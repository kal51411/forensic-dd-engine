"""Debt covenant analysis and headroom compliance engine.

Calculates key credit agreement metrics:
- Debt to EBITDA (Leverage Ratio)
- Interest Coverage Ratio (EBIT / Interest Expense)
- Fixed Charge Coverage Ratio (FCCR)
Measures distance to covenant breach (headroom) and flags technical default risk.
"""

from quant.models import FinancialLineItems, CovenantHeadroomResult, EbitdaBridgeResult


def calculate_covenant_headroom(
    t: FinancialLineItems,
    bridge: EbitdaBridgeResult,
    leverage_threshold: float = 3.75,
    interest_coverage_threshold: float = 3.0,
    fccr_threshold: float = 1.15,
) -> CovenantHeadroomResult:
    """Calculate debt covenant headroom and breach status.

    Args:
        t: Financial statement line items for current period.
        bridge: Calculated EBITDA bridge result for period.
        leverage_threshold: Max permissible Debt/EBITDA multiple (default 3.75x).
        interest_coverage_threshold: Min permissible EBIT/Interest multiple (default 3.0x).
        fccr_threshold: Min permissible FCCR (default 1.15x).

    Returns:
        CovenantHeadroomResult with headroom margins and compliance classification.
    """
    funded_debt = t.long_term_debt + (t.current_liabilities * 0.25)  # estimate short-term funded debt
    ebitda = bridge.adjusted_ebitda

    # 1. Leverage Ratio: Total Debt / Adjusted EBITDA
    if ebitda > 0:
        debt_to_ebitda = funded_debt / ebitda
        leverage_breached = debt_to_ebitda > leverage_threshold
        leverage_headroom = leverage_threshold - debt_to_ebitda
    else:
        # Negative EBITDA with debt is automatically breached
        debt_to_ebitda = 99.9
        leverage_breached = funded_debt > 0
        leverage_headroom = -99.9

    # 2. Interest Coverage: Operating Income / Interest Expense
    interest = max(t.interest_expense, 0.001)
    interest_coverage = t.operating_income_ebit / interest
    interest_coverage_breached = interest_coverage < interest_coverage_threshold
    interest_coverage_headroom = interest_coverage - interest_coverage_threshold

    # 3. Fixed Charge Coverage Ratio (FCCR)
    # (Adjusted EBITDA - CapEx - Cash Taxes) / (Debt Service + Interest)
    numerator = ebitda - t.capex - t.tax_expense
    denominator = max(t.interest_expense + (funded_debt * 0.05), 1.0)  # assume 5% amortization
    fccr = numerator / denominator
    fccr_breached = fccr < fccr_threshold
    fccr_headroom = fccr - fccr_threshold

    # Overall Status Evaluation
    if leverage_breached or interest_coverage_breached or fccr_breached:
        status = "TECHNICAL_DEFAULT"
    elif leverage_headroom < 0.5 or interest_coverage_headroom < 0.5 or fccr_headroom < 0.2:
        status = "TIGHT_HEADROOM"
    else:
        status = "COMPLIANT"

    return CovenantHeadroomResult(
        debt_to_ebitda=round(debt_to_ebitda, 2),
        leverage_covenant_threshold=leverage_threshold,
        leverage_breached=leverage_breached,
        leverage_headroom_turns=round(leverage_headroom, 2),
        interest_coverage=round(interest_coverage, 2),
        interest_coverage_covenant_threshold=interest_coverage_threshold,
        interest_coverage_breached=interest_coverage_breached,
        interest_coverage_headroom=round(interest_coverage_headroom, 2),
        fccr=round(fccr, 2),
        fccr_threshold=fccr_threshold,
        fccr_breached=fccr_breached,
        fccr_headroom=round(fccr_headroom, 2),
        overall_covenant_status=status,
    )
