import { db } from '@/db/config';
import { appSettings, User } from '@/db/schema';
import { AppSettingsType } from '@/db/zodSchema';
import { eq } from 'drizzle-orm';

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
    console.error('Failed to update app settings:', e);
  }
}

export async function insertAppSettingsInDb(values: Partial<AppSettingsType>): Promise<void> {
  try {
    await db.insert(appSettings).values(values);
  } catch (e) {
    console.error('Failed to insert app settings:', e);
  }
}

export async function deleteAppSettingsInDb(id: number): Promise<void> {
  try {
    await db.delete(appSettings).where(eq(appSettings.id, id));
  } catch (e) {
    console.error('Failed to delete app settings:', e);
  }
}
