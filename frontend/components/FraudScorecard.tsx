'use client';

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
  value: number;
  displayValue: string;
  percent: number;
  color: string;
  borderClass: string;
  badgeText: string;
  badgeColor: string;
  subtitle: string;
  description: string;
}

/** Clamp a value within [min, max] and normalize to [0, 100] */
function normalize(val: number, min: number, max: number): number {
  return Math.round(((Math.min(Math.max(val, min), max) - min) / (max - min)) * 100);
}

function buildGauges(scores: FraudRiskScore): GaugeConfig[] {
  // --- Beneish M-Score ---
  // Range: -3 (very clean) → 0 (manipulator). Lower = better.
  const beneishPercent = normalize(-scores.beneish_m_score, 0, 3); // flip so green = high
  const beneishClean = !scores.is_manipulator_suspect;

  // --- Sloan Accrual Ratio ---
  // Range: -0.15 → 0.15. Close to 0 = better.
  const sloanAbs = Math.abs(scores.sloan_accrual_ratio);
  const sloanPercent = normalize(0.15 - sloanAbs, 0, 0.15); // flip: low accrual = high bar
  const sloanOk = !scores.is_accrual_red_flag;

  // --- Altman Z-Score ---
  // Range: 0 → 6. Higher = better.
  const altmanPercent = normalize(scores.altman_z_score, 0, 6);
  const altmanZone = scores.solvency_zone;

  const altmanColor =
    altmanZone === 'SAFE' ? '#00ff88' : altmanZone === 'GREY' ? '#fbbf24' : '#ff4444';
  const altmanBorder =
    altmanZone === 'SAFE'
      ? 'terminal-border-green'
      : altmanZone === 'GREY'
        ? 'terminal-border-amber'
        : 'terminal-border-red';
  const altmanBadge =
    altmanZone === 'SAFE'
      ? { text: 'SAFE ZONE', color: 'text-terminal-green bg-terminal-green/10 border-terminal-green/40' }
      : altmanZone === 'GREY'
        ? { text: 'GREY ZONE', color: 'text-terminal-amber bg-terminal-amber/10 border-terminal-amber/40' }
        : { text: 'DISTRESS ZONE', color: 'text-terminal-red bg-terminal-red/10 border-terminal-red/40' };

  return [
    {
      title: 'BENEISH M-SCORE',
      value: scores.beneish_m_score,
      displayValue: scores.beneish_m_score.toFixed(2),
      percent: beneishPercent,
      color: beneishClean ? '#00ff88' : '#ff4444',
      borderClass: beneishClean ? 'terminal-border-green' : 'terminal-border-red',
      badgeText: beneishClean ? 'CLEAN' : 'SUSPECT',
      badgeColor: beneishClean
        ? 'text-terminal-green bg-terminal-green/10 border-terminal-green/40'
        : 'text-terminal-red bg-terminal-red/10 border-terminal-red/40',
      subtitle: 'MANIPULATOR THRESHOLD: -1.78',
      description: beneishClean
        ? 'Below threshold — no evidence of earnings manipulation.'
        : 'Above threshold — potential earnings manipulation detected.',
    },
    {
      title: 'SLOAN ACCRUAL RATIO',
      value: scores.sloan_accrual_ratio,
      displayValue: (scores.sloan_accrual_ratio * 100).toFixed(1) + '%',
      percent: sloanPercent,
      color: sloanOk ? '#00ff88' : scores.sloan_accrual_ratio > 0.1 ? '#ff4444' : '#fbbf24',
      borderClass: sloanOk ? 'terminal-border-green' : 'terminal-border-red',
      badgeText: sloanOk ? 'LOW RISK' : 'ACCRUAL FLAG',
      badgeColor: sloanOk
        ? 'text-terminal-green bg-terminal-green/10 border-terminal-green/40'
        : 'text-terminal-red bg-terminal-red/10 border-terminal-red/40',
      subtitle: 'ACCRUAL THRESHOLD: ±5%',
      description: sloanOk
        ? 'Cash-based earnings dominate — low accrual risk.'
        : 'High accrual ratio — earnings quality concern.',
    },
    {
      title: 'ALTMAN Z-SCORE',
      value: scores.altman_z_score,
      displayValue: scores.altman_z_score.toFixed(2),
      percent: altmanPercent,
      color: altmanColor,
      borderClass: altmanBorder,
      badgeText: altmanBadge.text,
      badgeColor: altmanBadge.color,
      subtitle: `ZONE: ${altmanZone}`,
      description:
        altmanZone === 'SAFE'
          ? 'Z > 2.99 — financially healthy.'
          : altmanZone === 'GREY'
            ? 'Z between 1.81-2.99 — caution warranted.'
            : 'Z < 1.81 — significant distress risk.',
    },
  ];
}

interface GaugeCardProps {
  config: GaugeConfig;
  delay: number;
}

function GaugeCard({ config, delay }: GaugeCardProps) {
  const data = [{ value: config.percent, fill: config.color }];

  return (
    <div
      className={`bg-terminal-surface ${config.borderClass} rounded-lg p-5 flex flex-col items-center gap-3`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="text-xs text-terminal-gray-dim tracking-widest font-bold">
        {config.title}
      </div>

      {/* Recharts Radial Gauge */}
      <div className="relative w-40 h-40">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            cx="50%"
            cy="50%"
            innerRadius="65%"
            outerRadius="90%"
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
            {/* Background track */}
            <RadialBar
              background={{ fill: '#1f2937' }}
              dataKey="value"
              angleAxisId={0}
              isAnimationActive
              animationBegin={delay}
              animationDuration={1000}
              animationEasing="ease-out"
            />
          </RadialBarChart>
        </ResponsiveContainer>

        {/* Center value */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="text-2xl font-bold"
            style={{ color: config.color, textShadow: `0 0 10px ${config.color}60` }}
          >
            {config.displayValue}
          </span>
        </div>
      </div>

      {/* Badge */}
      <span
        className={`text-xs font-bold px-3 py-1 rounded border ${config.badgeColor}`}
      >
        {config.badgeText}
      </span>

      {/* Subtitle */}
      <div className="text-xs text-terminal-gray-dim text-center">
        {config.subtitle}
      </div>

      {/* Description */}
      <div className="text-xs text-terminal-gray text-center leading-relaxed">
        {config.description}
      </div>
    </div>
  );
}

export function FraudScorecard({ scores }: Props) {
  const gauges = buildGauges(scores);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {gauges.map((config, i) => (
        <GaugeCard key={config.title} config={config} delay={i * 200} />
      ))}
    </div>
  );
}
