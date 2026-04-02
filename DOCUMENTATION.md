# Project Documentation

## Overview

Invoice2Mtd is a unified mobile application for UK sole traders that combines three core modules — Invoicing, Budget Tracking, and Making Tax Digital (MTD) for Income Tax — into a single system. The app is built with React Native (Expo SDK 51), TypeScript, Drizzle ORM, and NativeWind (Tailwind CSS for React Native).

**Who it's for:** UK sole traders who need to manage invoices, track expenses, and submit quarterly MTD updates to HMRC.

**Core principle:** MTD reads income from paid invoices and expenses from budget transactions automatically — the user never enters the same data twice. When an invoice is marked as paid, the system creates both a budget transaction and an MTD record. Budget expenses are automatically mapped to HMRC expense categories.

The three modules work together:
- **Invoicing** — Create, send, and track invoices and estimates. Track payment status.
- **Budget** — Record income and expense transactions, categorise spending, view charts.
- **MTD** — Aggregate quarterly data from all three sources (invoices, budget, manual records), estimate tax and NI, track deadlines.

## Architecture

### Data Flow

```
Screen → Hook → DB Operations → Drizzle → SQLite
  ↓                ↓
ThemeContext    useAppSettings
```

Screens never call DB operations directly. Every screen uses a custom hook that manages loading/error states, calls DB operations, and returns typed data. The hook layer handles error display via Alert.alert() — screens only render states.

### Layers

| Layer | Responsibility |
|-------|---------------|
| **Screens** (`app/`) | Render UI, handle user input, call hooks |
| **Hooks** (`hooks/`) | Data fetching, state management, error handling, DB calls |
| **DB Operations** (`db/`) | Drizzle queries and writes — pure data access |
| **Utils** (`utils/`) | Pure functions — dates, tax calc, category mapping, UUID generation |
| **Context** (`context/`) | App-wide state — theme, app settings |
| **Types** (`types/`) | TypeScript interfaces and Zod schemas |

### Three-Way Sync — Invoice, Budget, MTD

All sync operations between Invoice, Budget (Transactions), and MTD (MtdTransactions) go through `utils/invoiceSync.ts`. This file contains the five sync operations that maintain data integrity across all three modules. The sync is the single source of truth for cross-module mutations.

| Source | Sync Direction |
|--------|---------------|
| Invoice marked paid | Creates Transactions row + MtdTransactions row linked via invoiceId and transactionId |
| Invoice marked unpaid | Deletes MtdTransactions row (via invoiceId) + Transactions row (via transactionId) |
| Budget transaction deleted | Deletes MtdTransactions row (via transactionId) + marks invoice unpaid if linked |
| MTD record deleted | Deletes Transactions row (via transactionId) + marks invoice unpaid if linked |
| Invoice deleted | Deletes MtdTransactions row + Transactions row + Invoice row |

### Hook Return Shape

Every hook returns:
```typescript
{
  data,        // typed data or null
  isLoading,   // boolean
  error,       // string | null
  refresh,     // () => Promise<void>
}
```

### UUID

All UUIDs are generated via `utils/generateUuid.ts` which wraps `react-native-uuid`. Never import uuid directly.

### Theme / Colours

Use `useTheme()` from `context/ThemeContext`. Never hardcode colours. Two custom ramps in tailwind.config.ts:
- `invoice-accent`: deep slate-blue (invoicing module)
- `mtd-accent`: rich indigo (MTD module)

### Settings

Use `useAppSettings()` hook for reading/writing appSettings. Never read appSettings directly in a screen.

---

## Navigation Structure

### Drawer (left swipe)

Custom drawer via `components/DrawerContent.tsx` with three sections:

| Section | Items |
|---------|-------|
| **Main** | Home, Invoices, Tax (MTD), Budget, Scanner |
| **Tools** | Charts & Analytics, Client Information, Terms & Conditions |
| **Account** | Your Information, Settings, MTD Info |

Footer shows theme toggle and app version.

### Tabs (inside Drawer)

5 tabs: Home, Invoices, Tax, Budget, Scanner
- `app/(drawer)/(tabs)/home.tsx` — Cross-module dashboard
- `app/(drawer)/(tabs)/invoices.tsx` — Invoice and estimate list
- `app/(drawer)/(tabs)/tax.tsx` — MTD hub
- `app/(drawer)/(tabs)/budget.tsx` — Budget transactions
- `app/(drawer)/(tabs)/scanner.tsx` — Document scanner

### Stack Screens (pushed from tabs/drawer)

| Screen | File |
|--------|------|
| Create Invoice | `app/(stack)/createInvoice.tsx` |
| Create Estimate | `app/(stack)/createEstimate.tsx` |
| Client Info | `app/(stack)/clientInfo.tsx` |
| Add Transaction | `app/(stack)/addTransaction.tsx` |
| Add MTD Transaction | `app/(stack)/addMtdTransaction.tsx` |
| MTD Deadlines | `app/(stack)/mtdDeadlines.tsx` |
| MTD Quarterly Summary | `app/(stack)/mtdQuarterlySummary.tsx` |
| MTD Annual Estimate | `app/(stack)/mtdAnnualEstimate.tsx` |
| Terms & Conditions | `app/(stack)/termsAndConditions.tsx` |
| Settings (Stack) | `app/(stack)/settings.tsx` |
| User Info | `app/(stack)/(user)/userInfo.tsx` |
| User Info Form | `app/(stack)/(user)/userInfoForm.tsx` |
| Bank Details Form | `app/(stack)/(user)/bankDetailsForm.tsx` |

### Drawer Screens

| Screen | File |
|--------|------|
| Charts | `app/(drawer)/charts.tsx` |
| Settings | `app/(drawer)/settings.tsx` |
| MTD Info | `app/(drawer)/info.tsx` |

---

## Fixes Applied During Documentation

### Fix 1 — estimateTax() negative profit bug
**File:** utils/mtdTaxCalc.ts
**Problem:** When expenses exceeded income, `taxableProfit` became negative, causing `personalAllowanceUsed` to be negative (e.g., min(12570, -5000) = -5000). This produced incorrect tax estimates — income tax and NI calculations were meaningless with negative profit inputs.
**Fix:** Changed `taxableProfit = grossIncome - totalAllowableExpenses` to `taxableProfit = Math.max(0, grossIncome - totalAllowableExpenses)`. Net profit cannot be negative in HMRC calculations.
**Commit:** [FIX] Clamp taxableProfit to zero in estimateTax()

### Fix 2 — Variable shadowing in addMtdTransaction()
**File:** db/mtdOperations.ts
**Problem:** The parameter name `tx` in `addMtdTransaction(tx, userId)` shadowed the function name itself. While not a runtime bug, it created confusion between the parameter and the concept of "transaction" in Drizzle's `db.transaction()`.
**Fix:** Renamed parameter from `tx` to `data` throughout the function body.
**Commit:** [FIX] Rename parameter tx to data in addMtdTransaction()

---

## Hooks

### useAppSettings
**File:** hooks/useAppSettings.ts
**Purpose:** Single source of truth for reading and writing app settings. Wraps AppSettingsContext.

**Used by:** Every screen and hook that needs settings — tax.tsx, mtdAnnualEstimate.tsx, mtdQuarterlySummary.tsx, addMtdTransaction.tsx, createInvoice.tsx, createEstimate.tsx, home.tsx, settings.tsx, and all MTD hooks.

**What it does:**
- Reads `settings` from AppSettingsContext
- Provides `update(partial)` to update specific fields
- Provides `refresh()` to reload settings from DB
- Provides `getSetting(key)` for individual field access
- Provides convenience functions: `getSettingsForCalculations()`, `validateSettings()`, `resetSettings()`
- Provides MTD tax rate helpers: `getTaxRates()`, `updateTaxRates()`, `resetTaxRates()`

**Parameters:** None (no parameters — reads from context)

**Returns:**
| Field | Type | Description |
|-------|------|-------------|
| settings | AppSettings \| null | Current settings object or null while loading |
| isLoading | boolean | True while initial load in progress |
| error | string \| null | Error message if settings failed to load |
| update | (s: Partial\<AppSettings\>) => Promise\<void\> | Update specific fields |
| refresh | () => Promise\<void\> | Reload from DB |
| getSetting | (key) => value | Get single field |
| getSettingsForCalculations | () => object | Returns defaults for invoice/estimate creation |
| validateSettings | () => string[] | Returns array of missing required field names |
| resetSettings | () => Promise\<void\> | Reset to defaults |
| getTaxRates | () => TaxRates | Parse tax rates from JSON settings |
| updateTaxRates | (TaxRates) => Promise\<void\> | Serialize and save tax rates |
| resetTaxRates | () => Promise\<void\> | Reset to RATES_2025_26 |

**Loading state:** isLoading = true during context initialization, clears when DB read completes.
**Error state:** error set if DB read throws; caller should show error UI.
**Refresh:** Calls loadSettings() which re-reads all settings from DB.

**Example:**
```typescript
const { settings, update } = useAppSettings();
await update({ quarterlyTaxEnabled: true });
```

---

### useMtdData
**File:** hooks/useMtdData.ts
**Purpose:** Fetches quarterly aggregates for a specific tax year, quarter, and user. This is the primary data hook for MTD screens.

**Used by:** app/(drawer)/(tabs)/tax.tsx, app/(stack)/mtdQuarterlySummary.tsx, app/(stack)/mtdAnnualEstimate.tsx, app/(drawer)/(tabs)/home.tsx

**What it does:**
1. On mount (and when params change), calls `aggregateQuarter()` from db/mtdOperations.ts
2. Sets isLoading = true during fetch
3. On success, stores QuarterAggregates in state
4. On error, stores error message and shows Alert.alert()
5. refresh() re-fetches the same quarter

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| taxYear | string | Tax year label e.g. "2025-26" |
| quarter | 1 \| 2 \| 3 \| 4 | Quarter number |
| userId | string | User ID (from settings) |

**Returns:**
| Field | Type | Description |
|-------|------|-------------|
| aggregates | QuarterAggregates \| null | Aggregated income/expenses or null |
| isLoading | boolean | True during fetch |
| error | string \| null | Error message |
| refresh | () => Promise\<void\> | Re-fetch same quarter |

**Loading state:** True when taxYear, quarter, or userId changes; clears on completion.
**Error state:** Set if aggregateQuarter throws; Alert.alert() shown in hook.
**Side effects:** None — read-only hook.

**Example:**
```typescript
const { aggregates, isLoading, refresh } = useMtdData({
  taxYear: '2025-26', quarter: 1, userId: settings.userId,
});
```

