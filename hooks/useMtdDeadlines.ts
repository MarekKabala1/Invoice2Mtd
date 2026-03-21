/**
 * useMtdDeadlines.ts
 *
 * MTD deadline computation hook. No DB calls — pure computation.
 * Uses useMemo for performance.
 *
 * Depends on: utils/mtdDates.ts
 * Used by: app/(drawer)/(tabs)/tax.tsx, app/(stack)/mtdDeadlines.tsx
 */

import { useMemo } from 'react';
import { upcomingDeadlines } from '@/utils/mtdDates';
import { DeadlineItem } from '@/types/mtd';

interface UseMtdDeadlinesResult {
  deadlines: DeadlineItem[];
  overdue: DeadlineItem[];
  urgent: DeadlineItem[];
  upcoming: DeadlineItem[];
  nextDeadline: DeadlineItem | null;
}

export const useMtdDeadlines = (lookAheadYears = 2): UseMtdDeadlinesResult => {
  return useMemo(() => {
    const all = upcomingDeadlines(lookAheadYears);

    const overdue = all.filter((d) => d.status === 'overdue');
    const urgent = all.filter((d) => d.status === 'urgent');
    const upcoming = all.filter((d) => d.status === 'soon' || d.status === 'ok');

    // Next deadline is the first non-overdue item, or the first item if all overdue
    const nextDeadline =
      all.find((d) => d.status !== 'overdue') ?? (all.length > 0 ? all[0] : null);

    return {
      deadlines: all,
      overdue,
      urgent,
      upcoming,
      nextDeadline,
    };
  }, [lookAheadYears]);
};
