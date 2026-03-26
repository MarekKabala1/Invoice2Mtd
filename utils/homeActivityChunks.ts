/**
 * homeActivityChunks.ts
 *
 * Splits a flat activity list into fixed-size pages for the Home screen
 * horizontal pager (5 items per swipe).
 *
 * Depends on: (none)
 * Used by: app/(drawer)/(tabs)/home.tsx
 */

export function chunkIntoPages<T>(items: T[], pageSize: number): T[][] {
  if (pageSize <= 0) return [];
  const pages: T[][] = [];
  for (let i = 0; i < items.length; i += pageSize) {
    pages.push(items.slice(i, i + pageSize));
  }
  return pages;
}
