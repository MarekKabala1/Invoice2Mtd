# Quick Reference — Hardcoded Color Replacements

## Color-by-Color Mapping

| Old Hex | Semantic | New Replacement | Files (Count) | Priority | Notes |
|---------|----------|-----------------|--------|----------|-------|
| `#4f46e5` | Primary Button (Dark) | `mtd-accent-500` | 10 files | 🔴 CRITICAL | Used with isDark ternary |
| `#4338ca` | Primary Button (Light) | `mtd-accent-700` | 10 files | 🔴 CRITICAL | Darker variant for hover |
| `#a5b4fc` | Icon Color (Dark) | `mtd-accent-200` | 7 files | 🟠 HIGH | Paired with #4f46e5 |
| `#39ad6a` | Success (Income) | `colors.success` | 15 files | 🟡 MEDIUM | ✓ Already in theme |
| `#ee1c1c` | Danger (Error) | `colors.danger` | 15 files | 🟡 MEDIUM | ✓ Already in theme |
| `#f59e0b` | Warning (Urgent) | `colors.warning` | 6 files | 🟡 MEDIUM | NEW token needed |
| `#7c3aed` | PDF Button (Dark) | `mtd-accent-600` | 1 file | 🟢 LOW | Consolidate group |
| `#6d28d9` | PDF Button (Light) | `mtd-accent-700` | 1 file | 🟢 LOW | Consolidate group |

---

## File-by-File Impact

### 🔴 CRITICAL FILES (5+ occurrences each)

| File | Hardcoded Colors | Count | Solution |
|------|------------------|-------|----------|
| `components/InvoiceForm/InvoiceSettingsModal.tsx` | #4f46e5, #4338ca, #39ad6a, #ee1c1c | 16 | Phase 1 + 2 |
| `app/(drawer)/(tabs)/tax.tsx` | #4f46e5, #ee1c1c, #39ad6a, #a5b4fc | 14 | Phase 1 + 2 |
| `app/(stack)/mtdQuarterlySummary.tsx` | #4f46e5, #a5b4fc, #39ad6a, #ee1c1c | 14 | Phase 1 + 2 |
| `app/(stack)/mtdDeadlines.tsx` | #ee1c1c, #f59e0b, #a5b4fc, #64748b | 9 | Phase 1 + 3 |
| `app/(drawer)/(tabs)/home.tsx` | #ee1c1c, #a5b4fc, #39ad6a, #f59e0b | 10 | Phase 1 + 2 + 3 |
| `components/TransactionForm.tsx` | #4f46e5, #39ad6a, #ee1c1c, #8B5E3C | 12 | Phase 1 + 2 |
| `app/(stack)/addMtdTransaction.tsx` | #4f46e5, #ee1c1c, #a5b4fc, #39ad6a | 15 | Phase 1 + 2 + 3 |
| `app/(stack)/mtdAnnualEstimate.tsx` | #4f46e5, #ee1c1c, #a5b4fc, #f59e0b | 12 | Phase 1 + 2 + 3 |
| `components/InvoiceForm/ActionButtons.tsx` | #4f46e5, #7c3aed, #6d28d9, #39ad6a | 8 | Phase 1 + 2 + 4 |
| `app/(drawer)/settings.tsx` | #4f46e5, #39ad6a, #f59e0b, #FFC107 | 6 | Phase 1 + 2 + 3 |

### 🟡 MEDIUM FILES (2-4 occurrences)

