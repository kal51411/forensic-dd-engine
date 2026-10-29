"""Beneish 8-Factor M-Score calculation module.

Beneish (1999) probabilistic model for identifying earnings manipulation.
Cutoff: M-Score > -1.78 signals high probability of manipulation.
"""

from quant.models import FinancialLineItems, BeneishIndices


def calculate_beneish_m_score(
    t: FinancialLineItems,
    t_minus_1: FinancialLineItems,
) -> BeneishIndices:
    """Calculate the 8 sub-indices and overall Beneish M-Score.

    Args:
        t: Financial statement line items for current period (year t).
        t_minus_1: Financial statement line items for previous period (year t-1).

    Returns:
        BeneishIndices containing all 8 indices and final M-Score.
    """
    # 1. DSRI: Days Sales in Receivables Index
    # (Receivables_t / Sales_t) / (Receivables_{t-1} / Sales_{t-1})
    rec_sales_t = t.receivables / max(t.revenue, 1.0)
    rec_sales_prev = t_minus_1.receivables / max(t_minus_1.revenue, 1.0)
    dsri = rec_sales_t / max(rec_sales_prev, 0.0001)

    # 2. GMI: Gross Margin Index
    # [(Sales_{t-1} - COGS_{t-1}) / Sales_{t-1}] / [(Sales_t - COGS_t) / Sales_t]
    gm_prev = (t_minus_1.revenue - t_minus_1.cogs) / max(t_minus_1.revenue, 1.0)
    gm_t = (t.revenue - t.cogs) / max(t.revenue, 1.0)
    gmi = gm_prev / max(gm_t, 0.0001) if gm_t > 0 else 1.0

    # 3. AQI: Asset Quality Index
    # [1 - (CurrentAssets_t + PP&E_t + Sec_t) / TotalAssets_t] / [1 - (CurrentAssets_{t-1} + PP&E_{t-1} + Sec_{t-1}) / TotalAssets_{t-1}]
    tangible_ratio_t = (t.current_assets + t.ppe_net + t.marketable_securities) / max(t.total_assets, 1.0)
    tangible_ratio_prev = (t_minus_1.current_assets + t_minus_1.ppe_net + t_minus_1.marketable_securities) / max(t_minus_1.total_assets, 1.0)
    non_tangible_t = max(1.0 - tangible_ratio_t, 0.0)
    non_tangible_prev = max(1.0 - tangible_ratio_prev, 0.0)
    if non_tangible_prev > 0.001:
        aqi = non_tangible_t / non_tangible_prev
    else:
        aqi = 1.0 if non_tangible_t <= 0.001 else (1.0 + non_tangible_t)

    # 4. SGI: Sales Growth Index
    # Sales_t / Sales_{t-1}
    sgi = t.revenue / max(t_minus_1.revenue, 1.0)

    # 5. DEPI: Depreciation Index
    # DeprRate_{t-1} / DeprRate_t
    depr_rate_prev = t_minus_1.depreciation_amortization / max(
        t_minus_1.depreciation_amortization + t_minus_1.ppe_net, 1.0
    )
    depr_rate_t = t.depreciation_amortization / max(
        t.depreciation_amortization + t.ppe_net, 1.0
    )
    depi = depr_rate_prev / max(depr_rate_t, 0.0001)

    # 6. SGAI: Sales, General & Administrative Expenses Index
    # (SGA_t / Sales_t) / (SGA_{t-1} / Sales_{t-1})
    sga_sales_t = t.sga / max(t.revenue, 1.0)
    sga_sales_prev = t_minus_1.sga / max(t_minus_1.revenue, 1.0)
    sgai = sga_sales_t / max(sga_sales_prev, 0.0001)

    # 7. LVGI: Leverage Index
    # [(CurrentLiabilities_t + LongTermDebt_t) / TotalAssets_t] / [(CurrentLiabilities_{t-1} + LongTermDebt_{t-1}) / TotalAssets_{t-1}]
    lev_t = (t.current_liabilities + t.long_term_debt) / max(t.total_assets, 1.0)
    lev_prev = (t_minus_1.current_liabilities + t_minus_1.long_term_debt) / max(t_minus_1.total_assets, 1.0)
    lvgi = lev_t / max(lev_prev, 0.0001)

    # 8. TATA: Total Accruals to Total Assets
    # (NetIncome_t - CFO_t) / TotalAssets_t
    tata = (t.net_income - t.cfo) / max(t.total_assets, 1.0)

    # Final Beneish M-Score Calculation
    m_score = (
        -4.84
        + 0.920 * dsri
        + 0.528 * gmi
        + 0.404 * aqi
        + 0.892 * sgi
        + 0.115 * depi
        - 0.172 * sgai
        + 4.037 * tata
        + 0.0327 * lvgi
    )

    is_suspect = m_score > -1.78
    if is_suspect:
        interpretation = (
            f"HIGH RISK OF EARNINGS MANIPULATION (M-Score: {m_score:.2f} > -1.78 threshold). "
            f"Major driving anomalies: DSRI={dsri:.2f}, SGI={sgi:.2f}, TATA={tata:.3f}."
        )
    else:
        interpretation = (
            f"BENIGN (M-Score: {m_score:.2f} <= -1.78). "
            "No systemic statistical fingerprint of accruals manipulation."
        )

    return BeneishIndices(
        dsri=round(dsri, 4),
        gmi=round(gmi, 4),
        aqi=round(aqi, 4),
        sgi=round(sgi, 4),
        depi=round(depi, 4),
        sgai=round(sgai, 4),
        lvgi=round(lvgi, 4),
        tata=round(tata, 4),
        m_score=round(m_score, 4),
        is_manipulator_suspect=is_suspect,
        interpretation=interpretation,
    )
