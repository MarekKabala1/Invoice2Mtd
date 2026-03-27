/**
 * useUnpaidInvoicesForQuarter.ts
 *
 * Fetches unpaid invoice count and total for the current UK tax quarter.
 * Used by the Tax screen to show an unpaid invoices banner.
 *
 * WHY: tax.tsx previously queried the Invoice table directly via db.select().
 *      All DB access must go through hooks for testability and separation of concerns.
 *
 * Depends on: db/config, db/schema, utils/mtdDates
 * Used by: components/mtd/TaxHub.tsx (extracted from tax.tsx)
 */

import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { db } from '@/db/config';
import { Invoice } from '@/db/schema';
import { eq, and, gte, lte } from 'drizzle-orm';
import { quartersForTaxYear, quarterForDate, currentTaxYearStart } from '@/utils/mtd/mtdDates';

export function useUnpaidInvoicesForQuarter() {
	const [unpaidCount, setUnpaidCount] = useState(0);
	const [unpaidTotal, setUnpaidTotal] = useState(0);

	const fetch = useCallback(async () => {
		try {
			const q = quartersForTaxYear(currentTaxYearStart());
			const currentQ = quarterForDate(new Date());
			const quarter = q.find((x) => x.quarter === currentQ.quarter);
			if (!quarter) return;
			const rows = await db
				.select({ amountAfterTax: Invoice.amountAfterTax })
				.from(Invoice)
				.where(
					and(
						eq(Invoice.isPayed, false),
						gte(Invoice.invoiceDate, quarter.periodStart),
						lte(Invoice.invoiceDate, quarter.periodEnd + 'T23:59:59.999Z'),
					),
				);
			setUnpaidCount(rows.length);
			setUnpaidTotal(rows.reduce((sum, r) => sum + (r.amountAfterTax ?? 0), 0));
		} catch {
			// Table may not exist yet
		}
	}, []);

	useFocusEffect(
		useCallback(() => {
			fetch();
		}, [fetch]),
	);

	return { unpaidCount, unpaidTotal, refresh: fetch };
}
