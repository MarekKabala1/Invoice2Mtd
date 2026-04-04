/**
 * useDocuments.ts
 *
 * Hook for managing documents with file upload to Supabase Storage.
 * Supports PDF, CSV, Excel, and image files.
 */

import { useState, useCallback } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { Alert } from 'react-native';
import { useAppSettings } from '@/context/AppSettingsContext';
import { uploadDocument } from '@/db/supabase/storage/storage';
import {
  createDocument,
  getDocumentsByUser,
  deleteDocument as deleteLocalDocument,
  getDocumentsByTaxYear,
  type DocumentType,
  type Document,
} from '@/db/operations/documentOperations';
import { addToQueue } from '@/db/supabase/sync/syncQueue';

interface UseDocumentsReturn {
  documents: Document[];
  isLoading: boolean;
  error: string | null;
  uploadFile: (
    documentType: DocumentType,
    options?: {
      transactionId?: string;
      invoiceId?: string;
      documentDate?: string;
      notes?: string;
    }
  ) => Promise<Document | null>;
  deleteFile: (id: string) => Promise<void>;
  refreshDocuments: () => Promise<void>;
  getDocumentsByYear: (taxYear: string) => Promise<Document[]>;
}

const FILE_TYPE_MAP: Record<string, 'pdf' | 'csv' | 'xlsx' | 'jpg' | 'png'> = {
  'application/pdf': 'pdf',
  'text/csv': 'csv',
  'text/comma-separated-values': 'csv',
  'application/vnd.ms-excel': 'xlsx',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'image/jpeg': 'jpg',
  'image/png': 'png',
};

const getBucketForType = (documentType: DocumentType): 'receipts' | 'invoices' | 'exports' => {
  switch (documentType) {
    case 'receipt':
    case 'expense':
    case 'bank_statement':
      return 'receipts';
    case 'invoice':
      return 'invoices';
    case 'export':
      return 'exports';
    case 'other':
    default:
      return 'receipts';
  }
};

export const useDocuments = (): UseDocumentsReturn => {
  const { selectedUserId } = useAppSettings();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshDocuments = useCallback(async () => {
    if (!selectedUserId) return;

    setIsLoading(true);
    setError(null);

    try {
      const docs = await getDocumentsByUser(selectedUserId);
      setDocuments(docs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load documents');
    } finally {
      setIsLoading(false);
    }
  }, [selectedUserId]);

  const getDocumentsByYear = useCallback(async (taxYear: string): Promise<Document[]> => {
    if (!selectedUserId) return [];

    try {
      return await getDocumentsByTaxYear(selectedUserId, taxYear);
    } catch (err) {
      console.error('Failed to get documents by year:', err);
      return [];
    }
  }, [selectedUserId]);

  const uploadFile = useCallback(async (
    documentType: DocumentType,
    options?: {
      transactionId?: string;
      invoiceId?: string;
      documentDate?: string;
      notes?: string;
    }
  ): Promise<Document | null> => {
    if (!selectedUserId) {
      Alert.alert('Error', 'Please select a user first');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'text/csv', '*/*'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        setIsLoading(false);
        return null;
      }

      const file = result.assets[0];
      const fileName = file.name ?? 'document';
      const mimeType = file.mimeType ?? 'application/octet-stream';
      
      const fileType = FILE_TYPE_MAP[mimeType] ?? FILE_TYPE_MAP[fileName.split('.').pop() ?? ''] ?? 'pdf';

      const uploadResult = await uploadDocument(file.uri, {
        userId: selectedUserId,
        bucket: getBucketForType(documentType),
        documentType,
        fileType,
        fileName,
      });

      if (!uploadResult.success || !uploadResult.path) {
        throw new Error(uploadResult.error ?? 'Upload failed');
      }

      const document = await createDocument({
        userId: selectedUserId,
        invoiceId: options?.invoiceId,
        transactionId: options?.transactionId,
        fileName,
        filePath: uploadResult.path,
        fileType: mimeType,
        documentType,
        documentDate: options?.documentDate,
        notes: options?.notes,
      });

      await addToQueue({
        table: 'documents',
        localId: document.id,
        action: 'insert',
      });

      setDocuments((prev) => [document, ...prev]);

      Alert.alert('Success', `${fileName} uploaded successfully`);
      return document;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      setError(message);
      Alert.alert('Upload Error', message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [selectedUserId]);

  const deleteFile = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);

    try {
      await deleteLocalDocument(id);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
      Alert.alert('Success', 'Document deleted');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Delete failed';
      setError(message);
      Alert.alert('Error', message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    documents,
    isLoading,
    error,
    uploadFile,
    deleteFile,
    refreshDocuments,
    getDocumentsByYear,
  };
};
