'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

const SUGGESTED = ['MSFT', 'AAPL', 'NVDA', 'TSLA', 'AMZN', 'GOOGL'];

export function TickerSearch() {
  const [ticker, setTicker] = useState('');
  const [focused, setFocused] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    const t = ticker.trim().toUpperCase();
    if (!t) return;
    router.push(`/audit/${t}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSubmit();
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {/* Search input row */}
      <div className="relative w-full max-w-2xl group">
        <div
          className={`flex items-center gap-0 bg-terminal-surface rounded transition-all duration-300 ${
            focused
              ? 'terminal-border-green shadow-[0_0_20px_rgba(0,255,136,0.2)]'
              : 'terminal-border'
          }`}
        >
          {/* Prompt prefix */}
          <span className="pl-4 pr-2 text-terminal-green font-bold text-xl select-none shrink-0">
            $
          </span>

          <input
            ref={inputRef}
            type="text"
            value={ticker}
            onChange={(e) => setTicker(e.target.value.toUpperCase())}
            onKeyDown={handleKeyDown}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="ENTER TICKER SYMBOL..."
            maxLength={10}
            spellCheck={false}
            className="flex-1 bg-transparent text-terminal-white text-2xl font-bold tracking-widest py-5 px-2 outline-none placeholder:text-terminal-gray-dim placeholder:font-normal placeholder:text-lg placeholder:tracking-normal"
          />

          <motion.button
            onClick={handleSubmit}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="shrink-0 mr-2 px-6 py-3 bg-terminal-green text-terminal-bg font-bold text-sm tracking-widest rounded hover:bg-terminal-green/90 transition-colors"
          >
            [AUDIT]
          </motion.button>
        </div>
      </div>

      {/* Suggestions */}
      <div className="flex items-center gap-2 text-xs text-terminal-gray-dim">
        <span>TRY:</span>
        {SUGGESTED.map((s) => (
          <button
            key={s}
            onClick={() => {
              setTicker(s);
              router.push(`/audit/${s}`);
            }}
            className="text-terminal-gray hover:text-terminal-green transition-colors"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
