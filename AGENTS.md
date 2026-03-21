# AGENTS.md — Invoicing + MTD for Income Tax App

**Repository:** clone of `github.com/MarekKabala1/invoiceApp`
**Active branch:** `featureBranch`
**Purpose:** A unified app for UK sole traders — invoicing, estimates, budget tracking, document scanning, and Making Tax Digital (MTD) for Income Tax. All features work together. MTD reads income from paid invoices and expenses from budget transactions automatically — the user never enters the same data twice.

---

## Build & Development Commands

```bash
# Start development server
npx expo start

# Type check — run before every commit
npx tsc --noEmit

# Run all tests
npm test

# Run a single test file
npm test -- __tests__/utils/mtdDates.test.ts

# Generate database migrations (run after any db/schema.ts change)
npx drizzle-kit generate

# Prebuild for native modules (required for ML Kit document scanner)
npx expo prebuild
```

---

## Tech Stack — No New Packages

Do not install any new npm packages. Every dependency is already installed.

| Package | Version | Purpose |
|---------|---------|---------|
| Expo SDK | 51 | App platform |
| React Native | 0.74 | UI framework |
| expo-router | ~3.5.24 | File-system routing — drawer built-in via expo-router/drawer |
| TypeScript | ~5.3.3 | Strict mode |
| Drizzle ORM | ^0.33.0 | Database ORM |
| expo-sqlite | ~14.0.6 | Local SQLite |
| NativeWind | ^4.0.1 | Tailwind CSS for React Native |
| Tailwind CSS | ^3.4.10 | Utility-first CSS |
| React Hook Form | ^7.53.0 | Forms |
| Zod | ^3.23.8 | Validation |
| @hookform/resolvers | ^3.9.0 | RHF + Zod |
| date-fns | ^4.1.0 | Date utilities (v4 — confirm function names) |
| react-native-uuid | ^2.0.2 | UUID — always via utils/generateUuid.ts |
| react-native-chart-kit | ^6.12.0 | Charts |
| react-native-svg | 15.2.0 | SVG (MTD tax band bar) |
| @react-native-community/datetimepicker | 8.0.1 | Native date picker |
| @react-native-picker/picker | 2.7.5 | Native picker |
| react-native-gesture-handler | ~2.16.1 | Peer dep for drawer |
| react-native-reanimated | ~3.10.1 | Peer dep for drawer |
| jest-expo | ^51.0.0 | Test runner |
| expo-media-library | ~16.0.5 | Logo image picker |
| expo-constants | ~16.0.2 | App version |

Drawer uses expo-router/drawer (built into expo-router v3). Do NOT install @react-navigation/drawer.

---

## Project Structure (post-navigation-restructure)

