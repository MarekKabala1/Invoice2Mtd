/**
 * types/mtd.ts
 *
 * All MTD (Making Tax Digital) TypeScript types. Kept separate from
 * types/index.ts to avoid polluting existing invoice types.
 *
 * Depends on: (none — pure type definitions)
 * Used by: db/mtdOperations.ts, hooks/useMtd*.ts, utils/mtd*.ts,
 *          app/(drawer)/(tabs)/tax.tsx, app/(stack)/mtd*.tsx
 */

// ─── HMRC Expense Categories ─────────────────────────────────────────────────

export type ExpenseCategory =
  | 'turnover'
  | 'costOfGoodsAllowable'
  | 'employeeCosts'
  | 'premisesRunningCosts'
  | 'maintenanceCosts'
  | 'advertisingCosts'
  | 'businessEntertainmentCosts'
  | 'interestOnBankLoans'
  | 'professionalFees'
  | 'depreciation'
  | 'otherAllowableExpenses'
  | 'otherDisallowableExpenses';

export const EXPENSE_CATEGORIES = [
  'turnover',
  'costOfGoodsAllowable',
  'employeeCosts',
  'premisesRunningCosts',
  'maintenanceCosts',
  'advertisingCosts',
  'businessEntertainmentCosts',
  'interestOnBankLoans',
  'professionalFees',
  'depreciation',
  'otherAllowableExpenses',
  'otherDisallowableExpenses',
] as const;

export const ALLOWABLE_CATEGORIES: ExpenseCategory[] = [
  'costOfGoodsAllowable',
  'employeeCosts',
  'premisesRunningCosts',
  'maintenanceCosts',
  'advertisingCosts',
  'interestOnBankLoans',
  'professionalFees',
  'depreciation',
  'otherAllowableExpenses',
];

// ─── Tax Quarter & Year ──────────────────────────────────────────────────────

export type TaxQuarter = {
  quarter: 1 | 2 | 3 | 4;
  taxYear: string;
  periodStart: string;
  periodEnd: string;
  submissionDeadline: string;
  label: string;
};

export type TaxYear = {
  label: string;
  start: string;
  end: string;
  finalDeclarationDeadline: string;
  quarters: TaxQuarter[];
};

// ─── Deadlines ───────────────────────────────────────────────────────────────

export type DeadlineStatus = 'overdue' | 'urgent' | 'soon' | 'ok';

export type DeadlineItem = {
  type: 'quarterly' | 'final_declaration';
  label: string;
  deadline: string;
  deadlineFormatted: string;
  daysUntil: number;
  status: DeadlineStatus;
  taxYear: string;
  quarter?: 1 | 2 | 3 | 4;
};

// ─── Tax Rates & Estimates ───────────────────────────────────────────────────

export type TaxRates = {
  personalAllowance: number;
  basicRateThreshold: number;
  higherRateThreshold: number;
  basicRate: number;
  higherRate: number;
  additionalRate: number;
  ni4LowerProfitsLimit: number;
  ni4UpperProfitsLimit: number;
  ni4LowerRate: number;
  ni4UpperRate: number;
  ni2WeeklyRate: number;
  ni2SmallEarningsException: number;
};

export type TaxEstimate = {
  grossIncome: number;
  totalAllowableExpenses: number;
  taxableProfit: number;
  personalAllowanceUsed: number;
  taxableAfterAllowance: number;
  basicRateTax: number;
  higherRateTax: number;
  additionalRateTax: number;
  totalIncomeTax: number;
  ni4LowerBand: number;
  ni4UpperBand: number;
  totalClass4NI: number;
  class2NI: number;
  totalNI: number;
  totalTaxAndNI: number;
  effectiveRate: number;
  quarterlySetAside: number;
};

// ─── Quarter Aggregates ──────────────────────────────────────────────────────

export type QuarterAggregates = {
  totalTurnover: number;
  costOfGoodsAllowable: number;
  employeeCosts: number;
  premisesRunningCosts: number;
  maintenanceCosts: number;
  advertisingCosts: number;
  businessEntertainmentCosts: number;
  interestOnBankLoans: number;
  professionalFees: number;
  depreciation: number;
  otherAllowableExpenses: number;
  otherDisallowableExpenses: number;
  totalAllowableExpenses: number;
  netProfit: number;
  sources: {
    invoiceTurnover: number;
    budgetExpenses: Record<ExpenseCategory, number>;
    manualTurnover: number;
    manualExpenses: Record<ExpenseCategory, number>;
  };
};

// ─── MTD Transaction ─────────────────────────────────────────────────────────

export type NewMtdTransaction = {
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: ExpenseCategory;
  receiptRef?: string;
  notes?: string;
};

export type MtdTransactionStatus = 'not_started' | 'in_progress' | 'ready' | 'submitted';
export type MtdAnnualStatus = 'in_progress' | 'ready' | 'filed';

// ─── Home Insights ───────────────────────────────────────────────────────────

export type ActivityItem = {
  id: string;
  type: 'invoice' | 'estimate' | 'mtd_transaction' | 'budget_transaction';
  description: string;
  amount: number;
  currency: string;
  date: string;
  module: 'invoice' | 'mtd' | 'budget';
};
