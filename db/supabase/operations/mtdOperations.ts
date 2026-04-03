/**
 * db/supabase/operations/mtdOperations.ts
 *
 * MTD (Making Tax Digital) data sync operations for Supabase.
 * Handles CRUD operations for MTD transactions, quarterly summaries, and annual summaries.
 *
 * Used by: db/supabase/sync/syncEngine.ts, hooks/useMtdSync.ts
 *
 * References:
 * - Types: db/supabase/types.ts (SupabaseMtdTransaction, SupabaseMtdQuarterlySummary, etc.)
 * - Supabase client: db/supabase/supabase.ts
 */

import { supabase } from '../supabase';
import type {
  SupabaseMtdTransaction,
  SupabaseMtdTransactionInsert,
  SupabaseMtdQuarterlySummary,
  SupabaseMtdQuarterlySummaryInsert,
  SupabaseMtdAnnualSummary,
  SupabaseMtdAnnualSummaryInsert,
} from '../types';

/**
 * Uploads a single MTD transaction to Supabase.
 * Uses upsert to handle both inserts and updates based on localId.
 *
 * @param mtd - The MTD transaction data to upload
 * @returns The uploaded MTD transaction with server-generated fields
 * @throws Error if the upload fails
 */
export async function uploadMtdTransaction(
  mtd: SupabaseMtdTransactionInsert
): Promise<SupabaseMtdTransaction> {
  const { data, error } = await supabase
    .from('mtd_transactions')
    .upsert(mtd, { onConflict: 'localId' })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to upload MTD transaction: ${error.message}`);
  }

  return data;
}

/**
 * Uploads multiple MTD transactions to Supabase in a single batch operation.
 * Uses upsert to handle both inserts and updates based on localId.
 *
 * @param mtds - Array of MTD transaction data to upload
 * @returns Array of uploaded MTD transactions with server-generated fields
 * @throws Error if the batch upload fails
 */
export async function uploadMtdTransactions(
  mtds: SupabaseMtdTransactionInsert[]
): Promise<SupabaseMtdTransaction[]> {
  if (mtds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from('mtd_transactions')
    .upsert(mtds, { onConflict: 'localId' })
    .select();

  if (error) {
    throw new Error(`Failed to upload MTD transactions: ${error.message}`);
  }

  return data ?? [];
}

/**
 * Retrieves MTD transactions for a specific user filtered by tax year and quarter.
 *
 * @param userId - The Supabase user ID
 * @param taxYear - The tax year string (e.g., "2025-26")
 * @param quarter - The quarter number (1-4)
 * @returns Array of MTD transactions for the specified quarter
 * @throws Error if the query fails
 */
export async function getMtdTransactionsByQuarter(
  userId: string,
  taxYear: string,
  quarter: number
): Promise<SupabaseMtdTransaction[]> {
  const { data, error } = await supabase
    .from('mtd_transactions')
    .select('*')
    .eq('userId', userId)
    .eq('taxYear', taxYear)
    .eq('quarter', quarter)
    .order('date', { ascending: false });

  if (error) {
    throw new Error(
      `Failed to fetch MTD transactions for quarter: ${error.message}`
    );
  }

  return data ?? [];
}

/**
 * Retrieves all MTD transactions for a specific user across all periods.
 *
 * @param userId - The Supabase user ID
 * @returns Array of all MTD transactions for the user
 * @throws Error if the query fails
 */
export async function getAllMtdTransactions(
  userId: string
): Promise<SupabaseMtdTransaction[]> {
  const { data, error } = await supabase
    .from('mtd_transactions')
    .select('*')
    .eq('userId', userId)
    .order('date', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch all MTD transactions: ${error.message}`);
  }

  return data ?? [];
}

/**
 * Uploads or updates a quarterly summary to Supabase.
 * Uses upsert with userId, taxYear, and quarter as conflict resolution.
 *
 * @param summary - The quarterly summary data to upload
 * @returns The uploaded quarterly summary with server-generated fields
 * @throws Error if the upload fails
 */
export async function uploadQuarterlySummary(
  summary: SupabaseMtdQuarterlySummaryInsert
): Promise<SupabaseMtdQuarterlySummary> {
  const { data, error } = await supabase
    .from('mtd_quarterly_summaries')
    .upsert(summary, { onConflict: 'userId,taxYear,quarter' })
    .select()
    .single();

  if (error) {
    throw new Error(
      `Failed to upload quarterly summary: ${error.message}`
    );
  }

  return data;
}

/**
 * Retrieves a quarterly summary for a specific user, tax year, and quarter.
 *
 * @param userId - The Supabase user ID
 * @param taxYear - The tax year string (e.g., "2025-26")
 * @param quarter - The quarter number (1-4)
 * @returns The quarterly summary or null if not found
 * @throws Error if the query fails
 */
export async function getQuarterlySummary(
  userId: string,
  taxYear: string,
  quarter: number
): Promise<SupabaseMtdQuarterlySummary | null> {
  const { data, error } = await supabase
    .from('mtd_quarterly_summaries')
    .select('*')
    .eq('userId', userId)
    .eq('taxYear', taxYear)
    .eq('quarter', quarter)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(
      `Failed to fetch quarterly summary: ${error.message}`
    );
  }

  return data;
}

/**
 * Uploads or updates an annual summary to Supabase.
 * Uses upsert with userId and taxYear as conflict resolution.
 *
 * @param summary - The annual summary data to upload
 * @returns The uploaded annual summary with server-generated fields
 * @throws Error if the upload fails
 */
export async function uploadAnnualSummary(
  summary: SupabaseMtdAnnualSummaryInsert
): Promise<SupabaseMtdAnnualSummary> {
  const { data, error } = await supabase
    .from('mtd_annual_summaries')
    .upsert(summary, { onConflict: 'userId,taxYear' })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to upload annual summary: ${error.message}`);
  }

  return data;
}

/**
 * Retrieves an annual summary for a specific user and tax year.
 *
 * @param userId - The Supabase user ID
 * @param taxYear - The tax year string (e.g., "2025-26")
 * @returns The annual summary or null if not found
 * @throws Error if the query fails
 */
export async function getAnnualSummary(
  userId: string,
  taxYear: string
): Promise<SupabaseMtdAnnualSummary | null> {
  const { data, error } = await supabase
    .from('mtd_annual_summaries')
    .select('*')
    .eq('userId', userId)
    .eq('taxYear', taxYear)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to fetch annual summary: ${error.message}`);
  }

  return data;
}
