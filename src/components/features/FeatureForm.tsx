'use client';

import { useState, useEffect } from 'react';
import { OkrItem, Status } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PROJECTS, STATUSES, CHILD_TYPES, TYPE_LABELS } from '@/lib/constants';
import { useCreateItem, useUpdateItem } from '@/hooks/useObjectives';

interface Props {
  open: boolean;
  onClose: () => void;
  editItem?: OkrItem | null;
  parentId?: string | null;
  parentType?: string | null;
  defaultType?: string;
}

export function FeatureForm({
  open,
  onClose,
  editItem,
  parentId,
  parentType,
  defaultType = 'Feature',
}: Props) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState(defaultType);
  const [status, setStatus] = useState<Status>('Chưa bắt đầu');
  const [project, setProject] = useState('');
  const [owner, setOwner] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [code, setCode] = useState('');

  const createItem = useCreateItem();
  const updateItem = useUpdateItem();

  useEffect(() => {
    if (editItem) {
      setTitle(editItem.title);
      setType(editItem.type);
      setStatus(editItem.status);
      setProject(editItem.project || '');
      setOwner(editItem.owner || '');
      setCode(editItem.code || '');
      setStartDate(
        editItem.startDate ? editItem.startDate.split('T')[0] : ''
      );
      setEndDate(
        editItem.endDate ? editItem.endDate.split('T')[0] : ''
      );
    } else {
      setTitle('');
      setType(defaultType);
      setStatus('Chưa bắt đầu');
      setProject('');
      setOwner('');
      setCode('');
      setStartDate('');
      setEndDate('');
    }
  }, [editItem, defaultType, open]);

  // Determine allowed child types based on parent
  const allowedTypes = parentType
    ? CHILD_TYPES[parentType] || [defaultType]
    : [defaultType];

  const handleSubmit = async () => {
    if (!title.trim()) return;

    const payload: Partial<OkrItem> = {
      title: title.trim(),
      type: type as OkrItem['type'],
      status,
      project: project || null,
      owner: owner || null,
      code: code || null,
      startDate: startDate || null,
      endDate: endDate || null,
      parentId: editItem?.parentId ?? parentId ?? null,
    };

    if (editItem) {
      await updateItem.mutateAsync({ id: editItem.id, data: payload });
    } else {
      await createItem.mutateAsync(payload);
    }
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {editItem ? 'Chỉnh sửa' : 'Thêm mới'} item
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">
              Loại
            </label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {allowedTypes.map((t) => (
                  <SelectItem key={t} value={t}>
                    {TYPE_LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">
              Tiêu đề *
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nhập tiêu đề..."
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">
              Mã (code)
            </label>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="VD: FE-10"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">
                Trạng thái
              </label>
              <Select value={status} onValueChange={(v) => setStatus(v as Status)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">
                Dự án
              </label>
              <Select value={project} onValueChange={setProject}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn dự án" />
                </SelectTrigger>
                <SelectContent>
                  {PROJECTS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">
              Owner
            </label>
            <Input
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              placeholder="Tên người phụ trách"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">
                Ngày bắt đầu
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">
                Ngày kết thúc
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!title.trim() || createItem.isPending || updateItem.isPending}
          >
            {createItem.isPending || updateItem.isPending ? 'Đang lưu...' : 'Lưu'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
