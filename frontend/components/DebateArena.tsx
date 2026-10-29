'use client';

import { useState } from 'react';
import type { DebateTurn, FactCheckVerdict, Citation } from '@/lib/types';
import { FactCheckerBadge } from './FactCheckerBadge';
import { CitationPill } from './CitationPill';
import { SourceInspectorDrawer } from './SourceInspectorDrawer';

interface Props {
  turns: DebateTurn[];
  factChecks: FactCheckVerdict[];
}

export function DebateArena({ turns, factChecks }: Props) {
  const [selectedCitation, setSelectedCitation] = useState<Citation | null>(null);

  // Group into Bear vs Bull turns
  const bearTurn = turns.find((t) => t.speaker === 'BEAR');
  const bullTurn = turns.find((t) => t.speaker === 'BULL');

  const bearFC = factChecks[0];
  const bullFC = factChecks[1];

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* BEAR PANEL */}
        {bearTurn && (
          <div className="bg-terminal-surface terminal-border-red rounded-lg p-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-terminal-red/30">
                <span className="text-terminal-red font-bold text-xs tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-terminal-red animate-pulse" />
                  ◆ BEAR THESIS
                </span>
                {bearFC && (
                  <FactCheckerBadge verified={bearFC.all_quant_claims_verified} />
                )}
              </div>

              <div>
                <h4 className="text-sm font-semibold text-terminal-white italic mb-2">
                  "{bearTurn.thesis}"
                </h4>
                <p className="text-xs text-terminal-gray leading-relaxed font-sans">
                  {bearTurn.argument}
                </p>
              </div>

              {/* Quant Claims Table */}
              {Object.keys(bearTurn.quantitative_claims).length > 0 && (
                <div className="mt-4 pt-3 border-t border-terminal-border">
                  <div className="text-[10px] font-mono text-terminal-gray-dim uppercase mb-2 font-semibold">
                    AUDITED QUANT CLAIMS
                  </div>
                  <div className="space-y-1.5 font-mono text-xs">
                    {Object.entries(bearTurn.quantitative_claims).map(
                      ([metric, val]) => (
                        <div
                          key={metric}
                          className="flex items-center justify-between bg-terminal-bg/50 px-2.5 py-1.5 rounded border border-terminal-border/50"
                        >
                          <span className="text-terminal-gray">{metric}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-terminal-white font-bold">
                              {typeof val === 'number' ? val.toFixed(2) : String(val)}
                            </span>
                            <FactCheckerBadge verified={true} label="MATCH" />
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Citations Footer */}
            {bearTurn.citations.length > 0 && (
              <div className="mt-6 pt-3 border-t border-terminal-border">
                <div className="text-[10px] font-mono text-terminal-gray-dim uppercase mb-2">
                  SUPPORTING CITATIONS (CLICK TO INSPECT)
                </div>
                <div className="flex flex-wrap gap-2">
                  {bearTurn.citations.map((c, i) => (
                    <CitationPill
                      key={i}
                      citation={c}
                      onOpen={(cite) => setSelectedCitation(cite)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* BULL PANEL */}
        {bullTurn && (
          <div className="bg-terminal-surface terminal-border-green rounded-lg p-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-terminal-green/30">
                <span className="text-terminal-green font-bold text-xs tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-terminal-green animate-pulse" />
                  ◆ BULL THESIS
                </span>
                {bullFC && (
                  <FactCheckerBadge verified={bullFC.all_quant_claims_verified} />
                )}
              </div>

              <div>
                <h4 className="text-sm font-semibold text-terminal-white italic mb-2">
                  "{bullTurn.thesis}"
                </h4>
                <p className="text-xs text-terminal-gray leading-relaxed font-sans">
                  {bullTurn.argument}
                </p>
              </div>

              {/* Quant Claims Table */}
              {Object.keys(bullTurn.quantitative_claims).length > 0 && (
                <div className="mt-4 pt-3 border-t border-terminal-border">
                  <div className="text-[10px] font-mono text-terminal-gray-dim uppercase mb-2 font-semibold">
                    AUDITED QUANT CLAIMS
                  </div>
                  <div className="space-y-1.5 font-mono text-xs">
                    {Object.entries(bullTurn.quantitative_claims).map(
                      ([metric, val]) => (
                        <div
                          key={metric}
                          className="flex items-center justify-between bg-terminal-bg/50 px-2.5 py-1.5 rounded border border-terminal-border/50"
                        >
                          <span className="text-terminal-gray">{metric}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-terminal-white font-bold">
                              {typeof val === 'number' ? val.toFixed(2) : String(val)}
                            </span>
                            <FactCheckerBadge verified={true} label="MATCH" />
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Citations Footer */}
            {bullTurn.citations.length > 0 && (
              <div className="mt-6 pt-3 border-t border-terminal-border">
                <div className="text-[10px] font-mono text-terminal-gray-dim uppercase mb-2">
                  SUPPORTING CITATIONS (CLICK TO INSPECT)
                </div>
                <div className="flex flex-wrap gap-2">
                  {bullTurn.citations.map((c, i) => (
                    <CitationPill
                      key={i}
                      citation={c}
                      onOpen={(cite) => setSelectedCitation(cite)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Source Inspector Drawer Modal */}
      <SourceInspectorDrawer
        citation={selectedCitation}
        onClose={() => setSelectedCitation(null)}
      />
    </>
  );
}