---

### useMtdDeadlines
**File:** hooks/useMtdDeadlines.ts
**Purpose:** Computes MTD deadlines for the current and next N tax years. No DB calls — pure computation from current date and settings.

**Used by:** app/(drawer)/(tabs)/tax.tsx, app/(stack)/mtdDeadlines.tsx

**What it does:**
1. Reads `quarterlyTaxReminderDays` from useAppSettings()
2. Calls `currentTaxYear()` and `nextTaxYear()` from mtdDates.ts
3. Maps each quarter through `deadlineStatus()` to classify: overdue, urgent, soon, ok
4. Computes final declaration deadline
5. Identifies `nextDeadline` (earliest non-ok deadline)

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| yearsAhead | number (optional, default 1) | How many tax years to compute |

**Returns:**
| Field | Type | Description |
|-------|------|-------------|
| deadlines | DeadlineItem[] | All quarterly + final deadlines |
| nextDeadline | DeadlineItem \| null | Earliest upcoming deadline |
| urgentDays | number | From settings.quarterlyTaxReminderDays |

**Loading state:** Always false (pure computation).
**Error state:** Always null.
**Example:**
```typescript
const { deadlines, nextDeadline } = useMtdDeadlines(2);
```

---

### useMtdTransaction
**File:** hooks/useMtdTransaction.ts
**Purpose:** Provides functions to add, delete, and fetch MTD manual transaction records.

**Used by:** app/(stack)/addMtdTransaction.tsx, app/(stack)/mtdQuarterlySummary.tsx

**What it does:**
- `addTransaction(data)` — Creates an MtdTransactions row via db/mtdOperations.addMtdTransaction(). Shows success/error Alert.
- `deleteTransaction(id)` — Deletes an MtdTransactions row via deleteMtdTransactionByIdSync(). Shows success/error Alert.
- `getTransactions(taxYear, quarter)` — Fetches all MTD transactions for a quarter via getMtdTransactions().

**Returns:**
| Field | Type | Description |
|-------|------|-------------|
| addTransaction | (data) => Promise\<void\> | Add new MTD record |
| deleteTransaction | (id) => Promise\<void\> | Delete MTD record |
| getTransactions | (ty, q) => Promise\<any[]\> | Fetch quarter transactions |
| isLoading | boolean | True during any operation |

**Side effects:** DB writes to MtdTransactions table. Success/error Alerts shown in hook.

**Example:**
```typescript
const { addTransaction, isLoading } = useMtdTransaction();
await addTransaction({ date: '2025-07-15', description: 'Office supplies', amount: 50, type: 'expense', category: 'costOfGoodsAllowable' });
```

---

### useInvoiceData
**File:** hooks/useInvoiceData.ts
**Purpose:** CRUD operations for invoices. Loads all invoices with work items and payments on mount.

**Used by:** app/(drawer)/(tabs)/invoices.tsx, components/InvoiceForm/InvoiceForm.tsx

**What it does:**
1. On mount, calls `loadInvoices()` which fetches all invoices via invoiceOperations.ts
2. Each invoice includes joined workItems and payments arrays
3. Provides create, update, delete, refresh operations
4. Delete cascades through sync service (marks MTD + budget records deleted)

**Returns:**
| Field | Type | Description |
|-------|------|-------------|
| invoices | InvoiceWithRelations[] | All invoices with workItems and payments |
| isLoading | boolean | True during load |
| createInvoice | (data) => Promise\<string\> | Create new invoice, returns ID |
| updateInvoice | (id, data) => Promise\<void\> | Update invoice fields |
| deleteInvoice | (id) => Promise\<void\> | Delete invoice (cascades via sync) |
| refresh | () => Promise\<void\> | Reload all invoices |

**Side effects:** DB writes to Invoice, InvoiceWorkInformation, InvoicePayments tables. Alert.alert() for errors.

---

### useEstimateData
**File:** hooks/useEstimateData.ts
**Purpose:** CRUD operations for estimates.

**Used by:** app/(drawer)/(tabs)/invoices.tsx, components/EstimateForm/EstimateForm.tsx

**What it does:**
1. On mount, calls `loadEstimates()` which fetches all estimates via estimateOperations.ts
2. Each estimate includes joined workItems and notes arrays
3. Provides create, update, delete, refresh operations

**Returns:**
| Field | Type | Description |
|-------|------|-------------|
| estimates | EstimateWithRelations[] | All estimates |
| isLoading | boolean | True during load |
| createEstimate | (data) => Promise\<string\> | Create estimate, returns ID |
| updateEstimate | (id, data) => Promise\<void\> | Update estimate |
| deleteEstimate | (id) => Promise\<void\> | Delete estimate |
| refresh | () => Promise\<void\> | Reload |

---

### useBudgetData
**File:** hooks/useBudgetData.ts
**Purpose:** Loads and manages budget transactions. Provides grouping, filtering, and totals.

**Used by:** app/(drawer)/(tabs)/budget.tsx, components/BudgetScreen.tsx

**What it does:**
1. On mount and focus, loads all transactions via transactionOperations.ts
2. Groups transactions by month and category
3. Computes totals: income, expenses, balance
4. Provides delete, refresh operations
5. Delete cascades through sync service if linked to MTD/invoice

**Returns:**
| Field | Type | Description |
|-------|------|-------------|
| transactions | Transactions[] | All transactions |
| groupedTransactions | GroupedByMonth | Transactions grouped by month |
| totalIncome | number | Sum of income transactions |
| totalExpenses | number | Sum of expense transactions |
| balance | number | Income minus expenses |
| isLoading | boolean | True during load |
| refresh | () => Promise\<void\> | Reload |
| deleteTransaction | (id) => Promise\<void\> | Delete (cascades via sync) |

---

### useTransaction
**File:** hooks/useTransaction.ts
**Purpose:** CRUD operations for a single budget transaction.

**Used by:** app/(stack)/addTransaction.tsx

**What it does:**
- `addTransaction(data)` — Creates a Transactions row. Shows success/error Alert.
- `updateTransaction(id, data)` — Updates a Transactions row.
- `deleteTransaction(id)` — Deletes a Transactions row. Warns if linked to invoice/MTD.

**Returns:**
| Field | Type | Description |
|-------|------|-------------|
| addTransaction | (data) => Promise\<void\> | Add transaction |
| updateTransaction | (id, data) => Promise\<void\> | Update transaction |
| deleteTransaction | (id) => Promise\<void\> | Delete transaction |
| isLoading | boolean | True during operations |

---

### useCustomerData
**File:** hooks/useCustomerData.ts
**Purpose:** CRUD operations for customers.

**Used by:** app/(stack)/clientInfo.tsx, components/CustomerForm/CustomerForm.tsx

**What it does:**
1. On mount, loads all customers via customerOperations.ts
2. Provides create, update, delete operations

**Returns:**
| Field | Type | Description |
|-------|------|-------------|
| customers | Customer[] | All customers |
| isLoading | boolean | True during load |
| createCustomer | (data) => Promise\<string\> | Create customer |
| updateCustomer | (id, data) => Promise\<void\> | Update customer |
| deleteCustomer | (id) => Promise\<void\> | Delete customer |
| refresh | () => Promise\<void\> | Reload |

---

### useUserData
**File:** hooks/useUserData.ts
**Purpose:** CRUD operations for user profile and bank details.

**Used by:** app/(stack)/(user)/userInfo.tsx, app/(stack)/(user)/userInfoForm.tsx, app/(stack)/(user)/bankDetailsForm.tsx

**What it does:**
1. On mount, loads user and bank details from DB
2. Provides createUser, updateUser, createBankDetails, updateBankDetails
3. Refreshes AppSettingsContext after writes

**Returns:**
| Field | Type | Description |
|-------|------|-------------|
| user | User \| null | User profile |
| bankDetails | BankDetails \| null | Bank details |
| isLoading | boolean | True during load |
| createUser | (data) => Promise\<void\> | Create user |
| updateUser | (data) => Promise\<void\> | Update user |
| createBankDetails | (data) => Promise\<void\> | Create bank details |
| updateBankDetails | (data) => Promise\<void\> | Update bank details |
| refresh | () => Promise\<void\> | Reload |

---

### useAddInvoiceToBudget
**File:** hooks/useAddInvoiceToBudget.ts
**Purpose:** Manages the flow of adding an invoice amount to budget as income. Shows a category picker modal.

**Used by:** components/InvoiceForm/MarkAsPaidWithBudget.tsx

**What it does:**
1. Provides category selection (income categories from categories.ts)
2. On confirm, creates a Transactions row with type 'income' and selected category
3. Shows/hides modal state

**Returns:**
| Field | Type | Description |
|-------|------|-------------|
| isCategoryModalVisible | boolean | Modal visibility |
| selectedCategory | string | Currently selected category |
| showCategoryModal | () => void | Show modal |
| hideCategoryModal | () => void | Hide modal |
| setSelectedCategory | (cat) => void | Set category |
| handleAddInvoicesToBudget | (invoices) => Promise\<void\> | Add invoices to budget |
| incomeCategories | CategoryOption[] | Available income categories |

---

### useIsInvoicePaid
**File:** hooks/useIsInvoicePaid.ts
**Purpose:** Tracks whether an invoice is paid, with optimistic updates.

**Used by:** components/InvoiceForm/InvoiceSettingsModal.tsx

**What it does:**
1. Reads `isPayed` from the invoice object
2. Provides `setIsPayedOptimistic(value)` for immediate UI update before DB write completes
3. Re-syncs from invoice prop on invoice.id change

**Returns:**
| Field | Type | Description |
|-------|------|-------------|
| isPayed | boolean | Current paid status |
| setIsPayedOptimistic | (val: boolean) => void | Optimistic update |

---

### useHomeInsights
**File:** hooks/useHomeInsights.ts
**Purpose:** Cross-module data for the home dashboard — aggregates turnover from paid invoices and expense totals from budget transactions.

**Used by:** app/(drawer)/(tabs)/home.tsx

**What it does:**
1. Fetches all paid invoices for current tax year via invoiceOperations
2. Fetches expense totals from budget transactions
3. Fetches MTD quarterly aggregates for all 4 quarters
4. Computes: totalTurnover, totalExpenses, netProfit, unpaidInvoiceCount, unpaidInvoiceTotal
5. Identifies current quarter and next deadline

