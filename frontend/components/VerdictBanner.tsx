'use client';

import { motion } from 'framer-motion';
import type { JudgeVerdict } from '@/lib/types';

export interface VerdictBannerProps {
  verdict: JudgeVerdict;
  entityName: string;
  ticker: string;
  fiscalYear: number;
  cached?: boolean;
  accessionNumber?: string;
}

export function VerdictBanner({
  verdict,
  entityName,
  ticker,
  fiscalYear,
  cached,
  accessionNumber,
}: VerdictBannerProps) {
  const isCritical = verdict.composite_verdict === 'CRITICAL_RED_FLAG';
  const isElevated = verdict.composite_verdict === 'ELEVATED_RISK';
  const isClean = verdict.composite_verdict === 'CLEAN_AUDIT';

  const confidencePct = Math.min(100, Math.max(0, verdict.confidence_score * 100));

  // Dynamic gradient glow and borders
  const bannerTheme = isCritical
    ? {
        border: 'border-terminal-red/60',
        bgGradient: 'bg-gradient-to-r from-terminal-red/15 via-terminal-surface to-terminal-bg',
        shadow: 'shadow-[0_0_35px_rgba(255,68,68,0.2)]',
        accentText: 'text-terminal-red',
        accentBg: 'bg-terminal-red',
        meterFill: 'bg-terminal-red',
        meterGlow: 'shadow-[0_0_12px_rgba(255,68,68,0.7)]',
        statusText: 'CRITICAL RED FLAG — EARNINGS MANIPULATOR SUSPECT',
        icon: '⚠',
      }
    : isElevated
      ? {
          border: 'border-terminal-amber/60',
          bgGradient: 'bg-gradient-to-r from-terminal-amber/15 via-terminal-surface to-terminal-bg',
          shadow: 'shadow-[0_0_35px_rgba(251,191,36,0.2)]',
          accentText: 'text-terminal-amber',
          accentBg: 'bg-terminal-amber',
          meterFill: 'bg-terminal-amber',
          meterGlow: 'shadow-[0_0_12px_rgba(251,191,36,0.7)]',
          statusText: 'ELEVATED RISK — DIVERGENCE & ACCRUAL CONCERNS',
          icon: '⚡',
        }
      : {
          border: 'border-terminal-green/60',
          bgGradient: 'bg-gradient-to-r from-terminal-green/15 via-terminal-surface to-terminal-bg',
          shadow: 'shadow-[0_0_35px_rgba(0,255,136,0.2)]',
          accentText: 'text-terminal-green',
          accentBg: 'bg-terminal-green',
          meterFill: 'bg-terminal-green',
          meterGlow: 'shadow-[0_0_12px_rgba(0,255,136,0.7)]',
          statusText: 'CLEAN AUDIT — NO SYSTEMIC MANIPULATION DETECTED',
          icon: '✓',
        };

  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="max-w-screen-xl mx-auto px-6 py-6 font-mono"
    >
      <div
        className={`border rounded-xl p-6 ${bannerTheme.border} ${bannerTheme.bgGradient} ${bannerTheme.shadow} backdrop-blur-md relative overflow-hidden`}
      >
        {/* Subtle Background Scanline Accent */}
        <div className="absolute top-0 right-0 w-96 h-full pointer-events-none opacity-20 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white/10 to-transparent" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Left Column: Entity and Ruling */}
          <div className="flex items-start gap-4">
            <div
              className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl font-bold shrink-0 border ${bannerTheme.border} bg-terminal-bg/70 ${bannerTheme.accentText}`}
            >
              {bannerTheme.icon}
            </div>

            <div className="space-y-1.5">
              {/* Header Badges */}
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold">
                <span className="text-white tracking-wider">
                  {entityName}
                </span>
                <span className="text-terminal-gray-dim">·</span>
                <span className="text-terminal-green font-bold">${ticker}</span>
                <span className="text-terminal-gray-dim">·</span>
                <span className="px-2 py-0.5 rounded bg-terminal-surface border border-terminal-border text-terminal-gray">
                  FY{fiscalYear} 10-K
                </span>
                {accessionNumber && (
                  <span className="px-2 py-0.5 rounded bg-terminal-surface border border-terminal-border text-terminal-gray-dim hidden sm:inline-block">
                    ACCESSION: {accessionNumber}
                  </span>
                )}
              </div>

              {/* Status Ruling Title */}
              <h1
                className={`text-xl md:text-2xl font-bold tracking-tight ${bannerTheme.accentText}`}
              >
                {bannerTheme.statusText}
              </h1>

              {/* Status Sub-Badges */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                    verdict.quant_red_flag_count > 0
                      ? 'text-terminal-red border-terminal-red/40 bg-terminal-red/10'
                      : 'text-terminal-green border-terminal-green/40 bg-terminal-green/10'
                  }`}
                >
                  {verdict.quant_red_flag_count > 0
                    ? `⚠ ${verdict.quant_red_flag_count} QUANT RED FLAGS`
                    : '✓ 0 QUANT RED FLAGS'}
                </span>

                {cached ? (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-terminal-border/60 text-terminal-gray border border-terminal-border">
                    ⚡ CACHE HIT
                  </span>
                ) : (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-terminal-green/10 text-terminal-green border border-terminal-green/30">
                    📡 LIVE SEC EDGAR
                  </span>
                )}

                {verdict.human_review_required && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-terminal-red/20 text-terminal-red border border-terminal-red/60 animate-pulse">
                    ⚠ HUMAN REVIEW REQUIRED
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Animated Confidence Meter */}
          <div className="lg:w-72 shrink-0 bg-terminal-bg/70 border border-terminal-border rounded-lg p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase tracking-wider text-terminal-gray-dim font-bold">
                AUDIT ENGINE CONFIDENCE
              </span>
              <span className={`text-base font-bold ${bannerTheme.accentText}`}>
                {confidencePct.toFixed(1)}%
              </span>
            </div>

            {/* Meter Bar Container */}
            <div className="w-full bg-terminal-border h-2.5 rounded-full overflow-hidden p-0.5 relative">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${confidencePct}%` }}
                transition={{ duration: 1.2, ease: 'easeOut', delay: 0.2 }}
                className={`h-full rounded-full ${bannerTheme.meterFill} ${bannerTheme.meterGlow}`}
              />
            </div>

            <div className="flex items-center justify-between mt-2 text-[10px] text-terminal-gray-dim">
              <span>0% LOW</span>
              <span>50% MED</span>
              <span>100% MAXIMUM</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
