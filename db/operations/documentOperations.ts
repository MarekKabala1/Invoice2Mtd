/**
 * documentOperations.ts
 *
 * Local database operations for Documents table.
 * Handles CRUD operations for receipts, invoices, and other documents.
 */

import { eq } from 'drizzle-orm';
import type { InferSelectModel } from 'drizzle-orm';
import { db as localDb } from '@/db/config';
import * as db from '@/db/schema';
import { taxYearForDate, quarterForDate } from '@/utils/mtd/mtdDates';
import uuid from 'react-native-uuid';

export type DocumentType = 'receipt' | 'invoice' | 'bank_statement' | 'expense' | 'export' | 'other';
export type Document = InferSelectModel<typeof db.Documents>;

export interface CreateDocumentParams {
  userId: string;
  invoiceId?: string;
  transactionId?: string;
  fileName: string;
  filePath: string;
  fileType: string;
  documentType: DocumentType;
  documentDate?: string;
  taxYear?: string;
  quarter?: number;
  notes?: string;
}

export async function createDocument(params: CreateDocumentParams): Promise<Document> {
  const id = uuid.v4() as string;
  
  let taxYear = params.taxYear;
  let quarter = params.quarter;
  
  if (!taxYear && params.documentDate) {
    taxYear = taxYearForDate(new Date(params.documentDate)).toString();
    quarter = quarterForDate(new Date(params.documentDate)).quarter;
  } else if (!taxYear) {
    taxYear = taxYearForDate(new Date()).toString();
    quarter = quarterForDate(new Date()).quarter;
  }

  const insertData = {
    id,
    userId: params.userId,
    invoiceId: params.invoiceId,
    transactionId: params.transactionId,
    fileName: params.fileName,
    filePath: params.filePath,
    fileType: params.fileType,
    documentType: params.documentType,
    taxYear,
    quarter,
    documentDate: params.documentDate,
    notes: params.notes,
  };
  const result = await localDb.insert(db.Documents).values(insertData).returning();

  return result[0];
}

export async function getDocumentById(id: string): Promise<Document | null> {
  const result = await localDb
    .select()
    .from(db.Documents)
    .where(eq(db.Documents.id, id))
    .limit(1);
  
  return result[0] ?? null;
}

export async function getDocumentsByUser(userId: string): Promise<Document[]> {
  return localDb
    .select()
    .from(db.Documents)
    .where(eq(db.Documents.userId, userId));
}

export async function getDocumentsByTaxYear(
  userId: string,
  taxYear: string
): Promise<Document[]> {
  return localDb
    .select()
    .from(db.Documents)
    .where(eq(db.Documents.taxYear, taxYear))
    .orderBy(db.Documents.documentDate);
}

export async function getDocumentsByType(
  userId: string,
  documentType: DocumentType
): Promise<Document[]> {
  return localDb
    .select()
    .from(db.Documents)
    .where(eq(db.Documents.documentType, documentType));
}

export async function updateDocument(
  id: string,
  updates: Partial<CreateDocumentParams>
): Promise<Document | null> {
  const result = await localDb
    .update(db.Documents)
    .set(updates)
    .where(eq(db.Documents.id, id))
    .returning();

  return result[0] ?? null;
}

export async function deleteDocument(id: string): Promise<void> {
  await localDb.delete(db.Documents).where(eq(db.Documents.id, id));
}

export async function getDocumentsByTransaction(
  transactionId: string
): Promise<Document[]> {
  return localDb
    .select()
    .from(db.Documents)
    .where(eq(db.Documents.transactionId, transactionId));
}

export async function getDocumentsByInvoice(
  invoiceId: string
): Promise<Document[]> {
  return localDb
    .select()
    .from(db.Documents)
    .where(eq(db.Documents.invoiceId, invoiceId));
}
