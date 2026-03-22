CREATE TABLE `Bank_Details` (
	`Id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`Account_Name` text,
	`Sort_Code` text,
	`Account_Number` text,
	`Bank_Name` text,
	`timestamp` text DEFAULT (current_timestamp),
	FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `Categories` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text,
	`type` text
);
--> statement-breakpoint
CREATE TABLE `Customer` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text,
	`address` text,
	`email_address` text,
	`phone_number` text,
	`timestamp` text DEFAULT (current_timestamp)
);
--> statement-breakpoint
CREATE TABLE `Estimate` (
	`id` text PRIMARY KEY NOT NULL,
	`customer_id` text,
	`user_id` text,
	`estimate_date` text,
	`estimate_end_time` text,
	`currency` text DEFAULT 'GBP',
	`discount` real,
	`tax_rate` real,
	`amount_before_tax` real,
	`amount_after_tax` real,
	`taxValue` integer DEFAULT false,
	`is_accepted` integer DEFAULT false,
	FOREIGN KEY (`customer_id`) REFERENCES `Customer`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `Estimate_Notes` (
	`id` text PRIMARY KEY NOT NULL,
	`estimate_id` text,
	`note_date` text,
	`note_text` text,
	`timestamp` text DEFAULT (current_timestamp),
	FOREIGN KEY (`estimate_id`) REFERENCES `Estimate`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `Estimate_Terms` (
	`id` text PRIMARY KEY NOT NULL,
	`estimate_id` text,
	`term_text` text,
	`timestamp` text DEFAULT (current_timestamp),
	FOREIGN KEY (`estimate_id`) REFERENCES `Estimate`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `Invoice` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`customer_id` text,
	`invoice_date` text,
	`due_date` text,
	`amount_after_tax` real,
	`amount_before_tax` real,
	`tax_rate` real,
	`pdf_path` text,
	`currency` text DEFAULT 'GBP',
	`timestamp` text DEFAULT (current_timestamp),
	`taxValue` integer DEFAULT false,
	`is_payed` integer DEFAULT false,
	`discount` real,
	FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`customer_id`) REFERENCES `Customer`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `Mtd_Annual_Summary` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`tax_year` text NOT NULL,
	`final_declaration_deadline` text NOT NULL,
	`total_turnover` real DEFAULT 0 NOT NULL,
	`total_allowable_expenses` real DEFAULT 0 NOT NULL,
	`net_profit` real DEFAULT 0 NOT NULL,
	`estimated_taxable_profit` real DEFAULT 0 NOT NULL,
	`estimated_income_tax` real DEFAULT 0 NOT NULL,
	`estimated_ni` real DEFAULT 0 NOT NULL,
	`estimated_total_tax` real DEFAULT 0 NOT NULL,
	`personal_allowance_used` real DEFAULT 12570 NOT NULL,
	`status` text DEFAULT 'in_progress' NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `Mtd_Quarterly_Summary` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`tax_year` text NOT NULL,
	`quarter` integer NOT NULL,
	`period_start` text NOT NULL,
	`period_end` text NOT NULL,
	`submission_deadline` text NOT NULL,
	`total_turnover` real DEFAULT 0 NOT NULL,
	`cost_of_goods_allowable` real DEFAULT 0 NOT NULL,
	`employee_costs` real DEFAULT 0 NOT NULL,
	`premises_running_costs` real DEFAULT 0 NOT NULL,
	`maintenance_costs` real DEFAULT 0 NOT NULL,
	`advertising_costs` real DEFAULT 0 NOT NULL,
	`interest_on_bank_loans` real DEFAULT 0 NOT NULL,
	`professional_fees` real DEFAULT 0 NOT NULL,
	`depreciation` real DEFAULT 0 NOT NULL,
	`other_allowable_expenses` real DEFAULT 0 NOT NULL,
	`business_entertainment_costs` real DEFAULT 0 NOT NULL,
	`other_disallowable_expenses` real DEFAULT 0 NOT NULL,
	`total_allowable_expenses` real DEFAULT 0 NOT NULL,
	`net_profit` real DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'not_started' NOT NULL,
	`last_calculated_at` text,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `Mtd_Transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`invoice_id` text,
	`transaction_id` text,
	`date` text NOT NULL,
	`description` text NOT NULL,
	`amount` real NOT NULL,
	`type` text NOT NULL,
	`category` text NOT NULL,
	`tax_year` text NOT NULL,
	`quarter` integer NOT NULL,
	`currency` text DEFAULT 'GBP',
	`receipt_ref` text,
	`notes` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`invoice_id`) REFERENCES `Invoice`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`transaction_id`) REFERENCES `Transactions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `Notes` (
	`id` text PRIMARY KEY NOT NULL,
	`invoice_id` text,
	`note_date` text,
	`note_text` text,
	`timestamp` text DEFAULT (current_timestamp),
	FOREIGN KEY (`invoice_id`) REFERENCES `Invoice`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `Payments` (
	`id` text PRIMARY KEY NOT NULL,
	`invoice_id` text,
	`payment_date` text,
	`amount_paid` real,
	`timestamp` text DEFAULT (current_timestamp),
	FOREIGN KEY (`invoice_id`) REFERENCES `Invoice`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `Transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`category_id` text,
	`amount` real,
	`date` text,
	`timestamp` text DEFAULT (current_timestamp),
	`currency` text DEFAULT 'GBP',
	`description` text DEFAULT '',
	`type` text
);
--> statement-breakpoint
CREATE TABLE `User` (
	`id` text PRIMARY KEY NOT NULL,
	`full_name` text,
	`address` text,
	`email_address` text,
	`phone_number` text,
	`UTR_number` text,
	`NIN_number` text,
	`timestamp` text DEFAULT (current_timestamp),
	`is_admin` integer DEFAULT false
);
--> statement-breakpoint
CREATE TABLE `Work_Information` (
	`id` text PRIMARY KEY NOT NULL,
	`invoice_id` text,
	`description_of_work` text,
	`unit_price` real,
	`day_of_week` text,
	`total_to_pay_minus_tax` real,
	`timestamp` text DEFAULT (current_timestamp),
	FOREIGN KEY (`invoice_id`) REFERENCES `Invoice`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `app_settings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text,
	`default_payment_terms` integer DEFAULT 30,
	`default_vat_rate` real DEFAULT 20,
	`invoice_prefix` text DEFAULT 'INV',
	`next_invoice_number` integer DEFAULT 1,
	`estimate_prefix` text DEFAULT 'EST',
	`next_estimate_number` integer DEFAULT 1,
	`currency` text DEFAULT 'GBP',
	`date_format` text DEFAULT 'DD/MM/YYYY',
	`number_format` text DEFAULT 'en-GB',
	`auto_calculate_quarters` integer DEFAULT true,
	`quarterly_tax_enabled` integer DEFAULT true,
	`quarter_start_months` text DEFAULT '1,4,7,10',
	`quarterly_tax_reminder_days` integer DEFAULT 7,
	`financial_year_start_month` integer DEFAULT 1,
	`financial_year_start_day` integer DEFAULT 1,
	`financial_year_end_month` integer DEFAULT 12,
	`financial_year_end_day` integer DEFAULT 31,
	`tax_scheme` text DEFAULT 'standard',
	`default_tax_category` text DEFAULT 'self-employed',
	`reminder_email_enabled` integer DEFAULT true,
	`reminder_days_before_due` integer DEFAULT 3,
	`language` text DEFAULT 'en-GB',
	`theme` text DEFAULT 'system',
	`logo_url` text,
	`apply_tax_by_default` integer DEFAULT true,
	`default_notes` text,
	`tax_rates_json` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `Customer_email_address_unique` ON `Customer` (`email_address`);--> statement-breakpoint
CREATE INDEX `invoice_date_idx` ON `Invoice` (`invoice_date`);--> statement-breakpoint
CREATE INDEX `is_payed_idx` ON `Invoice` (`is_payed`);--> statement-breakpoint
CREATE UNIQUE INDEX `mtd_qs_year_quarter_idx` ON `Mtd_Quarterly_Summary` (`user_id`,`tax_year`,`quarter`);--> statement-breakpoint
CREATE INDEX `mtd_txn_year_quarter_idx` ON `Mtd_Transactions` (`tax_year`,`quarter`);--> statement-breakpoint
CREATE INDEX `txn_date_idx` ON `Transactions` (`date`);--> statement-breakpoint
CREATE INDEX `txn_type_idx` ON `Transactions` (`type`);--> statement-breakpoint
CREATE UNIQUE INDEX `User_email_address_unique` ON `User` (`email_address`);