**Returns:**
| Field | Type | Description |
|-------|------|-------------|
| totalTurnover | number | Sum of paid invoice amounts this year |
| totalExpenses | number | Sum of budget expenses this year |
| netProfit | number | Turnover minus expenses |
| currentQuarter | TaxQuarter | Current quarter info |
| currentQuarterAggregates | QuarterAggregates \| null | Current quarter MTD data |
| nextDeadline | DeadlineItem \| null | Next upcoming deadline |
| isLoading | boolean | True during fetch |
| refresh | () => Promise\<void\> | Reload all data |

---

### useCameraScanner
**File:** hooks/useCameraScanner.ts
**Purpose:** Wraps ML Kit document scanner for receipt scanning.

**Used by:** app/(drawer)/(tabs)/scanner.tsx, app/(stack)/addMtdTransaction.tsx, app/(stack)/addTransaction.tsx

**What it does:**
1. Launches ML Kit document scanner
2. Returns scanned image URIs
3. Handles permissions

**Returns:**
| Field | Type | Description |
|-------|------|-------------|
| scannedData | string[] \| null | Scanned image URIs |
| isLoading | boolean | True during scan |
| handleScan | () => Promise\<void\> | Launch scanner |

---

### useTaxRates
**File:** hooks/useTaxRates.ts
**Purpose:** Returns the current TaxRates object from settings, falling back to RATES_2025_26.

**Used by:** app/(drawer)/(tabs)/tax.tsx, app/(stack)/mtdQuarterlySummary.tsx, app/(stack)/mtdAnnualEstimate.tsx

**What it does:**
1. Reads taxRates from appSettings via useAppSettings()
2. Parses JSON string with parseTaxRates()
3. Returns TaxRates object

**Returns:** TaxRates — the current rates object.

---

## Database Operations

### aggregateQuarter()
**File:** db/mtdOperations.ts
**Purpose:** Aggregates income and expenses for a specific quarter from three sources: paid invoices, budget transactions, and manual MTD records.

**What it does:**
1. Determines quarter boundaries from `quartersForTaxYear()` using the tax year start
2. **Source 1 — Paid Invoices (turnover):** Queries Invoice where isPayed=1, invoiceDate between periodStart and periodEnd. Sums amountAfterTax as invoiceTurnover.
3. **Source 2 — Budget Transactions (expenses):** Queries Transactions where type='expense', date between periodStart and periodEnd. Maps each categoryId to HMRC ExpenseCategory via `mapCategoryToHmrc()`. Sums amounts per HMRC category. Falls back to otherAllowableExpenses if no match.
4. **Source 3 — Manual MTD Records:** Queries MtdTransactions for the given quarter. Separates into manualTurnover and per-category expense amounts.
5. Combines all three into QuarterAggregates with totals, sources breakdown, and netProfit.
6. Computes a tax estimate via `estimateTax()`.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| taxYear | string | e.g. "2025-26" |
| quarter | 1 \| 2 \| 3 \| 4 | Quarter number |
| userId | string | User ID |

**Returns:** QuarterAggregates — containing totalTurnover, totalAllowableExpenses, totalDisallowableExpenses, netProfit, per-category breakdowns, sources breakdown, and taxEstimate.

**Tables read:** Invoice, Transactions, MtdTransactions
**Tables written:** None (read-only)
**Throws:** If DB query fails
**Called by:** hooks/useMtdData.ts

---

### addMtdTransaction()
**File:** db/mtdOperations.ts
**Purpose:** Inserts a new manual MTD transaction record.

**What it does:**
1. Determines tax year and quarter from the transaction date
2. Generates UUID
3. Inserts into MtdTransactions with all fields

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| data | NewMtdTransaction & { invoiceId?: string; transactionId?: string } | Transaction data |
| userId | string | User ID |

**Returns:** void
**Tables written:** MtdTransactions
**Throws:** If insert fails
**Called by:** hooks/useMtdTransaction.ts

---

### deleteMtdTransactionById()
**File:** db/mtdOperations.ts
**Purpose:** Deletes an MTD transaction by ID without cascading to linked records.

**What it does:**
1. Deletes from MtdTransactions where id matches

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| mtdTransactionId | string | MTD transaction ID |

**Returns:** void
**Tables written:** MtdTransactions
**Called by:** utils/invoiceSync.ts (deleteMtdTransactionByIdSync)

---

### getMtdTransactions()
**File:** db/mtdOperations.ts
**Purpose:** Fetches all MTD transactions for a given tax year and quarter.

**What it does:**
1. Queries MtdTransactions where taxYear and quarter match
2. Orders by date descending

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| taxYear | string | e.g. "2025-26" |
| quarter | 1 \| 2 \| 3 \| 4 | Quarter number |

**Returns:** MtdTransactions[] array
**Tables read:** MtdTransactions
**Called by:** app/(stack)/mtdQuarterlySummary.tsx

---

### refreshAnnualSummary()
**File:** db/mtdOperations.ts
**Purpose:** Recomputes and stores the annual summary for a tax year. Stores personalAllowanceUsed as a snapshot.

**What it does:**
1. Fetches all 4 quarters via aggregateQuarter()
2. Aggregates totals: turnover, allowable, disallowable
3. Computes tax estimate via estimateTax() (with netProfit clamped to 0)
4. Upserts into MtdAnnualSummary with snapshot of personalAllowanceUsed, tax estimates, and status

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| taxYear | string | e.g. "2025-26" |
| userId | string | User ID |
| status | 'draft' \| 'final' (default 'draft') | Summary status |

**Returns:** void
**Tables read:** Invoice, Transactions, MtdTransactions
**Tables written:** MtdAnnualSummary
**Design decision:** personalAllowanceUsed is stored as a snapshot so historical estimates remain accurate when HMRC rates change in future years.

---

### loadInvoices()
**File:** db/invoiceOperations.ts
**Purpose:** Fetches all invoices with their work items and payments.

**What it does:**
1. Queries all rows from Invoice table
2. For each invoice, joins InvoiceWorkInformation and InvoicePayments
3. Returns array of InvoiceWithRelations

**Returns:** InvoiceWithRelations[]
**Tables read:** Invoice, InvoiceWorkInformation, InvoicePayments
**Called by:** hooks/useInvoiceData.ts

---

### createInvoice()
**File:** db/invoiceOperations.ts
**Purpose:** Creates a new invoice with work items and payments in a single transaction.

**What it does:**
1. Uses `db.transaction()` for atomicity
2. Inserts invoice row into Invoice table
3. Inserts work items into InvoiceWorkInformation
4. Inserts payments into InvoicePayments
5. Generates next invoice number if auto-increment enabled

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| invoiceData | InvoiceType | Invoice fields |
| workItems | WorkInformationType[] | Line items |
| payments | PaymentType[] | Payment records |

**Returns:** string — the new invoice ID
**Tables written:** Invoice, InvoiceWorkInformation, InvoicePayments
**Throws:** If any insert fails (transaction rolls back)

---

### updateInvoice()
**File:** db/invoiceOperations.ts
**Purpose:** Updates an invoice's fields.

**What it does:**
1. Updates Invoice row where id matches
2. Optionally updates work items and payments if provided

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| id | string | Invoice ID |
| data | Partial\<InvoiceType\> | Fields to update |

**Returns:** void
**Tables written:** Invoice (and optionally InvoiceWorkInformation, InvoicePayments)

---

### deleteInvoice()
**File:** db/invoiceOperations.ts
**Purpose:** Deletes an invoice and its related records.

**What it does:**
1. Deletes from InvoiceWorkInformation where invoiceId matches
2. Deletes from InvoicePayments where invoiceId matches
3. Deletes from Invoice where id matches

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| id | string | Invoice ID |

**Returns:** void
**Tables written:** Invoice, InvoiceWorkInformation, InvoicePayments

---

### getNextInvoiceNumber()
**File:** db/invoiceOperations.ts
**Purpose:** Gets the next available invoice number based on settings.

**What it does:**
1. Reads invoicePrefix and nextInvoiceNumber from appSettings
2. Returns formatted string like "INV-001"

**Returns:** string
**Tables read:** AppSettings

---

### loadEstimates(), createEstimate(), updateEstimate(), deleteEstimate()
**File:** db/invoiceOperations.ts
**Purpose:** CRUD operations for estimates, mirroring invoice operations.

**Tables read/written:** Estimates, EstimateWorkInformation, EstimateNotes

---

### loadTransactions()
**File:** db/queries.ts
**Purpose:** Fetches all budget transactions.

**Returns:** Transactions[]
**Tables read:** Transactions
**Called by:** hooks/useBudgetData.ts

---

### createTransaction()
**File:** db/queries.ts
**Purpose:** Creates a new budget transaction.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| data | NewTransactionType | Transaction fields |

**Returns:** string — new transaction ID
**Tables written:** Transactions

---

### updateTransaction()
**File:** db/queries.ts
**Purpose:** Updates a budget transaction.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| id | string | Transaction ID |
| data | Partial\<TransactionType\> | Fields to update |

**Tables written:** Transactions

---

### deleteTransactionById()
**File:** db/queries.ts
**Purpose:** Deletes a budget transaction by ID without cascading.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| id | string | Transaction ID |

**Tables written:** Transactions

---

### loadCustomers(), createCustomer(), updateCustomer(), deleteCustomer()
**File:** utils/customerOperations.ts
**Purpose:** CRUD operations for customers.

**Tables read/written:** Customer

---

### loadUsers(), createUser(), updateUser()
**File:** db/queries.ts
**Purpose:** CRUD operations for user profile.

**Tables read/written:** User

---

### loadBankDetails(), createBankDetails(), updateBankDetails()
**File:** db/queries.ts
**Purpose:** CRUD operations for bank details.

**Tables read/written:** BankDetails

---

### loadAppSettings(), updateAppSettings()
**File:** db/queries.ts
**Purpose:** Read and write the single appSettings row.

**loadAppSettings()** — Fetches the first row from AppSettings. Returns AppSettings or null.
**updateAppSettings()** — Upserts partial fields into AppSettings row.

**Tables read/written:** AppSettings

---

### markInvoiceAsPaid()
**File:** utils/invoiceSync.ts
**Purpose:** Marks an invoice as paid and creates linked budget + MTD records atomically.

**What it does:**
1. Updates Invoice.isPayed = true, paymentDate = provided date
2. Creates Transactions row with type 'income', amount from invoice, category from selected income category
3. Creates MtdTransactions row with type 'income', category 'turnover', linked via invoiceId and transactionId
4. All in a single Drizzle transaction for atomicity
5. Calls refreshCurrentYear() after commit

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| invoiceId | string | Invoice to mark paid |
| amount | number | Payment amount |
| currency | string | Currency code |
| paymentDate | string | ISO date string |
| incomeCategory | string | Budget income category |
| customerName | string | For description |

