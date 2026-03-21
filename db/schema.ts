import { sql } from 'drizzle-orm';
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const User = sqliteTable('User', {
	id: text('id').primaryKey(),
	fullName: text('full_name'),
	address: text('address'),
	emailAddress: text('email_address').unique(),
	phoneNumber: text('phone_number'),
	utrNumber: text('UTR_number'),
	ninNumber: text('NIN_number'),
	createdAt: text('timestamp').default(sql`(current_timestamp)`),
	isAdmin: integer('is_admin', { mode: 'boolean' }).default(false),
});

export const BankDetails = sqliteTable('Bank_Details', {
	id: text('Id').primaryKey(),
	userId: text('user_id').references(() => User.id),
	accountName: text('Account_Name'),
	sortCode: text('Sort_Code'),
	accountNumber: text('Account_Number'),
	bankName: text('Bank_Name'),
	createdAt: text('timestamp').default(sql`(current_timestamp)`),
});

export const Customer = sqliteTable('Customer', {
	id: text('id').primaryKey(),
	name: text('name'),
	address: text('address'),
	emailAddress: text('email_address').unique(),
	phoneNumber: text('phone_number'),
	createdAt: text('timestamp').default(sql`(current_timestamp)`),
});

export const WorkInformation = sqliteTable('Work_Information', {
	id: text('id').primaryKey(),
	invoiceId: text('invoice_id').references(() => Invoice.id),
	descriptionOfWork: text('description_of_work'),
	unitPrice: real('unit_price'),
	date: text('day_of_week'),
	totalToPayMinusTax: real('total_to_pay_minus_tax'),
	createdAt: text('timestamp').default(sql`(current_timestamp)`),
});

export const Invoice = sqliteTable('Invoice', {
	id: text('id').primaryKey(),
	userId: text('user_id').references(() => User.id),
	customerId: text('customer_id').references(() => Customer.id),
	invoiceDate: text('invoice_date'),
	dueDate: text('due_date'),
	amountAfterTax: real('amount_after_tax'),
	amountBeforeTax: real('amount_before_tax'),
	taxRate: real('tax_rate'),
	pdfPath: text('pdf_path'),
	currency: text('currency').default('GBP'),
	createdAt: text('timestamp').default(sql`(current_timestamp)`),
	taxValue: integer('taxValue', { mode: 'boolean' }).default(false),
	isPayed: integer('is_payed', { mode: 'boolean' }).default(false),
	discount: real('discount'),
});

export const Estimate = sqliteTable('Estimate', {
	id: text('id').primaryKey(),
	customerId: text('customer_id').references(() => Customer.id),
	userId: text('user_id').references(() => User.id),
	estimateDate: text('estimate_date'),
	estimateEndTime: text('estimate_end_time'),
	currency: text('currency').default('GBP'),
	discount: real('discount'),
	taxRate: real('tax_rate'),
	amountBeforeTax: real('amount_before_tax'),
	amountAfterTax: real('amount_after_tax'),
	taxValue: integer('taxValue', { mode: 'boolean' }).default(false),
	isAccepted: integer('is_accepted', { mode: 'boolean' }).default(false),
});

export const Payment = sqliteTable('Payments', {
	id: text('id').primaryKey(),
	invoiceId: text('invoice_id').references(() => Invoice.id),
	paymentDate: text('payment_date'),
	amountPaid: real('amount_paid'),
	createdAt: text('timestamp').default(sql`(current_timestamp)`),
});

export const Note = sqliteTable('Notes', {
	id: text('id').primaryKey(),
	invoiceId: text('invoice_id').references(() => Invoice.id),
	noteDate: text('note_date'),
	noteText: text('note_text'),
	createdAt: text('timestamp').default(sql`(current_timestamp)`),
});

export const EstimateNotes = sqliteTable('Estimate_Notes', {
	id: text('id').primaryKey(),
	estimateId: text('estimate_id').references(() => Estimate.id),
	noteDate: text('note_date'),
	noteText: text('note_text'),
	createdAt: text('timestamp').default(sql`(current_timestamp)`),
});
export const EstimateTerms = sqliteTable('Estimate_Terms', {
	id: text('id').primaryKey(),
	estimateId: text('estimate_id').references(() => Estimate.id),
	termText: text('term_text'),
	createdAt: text('timestamp').default(sql`(current_timestamp)`),
});

export const Categories = sqliteTable('Categories', {
	id: text('id').primaryKey(),
	name: text('name'),
	type: text('type'),
});

export const Transactions = sqliteTable('Transactions', {
	id: text('id').primaryKey(),
	userId: text('user_id'),
	categoryId: text('category_id'),
	amount: real('amount'),
	date: text('date'),
	createdAt: text('timestamp').default(sql`(current_timestamp)`),
	currency: text('currency').default('GBP'),
	description: text('description').default(''),
	type: text('type'),
});

export const appSettings = sqliteTable('app_settings', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	userId: text('user_id').references(() => User.id),
	defaultPaymentTerms: integer('default_payment_terms').default(30),
	defaultVatRate: real('default_vat_rate').default(20),
	invoicePrefix: text('invoice_prefix').default('INV'),
	nextInvoiceNumber: integer('next_invoice_number').default(1),
	estimatePrefix: text('estimate_prefix').default('EST'),
	nextEstimateNumber: integer('next_estimate_number').default(1),
	currency: text('currency').default('GBP'),
	dateFormat: text('date_format').default('DD/MM/YYYY'),
	numberFormat: text('number_format').default('en-GB'),
	autoCalculateQuarters: integer('auto_calculate_quarters', {
		mode: 'boolean',
	}).default(true),
	quarterlyTaxEnabled: integer('quarterly_tax_enabled', {
		mode: 'boolean',
	}).default(true),
	quarterStartMonths: text('quarter_start_months').default('1,4,7,10'),
	quarterlyTaxReminderDays: integer('quarterly_tax_reminder_days').default(7),
	financialYearStartMonth: integer('financial_year_start_month').default(1),
	financialYearStartDay: integer('financial_year_start_day').default(1),
	financialYearEndMonth: integer('financial_year_end_month').default(12),
	financialYearEndDay: integer('financial_year_end_day').default(31),
	taxScheme: text('tax_scheme').default('standard'),
	defaultTaxCategory: text('default_tax_category').default('self-employed'),
	reminderEmailEnabled: integer('reminder_email_enabled', {
		mode: 'boolean',
	}).default(true),
	reminderDaysBeforeDue: integer('reminder_days_before_due').default(3),
	language: text('language').default('en-GB'),
	theme: text('theme').default('system'),
	logoUrl: text('logo_url'),
	createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
	updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});
