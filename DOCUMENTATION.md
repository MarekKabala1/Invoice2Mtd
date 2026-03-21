# Invoice2Mtd — Implementation Documentation

This file documents every step taken during the implementation of Invoice2Mtd, following MASTER_PLAN.md. Updated as each phase is completed.

---

## Phase 0 — Setup

### Step 0.1 — Cloned invoiceApp
Cloned from `https://github.com/MarekKabala1/invoiceApp.git` into a temp directory and copied source files to `/Users/marekkabala/Dev/Invoice2Mtd/`.

### Step 0.2 — Git initialization
```bash
git init
git add . (staged in two commits)
git branch -M main
```

### Step 0.3 — Remotes configured
```bash
git remote add origin https://github.com/MarekKabala1/Invoice2Mtd.git
git remote add upstream https://github.com/MarekKabala1/invoiceApp.git
```

### Step 0.4 — Created featureBranch
```bash
git checkout -b featureBranch
```

### Step 0.5 — Installed dependencies
```bash
npm install
```
All dependencies installed. No new packages needed (drawer built into expo-router v3).

### Step 0.6 — Updated app.json
Changed:
- `name`: "Invoicing-Budget" → "Invoice2Mtd"
- `slug`: "invoice" → "invoice2mtd"
- `ios.bundleIdentifier`: "com.toxic87.invoice" → "com.marekkabala.invoice2mtd"
- `android.package`: "com.toxic87.invoice" → "com.marekkabala.invoice2mtd"
- `eas.projectId`: "548c8736-..." → "067de4fa-7ee4-4821-8acc-c96a05c2f544"
- `updates.url`: updated to match new projectId

---

## Phase 1 — Navigation Restructure

### Step 1.1-1.5 — File system restructure
- Created `app/(drawer)/` folder
- Moved `app/(tabs)/` → `app/(drawer)/(tabs)/`
- Moved `app/(drawer)/(tabs)/charts.tsx` → `app/(drawer)/charts.tsx`
- Removed empty `app/(tabs)/` directory

### Step 1.3 — Drawer layout
Created `app/(drawer)/_layout.tsx` using `Drawer` from `expo-router/drawer`. Declares four screens: (tabs), settings, info, charts. Uses custom `DrawerContent` component.

### Step 1.4 — Tabs layout
Updated `app/(drawer)/(tabs)/_layout.tsx`:
- Removed Charts tab entry
- Added Tax tab with calculator icon (Ionicons)
- New order: Home, Invoices, Tax, Budget, Scanner (5 tabs)

### Step 1.6 — DrawerContent component
Created `components/DrawerContent.tsx`:
- Initially tried importing from `@react-navigation/drawer` which wasn't installed
- Rewrote without that dependency
- Later installed `@react-navigation/drawer@^6.1.18` and restored proper types
- Uses `DrawerContentComponentProps` from `@react-navigation/drawer`
- Shows app name, nav items, ThemeToggle, app version
- Uses `usePathname` from expo-router for active state

### Drawer package installation issue
The plan said "no new packages" and claimed `@react-navigation/drawer` was a transitive dependency. It was NOT installed. Tried `npx expo install` but got version conflict (drawer v7 needs react-navigation/native v7, but project uses v6). Fixed by installing `@react-navigation/drawer@^6.1.18` directly via npm.

### Step 1.7 — Settings placeholder
Created `app/(drawer)/settings.tsx` — placeholder for now. Full implementation planned with 8 sections (Profile, Bank Details, Tax Defaults, Invoice Numbers, MTD & Tax, Appearance, Reminders, About).

### Step 1.8 — Info placeholder
Created `app/(drawer)/info.tsx` — placeholder. Full implementation planned with MTD overview, income thresholds, quarter reference, tax rates, useful links.

### Step 1.9 — Tax tab placeholder
Created `app/(drawer)/(tabs)/tax.tsx` — placeholder showing "Tax" title and "MTD hub — coming soon" text.

### Step 1.10 — Root layout fix
Removed `(stack)/settings` from `app/_layout.tsx` since settings now lives in the drawer.

### Pre-existing bug fixed
`utils/emailOperations.ts` imported `getCustomerDetails` from `invoiceFormOperations` which doesn't export it. Fixed to import from `customerOperations` where it's actually defined.

---

## Phase 2 — MTD Types, Utilities, and Database

### Step 2.1 — types/mtd.ts
All MTD TypeScript types in a separate file:
- `ExpenseCategory` — 12 HMRC category string literals
- `EXPENSE_CATEGORIES` / `ALLOWABLE_CATEGORIES` — const arrays
- `TaxQuarter`, `TaxYear`, `DeadlineStatus`, `DeadlineItem`
- `TaxRates`, `TaxEstimate` — full calculation output
- `QuarterAggregates` — includes `sources` breakdown (invoiceTurnover, budgetExpenses, manualTurnover, manualExpenses)
- `NewMtdTransaction`, `MtdTransactionStatus`, `MtdAnnualStatus`
- `ActivityItem` — for home screen cross-module activity feed

### Step 2.2 — utils/mtdCategories.ts
- `EXPENSE_CATEGORY_LABELS` — human-readable HMRC labels
- `isAllowable()` — excludes businessEntertainmentCosts and otherDisallowableExpenses
- `INCOME_CATEGORIES` / `EXPENSE_ONLY_CATEGORIES`
- `mapCategoryToHmrc(categoryId)` — maps budget categories to HMRC. Falls back to otherAllowableExpenses
- Budget category mappings (examples):
  - rent → premisesRunningCosts
  - entertainment/restaurant → businessEntertainmentCosts
  - groceries/shopping → costOfGoodsAllowable
- Deadline urgency style maps: STATUS_DEADLINE_COLOR, DOT, BADGE_BG, BORDER, LABEL

