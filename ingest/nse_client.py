"""NSE / Yahoo Finance Ingestion Client for Indian Equities (ITC, IDBI, RELIANCE, etc.)."""

import pandas as pd
import yfinance as yf
from typing import Tuple, List, Dict, Any
from quant.models import FinancialLineItems, QuantAuditBundle
from quant.engine import run_quant_audit
from ingest.models import FilingChunk
from ingest.chunker import chunk_filing_item

class NSEClient:
    """Fetcher for NSE-listed companies using yfinance financial statements."""

    @staticmethod
    def ingest_and_audit_nse_ticker(ticker: str) -> Tuple[QuantAuditBundle, List[FilingChunk], Dict[str, Any], bool]:
        ticker_clean = ticker.upper()
        if not ticker_clean.endswith(".NS") and not ticker_clean.endswith(".BO"):
            symbol = f"{ticker_clean}.NS"
        else:
            symbol = ticker_clean

        stock = yf.Ticker(symbol)
        
        financials = stock.financials
        balance_sheet = stock.balance_sheet
        cashflow = stock.cashflow
        info = stock.info

        entity_name = info.get("longName", ticker_clean)
        market_cap = info.get("marketCap", None)

        if financials is None or financials.empty:
            raise ValueError(f"Could not retrieve financial statements for NSE ticker {ticker_clean} ({symbol}).")

        years = sorted([col.year for col in financials.columns], reverse=True)
        if len(years) < 1:
            raise ValueError(f"Insufficient annual financial data for {ticker_clean}.")

        latest_year = years[0]
        prior_year = years[1] if len(years) >= 2 else latest_year - 1

        def get_item(df, possible_keys, year):
            if df is None or df.empty:
                return 0.0
            col = next((c for c in df.columns if c.year == year), None)
            if col is None:
                return 0.0
            for k in possible_keys:
                if k in df.index:
                    val = df.loc[k, col]
                    if pd.notna(val):
                        return float(val)
            return 0.0

        def extract_year_items(yr: int) -> FinancialLineItems:
            scale = 1_000_000.0  # Millions INR

            rev = get_item(financials, ["Total Revenue", "Operating Revenue", "Revenue"], yr) / scale
            cogs = get_item(financials, ["Cost Of Goods Sold", "Total Expenses", "Cost Of Revenue"], yr) / scale
            sga = get_item(financials, ["Selling General And Administrative", "Operating Expense"], yr) / scale
            da = get_item(financials, ["Reconciled Depreciation", "Depreciation And Amortization In Income Statement", "Depreciation"], yr) / scale
            ebit = get_item(financials, ["Operating Income", "EBIT"], yr) / scale
            interest = get_item(financials, ["Interest Expense", "Net Interest Income"], yr) / scale
            tax = get_item(financials, ["Tax Provision", "Income Tax Expense"], yr) / scale
            net_inc = get_item(financials, ["Net Income", "Net Income Common Stockholders"], yr) / scale

            cash = get_item(balance_sheet, ["Cash And Cash Equivalents", "Cash Financial"], yr) / scale
            sec = get_item(balance_sheet, ["Marketable Securities", "Short Term Investments"], yr) / scale
            receiv = get_item(balance_sheet, ["Accounts Receivable", "Receivables"], yr) / scale
            inv = get_item(balance_sheet, ["Inventory"], yr) / scale
            curr_assets = get_item(balance_sheet, ["Current Assets", "Total Current Assets"], yr) / scale
            ppe = get_item(balance_sheet, ["Net PPE", "Property Plant And Equipment Net"], yr) / scale
            tot_assets = get_item(balance_sheet, ["Total Assets"], yr) / scale
            curr_liab = get_item(balance_sheet, ["Current Liabilities", "Total Current Liabilities"], yr) / scale
            lt_debt = get_item(balance_sheet, ["Long Term Debt", "Total Debt"], yr) / scale
            tot_liab = get_item(balance_sheet, ["Total Liabilities Net Minority Interest", "Total Liabilities"], yr) / scale
            retained = get_item(balance_sheet, ["Retained Earnings"], yr) / scale
            equity = get_item(balance_sheet, ["Stockholders Equity", "Common Stock Equity"], yr) / scale
            mve = (market_cap / scale) if market_cap else (equity * 1.5)

            cfo = get_item(cashflow, ["Operating Cash Flow", "Cash Flow From Continuing Operating Activities"], yr) / scale
            cfi = get_item(cashflow, ["Investing Cash Flow", "Cash Flow From Continuing Investing Activities"], yr) / scale
            capex = abs(get_item(cashflow, ["Capital Expenditures", "Purchase Of Property Plant And Equipment"], yr)) / scale

            return FinancialLineItems(
                ticker=ticker_clean,
                fiscal_year=yr,
                period="FY",
                revenue=rev,
                cogs=cogs,
                sga=sga,
                depreciation_amortization=da,
                operating_income_ebit=ebit if ebit != 0 else (rev - cogs - sga),
                interest_expense=interest,
                tax_expense=tax,
                net_income=net_inc,
                cash_and_equivalents=cash,
                marketable_securities=sec,
                receivables=receiv,
                inventory=inv,
                current_assets=curr_assets if curr_assets != 0 else (cash + receiv + inv),
                ppe_net=ppe,
                total_assets=tot_assets if tot_assets != 0 else (curr_assets + ppe),
                current_liabilities=curr_liab,
                long_term_debt=lt_debt,
                total_liabilities=tot_liab if tot_liab != 0 else curr_liab,
                retained_earnings=retained,
                total_equity=equity if equity != 0 else (tot_assets - tot_liab),
                market_value_equity=mve,
                cfo=cfo,
                cfi=cfi,
                capex=capex
            )

        items_t = extract_year_items(latest_year)
        items_prior = extract_year_items(prior_year)

        quant_bundle = run_quant_audit(items_t, items_prior)

        summary_text = (
            f"NSE Annual Report for {entity_name} ({ticker_clean}) for fiscal year {latest_year}. "
            f"Total revenue reached ₹{items_t.revenue:,.1f} million vs ₹{items_prior.revenue:,.1f} million. "
            f"Operating profit (EBIT) was ₹{items_t.operating_income_ebit:,.1f} million. "
            f"Operating cash flow (CFO) was ₹{items_t.cfo:,.1f} million. "
            f"Total assets stood at ₹{items_t.total_assets:,.1f} million with total liabilities of ₹{items_t.total_liabilities:,.1f} million."
        )

        chunks = chunk_filing_item(ticker_clean, f"NSE-{latest_year}", latest_year, "Annual Financial Review", summary_text)

        metadata = {
            "ticker": ticker_clean,
            "entity_name": entity_name,
            "fiscal_year": latest_year,
            "prior_year": prior_year,
            "exchange": "NSE",
            "currency": "INR",
        }

        return quant_bundle, chunks, metadata, False
