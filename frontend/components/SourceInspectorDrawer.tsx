'use client';

import { motion, AnimatePresence } from 'framer-motion';
import type { Citation } from '@/lib/types';

interface Props {
  citation: Citation | null;
  onClose: () => void;
}

export function SourceInspectorDrawer({ citation, onClose }: Props) {
  if (!citation) return null;

  const [charStart, charEnd] = citation.char_span;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Drawer panel */}
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="relative w-full max-w-xl bg-terminal-surface border-l border-terminal-border h-full shadow-2xl flex flex-col z-10"
        >
          {/* Header */}
          <div className="p-5 border-b border-terminal-border flex items-center justify-between bg-terminal-bg/50">
            <div>
              <div className="text-xs font-mono text-terminal-green tracking-widest font-semibold">
                // SOURCE INSPECTOR
              </div>
              <div className="text-sm font-bold text-terminal-white mt-1">
                [{citation.ticker}] {citation.item}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-terminal-gray hover:text-terminal-white hover:bg-terminal-border/50 rounded transition-colors text-xs font-mono"
            >
              [✕ CLOSE]
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <div className="text-xs text-terminal-gray-dim flex justify-between font-mono">
              <span>PROVENANCE: SEC 10-K FILING CHUNK</span>
              <span>
                OFFSET SPAN: [{charStart}, {charEnd}]
              </span>
            </div>

            <div className="bg-terminal-bg rounded p-4 border border-terminal-border font-mono text-xs text-terminal-gray leading-relaxed overflow-x-auto select-text">
              <span className="text-terminal-gray-dim select-none">
                [...DISCLOSURE STREAM EXTRACT...]
                {'\n\n'}
              </span>

              {/* Highlighted segment */}
              <mark className="bg-yellow-400 text-black font-semibold px-1 py-0.5 rounded-sm shadow-[0_0_10px_rgba(250,204,21,0.5)]">
                {citation.excerpt}
              </mark>

              <span className="text-terminal-gray-dim select-none">
                {'\n\n'}[...VERIFIED CITATION ALLOWLIST HIT...]
              </span>
            </div>

            {/* Metadata Box */}
            <div className="p-4 rounded border border-terminal-border bg-terminal-bg/30 text-xs font-mono space-y-2">
              <div className="text-terminal-green text-[11px] font-bold">
                EVIDENTIARY AUDIT TRAIL
              </div>
              <div className="text-terminal-gray">
                <span className="text-terminal-gray-dim">Chunk ID:</span>{' '}
                <span className="text-terminal-white break-all">{citation.chunk_id}</span>
              </div>
              <div className="text-terminal-gray">
                <span className="text-terminal-gray-dim">Filing Item:</span>{' '}
                <span className="text-terminal-white">{citation.item}</span>
              </div>
              <div className="text-terminal-gray">
                <span className="text-terminal-gray-dim">Target Entity:</span>{' '}
                <span className="text-terminal-white">{citation.ticker}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-terminal-border bg-terminal-bg/50 text-[11px] font-mono text-terminal-gray-dim flex items-center justify-between">
            <span>HARD CONSTRAINT: ZERO ARITHMETIC</span>
            <span className="text-terminal-green">DETERMINISTIC SPAN MATCH</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
