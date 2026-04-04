/**
 * db/supabase/sync/sync.types.ts
 *
 * TypeScript types for Supabase sync queue operations.
 * Manages offline-first sync with retry logic and progress tracking.
 *
 * Used by: db/supabase/sync/syncQueue.ts, db/supabase/sync/syncManager.ts
 *
 * References:
 * - Main Supabase types: db/supabase/types.ts
 */

export type SyncStatus = 'pending' | 'synced' | 'failed';
export type SyncAction = 'insert' | 'update' | 'delete';

export interface SyncQueueItem {
	id: string;
	table: string;
	localId: string;
	action: SyncAction;
	timestamp: number;
	retryCount: number;
	data?: Record<string, unknown>;
}

export interface SyncError {
	table: string;
	localId: string;
	action: SyncAction;
	error: string;
	timestamp: number;
}

export interface SyncProgress {
	current: number;
	total: number;
	currentTable: string;
}

export interface SyncResult {
	success: number;
	failed: number;
	skipped: number;
	errors: SyncError[];
	duration: number;
	timestamp: string;
}

export interface SyncOptions {
	tables?: string[];
	forceFull?: boolean;
	onProgress?: (progress: SyncProgress) => void;
}

export interface TableSyncConfig {
	tableName: string;
	localTable: string;
	syncFn: (userId: string) => Promise<void>;
	batchSize?: number;
}

export const TABLE_SYNC_ORDER = [
	'users',
	'customers',
	'invoices',
	'invoice_items',
	'estimates',
	'transactions',
	'mtd_transactions',
	'mtd_quarterly_summaries',
	'mtd_annual_summaries',
	'documents',
] as const;

export type SyncableTable = (typeof TABLE_SYNC_ORDER)[number];
