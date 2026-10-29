"""Graph ontology schema definitions for SEC forensic knowledge graph."""

from enum import Enum
from typing import Dict, List, Any
from pydantic import BaseModel


class NodeLabel(str, Enum):
    COMPANY = "Company"
    FILING = "Filing"
    ITEM_CHUNK = "ItemChunk"
    FINANCIAL_METRIC = "FinancialMetric"
    AUDITOR = "Auditor"
    OFFICER = "Officer"
    RISK_FACTOR = "RiskFactor"


class RelType(str, Enum):
    FILED = "FILED"
    HAS_ITEM = "HAS_ITEM"
    HAS_METRIC = "HAS_METRIC"
    AUDITED_BY = "AUDITED_BY"
    HAS_OFFICER = "HAS_OFFICER"
    DISCLOSES_RISK = "DISCLOSES_RISK"
