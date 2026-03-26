/**
 * useHomeInsights.ts
 *
 * Cross-module insights hook for the Home tab. Combines invoice data,
 * MTD aggregates, unpaid totals, invoice→MTD gaps, deadlines, and a
 * recent-activity feed (MASTER_PLAN Phase 5).
 *
 * Depends on: db/mtdOperations.ts, db/invoiceOperations.ts,
 *             db/homeInsightsOperations.ts, hooks/useMtdDeadlines.ts,
 *             utils/mtdDates.ts, types/mtd.ts
 * Used by: app/(drawer)/(tabs)/home.tsx
 */

import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { aggregateQuarter, getPaidInvoiceTurnoverMissingMtd } from '@/db/mtdOperations';
import { getUnpaidInvoicesTotals } from '@/db/invoiceOperations';
import { getRecentActivity } from '@/db/homeInsightsOperations';
import { useMtdDeadlines } from './useMtdDeadlines';
import { currentTaxYearStart, taxYearLabel, quarterForDate } from '@/utils/mtdDates';
import { ActivityItem, DeadlineItem } from '@/types/mtd';

export interface UseHomeInsightsResult {
  unpaidInvoicesTotal: number;
  unpaidInvoicesCount: number;
  currentQuarterTurnover: number;
  currentQuarterNetProfit: number;
  currentQuarter: 1 | 2 | 3 | 4;
  turnoverNotYetRecorded: number;
  nextDeadline: DeadlineItem | null;
  recentActivity: ActivityItem[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useHomeInsights(_userId: string): UseHomeInsightsResult {
  const [unpaidInvoicesTotal, setUnpaidInvoicesTotal] = useState(0);
  const [unpaidInvoicesCount, setUnpaidInvoicesCount] = useState(0);
  const [currentQuarterTurnover, setCurrentQuarterTurnover] = useState(0);
  const [currentQuarterNetProfit, setCurrentQuarterNetProfit] = useState(0);
  const [currentQuarter, setCurrentQuarter] = useState<1 | 2 | 3 | 4>(1);
  const [turnoverNotYetRecorded, setTurnoverNotYetRecorded] = useState(0);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { nextDeadline } = useMtdDeadlines(2);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const startYear = currentTaxYearStart();
      const tyLabel = taxYearLabel(startYear);
      const today = new Date();
      const q = quarterForDate(today);

      const [agg, unpaid, gap, activity] = await Promise.all([
        aggregateQuarter(tyLabel, q.quarter, ''),
        getUnpaidInvoicesTotals(),
        getPaidInvoiceTurnoverMissingMtd(tyLabel, q.quarter),
        getRecentActivity(20),
      ]);

      setCurrentQuarterTurnover(agg.totalTurnover);
      setCurrentQuarterNetProfit(agg.netProfit);
      setCurrentQuarter(q.quarter);
      setUnpaidInvoicesTotal(unpaid.total);
      setUnpaidInvoicesCount(unpaid.count);
      setTurnoverNotYetRecorded(gap);
      setRecentActivity(activity);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load insights';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  return {
    unpaidInvoicesTotal,
    unpaidInvoicesCount,
    currentQuarterTurnover,
    currentQuarterNetProfit,
    currentQuarter,
    turnoverNotYetRecorded,
    nextDeadline,
    recentActivity,
    isLoading,
    error,
    refresh,
  };
}
