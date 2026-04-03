# Supabase Integration Plan — Invoice2Mtd

**Branch**: `supabase-connection`  
**Last Updated**: 2026-04-03  
**Status**: Implementation in progress

---

## Overview

Sync Invoice2Mtd data to Supabase for:
1. **Cloud backup** — all user data persisted remotely
2. **Admin Webpage** — separate React app with read/write access to cloud data
3. **Multi-device** — future support for accessing data on multiple devices

**Architecture**: SQLite (primary) → Supabase (backup/cloud). Offline-first, manual sync trigger.

---

## Git Setup

```bash
# Already on branch
git checkout supabase-connection
```

**Commit prefix for this feature**: `[SUPABASE]`

---

## Existing App State

### Local SQLite Tables (from `db/schema.ts`)

| Table | Sync Priority | Has tax_year/quarter |
|-------|---------------|---------------------|
| `User` | High | No |
| `BankDetails` | Medium | No |
| `Customer` | High | No |
| `WorkInformation` | High | No |
| `Invoice` | High | No |
| `InvoiceItem` | High | No |
| `Estimate` | Medium | No |
| `Payment` | High | No |
| `Note` / `EstimateNotes` | Low | No |
| `EstimateTerms` | Low | No |
| `Categories` | Medium | No |
| `Transactions` | High | No |
| `appSettings` | Medium | No |
| `MtdTransactions` | High | **Yes** |
| `MtdQuarterlySummary` | High | **Yes** |
| `MtdAnnualSummary` | High | **Yes** |

### Existing Patterns

- `taxYear` format: `"2025-26"` (from `utils/mtd/mtdDates.ts`)
- Quarter calculation: `quarterForDate(date)` returns 1-4
- MTD quarter/year used for: MtdTransactions, MtdQuarterlySummary, MtdAnnualSummary
- Sync should use existing MTD date logic, not duplicate it

---

## File Structure

```
db/
├── supabase/
│   ├── supabase.ts              # Client setup
│   ├── supabaseSchema.ts        # Drizzle schema for PostgreSQL
│   ├── types.ts                 # Supabase table types
│   ├── storage.types.ts         # Storage types
│   ├── PLAN.md                  # This plan
│   │
│   ├── operations/              # CRUD operations per table
│   │   ├── userOperations.ts
│   │   ├── customerOperations.ts
│   │   ├── invoiceOperations.ts
│   │   ├── estimateOperations.ts
│   │   ├── transactionOperations.ts
│   │   └── mtdOperations.ts
│   │
│   ├── storage/
│   │   └── storage.ts           # File upload/download
│   │
│   ├── sync/
│   │   ├── sync.types.ts        # Sync types
│   │   ├── syncQueue.ts         # Queue operations
│   │   └── syncEngine.ts        # Main orchestrator
│   │
│   └── validation/
│       └── validation.ts         # Zod schemas
│
├── schema.ts                    # SQLite schema (existing)
└── zodSchema.ts                 # Zod schemas (existing)

drizzle/
└── supabase/                    # Generated migrations
    └── 0000_sticky_hellion.sql

drizzle.supabase.config.ts        # Drizzle config for Supabase
```

