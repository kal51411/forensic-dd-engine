'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { getCompareAudits, getAvailableTickers } from '@/lib/api';
import type { LiveAuditResponse } from '@/lib/types';
import { ComparePanel } from '@/components/ComparePanel';

const DEMO_PRESETS = [
  { label: 'MSFT vs ENRN (Clean vs Fraud)', a: 'MSFT', b: 'ENRN' },
  { label: 'NVDA vs AAPL (AI Growth vs Cash Machine)', a: 'NVDA', b: 'AAPL' },
  { label: 'TSLA vs GME (Margin Compression vs Retail Treasury)', a: 'TSLA', b: 'GME' },
];

function CompareSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="h-44 skeleton-shimmer rounded-lg" />
        <div className="h-44 skeleton-shimmer rounded-lg" />
      </div>
      <div className="h-72 skeleton-shimmer rounded-lg" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="h-48 skeleton-shimmer rounded-lg" />
        <div className="h-48 skeleton-shimmer rounded-lg" />
      </div>
    </div>
  );
}

function ComparePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const availableTickers = getAvailableTickers();

  const initialA = searchParams?.get('a')?.toUpperCase() || 'MSFT';
  const initialB = searchParams?.get('b')?.toUpperCase() || 'ENRN';

  const [tickerA, setTickerA] = useState<string>(initialA);
  const [tickerB, setTickerB] = useState<string>(initialB);

  const [data, setData] = useState<{ left: LiveAuditResponse; right: LiveAuditResponse } | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;
    setLoading(true);
    setError(null);

    getCompareAudits(tickerA, tickerB)
      .then((res) => {
        if (!isCancelled) {
          setData(res);
        }
      })
      .catch((err: Error) => {
        if (!isCancelled) {
          setError(err.message || 'Failed to fetch comparison filings');
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [tickerA, tickerB]);

  const handleSwap = () => {
    const temp = tickerA;
    setTickerA(tickerB);
    setTickerB(temp);
  };

  const handleSelectPreset = (a: string, b: string) => {
    setTickerA(a);
    setTickerB(b);
  };

  return (
    <div className="min-h-screen bg-terminal-bg text-terminal-white font-mono pb-20">
      {/* Top Navigation Bar */}
      <div className="border-b border-terminal-border bg-terminal-surface/80 backdrop-blur sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push('/')}
              className="text-xs text-terminal-gray hover:text-terminal-green transition-colors flex items-center gap-1 border border-terminal-border px-2.5 py-1 rounded bg-terminal-bg"
            >
              ← HOME / SEARCH
            </button>
            <div className="h-4 w-px bg-terminal-border hidden sm:block" />
            <div className="text-xs text-terminal-gray-dim uppercase tracking-wider hidden sm:block">
              COMPARATIVE SEC 10-K FORENSIC BENCHMARK
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="w-2 h-2 rounded-full bg-terminal-green animate-pulse" />
            <span className="text-terminal-green font-bold">TERMINAL ONLINE</span>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 pt-8 space-y-8">
        {/* Title Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-terminal-border">
          <div>
            <div className="text-xs text-terminal-green tracking-[0.25em] uppercase font-bold mb-1">
              // FORENSIC AUDIT COMMITTEE
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              <span>DUAL TICKER AUDIT COMPARATOR</span>
              <span className="text-xs font-normal px-2.5 py-0.5 rounded border border-terminal-green/40 bg-terminal-green/10 text-terminal-green">
                HEAD-TO-HEAD
              </span>
            </h1>
            <p className="text-xs text-terminal-gray mt-1 max-w-2xl leading-relaxed">
              Side-by-side forensic analysis cross-examining Beneish M-Scores, Sloan Accruals, Altman Z Solvency zones, and adversarial committee theses.
            </p>
          </div>

          {/* Quick Presets */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-terminal-gray-dim text-[11px] mr-1">PRESETS:</span>
            {DEMO_PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => handleSelectPreset(p.a, p.b)}
                className={`px-2.5 py-1 rounded border text-[11px] transition-all ${
                  tickerA === p.a && tickerB === p.b
                    ? 'border-terminal-green bg-terminal-green/20 text-terminal-green font-bold'
                    : 'border-terminal-border bg-terminal-surface text-terminal-gray hover:text-white hover:border-terminal-gray'
                }`}
              >
                {p.a} vs {p.b}
              </button>
            ))}
          </div>
        </div>

        {/* ── Selection Control Bar ── */}
        <div className="bg-terminal-surface border border-terminal-border rounded-lg p-5">
          <div className="text-[10px] text-terminal-gray-dim uppercase tracking-wider mb-3 font-semibold">
            SELECT ENTITIES FOR CROSS-AUDIT DELTA
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[1fr,auto,1fr] gap-4 items-center">
            {/* Ticker A Selector */}
            <div className="space-y-2">
              <label className="text-xs text-terminal-gray flex items-center justify-between">
                <span>TARGET A (LEFT):</span>
                <span className="text-terminal-green font-bold">{tickerA}</span>
              </label>
              <select
                value={tickerA}
                onChange={(e) => setTickerA(e.target.value)}
                className="w-full bg-terminal-bg border border-terminal-border text-terminal-white text-sm px-3 py-2.5 rounded font-mono focus:border-terminal-green focus:outline-none"
              >
                {availableTickers.map((sym) => (
                  <option key={sym} value={sym} disabled={sym === tickerB}>
                    {sym} {sym === tickerB ? '(Selected on Right)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Swap Button */}
            <div className="flex justify-center pt-2 md:pt-5">
              <motion.button
                type="button"
                onClick={handleSwap}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                title="Swap Entities"
                className="p-2.5 rounded-full border border-terminal-border bg-terminal-bg text-terminal-gray hover:text-terminal-green hover:border-terminal-green transition-all"
              >
                ⇄
              </motion.button>
            </div>

            {/* Ticker B Selector */}
            <div className="space-y-2">
              <label className="text-xs text-terminal-gray flex items-center justify-between">
                <span>TARGET B (RIGHT):</span>
                <span className="text-terminal-green font-bold">{tickerB}</span>
              </label>
              <select
                value={tickerB}
                onChange={(e) => setTickerB(e.target.value)}
                className="w-full bg-terminal-bg border border-terminal-border text-terminal-white text-sm px-3 py-2.5 rounded font-mono focus:border-terminal-green focus:outline-none"
              >
                {availableTickers.map((sym) => (
                  <option key={sym} value={sym} disabled={sym === tickerA}>
                    {sym} {sym === tickerA ? '(Selected on Left)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Selection Pills */}
          <div className="mt-4 pt-4 border-t border-terminal-border/60 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-[11px] text-terminal-gray-dim">AVAILABLE TICKERS:</span>
            {availableTickers.map((sym) => {
              const isLeft = tickerA === sym;
              const isRight = tickerB === sym;
              return (
                <div key={sym} className="flex items-center">
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-bold border transition-all ${
                      isLeft
                        ? 'border-terminal-green bg-terminal-green/20 text-terminal-green'
                        : isRight
                          ? 'border-terminal-amber bg-terminal-amber/20 text-terminal-amber'
                          : 'border-terminal-border bg-terminal-bg/50 text-terminal-gray'
                    }`}
                  >
                    {sym}
                    {isLeft ? ' (A)' : isRight ? ' (B)' : ''}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Content View ── */}
        {loading && <CompareSkeleton />}

        {error && (
          <div className="border border-terminal-red/50 bg-terminal-red/10 rounded-lg p-6 text-center">
            <div className="text-terminal-red font-bold text-sm mb-1">
              ✗ COMPARATIVE AUDIT ENGINE ERROR
            </div>
            <div className="text-xs text-terminal-gray">{error}</div>
            <button
              type="button"
              onClick={() => {
                setTickerA('MSFT');
                setTickerB('ENRN');
              }}
              className="mt-4 px-3 py-1.5 text-xs bg-terminal-red/20 text-terminal-red border border-terminal-red/40 rounded hover:bg-terminal-red/30"
            >
              Reset to Default (MSFT vs ENRN)
            </button>
          </div>
        )}

        {!loading && !error && data && (
          <ComparePanel left={data.left} right={data.right} />
        )}
      </main>
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-terminal-bg p-8"><CompareSkeleton /></div>}>
      <ComparePageContent />
    </Suspense>
  );
}
