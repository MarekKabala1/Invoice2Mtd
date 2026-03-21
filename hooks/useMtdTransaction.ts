/**
 * useMtdTransaction.ts
 *
 * MTD add/delete transaction hook. Follows useTransaction pattern.
 * Calls addMtdTransaction / deleteMtdTransaction then refreshCurrentYear.
 * When adding MTD records, also creates a budget Transaction so both
 * modules stay in sync.
 *
 * Depends on: db/mtdOperations.ts, db/config.ts, db/schema.ts
 * Used by: app/(stack)/addMtdTransaction.tsx
 */

import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { addMtdTransaction, deleteMtdTransaction, refreshCurrentYear } from '@/db/mtdOperations';
import { NewMtdTransaction } from '@/types/mtd';
import { db } from '@/db/config';
import { Transactions } from '@/db/schema';
import { generateId } from '@/utils/generateUuid';
import { mapCategoryToHmrc } from '@/utils/mtdCategories';

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

export const useMtdTransaction = (userId: string) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addTransaction = useCallback(async (tx: NewMtdTransaction, alsoAddToBudget: boolean = true) => {
    setIsLoading(true);
    setError(null);
    try {
      // Add MTD record
      await addMtdTransaction(tx, userId);

      // Also add to budget so both modules stay in sync
      if (alsoAddToBudget) {
        const budgetCategoryId = hmrcToBudgetCategory[tx.category] ?? 'other_expense';
        const budgetType = tx.type === 'income' ? 'INCOME' : 'EXPENSE';
        await db.insert(Transactions).values({
          id: await generateId(),
          amount: tx.amount,
          description: tx.description,
          date: tx.date,
          type: budgetType,
          categoryId: budgetCategoryId,
          userId: userId,
          currency: 'GBP',
        });
      }

      await refreshCurrentYear(userId);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to add MTD transaction';
      setError(msg);
      Alert.alert('Error', msg);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const deleteTransaction = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await deleteMtdTransaction(id);
      await refreshCurrentYear(userId);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to delete MTD transaction';
      setError(msg);
      Alert.alert('Error', msg);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  return {
    addTransaction,
    deleteTransaction,
    isLoading,
    error,
  };
};
