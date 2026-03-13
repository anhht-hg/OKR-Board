'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateActionPlan } from '@/hooks/useActionPlan';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (planId: string) => void;
}

export function CreatePlanDialog({ open, onOpenChange, onCreated }: Props) {
  const today = new Date();
  const [month, setMonth] = useState(String(today.getMonth() + 1));
  const [year, setYear] = useState(String(today.getFullYear()));
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const create = useCreateActionPlan();

  useEffect(() => {
    setTitle(`Kế hoạch tháng ${month}/${year}`);
  }, [month, year]);

  useEffect(() => {
    if (open) {
      setError(null);
      setNotes('');
    }
  }, [open]);

  async function handleSubmit() {
    setError(null);
    try {
      const plan = await create.mutateAsync({
        month: Number(month),
        year: Number(year),
        title,
        notes: notes || undefined,
      });
      onCreated(plan.id);
      onOpenChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lỗi tạo kế hoạch');
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-bold">Tạo kế hoạch hành động mới</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Tháng</label>
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                    <SelectItem key={m} value={String(m)}>Tháng {m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Năm</label>
              <Input
                value={year}
                onChange={e => setYear(e.target.value)}
                className="h-9 text-sm"
                type="number"
                min="2024"
                max="2030"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Tiêu đề</label>
            <Input
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="h-9 text-sm"
              placeholder="Kế hoạch tháng 3/2026"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Ghi chú (tùy chọn)</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              className="w-full text-sm border border-input rounded-md px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Ghi chú thêm..."
            />
          </div>

          {error && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Huỷ</Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!title || create.isPending}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {create.isPending ? 'Đang tạo...' : 'Tạo kế hoạch'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
