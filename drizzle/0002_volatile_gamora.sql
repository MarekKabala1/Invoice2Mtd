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
