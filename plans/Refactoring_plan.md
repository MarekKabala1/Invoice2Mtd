# Refactoring Plan — Invoice2Mtd

**Created**: 2026-03-26
**Branch**: `refactor/screen-slimming-and-file-org`
**Goal**: Slim screens, domain-organised folders, error boundaries, extract inline DB queries.

---

## Core Principle: Screen Files Must Be Minimal

**Every file in `app/` must be pure composition — no logic, no state, no DB calls.**

- Maximum ~15 lines, ≤6 imports
- No `useState`, `useCallback`, `useMemo`, `useEffect`
- No `db` imports ever
- No business logic — delegate everything to components and hooks
- Screen = `<ErrorBoundary>` wrapper + one root component
- Use `@/` import aliases everywhere

**Example — `app/(drawer)/(tabs)/tax.tsx` (after)**:
```tsx
import React from 'react';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import TaxHub from '@/components/mtd/TaxHub';

export default function TaxScreen() {
  return <ErrorBoundary label="Tax"><TaxHub /></ErrorBoundary>;
}
```

**Example — `app/(stack)/mtdQuarterlySummary.tsx` (after)**:
```tsx
import React from 'react';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import QuarterlySummaryHub from '@/components/mtd/QuarterlySummaryHub';

export default function MtdQuarterlySummaryScreen() {
  return <ErrorBoundary label="Quarterly Summary"><QuarterlySummaryHub /></ErrorBoundary>;
}
```

---

## Phase 0 — Pre-flight (branch + baseline)

| Step | Action | Verify |
|------|--------|--------|
| 0.1 | Create branch `git checkout -b refactor/screen-slimming-and-file-org` | branch exists |
| 0.2 | Run `npx tsc --noEmit` — zero errors required | passes |
| 0.3 | Run `npm test` — note any pre-existing failures | document results |
| 0.4 | If any test fails even before changes, **fix it first** (commit separately) | all green |
| 0.5 | Tag baseline: `git tag refactor-baseline` | tag exists |

**Baseline results**: TypeScript 0 errors, 16 test suites / 194 tests all passing.

**Commit**: `[CHORE] Create refactor branch and verify baseline`

---

## Phase 1 — Extract Inline DB Queries to Hooks

### 1.1 `tax.tsx` — extract `useUnpaidInvoicesForQuarter`

**Problem**: Lines 69-84 call `db.select().from(Invoice)` directly in the screen.
**Fix**: Create `hooks/invoice/useUnpaidInvoicesForQuarter.ts`:

```typescript
// hooks/invoice/useUnpaidInvoicesForQuarter.ts
// WHY: tax.tsx queries Invoice table directly. All DB access must go through hooks.
import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { db } from '@/db/config';
import { Invoice } from '@/db/schema';
import { eq, and, gte, lte } from 'drizzle-orm';
import { quartersForTaxYear, quarterForDate, currentTaxYearStart } from '@/utils/mtd/mtdDates';

export function useUnpaidInvoicesForQuarter() {
  const [unpaidCount, setUnpaidCount] = useState(0);
  const [unpaidTotal, setUnpaidTotal] = useState(0);

  const fetch = useCallback(async () => {
    try {
      const q = quartersForTaxYear(currentTaxYearStart());
      const currentQ = quarterForDate(new Date());
      const quarter = q.find((x) => x.quarter === currentQ.quarter);
      if (!quarter) return;
      const rows = await db
        .select({ amountAfterTax: Invoice.amountAfterTax })
        .from(Invoice)
        .where(and(
          eq(Invoice.isPayed, false),
          gte(Invoice.invoiceDate, quarter.periodStart),
          lte(Invoice.invoiceDate, quarter.periodEnd + 'T23:59:59.999Z')
        ));
      setUnpaidCount(rows.length);
      setUnpaidTotal(rows.reduce((sum, r) => sum + (r.amountAfterTax ?? 0), 0));
    } catch { /* table may not exist yet */ }
  }, []);

  useFocusEffect(useCallback(() => { fetch(); }, [fetch]));

  return { unpaidCount, unpaidTotal, refresh: fetch };
}
```

### 1.2 `tax.tsx` — consolidate 5x `useMtdData` into `useMtdDataAllQuarters`

**Problem**: Lines 56, 93-96 call `useMtdData` 5 separate times.
**Fix**: Create `hooks/mtd/useMtdDataAllQuarters.ts`:

