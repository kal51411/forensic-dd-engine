"""Financial data models and typed schemas for deterministic audit functions."""

from typing import Dict, List, Optional
from pydantic import BaseModel, Field


class FinancialLineItems(BaseModel):
    """Normalized financial line items for a single fiscal period."""
    ticker: str
    fiscal_year: int
    period: str = "FY"  # FY, Q1, Q2, Q3, Q4

    # Income Statement
    revenue: float = Field(..., description="Total Net Sales / Revenue")
    cogs: float = Field(..., description="Cost of Goods Sold")
    sga: float = Field(..., description="Selling, General & Administrative Expense")
    depreciation_amortization: float = Field(0.0, description="Depreciation and Amortization")
    operating_income_ebit: float = Field(..., description="Operating Income / EBIT")
    interest_expense: float = Field(0.0, description="Interest Expense")
    tax_expense: float = Field(0.0, description="Income Tax Expense")
    net_income: float = Field(..., description="Net Income (GAAP)")

    # Balance Sheet
    cash_and_equivalents: float = Field(..., description="Cash and Cash Equivalents")
    marketable_securities: float = Field(0.0, description="Short-term Marketable Securities")
    receivables: float = Field(..., description="Net Accounts Receivable")
    inventory: float = Field(0.0, description="Inventories")
    current_assets: float = Field(..., description="Total Current Assets")
    ppe_net: float = Field(..., description="Property, Plant & Equipment (Net)")
    total_assets: float = Field(..., description="Total Assets")
    current_liabilities: float = Field(..., description="Total Current Liabilities")
    long_term_debt: float = Field(0.0, description="Long-term Debt (Non-current)")
    total_liabilities: float = Field(..., description="Total Liabilities")
    retained_earnings: float = Field(0.0, description="Retained Earnings")
    total_equity: float = Field(..., description="Total Shareholders' Equity")
    market_value_equity: Optional[float] = Field(None, description="Market Capitalization")

    # Cash Flow
    cfo: float = Field(..., description="Cash Flow from Operating Activities (CFO)")
    cfi: float = Field(0.0, description="Cash Flow from Investing Activities (CFI)")
    capex: float = Field(0.0, description="Capital Expenditures")

    # Discretionary / Bridge Add-backs
    stock_based_compensation: float = Field(0.0, description="Stock-based Compensation Expense")
    restructuring_charges: float = Field(0.0, description="Restructuring and Severance")
    litigation_settlements: float = Field(0.0, description="One-off Legal Settlements")
    asset_impairments: float = Field(0.0, description="Goodwill / Asset Impairment Charges")


class BeneishIndices(BaseModel):
    """Beneish 8-Factor M-Score Breakdown."""
    dsri: float = Field(..., description="Days Sales in Receivables Index")
    gmi: float = Field(..., description="Gross Margin Index")
    aqi: float = Field(..., description="Asset Quality Index")
    sgi: float = Field(..., description="Sales Growth Index")
    depi: float = Field(..., description="Depreciation Index")
    sgai: float = Field(..., description="Sales General & Administrative Expenses Index")
    lvgi: float = Field(..., description="Leverage Index")
    tata: float = Field(..., description="Total Accruals to Total Assets")
    m_score: float = Field(..., description="Beneish M-Score")
    is_manipulator_suspect: bool = Field(..., description="True if M-Score > -1.78")
    interpretation: str


class SloanAccrualResult(BaseModel):
    """Sloan Accruals Anomaly Result."""
    accrual_amount: float
    accrual_ratio: float = Field(..., description="Accruals divided by Average Total Assets")
    percentile_bucket: str = Field(..., description="Low (< -10%), Normal (-10% to +10%), High Anomaly (> +10%)")
    is_red_flag: bool = Field(..., description="True if accrual ratio > 0.10")
    explanation: str


class AltmanZResult(BaseModel):
    """Altman Z-Score Distress Result."""
    x1_working_capital_to_assets: float
    x2_retained_earnings_to_assets: float
    x3_ebit_to_assets: float
    x4_equity_to_liabilities: float
    x5_sales_to_assets: float
    z_score: float
    zone: str = Field(..., description="Distress (< 1.81), Grey (1.81-2.99), Safe (> 2.99)")
    is_distressed: bool


class EbitdaBridgeResult(BaseModel):
    """GAAP Net Income to Adjusted EBITDA Reconciliation Bridge."""
    net_income: float
    interest_expense: float
    tax_expense: float
    depreciation_amortization: float
    gaap_ebitda: float
    add_backs: Dict[str, float]
    total_adjustments: float
    adjusted_ebitda: float
    adjustment_ratio_to_ebitda: float = Field(..., description="Total adjustments / GAAP EBITDA")
    is_aggressive_adjustment: bool = Field(..., description="True if adjustments exceed 25% of EBITDA")
    flags: List[str] = []


class CovenantHeadroomResult(BaseModel):
    """Debt Covenant Headroom Analysis."""
    debt_to_ebitda: float
    leverage_covenant_threshold: float = 3.75
    leverage_breached: bool
    leverage_headroom_turns: float

    interest_coverage: float
    interest_coverage_covenant_threshold: float = 3.0
    interest_coverage_breached: bool
    interest_coverage_headroom: float

    fccr: float
    fccr_threshold: float = 1.15
    fccr_breached: bool
    fccr_headroom: float

    overall_covenant_status: str  # "COMPLIANT", "TIGHT_HEADROOM", "TECHNICAL_DEFAULT"


class QuantAuditBundle(BaseModel):
    """Unified immutable output bundle from the deterministic quant engine."""
    ticker: str
    current_year: int
    prior_year: int
    beneish: BeneishIndices
    sloan: SloanAccrualResult
    altman: AltmanZResult
    ebitda_bridge: EbitdaBridgeResult
    covenants: CovenantHeadroomResult
    audit_verdict: str  # "HIGH_RISK", "MODERATE_RISK", "CLEAN"
    red_flag_count: int
    critical_signals: List[str]
