# Contributing to Invoice2Mtd

Invoice2Mtd is a React Native/Expo app for managing UK tax submissions and invoices. This guide covers code style, architecture, and workflow.

## Code Style

### Import Order

Keep imports organized in this order:
1. React and React Native
2. expo-router
3. Third-party packages
4. Local imports (@ aliases)

```typescript
import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { TaxBandBar } from '@/components/TaxBandBar';
```

### TypeScript

- **Strict mode required** — no `any` types
- **Drizzle ORM types**: `InferSelectModel<typeof User>`
- **Database select queries**: `typeof MtdQuarterlySummary.$inferSelect`
- **Enums from schema**: Import from `/db/schema.ts` or `/types/mtd.ts`

```typescript
// ✅ Good
const user: typeof User.$inferSelect = await db.query.User.findFirst(...);

// ❌ Bad
const user: any = await db.query.User.findFirst(...);
```

### Naming Conventions

- **Files**:
  - Hooks: `camelCase` — `useMtdData.ts`
  - Utils: `camelCase` — `mtdDates.ts`
  - Components: `PascalCase` — `TaxBandBar.tsx`
  - Screens: `camelCase` — `tax.tsx`

- **Constants**: `UPPER_SNAKE_CASE`
  - Example: `EXPENSE_CATEGORIES`, `RATES_2025_26`

- **Variables/functions**: `camelCase`
  - Example: `formatGBP()`, `taxYear`

### Styling

- **Tailwind only** — use `className` attribute
- **NativeWind** for react-native components
- **No inline styles** except for dynamic values
- **Dark mode**: Use `dark:` variant with theme context

```typescript
// ✅ Good
<View className="p-4 rounded-lg bg-white dark:bg-slate-900">
  <Text style={{ color: isDark ? colors.text : '#000' }}>Dynamic</Text>
</View>

// ❌ Bad
<View style={{ backgroundColor: '#fff' }}>
```

- **Colors**: Use theme context tokens, not hardcoded hex
  - From `useTheme()`: `colors.primary`, `colors.nav`, `colors.accent`
  - From `tailwind.config.ts`: Theme color classes

### Comments Style

Add **WHY comments** for complex logic, not WHAT comments:

```typescript
// ✅ Good
// WHY: Tax year starts Apr 6, not Jan 1, due to historical UK tax rules.
const taxYearStart = new Date(year, 3, 6);

// ❌ Bad
// Set tax year start to April 6
const taxYearStart = new Date(year, 3, 6);
```

**Required WHY comments for:**
- Complex financial calculations
- Date/deadline logic
- Three-source data aggregations
- User preference overrides

## Database & Schemas

- **Schemas**: `db/zodSchema.ts` — single source of truth
- **Tables**: `db/schema.ts` — Drizzle table definitions
- **Operations**: Organized by domain
  - `db/mtdOperations.ts` — re-exports from mtdTransactionOps, mtdQuarterlySummaryOps, mtdAnnualSummaryOps
  - `db/invoiceOperations.ts` — invoice CRUD
  - `db/settingsOperations.ts` — app settings

**Always use Drizzle ORM for database queries** — no raw SQL (except in migrations).

## Forms

- **Library**: `react-hook-form` + `zod` validation
- **Resolver**: `@hookform/resolvers/zod`
- **Schemas**: Define in `db/zodSchema.ts`
- **Validation**: Happens on form submit, not onChange
- **Error display**: Use control.formState.errors

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { invoiceSchema } from '@/db/zodSchema';

const { control, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(invoiceSchema),
  defaultValues: { ...invoice }
});
```

## Testing

### Philosophy

- **Pure utilities**: Test directly without mocks
- **Hooks**: Mock database operations
- **Integration**: Test full workflows end-to-end
- **No snapshot tests** — too brittle with Tailwind

### File Structure

```
__tests__/
├── unit/
│   ├── mtdDates.test.ts
│   ├── mtdTaxCalc.test.ts
│   └── mtdCategories.test.ts
├── integration/
│   ├── mtdDataFlow.test.ts
│   ├── settingsMultiUser.test.ts
│   └── invoiceMtdSync.test.ts
```

### Example Test

```typescript
// __tests__/unit/mtdDates.test.ts
import { taxYearForDate } from '@/utils/mtdDates';

describe('taxYearForDate', () => {
  it('returns correct tax year for date after Apr 6', () => {
    const date = new Date(2025, 4, 15); // May 15, 2025
    expect(taxYearForDate(date)).toBe(2025);
  });

  it('returns previous year for date before Apr 6', () => {
    const date = new Date(2025, 2, 15); // Mar 15, 2025
    expect(taxYearForDate(date)).toBe(2024);
  });
});
```

## Commit Discipline

### Format

```
[PREFIX] Short description (50 chars max)

