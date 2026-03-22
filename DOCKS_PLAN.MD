Write a comprehensive DOCUMENTATION.md file at the root of the project.

Read every single file in the project before writing anything — do not guess or assume. Read the actual implementation in every hook, utility, screen, component, and DB operation file. If you cannot read a file, say so before continuing.

While reading, actively look for anything that does not make sense — bugs, inconsistencies, missing error handling, wrong types, dead code, functions that do not match their name, hooks that bypass the data layer, screens that call DB directly, missing null checks, incorrect quarter calculations, wrong date formats, or anything that would cause silent failures. Fix every issue you find as you go. Do not document broken code — fix it first, then document the fixed version. For every fix applied, add a note in the documentation under a dedicated section called "Fixes Applied During Documentation" that describes what was wrong, which file it was in, and what was changed.

Structure the document exactly like this:

---

# Project Documentation

## Overview
What the app does, who it is for, and how the three modules (Invoice, Budget, MTD) work together as one system. Explain the core principle that MTD reads from invoices and budget automatically — the user never enters the same data twice.

## Architecture
How data flows through the app. Screen → Hook → DB Operations → Drizzle → SQLite. Explain why this layering exists and what each layer is responsible for. Explain the three-way sync between Invoice, Transactions, and MtdTransactions and why all sync operations go through utils/invoiceSyncOperations.ts.

## Navigation Structure
The full drawer + tabs + stack hierarchy. Which screens live where and why.

---

## Fixes Applied During Documentation

For every issue found and fixed while reading the codebase, add an entry:

### Fix N — Short description
**File:** path/to/file.ts
**Problem:** What was wrong and why it would cause a bug or silent failure.
**Fix:** What was changed and why the fix is correct.
**Commit:** [FIX] Description matching the fix

---

## Hooks

For every hook in hooks/ write:

### useHookName
**File:** hooks/useHookName.ts
**Purpose:** One sentence — what problem this hook solves.
**Used by:** Every screen or component that calls this hook.

**What it does:**
Step by step — what happens on mount, what DB calls it makes, what state it manages.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|

**Returns:**
| Field | Type | Description |
|-------|------|-------------|

**Loading state:** What triggers isLoading = true and when it clears.
**Error state:** What sets error and what the caller should do.
**Refresh:** What calling refresh() does and when to call it.
**Side effects:** Any DB writes, context updates, or cascading operations.

**Example:**
Real usage example from the codebase.

---

## Database Operations

For every function in db/invoiceOperations.ts, db/mtdOperations.ts, db/queries.ts, utils/invoiceSyncOperations.ts write:

### functionName()
**File:** db/filename.ts
**Purpose:** One sentence.

**What it does:**
Step by step — every query, every write, every calculation, every conditional branch.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|

**Returns:** Shape and contents of the return value.
**Tables read:** Every table queried.
**Tables written:** Every table inserted, updated, or deleted.
**Throws:** When and why.
**Called by:** Which hooks call this.

---

## Utility Functions

For every function in utils/ write:

### functionName()
**File:** utils/filename.ts
**Purpose:** One sentence.
**Pure function:** Yes or No.

**What it does:**
Explain the logic fully. For date functions explain the UK tax year rules. For tax calculations explain the HMRC rate bands step by step. For category mapping explain why each budget category maps to which HMRC field and what the fallback is.

**Parameters and returns:** Same table format.

**Example:**
Real input → expected output.

---

## Screens

For every screen in app/ write:

### ScreenName
**File:** full path
**Navigator:** Drawer / Tab / Stack

**Purpose:** What the user does here.

**Data sources:**
Every hook this screen calls and what it gets.

**User actions:**
Every action available and exactly what happens — DB writes, navigation, sync operations, confirmations.

**Empty state:** What renders when there is no data.
**Loading state:** What renders while loading.
**Error state:** What renders on error.

---

## Components

For every component in components/ write:

### ComponentName
**File:** components/ComponentName.tsx
**Purpose:** What it renders and why it is a separate component.

**Props:**
| Name | Type | Required | Description |
|------|------|----------|-------------|

**Behaviour:** Internal state, conditional rendering, animations, callbacks.

---

## Database Schema

For every table in db/schema.ts write:

### TableName
**Purpose:** What this table stores and why.

**Columns:**
| Column | Type | Default | Description |
|--------|------|---------|-------------|

**Relationships:** Foreign keys and what they link to.
**Indexes:** Unique indexes and why they exist.
**Design decisions:** Non-obvious choices — why personalAllowanceUsed is a snapshot, why invoiceId on MtdTransactions is nullable, why the uniqueIndex on MtdQuarterlySummary includes userId, why applyTaxByDefault and defaultNotes were added as separate columns rather than extending another table.