**Hook**: `hooks/useCloudSync.ts`  
**UI**: `app/(drawer)/settings/sections/CloudSyncSection.tsx`
db/
├── supabase/
│   ├── supabase.ts              # Client setup (existing)
│   ├── PLAN.md                  # This plan
│   │
│   ├── types.ts                 # Supabase table types (mirrors schema.ts)
│   ├── schemas.ts               # Supabase table definitions (for reference)
│   │
│   ├── storage.ts               # File upload/download (PDF, CSV, receipts)
│   ├── storage.types.ts         # Storage types
│   │
│   ├── operations/              # CRUD operations per table
│   │   ├── userOperations.ts
│   │   ├── customerOperations.ts
│   │   ├── invoiceOperations.ts
│   │   ├── estimateOperations.ts
│   │   ├── transactionOperations.ts
│   │   ├── mtdOperations.ts
│   │   └── appSettingsOperations.ts
│   │
│   ├── sync/
│   │   ├── syncQueue.ts         # Track pending sync items
│   │   ├── syncEngine.ts        # Main sync orchestrator
│   │   └── sync.types.ts        # Sync state types
│   │
│   └── validation/
│       └── validation.ts         # Zod schemas for Supabase data
│
├── schema.ts                    # SQLite schema (existing)
└── zodSchema.ts                 # Zod schemas (existing)
```

---

## Implementation Phases

### Phase 1: Supabase Setup (Migration-based)

**Migrations are auto-generated from Drizzle schema.**

#### 1.1 Migration Files

```bash
# Generate migrations after schema changes
npx drizzle-kit generate --config drizzle.supabase.config.ts

# Push migrations to Supabase
npx drizzle-kit push --config drizzle.supabase.config.ts
```

**Migration location**: `drizzle/supabase/`  
**Schema source**: `db/supabase/supabaseSchema.ts`  
**Config**: `drizzle.supabase.config.ts`

#### 1.2 Storage Buckets (Create manually)

| Bucket | Access | Purpose |
|--------|--------|---------|
| `receipts` | Private | Scanned receipts, uploaded bills |
| `invoices` | Private | Generated PDF invoices |
| `exports` | Private | CSV/Excel exports |

#### 1.3 Database Tables

All tables defined in `db/supabase/supabaseSchema.ts`:
- `users`, `customers`, `invoices`, `invoice_items`
- `estimates`, `transactions`, `mtd_transactions`
- `mtd_quarterly_summaries`, `mtd_annual_summaries`
- `documents`, `sync_metadata`

All tables include:
- `id` (UUID, PK)
- `local_id` (TEXT) — links to SQLite record
- `synced_at` (TIMESTAMPTZ) — last successful sync
- `sync_status` (TEXT) — `'pending' | 'synced' | 'failed'`

RLS policies are included in migration for row-level security.
  file_name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  document_type TEXT NOT NULL,
  tax_year TEXT NOT NULL,
  quarter INTEGER NOT NULL,
  document_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  synced_at TIMESTAMPTZ,
  sync_status TEXT DEFAULT 'pending'
);

-- Indexes for fast queries
CREATE INDEX idx_documents_user_quarter ON documents(user_id, tax_year, quarter);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_invoices_user ON invoices(user_id);
CREATE INDEX idx_transactions_user_date ON transactions(user_id, date);
CREATE INDEX idx_mtd_year_quarter ON mtd_transactions(user_id, tax_year, quarter);
```

#### 1.3 Row Level Security (RLS)

All tables must have RLS policies:
- Users can only access their own data (`auth.uid() = user_id`)
- Admin role (future) can access all data

```sql
-- Example for invoices table
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own invoices"
ON invoices FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all invoices"
ON invoices FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.is_admin = true
  )
);
```

---

### Phase 2: Supabase Client & Types

#### 2.1 Types (`db/supabase/types.ts`)

TypeScript types matching Supabase tables. These mirror `db/schema.ts` Drizzle types.

```typescript
// Example structure
export interface SupabaseUser {
  id: string;
  localId: string;
  email: string;
  fullName: string;
  // ... all User fields
  syncedAt: string | null;
  syncStatus: 'pending' | 'synced' | 'failed';
}

export interface SupabaseInvoice {
  id: string;
  localId: string;
  userId: string;
  // ... all Invoice fields
  items: SupabaseInvoiceItem[];
  syncedAt: string | null;
  syncStatus: 'pending' | 'synced' | 'failed';
}
```

#### 2.2 Storage Types (`db/supabase/storage.types.ts`)

