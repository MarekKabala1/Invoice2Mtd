/**
 * storage.types.ts
 *
 * Type definitions for Supabase Storage operations in Invoice2Mtd.
 * Handles document uploads for receipts, invoices, and exports.
 *
 * Depends on: @supabase/supabase-js
 * Used by: db/supabase/storage/storage.ts
 */

export type StorageBucket = 'receipts' | 'invoices' | 'exports';

export type DocumentType = 'receipt' | 'invoice' | 'expense' | 'export';

export type FileType = 'pdf' | 'csv' | 'xlsx' | 'jpg' | 'png';

export interface UploadOptions {
  userId: string;
  bucket: StorageBucket;
  documentType: DocumentType;
  fileType: FileType;
  fileName?: string;
}

export interface StorageResult {
  success: boolean;
  path?: string;
  url?: string;
  error?: string;
}

export interface ListOptions {
  bucket: StorageBucket;
  userId: string;
  taxYear?: number;
  quarter?: 1 | 2 | 3 | 4;
  limit?: number;
}

export interface StorageFile {
  name: string;
  path: string;
  url: string;
  documentType: DocumentType;
  taxYear: number;
  quarter: 1 | 2 | 3 | 4;
  uploadedAt: string;
}
