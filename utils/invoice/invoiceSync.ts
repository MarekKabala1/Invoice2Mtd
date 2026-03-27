/**
 * invoiceSync.ts
 *
 * Atomic three-way sync operations between Invoice, Transactions (budget),
 * and MtdTransactions tables. Every operation uses db.transaction() so if
 * any step fails, all changes roll back.
 *
 * Depends on: db/config.ts, db/schema.ts, utils/generateUuid.ts,
 *             utils/mtdDates.ts, utils/mtdCategories.ts
 * Used by: components/InvoiceForm/InvoiceSettingsModal.tsx,
 *          components/InvoiceForm/InvoiceList.tsx,
 *          hooks/useBudgetData.ts,
 *          app/(stack)/mtdQuarterlySummary.tsx
 */

import { eq } from 'drizzle-orm';
import { db } from '@/db/config';
import { Invoice, Transactions, MtdTransactions, WorkInformation, Payment, Note } from '@/db/schema';
import { generateId } from '@/utils/shared/generateUuid';
import { taxYearForDate } from '@/utils/mtd/mtdDates';
import { refreshCurrentYear } from '@/db/mtdOperations';
import { getCurrentUserId } from '@/utils/shared/getCurrentUser';

function quarterForDateValue(date: Date): 1 | 2 | 3 | 4 {
  const m = date.getMonth();
  const d = date.getDate();
  if ((m === 3 && d >= 6) || m === 4 || (m === 5 && d <= 5)) return 1;
  if ((m === 6 && d >= 6) || m === 7 || (m === 8 && d <= 5)) return 2;
  if ((m === 9 && d >= 6) || m === 10 || m === 11) return 3;
  return 4;
}

// ─── Mark Invoice as Paid ──────────────────────────────────────────────────
// Sets Invoice.isPayed = true, creates Transactions income row,
// creates MtdTransactions row linked via invoiceId + transactionId.

export async function markInvoiceAsPaid(
  invoiceId: string,
  invoiceAmount: number,
  invoiceCurrency: string | null,
  paymentDate: string,      // YYYY-MM-DD
  incomeCategory: string,   // turnover, other_business_income, etc.
  customerName: string
): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('No user found');

  const budgetTxnId = await generateId();
  const mtdTxnId = await generateId();
  const date = new Date(paymentDate);
  const ty = taxYearForDate(date);
  const tyLabel = `${ty}-${String(ty + 1).slice(-2)}`;
  const quarter = quarterForDateValue(date);

  await db.transaction(async (tx) => {
    // 1. Set invoice as paid
    await tx.update(Invoice).set({ isPayed: true }).where(eq(Invoice.id, invoiceId));

    // 2. Create budget income transaction
    await tx.insert(Transactions).values({
      id: budgetTxnId,
      amount: invoiceAmount,
      description: `Invoice from ${customerName}`,
      date: paymentDate,
      type: 'INCOME',
      categoryId: incomeCategory,
      userId: userId,
      currency: invoiceCurrency ?? 'GBP',
    });

    // 3. Create MTD income transaction linked to invoice + budget txn
    await tx.insert(MtdTransactions).values({
      id: mtdTxnId,
      userId,
      invoiceId,
      transactionId: budgetTxnId,
      date: paymentDate,
      description: `Invoice from ${customerName}`,
      amount: invoiceAmount,
      type: 'income',
      category: incomeCategory,
      taxYear: tyLabel,
      quarter,
      currency: invoiceCurrency ?? 'GBP',
    });
  });

  await refreshCurrentYear(userId);
}

// ─── Mark Invoice as Unpaid ────────────────────────────────────────────────
// Sets Invoice.isPayed = false, deletes linked Transactions row,
// deletes linked MtdTransactions rows (found via invoiceId).

export async function markInvoiceAsUnpaid(invoiceId: string): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('No user found');

  await db.transaction(async (tx) => {
    // 1. Set invoice as unpaid
    await tx.update(Invoice).set({ isPayed: false }).where(eq(Invoice.id, invoiceId));

    // 2. Find linked MTD transactions
    const linkedMtd = await tx
      .select({ id: MtdTransactions.id, transactionId: MtdTransactions.transactionId })
      .from(MtdTransactions)
      .where(eq(MtdTransactions.invoiceId, invoiceId));

    for (const mtd of linkedMtd) {
      // 3. Delete linked budget transaction
      if (mtd.transactionId) {
        await tx.delete(Transactions).where(eq(Transactions.id, mtd.transactionId));
      }
      // 4. Delete MTD transaction
      await tx.delete(MtdTransactions).where(eq(MtdTransactions.id, mtd.id));
    }
  });

  await refreshCurrentYear(userId);
}

// ─── Delete Budget Transaction (Transactions) ─────────────────────────────
// Deletes the Transactions row, finds linked MtdTransactions via
// transactionId and deletes it, sets linked Invoice.isPayed = false.

