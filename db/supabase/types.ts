/**
 * db/supabase/types.ts
 *
 * TypeScript types for Supabase tables. Mirrors the SQLite schema from
 * db/schema.ts with additional sync fields for offline-first cloud backup.
 *
 * All Supabase types include:
 * - id: UUID primary key (Supabase)
 * - localId: links to SQLite record (local database)
 * - syncedAt: last successful sync timestamp
 * - syncStatus: pending | synced | failed
 *
 * MTD-related types include taxYear ("2025-26") and quarter (1-4).
 *
 * Used by: db/supabase/operations/*.ts, db/supabase/sync/*.ts,
 *          db/supabase/validation/validation.ts
 *
 * References:
 * - SQLite schema: db/schema.ts
 * - MTD types: types/mtd.ts
 */

// ─── Base Sync Types ──────────────────────────────────────────────────────────

export type SyncStatus = 'pending' | 'synced' | 'failed';

export interface Syncable {
	id: string;
	localId: string;
	syncedAt: string | null;
	syncStatus: SyncStatus;
}

export interface SyncableMtd extends Syncable {
	taxYear: string;
	quarter: 1 | 2 | 3 | 4;
}

// ─── SupabaseUser ─────────────────────────────────────────────────────────────

export interface SupabaseUser extends Syncable {
	fullName: string | null;
	address: string | null;
	emailAddress: string | null;
	phoneNumber: string | null;
	utrNumber: string | null;
	ninNumber: string | null;
	createdAt: string | null;
	isAdmin: boolean;
}

export type SupabaseUserInsert = Omit<SupabaseUser, 'syncedAt'>;
export type SupabaseUserUpdate = Partial<SupabaseUserInsert>;

// ─── SupabaseCustomer ─────────────────────────────────────────────────────────

export interface SupabaseCustomer extends Syncable {
	name: string | null;
	address: string | null;
	emailAddress: string | null;
	phoneNumber: string | null;
	createdAt: string | null;
}

export type SupabaseCustomerInsert = Omit<SupabaseCustomer, 'syncedAt'>;
export type SupabaseCustomerUpdate = Partial<SupabaseCustomerInsert>;

// ─── SupabaseInvoice ─────────────────────────────────────────────────────────

export interface SupabaseInvoice extends Syncable {
	userId: string | null;
	customerId: string | null;
	invoiceDate: string | null;
	dueDate: string | null;
	amountAfterTax: number | null;
	amountBeforeTax: number | null;
	taxRate: number | null;
	pdfPath: string | null;
	currency: string;
	createdAt: string | null;
	taxValue: boolean;
	isPayed: boolean;
	discount: number | null;
}

export type SupabaseInvoiceInsert = Omit<SupabaseInvoice, 'syncedAt'>;
export type SupabaseInvoiceUpdate = Partial<SupabaseInvoiceInsert>;

export interface SupabaseInvoiceWithItems extends SupabaseInvoice {
	items: SupabaseInvoiceItem[];
}

// ─── SupabaseInvoiceItem (WorkInformation) ────────────────────────────────────

export interface SupabaseInvoiceItem extends Syncable {
	invoiceId: string | null;
	descriptionOfWork: string | null;
	unitPrice: number | null;
	date: string | null;
	totalToPayMinusTax: number | null;
	createdAt: string | null;
}

export type SupabaseInvoiceItemInsert = Omit<SupabaseInvoiceItem, 'syncedAt'>;
export type SupabaseInvoiceItemUpdate = Partial<SupabaseInvoiceItemInsert>;

// ─── SupabaseEstimate ─────────────────────────────────────────────────────────

export interface SupabaseEstimate extends Syncable {
	customerId: string | null;
	userId: string | null;
	estimateDate: string | null;
	estimateEndTime: string | null;
	currency: string;
	discount: number | null;
	taxRate: number | null;
	amountBeforeTax: number | null;
	amountAfterTax: number | null;
	taxValue: boolean;
	isAccepted: boolean;
}

export type SupabaseEstimateInsert = Omit<SupabaseEstimate, 'syncedAt'>;
export type SupabaseEstimateUpdate = Partial<SupabaseEstimateInsert>;

// ─── SupabaseTransaction ──────────────────────────────────────────────────────

export interface SupabaseTransaction extends Syncable {
	userId: string | null;
	categoryId: string | null;
	amount: number | null;
	date: string | null;
	createdAt: string | null;
	currency: string;
	description: string;
	type: string | null;
}

export type SupabaseTransactionInsert = Omit<SupabaseTransaction, 'syncedAt'>;
export type SupabaseTransactionUpdate = Partial<SupabaseTransactionInsert>;

// ─── SupabaseMtdTransaction ───────────────────────────────────────────────────

export interface SupabaseMtdTransaction extends SyncableMtd {
	userId: string | null;
	invoiceId: string | null;
	transactionId: string | null;
	date: string;
	description: string;
	amount: number;
	type: string;
	category: string;
	currency: string;
	receiptRef: string | null;
	notes: string | null;
	createdAt: string | null;
}

export type SupabaseMtdTransactionInsert = Omit<SupabaseMtdTransaction, 'syncedAt'>;
export type SupabaseMtdTransactionUpdate = Partial<SupabaseMtdTransactionInsert>;