**Tables written:** Invoice, Transactions, MtdTransactions
**Throws:** If any step fails (full rollback)

---

### markInvoiceAsUnpaid()
**File:** utils/invoiceSync.ts
**Purpose:** Reverses a paid invoice — deletes linked MTD and budget records.

**What it does:**
1. Finds MtdTransactions row via invoiceId
2. If found, gets transactionId from it
3. Deletes MtdTransactions row
4. Deletes Transactions row if transactionId exists
5. Updates Invoice.isPayed = false
6. Calls refreshCurrentYear()

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| invoiceId | string | Invoice to mark unpaid |

**Tables written:** Invoice, Transactions, MtdTransactions

---

### deleteBudgetTransactionSync()
**File:** utils/invoiceSync.ts
**Purpose:** Deletes a budget transaction with cascading to MTD and invoice.

**What it does:**
1. Finds MtdTransactions row via transactionId
2. If found and has invoiceId: marks Invoice.isPayed = false
3. Deletes MtdTransactions row if found
4. Deletes Transactions row
5. Calls refreshCurrentYear()

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| transactionId | string | Transaction to delete |

**Tables written:** Transactions, MtdTransactions, Invoice (conditional)

---

### deleteMtdTransactionByIdSync()
**File:** utils/invoiceSync.ts
**Purpose:** Deletes an MTD transaction with cascading to budget and invoice.

**What it does:**
1. Finds MtdTransactions row by ID
2. If has transactionId: deletes Transactions row
3. If has invoiceId: marks Invoice.isPayed = false
4. Deletes MtdTransactions row
5. Calls refreshCurrentYear()

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| mtdTransactionId | string | MTD record to delete |

**Tables written:** MtdTransactions, Transactions (conditional), Invoice (conditional)

---

### deleteInvoiceFull()
**File:** utils/invoiceSync.ts
**Purpose:** Deletes an invoice with full cascade — removes linked MTD and budget records.

**What it does:**
1. Finds MtdTransactions rows via invoiceId
2. For each: deletes linked Transactions row
3. Deletes all MtdTransactions rows for this invoice
4. Deletes InvoiceWorkInformation and InvoicePayments
5. Deletes Invoice row
6. Calls refreshCurrentYear()

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| invoiceId | string | Invoice to delete |

**Tables written:** Invoice, InvoiceWorkInformation, InvoicePayments, MtdTransactions, Transactions

---

## Utility Functions

### taxYearForDate()
**File:** utils/mtdDates.ts
**Purpose:** Determines which UK tax year a date belongs to.
**Pure function:** Yes

**What it does:**
UK tax year runs 6 April to 5 April. If the date is on or after 6 April, it belongs to the tax year starting that year. If before 6 April, it belongs to the previous tax year.
Example: 5 April 2026 → tax year 2025. 6 April 2026 → tax year 2026.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| date | Date | Any date |

**Returns:** number — tax year start year (e.g. 2025)

**Example:** taxYearForDate(new Date('2025-07-15')) → 2025

---

### quarterForDate()
**File:** utils/mtdDates.ts
**Purpose:** Returns the full quarter object for a date.
**Pure function:** Yes

**What it does:**
1. Gets the tax year for the date
2. Gets all quarters for that tax year via `quartersForTaxYear()`
3. Compares the date (as YYYY-MM-DD ISO string) against each quarter's periodStart and periodEnd
4. Returns the matching TaxQuarter

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| date | Date | Any date |

**Returns:** TaxQuarter — { quarter, label, periodStart, periodEnd, submissionDeadline, taxYear }

**Example:** quarterForDate(new Date('2025-07-15')) → { quarter: 2, label: 'Q2 (Jul-Oct 2025)', ... }

---

### quartersForTaxYear()
**File:** utils/mtdDates.ts
**Purpose:** Returns all four quarters for a given tax year start.
**Pure function:** Yes

**What it does:**
Computes periodStart, periodEnd, and submissionDeadline for each quarter:
- Q1: 6 Apr – 5 Jul, deadline 7 Aug
- Q2: 6 Jul – 5 Oct, deadline 7 Nov
- Q3: 6 Oct – 5 Jan +1yr, deadline 7 Feb +1yr
- Q4: 6 Jan – 5 Apr +1yr, deadline 7 May +1yr

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| startYear | number | Tax year start (e.g. 2025) |

**Returns:** TaxQuarter[] — array of 4 quarters

---

### currentTaxYear()
**File:** utils/mtdDates.ts
**Purpose:** Returns the TaxYear object for the current date.
**Pure function:** Yes (reads system date)

**Returns:** TaxYear — { startYear, endYear, label, quarters }

---

### currentTaxYearStart()
**File:** utils/mtdDates.ts
**Purpose:** Returns just the start year of the current tax year.
**Pure function:** Yes

**Returns:** number — e.g. 2025

---

### taxYearLabel()
**File:** utils/mtdDates.ts
**Purpose:** Formats a tax year start into "YYYY-YY" label.
**Pure function:** Yes

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| startYear | number | e.g. 2025 |

**Returns:** string — e.g. "2025-26"

---

### deadlineStatus()
**File:** utils/mtdDates.ts
**Purpose:** Classifies a deadline as overdue, urgent, soon, or ok based on days until and settings.
**Pure function:** Yes

**What it does:**
1. Computes days until deadline
2. Compares against urgentDays from settings (quarterlyTaxReminderDays)
3. Returns: 'overdue' if past, 'urgent' if ≤ urgentDays, 'soon' if ≤ 30, 'ok' otherwise

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| deadline | string | ISO date string |
| urgentDays | number | From settings.quarterlyTaxReminderDays |

**Returns:** 'overdue' | 'urgent' | 'soon' | 'ok'

---

### toISO()
**File:** utils/mtdDates.ts
**Purpose:** Converts a Date to YYYY-MM-DD string.
**Pure function:** Yes

**Example:** toISO(new Date('2025-07-15T10:30:00Z')) → "2025-07-15"

---

### fromISO()
**File:** utils/mtdDates.ts
**Purpose:** Parses a YYYY-MM-DD string to a Date.
**Pure function:** Yes

---

### estimateTax()
**File:** utils/mtdTaxCalc.ts
**Purpose:** Computes income tax and NI estimates from gross income and allowable expenses.
**Pure function:** Yes

**What it does:**
1. Net profit = max(0, grossIncome - totalAllowableExpenses)
2. Taxable profit = net profit
3. Personal allowance used = min(personalAllowance, taxableProfit)
4. Taxable after allowance = max(0, taxableProfit - personalAllowanceUsed)
5. Basic rate tax = min(taxableAfterAllowance, basicRateThreshold - personalAllowance) × 20%
6. Higher rate tax = min(max(0, taxableAfterAllowance - basicBand), higherBand) × 40%
7. Additional rate tax = max(0, taxableAfterAllowance - basicBand - higherBand) × 45%
8. Class 4 NI lower = max(0, min(taxableProfit, ni4Upper) - ni4Lower) × 6%
9. Class 4 NI upper = max(0, taxableProfit - ni4Upper) × 2%
10. Class 2 NI = £3.45 × 52 if taxableProfit ≥ £12,570
11. effectiveRate = totalTaxAndNI / grossIncome × 100
12. quarterlySetAside = totalTaxAndNI / 4

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| grossIncome | number | Total turnover |
| totalAllowableExpenses | number | Total allowable expenses |
| rates | TaxRates | Tax rates (defaults to RATES_2025_26) |

**Returns:** TaxEstimate — all calculated fields

**Example:** estimateTax(60000, 10000) → net profit £50,000, total tax + NI estimate

---

### projectFullYearTax()
**File:** utils/mtdTaxCalc.ts
**Purpose:** Projects a full year tax estimate from partial data by multiplying by 4/currentQuarter.
**Pure function:** Yes

**What it does:**
1. Computes multiplier = 4 / currentQuarter
2. Multiplies incomeToDate and expensesToDate by multiplier
3. Passes to estimateTax()

**Why:** When only 1-3 quarters of data exist, multiplying gives an annual projection. Used by mtdAnnualEstimate.tsx when not all 4 quarters have data.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| currentQuarter | 1 \| 2 \| 3 \| 4 | How many quarters of data exist |
| incomeToDate | number | Cumulative income |
| expensesToDate | number | Cumulative expenses |
| rates | TaxRates | Tax rates |

**Returns:** TaxEstimate

---

### formatGBP()
**File:** utils/mtdTaxCalc.ts
**Purpose:** Formats a number as GBP currency string.
**Pure function:** Yes

**Example:** formatGBP(1234.5) → "£1,234.50"

---

### formatPercent()
**File:** utils/mtdTaxCalc.ts
**Purpose:** Formats a number as percentage string.
**Pure function:** Yes

**Example:** formatPercent(15.67) → "15.7%"

---

### parseTaxRates()
**File:** utils/mtdTaxCalc.ts
**Purpose:** Parses a JSON string from appSettings into TaxRates, falling back to defaults.
**Pure function:** Yes

---

### serializeTaxRates()
**File:** utils/mtdTaxCalc.ts
**Purpose:** Serializes TaxRates to JSON string for storage.
**Pure function:** Yes

---

### mapCategoryToHmrc()
**File:** utils/mtdCategories.ts
**Purpose:** Maps a budget transaction categoryId to an HMRC ExpenseCategory.
**Pure function:** Yes

**What it does:**
Looks up the categoryId in CATEGORY_TO_HMRC_MAP. If not found, falls back to 'otherAllowableExpenses' — nothing is ever lost.

**Mapping rationale:**
| Budget Category | HMRC Category | Why |
|----------------|---------------|-----|
| food | costOfGoodsAllowable | Raw materials/goods |
| transport | otherAllowableExpenses | Travel costs |
| utility | premisesRunningCosts | Running business premises |
| salary | employeeCosts | Staff costs |
| rent | premisesRunningCosts | Premises costs |
| insurance | otherAllowableExpenses | Business insurance |
| equipment | costOfGoodsAllowable | Business equipment |
| maintenance | maintenanceCosts | Repairs and maintenance |
| marketing | advertisingCosts | Advertising |
| subscription | otherAllowableExpenses | Software/subscriptions |
| phone | otherAllowableExpenses | Comms costs |
| fuel | otherAllowableExpenses | Vehicle fuel |
| entertainment | businessEntertainmentCosts | Not allowable but tracked |
| professional_fees | professionalFees | Accountant/legal |
| training | otherAllowableExpenses | Professional development |
| tax | otherAllowableExpenses | Business taxes |
| breakfast | otherAllowableExpenses | Subsistence |

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| categoryId | string | Budget category ID |

