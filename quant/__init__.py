"""Deterministic quantitative forensic financial analysis package."""

from quant.models import (
    FinancialLineItems,
    BeneishIndices,
    SloanAccrualResult,
    AltmanZResult,
    EbitdaBridgeResult,
    CovenantHeadroomResult,
    QuantAuditBundle,
)
from quant.beneish import calculate_beneish_m_score
from quant.sloan import calculate_sloan_accrual
from quant.altman import calculate_altman_z_score
from quant.ebitda_bridge import calculate_ebitda_bridge
from quant.covenants import calculate_covenant_headroom
from quant.engine import run_quant_audit

__all__ = [
    "FinancialLineItems",
    "BeneishIndices",
    "SloanAccrualResult",
    "AltmanZResult",
    "EbitdaBridgeResult",
    "CovenantHeadroomResult",
    "QuantAuditBundle",
    "calculate_beneish_m_score",
    "calculate_sloan_accrual",
    "calculate_altman_z_score",
    "calculate_ebitda_bridge",
    "calculate_covenant_headroom",
    "run_quant_audit",
]
