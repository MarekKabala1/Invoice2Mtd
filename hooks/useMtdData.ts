/**
 * useMtdData.ts
 *
 * MTD aggregated data hook. Follows useBudgetData pattern.
 * Calls aggregateQuarter and getAnnualSummary on mount and input change.
 *
 * Depends on: db/mtdOperations.ts
 * Used by: app/(drawer)/(tabs)/tax.tsx, app/(stack)/mtdQuarterlySummary.tsx,
 *          app/(stack)/mtdAnnualEstimate.tsx
 */

import { useState, useCallback, useEffect } from 'react';
import { useFocusEffect } from 'expo-router';
import { aggregateQuarter, getAnnualSummary, refreshCurrentYear } from '@/db/mtdOperations';
import { QuarterAggregates } from '@/types/mtd';
import { currentTaxYearStart } from '@/utils/mtdDates';

interface UseMtdDataParams {
  taxYear: string;
  quarter: 1 | 2 | 3 | 4;
  userId: string;
}

export const useMtdData = ({ taxYear, quarter, userId }: UseMtdDataParams) => {
  const [aggregates, setAggregates] = useState<QuarterAggregates | null>(null);
  const [annualSummary, setAnnualSummary] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const agg = await aggregateQuarter(taxYear, quarter, userId);
      setAggregates(agg);
      const annual = await getAnnualSummary(taxYear, userId);
      setAnnualSummary(annual);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load MTD data';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [taxYear, quarter, userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  return {
    aggregates,
    annualSummary,
    isLoading,
    error,
    refresh,
  };
};
