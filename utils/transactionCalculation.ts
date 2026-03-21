import { TransactionType } from "@/db/zodSchema";


export const calculateTotals = (transactions: TransactionType[]) => {
  const filterIncomeTransactions = transactions
    .filter((transaction) => transaction.type === 'INCOME')
    .reduce((acc, curr) => acc + (curr.amount ?? 0), 0);

  const filterExpenseTransactions = transactions
    .filter((transaction) => transaction.type === 'EXPENSE')
    .reduce((acc, curr) => acc + (curr.amount ?? 0), 0);

  return {
    income: filterIncomeTransactions,
    expense: filterExpenseTransactions,
    balance: filterIncomeTransactions - filterExpenseTransactions,
  };
};