```
app/
├── (drawer)/
│   ├── _layout.tsx              ← Drawer layout: import Drawer from 'expo-router/drawer'
│   ├── (tabs)/
│   │   ├── _layout.tsx          ← Tabs: Home, Invoices, Tax, Budget, Scanner
│   │   ├── home.tsx             ← Unified cross-module dashboard
│   │   ├── invoices.tsx
│   │   ├── tax.tsx              ← MTD hub (NEW)
│   │   ├── budget.tsx
│   │   └── scanner.tsx
│   ├── settings.tsx             ← All settings (NEW)
│   ├── info.tsx                 ← MTD reference / help (NEW)
│   └── charts.tsx               ← Moved from tabs
├── (stack)/
│   ├── createInvoice.tsx
│   ├── createEstimate.tsx
│   ├── clientInfo.tsx
│   ├── addTransaction.tsx
│   ├── addMtdTransaction.tsx    ← NEW
│   ├── mtdDeadlines.tsx         ← NEW
│   ├── mtdQuarterlySummary.tsx  ← NEW
│   ├── mtdAnnualEstimate.tsx    ← NEW
│   ├── termsAndConditions.tsx
│   └── (user)/
│       ├── userInfo.tsx
│       ├── userInfoForm.tsx
│       └── bankDetailsForm.tsx
├── index.tsx
└── _layout.tsx                  ← Root Stack + all providers

components/
├── DrawerContent.tsx            ← NEW
├── InvoiceForm/
├── EstimateForm/
├── CustomerForm/
├── UserForm/
├── BaseCard.tsx
├── DocumentScanner.tsx
├── AddToBudgetModal.tsx
├── TransactionForm.tsx
└── ThemeToggle.tsx

db/
├── config.ts                    ← exports db — import ONLY from here
├── schema.ts                    ← ALL tables including 3 MTD tables
├── zodSchema.ts                 ← Zod schemas
├── invoiceOperations.ts
├── queries.ts
└── mtdOperations.ts             ← NEW

hooks/
├── useAddInvoiceToBudget.ts
├── useBudgetData.ts
├── useCameraScanner.ts
├── useCustomerData.ts
├── useEstimateData.ts
├── useInvoiceData.ts
├── useIsInvoicePaid.ts
├── useTransaction.ts
├── useUserData.ts
├── useAppSettings.ts            ← NEW: single source for appSettings reads/writes
├── useHomeInsights.ts           ← NEW: cross-module data (invoices + MTD)
├── useMtdData.ts                ← NEW
├── useMtdDeadlines.ts           ← NEW: no DB calls, pure computation
└── useMtdTransaction.ts         ← NEW

utils/
├── categories.ts
├── generateUuid.ts              ← ALWAYS use this for UUID
├── getCurrencySymbol.ts
├── theme.ts
├── mtdCategories.ts             ← NEW: HMRC labels, category mapping, urgency maps
├── mtdDates.ts                  ← NEW: UK tax year/quarter/deadline logic
└── mtdTaxCalc.ts                ← NEW: Tax + NI estimation (ESTIMATES ONLY)

types/
├── index.ts                     ← existing types — do NOT add MTD types here
└── mtd.ts                       ← NEW: all MTD types

__tests__/
├── utils/
│   ├── mtdDates.test.ts         ← NEW
│   └── mtdTaxCalc.test.ts       ← NEW
└── hooks/
    └── useMtdData.test.ts       ← NEW
```

---

## Architecture Patterns

### Data Flow

```
Screen → Hook → DB Operations → Drizzle → SQLite
  ↓                ↓
ThemeContext    useAppSettings
```

Screens NEVER call DB operations directly. Always through a hook.

### MTD Data Integration — Core Principle

MTD does NOT ask the user to re-enter data already in the app.
`aggregateQuarter()` in `db/mtdOperations.ts` pulls from THREE sources:

1. PAID INVOICES → TURNOVER
   Invoice rows where isPayed=true and invoiceDate within periodStart–periodEnd.
   Summed as amountAfterTax.

2. BUDGET TRANSACTIONS → EXPENSES
   Transactions rows where type='expense' and date within the quarter.
   Each categoryId mapped to HMRC ExpenseCategory via mapCategoryToHmrc().
   Falls back to otherAllowableExpenses if no match — nothing is ever lost.

3. MANUAL MTD RECORDS
   MtdTransactions rows for userId/taxYear/quarter.
   For cash payments, receipts not invoiced through the app, etc.

All three combine into QuarterAggregates. The sources field shows
"From invoices: £X | From budget: £Y | Manual: £Z" in the UI.

Do NOT remove any source without updating QuarterAggregates and all callers.

### Hook Return Shape

```typescript
return {
  data,        // typed or null
  isLoading,   // boolean
  error,       // string | null
  refresh,     // () => Promise<void>
}
```

Every screen must handle: loading state, error state, empty state.
User-facing errors via Alert.alert() in the hook — not the screen.

### UUID

```typescript
import { generateUuid } from '../utils/generateUuid';  // ONLY this import
```

### Theme / Colours

```typescript
import { useTheme } from '../context/ThemeContext';
const { colors } = useTheme();  // NEVER hardcode colours
```

Two custom ramps in tailwind.config.ts:
- invoice-accent: deep slate-blue
- mtd-accent: rich indigo

### Settings

```typescript
const { settings, updateSettings } = useAppSettings();
await updateSettings({ defaultVatRate: 20 });
// NEVER read appSettings directly in a screen
```

---

## Code Style

### Imports
React/RN → expo-router/Expo → third-party → local. No barrel exports.

### TypeScript
- Strict mode — no any types
- MTD types in types/mtd.ts — NEVER in types/index.ts
- as const for literal arrays
- DB row types from Drizzle: typeof table.$inferSelect

