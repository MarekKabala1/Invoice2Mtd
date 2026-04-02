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
import { taxYearForDate, quartersForTaxYear, quarterForDate } from '@/utils/mtd/mtdDates';
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
	const quarter = quarterForDate(date).quarter;

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
