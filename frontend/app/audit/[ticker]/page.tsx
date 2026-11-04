'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { runLiveAudit, getAvailableTickers } from '@/lib/api';
import type { LiveAuditResponse, Citation } from '@/lib/types';
import { VerdictBanner } from '@/components/VerdictBanner';
import { FraudScorecard } from '@/components/FraudScorecard';
import { DebateArena } from '@/components/DebateArena';
import { ReviewQueuePanel } from '@/components/ReviewQueuePanel';
import { TimelineProgress } from '@/components/TimelineProgress';
import { ShareBar } from '@/components/ShareBar';
import { CitationPill } from '@/components/CitationPill';
import { SourceInspectorDrawer } from '@/components/SourceInspectorDrawer';

type TabKey = 'overview' | 'debate' | 'citations' | 'review';

function AuditSkeleton() {
  return (
    <div className="max-w-screen-xl mx-auto px-6 py-8 space-y-6 animate-pulse">
      <div className="h-20 skeleton-shimmer rounded-lg w-full" />
      <div className="h-16 skeleton-shimmer rounded-lg w-full" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-56 skeleton-shimmer rounded-lg" />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="h-80 skeleton-shimmer rounded-lg" />
        <div className="h-80 skeleton-shimmer rounded-lg" />
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
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [selectedCitation, setSelectedCitation] = useState<Citation | null>(null);
  const [citationSearch, setCitationSearch] = useState<string>('');

  const availableTickers = getAvailableTickers();

  useEffect(() => {
    if (!ticker) return;
    setLoading(true);
    setError(null);

    runLiveAudit(ticker)
      .then((res) => {
        setData(res);
      })
      .catch((err: Error) => {
        setError(err.message || 'Audit execution failed');
      })
      .finally(() => setLoading(false));
  }, [ticker]);

  // Consolidate and deduplicate all validated citations across the entire audit
  const allCitations = useMemo(() => {
    if (!data) return [];
    const map = new Map<string, Citation>();

    data.judge_verdict?.validated_citations?.forEach((c) => {
      if (c && c.chunk_id) map.set(c.chunk_id, c);
    });

    data.debate_turns?.forEach((turn) => {
      turn.citations?.forEach((c) => {
        if (c && c.chunk_id && !map.has(c.chunk_id)) {
          map.set(c.chunk_id, c);
        }
      });
    });

    data.fact_checks?.forEach((fc) => {
      fc.verified_citations?.forEach((c) => {
        if (c && c.chunk_id && !map.has(c.chunk_id)) {
          map.set(c.chunk_id, c);
        }
      });
    });

    return Array.from(map.values());
  }, [data]);

  // Filter citations by search query
  const filteredCitations = useMemo(() => {
    if (!citationSearch.trim()) return allCitations;
    const q = citationSearch.toLowerCase();
    return allCitations.filter(
      (c) =>
        c.item?.toLowerCase().includes(q) ||
        c.chunk_id?.toLowerCase().includes(q) ||
        c.excerpt?.toLowerCase().includes(q)
    );
  }, [allCitations, citationSearch]);

  const hasHumanReview = Boolean(data?.judge_verdict?.human_review_required);

  return (
    <div className="min-h-screen bg-terminal-bg text-terminal-white font-mono pb-20">
      {/* ── Top Header & Breadcrumbs ── */}
      <div className="border-b border-terminal-border bg-terminal-surface/90 backdrop-blur sticky top-0 z-20">
        <div className="max-w-screen-xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push('/')}
              className="text-xs text-terminal-gray hover:text-terminal-green transition-colors flex items-center gap-1 border border-terminal-border px-2.5 py-1 rounded bg-terminal-bg"
            >
              ← SEARCH / HOME
            </button>
            <div className="h-4 w-px bg-terminal-border hidden sm:block" />
            <div className="text-xs text-terminal-gray-dim uppercase tracking-wider hidden sm:block">
              SEC 10-K FORENSIC AUDIT // <span className="text-terminal-white font-bold">{ticker}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <Link
              href={`/compare?a=${ticker}&b=${ticker === 'MSFT' ? 'ENRN' : 'MSFT'}`}
              className="text-xs text-terminal-gray hover:text-terminal-green border border-terminal-border px-2.5 py-1 rounded bg-terminal-bg hidden md:inline-flex items-center gap-1"
            >
              ⇄ COMPARE WITH PEER
            </Link>
            <span className="text-terminal-green font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-terminal-green animate-pulse" />
              LIVE
            </span>
          </div>
        </div>
      </div>

      {/* ── Main Container ── */}
      <div className="max-w-screen-xl mx-auto px-6 pt-6 space-y-6">
        {/* Timeline Progress Bar right below header */}
        <TimelineProgress activeStep={-1} />

        {/* Loading Skeleton */}
        {loading && <AuditSkeleton />}

        {/* Error State with fallback to demo tickers */}
        {error && (
          <div className="terminal-border-red bg-terminal-surface rounded-lg p-8 text-center space-y-4 my-8">
            <div className="text-terminal-red text-xl font-bold tracking-tight">
              ✗ AUDIT VERIFICATION FAILED
            </div>
            <p className="text-terminal-gray text-sm max-w-lg mx-auto">
              {error}
            </p>
            <div className="text-xs text-terminal-gray-dim">
              The requested symbol &quot;{ticker}&quot; could not be resolved against live SEC EDGAR or cached forensic models.
            </div>

            <div className="pt-4 border-t border-terminal-border/80">
              <div className="text-xs font-semibold text-terminal-gray uppercase tracking-wider mb-3">
                CHOOSE FROM AVAILABLE PRE-COMPUTED FORENSIC BENCHMARKS:
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                {availableTickers.map((demo) => (
                  <button
                    key={demo}
                    type="button"
                    onClick={() => router.push(`/audit/${demo}`)}
                    className="px-3 py-1.5 text-xs font-bold border border-terminal-green/50 bg-terminal-green/10 text-terminal-green rounded hover:bg-terminal-green/20 transition-all"
                  >
                    {demo} AUDIT →
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Audit Content */}
        {!loading && !error && data && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.35 }}
            className="space-y-6"
          >
            {/* Share Bar with Actions */}
            <ShareBar
              ticker={ticker}
              verdict={data.verdict}
              confidenceScore={data.confidence_score}
            />

            {/* Verdict Banner */}
            <VerdictBanner
              verdict={data.judge_verdict}
              entityName={data.entity_name}
              ticker={data.ticker}
              fiscalYear={data.fiscal_year}
              cached={data.cached}
              accessionNumber={data.accession_number}
            />

            {/* ── Modern Bloomberg Terminal Tabbed Interface ── */}
            <div className="border-b border-terminal-border">
              <nav className="flex space-x-2 md:space-x-4 overflow-x-auto text-xs font-mono">
                {/* Tab 1: OVERVIEW */}
                <button
                  type="button"
                  onClick={() => setActiveTab('overview')}
                  className={`py-3 px-4 font-bold uppercase tracking-wider transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
                    activeTab === 'overview'
                      ? 'border-terminal-green text-terminal-green bg-terminal-green/5'
                      : 'border-transparent text-terminal-gray hover:text-terminal-white'
                  }`}
                >
                  <span>[01 // OVERVIEW]</span>
                  <span className="text-[10px] opacity-75">
                    ({data.fraud_risk_score.red_flag_count} Flags)
                  </span>
                </button>

                {/* Tab 2: DEBATE COMMITTEE */}
                <button
                  type="button"
                  onClick={() => setActiveTab('debate')}
                  className={`py-3 px-4 font-bold uppercase tracking-wider transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
                    activeTab === 'debate'
                      ? 'border-terminal-green text-terminal-green bg-terminal-green/5'
                      : 'border-transparent text-terminal-gray hover:text-terminal-white'
                  }`}
                >
                  <span>[02 // DEBATE COMMITTEE]</span>
                  <span className="text-[10px] text-terminal-amber">
                    ({data.debate_turns.length} Turns)
                  </span>
                </button>

                {/* Tab 3: SOURCE CITATIONS */}
                <button
                  type="button"
                  onClick={() => setActiveTab('citations')}
                  className={`py-3 px-4 font-bold uppercase tracking-wider transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
                    activeTab === 'citations'
                      ? 'border-terminal-green text-terminal-green bg-terminal-green/5'
                      : 'border-transparent text-terminal-gray hover:text-terminal-white'
                  }`}
                >
                  <span>[03 // SOURCE CITATIONS]</span>
                  <span className="text-[10px] text-terminal-green-dim">
                    ({allCitations.length} Excerpts)
                  </span>
                </button>

                {/* Tab 4: HUMAN REVIEW */}
                <button
                  type="button"
                  onClick={() => setActiveTab('review')}
                  className={`py-3 px-4 font-bold uppercase tracking-wider transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
                    activeTab === 'review'
                      ? 'border-terminal-green text-terminal-green bg-terminal-green/5'
                      : 'border-transparent text-terminal-gray hover:text-terminal-white'
                  } ${hasHumanReview ? 'text-terminal-amber' : ''}`}
                >
                  <span>[04 // HUMAN REVIEW]</span>
                  {hasHumanReview ? (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-terminal-amber/20 text-terminal-amber border border-terminal-amber/40 animate-pulse">
                      ACTION REQ
                    </span>
                  ) : (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-terminal-green/10 text-terminal-green border border-terminal-green/30">
                      ✓ AUTO
                    </span>
                  )}
                </button>
              </nav>
            </div>

            {/* ── Tab Content Panels ── */}
            <div className="pt-2">
              <AnimatePresence mode="wait">
                {/* ── TAB 1: OVERVIEW ── */}
                {activeTab === 'overview' && (
                  <motion.div
                    key="overview"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-8"
                  >
                    {/* Quantitative Fraud Scorecard */}
                    <section>
                      <div className="section-header">// QUANTITATIVE FRAUD SCORECARD</div>
                      <FraudScorecard scores={data.fraud_risk_score} />
                    </section>

                    {/* Critical Signals Detected */}
                    {data.fraud_risk_score.critical_signals.length > 0 && (
                      <section className="bg-terminal-surface border border-terminal-red/40 rounded-lg p-5">
                        <div className="flex items-center gap-2 pb-3 mb-3 border-b border-terminal-red/30">
                          <span className="w-2.5 h-2.5 rounded-full bg-terminal-red animate-pulse" />
                          <div className="text-xs font-bold text-terminal-red tracking-wider uppercase">
                            CRITICAL RED FLAG SIGNALS DETECTED ({data.fraud_risk_score.critical_signals.length})
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {data.fraud_risk_score.critical_signals.map((sig, i) => (
                            <div
                              key={i}
                              className="text-xs text-terminal-red border border-terminal-red/30 bg-terminal-red/10 p-3 rounded flex items-start gap-2.5 shadow-sm"
                            >
                              <span className="text-sm font-bold shrink-0">⚠</span>
                              <span className="leading-relaxed">{sig}</span>
                            </div>
                          ))}
                        </div>
                      </section>
                    )}

                    {/* Judge Executive Summary */}
                    <section>
                      <div className="section-header">// JUDGE DELIBERATION EXECUTIVE SUMMARY</div>
                      <div className="bg-terminal-surface terminal-border rounded-lg p-6 text-terminal-gray leading-relaxed text-sm italic relative">
                        <span className="text-terminal-green-dim text-3xl absolute top-3 left-3 select-none opacity-40 font-serif">
                          &ldquo;
                        </span>
                        <div className="pl-6">
                          {data.judge_verdict?.executive_summary}
                        </div>
                      </div>
                    </section>

                    {/* Agreed Facts & Disputed Theses */}
                    <section>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Agreed Facts */}
                        <div className="bg-terminal-surface border border-terminal-border rounded-lg p-5">
                          <div className="section-header text-terminal-green">// AGREED COMMITTEE FACTS</div>
                          <ul className="space-y-2.5">
                            {data.judge_verdict?.agreed_facts?.map((fact, i) => (
                              <li
                                key={i}
                                className="text-xs text-terminal-gray flex gap-2 items-start leading-relaxed"
                              >
                                <span className="text-terminal-green font-bold shrink-0">✓</span>
                                <span>{fact}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Disputed Theses */}
                        <div className="bg-terminal-surface border border-terminal-border rounded-lg p-5">
                          <div className="section-header text-terminal-amber">// DISPUTED COMMITTEE THESES</div>
                          {(!data.judge_verdict?.disputed_theses ||
                            data.judge_verdict.disputed_theses.length === 0) ? (
                            <p className="text-xs text-terminal-gray-dim italic py-3">
                              No disputed theses. Committee reached consensus across all disclosures.
                            </p>
                          ) : (
                            <ul className="space-y-2.5">
                              {data.judge_verdict.disputed_theses.map((thesis, i) => (
                                <li
                                  key={i}
                                  className="text-xs text-terminal-gray flex gap-2 items-start leading-relaxed"
                                >
                                  <span className="text-terminal-amber font-bold shrink-0">⚡</span>
                                  <span>{thesis}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    </section>
                  </motion.div>
                )}

                {/* ── TAB 2: DEBATE COMMITTEE ── */}
                {activeTab === 'debate' && (
                  <motion.div
                    key="debate"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                  >
                    <div className="bg-terminal-surface border border-terminal-border rounded-lg p-4 text-xs text-terminal-gray flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">⚔️</span>
                        <span>
                          Adversarial debate between Bear Agent (attacking accounting anomalies) and Bull Agent (defending fundamentals).
                        </span>
                      </div>
                      <span className="text-terminal-green text-[11px] font-bold">
                        FACT CHECK VERIFIED
                      </span>
                    </div>

                    <DebateArena
                      turns={data.debate_turns}
                      factChecks={data.fact_checks}
                    />
                  </motion.div>
                )}

                {/* ── TAB 3: SOURCE CITATIONS ── */}
                {activeTab === 'citations' && (
                  <motion.div
                    key="citations"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                  >
                    {/* Citations Controls */}
                    <div className="bg-terminal-surface border border-terminal-border rounded-lg p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div>
                        <div className="text-xs font-bold text-terminal-white uppercase">
                          VALIDATED SEC 10-K FILING EXCERPTS ({filteredCitations.length} of {allCitations.length})
                        </div>
                        <div className="text-[11px] text-terminal-gray-dim">
                          Every citation is mapped to an immutable byte offset [char_start, char_end] in the raw EDGAR filing.
                        </div>
                      </div>

                      <div className="w-full sm:w-64">
                        <input
                          type="text"
                          value={citationSearch}
                          onChange={(e) => setCitationSearch(e.target.value)}
                          placeholder="Search citations, items..."
                          className="w-full bg-terminal-bg border border-terminal-border px-3 py-1.5 rounded text-xs text-terminal-white placeholder:text-terminal-gray-dim focus:border-terminal-green focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Citations Table / Grid */}
                    {filteredCitations.length === 0 ? (
                      <div className="bg-terminal-surface border border-terminal-border rounded-lg p-8 text-center text-xs text-terminal-gray-dim">
                        No citations match your filter query.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-4">
                        {filteredCitations.map((c, i) => (
                          <div
                            key={c.chunk_id || i}
                            className="bg-terminal-surface border border-terminal-border rounded-lg p-5 hover:border-terminal-green/50 transition-all flex flex-col justify-between gap-3 group"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-terminal-border/60">
                              <div className="flex items-center gap-2">
                                <span className="text-terminal-amber font-bold text-xs">§</span>
                                <span className="text-xs font-bold text-terminal-white">{c.item}</span>
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-terminal-bg border border-terminal-border text-terminal-gray">
                                  chunk_id: {c.chunk_id}
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-terminal-gray-dim font-mono">
                                  BYTE SPAN: [{c.char_span?.[0] ?? 0}, {c.char_span?.[1] ?? 0}]
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setSelectedCitation(c)}
                                  className="text-[11px] text-terminal-green hover:underline flex items-center gap-1 font-semibold"
                                >
                                  INSPECT RAW ↗
                                </button>
                              </div>
                            </div>

                            <p className="text-xs text-terminal-gray leading-relaxed font-sans italic bg-terminal-bg/50 p-3 rounded border border-terminal-border/40">
                              &ldquo;{c.excerpt}&rdquo;
                            </p>

                            <div className="flex items-center justify-between text-[10px] text-terminal-gray-dim pt-1">
                              <span>VERIFIED BY FACT CHECKER: ALLOWLIST VALIDATED</span>
                              <CitationPill citation={c} onOpen={setSelectedCitation} />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* ── TAB 4: HUMAN REVIEW ── */}
                {activeTab === 'review' && (
                  <motion.div
                    key="review"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                  >
                    <div
                      className={`border rounded-lg p-5 ${
                        hasHumanReview
                          ? 'border-terminal-amber/50 bg-terminal-amber/10'
                          : 'border-terminal-green/40 bg-terminal-green/5'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl shrink-0">
                          {hasHumanReview ? '⚡' : '🛡️'}
                        </span>
                        <div>
                          <h4
                            className={`text-sm font-bold uppercase ${
                              hasHumanReview ? 'text-terminal-amber' : 'text-terminal-green'
                            }`}
                          >
                            {hasHumanReview
                              ? 'HUMAN-IN-THE-LOOP INTERVENTION REQUIRED'
                              : 'CONFIDENCE CRITERIA SATISFIED — FULLY AUTOMATED'}
                          </h4>
                          <p className="text-xs text-terminal-gray leading-relaxed mt-1">
                            {hasHumanReview
                              ? 'The multi-agent debate flagged low-confidence XBRL extractions or accounting equation discrepancies. Analysts must review and reconcile these items before institutional sign-off.'
                              : 'All accounting concepts and XBRL taxonomy values were reconciled with confidence scores > 85%. No immediate analyst action required for this filing.'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Global Review Queue Panel */}
                    <div>
                      <div className="section-header">// ACTIVE SYSTEM REVIEW QUEUE</div>
                      <ReviewQueuePanel />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ── SEC EDGAR Source & Audit Metadata Footer ── */}
            <section className="border-t border-terminal-border pt-8 mt-12">
              <div className="bg-terminal-surface border border-terminal-border rounded-lg p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-terminal-border/60 text-xs">
                  <div>
                    <span className="text-terminal-gray-dim uppercase tracking-wider font-bold">
                      PROVENANCE & AUDIT TRAIL:
                    </span>
                    <div className="text-terminal-white font-bold mt-0.5">
                      {data.entity_name} ({data.ticker}) · FY{data.fiscal_year}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] bg-terminal-green/10 text-terminal-green border border-terminal-green/30">
                      SEC EDGAR 10-K VERIFIED
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-terminal-bg text-terminal-gray border border-terminal-border">
                      CONFIDENCE: {(data.confidence_score * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 text-xs text-terminal-gray">
                  <div>
                    <span className="text-terminal-gray-dim block text-[10px] uppercase">AUDIT IDENTIFIER</span>
                    <span className="font-mono text-terminal-white">{data.audit_id}</span>
                  </div>
                  <div>
                    <span className="text-terminal-gray-dim block text-[10px] uppercase">SEC ACCESSION NUMBER</span>
                    <span className="font-mono text-terminal-white">{data.accession_number}</span>
                  </div>
                  <div>
                    <span className="text-terminal-gray-dim block text-[10px] uppercase">SEC FILINGS REPOSITORY</span>
                    <a
                      href={`https://www.sec.gov/edgar/browse/?CIK=${data.ticker}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-terminal-green hover:underline flex items-center gap-1"
                    >
                      SEC EDGAR ARCHIVE ↗
                    </a>
                  </div>
                </div>
              </div>
            </section>

            {/* Source Inspector Modal Drawer */}
            <SourceInspectorDrawer
              citation={selectedCitation}
              onClose={() => setSelectedCitation(null)}
            />
          </motion.div>
        )}
      </div>
    </div>
  );
}
