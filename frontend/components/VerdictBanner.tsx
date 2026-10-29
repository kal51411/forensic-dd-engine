'use client';

import { motion } from 'framer-motion';
import type { JudgeVerdict } from '@/lib/types';

interface Props {
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
}: Props) {
  const isCritical = verdict.composite_verdict === 'CRITICAL_RED_FLAG';
  const isElevated = verdict.composite_verdict === 'ELEVATED_RISK';
  const isClean = verdict.composite_verdict === 'CLEAN_AUDIT';

  const bannerColor = isCritical
    ? 'border-terminal-red bg-terminal-red/10 text-terminal-red shadow-[0_0_20px_rgba(255,68,68,0.2)]'
    : isElevated
      ? 'border-terminal-amber bg-terminal-amber/10 text-terminal-amber shadow-[0_0_20px_rgba(251,191,36,0.2)]'
      : 'border-terminal-green bg-terminal-green/10 text-terminal-green shadow-[0_0_20px_rgba(0,255,136,0.2)]';

  const icon = isCritical ? '⚠' : isElevated ? '⚡' : '✓';
  const statusLabel = isCritical
    ? 'CRITICAL RED FLAG — EARNINGS MANIPULATOR SUSPECT'
    : isElevated
      ? 'ELEVATED RISK — DIVERGENCE & ACCRUAL CONCERNS'
      : 'CLEAN AUDIT — NO SYSTEMIC MANIPULATION DETECTED';

  return (
    <motion.div
      initial={{ y: -30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="max-w-screen-xl mx-auto px-6 py-6"
    >
      <div className={`border rounded-lg p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 ${bannerColor}`}>
        <div className="flex items-center gap-4">
          <div className="text-3xl font-mono shrink-0">{icon}</div>
          <div>
            <div className="text-xs uppercase tracking-widest font-mono font-bold opacity-80">
              {entityName} ({ticker}) · FY{fiscalYear} AUDIT RULING
            </div>
            <div className="text-lg md:text-xl font-bold font-mono tracking-tight mt-0.5">
              {statusLabel}
            </div>
            {accessionNumber && (
              <div className="text-[11px] font-mono opacity-70 mt-1">
                SEC ACCESSION: {accessionNumber}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 font-mono shrink-0">
          <div className="text-right">
            <div className="text-[10px] uppercase opacity-70">CONFIDENCE</div>
            <div className="text-sm font-bold">
              {(verdict.confidence_score * 100).toFixed(1)}%
            </div>
          </div>

          {cached && (
            <span className="px-2 py-0.5 rounded text-[10px] bg-terminal-border/80 text-terminal-gray border border-terminal-border">
              CACHE HIT
            </span>
          )}

          {verdict.human_review_required && (
            <span className="px-2 py-0.5 rounded text-[10px] bg-terminal-red/20 text-terminal-red border border-terminal-red/40 animate-pulse">
              HUMAN REVIEW REQ
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
