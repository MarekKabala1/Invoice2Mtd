/**
 * runMigrations.ts
 *
 * Runs SQLite migrations for the local database.
 * Creates tables that don't exist yet.
 */

import { db } from './config';
import { sql } from 'drizzle-orm';

export const runMigrations = async (): Promise<void> => {
  try {
    // Create Documents table using raw SQL
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS "Documents" (
        "id" text PRIMARY KEY NOT NULL,
        "user_id" text,
        "transaction_id" text,
        "invoice_id" text,
        "file_name" text NOT NULL,
        "file_path" text NOT NULL,
        "file_type" text NOT NULL,
        "document_type" text NOT NULL,
        "tax_year" text,
        "quarter" integer,
        "document_date" text,
        "notes" text,
        "timestamp" text DEFAULT (current_timestamp)
      )
    `);
    
    // Create indexes
    await db.run(sql`CREATE INDEX IF NOT EXISTS "doc_type_idx" ON "Documents"("document_type")`);
    await db.run(sql`CREATE INDEX IF NOT EXISTS "doc_tax_year_idx" ON "Documents"("tax_year")`);
    
    console.log('Migrations completed successfully');
  } catch (error) {
    console.error('Migration error:', error);
    throw error;
  }
};

export const initializeDatabase = async (): Promise<void> => {
  try {
    await runMigrations();
  } catch (error) {
    console.error('Database initialization error:', error);
  }
};
