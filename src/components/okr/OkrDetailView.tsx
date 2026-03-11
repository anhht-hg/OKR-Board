'use client';

import { useState, useRef, useEffect } from 'react';
import React from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronDown, ChevronRight, User, Calendar, Building2,
  Target, TrendingUp, Zap, Users, CheckCircle2, Clock, AlertCircle,
  Layers, GitBranch, Link2, Pencil, Loader2, Check,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

// ── Color system ───────────────────────────────────────────────────────────────

const OBJ_COLORS = [
  { tab: 'border-orange-400', bar: 'bg-orange-400', badge: 'bg-orange-500', section: 'border-l-orange-400' },
  { tab: 'border-teal-400',   bar: 'bg-teal-400',   badge: 'bg-teal-600',   section: 'border-l-teal-400' },
  { tab: 'border-rose-400',   bar: 'bg-rose-400',   badge: 'bg-rose-500',   section: 'border-l-rose-400' },
  { tab: 'border-blue-400',   bar: 'bg-blue-400',   badge: 'bg-blue-600',   section: 'border-l-blue-400' },
  { tab: 'border-purple-400', bar: 'bg-purple-400', badge: 'bg-purple-600', section: 'border-l-purple-400' },
  { tab: 'border-amber-400',  bar: 'bg-amber-400',  badge: 'bg-amber-500',  section: 'border-l-amber-400' },
];

const PILLAR_STYLE: Record<string, string> = {
  'Tăng trưởng – Quay lại vị thế': 'bg-orange-100 text-orange-700 border-orange-200',
  'Đảm bảo biên độ lợi nhuận':     'bg-blue-100 text-blue-700 border-blue-200',
  'Xây dựng năng lực tổ chức':     'bg-purple-100 text-purple-700 border-purple-200',
};

function progressCol(pct: number) {
  if (pct >= 70) return { text: 'text-emerald-600', bar: 'bg-emerald-500' };
  if (pct >= 30) return { text: 'text-orange-500',  bar: 'bg-orange-400' };
  return               { text: 'text-rose-500',    bar: 'bg-rose-400' };
}

function statusStyle(s: string) {
  if (s === 'Hoàn thành')      return { pill: 'bg-emerald-100 text-emerald-700', icon: <CheckCircle2 size={11} className="text-emerald-500" /> };
  if (s === 'Đang triển khai') return { pill: 'bg-blue-100 text-blue-700',       icon: <Clock size={11} className="text-blue-500" /> };
  return                              { pill: 'bg-gray-100 text-gray-500',       icon: <AlertCircle size={11} className="text-gray-400" /> };
}

const TYPE_ICON: Record<string, React.ReactElement> = {
  SuccessFactor:  <Layers size={13} className="text-teal-500" />,
  KeyResult:      <Target size={12} className="text-slate-500" />,
  Feature:        <GitBranch size={12} className="text-pink-500" />,
  UserCapability: <Users size={11} className="text-purple-500" />,
  Adoption:       <TrendingUp size={11} className="text-green-600" />,
  Impact:         <Zap size={11} className="text-rose-500" />,
};

// ── InlineEdit ─────────────────────────────────────────────────────────────────

