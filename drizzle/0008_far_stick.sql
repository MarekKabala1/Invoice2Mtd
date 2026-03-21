CREATE INDEX `invoice_date_idx` ON `Invoice` (`invoice_date`);--> statement-breakpoint
CREATE INDEX `is_payed_idx` ON `Invoice` (`is_payed`);--> statement-breakpoint
CREATE INDEX `mtd_txn_year_quarter_idx` ON `Mtd_Transactions` (`tax_year`,`quarter`);--> statement-breakpoint
CREATE INDEX `txn_date_idx` ON `Transactions` (`date`);--> statement-breakpoint
CREATE INDEX `txn_type_idx` ON `Transactions` (`type`);