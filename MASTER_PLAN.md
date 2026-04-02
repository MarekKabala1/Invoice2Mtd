# Invoicing + MTD — Master Planning Document **Invoice2Mtd**
### One unified app for UK sole traders: invoicing, estimates, budget, and Making Tax Digital

**Repository:** Fork of `github.com/MarekKabala1/invoiceApp`
**Branch:** `featureBranch`
**Vision:** A single, cohesive app where invoicing and MTD tax tracking work together — shared data, unified navigation, one design language with two distinct visual identities within it.
**Constraint:** No new npm packages. The drawer navigator is built using Expo Router's native `(drawer)` file-system routing — no `@react-navigation/drawer` install needed. Expo Router already wraps React Navigation under the hood and exposes drawer layout natively via the `expo-router/layouts` `Drawer` component.

---

## What This Document Covers

This is the single source of truth for all planned work. It combines and supersedes:
- Information About new GitHub repository
- New eas profile for submitting and building app
- New Sentry Information to add to the app
- MTD implementation plan
- The styles improvement prompt
- The navigation restructure (drawer + new bottom nav tab)
- The Info screen

Everything is organised into phases that build on each other in order. Each phase ends in a working, shippable state so you can stop between phases if needed.

---

## The Target App Structure

### Navigation Architecture (after this plan is complete)

```
Root Navigator (Drawer)
├── Main App (Tab Navigator)           ← the existing bottom tabs, restructured
│   ├── Tab: Home                      ← dashboard, unified MTD + invoice summary
│   ├── Tab: Invoices                  ← invoices + estimates
│   ├── Tab: Tax (NEW)                 ← MTD hub — replaces MTD widget on home
│   ├── Tab: Budget                    ← income/expense tracker
│   └── Tab: Scanner                   ← document scanner
│
└── Drawer Screens (slide-in from left)
    ├── Settings
    │   ├── Profile                    ← name, email, address, phone, UTR, NI, logo
    │   ├── Bank Details               ← sort code, account number, bank name
    │   ├── Tax Defaults               ← tax rate, add/inclusive mode, live preview
    │   ├── Invoice & Estimate Numbers ← prefix, auto-increment numbering
    │   ├── MTD & Tax                  ← enrolled toggle, auto-calc, reminder days
    │   ├── Appearance                 ← theme, currency, date format, number format
    │   ├── Reminders                  ← invoice due reminders
    │   └── About                      ← version, GOV.UK links
    ├── Info (NEW)                      ← MTD guidance, tax reference, help
    └── Charts & Analytics             ← MOVED from tabs (frees up bottom nav space)
```

### Stack Screens (unchanged — still pushed from tabs)
```
(stack)/
├── createInvoice.tsx
├── createEstimate.tsx
├── clientInfo.tsx
├── addTransaction.tsx
├── addMtdTransaction.tsx          ← NEW (MTD)
├── mtdQuarterlySummary.tsx        ← NEW (MTD)
├── mtdAnnualEstimate.tsx          ← NEW (MTD)
├── mtdDeadlines.tsx               ← NEW (MTD)
└── termsAndConditions.tsx
```

### What moves where — summary

| Current location | New location | Reason |
|-----------------|--------------|--------|
| `app/(tabs)/charts.tsx` | Drawer → Charts & Analytics | Frees a tab slot for MTD Tax tab |
| `app/(stack)/(user)/userInfo.tsx` | Drawer → Settings | Settings belong in drawer, not a stack push |
| `app/(stack)/(user)/bankDetailsForm.tsx` | Drawer → Settings | Same |
| `app/(stack)/(user)/userInfoForm.tsx` | Drawer → Settings | Same |
| ThemeToggle | Drawer → Settings | Discoverable in settings |
| MtdDashboardWidget (was planned for home) | Tab: Tax (full screen) | MTD deserves its own tab, not a widget |
| New Info screen | Drawer → Info | Reference content, not daily-use |

---

## Phase 0 —  Setup

- Setup of Eas profile in the app.json Eas info for new project npm install --global eas-cli && npx create-expo-app invoice2mtd && cd invoice2mtd && eas init --id 067de4fa-7ee4-4821-8acc-c96a05c2f544, for existing npm install --global eas-cli && eas init --id 067de4fa-7ee4-4821-8acc-c96a05c2f544
- Setup Sentry new entry ## Automatic Configuration (Recommended)

