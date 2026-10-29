'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { runLiveAudit } from '@/lib/api';
import type { LiveAuditResponse } from '@/lib/types';
import { VerdictBanner } from '@/components/VerdictBanner';
import { FraudScorecard } from '@/components/FraudScorecard';
import { DebateArena } from '@/components/DebateArena';
import { ReviewQueuePanel } from '@/components/ReviewQueuePanel';

function AuditSkeleton() {
  return (
    <div className="max-w-screen-xl mx-auto px-6 py-8 space-y-6 animate-pulse">
      <div className="h-16 skeleton-shimmer rounded w-full" />
      <div className="grid grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-56 skeleton-shimmer rounded" />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="h-80 skeleton-shimmer rounded" />
        <div className="h-80 skeleton-shimmer rounded" />
      </div>
    </div>
  );
}

export default function AuditPage() {
  const params = useParams();
  const router = useRouter();
  const ticker = (params?.ticker as string)?.toUpperCase() ?? '';

  const [data, setData] = useState<LiveAuditResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ticker) return;
    setLoading(true);
    setError(null);

    runLiveAudit(ticker)
      .then(setData)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [ticker]);

  return (
    <div className="min-h-screen bg-terminal-bg">
      {/* Back button */}
      <div className="max-w-screen-xl mx-auto px-6 pt-4">
        <button
          onClick={() => router.push('/')}
          className="text-xs text-terminal-gray hover:text-terminal-green transition-colors flex items-center gap-1"
        >
          ← BACK TO SEARCH
        </button>
      </div>

      {loading && <AuditSkeleton />}

      {error && (
        <div className="max-w-screen-xl mx-auto px-6 py-8">
          <div className="terminal-border-red bg-terminal-surface rounded p-6 text-center">
            <div className="text-terminal-red text-lg font-bold mb-2">
              ✗ AUDIT FAILED
            </div>
            <div className="text-terminal-gray text-sm">{error}</div>
            <div className="text-terminal-gray-dim text-xs mt-2">
              Ticker: {ticker} · Check that the backend is running and the ticker is valid.
            </div>
          </div>
        </div>
      )}

      {data && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          {/* Verdict Banner */}
          <VerdictBanner
            verdict={data.judge_verdict}
            entityName={data.entity_name}
            ticker={data.ticker}
            fiscalYear={data.fiscal_year}
            cached={data.cached}
            accessionNumber={data.accession_number}
          />

          <div className="max-w-screen-xl mx-auto px-6 pb-12 space-y-10">
            {/* Fraud Scorecard */}
            <section>
              <div className="section-header">// QUANTITATIVE FRAUD SCORECARD</div>
              <FraudScorecard scores={data.fraud_risk_score} />
            </section>

            {/* Critical Signals */}
            {data.fraud_risk_score.critical_signals.length > 0 && (
              <section>
                <div className="section-header">// CRITICAL SIGNALS DETECTED</div>
                <div className="flex flex-wrap gap-2">
                  {data.fraud_risk_score.critical_signals.map((sig, i) => (
                    <span
                      key={i}
                      className="text-xs text-terminal-red border border-terminal-red/40 bg-terminal-red/10 px-3 py-1 rounded"
                    >
                      ⚠ {sig}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Debate Arena */}
            {data.debate_turns.length > 0 && (
              <section>
                <div className="section-header">// ADVERSARIAL COMMITTEE DEBATE</div>
                <DebateArena
                  turns={data.debate_turns}
                  factChecks={data.fact_checks}
                />
              </section>
            )}

            {/* Executive Summary */}
            <section>
              <div className="section-header">// JUDGE EXECUTIVE SUMMARY</div>
              <div className="bg-terminal-surface terminal-border rounded p-6 text-terminal-gray leading-relaxed text-sm italic">
                "{data.judge_verdict.executive_summary}"
              </div>
            </section>

            {/* Agreed Facts + Disputed Theses */}
            <section>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="section-header">// AGREED FACTS</div>
                  <ul className="space-y-2">
                    {data.judge_verdict.agreed_facts.map((fact, i) => (
                      <li
                        key={i}
                        className="text-sm text-terminal-gray flex gap-2 items-start"
                      >
                        <span className="text-terminal-green mt-0.5 shrink-0">✓</span>
                        <span>{fact}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="section-header">// DISPUTED THESES</div>
                  {data.judge_verdict.disputed_theses.length === 0 ? (
                    <p className="text-sm text-terminal-gray-dim italic">
                      No material disputes.
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {data.judge_verdict.disputed_theses.map((thesis, i) => (
                        <li
                          key={i}
                          className="text-sm text-terminal-gray flex gap-2 items-start"
                        >
                          <span className="text-terminal-amber mt-0.5 shrink-0">⚡</span>
                          <span>{thesis}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </section>

            {/* Human Review Queue (only when flagged) */}
            {data.judge_verdict.human_review_required && (
              <section>
                <div className="section-header text-terminal-amber">
                  // ⚠ HUMAN REVIEW QUEUE — LOW-CONFIDENCE EXTRACTIONS
                </div>
                <ReviewQueuePanel />
              </section>
            )}

            {/* Audit Metadata */}
            <section className="border-t border-terminal-border pt-6">
              <div className="text-xs text-terminal-gray-dim space-y-1">
                <div>AUDIT ID: {data.audit_id}</div>
                <div>ACCESSION: {data.accession_number}</div>
                <div>
                  REPORT:{' '}
                  <a
                    href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${data.report_url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-terminal-green-dim hover:text-terminal-green"
                  >
                    {data.report_url} ↗
                  </a>
                </div>
              </div>
            </section>
          </div>
        </motion.div>
      )}
    </div>
  );
}
