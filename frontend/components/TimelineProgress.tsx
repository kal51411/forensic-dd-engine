'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface TimelineProgressProps {
  /**
   * The current active step index (0 to 4).
   * If omitted or -1, all 5 steps are marked as completed.
   */
  activeStep?: number;
  /** Optional callback when user clicks a step */
  onStepClick?: (stepIndex: number) => void;
  /** Optional container class */
  className?: string;
}

interface StepDefinition {
  id: string;
  number: string;
  name: string;
  subtitle: string;
  icon: string;
  tag: string;
  description: string;
  technicalDetails: string[];
}

const STEPS: StepDefinition[] = [
  {
    id: 'sec-ingest',
    number: '01',
    name: 'SEC INGEST',
    subtitle: '10-K Fetch + XBRL',
    icon: '📡',
    tag: 'EDGAR INGESTION',
    description: 'High-throughput 10-K filing retrieval via SEC EDGAR API with 10 req/s rate-limiting, CIK resolution, and XBRL schema decomposition.',
    technicalDetails: [
      'CIK mapping & accession lookup',
      'XBRL taxonomy normalization',
      'Raw HTML/ASCII chunk extraction with byte offsets',
    ],
  },
  {
    id: 'xbrl-quant',
    number: '02',
    name: 'XBRL QUANT',
    subtitle: 'Beneish, Sloan, Altman',
    icon: '⚙️',
    tag: 'DETERMINISTIC MATH',
    description: '100% Python-computed forensic mathematical models without LLM arithmetic interference.',
    technicalDetails: [
      'Beneish M-Score (8 financial indices)',
      'Sloan Accrual Ratio (|accruals| > 5% flagged)',
      'Altman Z-Score (Safe > 2.99, Grey 1.81-2.99, Distress < 1.81)',
    ],
  },
  {
    id: 'debate',
    number: '03',
    name: 'ADVERSARIAL DEBATE',
    subtitle: 'Bear ↔ Bull Deliberation',
    icon: '⚔️',
    tag: 'MULTI-AGENT DEBATE',
    description: 'Autonomous Bear and Bull forensic agents cross-examine quant anomalies and SEC 10-K disclosures.',
    technicalDetails: [
      'Bear Agent attacks aggressive revenue recognition & CapEx',
      'Bull Agent defends cash generation & solvency buffers',
      'Quantitative claims tagged with exact numerical values',
    ],
  },
  {
    id: 'fact-check',
    number: '04',
    name: 'FACT CHECK',
    subtitle: 'Citation Allowlist Validator',
    icon: '🛡️',
    tag: 'ANTI-HALLUCINATION',
    description: 'Zero-hallucination verification engine validating all agent claims against verified SEC 10-K filing spans.',
    technicalDetails: [
      'Character span bounds checking ([start, end])',
      'Exact substring match against raw filing text',
      'Automatic eviction of ungrounded assertions',
    ],
  },
  {
    id: 'verdict',
    number: '05',
    name: 'VERDICT',
    subtitle: 'Judge Deliberation',
    icon: '⚖️',
    tag: 'EXECUTIVE RULING',
    description: 'Deterministic judge model renders composite verdict (CLEAN / ELEVATED / CRITICAL) with traceable provenance.',
    technicalDetails: [
      'Confidence scoring based on quant consensus',
      'Agreed facts vs disputed theses synthesis',
      'Human Review Queue dispatch for low-confidence fields',
    ],
  },
];

