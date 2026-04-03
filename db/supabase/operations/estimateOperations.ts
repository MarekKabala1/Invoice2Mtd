/**
 * db/supabase/operations/estimateOperations.ts
 *
 * Supabase operations for estimate sync. Handles CRUD operations for
 * estimates including upload, retrieval, and deletion.
 *
 * Used by: db/supabase/sync/estimateSync.ts
 *
 * Supabase table: estimates
 */

import { supabase } from '../supabase';
import type { SupabaseEstimate, SupabaseEstimateInsert } from '../types';

/**
 * Uploads a single estimate to Supabase.
 */
export async function uploadEstimate(
  estimate: SupabaseEstimateInsert
): Promise<SupabaseEstimate> {
  const { data, error } = await supabase
    .from('estimates')
    .upsert(estimate, { onConflict: 'localId' })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to upload estimate: ${error.message}`);
  }

  if (!data) {
    throw new Error('Estimate upsert returned no data');
  }

  return data as SupabaseEstimate;
}

/**
 * Uploads multiple estimates to Supabase in a batch.
 */
export async function uploadEstimates(
  estimates: SupabaseEstimateInsert[]
): Promise<SupabaseEstimate[]> {
  if (estimates.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from('estimates')
    .upsert(estimates, { onConflict: 'localId' })
    .select();

  if (error) {
    throw new Error(`Failed to upload estimates: ${error.message}`);
  }

  if (!data || data.length === 0) {
    return [];
  }

  return data as SupabaseEstimate[];
}

/**
 * Retrieves all estimates for a specific user from Supabase.
 */
export async function getEstimatesByUser(
  userId: string
): Promise<SupabaseEstimate[]> {
  const { data, error } = await supabase
    .from('estimates')
    .select('*')
    .eq('userId', userId)
    .order('estimateDate', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch estimates: ${error.message}`);
  }

  return (data ?? []) as SupabaseEstimate[];
}

/**
 * Deletes an estimate from Supabase by its UUID.
 */
export async function deleteEstimate(id: string): Promise<void> {
  const { error } = await supabase.from('estimates').delete().eq('id', id);

  if (error) {
    throw new Error(`Failed to delete estimate: ${error.message}`);
  }
}

/**
 * Retrieves a single estimate by local ID.
 */
export async function getEstimateByLocalId(
  localId: string
): Promise<SupabaseEstimate | null> {
  const { data, error } = await supabase
    .from('estimates')
    .select('*')
    .eq('localId', localId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to fetch estimate: ${error.message}`);
  }

  return data as SupabaseEstimate;
}