### Naming
| Thing | Convention |
|-------|-----------|
| Hook files | camelCase: useMtdData.ts |
| Util files | camelCase: mtdDates.ts |
| Component/screen files | PascalCase: MtdQuarterlySummary.tsx |
| DB table names | PascalCase: MtdTransactions |
| DB column names | camelCase (Drizzle → snake_case in SQL) |
| Constants | UPPER_SNAKE_CASE: EXPENSE_CATEGORIES |
| Types/interfaces | PascalCase: TaxQuarter |

### NativeWind
- Tailwind classes only — no StyleSheet.create
- Dark mode: always dark: variant
- Colours: ThemeContext tokens or tailwind.config.ts ramp classes only
- Spacing: existing increments only
- Border radius: match BaseCard.tsx exactly
- Font weights: two only — read utils/theme.ts

### Forms
- react-hook-form + zodResolver on every form
- Zod schemas in db/zodSchema.ts — never inline
- Validate on submit, inline errors below fields

### Error Handling
- DB throws — catch in hooks
- Hooks return error: string | null
- Alert.alert() in the hook for user-facing errors
- Never log UTR, NI number, bank details

### Testing
- Location: __tests__/[domain]/[module].test.ts
- Read existing test files first — match expo-sqlite mock pattern
- Pure utils: test directly, no mocking
- Hooks: mock db/mtdOperations.ts

---

## MTD Reference

### Quarter Deadlines

| Quarter | Period | Deadline |
|---------|--------|----------|
| Q1 | 6 Apr – 5 Jul | 7 Aug |
| Q2 | 6 Jul – 5 Oct | 7 Nov |
| Q3 | 6 Oct – 5 Jan +1yr | 7 Feb +1yr |
| Q4 | 6 Jan – 5 Apr +1yr | 7 May +1yr |

Final declaration: 31 January (year after tax year ends + 1).
Tax year 2025-26 → final declaration 31 January 2027.

### MTD Thresholds

| Income | From |
|--------|------|
| Over £50,000 | 6 April 2026 |
| Over £30,000 | 6 April 2027 |
| Over £20,000 | 6 April 2028 |

### 2025-26 Rates (ESTIMATES ONLY — update every April)

In utils/mtdTaxCalc.ts as RATES_2025_26.

| | Value |
|-|-------|
| Personal allowance | £12,570 |
| Basic rate (20%) | up to £50,270 |
| Higher rate (40%) | £50,271–£125,140 |
| Additional rate (45%) | above £125,140 |
| Class 4 NI lower | 6% on £12,570–£50,270 |
| Class 4 NI upper | 2% above £50,270 |
| Class 2 NI | £3.45/week if profit ≥ £12,570 |

### HMRC Expense Categories

| ExpenseCategory | Label | Allowable |
|----------------|-------|-----------|
| turnover | Turnover / Sales | Income |
| costOfGoodsAllowable | Cost of goods & materials | ✓ |
| employeeCosts | Employee costs | ✓ |
| premisesRunningCosts | Premises & running costs | ✓ |
| maintenanceCosts | Repairs & maintenance | ✓ |
| advertisingCosts | Advertising & marketing | ✓ |
| interestOnBankLoans | Bank interest & finance | ✓ |
| professionalFees | Professional fees | ✓ |
| depreciation | Depreciation / capital allowances | ✓ |
| otherAllowableExpenses | Other allowable expenses | ✓ |
| businessEntertainmentCosts | Business entertainment | ✗ tracked |
| otherDisallowableExpenses | Other disallowable | ✗ tracked |

### New DB Tables

MtdTransactions — nullable invoiceId FK (Invoice) for cross-module insight.
  Nullable transactionId FK (Transactions) to prevent double-counting.

MtdQuarterlySummary — uniqueIndex on (userId, taxYear, quarter).

MtdAnnualSummary — stores personalAllowanceUsed as snapshot so historical
  estimates stay accurate when rates change.

---

## Settings Reference

app/(drawer)/settings.tsx — 8 sections via useAppSettings hook.

