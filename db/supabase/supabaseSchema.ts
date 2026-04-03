/**
 * supabaseSchema.ts
 *
 * Drizzle schema for Supabase PostgreSQL database.
 * Used for generating migrations and type-safe queries.
 *
 * Tables mirror db/schema.ts with added sync fields.
 * Run migrations: npx drizzle-kit push --config drizzle.supabase.config.ts
 */

import { pgTable, uuid, text, boolean, timestamp, integer, real, primaryKey, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
	id: uuid('id').primaryKey().defaultRandom(),
	localId: text('local_id').unique().notNull(),
	email: text('email'),
	fullName: text('full_name'),
	address: text('address'),
	phoneNumber: text('phone_number'),
	utrNumber: text('utr_number'),
	ninNumber: text('nin_number'),
	isAdmin: boolean('is_admin').default(false),
	createdAt: timestamp('created_at').defaultNow(),
	updatedAt: timestamp('updated_at').defaultNow(),
	syncedAt: timestamp('synced_at'),
	syncStatus: text('sync_status').default('pending'),
}, (table) => ({
	emailIdx: uniqueIndex('idx_users_email').on(table.email),
	localIdIdx: uniqueIndex('idx_users_local_id').on(table.localId),
}));

export const customers = pgTable('customers', {
	id: uuid('id').primaryKey().defaultRandom(),
	localId: text('local_id').unique().notNull(),
	userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
	name: text('name').notNull(),
	email: text('email'),
	phone: text('phone'),
	address: text('address'),
	createdAt: timestamp('created_at').defaultNow(),
	updatedAt: timestamp('updated_at').defaultNow(),
	syncedAt: timestamp('synced_at'),
	syncStatus: text('sync_status').default('pending'),
}, (table) => ({
	userIdIdx: index('idx_customers_user_id').on(table.userId),
	localIdIdx: uniqueIndex('idx_customers_local_id').on(table.localId),
}));

export const invoices = pgTable('invoices', {
	id: uuid('id').primaryKey().defaultRandom(),
	localId: text('local_id').unique().notNull(),
	userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
	customerId: uuid('customer_id').references(() => customers.id, { onDelete: 'set null' }),
	invoiceNumber: text('invoice_number'),
	invoiceDate: text('invoice_date'),
	dueDate: text('due_date'),
	amountBeforeTax: real('amount_before_tax'),
	amountAfterTax: real('amount_after_tax'),
	taxRate: real('tax_rate'),
	taxValue: boolean('tax_value').default(false),
	isPayed: boolean('is_payed').default(false),
	currency: text('currency').default('GBP'),
	discount: real('discount'),
	pdfPath: text('pdf_path'),
	createdAt: timestamp('created_at').defaultNow(),
	updatedAt: timestamp('updated_at').defaultNow(),
	syncedAt: timestamp('synced_at'),
	syncStatus: text('sync_status').default('pending'),
}, (table) => ({
	userIdIdx: index('idx_invoices_user_id').on(table.userId),
	customerIdIdx: index('idx_invoices_customer_id').on(table.customerId),
	localIdIdx: uniqueIndex('idx_invoices_local_id').on(table.localId),
	invoiceDateIdx: index('idx_invoices_invoice_date').on(table.invoiceDate),
	isPayedIdx: index('idx_invoices_is_payed').on(table.isPayed),
}));

export const invoiceItems = pgTable('invoice_items', {
	id: uuid('id').primaryKey().defaultRandom(),
	localId: text('local_id').unique().notNull(),
	invoiceId: uuid('invoice_id').references(() => invoices.id, { onDelete: 'cascade' }),
	description: text('description'),
	unitPrice: real('unit_price'),
	quantity: real('quantity'),
	date: text('date'),
	totalToPayMinusTax: real('total_to_pay_minus_tax'),
	createdAt: timestamp('created_at').defaultNow(),
	updatedAt: timestamp('updated_at').defaultNow(),
	syncedAt: timestamp('synced_at'),
	syncStatus: text('sync_status').default('pending'),
}, (table) => ({
	invoiceIdIdx: index('idx_invoice_items_invoice_id').on(table.invoiceId),
	localIdIdx: uniqueIndex('idx_invoice_items_local_id').on(table.localId),
}));

