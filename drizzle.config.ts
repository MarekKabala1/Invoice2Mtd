import type { Config } from 'drizzle-kit';

// NOTE: drizzle-kit studio requires better-sqlite3 or @libsql/client.
// Those packages are not installed. Use npx drizzle-kit generate for
// migrations. For database inspection, use expo-drizzle-studio-plugin
// in the app (dev mode) instead.
export default {
  schema: './db/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  driver: 'expo',
} satisfies Config;
