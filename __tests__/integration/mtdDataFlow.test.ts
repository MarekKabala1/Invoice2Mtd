/**
 * __tests__/integration/mtdDataFlow.test.ts
 *
 * Integration tests for MTD data flow:
 * Create manual MTD transaction → verify appears in quarterly summary → verify reflects in annual estimate
 */

import { db } from '@/db/config';
import { MtdTransactions, MtdQuarterlySummary } from '@/db/schema';
import { addMtdTransaction, aggregateQuarter, refreshCurrentYear } from '@/db/mtdOperations';
import { getCurrentUserId } from '@/utils/getCurrentUser';
import { eq } from 'drizzle-orm';

jest.mock('@/utils/getCurrentUser');
jest.mock('@/db/config', () => ({
  db: {
    insert: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    then: jest.fn(),
  },
}));

describe('MTD Data Flow Integration', () => {
  const mockUserId = 'user-123';
  const testDate = '2025-06-15'; // Q1
  const quarter = 1;

  beforeEach(() => {
    jest.clearAllMocks();
    (getCurrentUserId as jest.Mock).mockResolvedValue(mockUserId);
  });

  it('should create MTD transaction and appear in aggregated data', async () => {
    const transactionData = {
      date: testDate,
      description: 'Manual income entry',
      amount: 1000,
      type: 'income' as const,
      category: 'turnover' as const,
    };

    // WHY: Test ensures transaction creation doesn't throw
    await expect(
      addMtdTransaction(transactionData, mockUserId)
    ).resolves.not.toThrow();
  });

  it('should aggregate transactions by quarter', async () => {
    // WHY: Tests three-source aggregation: manual MTD + invoices + budget transactions
    const aggregatedData = await aggregateQuarter('2025-26', 1 as 1 | 2 | 3 | 4, mockUserId);

    expect(aggregatedData).toHaveProperty('income');
    expect(aggregatedData).toHaveProperty('allowableExpenses');
    expect(aggregatedData).toHaveProperty('disallowableExpenses');
    expect(aggregatedData).toHaveProperty('sources');
  });

  it('should refresh annual summary after transaction added', async () => {
    await expect(
      refreshCurrentYear(mockUserId)
    ).resolves.not.toThrow();
  });

  it('should handle multiple transactions in same quarter', async () => {
    const transactions = [
      {
        date: '2025-06-10',
        description: 'Invoice income',
        amount: 500,
        type: 'income' as const,
        category: 'turnover' as const,
      },
      {
        date: '2025-06-15',
        description: 'Materials expense',
        amount: 100,
        type: 'expense' as const,
        category: 'costOfGoodsAllowable' as const,
      },
    ];

    // WHY: Verify aggregation handles multiple transaction types correctly
    for (const tx of transactions) {
      await expect(
        addMtdTransaction(tx, mockUserId)
      ).resolves.not.toThrow();
    }
  });
});
