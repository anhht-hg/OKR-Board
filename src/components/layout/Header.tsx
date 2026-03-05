'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { OkrItem } from '@/types';
import { TYPE_COLORS, TYPE_LABELS } from '@/lib/constants';
import { Badge } from '@/components/ui/badge';

import { useAuth } from '@/context/AuthContext';

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

export function Header({ title }: { title: string }) {
  const { isAdmin } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<OkrItem[]>([]);
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const debouncedQuery = useDebounce(query, 300);
  const wrapRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`)
      .then((r) => r.json())
      .then((data) => {
        setResults(data);
        setOpen(data.length > 0);
      });
  }, [debouncedQuery]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
        setFocused(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = useCallback(
    (item: OkrItem) => {
      setOpen(false);
      setQuery('');
      router.push(`/objectives?highlight=${item.id}`);
    },
    [router]
  );

  return (
    <header className="h-14 bg-white/95 backdrop-blur border-b border-gray-200 shadow-sm flex items-center px-8 gap-4 fixed top-0 left-56 right-0 z-20">
      <div className="flex items-center gap-3 flex-shrink-0">
        <h2 className="text-sm font-semibold text-gray-600 tracking-wide">{title}</h2>
        {isAdmin && (
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 border border-emerald-100 rounded-full text-[9px] font-bold text-emerald-600 shadow-sm">
            <div className="w-1 h-1 rounded-full bg-emerald-500" />
            SECURE SESSION
          </div>
        )}
      </div>
      <div className="flex-1" />
      <div ref={wrapRef} className="relative w-80">
        <div
          className={`flex items-center rounded-xl px-3.5 py-2 gap-2.5 transition-all ${
            focused
              ? 'bg-white border border-blue-400 shadow-sm'
              : 'bg-gray-100 border border-transparent hover:bg-gray-200/70'
          }`}
        >
          <Search size={14} className={focused ? 'text-blue-500' : 'text-gray-400'} />
          <input
            type="text"
            placeholder="Tìm kiếm hạng mục..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            className="bg-transparent flex-1 text-sm outline-none text-gray-800 placeholder:text-gray-400"
          />
          {query && (
            <button onClick={() => { setQuery(''); setOpen(false); }} className="p-0.5 rounded-full hover:bg-gray-200">
              <X size={12} className="text-gray-400" />
            </button>
          )}
        </div>
        {open && (
          <div className="absolute top-full mt-2 left-0 right-0 bg-white border border-gray-100 rounded-2xl shadow-2xl z-50 max-h-80 overflow-y-auto">
            <div className="px-3 py-2 border-b border-gray-50">
              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">{results.length} kết quả</p>
            </div>
            {results.map((item) => (
              <button
                key={item.id}
                onClick={() => handleSelect(item)}
                className="w-full text-left px-3 py-2.5 hover:bg-blue-50 flex items-start gap-2.5 border-b border-gray-50 last:border-0 transition-colors"
              >
                <Badge
                  className={`mt-0.5 text-[10px] px-1.5 py-0 flex-shrink-0 ${TYPE_COLORS[item.type]}`}
                >
                  {TYPE_LABELS[item.type]}
                </Badge>
                <span className="text-xs text-gray-700 line-clamp-2">{item.title}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}
