/**
 * useMtdDeadlines.ts
 *
 * MTD deadline computation hook. No DB calls — pure computation.
 * Returns 3 groups: overdue, thisQuarter (current deadline), upcoming.
 *
 * Depends on: utils/mtdDates.ts
 * Used by: app/(drawer)/(tabs)/tax.tsx, app/(stack)/mtdDeadlines.tsx
 */

import { useMemo } from 'react';
import { upcomingDeadlines, quarterForDate, toISO } from '@/utils/mtdDates';
import { DeadlineItem } from '@/types/mtd';

interface UseMtdDeadlinesResult {
  deadlines: DeadlineItem[];
  overdue: DeadlineItem[];
  thisQuarter: DeadlineItem[];
  upcoming: DeadlineItem[];
  nextDeadline: DeadlineItem | null;
}

export const useMtdDeadlines = (lookAheadYears = 2): UseMtdDeadlinesResult => {
  return useMemo(() => {
    const all = upcomingDeadlines(lookAheadYears);
    const today = toISO(new Date());
    const currentQ = quarterForDate(new Date());

    const overdue = all.filter((d) => d.status === 'overdue');

    // "This quarter" = the current quarter's deadline + final declaration
    // if within 30 days or urgent
    const thisQuarter = all.filter((d) => {
      if (d.status === 'overdue') return false;
      if (d.status === 'urgent' || d.status === 'soon') return true;
      // Show current quarter's deadline even if it's further out
      if (d.type === 'quarterly' && d.quarter === currentQ.quarter && d.taxYear === currentQ.taxYear) {
        return true;
      }
      return false;
    });

    // Everything else is "upcoming" — just the deadline card, no data shown
    const upcoming = all.filter((d) => {
      if (d.status === 'overdue') return false;
      if (d.status === 'urgent' || d.status === 'soon') return false;
      // Exclude current quarter
      if (d.type === 'quarterly' && d.quarter === currentQ.quarter && d.taxYear === currentQ.taxYear) {
        return false;
      }
      return true;
    });

    // Next deadline is the first non-overdue item
    const nextDeadline =
      all.find((d) => d.status !== 'overdue') ?? (all.length > 0 ? all[0] : null);

    return {
      deadlines: all,
      overdue,
      thisQuarter,
      upcoming,
      nextDeadline,
    };
  }, [lookAheadYears]);
};
