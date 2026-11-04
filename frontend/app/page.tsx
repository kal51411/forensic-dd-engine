'use client';

import { TickerSearch } from '@/components/TickerSearch';
import { motion } from 'framer-motion';
import Link from 'next/link';

/* ───────── Ticker tape data ───────── */
const TAPE_ITEMS = [
  { sym: 'MSFT', val: '$3.21T', chg: '+0.82%', up: true },
  { sym: 'NVDA', val: '$3.61T', chg: '+1.44%', up: true },
  { sym: 'AAPL', val: '$3.09T', chg: '-0.21%', up: false },
  { sym: 'TSLA', val: '$1.11T', chg: '+2.33%', up: true },
  { sym: 'GME',  val: '$14.2B', chg: '+8.11%', up: true },
  { sym: 'ENRN', val: 'BANKRUPT', chg: '-100%', up: false },
  { sym: 'AMZN', val: '$2.1T',  chg: '+0.55%', up: true },
  { sym: 'META', val: '$1.7T',  chg: '+1.21%', up: true },
  { sym: 'GOOGL', val: '$2.4T', chg: '-0.14%', up: false },
  { sym: 'BRK.B', val: '$1.1T', chg: '+0.09%', up: true },
];

/* ───────── Recent audits showcase ───────── */
const RECENT_AUDITS = [
  {
    ticker: 'MSFT',
    name: 'Microsoft Corporation',
    verdict: 'CLEAN_AUDIT',
    confidence: 94.2,
    flags: 0,
    year: 2026,
    highlight: 'Zero manipulation signals. M-Score -2.28.',
  },
  {
    ticker: 'NVDA',
    name: 'NVIDIA Corporation',
    verdict: 'ELEVATED_RISK',
    confidence: 78.1,
    flags: 2,
    year: 2026,
    highlight: 'M-Score breach. Deferred revenue +142% YoY.',
  },
  {
    ticker: 'AAPL',
    name: 'Apple Inc.',
    verdict: 'CLEAN_AUDIT',
    confidence: 97.1,
    flags: 0,
    year: 2026,
    highlight: 'Best-in-class. FCF conversion 118%.',
  },
  {
    ticker: 'ENRN',
    name: 'Enron Corporation',
    verdict: 'CRITICAL_RED_FLAG',
    confidence: 99.6,
    flags: 7,
    year: 2000,
    highlight: '7 flags. M-Score -0.21. SPE fraud confirmed.',
  },
  {
    ticker: 'TSLA',
    name: 'Tesla, Inc.',
    verdict: 'ELEVATED_RISK',
    confidence: 80.2,
    flags: 3,
    year: 2026,
    highlight: 'Margin compression 580bps. Reg-credit dependency.',
  },
  {
    ticker: 'GME',
    name: 'GameStop Corp.',
    verdict: 'ELEVATED_RISK',
    confidence: 73.4,
    flags: 2,
    year: 2026,
    highlight: 'Altman Z 1.94 grey zone. Bitcoin treasury risk.',
  },
];

/* ───────── Pipeline steps ───────── */
const PIPELINE = [
  { n: '01', label: 'SEC EDGAR INGEST', desc: 'Real-time 10-K fetch at 10 req/s. XBRL structured extraction. 100% automated.', icon: '📡' },
  { n: '02', label: 'QUANT ENGINE', desc: 'Beneish M-Score (8 indices), Sloan Accruals, Altman Z-Score — zero LLM arithmetic.', icon: '⚙️' },
  { n: '03', label: 'ADVERSARIAL DEBATE', desc: 'Bear vs Bull agents argue the numbers. Fact-Checker rejects hallucinated citations.', icon: '⚔️' },
  { n: '04', label: 'JUDGE VERDICT', desc: 'Deterministic verdict: CLEAN / ELEVATED / CRITICAL. Confidence-scored. Traceable.', icon: '⚖️' },
];

/* ───────── Tech badges ───────── */
const TECH = ['Next.js 14', 'FastAPI', 'Neo4j', 'OpenTelemetry', 'Prometheus', 'LangSmith', 'Recharts', 'pytest · 97.6%'];

