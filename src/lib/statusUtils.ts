export const STATUS_CYCLE = ['Chưa bắt đầu', 'Đang triển khai', 'Hoàn thành'] as const;

export function nextStatus(current: string): string {
  const idx = STATUS_CYCLE.indexOf(current as (typeof STATUS_CYCLE)[number]);
  return STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
}
