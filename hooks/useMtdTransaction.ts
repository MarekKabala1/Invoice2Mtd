/**
 * useMtdTransaction.ts
 *
 * MTD add/delete transaction hook. Uses getCurrentUserId to get the
 * user from the database instead of settings. When adding MTD records,
 * also creates a budget Transaction and links back via transactionId
 * so deletion keeps both modules in sync.
 *
 * Depends on: db/mtdOperations.ts, db/config.ts, db/schema.ts,
 *             utils/getCurrentUser.ts
 * Used by: app/(stack)/addMtdTransaction.tsx
 */

import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { addMtdTransaction, deleteMtdTransaction, refreshCurrentYear } from '@/db/mtdOperations';
import { NewMtdTransaction } from '@/types/mtd';
import { db } from '@/db/config';
import { Transactions } from '@/db/schema';
import { generateId } from '@/utils/generateUuid';
import { getCurrentUserId } from '@/utils/getCurrentUser';
import { eq } from 'drizzle-orm';

// Maps HMRC categories back to budget category IDs
const hmrcToBudgetCategory: Record<string, string> = {
  turnover: 'turnover',
  costOfGoodsAllowable: 'cost_of_goods',
  employeeCosts: 'employee_costs',
  premisesRunningCosts: 'premises',
  maintenanceCosts: 'maintenance',
  advertisingCosts: 'advertising',
  interestOnBankLoans: 'bank_interest',
  professionalFees: 'professional_fees',
  depreciation: 'depreciation',
  otherAllowableExpenses: 'other_allowable',
  businessEntertainmentCosts: 'entertainment',
  otherDisallowableExpenses: 'other_disallowable',
};

export const useMtdTransaction = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addTransaction = useCallback(async (tx: NewMtdTransaction, alsoAddToBudget: boolean = true) => {
    setIsLoading(true);
    setError(null);
    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        throw new Error('No user found. Please set up your profile first.');
      }

      let budgetTransactionId: string | null = null;

      // Add to budget first if requested, so we can link the IDs
      if (alsoAddToBudget) {
        const budgetCategoryId = hmrcToBudgetCategory[tx.category] ?? 'other_expense';
        const budgetType = tx.type === 'income' ? 'INCOME' : 'EXPENSE';
        budgetTransactionId = await generateId();
        await db.insert(Transactions).values({
          id: budgetTransactionId,
          amount: tx.amount,
          description: tx.description,
          date: tx.date,
          type: budgetType,
          categoryId: budgetCategoryId,
          userId: userId,
          currency: 'GBP',
        });
      }

      // Add MTD record with transactionId link
      await addMtdTransaction(
        { ...tx, transactionId: budgetTransactionId ?? undefined },
        userId
      );

      await refreshCurrentYear(userId);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to add MTD transaction';
      setError(msg);
      Alert.alert('Error', msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteTransaction = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const userId = await getCurrentUserId();
      if (!userId) return;
      await deleteMtdTransaction(id);
      await refreshCurrentYear(userId);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to delete MTD transaction';
      setError(msg);
      Alert.alert('Error', msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    addTransaction,
    deleteTransaction,
    isLoading,
    error,
  };
};
