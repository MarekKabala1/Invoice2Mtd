/**
 * syncEngine.ts
 *
 * Main sync orchestrator for Supabase data sync.
 * Reads from local SQLite, writes to Supabase.
 */

import { supabase, getCurrentUser } from '../supabase';
import type { SyncResult, SyncOptions, SyncProgress, SyncError } from './sync.types';
import { TABLE_SYNC_ORDER } from './sync.types';
import {
  getQueue,
  markAsSynced,
  markAsFailed,
  getPendingCount,
  addToQueue,
  clearQueue,
} from './syncQueue';
import * as db from '@/db/schema';
import { db as localDb } from '@/db/config';
import { eq, and, isNull } from 'drizzle-orm';

interface SyncContext {
  authUserId: string;
  localUserId: string;
  supabaseUserId: string | null;
  customerIdMap: Map<string, string>;
  invoiceIdMap: Map<string, string>;
  alreadySynced: Set<string>;
}

const checkAlreadySynced = async (
  supabaseTable: string,
  localId: string
): Promise<boolean> => {
  const { data } = await supabase
    .from(supabaseTable as any)
    .select('local_id')
    .eq('local_id', localId)
    .maybeSingle();
  
  return !!data;
};

const getAuthUserId = async (): Promise<string | null> => {
  const { user } = await getCurrentUser();
  return user?.id ?? null;
};

export const checkConnection = async (): Promise<boolean> => {
  try {
    const { error } = await supabase.from('users').select('id').limit(1);
    return !error;
  } catch {
    return false;
  }
};

export const getLastSyncTime = async (supabaseUserId: string | null): Promise<string | null> => {
  if (!supabaseUserId) return null;
  
  try {
    const { data, error } = await supabase
      .from('sync_metadata')
      .select('last_sync')
      .eq('user_id', supabaseUserId)
      .single();
    
    if (error) return null;
    return data?.last_sync ?? null;
  } catch {
    return null;
  }
};

export const setLastSyncTime = async (supabaseUserId: string): Promise<void> => {
  if (!supabaseUserId) return;
  
  const now = new Date().toISOString();
  
  await supabase.from('sync_metadata').upsert({
    user_id: supabaseUserId,
    last_sync: now,
    updated_at: now,
  }, {
    onConflict: 'user_id',
  });
};

const createSyncResult = (
  success: number,
  failed: number,
  skipped: number,
  errors: SyncError[],
  startTime: number
): SyncResult => ({
  success,
  failed,
  skipped,
  errors,
  duration: Date.now() - startTime,
  timestamp: new Date().toISOString(),
});

const getOrCreateSupabaseUserId = async (
  authUserId: string,
  localUserId: string
): Promise<string | null> => {
  const existing = await localDb.select().from(db.User).where(eq(db.User.id, localUserId)).limit(1);
  if (!existing[0]) return null;

  const localUser = existing[0];
  
  // First check if user exists by auth_user_id
  const { data: existingByAuth } = await supabase
    .from('users')
    .select('id')
    .eq('auth_user_id', authUserId)
    .maybeSingle();

  if (existingByAuth) return existingByAuth.id;

  // Check if user exists by local_id
  const { data: existingByLocal } = await supabase
    .from('users')
    .select('id')
    .eq('local_id', localUserId)
    .maybeSingle();

  if (existingByLocal) return existingByLocal.id;

  // Create new user - don't set id, let Supabase auto-generate
  const { data, error } = await supabase
    .from('users')
    .insert({
      local_id: localUserId,
      auth_user_id: authUserId,
      email: localUser.emailAddress,
      full_name: localUser.fullName,
      address: localUser.address,
      phone_number: localUser.phoneNumber,
      utr_number: localUser.utrNumber,
      nin_number: localUser.ninNumber,
      is_admin: localUser.isAdmin ?? false,
      synced_at: new Date().toISOString(),
      sync_status: 'synced',
    })
    .select('id')
    .single();

  if (error || !data) {
    // If insert fails, try to get by local_id again (might be a race condition)
    const { data: retryData } = await supabase
      .from('users')
      .select('id')
      .eq('local_id', localUserId)
      .maybeSingle();
    
    if (retryData) return retryData.id;
    return null;
  }
  
  return data.id;
};

