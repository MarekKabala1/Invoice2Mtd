# Invoice2Mtd Refactoring Plan — Phases A-D

**Status:** Not started
**Overall Progress:** 0% (0/4 phases)
**Current Phase:** Phase A

---

## Phase A: Critical Fixes (Must Complete Before Production)

**Estimated Time:** 8-10 hours
**Blockers:** None — can start immediately
**Goal:** Fix TypeScript strictness, remove hardcoded colors, fix code violations

### A1: Add Colors to Tailwind Config & Change Purple to Blue

**Files to modify:**
- `tailwind.config.ts`

**Changes:**
1. Add new blue color ramp to replace purple:
   - Current: `#4f46e5` (purple-600), `#4338ca` (purple-700)
   - New: Use a nicer blue (suggest `#2563eb`/`#1d4ed8` or similar professional blue)
   - Create custom ramp in tailwind.config.js with proper contrast ratios
2. Define all missing theme colors used throughout the app:
   - Colors found in hardcoded values should have Tailwind ramp names
   - Example: Create `invoice-blue`, `mtd-blue`, `success-green`, `warning-amber`, `danger-red`
3. Replace all `#4f46e5` and `#4338ca` references with new blue throughout codebase
4. Export color tokens from theme.ts for use in components

**Commit:** `[STYLE] Add blue color ramps to tailwind.config and update theme tokens`

---

### A2: Remove TypeScript `any` Types (6 violations)

**Files to fix:**
1. `hooks/useMtdData.ts` — 2 `any` types
2. `app/(drawer)/(tabs)/tax.tsx` — 1 `any` type
3. `db/mtdOperations.ts` — 1 `any` type
4. `context/AppSettingsContext.tsx` — 1 `any` type
5. `components/DrawerContent.tsx` — 1 `any` type

**Approach:**
- Read each file and identify the `any` declarations
- Replace with proper types using Drizzle `InferSelectModel`, React types, or custom interfaces
- No logic changes — only type improvements
- Test with `npx tsc --noEmit` after each file

**Commits (one per file):**
- `[FIX] Remove any types from useMtdData hook`
- `[FIX] Remove any types from tax tab screen`
- `[FIX] Remove any types from mtdOperations database module`
- `[FIX] Remove any types from AppSettingsContext`
- `[FIX] Remove any types from DrawerContent component`

---

### A3: Remove 28 Hardcoded Colors (Use Theme Context)

**Files affected:** 15+ files across components, screens, and utilities

**Pattern to replace:**
```typescript
// BAD: hardcoded colors
<View style={{ backgroundColor: '#4f46e5' }} />
<Text style={{ color: '#ef4444' }} />

// GOOD: use theme context
const { colors } = useTheme();
<View className={`bg-${colors.primary}`} />
<Text className="text-danger-600" />
```

**Implementation:**
1. Audit finds hardcoded colors to replace in:
   - `app/(drawer)/settings.tsx` (10+ colors)
   - `components/DocumentScanner.tsx` (3+ colors)
   - `components/DrawerContent.tsx` (2+ colors)
   - `app/(drawer)/(tabs)/tax.tsx` (5+ colors)
   - `app/(stack)/mtdQuarterlySummary.tsx` (3+ colors)
   - `utils/mtdTaxCalc.ts` (2+ colors)
   - Other components (3+ colors)

2. For inline styles: Replace with Tailwind classes via NativeWind
3. For StyleSheet.create: Convert to className prop
4. For SVG colors: Pass from theme context

**Commit:** `[STYLE] Replace hardcoded colors with theme context tokens throughout`

---

### A4: Remove 3 Barrel Export Files

**Files to delete:**
- `components/UserForm/index.ts`
- `components/EstimateForm/index.ts`
- `components/CustomerForm/index.ts`

**Files to update imports in:**
- `app/(stack)/userInfo.tsx` — update import
- `app/(stack)/createEstimate.tsx` — update import
- `app/(stack)/clientInfo.tsx` — update import

**Changes:**
1. Delete barrel export files (index.ts)
2. Import directly from component file:
   - `from '@/components/UserForm'` → `from '@/components/UserForm/UserForm'`
   - `from '@/components/EstimateForm'` → `from '@/components/EstimateForm/EstimateForm'`
   - `from '@/components/CustomerForm'` → `from '@/components/CustomerForm/CustomerForm'`

**Commit:** `[REFACTOR] Remove barrel exports from form components`

---

### A5: Remove/Convert 62 Console Statements

**Categories:**
- Debug logs (can be deleted): ~40 statements
- Error logs (convert to proper logging): ~15 statements
- Info logs (convert to proper logging): ~7 statements