| Section | Key fields |
|---------|-----------|
| Profile | fullName, email, address, phone, UTR (masked), NI (masked), logo |
| Bank Details | bankName, accountName, sortCode (XX-XX-XX), accountNumber (masked) |
| Tax Defaults | defaultVatRate, taxScheme (standard/inclusive + live preview), applyTaxByDefault, defaultPaymentTerms, defaultNotes |
| Invoice & Estimate Numbers | invoicePrefix, nextInvoiceNumber, estimatePrefix, nextEstimateNumber |
| MTD & Tax | quarterlyTaxEnabled, autoCalculateQuarters, quarterlyTaxReminderDays, defaultTaxCategory |
| Appearance | theme (light/dark/system), currency, dateFormat, numberFormat |
| Reminders | reminderEmailEnabled, reminderDaysBeforeDue |
| About | version (expo-constants), GOV.UK links |

taxScheme: 'standard' = add tax on top (net £100 + 20% = £120 total).
           'inclusive' = tax already included (£120 total = £100 net + £20 tax).

New columns in appSettings (require migration):
  applyTaxByDefault integer boolean default(true)
  defaultNotes text

---

## Visual Identity

### Invoice Module
- Accent: invoice-accent (deep slate-blue, tailwind.config.ts)
- Cards: 3px solid left border invoice-accent-600/invoice-accent-300 dark. Surface bg. No other borders.
- Badges (pill): Paid=invoice-accent-700 bg. Sent=outlined. Draft=invoice-accent-100. Overdue=danger token. Unpaid=invoice-accent-200.
- Typography: section dividers = uppercase tracking-widest text-xs muted. Amounts = tabular-nums. Total = text-2xl font-bold.
- Estimates: border 60% opacity. Button = invoice-accent-400. Badge text italic.
- PDF: header = invoice-accent-700 hex. Logo from appSettings.logoUrl.

### MTD Module
- Accent: mtd-accent (rich indigo, tailwind.config.ts)
- Tax tab header: full-bleed mtd-accent-600, white text.
- Annual summary: solid mtd-accent-600 bg / mtd-accent-800 dark. Total = text-4xl font-bold text-white (largest in app).
- Deadlines: overdue=danger+2px. urgent≤14d=warning+2px. soon≤30d=amber+1px. ok=success recedes.
- Quarter cards: Income=success left. Allowable=mtd-accent left. Disallowable=warning left. Zeros=opacity-40.
- Transaction form: income=success toggle. expense=danger toggle. quarter helper=pill badge.
- Tax band bar (SVG): success/mtd-accent-400/warning, 24px height, rounded end caps.
- Deadline threshold reads appSettings.quarterlyTaxReminderDays — not hardcoded.

### Shared
- Spacing: existing increments only
- Border radius: match BaseCard.tsx
- Font weights: two only (read utils/theme.ts)
- Every colour = ThemeContext token, tailwind.config.ts ramp, or dark: variant
- No new icon/animation/UI packages

---

## Git Discipline — Non-Negotiable

### One logical change per commit

Good:
  [MTD] Add aggregateQuarter — three-source pull
  [SCHEMA] Add MTD tables and migration
  [NAV] Move (tabs) inside (drawer)
  [SETTINGS] Add Tax Defaults section

Never:
  lots of changes  /  wip  /  fixed stuff  /  Phase 2 done

If you write "and" in the message — that is two commits.

### Commit prefix

[MTD]      MTD files (types, utils, hooks, DB, screens)
[NAV]      Navigation (drawer, tabs, layouts)
[SETTINGS] Settings screen and appSettings changes
[INVOICE]  Invoice/estimate screens or logic
[BUDGET]   Budget/transaction screens or logic
[SCHEMA]   db/schema.ts or migration files
[STYLE]    Tailwind config, NativeWind, theme
[TEST]     Test files
[FIX]      Bug fix — include module name
[REFACTOR] Reorganisation, no behaviour change
[DOCS]     README, planning docs, comments
[CHORE]    package.json, config, tooling

### Commit message format

[PREFIX] Short description sentence case (50 chars max after prefix)

Optional body: WHY not WHAT. Explain decision, trade-off, reasoning.

Refs: MASTER_PLAN.md Phase X Step Y.Z

### Commit cadence — one step = one commit

Phase 1: per step (1.1 file moves, 1.2 drawer layout, 1.3 tabs, 1.4 charts, 1.5 DrawerContent, 1.6 settings, 1.7 info, 1.8 tax placeholder, 1.9 budget)
Phase 2: per file (types, each util, schema, migration, mtdOperations)
Phase 3: per hook
Phase 4: per screen — split large screens (data wiring / SVG bar / styles)
Phase 5: per hook and per screen change
Phase 6: per test file
Phase 7: tailwind.config.ts first, then one commit per module style pass