export const estimates = pgTable('estimates', {
	id: uuid('id').primaryKey().defaultRandom(),
	localId: text('local_id').unique().notNull(),
	userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
	customerId: uuid('customer_id').references(() => customers.id, { onDelete: 'set null' }),
	estimateDate: text('estimate_date'),
	estimateEndTime: text('estimate_end_time'),
	discount: real('discount'),
	taxRate: real('tax_rate'),
	amountBeforeTax: real('amount_before_tax'),
	amountAfterTax: real('amount_after_tax'),
	taxValue: boolean('tax_value').default(false),
	isAccepted: boolean('is_accepted').default(false),
	currency: text('currency').default('GBP'),
	createdAt: timestamp('created_at').defaultNow(),
	updatedAt: timestamp('updated_at').defaultNow(),
	syncedAt: timestamp('synced_at'),
	syncStatus: text('sync_status').default('pending'),
}, (table) => ({
	userIdIdx: index('idx_estimates_user_id').on(table.userId),
	localIdIdx: uniqueIndex('idx_estimates_local_id').on(table.localId),
}));

export const transactions = pgTable('transactions', {
	id: uuid('id').primaryKey().defaultRandom(),
	localId: text('local_id').unique().notNull(),
	userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
	categoryId: text('category_id'),
	amount: real('amount').notNull(),
	date: text('date').notNull(),
	description: text('description'),
	type: text('type'),
	currency: text('currency').default('GBP'),
	createdAt: timestamp('created_at').defaultNow(),
	updatedAt: timestamp('updated_at').defaultNow(),
	syncedAt: timestamp('synced_at'),
	syncStatus: text('sync_status').default('pending'),
}, (table) => ({
	userIdIdx: index('idx_transactions_user_id').on(table.userId),
	localIdIdx: uniqueIndex('idx_transactions_local_id').on(table.localId),
	dateIdx: index('idx_transactions_date').on(table.date),
	typeIdx: index('idx_transactions_type').on(table.type),
}));

export const mtdTransactions = pgTable('mtd_transactions', {
	id: uuid('id').primaryKey().defaultRandom(),
	localId: text('local_id').unique().notNull(),
	userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
	invoiceId: uuid('invoice_id').references(() => invoices.id, { onDelete: 'set null' }),
	transactionId: uuid('transaction_id').references(() => transactions.id, { onDelete: 'set null' }),
	date: text('date').notNull(),
	description: text('description').notNull(),
	amount: real('amount').notNull(),
	type: text('type').notNull(),
	category: text('category').notNull(),
	taxYear: text('tax_year').notNull(),
	quarter: integer('quarter').notNull(),
	currency: text('currency').default('GBP'),
	receiptRef: text('receipt_ref'),
	notes: text('notes'),
	createdAt: timestamp('created_at').defaultNow(),
	syncedAt: timestamp('synced_at'),
	syncStatus: text('sync_status').default('pending'),
}, (table) => ({
	userIdIdx: index('idx_mtd_transactions_user_id').on(table.userId),
	localIdIdx: uniqueIndex('idx_mtd_transactions_local_id').on(table.localId),
	yearQuarterIdx: index('idx_mtd_transactions_year_quarter').on(table.taxYear, table.quarter),
	invoiceIdIdx: index('idx_mtd_transactions_invoice_id').on(table.invoiceId),
}));

