'use client';

import { motion } from 'framer-motion';
import type { Citation } from '@/lib/types';

interface Props {
  citation: Citation;
  onOpen: (citation: Citation) => void;
}

export function CitationPill({ citation, onOpen }: Props) {
  return (
    <motion.button
      type="button"
      onClick={() => onOpen(citation)}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      title={`chunk_id: ${citation.chunk_id}\nspan: [${citation.char_span[0]}, ${citation.char_span[1]}]`}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono font-medium text-terminal-amber bg-terminal-amber/10 border border-terminal-amber/40 hover:bg-terminal-amber/20 hover:border-terminal-amber transition-all cursor-pointer shadow-[0_0_8px_rgba(251,191,36,0.15)]"
    >
      <span className="text-terminal-amber-dim">§</span>
      <span className="truncate max-w-[180px]">{citation.item}</span>
      <span className="text-[10px] text-terminal-amber-dim">↗</span>
    </motion.button>
  );
}