### Before every commit

  npx tsc --noEmit     ← zero errors required — fix first then commit

### Stage specific files — NEVER git add .

  git add db/schema.ts drizzle/0001_add_mtd_tables.sql
  git commit -m "[SCHEMA] Add MTD tables and migration"

  NEVER: git add .     ← picks up half-finished work and debug files

Use git add -p for granular hunks.

### File header comment — every new file

/**
 * filename.ts
 *
 * What this file does.
 * Why it exists as a separate file.
 *
 * Depends on: list dependencies
 * Used by: list dependents
 *
 * Any non-obvious design decisions.
 */

### Inline comments — WHY not WHAT. Required:
- aggregateQuarter() — comment above each of three source query blocks
- taxScheme calculation — explain standard vs inclusive with number example
- uniqueIndex on MtdQuarterlySummary — why userId is included
- personalAllowanceUsed — why stored as snapshot not read at query time
- every mapCategoryToHmrc() entry — explain the mapping rationale

### Sync upstream before each phase

  git fetch upstream
  git checkout main && git merge upstream/main
  git checkout featureBranch && git rebase main

### Tag each completed phase

  git tag phase-1-navigation
  git tag phase-2-data-layer
  git tag phase-3-hooks
  git tag phase-4-mtd-screens
  git tag phase-5-home-integration
  git tag phase-6-tests
  git tag phase-7-styles

Tags are rollback points. git checkout phase-4-mtd-screens to recover last clean state.

---

## Verification Checklist

After every phase (before tagging):
  npx tsc --noEmit   ← zero errors
  npm test           ← all pass
  npx expo start     ← boots without crashes

Phase 1 — Navigation
  [ ] Drawer opens on left swipe from all tab screens
  [ ] 5 tabs: Home, Invoices, Tax, Budget, Scanner
  [ ] Charts accessible from drawer
  [ ] Settings shows all 8 sections
  [ ] Info screen all sections visible, GOV.UK links open
  [ ] All existing stack screens still reachable

Phase 2 — Data Layer
  [ ] Migration file generated and committed
  [ ] Migration included in drizzle/migrations.js
  [ ] App boots without SQLite errors
  [ ] 3 MTD tables present (expo-drizzle-studio-plugin)

Phase 3 — Hooks
  [ ] useMtdData loading → data states correct
  [ ] useMtdDeadlines returns correct deadlines for today
  [ ] useMtdTransaction add record → appears in getMtdTransactions

Phase 4 — MTD Screens
  [ ] Tax tab: enrolment state when quarterlyTaxEnabled=false
  [ ] Tax tab: mtd-accent header + stats + deadline + tiles when enrolled
  [ ] addMtdTransaction: toggle coloured, quarter helper as pill badge
  [ ] mtdQuarterlySummary: source breakdown expandable, 4 quarter tabs work
  [ ] mtdAnnualEstimate: projection banner with <4 quarters of data
  [ ] mtdDeadlines: overdue dominates, ok recedes

Phase 5 — Home Integration
  [ ] Turnover updates after creating + marking paid invoice
  [ ] Cross-module insight banner on home when unpaid invoices exist
  [ ] Marking invoice paid prompts "Add to MTD records?"
  [ ] Quarterly summary shows "From invoices: £X | From budget: £Y"

Phase 6 — Tests
  [ ] mtdDates.test.ts — all boundary cases pass
  [ ] mtdTaxCalc.test.ts — all rate calculations correct
  [ ] useMtdData.test.ts — loading/error/success all tested

Phase 7 — Styles
  [ ] Invoice cards: left accent stripe, no full border
  [ ] All 5 invoice badges correct in light and dark mode
  [ ] createInvoice: total text-2xl bold, dividers uppercase tracked, amounts tabular-nums
  [ ] Tax tab: full-bleed mtd-accent-600 header, white text
  [ ] Annual summary card: solid mtd-accent bg, text-4xl total
  [ ] SVG tax band bar: 3 segments, 24px, rounded caps
  [ ] PDF renders logo from appSettings.logoUrl
  [ ] Settings Tax Defaults live preview updates on change
  [ ] Dark mode: toggle all screens — no invisible text or borders
  [ ] npx tsc --noEmit — zero errors