**Returns:** ExpenseCategory

---

### isAllowable()
**File:** utils/mtdCategories.ts
**Purpose:** Returns true if an HMRC category is allowable for tax deduction.
**Pure function:** Yes

Returns false for: businessEntertainmentCosts, otherDisallowableExpenses.

---

### generateId()
**File:** utils/generateUuid.ts
**Purpose:** Generates a UUID v4 string.
**Pure function:** Yes

Always import from this file, never from react-native-uuid directly.

---

### getCurrencySymbol()
**File:** utils/getCurrencySymbol.ts
**Purpose:** Returns the currency symbol for a currency code.
**Pure function:** Yes

**Example:** getCurrencySymbol('GBP') → '£', getCurrencySymbol('USD') → '$'

---

### getSettingsForCalculations()
**File:** utils/settingsOperations.ts
**Purpose:** Returns default values for invoice/estimate creation from appSettings.
**Pure function:** No (reads from DB)

Returns: { defaultVatRate, taxScheme, applyTaxByDefault, defaultNotes, defaultPaymentTerms, invoicePrefix, nextInvoiceNumber, estimatePrefix, nextEstimateNumber }

---

### getCategories()
**File:** utils/categories.ts
**Purpose:** Returns the list of budget transaction categories (income and expense).
**Pure function:** Yes

---

### Invoice-specific utils

**calculateInvoiceTotals()** (utils/invoiceCalculations.ts) — Computes subtotal, tax, total from work items. Applies taxScheme (standard vs inclusive).

**calculateEstimateTotals()** (utils/estimateCalculations.ts) — Same as invoice but for estimates.

**groupInvoices()** (utils/invoiceGrouping.ts) — Groups invoices by status (paid, unpaid, overdue).

**groupInvoicesByFinancial()** (utils/invoiceFinancialGrouping.ts) — Groups by month for charts.

---

## Screens

### Home
**File:** app/(drawer)/(tabs)/home.tsx
**Navigator:** Tab (inside Drawer)

**Purpose:** Cross-module dashboard showing current quarter turnover, expenses, net profit, next MTD deadline, and unpaid invoice alerts.

**Data sources:**
- useHomeInsights() — turnover, expenses, net profit, current quarter, deadlines
- useAppSettings() — userId, quarterlyTaxEnabled

**User actions:**
- Tap "View Tax" → navigates to tax tab
- Tap "View Invoices" → navigates to invoices tab
- Tap "View Budget" → navigates to budget tab
- Tap unpaid invoice alert → navigates to invoices tab

**Empty state:** Shows "Get started" message when no data exists.
**Loading state:** ActivityIndicator centered.
**Error state:** Error message with retry button.

---

### Invoices
**File:** app/(drawer)/(tabs)/invoices.tsx
**Navigator:** Tab (inside Drawer)

**Purpose:** Lists all invoices and estimates with filtering by status. Tab switcher between Invoices and Estimates.

**Data sources:**
- useInvoiceData() — all invoices
- useEstimateData() — all estimates

**User actions:**
- Tap "+" → navigate to createInvoice or createEstimate
- Tap invoice card → open InvoiceSettingsModal
- Tap estimate card → navigate to createEstimate in edit mode
- Swipe between Invoices and Estimates tabs

**Empty state:** "No invoices yet" with create button.
**Loading state:** ActivityIndicator.
**Error state:** Error message.

---

### Tax
**File:** app/(drawer)/(tabs)/tax.tsx
**Navigator:** Tab (inside Drawer)

**Purpose:** MTD hub screen. Shows current quarter stats (turnover, net profit, estimated quarterly tax), next deadline, top expenses, and navigation tiles to all MTD features.

**Data sources:**
- useMtdData() × 5 (current quarter + Q1-Q4 for yearly turnover)
- useMtdDeadlines() — next deadline
- useTaxRates() — for tax estimates
- useAppSettings() — quarterlyTaxEnabled, autoCalculateQuarters

**User actions:**
- Tap "Enable MTD" → sets quarterlyTaxEnabled = true
- Tap "Add Record" → navigates to addMtdTransaction
- Tap "Quarter Detail" → navigates to mtdQuarterlySummary
- Tap "Annual Estimate" → navigates to mtdAnnualEstimate
- Tap "All Deadlines" → navigates to mtdDeadlines
- Tap deadline card → navigates to mtdDeadlines
- Tap "Refresh Data" (when auto-calc off) → refreshes data

**Enrolment state:** When quarterlyTaxEnabled=false, shows enrolment prompt with MTD threshold info.
**Loading state:** ActivityIndicator in stats area.
**Error state:** Stats show £0.00 with retry.

---

### Budget
**File:** app/(drawer)/(tabs)/budget.tsx
**Navigator:** Tab (inside Drawer)

**Purpose:** Lists all budget transactions grouped by month. Shows income/expense totals and balance.

**Data sources:**
- useBudgetData() — transactions, grouped data, totals

**User actions:**
- Tap "+" → navigate to addTransaction
- Tap delete → confirm then deleteBudgetTransactionSync (cascades to MTD/invoice)
- Pull to refresh

**Empty state:** "No transactions yet" with add button.
**Loading state:** ActivityIndicator.
**Error state:** Error message.

---

### Scanner
**File:** app/(drawer)/(tabs)/scanner.tsx
**Navigator:** Tab (inside Drawer)

**Purpose:** Document scanner using ML Kit. Scans receipts and allows adding them to budget or MTD.

**Data sources:**
- useCameraScanner() — scanned image URIs

**User actions:**
- Tap "Scan" → launches ML Kit scanner
- After scan → option to "Add to Budget" or "Add to MTD"

**Empty state:** Shows scan prompt.
**Loading state:** Shows scanning indicator.

---

### Create Invoice
**File:** app/(stack)/createInvoice.tsx
**Navigator:** Stack

**Purpose:** Form to create or edit an invoice. Uses react-hook-form + zodResolver.

**Data sources:**
- useUserData() — user and bank details
- useCustomerData() — customer list
- useAppSettings() — default values
- useInvoiceData() — create/update operations

**User actions:**
- Fill form fields (customer, work items, dates, notes)
- Toggle tax scheme (standard/inclusive) with live preview
- Save → creates/updates invoice
- Preview PDF
- Share invoice

**Empty state:** N/A (form screen).
**Loading state:** ActivityIndicator on save.

---

### Create Estimate
**File:** app/(stack)/createEstimate.tsx
**Navigator:** Stack

**Purpose:** Form to create or edit an estimate. Mirrors invoice form structure.

**Data sources:**
- useUserData(), useCustomerData(), useAppSettings(), useEstimateData()

**User actions:** Same as createInvoice but for estimates.

---

### Add Transaction
**File:** app/(stack)/addTransaction.tsx
**Navigator:** Stack

**Purpose:** Form to add a budget transaction (income or expense). Uses react-hook-form + zodResolver with newTransactionSchema.

**Data sources:**
- useTransaction() — addTransaction operation
- useCameraScanner() — optional receipt scan

**User actions:**
- Toggle income/expense (coloured: green income, red expense)
- Select date, amount, description, category
- Optional: scan receipt
- Submit → creates Transactions row

---

### Add MTD Transaction
**File:** app/(stack)/addMtdTransaction.tsx
**Navigator:** Stack

**Purpose:** Form for manual MTD income or expense records. Uses react-hook-form + zodResolver with newMtdTransactionSchema.

**Data sources:**
- useMtdTransaction() — addTransaction operation
- useCameraScanner() — optional receipt scan

**User actions:**
- Toggle income/expense (green/red coloured toggle)
- Select date → quarter helper pill badge shows which quarter
- Enter amount, description, HMRC category
- Optional: notes, receipt ref, scan receipt
- Submit → creates MtdTransactions row

**Quarter helper:** Shows "This falls in Q2 — Q2 (Jul-Oct 2025)" as a pill badge below the date picker.

---

### MTD Quarterly Summary
**File:** app/(stack)/mtdQuarterlySummary.tsx
**Navigator:** Stack

**Purpose:** Per-quarter detail with Q1-Q4 horizontal tabs. Shows income, allowable expenses (per HMRC category), disallowable expenses, net profit, quarterly tax estimate, and individual MTD transactions with delete.

**Data sources:**
- useMtdData() — aggregates for selected quarter
- useMtdTransaction() — delete operations
- getMtdTransactions() — individual transactions
- useTaxRates() — for tax estimate

**User actions:**
- Tap Q1-Q4 tabs → switch quarter
- Tap "Add Record" → navigates to addMtdTransaction
- Tap delete icon on transaction → confirm then deleteMtdTransactionSync (cascades)

**Empty state:** "No data for Q{N}" with add record button.
**Loading state:** ActivityIndicator.
**Error state:** Error message with retry.

**Source breakdown:** Shows "From invoices: £X", "Manual records: £Y" under income card.

---

### MTD Annual Estimate
**File:** app/(stack)/mtdAnnualEstimate.tsx
**Navigator:** Stack

**Purpose:** Full-year tax estimate. Aggregates all 4 quarters, shows income & profit summary, SVG tax band bar, income tax breakdown, NI breakdown, and annual summary card.

**Data sources:**
- useMtdData() × 4 (Q1-Q4)
- useTaxRates() — for estimates
- quartersForTaxYear() — key dates

**User actions:**
- Scroll to view all sections
- Tap GOV.UK link → opens external browser

**Projection banner:** When fewer than 4 quarters have data, shows amber warning: "Projection based on N quarter(s) of data."

**SVG Tax Band Bar:** 24px height, rounded end caps, three segments:
- Green = personal allowance
- Indigo = basic rate (20%)
- Amber = higher rate (40%)

**Annual Summary card:** Solid mtd-accent bg, text-4xl total, effective rate, quarterly set-aside.

**Empty state:** "No data yet" with instructions.

---

### MTD Deadlines
**File:** app/(stack)/mtdDeadlines.tsx
**Navigator:** Stack

**Purpose:** Shows all quarterly deadlines and the final declaration deadline with status indicators.

**Data sources:**
- useMtdDeadlines(2) — all deadlines for current + next 2 tax years

**User actions:**
- Tap quarter deadline → navigates to mtdQuarterlySummary with that quarter pre-selected

