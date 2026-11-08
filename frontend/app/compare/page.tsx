'use client';

import { useState, Suspense } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { getCompareAudits } from '@/lib/api';
import type { LiveAuditResponse } from '@/lib/types';
import { ComparePanel } from '@/components/ComparePanel';

const TICKERS = ['MSFT', 'NVDA', 'AAPL', 'TSLA', 'GME', 'ENRN'];

const PRESETS = [
  { a: 'MSFT', b: 'ENRN', label: 'Blue-Chip vs Fraud' },
  { a: 'NVDA', b: 'AAPL', label: 'AI Momentum Stocks' },
  { a: 'TSLA', b: 'GME', label: 'Speculative Equities' },
  { a: 'MSFT', b: 'NVDA', label: 'Big Tech Giants' },
];

function TickerSelect({ value, onChange, exclude }: { value: string; onChange: (v: string) => void; exclude: string }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full bg-zinc-900 border border-zinc-700 hover:border-zinc-600 focus:border-indigo-500 text-zinc-100 text-sm font-mono px-3 py-2.5 rounded-xl outline-none cursor-pointer transition-all focus:ring-1 focus:ring-indigo-500/30 appearance-none"
    >
      {TICKERS.filter(t => t !== exclude).map(t => (
        <option key={t} value={t}>{t}</option>
      ))}
    </select>
  );
}

function CompareContent() {
  const [tickerA, setTickerA] = useState('MSFT');
  const [tickerB, setTickerB] = useState('ENRN');
  const [auditA, setAuditA] = useState<LiveAuditResponse | null>(null);
  const [auditB, setAuditB] = useState<LiveAuditResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasRun, setHasRun] = useState(false);

  const handleCompare = async (a = tickerA, b = tickerB) => {
    if (a === b) return;
    setLoading(true);
    setError(null);
    setHasRun(true);
    try {
      const { left: resA, right: resB } = await getCompareAudits(a, b);
      setAuditA(resA);
      setAuditB(resB);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handlePreset = (a: string, b: string) => {
    setTickerA(a);
    setTickerB(b);
    handleCompare(a, b);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">

      {/* Header */}
      <div>
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors mb-4">
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          Back to Audits
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-end gap-3">
          <div>
            <h1 className="text-2xl font-bold text-zinc-100">Entity Risk Comparison</h1>
            <p className="text-sm text-zinc-500 mt-1">Head-to-head forensic risk analysis across Beneish M-Score, Sloan Accruals, and Altman Z-Score.</p>
          </div>
        </div>
      </div>

      {/* Selector Card */}
      <div className="card p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-4 items-end">
          <div className="space-y-2">
            <label className="section-label mb-0">Company A</label>
            <TickerSelect value={tickerA} onChange={setTickerA} exclude={tickerB} />
          </div>
          <div className="text-zinc-600 text-lg font-light self-end pb-2.5 text-center">vs</div>
          <div className="space-y-2">
            <label className="section-label mb-0">Company B</label>
            <TickerSelect value={tickerB} onChange={setTickerB} exclude={tickerA} />
          </div>
        </div>

        <button
          onClick={() => handleCompare()}
          disabled={loading || tickerA === tickerB}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 disabled:text-zinc-600 disabled:cursor-not-allowed text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-all"
        >
          {loading ? (
            <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Loading…</>
          ) : (
            <>Compare {tickerA} vs {tickerB} →</>
          )}
        </button>

        {/* Preset pills */}
        <div>
          <div className="section-label mb-2">Quick Presets</div>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map(p => (
              <button
                key={`${p.a}-${p.b}`}
                onClick={() => handlePreset(p.a, p.b)}
                className="text-xs text-zinc-400 hover:text-zinc-100 bg-zinc-800/60 hover:bg-zinc-700/60 border border-zinc-700/50 hover:border-zinc-600 px-3 py-1.5 rounded-lg transition-all font-mono"
              >
                {p.a} vs {p.b}
                <span className="ml-1.5 text-zinc-600 font-sans">· {p.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      {error && (
        <div className="card border-rose-500/20 p-5 text-rose-400 text-sm">{error}</div>
      )}

      {loading && (
        <div className="space-y-4 animate-pulse">
          {[0, 1].map(i => <div key={i} className="h-48 skeleton rounded-xl" />)}
        </div>
      )}

      {!loading && auditA && auditB && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div className="section-label mb-4">Comparison Results — {tickerA} vs {tickerB}</div>
          <ComparePanel left={auditA} right={auditB} />
        </motion.div>
      )}

      {!hasRun && !loading && (
        <div className="card p-16 text-center space-y-3">
          <div className="text-4xl">⚔️</div>
          <p className="text-zinc-400 font-medium">Select two companies and click Compare</p>
          <p className="text-zinc-600 text-sm">Or pick a quick preset above to get started instantly.</p>
        </div>
      )}
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-6 py-8 animate-pulse space-y-4"><div className="h-32 skeleton rounded-xl" /><div className="h-48 skeleton rounded-xl" /></div>}>
      <CompareContent />
    </Suspense>
  );
}
