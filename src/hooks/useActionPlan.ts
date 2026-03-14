import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ActionPlan, ActionPlanSummary } from '@/types';

export function useActionPlans() {
  return useQuery<ActionPlanSummary[]>({
    queryKey: ['action-plans'],
    queryFn: () => fetch('/api/action-plans').then(r => r.json()),
  });
}

export function useActionPlan(planId: string | null) {
  return useQuery<ActionPlan>({
    queryKey: ['action-plan', planId],
    queryFn: () => {
      if (!planId) throw new Error('planId is required');
      return fetch(`/api/action-plans/${planId}`).then(r => r.json());
    },
    enabled: !!planId,
  });
}

export function useCreateActionPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { month: number; year: number; title: string; notes?: string }) =>
      fetch('/api/action-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(async r => {
        const json = await r.json();
        if (!r.ok) throw new Error(json.error ?? 'Lỗi tạo kế hoạch');
        return json;
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['action-plans'] }),
  });
}

export function useDeleteActionPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (planId: string) =>
      fetch(`/api/action-plans/${planId}`, { method: 'DELETE' }).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['action-plans'] }),
  });
}

export function useClosePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (planId: string) =>
      fetch(`/api/action-plans/${planId}/close`, { method: 'POST' }).then(async r => {
        const json = await r.json();
        if (!r.ok) throw new Error(json.error ?? 'Lỗi kết thúc tháng');
        return json as { rolledOver: number; nextPlanId: string };
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['action-plans'] }),
  });
}

export function useCreateGoal(planId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { title: string; okrLinkage?: string; expectedResult?: string }) =>
      fetch(`/api/action-plans/${planId}/goals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(async r => {
        const json = await r.json();
        if (!r.ok) throw new Error(json.error ?? 'Lỗi tạo mục tiêu');
        return json;
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['action-plan', planId] }),
  });
}

export function useUpdateGoal(planId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ goalId, data }: { goalId: string; data: Partial<{ title: string; okrLinkage: string; expectedResult: string }> }) =>
      fetch(`/api/action-plans/${planId}/goals/${goalId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(async r => {
        const json = await r.json();
        if (!r.ok) throw new Error(json.error ?? 'Lỗi cập nhật mục tiêu');
        return json;
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['action-plan', planId] }),
  });
}

export function useDeleteGoal(planId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (goalId: string) =>
      fetch(`/api/action-plans/${planId}/goals/${goalId}`, { method: 'DELETE' }).then(async r => {
        const json = await r.json();
        if (!r.ok) throw new Error(json.error ?? 'Lỗi xóa mục tiêu');
        return json;
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['action-plan', planId] }),
  });
}

export function useCreateActionItem(planId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ goalId, data }: { goalId: string; data: Partial<{ task: string; expectedResult: string; pic: string; startDate: string; endDate: string; status: string; budget: string; okrLinkage: string }> }) =>
      fetch(`/api/action-plans/${planId}/goals/${goalId}/action-items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task: 'Công việc mới', ...data }),
      }).then(async r => {
        const json = await r.json();
        if (!r.ok) throw new Error(json.error ?? 'Lỗi tạo công việc');
        return json;
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['action-plan', planId] }),
  });
}

export function useUpdateActionItem(planId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, data }: { itemId: string; data: Record<string, unknown> }) =>
      fetch(`/api/action-plans/${planId}/action-items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(async r => {
        const json = await r.json();
        if (!r.ok) throw new Error(json.error ?? 'Lỗi cập nhật công việc');
        return json;
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['action-plan', planId] }),
  });
}

export function useDeleteActionItem(planId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) =>
      fetch(`/api/action-plans/${planId}/action-items/${itemId}`, { method: 'DELETE' }).then(async r => {
        const json = await r.json();
        if (!r.ok) throw new Error(json.error ?? 'Lỗi xóa công việc');
        return json;
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['action-plan', planId] }),
  });
}

export function useCreateKpi(planId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { metric: string; target?: string; actual?: string; note?: string }) =>
      fetch(`/api/action-plans/${planId}/kpis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(async r => {
        const json = await r.json();
        if (!r.ok) throw new Error(json.error ?? 'Lỗi tạo KPI');
        return json;
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['action-plan', planId] }),
  });
}

export function useUpdateKpi(planId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ kpiId, data }: { kpiId: string; data: Partial<{ metric: string; target: string; actual: string; note: string }> }) =>
      fetch(`/api/action-plans/${planId}/kpis/${kpiId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(async r => {
        const json = await r.json();
        if (!r.ok) throw new Error(json.error ?? 'Lỗi cập nhật KPI');
        return json;
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['action-plan', planId] }),
  });
}

export function useDeleteKpi(planId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (kpiId: string) =>
      fetch(`/api/action-plans/${planId}/kpis/${kpiId}`, { method: 'DELETE' }).then(async r => {
        const json = await r.json();
        if (!r.ok) throw new Error(json.error ?? 'Lỗi xóa KPI');
        return json;
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['action-plan', planId] }),
  });
}