```typescript
export type StorageBucket = 'receipts' | 'invoices' | 'exports';
export type DocumentType = 'receipt' | 'invoice' | 'expense' | 'export';
export type FileType = 'pdf' | 'csv' | 'xlsx' | 'jpg' | 'png';

export interface UploadOptions {
  bucket: StorageBucket;
  fileName: string;
  contentType: string;
  userId: string;
}
```

---

### Phase 3: Storage Operations (`db/supabase/storage.ts`)

File upload/download operations for Supabase Storage.

| Function | Purpose |
|----------|---------|
| `uploadDocument(file, options)` | Upload file to bucket |
| `getDocumentUrl(path)` | Get signed URL for file |
| `deleteDocument(path)` | Remove file from storage |
| `listDocuments(bucket, userId)` | List user's files in bucket |

**Quarter/Year for uploads**: Calculated from `documentDate` parameter (same pattern as MTD).

---

### Phase 4: Database Operations

Each operation file handles one SQLite table → Supabase sync.

#### 4.1 User Operations (`db/supabase/operations/userOperations.ts`)

```typescript
export const uploadUser = async (user: LocalUser): Promise<SupabaseUser>;
export const updateUser = async (user: LocalUser): Promise<SupabaseUser>;
export const getUserById = async (id: string): Promise<SupabaseUser | null>;
export const getUserByEmail = async (email: string): Promise<SupabaseUser | null>;
```

#### 4.2 Customer Operations (`db/supabase/operations/customerOperations.ts`)

```typescript
export const uploadCustomer = async (customer: LocalCustomer): Promise<SupabaseCustomer>;
export const uploadCustomers = async (customers: LocalCustomer[]): Promise<SupabaseCustomer[]>;
export const getCustomersByUser = async (userId: string): Promise<SupabaseCustomer[]>;
```

#### 4.3 Invoice Operations (`db/supabase/operations/invoiceOperations.ts`)

```typescript
export const uploadInvoice = async (invoice: LocalInvoice): Promise<SupabaseInvoice>;
export const uploadInvoices = async (invoices: LocalInvoice[]): Promise<SupabaseInvoice[]>;
export const getInvoicesByUser = async (userId: string): Promise<SupabaseInvoice[]>;
export const getInvoicesByQuarter = async (userId: string, taxYear: string, quarter: number): Promise<SupabaseInvoice[]>;
```

#### 4.4 Transaction Operations (`db/supabase/operations/transactionOperations.ts`)

```typescript
export const uploadTransaction = async (txn: LocalTransaction): Promise<SupabaseTransaction>;
export const uploadTransactions = async (txns: LocalTransaction[]): Promise<SupabaseTransaction[]>;
export const getTransactionsByUser = async (userId: string): Promise<SupabaseTransaction[]>;
export const getTransactionsByQuarter = async (userId: string, taxYear: string, quarter: number): Promise<SupabaseTransaction[]>;
```

#### 4.5 MTD Operations (`db/supabase/operations/mtdOperations.ts`)

**Important**: MTD tables already have `tax_year` and `quarter` in SQLite. Sync preserves these.

```typescript
export const uploadMtdTransaction = async (mtd: LocalMtdTransaction): Promise<SupabaseMtdTransaction>;
export const uploadMtdTransactions = async (mtds: LocalMtdTransaction[]): Promise<SupabaseMtdTransaction[]>;
export const getMtdTransactionsByQuarter = async (userId: string, taxYear: string, quarter: number): Promise<SupabaseMtdTransaction[]>;
export const uploadQuarterlySummary = async (summary: LocalMtdQuarterlySummary): Promise<SupabaseMtdQuarterlySummary>;
export const uploadAnnualSummary = async (summary: LocalMtdAnnualSummary): Promise<SupabaseMtdAnnualSummary>;
```

#### 4.6 App Settings Operations (`db/supabase/operations/appSettingsOperations.ts`)

```typescript
export const uploadAppSettings = async (settings: LocalAppSettings): Promise<SupabaseAppSettings>;
export const getAppSettingsByUser = async (userId: string): Promise<SupabaseAppSettings | null>;
```

