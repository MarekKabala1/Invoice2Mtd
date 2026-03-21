export const categories = {
  INCOME: [
    { id: 'salary', name: 'Salary', emoji: '💰' },
    { id: 'freelance', name: 'Freelance', emoji: '💻' },
    { id: 'investments', name: 'Investments', emoji: '📈' },
    { id: 'other_income', name: 'Other', emoji: '🤑' },
  ],
  EXPENSE: [
    { id: 'rent', name: 'Rent', emoji: '🏠' },
    { id: 'work_expenses', name: 'Work Expenses', emoji: '💳' },
    { id: 'groceries', name: 'Groceries', emoji: '🛒' },
    { id: 'transport', name: 'Transport', emoji: '🚗' },
    { id: 'utilities', name: 'Utilities', emoji: '💡' },
    { id: 'entertainment', name: 'Entertainment', emoji: '🎬' },
    { id: 'restaurant', name: 'Restaurant', emoji: '🍽️' },
    { id: 'shopping', name: 'Shopping', emoji: '🛍️' },
    { id: 'health', name: 'Health', emoji: '⚕️' },
    { id: 'education', name: 'Education', emoji: '📚' },
    { id: 'coffee', name: 'Coffee', emoji: '☕' },
    { id: 'breakfast', name: 'Breakfast', emoji: '🍳' },
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