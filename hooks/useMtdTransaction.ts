/**
 * useMtdTransaction.ts
 *
 * MTD add/delete transaction hook. Follows useTransaction pattern.
 * Calls addMtdTransaction / deleteMtdTransaction then refreshCurrentYear.
 *
 * Depends on: db/mtdOperations.ts
 * Used by: app/(stack)/addMtdTransaction.tsx
 */

import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { addMtdTransaction, deleteMtdTransaction, refreshCurrentYear } from '@/db/mtdOperations';
import { NewMtdTransaction } from '@/types/mtd';

export const useMtdTransaction = (userId: string) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addTransaction = useCallback(async (tx: NewMtdTransaction) => {
    setIsLoading(true);
    setError(null);
    try {
      await addMtdTransaction(tx, userId);
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
