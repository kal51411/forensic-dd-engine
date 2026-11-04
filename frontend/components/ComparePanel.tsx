'use client';

import { motion } from 'framer-motion';
import type { LiveAuditResponse } from '@/lib/types';

export interface ComparePanelProps {
  auditA?: LiveAuditResponse;
  auditB?: LiveAuditResponse;
  left?: LiveAuditResponse;
  right?: LiveAuditResponse;
  onSelectTicker?: (ticker: string) => void;
}

interface MetricComparison {
  name: string;
  metricKey: string;
  valA: number;
  valB: number;
  format: (v: number) => string;
  unit?: string;
  benchmark: string;
  better: 'higher' | 'lower' | 'closer_to_zero';
  description: string;
}

export function ComparePanel({
  auditA,
  auditB,
  left,
  right,
  onSelectTicker,
}: ComparePanelProps) {
  // Support either (auditA, auditB) or (left, right)
  const first = auditA || left;
  const second = auditB || right;

  if (!first || !second) {
    return (
      <div className="p-6 bg-terminal-surface border border-terminal-border rounded-lg text-center text-xs text-terminal-gray-dim font-mono">
        Select two filings to perform comparative forensic analysis.
      </div>
    );
  }

  const scoreA = first.fraud_risk_score;
  const scoreB = second.fraud_risk_score;

  // Comparison metrics definition
  const metrics: MetricComparison[] = [
    {
      name: 'Beneish M-Score',
      metricKey: 'beneish_m_score',
      valA: scoreA.beneish_m_score,
      valB: scoreB.beneish_m_score,
      format: (v) => v.toFixed(2),
      benchmark: '< -1.78 (Non-manipulator)',
      better: 'lower',
      description: 'Probability of earnings manipulation. More negative indicates lower fraud risk.',
    },
    {
      name: 'Sloan Accrual Ratio',
      metricKey: 'sloan_accrual_ratio',
      valA: scoreA.sloan_accrual_ratio,
      valB: scoreB.sloan_accrual_ratio,
      format: (v) => `${(v * 100).toFixed(1)}%`,
      benchmark: '-5.0% to +5.0%',
      better: 'closer_to_zero',
      description: 'Accrual component of earnings. Values near zero indicate cash-backed earnings.',
    },
    {
      name: 'Altman Z-Score',
      metricKey: 'altman_z_score',
      valA: scoreA.altman_z_score,
      valB: scoreB.altman_z_score,
      format: (v) => v.toFixed(2),
      benchmark: '> 2.99 (Safe Zone)',
      better: 'higher',
      description: 'Standard formula measuring insolvency & bankruptcy risk within 2 years.',
    },
    {
      name: 'Confidence Score',
      metricKey: 'confidence_score',
      valA: first.confidence_score,
      valB: second.confidence_score,
      format: (v) => `${(v * 100).toFixed(1)}%`,
      benchmark: '> 90% (High Certainty)',
      better: 'higher',
      description: 'Deterministic audit engine confidence across quantitative and debate consensus.',
    },
    {
      name: 'Total Red Flag Count',
      metricKey: 'red_flag_count',
      valA: scoreA.red_flag_count,
      valB: scoreB.red_flag_count,
      format: (v) => `${v} flag${v === 1 ? '' : 's'}`,
      benchmark: '0 (Clean)',
      better: 'lower',
      description: 'Total number of active accounting flags, SEC anomalies, or distress triggers.',
    },
  ];

  // Helper to determine winner/loser
  const getWinner = (m: MetricComparison): 'A' | 'B' | 'TIE' => {
    if (m.better === 'higher') {
      if (Math.abs(m.valA - m.valB) < 0.001) return 'TIE';
      return m.valA > m.valB ? 'A' : 'B';
    }
    if (m.better === 'lower') {
      if (Math.abs(m.valA - m.valB) < 0.001) return 'TIE';
      return m.valA < m.valB ? 'A' : 'B';
    }
    if (m.better === 'closer_to_zero') {
      const absA = Math.abs(m.valA);
      const absB = Math.abs(m.valB);
      if (Math.abs(absA - absB) < 0.001) return 'TIE';
      return absA < absB ? 'A' : 'B';
    }
    return 'TIE';
  };

  const getVerdictBadge = (verdict: string) => {
    switch (verdict) {
      case 'CLEAN_AUDIT':
        return {
          label: 'CLEAN AUDIT',
          className: 'text-terminal-green bg-terminal-green/10 border-terminal-green/50',
        };
      case 'ELEVATED_RISK':
        return {
          label: 'ELEVATED RISK',
          className: 'text-terminal-amber bg-terminal-amber/10 border-terminal-amber/50',
        };
      default:
        return {
          label: 'CRITICAL RED FLAG',
          className: 'text-terminal-red bg-terminal-red/10 border-terminal-red/50 animate-pulse',
        };
    }
  };

  const badgeA = getVerdictBadge(first.judge_verdict.composite_verdict);
  const badgeB = getVerdictBadge(second.judge_verdict.composite_verdict);

  return (
    <div className="space-y-8 font-mono">
      {/* Header Cards Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Ticker A Card */}
        <div className="bg-terminal-surface border border-terminal-border rounded-xl p-6 relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs text-terminal-gray-dim tracking-widest uppercase">
                ENTITY A · FY{first.fiscal_year}
              </div>
              <h2
                onClick={() => onSelectTicker?.(first.ticker)}
                className="text-3xl font-bold text-white mt-1 cursor-pointer hover:text-terminal-green transition-colors"
              >
                {first.ticker}
              </h2>
              <p className="text-xs text-terminal-gray mt-0.5">{first.entity_name}</p>
            </div>
            <div className={`px-3 py-1 rounded text-xs font-bold border ${badgeA.className}`}>
              {badgeA.label}
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-terminal-border flex items-center justify-between text-xs">
            <span className="text-terminal-gray-dim">ACCESSION: {first.accession_number}</span>
            <span className="text-terminal-gray">
              CONFIDENCE: <strong className="text-white">{(first.confidence_score * 100).toFixed(1)}%</strong>
            </span>
          </div>
        </div>

        {/* Ticker B Card */}
        <div className="bg-terminal-surface border border-terminal-border rounded-xl p-6 relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs text-terminal-gray-dim tracking-widest uppercase">
                ENTITY B · FY{second.fiscal_year}
              </div>
              <h2
                onClick={() => onSelectTicker?.(second.ticker)}
                className="text-3xl font-bold text-white mt-1 cursor-pointer hover:text-terminal-green transition-colors"
              >
                {second.ticker}
              </h2>
              <p className="text-xs text-terminal-gray mt-0.5">{second.entity_name}</p>
            </div>
            <div className={`px-3 py-1 rounded text-xs font-bold border ${badgeB.className}`}>
              {badgeB.label}
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-terminal-border flex items-center justify-between text-xs">
            <span className="text-terminal-gray-dim">ACCESSION: {second.accession_number}</span>
            <span className="text-terminal-gray">
              CONFIDENCE: <strong className="text-white">{(second.confidence_score * 100).toFixed(1)}%</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Side-by-Side Head-to-Head Scorecard Table */}
      <div className="bg-terminal-surface border border-terminal-border rounded-xl overflow-hidden shadow-xl">
        <div className="p-4 bg-terminal-bg/80 border-b border-terminal-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-terminal-green animate-pulse" />
            <span className="text-xs uppercase tracking-widest font-bold text-terminal-white">
              HEAD-TO-HEAD QUANTITATIVE FORENSIC BENCHMARK
            </span>
          </div>
          <span className="text-[11px] text-terminal-gray-dim">
            WINNER HIGHLIGHTED IN GREEN · RISK IN RED
          </span>
        </div>

        <div className="divide-y divide-terminal-border">
          {metrics.map((m) => {
            const winner = getWinner(m);
            const aWon = winner === 'A';
            const bWon = winner === 'B';

            return (
              <div
                key={m.name}
                className="p-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-center hover:bg-terminal-bg/40 transition-colors"
              >
                {/* Metric Title & Desc */}
                <div className="md:col-span-4">
                  <div className="text-sm font-bold text-terminal-white flex items-center gap-2">
                    {m.name}
                  </div>
                  <div className="text-[11px] text-terminal-gray-dim mt-0.5">
                    Benchmark: <span className="text-terminal-gray">{m.benchmark}</span>
                  </div>
                  <div className="text-[11px] text-terminal-gray leading-tight mt-1 hidden sm:block">
                    {m.description}
                  </div>
                </div>

                {/* Ticker A Metric Column */}
                <div className="md:col-span-4 flex items-center justify-between p-3 rounded-lg border bg-terminal-bg/70 border-terminal-border">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-terminal-gray-dim font-bold">{first.ticker}</span>
                    <span
                      className={`text-lg font-bold ${
                        aWon
                          ? 'text-terminal-green glow-green'
                          : bWon
                            ? 'text-terminal-red'
                            : 'text-terminal-white'
                      }`}
                    >
                      {m.format(m.valA)}
                    </span>
                  </div>
                  {aWon ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-terminal-green/20 text-terminal-green border border-terminal-green/40">
                      ★ SUPERIOR
                    </span>
                  ) : bWon ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-terminal-red/10 text-terminal-red border border-terminal-red/30">
                      LAGGING
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] text-terminal-gray border border-terminal-border">
                      TIED
                    </span>
                  )}
                </div>

                {/* Ticker B Metric Column */}
                <div className="md:col-span-4 flex items-center justify-between p-3 rounded-lg border bg-terminal-bg/70 border-terminal-border">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-terminal-gray-dim font-bold">{second.ticker}</span>
                    <span
                      className={`text-lg font-bold ${
                        bWon
                          ? 'text-terminal-green glow-green'
                          : aWon
                            ? 'text-terminal-red'
                            : 'text-terminal-white'
                      }`}
                    >
                      {m.format(m.valB)}
                    </span>
                  </div>
                  {bWon ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-terminal-green/20 text-terminal-green border border-terminal-green/40">
                      ★ SUPERIOR
                    </span>
                  ) : aWon ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-terminal-red/10 text-terminal-red border border-terminal-red/30">
                      LAGGING
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] text-terminal-gray border border-terminal-border">
                      TIED
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Side-by-Side Agreed Facts Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Ticker A Agreed Facts */}
        <div className="bg-terminal-surface border border-terminal-border rounded-xl p-5">
          <div className="section-header flex items-center justify-between">
            <span>// {first.ticker} · VERIFIED AGREED FACTS</span>
            <span className="text-terminal-green">{first.judge_verdict.agreed_facts.length} ITEMS</span>
          </div>
          <ul className="space-y-2.5 mt-3">
            {first.judge_verdict.agreed_facts.map((fact, i) => (
              <li key={i} className="text-xs text-terminal-gray flex items-start gap-2 leading-relaxed">
                <span className="text-terminal-green font-bold shrink-0 mt-0.5">✓</span>
                <span>{fact}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Ticker B Agreed Facts */}
        <div className="bg-terminal-surface border border-terminal-border rounded-xl p-5">
          <div className="section-header flex items-center justify-between">
            <span>// {second.ticker} · VERIFIED AGREED FACTS</span>
            <span className="text-terminal-green">{second.judge_verdict.agreed_facts.length} ITEMS</span>
          </div>
          <ul className="space-y-2.5 mt-3">
            {second.judge_verdict.agreed_facts.map((fact, i) => (
              <li key={i} className="text-xs text-terminal-gray flex items-start gap-2 leading-relaxed">
                <span className="text-terminal-green font-bold shrink-0 mt-0.5">✓</span>
                <span>{fact}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Forensic Divergence & Critical Discrepancies */}
      <div className="bg-terminal-surface border border-terminal-border rounded-xl p-6">
        <div className="section-header flex items-center justify-between">
          <span>// KEY FORENSIC DIVERGENCE & ANOMALIES</span>
          <span className="text-terminal-amber">COMPARATIVE RISK PROVENANCE</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          {/* Ticker A Risk Breakdown */}
          <div className="p-4 rounded-lg bg-terminal-bg/60 border border-terminal-border">
            <div className="text-xs font-bold text-terminal-white mb-2 flex items-center gap-2">
              <span className="text-terminal-amber">⚡</span>
              <span>{first.ticker} Critical Signals & Disputed Theses:</span>
            </div>
            {scoreA.critical_signals.length === 0 && first.judge_verdict.disputed_theses.length === 0 ? (
              <div className="text-xs text-terminal-green">
                ✓ No critical signals or disputed fraud theses identified in filing.
              </div>
            ) : (
              <div className="space-y-2 text-xs">
                {scoreA.critical_signals.map((sig, i) => (
                  <div key={i} className="text-terminal-red flex items-start gap-2">
                    <span className="font-bold">⚠</span>
                    <span>{sig}</span>
                  </div>
                ))}
                {first.judge_verdict.disputed_theses.map((thesis, i) => (
                  <div key={i} className="text-terminal-amber flex items-start gap-2">
                    <span>›</span>
                    <span>{thesis}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Ticker B Risk Breakdown */}
          <div className="p-4 rounded-lg bg-terminal-bg/60 border border-terminal-border">
            <div className="text-xs font-bold text-terminal-white mb-2 flex items-center gap-2">
              <span className="text-terminal-amber">⚡</span>
              <span>{second.ticker} Critical Signals & Disputed Theses:</span>
            </div>
            {scoreB.critical_signals.length === 0 && second.judge_verdict.disputed_theses.length === 0 ? (
              <div className="text-xs text-terminal-green">
                ✓ No critical signals or disputed fraud theses identified in filing.
              </div>
            ) : (
              <div className="space-y-2 text-xs">
                {scoreB.critical_signals.map((sig, i) => (
                  <div key={i} className="text-terminal-red flex items-start gap-2">
                    <span className="font-bold">⚠</span>
                    <span>{sig}</span>
                  </div>
                ))}
                {second.judge_verdict.disputed_theses.map((thesis, i) => (
                  <div key={i} className="text-terminal-amber flex items-start gap-2">
                    <span>›</span>
                    <span>{thesis}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
