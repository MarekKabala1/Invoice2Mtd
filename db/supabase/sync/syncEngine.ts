/**
 * syncEngine.ts
 *
 * Main sync orchestrator for Supabase data sync.
 * Coordinates sync queue processing and table-by-table sync.
 */

import { supabase } from '../supabase';
import type {
  SyncResult,
  SyncOptions,
  SyncProgress,
  SyncError,
  SyncableTable,
} from './sync.types';
import { TABLE_SYNC_ORDER } from './sync.types';
import {
  getQueue,
  markAsSynced,
  markAsFailed,
  getPendingCount,
} from './syncQueue';

export const checkConnection = async (): Promise<boolean> => {
  try {
    const { error } = await supabase.from('users').select('id').limit(1);
    return !error;
  } catch {
    return false;
  }
};

export const getLastSyncTime = async (userId: string): Promise<string | null> => {
  const { data } = await supabase
    .from('sync_metadata')
    .select('last_sync')
    .eq('user_id', userId)
    .single();
  
  return data?.last_sync ?? null;
};

export const setLastSyncTime = async (userId: string): Promise<void> => {
  const now = new Date().toISOString();
  
  await supabase.from('sync_metadata').upsert({
    user_id: userId,
    last_sync: now,
    updated_at: now,
  });
};

const createSyncResult = (
  success: number,
  failed: number,
  skipped: number,
  errors: SyncError[],
  startTime: number
): SyncResult => ({
  success,
  failed,
  skipped,
  errors,
  duration: Date.now() - startTime,
  timestamp: new Date().toISOString(),
});

export const runSync = async (
  userId: string,
  options?: SyncOptions
): Promise<SyncResult> => {
  const startTime = Date.now();
  const errors: SyncError[] = [];
  let success = 0;
  let failed = 0;
  let skipped = 0;
  
  const isConnected = await checkConnection();
  if (!isConnected) {
    return createSyncResult(0, 0, 0, [{
      table: 'connection',
      localId: '',
      action: 'insert',
      error: 'No connection to Supabase',
      timestamp: Date.now(),
    }], startTime);
  }
  
  const tablesToSync = options?.tables ?? TABLE_SYNC_ORDER;
  const total = tablesToSync.length;
  
  for (let i = 0; i < tablesToSync.length; i++) {
    const table = tablesToSync[i];
    
    options?.onProgress?.({
      current: i + 1,
      total,
      currentTable: table,
    });
    
    try {
      const result = await syncTable(userId, table as SyncableTable);
      success += result.success;
      failed += result.failed;
      skipped += result.skipped;
      errors.push(...result.errors);
    } catch (err) {
      failed++;
      errors.push({
        table,
        localId: '',
        action: 'insert',
        error: err instanceof Error ? err.message : 'Unknown error',
        timestamp: Date.now(),
      });
    }
  }
  
  await setLastSyncTime(userId);
  
  return createSyncResult(success, failed, skipped, errors, startTime);
};

export const syncTable = async (
  userId: string,
  tableName: SyncableTable
): Promise<SyncResult> => {
  const startTime = Date.now();
  const errors: SyncError[] = [];
  let success = 0;
  let failed = 0;
  let skipped = 0;
  
  const queue = await getQueue();
  const tableQueue = queue.filter((item) => item.table === tableName);
  
  if (tableQueue.length === 0) {
    skipped++;
    return createSyncResult(success, failed, skipped, errors, startTime);
  }
  
  for (const item of tableQueue) {
    try {
      await processQueueItem(userId, tableName, item.localId, item.action);
      await markAsSynced(item.localId);
      success++;
    } catch (err) {
      await markAsFailed(
        item.localId,
        err instanceof Error ? err.message : 'Unknown error'
      );
      failed++;
      errors.push({
        table: tableName,
        localId: item.localId,
        action: item.action,
        error: err instanceof Error ? err.message : 'Unknown error',
        timestamp: Date.now(),
      });
    }
  }
  
  return createSyncResult(success, failed, skipped, errors, startTime);
};

const processQueueItem = async (
  userId: string,
  tableName: SyncableTable,
  localId: string,
  action: 'insert' | 'update' | 'delete'
): Promise<void> => {
  const tableMapping: Record<SyncableTable, string> = {
    users: 'users',
    customers: 'customers',
    invoices: 'invoices',
    estimates: 'estimates',
    transactions: 'transactions',
    mtd_transactions: 'mtd_transactions',
    mtd_quarterly_summaries: 'mtd_quarterly_summaries',
    mtd_annual_summaries: 'mtd_annual_summaries',
    documents: 'documents',
  };
  
  const supabaseTable = tableMapping[tableName];
  
  if (action === 'delete') {
    await supabase.from(supabaseTable).delete().eq('local_id', localId);
    return;
  }
  
  const { data: localData } = await supabase
    .from(`${supabaseTable}_pending`)
    .select('*')
    .eq('local_id', localId)
    .single();
  
  if (!localData) {
    return;
  }
  
  await supabase.from(supabaseTable).upsert({
    ...localData,
    local_id: localId,
    synced_at: new Date().toISOString(),
    sync_status: 'synced',
  });
};

export const getSyncStatus = async (userId: string) => {
  const pendingCount = await getPendingCount();
  const lastSync = await getLastSyncTime(userId);
  const isConnected = await checkConnection();
  
  return {
    pendingCount,
    lastSync,
    isConnected,
    status: isConnected ? 'ready' : 'offline',
  };
};