function InlineEdit({
  itemId, field, value, isAdmin,
  className, placeholder, multiline,
}: {
  itemId: string;
  field: string;
  value: string | null | undefined;
  isAdmin: boolean;
  className?: string;
  placeholder?: string;
  multiline?: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement & HTMLTextAreaElement>(null);

  // Sync draft if value prop changes (e.g. after router.refresh)
  useEffect(() => {
    if (!editing) setDraft(value ?? '');
  }, [value, editing]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      // Move cursor to end
      const len = inputRef.current.value.length;
      inputRef.current.setSelectionRange(len, len);
    }
  }, [editing]);

  async function save() {
    if (draft === (value ?? '')) { setEditing(false); return; }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/items/' + itemId, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: draft }),
      });
      if (!res.ok) throw new Error('Lỗi lưu');
      setSaved(true);
      setEditing(false);
      router.refresh();
      setTimeout(() => setSaved(false), 1500);
    } catch {
      setError('Lỗi lưu');
    } finally {
      setSaving(false);
    }
  }

  function cancel() {
    setDraft(value ?? '');
    setEditing(false);
    setError(null);
  }

  if (!isAdmin) {
    return (
      <span className={className}>
        {value ? value : <span className="text-gray-300 italic">{placeholder}</span>}
      </span>
    );
  }

  if (editing) {
    const sharedCls = 'border-b border-blue-400 bg-transparent w-full outline-none text-sm resize-none ' + (className ?? '');
    return (
      <span className="block w-full">
        {multiline ? (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            className={sharedCls + ' min-h-[60px]'}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onBlur={save}
            onKeyDown={e => {
              if (e.key === 'Escape') cancel();
              if (e.key === 'Enter' && e.ctrlKey) save();
            }}
            rows={3}
          />
        ) : (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            className={sharedCls}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onBlur={save}
            onKeyDown={e => {
              if (e.key === 'Escape') cancel();
              if (e.key === 'Enter') save();
            }}
          />
        )}
        {saving && <Loader2 size={12} className="inline ml-1 animate-spin text-blue-400" />}
        {error && <span className="text-[10px] text-red-500 ml-1">{error}</span>}
      </span>
    );
  }

  return (
    <span className={`group relative inline-flex items-center gap-1 ${className ?? ''}`}>
      <span
        className="cursor-text"
        onClick={() => setEditing(true)}
      >
        {value ? value : <span className="text-gray-300 italic">{placeholder}</span>}
      </span>
      <button
        className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 flex-shrink-0 text-blue-400 hover:text-blue-600"
        onClick={() => setEditing(true)}
        title="Chỉnh sửa"
        type="button"
      >
        <Pencil size={12} />
      </button>
      {saved && <Check size={12} className="text-emerald-500 flex-shrink-0" />}
    </span>
  );
}

// ── Outcome chip ───────────────────────────────────────────────────────────────

function OutcomeChip({ item }: { item: any }) {
  const ss = statusStyle(item.status);
  const CHIP_STYLE: Record<string, string> = {
    UserCapability: 'bg-purple-50 border-purple-200 text-purple-800',
    Adoption:       'bg-green-50  border-green-200  text-green-800',
    Impact:         'bg-rose-50   border-rose-200   text-rose-800',
  };
  return (
    <div className={`flex items-start gap-2 px-3 py-2 rounded-lg border text-xs leading-snug ${CHIP_STYLE[item.type] ?? 'bg-gray-50 border-gray-200 text-gray-700'}`}>
      <span className="flex-shrink-0 mt-0.5">{TYPE_ICON[item.type]}</span>
      <span className="flex-1">{item.title}</span>
      <span className={`flex-shrink-0 ml-1 flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${ss.pill}`}>
        {ss.icon}{item.progressPct}%
      </span>
    </div>
  );
}

// ── Feature row ────────────────────────────────────────────────────────────────

