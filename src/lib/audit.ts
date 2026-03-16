import 'server-only';
import prisma from '@/lib/prisma';

export type AuditAction = 'CREATED' | 'UPDATED' | 'DELETED';

interface ItemMeta {
  id: string;
  title: string;
  type: string;
  code?: string | null;
}

/** Log a single field change for an UPDATE */
export async function logFieldChange(
  item: ItemMeta,
  field: string,
  oldValue: unknown,
  newValue: unknown,
) {
  const old = formatValue(oldValue);
  const nw = formatValue(newValue);
  if (old === nw) return; // no actual change
  await prisma.auditLog.create({
    data: {
      itemId: item.id,
      itemTitle: item.title,
      itemType: item.type,
      itemCode: item.code ?? null,
      action: 'UPDATED',
      field,
      oldValue: old,
      newValue: nw,
    },
  });
}

/** Log item creation */
export async function logCreated(item: ItemMeta) {
  await prisma.auditLog.create({
    data: {
      itemId: item.id,
      itemTitle: item.title,
      itemType: item.type,
      itemCode: item.code ?? null,
      action: 'CREATED',
      field: null,
      oldValue: null,
      newValue: null,
    },
  });
}

/** Log item deletion */
export async function logDeleted(item: ItemMeta) {
  await prisma.auditLog.create({
    data: {
      itemId: item.id,
      itemTitle: item.title,
      itemType: item.type,
      itemCode: item.code ?? null,
      action: 'DELETED',
      field: null,
      oldValue: null,
      newValue: null,
    },
  });
}

function formatValue(val: unknown): string | null {
  if (val === null || val === undefined) return null;
  if (val instanceof Date) return val.toISOString();
  return String(val);
}

