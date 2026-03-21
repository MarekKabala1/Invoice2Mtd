import { z } from 'zod';
import { db } from './config';
import { Invoice } from '@/db/schema';
import { invoiceSchema } from './zodSchema';

type InvoiceType = z.infer<typeof invoiceSchema>;

export async function getAllInvoices(): Promise<InvoiceType[]> {
  const invoices = await db.select().from(Invoice);
  return invoices as unknown as InvoiceType[];
}