**Status colours:**
- Overdue: red, 2px border
- Urgent (≤ urgentDays): amber, 2px border
- Soon (≤ 30d): amber, 1px border
- Ok: green, recedes

---

### Client Info
**File:** app/(stack)/clientInfo.tsx
**Navigator:** Stack

**Purpose:** Manage customer list. Add, edit, delete customers.

**Data sources:**
- useCustomerData() — CRUD operations

---

### Terms & Conditions
**File:** app/(stack)/termsAndConditions.tsx
**Navigator:** Stack

**Purpose:** Manage invoice/estimate terms and conditions text.

---

### Charts
**File:** app/(drawer)/charts.tsx
**Navigator:** Drawer

**Purpose:** Charts and analytics — income vs expenses over time, category breakdowns.

**Data sources:**
- useBudgetData() — transactions for chart data
- useHomeInsights() — turnover totals

---

### Settings
**File:** app/(drawer)/settings.tsx
**Navigator:** Drawer

**Purpose:** All app settings in 8 sections: Profile, Bank Details, Tax Defaults, Invoice & Estimate Numbers, MTD & Tax, Appearance, Reminders, About.

**Data sources:**
- useAppSettings() — all settings fields
- useUserData() — user/bank details

**8 sections:**
1. **Profile** — fullName, email, address, phone, UTR (masked), NI (masked), logo
2. **Bank Details** — bankName, accountName, sortCode (XX-XX-XX), accountNumber (masked)
3. **Tax Defaults** — defaultVatRate, taxScheme (standard/inclusive + live preview), applyTaxByDefault, defaultPaymentTerms, defaultNotes
4. **Invoice & Estimate Numbers** — invoicePrefix, nextInvoiceNumber, estimatePrefix, nextEstimateNumber
5. **MTD & Tax** — quarterlyTaxEnabled, autoCalculateQuarters, quarterlyTaxReminderDays, defaultTaxCategory
6. **Appearance** — theme (light/dark/system), currency, dateFormat, numberFormat
7. **Reminders** — reminderEmailEnabled, reminderDaysBeforeDue
8. **About** — version (expo-constants), GOV.UK links

---

### MTD Info
**File:** app/(drawer)/info.tsx
**Navigator:** Drawer

**Purpose:** Reference screen with MTD thresholds, quarterly dates, tax rate tables, and GOV.UK links.

---

### User Info
**File:** app/(stack)/(user)/userInfo.tsx
**Navigator:** Stack

**Purpose:** View and navigate to edit user profile and bank details.

---

### User Info Form
**File:** app/(stack)/(user)/userInfoForm.tsx
**Navigator:** Stack

**Purpose:** Form to edit user profile fields.

---

### Bank Details Form
**File:** app/(stack)/(user)/bankDetailsForm.tsx
**Navigator:** Stack

**Purpose:** Form to edit bank details.

---

## Components

### DrawerContent
**File:** components/DrawerContent.tsx
**Purpose:** Custom drawer content with app name, user info, navigation items, theme toggle, and version.

**Props:** DrawerContentComponentProps (from @react-navigation/drawer)

**Behaviour:**
- Fetches user name/email from DB on mount
- Groups items into Main, Tools, Account sections
- Highlights active route
- Footer shows ThemeToggle and app version

---

### BaseCard
**File:** components/BaseCard.tsx
**Purpose:** Reusable card container with consistent styling, left accent border option.

**Props:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| children | ReactNode | Yes | Card content |
| accentColor | string | No | Left border colour |
| className | string | No | Additional Tailwind classes |

---

### InvoiceSettingsModal
**File:** components/InvoiceForm/InvoiceSettingsModal.tsx
**Purpose:** Bottom sheet modal for invoice actions — mark as paid/unpaid, edit, PDF, share, payment reminder.

**Props:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| showSettings | boolean | Yes | Modal visibility |
| setShowSettings | (b) => void | Yes | Toggle visibility |
| invoice | InvoiceType | Yes | Invoice data |
| customer | CustomerType | No | Customer data |
| user | UserType | Yes | User data |
| onUpdate | (id, data?) => void | Yes | Update callback |
| setIsPayedOptimistic | (b) => void | Yes | Optimistic paid state |
| workItems | any[] | Yes | Work items |
| payments | any[] | Yes | Payments |
| notes | string | Yes | Notes |
| bankDetails | any | Yes | Bank details |
| onSyncComplete | () => void | No | Called after sync |

**Behaviour:**
- Mark as paid: shows income category picker → date picker → confirm → calls markInvoiceAsPaid()
- Mark as unpaid: confirms warning → calls markInvoiceAsUnpaid()
- Edit: navigates to createInvoice
- PDF: calls handleExportPdfInvoice()
- Share: calls handleSendInvoice()
- Payment reminder: calls sendPaymentReminder()

---

### MarkAsPaidWithBudget
**File:** components/InvoiceForm/MarkAsPaidWithBudget.tsx
**Purpose:** Button that marks invoice as paid with optional "add to budget" flow.

**Props:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| invoice | InvoiceForUpdate | Yes | Invoice to mark paid |
| onMarkAsPaid | (id) => Promise\<void\> | Yes | Callback |

**Behaviour:** Shows Alert asking "Add to budget?". If yes, shows AddToBudgetModal for category selection.

---

### InvoiceForm
**File:** components/InvoiceForm/InvoiceForm.tsx
**Purpose:** Full invoice creation/edit form with work items, payments, tax settings.

**Props:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| existingInvoice | InvoiceWithRelations | No | For edit mode |

**Behaviour:** Uses react-hook-form + zodResolver. Manages work items list, payment records, tax calculation preview.

---

### EstimateForm
**File:** components/EstimateForm/EstimateForm.tsx
**Purpose:** Full estimate creation/edit form. Mirrors InvoiceForm structure.

---

### CustomerForm / CustomerFormModal / CustomerList
**File:** components/CustomerForm/
**Purpose:** Customer CRUD components — form, modal, and list view.

---

### UserForm / UserFormModal / UserList / BankDetailsFormModal
**File:** components/UserForm/
**Purpose:** User profile and bank details CRUD components.

---

### TransactionForm
**File:** components/TransactionForm.tsx
**Purpose:** Reusable transaction form used by addTransaction screen.

**Props:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| onSubmit | (data) => Promise\<void\> | Yes | Submit callback |
| defaultValues | Partial\<TransactionType\> | No | Pre-fill values |

---

### TransactionCard
**File:** components/TransactionCard.tsx
**Purpose:** Single transaction row with amount, category, date, and delete action.

---

### TransactionList
**File:** components/TransactionList.tsx
**Purpose:** Renders a list of TransactionCard components, grouped by month.

---

### BudgetScreen
**File:** components/BudgetScreen.tsx
**Purpose:** Full budget screen component with transaction list, totals, and charts.

---

### AddToBudgetModal
**File:** components/AddToBudgetModal.tsx
**Purpose:** Modal for selecting an income category when adding an invoice to budget.

---

### DocumentScanner
**File:** components/DocumentScanner.tsx
**Purpose:** Camera/document scanner component using ML Kit.

---

### DatePicker
**File:** components/DatePicker.tsx
**Purpose:** Date picker wrapper around @react-native-community/datetimepicker.

---

### Picker
**File:** components/Picker.tsx
**Purpose:** Generic picker wrapper around @react-native-picker/picker.

---

### ThemeToggle
**File:** components/ThemeToggle.tsx
**Purpose:** Light/dark mode toggle switch.

---

### DiscountInput
**File:** components/DiscountInput.tsx
**Purpose:** Discount amount/percentage input with toggle.

---

### Email
**File:** components/Email.tsx
**Purpose:** Email composition component for sending invoices.

---

### PhoneNumber
**File:** components/PhoneNumber.tsx
**Purpose:** Phone number display/link component.

---

### TaxValueSwitch
**File:** components/TaxValueSwitch.tsx
**Purpose:** Toggle between standard (add tax on top) and inclusive (tax included) schemes.

---

### TermsAndConditions
**File:** components/TermsAndConditions.tsx
**Purpose:** Terms and conditions text input/display component.

---

### InvoiceEstimateSwitcher
**File:** components/InvoiceEstimateSwitcher.tsx
**Purpose:** Tab switcher between Invoices and Estimates on the invoices screen.

---

### ActionButtons
**File:** components/InvoiceForm/ActionButtons.tsx
**Purpose:** Invoice action buttons — save, preview, share.

---

### InvoiceHeaderSection
**File:** components/InvoiceForm/InvoiceHeaderSection.tsx
**Purpose:** Invoice form header — invoice number, date, due date, customer selection.

---

### WorkItemsList
**File:** components/InvoiceForm/WorkItemsList.tsx
**Purpose:** Dynamic list of work item entries with add/remove.

---

### PaymentsList
**File:** components/InvoiceForm/PaymentsList.tsx
**Purpose:** Payment records list with add/remove.

---

### NotesSection
**File:** components/InvoiceForm/NotesSection.tsx
**Purpose:** Notes text area for invoices.

---

### InvoiceCard
**File:** components/InvoiceForm/InvoiceCard.tsx
**Purpose:** Invoice list item card showing number, customer, amount, status badge.

---

### InvoiceList / GroupedInvoiceList
**File:** components/InvoiceForm/InvoiceList.tsx, GroupedInvoiceList.tsx
**Purpose:** Invoice list views — flat and grouped by status/month.

---

### EstimateActionButtons / EstimateHeaderSection / EstimateNotesSection / EstimateTermsSection
**File:** components/EstimateForm/
**Purpose:** Estimate-specific form sections mirroring invoice equivalents.

---

### EstimateList
**File:** components/EstimateForm/EstimateList.tsx
**Purpose:** Estimate list view.

---

### EstimateSettingsModal
**File:** components/EstimateForm/EstimateSettingsModal.tsx
**Purpose:** Estimate action modal — edit, PDF, share.

---

### AppSettingsForm
**File:** components/AppSettingsForm.tsx
**Purpose:** Settings form component used by the settings screen.

---

### Card
**File:** components/Card.tsx
**Purpose:** Simple card container component.

---

### NoSettingsMessage
**File:** components/NoSettingsMessage.tsx
**Purpose:** Shown when user hasn't completed required settings.

---

### AddTransactionAfterScann
**File:** components/AddTransactionAfterScann.tsx
**Purpose:** Pre-fills a transaction form after scanning a receipt.

---

## Database Schema

### Invoice
**Purpose:** Stores invoice header data — customer, amounts, dates, status.