- `components/TransactionCard.tsx` — 1 (#39ad6a)
- `components/InvoiceForm/InvoiceCard.tsx` — 2 (#9fb3c8, #334e68, #ee1c1c)
- `components/InvoiceForm/InvoiceList.tsx` — 2 (#486581, #ee1c1c)
- `components/AddTransactionAfterScann.tsx` — 8 (#39ad6a, #ee1c1c, #4f46e5)
- `components/TransactionList.tsx` — 4 (#4f46e5, #39ad6a, #ee1c1c)
- `components/BudgetScreen.tsx` — 2 (#39ad6a, #ee1c1c)
- `components/AddToBudgetModal.tsx` — 2 (#4f46e5)
- `global.css` — 2 (CSS variable definitions)
- `tailwind.config.ts` — 2 (Color config)
- `REFACTORING_PLAN.md` — 3 (Documentation)

---

## Code Patterns to Replace

### Pattern 1: Success Color (40+ uses)
```tsx
// BEFORE
backgroundColor: '#39AD6A'
color: '#39AD6A'
borderColor: '#39AD6A'

// AFTER
backgroundColor: colors.success
color={colors.success}
borderColor={colors.danger}
```

### Pattern 2: Danger Color (50+ uses)
```tsx
// BEFORE
color: '#ee1c1c'
backgroundColor: '#ee1c1c'

// AFTER
color={colors.danger}
backgroundColor={colors.danger}
```

### Pattern 3: Primary Button with Ternary (48+ uses)
```tsx
// BEFORE
backgroundColor: isDark ? '#4f46e5' : '#4338ca'

// AFTER (Option A — Using tailwind classes)
className={`bg-mtd-accent-600 dark:bg-mtd-accent-700`}

// AFTER (Option B — Using hex directly)
backgroundColor={isDark ? '#3b82f6' : '#2563eb'}

// AFTER (Option C — Using theme token helper)
backgroundColor={colors.mtdAccentPrimary}  // Light mode default
// Then handle dark in utils/theme.ts
```

### Pattern 4: Icon Color with Ternary (20+ uses)
```tsx
// BEFORE
color: isDark ? '#a5b4fc' : '#4f46e5'

// AFTER (Option A)
className={`text-mtd-accent-600 dark:text-mtd-accent-200`}

// AFTER (Option B)
color={isDark ? '#bfdbfe' : '#2563eb'}
```

### Pattern 5: Paired Light/Dark Button (6+ uses)
```tsx
// BEFORE (PDF Button)
backgroundColor: isDark ? '#7c3aed' : '#6d28d9'

// AFTER
backgroundColor={isDark ? '#2563eb' : '#1d4ed8'}
```

---

## Implementation Order (For Commits)

### Commit 1: Phase 1 — Success & Danger
```bash
git add components/ app/ db/ hooks/
git commit -m "[STYLE] Replace hardcoded success and danger colors with theme tokens"

# Size: ~15 files, ~90 changes
# Time: ~30 min
```

### Commit 2: Phase 2 — Primary Action (Purple)
```bash
# First update utils/theme.ts with mtd-accent helpers
git add utils/theme.ts
git add components/InvoiceForm/
git add app/
git commit -m "[STYLE] Replace purple button colors with mtd-accent scale"

# Size: ~10 files, ~48 changes
# Time: ~1-2 hours
```

### Commit 3: Phase 3 — Warning
```bash
git add tailwind.config.ts utils/theme.ts
git add app/
git commit -m "[STYLE] Add warning color token and consolidate amber uses"

# Size: ~6 files, ~15 changes
# Time: ~30 min
```

### Commit 4: Phase 4 — Cleanup
```bash
git add components/InvoiceForm/ActionButtons.tsx
git commit -m "[STYLE] Consolidate PDF button colors into mtd-accent"

# Size: ~1 file, ~6 changes
# Time: ~15 min
```

---

## Verification Checklist

- [ ] All files have `useTheme()` hook imported where needed
- [ ] No hardcoded colors remain (except email/PDF templates & app.json)
- [ ] Light mode looks correct (colors appear as intended)
- [ ] Dark mode looks correct (colors invert properly with dark: variants)
- [ ] All buttons respond to theme toggle
- [ ] Icon colors match in both themes
- [ ] Error messages show in correct red
- [ ] Success states show in correct green
- [ ] Warning states show in correct amber/orange
- [ ] Run `npx tsc --noEmit` — zero errors
- [ ] Run `npm test` — all tests pass
- [ ] Tested on iOS simulator (light & dark)
- [ ] Tested on Android emulator (light & dark)

---

## Tools & Commands

### Find remaining hardcoded colors
```bash
# Grep for all remaining hex colors
grep -r "#[0-9A-Fa-f]\{6\}" app/ components/ utils/ \
  --include="*.tsx" --include="*.ts"

# Count occurrences
grep -r "#[0-9A-Fa-f]\{6\}" app/ components/ utils/ \
  --include="*.tsx" --include="*.ts" | wc -l

# Find specific color
grep -r "#4f46e5" app/ components/ utils/ --include="*.tsx"
```

### Type check before committing
```bash
npx tsc --noEmit
```

### Test affected screens
```bash
npx expo start

# Test screens:
# 1. Light mode — Toggle, Tax, Home, Invoices, Budget, Settings
# 2. Dark mode — Same screens, toggle back to light
# 3. Create Invoice — Check button colors & error states
# 4. Add Transaction — Check income/expense toggle colors
# 5. MTD screens — Check deadline colors, warning badges
```

---

## Reference Materials

- Full plan: `/COLOR_REPLACEMENT_PLAN.md`
- Theme values: `/utils/theme.ts`
- Tailwind config: `/tailwind.config.ts`
- Context: `/context/ThemeContext.tsx`
- Architecture guide: `/AGENTS.md` (line 213-259 for theme/colors)
