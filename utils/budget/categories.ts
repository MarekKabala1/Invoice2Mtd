/**
 * categories.ts
 *
 * Budget categories for income and expense tracking.
 * HMRC-compatible categories are included so budget transactions
 * can be mapped to HMRC expense categories via mapCategoryToHmrc().
 *
 * Depends on: none
 * Used by: components/TransactionForm.tsx, hooks/useAddInvoiceToBudget.ts,
 *          db/mtdOperations.ts (via mapCategoryToHmrc)
 */

export const categories = {
  INCOME: [
    { id: 'turnover', name: 'Turnover / Sales', emoji: '📊' },
    { id: 'other_business_income', name: 'Other Business Income', emoji: '💼' },
    { id: 'uk_property_non_fhl_income', name: 'UK Property (non-FHL)', emoji: '🏠' },
    { id: 'foreign_property_fhl_eea_income', name: 'Foreign Property FHL (EEA)', emoji: '🌍' },
    { id: 'foreign_property_fhl_non_eea_income', name: 'Foreign Property FHL (non-EEA)', emoji: '🌏' },
    { id: 'salary', name: 'Salary', emoji: '💰' },
    { id: 'freelance', name: 'Freelance', emoji: '💻' },
    { id: 'investments', name: 'Investments', emoji: '📈' },
    { id: 'other_income', name: 'Other Income', emoji: '🤑' },
  ],
  EXPENSE: [
    // HMRC-compatible categories (map directly to HMRC ExpenseCategory)
    { id: 'cost_of_goods', name: 'Cost of Goods', emoji: '📦' },
    { id: 'employee_costs', name: 'Employee Costs', emoji: '👥' },
    { id: 'premises', name: 'Premises & Running', emoji: '🏢' },
    { id: 'maintenance', name: 'Repairs & Maintenance', emoji: '🔧' },
    { id: 'advertising', name: 'Advertising & Marketing', emoji: '📢' },
    { id: 'bank_interest', name: 'Bank Interest & Finance', emoji: '🏦' },
    { id: 'professional_fees', name: 'Professional Fees', emoji: '⚖️' },
    { id: 'depreciation', name: 'Depreciation', emoji: '📉' },
    { id: 'other_allowable', name: 'Other Allowable', emoji: '✅' },
    { id: 'entertainment', name: 'Business Entertainment', emoji: '🎬' },
    { id: 'other_disallowable', name: 'Other Disallowable', emoji: '❌' },
    // Personal categories (kept for general tracking)
    { id: 'rent', name: 'Rent', emoji: '🏠' },
    { id: 'work_expenses', name: 'Work Expenses', emoji: '💳' },
    { id: 'groceries', name: 'Groceries', emoji: '🛒' },
    { id: 'transport', name: 'Transport', emoji: '🚗' },
    { id: 'utilities', name: 'Utilities', emoji: '💡' },
    { id: 'restaurant', name: 'Restaurant', emoji: '🍽️' },
    { id: 'shopping', name: 'Shopping', emoji: '🛍️' },
    { id: 'health', name: 'Health', emoji: '⚕️' },
    { id: 'education', name: 'Education', emoji: '📚' },
    { id: 'coffee', name: 'Coffee', emoji: '☕' },
    { id: 'other_expense', name: 'Other', emoji: '📝' },
  ]
};

export const getCategoryById = (id: string) => {
  const allCategories = [...categories.INCOME, ...categories.EXPENSE];
  return allCategories.find(cat => cat.id === id);
};

export const getCategoryEmoji = (id: string) => {
  const category = getCategoryById(id);
  return category?.emoji || '📝';
};
