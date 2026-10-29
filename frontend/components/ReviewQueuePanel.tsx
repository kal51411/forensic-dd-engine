'use client';

import { useEffect, useState } from 'react';
import { getReviewQueue, resolveReviewItem } from '@/lib/api';
import type { HumanReviewItem } from '@/lib/types';

export function ReviewQueuePanel() {
  const [items, setItems] = useState<HumanReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [customValue, setCustomValue] = useState<string>('');

  const fetchItems = () => {
    setLoading(true);
    getReviewQueue()
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleResolve = async (itemId: string) => {
    const parsed = parseFloat(customValue);
    if (isNaN(parsed)) return;

    try {
      await resolveReviewItem(itemId, parsed);
      setResolvingId(null);
      setCustomValue('');
      fetchItems();
    } catch (e) {
      alert(`Resolution failed: ${String(e)}`);
    }
  };

  if (loading) {
    return (
      <div className="bg-terminal-surface terminal-border rounded p-6 text-center text-xs font-mono text-terminal-gray-dim">
        SCANNING REVIEW QUEUE DATABASE...
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="bg-terminal-surface terminal-border rounded p-6 text-center text-xs font-mono text-terminal-green-dim">
        [NO ITEMS PENDING HUMAN REVIEW — CONFIDENCE CRITERIA SATISFIED]
      </div>
    );
  }

  return (
    <div className="bg-terminal-surface terminal-border rounded-lg overflow-hidden font-mono text-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-terminal-border bg-terminal-bg/50 text-terminal-gray-dim text-[10px] tracking-wider uppercase">
              <th className="p-3">Item ID</th>
              <th className="p-3">Entity</th>
              <th className="p-3">Concept / Metric</th>
              <th className="p-3">Extracted Val</th>
              <th className="p-3">Confidence</th>
              <th className="p-3">Audit Reason</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-terminal-border">
            {items.map((it) => (
              <tr key={it.item_id} className="hover:bg-terminal-bg/30">
                <td className="p-3 text-terminal-gray-dim truncate max-w-[100px]">
                  {it.item_id}
                </td>
                <td className="p-3 font-bold text-terminal-white">{it.ticker}</td>
                <td className="p-3 text-terminal-gray">{it.field_name}</td>
                <td className="p-3 text-terminal-amber font-semibold">
                  {it.raw_extracted_value.toLocaleString()}
                </td>
                <td className="p-3">
                  <span
                    className={`font-semibold ${
                      it.confidence_score < 0.85
                        ? 'text-terminal-red'
                        : 'text-terminal-green'
                    }`}
                  >
                    {(it.confidence_score * 100).toFixed(0)}%
                  </span>
                </td>
                <td className="p-3 text-terminal-gray max-w-[200px] truncate" title={it.reason}>
                  {it.reason}
                </td>
                <td className="p-3">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${
                      it.status === 'PENDING'
                        ? 'border-terminal-amber/40 bg-terminal-amber/10 text-terminal-amber'
                        : 'border-terminal-green/40 bg-terminal-green/10 text-terminal-green'
                    }`}
                  >
                    {it.status}
                  </span>
                </td>
                <td className="p-3 text-right">
                  {it.status === 'PENDING' && (
                    <div className="flex items-center justify-end gap-1.5">
                      {resolvingId === it.item_id ? (
                        <>
                          <input
                            type="number"
                            value={customValue}
                            onChange={(e) => setCustomValue(e.target.value)}
                            placeholder="Value"
                            className="w-20 bg-terminal-bg border border-terminal-border px-1.5 py-0.5 rounded text-terminal-white text-xs"
                          />
                          <button
                            onClick={() => handleResolve(it.item_id)}
                            className="px-2 py-0.5 bg-terminal-green text-black font-bold rounded hover:bg-terminal-green/90"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setResolvingId(null)}
                            className="px-2 py-0.5 text-terminal-gray hover:text-white"
                          >
                            ✕
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => {
                            setResolvingId(it.item_id);
                            setCustomValue(String(it.raw_extracted_value));
                          }}
                          className="px-2 py-1 border border-terminal-border rounded hover:border-terminal-green hover:text-terminal-green text-[10px]"
                        >
                          Resolve
                        </button>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
