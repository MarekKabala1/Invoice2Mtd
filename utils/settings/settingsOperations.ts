import { db } from '@/db/config';
import { appSettings, User } from '@/db/schema';
import { AppSettingsType } from '@/db/zodSchema';
import { eq } from 'drizzle-orm';
import { captureException } from '@/utils/shared/sentry';

export async function getAppSettingsFromDb(userId?: string): Promise<AppSettingsType | null> {
  try {
    const baseQuery = db.select().from(appSettings);
    const query = userId
      ? baseQuery.where(eq(appSettings.userId, userId))
      : baseQuery;
    const rows = await query.limit(1);
    if (rows && rows.length > 0) return rows[0] as AppSettingsType;
    return null;
  } catch {
    // Table may not exist yet before migrations run
    return null;
  }
}

export async function getAllUsers() {
  try {
    return await db.select().from(User);
  } catch {
    return [];
  }
}

export async function updateAppSettingsInDb(id: number, values: Partial<AppSettingsType>): Promise<void> {
  try {
    await db.update(appSettings).set(values).where(eq(appSettings.id, id));
  } catch (e) {
    captureException(e instanceof Error ? e : new Error(String(e)), { action: 'updating app settings' });
  }
}

export async function insertAppSettingsInDb(values: Partial<AppSettingsType>): Promise<void> {
  try {
    await db.insert(appSettings).values(values);
  } catch (e) {
    captureException(e instanceof Error ? e : new Error(String(e)), { action: 'inserting app settings' });
  }
}

export async function deleteAppSettingsInDb(id: number): Promise<void> {
  try {
    await db.delete(appSettings).where(eq(appSettings.id, id));
  } catch (e) {
    captureException(e instanceof Error ? e : new Error(String(e)), { action: 'deleting app settings' });
  }
}