---

### Phase 5: Sync Engine

#### 5.1 Sync Queue (`db/supabase/sync/syncQueue.ts`)

Tracks changes made locally that need to sync to cloud.

```typescript
export interface SyncQueueItem {
  id: string;
  table: string;
  localId: string;
  action: 'insert' | 'update' | 'delete';
  timestamp: number;
  retryCount: number;
}

export const addToQueue = async (item: Omit<SyncQueueItem, 'id' | 'timestamp' | 'retryCount'>): Promise<void>;
export const getQueue = async (): Promise<SyncQueueItem[]>;
export const removeFromQueue = async (id: string): Promise<void>;
export const clearQueue = async (): Promise<void>;
export const markAsSynced = async (localId: string): Promise<void>;
export const markAsFailed = async (localId: string): Promise<void>;
```

#### 5.2 Sync Engine (`db/supabase/sync/syncEngine.ts`)

Main orchestrator for sync operations.

```typescript
export interface SyncResult {
  success: number;
  failed: number;
  errors: SyncError[];
  duration: number;
}

export interface SyncOptions {
  tables?: string[];  // Sync specific tables, or all if undefined
  forceFull?: boolean;  // Re-sync everything
}

export const runSync = async (userId: string, options?: SyncOptions): Promise<SyncResult>;
export const syncTable = async (userId: string, table: string): Promise<SyncResult>;
export const getLastSyncTime = async (userId: string): Promise<string | null>;
export const setLastSyncTime = async (userId: string, time: string): Promise<void>;
```

**Sync Logic**:
```
1. Check connection
2. For each table to sync:
   a. Query SQLite: WHERE sync_status = 'pending' OR updated_at > synced_at
   b. Transform to Supabase format
   c. Upsert to Supabase
   d. Update local synced_at and sync_status
3. Upload any pending files to Storage
4. Update last sync time
5. Return results
```

#### 5.3 Sync Types (`db/supabase/sync/sync.types.ts`)

```typescript
export type SyncStatus = 'pending' | 'synced' | 'failed';
export type SyncAction = 'insert' | 'update' | 'delete';

export interface SyncError {
  table: string;
  localId: string;
  action: SyncAction;
  error: string;
  timestamp: number;
}

export interface SyncProgress {
  current: number;
  total: number;
  currentTable: string;
}
```

---

### Phase 6: Validation (`db/supabase/validation/validation.ts`)

Zod schemas for validating data before upload.

```typescript
import { z } from 'zod';

export const SupabaseUserSchema = z.object({ ... });
export const SupabaseInvoiceSchema = z.object({ ... });
export const SupabaseTransactionSchema = z.object({ ... });
export const SupabaseMtdTransactionSchema = z.object({
  taxYear: z.string().regex(/^\d{4}-\d{2}$/),  // e.g., "2025-26"
  quarter: z.number().int().min(1).max(4),
  // ...
});

export const validateForSync = <T>(
  data: unknown,
  schema: z.ZodSchema<T>
): { success: true; data: T } | { success: false; errors: z.ZodError };
```

---

### Phase 7: UI Integration (Future)

Sync button and indicators in the app.

#### 7.1 Sync Button Location

- Settings screen → Cloud Sync section
- Or dedicated "Sync" tab in drawer (future)

#### 7.2 Sync Hook (`hooks/useCloudSync.ts`)

```typescript
export interface UseCloudSyncReturn {
  sync: () => Promise<SyncResult>;
  isSyncing: boolean;
  lastSyncTime: string | null;
  pendingCount: number;
  error: string | null;
}

export const useCloudSync = (): UseCloudSyncReturn;
```

#### 7.3 Auto-Sync Option (Settings)

```typescript
// In appSettings table
autoSyncEnabled: boolean;  // Default: false (manual sync only)
syncOnWifiOnly: boolean;   // Default: true
```