Add Sentry automatically to your app with the [Sentry wizard](https://docs.sentry.io/platforms/react-native/#install) (call this inside your project directory).

```bash
npx @sentry/wizard@latest -i reactNative --saas --org mk-3c --project react-native
```

The Sentry wizard will automatically patch your project with the following:

- Configure the SDK with your DSN
- Add source maps upload to your build process
- Add debug symbols upload to your build process

## Manual Configuration

Alternatively, you can also set up the SDK manually, by following the [manual setup docs](https://docs.sentry.io/platforms/react-native/manual-setup/manual-setup/).

If you already have the configuration for Sentry in your application, and just need this project's (react-native) DSN, you can find it below:

```
https://73c7209d913226b700df16950fd41f83@o4508151262347264.ingest.de.sentry.io/4511077837504592
```

### Steps

**0.1** — Clone old invoiceApp locally using SSH `git@github.com:MarekKabala1/invoiceApp.git` to the code editor. Name for the new app: `Invoice2Mtd`.

**0.2** — New GitHub information:
```bash
git init
git add README.md
git commit -m "first commit"
git branch -M main
git remote add origin git@github.com:MarekKabala1/Invoice2Mtd.git
git push -u origin main
```

**0.3** — Add the original as upstream:
```bash
git remote add upstream
```

**0.4** — Create the unified feature branch:
```bash
git checkout -b featureBranch
```

**0.5** — Install and verify the base app boots:
```bash
npm install
npx expo start
```

**0.6** — Update `app.json` identity (name, slug, bundle identifiers, owner, EAS projectId) to match.

**0.7** — Branch strategy going forward:

| Branch | Purpose |
|--------|---------|
| `main` | Clean mirror of upstream invoiceApp — only updated via `git merge upstream/main` |
| `featureBranch` | All work in this document — phases 1–7 |
| `feature/hmrc-api` | Future: HMRC submission layer, when ready |

---

## Git Discipline — Rules for Every Commit in This Project

These rules apply to every single commit made on `featureBranch`. They are not optional. Bad commit history makes it impossible to debug regressions, roll back a broken change, or understand what was done and why.

---

### Rule 1 — One logical change per commit. Never the whole app.

A commit is one complete, working, self-contained change. It is not a dump of everything you did in a session.

**Good commits:**
```
[MTD] Add MtdTransactions table to db/schema.ts
[MTD] Add aggregateQuarter function to db/mtdOperations.ts
[MTD] Add useMtdData hook
[MTD] Add mtdQuarterlySummary screen — Q1-Q4 tabs and income card
[NAV] Move (tabs) folder inside new (drawer) folder
[SETTINGS] Add Tax Defaults section to settings.tsx
[STYLE] Add invoice-accent colour ramp to tailwind.config.ts
```

**Bad commits — never do these:**
```
lots of changes
wip
fixed stuff
Phase 2 done
updated everything
```

If you find yourself writing "and" in a commit message ("added the form and the hook and the types"), that is two or three commits, not one.

---

### Rule 2 — Commit prefix convention

Every commit message must start with one of these prefixes:

| Prefix | Use for |
|--------|---------|
| `[MTD]` | New MTD files — types, utils, hooks, DB operations, screens |
| `[NAV]` | Navigation restructure — drawer, tabs, layout files |
| `[SETTINGS]` | Settings screen and appSettings-related changes |
| `[INVOICE]` | Changes to existing invoice/estimate screens or logic |
| `[BUDGET]` | Changes to budget/transaction screens or logic |
| `[SCHEMA]` | Changes to db/schema.ts or generated migration files |
| `[STYLE]` | Visual identity changes — Tailwind config, NativeWind classes, theme |
| `[TEST]` | New or updated test files |
| `[FIX]` | Bug fix on any module — add the module in the description |
| `[REFACTOR]` | Code reorganisation with no behaviour change |
| `[DOCS]` | README, planning docs, comments only |
| `[CHORE]` | package.json, config files, tooling, .gitignore |

---

### Rule 3 — Commit message format

```
[PREFIX] Short description in sentence case (50 chars max)

Optional body — explain WHY, not WHAT. The diff shows what
changed. The commit message explains why you made the decision.
If there is a trade-off or a non-obvious choice, explain it here.

Refs: MASTER_PLAN.md Phase 2 Step 2.5
```

The subject line (first line) must:
- Start with the prefix in square brackets
- Be in sentence case (not Title Case, not ALL CAPS)
- Be 50 characters or fewer after the prefix
- Not end with a full stop
- Describe what the commit does, not what you were doing

Examples:
```
[SCHEMA] Add MtdTransactions, MtdQuarterlySummary, MtdAnnualSummary tables

These three tables form the MTD data layer. MtdTransactions.invoiceId
is nullable FK to Invoice to power the cross-module insight without
requiring duplicate data entry. uniqueIndex on (userId, taxYear, quarter)
on MtdQuarterlySummary ensures one summary row per user per quarter.

Refs: MASTER_PLAN.md Phase 2 Step 2.5
```

```
[MTD] Add aggregateQuarter — pulls from invoices, budget, and manual records

Combines three data sources: paid Invoice rows, budget Transactions mapped
to HMRC categories via mapCategoryToHmrc(), and manual MtdTransactions.
Returns sources breakdown so the UI can show where each figure came from.
```

```
[SETTINGS] Add Tax Defaults section — rate, add/inclusive mode, live preview

taxScheme 'standard' = add tax on top. 'inclusive' = tax already in price.
Live preview card shows the effect immediately so the user can see the
difference without needing to create an invoice first.
```

---

### Rule 4 — Commit after each completed step, not after each phase

Each numbered step in this plan is one commit (sometimes two if the step has distinct parts). Do not wait until an entire phase is done before committing.

**Commit cadence by phase:**

Phase 1 (Navigation): one commit per step — 1.1 file moves, 1.2 drawer layout, 1.3 tabs layout, 1.4 charts move, 1.5 DrawerContent component, 1.6 settings screen, 1.7 info screen, 1.8 tax placeholder, 1.9 budget cleanup.

Phase 2 (Data layer): one commit per file — types/mtd.ts, utils/mtdCategories.ts, utils/mtdDates.ts, utils/mtdTaxCalc.ts, schema change, migration file, db/mtdOperations.ts.

Phase 3 (Hooks): one commit per hook.

Phase 4 (Screens): one commit per screen. If a screen is large (mtdAnnualEstimate), split it — one commit for the data/logic wiring, one for the SVG tax band bar, one for the style pass.

Phase 5 (Home integration): one commit for useHomeInsights hook, one for home.tsx restructure, one for the invoice-to-MTD linking UI.

Phase 6 (Tests): one commit per test file.

Phase 7 (Styles): one commit for tailwind.config.ts changes, one commit per module (invoice styles, MTD styles, drawer/settings styles).

---

### Rule 5 — The app must build after every commit

Before committing, run:
```bash
npx tsc --noEmit
```

If TypeScript errors exist, fix them before committing. Never commit broken code. The only exception is a `[WIP]` prefix which signals the commit is a checkpoint on an incomplete feature branch — but these should be rare and never pushed to `main`.

---

### Rule 6 — Stage specific files, never `git add .`

Always stage only the files that belong to the current commit:
```bash
git add db/schema.ts drizzle/0001_add_mtd_tables.sql
git commit -m "[SCHEMA] Add MTD tables and migration"
```

Never:
```bash
git add .
git commit -m "changes"
```

`git add .` picks up unrelated half-finished work, config changes you forgot about, and debug files you meant to delete. Stage by file or by hunk (`git add -p`) so you know exactly what is in each commit.

---

### Rule 7 — Write a comment at the top of every new file

Every new file created in this project must have a comment block at the top explaining:
- What this file does
- Why it exists as a separate file (not inline somewhere else)
- What other files depend on it or it depends on
- Any non-obvious decisions made

Example for `utils/mtdDates.ts`:
```typescript
/**
 * mtdDates.ts
 *
 * Pure utility functions for UK tax year and quarterly deadline calculations.
 * No React Native or Expo imports — fully testable in Node.
 *
 * Used by: db/mtdOperations.ts, hooks/useMtdData.ts, hooks/useMtdDeadlines.ts,
 *          app/(drawer)/(tabs)/tax.tsx, app/(stack)/mtdDeadlines.tsx
 *
 * UK tax year runs 6 April → 5 April. The four MTD quarterly deadlines are
 * fixed dates set by HMRC — they do not shift for weekends or bank holidays.
 * deadlineStatus() reads urgentDays/soonDays from appSettings so the user's
 * reminder preference overrides the hardcoded defaults.
 */
```

Example for `db/mtdOperations.ts`:
```typescript
/**
 * mtdOperations.ts
 *
 * All database operations for the three MTD tables: MtdTransactions,
 * MtdQuarterlySummary, MtdAnnualSummary.
 *
 * IMPORTANT: aggregateQuarter() pulls from THREE sources — MtdTransactions
 * (manual records), Invoice (paid invoices as turnover), and Transactions
 * (budget expenses mapped to HMRC categories). Do not remove any source
 * without updating the QuarterAggregates sources breakdown field.
 *
 * Depends on: db/config.ts (db instance), db/schema.ts (all tables),
 *             utils/mtdDates.ts, utils/mtdTaxCalc.ts, utils/mtdCategories.ts,
 *             utils/generateUuid.ts
 */
```

---

### Rule 8 — Comment non-obvious code inline

Any logic that is not immediately obvious to someone reading it cold must have an inline comment. This includes:

- The three-source aggregation in `aggregateQuarter` — comment above each query block explaining which source it is and why
- The `taxScheme` toggle logic in invoice calculations — comment explaining `'standard'` vs `'inclusive'` with an example
- The `uniqueIndex` on `MtdQuarterlySummary` — comment explaining why `userId` is included
- The `personalAllowanceUsed` snapshot on `MtdAnnualSummary` — comment explaining why it is stored rather than read from `RATES_2025_26` at query time
- Any mapping in `mapCategoryToHmrc` — comment explaining the HMRC category each budget category maps to and why

Do not comment what the code does — comment why it does it that way.

---

### Rule 9 — Pull from upstream before starting each new phase

Before starting each new phase:
```bash
git fetch upstream
git checkout main
git merge upstream/main
git checkout featureBranch
git rebase main
```

If the original `invoiceApp` has been updated while you were working, pull those changes in before adding new features on top of a stale base. Resolve conflicts early (in small batches) rather than accumulating a large divergence.

---

### Rule 10 — Tag each completed phase

After each phase is fully committed and the app builds cleanly, create a lightweight tag:
```bash
git tag phase-1-navigation
git tag phase-2-data-layer
git tag phase-3-hooks
git tag phase-4-mtd-screens
git tag phase-5-home-integration
git tag phase-6-tests
git tag phase-7-styles
```

Tags give you a clean rollback point. If Phase 5 breaks something, you can return to the exact state after Phase 4 was complete with `git checkout phase-4-mtd-screens`.

---

## Phase 1 — Navigation Restructure

**Goal:** Rebuild the navigation shell before any new screens are added. Everything else in this plan depends on the final navigation structure being in place first.

**Why first:** Adding a drawer navigator after screens are built is much harder than adding screens after the drawer is built. Get the scaffold right, then fill it in.

### Files to READ before starting Phase 1
- `app/_layout.tsx` — understand the current navigator structure in full
- `app/(tabs)/_layout.tsx` — understand how the bottom tabs are currently configured (icons, labels, order)
- `app/(stack)/(user)/userInfo.tsx` — to understand what currently lives there before moving it
- Expo Router docs on Drawer layout: `https://expo.github.io/router/docs/misc/drawer` — confirm the exact `Drawer` import path and `drawerContent` prop API for the version of `expo-router` installed (`~3.5.24`)

### Step 1.1 — Understand how Expo Router handles drawers

Expo Router v3 has a built-in `Drawer` layout. It works exactly like the `(tabs)` folder convention — you create a `(drawer)` folder and a `_layout.tsx` inside it that uses `Drawer` from `expo-router/drawer`. No new package to install. `react-native-gesture-handler` and `react-native-reanimated` are already in `package.json` and are the only peer dependencies the Expo Router drawer needs.

The drawer layout file looks like this:
```tsx
import { Drawer } from 'expo-router/drawer';

export default function DrawerLayout() {
  return (
    <Drawer drawerContent={(props) => <DrawerContent {...props} />}>
      <Drawer.Screen name="(tabs)" options={{ drawerLabel: 'Home', headerShown: false }} />
      <Drawer.Screen name="settings" options={{ drawerLabel: 'Settings' }} />
      <Drawer.Screen name="info" options={{ drawerLabel: 'Info' }} />
      <Drawer.Screen name="charts" options={{ drawerLabel: 'Charts & Analytics' }} />
    </Drawer>
  );
}
```

All existing stack screens and tab screens stay exactly where they are — the drawer wraps around the tab navigator, it does not replace it.

### Step 1.2 — Restructure the file system for drawer routing

Expo Router's file-system routing means the folder structure defines the navigator structure. The new layout after this step:

```
app/
├── (drawer)/                        ← NEW folder — root drawer navigator
│   ├── _layout.tsx                  ← NEW — Drawer layout using expo-router/drawer
│   ├── (tabs)/                      ← MOVED — entire tabs folder moves inside (drawer)
│   │   ├── _layout.tsx
│   │   ├── home.tsx
│   │   ├── invoices.tsx
│   │   ├── tax.tsx                  ← NEW tab (placeholder for now)
│   │   ├── budget.tsx
│   │   └── scanner.tsx
│   ├── settings.tsx                 ← NEW drawer screen
│   ├── info.tsx                     ← NEW drawer screen
│   └── charts.tsx                   ← MOVED from (tabs)/charts.tsx
├── (stack)/                         ← unchanged — all stack screens stay here
│   ├── createInvoice.tsx
│   ├── ...
└── _layout.tsx                      ← MODIFIED — now just the root Stack + providers
```

The key move is: the `(tabs)` folder moves inside `(drawer)`. The root `_layout.tsx` now wraps a `(drawer)` segment instead of `(tabs)` directly.

**Before moving files, update any `router.push('/charts')` or `router.push('/(tabs)/charts')` calls across the codebase to `router.push('/(drawer)/charts')`.**

After moving, all existing tab navigation still works because the relative paths within `(tabs)` are unchanged. The only paths that change are references to charts and any direct links to `(user)/` screens that now live under `(drawer)/settings`.

### Step 1.3 — Create `app/(drawer)/_layout.tsx`

This is the drawer navigator layout file. Import `Drawer` from `expo-router/drawer`. Import `DrawerContent` from `../../components/DrawerContent` (created in step 1.5). Read the existing `app/_layout.tsx` carefully to match its provider wrapping (ThemeContext, InvoiceContext, SQLite providers) — those stay in the root `_layout.tsx`, not here.

The `(drawer)/_layout.tsx` only concerns itself with declaring which screens exist in the drawer and passing the custom drawer content component. Set `headerShown: false` on the `(tabs)` screen so the tab navigator controls its own header. Set appropriate titles on Settings, Info, and Charts screens.

### Step 1.4 — Restructure `app/(drawer)/(tabs)/_layout.tsx`

Read the current `app/(tabs)/_layout.tsx` before touching it. This file only needs two changes: add the new Tax tab and remove Charts (which is now a drawer screen).

New tab order (5 tabs total):
1. **Home** — `home.tsx` — house icon
2. **Invoices** — `invoices.tsx` — document/file icon
3. **Tax** ← NEW — `tax.tsx` — calculator or percentage icon
4. **Budget** — `budget.tsx` — wallet icon
5. **Scanner** — `scanner.tsx` — camera/scan icon

Remove the Charts entry. Keep all existing icon library imports, tab bar styles, and option props exactly as they are — only add/remove entries.

### Step 1.5 — Move `charts.tsx` into the drawer

Move `app/(tabs)/charts.tsx` to `app/(drawer)/charts.tsx`. The file content does not change at all. The move is purely structural — the file-system position is what tells Expo Router which navigator owns it.

After moving, search the entire codebase for any reference to `/(tabs)/charts` or `/charts` navigating to the old tab location and update them to `/(drawer)/charts`.

### Step 1.6 — Create `components/DrawerContent.tsx`

Custom drawer content component. This is what the user sees when they swipe open the drawer.

Contains:
- App name and logo/icon at the top
- User name and email (read from `useUserData` hook if available, otherwise placeholder)
- Navigation items: Home, Settings, Info, Charts & Analytics
- Each item has an icon, label, and active/inactive state
- ThemeToggle component at the bottom of the drawer
- App version number at the very bottom (read from `expo-constants`)

Style: matches the app's visual language. Background uses the drawer surface token from ThemeContext.

### Step 1.7 — Create `app/(drawer)/settings.tsx`

The Settings screen. This consolidates everything a sole trader needs to configure in one place. All values are read from and written to the `appSettings` and `User` / `BankDetails` tables via the existing hooks. Read `db/schema.ts` `appSettings` table in full before building this screen — most fields already exist there.

Each section is a collapsible or scrollable group with an uppercase tracked section header label matching the invoice form divider style. Every editable value has an immediate save on blur (not a single save button at the bottom) so partial changes are never lost.

---

**Section 1 — Profile**

Surfaces the `User` table fields directly. All fields are inline editable (not a separate screen push):
- Full name — `User.fullName`
- Email address — `User.emailAddress`
- Address — `User.address` (multiline)
- Phone number — `User.phoneNumber`
- UTR number — `User.utrNumber` — shown with a label "Unique Taxpayer Reference" and a helper text "Required for Self Assessment and MTD". Masked by default (show/hide toggle).
- NI number — `User.ninNumber` — shown with a label "National Insurance Number". Masked by default.
- Logo — `appSettings.logoUrl` — a pressable image area. Tapping opens the device image picker (use `expo-image-picker` if available, or `expo-media-library` which is already installed). The selected image path is stored in `appSettings.logoUrl`. A small preview of the current logo is shown. This logo is read by `templates/invoiceTemplate.ts` and `templates/estimateTemplate.ts` and rendered in the PDF header.

**Section 2 — Bank Details**

Surfaces the `BankDetails` table. Inline editable:
- Bank name — `BankDetails.bankName`
- Account name — `BankDetails.accountName`
- Sort code — `BankDetails.sortCode` — formatted as XX-XX-XX on display
- Account number — `BankDetails.accountNumber` — masked by default

These details appear on invoice PDFs. A "Show on invoices" toggle controls whether they are included in the PDF footer.

**Section 3 — Tax Defaults**

The most important new section. All values stored in `appSettings`. Read these on every invoice creation so the form pre-populates correctly.

- **Default tax rate** — `appSettings.defaultVatRate real default(20)` — numeric input, accepts decimals. Label: "Default tax rate (%)". Shows common presets as quick-select pills beneath the input: 0%, 5%, 20% (tap to apply). This populates the tax rate field on every new invoice and estimate automatically.
- **Tax calculation mode** — `appSettings.taxScheme text default('standard')` — rendered as a two-option toggle. Two options:
  - **"Add on top"** (`taxScheme = 'standard'`) — the rate is added on top of the net amount. Example: net £100 + 20% = total £120. This is how most VAT-registered sole traders invoice.
  - **"Inclusive"** (`taxScheme = 'inclusive'`) — the rate is already included in the quoted price. Example: total £120 inclusive of 20% = net £100 + tax £20. For traders who quote all-inclusive prices.
  - Below the toggle, show a live preview card: "Invoice for £100.00 → Tax £20.00 → Total £120.00" (or the inclusive equivalent). This updates as the user changes the rate or mode so they can see the effect immediately.
- **Apply tax by default** — `appSettings.quarterlyTaxEnabled` is already used for MTD. Add a separate `applyTaxByDefault integer (boolean) default(true)` column (new column — see schema note below). This toggle controls whether the tax rate is applied to new invoices automatically. If off, tax defaults to zero and the user manually adds it per invoice.
- **Default payment terms** — `appSettings.defaultPaymentTerms integer default(30)` — a numeric stepper or input (days). Common values shown as quick-select pills: 7, 14, 30, 60. This pre-fills the due date on every new invoice as `invoiceDate + defaultPaymentTerms days`.
- **Default notes / payment terms text** — `appSettings.defaultNotes text` (new column — see schema note below). A multiline text input. Whatever is typed here appears pre-filled in the Notes field of every new invoice and estimate. Typically used for payment terms language e.g. "Payment due within 30 days. Bank transfer preferred. Late payments subject to statutory interest."

**Section 4 — Invoice & Estimate Numbering**

Controls auto-incrementing reference numbers so every document has a unique identifier:
- **Invoice prefix** — `appSettings.invoicePrefix text default('INV')` — short text input, max 6 characters. Examples: INV, SI, 2025-.
- **Next invoice number** — `appSettings.nextInvoiceNumber integer default(1)` — numeric input. The next invoice created will use `{prefix}-{nextInvoiceNumber}` padded to at least 3 digits (e.g. INV-001). After each invoice is created this increments automatically.
- **Estimate prefix** — `appSettings.estimatePrefix text default('EST')` — same pattern.
- **Next estimate number** — `appSettings.nextEstimateNumber integer default(1)` — same pattern.
- Show a preview beneath: "Your next invoice will be numbered: **INV-001**" (updates live as prefix/number changes).

**Section 5 — MTD & Tax**

Controls MTD behaviour. All values already in `appSettings`:
- **MTD enrolled** — `appSettings.quarterlyTaxEnabled boolean default(true)` — master toggle. When off, the Tax tab shows an "enrol in MTD" state instead of the full hub. Label: "I need to submit MTD quarterly updates". Helper text: "Required if your qualifying income is over £50,000 from April 2026."
- **Auto-calculate quarters** — `appSettings.autoCalculateQuarters boolean default(true)` — when on, the Tax tab calls `refreshCurrentYear()` automatically on every mount, keeping totals fresh without the user manually tapping a refresh button. When off, the user refreshes manually.
- **MTD deadline reminder threshold** — `appSettings.quarterlyTaxReminderDays integer default(7)` — a slider or stepper (1–30 days). Controls when a deadline changes from `'soon'` to `'urgent'` status in `deadlineStatus()`. Currently hardcoded at 14 days in `utils/mtdDates.ts` — this setting overrides it. The `deadlineStatus` function should read this value from `appSettings` rather than using a constant. Label: "Warn me _ days before a deadline".
- **Tax category** — `appSettings.defaultTaxCategory text default('self-employed')` — a picker with options: "Self-employed (sole trader)", "Property income", "Both". Affects which HMRC categories are offered in `addMtdTransaction.tsx`.

**Section 6 — Appearance**

- **Theme** — `appSettings.theme text default('system')` — three-option toggle: Light / Dark / System. Replaces the standalone `ThemeToggle` component. Updates `ThemeContext` immediately on change.
- **Currency** — `appSettings.currency text default('GBP')` — a picker. Common options: GBP, EUR, USD, PLN. Selected currency is used as the default on all new invoices, estimates, and MTD records.
- **Date format** — `appSettings.dateFormat text default('DD/MM/YYYY')` — picker: DD/MM/YYYY (UK default), MM/DD/YYYY, YYYY-MM-DD. Affects how dates are displayed across all screens.
- **Number format** — `appSettings.numberFormat text default('en-GB')` — picker: en-GB (1,234.56), en-US (1,234.56), de-DE (1.234,56). Affects how currency amounts are formatted via `formatGBP`.

**Section 7 — Reminders**

- **Invoice payment reminders** — `appSettings.reminderEmailEnabled boolean default(true)` — toggle. When on, overdue invoices show a "Send reminder" badge more prominently. Does not send automatically — it prompts the user to send.
- **Remind me _ days before due** — `appSettings.reminderDaysBeforeDue integer default(3)` — stepper. An invoice is flagged as "approaching due" this many days before its due date.

**Section 8 — About**

- App name and version — read from `expo-constants`
- Build number
- Link: "GOV.UK — Making Tax Digital" — `[Linking.openURL](https://www.gov.uk/government/collections/making-tax-digital-for-income-tax)`
- Link: "GOV.UK — Self Assessment" — `[Linking.openURL](https://www.gov.uk/government/collections/self-assessment-detailed-information)`
- Link: "Report a bug / give feedback" — `[Linking.openURL](https://github.com/MarekKabala1/Invoice2Mtd/issues)` to your GitHub issues page

---

**Schema additions required for this step:**

Two new columns must be added to `appSettings` in `db/schema.ts` before implementing this screen:

```typescript
applyTaxByDefault: integer('apply_tax_by_default', { mode: 'boolean' }).default(true),
defaultNotes: text('default_notes'),
```

Add these to the `appSettings` table definition in `db/schema.ts` and run `npx drizzle-kit generate` to produce a migration. These two columns are the only schema changes needed for Settings — everything else already exists in `appSettings`.

**How createInvoice.tsx must change after Settings is built:**

Once Settings is implemented, `createInvoice.tsx` and `createEstimate.tsx` must read from `appSettings` on mount to pre-populate:
- Tax rate field ← `appSettings.defaultVatRate`
- Tax mode (add/inclusive) ← `appSettings.taxScheme`
- Tax applied toggle ← `appSettings.applyTaxByDefault`
- Due date ← `invoice date + appSettings.defaultPaymentTerms days`
- Notes field ← `appSettings.defaultNotes`
- Invoice number ← `appSettings.invoicePrefix + '-' + padded(appSettings.nextInvoiceNumber)`

After an invoice is successfully created, increment `appSettings.nextInvoiceNumber` by 1. After an estimate is created, increment `appSettings.nextEstimateNumber` by 1.

The existing `(user)/userInfo.tsx`, `(user)/bankDetailsForm.tsx`, and `(user)/userInfoForm.tsx` screens remain as they are — they are no longer the primary entry point but can still be navigated to from elsewhere in the app.

### Step 1.8 — Create `app/(drawer)/info.tsx`

The Info screen. Reference content that users consult occasionally, not daily-use functionality.

Sections:
- **MTD for Income Tax — Overview** — what MTD is, who it applies to, key dates
- **Income thresholds** — table: £50k from Apr 2026, £30k from Apr 2027, £20k from Apr 2028
- **Quarter reference** — the four quarterly periods and their deadlines in a clear table
- **2025-26 Tax Rates** — personal allowance, basic/higher/additional rate bands, Class 2/4 NI rates. Pulled from `RATES_2025_26` in `utils/mtdTaxCalc.ts` so it is always current.
- **Useful links** — GOV.UK MTD guidance, Self Assessment, HMRC app — each opens via `Linking.openURL`
- **Invoicing tips** — brief guidance on what a valid UK invoice must contain (invoice number, date, your address, client address, itemised amounts, VAT number if applicable)

This screen is read-only. No forms. No DB calls.

### Step 1.9 — Create `app/(drawer)/(tabs)/tax.tsx` as a placeholder

The new Tax tab — the MTD hub screen. This replaces what was previously planned as the `MtdDashboardWidget` embedded in `home.tsx`. MTD now has its own full tab rather than a home screen card.

Content:
- **Header** — "Tax" title, current tax year badge, current quarter label
- **Quick stats row** — net profit this quarter, estimated quarterly tax to set aside. Read from `useMtdData`.
- **Deadline card** — next upcoming deadline with urgency colour, days remaining. From `useMtdDeadlines`.
- **Quick action buttons** — "Add Record", "View Quarter", "Annual Estimate", "All Deadlines" — each navigates to the relevant stack screen.
- **Current quarter mini-summary** — top 3 expense categories by value for the current quarter. A teaser that entices the user to tap into the full quarterly summary.

This screen is the entry point into all MTD functionality. It owns the MTD accent colour identity.

### Step 1.10 — Update `app/(drawer)/(tabs)/budget.tsx`

Remove the MTD navigation link that was planned for budget.tsx (from the previous plan). The Tax tab replaces that entry point. The budget tab reverts to being purely about income/expense transactions without MTD promotion.

---

## Phase 2 — MTD Types, Utilities, and Database

**Goal:** Build all the data infrastructure for MTD. No screens yet — just the types, utilities, queries, and migration that everything else depends on.

This phase is identical in intent to Steps 1–8 from `MTD_PLANNING_v2.md` but adjusted for the new navigation structure and the understanding that MTD has its own tab.

### Files to READ before starting Phase 2
- `db/config.ts`, `db/queries.ts`, `db/invoiceOperations.ts`, `db/zodSchema.ts`, `db/schema.ts`
- `utils/categories.ts`, `utils/generateUuid.ts`, `utils/transactionCalculation.ts`
- `types/index.ts`

### Step 2.1 — Create `types/mtd.ts`

New file. Export all MTD TypeScript types. Do not modify `types/index.ts`.

Types to export:
- `ExpenseCategory` — union of 12 HMRC category string literals: `'turnover' | 'costOfGoodsAllowable' | 'employeeCosts' | 'premisesRunningCosts' | 'maintenanceCosts' | 'advertisingCosts' | 'businessEntertainmentCosts' | 'interestOnBankLoans' | 'professionalFees' | 'depreciation' | 'otherAllowableExpenses' | 'otherDisallowableExpenses'`
- `EXPENSE_CATEGORIES` — readonly const array of all 12 values
- `ALLOWABLE_CATEGORIES` — readonly const array of the 10 allowable ones (excludes `businessEntertainmentCosts` and `otherDisallowableExpenses`)
- `TaxQuarter` — `{ quarter: 1|2|3|4; taxYear: string; periodStart: string; periodEnd: string; submissionDeadline: string; label: string }`
- `TaxYear` — `{ label: string; start: string; end: string; finalDeclarationDeadline: string; quarters: TaxQuarter[] }`
- `DeadlineStatus` — `'overdue' | 'urgent' | 'soon' | 'ok'`
- `DeadlineItem` — `{ type: 'quarterly'|'final_declaration'; label: string; deadline: string; deadlineFormatted: string; daysUntil: number; status: DeadlineStatus; taxYear: string; quarter?: 1|2|3|4 }`
- `TaxRates` — all HMRC rate fields as numbers
- `TaxEstimate` — full calculation output including all tax/NI breakdowns
- `QuarterAggregates` — one number field per `ExpenseCategory` plus `totalAllowableExpenses` and `netProfit`
- `NewMtdTransaction` — `{ date: string; description: string; amount: number; type: 'income'|'expense'; category: ExpenseCategory; receiptRef?: string; notes?: string }`
- `MtdTransactionStatus` — `'not_started' | 'in_progress' | 'ready' | 'submitted'`
- `MtdAnnualStatus` — `'in_progress' | 'ready' | 'filed'`

### Step 2.2 — Create `utils/mtdCategories.ts`

Follows `utils/categories.ts` pattern. Export:
- `EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string>` — human-readable HMRC labels
- `isAllowable(category: ExpenseCategory): boolean`
- `INCOME_CATEGORIES: ExpenseCategory[]` — `['turnover']`
- `EXPENSE_ONLY_CATEGORIES: ExpenseCategory[]` — the 11 non-income categories
- Deadline urgency style maps: `STATUS_DEADLINE_COLOR`, `STATUS_DEADLINE_DOT`, `STATUS_DEADLINE_BADGE_BG`, `STATUS_DEADLINE_BORDER`, `STATUS_DEADLINE_LABEL` — all `Record<DeadlineStatus, string>` mapping to NativeWind classes. Check `utils/theme.ts` first — use semantic tokens if defined there rather than raw colour classes.

### Step 2.3 — Create `utils/mtdDates.ts`

Pure TypeScript, no React Native. Uses `date-fns` v4. Export:
- `toISO(date: Date): string` — `format(date, 'yyyy-MM-dd')`
- `fromISO(s: string): Date` — `parseISO(s)`
- `taxYearForDate(date: Date): number` — before 6 April = `year - 1`, on/after = `year`
- `taxYearLabel(startYear: number): string` — e.g. `'2025-26'`
- `currentTaxYearStart(): number`
- `quartersForTaxYear(startYear: number): TaxQuarter[]` — Q1: 6Apr–5Jul/7Aug, Q2: 6Jul–5Oct/7Nov, Q3: 6Oct–5Jan+1/7Feb+1, Q4: 6Jan+1–5Apr+1/7May+1. All ISO strings.
- `buildTaxYear(startYear: number): TaxYear` — `finalDeclarationDeadline = ${startYear+2}-01-31`
- `currentTaxYear(): TaxYear`
- `quarterForDate(date: Date): TaxQuarter`
- `daysUntil(isoDeadline: string): number` — `differenceInCalendarDays`, negative if past
- `deadlineStatus(isoDeadline: string): DeadlineStatus` — `<0 = overdue`, `≤14 = urgent`, `≤30 = soon`, else `ok`
- `formatDeadline(isoDeadline: string): string` — `'7 August 2025'`
- `upcomingDeadlines(lookAheadYears?: number): DeadlineItem[]` — all deadlines for next N years, filtered `daysUntil > -90`, sorted asc

### Step 2.4 — Create `utils/mtdTaxCalc.ts`

Pure TypeScript. Comment at top: `// ESTIMATES ONLY — not official HMRC calculations. Update RATES_2025_26 each April.` Check `utils/getCurrencySymbol.ts` first — reuse any existing GBP formatter. Export:
- `RATES_2025_26: TaxRates` — `personalAllowance: 12570`, `basicRateThreshold: 50270`, `higherRateThreshold: 125140`, `basicRate: 0.20`, `higherRate: 0.40`, `additionalRate: 0.45`, `ni4LowerProfitsLimit: 12570`, `ni4UpperProfitsLimit: 50270`, `ni4LowerRate: 0.06`, `ni4UpperRate: 0.02`, `ni2WeeklyRate: 3.45`, `ni2SmallEarningsException: 12570`
- `estimateTax(grossIncome, totalAllowableExpenses, rates?): TaxEstimate`
- `projectFullYearTax(currentQuarter: 1|2|3|4, incomeToDate, expensesToDate, rates?): TaxEstimate` — multiplies by `4/currentQuarter`
- `formatGBP(amount: number): string`
- `formatPercent(rate: number): string`

### Step 2.5 — Extend `db/schema.ts`

Append the three MTD tables to the end of the existing file. Do not touch any existing table. The import line at the top already has `sql`, `sqliteTable`, `text`, `integer`, and `real` — nothing new to add.

The complete file after the change should look exactly like this:

```typescript
import { sql } from 'drizzle-orm';
import { sqliteTable, text, integer, real, uniqueIndex } from 'drizzle-orm/sqlite-core';

// ─── EXISTING TABLES (do not modify) ─────────────────────────────────────────

export const User = sqliteTable('User', {
  id: text('id').primaryKey(),
  fullName: text('full_name'),
  address: text('address'),
  emailAddress: text('email_address').unique(),
  phoneNumber: text('phone_number'),
  utrNumber: text('UTR_number'),
  ninNumber: text('NIN_number'),
  createdAt: text('timestamp').default(sql`(current_timestamp)`),
  isAdmin: integer('is_admin', { mode: 'boolean' }).default(false),
});

export const BankDetails = sqliteTable('Bank_Details', {
  id: text('Id').primaryKey(),
  userId: text('user_id').references(() => User.id),
  accountName: text('Account_Name'),
  sortCode: text('Sort_Code'),
  accountNumber: text('Account_Number'),
  bankName: text('Bank_Name'),
  createdAt: text('timestamp').default(sql`(current_timestamp)`),
});

export const Customer = sqliteTable('Customer', {
  id: text('id').primaryKey(),
  name: text('name'),
  address: text('address'),
  emailAddress: text('email_address').unique(),
  phoneNumber: text('phone_number'),
  createdAt: text('timestamp').default(sql`(current_timestamp)`),
});

export const WorkInformation = sqliteTable('Work_Information', {
  id: text('id').primaryKey(),
  invoiceId: text('invoice_id').references(() => Invoice.id),
  descriptionOfWork: text('description_of_work'),
  unitPrice: real('unit_price'),
  date: text('day_of_week'),
  totalToPayMinusTax: real('total_to_pay_minus_tax'),
  createdAt: text('timestamp').default(sql`(current_timestamp)`),
});

export const Invoice = sqliteTable('Invoice', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => User.id),
  customerId: text('customer_id').references(() => Customer.id),
  invoiceDate: text('invoice_date'),
  dueDate: text('due_date'),
  amountAfterTax: real('amount_after_tax'),
  amountBeforeTax: real('amount_before_tax'),
  taxRate: real('tax_rate'),
  pdfPath: text('pdf_path'),
  currency: text('currency').default('GBP'),
  createdAt: text('timestamp').default(sql`(current_timestamp)`),
  taxValue: integer('taxValue', { mode: 'boolean' }).default(false),
  isPayed: integer('is_payed', { mode: 'boolean' }).default(false),
  discount: real('discount'),
});

export const Estimate = sqliteTable('Estimate', {
  id: text('id').primaryKey(),
  customerId: text('customer_id').references(() => Customer.id),
  userId: text('user_id').references(() => User.id),
  estimateDate: text('estimate_date'),
  estimateEndTime: text('estimate_end_time'),
  currency: text('currency').default('GBP'),
  discount: real('discount'),
  taxRate: real('tax_rate'),
  amountBeforeTax: real('amount_before_tax'),
  amountAfterTax: real('amount_after_tax'),
  taxValue: integer('taxValue', { mode: 'boolean' }).default(false),
  isAccepted: integer('is_accepted', { mode: 'boolean' }).default(false),
});

export const Payment = sqliteTable('Payments', {
  id: text('id').primaryKey(),
  invoiceId: text('invoice_id').references(() => Invoice.id),
  paymentDate: text('payment_date'),
  amountPaid: real('amount_paid'),
  createdAt: text('timestamp').default(sql`(current_timestamp)`),
});

export const Note = sqliteTable('Notes', {
  id: text('id').primaryKey(),
  invoiceId: text('invoice_id').references(() => Invoice.id),
  noteDate: text('note_date'),
  noteText: text('note_text'),
  createdAt: text('timestamp').default(sql`(current_timestamp)`),
});

export const EstimateNotes = sqliteTable('Estimate_Notes', {
  id: text('id').primaryKey(),
  estimateId: text('estimate_id').references(() => Estimate.id),
  noteDate: text('note_date'),
  noteText: text('note_text'),
  createdAt: text('timestamp').default(sql`(current_timestamp)`),
});

export const EstimateTerms = sqliteTable('Estimate_Terms', {
  id: text('id').primaryKey(),
  estimateId: text('estimate_id').references(() => Estimate.id),
  termText: text('term_text'),
  createdAt: text('timestamp').default(sql`(current_timestamp)`),
});

export const Categories = sqliteTable('Categories', {
  id: text('id').primaryKey(),
  name: text('name'),
  type: text('type'),
});

export const Transactions = sqliteTable('Transactions', {
  id: text('id').primaryKey(),
  userId: text('user_id'),
  categoryId: text('category_id'),
  amount: real('amount'),
  date: text('date'),
  createdAt: text('timestamp').default(sql`(current_timestamp)`),
  currency: text('currency').default('GBP'),
  description: text('description').default(''),
  type: text('type'),
});

export const appSettings = sqliteTable('app_settings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id').references(() => User.id),
  defaultPaymentTerms: integer('default_payment_terms').default(30),
  defaultVatRate: real('default_vat_rate').default(20),
  invoicePrefix: text('invoice_prefix').default('INV'),
  nextInvoiceNumber: integer('next_invoice_number').default(1),
  estimatePrefix: text('estimate_prefix').default('EST'),
  nextEstimateNumber: integer('next_estimate_number').default(1),
  currency: text('currency').default('GBP'),
  dateFormat: text('date_format').default('DD/MM/YYYY'),
  numberFormat: text('number_format').default('en-GB'),
  autoCalculateQuarters: integer('auto_calculate_quarters', { mode: 'boolean' }).default(true),
  quarterlyTaxEnabled: integer('quarterly_tax_enabled', { mode: 'boolean' }).default(true),
  quarterStartMonths: text('quarter_start_months').default('1,4,7,10'),
  quarterlyTaxReminderDays: integer('quarterly_tax_reminder_days').default(7),
  financialYearStartMonth: integer('financial_year_start_month').default(1),
  financialYearStartDay: integer('financial_year_start_day').default(1),
  financialYearEndMonth: integer('financial_year_end_month').default(12),
  financialYearEndDay: integer('financial_year_end_day').default(31),
  taxScheme: text('tax_scheme').default('standard'),       // 'standard' = add on top | 'inclusive' = already included
  defaultTaxCategory: text('default_tax_category').default('self-employed'),
  reminderEmailEnabled: integer('reminder_email_enabled', { mode: 'boolean' }).default(true),
  reminderDaysBeforeDue: integer('reminder_days_before_due').default(3),
  language: text('language').default('en-GB'),
  theme: text('theme').default('system'),                  // 'light' | 'dark' | 'system'
  logoUrl: text('logo_url'),
  // ── NEW columns added for Settings screen ─────────────────────────────────
  applyTaxByDefault: integer('apply_tax_by_default', { mode: 'boolean' }).default(true),
  defaultNotes: text('default_notes'),
  // ──────────────────────────────────────────────────────────────────────────
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

// ─── MTD TABLES (NEW — append only, do not modify anything above) ─────────────
//
// Notes on design decisions:
//
// MtdTransactions.userId references User.id — every MTD record belongs to the
// logged-in user, consistent with Invoice and Transactions tables.
//
// MtdTransactions.invoiceId is nullable — allows optionally linking an MTD
// income record directly to an Invoice row. This powers the cross-module
// "invoices not yet in MTD records" insight on the home screen.
//
// MtdTransactions.transactionId is nullable — allows optionally linking an MTD
// expense record to an existing Transactions row so the same payment is not
// double-counted across the budget tracker and MTD records.
//
// MtdQuarterlySummary has a uniqueIndex on (tax_year, quarter) — only one
// summary row per quarter per tax year. Upsert pattern in mtdOperations.ts.
//
// appSettings already has quarterlyTaxEnabled, quarterStartMonths,
// quarterlyTaxReminderDays, financialYearStart/End columns — these are reused
// by the MTD layer rather than duplicated. The MTD module reads these values
// from appSettings to respect the user's existing preferences.

export const MtdTransactions = sqliteTable('Mtd_Transactions', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => User.id),
  // Optional link to an Invoice row — powers the "not yet in MTD" home insight
  invoiceId: text('invoice_id').references(() => Invoice.id),
  // Optional link to a Transactions row — avoids double-counting budget entries
  transactionId: text('transaction_id').references(() => Transactions.id),
  date: text('date').notNull(),                    // ISO 'YYYY-MM-DD'
  description: text('description').notNull(),
  amount: real('amount').notNull(),                // always positive
  type: text('type').notNull(),                    // 'income' | 'expense'
  // HMRC API field names — exact strings used in the Self-Employment Business API
  category: text('category').notNull(),            // see ExpenseCategory in types/mtd.ts
  taxYear: text('tax_year').notNull(),             // e.g. '2025-26'
  quarter: integer('quarter').notNull(),           // 1 | 2 | 3 | 4
  currency: text('currency').default('GBP'),       // matches Invoice + Transactions convention
  receiptRef: text('receipt_ref'),                 // optional photo/doc reference
  notes: text('notes'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const MtdQuarterlySummary = sqliteTable(
  'Mtd_Quarterly_Summary',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').references(() => User.id),
    taxYear: text('tax_year').notNull(),           // '2025-26'
    quarter: integer('quarter').notNull(),         // 1 | 2 | 3 | 4
    periodStart: text('period_start').notNull(),   // 'YYYY-MM-DD'
    periodEnd: text('period_end').notNull(),
    submissionDeadline: text('submission_deadline').notNull(),

    // Income
    totalTurnover: real('total_turnover').notNull().default(0),

    // Allowable expense categories (HMRC Self-Employment Business API field names)
    costOfGoodsAllowable: real('cost_of_goods_allowable').notNull().default(0),
    employeeCosts: real('employee_costs').notNull().default(0),
    premisesRunningCosts: real('premises_running_costs').notNull().default(0),
    maintenanceCosts: real('maintenance_costs').notNull().default(0),
    advertisingCosts: real('advertising_costs').notNull().default(0),
    interestOnBankLoans: real('interest_on_bank_loans').notNull().default(0),
    professionalFees: real('professional_fees').notNull().default(0),
    depreciation: real('depreciation').notNull().default(0),
    otherAllowableExpenses: real('other_allowable_expenses').notNull().default(0),

    // Disallowable expenses — tracked but not deducted from taxable profit
    businessEntertainmentCosts: real('business_entertainment_costs').notNull().default(0),
    otherDisallowableExpenses: real('other_disallowable_expenses').notNull().default(0),

    // Derived totals — recalculated by refreshQuarterlySummary()
    totalAllowableExpenses: real('total_allowable_expenses').notNull().default(0),
    netProfit: real('net_profit').notNull().default(0),

    // 'not_started' | 'in_progress' | 'ready' | 'submitted'
    status: text('status').notNull().default('not_started'),
    lastCalculatedAt: text('last_calculated_at'),
    updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    // Only one summary row per user per quarter per tax year
    taxYearQuarterIdx: uniqueIndex('mtd_qs_year_quarter_idx').on(
      table.userId,
      table.taxYear,
      table.quarter,
    ),
  }),
);

export const MtdAnnualSummary = sqliteTable('Mtd_Annual_Summary', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => User.id),
  taxYear: text('tax_year').notNull(),             // '2025-26'
  finalDeclarationDeadline: text('final_declaration_deadline').notNull(), // '2027-01-31'

  // Full-year income and expense totals (sum of all 4 quarters)
  totalTurnover: real('total_turnover').notNull().default(0),
  totalAllowableExpenses: real('total_allowable_expenses').notNull().default(0),
  netProfit: real('net_profit').notNull().default(0),

  // Tax estimate fields — calculated by estimateTax() in utils/mtdTaxCalc.ts
  // ESTIMATES ONLY — not official HMRC figures
  estimatedTaxableProfit: real('estimated_taxable_profit').notNull().default(0),
  estimatedIncomeTax: real('estimated_income_tax').notNull().default(0),
  estimatedNI: real('estimated_ni').notNull().default(0),
  estimatedTotalTax: real('estimated_total_tax').notNull().default(0),

  // Snapshot of the personal allowance used for this estimate
  // Stored so historical estimates remain accurate if rates change
  personalAllowanceUsed: real('personal_allowance_used').notNull().default(12570),

  // 'in_progress' | 'ready' | 'filed'
  status: text('status').notNull().default('in_progress'),

  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});
```

**Key decisions in the schema design:**

`MtdTransactions.invoiceId` — nullable foreign key to `Invoice.id`. When a user creates an invoice and then records that income in MTD, they can link the two rows. This is what powers the home screen cross-module insight: "You have £1,240 in invoices not yet in your MTD records." Any `Invoice` row with no matching `MtdTransactions.invoiceId` is "unrecorded" turnover.

`MtdTransactions.transactionId` — nullable foreign key to `Transactions.id`. Prevents a budget transaction and an MTD transaction from representing the same payment twice when the user uses both trackers.

`MtdTransactions.currency` — matches the `currency` convention on `Invoice` and `Transactions`. Defaults to `'GBP'` but stored so multi-currency is possible later.

`appSettings` already has `quarterlyTaxEnabled`, `quarterStartMonths`, `quarterlyTaxReminderDays`, `financialYearStart*`, and `defaultTaxCategory` columns. The MTD module **reads these directly** from `appSettings` rather than creating duplicate settings. The `quarterlyTaxEnabled` flag controls whether the Tax tab shows MTD content or a "not enrolled" state.

`MtdQuarterlySummary` has a `uniqueIndex` on `(userId, taxYear, quarter)` — not just `(taxYear, quarter)` — because in a future multi-user scenario each user has their own summaries. Consistent with how `Invoice` and `Transactions` both carry `userId`.

`personalAllowanceUsed` is stored as a snapshot on `MtdAnnualSummary` so that if the personal allowance changes (it does occasionally), historical tax estimates stored in the DB remain accurate as they were calculated at the time.

### Step 2.6 — Generate migration

Run `npx drizzle-kit generate`. Commit the generated SQL file. The app's existing `drizzle/migrations.js` runner applies it automatically on next launch.

### Step 2.7 — Create `db/mtdOperations.ts`

Follows `db/invoiceOperations.ts` and `db/queries.ts` pattern. Import `db` from `db/config.ts`. Export:
- `addMtdTransaction(tx: NewMtdTransaction): Promise<void>` — auto-tags tax year + quarter
- `getMtdTransactions(taxYear: string, quarter?: number): Promise<row[]>`
- `deleteMtdTransaction(id: string): Promise<void>`
- `aggregateQuarter(taxYear: string, quarter: 1|2|3|4): Promise<QuarterAggregates>`
- `refreshQuarterlySummary(taxYear: string, quarter: 1|2|3|4): Promise<void>`
- `getQuarterlySummaries(taxYear: string): Promise<row[]>`
- `refreshAnnualSummary(taxYear: string): Promise<void>`
- `getAnnualSummary(taxYear: string): Promise<row | null>`
- `refreshCurrentYear(): Promise<void>`

---

## Phase 3 — MTD Hooks

**Goal:** Build the hook layer for MTD. Follows `hooks/useBudgetData.ts` and `hooks/useTransaction.ts` patterns exactly.

### Files to READ before starting Phase 3
- `hooks/useBudgetData.ts` — data-fetching pattern
- `hooks/useTransaction.ts` — mutation/action pattern

### Step 3.1 — Create `hooks/useMtdTransaction.ts`

Follows `useTransaction.ts`. Returns `{ addTransaction, deleteTransaction, isLoading, error }`. Calls `addMtdTransaction` / `deleteMtdTransaction` then `refreshCurrentYear`. Manages loading/error state.

### Step 3.2 — Create `hooks/useMtdData.ts`

Follows `useBudgetData.ts`. Accepts `{ taxYear: string; quarter: 1|2|3|4 }`. Returns `{ aggregates, annualSummary, isLoading, error, refresh }`. Calls `aggregateQuarter` and `getAnnualSummary` on mount and input change.

### Step 3.3 — Create `hooks/useMtdDeadlines.ts`

No DB calls — pure computation. Accepts `lookAheadYears?: number`. Returns `{ deadlines, overdue, urgent, upcoming, nextDeadline }`. Uses `useMemo`.

---

## Phase 4 — MTD Screens

**Goal:** Build the four MTD stack screens and the Tax tab screen.

### Files to READ before starting Phase 4
- `context/ThemeContext.tsx` and `utils/theme.ts` — theme consumption
- `app/(stack)/addTransaction.tsx` — form pattern to match
- `app/(tabs)/charts.tsx` — data display pattern to match
- `app/(tabs)/budget.tsx` — tab screen layout pattern

### Step 4.1 — Create `app/(stack)/addMtdTransaction.tsx`

Form screen using `useMtdTransaction` hook. `react-hook-form` + `zod`. Fields:
- Income / Expense toggle — bold visual state (see styles phase for specifics)
- Date — `@react-native-community/datetimepicker`, display `DD/MM/YYYY`, store `YYYY-MM-DD`, show quarter helper below: "This falls in Q{n} — {label}"
- Amount — positive number, decimal keyboard
- Description — required text
- Category — `@react-native-picker/picker` with allowable/disallowable section dividers. Income: only `turnover`. Expense: 11 categories.
- Notes — optional multiline
- Receipt ref — optional

On success: alert "Saved to Q{n} {taxYear}", `router.back()`.

### Step 4.2 — Create `app/(stack)/mtdDeadlines.tsx`

Uses `useMtdDeadlines()`. Three sections: Overdue / Due within 14 days / Upcoming. Deadline cards with urgency styling. GOV.UK link at bottom. No DB calls.

### Step 4.3 — Create `app/(stack)/mtdQuarterlySummary.tsx`

Uses `useMtdData`. Horizontal Q1–Q4 tabs. Period info card. Income card, Allowable Expenses card (per-category rows, dim zeros), Disallowable card (with note). Net profit row. Quarterly tax estimate card using `estimateTax`. Header button to `addMtdTransaction`.

### Step 4.4 — Create `app/(stack)/mtdAnnualEstimate.tsx`

Aggregates all 4 quarters. 0 quarters = empty state. 1–3 = `projectFullYearTax` + amber projection banner. 4 = `estimateTax`. Sections: Income & Profit card, SVG tax band bar (personal allowance/basic/higher segments), Income Tax card, NI card, Summary card (full-bleed accent background, large total figure), Key dates table, Disclaimer card with GOV.UK link.

### Step 4.5 — Create `app/(tabs)/tax.tsx`

The new Tax tab screen. This is the MTD hub. Uses `useMtdData` and `useMtdDeadlines`. Content:
- Section header with current tax year and quarter
- Quick stats: net profit this quarter + estimated quarterly tax
- Next deadline card with urgency colour
- Four navigation tiles: "Add Record", "Quarter Detail", "Annual Estimate", "All Deadlines"
- Mini expense breakdown: top 3 categories by spend this quarter, shown as a small horizontal bar list

MTD accent colour applied throughout this screen.

### Step 4.6 — Register all new screens in `app/_layout.tsx`

Add to the stack navigator inside the drawer structure:
- `(stack)/addMtdTransaction` — title `'Add MTD Record'`
- `(stack)/mtdDeadlines` — title `'MTD Deadlines'`
- `(stack)/mtdQuarterlySummary` — title `'Quarterly Summary'`
- `(stack)/mtdAnnualEstimate` — title `'Annual Tax Estimate'`

---

## Phase 5 — Home Tab Integration & Cross-Module Linking

**Goal:** Make the Home tab reflect the unified app — invoicing and MTD data shown together, with cross-module insights that connect the two.

### Files to READ before starting Phase 5
- `app/(tabs)/home.tsx` — full current content
- `hooks/useInvoiceData.ts` — to understand what invoice data is available
- `hooks/useBudgetData.ts` — to understand what budget data is available

### Step 5.1 — Create `hooks/useHomeInsights.ts`

New hook that computes cross-module insights by combining invoice and MTD data. Returns:
- `unpaidInvoicesTotal: number` — sum of all unpaid invoice amounts
- `unpaidInvoicesCount: number`
- `currentQuarterTurnover: number` — from `aggregateQuarter`
- `turnoverNotYetRecorded: number` — difference between invoice turnover and MTD turnover (if invoices are not being manually added to MTD records, this gap is visible)
- `nextDeadline: DeadlineItem` — the next MTD deadline
- `recentActivity: ActivityItem[]` — last 5 actions across both modules (invoices created/sent + MTD transactions added), sorted by date

### Step 5.2 — Update `app/(tabs)/home.tsx`

Restructure the home screen around the unified insight. Replace the current layout with:

**Today at a glance** — two side-by-side tiles: "Unpaid invoices" (count + total amount) and "Q{n} net profit" (from MTD). These two numbers together tell the sole trader the most important things about their business right now.

**Cross-module insight banner** — only shows if `turnoverNotYetRecorded > 0`. Text: "You have £{amount} in invoices not yet in your MTD records — add them before {nextDeadline.deadlineFormatted}". Tapping navigates to `addMtdTransaction`. This is the key integration feature — it bridges the invoicing and tax sides of the app.

**Next deadline row** — compact next MTD deadline with urgency colour. Taps to `mtdDeadlines`.

**Recent activity feed** — from `useHomeInsights.recentActivity`. Each item shows the module it came from (invoice icon or tax icon), the description, amount, and date.

**Quick actions row** — "New Invoice", "Add MTD Record", "New Estimate" — the three most common actions in the app, accessible from one tap on the home screen.

---

## Phase 6 — Tests

**Goal:** Unit and hook tests for all new MTD utilities and hooks.

### Files to READ before starting Phase 6
- All existing files in `__tests__/` — match structure, imports, mocking pattern
- `jest.config.js` or `jest` key in `package.json` — confirm preset and setup files

### Step 6.1 — Create `__tests__/utils/mtdDates.test.ts`

Tests:
- `taxYearForDate`: test 5 April (before), 6 April (on), 7 April (after), January
- `quartersForTaxYear(2025)`: verify all 4 quarter dates and deadlines
- `quarterForDate`: one date per quarter across boundaries
- `daysUntil`: yesterday (-1), today (0), tomorrow (1)
- `deadlineStatus`: boundary of each status — -1 (overdue), 0 (urgent), 14 (urgent), 15 (soon), 30 (soon), 31 (ok)
- `upcomingDeadlines(2)`: returns ≥8 items, sorted asc, no item older than 90 days
- `buildTaxYear(2025)`: `finalDeclarationDeadline === '2027-01-31'`

### Step 6.2 — Create `__tests__/utils/mtdTaxCalc.test.ts`

Tests:
- `estimateTax(0, 0)`: all zeros
- `estimateTax(10000, 0)`: below personal allowance → no income tax, no class 4, no class 2
- `estimateTax(20000, 0)`: `basicRateTax === (20000 - 12570) * 0.20`
- `estimateTax(12570, 0)`: exactly at NI threshold — class 2 NI > 0
- `estimateTax(12569, 0)`: just below NI threshold — class 2 NI === 0
- `estimateTax(60000, 0)`: higher rate applies, verify both bands
- `projectFullYearTax(1, 5000, 1000)`: result equals `estimateTax(20000, 4000)`
- `formatGBP(1234.5)`: returns `'£1,234.50'`

### Step 6.3 — Create `__tests__/hooks/useMtdData.test.ts`

Mock `db/mtdOperations.ts`. Tests:
- Hook returns `isLoading: true` initially
- Hook returns aggregates after mock resolves
- Hook calls `aggregateQuarter` with correct `taxYear` and `quarter`
- `refresh()` re-calls `aggregateQuarter`
- Error state set correctly when `aggregateQuarter` throws

---

## Phase 7 — Style & Visual Identity

**Goal:** Give MTD and Invoice sections distinct visual personalities while sharing spacing, radius, and dark mode conventions. This phase runs last because it modifies existing screens — doing it before the new screens exist means double work.

### Files to READ before starting Phase 7
- `components/BaseCard.tsx` — card anatomy
- `utils/theme.ts` and `context/ThemeContext.tsx` — all colour tokens
- `global.css` and `tailwind.config.ts` — the full token set
- `app/(tabs)/invoices.tsx`, `app/(stack)/createInvoice.tsx`, `app/(stack)/createEstimate.tsx` — current invoice screens
- `templates/invoiceTemplate.ts`, `templates/estimateTemplate.ts` — PDF templates
- `app/(tabs)/tax.tsx`, `app/(stack)/addMtdTransaction.tsx` — new MTD screens (just built)
- `app/(tabs)/charts.tsx` — for chart label size/colour reference

### Design System Foundation (establish these first, then apply everywhere)

Before touching any screen, define two module accent colours in `tailwind.config.ts` as custom colour tokens:

**Invoice accent** — a deep slate-blue, professional and document-like. Suggested: `invoice-accent` mapped to a slate/blue-grey ramp. All invoice-specific highlights, action buttons, active states, and status accents use this ramp.

**MTD accent** — a rich indigo or teal, analytical and number-forward. Suggested: `mtd-accent` mapped to an indigo ramp. All MTD-specific highlights, the Tax tab, action buttons, and the annual summary card use this ramp.

If `tailwind.config.ts` already defines custom colours, extend it. If not, add the `extend.colors` block. Both accents must have a full ramp (50 through 900) defined so NativeWind can use them at any shade.

Dark mode variants of both accents must be defined in the ramp — the 800/900 stops used for light mode backgrounds should shift to 100/200 stops in dark mode.

---

### INVOICE MODULE — Visual Identity

**Apply to:** `app/(tabs)/invoices.tsx`, `app/(stack)/createInvoice.tsx`, `app/(stack)/createEstimate.tsx`, `components/InvoiceForm/` all files, `templates/invoiceTemplate.ts`, `templates/estimateTemplate.ts`

**Card style — invoice list (`invoices.tsx`)**
Replace full-border card style with a left accent stripe card. Each invoice card gets a 3px solid left border in `invoice-accent-600` (light) / `invoice-accent-300` (dark). Remove the border from the other three sides. The card background uses the surface/secondary background token, not plain white. Corner radius: match `BaseCard.tsx` exactly — do not make invoice cards more or less rounded than other cards.

**Status badges**
Replace any raw colour classes on invoice status badges with `invoice-accent` ramp variants:
- `Paid` — solid fill: `invoice-accent-700` background, `invoice-accent-50` text (light) / `invoice-accent-200` background, `invoice-accent-900` text (dark). Pill shape (fully rounded).
- `Sent` — outlined: `invoice-accent-600` border, `invoice-accent-600` text, transparent background.
- `Draft` — muted: `invoice-accent-100` background, `invoice-accent-500` text.
- `Overdue` — uses the danger semantic token (not invoice-accent), solid fill, high contrast. This is the one status that should feel alarming.
- `Unpaid` — uses `invoice-accent-200` background, `invoice-accent-800` text.

**Typography inside forms (`createInvoice.tsx`, `createEstimate.tsx`)**
- Section dividers (Client Details, Line Items, Payment Terms, Notes): uppercase, letter-spacing wide (`tracking-widest`), small (`text-xs`), muted colour token. These are labels, not headings.
- Line item amounts: add `tabular-nums` class to all numeric columns so figures align vertically in lists.
- Invoice total row: `text-2xl font-bold` for the grand total figure. The subtotal and tax rows above should be `text-base` with muted colour — creating a clear descending visual hierarchy toward the total.
- Primary action button (Send, Save, Generate PDF): uses `invoice-accent-600` background, white text, full-width, same border radius as the rest of the app.

**Estimate distinction**
Estimate cards in any list view use the same left accent stripe but at 60% opacity. The primary action button in `createEstimate.tsx` uses `invoice-accent-400` rather than `invoice-accent-600` — slightly softer, reinforcing that an estimate is provisional. Estimate status badge text uses italic style.

**PDF template alignment**
Update `templates/invoiceTemplate.ts` and `templates/estimateTemplate.ts`. The header background colour in the HTML string should match `invoice-accent-700`. The accent line below the header uses `invoice-accent-400`. Font weight choices in the template should match what is used in the screens (read `utils/theme.ts` for the weight convention). The PDF should look like it was produced by the same product as the screen.

---

### MTD MODULE — Visual Identity

**Apply to:** `app/(tabs)/tax.tsx`, `app/(stack)/addMtdTransaction.tsx`, `app/(stack)/mtdDeadlines.tsx`, `app/(stack)/mtdQuarterlySummary.tsx`, `app/(stack)/mtdAnnualEstimate.tsx`, `components/DrawerContent.tsx` (MTD items)

**Tax tab screen (`tax.tsx`)**
The full-bleed header area of the Tax tab uses `mtd-accent-600` as a solid background (not a gradient). White text on the header. Tax year badge: `mtd-accent-100` background, `mtd-accent-900` text (light mode). Quarter label: white, slightly smaller.

**Transaction form (`addMtdTransaction.tsx`)**
- Income toggle active: success semantic token background, white text
- Expense toggle active: danger semantic token background, white text
- Inactive toggle option: muted surface background, muted text
- The quarter helper text below the date ("This falls in Q1 — 6 Apr to 5 Jul 2025") renders as a pill badge — `mtd-accent-100` background, `mtd-accent-700` text, pill shape — not plain text
- HMRC category picker section divider (between allowable and disallowable groups): small uppercase label in `mtd-accent-600`

**Deadline urgency system (`mtdDeadlines.tsx`)**
All deadline urgency colours must use semantic tokens, not raw colour classes:
- Overdue: danger token for border (2px), badge background, badge text, dot colour
- Urgent (≤14 days): warning token, 2px border (heavier than soon/ok to reinforce urgency without colour alone)
- Soon (≤30 days): a softer amber tint — `text-yellow-600` / `bg-yellow-50` / `border-yellow-300`
- OK: success token at reduced visual weight — muted background, lighter border — these cards should visually recede
Update `utils/mtdCategories.ts` STATUS_DEADLINE_* maps to use the above token values.

**Quarterly summary cards (`mtdQuarterlySummary.tsx`)**
Each of the three section cards gets a distinct left accent border (3px):
- Income section: success token
- Allowable expenses section: `mtd-accent-600`
- Disallowable section: warning token
Zero-value rows: `opacity-40` or `text-muted` token — visually dim, not removed.

**Tax band bar (`mtdAnnualEstimate.tsx`)**
SVG bar colours:
- Personal allowance segment: success token hex value (read from theme to stay consistent)
- Basic rate segment: `mtd-accent-400` hex
- Higher rate segment: warning token hex
Bar height: 24px minimum. Left end rounded cap (`rx` on the leftmost rect). Right end rounded cap. Legend labels: same font size as chart labels in `charts.tsx`.

**Annual estimate summary card (`mtdAnnualEstimate.tsx`)**
This is the most important visual element in the entire MTD module:
- Full-bleed card background: `mtd-accent-600` (light) / `mtd-accent-800` (dark) — solid, not transparent
- `totalTaxAndNI` figure: `text-4xl font-bold text-white` — the largest text in the entire app
- Effective rate and quarterly set-aside: `text-sm text-white/80` below the total
- Separator line between total and secondary stats: `border-mtd-accent-500`
- Do not use any shadow or elevation on this card — the bold background colour provides sufficient visual weight

---

### DRAWER & SETTINGS — Visual Identity

**Drawer (`components/DrawerContent.tsx`)**
- Background: `background-secondary` token — slightly inset from the main surface
- Active nav item: `mtd-accent-50` background with `mtd-accent-600` text and icon (light) / `mtd-accent-900` background with `mtd-accent-200` text (dark)
- Inactive nav item: transparent background, `text-secondary` token
- User info area at the top: `mtd-accent-600` background strip, white text — consistent with the Tax tab header
- App version at bottom: `text-xs text-muted` token

**Settings screen (`settings.tsx`)**
- Section headers (Profile, Bank Details, Appearance): same uppercase tracked style as invoice form section dividers
- Each settings row: same height and padding as existing list rows in the app
- ThemeToggle placement: inside the Appearance section, not floating

---

### SHARED STYLE RULES (both modules)

**Spacing** — Do not introduce new spacing values. Use only the increments already in the existing screens. Visual distinction comes from colour and typography, not from changing layout density.

**Border radius** — Both modules use the same border radius values as the rest of the app. Match `BaseCard.tsx` exactly. The left accent stripe pattern (3px solid left border, no other borders) is the main structural difference, not corner rounding.

**Font weights** — Use only the two weights already in the app's convention. Read `utils/theme.ts` to confirm. Do not introduce semibold or extrabold.

**Dark mode** — Every colour applied in this phase must be a ThemeContext token, a custom token from `tailwind.config.ts`, or a Tailwind class with a matching `dark:` variant applied. After completing all style changes, toggle dark mode and verify every screen.

**No new packages** — No icon libraries, animation libraries, or UI kits.

**Animations** — Only use `react-native-reanimated` if it is already used in existing screens. If the overdue deadline pulse animation would require it and it is not already used, use a solid 2px border instead.

---

### Final Verification Checklist — Styles

After Phase 7 is complete, verify every item:

**Invoice module**
- [ ] `invoices.tsx` — invoice cards have left accent stripe, no full border
- [ ] `invoices.tsx` — all 5 status badges (Paid, Sent, Draft, Overdue, Unpaid) render correctly in light and dark mode
- [ ] `createInvoice.tsx` — section labels are uppercase tracked, grand total is `text-2xl bold`
- [ ] `createInvoice.tsx` — all line item amounts are `tabular-nums` aligned
- [ ] `createEstimate.tsx` — primary button uses softer accent shade, estimate badge text is italic
- [ ] `templates/invoiceTemplate.ts` — PDF header uses `invoice-accent-700`, renders correctly in Expo Print
- [ ] `templates/estimateTemplate.ts` — same

**MTD module**
- [ ] `tax.tsx` — header area has full-bleed `mtd-accent-600` background, white text
- [ ] `addMtdTransaction.tsx` — income toggle is success green, expense toggle is danger red
- [ ] `addMtdTransaction.tsx` — quarter helper text renders as a pill badge, not plain text
- [ ] `mtdDeadlines.tsx` — overdue items visually dominate the list, ok items recede
- [ ] `mtdDeadlines.tsx` — overdue has 2px border, urgent has 2px border, soon/ok have 1px
- [ ] `mtdQuarterlySummary.tsx` — income/allowable/disallowable section cards have distinct left border colours
- [ ] `mtdQuarterlySummary.tsx` — zero-value rows are visually dimmed
- [ ] `mtdAnnualEstimate.tsx` — summary card has solid `mtd-accent-600` background
- [ ] `mtdAnnualEstimate.tsx` — `totalTaxAndNI` is `text-4xl bold white`, largest text on screen
- [ ] `mtdAnnualEstimate.tsx` — SVG tax band bar: green/mtd-accent/warning segments, rounded end caps, 24px height

**Navigation & shared**
- [ ] Drawer opens on left swipe from all tab screens
- [ ] Active drawer item uses `mtd-accent` highlight
- [ ] Settings screen renders user profile, bank details, theme toggle, currency in correct sections
- [ ] Info screen renders all sections, all GOV.UK links open correctly
- [ ] Dark mode: toggle from Settings and verify every modified screen — no unreadable text, no invisible borders
- [ ] `npx tsc --noEmit` — zero type errors
- [ ] `npm test` — all tests pass

---

## Complete File Change Summary

### Files to CREATE (new)

| File | Phase | Purpose |
|------|-------|---------|
| `components/DrawerContent.tsx` | 1 | Custom drawer navigation component |
| `app/(drawer)/settings.tsx` | 1 | Settings screen (moved from stack) |
| `app/(drawer)/info.tsx` | 1 | Info/help/MTD reference screen |
| `app/(tabs)/tax.tsx` | 1 + 4 | New MTD hub tab screen |
| `hooks/useHomeInsights.ts` | 5 | Cross-module home insights |
| `types/mtd.ts` | 2 | All MTD TypeScript types |
| `utils/mtdCategories.ts` | 2 | HMRC category labels + urgency style maps |
| `utils/mtdDates.ts` | 2 | UK tax year + quarter date calculations |
| `utils/mtdTaxCalc.ts` | 2 | Income Tax + NI estimation |
| `db/mtdOperations.ts` | 2 | All MTD database operations |
| `hooks/useMtdTransaction.ts` | 3 | MTD add/delete transaction hook |
| `hooks/useMtdData.ts` | 3 | MTD aggregated data hook |
| `hooks/useMtdDeadlines.ts` | 3 | MTD deadline computation hook |
| `app/(stack)/addMtdTransaction.tsx` | 4 | Add MTD income/expense screen |
| `app/(stack)/mtdDeadlines.tsx` | 4 | Deadline tracker screen |
| `app/(stack)/mtdQuarterlySummary.tsx` | 4 | Per-quarter summary screen |
| `app/(stack)/mtdAnnualEstimate.tsx` | 4 | Full-year tax estimate screen |
| `__tests__/utils/mtdDates.test.ts` | 6 | Date/quarter unit tests |
| `__tests__/utils/mtdTaxCalc.test.ts` | 6 | Tax calculation unit tests |
| `__tests__/hooks/useMtdData.test.ts` | 6 | MTD data hook tests |

### Files to MODIFY (existing)

| File | Phase | What changes |
|------|-------|-------------|
| `app/_layout.tsx` | 1 | Update root layout to point at `(drawer)` segment instead of `(tabs)` |
| `app/(drawer)/_layout.tsx` | 1 | NEW — Expo Router Drawer layout using `expo-router/drawer` |
| `app/(drawer)/(tabs)/_layout.tsx` | 1 | Add Tax tab, remove Charts tab, reorder (moved from `app/(tabs)/`) |
| `app/(tabs)/home.tsx` | 5 | Unified cross-module dashboard |
| `app/(tabs)/budget.tsx` | 1 | Remove MTD nav link (Tax tab handles it now) |
| `db/schema.ts` | 2 | Append 3 MTD tables |
| `tailwind.config.ts` | 7 | Add `invoice-accent` and `mtd-accent` colour ramps |
| `app/(tabs)/invoices.tsx` | 7 | Left accent stripe cards, status badges |
| `app/(stack)/createInvoice.tsx` | 7 | Section labels, tabular-nums, total hierarchy |
| `app/(stack)/createEstimate.tsx` | 7 | Softer accent, italic badge |
| `templates/invoiceTemplate.ts` | 7 | PDF header colour + font match |
| `templates/estimateTemplate.ts` | 7 | Same |
| `utils/mtdCategories.ts` | 7 | Update STATUS_DEADLINE_* to use semantic tokens |

### Files to CREATE (infrastructure)

| File | Phase | Purpose |
|------|-------|---------|
| `drizzle/XXXX_add_mtd_tables.sql` | 2 | Generated by drizzle-kit |

---

## Master VSCode AI Prompt

Paste this into your VSCode AI assistant. It covers all 7 phases in order. Complete each phase fully before moving to the next.

---

```
You are building a unified Invoicing + MTD for Income Tax app for UK sole traders.
This is a fork of github.com/MarekKabala1/invoiceApp working on branch featureBranch.

The app already has: invoice creation, estimates, budget tracking, document scanner, a hooks layer, ThemeContext with dark/light mode, and Drizzle ORM with expo-sqlite. You are adding MTD tax tracking on top of this, restructuring navigation, adding an Info screen, and giving both modules distinct visual identities.

ABSOLUTE RULES — never break these:
1. Read every file listed in each step BEFORE writing code
2. Do not remove or break any existing functionality
3. Screens never call DB operations directly — always use hooks
4. UUID always via utils/generateUuid.ts
5. Theme colours always via ThemeContext tokens or tailwind.config.ts custom tokens — never hardcode hex or raw colour classes that do not adapt to dark mode
6. No new npm packages — zero. The drawer uses Expo Router's built-in `expo-router/drawer` which is already part of expo-router v3. No @react-navigation/drawer install needed.
7. All MTD types from types/mtd.ts — never inline type definitions
8. Git discipline — follow every rule below without exception

GIT DISCIPLINE RULES (read these before writing any code):

COMMITS — one logical change per commit, never the whole app in one go.
A commit is one complete, self-contained, working change. If you find yourself writing "and" in a commit message, that is two commits.

COMMIT PREFIX — every commit message must start with one of:
[MTD] new MTD files (types, utils, hooks, DB, screens)
[NAV] navigation restructure (drawer, tabs, layouts)
[SETTINGS] settings screen and appSettings changes
[INVOICE] existing invoice/estimate screen changes
[BUDGET] budget/transaction screen changes
[SCHEMA] db/schema.ts or migration file changes
[STYLE] Tailwind config, NativeWind classes, theme
[TEST] new or updated test files
[FIX] bug fix — include module name in description
[REFACTOR] code reorganisation, no behaviour change
[DOCS] README, planning docs, comments only
[CHORE] package.json, config files, tooling

COMMIT MESSAGE FORMAT:
[PREFIX] Short description in sentence case, 50 chars max after prefix

Optional body: explain WHY, not WHAT. The diff shows what changed.
The message explains why you made the decision.

Refs: MASTER_PLAN.md Phase X Step Y.Z

COMMIT CADENCE — commit after each completed step, not after each phase.
Phase 1: one commit per step (1.1 file moves, 1.2 drawer layout, etc.)
Phase 2: one commit per file (types, each util, schema change, migration, operations)
Phase 3: one commit per hook
Phase 4: one commit per screen (split large screens — data wiring separate from SVG/style)
Phase 5: one commit per hook and one per screen change
Phase 6: one commit per test file
Phase 7: one commit for tailwind.config.ts, one per module style pass

BUILD CHECK — before every commit run: npx tsc --noEmit
Never commit with TypeScript errors. Fix before committing.

STAGING — always stage specific files, never git add .
Use: git add <specific files> or git add -p for hunks
git add . picks up unrelated half-finished work and debug files.

FILE COMMENTS — every new file must have a comment block at the top:
- What this file does
- Why it exists as a separate file
- What files depend on it / what it depends on
- Any non-obvious decisions

INLINE COMMENTS — comment WHY not WHAT for any non-obvious logic.
Required on: aggregateQuarter three-source logic, taxScheme standard/inclusive calculation, uniqueIndex reasoning, personalAllowanceUsed snapshot reasoning, every mapCategoryToHmrc mapping.

PHASE TAGS — after each phase is complete and builds cleanly, tag it:
git tag phase-1-navigation
git tag phase-2-data-layer
(etc. through phase-7-styles)
Tags are rollback points. If Phase 5 breaks something, git checkout phase-4-mtd-screens restores the last clean state.

UPSTREAM SYNC — before starting each new phase:
git fetch upstream
git checkout main && git merge upstream/main
git checkout featureBranch && git rebase main
Pull upstream changes in small batches, not one large merge at the end.

TECH STACK (already installed — do not reinstall):
Expo SDK 51, expo-router v3 typed routes (drawer support built-in via expo-router/drawer), React Native 0.74, TypeScript, Drizzle ORM v0.33 + expo-sqlite v14, NativeWind v4 + Tailwind CSS v3, React Hook Form v7 + Zod v3 + @hookform/resolvers, date-fns v4, react-native-uuid v2 (via utils/generateUuid.ts), react-native-chart-kit + react-native-svg, @react-native-community/datetimepicker + @react-native-picker/picker, jest-expo + @types/jest, react-native-gesture-handler + react-native-reanimated (peer deps for drawer, already installed)

---

PHASE 1 — Navigation Restructure

Read first: app/_layout.tsx, app/(tabs)/_layout.tsx, app/(stack)/(user)/userInfo.tsx, context/ThemeContext.tsx, utils/theme.ts, components/BaseCard.tsx, components/ThemeToggle.tsx

IMPORTANT — NO NEW PACKAGES. The drawer uses expo-router/drawer which is already part of expo-router v3. Import Drawer from 'expo-router/drawer'. Do not install @react-navigation/drawer.

STEP 1.1 — Restructure the file system. Move the entire app/(tabs)/ folder inside a new app/(drawer)/ folder. Create app/(drawer)/_layout.tsx as the drawer navigator. The final structure is: app/(drawer)/_layout.tsx (drawer layout), app/(drawer)/(tabs)/ (all existing tabs), app/(drawer)/settings.tsx, app/(drawer)/info.tsx, app/(drawer)/charts.tsx (moved from tabs). The root app/_layout.tsx stays as the root Stack + all providers — it now references the (drawer) segment instead of (tabs) as its first screen. All (stack)/ screens remain unchanged at app/(stack)/.

STEP 1.2 — Create app/(drawer)/_layout.tsx. Import Drawer from 'expo-router/drawer'. Import DrawerContent from '../../components/DrawerContent'. Use: <Drawer drawerContent={(props) => <DrawerContent {...props} />}> with Drawer.Screen entries for (tabs) (headerShown: false), settings (title: 'Settings'), info (title: 'Info'), charts (title: 'Charts & Analytics'). Consume ThemeContext for the drawer background colour.

STEP 1.3 — Modify app/(drawer)/(tabs)/_layout.tsx. New tab order: Home, Invoices, Tax (NEW — tax.tsx, calculator icon), Budget, Scanner. Remove Charts entry. Keep all existing icon imports, tab bar styles, and option props unchanged.

STEP 1.4 — Move app/(drawer)/charts.tsx content. File content is identical to the old app/(tabs)/charts.tsx — only the path changed. Search the whole codebase for any router.push to '/(tabs)/charts' or '/charts' and update to '/(drawer)/charts'.

STEP 1.5 — Create components/DrawerContent.tsx. Props: DrawerContentComponentProps from expo-router/drawer. Contents: app name + icon at top, user name/email from useUserData hook (placeholder if unavailable), nav items with icons for Home/Settings/Info/Charts (use Pressable + router.push, highlight active route via usePathname()), ThemeToggle at bottom, app version from expo-constants at very bottom. Background: background-secondary ThemeContext token.

STEP 1.6 — Create app/(drawer)/settings.tsx. Sections: Profile (links to (stack)/(user)/userInfoForm), Bank Details (links to (stack)/(user)/bankDetailsForm), Appearance (ThemeToggle inline), Currency (appSettings currency preference), About (app version from expo-constants, GOV.UK MTD link via Linking.openURL). Section headers: uppercase tracking-widest text-xs muted token.

STEP 1.7 — Create app/(drawer)/info.tsx. Read-only. Sections: MTD Overview, Income Thresholds table, Quarter Reference table, 2025-26 Tax Rates (import RATES_2025_26 from utils/mtdTaxCalc.ts once it exists — for now use hardcoded values as a placeholder), Useful Links (Linking.openURL), Invoicing Tips. No DB, no forms.

STEP 1.8 — Create app/(drawer)/(tabs)/tax.tsx as a placeholder. Single screen with title 'Tax' and text 'MTD features coming in Phase 4'. This lets the tab bar compile correctly in Phase 1.

STEP 1.9 — Modify app/(drawer)/(tabs)/budget.tsx. Remove any MTD navigation link if previously added. Do not change anything else.

---

PHASE 2 — MTD Data Layer

Read first: db/config.ts, db/queries.ts, db/invoiceOperations.ts, db/zodSchema.ts, db/schema.ts, utils/categories.ts, utils/generateUuid.ts, utils/getCurrencySymbol.ts, types/index.ts

STEP 2.1 — Create types/mtd.ts. New file — do NOT modify types/index.ts. Export: ExpenseCategory union of 12 HMRC category strings ('turnover' | 'costOfGoodsAllowable' | 'employeeCosts' | 'premisesRunningCosts' | 'maintenanceCosts' | 'advertisingCosts' | 'businessEntertainmentCosts' | 'interestOnBankLoans' | 'professionalFees' | 'depreciation' | 'otherAllowableExpenses' | 'otherDisallowableExpenses'), EXPENSE_CATEGORIES readonly const array, ALLOWABLE_CATEGORIES readonly const array (10 items, excludes businessEntertainmentCosts and otherDisallowableExpenses), TaxQuarter interface, TaxYear interface, DeadlineStatus union, DeadlineItem interface, TaxRates interface, TaxEstimate interface, QuarterAggregates interface, NewMtdTransaction interface, MtdTransactionStatus union, MtdAnnualStatus union. Full field lists as specified in MASTER_PLAN.md Phase 2 Step 2.1.

STEP 2.2 — Create utils/mtdCategories.ts following utils/categories.ts pattern. Export EXPENSE_CATEGORY_LABELS, isAllowable(), INCOME_CATEGORIES, EXPENSE_ONLY_CATEGORIES, STATUS_DEADLINE_COLOR, STATUS_DEADLINE_DOT, STATUS_DEADLINE_BADGE_BG, STATUS_DEADLINE_BORDER, STATUS_DEADLINE_LABEL — all Record<DeadlineStatus, string> with NativeWind classes. Check utils/theme.ts first — if semantic tokens are defined there, use those instead of raw colour classes.

STEP 2.3 — Create utils/mtdDates.ts. Pure TypeScript, no React Native. date-fns v4. Export toISO, fromISO, taxYearForDate, taxYearLabel, currentTaxYearStart, quartersForTaxYear, buildTaxYear, currentTaxYear, quarterForDate, daysUntil, deadlineStatus, formatDeadline, upcomingDeadlines. Full specifications in MASTER_PLAN.md Phase 2 Step 2.3.

STEP 2.4 — Create utils/mtdTaxCalc.ts. Top comment: ESTIMATES ONLY. Check getCurrencySymbol.ts before implementing formatGBP. Export RATES_2025_26, estimateTax, projectFullYearTax, formatGBP, formatPercent.

STEP 2.5 — Extend db/schema.ts (append only). Check existing imports — add real/integer to the existing drizzle-orm/sqlite-core import if missing. Append mtdTransactions, mtdQuarterlySummary, mtdAnnualSummary tables with all columns and the unique constraint on mtdQuarterlySummary(taxYear, quarter). Export all three table constants.

STEP 2.6 — Run: npx drizzle-kit generate. Commit the generated SQL file.

STEP 2.7 — Create db/mtdOperations.ts following db/invoiceOperations.ts pattern. Import db from db/config.ts. Export addMtdTransaction, getMtdTransactions, deleteMtdTransaction, aggregateQuarter, refreshQuarterlySummary, getQuarterlySummaries, refreshAnnualSummary, getAnnualSummary, refreshCurrentYear.

---

PHASE 3 — MTD Hooks

Read first: hooks/useBudgetData.ts, hooks/useTransaction.ts

STEP 3.1 — Create hooks/useMtdTransaction.ts following useTransaction.ts. Returns { addTransaction, deleteTransaction, isLoading, error }.

STEP 3.2 — Create hooks/useMtdData.ts following useBudgetData.ts. Accepts { taxYear, quarter }. Returns { aggregates, annualSummary, isLoading, error, refresh }.

STEP 3.3 — Create hooks/useMtdDeadlines.ts. No DB. Accepts lookAheadYears?. Returns { deadlines, overdue, urgent, upcoming, nextDeadline }. useMemo.

---

PHASE 4 — MTD Screens

Read first: context/ThemeContext.tsx, utils/theme.ts, app/(stack)/addTransaction.tsx, app/(tabs)/charts.tsx, app/(tabs)/budget.tsx

STEP 4.1 — Create app/(stack)/addMtdTransaction.tsx. useMtdTransaction hook. react-hook-form + zod. Fields: income/expense toggle, date (datetimepicker, YYYY-MM-DD store, DD/MM/YYYY display, quarter helper pill badge below), amount, description, category (native Picker, allowable/disallowable groups with section divider), notes, receiptRef. On success: alert "Saved to Q{n} {taxYear}", router.back(). All colours from ThemeContext.

STEP 4.2 — Create app/(stack)/mtdDeadlines.tsx. useMtdDeadlines(). Three sections: Overdue / Due within 14 days / Upcoming. Deadline cards with left border using STATUS_DEADLINE_BORDER, urgency badge using STATUS_DEADLINE_LABEL + STATUS_DEADLINE_COLOR, days count. GOV.UK link. No DB calls.

STEP 4.3 — Create app/(stack)/mtdQuarterlySummary.tsx. useMtdData. Q1-Q4 horizontal tabs. Period info card. Income card (success left border), Allowable expenses card (mtd-accent left border, per-HMRC-category rows, dim zero rows, total), Disallowable card (warning left border, note text). Net profit row (green/red). Quarterly tax estimate card (estimateTax, IT+NI breakdown, disclaimer). Header button to addMtdTransaction.

STEP 4.4 — Create app/(stack)/mtdAnnualEstimate.tsx. Aggregate 4 quarters. 0=empty state. 1-3=projectFullYearTax+amber banner. 4=estimateTax. Income & Profit card, SVG tax band bar (success/mtd-accent-400/warning segments, 24px height, rounded end caps, legend), Income Tax card (per-band rows), NI card, Summary card (solid mtd-accent-600 background, text-4xl bold white total, effective rate + quarterly set-aside), Key dates table, Disclaimer card with GOV.UK link.

STEP 4.5 — Replace the placeholder app/(tabs)/tax.tsx with the full implementation. useMtdData + useMtdDeadlines. Full-bleed mtd-accent-600 header. Quick stats (net profit + est. quarterly tax). Next deadline card with urgency colour. Four nav tiles (Add Record / Quarter Detail / Annual Estimate / All Deadlines). Mini top-3 expense breakdown list.

STEP 4.6 — Modify app/_layout.tsx. Add to the stack inside the drawer: (stack)/addMtdTransaction title 'Add MTD Record', (stack)/mtdDeadlines title 'MTD Deadlines', (stack)/mtdQuarterlySummary title 'Quarterly Summary', (stack)/mtdAnnualEstimate title 'Annual Tax Estimate'.

---

PHASE 5 — Unified Home Tab

Read first: app/(tabs)/home.tsx (full content), hooks/useInvoiceData.ts, hooks/useBudgetData.ts, hooks/useMtdData.ts

STEP 5.1 — Create hooks/useHomeInsights.ts. Combines invoice + MTD data. Returns unpaidInvoicesTotal, unpaidInvoicesCount, currentQuarterTurnover, turnoverNotYetRecorded (invoice total - MTD turnover, floored at 0), nextDeadline from useMtdDeadlines, recentActivity array (last 5 actions across both modules).

STEP 5.2 — Modify app/(tabs)/home.tsx. New structure: (a) Today at a glance — two tiles: "Unpaid invoices" count+total, "Q{n} net profit". (b) Cross-module insight banner — only if turnoverNotYetRecorded > 0: "You have £{amount} in invoices not yet in your MTD records — add them before {deadline}". Taps to addMtdTransaction. (c) Next deadline row with urgency colour. (d) Recent activity feed from useHomeInsights (each item shows module icon + description + amount + date). (e) Quick actions row: New Invoice, Add MTD Record, New Estimate. Do not remove any existing useful content — integrate it into the new structure.

---

PHASE 6 — Tests

Read first: all existing __tests__/ files for mocking pattern and describe/it convention.

STEP 6.1 — Create __tests__/utils/mtdDates.test.ts. Tests for taxYearForDate (4 boundary cases), quartersForTaxYear(2025) (all 4 quarter dates), quarterForDate (one date per quarter), daysUntil (yesterday/today/tomorrow), deadlineStatus (6 boundary values), upcomingDeadlines(2) (count/sort/filter), buildTaxYear(2025).finalDeclarationDeadline.

STEP 6.2 — Create __tests__/utils/mtdTaxCalc.test.ts. Tests for estimateTax zero income, below personal allowance, basic rate band, higher rate band, class2NI threshold (above and below), projectFullYearTax Q1 multiplier, formatGBP.

STEP 6.3 — Create __tests__/hooks/useMtdData.test.ts. Mock db/mtdOperations.ts. Test: loading state, resolved aggregates, correct arguments to aggregateQuarter, refresh re-call, error state.

---

PHASE 7 — Style & Visual Identity

Read first: tailwind.config.ts, global.css, utils/theme.ts, context/ThemeContext.tsx, components/BaseCard.tsx, app/(tabs)/invoices.tsx, app/(stack)/createInvoice.tsx, app/(stack)/createEstimate.tsx, templates/invoiceTemplate.ts, templates/estimateTemplate.ts, app/(tabs)/tax.tsx, app/(stack)/addMtdTransaction.tsx, app/(tabs)/charts.tsx

STEP 7.1 — Extend tailwind.config.ts. Add two custom colour ramps under extend.colors: invoice-accent (a deep slate-blue ramp, 50 through 900) and mtd-accent (a rich indigo ramp, 50 through 900). Both must have dark mode variants handled — either via CSS variables that swap in dark mode, or via explicit dark: prefix usage in components. If the existing config already defines custom colours, extend that pattern exactly.

STEP 7.2 — Invoice module styles. Apply to invoices.tsx, createInvoice.tsx, createEstimate.tsx, all files in components/InvoiceForm/: (a) Invoice cards: replace full border with 3px left border in invoice-accent-600 (light) / invoice-accent-300 (dark), card background = surface token. (b) Status badges: Paid=invoice-accent-700 bg/invoice-accent-50 text pill, Sent=invoice-accent-600 outlined pill, Draft=invoice-accent-100 bg/invoice-accent-500 text, Overdue=danger token solid, Unpaid=invoice-accent-200 bg/invoice-accent-800 text. (c) Section dividers in forms: uppercase tracking-widest text-xs muted token. (d) Line item amounts: tabular-nums. (e) Grand total: text-2xl font-bold. (f) Estimate cards: left border 60% opacity. Estimate action button: invoice-accent-400. Estimate badge text: italic.

STEP 7.3 — PDF templates. Update templates/invoiceTemplate.ts and templates/estimateTemplate.ts HTML strings: header background = invoice-accent-700 equivalent hex, accent line = invoice-accent-400 hex, font weights = match app convention from theme.ts.

STEP 7.4 — MTD module styles. Apply to all MTD screens: (a) tax.tsx: full-bleed mtd-accent-600 header, white text. (b) addMtdTransaction.tsx: income toggle=success bg, expense toggle=danger bg, quarter helper=pill badge (mtd-accent-100 bg/mtd-accent-700 text), category section divider=mtd-accent-600 uppercase. (c) mtdDeadlines.tsx: update STATUS_DEADLINE_* in mtdCategories.ts to use semantic tokens, overdue/urgent=2px border, soon/ok=1px. (d) mtdQuarterlySummary.tsx: Income card=success left border, Allowable card=mtd-accent left border, Disallowable card=warning left border, zero rows=opacity-40 or text-muted. (e) mtdAnnualEstimate.tsx: SVG bar segments (success/mtd-accent-400/warning, 24px, rounded caps), summary card (mtd-accent-600 solid bg, text-4xl bold white total).

STEP 7.5 — Drawer and Settings styles. DrawerContent.tsx: background-secondary token, active item=mtd-accent highlight as specified, top strip=mtd-accent-600. Settings sections: uppercase tracking-widest text-xs section headers.

STEP 7.6 — Dark mode audit. Toggle ThemeToggle and check every modified screen. Replace any remaining hardcoded colours that do not adapt. Confirm no hex values remain in JSX className attributes — all colours through tokens or tailwind.config.ts ramps.

---

CRITICAL ADDITIONS — insert these into the relevant phases before executing

---

CORE PRINCIPLE — MTD reads from invoices and budget, not separate entry
The MTD module must NOT ask the user to re-enter data they have already recorded. The app has two existing data sources that MTD must read automatically:

(1) INVOICES → MTD TURNOVER. Every Invoice row with isPayed=true represents income already earned. The `aggregateQuarter` function in db/mtdOperations.ts must query the Invoice table for paid invoices whose invoiceDate falls within the quarter's periodStart–periodEnd, sum their amountAfterTax values, and include that total as part of the turnover figure. The user can still add manual MTD income records via addMtdTransaction.tsx for cash payments or income not invoiced through the app — these are additive on top of the auto-pulled invoice total.

(2) BUDGET TRANSACTIONS → MTD EXPENSES. Every Transactions row with type='expense' already recorded represents a business expense. The `aggregateQuarter` function must also query the Transactions table for expense rows whose date falls within the quarter, and map each transaction's categoryId (via the Categories table) to the nearest HMRC ExpenseCategory. The mapping is stored in a new utility function `mapCategoryToHmrc(categoryId: string): ExpenseCategory` in utils/mtdCategories.ts. The user can still add manual MTD expense records via addMtdTransaction.tsx for items not in the budget tracker — these are additive on top.

This means the quarterly summary screen and tax tab show real numbers from day one, even before the user knows what MTD is. The data is already there — MTD just aggregates it.

The revised aggregateQuarter function signature:
aggregateQuarter(taxYear: string, quarter: 1|2|3|4, userId: string): Promise<QuarterAggregates>

It must:
- Query MtdTransactions for manual MTD records (existing behaviour)
- Query Invoice where userId=userId AND isPayed=true AND invoiceDate BETWEEN periodStart AND periodEnd — sum amountAfterTax as additional turnover
- Query Transactions JOIN Categories where userId=userId AND type='expense' AND date BETWEEN periodStart AND periodEnd — map each to HMRC category via mapCategoryToHmrc, sum by category
- Combine all three sources into a single QuarterAggregates result
- Mark each source so the UI can show "From invoices: £X | From budget: £Y | Manual: £Z" breakdowns

Add a new field to QuarterAggregates in types/mtd.ts to track sources:
sources: { invoiceTurnover: number; budgetExpenses: Record<ExpenseCategory, number>; manualTurnover: number; manualExpenses: Record<ExpenseCategory, number> }

---

ADDITION A — Error and empty states (applies to every phase that builds screens)
Every screen that loads async data must handle three states explicitly: (1) loading — show ActivityIndicator using the colour and size already used in existing screens (read home.tsx or invoices.tsx for the existing pattern), (2) error — show a brief error message in the danger ThemeContext token with a "Try again" button that calls the hook's refresh function, (3) empty — show a descriptive placeholder message explaining what will appear here and a call-to-action button (e.g. "Add your first MTD record" navigates to addMtdTransaction, "Create your first invoice" navigates to createInvoice). This applies to: tax.tsx, mtdQuarterlySummary.tsx, mtdAnnualEstimate.tsx, home.tsx, invoices.tsx.

ADDITION B — Zod schemas in db/zodSchema.ts (Phase 2, run before building any form screen)
Before building addMtdTransaction.tsx or the Settings screen, read db/zodSchema.ts and add the following Zod schemas following the exact export pattern already in that file:

newMtdTransactionSchema: z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'), description: z.string().min(1, 'Description is required'), amount: z.coerce.number().positive('Amount must be positive'), type: z.enum(['income', 'expense']), category: z.enum([...EXPENSE_CATEGORIES] as [string, ...string[]]), receiptRef: z.string().optional(), notes: z.string().optional() })

appSettingsSchema: z.object({ defaultVatRate: z.coerce.number().min(0).max(100), taxScheme: z.enum(['standard', 'inclusive']), applyTaxByDefault: z.boolean(), defaultPaymentTerms: z.coerce.number().int().min(1).max(365), defaultNotes: z.string().optional(), invoicePrefix: z.string().min(1).max(6), nextInvoiceNumber: z.coerce.number().int().min(1), estimatePrefix: z.string().min(1).max(6), nextEstimateNumber: z.coerce.number().int().min(1), currency: z.string(), theme: z.enum(['light', 'dark', 'system']), dateFormat: z.string(), quarterlyTaxEnabled: z.boolean(), autoCalculateQuarters: z.boolean(), quarterlyTaxReminderDays: z.coerce.number().int().min(1).max(60), reminderEmailEnabled: z.boolean(), reminderDaysBeforeDue: z.coerce.number().int().min(1).max(30), defaultTaxCategory: z.enum(['self-employed', 'property', 'both']) })

Export both from db/zodSchema.ts and import them in their respective screens.

ADDITION C — ActivityItem type (Phase 2, add to types/mtd.ts)
Add to types/mtd.ts: ActivityItem interface: { id: string; type: 'invoice' | 'estimate' | 'mtd_transaction' | 'budget_transaction'; description: string; amount: number; currency: string; date: string; module: 'invoice' | 'mtd' | 'budget' }. Used by hooks/useHomeInsights.ts recentActivity array.

ADDITION D — useAppSettings hook (Phase 1, create before Step 1.6 settings screen)
Create hooks/useAppSettings.ts following hooks/useBudgetData.ts pattern. Returns: { settings: AppSettingsRow | null, updateSettings(partial: Partial<AppSettingsRow>): Promise<void>, isLoading: boolean, error: string | null }. The updateSettings function performs an upsert — if no row exists for the current userId it inserts with all defaults, otherwise it updates only the provided fields plus updatedAt. Every screen that reads settings — createInvoice.tsx, createEstimate.tsx, tax.tsx, addMtdTransaction.tsx, settings.tsx — imports and calls this hook. Never read appSettings directly in a screen.

ADDITION E — Category mapping utility (Phase 2, add to utils/mtdCategories.ts)
Add mapCategoryToHmrc(categoryId: string, categoryName: string): ExpenseCategory to utils/mtdCategories.ts. This function maps the app's existing budget category names to HMRC ExpenseCategory values. Read the Categories table data (or utils/categories.ts) to know what category names currently exist. Example mappings: 'Materials' / 'Stock' / 'Supplies' → costOfGoodsAllowable, 'Staff' / 'Wages' / 'Payroll' → employeeCosts, 'Rent' / 'Office' / 'Utilities' → premisesRunningCosts, 'Repairs' / 'Maintenance' → maintenanceCosts, 'Marketing' / 'Advertising' → advertisingCosts, 'Accountant' / 'Legal' / 'Professional' → professionalFees, 'Bank charges' / 'Interest' → interestOnBankLoans, 'Equipment' / 'Depreciation' → depreciation, 'Entertainment' / 'Hospitality' → businessEntertainmentCosts. Any category that does not match a specific HMRC field falls back to otherAllowableExpenses. The fallback ensures no budget expense is ever lost from the MTD calculation.

ADDITION F — Revised db/mtdOperations.ts aggregateQuarter (Phase 2 Step 2.7 — replace the original specification)
The aggregateQuarter function must pull from three sources as described in the CORE PRINCIPLE above. Full specification:

aggregateQuarter(taxYear: string, quarter: 1|2|3|4, userId: string): Promise<QuarterAggregates>

Step 1 — Determine the quarter's periodStart and periodEnd from quartersForTaxYear().
Step 2 — Query MtdTransactions WHERE userId=userId AND taxYear=taxYear AND quarter=quarter. Sum by category into manual income and manual expense totals.
Step 3 — Query Invoice WHERE userId=userId AND isPayed=true AND invoiceDate >= periodStart AND invoiceDate <= periodEnd. Sum amountAfterTax as invoiceTurnover. Each matched invoice row should have its id recorded so the UI can show "3 invoices totalling £2,400".
Step 4 — Query Transactions JOIN Categories WHERE Transactions.userId=userId AND Transactions.type='expense' AND Transactions.date >= periodStart AND Transactions.date <= periodEnd. For each row call mapCategoryToHmrc(categoryId, categoryName) to get the HMRC category. Sum by HMRC category into budgetExpenses.
Step 5 — Combine: total turnover = invoiceTurnover + manualTurnover. Each expense category total = budgetExpenses[category] + manualExpenses[category]. Compute totalAllowableExpenses and netProfit.
Step 6 — Return the full QuarterAggregates including the sources breakdown.

Also add a new function: getQuarterSourceDetail(taxYear: string, quarter: 1|2|3|4, userId: string): Promise<QuarterSourceDetail> that returns the individual invoice IDs, invoice numbers, amounts, and budget transaction IDs that contributed to the quarter total. This powers the "source breakdown" UI in mtdQuarterlySummary.tsx.

ADDITION G — Source breakdown UI in mtdQuarterlySummary.tsx (Phase 4 Step 4.3 — add to the screen)
Below the Income section card in mtdQuarterlySummary.tsx, add a collapsible "Sources" row. When expanded it shows:
- Under Income: a list of the paid invoices that contributed to the quarter's turnover — each showing invoice number, customer name, date, and amount. A "View invoice" link navigates to that invoice. An "Add income not from invoices" link navigates to addMtdTransaction with type=income pre-set.
- Under Allowable Expenses: a summary of which budget categories contributed — e.g. "Materials: £340 from 4 transactions", "Office: £120 from 2 transactions". An "Add expense not in budget" link navigates to addMtdTransaction with type=expense pre-set.
This makes the MTD figures auditable — the user can see exactly where every number came from and add anything that was missed.

ADDITION H — Invoice to MTD auto-linking UI (Phase 5, new Step 5.3)
When a user marks an invoice as paid (isPayed=true), the app should prompt: "Add this invoice to your MTD records? It falls in Q{n} {taxYear}." with "Yes, add it" and "Skip" buttons. Tapping "Yes" creates an MtdTransactions row with type=income, category=turnover, amount=invoice.amountAfterTax, date=invoice.invoiceDate, description="Invoice {number} — {customerName}", invoiceId=invoice.id. This is the forward flow — the auto-pull in ADDITION F handles historical invoices already marked paid.

ADDITION I — useAppSettings hook check in tax.tsx (Phase 4 Step 4.5)
In tax.tsx, on mount read appSettings via useAppSettings hook. Check quarterlyTaxEnabled. If false, show an enrolment state: a card explaining what MTD is, the income thresholds table, and a toggle to enable it (calls updateSettings({ quarterlyTaxEnabled: true })). If true and autoCalculateQuarters is true, call refreshCurrentYear() on mount to keep totals fresh. If autoCalculateQuarters is false, show a "Refresh" button that calls refreshCurrentYear() manually.

ADDITION J — MTD deadline reminder threshold from settings (Phase 2, update utils/mtdDates.ts)
The deadlineStatus() function currently uses hardcoded thresholds (14 days = urgent, 30 days = soon). Add an optional parameter: deadlineStatus(isoDeadline: string, urgentDays?: number, soonDays?: number): DeadlineStatus. Default values remain 14 and 30. Everywhere deadlineStatus is called in the MTD screens and hooks, pass appSettings.quarterlyTaxReminderDays as urgentDays so the user's setting overrides the default.

ADDITION K — Schema migration for two new appSettings columns (Phase 2, immediately after Step 2.6)
Two new columns were added to appSettings in db/schema.ts: applyTaxByDefault and defaultNotes. Run npx drizzle-kit generate a second time after these are added to produce a second migration file. This is a separate migration from the MTD tables migration because it modifies an existing table (ALTER TABLE) rather than creating new ones. Commit both migration files. Verify the migration runner in drizzle/migrations.js includes both.

ADDITION L — createInvoice.tsx reads from appSettings (Phase 1, update after Step 1.6)
After the settings screen is built, modify createInvoice.tsx and createEstimate.tsx to read from useAppSettings on mount and pre-populate: taxRate field from appSettings.defaultVatRate, tax mode from appSettings.taxScheme, apply-tax toggle from appSettings.applyTaxByDefault, due date from invoiceDate + appSettings.defaultPaymentTerms days, notes field from appSettings.defaultNotes, invoice number from appSettings.invoicePrefix + '-' + String(appSettings.nextInvoiceNumber).padStart(3, '0'). After an invoice is successfully saved, call updateSettings({ nextInvoiceNumber: settings.nextInvoiceNumber + 1 }). After an estimate is saved, call updateSettings({ nextEstimateNumber: settings.nextEstimateNumber + 1 }).

ADDITION M — DrawerContentComponentProps import (Phase 1 Step 1.5)
In components/DrawerContent.tsx, import DrawerContentComponentProps from '@react-navigation/drawer'. This package is a transitive dependency of expo-router and is already installed — do not run npm install. Use usePathname() from expo-router to determine the active route for drawer item highlight state. Use router.push() from expo-router for all navigation.

ADDITION N — Root layout Stack structure (Phase 1 Step 1.1 — critical)
The root app/_layout.tsx must keep <Stack> as its outermost navigator. The (drawer) segment is the initialRouteName of that Stack. All (stack)/ screens are declared as <Stack.Screen> siblings of the (drawer) initial route inside that root Stack. Do not remove or restructure the Stack — it is what allows createInvoice, addMtdTransaction, and all other stack screens to be pushed on top of drawer and tab screens.

ADDITION O — Migration verification (Phase 2, after generating migrations)
After running npx drizzle-kit generate, open drizzle/migrations.js and confirm it imports all migration files in the ./drizzle/ folder including the newly generated ones. Run npx expo start and check the console for SQLite migration errors before proceeding to write any db/mtdOperations.ts code. If migration fails, all subsequent DB calls will crash.

---

FINAL VERIFICATION (run after all phases complete):

1. npx tsc --noEmit — zero errors
2. npm test — all tests pass (mtdDates, mtdTaxCalc, useMtdData)
3. npx expo start — app boots, no runtime errors
4. Bottom nav shows 5 tabs: Home, Invoices, Tax, Budget, Scanner
5. Swipe from left edge opens drawer with Settings, Info, Charts items
6. Settings screen shows all 8 sections: Profile (with UTR/NI/logo), Bank Details, Tax Defaults (rate + add/inclusive toggle + live preview), Invoice & Estimate Numbering, MTD & Tax (enrolled toggle + auto-calc + reminder days), Appearance, Reminders, About
7. Tax tab — with quarterlyTaxEnabled=true: shows mtd-accent header, current quarter stats pulled from invoices + budget, next deadline, 4 nav tiles. With quarterlyTaxEnabled=false: shows enrolment state.
8. Tax tab quarterly stats match the sum of paid invoices + budget expenses for the current quarter — verify by creating a paid invoice and checking the turnover figure updates
9. mtdQuarterlySummary — Income section shows "From invoices: £X" breakdown, expandable to individual invoice list. Expenses section shows "From budget: £Y" breakdown.
10. Marking an invoice as paid triggers the "Add to MTD records?" prompt
11. addMtdTransaction.tsx — income/expense toggle is coloured, quarter helper shows as pill, category picker has allowable/disallowable section divider
12. Home screen shows cross-module insight banner if paid invoices exist that are not yet in MTD records
13. Invoice cards in invoices.tsx have left accent stripe, no full border. All 5 status badges render correctly in light and dark mode.
14. createInvoice.tsx — tax rate pre-populated from settings, invoice number pre-populated from prefix + counter, grand total is text-2xl bold, section dividers are uppercase tracked
15. Settings Tax Defaults live preview updates when rate or mode changes
16. Settings invoice prefix change is reflected in the next new invoice number preview
17. Dark mode: toggle and verify every screen — no unreadable text anywhere
18. Annual estimate summary card has solid mtd-accent background, text-4xl total
19. PDF invoice renders with logo from settings.logoUrl in the header
20. npx tsc --noEmit — still zero errors after all changes
```

## If you read all then before you start working on the app create README.md file with basic information about the app and a create documentation markdown file and document every think on the wey.Do not do everything quick do good.

