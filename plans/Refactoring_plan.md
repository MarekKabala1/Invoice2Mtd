# Refactoring Plan — Invoice2Mtd

**Created**: 2026-03-26
**Updated**: 2026-03-28 (post-audit)
**Branch**: `refactor/screen-slimming-and-file-org`
**Goal**: Codebase audit cleanup — dead code, duplication, conventions compliance.

---

## Completed Phases (DONE)

- [x] **Phase 0** — Pre-flight: branch created, baseline verified
- [x] **Phase 1** — Extract inline DB queries to hooks (`useUnpaidInvoicesForQuarter`, `useMtdDataAllQuarters`, `useChartsData`, `useInvoiceListData`)
- [x] **Phase 2** — Reorganise `utils/` into domain subdirectories
- [x] **Phase 3** — Reorganise `hooks/` into domain subdirectories
- [x] **Phase 4** — Reorganise `components/` into domain subdirectories
- [x] **Phase 5** — Add ErrorBoundary (`components/ui/ErrorBoundary.tsx`)
- [x] **Phase 6** — Remove unused InvoiceContext
- [x] **Phase 7** — Slim screen files to pure composition

---

## Remaining Phases (TODO)

---

## Phase 8 — Dead Code Removal & Filename Fixes

### Step 8.1 — Delete dead files
- [ ] Delete `db/queries.ts` (never imported — 19 lines, uses `any` type)
- [ ] Delete `components/settings/NoSettingsMessage.tsx` (never imported)
- [ ] Delete `components/settings/AppSettingsForm.tsx` (replaced by settings sections architecture)

### Step 8.2 — Remove dead legacy aliases
- [ ] Remove `getOrCreateStorageDirectory` and `resetStorageDirectory` aliases from `utils/shared/permissions.ts:173-175`

### Step 8.3 — Fix filename typos
- [ ] Rename `templates/emailRemaiderTemplate.ts` → `emailReminderTemplate.ts` + update import in `utils/invoice/emailOperations.ts:2`
- [ ] Rename `components/scanner/AddTransactionAfterScann.tsx` → `AddTransactionAfterScan.tsx` + update import in `components/scanner/DocumentScanner.tsx:7`
- [ ] Rename `DOCKS_PLAN.MD` → `DOCS_PLAN.MD`

**Commit**: `[CHORE] Remove dead code and fix filename typos`

---

## Phase 9 — Permissions.ts Parameterized Factory

### Problem
12 near-identical functions for Invoice/Estimate/Bill storage directories. Each set is copy-paste with only the AsyncStorage key and alert message different.

### Fix
Replace with 4 parameterized functions + 1 config map.

- [ ] Define `StorageType = 'invoice' | 'estimate' | 'bill'` and config map at top of `utils/shared/permissions.ts`
- [ ] Create `getOrCreateStorageDirectory(type: StorageType)`
- [ ] Create `getStorageDirectory(type: StorageType)`
- [ ] Create `requestStorageDirectory(type: StorageType)`
- [ ] Create `resetStorageDirectory(type: StorageType)`
- [ ] Keep `resetAllStorageDirectories` and `requestMediaLibraryPermission` as-is
- [ ] Update callers: `utils/invoice/pdfOperations.ts`, `hooks/shared/useCameraScanner.ts`, tests

**Commit**: `[REFACTOR] Parameterize permissions.ts storage directory functions`

---

## Phase 10 — Extract Shared Invoice/Estimate Utils

### Problem
`utils/invoice/invoiceFormOperations.ts` (520 lines) and `utils/invoice/estimateOperations.ts` (421 lines) share:
- `getUsers()` — identical name, near-identical logic
- `getUserAndBankDetails()` — identical name, ~90% identical logic
- `getNextSequentialId()` — functionally identical pattern
- `handleSend/ExportPdf/Preview` — same calculate→template→share flow

### Fix
Create `utils/invoice/documentOperations.ts` with shared functions.

