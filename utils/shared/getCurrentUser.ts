/**
 * getCurrentUser.ts
 *
 * Gets the current user ID from the User table. Since this is a sole
 * trader app, there's only one user. If no user exists, returns null.
 * Callers should handle the null case by prompting user setup.
 *
 * Depends on: db/config.ts, db/schema.ts
 * Used by: hooks/useMtdTransaction.ts, components/TransactionForm.tsx,
 *          app/(stack)/addMtdTransaction.tsx, etc.
 */

import { db } from '@/db/config';
import { User } from '@/db/schema';

export async function getCurrentUserId(): Promise<string | null> {
  const users = await db.select({ id: User.id }).from(User).limit(1);
  return users.length > 0 ? users[0].id : null;
}
