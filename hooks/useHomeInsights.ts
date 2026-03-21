/**
 * useHomeInsights.ts
 *
 * Cross-module insights hook for the Home tab. Combines invoice data
 * and MTD data to show unified business overview.
 *
 * Depends on: hooks/useInvoiceData.ts, hooks/useMtdDeadlines.ts,
 *             db/mtdOperations.ts, utils/mtdDates.ts
 * Used by: app/(drawer)/(tabs)/home.tsx
 */

import { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { aggregateQuarter } from '@/db/mtdOperations';
import { useMtdDeadlines } from './useMtdDeadlines';
import { currentTaxYearStart, taxYearLabel, quarterForDate } from '@/utils/mtdDates';
import { DeadlineItem } from '@/types/mtd';

interface UseHomeInsightsResult {
  currentQuarterTurnover: number;
  currentQuarterNetProfit: number;
  nextDeadline: DeadlineItem | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useHomeInsights(userId: string): UseHomeInsightsResult {
  const [currentQuarterTurnover, setCurrentQuarterTurnover] = useState(0);
  const [currentQuarterNetProfit, setCurrentQuarterNetProfit] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { nextDeadline } = useMtdDeadlines(2);

  const refresh = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const startYear = currentTaxYearStart();
      const tyLabel = taxYearLabel(startYear);
      const today = new Date();
      const q = quarterForDate(today);

      const agg = await aggregateQuarter(tyLabel, q.quarter, userId);
      setCurrentQuarterTurnover(agg.totalTurnover);
      setCurrentQuarterNetProfit(agg.netProfit);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load insights';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  return {
    currentQuarterTurnover,
    currentQuarterNetProfit,
    nextDeadline,
    isLoading,
    error,
    refresh,
  };
}
