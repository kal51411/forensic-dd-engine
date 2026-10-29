'use client';

import { TickerSearch } from '@/components/TickerSearch';
import { motion } from 'framer-motion';

const STATS = [
  { label: '33 UNIT TESTS', color: 'text-terminal-green' },
  { label: '97.6% COVERAGE', color: 'text-terminal-green' },
  { label: 'BENEISH + SLOAN + ALTMAN', color: 'text-terminal-amber' },
  { label: 'ZERO LLM ARITHMETIC', color: 'text-terminal-red' },
  { label: 'CITATION-VERIFIED ANSWERS', color: 'text-terminal-green' },
  { label: 'SEC EDGAR LIVE INGEST', color: 'text-terminal-green' },
];

export default function HomePage() {
  return (
    <div className="relative min-h-[calc(100vh-65px)] flex flex-col items-center justify-center grid-bg overflow-hidden">
      {/* Radial glow behind hero */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 60% 40% at 50% 40%, rgba(0,255,136,0.06) 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10 flex flex-col items-center gap-8 px-6 max-w-4xl w-full text-center">
        {/* Hero title */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center gap-2"
        >
          <div className="text-xs text-terminal-gray-dim tracking-[0.3em] mb-2">
            SEC 10-K · MULTI-AGENT FORENSIC AUDIT SYSTEM
          </div>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight glow-green cursor-blink">
            FORENSIC DUE DILIGENCE ENGINE
          </h1>
          <p className="text-terminal-gray text-sm mt-3 max-w-xl leading-relaxed">
            Deterministic-first forensic audit over SEC filings. Every number
            from a unit-tested Python function. Every claim citation-verified
            against the raw 10-K. Multi-agent adversarial debate committee.
          </p>
        </motion.div>

        {/* Stats ribbon */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="flex flex-wrap justify-center gap-2"
        >
          {STATS.map((stat, i) => (
            <span
              key={i}
              className={`text-xs ${stat.color} border border-terminal-border bg-terminal-surface px-3 py-1 rounded`}
            >
              {stat.label}
            </span>
          ))}
        </motion.div>

        {/* Search bar */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="w-full"
        >
          <TickerSearch />
        </motion.div>

        {/* Architecture callouts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="grid grid-cols-3 gap-4 w-full mt-4 text-xs"
        >
          {[
            {
              label: 'QUANT ENGINE',
              desc: 'Beneish · Sloan · Altman · EBITDA Bridge · Covenant Headroom',
              color: 'terminal-border-green',
            },
            {
              label: 'DEBATE COMMITTEE',
              desc: 'Bear Agent → Bull Agent → Fact Checker → Judge (4-stage pipeline)',
              color: 'terminal-border-amber',
            },
            {
              label: 'CITATION VALIDATOR',
              desc: 'Every claim validated against char_span allowlist. Hallucinations rejected.',
              color: 'terminal-border-red',
            },
          ].map((card) => (
            <div
              key={card.label}
              className={`bg-terminal-surface ${card.color} rounded p-4 text-left`}
            >
              <div className="text-terminal-green font-bold tracking-wider mb-2">
                // {card.label}
              </div>
              <div className="text-terminal-gray leading-relaxed">{card.desc}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
