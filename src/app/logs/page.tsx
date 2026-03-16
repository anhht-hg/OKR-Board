'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ALL_TYPES, TYPE_LABELS, TYPE_COLORS, STATUS_BADGE_COLORS, AUDIT_FIELD_LABELS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { Search, RefreshCw, ChevronLeft, ChevronRight, History } from 'lucide-react';

interface AuditLog {
  id: string;
  createdAt: string;
  itemId: string;
  itemTitle: string;
  itemType: string;
  itemCode: string | null;
  action: 'CREATED' | 'UPDATED' | 'DELETED';
  field: string | null;
  oldValue: string | null;
  newValue: string | null;
}

const ACTION_STYLES = {
  CREATED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  UPDATED: 'bg-blue-100 text-blue-700 border-blue-200',
  DELETED: 'bg-red-100 text-red-700 border-red-200',
};

const ACTION_LABELS = {
  CREATED: 'Tạo mới',
  UPDATED: 'Cập nhật',
  DELETED: 'Xóa',
};

const ALL_FIELDS = Object.keys(AUDIT_FIELD_LABELS);

export default function LogsPage() {
  const { isAdmin } = useAuth();
  const router = useRouter();

  // Filters
  const [search, setSearch] = useState('');
  const [action, setAction] = useState('');
  const [itemType, setItemType] = useState('');
  const [field, setField] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Data
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const limit = 50;

  const fetchLogs = useCallback(async (p = 1, overrides?: {
    search?: string; action?: string; itemType?: string; field?: string; dateFrom?: string; dateTo?: string;
  }) => {
    setLoading(true);
    const s = overrides?.search      ?? search;
    const a = overrides?.action      ?? action;
    const it = overrides?.itemType   ?? itemType;
    const f = overrides?.field       ?? field;
    const df = overrides?.dateFrom   ?? dateFrom;
    const dt = overrides?.dateTo     ?? dateTo;

    const params = new URLSearchParams({ page: String(p), limit: String(limit) });
    if (s.trim()) params.set('search', s.trim());
    if (a) params.set('action', a);
    if (it) params.set('itemType', it);
    if (f) params.set('field', f);
    if (df) params.set('dateFrom', df);
    if (dt) params.set('dateTo', dt);

    try {
      const res = await fetch(`/api/audit-logs?${params}`);
      if (res.status === 403) { router.push('/login'); return; }
      const data = await res.json();
      setLogs(data.logs ?? []);
      setTotal(data.total ?? 0);
      setPage(p);
    } finally {
      setLoading(false);
    }
  }, [search, action, itemType, field, dateFrom, dateTo, router]);

  useEffect(() => {
    if (isAdmin === false) { router.push('/'); return; }
    if (isAdmin) fetchLogs(1);
  }, [isAdmin, router, fetchLogs]);

  const totalPages = Math.ceil(total / limit);

  function formatDate(iso: string) {
    const d = new Date(iso);
    return d.toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });
  }

  function formatValue(val: string | null, field?: string | null, dim?: boolean) {
    if (!val) return <span className="text-gray-300 text-xs">—</span>;
    // Status values get colored badges
    if (field === 'status' && STATUS_BADGE_COLORS[val]) {
      return (
        <span className={cn(
          'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border',
          STATUS_BADGE_COLORS[val],
          dim && 'opacity-50 line-through'
        )}>
          {val}
        </span>
      );
    }
    // ISO dates
    if (/^\d{4}-\d{2}-\d{2}T/.test(val)) {
      return <span className={cn('text-xs', dim ? 'text-gray-400 line-through' : 'text-gray-700')}>{new Date(val).toLocaleDateString('vi-VN')}</span>;
    }
    return <span className={cn('text-xs', dim ? 'text-gray-400 line-through' : 'text-gray-800 font-medium')}>{val}</span>;
  }

  function handleFilterSubmit(e: React.FormEvent) {
    e.preventDefault();
    fetchLogs(1);
  }

  function clearFilters() {
    setSearch(''); setAction(''); setItemType(''); setField('');
    setDateFrom(''); setDateTo('');
    fetchLogs(1, { search: '', action: '', itemType: '', field: '', dateFrom: '', dateTo: '' });
  }

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-sm">
            <History size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Nhật ký thay đổi</h1>
            <p className="text-xs text-gray-400 mt-0.5">Lịch sử toàn bộ thay đổi trong hệ thống OKR</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">{total.toLocaleString()} bản ghi</span>
          <Button variant="outline" size="sm" onClick={() => fetchLogs(page)} disabled={loading}>
            <RefreshCw size={13} className={cn('mr-1.5', loading && 'animate-spin')} />
            Làm mới
          </Button>
        </div>
      </div>

      {/* Filter bar */}
      <form onSubmit={handleFilterSubmit} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-wrap gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Tìm tên item..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 h-9 text-sm"
            />
          </div>

          {/* Action */}
          <Select value={action} onValueChange={setAction}>
            <SelectTrigger className="h-9 w-36 text-sm">
              <SelectValue placeholder="Loại thay đổi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CREATED">Tạo mới</SelectItem>
              <SelectItem value="UPDATED">Cập nhật</SelectItem>
              <SelectItem value="DELETED">Xóa</SelectItem>
            </SelectContent>
          </Select>

          {/* Item type */}
          <Select value={itemType} onValueChange={setItemType}>
            <SelectTrigger className="h-9 w-44 text-sm">
              <SelectValue placeholder="Loại item" />
            </SelectTrigger>
            <SelectContent>
              {ALL_TYPES.map(t => (
                <SelectItem key={t} value={t}>{TYPE_LABELS[t] ?? t}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Field */}
          <Select value={field} onValueChange={setField}>
            <SelectTrigger className="h-9 w-44 text-sm">
              <SelectValue placeholder="Trường thay đổi" />
            </SelectTrigger>
            <SelectContent>
              {ALL_FIELDS.map(f => (
                <SelectItem key={f} value={f}>{AUDIT_FIELD_LABELS[f] ?? f}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          {/* Date from */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500 whitespace-nowrap">Từ ngày</label>
            <Input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="h-9 text-sm w-36"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500 whitespace-nowrap">Đến ngày</label>
            <Input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className="h-9 text-sm w-36"
            />
          </div>

          <div className="flex gap-2 ml-auto">
            <Button type="button" variant="ghost" size="sm" onClick={clearFilters} className="h-9 text-sm">
              Xóa bộ lọc
            </Button>
            <Button type="submit" size="sm" className="h-9 text-sm bg-indigo-600 hover:bg-indigo-700">
              <Search size={13} className="mr-1.5" />
              Lọc
            </Button>
          </div>
        </div>
      </form>

      {/* Table */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <colgroup>
              <col className="w-[130px]" />
              <col className="w-[140px]" />
              <col />
              <col className="w-[100px]" />
              <col className="w-[120px]" />
              <col className="w-[160px]" />
              <col className="w-[160px]" />
            </colgroup>
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Thời gian</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Loại</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tên item</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Hành động</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Trường</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Giá trị cũ</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Giá trị mới</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-400 text-sm">
                    <RefreshCw size={20} className="animate-spin mx-auto mb-2 text-indigo-400" />
                    Đang tải...
                  </td>
                </tr>
              )}
              {!loading && logs.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-400 text-sm">
                    Không có bản ghi nào phù hợp
                  </td>
                </tr>
              )}
              {!loading && logs.map(log => (
                <tr key={log.id} className="hover:bg-gray-50/50 transition-colors align-middle">
                  {/* Time */}
                  <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500 font-mono">
                    {formatDate(log.createdAt)}
                  </td>
                  {/* Type */}
                  <td className="px-4 py-3">
                    <span className={cn(
                      'text-[10px] font-bold px-2 py-1 rounded whitespace-nowrap',
                      TYPE_COLORS[log.itemType] ?? 'bg-slate-100 text-slate-600'
                    )}>
                      {TYPE_LABELS[log.itemType] ?? log.itemType}
                    </span>
                  </td>
                  {/* Title */}
                  <td className="px-4 py-3">
                    <div className="min-w-0">
                      {log.itemCode && (
                        <span className="text-[10px] text-gray-400 font-mono block leading-tight mb-0.5">{log.itemCode}</span>
                      )}
                      <span className="text-sm text-gray-800 font-medium line-clamp-2 leading-snug">
                        {log.itemTitle}
                      </span>
                    </div>
                  </td>
                  {/* Action */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <Badge className={cn('text-xs border font-semibold', ACTION_STYLES[log.action])}>
                      {ACTION_LABELS[log.action]}
                    </Badge>
                  </td>
                  {/* Field */}
                  <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-600">
                    {log.field ? (AUDIT_FIELD_LABELS[log.field] ?? log.field) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  {/* Old value */}
                  <td className="px-4 py-3 max-w-[160px]">
                    <div className="line-clamp-2">
                      {formatValue(log.oldValue, log.field, true)}
                    </div>
                  </td>
                  {/* New value */}
                  <td className="px-4 py-3 max-w-[160px]">
                    <div className="line-clamp-2">
                      {formatValue(log.newValue, log.field, false)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/40">
            <span className="text-xs text-gray-400">
              Trang {page} / {totalPages} ({total} bản ghi)
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchLogs(page - 1)}
                disabled={page <= 1 || loading}
                className="h-7 w-7 p-0"
              >
                <ChevronLeft size={14} />
              </Button>
              {/* Page number chips */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const start = Math.max(1, Math.min(page - 2, totalPages - 4));
                const p = start + i;
                return (
                  <Button
                    key={p}
                    variant={p === page ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => fetchLogs(p)}
                    disabled={loading}
                    className={cn('h-7 w-7 p-0 text-xs', p === page && 'bg-indigo-600 hover:bg-indigo-700')}
                  >
                    {p}
                  </Button>
                );
              })}
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchLogs(page + 1)}
                disabled={page >= totalPages || loading}
                className="h-7 w-7 p-0"
              >
                <ChevronRight size={14} />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