- [ ] Create `utils/invoice/documentOperations.ts`
- [ ] Extract `getUsers(isUpdateMode, selectedId?)` — merge both versions (estimate has reorder logic — keep it)
- [ ] Extract `getUserAndBankDetails(userId)` — use estimate version (non-nullable, cleaner)
- [ ] Extract `getNextSequentialId(table)` — generic, takes Drizzle table as param
- [ ] Extract `shareDocument(html, fileName, dialogTitle)` — from handleSendInvoice/Estimate
- [ ] Slim `invoiceFormOperations.ts` — import from documentOperations, keep invoice-specific logic
- [ ] Slim `estimateOperations.ts` — import from documentOperations, keep estimate-specific logic
- [ ] Update all consumers: `InvoiceForm.tsx`, `EstimateForm.tsx`, `InvoiceCard.tsx`, `EstimateList.tsx`, `InvoiceSettingsModal.tsx`, `EstimateSettingsModal.tsx`, `emailOperations.ts`, tests

**Commit**: `[REFACTOR] Extract shared invoice/estimate utils into documentOperations`

---

## Phase 11 — Remove Duplicated quarterForDateValue

### Problem
Private `quarterForDateValue` function duplicated in 2 files. Public `quarterForDate` already exists in `utils/mtd/mtdDates.ts`.

### Fix
- [ ] Remove `quarterForDateValue` from `db/mtdTransactionOps.ts:55-62`, import `quarterForDate` from `@/utils/mtd/mtdDates`, use `.quarter` property at call site
- [ ] Remove `quarterForDateValue` from `utils/invoice/invoiceSync.ts:24-31`, import `quarterForDate` from `@/utils/mtd/mtdDates` (already imports `taxYearForDate` from same module), use `.quarter` property at call site

**Commit**: `[REFACTOR] Remove duplicated quarterForDateValue, use shared quarterForDate`

---

## Phase 12 — Replace console.log/error with Sentry (62 occurrences)

### Problem
AGENTS.md: "No `console.log` in production code — use Sentry utilities from `utils/shared/sentry.ts`"

### Pattern
```typescript
// Before:
console.error('Error doing X:', error);
// After:
import { captureException } from '@/utils/shared/sentry';
captureException(error instanceof Error ? error : new Error(String(error)), { action: 'doing X' });
```

### Files to update (by group)

**Components** (~20 occurrences)
- [ ] `components/ui/ErrorBoundary.tsx` (1)
- [ ] `components/InvoiceForm/InvoiceCard.tsx` (1)
- [ ] `components/InvoiceForm/InvoiceList.tsx` (1)
- [ ] `components/InvoiceForm/InvoiceForm.tsx` (4)
- [ ] `components/InvoiceForm/InvoiceSettingsModal.tsx` (3)
- [ ] `components/EstimateForm/EstimateList.tsx` (3)
- [ ] `components/EstimateForm/EstimateForm.tsx` (5)
- [ ] `components/EstimateForm/EstimateSettingsModal.tsx` (1)
- [ ] `components/scanner/AddTransactionAfterScann.tsx` (1)
- [ ] `components/CustomerForm/CustomerForm.tsx` (3)
- [ ] `components/email/Email.tsx` (1)

**Hooks** (~4 occurrences)
- [ ] `hooks/invoice/useAddInvoiceToBudget.ts` (1)
- [ ] `hooks/invoice/useChartsData.ts` (2)
- [ ] `hooks/invoice/useInvoiceListData.ts` (2)
- [ ] `hooks/shared/useCameraScanner.ts` (1)
- [ ] `hooks/shared/useTransaction.ts` (1)

**Utils** (~30 occurrences)
- [ ] `utils/invoice/invoiceFormOperations.ts` (3)
- [ ] `utils/invoice/estimateOperations.ts` (11)
- [ ] `utils/invoice/pdfOperations.ts` (5)
- [ ] `utils/invoice/customerOperations.ts` (4)
- [ ] `utils/shared/permissions.ts` (6)
- [ ] `utils/settings/settingsOperations.ts` (3)
- [ ] `utils/budget/transactionOperations.ts` (1)

**Other** (~4 occurrences)
- [ ] `app/(stack)/(user)/bankDetailsForm.tsx` (1)
- [ ] `context/ThemeContext.tsx` (2)
- [ ] Leave `utils/shared/sentry.ts` lines 52, 68 as-is (fallback logging in dev mode)

