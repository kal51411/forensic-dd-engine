// TypeScript interfaces matching FastAPI JSON response shapes exactly.
// These types flow from the backend's Pydantic models → frontend components.

export interface Citation {
  chunk_id: string;
  ticker: string;
  item: string;
  /** [char_start, char_end] byte offsets into the source filing text */
  char_span: [number, number];
  excerpt: string;
}

export interface DebateTurn {
  speaker: 'BULL' | 'BEAR';
  thesis: string;
  argument: string;
  /** Numeric figures cited; keys are metric names e.g. "m_score" */
  quantitative_claims: Record<string, number>;
  citations: Citation[];
}

export interface FactCheckVerdict {
  all_quant_claims_verified: boolean;
  all_citations_verified: boolean;
  verified_citations: Citation[];
  discrepancies: string[];
  hallucinated_citations: string[];
}

export interface JudgeVerdict {
  audit_id: string;
  ticker: string;
  fiscal_year: number;
  composite_verdict: 'CRITICAL_RED_FLAG' | 'ELEVATED_RISK' | 'CLEAN_AUDIT';
  confidence_score: number;
  executive_summary: string;
  agreed_facts: string[];
  disputed_theses: string[];
  quant_red_flag_count: number;
  validated_citations: Citation[];
  human_review_required: boolean;
}

export interface FraudRiskScore {
  beneish_m_score: number;
  is_manipulator_suspect: boolean;
  sloan_accrual_ratio: number;
  is_accrual_red_flag: boolean;
  altman_z_score: number;
  solvency_zone: 'SAFE' | 'GREY' | 'DISTRESS';
  red_flag_count: number;
  critical_signals: string[];
}

export interface LiveAuditResponse {
  ticker: string;
  entity_name: string;
  fiscal_year: number;
  accession_number: string;
  audit_id: string;
  cached: boolean;
  verdict: string;
  confidence_score: number;
  fraud_risk_score: FraudRiskScore;
  debate_turns: DebateTurn[];
  fact_checks: FactCheckVerdict[];
  judge_verdict: JudgeVerdict;
  report_url: string;
}

export interface HumanReviewItem {
  item_id: string;
  ticker: string;
  field_name: string;
  raw_extracted_value: number;
  confidence_score: number;
  status: 'PENDING' | 'RESOLVED';
  reason: string;
}

export interface ApiError {
  detail: string;
  status: number;
}
