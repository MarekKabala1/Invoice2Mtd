/**
 * mtdAnnualSummaryOps.ts
 *
 * Annual summary aggregation and CRUD operations.
 * Refreshes all 4 quarters, aggregates to annual, and manages MtdAnnualSummary records.
 *
 * Depends on: db/config.ts, db/schema.ts, utils/mtdDates.ts, utils/mtdTaxCalc.ts,
 *             db/mtdQuarterlySummaryOps.ts (for refreshQuarterlySummary and getQuarterlySummaries)
 * Used by: db/mtdOperations.ts, hooks/useMtdData.ts
 */

import { eq, and } from 'drizzle-orm';
import { db } from './config';
import { MtdAnnualSummary } from './schema';
import { generateId } from '@/utils/shared/generateUuid';
import { taxYearForDate, toISO } from '@/utils/mtd/mtdDates';
import { estimateTax } from '@/utils/mtd/mtdTaxCalc';
import { TaxRates } from '@/types/mtd';
import { refreshQuarterlySummary, getQuarterlySummaries } from './mtdQuarterlySummaryOps';

/**
 * Refresh annual summary: ensure all quarters are fresh, aggregate, upsert summary record.
 *
 * WHY: Annual summary depends on quarterly data being current. Always refresh all
 * 4 quarters first to ensure accurate aggregation before computing estimated taxes.
 */
export async function refreshAnnualSummary(
	taxYear: string,
	userId: string,
	rates?: TaxRates
): Promise<void> {
	// Ensure all 4 quarters are refreshed first
	for (let q = 1; q <= 4; q++) {
		await refreshQuarterlySummary(taxYear, q as 1 | 2 | 3 | 4, userId);
	}

	const summaries = await getQuarterlySummaries(taxYear, userId);

	let totalTurnover = 0;
	let totalAllowableExpenses = 0;
	let netProfit = 0;
	let quartersWithData = 0;

	for (const s of summaries) {
		totalTurnover += s.totalTurnover;
		totalAllowableExpenses += s.totalAllowableExpenses;
		netProfit += s.netProfit;
		if (s.totalTurnover > 0 || s.totalAllowableExpenses > 0) quartersWithData++;
	}

	const startYear = parseInt(taxYear);
	const estimate = estimateTax(totalTurnover, totalAllowableExpenses, rates);

	const existing = await db
		.select({ id: MtdAnnualSummary.id })
		.from(MtdAnnualSummary)
		.where(
			and(
				eq(MtdAnnualSummary.userId, userId),
				eq(MtdAnnualSummary.taxYear, taxYear)
			)
		);

	const values = {
		taxYear,
		finalDeclarationDeadline: `${startYear + 2}-01-31`,
		totalTurnover,
		totalAllowableExpenses,
		netProfit,
		estimatedTaxableProfit: estimate.taxableProfit,
		estimatedIncomeTax: estimate.totalIncomeTax,
		estimatedNI: estimate.totalNI,
		estimatedTotalTax: estimate.totalTaxAndNI,
		personalAllowanceUsed: estimate.personalAllowanceUsed,
		status: quartersWithData === 4 ? 'ready' : 'in_progress',
	};

	if (existing.length > 0) {
		await db
			.update(MtdAnnualSummary)
			.set(values)
			.where(eq(MtdAnnualSummary.id, existing[0].id));
	} else {
		await db.insert(MtdAnnualSummary).values({
			id: await generateId(),
			userId,
			...values,
		});
	}
}

/**
 * Get annual summary for tax year.
 */
export async function getAnnualSummary(
	taxYear: string,
	userId: string
): Promise<typeof MtdAnnualSummary.$inferSelect | null> {
	const rows = await db
		.select()
		.from(MtdAnnualSummary)
		.where(
			and(
				eq(MtdAnnualSummary.userId, userId),
				eq(MtdAnnualSummary.taxYear, taxYear)
			)
		);
	return rows.length > 0 ? rows[0] : null;
}

/**
 * Refresh annual summary for current tax year.
 */
export async function refreshCurrentYear(userId: string, rates?: TaxRates): Promise<void> {
	const year = taxYearForDate(new Date());
	const tyLabel = `${year}-${String(year + 1).slice(-2)}`;
	await refreshAnnualSummary(tyLabel, userId, rates);
}
