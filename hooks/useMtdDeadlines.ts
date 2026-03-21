/**
 * useMtdDeadlines.ts
 *
 * MTD deadline computation hook. No DB calls — pure computation.
 * Returns 4 groups: overdue, thisQuarter, endOfYear (final declaration), upcoming.
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
  endOfYear: DeadlineItem[];
  upcoming: DeadlineItem[];
  nextDeadline: DeadlineItem | null;
}

export const useMtdDeadlines = (lookAheadYears = 2): UseMtdDeadlinesResult => {
  return useMemo(() => {
    const all = upcomingDeadlines(lookAheadYears);
    const currentQ = quarterForDate(new Date());

    // 1. Overdue — past deadlines
    const overdue = all.filter((d) => d.status === 'overdue');

    // 2. This quarter — active quarter deadline or urgent/soon quarters
    const thisQuarter = all.filter((d) => {
      if (d.status === 'overdue') return false;
      if (d.type === 'final_declaration') return false;
      // Urgent (≤14 days) or soon (≤30 days)
      if (d.status === 'urgent' || d.status === 'soon') return true;
      // Current quarter even if further out
      if (d.quarter === currentQ.quarter && d.taxYear === currentQ.taxYear) return true;
      return false;
    });

    // 3. End of year — final declaration (after Q4, before deadline)
    const endOfYear = all.filter((d) => {
      if (d.type !== 'final_declaration') return false;
      if (d.status === 'overdue') return false;
      return true;
    });
    // Also add overdue final declarations to the overdue group
    const overdueFinalDecl = all.filter((d) => d.type === 'final_declaration' && d.status === 'overdue');

    // 4. Upcoming — far future quarters only
    const upcoming = all.filter((d) => {
      if (d.status === 'overdue') return false;
      if (d.type === 'final_declaration') return false;
      if (d.status === 'urgent' || d.status === 'soon') return false;
      if (d.quarter === currentQ.quarter && d.taxYear === currentQ.taxYear) return false;
      return true;
    });

    // Next deadline
    const nextDeadline =
      all.find((d) => d.status !== 'overdue') ?? (all.length > 0 ? all[0] : null);

    return {
      deadlines: all,
      overdue: [...overdue, ...overdueFinalDecl],
      thisQuarter,
      endOfYear,
      upcoming,
      nextDeadline,
    };
  }, [lookAheadYears]);
};
