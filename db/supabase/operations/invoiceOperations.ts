/**
 * db/supabase/operations/invoiceOperations.ts
 *
 * Supabase operations for invoice sync. Handles upsert of invoices with
 * their associated line items (WorkInformation).
 *
 * Used by: db/supabase/sync/invoiceSync.ts
 *
 * Supabase table: invoices, invoice_items
 */

import { supabase } from '../supabase';
import type {
  SupabaseInvoice,
  SupabaseInvoiceInsert,
  SupabaseInvoiceItem,
  SupabaseInvoiceItemInsert,
} from '../types';

/**
 * Uploads a single invoice with optional items to Supabase.
 * Items are upserted alongside the invoice to maintain referential integrity.
 */
export async function uploadInvoice(
  invoice: SupabaseInvoiceInsert,
  items?: SupabaseInvoiceItemInsert[]
): Promise<SupabaseInvoice> {
  const { data: invoiceData, error: invoiceError } = await supabase
    .from('invoices')
    .upsert(invoice, { onConflict: 'localId' })
    .select()
    .single();

  if (invoiceError) {
    throw new Error(`Failed to upload invoice: ${invoiceError.message}`);
  }

  if (!invoiceData) {
    throw new Error('Invoice upsert returned no data');
  }

  if (items && items.length > 0) {
    const itemsWithInvoiceId = items.map((item) => ({
      ...item,
      invoiceId: invoiceData.id,
    }));

    const { error: itemsError } = await supabase
      .from('invoice_items')
      .upsert(itemsWithInvoiceId, { onConflict: 'localId' });

    if (itemsError) {
      throw new Error(`Failed to upload invoice items: ${itemsError.message}`);
    }
  }

  return invoiceData as SupabaseInvoice;
}

/**
 * Uploads multiple invoices with their items to Supabase in a batch.
 * Each invoice's items are upserted with the corresponding invoice ID.
 */
export async function uploadInvoices(
  invoices: SupabaseInvoiceInsert[]
): Promise<SupabaseInvoice[]> {
  if (invoices.length === 0) {
    return [];
  }

  const { data: invoiceData, error: invoiceError } = await supabase
    .from('invoices')
    .upsert(invoices, { onConflict: 'localId' })
    .select();

  if (invoiceError) {
    throw new Error(`Failed to upload invoices: ${invoiceError.message}`);
  }

  if (!invoiceData || invoiceData.length === 0) {
    return [];
  }

  return invoiceData as SupabaseInvoice[];
}

/**
 * Retrieves all invoices for a specific user from Supabase.
 */
export async function getInvoicesByUser(
  userId: string
): Promise<SupabaseInvoice[]> {
  const { data, error } = await supabase
    .from('invoices')
    .select('*, items:invoice_items(*)')
    .eq('userId', userId)
    .order('createdAt', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch invoices: ${error.message}`);
  }

  return (data ?? []) as SupabaseInvoice[];
}

/**
 * Retrieves all invoices for a specific user within a given tax quarter.
 * Note: This filters by invoiceDate falling within the quarter's date range.
 * For precise MTD quarterly reporting, use getInvoicesByQuarter from the MTD hooks.
 */
export async function getInvoicesByQuarter(
  userId: string,
  taxYear: string,
  quarter: number
): Promise<SupabaseInvoice[]> {
  const [startYear, endYear] = taxYear.split('-');
  const quarterStartMonth: Record<number, number> = {
    1: 3,
    2: 5,
    3: 8,
    4: 11,
  };
  const quarterEndMonth: Record<number, number> = {
    1: 4,
    2: 6,
    3: 9,
    4: 2,
  };

  const startMonth = quarterStartMonth[quarter];
  const endMonth = quarterEndMonth[quarter];

  let startDate: Date;
  let endDate: Date;

  if (quarter === 1) {
    startDate = new Date(parseInt(startYear, 10), startMonth, 6);
    endDate = new Date(parseInt(startYear, 10), endMonth, 5);
  } else if (quarter === 4) {
    startDate = new Date(parseInt(endYear, 10), startMonth, 6);
    endDate = new Date(parseInt(endYear, 10) + 1, endMonth, 5);
  } else {
    startDate = new Date(parseInt(startYear, 10), startMonth, 6);
    endDate = new Date(parseInt(startYear, 10), endMonth, 5);
  }

  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('invoices')
    .select('*, items:invoice_items(*)')
    .eq('userId', userId)
    .gte('invoiceDate', startDateStr)
    .lte('invoiceDate', endDateStr)
    .order('invoiceDate', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch quarterly invoices: ${error.message}`);
  }

  return (data ?? []) as SupabaseInvoice[];
}

/**
 * Deletes an invoice and its associated items from Supabase.
 * Items are deleted via cascade or manually for safety.
 */
export async function deleteInvoice(id: string): Promise<void> {
  const { error: itemsError } = await supabase
    .from('invoice_items')
    .delete()
    .eq('invoiceId', id);

  if (itemsError) {
    throw new Error(`Failed to delete invoice items: ${itemsError.message}`);
  }

  const { error: invoiceError } = await supabase
    .from('invoices')
    .delete()
    .eq('id', id);

  if (invoiceError) {
    throw new Error(`Failed to delete invoice: ${invoiceError.message}`);
  }
}

/**
 * Retrieves a single invoice with its items by local ID.
 */
export async function getInvoiceByLocalId(
  localId: string
): Promise<SupabaseInvoice | null> {
  const { data, error } = await supabase
    .from('invoices')
    .select('*, items:invoice_items(*)')
    .eq('localId', localId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to fetch invoice: ${error.message}`);
  }

  return data as SupabaseInvoice;
}
