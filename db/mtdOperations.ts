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

import { eq, and, gte, lte, sql as sqlFn } from 'drizzle-orm';
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
  tx: NewMtdTransaction & { invoiceId?: string },
  userId: string
): Promise<void> {
  const date = new Date(tx.date);
  const ty = taxYearForDate(date);
  const tyLabel = `${ty}-${String(ty + 1).slice(-2)}`;
  const quarter = quarterForDateValue(date);

  await db.insert(MtdTransactions).values({
    id: await generateId(),
    userId,
    invoiceId: tx.invoiceId ?? null,
    date: tx.date,
    description: tx.description,
    amount: tx.amount,
    type: tx.type,
    category: tx.category,
    taxYear: tyLabel,
    quarter,
    receiptRef: tx.receiptRef,
    notes: tx.notes,
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

  // Source 1: Manual MTD transactions
  // userId filter removed — sole trader app has one user per device,
  // so filtering by userId is unnecessary and causes mismatches when
  // the userId from settings doesn't match the one used at creation.
  const manualTxns = await db
    .select()
    .from(MtdTransactions)
    .where(
      and(
        eq(MtdTransactions.taxYear, taxYear),
        eq(MtdTransactions.quarter, quarter)
      )
    );

  for (const tx of manualTxns) {
    const cat = tx.category as ExpenseCategory;
    if (tx.type === 'income') {
      agg.sources.manualTurnover += tx.amount;
      agg.totalTurnover += tx.amount;
    } else {
      agg.sources.manualExpenses[cat] = (agg.sources.manualExpenses[cat] || 0) + tx.amount;
      (agg as any)[cat] = ((agg as any)[cat] || 0) + tx.amount;
    }
  }

  // Source 2: Paid invoices → turnover
  // Invoice dates are stored as ISO strings (e.g. 2025-03-21T12:00:00.000Z).
  // Quarter periodStart/periodEnd use 'YYYY-MM-DD' format.
  // We compare only the date portion (first 10 chars) so the formats don't
  // cause incorrect lexicographic ordering.
  const allPaidInvoices = await db
    .select()
    .from(Invoice)
    .where(eq(Invoice.isPayed, true));

  for (const inv of allPaidInvoices) {
    const invoiceDate = (inv.invoiceDate ?? '').slice(0, 10);
    if (invoiceDate >= q.periodStart && invoiceDate <= q.periodEnd) {
      const amount = inv.amountAfterTax || 0;
      agg.sources.invoiceTurnover += amount;
      agg.totalTurnover += amount;
    }
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
    (agg as any)[hmrcCat] = ((agg as any)[hmrcCat] || 0) + amt;
  }

  // Source 3b: Budget income transactions → turnover
  // When the user adds income via the Budget tab, it should also
  // appear as MTD turnover so the tax estimate stays accurate.
  const budgetIncome = await db
    .select({ amount: Transactions.amount })
    .from(Transactions)
    .where(
      and(
        eq(Transactions.type, 'INCOME'),
        gte(Transactions.date, q.periodStart),
        lte(Transactions.date, q.periodEnd)
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
