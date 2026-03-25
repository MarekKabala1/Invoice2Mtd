# Invoice2Mtd Hardcoded Colors — Replacement Plan

## Overview
**Total hardcoded hex colors found:** 138 occurrences across 20 files
**Files affected:** 20 (mostly in app/, components/, with email templates)
**Theme tokens available:** ThemeContext + tailwind.config.ts ramps

---

## Detailed Color Analysis

### Color #4F46E5 (Purple-600) — 50+ occurrences ⚠️ HIGHEST PRIORITY
**Impact Level:** CRITICAL — Primary button color throughout app

#### Files (Top 10):
1. `components/InvoiceForm/InvoiceSettingsModal.tsx` — 6 occurrences
2. `app/(drawer)/(tabs)/tax.tsx` — 5 occurrences
3. `app/(stack)/mtdQuarterlySummary.tsx` — 4 occurrences
4. `components/InvoiceForm/ActionButtons.tsx` — 2 occurrences
5. `components/TransactionForm.tsx` — 3 occurrences
6. `app/(drawer)/(tabs)/home.tsx` — 3 occurrences
7. `app/(stack)/addMtdTransaction.tsx` — 4 occurrences
8. `components/AddTransactionAfterScann.tsx` — 2 occurrences
9. `app/(stack)/mtdAnnualEstimate.tsx` — 2 occurrences
10. `components/AddToBudgetModal.tsx` — 2 occurrences

#### Context (Where Used):
- `backgroundColor` — Primary action buttons (Save, Update, Select)
- `color` — Icon colors in dark mode
- `shadowColor` — Button drop shadows
- `borderColor` — Form field focus states

#### Current Usage Pattern:
```tsx
// Light mode
backgroundColor: isDark ? '#4f46e5' : '#4338ca'

// Dark mode only
color: isDark ? '#a5b4fc' : '#4f46e5'

// Standalone
backgroundColor: '#4f46e5'
```

