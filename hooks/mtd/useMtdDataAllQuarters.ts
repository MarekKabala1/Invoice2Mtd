/**
 * useMtdDataAllQuarters.ts
 *
 * Convenience hook that fetches MTD aggregate data for all 4 quarters of a tax year.
 * Returns per-quarter results plus computed totals (yearly turnover, etc.).
 *
 * WHY: tax.tsx called useMtdData 5 times (once for current quarter + 4 for yearly).
 *      mtdAnnualEstimate.tsx called it 4 times. This hook eliminates duplication and
 *      provides a single source for all-quarter aggregation.
 *
 * Depends on: hooks/useMtdData
 * Used by: components/mtd/TaxHub.tsx, components/mtd/AnnualEstimateHub.tsx
 */

import { useMemo } from 'react';
import { useMtdData } from './useMtdData';

export function useMtdDataAllQuarters(taxYear: string, userId: string) {
	const q1 = useMtdData({ taxYear, quarter: 1, userId });
	const q2 = useMtdData({ taxYear, quarter: 2, userId });
	const q3 = useMtdData({ taxYear, quarter: 3, userId });
	const q4 = useMtdData({ taxYear, quarter: 4, userId });

	const allQuarters = [q1, q2, q3, q4];
	const isLoading = allQuarters.some((q) => q.isLoading);
	const error = allQuarters.find((q) => q.error)?.error ?? null;

	const yearlyTurnover = useMemo(() => {
		return allQuarters.reduce((sum, q) => sum + (q.aggregates?.totalTurnover ?? 0), 0);
	}, [q1.aggregates, q2.aggregates, q3.aggregates, q4.aggregates]);

	return {
		q1,
		q2,
		q3,
		q4,
		allQuarters,
		isLoading,
		error,
		yearlyTurnover,
	};
}