### Step 2.3 — utils/mtdDates.ts
Pure TypeScript, no React Native. Uses date-fns v4:
- `toISO` / `fromISO` — date string conversions
- `taxYearForDate` — UK tax year logic (before 6 April = previous year)
- `quartersForTaxYear` — Q1: 6Apr–5Jul/7Aug, Q2: 6Jul–5Oct/7Nov, Q3: 6Oct–5Jan+1/7Feb+1, Q4: 6Jan+1–5Apr+1/7May+1
- `buildTaxYear` — finalDeclarationDeadline = startYear+2-01-31
- `deadlineStatus` — optional urgentDays/soonDays params (defaults 14/30) for user-configurable thresholds
- `upcomingDeadlines` — filtered daysUntil > -90, sorted ascending

### Step 2.4 — utils/mtdTaxCalc.ts
ESTIMATES ONLY — not official HMRC calculations:
- `RATES_2025_26` — personal allowance 12570, basic 20%/50270, higher 40%/125140, additional 45%, NI Class 4 6%/2%, Class 2 £3.45/week
- `estimateTax()` — computes income tax + NI breakdown
- `projectFullYearTax()` — multiplies by 4/currentQuarter
- `formatGBP()` / `formatPercent()` — display helpers

### Step 2.5 — db/schema.ts
Added `uniqueIndex` import. Two new columns on appSettings:
- `applyTaxByDefault` — boolean, default true
- `defaultNotes` — text

Three new MTD tables appended:
- **MtdTransactions** — manual MTD records. Nullable FK to Invoice and Transactions
- **MtdQuarterlySummary** — per-quarter aggregates with 12 HMRC category columns. uniqueIndex on (userId, taxYear, quarter). userId included for future multi-user support
- **MtdAnnualSummary** — full-year totals + tax estimates. personalAllowanceUsed stored as snapshot so historical estimates stay accurate if rates change

### Step 2.6 — Migration
Generated `drizzle/0006_slow_the_professor.sql` via `npx drizzle-kit generate`. Updated `drizzle/migrations.js` to include it.

### Step 2.7 — db/mtdOperations.ts
Key functions:
- `addMtdTransaction` — auto-tags tax year and quarter from date
- `getMtdTransactions` / `deleteMtdTransaction` — CRUD
- `aggregateQuarter` — THREE sources:
  1. Manual MtdTransactions (income + expense)
  2. Paid invoices (isPayed=true, date in quarter) → turnover
  3. Budget transactions (type=expense, date in quarter) → expenses mapped via mapCategoryToHmrc
- `refreshQuarterlySummary` — upsert pattern (insert or update existing row)
- `refreshAnnualSummary` — aggregates all 4 quarters, calls estimateTax
- `refreshCurrentYear` — convenience function for current tax year

### ADDITION B — Zod schemas
Added to `db/zodSchema.ts`:
- `newMtdTransactionSchema` — validates date (YYYY-MM-DD), description, amount, type, category
- Updated `appSettingsSchema` with applyTaxByDefault and defaultNotes fields

---

## Phase 3 — MTD Hooks

### hooks/useAppSettings.ts
Thin wrapper around AppSettingsContext. Returns { settings, isLoading, error, updateSettings, refresh }. Every screen that reads settings uses this hook.

### hooks/useMtdTransaction.ts
Returns { addTransaction, deleteTransaction, isLoading, error }. Calls addMtdTransaction/deleteMtdTransaction then refreshCurrentYear. Alert.alert() in hook for user-facing errors.

### hooks/useMtdData.ts
Accepts { taxYear, quarter, userId }. Returns { aggregates, annualSummary, isLoading, error, refresh }. Calls aggregateQuarter and getAnnualSummary on mount. Uses useFocusEffect to refresh when screen regains focus.

### hooks/useMtdDeadlines.ts
No DB calls — pure computation via useMemo. Returns { deadlines, overdue, urgent, upcoming, nextDeadline }. Splits upcomingDeadlines by status.

---

## Phase 4 — MTD Screens (TODO)

Not yet implemented. Plan specifies:
- 4.1: addMtdTransaction.tsx — form with income/expense toggle, date picker, category picker
- 4.2: mtdDeadlines.tsx — overdue/urgent/upcoming sections
- 4.3: mtdQuarterlySummary.tsx — Q1-Q4 tabs, income/expense cards, source breakdown
- 4.4: mtdAnnualEstimate.tsx — SVG tax band bar, summary card
- 4.5: tax.tsx — full implementation (replaces placeholder)
- 4.6: Register screens in root _layout.tsx

---

## Phase 5 — Home Integration (TODO)

- 5.1: hooks/useHomeInsights.ts — cross-module data
- 5.2: Update home.tsx with unified dashboard

---

## Phase 6 — Tests (TODO)

- 6.1: __tests__/utils/mtdDates.test.ts
- 6.2: __tests__/utils/mtdTaxCalc.test.ts
- 6.3: __tests__/hooks/useMtdData.test.ts

---

## Phase 7 — Styles (TODO)

- 7.1: tailwind.config.ts — invoice-accent and mtd-accent colour ramps
- 7.2: Invoice module styles
- 7.3: PDF template colour updates
- 7.4: MTD module styles
- 7.5: Drawer and settings styles
- 7.6: Dark mode audit

---

## Known Issues

- None currently — npx tsc --noEmit passes with zero errors

## Git Tags

- `phase-1-navigation` — after navigation restructure
- `phase-2-data-layer` — after MTD types, utils, schema, operations

## Upstream DSN (Sentry)

```
https://73c7209d913226b700df16950fd41f83@o4508151262347264.ingest.de.sentry.io/4511077837504592
```
