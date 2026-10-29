'use client';

import { motion } from 'framer-motion';

interface Props {
  verified: boolean;
  label?: string;
}

export function FactCheckerBadge({ verified, label }: Props) {
  return (
    <motion.span
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 500, damping: 25 }}
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider font-mono uppercase ${
        verified
          ? 'text-terminal-green bg-terminal-green/10 border border-terminal-green/40 shadow-[0_0_8px_rgba(0,255,136,0.2)]'
          : 'text-terminal-red bg-terminal-red/10 border border-terminal-red/40 shadow-[0_0_8px_rgba(255,68,68,0.2)]'
      }`}
    >
      <span>{verified ? '✓' : '✗'}</span>
      <span>{label || (verified ? 'VERIFIED' : 'UNVERIFIED')}</span>
    </motion.span>
  );
}