**Approach:**
1. Scan all .ts and .tsx files for `console.log`, `console.error`, `console.warn`, `console.info`
2. For debugging logs: Delete entirely
3. For error handling: Replace with proper error handling pattern:
   ```typescript
   // BAD
   console.error('Failed to fetch settings:', err);

   // GOOD
   if (err instanceof DatabaseError) {
     Alert.alert('Database Error', 'Failed to fetch settings. Please try again.');
   }
   ```
4. For info logs: Keep only critical operational logs (e.g., app startup, migrations)

**Files with most console statements:**
- `app/(drawer)/settings.tsx` (15+ statements)
- `hooks/useMtdData.ts` (8+ statements)
- `db/mtdOperations.ts` (10+ statements)
- `app/(drawer)/(tabs)/tax.tsx` (8+ statements)
- Various hook and utility files (21+ statements)

**Commit:** `[CHORE] Remove debug console statements and convert to proper error handling`

---

### A6: Run Type Check & Tests

**Commands:**
```bash
npx tsc --noEmit   # Must have 0 errors
npm test            # All tests must pass
npx expo start      # Verify app boots without crashes
```

**Commit:** None — verification only

---

## Phase B: Code Refactoring (for Maintainability)

**Estimated Time:** 9-12 hours
**Depends on:** Phase A complete
**Goal:** Split large files, improve readability, extract reusable logic

### B1: Split settings.tsx (914 lines) into Section Components

**Current file:** `app/(drawer)/settings.tsx` (914 lines)

**Target structure:**
```
app/(drawer)/settings/
├── settings.tsx (main - ~150 lines, orchestration)
├── sections/
│   ├── TaxSettingsSection.tsx (~100 lines)
│   ├── InvoiceSettingsSection.tsx (~80 lines)
│   ├── MTDSettingsSection.tsx (~100 lines)
│   ├── FinancialYearSection.tsx (~60 lines)
│   ├── AppearanceSection.tsx (~70 lines)
│   ├── HMRCRatesSection.tsx (~80 lines)
│   ├── RemindersSection.tsx (~40 lines)
│   └── AboutSection.tsx (~30 lines)
└── components/
    ├── MonthPicker.tsx (extracted)
    ├── SettingsInputRow.tsx (extracted)
    └── SettingsToggleRow.tsx (extracted)
```

**Approach:**
1. Create directory `app/(drawer)/settings/`
2. Move main orchestration logic to `settings/settings.tsx`
3. Extract each section into a component that receives:
   - `formState: FormState`
   - `onFieldChange: (field: string, value: any) => void`
   - `theme: ThemeContextType`
4. Keep shared UI components in `settings/components/`
5. Mother file imports and renders all sections

**Commits:**
- `[REFACTOR] Create settings directory structure`
- `[REFACTOR] Extract TaxSettingsSection component`
- `[REFACTOR] Extract InvoiceSettingsSection component`
- `[REFACTOR] Extract MTDSettingsSection component`
- `[REFACTOR] Extract FinancialYearSection component`
- `[REFACTOR] Extract remaining settings sections`

---

### B2: Refactor mtdOperations.ts (Split by Concern)

**Current file:** `db/mtdOperations.ts` (large, does 3 things)

**New structure:**
```
db/
├── mtdOperations.ts (main aggregation logic)
├── mtdTransactionOps.ts (CRUD for MtdTransactions table)
├── mtdQuarterlySummaryOps.ts (CRUD + aggregation for MtdQuarterlySummary)
└── mtdAnnualSummaryOps.ts (CRUD + calculation for MtdAnnualSummary)
```

**Approach:**
1. Extract transaction CRUD into `mtdTransactionOps.ts`
2. Extract quarterly summary CRUD into `mtdQuarterlySummaryOps.ts`
3. Extract annual summary CRUD into `mtdAnnualSummaryOps.ts`
4. Keep `aggregateQuarter()` in main `mtdOperations.ts`
5. Update imports throughout codebase

**Commits:**
- `[REFACTOR] Extract MTD transaction operations to separate module`
- `[REFACTOR] Extract quarterly summary operations to separate module`
- `[REFACTOR] Extract annual summary operations to separate module`

---

### B3: Extract Form Sections from InvoiceForm & EstimateForm

**Goal:** Reduce component complexity, enable reuse in other forms

**Extract:**
- `components/forms/InvoiceLineItemsSection.tsx`
- `components/forms/TaxCalculationSection.tsx`
- `components/forms/ClientSelectSection.tsx`
- `components/forms/TermsAndNotesSection.tsx`

**Commits:**
- `[REFACTOR] Extract form section components for reuse`

---

### B4: Add WHY Comments to Complex Logic

