/**
 * mtdOperations.ts
 *
 * All database operations for the three MTD tables: MtdTransactions,
 * MtdQuarterlySummary, MtdAnnualSummary.
 *
 * IMPORTANT: aggregateQuarter() pulls from THREE sources — MtdTransactions
 * (manual records), Invoice (paid invoices as turnover), and Transactions
 * (budget expenses mapped to HMRC categories). Do not remove any source
 * without updating the QuarterAggregates sources breakdown field.
 *
 * Depends on: db/config.ts (db instance), db/schema.ts (all tables),
 *             utils/mtdDates.ts, utils/mtdTaxCalc.ts, utils/mtdCategories.ts,
 *             utils/generateUuid.ts
 */

import { eq, and, gte, lte, sql as sqlFn, isNull, or, ne } from 'drizzle-orm';
import { db } from './config';
import { MtdTransactions, MtdQuarterlySummary, MtdAnnualSummary, Invoice, Transactions } from './schema';
import { generateId } from '@/utils/generateUuid';
import { quartersForTaxYear, taxYearForDate, toISO } from '@/utils/mtdDates';
import { mapCategoryToHmrc } from '@/utils/mtdCategories';
import { estimateTax } from '@/utils/mtdTaxCalc';
import {
  NewMtdTransaction,
  ExpenseCategory,
  TaxRates,
  EXPENSE_CATEGORIES,
  QuarterAggregates,
} from '@/types/mtd';

// ─── Add manual MTD transaction ──────────────────────────────────────────────

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

function quarterForDateValue(date: Date): 1 | 2 | 3 | 4 {
  const m = date.getMonth(); // 0-indexed
  const d = date.getDate();
  // UK tax year: Q1 Apr 6 - Jul 5, Q2 Jul 6 - Oct 5, Q3 Oct 6 - Jan 5, Q4 Jan 6 - Apr 5
  // Parentheses required — && binds tighter than ||, but explicit grouping prevents
  // bugs if someone adds conditions without remembering precedence rules.
  if ((m === 3 && d >= 6) || m === 4 || (m === 5 && d <= 5)) return 1;
  if ((m === 6 && d >= 6) || m === 7 || (m === 8 && d <= 5)) return 2;
  if ((m === 9 && d >= 6) || m === 10 || m === 11) return 3;
  return 4; // Jan 6 - Apr 5
}

// ─── Get transactions ────────────────────────────────────────────────────────

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
 * Paid invoice amounts in the quarter whose turnover is not represented by any
 * MtdTransactions row linked via invoiceId (e.g. legacy paid invoices before sync).
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

// ─── Delete transaction ──────────────────────────────────────────────────────

export async function deleteMtdTransaction(id: string): Promise<void> {
  await db.delete(MtdTransactions).where(eq(MtdTransactions.id, id));
}

// ─── Aggregate quarter (THREE sources) ───────────────────────────────────────

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

export async function aggregateQuarter(
  taxYear: string,
  quarter: 1 | 2 | 3 | 4,
  userId: string
): Promise<QuarterAggregates> {
  const quarters = quartersForTaxYear(parseInt(taxYear));
  const q = quarters.find((q) => q.quarter === quarter);
  if (!q) return emptyAggregates();

  const agg = emptyAggregates();

  // Source 1: Manual MTD transactions (rows that are NOT already represented elsewhere)
  // Skip rows linked to a budget Transactions row — Source 3 counts those.
  // Skip income rows linked to an Invoice — Source 2 counts paid invoice turnover
  // (markInvoiceAsPaid creates Mtd + budget income + invoice paid; without this,
  // turnover would be triple-counted across manual + invoice + budget).
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
  // Invoice dates are ISO strings (2025-03-21T12:00:00.000Z).
  // Quarter boundaries use 'YYYY-MM-DD' format.
  // SQL LIKE 'pattern%' matches the date prefix efficiently.
  const paidInvoices = await db
    .select({ amountAfterTax: Invoice.amountAfterTax, invoiceDate: Invoice.invoiceDate })
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
  // Exclude rows mirrored from markInvoiceAsPaid (Mtd row ties transactionId to invoiceId);
  // those amounts are already in Source 2 (invoice turnover).
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

// ─── Refresh quarterly summary ───────────────────────────────────────────────

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

// ─── Get quarterly summaries ─────────────────────────────────────────────────

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

// ─── Refresh annual summary ──────────────────────────────────────────────────

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

// ─── Get annual summary ──────────────────────────────────────────────────────

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

// ─── Refresh current year ────────────────────────────────────────────────────

export async function refreshCurrentYear(userId: string, rates?: TaxRates): Promise<void> {
  const year = taxYearForDate(new Date());
  const tyLabel = `${year}-${String(year + 1).slice(-2)}`;
  await refreshAnnualSummary(tyLabel, userId, rates);
}