export const mtdQuarterlySummaries = pgTable('mtd_quarterly_summaries', {
	id: uuid('id').primaryKey().defaultRandom(),
	localId: text('local_id').unique().notNull(),
	userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
	taxYear: text('tax_year').notNull(),
	quarter: integer('quarter').notNull(),
	periodStart: text('period_start').notNull(),
	periodEnd: text('period_end').notNull(),
	submissionDeadline: text('submission_deadline').notNull(),
	totalTurnover: real('total_turnover').default(0),
	costOfGoodsAllowable: real('cost_of_goods_allowable').default(0),
	employeeCosts: real('employee_costs').default(0),
	premisesRunningCosts: real('premises_running_costs').default(0),
	maintenanceCosts: real('maintenance_costs').default(0),
	advertisingCosts: real('advertising_costs').default(0),
	interestOnBankLoans: real('interest_on_bank_loans').default(0),
	professionalFees: real('professional_fees').default(0),
	depreciation: real('depreciation').default(0),
	otherAllowableExpenses: real('other_allowable_expenses').default(0),
	businessEntertainmentCosts: real('business_entertainment_costs').default(0),
	otherDisallowableExpenses: real('other_disallowable_expenses').default(0),
	totalAllowableExpenses: real('total_allowable_expenses').default(0),
	netProfit: real('net_profit').default(0),
	status: text('status').default('not_started'),
	lastCalculatedAt: timestamp('last_calculated_at'),
	updatedAt: timestamp('updated_at').defaultNow(),
	syncedAt: timestamp('synced_at'),
	syncStatus: text('sync_status').default('pending'),
}, (table) => ({
	userYearQuarterIdx: uniqueIndex('idx_mtd_qs_user_year_quarter').on(table.userId, table.taxYear, table.quarter),
}));

export const mtdAnnualSummaries = pgTable('mtd_annual_summaries', {
	id: uuid('id').primaryKey().defaultRandom(),
	localId: text('local_id').unique().notNull(),
	userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
	taxYear: text('tax_year').notNull(),
	finalDeclarationDeadline: text('final_declaration_deadline').notNull(),
	totalTurnover: real('total_turnover').default(0),
	totalAllowableExpenses: real('total_allowable_expenses').default(0),
	netProfit: real('net_profit').default(0),
	estimatedTaxableProfit: real('estimated_taxable_profit').default(0),
	estimatedIncomeTax: real('estimated_income_tax').default(0),
	estimatedNI: real('estimated_ni').default(0),
	estimatedTotalTax: real('estimated_total_tax').default(0),
	personalAllowanceUsed: real('personal_allowance_used').default(12570),
	status: text('status').default('in_progress'),
	updatedAt: timestamp('updated_at').defaultNow(),
	syncedAt: timestamp('synced_at'),
	syncStatus: text('sync_status').default('pending'),
}, (table) => ({
	userYearIdx: uniqueIndex('idx_mtd_annual_user_year').on(table.userId, table.taxYear),
}));

export const documents = pgTable('documents', {
	id: uuid('id').primaryKey().defaultRandom(),
	localId: text('local_id'),
	userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
	fileName: text('file_name').notNull(),
	storagePath: text('storage_path').notNull(),
	fileType: text('file_type').notNull(),
	documentType: text('document_type').notNull(),
	taxYear: text('tax_year').notNull(),
	quarter: integer('quarter').notNull(),
	documentDate: text('document_date'),
	createdAt: timestamp('created_at').defaultNow(),
	syncedAt: timestamp('synced_at'),
	syncStatus: text('sync_status').default('pending'),
}, (table) => ({
	userQuarterIdx: index('idx_documents_user_quarter').on(table.userId, table.taxYear, table.quarter),
	localIdIdx: index('idx_documents_local_id').on(table.localId),
}));

export const syncMetadata = pgTable('sync_metadata', {
	userId: uuid('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
	lastSync: timestamp('last_sync'),
	updatedAt: timestamp('updated_at').defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
	customers: many(customers),
	invoices: many(invoices),
	transactions: many(transactions),
	mtdTransactions: many(mtdTransactions),
	mtdQuarterlySummaries: many(mtdQuarterlySummaries),
	mtdAnnualSummaries: many(mtdAnnualSummaries),
	documents: many(documents),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
	user: one(users, { fields: [invoices.userId], references: [users.id] }),
	customer: one(customers, { fields: [invoices.customerId], references: [customers.id] }),
	items: many(invoiceItems),
	mtdTransactions: many(mtdTransactions),
}));

export const invoiceItemsRelations = relations(invoiceItems, ({ one }) => ({
	invoice: one(invoices, { fields: [invoiceItems.invoiceId], references: [invoices.id] }),
}));
