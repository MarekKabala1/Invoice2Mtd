/**
 * mtdDates.ts
 *
 * Pure utility functions for UK tax year and quarterly deadline calculations.
 * No React Native or Expo imports — fully testable in Node.
 *
 * Depends on: types/mtd.ts (TaxQuarter, TaxYear, DeadlineStatus, DeadlineItem)
 * Used by: db/mtdOperations.ts, hooks/useMtdData.ts, hooks/useMtdDeadlines.ts,
 *          app/(drawer)/(tabs)/tax.tsx, app/(stack)/mtdDeadlines.tsx
 *
 * UK tax year runs 6 April → 5 April. The four MTD quarterly deadlines are
 * fixed dates set by HMRC — they do not shift for weekends or bank holidays.
 */

import { format, parseISO, differenceInCalendarDays } from 'date-fns';
import { TaxQuarter, TaxYear, DeadlineStatus, DeadlineItem } from '@/types/mtd';

// ─── Date conversions ────────────────────────────────────────────────────────

export const toISO = (date: Date): string => format(date, 'yyyy-MM-dd');

export const fromISO = (s: string): Date => parseISO(s);

// ─── Tax year ────────────────────────────────────────────────────────────────

export const taxYearForDate = (date: Date): number => {
  const year = date.getFullYear();
  // WHY: UK tax year starts 6 April because of historical tax collection.
  // April 6 was originally the start of the "year of account" for tax purposes.
  // Important: This is NOT a calendar year. Tax years are always Apr 6 → Apr 5.
  // Example: 2025-06-15 is in tax year 2025 (which runs Apr 6 2025 to Apr 5 2026).
  const taxYearStart = new Date(year, 3, 6); // April is month 3 (0-indexed)
  return date < taxYearStart ? year - 1 : year;
};

export const taxYearLabel = (startYear: number): string =>
  `${startYear}-${String(startYear + 1).slice(-2)}`;

export const currentTaxYearStart = (): number => taxYearForDate(new Date());

// ─── Quarters ────────────────────────────────────────────────────────────────

// WHY: Fixed quarter boundaries (April 6, July 6, Oct 6, Jan 6) are set by HMRC
// for MTD quarterly reporting. These are NOT calendar quarters, but rather
// 3-month reporting periods that align with the UK tax year structure.
// Submission deadlines are approximately 1 month after each quarter ends (HMRC rule).
// Deadlines do NOT shift for weekends or holidays — the dates are absolute.
export const quartersForTaxYear = (startYear: number): TaxQuarter[] => {
  const year2 = startYear + 1;
  const ty = taxYearLabel(startYear);

  return [
    {
      quarter: 1,
      taxYear: ty,
      periodStart: `${startYear}-04-06`,
      periodEnd: `${startYear}-07-05`,
      submissionDeadline: `${startYear}-08-07`,
      label: `Q1 — 6 Apr to 5 Jul ${startYear}`,
    },
    {
      quarter: 2,
      taxYear: ty,
      periodStart: `${startYear}-07-06`,
      periodEnd: `${startYear}-10-05`,
      submissionDeadline: `${startYear}-11-07`,
      label: `Q2 — 6 Jul to 5 Oct ${startYear}`,
    },
    {
      quarter: 3,
      taxYear: ty,
      periodStart: `${startYear}-10-06`,
      periodEnd: `${year2}-01-05`,
      submissionDeadline: `${year2}-02-07`,
      label: `Q3 — 6 Oct to 5 Jan ${year2}`,
    },
    {
      quarter: 4,
      taxYear: ty,
      periodStart: `${year2}-01-06`,
      periodEnd: `${year2}-04-05`,
      submissionDeadline: `${year2}-05-07`,
      label: `Q4 — 6 Jan to 5 Apr ${year2}`,
    },
  ];
};

