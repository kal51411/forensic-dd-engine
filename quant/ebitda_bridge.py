"""EBITDA Bridge & Non-GAAP reconciliation integrity module.

Reconciles GAAP Net Income to GAAP EBITDA, itemizes discretionary add-backs,
and evaluates Adjusted EBITDA quality. Flags aggressive non-GAAP exclusions.
"""

from typing import Dict, List
from quant.models import FinancialLineItems, EbitdaBridgeResult


def calculate_ebitda_bridge(
    t: FinancialLineItems,
) -> EbitdaBridgeResult:
    """Perform deterministic GAAP Net Income to Adjusted EBITDA reconciliation.

    Args:
        t: Financial statement line items for current period.

    Returns:
        EbitdaBridgeResult itemizing standard bridge and red flags.
    """
    # 1. Standard GAAP EBITDA
    gaap_ebitda = (
        t.net_income
        + t.interest_expense
        + t.tax_expense
        + t.depreciation_amortization
    )

    # 2. Add-backs
    add_backs: Dict[str, float] = {}
    if t.stock_based_compensation > 0:
        add_backs["Stock-Based Compensation"] = t.stock_based_compensation
    if t.restructuring_charges > 0:
        add_backs["Restructuring & Severance"] = t.restructuring_charges
    if t.litigation_settlements > 0:
        add_backs["Litigation & Legal Settlements"] = t.litigation_settlements
    if t.asset_impairments > 0:
        add_backs["Goodwill / Asset Impairment"] = t.asset_impairments

    total_adjustments = sum(add_backs.values())
    adjusted_ebitda = gaap_ebitda + total_adjustments

    # 3. Aggressiveness & Quality Tests
    flags: List[str] = []
    base_for_ratio = abs(gaap_ebitda) if abs(gaap_ebitda) > 1.0 else 1.0
    adjustment_ratio = total_adjustments / base_for_ratio

    is_aggressive = adjustment_ratio > 0.25

    if gaap_ebitda < 0 < adjusted_ebitda:
        flags.append(
            "CRITICAL: Non-GAAP adjustments converted negative GAAP EBITDA to positive Adjusted EBITDA."
        )

    if adjustment_ratio > 0.25:
        flags.append(
            f"HIGH ADD-BACK RATIO: Management adjustments represent {adjustment_ratio:.1%} of GAAP EBITDA."
        )

    if t.stock_based_compensation > 0.5 * max(adjusted_ebitda, 1.0):
        flags.append(
            "DILUTION HAZARD: Stock-based compensation accounts for > 50% of Adjusted EBITDA."
        )

    return EbitdaBridgeResult(
        net_income=round(t.net_income, 2),
        interest_expense=round(t.interest_expense, 2),
        tax_expense=round(t.tax_expense, 2),
        depreciation_amortization=round(t.depreciation_amortization, 2),
        gaap_ebitda=round(gaap_ebitda, 2),
        add_backs=add_backs,
        total_adjustments=round(total_adjustments, 2),
        adjusted_ebitda=round(adjusted_ebitda, 2),
        adjustment_ratio_to_ebitda=round(adjustment_ratio, 4),
        is_aggressive_adjustment=is_aggressive,
        flags=flags,
    )
