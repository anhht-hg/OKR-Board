'use client';

import { useState, useRef, useEffect } from 'react';
import { Info } from 'lucide-react';

interface Props {
  content: React.ReactNode;
  /** 'right' (default) | 'left' | 'bottom' — which side the popup opens toward */
  side?: 'right' | 'left' | 'bottom';
}

export function InfoTooltip({ content, side = 'right' }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const popupClass =
    side === 'left'
      ? 'right-full mr-2 top-0'
      : side === 'bottom'
      ? 'top-full mt-2 left-1/2 -translate-x-1/2'
      : 'left-full ml-2 top-0';

  return (
    <div ref={ref} className="relative inline-flex items-center">
      <button
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onClick={() => setOpen(v => !v)}
        className="inline-flex items-center justify-center w-4 h-4 rounded-full text-gray-300 hover:text-blue-400 hover:bg-blue-50 transition-colors cursor-default"
        tabIndex={-1}
        aria-label="Thông tin"
      >
        <Info size={12} />
      </button>

      {open && (
        <div
          className={`absolute z-50 w-64 bg-gray-900 text-white text-xs rounded-xl shadow-2xl px-3.5 py-3 leading-relaxed ${popupClass}`}
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
        >
          {/* Arrow */}
          {side === 'right' && (
            <span className="absolute -left-1.5 top-2 w-3 h-3 bg-gray-900 rotate-45 rounded-sm" />
          )}
          {side === 'left' && (
            <span className="absolute -right-1.5 top-2 w-3 h-3 bg-gray-900 rotate-45 rounded-sm" />
          )}
          {side === 'bottom' && (
            <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-gray-900 rotate-45 rounded-sm" />
          )}
          <div className="relative">{content}</div>
        </div>
      )}
    </div>
  );
}
