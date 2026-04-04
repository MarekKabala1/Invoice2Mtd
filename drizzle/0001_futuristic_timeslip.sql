CREATE TABLE `Documents` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`transaction_id` text,
	`invoice_id` text,
	`file_name` text NOT NULL,
	`file_path` text NOT NULL,
	`file_type` text NOT NULL,
	`document_type` text NOT NULL,
	`tax_year` text,
	`quarter` integer,
	`document_date` text,
	`notes` text,
	`timestamp` text DEFAULT (current_timestamp),
	FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`transaction_id`) REFERENCES `Transactions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`invoice_id`) REFERENCES `Invoice`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `doc_type_idx` ON `Documents` (`document_type`);--> statement-breakpoint
CREATE INDEX `doc_tax_year_idx` ON `Documents` (`tax_year`);