/**
 * validation.ts
 *
 * Zod schemas for validating data before upload to Supabase.
 * Ensures data integrity and correct formats.
 */

import { z } from 'zod';

const TAX_YEAR_REGEX = /^\d{4}-\d{2}$/;

export const UserSchema = z.object({
  id: z.string().uuid(),
  localId: z.string().min(1),
  email: z.string().email().optional().or(z.literal('')),
  fullName: z.string().optional(),
  address: z.string().optional(),
  phoneNumber: z.string().optional(),
  utrNumber: z.string().optional(),
  ninNumber: z.string().optional(),
  syncedAt: z.string().datetime().nullable().optional(),
  syncStatus: z.enum(['pending', 'synced', 'failed']).optional(),
});

export const CustomerSchema = z.object({
  id: z.string().uuid(),
  localId: z.string().min(1),
  userId: z.string().uuid(),
  name: z.string().min(1),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  syncedAt: z.string().datetime().nullable().optional(),
  syncStatus: z.enum(['pending', 'synced', 'failed']).optional(),
});

export const InvoiceSchema = z.object({
  id: z.string().uuid(),
  localId: z.string().min(1),
  userId: z.string().uuid(),
  customerId: z.string().uuid().optional(),
  invoiceNumber: z.string().optional(),
  invoiceDate: z.string().optional(),
  dueDate: z.string().optional(),
  amountBeforeTax: z.number().optional(),
  amountAfterTax: z.number().optional(),
  taxRate: z.number().optional(),
  currency: z.string().default('GBP'),
  isPayed: z.boolean().optional(),
  syncedAt: z.string().datetime().nullable().optional(),
  syncStatus: z.enum(['pending', 'synced', 'failed']).optional(),
});

export const InvoiceItemSchema = z.object({
  id: z.string().uuid(),
  localId: z.string().min(1),
  invoiceId: z.string().uuid(),
  description: z.string().optional(),
  unitPrice: z.number().optional(),
  quantity: z.number().optional(),
  totalToPayMinusTax: z.number().optional(),
  date: z.string().optional(),
  syncedAt: z.string().datetime().nullable().optional(),
  syncStatus: z.enum(['pending', 'synced', 'failed']).optional(),
});

export const EstimateSchema = z.object({
  id: z.string().uuid(),
  localId: z.string().min(1),
  userId: z.string().uuid(),
  customerId: z.string().uuid().optional(),
  estimateDate: z.string().optional(),
  amountBeforeTax: z.number().optional(),
  amountAfterTax: z.number().optional(),
  taxRate: z.number().optional(),
  isAccepted: z.boolean().optional(),
  currency: z.string().default('GBP'),
  syncedAt: z.string().datetime().nullable().optional(),
  syncStatus: z.enum(['pending', 'synced', 'failed']).optional(),
});

export const TransactionSchema = z.object({
  id: z.string().uuid(),
  localId: z.string().min(1),
  userId: z.string().uuid(),
  categoryId: z.string().optional(),
  amount: z.number(),
  date: z.string(),
  type: z.enum(['income', 'expense']),
  description: z.string().optional(),
  currency: z.string().default('GBP'),
  syncedAt: z.string().datetime().nullable().optional(),
  syncStatus: z.enum(['pending', 'synced', 'failed']).optional(),
});

export const MtdTransactionSchema = z.object({
  id: z.string().uuid(),
  localId: z.string().min(1),
  userId: z.string().uuid(),
  invoiceId: z.string().uuid().optional(),
  transactionId: z.string().uuid().optional(),
  date: z.string(),
  description: z.string(),
  amount: z.number(),
  type: z.enum(['income', 'expense']),
  category: z.string(),
  taxYear: z.string().regex(TAX_YEAR_REGEX, 'Invalid tax year format (e.g., 2025-26)'),
  quarter: z.number().int().min(1).max(4),
  currency: z.string().default('GBP'),
  receiptRef: z.string().optional(),
  notes: z.string().optional(),
  syncedAt: z.string().datetime().nullable().optional(),
  syncStatus: z.enum(['pending', 'synced', 'failed']).optional(),
});

export const MtdQuarterlySummarySchema = z.object({
  id: z.string().uuid(),
  localId: z.string().min(1),
  userId: z.string().uuid(),
  taxYear: z.string().regex(TAX_YEAR_REGEX),
  quarter: z.number().int().min(1).max(4),
  periodStart: z.string(),
  periodEnd: z.string(),
  submissionDeadline: z.string(),
  totalTurnover: z.number().default(0),
  totalAllowableExpenses: z.number().default(0),
  netProfit: z.number().default(0),
  status: z.string().optional(),
  syncedAt: z.string().datetime().nullable().optional(),
  syncStatus: z.enum(['pending', 'synced', 'failed']).optional(),
});

export const MtdAnnualSummarySchema = z.object({
  id: z.string().uuid(),
  localId: z.string().min(1),
  userId: z.string().uuid(),
  taxYear: z.string().regex(TAX_YEAR_REGEX),
  finalDeclarationDeadline: z.string(),
  totalTurnover: z.number().default(0),
  totalAllowableExpenses: z.number().default(0),
  netProfit: z.number().default(0),
  estimatedTaxableProfit: z.number().default(0),
  estimatedIncomeTax: z.number().default(0),
  estimatedNI: z.number().default(0),
  estimatedTotalTax: z.number().default(0),
  status: z.string().optional(),
  syncedAt: z.string().datetime().nullable().optional(),
  syncStatus: z.enum(['pending', 'synced', 'failed']).optional(),
});

export const DocumentSchema = z.object({
  id: z.string().uuid(),
  localId: z.string().min(1),
  userId: z.string().uuid(),
  fileName: z.string().min(1),
  storagePath: z.string().min(1),
  fileType: z.enum(['pdf', 'csv', 'xlsx', 'jpg', 'png']),
  documentType: z.enum(['receipt', 'invoice', 'expense', 'export']),
  taxYear: z.string().regex(TAX_YEAR_REGEX),
  quarter: z.number().int().min(1).max(4),
  documentDate: z.string().optional(),
  createdAt: z.string().datetime().optional(),
  syncedAt: z.string().datetime().nullable().optional(),
  syncStatus: z.enum(['pending', 'synced', 'failed']).optional(),
});

export const validateForSync = <T>(
  data: unknown,
  schema: z.ZodSchema<T>
): { success: true; data: T } | { success: false; errors: z.ZodError['errors'] } => {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  return { success: false, errors: result.error.errors };
};

export const validateUser = (data: unknown) => validateForSync(data, UserSchema);
export const validateCustomer = (data: unknown) => validateForSync(data, CustomerSchema);
export const validateInvoice = (data: unknown) => validateForSync(data, InvoiceSchema);
export const validateInvoiceItem = (data: unknown) => validateForSync(data, InvoiceItemSchema);
export const validateEstimate = (data: unknown) => validateForSync(data, EstimateSchema);
export const validateTransaction = (data: unknown) => validateForSync(data, TransactionSchema);
export const validateMtdTransaction = (data: unknown) => validateForSync(data, MtdTransactionSchema);
export const validateMtdQuarterlySummary = (data: unknown) => validateForSync(data, MtdQuarterlySummarySchema);
export const validateMtdAnnualSummary = (data: unknown) => validateForSync(data, MtdAnnualSummarySchema);
export const validateDocument = (data: unknown) => validateForSync(data, DocumentSchema);
