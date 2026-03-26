import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from './config';
import { Invoice } from '@/db/schema';
import { invoiceSchema } from './zodSchema';

type InvoiceType = z.infer<typeof invoiceSchema>;

export async function getAllInvoices(): Promise<InvoiceType[]> {
  const invoices = await db.select().from(Invoice);
  return invoices as unknown as InvoiceType[];
}

/** Unpaid invoices for Home tab “at a glance” and MTD gap messaging. */
export async function getUnpaidInvoicesTotals(): Promise<{ count: number; total: number }> {
  const rows = await db.select().from(Invoice).where(eq(Invoice.isPayed, false));
  const total = rows.reduce((s, r) => s + (r.amountAfterTax ?? 0), 0);
  return { count: rows.length, total };
}
