export function isOverdue(
  endDate: string | null | undefined,
  status: string,
  completedAt?: string | null,
): boolean {
  if (!endDate) return false;
  if (status === 'Hoàn thành') {
    // Completed: overdue only if it was finished after the due date
    if (!completedAt) return false;
    return new Date(completedAt) > new Date(endDate);
  }
  // Not completed: overdue if past due date right now
  return new Date(endDate) < new Date();
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