**Commit**: `[REFACTOR] Replace console.log/error with Sentry captureException`

---

## Phase 13 — Replace All any Types (32 occurrences)

### Problem
AGENTS.md: "Strict mode required — no `any` types"

### Files to fix

**hooks/invoice/useInvoiceListData.ts** (5 occurrences)
- [ ] Type `invoicesData`, `paymentsData`, `notesData`, `workItemsData`, `customersData` with proper Drizzle `$inferSelect[]`

**components/InvoiceForm/InvoiceList.tsx** (2)
- [ ] Type `section` param with `SectionListData<InvoiceForUpdate>`

**components/InvoiceForm/InvoiceHeaderSection.tsx** (1)
- [ ] Type `errors` with `FieldErrors<invoiceSchema>` from react-hook-form

**components/InvoiceForm/PaymentsList.tsx** (1)
- [ ] Type `errors` properly

**components/InvoiceForm/WorkItemsList.tsx** (1)
- [ ] Type `errors` properly

**components/InvoiceForm/InvoiceSettingsModal.tsx** (7)
- [ ] Type `workItems: WorkInformationType[]`, `payments: PaymentType[]`, `bankDetails: BankDetailsType`
- [ ] Type catch blocks properly (4 catch blocks)

**components/EstimateForm/EstimateSettingsModal.tsx** (2)
- [ ] Type `bankDetails: BankDetailsType`, catch block

**components/EstimateForm/EstimateHeaderSection.tsx** (1)
- [ ] Type `errors` properly

**components/EstimateForm/EstimateForm.tsx** (2)
- [ ] Remove `as any` casts — type formData correctly with EstimateType

**components/ui/DiscountInput.tsx** (3)
- [ ] Make generic or use specific schema type for `Control`, `errors`, `UseFormSetValue`

**components/scanner/AddTransactionAfterScann.tsx** (2)
- [ ] Fix `setValue` type casts

**components/budget/TransactionCard.tsx** (2)
- [ ] Type `transaction` with `typeof Transactions.$inferSelect`

**app/(drawer)/(tabs)/_layout.tsx** (1)
- [ ] Type `children` as `React.ReactNode`

**context/AppSettingsContext.tsx** (1)
- [ ] Type `valuesObj` properly

**Commit**: `[REFACTOR] Remove all any types for strict TypeScript compliance`

---

## Phase 14 — Replace Hardcoded Hex Colors (47 occurrences)

### Problem
AGENTS.md: "Colors: always from `useTheme()` context or `tailwind.config.ts` — never hardcode hex values"

### Color mapping
| Hardcoded | Replacement | Tailwind class |
|-----------|-------------|----------------|
| `#ee1c1c` | `colors.error` | `text-red-500`, `bg-red-500` |
| `#2563eb`, `#1d4ed8` | `colors.primary` | `bg-blue-600`, `text-blue-600` |
| `#39AD6A` | `colors.success` | `text-green-500`, `bg-green-500` |
| `#93c5fd` | — | `bg-blue-200` |
| `#f59e0b` | — | `text-amber-500` |
| `#fca5a5`, `#991b1b` | — | `bg-red-200`, `text-red-900` |
| `#c7d2fe`, `#e0e7ff` | — | `bg-indigo-200`, `bg-indigo-100` |
| `#F3EDE2`, `#1a1a2e` | theme-aware | use `useTheme()` |
| `#486581` | — | `text-slate-600` |
| `#92400e` | — | `text-amber-800` |

### Files to update (by group)