---

## Three-Way Sync — Invoice, Budget, MTD

Exact step-by-step description of every sync direction:

**Mark invoice as paid:**
1. Confirmation modal opens pre-filled with invoice.dueDate as payment date
2. User can change date — quarter preview updates live via quarterForDate()
3. On confirm: Invoice.isPayed = true, Transactions row created, MtdTransactions row created linked via invoiceId and transactionId, refreshCurrentYear() called

**Mark invoice as unpaid:**
1. Warning shown
2. On confirm: MtdTransactions row deleted (found via invoiceId), Transactions row deleted (found via transactionId on MtdTransactions row), Invoice.isPayed = false, refreshCurrentYear() called

**Delete from Budget (Transactions):**
1. Warning shown if linked invoice exists
2. On confirm: MtdTransactions row deleted (found via transactionId), Invoice.isPayed = false if invoiceId was on the MtdTransactions row, Transactions row deleted, refreshCurrentYear() called

**Delete from MTD (MtdTransactions):**
1. Warning shown if linked invoice exists
2. On confirm: Transactions row deleted (found via transactionId), Invoice.isPayed = false if invoiceId was present, MtdTransactions row deleted, refreshCurrentYear() called

**Delete invoice directly:**
1. Warning listing what will also be deleted
2. On confirm: MtdTransactions row deleted, Transactions row deleted, Invoice row deleted, refreshCurrentYear() called

Document the atomicity guarantee — what happens if one step fails mid-sequence and how the rollback works.

---

## MTD Tax Calculations

Full step-by-step explanation of estimateTax():
- Net profit = max(0, grossIncome - totalAllowableExpenses)
- Taxable profit = max(0, netProfit - personalAllowance)
- Basic rate tax = min(taxableProfit, basicRateThreshold - personalAllowance) × basicRate
- Higher rate tax = max(0, min(taxableProfit - basicBand, higherBand)) × higherRate
- Additional rate tax = max(0, taxableProfit - basicBand - higherBand) × additionalRate
- Class 4 NI lower = max(0, min(netProfit, ni4UpperProfitsLimit) - ni4LowerProfitsLimit) × ni4LowerRate
- Class 4 NI upper = max(0, netProfit - ni4UpperProfitsLimit) × ni4UpperRate
- Class 2 NI = ni2WeeklyRate × 52 if netProfit >= ni2SmallEarningsException else 0
- effectiveRate = totalTaxAndNI / grossIncome (0 if grossIncome is 0)
- estimatedQuarterlyTax = totalTaxAndNI / 4

Explain projectFullYearTax() — why multiplying by 4/currentQuarter gives a full-year projection and when this is used vs estimateTax().

Explain why personalAllowanceUsed is stored as a snapshot on MtdAnnualSummary.

How to update rates each April — exact steps, which files change, what to search-and-replace, what to commit.

---

## UK Tax Year Reference

Full calendar documentation:
- Tax year 6 April → 5 April
- How taxYearForDate() determines which tax year a date belongs to — the 6 April boundary logic
- All four quarterly periods and deadlines — exact dates
- How quarterForDate() works — ISO string comparison against periodStart and periodEnd
- finalDeclarationDeadline = startYear + 2, January 31
- How deadlineStatus() classifies deadlines — urgentDays from appSettings.quarterlyTaxReminderDays not hardcoded
- MTD income thresholds by year

---

## Settings Reference

Every field in appSettings with:
- What it controls in the UI
- Where it is set (which settings section)
- Which screens and hooks read it
- The default value and why that default was chosen
- Whether it requires a code change when HMRC updates rates

---

## Git Conventions

Commit prefix table, message format, cadence by phase, staging rules, phase tags, upstream sync — from AGENTS.md.

---

## Maintenance Checklist — Every April

- Update RATES_2025_26 in utils/mtdTaxCalc.ts
- Rename the const to the new year
- Search and replace all references
- Update rates tables in AGENTS.md and DOCUMENTATION.md
- Verify MTD income thresholds are unchanged
- Verify quarterly deadline dates are unchanged
- Run npm test — all tax calculation tests must pass with new rates
- Commit: [MTD] Update tax rates for YYYY-YY

---

After writing the full document, go back through every section and verify:
- No function is documented as doing something different from what the code actually does
- No hook is documented as returning a field that does not exist in the implementation
- No screen is documented as using a hook that it does not actually import
- No DB function is documented as writing to a table it does not actually write to

If any discrepancy is found between the documentation and the code, fix the code to match the intended behaviour described in MASTER_PLAN.md, add it to the Fixes Applied section, and update the documentation to reflect the fix.