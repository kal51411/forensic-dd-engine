'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { runLiveAudit } from '@/lib/api';
import type { LiveAuditResponse } from '@/lib/types';
import { VerdictBanner } from '@/components/VerdictBanner';
import { FraudScorecard } from '@/components/FraudScorecard';
import { DebateArena } from '@/components/DebateArena';
import { ReviewQueuePanel } from '@/components/ReviewQueuePanel';
import { ShareBar } from '@/components/ShareBar';
import { TimelineProgress } from '@/components/TimelineProgress';

type Tab = 'overview' | 'debate' | 'citations' | 'review';

function LoadingSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6 animate-pulse">
      <div className="h-32 skeleton rounded-xl" />
      <div className="h-6 skeleton rounded w-64" />
      <div className="grid grid-cols-3 gap-4">
        {[0,1,2].map(i => <div key={i} className="h-48 skeleton rounded-xl" />)}
      </div>
      <div className="h-64 skeleton rounded-xl" />
    </div>
  );
}

function BackendOfflinePill() {
  return (
    <div className="inline-flex items-center gap-1.5 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full font-mono">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
      Backend offline · Demo mode
    </div>
  );
}

function AuditNotFound({ ticker }: { ticker: string }) {
  const AVAILABLE = ['MSFT', 'NVDA', 'AAPL', 'TSLA', 'GME', 'ENRN'];
  const router = useRouter();
  return (
    <div className="max-w-2xl mx-auto px-6 py-24 text-center space-y-6">
      <div className="w-16 h-16 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center mx-auto text-2xl">🔍</div>
      <div>
        <h2 className="text-xl font-semibold text-zinc-100">Ticker Not Found</h2>
        <p className="text-zinc-500 text-sm mt-2">No pre-loaded audit dossier for <span className="font-mono text-zinc-300">{ticker}</span>. Try one of the available tickers below.</p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {AVAILABLE.map(t => (
          <button key={t} onClick={() => router.push(`/audit/${t}`)}
            className="font-mono text-sm text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 px-4 py-2 rounded-lg transition-all">
            {t}
          </button>
        ))}
      </div>
      <Link href="/" className="inline-block text-sm text-indigo-400 hover:text-indigo-300 transition-colors">← Back to Audits</Link>
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
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    if (!ticker) return;
    setLoading(true);
    setError(null);
    setActiveTab('overview');
    setIsDemo(false);
    runLiveAudit(ticker)
      .then((result) => {
        // _fromMock is set when the backend was unreachable and mock data was served
        if (result._fromMock) {
          setIsDemo(true);
        }
        setData(result);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [ticker]);

  const tabs: { key: Tab; label: string; badge?: number }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'debate', label: 'Debate Committee', badge: data?.debate_turns.length },
    { key: 'citations', label: 'Source Citations', badge: data?.judge_verdict.validated_citations.length },
    { key: 'review', label: 'Review Queue', badge: data?.judge_verdict.human_review_required ? 1 : undefined },
  ];

  if (loading) return <LoadingSkeleton />;
  if (error || !data) return <AuditNotFound ticker={ticker} />;

  const allCitations = [
    ...data.debate_turns.flatMap(t => t.citations),
    ...data.fact_checks.flatMap(f => f.verified_citations),
    ...data.judge_verdict.validated_citations,
  ].filter((c, i, arr) => arr.findIndex(x => x.chunk_id === c.chunk_id) === i);

  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">

        {/* ── Breadcrumb + Actions ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <nav className="flex items-center gap-2 text-sm text-zinc-500">
            <button onClick={() => router.push('/')} className="hover:text-zinc-300 transition-colors">Audits</button>
            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            <span className="font-mono text-zinc-200 font-semibold">{ticker}</span>
            {isDemo && <BackendOfflinePill />}
          </nav>
          <ShareBar ticker={ticker} verdict={data.verdict} />

        </div>

        {/* ── Verdict Banner ── */}
        <VerdictBanner
          verdict={data.judge_verdict}
          entityName={data.entity_name}
          ticker={data.ticker}
          fiscalYear={data.fiscal_year}
          cached={data.cached}
          accessionNumber={data.accession_number}
        />

        {/* ── Pipeline Timeline ── */}
        <div className="card p-5">
          <div className="section-label mb-4">Audit Pipeline</div>
          <TimelineProgress activeStep={-1} />
        </div>

        {/* ── Tabs ── */}
        <div className="border-b border-zinc-800">
          <div className="flex gap-1 overflow-x-auto scrollbar-none -mb-px">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`tab-btn flex items-center gap-1.5 ${activeTab === tab.key ? 'active' : ''}`}
              >
                {tab.label}
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="text-xs bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded-full font-mono">{tab.badge}</span>
                )}
                {tab.key === 'review' && data.judge_verdict.human_review_required && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ── Tab Panels ── */}
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.2 }}>

            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Critical signals */}
                {data.fraud_risk_score.critical_signals.length > 0 && (
                  <div className="card p-5 border-rose-500/30 bg-rose-500/5">
                    <div className="section-label text-rose-400/70 mb-3">Critical Signals Detected</div>
                    <div className="flex flex-wrap gap-2">
                      {data.fraud_risk_score.critical_signals.map((sig, i) => (
                        <span key={i} className="text-xs text-rose-300 bg-rose-500/10 border border-rose-500/20 px-3 py-1 rounded-full">⚠ {sig}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Fraud scorecard */}
                <div>
                  <div className="section-label mb-4">Quantitative Risk Models</div>
                  <FraudScorecard scores={data.fraud_risk_score} />
                </div>

                {/* Executive summary */}
                <div className="card p-6 space-y-4">
                  <div className="section-label">Judge Executive Summary</div>
                  <p className="text-zinc-300 text-sm leading-relaxed">{data.judge_verdict.executive_summary}</p>
                </div>

                {/* Agreed / Disputed */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="card p-5">
                    <div className="section-label mb-3">Agreed Facts</div>
                    <ul className="space-y-2.5">
                      {data.judge_verdict.agreed_facts.map((f, i) => (
                        <li key={i} className="flex gap-2.5 text-sm text-zinc-400">
                          <span className="text-emerald-500 mt-0.5 shrink-0">✓</span>
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="card p-5">
                    <div className="section-label mb-3">Disputed Theses</div>
                    {data.judge_verdict.disputed_theses.length === 0
                      ? <p className="text-sm text-zinc-500 italic">No material disputes — committee consensus reached.</p>
                      : (
                        <ul className="space-y-2.5">
                          {data.judge_verdict.disputed_theses.map((t, i) => (
                            <li key={i} className="flex gap-2.5 text-sm text-zinc-400">
                              <span className="text-amber-400 mt-0.5 shrink-0">⚡</span>
                              <span>{t}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'debate' && (
              <div>
                <div className="section-label mb-4">Adversarial Committee Debate</div>
                <DebateArena turns={data.debate_turns} factChecks={data.fact_checks} />
              </div>
            )}

            {activeTab === 'citations' && (
              <div className="space-y-3">
                <div className="section-label mb-4">Verified SEC 10-K Source Citations · {allCitations.length} excerpts</div>
                {allCitations.map((c, i) => (
                  <div key={i} className="card p-4 space-y-1.5">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-xs font-mono text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded">{c.chunk_id}</span>
                      <span className="text-xs text-zinc-400">{c.item}</span>
                      <span className="text-xs font-mono text-zinc-600">bytes [{c.char_span[0]}–{c.char_span[1]}]</span>
                    </div>
                    <p className="text-sm text-zinc-300 leading-relaxed italic">"{c.excerpt}"</p>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'review' && (
              <div>
                {data.judge_verdict.human_review_required
                  ? <>
                      <div className="flex items-center gap-2 mb-4">
                        <div className="section-label mb-0">Human Review Queue</div>
                        <span className="status-pill status-elevated text-xs">Action Required</span>
                      </div>
                      <ReviewQueuePanel />
                    </>
                  : (
                    <div className="card p-10 text-center space-y-2">
                      <div className="text-3xl">✅</div>
                      <p className="text-zinc-300 font-medium">No human review required</p>
                      <p className="text-zinc-500 text-sm">All extractions met the confidence threshold (≥ 0.85). Balance sheet equation verified.</p>
                    </div>
                  )}
              </div>
            )}

          </motion.div>
        </AnimatePresence>

        {/* ── Audit Metadata Footer ── */}
        <div className="border-t border-zinc-800/60 pt-5">
          <div className="flex flex-wrap gap-4 text-xs text-zinc-600 font-mono">
            <span>AUDIT ID: {data.audit_id}</span>
            <span>·</span>
            <span>ACCESSION: {data.accession_number}</span>
            <span>·</span>
            <a href={`https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&company=${ticker}`} target="_blank" rel="noopener noreferrer" className="text-indigo-500/70 hover:text-indigo-400 transition-colors">SEC EDGAR ↗</a>
          </div>
        </div>
      </div>
    </div>
  );
}
