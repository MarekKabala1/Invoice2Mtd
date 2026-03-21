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
  // UK tax year starts 6 April. Before that date = previous tax year.
  const taxYearStart = new Date(year, 3, 6); // April is month 3 (0-indexed)
  return date < taxYearStart ? year - 1 : year;
};

export const taxYearLabel = (startYear: number): string =>
  `${startYear}-${String(startYear + 1).slice(-2)}`;

export const currentTaxYearStart = (): number => taxYearForDate(new Date());

// ─── Quarters ────────────────────────────────────────────────────────────────

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
  return {
    label: taxYearLabel(startYear),
    start: `${startYear}-04-06`,
    end: `${startYear + 1}-04-05`,
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

    // Final declaration
    const fdDays = daysUntil(ty.finalDeclarationDeadline);
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

  return items.sort((a, b) => a.daysUntil - b.daysUntil);
};
