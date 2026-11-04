import type {
  LiveAuditResponse,
  HumanReviewItem,
} from './types';
import { MOCK_AUDITS, MOCK_REVIEW_QUEUE } from './mockData';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Returns list of pre-configured benchmark and demo tickers.
 */
export function getAvailableTickers(): string[] {
  return ['MSFT', 'NVDA', 'AAPL', 'ENRN', 'TSLA', 'GME'];
}

/** Generic fetch wrapper with error handling */
async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const json = await res.json();
      detail = json?.detail ?? detail;
    } catch {
      // ignore JSON parse error
    }
    throw new Error(detail);
  }

  return res.json() as Promise<T>;
}

/**
 * Trigger an SEC EDGAR audit for a given ticker symbol.
 * Checks backend API first, and immediately falls back to MOCK_AUDITS[cleanTicker]
 * if the backend is unreachable or throws.
 */
export async function runLiveAudit(
  ticker: string,
  forceRefresh = false
): Promise<LiveAuditResponse> {
  const cleanTicker = ticker.toUpperCase().trim();

  try {
    return await apiFetch<LiveAuditResponse>(
      `/audit/live/${encodeURIComponent(cleanTicker)}?force_refresh=${forceRefresh}`,
      { method: 'POST' }
    );
  } catch {
    // Graceful standalone fallback: return real audited benchmark filing
    if (MOCK_AUDITS[cleanTicker]) {
      return MOCK_AUDITS[cleanTicker];
    }
    // Generic fallback for any other custom ticker
    const fallbackTemplate = MOCK_AUDITS['MSFT'];
    if (fallbackTemplate) {
      return {
        ...fallbackTemplate,
        ticker: cleanTicker,
        entity_name: `${cleanTicker} CORP (AUDIT DEMO)`,
        audit_id: `audit_${cleanTicker}_2026_demo`,
        cached: true,
      };
    }
    throw new Error(`No audit data found for ticker: ${cleanTicker}`);
  }
}

/**
 * Perform a side-by-side comparison between two tickers using runLiveAudit.
 */
export async function getCompareAudits(
  tickerA: string,
  tickerB: string
): Promise<{ left: LiveAuditResponse; right: LiveAuditResponse }> {
  const [left, right] = await Promise.all([
    runLiveAudit(tickerA),
    runLiveAudit(tickerB),
  ]);
  return { left, right };
}

/**
 * Fetch all items in the human review queue.
 * Falls back to MOCK_REVIEW_QUEUE if backend is unreachable.
 */
export async function getReviewQueue(): Promise<HumanReviewItem[]> {
  try {
    return await apiFetch<HumanReviewItem[]>('/review-queue');
  } catch {
    return MOCK_REVIEW_QUEUE;
  }
}

/**
 * Resolve a human review item with a verified value.
 */
export async function resolveReviewItem(
  itemId: string,
  resolvedValue: number
): Promise<{ status: string; item_id: string; resolved_value: number }> {
  return apiFetch(`/review-queue/${encodeURIComponent(itemId)}/resolve`, {
    method: 'POST',
    body: JSON.stringify({ resolved_value: resolvedValue }),
  });
}

/**
 * Check if the API backend is reachable.
 */
export async function healthCheck(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/health`, { cache: 'no-store' });
    return res.ok;
  } catch {
    return false;
  }
}