export async function deleteBudgetTransaction(transactionId: string): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('No user found');

  await db.transaction(async (tx) => {
    // 1. Find linked MTD transaction
    const linkedMtd = await tx
      .select({ id: MtdTransactions.id, invoiceId: MtdTransactions.invoiceId })
      .from(MtdTransactions)
      .where(eq(MtdTransactions.transactionId, transactionId));

    // 2. Delete linked MTD transactions
    for (const mtd of linkedMtd) {
      await tx.delete(MtdTransactions).where(eq(MtdTransactions.id, mtd.id));
      // 3. If linked to invoice, mark it unpaid
      if (mtd.invoiceId) {
        await tx.update(Invoice).set({ isPayed: false }).where(eq(Invoice.id, mtd.invoiceId));
      }
    }

    // 4. Delete the budget transaction
    await tx.delete(Transactions).where(eq(Transactions.id, transactionId));
  });

  await refreshCurrentYear(userId);
}

// ─── Delete MTD Transaction ───────────────────────────────────────────────
// Deletes the MtdTransactions row, deletes linked Transactions via
// transactionId, sets linked Invoice.isPayed = false.

export async function deleteMtdTransactionSync(mtdTransactionId: string): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('No user found');

  await db.transaction(async (tx) => {
    // 1. Get the MTD transaction to find linked IDs
    const mtdRow = await tx
      .select()
      .from(MtdTransactions)
      .where(eq(MtdTransactions.id, mtdTransactionId));

    if (mtdRow.length === 0) return;

    const mtd = mtdRow[0];

    // 2. Delete linked budget transaction
    if (mtd.transactionId) {
      await tx.delete(Transactions).where(eq(Transactions.id, mtd.transactionId));
    }

    // 3. If linked to invoice, mark it unpaid
    if (mtd.invoiceId) {
      await tx.update(Invoice).set({ isPayed: false }).where(eq(Invoice.id, mtd.invoiceId));
    }

    // 4. Delete the MTD transaction
    await tx.delete(MtdTransactions).where(eq(MtdTransactions.id, mtdTransactionId));
  });

  await refreshCurrentYear(userId);
}

// ─── Delete Invoice ──────────────────────────────────────────────────────
// Deletes Invoice, linked WorkInformation, Payments, Notes, and
// linked Transactions + MtdTransactions rows.

export async function deleteInvoiceFull(invoiceId: string): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('No user found');

  await db.transaction(async (tx) => {
    // 1. Find linked MTD transactions
    const linkedMtd = await tx
      .select({ id: MtdTransactions.id, transactionId: MtdTransactions.transactionId })
      .from(MtdTransactions)
      .where(eq(MtdTransactions.invoiceId, invoiceId));

    // 2. Delete linked budget transactions and MTD transactions
    for (const mtd of linkedMtd) {
      if (mtd.transactionId) {
        await tx.delete(Transactions).where(eq(Transactions.id, mtd.transactionId));
      }
      await tx.delete(MtdTransactions).where(eq(MtdTransactions.id, mtd.id));
    }

    // 3. Delete invoice-related rows
    await tx.delete(WorkInformation).where(eq(WorkInformation.invoiceId, invoiceId));
    await tx.delete(Payment).where(eq(Payment.invoiceId, invoiceId));
    await tx.delete(Note).where(eq(Note.invoiceId, invoiceId));
    await tx.delete(Invoice).where(eq(Invoice.id, invoiceId));
  });

  await refreshCurrentYear(userId);
}

// ─── Find linked records for warnings ─────────────────────────────────────

export async function findLinkedBudgetForMtd(mtdTransactionId: string): Promise<{ id: string; description: string | null } | null> {
  const rows = await db
    .select({
      id: MtdTransactions.id,
      transactionId: MtdTransactions.transactionId,
      invoiceId: MtdTransactions.invoiceId,
    })
    .from(MtdTransactions)
    .where(eq(MtdTransactions.id, mtdTransactionId));

  if (rows.length === 0 || !rows[0].transactionId) return null;

  const txn = await db
    .select({ id: Transactions.id, description: Transactions.description })
    .from(Transactions)
    .where(eq(Transactions.id, rows[0].transactionId));

  return txn.length > 0 ? txn[0] : null;
}

export async function findLinkedInvoiceForBudget(transactionId: string): Promise<{ id: string } | null> {
  const rows = await db
    .select({ invoiceId: MtdTransactions.invoiceId })
    .from(MtdTransactions)
    .where(eq(MtdTransactions.transactionId, transactionId));

  for (const row of rows) {
    if (row.invoiceId) {
      const inv = await db
        .select({ id: Invoice.id })
        .from(Invoice)
        .where(eq(Invoice.id, row.invoiceId));
      if (inv.length > 0) return inv[0];
    }
  }
  return null;
}

export async function findLinkedRecordsForInvoice(invoiceId: string): Promise<{
  hasLinkedBudget: boolean;
  hasLinkedMtd: boolean;
}> {
  const mtdRows = await db
    .select({ transactionId: MtdTransactions.transactionId })
    .from(MtdTransactions)
    .where(eq(MtdTransactions.invoiceId, invoiceId));

  return {
    hasLinkedMtd: mtdRows.length > 0,
    hasLinkedBudget: mtdRows.some((r) => r.transactionId !== null),
  };
}
