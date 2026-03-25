# AGENTS.md — Invoice2Mtd

Invoice2Mtd is a React Native/Expo app for UK sole traders: invoicing, estimates, budget tracking, document scanner, and Making Tax Digital (MTD) tax tracking. Built with Expo SDK 51, TypeScript, Drizzle ORM, NativeWind (Tailwind), and Zustand.

---

## Build / Lint / Test Commands

```bash
# Start dev server
npx expo start

# Type check (run before every commit — zero errors required)
npx tsc --noEmit

# Lint
npm run lint           # or: npx expo lint

# Run all tests (watch mode)
npm test               # or: jest --watchAll

# Run a single test file
npx jest __tests__/utils/mtdDates.test.ts

# Run tests matching a pattern
npx jest --testNamePattern="taxYearForDate"

# Generate DB migration (after schema changes)
npx drizzle-kit generate

# Expo builds
npm run android
npm run ios
npm run web
```

---

## Project Structure

```
app/
├── _layout.tsx              # Root Stack + providers
├── (drawer)/                # Drawer navigator
│   ├── _layout.tsx          # Drawer layout (expo-router/drawer)
│   ├── (tabs)/              # Bottom tab navigator
│   │   ├── home.tsx
│   │   ├── invoices.tsx
│   │   ├── tax.tsx          # MTD hub
│   │   ├── budget.tsx
│   │   └── scanner.tsx
│   ├── settings.tsx         # Settings screen (orchestrator)
│   ├── settings/            # Settings sections + components
│   │   ├── sections/        # Individual section components
│   │   ├── components/      # Reusable settings UI primitives
│   │   └── utils.ts         # applyDefaults, getSetting helpers
│   ├── info.tsx
│   └── charts.tsx
├── (stack)/                 # Push screens (createInvoice, addMtdTransaction, etc.)
components/                  # Reusable UI components
context/                     # React contexts (AppSettings, Theme, Invoice)
db/                          # Drizzle schema, operations, config
hooks/                       # Custom hooks (useMtdData, useInvoiceData, etc.)
types/                       # TypeScript types (index.ts, mtd.ts)
utils/                       # Pure utility functions
__tests__/                   # Unit, hook, and integration tests
```

---

## Code Style Guidelines

### Import Order

```
1. React and React Native
2. expo-router
3. Third-party packages
4. Local imports (@/ aliases)
```

### TypeScript

- **Strict mode required** — no `any` types
- Drizzle ORM types: `InferSelectModel<typeof TableName>`
- DB row types: `typeof table.$inferSelect`
- Enums from schema: import from `/db/schema.ts` or `/types/mtd.ts`

### Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Hooks | camelCase | `useMtdData.ts` |
| Utils | camelCase | `mtdDates.ts` |
| Components | PascalCase | `TaxBandBar.tsx` |
| Screens | camelCase | `tax.tsx` |
| Constants | UPPER_SNAKE_CASE | `EXPENSE_CATEGORIES` |
| Functions | camelCase | `formatGBP()`, `taxYearForDate()` |

### Styling

- **Tailwind only** — use `className` prop via NativeWind
- **No inline styles** except for dynamic values (e.g. `style={{ backgroundColor: colors.primary }}`)
- **Dark mode**: use `dark:` Tailwind variant + ThemeContext tokens
- **Colors**: always from `useTheme()` context or `tailwind.config.ts` — never hardcode hex values

```tsx
// Good
<View className="p-4 rounded-lg bg-white dark:bg-slate-900">
  <Text style={{ color: colors.text }}>Dynamic value</Text>
</View>

// Bad
<View style={{ backgroundColor: '#4f46e5' }}>
```

### Forms

- **react-hook-form** + **zod** validation + `@hookform/resolvers/zod`
- Schemas defined in `db/zodSchema.ts`
- Validation on submit, not onChange
- Error display via `control.formState.errors`

### Error Handling

- Catch blocks: use `Alert.alert()` for user-facing errors
- No `console.log` in production code — use Sentry utilities from `utils/sentry.ts`
- Silent catches only for non-critical operations (e.g. DB not ready before migrations)

### WHY Comments

Add WHY comments for complex logic, not WHAT comments:

```typescript
// Good: WHY
// WHY: UK tax year starts Apr 6, not Jan 1, due to historical tax rules.
const taxYearStart = new Date(year, 3, 6);

// Bad: WHAT
// Set tax year start to April 6
const taxYearStart = new Date(year, 3, 6);
```

