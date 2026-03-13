'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Plus,
  X,
  User,
  Calendar,
  Layers,
  Users,
  Flag,
  Target,
  FileText,
  Link2,
  Search,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentId?: string | null;
  parentType?: string | null;
  parentTitle?: string | null;
  initialType?: string;
  onCreated?: () => void;
}

const ITEM_TYPES = [
  { value: 'Objective', label: 'Objective', color: 'bg-blue-600' },
  { value: 'SuccessFactor', label: 'Success Factor', color: 'bg-teal-500' },
  { value: 'KeyResult', label: 'Key Result', color: 'bg-slate-700' },
  { value: 'Feature', label: 'Feature', color: 'bg-pink-400' },
  { value: 'UserCapability', label: 'User Capability', color: 'bg-purple-500' },
  { value: 'Adoption', label: 'Adoption', color: 'bg-green-600' },
  { value: 'Impact', label: 'Impact', color: 'bg-rose-400' },
];

const PROJECTS = [
  'HG Stock',
  'QL Kênh',
  'Tài chính',
  'Quản lý NS',
  'Dữ liệu & Báo cáo',
];

const STATUSES = ['Chưa bắt đầu', 'Đang triển khai', 'Hoàn thành'];

export function CreateItemDrawer({
  open,
  onOpenChange,
  parentId = null,
  parentType = null,
  parentTitle = null,
  initialType = 'Objective',
  onCreated
}: Props) {
  const [loading, setLoading] = useState(false);
  const [createAnother, setCreateAnother] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Parent picker state
  const [selectedParentId, setSelectedParentId] = useState<string | null>(parentId ?? null);
  const [selectedParentLabel, setSelectedParentLabel] = useState<string | null>(null);
  const [parentSearchOpen, setParentSearchOpen] = useState(false);
  const [parentSearchQ, setParentSearchQ] = useState('');
  const [parentSearchResults, setParentSearchResults] = useState<Array<{id:string;code:string|null;title:string;type:string}>>([]);
  const [parentSearchLoading, setParentSearchLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Sync selectedParentId when prop changes (e.g. opened with pre-set parent)
  useEffect(() => {
    setSelectedParentId(parentId ?? null);
    if (parentTitle && parentId) {
      setSelectedParentLabel(parentTitle);
    } else if (parentId && !parentTitle) {
      fetch(`/api/items/${parentId}`)
        .then(r => r.json())
        .then(d => setSelectedParentLabel(d.code ? `${d.code} · ${d.title}` : d.title))
        .catch(() => setSelectedParentLabel(parentId));
    } else {
      setSelectedParentLabel(null);
    }
  }, [parentId, parentTitle, open]);

  // Search for parent items
  const searchParent = useCallback(async (q: string) => {
    if (q.trim().length < 1) {
      // Show recent items when query empty
      const res = await fetch('/api/items?limit=10');
      if (res.ok) {
        const data = await res.json();
        setParentSearchResults(Array.isArray(data) ? data.slice(0, 10) : (data.items ?? []).slice(0, 10));
      }
      return;
    }
    setParentSearchLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setParentSearchResults(data);
    } finally {
      setParentSearchLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!parentSearchOpen) return;
    const timer = setTimeout(() => searchParent(parentSearchQ), 250);
    return () => clearTimeout(timer);
  }, [parentSearchQ, parentSearchOpen, searchParent]);

  // Close dropdown on outside click
  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setParentSearchOpen(false);
      }
    }
    if (parentSearchOpen) document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, [parentSearchOpen]);

  function openParentSearch() {
    setParentSearchQ('');
    setParentSearchOpen(true);
    searchParent('');
  }

  function selectParent(item: {id:string;code:string|null;title:string;type:string}) {
    setSelectedParentId(item.id);
    setSelectedParentLabel(item.code ? `${item.code} · ${item.title}` : item.title);
    setParentSearchOpen(false);
    setParentSearchQ('');
  }

  function clearParent() {
    setSelectedParentId(null);
    setSelectedParentLabel(null);
  }

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState(initialType);

  // Sync type with initialType on each open
  useEffect(() => {
    setType(initialType);
  }, [initialType, open]);
  const [project, setProject] = useState('');
  const [status, setStatus] = useState('Chưa bắt đầu');
  const [owner, setOwner] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Advanced metadata
  const [stakeholder, setStakeholder] = useState('');
  const [pic, setPic] = useState('');
  const [strategicPillar, setStrategicPillar] = useState('');
  const [deadline, setDeadline] = useState('');
  const [scope, setScope] = useState('');
  const [code, setCode] = useState('');
  const [notes, setNotes] = useState('');
  
  // Metric fields (for KRs)
  const [successMetric, setSuccessMetric] = useState('');
  const [targetValue, setTargetValue] = useState('');
  const [measureFormula, setMeasureFormula] = useState('');
  const [corporateKRLinkage, setCorporateKRLinkage] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !type) return;

    setLoading(true);
    setSubmitError(null);
    try {
      const res = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          type,
          parentId: selectedParentId,
          project: project || null,
          status,
          owner: owner || null,
          startDate: startDate || null,
          endDate: endDate || null,
          stakeholder: stakeholder || null,
          pic: pic || null,
          strategicPillar: strategicPillar || null,
          deadline: deadline || null,
          scope: scope || null,
          code: code || null,
          successMetric: successMetric || null,
          targetValue: targetValue || null,
          measureFormula: measureFormula || null,
          corporateKRLinkage: corporateKRLinkage || null,
        }),
      });

      if (res.ok) {
        onCreated?.();
        if (createAnother) {
          resetForm();
        } else {
          onOpenChange(false);
          resetForm();
        }
      } else {
        const err = await res.json().catch(() => ({}));
        setSubmitError(err?.error || 'Tạo thất bại, thử lại.');
      }
    } catch {
      setSubmitError('Lỗi kết nối, thử lại.');
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setTitle('');
    setDescription('');
    setType(initialType);
    setSelectedParentId(parentId ?? null);
    setSelectedParentLabel(parentTitle ?? null);
    setProject('');
    setStatus('Chưa bắt đầu');
    setOwner('');
    setStartDate('');
    setEndDate('');
    setStakeholder('');
    setPic('');
    setStrategicPillar('');
    setDeadline('');
    setScope('');
    setCode('');
    setNotes('');
    setSuccessMetric('');
    setTargetValue('');
    setMeasureFormula('');
    setCorporateKRLinkage('');
  }

  const selectedTypeObj = ITEM_TYPES.find(t => t.value === type);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className="w-full sm:max-w-[45vw] p-0 flex flex-col h-full border-l border-gray-200"
        side="right"
        showCloseButton={false}
      >
        {/* Visually hidden title for screen reader accessibility */}
        <SheetTitle className="sr-only">
          Create new {selectedTypeObj?.label || 'item'}
        </SheetTitle>
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          {/* Header */}
          <div className="px-6 py-3 border-b border-gray-100 bg-white flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <Plus size={13} className="text-gray-400" />
              Create new {selectedTypeObj?.label || 'item'}
            </div>
            <div className="flex items-center gap-2">
              {submitError && (
                <span className="text-xs text-red-600 font-medium">{submitError}</span>
              )}
              <Button type="button" variant="ghost" size="sm" onClick={() => onOpenChange(false)} className="text-gray-500 h-8 px-3 text-xs">
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={loading || !title} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 h-8 text-xs">
                {loading ? 'Creating...' : 'Create'}
              </Button>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="ml-1 p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="flex flex-1 min-h-0 overflow-hidden">
            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              {/* Title Input */}
              <div className="space-y-2">
                <input 
                  autoFocus
                  placeholder="Tiêu đề..."
                  className="w-full text-3xl font-bold text-gray-900 border-none outline-none placeholder:text-gray-300 bg-transparent py-0"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  required
                />
                
                <textarea 
                  placeholder="Thêm mô tả..."
                  className="w-full min-h-[100px] text-base text-gray-600 border-none outline-none resize-none placeholder:text-gray-300 bg-transparent mt-4"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
              </div>

              {/* Code Field */}
              <div className="flex items-center gap-3">
                <div className="w-24 shrink-0 text-xs font-semibold text-gray-400 uppercase">Mã (Code)</div>
                <Input 
                  placeholder="VD: OBJ-01" 
                  className="max-w-[150px] h-8 text-sm"
                  value={code}
                  onChange={e => setCode(e.target.value)}
                />
              </div>

              {/* Metric Section (Only for Key Results or similar) */}
              {type === 'KeyResult' && (
                <div className="p-6 bg-blue-50/30 rounded-2xl border border-blue-100/50 space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Target size={16} className="text-blue-500" />
                    <h4 className="text-sm font-bold text-blue-900">Thông số đo lường</h4>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-blue-700/70">Mục tiêu (Target)</label>
                      <Input 
                        placeholder="VD: 100%" 
                        className="bg-white"
                        value={targetValue}
                        onChange={e => setTargetValue(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-blue-700/70">Đơn vị đo</label>
                      <Input 
                        placeholder="VD: %, VND, Người" 
                        className="bg-white"
                        value={successMetric}
                        onChange={e => setSuccessMetric(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-blue-700/70">Công thức tính</label>
                    <Input 
                      placeholder="Mô tả cách tính kết quả..." 
                      className="bg-white"
                      value={measureFormula}
                      onChange={e => setMeasureFormula(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5 pt-2">
                    <div className="flex items-center gap-2">
                      <Layers size={14} className="text-indigo-500" />
                      <label className="text-xs font-semibold text-indigo-700">Liên kết KR Corporate</label>
                    </div>
                    <Input 
                      placeholder="Chọn KR cấp trên để liên kết..." 
                      className="bg-white border-indigo-100"
                      value={corporateKRLinkage}
                      onChange={e => setCorporateKRLinkage(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Notes */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <FileText size={16} className="text-gray-400" />
                  <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-tight">Ghi chú</h4>
                </div>
                <textarea 
                  placeholder="Thêm ghi chú nội bộ..."
                  className="w-full min-h-[80px] text-sm text-gray-600 bg-gray-50/50 border border-gray-100 rounded-xl p-3 outline-none focus:ring-1 focus:ring-blue-100"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </div>
            </div>

            {/* Sidebar Metadata */}
            <div className="w-72 shrink-0 border-l border-gray-100 bg-gray-50/30 overflow-y-auto p-6 space-y-7">

              {/* Parent picker */}
              <div className="space-y-2" ref={searchRef}>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
                  <Link2 size={11} />
                  Thuộc về (Parent)
                </label>

                {selectedParentId ? (
                  /* Selected parent pill */
                  <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-100 rounded-lg">
                    <span className="flex-1 text-xs text-blue-800 font-medium truncate">
                      {selectedParentLabel ?? '...'}
                    </span>
                    {/* only allow clearing if not locked from prop */}
                    {!parentId && (
                      <button type="button" onClick={clearParent} className="shrink-0 text-blue-400 hover:text-blue-600">
                        <X size={13} />
                      </button>
                    )}
                  </div>
                ) : (
                  /* Link button */
                  <button
                    type="button"
                    onClick={openParentSearch}
                    className="w-full flex items-center gap-2 px-3 py-2 border border-dashed border-gray-300 rounded-lg text-xs text-gray-400 hover:border-blue-300 hover:text-blue-500 transition-colors"
                  >
                    <Link2 size={13} />
                    Link to parent element
                  </button>
                )}

                {/* Search dropdown */}
                {parentSearchOpen && (
                  <div className="absolute z-50 mt-1 w-64 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
                    <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100">
                      <Search size={13} className="text-gray-400 shrink-0" />
                      <input
                        autoFocus
                        type="text"
                        placeholder="Search by name or code..."
                        className="flex-1 text-sm outline-none bg-transparent"
                        value={parentSearchQ}
                        onChange={e => setParentSearchQ(e.target.value)}
                      />
                      {parentSearchLoading && (
                        <div className="w-3 h-3 border border-gray-300 border-t-blue-500 rounded-full animate-spin shrink-0" />
                      )}
                    </div>
                    <div className="max-h-56 overflow-y-auto">
                      {parentSearchResults.length === 0 && !parentSearchLoading && (
                        <div className="px-4 py-3 text-xs text-gray-400 text-center">
                          {parentSearchQ.length >= 1 ? 'No results' : 'Type to search...'}
                        </div>
                      )}
                      {parentSearchResults.map(r => (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => selectParent(r)}
                          className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-blue-50 transition-colors text-left"
                        >
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-gray-200 text-gray-600 shrink-0 uppercase">
                            {r.type === 'SuccessFactor' ? 'SF' : r.type === 'UserCapability' ? 'UC' : r.type.substring(0,3)}
                          </span>
                          <span className="flex-1 text-xs text-gray-700 truncate">
                            {r.code && <span className="font-semibold text-gray-500 mr-1">{r.code}</span>}
                            {r.title}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Type Selection */}
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Loại Item</label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger className="w-full bg-white border-gray-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ITEM_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value}>
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${t.color}`} />
                          {t.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Status */}
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Trạng thái</label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="w-full bg-white border-gray-200 h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Project */}
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Dự án</label>
                <Select value={project} onValueChange={setProject}>
                  <SelectTrigger className="w-full bg-white border-gray-200 h-9 text-sm">
                    <SelectValue placeholder="Chọn dự án..." />
                  </SelectTrigger>
                  <SelectContent>
                    {PROJECTS.map(p => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Owner */}
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Người phụ trách (Owner)</label>
                <div className="relative group">
                  <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <Input 
                    placeholder="Tên người phụ trách..." 
                    className="pl-9 h-9 text-sm bg-white border-gray-200"
                    value={owner}
                    onChange={e => setOwner(e.target.value)}
                  />
                </div>
              </div>

              {/* Stakeholder */}
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Stakeholder</label>
                <div className="relative group">
                  <Users size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <Input 
                    placeholder="Thêm stakeholder..." 
                    className="pl-9 h-9 text-sm bg-white border-gray-200"
                    value={stakeholder}
                    onChange={e => setStakeholder(e.target.value)}
                  />
                </div>
              </div>

              {/* Dates */}
              <div className="space-y-4">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Thời gian</label>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <Calendar size={14} className="text-gray-400 shrink-0" />
                    <input 
                      type="date" 
                      className="flex-1 h-9 text-xs border border-gray-200 rounded px-2 outline-none focus:border-blue-300" 
                      value={startDate}
                      onChange={e => setStartDate(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3.5 shrink-0" /> {/* Spacer */}
                    <input 
                      type="date" 
                      className="flex-1 h-9 text-xs border border-gray-200 rounded px-2 outline-none focus:border-blue-300" 
                      value={endDate}
                      onChange={e => setEndDate(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Advanced Fields */}
              <div className="pt-4 border-t border-gray-100 flex flex-col gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Layers size={12} className="text-gray-400" />
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Trụ cột chiến lược</label>
                  </div>
                  <Input 
                    className="h-8 text-[11px] bg-white border-gray-100"
                    value={strategicPillar}
                    onChange={e => setStrategicPillar(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Flag size={12} className="text-gray-400" />
                    <label className="text-[10px] font-bold text-gray-400 uppercase">PIC</label>
                  </div>
                  <Input 
                    className="h-8 text-[11px] bg-white border-gray-100"
                    value={pic}
                    onChange={e => setPic(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-400">
                    <div className="w-3 h-3 border border-current rounded-full flex items-center justify-center text-[8px] font-bold">D</div>
                    <label className="text-[10px] font-bold uppercase">Deadline</label>
                  </div>
                  <Input 
                    placeholder="VD: Tuần 12 / 2026"
                    className="h-8 text-[11px] bg-white border-gray-100"
                    value={deadline}
                    onChange={e => setDeadline(e.target.value)}
                  />
                </div>
              </div>

              {/* Optional creation policy */}
              <div className="pt-6">
                <div className="flex items-center gap-3 py-3 border-t border-gray-100">
                  <input
                    type="checkbox"
                    id="create-another"
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    checked={createAnother}
                    onChange={e => setCreateAnother(e.target.checked)}
                  />
                  <label htmlFor="create-another" className="text-xs text-gray-500">Create another</label>
                </div>
              </div>
            </div>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
