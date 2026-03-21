import { db } from '@/db/config';
import { appSettings } from '@/db/schema';
import { AppSettingsType } from '@/db/zodSchema';
import { eq } from 'drizzle-orm';

export async function getAppSettingsFromDb(): Promise<AppSettingsType | null> {
  const rows = await db.select().from(appSettings).limit(1);
  if (rows && rows.length > 0) return rows[0] as AppSettingsType;
  return null;
}

export async function updateAppSettingsInDb(id: number, values: Partial<AppSettingsType>): Promise<void> {
  await db.update(appSettings).set(values).where(eq(appSettings.id, id));
}

export async function insertAppSettingsInDb(values: Partial<AppSettingsType>): Promise<void> {
  await db.insert(appSettings).values(values);
}

export async function deleteAppSettingsInDb(id: number): Promise<void> {
  await db.delete(appSettings).where(eq(appSettings.id, id));
}
