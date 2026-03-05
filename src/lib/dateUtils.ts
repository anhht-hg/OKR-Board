export function isOverdue(endDate: string | null | undefined, status: string): boolean {
  return !!endDate && new Date(endDate) < new Date() && status !== 'Hoàn thành';
}

export function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

export function formatMonthVi(d: Date): string {
  return `Tháng ${d.getMonth() + 1}, ${d.getFullYear()}`;
}