**Files needing comments:**
- `utils/mtdDates.ts` — quarter boundary calculations
- `utils/mtdTaxCalc.ts` — tax band calculations
- `db/mtdOperations.ts` → `aggregateQuarter()` — three-source aggregation
- `context/AppSettingsContext.tsx` — form state sync logic

**Comment style:**
```typescript
// WHY: Tax band boundaries change April 6, not Jan 1
// This handles the edge case where someone has historical data
// from previous tax years (before April 6, 2023)
const getQuarterStart = (selectedMonths: number[], taxYear: number) => {
  // ...
};
```

**Commit:** `[DOCS] Add WHY comments to complex tax and date calculations`

---

## Phase C: Missing Features (Complete Feature Parity)

**Estimated Time:** 7-9 hours
**Depends on:** Phase A complete
**Goal:** Implement features specified in AGENTS.md but not yet built

### C1: SVG Tax Band Visualization

**File to create:** `components/TaxBandBar.tsx`
**Reference:** AGENTS.md lines 389 specifies:
- Tax band bar (SVG): success/mtd-accent-400/warning, 24px height, rounded end caps

**Implementation:**
1. Create SVG component accepting:
   - `income: number` (current income)
   - `inTaxYear: number` (income in current tax band)
   - `taxYear: number` (to determine rates)
2. Calculate 3 segments:
   - Green: Personal allowance unused (0 → £12,570)
   - Indigo: Basic rate band (£12,570 → £50,270)
   - Amber: Higher rate band (£50,270 → £125,140)
3. Use ThemeContext colors for segments
4. Show percentage filled for each band

**Used in:**
- `app/(stack)/mtdAnnualEstimate.tsx` — display tax band progress

**Commits:**
- `[COMPONENTS] Create TaxBandBar SVG visualization`

---

### C2: Wire userId Throughout App

**Goal:** Every MTD calculation should use the logged-in user's settings

**Files to update:**
- `hooks/useHomeInsights.ts` — currently uses empty string, should use userId
- `hooks/useMtdData.ts` — accept and pass userId
- `app/(drawer)/(tabs)/tax.tsx` — determine and pass userId
- `app/(drawer)/(tabs)/home.tsx` — pass userId to hooks

**Approach:**
1. Add user context or get current userId from AppSettingsContext
2. Pass userId through hook chain: Screen → Hook → DB Query
3. Filter all MTD data by userId

**Commits:**
- `[MTD] Wire userId through MTD data hooks and operations`

---

### C3: Sentry Integration for Error Reporting

**File to create:** `utils/sentry.ts`
**Reference:** MASTER_PLAN Phase 0

**Implementation:**
1. Install and initialize Sentry:
   ```bash
   npm install @sentry/react-native
   ```
2. Create `utils/sentry.ts`:
   ```typescript
   import * as Sentry from '@sentry/react-native';

   export const initSentry = () => {
     Sentry.init({
       dsn: // user provides
       environment: __DEV__ ? 'development' : 'production',
     });
   };

   export const captureException = (err: Error, context?: object) => {
     Sentry.captureException(err, { contexts: { custom: context } });
   };
   ```
3. Initialize in `app/_layout.tsx`
4. Replace critical error paths with Sentry capture

**Note:** This requires user to provide Sentry DSN

**Commits:**
- `[CHORE] Add Sentry integration for error reporting`

---

### C4: Invoice→MTD Auto-Sync Prompt

**File to modify:** `app/(stack)/createInvoice.tsx`

**Feature:**
When user marks an invoice as paid, show prompt:
```
"Add this invoice (£X) to MTD records for Q1?"
[Cancel] [Add to MTD]
```

**Implementation:**
1. Add prompt after marking invoice paid
2. If user confirms: Create MtdTransaction record linked to invoice
3. Pre-fill quarter based on invoice date
4. Show success toast

**Commit:** `[MTD] Add auto-sync prompt when marking invoice paid`

---

## Phase D: Polish & Documentation (Production Readiness)

**Estimated Time:** 5-7 hours
**Depends on:** Phase C complete
**Goal:** Integration tests, dark mode verification, final polish

### D1: Add Integration Tests

**Files to create:**
- `__tests__/integration/mtdDataFlow.test.ts`
- `__tests__/integration/settingsMultiUser.test.ts`
- `__tests__/integration/invoiceMtdSync.test.ts`

**Coverage:**
1. MTD data flow: Create transaction → verify in quarterly summary → verify in annual summary
2. Multi-user settings: Create user A settings → switch to user B → verify isolation
3. Invoice→MTD sync: Create invoice → mark paid → verify MTD record created

**Commits:**
- `[TEST] Add integration tests for MTD and settings workflows`

---

### D2: Full Dark Mode Testing