function FeatureRow({ feature }: { feature: any }) {
  const [open, setOpen] = useState(false);
  const ss = statusStyle(feature.status);
  const pc = progressCol(feature.progressPct);
  const outcomes = feature.children ?? [];

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
      <button
        onClick={() => outcomes.length > 0 ? setOpen(v => !v) : undefined}
        className={`w-full text-left px-4 py-3 flex items-center gap-3 ${outcomes.length > 0 ? 'hover:bg-gray-50 cursor-pointer' : 'cursor-default'} transition-colors`}
      >
        <span className="flex-shrink-0 text-pink-400">{TYPE_ICON.Feature}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            {feature.code && (
              <span className="text-[10px] font-bold text-pink-500 bg-pink-50 border border-pink-200 px-1.5 py-0.5 rounded">
                {feature.code}
              </span>
            )}
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 ${ss.pill}`}>
              {ss.icon} {feature.status}
            </span>
          </div>
          <p className="text-sm text-gray-800 font-medium leading-snug">{feature.title}</p>
        </div>
        <div className="flex-shrink-0 flex items-center gap-2 mr-1">
          <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden hidden sm:block">
            <div className={`h-full rounded-full ${pc.bar}`} style={{ width: `${Math.min(feature.progressPct, 100)}%` }} />
          </div>
          <span className={`text-sm font-bold ${pc.text}`}>{feature.progressPct}%</span>
        </div>
        {outcomes.length > 0 && (
          <span className="flex-shrink-0 text-gray-400">
            {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </span>
        )}
      </button>
      {open && outcomes.length > 0 && (
        <div className="px-4 pb-3 pt-1 border-t border-gray-100 bg-gray-50/50 space-y-1.5">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">Kết quả kỳ vọng</p>
          {outcomes.map((o: any) => <OutcomeChip key={o.id} item={o} />)}
        </div>
      )}
    </div>
  );
}

// ── KR row ────────────────────────────────────────────────────────────────────

function KrRow({ kr, isAdmin }: { kr: any; isAdmin: boolean }) {
  const [open, setOpen] = useState(false);
  const ss = statusStyle(kr.status);
  const pc = progressCol(kr.progressPct);
  const features = (kr.children ?? []).filter((c: any) => c.type === 'Feature');

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
      {/* KR header */}
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full text-left px-4 py-3.5 flex items-start gap-3 hover:bg-slate-50 transition-colors"
      >
        <span className="flex-shrink-0 mt-0.5">{TYPE_ICON.KeyResult}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <span className={`inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${ss.pill}`}>
              {ss.icon} {kr.status}
            </span>
          </div>
          <p className="text-sm font-semibold text-gray-800 leading-snug">{kr.title}</p>
        </div>
        <div className="flex-shrink-0 flex items-center gap-2">
          <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden hidden sm:block">
            <div className={`h-full rounded-full ${pc.bar}`} style={{ width: `${Math.min(kr.progressPct, 100)}%` }} />
          </div>
          <span className={`text-sm font-bold ${pc.text} min-w-[3rem] text-right`}>{kr.progressPct}%</span>
          <span className="text-gray-400 ml-1">
            {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </span>
        </div>
      </button>

      {/* Expanded: DB meta + features */}
      {open && (
        <div className="border-t border-slate-100">
          <div className="px-4 py-4 bg-slate-50 space-y-3">
            {/* Kết quả then chốt */}
            <div className="bg-white rounded-lg border border-slate-200 px-4 py-3">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1">
                <CheckCircle2 size={10} className="text-emerald-500" /> Kết quả then chốt
              </p>
              <InlineEdit
                itemId={kr.id}
                field="successMetric"
                value={kr.successMetric}
                isAdmin={isAdmin}
                className="text-sm text-gray-800 leading-relaxed"
                placeholder="Chưa có kết quả then chốt..."
                multiline
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Target */}
              <div className="bg-white rounded-lg border border-blue-100 px-4 py-3">
                <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wide mb-1 flex items-center gap-1">
                  <Target size={10} /> Target
                </p>
                <InlineEdit
                  itemId={kr.id}
                  field="targetValue"
                  value={kr.targetValue}
                  isAdmin={isAdmin}
                  className="text-xs text-gray-700 leading-relaxed"
                  placeholder="Chưa có target..."
                  multiline
                />
              </div>

              {/* Thước đo */}
              <div className="bg-white rounded-lg border border-purple-100 px-4 py-3">
                <p className="text-[10px] font-bold text-purple-500 uppercase tracking-wide mb-1 flex items-center gap-1">
                  <TrendingUp size={10} /> Thước đo
                </p>
                <InlineEdit
                  itemId={kr.id}
                  field="measureFormula"
                  value={kr.measureFormula}
                  isAdmin={isAdmin}
                  className="text-xs text-gray-700 leading-relaxed"
                  placeholder="Chưa có thước đo..."
                  multiline
                />
              </div>
            </div>

            {/* Liên kết KR Tập đoàn */}
            <div className="bg-blue-50 rounded-lg border border-blue-100 px-4 py-3">
              <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wide mb-1 flex items-center gap-1">
                <Link2 size={10} /> Liên kết KR Tập đoàn
              </p>
              <InlineEdit
                itemId={kr.id}
                field="corporateKRLinkage"
                value={kr.corporateKRLinkage}
                isAdmin={isAdmin}
                className="text-xs text-blue-800 leading-relaxed"
                placeholder="Chưa có liên kết..."
                multiline
              />
            </div>
          </div>

          {/* Features under this KR */}
          {features.length > 0 && (
            <div className="px-4 pb-4 pt-3 space-y-2 bg-gray-50/40">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide flex items-center gap-1">
                <GitBranch size={10} /> Tính năng triển khai ({features.length})
              </p>
              {features.map((f: any) => <FeatureRow key={f.id} feature={f} />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── SF Section ─────────────────────────────────────────────────────────────────

function SFSection({ sf, groupedKrs, color, isAdmin }: {
  sf: any;
  groupedKrs: any[];
  color: typeof OBJ_COLORS[0];
  isAdmin: boolean;
}) {
  const [open, setOpen] = useState(true);
  const ss = statusStyle(sf.status);
  const pc = progressCol(sf.progressPct);
  const directFeatures = (sf.children ?? []).filter((c: any) => c.type === 'Feature');

  return (
    <div className={`border-l-4 ${color.section} bg-white rounded-r-2xl shadow-sm overflow-hidden`}>
      {/* SF header */}
      <div className="w-full text-left px-5 py-4 flex items-start gap-3">
        <span className="flex-shrink-0 mt-0.5">{TYPE_ICON.SuccessFactor}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            {sf.code && (
              <span className="text-[10px] font-bold text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full">
                {sf.code}
              </span>
            )}
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 ${ss.pill}`}>
              {ss.icon} {sf.status}
            </span>
          </div>
          <p className="text-sm font-bold text-gray-800 leading-snug">
            <InlineEdit
              itemId={sf.id}
              field="title"
              value={sf.title}
              isAdmin={isAdmin}
              className="font-bold"
              placeholder="Chưa có tiêu đề..."
            />
          </p>
          {/* description */}
          <div className="text-xs text-gray-500 mt-1 leading-relaxed">
            <InlineEdit
              itemId={sf.id}
              field="description"
              value={sf.description}
              isAdmin={isAdmin}
              placeholder="Mô tả Success Factor..."
              multiline
            />
          </div>
          {/* Owner / notes */}
          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-400">
            {(sf.owner || isAdmin) && (
              <span className="flex items-center gap-1">
                <User size={10} />
                <InlineEdit
                  itemId={sf.id}
                  field="owner"
                  value={sf.owner}
                  isAdmin={isAdmin}
                  placeholder="Chủ sở hữu..."
                />
              </span>
            )}
            {(sf.notes || isAdmin) && (
              <span className="flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-700 rounded-md px-2 py-0.5">
                ⚠{' '}
                <InlineEdit
                  itemId={sf.id}
                  field="notes"
                  value={sf.notes}
                  isAdmin={isAdmin}
                  placeholder="Ghi chú cảnh báo..."
                />
              </span>
            )}
          </div>
        </div>
        <div className="flex-shrink-0 flex items-center gap-3">
          <span className={`text-2xl font-bold ${pc.text}`}>{sf.progressPct}<span className="text-sm">%</span></span>
          <button
            onClick={() => setOpen(v => !v)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-gray-100">
        <div className={`h-full ${pc.bar} transition-all duration-500`} style={{ width: `${Math.min(sf.progressPct, 100)}%` }} />
      </div>

      {/* KRs and direct features */}
      {open && (
        <div className="px-5 py-4 space-y-3 bg-gray-50/20">
          {groupedKrs.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide flex items-center gap-1">
                <Target size={10} /> Kết quả then chốt ({groupedKrs.length}) — bấm để xem chi tiết
              </p>
              {groupedKrs.map((kr: any) => (
                <KrRow key={kr.id} kr={kr} isAdmin={isAdmin} />
              ))}
            </div>
          )}
          {directFeatures.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide flex items-center gap-1">
                <GitBranch size={10} /> Tính năng triển khai ({directFeatures.length})
              </p>
              {directFeatures.map((f: any) => <FeatureRow key={f.id} feature={f} />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Obj Tab ────────────────────────────────────────────────────────────────────

function ObjTab({ obj, color, isSelected, onClick }: {
  obj: any; color: typeof OBJ_COLORS[0]; isSelected: boolean; onClick: () => void;
}) {
  const pc = progressCol(obj.progressPct);
  const ss = statusStyle(obj.status);
  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-xl border-2 px-4 py-3 transition-all ${
        isSelected ? `${color.tab} bg-white shadow-md` : 'border-gray-200 bg-white hover:border-gray-300'
      }`}
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full text-white ${color.badge}`}>{obj.code}</span>
        <span className={`text-xs font-bold ${pc.text}`}>{obj.progressPct}%</span>
      </div>
      <p className="text-xs font-semibold text-gray-700 leading-snug line-clamp-2 mb-2">{obj.title}</p>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${pc.bar}`} style={{ width: `${Math.min(obj.progressPct, 100)}%` }} />
      </div>
      <div className={`mt-2 inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${ss.pill}`}>
        {ss.icon} {obj.status}
      </div>
    </button>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────

export function OkrDetailView({ objectives }: { objectives: any[] }) {
  const { isAdmin } = useAuth();
  const [selectedIdx, setSelectedIdx] = useState(0);
  const obj = objectives[selectedIdx];
  if (!obj) return null;

  const color = OBJ_COLORS[selectedIdx % OBJ_COLORS.length];
  const pillarStyle = obj.strategicPillar
    ? (PILLAR_STYLE[obj.strategicPillar] ?? 'bg-gray-100 text-gray-600 border-gray-200')
    : '';
  const pc = progressCol(obj.progressPct);

  // Group KRs under their preceding SF (siblings in DB, grouped by sort order)
  const allChildren: any[] = obj.children ?? [];
  type SfGroup = { sf: any; krs: any[] };
  const sfGroups: SfGroup[] = [];
  let currentGroup: SfGroup | null = null;
  for (const child of allChildren) {
    if (child.type === 'SuccessFactor') {
      currentGroup = { sf: child, krs: [] };
      sfGroups.push(currentGroup);
    } else if (child.type === 'KeyResult' && currentGroup) {
      currentGroup.krs.push(child);
    }
  }
  const sfs = sfGroups.map(g => g.sf);

  function flatten(items: any[]): any[] {
    return items.flatMap((i: any) => [i, ...flatten(i.children ?? [])]);
  }
  const allKrs = sfGroups.flatMap(g => g.krs);
  const allDesc = [
    ...flatten(allChildren.filter((c: any) => c.type === 'SuccessFactor')),
    ...flatten(allKrs),
  ];
  const features = allDesc.filter((i: any) => i.type === 'Feature');
  const outcomes = allDesc.filter((i: any) => ['UserCapability', 'Adoption', 'Impact'].includes(i.type));
  const done = allDesc.filter((i: any) => i.status === 'Hoàn thành').length;
  const inProg = allDesc.filter((i: any) => i.status === 'Đang triển khai').length;

  return (
    <div className="flex gap-6 items-start">
      {/* Left tabs */}
      <div className="w-52 flex-shrink-0 space-y-2 sticky top-20">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1 mb-3">Mục tiêu</p>
        {objectives.map((o, i) => (
          <ObjTab key={o.id} obj={o} color={OBJ_COLORS[i % OBJ_COLORS.length]}
            isSelected={i === selectedIdx} onClick={() => setSelectedIdx(i)} />
        ))}
      </div>

      {/* Right detail */}
      <div className="flex-1 min-w-0 space-y-4">

        {/* Admin edit mode banner */}
        {isAdmin && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700 font-semibold">
            <Pencil size={12} />
            Chế độ chỉnh sửa — di chuột vào văn bản để chỉnh sửa
          </div>
        )}

        {/* Objective header */}
        <div className={`bg-white rounded-2xl border-2 ${color.tab} shadow-sm overflow-hidden`}>
          <div className="px-6 py-5">
            <div className="flex items-center gap-2 flex-wrap mb-3">
              <span className={`text-xs font-bold px-3 py-1 rounded-full text-white ${color.badge}`}>{obj.code}</span>
              {(obj.strategicPillar || isAdmin) && (
                <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${pillarStyle || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                  <InlineEdit
                    itemId={obj.id}
                    field="strategicPillar"
                    value={obj.strategicPillar}
                    isAdmin={isAdmin}
                    placeholder="Trụ cột chiến lược..."
                  />
                </span>
              )}
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${statusStyle(obj.status).pill}`}>
                {statusStyle(obj.status).icon} {obj.status}
              </span>
            </div>
            <div className="flex items-start justify-between gap-6">
              <h2 className="text-lg font-bold text-gray-900 leading-snug flex-1">
                <InlineEdit
                  itemId={obj.id}
                  field="title"
                  value={obj.title}
                  isAdmin={isAdmin}
                  className="font-bold text-lg"
                  placeholder="Tiêu đề mục tiêu..."
                />
              </h2>
              <div className="flex-shrink-0 text-right">
                <div className={`text-4xl font-bold ${pc.text}`}>{obj.progressPct}<span className="text-xl">%</span></div>
                <p className="text-[10px] text-gray-400">tiến độ chung</p>
              </div>
            </div>
            <div className="mt-3 h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-700 ${pc.bar}`} style={{ width: `${Math.min(obj.progressPct, 100)}%` }} />
            </div>
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1.5 text-xs text-gray-500">
              {(obj.pic || isAdmin) && (
                <span className="flex items-center gap-1.5">
                  <User size={12} className="text-gray-400" />
                  <InlineEdit
                    itemId={obj.id}
                    field="pic"
                    value={obj.pic}
                    isAdmin={isAdmin}
                    className="font-semibold text-gray-700"
                    placeholder="Người phụ trách..."
                  />
                </span>
              )}
              {(obj.deadline || isAdmin) && (
                <span className="flex items-center gap-1.5">
                  <Calendar size={12} className="text-gray-400" />
                  <InlineEdit
                    itemId={obj.id}
                    field="deadline"
                    value={obj.deadline}
                    isAdmin={isAdmin}
                    placeholder="Thời hạn..."
                  />
                </span>
              )}
              {(obj.scope || isAdmin) && (
                <span className="flex items-center gap-1.5">
                  <Building2 size={12} className="text-gray-400" />
                  <InlineEdit
                    itemId={obj.id}
                    field="scope"
                    value={obj.scope}
                    isAdmin={isAdmin}
                    placeholder="Phạm vi áp dụng..."
                  />
                </span>
              )}
            </div>
          </div>
          <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 grid grid-cols-5 divide-x divide-gray-200 text-center text-xs">
            {[
              { label: 'Success Factors', val: sfs.length, color: 'text-teal-600' },
              { label: 'Features', val: features.length, color: 'text-pink-500' },
              { label: 'Outcomes', val: outcomes.length, color: 'text-purple-600' },
              { label: 'Hoàn thành', val: done, color: 'text-emerald-600' },
              { label: 'Đang triển khai', val: inProg, color: 'text-blue-600' },
            ].map(s => (
              <div key={s.label} className="px-3">
                <div className={`text-xl font-bold ${s.color}`}>{s.val}</div>
                <div className="text-gray-400 text-[10px] mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 px-1 flex-wrap">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Phân cấp:</span>
          {[
            { type: 'SuccessFactor', label: 'Success Factor — nhóm kết quả' },
            { type: 'KeyResult',     label: 'Key Result — chỉ tiêu (bấm để xem Target & Thước đo)' },
            { type: 'Feature',       label: 'Feature — tính năng triển khai' },
            { type: 'UserCapability',label: 'UC / Adoption / Impact' },
          ].map(l => (
            <span key={l.type} className="flex items-center gap-1 text-[11px] text-gray-500">
              {TYPE_ICON[l.type]} {l.label}
            </span>
          ))}
        </div>

        {/* SF sections */}
        {sfGroups.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-12">Không có dữ liệu</p>
        ) : (
          <div className="space-y-4">
            {sfGroups.map(({ sf, krs }) => (
              <SFSection key={sf.id} sf={sf} groupedKrs={krs} color={color} isAdmin={isAdmin} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