// ─── SupabaseMtdQuarterlySummary ─────────────────────────────────────────────

export interface SupabaseMtdQuarterlySummary extends SyncableMtd {
	periodStart: string;
	periodEnd: string;
	submissionDeadline: string;
	totalTurnover: number;
	costOfGoodsAllowable: number;
	employeeCosts: number;
	premisesRunningCosts: number;
	maintenanceCosts: number;
	advertisingCosts: number;
	interestOnBankLoans: number;
	professionalFees: number;
	depreciation: number;
	otherAllowableExpenses: number;
	businessEntertainmentCosts: number;
	otherDisallowableExpenses: number;
	totalAllowableExpenses: number;
	netProfit: number;
	status: string;
	lastCalculatedAt: string | null;
	updatedAt: string | null;
}

export type SupabaseMtdQuarterlySummaryInsert = Omit<SupabaseMtdQuarterlySummary, 'syncedAt'>;
export type SupabaseMtdQuarterlySummaryUpdate = Partial<SupabaseMtdQuarterlySummaryInsert>;

// ─── SupabaseMtdAnnualSummary ────────────────────────────────────────────────

export interface SupabaseMtdAnnualSummary extends Syncable {
	userId: string | null;
	taxYear: string;
	finalDeclarationDeadline: string;
	totalTurnover: number;
	totalAllowableExpenses: number;
	netProfit: number;
	estimatedTaxableProfit: number;
	estimatedIncomeTax: number;
	estimatedNI: number;
	estimatedTotalTax: number;
	personalAllowanceUsed: number;
	status: string;
	updatedAt: string | null;
}

export type SupabaseMtdAnnualSummaryInsert = Omit<SupabaseMtdAnnualSummary, 'syncedAt'>;
export type SupabaseMtdAnnualSummaryUpdate = Partial<SupabaseMtdAnnualSummaryInsert>;

// ─── SupabaseAppSettings ──────────────────────────────────────────────────────

export interface SupabaseAppSettings extends Syncable {
	userId: string | null;
	defaultPaymentTerms: number;
	defaultVatRate: number;
	invoicePrefix: string;
	nextInvoiceNumber: number;
	estimatePrefix: string;
	nextEstimateNumber: number;
	currency: string;
	dateFormat: string;
	numberFormat: string;
	autoCalculateQuarters: boolean;
	quarterlyTaxEnabled: boolean;
	quarterStartMonths: string;
	quarterlyTaxReminderDays: number;
	financialYearStartMonth: number;
	financialYearStartDay: number;
	financialYearEndMonth: number;
	financialYearEndDay: number;
	taxScheme: string;
	defaultTaxCategory: string;
	reminderEmailEnabled: boolean;
	reminderDaysBeforeDue: number;
	language: string;
	theme: string;
	logoUrl: string | null;
	applyTaxByDefault: boolean;
	defaultNotes: string | null;
	taxRatesJson: string | null;
	createdAt: string | null;
	updatedAt: string | null;
}

export type SupabaseAppSettingsInsert = Omit<SupabaseAppSettings, 'syncedAt' | 'id'>;
export type SupabaseAppSettingsUpdate = Partial<SupabaseAppSettingsInsert>;

// ─── SupabaseDocument ─────────────────────────────────────────────────────────

export type DocumentType = 'receipt' | 'invoice' | 'expense' | 'export';
export type FileType = 'pdf' | 'csv' | 'xlsx' | 'jpg' | 'png';

export interface SupabaseDocument extends Syncable {
	userId: string;
	fileName: string;
	storagePath: string;
	fileType: FileType;
	documentType: DocumentType;
	taxYear: string;
	quarter: 1 | 2 | 3 | 4;
	documentDate: string | null;
	createdAt: string | null;
}

export type SupabaseDocumentInsert = Omit<SupabaseDocument, 'syncedAt'>;
export type SupabaseDocumentUpdate = Partial<SupabaseDocumentInsert>;

// ─── Type Exports for Operations ─────────────────────────────────────────────

export type AnySupabaseTable =
	| SupabaseUser
	| SupabaseCustomer
	| SupabaseInvoice
	| SupabaseInvoiceItem
	| SupabaseEstimate
	| SupabaseTransaction
	| SupabaseMtdTransaction
	| SupabaseMtdQuarterlySummary
	| SupabaseMtdAnnualSummary
	| SupabaseAppSettings
	| SupabaseDocument;

export type TableName =
	| 'users'
	| 'customers'
	| 'invoices'
	| 'invoice_items'
	| 'estimates'
	| 'transactions'
	| 'mtd_transactions'
	| 'mtd_quarterly_summaries'
	| 'mtd_annual_summaries'
	| 'app_settings'
	| 'documents';

export const TABLE_NAMES: Record<TableName, TableName> = {
	users: 'users',
	customers: 'customers',
	invoices: 'invoices',
	invoice_items: 'invoice_items',
	estimates: 'estimates',
	transactions: 'transactions',
	mtd_transactions: 'mtd_transactions',
	mtd_quarterly_summaries: 'mtd_quarterly_summaries',
	mtd_annual_summaries: 'mtd_annual_summaries',
	app_settings: 'app_settings',
	documents: 'documents',
};