---

## Admin Webpage Integration

The admin webpage will be a **separate repository** (not monorepo).

### Admin Access Methods

1. **Same Supabase project** — admin uses same auth, different RLS policy
2. **Admin flag** — `users.is_admin = true` grants elevated access
3. **Separate admin dashboard** — `/admin` routes in admin app

### Data Access for Admin

Admin webpage queries Supabase directly (not through mobile app):

```typescript
// Admin app example
const { data: allUsers } = await supabase
  .from('users')
  .select('*');

const { data: userInvoices } = await supabase
  .from('invoices')
  .select('*, invoice_items(*)')
  .eq('user_id', targetUserId);
```

### Sync Direction for Admin

| Direction | Mechanism | Purpose |
|-----------|-----------|---------|
| Mobile → Cloud | Manual sync button | User backs up data |
| Cloud → Mobile | Re-sync on demand | User restores from backup |
| Admin → Cloud | Direct Supabase | Admin manages user data |
| Admin → Mobile | N/A | Admin changes don't auto-push to mobile |

---

## Testing Plan

### Unit Tests
- Sync queue operations
- Validation schemas
- Data transformation (SQLite ↔ Supabase)

### Integration Tests
- Full sync cycle (local → Supabase → verify)
- Sync conflicts
- Offline → online sync

### Manual Testing
- Sync all tables
- Verify data integrity
- Test admin access (future)

---

## Deployment Checklist

### Before Starting
- [x] Supabase project created
- [ ] Storage buckets configured
- [ ] Database tables created
- [ ] RLS policies added
- [ ] Branch created: `supabase-connection`

### During Implementation
- [ ] Types defined
- [ ] Storage operations working
- [ ] Each table sync tested
- [ ] Sync queue working
- [ ] Error handling tested

### Before Production
- [ ] All tests passing
- [ ] RLS policies verified
- [ ] Offline mode tested
- [ ] Admin webpage connected (future)

---

## Commit History Template

```
[SUPABASE] Add Supabase client configuration
[SUPABASE] Add TypeScript types for Supabase tables
[SUPABASE] Add storage operations for file uploads
[SUPABASE] Add user sync operations
[SUPABASE] Add invoice sync operations
[SUPABASE] Add MTD sync operations
[SUPABASE] Add sync queue for tracking pending changes
[SUPABASE] Add sync engine orchestrator
[SUPABASE] Add validation schemas
[SUPABASE] Add sync UI hook
[SUPABASE] Wire sync to mark invoice paid flow
```

---

## Notes

- **No analytics**: Simple sync, no tracking or audit logs
- **Offline-first**: SQLite is always primary, Supabase is backup
- **Quarter/Year**: Already in MTD tables, added to documents for file sync
- **Admin separate**: Different repo, same Supabase project
- **No serverless functions**: Direct client-to-Supabase sync

---

## Status

| Phase | Status | Files Created |
|-------|--------|---------------|
| Phase 1: Supabase Setup | **Done** | `drizzle/supabase/*.sql`, `drizzle.supabase.config.ts` |
| Phase 2: Client & Types | **Done** | `types.ts`, `storage.types.ts`, `supabaseSchema.ts` |
| Phase 3: Storage Operations | **Done** | `storage/storage.ts` |
| Phase 4: DB Operations | **Done** | `operations/*.ts` (6 files) |
| Phase 5: Sync Engine | **Done** | `sync/*.ts` (3 files) |
| Phase 6: Validation | **Done** | `validation/validation.ts` |
| Phase 7: UI Integration | **Done** | `hooks/useCloudSync.ts` |
| Phase 8: UI Components | **Done** | `CloudSyncSection.tsx`, wired in settings.tsx |

**Completed**: 17+ files created

**Next Step**: 
1. Create storage buckets in Supabase dashboard
2. Push migrations: `npx drizzle-kit push --config drizzle.supabase.config.ts`