**Process:**
1. Toggle dark mode in settings
2. Visually inspect every screen:
   - No invisible text (white text on white bg)
   - No hardcoded colors appearing
   - All theme tokens apply correctly
   - All icons visible
3. Verify colors in dark mode have proper contrast

**Files to check:**
- All screens: home, invoices, tax, budget, scanner, settings
- All modals and forms
- All badges and status indicators

**Commit (if fixes needed):** `[STYLE] Fix dark mode color contrast issues`

---

### D3: Create CONTRIBUTING.md

**Content:**
```markdown
# Contributing to Invoice2Mtd

## Code Style

### Imports
React/RN → expo-router → third-party → local

### TypeScript
- Strict mode — no `any` types
- Drizzle types: `InferSelectModel<typeof Table>`
- DB row types: `typeof table.$inferSelect`

### Naming Conventions
- Hooks: camelCase (useMtdData.ts)
- Utils: camelCase (mtdDates.ts)
- Components/screens: PascalCase (TaxBandBar.tsx)
- Constants: UPPER_SNAKE_CASE (EXPENSE_CATEGORIES)

### Tailwind Only
- No StyleSheet.create
- Dark mode: `dark:` variant
- Colors: ThemeContext tokens or tailwind.config.ts classes
- No hardcoded colors in code

### Forms
- react-hook-form + zodResolver
- Schemas in db/zodSchema.ts
- Validation on submit

### Testing
- Pure utils: test directly
- Hooks: mock db operations
- Integration: test full workflows
- Location: `__tests__/[domain]/[module].test.ts`

## Commit Discipline

### Format
[PREFIX] Description (50 chars max)

Optional body: Explain WHY not WHAT

### Prefixes
[MTD] [NAV] [SETTINGS] [INVOICE] [BUDGET] [SCHEMA] [STYLE] [TEST] [FIX] [REFACTOR] [DOCS] [CHORE]

### Rules
- One logical change per commit
- Use `git add [files]` — never `git add .`
- `npx tsc --noEmit` before every commit
- All tests passing before merge

## Before Each Phase

```bash
npx tsc --noEmit   # ← zero errors required
npm test            # ← all tests pass
npx expo start      # ← app boots without crashes
```

## Architecture Patterns

### Data Flow
Screen → Hook → DB Operations → Drizzle → SQLite

### Hook Return Shape
```typescript
{
  data: T | null,
  isLoading: boolean,
  error: string | null,
  refresh: () => Promise<void>
}
```

### Theme Usage
```typescript
const { colors } = useTheme();
<Text className={`text-${colors.primary}`} />
```

### Settings Usage
```typescript
const { settings, updateSettings } = useAppSettings();
await updateSettings({ defaultVatRate: 20 });
```

## MTD Integration

MTD never asks user to re-enter data:
1. PAID INVOICES → income
2. BUDGET TRANSACTIONS → expenses
3. MANUAL MTD RECORDS → cash payments, receipts

All sources combine in `aggregateQuarter()`.

## Questions?

See AGENTS.md for detailed architecture and MASTER_PLAN.md for feature roadmap.
```

**Commit:** `[DOCS] Add CONTRIBUTING.md for development guidelines`

---

### D4: Final Verification

**Checklist:**
```
[ ] npx tsc --noEmit — 0 errors
[ ] npm test — all tests passing
[ ] npx expo start — app boots without crashes
[ ] All screens tested in light mode
[ ] All screens tested in dark mode
[ ] No hardcoded colors visible
[ ] No `any` types remain in codebase
[ ] No console statements remain
[ ] All AGENTS.md requirements met
[ ] Git history clean: one logical change per commit
[ ] CONTRIBUTING.md complete
```

**Commit:** None — final verification only

---

## Summary

| Phase | Time | Status | Keys |
|-------|------|--------|------|
| **A** | 8-10h | ⏳ TODO | Colors, types, cleanup, no hardcoded values |
| **B** | 9-12h | ⏳ TODO | Split large files, improve readability |
| **C** | 7-9h | ⏳ TODO | Missing features, user wiring, error tracking |
| **D** | 5-7h | ⏳ TODO | Tests, dark mode, documentation |
| **Total** | 29-38h | 0% | Production-ready, fully tested, documented |

---

## How to Use This Plan

1. **Start:** Begin Phase A (critical fixes must complete first)
2. **Work:** Execute commits in order, verify each with:
   ```bash
   npx tsc --noEmit
   npm test
   npx expo start
   ```
3. **Commit:** One logical change per commit, always stage specific files
4. **Progress:** Track completion in this file: mark complete ✅ when done
5. **Next Phase:** Only start Phase B after Phase A fully complete

---

**Last Updated:** 2026-03-24
**Next Review:** After Phase A completion
