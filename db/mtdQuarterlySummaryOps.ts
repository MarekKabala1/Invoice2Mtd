/**
 * mtdQuarterlySummaryOps.ts
 *
 * Quarterly summary aggregation and CRUD operations.
 * Handles three-source aggregation: manual MTD records, paid invoices, budget transactions.
 *
 * IMPORTANT: aggregateQuarter() pulls from THREE sources — MtdTransactions,
 * Invoice (paid invoices as turnover), and Transactions (budget expenses).
 * Do not remove any source without updating the QuarterAggregates sources field.
 *
 * Depends on: db/config.ts, db/schema.ts, utils/mtdDates.ts, utils/mtdTaxCalc.ts,
 *             utils/mtdCategories.ts, utils/generateUuid.ts
 * Used by: db/mtdOperations.ts, hooks/useMtdData.ts
 */

import { eq, and, gte, lte, isNull, or, ne } from 'drizzle-orm';
import { db } from './config';
import { MtdTransactions, MtdQuarterlySummary, Invoice, Transactions } from './schema';
import { generateId } from '@/utils/generateUuid';
import { quartersForTaxYear, toISO } from '@/utils/mtdDates';
import { mapCategoryToHmrc } from '@/utils/mtdCategories';
import { EXPENSE_CATEGORIES, ExpenseCategory, QuarterAggregates } from '@/types/mtd';

/**
 * Create empty aggregates object with all categories initialized to zero.
 */
function emptyAggregates(): QuarterAggregates {
	const zero: Record<ExpenseCategory, number> = {} as Record<ExpenseCategory, number>;
	for (const cat of EXPENSE_CATEGORIES) zero[cat] = 0;
	return {
		totalTurnover: 0,
		costOfGoodsAllowable: 0,
		employeeCosts: 0,
		premisesRunningCosts: 0,
		maintenanceCosts: 0,
		advertisingCosts: 0,
		businessEntertainmentCosts: 0,
		interestOnBankLoans: 0,
		professionalFees: 0,
		depreciation: 0,
		otherAllowableExpenses: 0,
		otherDisallowableExpenses: 0,
		totalAllowableExpenses: 0,
		netProfit: 0,
		sources: {
			invoiceTurnover: 0,
			budgetExpenses: { ...zero },
			manualTurnover: 0,
			manualExpenses: { ...zero },
		},
	};
}

/**
 * Aggregate quarter financial data from three sources:
 * 1. Manual MTD transactions (income/expenses)
 * 2. Paid invoices (turnover via linked transactions)
 * 3. Budget transactions (expenses mapped to HMRC categories, income)
 *
 * WHY: Three-source pattern prevents double-counting when invoice is marked paid
 * (creates both Mtd record + budget income transaction). Each source applies
 * different exclusion logic to avoid duplication.
 */
