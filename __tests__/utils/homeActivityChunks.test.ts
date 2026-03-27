import { chunkIntoPages } from '@/utils/home/homeActivityChunks';

describe('chunkIntoPages', () => {
  it('returns empty array for empty input', () => {
    expect(chunkIntoPages([], 5)).toEqual([]);
  });

  it('returns single page when length <= pageSize', () => {
    expect(chunkIntoPages([1, 2, 3], 5)).toEqual([[1, 2, 3]]);
  });

  it('chunks into pages of 5', () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    expect(chunkIntoPages(items, 5)).toEqual([
      [1, 2, 3, 4, 5],
      [6, 7, 8, 9, 10],
      [11],
    ]);
  });

  it('returns empty for non-positive page size', () => {
    expect(chunkIntoPages([1, 2], 0)).toEqual([]);
  });
});