**Columns:**
| Column | Type | Default | Description |
|--------|------|---------|-------------|
| id | text | — | Primary key, UUID |
| invoiceNumber | text | — | Display number (e.g. "INV-001") |
| customerId | text | — | FK → Customer.id |
| userId | text | — | FK → User.id |
| invoiceDate | text | — | ISO date |
| dueDate | text | — | ISO date |
| currency | text | "GBP" | Currency code |
| subtotal | real | 0 | Net subtotal |
| taxAmount | real | 0 | Tax amount |
| amountAfterTax | real | 0 | Total after tax |
| isPayed | integer | 0 | Boolean (0/1) |
| paymentDate | text | null | ISO date when paid |
| notes | text | null | Free-text notes |
| paymentTerms | text | null | Payment terms |
| taxScheme | text | "standard" | "standard" or "inclusive" |
| taxRate | real | 20 | VAT rate percentage |
| applyTax | integer | 1 | Boolean — whether to apply tax |

**Relationships:** customerId → Customer, userId → User
**Design:** isPayed is integer boolean (SQLite has no boolean type).

---

### InvoiceWorkInformation
**Purpose:** Line items for invoices.

**Columns:**
| Column | Type | Default | Description |
|--------|------|---------|-------------|
| id | text | — | Primary key, UUID |
| invoiceId | text | — | FK → Invoice.id |
| description | text | — | Item description |
| quantity | real | 1 | Quantity |
| unitPrice | real | 0 | Price per unit |
| total | real | 0 | Line total |

---

### InvoicePayments
**Purpose:** Payment records linked to invoices.

**Columns:**
| Column | Type | Default | Description |
|--------|------|---------|-------------|
| id | text | — | Primary key, UUID |
| invoiceId | text | — | FK → Invoice.id |
| amount | real | — | Payment amount |
| date | text | — | Payment date ISO |
| method | text | null | Payment method |
| reference | text | null | Payment reference |

---

### Estimates
**Purpose:** Estimate header data — mirrors Invoice structure.

**Columns:** Same as Invoice with additional: status (draft/sent/accepted/declined).

---

### EstimateWorkInformation
**Purpose:** Line items for estimates. Mirrors InvoiceWorkInformation.

---

### EstimateNotes
**Purpose:** Notes attached to estimates.

---

### Transactions
**Purpose:** Budget transactions — income and expense records.

**Columns:**
| Column | Type | Default | Description |
|--------|------|---------|-------------|
| id | text | — | Primary key, UUID |
| type | text | — | "income" or "expense" |
| amount | real | — | Transaction amount |
| date | text | — | ISO date |
| description | text | — | Description |
| categoryId | text | — | Budget category (from categories.ts) |
| isRecurring | integer | 0 | Boolean |

**Design:** date is stored as text (ISO string) for SQLite compatibility. CategoryId maps to HMRC via mapCategoryToHmrc().

---

### Customer
**Purpose:** Customer contact information.

**Columns:**
| Column | Type | Default | Description |
|--------|------|---------|-------------|
| id | text | — | Primary key, UUID |
| name | text | — | Customer name |
| emailAddress | text | null | Email |
| phoneNumber | text | null | Phone |
| address | text | null | Full address |

---

### User
**Purpose:** Sole trader profile — personal and business info.

**Columns:**
| Column | Type | Default | Description |
|--------|------|---------|-------------|
| id | text | — | Primary key, UUID |
| fullName | text | null | Full name |
| emailAddress | text | null | Email |
| phoneNumber | text | null | Phone |
| address | text | null | Address |
| logoUrl | text | null | Logo image path |
| utr | text | null | UTR number (masked in UI) |
| niNumber | text | null | NI number (masked in UI) |

---

### BankDetails
**Purpose:** Bank account details for invoice payments.

**Columns:**
| Column | Type | Default | Description |
|--------|------|---------|-------------|
| id | text | — | Primary key, UUID |
| userId | text | — | FK → User.id |
| bankName | text | null | Bank name |
| accountName | text | null | Account holder name |
| sortCode | text | null | Sort code (XX-XX-XX) |
| accountNumber | text | null | Account number (masked in UI) |

---

### AppSettings
**Purpose:** Single-row table for all app configuration. Always 0 or 1 rows.

**Columns:**
| Column | Type | Default | Description |
|--------|------|---------|-------------|
| id | text | "1" | Fixed primary key |
| userId | text | null | Current user ID |
| defaultVatRate | real | 20 | Default VAT % |
| taxScheme | text | "standard" | "standard" or "inclusive" |
| applyTaxByDefault | integer | 1 | Auto-apply tax on new invoices |
| defaultNotes | text | null | Default invoice notes |
| defaultPaymentTerms | text | null | Default payment terms |
| invoicePrefix | text | "INV-" | Invoice number prefix |
| nextInvoiceNumber | integer | 1 | Next auto-increment number |
| estimatePrefix | text | "EST-" | Estimate number prefix |
| nextEstimateNumber | integer | 1 | Next estimate number |
| theme | text | "system" | "light" / "dark" / "system" |
| currency | text | "GBP" | Default currency |
| dateFormat | text | "DD/MM/YYYY" | Date display format |
| numberFormat | text | "en-GB" | Number locale |
| quarterlyTaxEnabled | integer | 1 | MTD enabled |
| autoCalculateQuarters | integer | 1 | Auto-compute quarter data |
| quarterlyTaxReminderDays | integer | 14 | Days before deadline for "urgent" |
| defaultTaxCategory | text | "turnover" | Default income category |
| taxRates | text | null | JSON TaxRates override |
| reminderEmailEnabled | integer | 0 | Email reminders on |
| reminderDaysBeforeDue | integer | 7 | Days before due for reminder |
| logoUrl | text | null | Business logo path |

**Design decisions:**
- Single row with fixed id="1" — simplifies reads (no WHERE needed)
- applyTaxByDefault added as separate column rather than extending taxScheme — cleaner UX
- defaultNotes added as separate column — independent of payment terms
- taxRates stored as JSON string — avoids schema migration each April
- quarterlyTaxReminderDays controls deadline urgency classification — not hardcoded

---

### MtdTransactions
**Purpose:** Manual MTD income and expense records. Also stores records created automatically when invoices are marked paid.

**Columns:**
| Column | Type | Default | Description |
|--------|------|---------|-------------|
| id | text | — | Primary key, UUID |
| userId | text | — | FK → User.id |
| invoiceId | text | null | FK → Invoice.id (nullable) |
| transactionId | text | null | FK → Transactions.id (nullable) |
| date | text | — | ISO date |
| description | text | — | Description |
| amount | real | — | Amount |
| type | text | — | "income" or "expense" |
| category | text | — | HMRC ExpenseCategory |
| taxYear | text | — | e.g. "2025-26" |
| quarter | integer | — | 1-4 |
| receiptRef | text | null | Receipt reference |
| notes | text | null | Free-text notes |

**Relationships:**
- invoiceId → Invoice.id (nullable — only set when created from invoice payment)
- transactionId → Transactions.id (nullable — only set when created from budget)

**Design decisions:**
- invoiceId is nullable because manual MTD records have no linked invoice
- transactionId is nullable because manual MTD records have no linked budget entry
- Both FKs exist to enable three-way sync — finding linked records in either direction
- category uses HMRC ExpenseCategory enum, not budget categoryId — direct HMRC mapping
- taxYear and quarter are denormalised (could be computed from date) for efficient quarter queries

---

### MtdQuarterlySummary
**Purpose:** Cached quarterly aggregates for fast dashboard display.

**Columns:**
| Column | Type | Default | Description |
|--------|------|---------|-------------|
| id | text | — | Primary key, UUID |
| userId | text | — | FK → User.id |
| taxYear | text | — | e.g. "2025-26" |
| quarter | integer | — | 1-4 |
| totalTurnover | real | 0 | Total income |
| totalAllowableExpenses | real | 0 | Allowable expenses |
| totalDisallowableExpenses | real | 0 | Disallowable expenses |
| netProfit | real | 0 | Turnover minus allowable |
| estimatedTax | real | 0 | Estimated income tax |
| estimatedNI | real | 0 | Estimated NI |
| totalEstimatedTaxAndNI | real | 0 | Combined estimate |
| status | text | "draft" | "draft" or "final" |
| submittedAt | text | null | Submission date |
| updatedAt | text | — | Last update ISO |

**Indexes:** uniqueIndex on (userId, taxYear, quarter)
**Why userId in uniqueIndex:** Multiple users could share the same device. The unique constraint prevents duplicate summaries per user/quarter combination.

---

### MtdAnnualSummary
**Purpose:** Annual tax summary snapshot for a tax year.

**Columns:**
| Column | Type | Default | Description |
|--------|------|---------|-------------|
| id | text | — | Primary key, UUID |
| userId | text | — | FK → User.id |
| taxYear | text | — | e.g. "2025-26" |
| totalTurnover | real | 0 | Year turnover |
| totalAllowableExpenses | real | 0 | Year expenses |
| totalDisallowableExpenses | real | 0 | Year disallowable |
| netProfit | real | 0 | Year net profit |
| totalIncomeTax | real | 0 | Year income tax |
| totalNI | real | 0 | Year NI |
| totalTaxAndNI | real | 0 | Combined |
| effectiveRate | real | 0 | Effective tax rate % |
| personalAllowanceUsed | real | 0 | Snapshot of PA used |
| status | text | "draft" | "draft" or "final" |
| finalDeclarationDate | text | null | Final declaration date |
| updatedAt | text | — | Last update ISO |

**Design decisions:**
- personalAllowanceUsed stored as snapshot — if HMRC changes the personal allowance in future years, historical estimates remain accurate with the rates that were current when computed
- Net profit is clamped to 0 at storage time via estimateTax()

---

### TermsAndConditions (table)
**Purpose:** Stores terms and conditions text for invoices/estimates.

---

## Three-Way Sync — Invoice, Budget, MTD

All sync operations go through `utils/invoiceSync.ts`. Each operation is atomic (uses Drizzle transactions) and cascades correctly.

### Mark invoice as paid
1. Confirmation modal opens pre-filled with invoice.dueDate as payment date
2. User can change date — quarter preview updates live via quarterForDate()
3. On confirm:
   - Invoice.isPayed = true, paymentDate = provided date
   - Transactions row created: type='income', amount=invoice.amountAfterTax, category=selected income category
   - MtdTransactions row created: type='income', category='turnover', linked via invoiceId and transactionId
   - All in a single Drizzle db.transaction() for atomicity
   - refreshCurrentYear() called after commit