Optional body explaining WHY, not WHAT.
Use imperative mood: "Add feature" not "Added feature"

Co-Authored-By: Claude Haiku <noreply@anthropic.com>
```

### Prefixes

Use one per commit:
- `[MTD]` — MTD/quarterly calculations
- `[NAV]` — Navigation, routing, layout
- `[SETTINGS]` — Settings screen, user preferences
- `[INVOICE]` — Invoice forms, lists, operations
- `[BUDGET]` — Budget transactions, categorization
- `[SCHEMA]` — Database schema, Zod types
- `[COMPONENTS]` — Reusable UI components
- `[STYLE]` — Styling, themes, dark mode
- `[DOCS]` — Documentation, comments
- `[TEST]` — Tests, test utilities
- `[REFACTOR]` — Code organization, no behavior change
- `[FIX]` — Bug fixes
- `[CHORE]` — Dependencies, build config

### Rules

1. **One logical change per commit** — if message contains "and", split it
2. **Never use `git add .`** — always `git add [specific files]`
3. **Stage work gradually** — review each chunk before committing
4. **Run TypeScript before every commit**:
   ```bash
   npx tsc --noEmit
   ```
5. **Run tests before merge**:
   ```bash
   npm test
   ```

### Good Commit Examples

```
[REFACTOR] Split mtdOperations into specialized modules (Phase B2)

Extracted 450+ lines into three focused modules:
- mtdTransactionOps.ts: MtdTransactions CRUD
- mtdQuarterlySummaryOps.ts: Quarterly aggregation
- mtdAnnualSummaryOps.ts: Annual summary operations

WHY: Improves maintainability by separating concerns. Each module
focuses on one responsibility, making code easier to understand
and modify without side effects.
```

```
[FIX] Fix month picker in MTDSettingsSection parsing

Symptom: Month selections not persisting. Root cause: String parsing
didn't trim spaces, invalid values weren't filtered.

Fix: Added proper normalization with trim() and filter(m > 0 && m <= 12).

WHY: MTD quarters are hardcoded to specific months set by HMRC. Input
validation must be strict to prevent invalid quarter configurations that
break quarterly reporting.
```

## Before Each Phase

1. **Verify TypeScript** — zero errors required
   ```bash
   npx tsc --noEmit
   ```

2. **Run tests**
   ```bash
   npm test
   ```

3. **Test in Expo** — start dev server and verify on device/simulator
   ```bash
   npx expo start
   ```

## Architecture

### Data Flow

1. **UI Screen** (e.g., `tax.tsx`) — renders data
2. **Custom Hook** (e.g., `useMtdData.ts`) — fetches and caches
3. **Database Operations** (e.g., `db/mtdOperations.ts`) — queries
4. **Context** (e.g., `AppSettingsContext`) — user preferences

### Patterns

- **useEffectAsync**: No built-in async effect, use `useCallback` + `useFocusEffect`
- **Form state**: `react-hook-form` + Zod for validation
- **Settings**: Stored in `appSettings` table with `userId` foreign key
- **Dark mode**: Theme context provides colors, use `dark:` Tailwind variant

### Multi-User Support

- All queries filter by `userId`
- Settings per user in `appSettings` table
- MTD calculations tied to user via `userId` in hooks
- Invoice/budget data flows through user context

## Debugging

### Common Issues

**Q: "Any type detected"**
- A: Replace with proper Drizzle type or `typeof tableName.$inferSelect`

**Q: Dark mode text invisible**
- A: Check for hardcoded colors in `style={{}}`. Use `colors` from theme context instead.

**Q: TypeScript error in mtdDates.ts**
- A: Tax year boundaries are Apr 6 - Apr 5 (not Jan 1 - Dec 31). Check date math.

**Q: MTD data not showing for user B**
- A: Verify `userId` is passed through hook chain. Check AppSettingsContext has correct user selected.

### Logging in Development

Use Sentry utilities from `utils/sentry.ts`:

```typescript
import { addBreadcrumb, captureException } from '@/utils/sentry';

try {
  addBreadcrumb('Started MTD refresh');
  const data = await aggregateQuarter(...);
  addBreadcrumb('Completed MTD refresh', { data });
} catch (err) {
  captureException(err as Error, { context: 'mtdRefresh' });
}
```

## Resources

- **Expo Documentation**: https://docs.expo.dev
- **React Native**: https://reactnative.dev
- **Drizzle ORM**: https://orm.drizzle.team
- **Zod Validation**: https://zod.dev
- **Tailwind CSS**: https://tailwindcss.com
- **react-hook-form**: https://react-hook-form.com
- **UK Tax Year Dates**: https://www.gov.uk/guidance/tax-years

## Questions?

- Check existing code for patterns
- Search for similar implementations
- Review recent commits for recent changes
- Ask in pull request comments

---

**Last updated**: 2026-03-25
**Maintained by**: Claude AI
