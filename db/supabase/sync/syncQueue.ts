/**
 * syncQueue.ts
 *
 * Sync queue operations using AsyncStorage for persistence.
 * Tracks pending changes that need to sync to Supabase.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import uuid from 'react-native-uuid';
import { supabase } from '../supabase';
import type { SyncQueueItem, SyncAction } from './sync.types';

const SYNC_QUEUE_KEY = '@supabase_sync_queue';
const MAX_RETRY_COUNT = 3;

const tableMapping: Record<string, string> = {
  users: 'users',
  customers: 'customers',
  invoices: 'invoices',
  invoice_items: 'invoice_items',
  estimates: 'estimates',
  transactions: 'transactions',
  mtd_transactions: 'mtd_transactions',
  mtd_quarterly_summaries: 'mtd_quarterly_summaries',
  mtd_annual_summaries: 'mtd_annual_summaries',
  documents: 'documents',
};

const checkExistsInSupabase = async (
  table: string, 
  localId: string, 
  extraFields?: { 
    email?: string; 
    auth_user_id?: string;
    user_id?: string;
    tax_year?: string;
    quarter?: number;
  }
): Promise<boolean> => {
  const supabaseTable = tableMapping[table];
  if (!supabaseTable) return false;
  
  try {
    // First try by local_id
    const { data: byLocalId } = await supabase
      .from(supabaseTable)
      .select('local_id')
      .eq('local_id', localId)
      .maybeSingle();
    
    if (byLocalId) {
      return true;
    }
    
    // For users, try by email or auth_user_id
    if (table === 'users') {
      if (extraFields?.email) {
        const { data: byEmail } = await supabase
          .from(supabaseTable)
          .select('local_id')
          .eq('email', extraFields.email)
          .maybeSingle();
        
        if (byEmail) {
          return true;
        }
      }
      
      if (extraFields?.auth_user_id) {
        const { data: byAuth } = await supabase
          .from(supabaseTable)
          .select('local_id')
          .eq('auth_user_id', extraFields.auth_user_id)
          .maybeSingle();
        
        if (byAuth) {
          return true;
        }
      }
    }
    
    // For MTD quarterly summaries, try by user_id + tax_year + quarter
    if (table === 'mtd_quarterly_summaries' && extraFields?.user_id && extraFields?.tax_year && extraFields?.quarter !== undefined) {
      const { data: byKey } = await supabase
        .from(supabaseTable)
        .select('local_id')
        .eq('user_id', extraFields.user_id)
        .eq('tax_year', extraFields.tax_year)
        .eq('quarter', extraFields.quarter)
        .maybeSingle();
      
      if (byKey) {
        return true;
      }
    }
    
    // For MTD annual summaries, try by user_id + tax_year
    if (table === 'mtd_annual_summaries' && extraFields?.user_id && extraFields?.tax_year) {
      const { data: byKey } = await supabase
        .from(supabaseTable)
        .select('local_id')
        .eq('user_id', extraFields.user_id)
        .eq('tax_year', extraFields.tax_year)
        .maybeSingle();
      
      if (byKey) {
        return true;
      }
    }
    
    return false;
  } catch {
    return false;
  }
};

export const addToQueue = async (
  item: Omit<SyncQueueItem, 'id' | 'timestamp' | 'retryCount'>,
  extraFields?: { 
    email?: string; 
    auth_user_id?: string;
    user_id?: string;
    tax_year?: string;
    quarter?: number;
  }
): Promise<boolean> => {
  const queue = await getQueue();
  
  // Check if already in queue
  const existingIndex = queue.findIndex(
    (q) => q.table === item.table && q.localId === item.localId
  );
  
  if (existingIndex >= 0) {
    // Update existing item
    queue[existingIndex] = {
      ...queue[existingIndex],
      action: item.action,
      timestamp: Date.now(),
    };
    await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
    return false;
  }
  
  // Check if already synced in Supabase
  const existsInSupabase = await checkExistsInSupabase(item.table, item.localId, extraFields);
  if (existsInSupabase) {
    return false;
  }
  
  // Add new item
  queue.push({
    ...item,
    id: uuid.v4() as string,
    timestamp: Date.now(),
    retryCount: 0,
  });
  await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
  return true;
};

export const getQueue = async (): Promise<SyncQueueItem[]> => {
  const data = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
  if (!data) return [];
  
  try {
    return JSON.parse(data) as SyncQueueItem[];
  } catch {
    return [];
  }
};

export const removeFromQueue = async (id: string): Promise<void> => {
  const queue = await getQueue();
  const filtered = queue.filter((item) => item.id !== id);
  await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(filtered));
};

export const clearQueue = async (): Promise<void> => {
  await AsyncStorage.removeItem(SYNC_QUEUE_KEY);
};

export const markAsSynced = async (localId: string): Promise<void> => {
  const queue = await getQueue();
  const filtered = queue.filter((item) => item.localId !== localId);
  await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(filtered));
};

export const markAsFailed = async (
  localId: string,
  _error: string
): Promise<void> => {
  const queue = await getQueue();
  const updated = queue.map((item) =>
    item.localId === localId
      ? { ...item, retryCount: item.retryCount + 1 }
      : item
  );
  await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(updated));
};

export const incrementRetry = async (localId: string): Promise<void> => {
  const queue = await getQueue();
  const updated = queue.map((item) =>
    item.localId === localId ? { ...item, retryCount: item.retryCount + 1 } : item
  );
  await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(updated));
};

export const getPendingCount = async (): Promise<number> => {
  const queue = await getQueue();
  return queue.filter((item) => item.retryCount < MAX_RETRY_COUNT).length;
};

export const getFailedItems = async (): Promise<SyncQueueItem[]> => {
  const queue = await getQueue();
  return queue.filter((item) => item.retryCount >= MAX_RETRY_COUNT);
};

export const canRetry = (item: SyncQueueItem): boolean => {
  return item.retryCount < MAX_RETRY_COUNT;
};