#### Recommended Replacement:
**Use `mtd-accent` from tailwind.config.ts**
- Light mode: `mtd-accent-600` (#2563eb) — cleaner, more professional blue
- Dark mode: `mtd-accent-500` (#3b82f6) or `mtd-accent-400` (#60a5fa)
- Icons in dark: `mtd-accent-200` (#bfdbfe) or `mtd-accent-300` (#93c5fd)

#### Replacement Strategy:
```tsx
// BEFORE
backgroundColor: isDark ? '#4f46e5' : '#4338ca'

// AFTER
className={`bg-mtd-accent-600 dark:bg-mtd-accent-500`}
// OR using useTheme()
// Create a token in utils/theme.ts:
// primaryActionBg: isDark ? mtdAccent[500] : mtdAccent[600]
```

#### Migration Approach:
1. Add mtd-accent color tokens to utils/theme.ts
2. Create theme helper constants:
   - `primaryActionBg` — mtd-accent-600 / mtd-accent-500
   - `primaryActionBgDark` — mtd-accent-500
   - `primaryIconColor` — mtd-accent-200 / mtd-accent-400
3. Replace all `#4f46e5` with `className="bg-mtd-accent-600 dark:bg-mtd-accent-500"` or theme token

---

### Color #4338CA (Purple-700) — 50+ occurrences ⚠️ HIGHEST PRIORITY
**Impact Level:** CRITICAL — Darker button variant

#### Files (Same as #4f46e5 — paired usage):
Appears alongside #4f46e5 in the same files as darker variant

#### Context:
- `backgroundColor` — Hover/press states on buttons
- Darker contrast for lighter theme

#### Current Usage Pattern:
```tsx
backgroundColor: isDark ? '#7c3aed' : '#6d28d9'  // PDF button pair
backgroundColor: isDark ? '#4f46e5' : '#4338ca'  // Primary button pair
```

#### Recommended Replacement:
**Use `mtd-accent-700` from tailwind.config.ts**
- Light mode: `mtd-accent-700` (#1d4ed8)
- Dark mode: `mtd-accent-600` (#2563eb)

#### Migration Approach:
Same as #4f46e5 — group the pair together:
```tsx
// BEFORE
backgroundColor: isDark ? '#4f46e5' : '#4338ca'

// AFTER
backgroundColor={isDark ? '#2563eb' : '#1d4ed8'}  // mtd-accent-600 / 700
// OR
className={`bg-mtd-accent-700 dark:bg-mtd-accent-600`}
```

---

### Color #A5B4FC (Indigo-200) — 20+ occurrences
**Impact Level:** HIGH — Dark mode icon colors

#### Files:
- `app/(stack)/mtdQuarterlySummary.tsx` — 5 occurrences
- `app/(drawer)/(tabs)/home.tsx` — 4 occurrences
- `app/(drawer)/(tabs)/tax.tsx` — 4 occurrences
- `app/(stack)/addMtdTransaction.tsx` — 3 occurrences
- `app/(stack)/mtdAnnualEstimate.tsx` — 2 occurrences
- Other files — scattered (1-2 each)

#### Context:
- `color` — Icon colors in dark mode (paired with #4f46e5)
- `fill` — SVG element colors

#### Current Usage Pattern:
```tsx
// Dark mode icon color
color={isDark ? '#a5b4fc' : '#4f46e5'}

// Ternary for light/dark
fill={isDark ? '#a5b4fc' : '#4f46e5'}
```

#### Recommended Replacement:
**Use `mtd-accent-200` or `mtd-accent-300` from tailwind.config.ts**
- Dark mode: `mtd-accent-200` (#bfdbfe)
- Light mode: `mtd-accent-600` (#2563eb)

#### Migration:
```tsx
// BEFORE
color={isDark ? '#a5b4fc' : '#4f46e5'}

// AFTER
color={isDark ? 'mtd-accent-200' : 'mtd-accent-600'}
// OR using theme token
color={colors.primaryIconColor}  // Add to utils/theme.ts
```

---

### Color #39AD6A (Success Green) — 40+ occurrences
**Impact Level:** MEDIUM — Already defined in theme

#### Files:
- 15+ files using this color
- ALREADY in tailwind.config.ts: `success: '#39AD6A'`
- ALREADY in utils/theme.ts as `success` property

#### Context:
- `backgroundColor` — Income badges, success buttons
- `color` — Income text, success messages
- SVG fills

#### Current Usage:
```tsx
backgroundColor: '#39AD6A'
color: '#39AD6A'
```

#### Recommended Replacement:
**Use ThemeContext token — Already available!**

#### Migration:
```tsx
// BEFORE
backgroundColor: '#39AD6A'

// AFTER (Option 1 — Using Theme Hook)
backgroundColor={colors.success}

// AFTER (Option 2 — Using Tailwind Class)
className="bg-success dark:bg-success"
```

**Status:** Ready to replace immediately — no config changes needed

---

### Color #EE1C1C (Danger Red) — 50+ occurrences
**Impact Level:** MEDIUM — Already defined in theme

#### Files:
- 15+ files using this color
- ALREADY in tailwind.config.ts: `danger: '#ee1c1c'`
- ALREADY in utils/theme.ts as `danger` property

#### Context:
- `backgroundColor` — Error states, delete buttons
- `color` — Error text, warning icons
- `borderColor` — Error input borders

#### Current Usage:
```tsx
backgroundColor: '#ee1c1c'
color: '#ee1c1c'
borderColor: '#ee1c1c'
```

#### Recommended Replacement:
**Use ThemeContext token — Already available!**

#### Migration:
```tsx
// BEFORE
color: '#ee1c1c'

// AFTER (Option 1 — Using Theme Hook)
style={{ color: colors.danger }}

// AFTER (Option 2 — Using Tailwind Class)
className="text-danger dark:text-danger"
```

**Status:** Ready to replace immediately — no config changes needed

---

### Color #F59E0B (Amber-500) — 15+ occurrences
**Impact Level:** MEDIUM — Warning/Urgent state

#### Files:
1. `app/(stack)/mtdDeadlines.tsx` — 4 occurrences
2. `app/(stack)/mtdQuarterlySummary.tsx` — 3 occurrences
3. `app/(stack)/mtdAnnualEstimate.tsx` — 2 occurrences
4. `app/(drawer)/settings.tsx` — 1 occurrence
5. `app/(drawer)/(tabs)/home.tsx` — 1 occurrence
6. `app/(drawer)/(tabs)/tax.tsx` — 4 occurrences

#### Context:
- `color` — Warning text, urgent deadline indicators
- `backgroundColor` — Warning badges
- `fill` — SVG fills (tax band bar)

#### Current Usage:
```tsx
color: '#f59e0b'
backgroundColor: '#f59e0b'
```

#### Problem:
**NOT in tailwind.config.ts** — Need to add or use Tailwind's built-in

#### Recommended Replacement:
**Option A (Preferred):** Add to tailwind.config.ts
```ts
warning: '#f59e0b'  // Amber-500
```

**Option B (Quick):** Use Tailwind's amber-500
```tsx
className="bg-amber-500 text-amber-500"
```

#### Migration:
```tsx
// BEFORE
color: '#f59e0b'

// AFTER (Option A — Add to theme)
style={{ color: colors.warning }}  // Add warning to utils/theme.ts

// AFTER (Option B — Use Tailwind)
className="text-amber-500 dark:text-amber-500"
```

---

### Color #7C3AED & #6D28D9 (Purple variants) — 6 occurrences
**Impact Level:** LOW — PDF button exclusive

#### Files:
1. `components/InvoiceForm/ActionButtons.tsx` — 2 occurrences

#### Context:
- `backgroundColor` — PDF export button
- Paired dark/light variant

#### Current Usage:
```tsx
backgroundColor: isDark ? '#7c3aed' : '#6d28d9'  // Darker purples
```

#### Recommended Replacement:
**Consolidate with mtd-accent scale**
- Light: `mtd-accent-700` (#1d4ed8)
- Dark: `mtd-accent-600` (#2563eb)

#### Migration:
```tsx
// BEFORE
backgroundColor: isDark ? '#7c3aed' : '#6d28d9'

// AFTER
backgroundColor={isDark ? '#2563eb' : '#1d4ed8'}
// OR
className={`bg-mtd-accent-700 dark:bg-mtd-accent-600`}
```

---

## Implementation Priority & Phasing

### Phase 1: Low-Effort, High-Impact (2 colors = 90 occurrences)
**Effort:** 30 mins | **Impact:** 90+ replacements

1. **#39AD6A** → `colors.success` (40+ uses)
2. **#ee1c1c** → `colors.danger` (50+ uses)

**Why first:** Already in theme, just swap inline hex with theme tokens

```bash
# Example conversions:
# Find: color: '#39AD6A'
# Replace: color: colors.success
```

---

### Phase 2: Critical Colors (2 colors = 48 occurrences)
**Effort:** 1-2 hours | **Impact:** Primary button consistency

1. **#4f46e5** → `mtd-accent-600` (dark) / `mtd-accent-500` (light)
2. **#4338ca** → `mtd-accent-700` (light) / `mtd-accent-600` (dark)
3. **#a5b4fc** → `mtd-accent-200` (dark) / `mtd-accent-600` (light)

**Why:** Affects all primary buttons — consolidates purple color usage onto single professional scale

**Implementation:**
1. Update `utils/theme.ts`:
   ```ts
   export const mtdAccentRamp = {
     200: '#bfdbfe',
     300: '#93c5fd',
     400: '#60a5fa',
     500: '#3b82f6',
     600: '#2563eb',
     700: '#1d4ed8',
   };

   // Add helper tokens
   export const darkColors = {
     ...existingColors,
     mtdAccentPrimary: '#2563eb',      // Primary button light mode
     mtdAccentPrimaryDark: '#3b82f6',  // Primary button dark mode
     mtdAccentIcon: '#bfdbfe',          // Icon light color dark mode
   };
   ```

2. Replace in all files:
   ```tsx
   // Pattern 1: Button backgrounds
   backgroundColor: isDark ? mtdAccent[500] : mtdAccent[600]

   // Pattern 2: Icon colors
   color: isDark ? mtdAccent[200] : mtdAccent[600]
   ```

---

### Phase 3: Warning Color (1 color = 15 occurrences)
**Effort:** 30 mins | **Impact:** Warning consistency

1. **#f59e0b** → `warning` token (add to theme config)

**Implementation:**
1. Add to `tailwind.config.ts`:
   ```ts
   warning: '#f59e0b',
   ```

2. Add to `utils/theme.ts`:
   ```ts
   warning: 'rgb(245, 158, 11)',
   ```

3. Replace all `#f59e0b` with `colors.warning`

---

### Phase 4: PDF Button Colors (2 colors = 6 occurrences)
**Effort:** 15 mins | **Impact:** Consistency with Phase 2

Consolidate `#7c3aed` and `#6d28d9` into mtd-accent scale

---

## Summary Statistics

| Color | Hex | Occurrences | File Count | Status | Phase |
|-------|-----|-------------|-----------|--------|-------|
| #4F46E5 | Purple-600 | ~50 | 10 | Critical | 2 |
| #4338CA | Purple-700 | ~50 | 10 | Critical | 2 |
| #A5B4FC | Indigo-200 | ~20 | 7 | High | 2 |
| #39AD6A | Success | ~40 | 15 | Medium | 1 ✓ |
| #EE1C1C | Danger | ~50 | 15 | Medium | 1 ✓ |
| #F59E0B | Amber-500 | ~15 | 6 | Medium | 3 |
| #7C3AED | Purple-600 | ~6 | 1 | Low | 4 |
| #6D28D9 | Purple-700 | ~6 | 1 | Low | 4 |

**Total: 138 occurrences → 20 files → 4 phases**

---

## Color Mapping Reference

### Recommended Token Names & Values

```typescript
// In utils/theme.ts — Add these to both lightColors & darkColors

// Primary Action Colors (mtd-accent scale)
mtdAccentPrimary: '#2563eb',           // mtd-accent-600 (light theme primary)
mtdAccentPrimaryDark: '#3b82f6',       // mtd-accent-500 (dark theme primary)
mtdAccentSecondary: '#1d4ed8',         // mtd-accent-700 (hover/press)
mtdAccentSecondaryDark: '#2563eb',     // mtd-accent-600 (dark hover)
mtdAccentIcon: '#bfdbfe',              // mtd-accent-200 (dark mode icons)

// Status Colors
success: '#39AD6A',                     // Income, checkmarks (already exists)
danger: '#ee1c1c',                      // Errors, expenses (already exists)
warning: '#f59e0b',                     // Warnings, urgent (NEW)

// Optional: Invoice Accent (for consistency with AGENTS.md)
invoiceAccent: '#486581',               // invoice-accent-600 (already in config)
```

### In tailwind.config.ts

```typescript
colors: {
  // ... existing colors ...
  danger: '#ee1c1c',        // ✓ Already there
  success: '#39AD6A',       // ✓ Already there
  warning: '#f59e0b',       // ADD THIS
  'mtd-accent': {           // ✓ Already there
    // 200-700 already defined
  },
}
```

---

## Migration Checklist

### Pre-Migration
- [ ] Read AGENTS.md — understand ThemeContext pattern
- [ ] Review utils/theme.ts — understand existing color tokens
- [ ] Review tailwind.config.ts — understand ramp structure
- [ ] Review context/ThemeContext.tsx — understand how colors flow to components

### Phase 1 (Quick Wins)
- [ ] Replace all `#39AD6A` with `colors.success`
- [ ] Replace all `#ee1c1c` with `colors.danger`
- [ ] Test in light & dark mode
- [ ] Commit: `[STYLE] Replace success and danger hardcoded colors with theme tokens`

### Phase 2 (Critical)
- [ ] Update utils/theme.ts with mtd-accent helper tokens
- [ ] Replace all `#4f46e5` with `isDark ? mtdAccent[500] : mtdAccent[600]`
- [ ] Replace all `#4338ca` with `isDark ? mtdAccent[700] : mtdAccent[600]`
- [ ] Replace all `#a5b4fc` with `isDark ? mtdAccent[200] : mtdAccent[600]`
- [ ] Update ActionButtons.tsx & related components
- [ ] Test: All buttons, icons, shadows render correctly
- [ ] Test dark mode toggle
- [ ] Commit: `[STYLE] Replace purple hardcoded colors with mtd-accent scale`

### Phase 3 (Warning)
- [ ] Add `warning` to tailwind.config.ts
- [ ] Add `warning` color to utils/theme.ts
- [ ] Replace all `#f59e0b` with `colors.warning`
- [ ] Test warning states in tax deadlines
- [ ] Commit: `[STYLE] Add warning color token and replace amber uses`

### Phase 4 (Cleanup)
- [ ] Consolidate PDF button colors into mtd-accent
- [ ] Final grep for any remaining hardcoded colors
- [ ] Commit: `[STYLE] Consolidate PDF button colors into mtd-accent scale`

### Verification
- [ ] `npx tsc --noEmit` — zero errors
- [ ] Manual testing: Light mode + dark mode toggle on all screens
- [ ] Check email templates separately (OK to keep HTML inline styles)
- [ ] Verify app.json backgroundColor values (OK to keep — splash screen)

---

## Notes on Exceptions

### Email Templates (OK to keep as-is)
- `templates/emailRemaiderTemplate.ts` — HTML inline styles
- `templates/invoiceTemplate.ts` — PDF generation inline styles
- `templates/estimateTemplate.ts` — PDF generation inline styles
- **Reason:** These are static HTML strings for email/PDF, not React Native components

### App.json (OK to keep as-is)
- `app.json` backgroundColor values for splash screen
- **Reason:** Not part of component theme system

### Global CSS (OK to keep as-is)
- `global.css` — CSS variables for web fallback
- **Reason:** Not used in React Native app; kept for completeness

### Test Mocks (OK to update OR skip)
- `__mocks__/index.js` — Mock color scheme
- **Reason:** Optional; update only if tests fail color assertions

---

## References
- AGENTS.md: ThemeContext usage pattern & visual identity guidelines
- tailwind.config.ts: Complete color ramp definitions
- utils/theme.ts: Current theme token exports
- context/ThemeContext.tsx: How theme flows to components