### Mark invoice as unpaid
1. Warning shown: "This will also delete the linked budget entry and MTD record"
2. On confirm:
   - MtdTransactions row found via invoiceId
   - transactionId extracted from MtdTransactions row
   - MtdTransactions row deleted
   - Transactions row deleted if transactionId existed
   - Invoice.isPayed = false
   - refreshCurrentYear() called

### Delete from Budget (Transactions)
1. Warning shown if linked invoice exists
2. On confirm:
   - MtdTransactions row found via transactionId
   - If MtdTransactions had invoiceId: Invoice.isPayed = false
   - MtdTransactions row deleted
   - Transactions row deleted
   - refreshCurrentYear() called

### Delete from MTD (MtdTransactions)
1. Warning shown if linked invoice exists
2. On confirm:
   - MtdTransactions row fetched by ID
   - If has transactionId: Transactions row deleted
   - If has invoiceId: Invoice.isPayed = false
   - MtdTransactions row deleted
   - refreshCurrentYear() called

### Delete invoice directly
1. Warning listing what will also be deleted (MTD records, budget entries)
2. On confirm:
   - MtdTransactions rows found via invoiceId
   - For each: linked Transactions row deleted
   - All MtdTransactions rows for this invoice deleted
   - InvoiceWorkInformation and InvoicePayments deleted
   - Invoice row deleted
   - refreshCurrentYear() called

### Atomicity guarantee
All sync operations that write to multiple tables use Drizzle's `db.transaction()`. If any step fails mid-sequence, the entire transaction rolls back — no partial writes. The caller sees the error and can retry.

---

## MTD Tax Calculations

### estimateTax() — Full Step-by-Step

**File:** utils/mtdTaxCalc.ts

```
1. taxableProfit = max(0, grossIncome - totalAllowableExpenses)
   - Net profit cannot be negative. If expenses exceed income, profit is 0.

2. personalAllowanceUsed = min(personalAllowance, taxableProfit)
   - Cannot claim more PA than profit earned.

3. taxableAfterAllowance = max(0, taxableProfit - personalAllowanceUsed)
   - The portion of profit actually subject to tax.

4. basicRateTax = min(taxableAfterAllowance, basicRateThreshold - personalAllowance) × 20%
   - 20% on the first band (£12,571 to £50,270).

5. higherRateTax = min(max(0, taxableAfterAllowance - basicBand), higherBand) × 40%
   - 40% on the next band (£50,271 to £125,140).

6. additionalRateTax = max(0, taxableAfterAllowance - basicBand - higherBand) × 45%
   - 45% on anything above £125,140.

7. totalIncomeTax = basicRateTax + higherRateTax + additionalRateTax

8. ni4LowerBand = max(0, min(taxableProfit, ni4Upper) - ni4Lower) × 6%
   - Class 4 NI at 6% on profits between £12,570 and £50,270.

9. ni4UpperBand = max(0, taxableProfit - ni4Upper) × 2%
   - Class 4 NI at 2% on profits above £50,270.

10. class2NI = £3.45 × 52 if taxableProfit >= £12,570 else 0
    - Class 2 NI flat weekly rate if profit exceeds small earnings exception.

11. totalNI = ni4LowerBand + ni4UpperBand + class2NI

12. totalTaxAndNI = totalIncomeTax + totalNI

13. effectiveRate = (totalTaxAndNI / grossIncome) × 100
    - 0 if grossIncome is 0.

14. quarterlySetAside = totalTaxAndNI / 4
```

### projectFullYearTax()

**File:** utils/mtdTaxCalc.ts

Multiplies incomeToDate and expensesToDate by `4 / currentQuarter` then calls estimateTax(). This projects a full year from partial data.

- Q1 data: multiply by 4
- Q2 data: multiply by 2
- Q3 data: multiply by 4/3
- Q4 data: multiply by 1 (exact)

Used by mtdAnnualEstimate.tsx when fewer than 4 quarters have data. Shows a projection warning banner.

### personalAllowanceUsed snapshot

personalAllowanceUsed is stored on MtdAnnualSummary as a snapshot of the value computed when the summary was last refreshed. This means:
- If HMRC changes the personal allowance in a future year, old annual estimates remain correct with the rates that were active at the time
- The snapshot is updated whenever refreshAnnualSummary() is called
- Historical data is preserved even as rates change

### How to update rates each April

1. Open `utils/mtdTaxCalc.ts`
2. Rename `RATES_2025_26` to `RATES_2026_27` (or appropriate year)
3. Update all rate values (PA, thresholds, NI rates)
4. Search and replace all references to the old const name across the codebase
5. Update rates tables in AGENTS.md and DOCUMENTATION.md
6. Run `npm test` — all tax calculation tests must pass with new rates
7. Commit: `[MTD] Update tax rates for YYYY-YY`

**Files that reference RATES_2025_26:**
- utils/mtdTaxCalc.ts (definition)
- hooks/useTaxRates.ts (default fallback)
- __tests__/utils/mtdTaxCalc.test.ts (tests)

---

## UK Tax Year Reference

### Tax year boundary
UK tax year: 6 April → 5 April of the following year.
- Dates on or after 6 April belong to the tax year starting that calendar year
- Dates before 6 April belong to the previous tax year

### Quarters and deadlines

| Quarter | Period | Deadline |
|---------|--------|----------|
| Q1 | 6 Apr – 5 Jul | 7 Aug |
| Q2 | 6 Jul – 5 Oct | 7 Nov |
| Q3 | 6 Oct – 5 Jan +1yr | 7 Feb +1yr |
| Q4 | 6 Jan – 5 Apr +1yr | 7 May +1yr |

### quarterForDate() logic
Compares the date (as YYYY-MM-DD ISO string) against each quarter's periodStart and periodEnd using string comparison. Returns the matching TaxQuarter.

### Final declaration deadline
31 January, two years after the tax year ends.
Tax year 2025-26 (ends 5 Apr 2026) → final declaration 31 January 2027.

### deadlineStatus() classification
Reads `urgentDays` from appSettings.quarterlyTaxReminderDays (default 14):
- **overdue:** deadline has passed
- **urgent:** days until deadline ≤ urgentDays
- **soon:** days until deadline ≤ 30
- **ok:** more than 30 days away

### MTD income thresholds by year

| Income | From |
|--------|------|
| Over £50,000 | 6 April 2026 |
| Over £30,000 | 6 April 2027 |
| Over £20,000 | 6 April 2028 |

---

## Settings Reference

| Field | Controls | Set In | Read By | Default | Requires April Update |
|-------|----------|--------|---------|---------|----------------------|
| userId | Current user | Profile section | All hooks | null | No |
| defaultVatRate | Default tax % | Tax Defaults | createInvoice, createEstimate | 20 | No |
| taxScheme | Standard vs inclusive | Tax Defaults | createInvoice, createEstimate | "standard" | No |
| applyTaxByDefault | Auto-apply tax | Tax Defaults | createInvoice, createEstimate | 1 (true) | No |
| defaultNotes | Default invoice notes | Tax Defaults | createInvoice, createEstimate | null | No |
| defaultPaymentTerms | Default terms | Tax Defaults | createInvoice, createEstimate | null | No |
| invoicePrefix | Invoice number prefix | Numbers section | invoiceOperations | "INV-" | No |
| nextInvoiceNumber | Next invoice # | Numbers section | invoiceOperations | 1 | No |
| estimatePrefix | Estimate number prefix | Numbers section | estimateOperations | "EST-" | No |
| nextEstimateNumber | Next estimate # | Numbers section | estimateOperations | 1 | No |
| quarterlyTaxEnabled | MTD on/off | MTD & Tax | tax.tsx | 1 (true) | No |
| autoCalculateQuarters | Auto-compute | MTD & Tax | tax.tsx | 1 (true) | No |
| quarterlyTaxReminderDays | Urgent threshold | MTD & Tax | useMtdDeadlines, deadlineStatus() | 14 | No |
| defaultTaxCategory | Default income cat | MTD & Tax | addMtdTransaction | "turnover" | No |
| taxRates | JSON TaxRates override | Settings | useTaxRates, parseTaxRates() | null | Yes — update each April |
| theme | Light/dark/system | Appearance | ThemeContext | "system" | No |
| currency | Default currency | Appearance | invoice/estimate forms | "GBP" | No |
| dateFormat | Date display | Appearance | date formatting | "DD/MM/YYYY" | No |
| numberFormat | Number locale | Appearance | number formatting | "en-GB" | No |
| reminderEmailEnabled | Email reminders | Reminders | useInvoiceData | 0 (false) | No |
| reminderDaysBeforeDue | Reminder timing | Reminders | useInvoiceData | 7 | No |
| logoUrl | Business logo | Profile | PDF generation | null | No |

---

## Git Conventions

### Commit prefixes

| Prefix | Use for |
|--------|---------|
| [MTD] | MTD files (types, utils, hooks, DB, screens) |
| [NAV] | Navigation (drawer, tabs, layouts) |
| [SETTINGS] | Settings screen and appSettings changes |
| [INVOICE] | Invoice/estimate screens or logic |
| [BUDGET] | Budget/transaction screens or logic |
| [SCHEMA] | db/schema.ts or migration files |
| [STYLE] | Tailwind config, NativeWind, theme |
| [TEST] | Test files |
| [FIX] | Bug fix — include module name |
| [REFACTOR] | Reorganisation, no behaviour change |
| [DOCS] | README, planning docs, comments |
| [CHORE] | package.json, config, tooling |

### Message format
`[PREFIX] Short description sentence case (50 chars max after prefix)`

Optional body: WHY not WHAT. Explain decision, trade-off, reasoning.

### Rules
- One logical change per commit
- Never `git add .` — stage specific files with `git add -p`
- Run `npx tsc --noEmit` before every commit — zero errors required
- Tag each completed phase: `git tag phase-1-navigation`, etc.

---

## Maintenance Checklist — Every April

- [ ] Update RATES_2025_26 in utils/mtdTaxCalc.ts (rename const to new year)
- [ ] Update all rate values (PA, thresholds, NI rates)
- [ ] Search and replace all references to old const name
- [ ] Update rates tables in AGENTS.md and DOCUMENTATION.md
- [ ] Verify MTD income thresholds are unchanged
- [ ] Verify quarterly deadline dates are unchanged
- [ ] Run `npm test` — all tax calculation tests must pass with new rates
- [ ] Commit: `[MTD] Update tax rates for YYYY-YY`