export async function aggregateQuarter(
	taxYear: string,
	quarter: 1 | 2 | 3 | 4,
	userId: string
): Promise<QuarterAggregates> {
	const quarters = quartersForTaxYear(parseInt(taxYear));
	const q = quarters.find((q) => q.quarter === quarter);
	if (!q) return emptyAggregates();

	const agg = emptyAggregates();

	// Source 1: Manual MTD transactions (skip those linked to budget Transactions)
	// Skip income rows linked to Invoice — Source 2 handles those
	const manualTxns = await db
		.select({
			type: MtdTransactions.type,
			category: MtdTransactions.category,
			amount: MtdTransactions.amount,
		})
		.from(MtdTransactions)
		.where(
			and(
				eq(MtdTransactions.taxYear, taxYear),
				eq(MtdTransactions.quarter, quarter),
				isNull(MtdTransactions.transactionId),
				or(ne(MtdTransactions.type, 'income'), isNull(MtdTransactions.invoiceId))
			)
		);

	for (const tx of manualTxns) {
		const cat = tx.category as ExpenseCategory;
		if (tx.type === 'income') {
			agg.sources.manualTurnover += tx.amount;
			agg.totalTurnover += tx.amount;
		} else {
			agg.sources.manualExpenses[cat] = (agg.sources.manualExpenses[cat] || 0) + tx.amount;
			(agg[cat as keyof QuarterAggregates] as number) = ((agg[cat as keyof QuarterAggregates] as number) || 0) + tx.amount;
		}
	}

	// Source 2: Paid invoices → turnover
	const paidInvoices = await db
		.select({ amountAfterTax: Invoice.amountAfterTax })
		.from(Invoice)
		.where(
			and(
				eq(Invoice.isPayed, true),
				gte(Invoice.invoiceDate, q.periodStart),
				lte(Invoice.invoiceDate, q.periodEnd + 'T23:59:59.999Z')
			)
		);

	for (const inv of paidInvoices) {
		agg.sources.invoiceTurnover += (inv.amountAfterTax || 0);
		agg.totalTurnover += (inv.amountAfterTax || 0);
	}

	// Source 3a: Budget expense transactions → mapped to HMRC categories
	const budgetExpenses = await db
		.select({
			amount: Transactions.amount,
			categoryId: Transactions.categoryId,
		})
		.from(Transactions)
		.where(
			and(
				eq(Transactions.type, 'EXPENSE'),
				gte(Transactions.date, q.periodStart),
				lte(Transactions.date, q.periodEnd)
			)
		);

	for (const bt of budgetExpenses) {
		const hmrcCat = mapCategoryToHmrc(bt.categoryId || '');
		const amt = bt.amount || 0;
		agg.sources.budgetExpenses[hmrcCat] = (agg.sources.budgetExpenses[hmrcCat] || 0) + amt;
		(agg[hmrcCat as keyof QuarterAggregates] as number) = ((agg[hmrcCat as keyof QuarterAggregates] as number) || 0) + amt;
	}

	// Source 3b: Budget income transactions → turnover
	// Exclude rows mirrored from markInvoiceAsPaid (those are in Source 2)
	const budgetIncome = await db
		.select({ amount: Transactions.amount })
		.from(Transactions)
		.leftJoin(MtdTransactions, eq(MtdTransactions.transactionId, Transactions.id))
		.where(
			and(
				eq(Transactions.type, 'INCOME'),
				gte(Transactions.date, q.periodStart),
				lte(Transactions.date, q.periodEnd),
				or(isNull(MtdTransactions.id), isNull(MtdTransactions.invoiceId))
			)
		);

	for (const bi of budgetIncome) {
		const amt = bi.amount || 0;
		agg.sources.manualTurnover += amt;
		agg.totalTurnover += amt;
	}

	// Compute totals
	agg.totalAllowableExpenses =
		agg.costOfGoodsAllowable +
		agg.employeeCosts +
		agg.premisesRunningCosts +
		agg.maintenanceCosts +
		agg.advertisingCosts +
		agg.interestOnBankLoans +
		agg.professionalFees +
		agg.depreciation +
		agg.otherAllowableExpenses;

	agg.netProfit = agg.totalTurnover - agg.totalAllowableExpenses;

	return agg;
}

/**
 * Refresh quarterly summary: aggregate data and upsert MtdQuarterlySummary record.
 */
export async function refreshQuarterlySummary(
	taxYear: string,
	quarter: 1 | 2 | 3 | 4,
	userId: string
): Promise<void> {
	const agg = await aggregateQuarter(taxYear, quarter, userId);
	const quarters = quartersForTaxYear(parseInt(taxYear));
	const q = quarters.find((q) => q.quarter === quarter);
	if (!q) return;

	const existing = await db
		.select({ id: MtdQuarterlySummary.id })
		.from(MtdQuarterlySummary)
		.where(
			and(
				eq(MtdQuarterlySummary.userId, userId),
				eq(MtdQuarterlySummary.taxYear, taxYear),
				eq(MtdQuarterlySummary.quarter, quarter)
			)
		);

	const values = {
		taxYear,
		quarter,
		periodStart: q.periodStart,
		periodEnd: q.periodEnd,
		submissionDeadline: q.submissionDeadline,
		totalTurnover: agg.totalTurnover,
		costOfGoodsAllowable: agg.costOfGoodsAllowable,
		employeeCosts: agg.employeeCosts,
		premisesRunningCosts: agg.premisesRunningCosts,
		maintenanceCosts: agg.maintenanceCosts,
		advertisingCosts: agg.advertisingCosts,
		interestOnBankLoans: agg.interestOnBankLoans,
		professionalFees: agg.professionalFees,
		depreciation: agg.depreciation,
		otherAllowableExpenses: agg.otherAllowableExpenses,
		businessEntertainmentCosts: agg.businessEntertainmentCosts,
		otherDisallowableExpenses: agg.otherDisallowableExpenses,
		totalAllowableExpenses: agg.totalAllowableExpenses,
		netProfit: agg.netProfit,
		status: agg.totalTurnover > 0 || agg.totalAllowableExpenses > 0 ? 'in_progress' : 'not_started',
		lastCalculatedAt: toISO(new Date()),
	};

	if (existing.length > 0) {
		await db
			.update(MtdQuarterlySummary)
			.set(values)
			.where(eq(MtdQuarterlySummary.id, existing[0].id));
	} else {
		await db.insert(MtdQuarterlySummary).values({
			id: await generateId(),
			userId,
			...values,
		});
	}
}

/**
 * Get all quarterly summaries for a tax year.
 */
export async function getQuarterlySummaries(
	taxYear: string,
	userId: string
): Promise<(typeof MtdQuarterlySummary.$inferSelect)[]> {
	return await db
		.select()
		.from(MtdQuarterlySummary)
		.where(
			and(
				eq(MtdQuarterlySummary.userId, userId),
				eq(MtdQuarterlySummary.taxYear, taxYear)
			)
		);
}