```typescript
// hooks/mtd/useMtdDataAllQuarters.ts
// WHY: tax.tsx and mtdAnnualEstimate.tsx both call useMtdData 4+ times. One hook reduces duplication.
import { useMtdData } from './useMtdData';

export function useMtdDataAllQuarters(taxYear: string, userId: string) {
  const q1 = useMtdData({ taxYear, quarter: 1, userId });
  const q2 = useMtdData({ taxYear, quarter: 2, userId });
  const q3 = useMtdData({ taxYear, quarter: 3, userId });
  const q4 = useMtdData({ taxYear, quarter: 4, userId });

  const isLoading = [q1, q2, q3, q4].some((q) => q.isLoading);
  const error = [q1, q2, q3, q4].find((q) => q.error)?.error ?? null;

  return { q1, q2, q3, q4, allQuarters: [q1, q2, q3, q4], isLoading, error };
}
```

### 1.3 `charts.tsx` — extract `useChartsData` hook

**Problem**: 3 inline DB queries (Users, Invoices, Payments) with `useState`/`useCallback`/`useFocusEffect`.
**Fix**: Create `hooks/invoice/useChartsData.ts` — move all state and queries into hook.

### 1.4 `InvoiceList.tsx` — extract `useInvoiceListData` hook

**Problem**: Lines 60-138 — 5 parallel DB queries with manual type mapping inside the component.
**Fix**: Create `hooks/invoice/useInvoiceListData.ts` — move loadData and mapping logic into hook.

**Commit**: `[REFACTOR] Extract inline DB queries to custom hooks`

---

## Phase 2 — Reorganise `utils/` into Subdirectories

### Target structure

```
utils/
├── invoice/
│   ├── invoiceCalculations.ts
│   ├── invoiceFormOperations.ts
│   ├── invoiceGrouping.ts
│   ├── invoiceFinancialGrouping.ts
│   ├── invoiceSync.ts
│   ├── estimateCalculations.ts
│   ├── estimateOperations.ts
│   ├── pdfOperations.ts
│   ├── emailOperations.ts
│   └── customerOperations.ts
├── mtd/
│   ├── mtdDates.ts
│   ├── mtdTaxCalc.ts
│   ├── mtdCategories.ts
│   └── yearQuarters.ts
├── budget/
│   ├── categories.ts
│   ├── transactionCalculation.ts
│   └── transactionOperations.ts
├── settings/
│   ├── settingsOperations.ts
│   ├── appSettingsOption.ts
│   └── diffSettings.ts
├── home/
│   └── homeActivityChunks.ts
└── shared/
    ├── generateUuid.ts
    ├── getCurrencySymbol.ts
    ├── getCurrentUser.ts
    ├── permissions.ts
    ├── sentry.ts
    ├── textHelpers.ts
    └── theme.ts
```

### Process

1. Create subdirectories
2. `git mv` each file to its subdirectory
3. Update all imports across the codebase (grep for each old path)
4. Update `__tests__/utils/` test imports

**Files affected**: ~50 import statements across `hooks/`, `components/`, `app/`, `__tests__/`

**Commit**: `[REFACTOR] Organise utils/ into domain subdirectories`

---

## Phase 3 — Reorganise `hooks/` into Subdirectories

### Target structure

```
hooks/
├── mtd/
│   ├── useMtdData.ts
│   ├── useMtdDataAllQuarters.ts      (new)
│   ├── useMtdDeadlines.ts
│   ├── useMtdTransaction.ts
│   ├── useMtdTransactionsForQuarter.ts
│   └── useTaxRates.ts
├── invoice/
│   ├── useInvoiceData.ts
│   ├── useInvoiceListData.ts         (new)
│   ├── useIsInvoicePaid.ts
│   ├── useCustomerData.ts
│   ├── useAddInvoiceToBudget.ts
│   ├── useUnpaidInvoicesForQuarter.ts (new)
│   └── useChartsData.ts              (new)
├── estimate/
│   └── useEstimateData.ts
├── budget/
│   └── useBudgetData.ts
├── home/
│   └── useHomeInsights.ts
└── shared/
    ├── useAppSettings.ts
    ├── useCameraScanner.ts
    ├── useTransaction.ts
    └── useUserData.ts
```

**Commit**: `[REFACTOR] Organise hooks/ into domain subdirectories`

---

## Phase 4 — Reorganise `components/` Root

### Target structure

```
components/
├── ui/
│   ├── BaseCard.tsx
│   ├── Card.tsx
│   ├── DatePicker.tsx
│   ├── DiscountInput.tsx
│   ├── Picker.tsx
│   ├── PhoneNumber.tsx
│   ├── TaxBandBar.tsx
│   ├── TaxValueSwitch.tsx
│   ├── ThemeToggle.tsx
│   └── ErrorBoundary.tsx        (new — Phase 5)
├── InvoiceForm/                 (unchanged)
├── EstimateForm/                (unchanged)
├── CustomerForm/                (unchanged)
├── UserForm/                    (unchanged)
├── budget/
│   ├── BudgetScreen.tsx
│   ├── AddToBudgetModal.tsx
│   ├── TransactionCard.tsx
│   ├── TransactionForm.tsx
│   └── TransactionList.tsx
├── scanner/
│   ├── DocumentScanner.tsx
│   └── AddTransactionAfterScan.tsx  (fix typo)
├── email/
│   ├── Email.tsx
│   └── TermsAndConditions.tsx
├── navigation/
│   ├── DrawerContent.tsx
│   └── InvoiceEstimateSwitcher.tsx
└── settings/
    ├── AppSettingsForm.tsx
    └── NoSettingsMessage.tsx
```

