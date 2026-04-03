/**
 * db/supabase/operations/transactionOperations.ts
 *
 * Budget transaction sync operations for Supabase.
 * Handles CRUD operations for transactions table with offline-first sync support.
 *
 * Used by: db/supabase/sync/syncEngine.ts, hooks/useSync.ts
 *
 * References:
 * - Types: db/supabase/types.ts (SupabaseTransaction, SupabaseTransactionInsert)
 * - Supabase client: db/supabase/supabase.ts
 */

import { supabase } from '../supabase';
import type {
  SupabaseTransaction,
  SupabaseTransactionInsert,
} from '../types';

/**
 * Uploads a single transaction to Supabase.
 * Uses upsert to handle both inserts and updates based on localId.
 *
 * @param txn - The transaction data to upload
 * @returns The uploaded transaction with server-generated fields
 * @throws Error if the upload fails
 */
export async function uploadTransaction(
  txn: SupabaseTransactionInsert
): Promise<SupabaseTransaction> {
  const { data, error } = await supabase
    .from('transactions')
    .upsert(txn, { onConflict: 'localId' })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to upload transaction: ${error.message}`);
  }

  return data;
}

/**
 * Uploads multiple transactions to Supabase in a single batch operation.
 * Uses upsert to handle both inserts and updates based on localId.
 *
 * @param txns - Array of transaction data to upload
 * @returns Array of uploaded transactions with server-generated fields
 * @throws Error if the batch upload fails
 */
export async function uploadTransactions(
  txns: SupabaseTransactionInsert[]
): Promise<SupabaseTransaction[]> {
  if (txns.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from('transactions')
    .upsert(txns, { onConflict: 'localId' })
    .select();

  if (error) {
    throw new Error(`Failed to upload transactions: ${error.message}`);
  }

  return data ?? [];
}

/**
 * Retrieves all transactions for a specific user.
 *
 * @param userId - The Supabase user ID
 * @returns Array of transactions belonging to the user
 * @throws Error if the query fails
 */
export async function getTransactionsByUser(
  userId: string
): Promise<SupabaseTransaction[]> {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('userId', userId)
    .order('date', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch transactions: ${error.message}`);
  }

  return data ?? [];
}

/**
 * Retrieves transactions for a specific user filtered by tax year and quarter.
 * Combines date filtering with userId and optionally synStatus for sync operations.
 *
 * @param userId - The Supabase user ID
 * @param taxYear - The tax year string (e.g., "2025-26")
 * @param quarter - The quarter number (1-4)
 * @returns Array of transactions for the specified quarter
 * @throws Error if the query fails
 */
export async function getTransactionsByQuarter(
  userId: string,
  taxYear: string,
  quarter: number
): Promise<SupabaseTransaction[]> {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('userId', userId)
    .eq('taxYear', taxYear)
    .eq('quarter', quarter)
    .order('date', { ascending: false });

  if (error) {
    throw new Error(
      `Failed to fetch transactions for quarter: ${error.message}`
    );
  }

  return data ?? [];
}

/**
 * Deletes a transaction from Supabase by ID.
 *
 * @param id - The Supabase transaction ID
 * @throws Error if the deletion fails
 */
export async function deleteTransaction(id: string): Promise<void> {
  const { error } = await supabase.from('transactions').delete().eq('id', id);

  if (error) {
    throw new Error(`Failed to delete transaction: ${error.message}`);
  }
}
