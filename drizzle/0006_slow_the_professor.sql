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
ALTER TABLE `app_settings` ADD `apply_tax_by_default` integer DEFAULT true;--> statement-breakpoint
ALTER TABLE `app_settings` ADD `default_notes` text;--> statement-breakpoint
CREATE UNIQUE INDEX `mtd_qs_year_quarter_idx` ON `Mtd_Quarterly_Summary` (`user_id`,`tax_year`,`quarter`);