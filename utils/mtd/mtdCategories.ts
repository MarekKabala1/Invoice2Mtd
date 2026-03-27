/**
 * mtdCategories.ts
 *
 * HMRC expense category labels, allowable/disallowable flags, and
 * deadline urgency style maps for NativeWind. Follows utils/categories.ts
 * pattern.
 *
 * Depends on: types/mtd.ts (ExpenseCategory, DeadlineStatus)
 * Used by: db/mtdOperations.ts (mapCategoryToHmrc), hooks/useMtdDeadlines.ts,
 *          app/(stack)/mtdDeadlines.tsx, app/(stack)/mtdQuarterlySummary.tsx
 */

import { ExpenseCategory, DeadlineStatus } from '@/types/mtd';

// ─── Human-readable labels ───────────────────────────────────────────────────

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  turnover: 'Turnover / Sales',
  costOfGoodsAllowable: 'Cost of goods & materials',
  employeeCosts: 'Employee costs',
  premisesRunningCosts: 'Premises & running costs',
  maintenanceCosts: 'Repairs & maintenance',
  advertisingCosts: 'Advertising & marketing',
  businessEntertainmentCosts: 'Business entertainment',
  interestOnBankLoans: 'Bank interest & finance',
  professionalFees: 'Professional fees',
  depreciation: 'Depreciation / capital allowances',
  otherAllowableExpenses: 'Other allowable expenses',
  otherDisallowableExpenses: 'Other disallowable',
};

// ─── Allowable check ─────────────────────────────────────────────────────────

export const isAllowable = (category: ExpenseCategory): boolean =>
  category !== 'businessEntertainmentCosts' && category !== 'otherDisallowableExpenses';

// ─── Income / Expense splits ─────────────────────────────────────────────────

export const INCOME_CATEGORIES: ExpenseCategory[] = ['turnover'];

export const EXPENSE_ONLY_CATEGORIES: ExpenseCategory[] = [
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
];

// ─── Budget category → HMRC mapping ─────────────────────────────────────────
//
// Maps the app's existing budget category IDs (from utils/categories.ts)
// to HMRC ExpenseCategory values. Any unrecognized category falls back to
// otherAllowableExpenses so no expense is ever lost from the MTD calculation.

const CATEGORY_TO_HMRC_MAP: Record<string, ExpenseCategory> = {
  rent: 'premisesRunningCosts',
  work_expenses: 'otherAllowableExpenses',
  groceries: 'costOfGoodsAllowable',
  transport: 'otherAllowableExpenses',
  utilities: 'premisesRunningCosts',
  entertainment: 'businessEntertainmentCosts',
  restaurant: 'businessEntertainmentCosts',
  shopping: 'costOfGoodsAllowable',
  health: 'otherAllowableExpenses',
  education: 'otherAllowableExpenses',
  coffee: 'otherAllowableExpenses',
  breakfast: 'otherAllowableExpenses',
  other_expense: 'otherAllowableExpenses',
};

/**
 * Maps a budget category ID to an HMRC ExpenseCategory.
 * Falls back to otherAllowableExpenses for any unrecognized category.
 */
export const mapCategoryToHmrc = (categoryId: string): ExpenseCategory => {
  return CATEGORY_TO_HMRC_MAP[categoryId] ?? 'otherAllowableExpenses';
};

// ─── Deadline urgency style maps ─────────────────────────────────────────────

export const STATUS_DEADLINE_COLOR: Record<DeadlineStatus, string> = {
  overdue: 'text-red-600 dark:text-red-400',
  urgent: 'text-orange-600 dark:text-orange-400',
  soon: 'text-yellow-600 dark:text-yellow-400',
  ok: 'text-green-600 dark:text-green-400',
};

export const STATUS_DEADLINE_DOT: Record<DeadlineStatus, string> = {
  overdue: 'bg-red-500',
  urgent: 'bg-orange-500',
  soon: 'bg-yellow-500',
  ok: 'bg-green-500',
};

export const STATUS_DEADLINE_BADGE_BG: Record<DeadlineStatus, string> = {
  overdue: 'bg-red-100 dark:bg-red-900/30',
  urgent: 'bg-orange-100 dark:bg-orange-900/30',
  soon: 'bg-yellow-100 dark:bg-yellow-900/30',
  ok: 'bg-green-100 dark:bg-green-900/30',
};

export const STATUS_DEADLINE_BORDER: Record<DeadlineStatus, string> = {
  overdue: 'border-red-500 border-2',
  urgent: 'border-orange-500 border-2',
  soon: 'border-yellow-300 border',
  ok: 'border-green-200 border',
};

export const STATUS_DEADLINE_LABEL: Record<DeadlineStatus, string> = {
  overdue: 'Overdue',
  urgent: 'Due soon',
  soon: 'Upcoming',
  ok: 'OK',
};