export const buildTaxYear = (startYear: number): TaxYear => {
  const quarters = quartersForTaxYear(startYear);
  const year2 = startYear + 1;
  return {
    label: taxYearLabel(startYear),
    start: `${startYear}-04-06`,
    end: `${year2}-04-05`,
    // Final declaration appears the day after tax year ends (Apr 5)
    // For tax year 2025-26 (ends Apr 5 2026): visible from Apr 5 2026
    finalDeclarationStart: `${year2}-04-05`,
    // Final declaration deadline: Jan 31 the year after tax year ends
    // For tax year 2025-26: deadline Jan 31 2027
    finalDeclarationDeadline: `${startYear + 2}-01-31`,
    quarters,
  };
};

export const currentTaxYear = (): TaxYear => buildTaxYear(currentTaxYearStart());

export const quarterForDate = (date: Date): TaxQuarter => {
  const ty = taxYearForDate(date);
  const quarters = quartersForTaxYear(ty);
  const dateISO = toISO(date);
  for (const q of quarters) {
    if (dateISO >= q.periodStart && dateISO <= q.periodEnd) {
      return q;
    }
  }
  // Fallback — should not happen for valid dates
  return quarters[3];
};

// ─── Deadlines ───────────────────────────────────────────────────────────────

export const daysUntil = (isoDeadline: string): number =>
  differenceInCalendarDays(fromISO(isoDeadline), new Date());

export const deadlineStatus = (isoDeadline: string, urgentDays = 14, soonDays = 30): DeadlineStatus => {
  const d = daysUntil(isoDeadline);
  if (d < 0) return 'overdue';
  if (d <= urgentDays) return 'urgent';
  if (d <= soonDays) return 'soon';
  return 'ok';
};

export const formatDeadline = (isoDeadline: string): string => {
  const d = fromISO(isoDeadline);
  return format(d, 'd MMMM yyyy');
};

export const upcomingDeadlines = (lookAheadYears = 2): DeadlineItem[] => {
  const items: DeadlineItem[] = [];
  const startYear = currentTaxYearStart();

  for (let offset = 0; offset < lookAheadYears; offset++) {
    const ty = buildTaxYear(startYear + offset);

    // Quarterly deadlines
    for (const q of ty.quarters) {
      const days = daysUntil(q.submissionDeadline);
      // WHY: Show deadlines up to 90 days past due. This helps users notice if they've
      // missed a deadline so they can file late (with potential penalties). Hiding old
      // deadlines creates a false sense that they're not required (they are).
      if (days > -90) {
        items.push({
          type: 'quarterly',
          label: q.label,
          deadline: q.submissionDeadline,
          deadlineFormatted: formatDeadline(q.submissionDeadline),
          daysUntil: days,
          status: deadlineStatus(q.submissionDeadline),
          taxYear: ty.label,
          quarter: q.quarter,
        });
      }
    }

    // WHY: Final declaration becomes visible and actionable from Q4 start (Jan 6).
    // Users complete their tax year at April 5, but HMRC requires final return by Jan 31
    // the next year. We only show this deadline after Q4 begins (Jan 6), giving users
    // time to finalize numbers after year-end. Before Q4, it's too early.
    // Why Jan 31? It's 9 months after tax year end (Apr 5) — HMRC standard deadline.
    const today = toISO(new Date());
    const q4 = ty.quarters[3]; // Q4 starts Jan 6 year after start
    if (q4 && today >= q4.periodStart) {
      const fdDays = daysUntil(ty.finalDeclarationDeadline);
      // Why -90 lookback? Include overdue deadlines up to 3 months past.
      // Users may not have filed, so we show them even if late.
      if (fdDays > -90) {
        items.push({
          type: 'final_declaration',
          label: `Final declaration — ${ty.label}`,
          deadline: ty.finalDeclarationDeadline,
          deadlineFormatted: formatDeadline(ty.finalDeclarationDeadline),
          daysUntil: fdDays,
          status: deadlineStatus(ty.finalDeclarationDeadline),
          taxYear: ty.label,
        });
      }
    }
  }

  return items.sort((a, b) => a.daysUntil - b.daysUntil);
};