export const runSync = async (
  _userId: string,
  options?: SyncOptions
): Promise<SyncResult> => {
  const startTime = Date.now();
  const errors: SyncError[] = [];
  let success = 0;
  let failed = 0;
  let skipped = 0;
  
  const authUserId = await getAuthUserId();
  if (!authUserId) {
    return createSyncResult(0, 0, 0, [{
      table: 'auth',
      localId: '',
      action: 'insert',
      error: 'Not authenticated. Please sign in first.',
      timestamp: Date.now(),
    }], startTime);
  }
  
  const isConnected = await checkConnection();
  if (!isConnected) {
    return createSyncResult(0, 0, 0, [{
      table: 'connection',
      localId: '',
      action: 'insert',
      error: 'No connection to Supabase',
      timestamp: Date.now(),
    }], startTime);
  }

  const context: SyncContext = {
    authUserId,
    localUserId: _userId,
    supabaseUserId: null,
    customerIdMap: new Map(),
    invoiceIdMap: new Map(),
    alreadySynced: new Set(),
  };

  context.supabaseUserId = await getOrCreateSupabaseUserId(authUserId, _userId);
  if (!context.supabaseUserId) {
    return createSyncResult(0, 1, 0, [{
      table: 'users',
      localId: _userId,
      action: 'insert',
      error: 'Failed to create/get user in Supabase',
      timestamp: Date.now(),
    }], startTime);
  }
  
  const tablesToSync = options?.tables ?? TABLE_SYNC_ORDER;
  const total = tablesToSync.length;
  
  for (let i = 0; i < tablesToSync.length; i++) {
    const table = tablesToSync[i];
    
    options?.onProgress?.({
      current: i + 1,
      total,
      currentTable: table,
    });
    
    try {
      const result = await syncTableWithContext(context, table);
      success += result.success;
      failed += result.failed;
      skipped += result.skipped;
      errors.push(...result.errors);
    } catch (err) {
      failed++;
      errors.push({
        table,
        localId: '',
        action: 'insert',
        error: err instanceof Error ? err.message : 'Unknown error',
        timestamp: Date.now(),
      });
    }
  }
  
  await setLastSyncTime(context.supabaseUserId);
  
  return createSyncResult(success, failed, skipped, errors, startTime);
};

export const syncTable = async (
  authUserId: string,
  tableName: string
): Promise<SyncResult> => {
  const context: SyncContext = {
    authUserId,
    localUserId: '',
    supabaseUserId: authUserId,
    customerIdMap: new Map(),
    invoiceIdMap: new Map(),
    alreadySynced: new Set(),
  };
  return syncTableWithContext(context, tableName);
};

