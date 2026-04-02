/**
 * useMtdTransactionsForQuarter.ts
 *
 * Loads MtdTransactions rows for a tax year and quarter. Keeps stack screens
 * off db/mtdOperations directly (data access lives in a hook).
 *
 * Depends on: db/mtdOperations.ts (getMtdTransactions)
 * Used by: app/(stack)/mtdQuarterlySummary.tsx
 */

import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { getMtdTransactions } from '@/db/mtdOperations';
import { MtdTransactions } from '@/db/schema';

export type MtdTransactionRow = typeof MtdTransactions.$inferSelect;

export function useMtdTransactionsForQuarter(taxYear: string, quarter: 1 | 2 | 3 | 4) {
  const [transactions, setTransactions] = useState<MtdTransactionRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const rows = await getMtdTransactions(taxYear, quarter);
      setTransactions(rows);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to load MTD records';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [taxYear, quarter]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  return { transactions, isLoading, error, refresh };
}
