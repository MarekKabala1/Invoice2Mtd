import { eq, and, between, desc } from 'drizzle-orm';
import { Transactions } from './schema';
import { ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';

export const getTransactionsByDateRange = async (db: ExpoSQLiteDatabase<Record<string, never>>, startDate: Date, endDate: Date) => {
  return await db
    .select()
    .from(Transactions)
    .where(
      and(
        between(Transactions.date, startDate.toISOString(), endDate.toISOString())
      )
    )
    .orderBy(desc(Transactions.date));
};

export const addTransaction = async (db: ExpoSQLiteDatabase<Record<string, never>>, transaction: any) => {
  return await db.insert(Transactions).values(transaction);
};