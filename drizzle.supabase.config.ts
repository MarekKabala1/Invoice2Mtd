import type { Config } from 'drizzle-kit';

/**
 * Drizzle config for Supabase PostgreSQL database.
 * 
 * Usage:
 *   npx drizzle-kit push --config drizzle.supabase.config.ts
 *   npx drizzle-kit generate --config drizzle.supabase.config.ts
 *   npx drizzle-kit studio --config drizzle.supabase.config.ts
 * 
 * Note: Requires POSTGRES_URL environment variable:
 *   POSTGRES_URL=postgresql://user:password@host:5432/database
 */

export default {
  schema: './db/supabase/supabaseSchema.ts',
  out: './drizzle/supabase',
  dialect: 'postgresql',
} satisfies Config;
