'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { DebateTurn, FactCheckVerdict, Citation } from '@/lib/types';
import { FactCheckerBadge } from './FactCheckerBadge';
import { CitationPill } from './CitationPill';
import { SourceInspectorDrawer } from './SourceInspectorDrawer';

export interface DebateArenaProps {
  turns: DebateTurn[];
  factChecks: FactCheckVerdict[];
}

export function DebateArena({ turns, factChecks }: DebateArenaProps) {
  const [selectedCitation, setSelectedCitation] = useState<Citation | null>(null);
  const [hoveredCitation, setHoveredCitation] = useState<Citation | null>(null);

  // Group into Bear vs Bull turns
  const bearTurn = turns.find((t) => t.speaker === 'BEAR');
  const bullTurn = turns.find((t) => t.speaker === 'BULL');

  // Match fact checks: index 0 = bear, index 1 = bull (or by context)
  const bearFC: FactCheckVerdict | undefined = factChecks[0];
  const bullFC: FactCheckVerdict | undefined = factChecks[1];

  return (
    <>
      <div className="space-y-4 font-mono">
        {/* Courtroom Deliberation Header Bar */}
        <div className="bg-terminal-surface border border-terminal-border rounded-lg p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-sm">⚖️</span>
            <span className="text-white font-bold tracking-wider">
              FORENSIC COURTROOM PROCEEDINGS
            </span>
            <span className="text-terminal-gray-dim hidden sm:inline-block">│</span>
            <span className="text-terminal-gray hidden sm:inline-block">
              ADVERSARIAL AGENT CROSS-EXAMINATION
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1.5 text-terminal-red">
              <span className="w-2 h-2 rounded-full bg-terminal-red animate-pulse" />
              SHORT THESIS (BEAR)
            </span>
            <span className="text-terminal-border">vs</span>
            <span className="flex items-center gap-1.5 text-terminal-green">
              <span className="w-2 h-2 rounded-full bg-terminal-green animate-pulse" />
              LONG THESIS (BULL)
            </span>
          </div>
        </div>

        {/* Split View Grid: Bear (Prosecution) vs Bull (Defense) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          {/* ================= BEAR AGENT (PROSECUTION) ================= */}
          {bearTurn ? (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
              className="bg-terminal-surface border border-terminal-red/40 rounded-xl p-5 flex flex-col justify-between shadow-[0_0_20px_rgba(255,68,68,0.08)] relative overflow-hidden"
            >
              {/* Top Accent Line */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-terminal-red via-terminal-red/60 to-transparent" />

              <div className="space-y-4">
                {/* Bear Header */}
                <div className="flex items-center justify-between pb-3 border-b border-terminal-red/30">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-terminal-red/20 text-terminal-red border border-terminal-red/40">
                      PROSECUTION
                    </span>
                    <span className="text-terminal-red font-bold text-xs tracking-wider flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-terminal-red animate-pulse" />
                      BEAR FORENSIC AGENT
                    </span>
                  </div>

                  {bearFC && (
                    <FactCheckerBadge
                      verified={bearFC.all_quant_claims_verified && bearFC.all_citations_verified}
                      label={
                        bearFC.all_quant_claims_verified && bearFC.all_citations_verified
                          ? 'FACTS 100% VERIFIED'
                          : 'FACT DISCREPANCY'
                      }
                    />
                  )}
                </div>

                {/* Thesis Statement */}
                <div className="bg-terminal-bg/60 border border-terminal-red/20 rounded-lg p-3.5">
                  <div className="text-[10px] uppercase text-terminal-red font-bold tracking-wider mb-1 flex items-center gap-1">
                    <span>⚠</span>
                    <span>PRIMARY SHORT / RISK THESIS</span>
                  </div>
                  <h4 className="text-sm font-semibold text-terminal-white italic leading-snug">
                    "{bearTurn.thesis}"
                  </h4>
                </div>

                {/* Argument Body */}
                <div className="space-y-1">
                  <div className="text-[10px] uppercase tracking-wider text-terminal-gray-dim font-bold">
                    CROSS-EXAMINATION DISCLOSURES:
                  </div>
                  <p className="text-xs text-terminal-gray leading-relaxed font-sans bg-terminal-bg/30 p-3 rounded border border-terminal-border/40">
                    {bearTurn.argument}
                  </p>
                </div>

                {/* Quantitative Claims Grid */}
                {Object.keys(bearTurn.quantitative_claims).length > 0 && (
                  <div className="pt-2">
                    <div className="flex items-center justify-between text-[10px] font-mono text-terminal-gray-dim uppercase mb-2 font-bold">
                      <span>AUDITED QUANTITATIVE CLAIMS</span>
                      <span className="text-terminal-red">
                        {Object.keys(bearTurn.quantitative_claims).length} EXTRACTED METRICS
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {Object.entries(bearTurn.quantitative_claims).map(([metric, val]) => (
                        <div
                          key={metric}
                          className="flex items-center justify-between bg-terminal-bg/80 px-2.5 py-1.5 rounded border border-terminal-red/20"
                        >
                          <span className="text-[11px] text-terminal-gray truncate mr-2" title={metric}>
                            {metric}
                          </span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-xs font-bold text-terminal-white">
                              {typeof val === 'number'
                                ? val > 1000
                                  ? val.toLocaleString()
                                  : val.toFixed(2)
                                : String(val)}
                            </span>
                            <span className="text-[9px] text-terminal-green font-bold">✓</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* FactChecker Audit Results */}
                {bearFC && (
                  <div className="pt-3 border-t border-terminal-border/60 text-xs">
                    <div className="flex items-center justify-between text-[10px] text-terminal-gray-dim uppercase font-bold mb-1.5">
                      <span>ZERO-HALLUCINATION AUDIT TRIAL</span>
                      <span className="text-terminal-green">
                        {bearFC.verified_citations.length} VERIFIED CITATIONS
                      </span>
                    </div>

                    {/* Discrepancies if any */}
                    {bearFC.discrepancies.length > 0 && (
                      <div className="bg-terminal-red/10 border border-terminal-red/40 rounded p-2 text-terminal-red text-[11px] mb-2 space-y-1">
                        <div className="font-bold">⚠ DISCREPANCIES DETECTED:</div>
                        {bearFC.discrepancies.map((disc, idx) => (
                          <div key={idx} className="flex items-center gap-1">
                            <span>›</span>
                            <span>{disc}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Hallucinated Citations if any */}
                    {bearFC.hallucinated_citations.length > 0 && (
                      <div className="bg-terminal-red/20 border border-terminal-red rounded p-2 text-terminal-red text-[11px] mb-2">
                        <span className="font-bold">✗ REJECTED HALLUCINATIONS:</span>{' '}
                        {bearFC.hallucinated_citations.join(', ')}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Supporting Citations Footer */}
              {bearTurn.citations.length > 0 && (
                <div className="mt-5 pt-3 border-t border-terminal-border">
                  <div className="flex items-center justify-between text-[10px] font-mono text-terminal-gray-dim uppercase mb-2">
                    <span>EVIDENTIARY CITATIONS (CLICK TO INSPECT)</span>
                    <span className="text-terminal-amber">{bearTurn.citations.length} CITATIONS</span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {bearTurn.citations.map((c, i) => (
                      <div
                        key={i}
                        onMouseEnter={() => setHoveredCitation(c)}
                        onMouseLeave={() => setHoveredCitation(null)}
                        className="relative"
                      >
                        <CitationPill
                          citation={c}
                          onOpen={(cite) => setSelectedCitation(cite)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <div className="bg-terminal-surface border border-terminal-border rounded-xl p-8 text-center text-terminal-gray-dim flex items-center justify-center">
              No Bear arguments submitted for this filing.
            </div>
          )}

          {/* ================= BULL AGENT (DEFENSE) ================= */}
          {bullTurn ? (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
              className="bg-terminal-surface border border-terminal-green/40 rounded-xl p-5 flex flex-col justify-between shadow-[0_0_20px_rgba(0,255,136,0.08)] relative overflow-hidden"
            >
              {/* Top Accent Line */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-terminal-green via-terminal-green/60 to-transparent" />

              <div className="space-y-4">
                {/* Bull Header */}
                <div className="flex items-center justify-between pb-3 border-b border-terminal-green/30">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-terminal-green/20 text-terminal-green border border-terminal-green/40">
                      DEFENSE
                    </span>
                    <span className="text-terminal-green font-bold text-xs tracking-wider flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-terminal-green animate-pulse" />
                      BULL FORENSIC AGENT
                    </span>
                  </div>

                  {bullFC && (
                    <FactCheckerBadge
                      verified={bullFC.all_quant_claims_verified && bullFC.all_citations_verified}
                      label={
                        bullFC.all_quant_claims_verified && bullFC.all_citations_verified
                          ? 'FACTS 100% VERIFIED'
                          : 'FACT DISCREPANCY'
                      }
                    />
                  )}
                </div>

                {/* Thesis Statement */}
                <div className="bg-terminal-bg/60 border border-terminal-green/20 rounded-lg p-3.5">
                  <div className="text-[10px] uppercase text-terminal-green font-bold tracking-wider mb-1 flex items-center gap-1">
                    <span>✓</span>
                    <span>PRIMARY REBUTTAL / SOLVENCY THESIS</span>
                  </div>
                  <h4 className="text-sm font-semibold text-terminal-white italic leading-snug">
                    "{bullTurn.thesis}"
                  </h4>
                </div>

                {/* Argument Body */}
                <div className="space-y-1">
                  <div className="text-[10px] uppercase tracking-wider text-terminal-gray-dim font-bold">
                    REBUTTAL & OPERATIONAL BUFFER EVIDENCE:
                  </div>
                  <p className="text-xs text-terminal-gray leading-relaxed font-sans bg-terminal-bg/30 p-3 rounded border border-terminal-border/40">
                    {bullTurn.argument}
                  </p>
                </div>

                {/* Quantitative Claims Grid */}
                {Object.keys(bullTurn.quantitative_claims).length > 0 && (
                  <div className="pt-2">
                    <div className="flex items-center justify-between text-[10px] font-mono text-terminal-gray-dim uppercase mb-2 font-bold">
                      <span>AUDITED QUANTITATIVE CLAIMS</span>
                      <span className="text-terminal-green">
                        {Object.keys(bullTurn.quantitative_claims).length} EXTRACTED METRICS
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {Object.entries(bullTurn.quantitative_claims).map(([metric, val]) => (
                        <div
                          key={metric}
                          className="flex items-center justify-between bg-terminal-bg/80 px-2.5 py-1.5 rounded border border-terminal-green/20"
                        >
                          <span className="text-[11px] text-terminal-gray truncate mr-2" title={metric}>
                            {metric}
                          </span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-xs font-bold text-terminal-white">
                              {typeof val === 'number'
                                ? val > 1000
                                  ? val.toLocaleString()
                                  : val.toFixed(2)
                                : String(val)}
                            </span>
                            <span className="text-[9px] text-terminal-green font-bold">✓</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* FactChecker Audit Results */}
                {bullFC && (
                  <div className="pt-3 border-t border-terminal-border/60 text-xs">
                    <div className="flex items-center justify-between text-[10px] text-terminal-gray-dim uppercase font-bold mb-1.5">
                      <span>ZERO-HALLUCINATION AUDIT TRIAL</span>
                      <span className="text-terminal-green">
                        {bullFC.verified_citations.length} VERIFIED CITATIONS
                      </span>
                    </div>

                    {/* Discrepancies if any */}
                    {bullFC.discrepancies.length > 0 && (
                      <div className="bg-terminal-red/10 border border-terminal-red/40 rounded p-2 text-terminal-red text-[11px] mb-2 space-y-1">
                        <div className="font-bold">⚠ DISCREPANCIES DETECTED:</div>
                        {bullFC.discrepancies.map((disc, idx) => (
                          <div key={idx} className="flex items-center gap-1">
                            <span>›</span>
                            <span>{disc}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Hallucinated Citations if any */}
                    {bullFC.hallucinated_citations.length > 0 && (
                      <div className="bg-terminal-red/20 border border-terminal-red rounded p-2 text-terminal-red text-[11px] mb-2">
                        <span className="font-bold">✗ REJECTED HALLUCINATIONS:</span>{' '}
                        {bullFC.hallucinated_citations.join(', ')}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Supporting Citations Footer */}
              {bullTurn.citations.length > 0 && (
                <div className="mt-5 pt-3 border-t border-terminal-border">
                  <div className="flex items-center justify-between text-[10px] font-mono text-terminal-gray-dim uppercase mb-2">
                    <span>EVIDENTIARY CITATIONS (CLICK TO INSPECT)</span>
                    <span className="text-terminal-green">{bullTurn.citations.length} CITATIONS</span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {bullTurn.citations.map((c, i) => (
                      <div
                        key={i}
                        onMouseEnter={() => setHoveredCitation(c)}
                        onMouseLeave={() => setHoveredCitation(null)}
                        className="relative"
                      >
                        <CitationPill
                          citation={c}
                          onOpen={(cite) => setSelectedCitation(cite)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <div className="bg-terminal-surface border border-terminal-border rounded-xl p-8 text-center text-terminal-gray-dim flex items-center justify-center">
              No Bull arguments submitted for this filing.
            </div>
          )}
        </div>

        {/* Hover Excerpt Preview Popover */}
        <AnimatePresence>
          {hoveredCitation && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="p-3.5 bg-terminal-bg border border-terminal-amber/50 rounded-lg shadow-2xl text-xs space-y-1.5"
            >
              <div className="flex items-center justify-between text-[10px] text-terminal-amber font-bold">
                <span>
                  § SEC EXCERPT PREVIEW · [{hoveredCitation.ticker}] {hoveredCitation.item}
                </span>
                <span className="text-terminal-gray-dim font-mono">
                  OFFSET SPAN: [{hoveredCitation.char_span[0]}, {hoveredCitation.char_span[1]}]
                </span>
              </div>
              <p className="text-terminal-white italic font-mono bg-terminal-surface/80 p-2.5 rounded border border-terminal-border">
                "{hoveredCitation.excerpt}"
              </p>
              <div className="text-[10px] text-terminal-gray-dim flex justify-between items-center">
                <span>CHUNK ID: {hoveredCitation.chunk_id}</span>
                <span className="text-terminal-amber">Click pill to open Full Source Inspector Drawer ↗</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Source Inspector Drawer Modal */}
      <SourceInspectorDrawer
        citation={selectedCitation}
        onClose={() => setSelectedCitation(null)}
      />
    </>
  );
}
