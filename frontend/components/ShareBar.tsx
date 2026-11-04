'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

export interface ShareBarProps {
  ticker?: string;
  verdict?: string;
  confidenceScore?: number;
  className?: string;
}

export function ShareBar({
  ticker = 'TICKER',
  verdict,
  confidenceScore,
  className = '',
}: ShareBarProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      if (typeof window !== 'undefined') {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch (err) {
      console.error('Failed to copy to clipboard', err);
    }
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const handleShareTwitter = () => {
    if (typeof window === 'undefined') return;
    const url = encodeURIComponent(window.location.href);
    const confText = confidenceScore ? ` (${(confidenceScore * 100).toFixed(1)}% confidence)` : '';
    const verdictText = verdict ? ` RULING: ${verdict}` : '';
    const text = encodeURIComponent(
      `🔍 SEC 10-K Forensic Audit for $${ticker}${confText}.${verdictText} Audited by Forensic DD Engine:`
    );
    const twitterUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
    window.open(twitterUrl, '_blank', 'noopener,noreferrer,width=600,height=450');
  };

  return (
    <div
      className={`no-print flex flex-wrap items-center justify-between gap-3 p-3 bg-terminal-surface border border-terminal-border rounded-lg font-mono text-xs ${className}`}
    >
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-terminal-green animate-pulse" />
        <span className="text-terminal-gray-dim uppercase tracking-wider font-semibold">
          FORENSIC DOSSIER ACTIONS:
        </span>
      </div>

      <div className="flex items-center flex-wrap gap-2">
        {/* Copy Link Button */}
        <motion.button
          type="button"
          onClick={handleCopy}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded border transition-all ${
            copied
              ? 'bg-terminal-green/20 text-terminal-green border-terminal-green shadow-[0_0_10px_rgba(0,255,136,0.3)]'
              : 'bg-terminal-bg text-terminal-gray border-terminal-border hover:border-terminal-gray hover:text-terminal-white'
          }`}
        >
          <span>{copied ? '✓' : '🔗'}</span>
          <span>{copied ? 'LINK COPIED' : 'COPY AUDIT LINK'}</span>
        </motion.button>

        {/* Print / Export PDF Button */}
        <motion.button
          type="button"
          onClick={handlePrint}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-terminal-border bg-terminal-bg text-terminal-gray hover:border-terminal-green hover:text-terminal-green transition-all shadow-sm"
        >
          <span>🖨️</span>
          <span>EXPORT PDF / PRINT</span>
        </motion.button>

        {/* Share to X / Twitter */}
        <motion.button
          type="button"
          onClick={handleShareTwitter}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-terminal-border bg-terminal-bg text-terminal-gray hover:border-terminal-amber hover:text-terminal-amber transition-all"
        >
          <span>𝕏</span>
          <span>SHARE TO X</span>
        </motion.button>
      </div>
    </div>
  );
}