**components/mtd/** (~20 occurrences)
- [ ] `AddMtdTransactionForm.tsx` (5)
- [ ] `AnnualEstimateHub.tsx` (1)
- [ ] `QuarterlySummaryHub.tsx` (10)
- [ ] `TaxHub.tsx` (6)

**components/InvoiceForm/** (~10)
- [ ] `InvoiceList.tsx` (3)
- [ ] `InvoiceSettingsModal.tsx` (7)

**components/budget/** (~8)
- [ ] `BudgetScreen.tsx` (2)
- [ ] `TransactionForm.tsx` (6)

**components/scanner/** (3)
- [ ] `AddTransactionAfterScann.tsx` (3)

**app/ screens** (3)
- [ ] `app/(stack)/mtdDeadlines.tsx` (2)
- [ ] `app/(drawer)/(tabs)/home.tsx` (2)
- [ ] `app/(drawer)/settings.tsx` (1)

**Commit**: `[STYLE] Replace hardcoded hex colors with theme tokens`

---

## Phase 15 — Import Order & File Comments

### Step 15.1 — Fix import order (19 files)
Order: (1) Expo/React Native, (2) expo-router, (3) Third-party, (4) Local `@/`

- [ ] `app/(drawer)/(tabs)/_layout.tsx` — expo-router before React Native
- [ ] `app/(drawer)/_layout.tsx` — expo-router before React Native
- [ ] `app/index.tsx` — drizzle-orm before React Native
- [ ] `components/InvoiceForm/InvoiceSettingsModal.tsx` — expo-router after third-party
- [ ] `components/InvoiceForm/InvoiceForm.tsx` — expo-router after third-party
- [ ] `components/EstimateForm/EstimateForm.tsx` — expo-router after third-party
- [ ] `components/CustomerForm/CustomerForm.tsx` — expo-router after third-party
- [ ] `components/InvoiceForm/InvoiceCard.tsx` — expo-router after third-party
- [ ] `components/budget/TransactionList.tsx` — expo-router after third-party
- [ ] `components/ui/Card.tsx` — expo-router after third-party
- [ ] `components/navigation/DrawerContent.tsx` — expo-router after third-party
- [ ] `app/(drawer)/(tabs)/home.tsx` — expo-router before many third-party
- [ ] `app/(stack)/(user)/userInfoForm.tsx` — local imports after third-party
- [ ] `app/(stack)/(user)/bankDetailsForm.tsx` — local imports after third-party
- [ ] `components/email/Email.tsx` — local imports after React Native
- [ ] `app/(drawer)/(tabs)/invoices.tsx` — local imports after React Native
- [ ] `components/InvoiceForm/InvoiceSettingsModal.tsx` — fix duplicate useTheme import

### Step 15.2 — Fix architectural violation
- [ ] `utils/budget/transactionOperations.ts:7` — remove `import { router } from 'expo-router'` (pure util shouldn't import router), move navigation to caller

### Step 15.3 — Add file-level comments to production files
Add `// filename.ts — what it does, why it exists, dependencies` at top of every file missing one.

- [ ] All `db/` files (10 files)
- [ ] All `context/` files (2 files)
- [ ] All `types/` files (2 files)
- [ ] All `components/` files (~40 files)
- [ ] All `app/` screen files (~20 files)
- [ ] All `templates/` files (3 files)
- [ ] Hooks missing comments
- [ ] Utils missing comments

**Commit**: `[STYLE] Fix import order and add file-level comments`

---

## Phase 16 — Final Verification

- [ ] `npx tsc --noEmit` — zero errors
- [ ] `npm test` — all tests pass
- [ ] `npx expo start` — app boots, all tabs load

---

## Git Commit Sequence (remaining)

```
1.  [CHORE] Remove dead code and fix filename typos
2.  [REFACTOR] Parameterize permissions.ts storage directory functions
3.  [REFACTOR] Extract shared invoice/estimate utils into documentOperations
4.  [REFACTOR] Remove duplicated quarterForDateValue, use shared quarterForDate
5.  [REFACTOR] Replace console.log/error with Sentry captureException
6.  [REFACTOR] Remove all any types for strict TypeScript compliance
7.  [STYLE] Replace hardcoded hex colors with theme tokens
8.  [STYLE] Fix import order and add file-level comments
9.  [TEST] Final verification — typecheck + tests + boot
```

---

## Rules

- Run `npx tsc --noEmit` before EVERY commit — zero errors
- Run `npm test` before merge — all pass
- One logical change per commit
- Never `git add .` — always stage specific files
- Use `@/` import aliases everywhere
