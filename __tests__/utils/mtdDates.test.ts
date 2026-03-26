/**
 * mtdDates.test.ts
 *
 * Tests for UK tax year and quarterly deadline calculations.
 * Pure utility tests — no mocking needed.
 *
 * Depends on: utils/mtdDates.ts
 */

import {
  taxYearForDate,
  taxYearLabel,
  quartersForTaxYear,
  quarterForDate,
  daysUntil,
  deadlineStatus,
  formatDeadline,
  upcomingDeadlines,
  buildTaxYear,
  toISO,
  fromISO,
} from '@/utils/mtdDates';

describe('mtdDates', () => {
  // ─── Date conversions ───────────────────────────────────────────────────

  describe('toISO', () => {
    it('formats a date to YYYY-MM-DD', () => {
      const date = new Date(2025, 7, 15); // Aug 15, 2025
      expect(toISO(date)).toBe('2025-08-15');
    });

    it('pads single-digit months and days', () => {
      const date = new Date(2025, 0, 5); // Jan 5, 2025
      expect(toISO(date)).toBe('2025-01-05');
    });
  });

  describe('fromISO', () => {
    it('parses an ISO string to a Date', () => {
      const result = fromISO('2025-08-15');
      expect(result.getFullYear()).toBe(2025);
      expect(result.getMonth()).toBe(7); // 0-indexed
      expect(result.getDate()).toBe(15);
    });
  });

  // ─── Tax year ────────────────────────────────────────────────────────────

  describe('taxYearForDate', () => {
    it('returns previous year for dates before 6 April', () => {
      const jan = new Date(2025, 0, 15);
      expect(taxYearForDate(jan)).toBe(2024);
    });

    it('returns current year for 5 April (last day of tax year)', () => {
      const apr5 = new Date(2025, 3, 5);
      expect(taxYearForDate(apr5)).toBe(2024);
    });

    it('returns current year for 6 April (first day of new tax year)', () => {
      const apr6 = new Date(2025, 3, 6);
      expect(taxYearForDate(apr6)).toBe(2025);
    });

    it('returns current year for dates after 6 April', () => {
      const jul = new Date(2025, 6, 15);
      expect(taxYearForDate(jul)).toBe(2025);
    });
  });

  describe('taxYearLabel', () => {
    it('formats start year into "YYYY-YY" label', () => {
      expect(taxYearLabel(2025)).toBe('2025-26');
    });

    it('handles century boundary', () => {
      expect(taxYearLabel(2099)).toBe('2099-00');
    });
  });

  // ─── Quarters ────────────────────────────────────────────────────────────

  describe('quartersForTaxYear', () => {
    const quarters = quartersForTaxYear(2025);

    it('returns 4 quarters', () => {
      expect(quarters).toHaveLength(4);
    });

    it('Q1: 6 Apr to 5 Jul, deadline 7 Aug', () => {
      expect(quarters[0].periodStart).toBe('2025-04-06');
      expect(quarters[0].periodEnd).toBe('2025-07-05');
      expect(quarters[0].submissionDeadline).toBe('2025-08-07');
    });

    it('Q2: 6 Jul to 5 Oct, deadline 7 Nov', () => {
      expect(quarters[1].periodStart).toBe('2025-07-06');
      expect(quarters[1].periodEnd).toBe('2025-10-05');
      expect(quarters[1].submissionDeadline).toBe('2025-11-07');
    });

    it('Q3: 6 Oct to 5 Jan+1, deadline 7 Feb+1', () => {
      expect(quarters[2].periodStart).toBe('2025-10-06');
      expect(quarters[2].periodEnd).toBe('2026-01-05');
      expect(quarters[2].submissionDeadline).toBe('2026-02-07');
    });

    it('Q4: 6 Jan+1 to 5 Apr+1, deadline 7 May+1', () => {
      expect(quarters[3].periodStart).toBe('2026-01-06');
      expect(quarters[3].periodEnd).toBe('2026-04-05');
      expect(quarters[3].submissionDeadline).toBe('2026-05-07');
    });
  });

  describe('quarterForDate', () => {
    it('returns Q1 for a date in April', () => {
      const date = new Date(2025, 3, 20); // Apr 20
      const q = quarterForDate(date);
      expect(q.quarter).toBe(1);
    });

    it('returns Q2 for a date in August', () => {
      const date = new Date(2025, 7, 15); // Aug 15
      const q = quarterForDate(date);
      expect(q.quarter).toBe(2);
    });

    it('returns Q3 for a date in November', () => {
      const date = new Date(2025, 10, 15); // Nov 15
      const q = quarterForDate(date);
      expect(q.quarter).toBe(3);
    });

    it('returns Q4 for a date in February', () => {
      const date = new Date(2026, 1, 15); // Feb 15, 2026
      const q = quarterForDate(date);
      expect(q.quarter).toBe(4);
    });

    it('handles boundary: 5 July is still Q1', () => {
      const date = new Date(2025, 6, 5); // Jul 5
      const q = quarterForDate(date);
      expect(q.quarter).toBe(1);
    });

    it('handles boundary: 6 July is Q2', () => {
      const date = new Date(2025, 6, 6); // Jul 6
      const q = quarterForDate(date);
      expect(q.quarter).toBe(2);
    });
  });

  // ─── Deadlines ───────────────────────────────────────────────────────────

  describe('daysUntil', () => {
    it('returns negative for past dates', () => {
      const yesterday = toISO(new Date(Date.now() - 86400000));
      expect(daysUntil(yesterday)).toBeLessThan(0);
    });

    it('returns 0 for today', () => {
      const today = toISO(new Date());
      expect(daysUntil(today)).toBe(0);
    });

    it('returns positive for future dates', () => {
      const tomorrow = toISO(new Date(Date.now() + 86400000));
      expect(daysUntil(tomorrow)).toBeGreaterThan(0);
    });
  });

  describe('deadlineStatus', () => {
    it('returns overdue for past deadlines', () => {
      const past = toISO(new Date(Date.now() - 86400000));
      expect(deadlineStatus(past)).toBe('overdue');
    });

    it('returns urgent for today', () => {
      const today = toISO(new Date());
      expect(deadlineStatus(today)).toBe('urgent');
    });

    it('returns urgent at 14 days', () => {
      const in14 = toISO(new Date(Date.now() + 14 * 86400000));
      expect(deadlineStatus(in14)).toBe('urgent');
    });

    it('returns soon at 15 days', () => {
      const in15 = toISO(new Date(Date.now() + 15 * 86400000));
      expect(deadlineStatus(in15)).toBe('soon');
    });

    it('returns soon at 30 days', () => {
      const in30 = toISO(new Date(Date.now() + 30 * 86400000));
      expect(deadlineStatus(in30)).toBe('soon');
    });

    it('returns ok at 31 days', () => {
      const in31 = toISO(new Date(Date.now() + 31 * 86400000));
      expect(deadlineStatus(in31)).toBe('ok');
    });

    it('accepts custom urgent/soon thresholds', () => {
      const in7 = toISO(new Date(Date.now() + 7 * 86400000));
      expect(deadlineStatus(in7, 7, 30)).toBe('urgent');
      expect(deadlineStatus(in7, 6, 30)).toBe('soon');
    });
  });

  describe('formatDeadline', () => {
    it('formats ISO date to readable string', () => {
      const result = formatDeadline('2025-08-07');
      expect(result).toBe('7 August 2025');
    });
  });

  // ─── Build tax year ──────────────────────────────────────────────────────

  describe('buildTaxYear', () => {
    it('sets final declaration deadline to Jan 31 two years after start', () => {
      const ty = buildTaxYear(2025);
      expect(ty.finalDeclarationDeadline).toBe('2027-01-31');
    });

    it('includes correct start and end dates', () => {
      const ty = buildTaxYear(2025);
      expect(ty.start).toBe('2025-04-06');
      expect(ty.end).toBe('2026-04-05');
    });
  });

  // ─── Upcoming deadlines ──────────────────────────────────────────────────

  describe('upcomingDeadlines', () => {
    it('returns items sorted ascending by daysUntil', () => {
      const items = upcomingDeadlines(2);
      for (let i = 1; i < items.length; i++) {
        expect(items[i].daysUntil).toBeGreaterThanOrEqual(items[i - 1].daysUntil);
      }
    });

    it('returns at least 4 items for 2 years', () => {
      const items = upcomingDeadlines(2);
      expect(items.length).toBeGreaterThanOrEqual(4);
    });

    it('excludes items older than 90 days', () => {
      const items = upcomingDeadlines(2);
      for (const item of items) {
        expect(item.daysUntil).toBeGreaterThan(-90);
      }
    });

    it('includes both quarterly and final declaration items', () => {
      const items = upcomingDeadlines(2);
      const types = new Set(items.map((i) => i.type));
      expect(types.has('quarterly')).toBe(true);
      expect(types.has('final_declaration')).toBe(true);
    });
  });
});