export function TimelineProgress({
  activeStep = -1,
  onStepClick,
  className = '',
}: TimelineProgressProps) {
  const isAllComplete = activeStep === -1 || activeStep >= STEPS.length;
  const [selectedStep, setSelectedStep] = useState<number | null>(null);

  const getStepStatus = (index: number) => {
    if (isAllComplete) return 'completed';
    if (index < activeStep) return 'completed';
    if (index === activeStep) return 'active';
    return 'pending';
  };

  const handleStepClick = (index: number) => {
    setSelectedStep(selectedStep === index ? null : index);
    onStepClick?.(index);
  };

  return (
    <div className={`w-full bg-terminal-surface border border-terminal-border rounded-lg p-5 font-mono ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between pb-4 mb-6 border-b border-terminal-border/80">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-terminal-green animate-pulse" />
          <span className="text-xs uppercase tracking-widest text-terminal-gray font-bold">
            FORENSIC AUDIT PIPELINE · 5-STAGE VERIFICATION
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-terminal-gray-dim">STATUS:</span>
          <span
            className={`font-bold px-2 py-0.5 rounded text-[11px] border ${
              isAllComplete
                ? 'text-terminal-green bg-terminal-green/10 border-terminal-green/40'
                : 'text-terminal-amber bg-terminal-amber/10 border-terminal-amber/40 animate-pulse'
            }`}
          >
            {isAllComplete ? 'PIPELINE COMPLETE (100%)' : `STAGE ${activeStep + 1} OF 5 RUNNING`}
          </span>
        </div>
      </div>

      {/* Stepper Grid / Bar */}
      <div className="relative">
        {/* Background Connecting Line */}
        <div className="hidden lg:block absolute top-7 left-[8%] right-[8%] h-0.5 bg-terminal-border z-0" />

        {/* Dynamic Progress Connecting Line */}
        <div
          className="hidden lg:block absolute top-7 left-[8%] h-0.5 bg-terminal-green z-0 transition-all duration-700 shadow-[0_0_8px_rgba(0,255,136,0.6)]"
          style={{
            width: isAllComplete
              ? '84%'
              : `${Math.max(0, Math.min(84, (activeStep / (STEPS.length - 1)) * 84))}%`,
          }}
        />

        {/* Steps */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 relative z-10">
          {STEPS.map((step, idx) => {
            const status = getStepStatus(idx);
            const isSelected = selectedStep === idx;

            const isDone = status === 'completed';
            const isActive = status === 'active';

            return (
              <motion.div
                key={step.id}
                onClick={() => handleStepClick(idx)}
                whileHover={{ y: -2 }}
                className={`cursor-pointer rounded-lg p-3 transition-all border flex flex-col justify-between ${
                  isActive
                    ? 'border-terminal-amber bg-terminal-amber/10 shadow-[0_0_15px_rgba(251,191,36,0.25)]'
                    : isDone
                      ? 'border-terminal-green/40 bg-terminal-bg/70 hover:border-terminal-green/80'
                      : 'border-terminal-border bg-terminal-bg/30 opacity-60 hover:opacity-90'
                } ${isSelected ? 'ring-1 ring-terminal-green' : ''}`}
              >
                {/* Step Top */}
                <div className="flex items-center justify-between mb-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold font-mono border transition-all ${
                      isDone
                        ? 'border-terminal-green bg-terminal-green/20 text-terminal-green shadow-[0_0_10px_rgba(0,255,136,0.3)]'
                        : isActive
                          ? 'border-terminal-amber bg-terminal-amber/20 text-terminal-amber animate-pulse shadow-[0_0_12px_rgba(251,191,36,0.4)]'
                          : 'border-terminal-border bg-terminal-surface text-terminal-gray-dim'
                    }`}
                  >
                    {isDone ? '✓' : step.number}
                  </div>

                  <span
                    className={`text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded border ${
                      isDone
                        ? 'text-terminal-green border-terminal-green/30 bg-terminal-green/5'
                        : isActive
                          ? 'text-terminal-amber border-terminal-amber/30 bg-terminal-amber/5'
                          : 'text-terminal-gray-dim border-terminal-border bg-terminal-surface'
                    }`}
                  >
                    {isDone ? 'DONE' : isActive ? 'ACTIVE' : 'QUEUED'}
                  </span>
                </div>

                {/* Step Info */}
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-sm">{step.icon}</span>
                    <span
                      className={`text-xs font-bold uppercase tracking-tight truncate ${
                        isActive
                          ? 'text-terminal-amber'
                          : isDone
                            ? 'text-terminal-white'
                            : 'text-terminal-gray'
                      }`}
                    >
                      {step.name}
                    </span>
                  </div>
                  <div className="text-[11px] text-terminal-gray-dim truncate mb-2">
                    {step.subtitle}
                  </div>
                </div>

                {/* Action cue */}
                <div className="pt-2 border-t border-terminal-border/40 flex items-center justify-between text-[10px] text-terminal-gray-dim">
                  <span>{step.tag}</span>
                  <span className="text-terminal-gray hover:text-terminal-green">
                    {isSelected ? '▲ HIDE' : '▼ INFO'}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Expanded Step Info Card */}
      <AnimatePresence>
        {selectedStep !== null && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden mt-4 pt-4 border-t border-terminal-border/80"
          >
            <div className="bg-terminal-bg/80 border border-terminal-border rounded-lg p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm">{STEPS[selectedStep].icon}</span>
                    <span className="text-xs font-bold text-terminal-green uppercase">
                      STAGE {STEPS[selectedStep].number}: {STEPS[selectedStep].name} — {STEPS[selectedStep].subtitle}
                    </span>
                  </div>
                  <p className="text-xs text-terminal-gray leading-relaxed mb-3">
                    {STEPS[selectedStep].description}
                  </p>
                  <div className="space-y-1">
                    <div className="text-[10px] uppercase tracking-wider text-terminal-gray-dim font-bold">
                      PIPELINE SPECIFICATIONS:
                    </div>
                    <ul className="text-xs text-terminal-gray space-y-1">
                      {STEPS[selectedStep].technicalDetails.map((detail, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <span className="text-terminal-green font-bold">›</span>
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedStep(null)}
                  className="text-xs text-terminal-gray-dim hover:text-terminal-white px-2 py-1 border border-terminal-border rounded shrink-0"
                >
                  ✕ CLOSE
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
