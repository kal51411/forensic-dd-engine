'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RadialBarChart,
  RadialBar,
  ResponsiveContainer,
  PolarAngleAxis,
} from 'recharts';
import type { FraudRiskScore } from '@/lib/types';

interface Props {
  scores: FraudRiskScore;
}

interface GaugeConfig {
  title: string;
  metricCode: string;
  value: number;
  displayValue: string;
  percent: number;
  color: string;
  borderClass: string;
  badgeText: string;
  badgeColor: string;
  subtitle: string;
  formula: string;
  thresholdLogic: string;
  keyDrivers: string[];
}

/** Clamp a value within [min, max] and normalize to [0, 100] */
function normalize(val: number, min: number, max: number): number {
  return Math.round(((Math.min(Math.max(val, min), max) - min) / (max - min)) * 100);
}

/** Calculate 0-100 Composite Risk Index */
function computeCompositeRiskIndex(scores: FraudRiskScore): {
  score: number;
  tier: 'LOW' | 'MODERATE' | 'CRITICAL';
  color: string;
  borderColor: string;
  bgColor: string;
  summary: string;
} {
  let riskPoints = 0;

  // Beneish component (0-35 points)
  if (scores.is_manipulator_suspect) {
    riskPoints += 35;
  } else {
    // scale from -3.0 (0 pts) to -1.78 (18 pts)
    const normalized = Math.max(0, (scores.beneish_m_score - (-3.0)) / (1.22));
    riskPoints += Math.min(18, Math.round(normalized * 18));
  }

  // Sloan Accrual component (0-30 points)
  const absAccrual = Math.abs(scores.sloan_accrual_ratio);
  if (scores.is_accrual_red_flag) {
    riskPoints += 30;
  } else {
    // scale from 0.0 (0 pts) to 0.05 (15 pts)
    riskPoints += Math.min(15, Math.round((absAccrual / 0.05) * 15));
  }

  // Altman Z-Score component (0-35 points)
  if (scores.solvency_zone === 'DISTRESS') {
    riskPoints += 35;
  } else if (scores.solvency_zone === 'GREY') {
    riskPoints += 18;
  } else {
    // Safe zone: 0 to 5 points
    riskPoints += scores.altman_z_score < 4 ? 4 : 0;
  }

  // Red flag multiplier (up to 10 points)
  riskPoints += Math.min(10, scores.red_flag_count * 5);

  const finalScore = Math.min(100, Math.max(0, riskPoints));

  if (finalScore <= 25) {
    return {
      score: finalScore,
      tier: 'LOW',
      color: 'text-terminal-green',
      borderColor: 'border-terminal-green/40',
      bgColor: 'bg-terminal-green/10',
      summary: 'LOW FORENSIC RISK (0-25) — High cash earnings quality, sound capital structure, and zero manipulator signals.',
    };
  } else if (finalScore <= 60) {
    return {
      score: finalScore,
      tier: 'MODERATE',
      color: 'text-terminal-amber',
      borderColor: 'border-terminal-amber/40',
      bgColor: 'bg-terminal-amber/10',
      summary: 'MODERATE RISK (26-60) — Mild accrual distortion or grey zone solvency metrics detected. Exercise due diligence.',
    };
  } else {
    return {
      score: finalScore,
      tier: 'CRITICAL',
      color: 'text-terminal-red',
      borderColor: 'border-terminal-red/50',
      bgColor: 'bg-terminal-red/10',
      summary: 'CRITICAL RISK (61-100) — High probability of earnings manipulation, non-cash accrual inflation, or acute distress.',
    };
  }
}

