"""Unified deterministic quant audit orchestrator."""

from typing import List
from quant.models import FinancialLineItems, QuantAuditBundle
from quant.beneish import calculate_beneish_m_score
from quant.sloan import calculate_sloan_accrual
from quant.altman import calculate_altman_z_score
from quant.ebitda_bridge import calculate_ebitda_bridge
from quant.covenants import calculate_covenant_headroom


def run_quant_audit(
    t: FinancialLineItems,
    t_minus_1: FinancialLineItems,
) -> QuantAuditBundle:
    """Execute complete deterministic quantitative audit across both periods.

    Args:
        t: FinancialLineItems for current year.
        t_minus_1: FinancialLineItems for prior year.

    Returns:
        QuantAuditBundle containing full suite of calculations, anomaly triggers, and verdict.
    """
    beneish = calculate_beneish_m_score(t, t_minus_1)
    sloan = calculate_sloan_accrual(t, t_minus_1)
    altman = calculate_altman_z_score(t)
    ebitda_bridge = calculate_ebitda_bridge(t)
    covenants = calculate_covenant_headroom(t, ebitda_bridge)

    critical_signals: List[str] = []
    red_flag_count = 0

    if beneish.is_manipulator_suspect:
        red_flag_count += 2
        critical_signals.append(
            f"Beneish M-Score of {beneish.m_score:.2f} exceeds manipulation threshold (-1.78)."
        )

    if sloan.is_red_flag:
        red_flag_count += 1
        critical_signals.append(
            f"Sloan Accrual ratio ({sloan.accrual_ratio:.1%}) indicates severe earnings-to-cash decoupling."
        )

    if altman.is_distressed:
        red_flag_count += 2
        critical_signals.append(
            f"Altman Z-Score ({altman.z_score:.2f}) indicates acute solvency distress."
        )

    if ebitda_bridge.is_aggressive_adjustment:
        red_flag_count += 1
        critical_signals.append(
            f"EBITDA adjustments represent {ebitda_bridge.adjustment_ratio_to_ebitda:.1%} of GAAP EBITDA."
        )

    if covenants.overall_covenant_status == "TECHNICAL_DEFAULT":
        red_flag_count += 2
        critical_signals.append("Technical default or breach detected in credit covenants.")
    elif covenants.overall_covenant_status == "TIGHT_HEADROOM":
        red_flag_count += 1
        critical_signals.append("Debt covenants indicate razor-thin headroom (< 0.5 turns).")

    # Determine overall audit verdict
    if red_flag_count >= 3:
        verdict = "HIGH_RISK"
    elif red_flag_count >= 1:
        verdict = "MODERATE_RISK"
    else:
        verdict = "CLEAN"

    return QuantAuditBundle(
        ticker=t.ticker,
        current_year=t.fiscal_year,
        prior_year=t_minus_1.fiscal_year,
        beneish=beneish,
        sloan=sloan,
        altman=altman,
        ebitda_bridge=ebitda_bridge,
        covenants=covenants,
        audit_verdict=verdict,
        red_flag_count=red_flag_count,
        critical_signals=critical_signals,
    )
