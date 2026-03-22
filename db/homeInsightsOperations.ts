/**
 * homeInsightsOperations.ts
 *
 * Read-only queries for the Home tab activity feed. Centralises Drizzle access
 * so useHomeInsights stays a thin orchestration hook.
 *
 * Depends on: db/config.ts, db/schema.ts, types/mtd.ts (ActivityItem)
 * Used by: hooks/useHomeInsights.ts
 */

import { desc } from 'drizzle-orm';
import { db } from './config';
import { Invoice, Estimate, MtdTransactions, Transactions } from './schema';
import { ActivityItem } from '@/types/mtd';

// Fetch enough per table so merged + sorted feed can fill home limit (e.g. 20).
const PER_SOURCE = 20;

function sortKey(dateStr: string | null | undefined, fallback: string | null | undefined): number {
  const a = Date.parse(dateStr ?? '');
  if (!Number.isNaN(a)) return a;
  const b = Date.parse(fallback ?? '');
  return Number.isNaN(b) ? 0 : b;
}

export async function getRecentActivity(limit: number): Promise<ActivityItem[]> {
  const inv = await db
    .select({
      id: Invoice.id,
      amount: Invoice.amountAfterTax,
      createdAt: Invoice.createdAt,
      currency: Invoice.currency,
      isPayed: Invoice.isPayed,
    })
    .from(Invoice)
    .orderBy(desc(Invoice.createdAt))
    .limit(PER_SOURCE);

  const est = await db
    .select({
      id: Estimate.id,
      amount: Estimate.amountAfterTax,
      estimateDate: Estimate.estimateDate,
      currency: Estimate.currency,
    })
    .from(Estimate)
    .orderBy(desc(Estimate.estimateDate))
    .limit(PER_SOURCE);

  const mtd = await db
    .select({
      id: MtdTransactions.id,
      description: MtdTransactions.description,
      amount: MtdTransactions.amount,
      date: MtdTransactions.date,
      type: MtdTransactions.type,
      currency: MtdTransactions.currency,
      createdAt: MtdTransactions.createdAt,
    })
    .from(MtdTransactions)
    .orderBy(desc(MtdTransactions.createdAt))
    .limit(PER_SOURCE);

  const txns = await db
    .select({
      id: Transactions.id,
      description: Transactions.description,
      amount: Transactions.amount,
      date: Transactions.date,
      type: Transactions.type,
      currency: Transactions.currency,
      createdAt: Transactions.createdAt,
    })
    .from(Transactions)
    .orderBy(desc(Transactions.createdAt))
    .limit(PER_SOURCE);

  const items: Array<ActivityItem & { _ts: number }> = [];

  for (const row of inv) {
    const dateOut = row.createdAt ?? '';
    items.push({
      id: `inv-${row.id}`,
      type: 'invoice',
      description: row.isPayed ? 'Invoice marked paid' : 'Invoice (unpaid)',
      amount: row.amount ?? 0,
      currency: row.currency ?? 'GBP',
      date: dateOut,
      module: 'invoice',
      _ts: sortKey(row.createdAt, row.createdAt),
    });
  }

  for (const row of est) {
    const dateOut = row.estimateDate ?? '';
    items.push({
      id: `est-${row.id}`,
      type: 'estimate',
      description: 'Estimate',
      amount: row.amount ?? 0,
      currency: row.currency ?? 'GBP',
      date: dateOut,
      module: 'invoice',
      _ts: sortKey(row.estimateDate, row.estimateDate),
    });
  }

  for (const row of mtd) {
    const dateOut = row.date ?? row.createdAt ?? '';
    items.push({
      id: `mtd-${row.id}`,
      type: 'mtd_transaction',
      description: row.description || (row.type === 'income' ? 'MTD income' : 'MTD expense'),
      amount: row.amount ?? 0,
      currency: row.currency ?? 'GBP',
      date: dateOut,
      module: 'mtd',
      _ts: sortKey(row.createdAt, row.date),
    });
  }

  for (const row of txns) {
    const dateOut = row.date ?? row.createdAt ?? '';
    items.push({
      id: `txn-${row.id}`,
      type: 'budget_transaction',
      description: row.description || (row.type === 'INCOME' ? 'Budget income' : 'Budget expense'),
      amount: row.amount ?? 0,
      currency: row.currency ?? 'GBP',
      date: dateOut,
      module: 'budget',
      _ts: sortKey(row.createdAt, row.date),
    });
  }

  items.sort((a, b) => b._ts - a._ts);

  return items.slice(0, limit).map(({ _ts: _ignored, ...rest }) => rest);
}
