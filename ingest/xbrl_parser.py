"""XBRL Financial Statement parser with sign normalization and confidence scoring."""

from typing import Dict, Tuple, List, Optional
from quant.models import FinancialLineItems
from ingest.models import ExtractionConfidence, HumanReviewItem


class XBRLParser:
    """Parses raw XBRL or structured tag dictionaries into normalized FinancialLineItems.

    Enforces sign normalization, cross-statement balance equation validation,
    and automatic routing of ambiguous extractions to the human review queue.
    """

    CONFIDENCE_THRESHOLD: float = 0.85

    @classmethod
    def parse_and_validate(
        cls,
        ticker: str,
        fiscal_year: int,
        raw_facts: Dict[str, float],
    ) -> Tuple[FinancialLineItems, List[ExtractionConfidence], List[HumanReviewItem]]:
        """Parse raw XBRL facts dictionary into FinancialLineItems and audit confidence.

        Args:
            ticker: Ticker symbol.
            fiscal_year: Fiscal year.
            raw_facts: Dictionary of XBRL tags or normalized concepts and their float values.

        Returns:
            Tuple of (FinancialLineItems, List[ExtractionConfidence], List[HumanReviewItem]).
        """
        confidences: List[ExtractionConfidence] = []
        review_items: List[HumanReviewItem] = []

        def extract_with_confidence(
            key: str,
            default: float = 0.0,
            required: bool = False,
            positive_only: bool = False,
        ) -> float:
            val = raw_facts.get(key)
            if val is None:
                score = 0.5 if required else 0.95
                is_flag = required
                reason = f"Missing required XBRL concept: {key}" if required else None
                actual_val = default
            else:
                score = 1.0
                actual_val = float(val)
                # Sign normalization
                if positive_only and actual_val < 0:
                    actual_val = abs(actual_val)
                    score = 0.88  # slightly reduced confidence due to sign flip

                is_flag = score < cls.CONFIDENCE_THRESHOLD
                reason = None

            conf = ExtractionConfidence(
                cell_name=key,
                raw_value=float(val) if val is not None else 0.0,
                normalized_value=actual_val,
                confidence_score=score,
                is_flagged=is_flag,
                review_reason=reason,
            )
            confidences.append(conf)

            if is_flag:
                review_items.append(
                    HumanReviewItem(
                        item_id=f"{ticker}_{fiscal_year}_{key}",
                        ticker=ticker,
                        fiscal_year=fiscal_year,
                        cell_name=key,
                        extracted_value=actual_val,
                        confidence_score=score,
                        source_item="Item 8 - Financial Statements",
                        flag_reason=reason or "Low confidence extraction",
                    )
                )

            return actual_val

        revenue = extract_with_confidence("revenue", required=True, positive_only=True)
        cogs = extract_with_confidence("cogs", required=True, positive_only=True)
        sga = extract_with_confidence("sga", required=True, positive_only=True)
        depr = extract_with_confidence("depreciation_amortization", positive_only=True)
        ebit = extract_with_confidence("operating_income_ebit", required=True)
        interest = extract_with_confidence("interest_expense", positive_only=True)
        tax = extract_with_confidence("tax_expense")
        net_income = extract_with_confidence("net_income", required=True)

        cash = extract_with_confidence("cash_and_equivalents", required=True, positive_only=True)
        sec = extract_with_confidence("marketable_securities", positive_only=True)
        rec = extract_with_confidence("receivables", required=True, positive_only=True)
        inv = extract_with_confidence("inventory", positive_only=True)
        curr_assets = extract_with_confidence("current_assets", required=True, positive_only=True)
        ppe = extract_with_confidence("ppe_net", required=True, positive_only=True)
        total_assets = extract_with_confidence("total_assets", required=True, positive_only=True)

        curr_liab = extract_with_confidence("current_liabilities", required=True, positive_only=True)
        lt_debt = extract_with_confidence("long_term_debt", positive_only=True)
        total_liab = extract_with_confidence("total_liabilities", required=True, positive_only=True)
        retained = extract_with_confidence("retained_earnings")
        equity = extract_with_confidence("total_equity", required=True)
        mcap = raw_facts.get("market_value_equity")

        cfo = extract_with_confidence("cfo", required=True)
        cfi = extract_with_confidence("cfi")
        capex = extract_with_confidence("capex", positive_only=True)

        sbc = extract_with_confidence("stock_based_compensation", positive_only=True)
        restruct = extract_with_confidence("restructuring_charges", positive_only=True)
        lit = extract_with_confidence("litigation_settlements", positive_only=True)
        impair = extract_with_confidence("asset_impairments", positive_only=True)

        # Cross-statement fundamental accounting equation check:
        # Total Assets == Total Liabilities + Total Equity (within 1% tolerance)
        accounting_diff = abs(total_assets - (total_liab + equity))
        tolerance = max(total_assets * 0.01, 1.0)
        if accounting_diff > tolerance:
            # Balance check failed -> Flag accounting discrepancy for human audit
            confidences.append(
                ExtractionConfidence(
                    cell_name="BALANCE_CHECK_EQUATION",
                    raw_value=accounting_diff,
                    normalized_value=accounting_diff,
                    confidence_score=0.40,
                    is_flagged=True,
                    review_reason=(
                        f"Accounting balance mismatch: Assets ({total_assets:,.0f}) != "
                        f"Liabilities ({total_liab:,.0f}) + Equity ({equity:,.0f}). "
                        f"Difference: ${accounting_diff:,.0f}"
                    ),
                )
            )
            review_items.append(
                HumanReviewItem(
                    item_id=f"{ticker}_{fiscal_year}_BALANCE_MISMATCH",
                    ticker=ticker,
                    fiscal_year=fiscal_year,
                    cell_name="BALANCE_CHECK_EQUATION",
                    extracted_value=accounting_diff,
                    confidence_score=0.40,
                    source_item="Item 8 - Consolidated Balance Sheet",
                    flag_reason=(
                        f"Fundamental equation breach: Assets != Liab + Equity "
                        f"(Diff: ${accounting_diff:,.0f})"
                    ),
                )
            )

        line_items = FinancialLineItems(
            ticker=ticker,
            fiscal_year=fiscal_year,
            revenue=revenue,
            cogs=cogs,
            sga=sga,
            depreciation_amortization=depr,
            operating_income_ebit=ebit,
            interest_expense=interest,
            tax_expense=tax,
            net_income=net_income,
            cash_and_equivalents=cash,
            marketable_securities=sec,
            receivables=rec,
            inventory=inv,
            current_assets=curr_assets,
            ppe_net=ppe,
            total_assets=total_assets,
            current_liabilities=curr_liab,
            long_term_debt=lt_debt,
            total_liabilities=total_liab,
            retained_earnings=retained,
            total_equity=equity,
            market_value_equity=float(mcap) if mcap is not None else None,
            cfo=cfo,
            cfi=cfi,
            capex=capex,
            stock_based_compensation=sbc,
            restructuring_charges=restruct,
            litigation_settlements=lit,
            asset_impairments=impair,
        )

        return line_items, confidences, review_items
