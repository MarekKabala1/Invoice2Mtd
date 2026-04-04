DROP INDEX IF EXISTS "idx_documents_local_id";--> statement-breakpoint
ALTER TABLE "documents" ALTER COLUMN "local_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "documents" ALTER COLUMN "tax_year" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "documents" ALTER COLUMN "quarter" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "transaction_id" uuid;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "invoice_id" uuid;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "notes" text;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "documents" ADD CONSTRAINT "documents_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "documents" ADD CONSTRAINT "documents_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_documents_local_id" ON "documents" USING btree ("local_id");--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_local_id_unique" UNIQUE("local_id");