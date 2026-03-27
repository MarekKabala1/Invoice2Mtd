/**
 * mtdTransactionOps.ts
 *
 * CRUD operations for MtdTransactions table.
 * Handles manual MTD record creation, retrieval, and deletion.
 *
 * Depends on: db/config.ts, db/schema.ts, utils/mtdDates.ts, utils/generateUuid.ts
 * Used by: db/mtdOperations.ts, hooks/useMtdData.ts
 */

import { eq, and, gte, lte, isNull } from 'drizzle-orm';
import { db } from './config';
import { MtdTransactions, Invoice } from './schema';
import { generateId } from '@/utils/shared/generateUuid';
import { taxYearForDate, quartersForTaxYear } from '@/utils/mtd/mtdDates';
import { NewMtdTransaction } from '@/types/mtd';

/**
 * Add a manual MTD transaction (income or expense record).
 * Automatically determines tax year and quarter from transaction date.
 */
export async function addMtdTransaction(
	data: NewMtdTransaction & { invoiceId?: string; transactionId?: string },
	userId: string
): Promise<void> {
	const date = new Date(data.date);
	const ty = taxYearForDate(date);
	const tyLabel = `${ty}-${String(ty + 1).slice(-2)}`;
	const quarter = quarterForDateValue(date);

	await db.insert(MtdTransactions).values({
		id: await generateId(),
		userId,
		invoiceId: data.invoiceId ?? null,
		transactionId: data.transactionId ?? null,
		date: data.date,
		description: data.description,
		amount: data.amount,
		type: data.type,
		category: data.category,
		taxYear: tyLabel,
		quarter,
		receiptRef: data.receiptRef,
		notes: data.notes,
	});
}

/**
 * Determine UK tax year quarter (1-4) for a given date.
 * UK tax year: Q1 Apr 6 - Jul 5, Q2 Jul 6 - Oct 5, Q3 Oct 6 - Jan 5, Q4 Jan 6 - Apr 5
 *
 * WHY: Parentheses required — && binds tighter than ||, but explicit grouping
 * prevents bugs if someone adds conditions without remembering precedence rules.
 */
function quarterForDateValue(date: Date): 1 | 2 | 3 | 4 {
	const m = date.getMonth(); // 0-indexed
	const d = date.getDate();
	if ((m === 3 && d >= 6) || m === 4 || (m === 5 && d <= 5)) return 1;
	if ((m === 6 && d >= 6) || m === 7 || (m === 8 && d <= 5)) return 2;
	if ((m === 9 && d >= 6) || m === 10 || m === 11) return 3;
	return 4; // Jan 6 - Apr 5
}

/**
 * Get all MTD transactions for a tax year, optionally filtered by quarter.
 */
export async function getMtdTransactions(
	taxYear: string,
	quarter?: number
): Promise<(typeof MtdTransactions.$inferSelect)[]> {
	if (quarter) {
		return await db
			.select()
			.from(MtdTransactions)
			.where(
				and(
					eq(MtdTransactions.taxYear, taxYear),
					eq(MtdTransactions.quarter, quarter)
				)
			);
	}
	return await db
		.select()
		.from(MtdTransactions)
		.where(eq(MtdTransactions.taxYear, taxYear));
}

/**
 * Get paid invoice turnover amounts that haven't been recorded as MTD transactions.
 * This captures legacy paid invoices before the MTD sync feature existed.
 */
export async function getPaidInvoiceTurnoverMissingMtd(
	taxYear: string,
	quarter: 1 | 2 | 3 | 4
): Promise<number> {
	const startYear = parseInt(taxYear.split('-')[0], 10);
	if (Number.isNaN(startYear)) return 0;
	const quarters = quartersForTaxYear(startYear);
	const q = quarters.find((x) => x.quarter === quarter);
	if (!q) return 0;

	const rows = await db
		.select({ amount: Invoice.amountAfterTax })
		.from(Invoice)
		.leftJoin(MtdTransactions, eq(MtdTransactions.invoiceId, Invoice.id))
		.where(
			and(
				eq(Invoice.isPayed, true),
				isNull(MtdTransactions.id),
				gte(Invoice.invoiceDate, q.periodStart),
				lte(Invoice.invoiceDate, q.periodEnd + 'T23:59:59.999Z')
			)
		);

	return rows.reduce((s, r) => s + (r.amount ?? 0), 0);
}

/**
 * Delete a manual MTD transaction by ID.
 */
export async function deleteMtdTransaction(id: string): Promise<void> {
	await db.delete(MtdTransactions).where(eq(MtdTransactions.id, id));
}