const syncTableWithContext = async (
  context: SyncContext,
  tableName: string
): Promise<SyncResult> => {
  const startTime = Date.now();
  const errors: SyncError[] = [];
  let success = 0;
  let failed = 0;
  let skipped = 0;
  
  const queue = await getQueue();
  const tableQueue = queue.filter((item) => item.table === tableName);
  
  if (tableQueue.length === 0) {
    return createSyncResult(0, 0, 1, [], startTime);
  }
  
  for (const item of tableQueue) {
    try {
      const result = await processQueueItemWithContext(context, tableName, item.localId, item.action);
      if (result.success) {
        await markAsSynced(item.localId);
        success++;
      } else {
        await markAsFailed(item.localId, result.error ?? 'Unknown error');
        failed++;
        errors.push({
          table: tableName,
          localId: item.localId,
          action: item.action,
          error: result.error ?? 'Unknown error',
          timestamp: Date.now(),
        });
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      await markAsFailed(item.localId, errorMsg);
      failed++;
      errors.push({
        table: tableName,
        localId: item.localId,
        action: item.action,
        error: errorMsg,
        timestamp: Date.now(),
      });
    }
  }
  
  return createSyncResult(success, failed, skipped, errors, startTime);
};

const processQueueItem = async (
  authUserId: string,
  tableName: string,
  localId: string,
  action: 'insert' | 'update' | 'delete'
): Promise<{ success: boolean; error?: string }> => {
  const context: SyncContext = {
    authUserId,
    localUserId: '',
    supabaseUserId: authUserId,
    customerIdMap: new Map(),
    invoiceIdMap: new Map(),
    alreadySynced: new Set(),
  };
  return processQueueItemWithContext(context, tableName, localId, action);
};

const processQueueItemWithContext = async (
  context: SyncContext,
  tableName: string,
  localId: string,
  action: 'insert' | 'update' | 'delete'
): Promise<{ success: boolean; error?: string }> => {
  const tableMapping: Record<string, string> = {
    users: 'users',
    customers: 'customers',
    invoices: 'invoices',
    invoice_items: 'invoice_items',
    estimates: 'estimates',
    transactions: 'transactions',
    mtd_transactions: 'mtd_transactions',
    mtd_quarterly_summaries: 'mtd_quarterly_summaries',
    mtd_annual_summaries: 'mtd_annual_summaries',
    documents: 'documents',
  };
  
  const supabaseTable = tableMapping[tableName];
  if (!supabaseTable) {
    return { success: false, error: 'Unknown table' };
  }
  
  const syncKey = `${tableName}:${localId}`;
  if (context.alreadySynced.has(syncKey)) {
    return { success: true };
  }
  
  if (action === 'delete') {
    await supabase.from(supabaseTable).delete().eq('local_id', localId);
    context.alreadySynced.add(syncKey);
    return { success: true };
  }
  
  const isAlreadySynced = await checkAlreadySynced(supabaseTable, localId);
  if (isAlreadySynced) {
    context.alreadySynced.add(syncKey);
    return { success: true };
  }
  
  const data = await getLocalDataWithContext(context, tableName, localId);
  if (!data) {
    return { success: false, error: 'No local data found' };
  }
  
  if (action === 'insert' || action === 'update') {
    // Special handling for tables with unique constraints on fields other than local_id
    if (tableName === 'users' && data.auth_user_id) {
      // Check if user with this auth_user_id already exists
      const { data: existingByAuth } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', data.auth_user_id)
        .maybeSingle();
      
      if (existingByAuth) {
        // Update existing record
        await supabase.from('users').update(data).eq('auth_user_id', data.auth_user_id);
        context.alreadySynced.add(syncKey);
        return { success: true };
      }
    }
    
    if ((tableName === 'mtd_quarterly_summaries') && data.user_id && data.tax_year && data.quarter) {
      // Check if summary for this user/year/quarter already exists
      const { data: existingByYearQuarter } = await supabase
        .from('mtd_quarterly_summaries')
        .select('id')
        .eq('user_id', data.user_id)
        .eq('tax_year', data.tax_year)
        .eq('quarter', data.quarter)
        .maybeSingle();
      
      if (existingByYearQuarter) {
        // Update existing record
        await supabase.from('mtd_quarterly_summaries').update(data)
          .eq('user_id', data.user_id)
          .eq('tax_year', data.tax_year)
          .eq('quarter', data.quarter);
        context.alreadySynced.add(syncKey);
        return { success: true };
      }
    }
    
    if ((tableName === 'mtd_annual_summaries') && data.user_id && data.tax_year) {
      // Check if annual summary for this user/year already exists
      const { data: existingByYear } = await supabase
        .from('mtd_annual_summaries')
        .select('id')
        .eq('user_id', data.user_id)
        .eq('tax_year', data.tax_year)
        .maybeSingle();
      
      if (existingByYear) {
        // Update existing record
        await supabase.from('mtd_annual_summaries').update(data)
          .eq('user_id', data.user_id)
          .eq('tax_year', data.tax_year);
        context.alreadySynced.add(syncKey);
        return { success: true };
      }
    }
    
    // Use upsert for other tables
    const { error: upsertError } = await supabase.from(supabaseTable).upsert(data, { 
      onConflict: 'local_id',
      ignoreDuplicates: false 
    });
    
    if (upsertError) {
      return { success: false, error: upsertError.message };
    }
  } else {
    await supabase.from(supabaseTable).delete().eq('local_id', localId);
  }
  
  context.alreadySynced.add(syncKey);
  return { success: true };
};

const getLocalData = async (
  tableName: string,
  localId: string,
  authUserId: string
): Promise<Record<string, unknown> | null> => {
  const context: SyncContext = {
    authUserId,
    localUserId: '',
    supabaseUserId: authUserId,
    customerIdMap: new Map(),
    invoiceIdMap: new Map(),
    alreadySynced: new Set(),
  };
  return getLocalDataWithContext(context, tableName, localId);
};

const getLocalDataWithContext = async (
  context: SyncContext,
  tableName: string,
  localId: string
): Promise<Record<string, unknown> | null> => {
  try {
    switch (tableName) {
      case 'users': {
        const result = await localDb.select().from(db.User).where(eq(db.User.id, localId)).limit(1);
        if (!result[0]) return null;
        const u = result[0];
        return {
          // Don't set id - let Supabase auto-generate UUID
          local_id: u.id,
          auth_user_id: context.authUserId,
          email: u.emailAddress,
          full_name: u.fullName,
          address: u.address,
          phone_number: u.phoneNumber,
          utr_number: u.utrNumber,
          nin_number: u.ninNumber,
          is_admin: u.isAdmin,
          synced_at: new Date().toISOString(),
          sync_status: 'synced',
        };
      }
      
      case 'customers': {
        const result = await localDb.select().from(db.Customer).where(eq(db.Customer.id, localId)).limit(1);
        if (!result[0]) return null;
        const c = result[0];
        
        const { data: supabaseCustomer } = await supabase
          .from('customers')
          .upsert({
            local_id: c.id,
            user_id: context.supabaseUserId,
            name: c.name ?? '',
            email: c.emailAddress,
            phone: c.phoneNumber,
            address: c.address,
            synced_at: new Date().toISOString(),
            sync_status: 'synced',
          }, { onConflict: 'local_id' })
          .select('id')
          .single();
        
        if (supabaseCustomer) {
          context.customerIdMap.set(c.id, supabaseCustomer.id);
        }
        
        return {
          local_id: c.id,
          user_id: context.supabaseUserId,
          name: c.name ?? '',
          email: c.emailAddress,
          phone: c.phoneNumber,
          address: c.address,
          synced_at: new Date().toISOString(),
          sync_status: 'synced',
        };
      }
      
      case 'invoices': {
        const result = await localDb.select().from(db.Invoice).where(eq(db.Invoice.id, localId)).limit(1);
        if (!result[0]) return null;
        const inv = result[0];
        
        const supabaseCustomerId = inv.customerId 
          ? context.customerIdMap.get(inv.customerId) ?? null
          : null;
        
        const { data: supabaseInvoice } = await supabase
          .from('invoices')
          .upsert({
            local_id: inv.id,
            user_id: context.supabaseUserId,
            customer_id: supabaseCustomerId,
            invoice_number: `INV-${localId.slice(0, 8)}`,
            invoice_date: inv.invoiceDate,
            due_date: inv.dueDate,
            amount_before_tax: inv.amountBeforeTax,
            amount_after_tax: inv.amountAfterTax,
            tax_rate: inv.taxRate,
            tax_value: inv.taxValue,
            is_payed: inv.isPayed,
            currency: inv.currency,
            discount: inv.discount,
            pdf_path: inv.pdfPath,
            synced_at: new Date().toISOString(),
            sync_status: 'synced',
          }, { onConflict: 'local_id' })
          .select('id')
          .single();
        
        if (supabaseInvoice) {
          context.invoiceIdMap.set(inv.id, supabaseInvoice.id);
        }
        
        return {
          local_id: inv.id,
          user_id: context.supabaseUserId,
          customer_id: supabaseCustomerId,
          invoice_number: `INV-${localId.slice(0, 8)}`,
          invoice_date: inv.invoiceDate,
          due_date: inv.dueDate,
          amount_before_tax: inv.amountBeforeTax,
          amount_after_tax: inv.amountAfterTax,
          tax_rate: inv.taxRate,
          tax_value: inv.taxValue,
          is_payed: inv.isPayed,
          currency: inv.currency,
          discount: inv.discount,
          pdf_path: inv.pdfPath,
          synced_at: new Date().toISOString(),
          sync_status: 'synced',
        };
      }
      
      case 'transactions': {
        const result = await localDb.select().from(db.Transactions).where(eq(db.Transactions.id, localId)).limit(1);
        if (!result[0]) return null;
        const t = result[0];
        return {
          local_id: t.id,
          user_id: context.supabaseUserId,
          amount: t.amount,
          date: t.date,
          description: t.description,
          type: t.type,
          currency: t.currency,
          synced_at: new Date().toISOString(),
          sync_status: 'synced',
        };
      }
      
      case 'estimates': {
        const result = await localDb.select().from(db.Estimate).where(eq(db.Estimate.id, localId)).limit(1);
        if (!result[0]) return null;
        const e = result[0];
        
        const supabaseCustomerId = e.customerId 
          ? context.customerIdMap.get(e.customerId) ?? null
          : null;
        
        return {
          local_id: e.id,
          user_id: context.supabaseUserId,
          customer_id: supabaseCustomerId,
          estimate_date: e.estimateDate,
          estimate_end_time: e.estimateEndTime,
          amount_before_tax: e.amountBeforeTax,
          amount_after_tax: e.amountAfterTax,
          tax_rate: e.taxRate,
          tax_value: e.taxValue,
          is_accepted: e.isAccepted,
          currency: e.currency,
          discount: e.discount,
          synced_at: new Date().toISOString(),
          sync_status: 'synced',
        };
      }
      
      case 'mtd_transactions': {
        const result = await localDb.select().from(db.MtdTransactions).where(eq(db.MtdTransactions.id, localId)).limit(1);
        if (!result[0]) return null;
        const mt = result[0];
        
        const supabaseInvoiceId = mt.invoiceId 
          ? context.invoiceIdMap.get(mt.invoiceId) ?? null
          : null;
        
        return {
          local_id: mt.id,
          user_id: context.supabaseUserId,
          invoice_id: supabaseInvoiceId,
          date: mt.date,
          description: mt.description,
          amount: mt.amount,
          type: mt.type,
          category: mt.category,
          tax_year: mt.taxYear,
          quarter: mt.quarter,
          currency: mt.currency,
          receipt_ref: mt.receiptRef,
          notes: mt.notes,
          synced_at: new Date().toISOString(),
          sync_status: 'synced',
        };
      }
      
      case 'mtd_quarterly_summaries': {
        const result = await localDb.select().from(db.MtdQuarterlySummary).where(eq(db.MtdQuarterlySummary.id, localId)).limit(1);
        if (!result[0]) return null;
        const qs = result[0];
        
        return {
          local_id: qs.id,
          user_id: context.supabaseUserId,
          tax_year: qs.taxYear,
          quarter: qs.quarter,
          period_start: qs.periodStart,
          period_end: qs.periodEnd,
          submission_deadline: qs.submissionDeadline,
          total_turnover: qs.totalTurnover,
          cost_of_goods_allowable: qs.costOfGoodsAllowable,
          employee_costs: qs.employeeCosts,
          premises_running_costs: qs.premisesRunningCosts,
          maintenance_costs: qs.maintenanceCosts,
          advertising_costs: qs.advertisingCosts,
          interest_on_bank_loans: qs.interestOnBankLoans,
          professional_fees: qs.professionalFees,
          depreciation: qs.depreciation,
          other_allowable_expenses: qs.otherAllowableExpenses,
          business_entertainment_costs: qs.businessEntertainmentCosts,
          other_disallowable_expenses: qs.otherDisallowableExpenses,
          total_allowable_expenses: qs.totalAllowableExpenses,
          net_profit: qs.netProfit,
          status: qs.status,
          last_calculated_at: qs.lastCalculatedAt,
          synced_at: new Date().toISOString(),
          sync_status: 'synced',
        };
      }
      
      case 'mtd_annual_summaries': {
        const result = await localDb.select().from(db.MtdAnnualSummary).where(eq(db.MtdAnnualSummary.id, localId)).limit(1);
        if (!result[0]) return null;
        const as = result[0];
        
        return {
          local_id: as.id,
          user_id: context.supabaseUserId,
          tax_year: as.taxYear,
          final_declaration_deadline: as.finalDeclarationDeadline,
          total_turnover: as.totalTurnover,
          total_allowable_expenses: as.totalAllowableExpenses,
          net_profit: as.netProfit,
          estimated_taxable_profit: as.estimatedTaxableProfit,
          estimated_income_tax: as.estimatedIncomeTax,
          estimated_ni: as.estimatedNI,
          estimated_total_tax: as.estimatedTotalTax,
          personal_allowance_used: as.personalAllowanceUsed,
          status: as.status,
          synced_at: new Date().toISOString(),
          sync_status: 'synced',
        };
      }
      
      case 'invoice_items': {
        const result = await localDb.select().from(db.WorkInformation).where(eq(db.WorkInformation.id, localId)).limit(1);
        if (!result[0]) return null;
        const wi = result[0];
        
        const supabaseInvoiceId = wi.invoiceId 
          ? context.invoiceIdMap.get(wi.invoiceId) ?? null
          : null;
        
        return {
          local_id: wi.id,
          invoice_id: supabaseInvoiceId,
          description: wi.descriptionOfWork,
          unit_price: wi.unitPrice,
          quantity: 1,
          date: wi.date,
          total_to_pay_minus_tax: wi.totalToPayMinusTax,
          synced_at: new Date().toISOString(),
          sync_status: 'synced',
        };
      }
      
      case 'documents': {
        const result = await localDb.select().from(db.Documents).where(eq(db.Documents.id, localId)).limit(1);
        if (!result[0]) return null;
        const doc = result[0];
        
        const supabaseInvoiceId = doc.invoiceId 
          ? context.invoiceIdMap.get(doc.invoiceId) ?? null
          : null;
        
        return {
          local_id: doc.id,
          user_id: context.supabaseUserId,
          invoice_id: supabaseInvoiceId,
          file_name: doc.fileName,
          storage_path: doc.filePath,
          file_type: doc.fileType,
          document_type: doc.documentType,
          tax_year: doc.taxYear,
          quarter: doc.quarter,
          document_date: doc.documentDate,
          notes: doc.notes,
          synced_at: new Date().toISOString(),
          sync_status: 'synced',
        };
      }
      
      default:
        return null;
    }
  } catch {
    return null;
  }
};

export const queueAllForSync = async (_localUserId: string): Promise<number> => {
  const authUserId = await getAuthUserId();
  if (!authUserId) return 0;
  
  // Get supabase user id for MTD checks
  const { data: supabaseUser } = await supabase
    .from('users')
    .select('id')
    .eq('auth_user_id', authUserId)
    .maybeSingle();
  
  const supabaseUserId = supabaseUser?.id;
  
  let queued = 0;
  let addedByTable: Record<string, number> = {};
  
  // Helper to add rows to queue
  const queueRows = async (tableName: string, rows: any[], extraFields?: Record<string, any>) => {
    for (const row of rows) {
      const rowLocalId = row.id;
      const isNew = await addToQueue({
        table: tableName,
        localId: rowLocalId,
        action: 'insert',
      });
      if (isNew) {
        queued++;
        addedByTable[tableName] = (addedByTable[tableName] || 0) + 1;
      }
    }
  };
  
  // Queue users
  try {
    const users = await localDb.select().from(db.User);
    for (const user of users) {
      const isNew = await addToQueue({
        table: 'users',
        localId: user.id,
        action: 'insert',
      }, { 
        email: user.emailAddress ?? undefined,
        auth_user_id: authUserId ?? undefined 
      });
      if (isNew) {
        queued++;
        addedByTable['users'] = (addedByTable['users'] || 0) + 1;
      }
    }
  } catch (err) {
    // Silent fail - table may not exist
  }
  
  // Queue customers for this user
  try {
    const customers = await localDb.select().from(db.Customer);
    await queueRows('customers', customers);
  } catch (err) {
    // Silent fail
  }
  
  // Queue invoices for this user
  try {
    const invoices = await localDb.select().from(db.Invoice);
    await queueRows('invoices', invoices);
  } catch (err) {
    // Silent fail
  }
  
  // Queue work information (invoice items)
  try {
    const workInfo = await localDb.select().from(db.WorkInformation);
    await queueRows('invoice_items', workInfo);
  } catch (err) {
    // Silent fail
  }
  
  // Queue estimates
  try {
    const estimates = await localDb.select().from(db.Estimate);
    await queueRows('estimates', estimates);
  } catch (err) {
    // Silent fail
  }
  
  // Queue transactions for this user
  try {
    const transactions = await localDb.select().from(db.Transactions);
    await queueRows('transactions', transactions);
  } catch (err) {
    // Silent fail
  }
  
  // Queue MTD transactions
  try {
    const mtdTxns = await localDb.select().from(db.MtdTransactions);
    await queueRows('mtd_transactions', mtdTxns);
  } catch (err) {
    // Silent fail
  }
  
  // Queue MTD quarterly summaries
  try {
    const summaries = await localDb.select().from(db.MtdQuarterlySummary);
    for (const summary of summaries) {
      const isNew = await addToQueue({
        table: 'mtd_quarterly_summaries',
        localId: summary.id,
        action: 'insert',
      }, {
        user_id: supabaseUserId ?? undefined,
        tax_year: summary.taxYear ?? undefined,
        quarter: summary.quarter,
      });
      if (isNew) {
        queued++;
        addedByTable['mtd_quarterly_summaries'] = (addedByTable['mtd_quarterly_summaries'] || 0) + 1;
      }
    }
  } catch {
    // Silent fail
  }
  
  // Queue MTD annual summaries
  try {
    const annualSummaries = await localDb.select().from(db.MtdAnnualSummary);
    for (const summary of annualSummaries) {
      const isNew = await addToQueue({
        table: 'mtd_annual_summaries',
        localId: summary.id,
        action: 'insert',
      }, {
        user_id: supabaseUserId ?? undefined,
        tax_year: summary.taxYear ?? undefined,
      });
      if (isNew) {
        queued++;
        addedByTable['mtd_annual_summaries'] = (addedByTable['mtd_annual_summaries'] || 0) + 1;
      }
    }
  } catch {
    // Silent fail
  }
  
  // Queue documents
  try {
    const docs = await localDb.select().from(db.Documents);
    await queueRows('documents', docs);
  } catch {
    // Silent fail
  }
  
  return queued;
};

export const getSyncStatus = async () => {
  const authUserId = await getAuthUserId();
  const pendingCount = await getPendingCount();
  const isConnected = await checkConnection();
  
  let supabaseUserId: string | null = null;
  let lastSync: string | null = null;
  
  if (authUserId) {
    const existing = await localDb.select().from(db.User).limit(1);
    if (existing[0]) {
      const { data } = await supabase
        .from('users')
        .select('id')
        .eq('local_id', existing[0].id)
        .maybeSingle();
      if (data) {
        supabaseUserId = data.id;
        lastSync = await getLastSyncTime(supabaseUserId);
      }
    }
  }
  
  return {
    pendingCount,
    lastSync,
    isConnected,
    isAuthenticated: !!authUserId,
    status: isConnected ? 'ready' : 'offline',
  };
};
