CREATE TABLE IF NOT EXISTS "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"local_id" text NOT NULL,
	"user_id" uuid,
	"name" text NOT NULL,
	"email" text,
	"phone" text,
	"address" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"synced_at" timestamp,
	"sync_status" text DEFAULT 'pending',
	CONSTRAINT "customers_local_id_unique" UNIQUE("local_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"local_id" text,
	"user_id" uuid,
	"file_name" text NOT NULL,
	"storage_path" text NOT NULL,
	"file_type" text NOT NULL,
	"document_type" text NOT NULL,
	"tax_year" text NOT NULL,
	"quarter" integer NOT NULL,
	"document_date" text,
	"created_at" timestamp DEFAULT now(),
	"synced_at" timestamp,
	"sync_status" text DEFAULT 'pending'
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "estimates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"local_id" text NOT NULL,
	"user_id" uuid,
	"customer_id" uuid,
	"estimate_date" text,
	"estimate_end_time" text,
	"discount" real,
	"tax_rate" real,
	"amount_before_tax" real,
	"amount_after_tax" real,
	"tax_value" boolean DEFAULT false,
	"is_accepted" boolean DEFAULT false,
	"currency" text DEFAULT 'GBP',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"synced_at" timestamp,
	"sync_status" text DEFAULT 'pending',
	CONSTRAINT "estimates_local_id_unique" UNIQUE("local_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "invoice_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"local_id" text NOT NULL,
	"invoice_id" uuid,
	"description" text,
	"unit_price" real,
	"quantity" real,
	"date" text,
	"total_to_pay_minus_tax" real,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"synced_at" timestamp,
	"sync_status" text DEFAULT 'pending',
	CONSTRAINT "invoice_items_local_id_unique" UNIQUE("local_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"local_id" text NOT NULL,
	"user_id" uuid,
	"customer_id" uuid,
	"invoice_number" text,
	"invoice_date" text,
	"due_date" text,
	"amount_before_tax" real,
	"amount_after_tax" real,
	"tax_rate" real,
	"tax_value" boolean DEFAULT false,
	"is_payed" boolean DEFAULT false,
	"currency" text DEFAULT 'GBP',
	"discount" real,
	"pdf_path" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"synced_at" timestamp,
	"sync_status" text DEFAULT 'pending',
	CONSTRAINT "invoices_local_id_unique" UNIQUE("local_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "mtd_annual_summaries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"local_id" text NOT NULL,
	"user_id" uuid,
	"tax_year" text NOT NULL,
	"final_declaration_deadline" text NOT NULL,
	"total_turnover" real DEFAULT 0,
	"total_allowable_expenses" real DEFAULT 0,
	"net_profit" real DEFAULT 0,
	"estimated_taxable_profit" real DEFAULT 0,
	"estimated_income_tax" real DEFAULT 0,
	"estimated_ni" real DEFAULT 0,
	"estimated_total_tax" real DEFAULT 0,
	"personal_allowance_used" real DEFAULT 12570,
	"status" text DEFAULT 'in_progress',
	"updated_at" timestamp DEFAULT now(),
	"synced_at" timestamp,
	"sync_status" text DEFAULT 'pending',
	CONSTRAINT "mtd_annual_summaries_local_id_unique" UNIQUE("local_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "mtd_quarterly_summaries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"local_id" text NOT NULL,
	"user_id" uuid,
	"tax_year" text NOT NULL,
	"quarter" integer NOT NULL,
	"period_start" text NOT NULL,
	"period_end" text NOT NULL,
	"submission_deadline" text NOT NULL,
	"total_turnover" real DEFAULT 0,
	"cost_of_goods_allowable" real DEFAULT 0,
	"employee_costs" real DEFAULT 0,
	"premises_running_costs" real DEFAULT 0,
	"maintenance_costs" real DEFAULT 0,
	"advertising_costs" real DEFAULT 0,
	"interest_on_bank_loans" real DEFAULT 0,
	"professional_fees" real DEFAULT 0,
	"depreciation" real DEFAULT 0,
	"other_allowable_expenses" real DEFAULT 0,
	"business_entertainment_costs" real DEFAULT 0,
	"other_disallowable_expenses" real DEFAULT 0,
	"total_allowable_expenses" real DEFAULT 0,
	"net_profit" real DEFAULT 0,
	"status" text DEFAULT 'not_started',
	"last_calculated_at" timestamp,
	"updated_at" timestamp DEFAULT now(),
	"synced_at" timestamp,
	"sync_status" text DEFAULT 'pending',
	CONSTRAINT "mtd_quarterly_summaries_local_id_unique" UNIQUE("local_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "mtd_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"local_id" text NOT NULL,
	"user_id" uuid,
	"invoice_id" uuid,
	"transaction_id" uuid,
	"date" text NOT NULL,
	"description" text NOT NULL,
	"amount" real NOT NULL,
	"type" text NOT NULL,
	"category" text NOT NULL,
	"tax_year" text NOT NULL,
	"quarter" integer NOT NULL,
	"currency" text DEFAULT 'GBP',
	"receipt_ref" text,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"synced_at" timestamp,
	"sync_status" text DEFAULT 'pending',
	CONSTRAINT "mtd_transactions_local_id_unique" UNIQUE("local_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sync_metadata" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"last_sync" timestamp,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"local_id" text NOT NULL,
	"user_id" uuid,
	"category_id" text,
	"amount" real NOT NULL,
	"date" text NOT NULL,
	"description" text,
	"type" text,
	"currency" text DEFAULT 'GBP',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"synced_at" timestamp,
	"sync_status" text DEFAULT 'pending',
	CONSTRAINT "transactions_local_id_unique" UNIQUE("local_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"local_id" text NOT NULL,
	"email" text,
	"full_name" text,
	"address" text,
	"phone_number" text,
	"utr_number" text,
	"nin_number" text,
	"is_admin" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"synced_at" timestamp,
	"sync_status" text DEFAULT 'pending',
	CONSTRAINT "users_local_id_unique" UNIQUE("local_id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "customers" ADD CONSTRAINT "customers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "documents" ADD CONSTRAINT "documents_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "estimates" ADD CONSTRAINT "estimates_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "estimates" ADD CONSTRAINT "estimates_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "invoices" ADD CONSTRAINT "invoices_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "invoices" ADD CONSTRAINT "invoices_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "mtd_annual_summaries" ADD CONSTRAINT "mtd_annual_summaries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "mtd_quarterly_summaries" ADD CONSTRAINT "mtd_quarterly_summaries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "mtd_transactions" ADD CONSTRAINT "mtd_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "mtd_transactions" ADD CONSTRAINT "mtd_transactions_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "mtd_transactions" ADD CONSTRAINT "mtd_transactions_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sync_metadata" ADD CONSTRAINT "sync_metadata_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_customers_user_id" ON "customers" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_customers_local_id" ON "customers" USING btree ("local_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_documents_user_quarter" ON "documents" USING btree ("user_id","tax_year","quarter");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_documents_local_id" ON "documents" USING btree ("local_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_estimates_user_id" ON "estimates" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_estimates_local_id" ON "estimates" USING btree ("local_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_invoice_items_invoice_id" ON "invoice_items" USING btree ("invoice_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_invoice_items_local_id" ON "invoice_items" USING btree ("local_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_invoices_user_id" ON "invoices" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_invoices_customer_id" ON "invoices" USING btree ("customer_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_invoices_local_id" ON "invoices" USING btree ("local_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_invoices_invoice_date" ON "invoices" USING btree ("invoice_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_invoices_is_payed" ON "invoices" USING btree ("is_payed");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_mtd_annual_user_year" ON "mtd_annual_summaries" USING btree ("user_id","tax_year");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_mtd_qs_user_year_quarter" ON "mtd_quarterly_summaries" USING btree ("user_id","tax_year","quarter");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_mtd_transactions_user_id" ON "mtd_transactions" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_mtd_transactions_local_id" ON "mtd_transactions" USING btree ("local_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_mtd_transactions_year_quarter" ON "mtd_transactions" USING btree ("tax_year","quarter");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_mtd_transactions_invoice_id" ON "mtd_transactions" USING btree ("invoice_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_transactions_user_id" ON "transactions" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_transactions_local_id" ON "transactions" USING btree ("local_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_transactions_date" ON "transactions" USING btree ("date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_transactions_type" ON "transactions" USING btree ("type");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_users_email" ON "users" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_users_local_id" ON "users" USING btree ("local_id");
--> statement-breakpoint
-- Row Level Security (RLS)
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "customers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "invoices" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "invoice_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "estimates" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "transactions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "mtd_transactions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "mtd_quarterly_summaries" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "mtd_annual_summaries" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "documents" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "sync_metadata" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
-- RLS Policies (users can only access their own data)
CREATE POLICY "users_own_data" ON "users" FOR ALL USING (auth.uid() = id);
CREATE POLICY "customers_own_data" ON "customers" FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "invoices_own_data" ON "invoices" FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "invoice_items_own_data" ON "invoice_items" FOR ALL USING (EXISTS (SELECT 1 FROM "invoices" WHERE "invoices".id = "invoice_items".invoice_id AND "invoices".user_id = auth.uid()));
CREATE POLICY "estimates_own_data" ON "estimates" FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "transactions_own_data" ON "transactions" FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "mtd_transactions_own_data" ON "mtd_transactions" FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "mtd_quarterly_summaries_own_data" ON "mtd_quarterly_summaries" FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "mtd_annual_summaries_own_data" ON "mtd_annual_summaries" FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "documents_own_data" ON "documents" FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "sync_metadata_own_data" ON "sync_metadata" FOR ALL USING (auth.uid() = user_id);