function buildGauges(scores: FraudRiskScore): GaugeConfig[] {
  // --- Beneish M-Score ---
  // Range: -3 (very clean) → 0 (manipulator). Lower = better.
  const beneishPercent = normalize(-scores.beneish_m_score, 0, 3);
  const beneishClean = !scores.is_manipulator_suspect;

  // --- Sloan Accrual Ratio ---
  // Range: -0.15 → 0.15. Close to 0 = better.
  const sloanAbs = Math.abs(scores.sloan_accrual_ratio);
  const sloanPercent = normalize(0.15 - sloanAbs, 0, 0.15);
  const sloanOk = !scores.is_accrual_red_flag;

  // --- Altman Z-Score ---
  // Range: 0 → 6. Higher = better.
  const altmanPercent = normalize(scores.altman_z_score, 0, 6);
  const altmanZone = scores.solvency_zone;

  const altmanColor =
    altmanZone === 'SAFE' ? '#00ff88' : altmanZone === 'GREY' ? '#fbbf24' : '#ff4444';
  const altmanBorder =
    altmanZone === 'SAFE'
      ? 'border-terminal-green/40'
      : altmanZone === 'GREY'
        ? 'border-terminal-amber/40'
        : 'border-terminal-red/40';
  const altmanBadge =
    altmanZone === 'SAFE'
      ? { text: 'SAFE ZONE', color: 'text-terminal-green bg-terminal-green/10 border-terminal-green/40' }
      : altmanZone === 'GREY'
        ? { text: 'GREY ZONE', color: 'text-terminal-amber bg-terminal-amber/10 border-terminal-amber/40' }
        : { text: 'DISTRESS ZONE', color: 'text-terminal-red bg-terminal-red/10 border-terminal-red/40' };

  return [
    {
      title: 'BENEISH M-SCORE',
      metricCode: 'M_SCORE_8V',
      value: scores.beneish_m_score,
      displayValue: scores.beneish_m_score.toFixed(2),
      percent: beneishPercent,
      color: beneishClean ? '#00ff88' : '#ff4444',
      borderClass: beneishClean ? 'border-terminal-green/40' : 'border-terminal-red/40',
      badgeText: beneishClean ? 'CLEAN (NON-MANIPULATOR)' : 'SUSPECT (MANIPULATOR)',
      badgeColor: beneishClean
        ? 'text-terminal-green bg-terminal-green/10 border-terminal-green/40'
        : 'text-terminal-red bg-terminal-red/10 border-terminal-red/40',
      subtitle: '8-VARIABLE PROBIT MANIPULATION INDEX',
      formula: 'M = -4.84 + 0.920*DSRI + 0.528*GMI + 0.404*AQI + 0.892*SGI + 0.115*DEPI - 0.172*SGAI + 4.037*TATA + 0.0327*LVGI',
      thresholdLogic: 'Critical Threshold: -1.78. Values greater than -1.78 indicate high statistical probability of accounting earnings manipulation.',
      keyDrivers: [
        'DSRI: Days Sales in Receivables Index',
        'GMI: Gross Margin Index deterioration',
        'AQI: Asset Quality Index capitalization',
        'TATA: Total Accruals to Total Assets',
      ],
    },
    {
      title: 'SLOAN ACCRUAL RATIO',
      metricCode: 'SLOAN_ACCRUALS',
      value: scores.sloan_accrual_ratio,
      displayValue: `${(scores.sloan_accrual_ratio * 100).toFixed(1)}%`,
      percent: sloanPercent,
      color: sloanOk ? '#00ff88' : Math.abs(scores.sloan_accrual_ratio) > 0.1 ? '#ff4444' : '#fbbf24',
      borderClass: sloanOk ? 'border-terminal-green/40' : 'border-terminal-red/40',
      badgeText: sloanOk ? 'LOW RISK (CASH BACKED)' : 'ACCRUAL DISTORTION',
      badgeColor: sloanOk
        ? 'text-terminal-green bg-terminal-green/10 border-terminal-green/40'
        : 'text-terminal-red bg-terminal-red/10 border-terminal-red/40',
      subtitle: 'EARNINGS QUALITY & CASH CONVERSION',
      formula: 'Accrual Ratio = (Net Income - Operating Cash Flow) / Average Total Assets',
      thresholdLogic: 'Benchmark: |Accruals| <= 5.0%. Ratios exceeding +5% signal paper earnings detached from genuine operating cash generation.',
      keyDrivers: [
        'Cash Flow Conversion vs Accounting Net Income',
        'Working Capital inventory & receivables inflation',
        'Reversal risk: future write-downs and margin contraction',
      ],
    },
    {
      title: 'ALTMAN Z-SCORE',
      metricCode: 'ALTMAN_Z_CORP',
      value: scores.altman_z_score,
      displayValue: scores.altman_z_score.toFixed(2),
      percent: altmanPercent,
      color: altmanColor,
      borderClass: altmanBorder,
      badgeText: altmanBadge.text,
      badgeColor: altmanBadge.color,
      subtitle: 'INSOLVENCY & BANKRUPTCY PREDICTION',
      formula: 'Z = 1.2*(WC/TA) + 1.4*(RE/TA) + 3.3*(EBIT/TA) + 0.6*(MVE/TL) + 0.999*(Sales/TA)',
      thresholdLogic: 'Zones: Safe (Z > 2.99), Grey Zone (1.81 <= Z <= 2.99), Distress Zone (Z < 1.81). Below 1.81 indicates severe insolvency vulnerability within 2 years.',
      keyDrivers: [
        'Working Capital & liquidity cushion',
        'Retained Earnings reinvestment capacity',
        'Operating efficiency (EBIT/Total Assets)',
        'Market Leverage vs Total Debt liabilities',
      ],
    },
  ];
}

interface GaugeCardProps {
  config: GaugeConfig;
  delay: number;
}

