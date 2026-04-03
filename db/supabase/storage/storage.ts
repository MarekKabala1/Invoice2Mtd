/**
 * storage/storage.ts
 *
 * File upload/download operations for Invoice2Mtd using Supabase Storage.
 * Organises files by tax year and quarter for MTD compliance.
 *
 * Depends on: @supabase/supabase-js, utils/mtd/mtdDates.ts
 * Used by: hooks/useMtdData.ts, hooks/useDocumentStorage.ts
 */

import * as FileSystem from 'expo-file-system';
import { supabase } from '../supabase';
import { taxYearForDate, quarterForDate } from '@/utils/mtd/mtdDates';
import {
  StorageBucket,
  UploadOptions,
  StorageResult,
  ListOptions,
  StorageFile,
  DocumentType,
} from '../storage.types';

const BUCKET_DOCUMENT_TYPE_MAP: Record<StorageBucket, DocumentType> = {
  receipts: 'receipt',
  invoices: 'invoice',
  exports: 'export',
};

const getFileExtension = (fileType: UploadOptions['fileType']): string => {
  const extensions: Record<UploadOptions['fileType'], string> = {
    pdf: 'pdf',
    csv: 'csv',
    xlsx: 'xlsx',
    jpg: 'jpg',
    png: 'png',
  };
  return extensions[fileType];
};

const generateFileName = (options: UploadOptions, documentDate?: Date): string => {
  const extension = getFileExtension(options.fileType);
  const timestamp = Date.now();
  const dateStr = documentDate ? new Date(documentDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
  
  if (options.fileName) {
    const sanitized = options.fileName.replace(/[^a-zA-Z0-9-_]/g, '_');
    return `${sanitized}_${dateStr}.${extension}`;
  }
  
  return `${options.documentType}_${options.userId}_${dateStr}_${timestamp}.${extension}`;
};

const buildStoragePath = (
  options: UploadOptions,
  documentDate?: Date
): { path: string; taxYear: number; quarter: 1 | 2 | 3 | 4 } => {
  const taxYear = documentDate ? taxYearForDate(documentDate) : taxYearForDate(new Date());
  const quarterObj = documentDate ? quarterForDate(documentDate) : quarterForDate(new Date());
  const quarter = quarterObj.quarter as 1 | 2 | 3 | 4;
  const fileName = generateFileName(options, documentDate);
  
  const path = `${options.userId}/${options.bucket}/${taxYear}/${quarter}/${fileName}`;
  
  return { path, taxYear, quarter };
};

export const uploadDocument = async (
  uri: string,
  options: UploadOptions,
  documentDate?: Date
): Promise<StorageResult> => {
  try {
    const { path } = buildStoragePath(options, documentDate);
    
    const fileInfo = await FileSystem.getInfoAsync(uri);
    if (!fileInfo.exists) {
      return { success: false, error: 'File does not exist at the provided URI' };
    }

    const { data, error } = await supabase.storage
      .from(options.bucket)
      .upload(path, uri, {
        contentType: getMimeType(options.fileType),
        upsert: false,
      });

    if (error) {
      console.error('Supabase upload error:', error.message);
      return { success: false, error: error.message };
    }

    const { data: urlData } = supabase.storage.from(options.bucket).getPublicUrl(data.path);
    
    return {
      success: true,
      path: data.path,
      url: urlData.publicUrl,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown upload error';
    console.error('uploadDocument error:', message);
    return { success: false, error: message };
  }
};

export const getDocumentUrl = async (path: string): Promise<string> => {
  try {
    const { data } = supabase.storage.from(getBucketFromPath(path)).getPublicUrl(path);
    return data.publicUrl;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('getDocumentUrl error:', message);
    return '';
  }
};

export const deleteDocument = async (path: string): Promise<void> => {
  try {
    const { error } = await supabase.storage.from(getBucketFromPath(path)).remove([path]);
    
    if (error) {
      console.error('deleteDocument error:', error.message);
      throw new Error(error.message);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown delete error';
    console.error('deleteDocument error:', message);
    throw new Error(message);
  }
};

export const listDocuments = async (
  options: ListOptions
): Promise<StorageFile[]> => {
  try {
    const { userId, bucket, taxYear, quarter, limit = 100 } = options;
    
    let folderPath = `${userId}/${bucket}`;
    
    if (taxYear !== undefined) {
      folderPath += `/${taxYear}`;
      if (quarter !== undefined) {
        folderPath += `/${quarter}`;
      }
    }
    
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(folderPath, {
        limit,
        sortBy: { column: 'created_at', order: 'desc' },
      });

    if (error) {
      console.error('listDocuments error:', error.message);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    const files: StorageFile[] = data
      .filter((item) => item.id !== null)
      .map((item) => {
        const documentType = BUCKET_DOCUMENT_TYPE_MAP[bucket];
        const itemPath = `${folderPath}/${item.name}`;
        const pathParts = itemPath.split('/');
        const parsedTaxYear = parseInt(pathParts[2] ?? '', 10);
        const parsedQuarter = parseInt(pathParts[3] ?? '', 10);
        
        const fileTaxYear = taxYear ?? (isNaN(parsedTaxYear) ? taxYearForDate(new Date()) : parsedTaxYear);
        const fileQuarter = (quarter ?? (isNaN(parsedQuarter) ? 1 : parsedQuarter)) as 1 | 2 | 3 | 4;
        
        return {
          name: item.name,
          path: itemPath,
          url: '',
          documentType,
          taxYear: fileTaxYear,
          quarter: fileQuarter,
          uploadedAt: item.created_at ?? new Date().toISOString(),
        };
      });

    for (const file of files) {
      file.url = await getDocumentUrl(file.path);
    }

    return files;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown list error';
    console.error('listDocuments error:', message);
    return [];
  }
};

const getMimeType = (fileType: UploadOptions['fileType']): string => {
  const mimeTypes: Record<UploadOptions['fileType'], string> = {
    pdf: 'application/pdf',
    csv: 'text/csv',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    jpg: 'image/jpeg',
    png: 'image/png',
  };
  return mimeTypes[fileType];
};

const getBucketFromPath = (path: string): StorageBucket => {
  const parts = path.split('/');
  const bucket = parts[1] as StorageBucket;
  
  if (bucket === 'receipts' || bucket === 'invoices' || bucket === 'exports') {
    return bucket;
  }
  
  return 'receipts';
};