**Commit**: `[REFACTOR] Organise components/ into domain subdirectories`

---

## Phase 5 — Add Error Boundaries

Create `components/ui/ErrorBoundary.tsx`. Wrap each tab and stack screen.

**Commit**: `[REFACTOR] Add ErrorBoundary to prevent single-screen crashes`

---

## Phase 6 — Remove Dead Code

Delete `context/InvoiceContext.tsx` (legacy, unused, no DB integration).

**Commit**: `[REFACTOR] Remove unused InvoiceContext`

---

## Phase 7 — Slim Screen Files to Pure Composition

**Target**: Every `app/` screen ≤15 lines, ≤6 imports, no logic.

Create wrapper components that absorb all logic from screens:

| Screen file | Wrapper component to create |
|-------------|---------------------------|
| `app/(drawer)/(tabs)/tax.tsx` (360 lines) | `components/mtd/TaxHub.tsx` |
| `app/(stack)/mtdQuarterlySummary.tsx` (418 lines) | `components/mtd/QuarterlySummaryHub.tsx` |
| `app/(stack)/mtdAnnualEstimate.tsx` (504 lines) | `components/mtd/AnnualEstimateHub.tsx` |
| `app/(drawer)/charts.tsx` (301 lines) | `components/invoice/ChartsHub.tsx` |
| `app/(stack)/addMtdTransaction.tsx` (439 lines) | `components/mtd/AddMtdTransactionForm.tsx` |
| `app/(drawer)/info.tsx` (233 lines) | `components/mtd/InfoContent.tsx` |

Each screen becomes:
```tsx
import React from 'react';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import ComponentName from '@/components/domain/ComponentName';

export default function ScreenName() {
  return <ErrorBoundary label="Name"><ComponentName /></ErrorBoundary>;
}
```

**Commit**: `[REFACTOR] Slim screen files by extracting UI components`

---

## Phase 8 — Final Verification

| Step | Action | Expected |
|------|--------|----------|
| 8.1 | `npx tsc --noEmit` | Zero errors |
| 8.2 | `npm test` | All tests pass |
| 8.3 | `npx expo start` | App boots, all tabs load |

---

## Git Commit Sequence

```
1. [CHORE] Create refactor branch and verify baseline
2. [FIX] Fix any pre-existing test failures
3. [REFACTOR] Extract inline DB queries to custom hooks
4. [REFACTOR] Organise utils/ into domain subdirectories
5. [REFACTOR] Organise hooks/ into domain subdirectories
6. [REFACTOR] Organise components/ into domain subdirectories
7. [REFACTOR] Add ErrorBoundary to prevent single-screen crashes
8. [REFACTOR] Remove unused InvoiceContext
9. [REFACTOR] Slim screen files by extracting UI components
10. [TEST] Verify all tests pass after refactoring
```

**Rules**:
- Run `npx tsc --noEmit` before EVERY commit — zero errors
- Run `npm test` before final commit — all pass
- One logical change per commit
- Never `git add .` — always stage specific files
- Use `@/` import aliases everywhere

---

## Import Path Changes Summary

All `@/utils/X` → `@/utils/domain/X` where domain is:
`invoice/`, `mtd/`, `budget/`, `settings/`, `home/`, `shared/`

All `@/hooks/X` → `@/hooks/domain/X` where domain is:
`mtd/`, `invoice/`, `estimate/`, `budget/`, `home/`, `shared/`

All `@/components/X` → `@/components/domain/X` where domain is:
`ui/`, `budget/`, `scanner/`, `email/`, `navigation/`, `settings/`, `mtd/`, `invoice/`

---

## Refactoring Principles

1. **Screen = pure composition** — imports hooks + components, renders layout, no logic
2. **Hook = data fetching + business logic** — returns clean typed data
3. **Component = UI + local logic** — receives props, manages own state, no direct DB calls
4. **One crash = one screen** — error boundaries everywhere
5. **Domain folders** — find invoice code in `invoice/`, not mixed with MTD
6. **No `any` types** — strict TypeScript always
7. **WHY comments** — on financial calculations, date logic, and architectural decisions
8. **Test first** — if a test was broken before refactoring, fix it before moving files
9. **Import aliases** — always use `@/` prefix, never relative paths like `../../`