function GaugeCard({ config, delay }: GaugeCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const data = [{ value: config.percent, fill: config.color }];

  return (
    <div
      className={`bg-terminal-surface border ${config.borderClass} rounded-xl p-5 flex flex-col justify-between transition-all`}
    >
      <div className="flex flex-col items-center">
        {/* Metric Header */}
        <div className="flex items-center justify-between w-full mb-1">
          <span className="text-[10px] text-terminal-gray-dim uppercase font-bold tracking-widest">
            {config.metricCode}
          </span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${config.badgeColor}`}>
            {config.badgeText}
          </span>
        </div>

        <h3 className="text-sm font-bold text-white tracking-wide text-center mt-1">
          {config.title}
        </h3>
        <p className="text-[11px] text-terminal-gray-dim text-center">
          {config.subtitle}
        </p>

        {/* Recharts Radial Gauge */}
        <div className="relative w-40 h-40 my-2">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              cx="50%"
              cy="50%"
              innerRadius="68%"
              outerRadius="92%"
              barSize={10}
              data={data}
              startAngle={225}
              endAngle={-45}
            >
              <PolarAngleAxis
                type="number"
                domain={[0, 100]}
                angleAxisId={0}
                tick={false}
              />
              <RadialBar
                background={{ fill: '#1f2937' }}
                dataKey="value"
                angleAxisId={0}
                isAnimationActive
                animationBegin={delay}
                animationDuration={900}
                animationEasing="ease-out"
              />
            </RadialBarChart>
          </ResponsiveContainer>

          {/* Center value */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className="text-2xl font-bold font-mono"
              style={{ color: config.color, textShadow: `0 0 10px ${config.color}60` }}
            >
              {config.displayValue}
            </span>
            <span className="text-[10px] text-terminal-gray-dim uppercase font-mono">
              AUDITED
            </span>
          </div>
        </div>
      </div>

      {/* Threshold summary */}
      <div className="pt-3 border-t border-terminal-border/60">
        <p className="text-xs text-terminal-gray leading-relaxed text-center mb-3">
          {config.thresholdLogic}
        </p>

        {/* Toggle Detailed Parameter Breakdown */}
        <button
          type="button"
          onClick={() => setShowDetails(!showDetails)}
          className="w-full text-center text-[11px] font-mono font-bold text-terminal-green-dim hover:text-terminal-green py-1.5 border border-terminal-border rounded bg-terminal-bg/60 transition-colors"
        >
          {showDetails ? '▲ HIDE FORMULA & COEFFICIENTS' : '▼ VIEW FORMULA & COEFFICIENTS'}
        </button>

        <AnimatePresence>
          {showDetails && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mt-3 pt-3 border-t border-terminal-border/50 space-y-2 text-left"
            >
              <div>
                <div className="text-[10px] uppercase text-terminal-gray-dim font-bold tracking-wider">
                  MATHEMATICAL SPECIFICATION:
                </div>
                <div className="text-[11px] font-mono text-terminal-amber bg-terminal-bg p-2 rounded border border-terminal-border mt-1 overflow-x-auto">
                  {config.formula}
                </div>
              </div>

              <div>
                <div className="text-[10px] uppercase text-terminal-gray-dim font-bold tracking-wider">
                  FORENSIC DRIVERS:
                </div>
                <ul className="text-[11px] text-terminal-gray space-y-1 mt-1">
                  {config.keyDrivers.map((driver, idx) => (
                    <li key={idx} className="flex items-center gap-1.5">
                      <span className="text-terminal-green">›</span>
                      <span>{driver}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export function FraudScorecard({ scores }: Props) {
  const gauges = buildGauges(scores);
  const composite = computeCompositeRiskIndex(scores);

  return (
    <div className="space-y-6 font-mono">
      {/* Top Composite Risk Index Banner */}
      <div
        className={`rounded-xl border p-5 ${composite.borderColor} ${composite.bgColor} backdrop-blur-sm relative overflow-hidden`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-terminal-green animate-pulse" />
              <span className="text-xs uppercase tracking-widest text-terminal-gray-dim font-bold">
                COMPOSITE FORENSIC FRAUD RISK INDEX
              </span>
            </div>
            <div className="text-sm md:text-base font-bold text-white">
              {composite.summary}
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0 bg-terminal-bg/80 border border-terminal-border px-4 py-2.5 rounded-lg">
            <div className="text-right">
              <div className="text-[10px] text-terminal-gray-dim uppercase font-bold">
                RISK SCORE
              </div>
              <div className={`text-2xl font-bold ${composite.color}`}>
                {composite.score} / 100
              </div>
            </div>
            <div
              className={`px-3 py-1 rounded text-xs font-bold border ${composite.borderColor} ${composite.color}`}
            >
              {composite.tier} RISK
            </div>
          </div>
        </div>

        {/* Risk Spectrum Progress Bar */}
        <div className="mt-4 pt-3 border-t border-terminal-border/50">
          <div className="flex items-center justify-between text-[10px] text-terminal-gray-dim mb-1 font-bold">
            <span className="text-terminal-green">LOW RISK (0-25)</span>
            <span className="text-terminal-amber">MODERATE (26-60)</span>
            <span className="text-terminal-red">CRITICAL (61-100)</span>
          </div>
          <div className="w-full bg-terminal-surface h-2 rounded-full overflow-hidden relative border border-terminal-border">
            <div
              className={`h-full transition-all duration-700 ${
                composite.tier === 'LOW'
                  ? 'bg-terminal-green'
                  : composite.tier === 'MODERATE'
                    ? 'bg-terminal-amber'
                    : 'bg-terminal-red'
              }`}
              style={{ width: `${composite.score}%` }}
            />
          </div>
        </div>
      </div>

      {/* Three Radial Gauges Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {gauges.map((config, i) => (
          <GaugeCard key={config.title} config={config} delay={i * 150} />
        ))}
      </div>
    </div>
  );
}