function verdictStyle(v: string) {
  if (v === 'CRITICAL_RED_FLAG') return { text: 'text-terminal-red', border: 'terminal-border-red', bg: 'bg-terminal-red/10', label: '🔴 CRITICAL' };
  if (v === 'ELEVATED_RISK')    return { text: 'text-terminal-amber', border: 'terminal-border-amber', bg: 'bg-terminal-amber/10', label: '🟡 ELEVATED' };
  return { text: 'text-terminal-green', border: 'terminal-border-green', bg: 'bg-terminal-green/10', label: '🟢 CLEAN' };
}

export default function HomePage() {
  return (
    <div className="relative min-h-screen bg-terminal-bg overflow-x-hidden">

      {/* ── Ticker Tape ── */}
      <div className="bg-terminal-surface border-b border-terminal-border py-1.5 overflow-hidden relative">
        <div className="ticker-tape flex gap-12 text-xs font-mono">
          {[...TAPE_ITEMS, ...TAPE_ITEMS].map((item, i) => (
            <span key={i} className="shrink-0 flex items-center gap-2">
              <span className="text-terminal-gray-dim font-bold">{item.sym}</span>
              <span className="text-white">{item.val}</span>
              <span className={item.up ? 'text-terminal-green' : 'text-terminal-red'}>{item.chg}</span>
              <span className="text-terminal-border">│</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── Hero ── */}
      <section className="relative grid-bg pt-20 pb-16 px-6 text-center overflow-hidden">
        {/* Radial glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 70% 50% at 50% 30%, rgba(0,255,136,0.07) 0%, transparent 70%)' }}
        />

        <motion.div
          initial={{ opacity: 0, y: -24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="relative z-10 flex flex-col items-center gap-6 max-w-5xl mx-auto"
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 text-xs text-terminal-green border border-terminal-green/30 bg-terminal-green/5 px-4 py-1.5 rounded-full tracking-widest">
            <span className="w-1.5 h-1.5 rounded-full bg-terminal-green animate-pulse inline-block" />
            SEC 10-K · MULTI-AGENT FORENSIC AUDIT SYSTEM · LIVE
          </div>

          {/* Title */}
          <div className="flex flex-col items-center gap-1">
            <div className="text-terminal-gray-dim text-xs tracking-[0.4em] mb-1">ENTERPRISE-GRADE</div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-none">
              <span className="glow-green">FORENSIC</span>
              <br />
              <span className="text-white">DUE DILIGENCE</span>
              <br />
              <span className="text-terminal-gray text-3xl md:text-4xl lg:text-5xl">ENGINE</span>
            </h1>
          </div>

          <p className="text-terminal-gray text-sm md:text-base max-w-2xl leading-relaxed">
            Deterministic-first forensic audit over SEC 10-K filings. Every number from a unit-tested
            Python function. Every claim citation-verified against the raw filing. Multi-agent adversarial
            debate committee with hallucination rejection.
          </p>

          {/* Tech badges */}
          <div className="flex flex-wrap justify-center gap-2 max-w-2xl">
            {TECH.map((t) => (
              <span key={t} className="text-xs text-terminal-gray-dim border border-terminal-border bg-terminal-surface px-2.5 py-1 rounded">
                {t}
              </span>
            ))}
          </div>

          {/* Search */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.4 }}
            className="w-full max-w-2xl"
          >
            <TickerSearch />
          </motion.div>

          <div className="text-xs text-terminal-gray-dim">
            Try: <span className="text-terminal-green">MSFT</span> · <span className="text-terminal-amber">NVDA</span> · <span className="text-terminal-red">ENRN</span> · <span className="text-terminal-amber">TSLA</span> · <span className="text-terminal-amber">GME</span>
          </div>
        </motion.div>
      </section>

      {/* ── Recent Audits Showcase ── */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="text-xs text-terminal-gray-dim tracking-[0.3em] mb-1">// AUDIT DATABASE</div>
              <h2 className="text-xl font-bold text-white">Pre-Loaded Forensic Reports</h2>
            </div>
            <Link
              href="/compare"
              className="text-xs border border-terminal-border bg-terminal-surface hover:border-terminal-green hover:text-terminal-green text-terminal-gray px-4 py-2 rounded transition-all"
            >
              ⇄ COMPARE TWO TICKERS
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {RECENT_AUDITS.map((audit, i) => {
              const s = verdictStyle(audit.verdict);
              return (
                <motion.div
                  key={audit.ticker}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * i, duration: 0.4 }}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                >
                  <Link href={`/audit/${audit.ticker}`}>
                    <div className={`glass-card ${s.border} rounded-xl p-5 cursor-pointer h-full flex flex-col gap-3 hover:shadow-lg transition-shadow group`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <div className={`text-2xl font-bold ${s.text} group-hover:text-shadow-glow`}>{audit.ticker}</div>
                          <div className="text-xs text-terminal-gray-dim mt-0.5">{audit.name}</div>
                        </div>
                        <div className={`text-xs font-bold px-2 py-1 rounded ${s.bg} ${s.text} border ${s.border} shrink-0`}>
                          {audit.flags > 0 ? `⚠ ${audit.flags} FLAGS` : '✓ CLEAN'}
                        </div>
                      </div>

                      <div className="text-xs text-terminal-gray leading-relaxed flex-1">
                        {audit.highlight}
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-terminal-border">
                        <span className={`text-xs font-bold ${s.text}`}>{s.label}</span>
                        <span className="text-xs text-terminal-gray-dim">FY{audit.year} · {audit.confidence}% conf.</span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </section>

      {/* ── How It Works Pipeline ── */}
      <section className="bg-terminal-surface border-t border-b border-terminal-border py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <div className="text-xs text-terminal-gray-dim tracking-[0.3em] mb-2">// SYSTEM ARCHITECTURE</div>
            <h2 className="text-xl font-bold text-white">How the Audit Pipeline Works</h2>
          </div>

          <div className="relative">
            {/* Connecting line desktop */}
            <div className="hidden md:block absolute top-10 left-[12.5%] right-[12.5%] h-px bg-terminal-border" />

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {PIPELINE.map((step, i) => (
                <motion.div
                  key={step.n}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15, duration: 0.5 }}
                  className="relative flex flex-col items-center text-center gap-3"
                >
                  <div className="relative z-10 w-20 h-20 rounded-full border-2 border-terminal-green bg-terminal-bg flex flex-col items-center justify-center">
                    <div className="text-2xl">{step.icon}</div>
                    <div className="text-terminal-green text-xs font-bold">{step.n}</div>
                  </div>
                  <div className="font-bold text-sm text-white tracking-wider">{step.label}</div>
                  <div className="text-xs text-terminal-gray leading-relaxed">{step.desc}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats Row ── */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { val: '35', label: 'Unit Tests Passing', color: 'text-terminal-green' },
            { val: '97.6%', label: 'Test Coverage', color: 'text-terminal-green' },
            { val: '$0.027', label: 'Cost per Audit (USD)', color: 'text-terminal-amber' },
            { val: '95.6%', label: 'Benchmark Score', color: 'text-terminal-green' },
          ].map((s) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="bg-terminal-surface terminal-border rounded-xl p-6"
            >
              <div className={`text-3xl font-bold ${s.color}`}>{s.val}</div>
              <div className="text-xs text-terminal-gray-dim mt-1">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Footer CTA ── */}
      <footer className="border-t border-terminal-border py-8 px-6 text-center">
        <div className="text-xs text-terminal-gray-dim space-y-2">
          <div>
            <a href="https://github.com/kal51411/forensic-dd-engine" target="_blank" rel="noopener noreferrer" className="hover:text-terminal-green transition-colors">
              GitHub: kal51411/forensic-dd-engine
            </a>
            {' · '}
            <span>Built with Next.js 14 + FastAPI + Neo4j + OpenTelemetry</span>
          </div>
          <div className="text-terminal-border">FORENSIC DD ENGINE · ALL DATA SIMULATED FOR DEMONSTRATION</div>
        </div>
      </footer>
    </div>
  );
}