Required on: financial calculations, date/deadline logic, three-source aggregations, user preference overrides.

---

## Git Discipline

### Commit Prefix Convention

Every commit message must start with one of these prefixes:

| Prefix | Use for |
|--------|---------|
| `[MTD]` | MTD files — types, utils, hooks, DB operations, screens |
| `[NAV]` | Navigation restructure — drawer, tabs, layout files |
| `[SETTINGS]` | Settings screen and appSettings-related changes |
| `[INVOICE]` | Invoice/estimate screens or logic |
| `[BUDGET]` | Budget/transaction screens or logic |
| `[SCHEMA]` | db/schema.ts or generated migration files |
| `[STYLE]` | Visual identity — Tailwind config, NativeWind classes, theme |
| `[TEST]` | New or updated test files |
| `[FIX]` | Bug fix on any module |
| `[REFACTOR]` | Code reorganisation with no behaviour change |
| `[DOCS]` | README, planning docs, comments only |
| `[CHORE]` | package.json, config files, tooling |

### Commit Message Format

```
[PREFIX] Short description in sentence case (50 chars max)

Optional body — explain WHY, not WHAT. The diff shows what
changed. The commit message explains why you made the decision.

Refs: MASTER_PLAN.md Phase X Step Y.Z
```

### Rules

1. **One logical change per commit** — if message contains "and", split it
2. **Never use `git add .`** — always stage specific files: `git add [file1] [file2]`
3. **Run type check before every commit**: `npx tsc --noEmit`
4. **Run tests before merge**: `npm test`
5. **Write file comments** at the top of every new file: what, why, dependencies
6. **Commit after each completed step**, not after each phase
7. **Tag each completed phase**: `git tag phase-1-navigation`, `git tag phase-2-data-layer`, etc.

---

## Architecture Patterns

### Data Flow

```
UI Screen → Custom Hook → Database Operations → Drizzle ORM → SQLite
                ↑
         Context (AppSettings, Theme)
```

### Hook Return Shape

```typescript
{ data: T | null, isLoading: boolean, error: string | null, refresh: () => Promise<void> }
```

### Multi-User Support

- All queries filter by `userId`
- Settings per user in `appSettings` table
- MTD calculations tied to user via `userId` in hooks

### MTD Integration (Three Sources)

MTD never asks the user to re-enter data already recorded:
1. **PAID INVOICES** → income (via `Invoice` table, `isPayed=true`)
2. **BUDGET TRANSACTIONS** → expenses (via `Transactions` table, mapped to HMRC categories)
3. **MANUAL MTD RECORDS** → cash payments, receipts (via `MtdTransactions` table)

All sources combine in `aggregateQuarter()`.

---

## Testing Philosophy

- **Pure utilities**: test directly without mocks
- **Hooks**: mock database operations
- **Integration**: test full workflows end-to-end
- **No snapshot tests** — too brittle with Tailwind classes
- Coverage thresholds: 60% branches, 70% functions/lines/statements

### Test File Structure

```
__tests__/
├── utils/         # Pure utility tests (no mocks)
├── hooks/         # Hook tests (mock DB operations)
├── db/            # DB operation tests
└── integration/   # End-to-end workflow tests
```

---

## Key Tech Stack (already installed — do NOT reinstall)

Expo SDK 51, expo-router v3 (drawer via `expo-router/drawer`), React Native 0.74, TypeScript 5.3, Drizzle ORM 0.33 + expo-sqlite 14, NativeWind 4 + Tailwind CSS 3, React Hook Form 7 + Zod 3, date-fns 4, react-native-uuid 2, react-native-chart-kit + react-native-svg, jest-expo, react-native-gesture-handler + react-native-reanimated

---

## Before Each Phase

1. `npx tsc --noEmit` — zero errors required
2. `npm test` — all tests pass
3. `npx expo start` — app boots without crashes

---

## Common Issues

| Problem | Solution |
|---------|----------|
| "Any type detected" | Replace with Drizzle type or `typeof table.$inferSelect` |
| Dark mode text invisible | Check for hardcoded `style={{}}` colors. Use `colors` from theme context |
| TypeScript error in mtdDates.ts | Tax year is Apr 6 → Apr 5, not Jan 1 → Dec 31. Check date math |
| MTD data not showing | Verify `userId` is passed through hook chain |
| Migration not applied | Check `drizzle/migrations.js` imports the new SQL file |

---

**Last updated**: 2026-03-25
