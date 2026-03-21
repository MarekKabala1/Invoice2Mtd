import {
  calculateEstimateTotals,
  calculateEstimateTotal,
} from '@/utils/estimateCalculations';

describe('Estimate Calculations', () => {
  describe('calculateEstimateTotals', () => {
    it('should calculate totals without discount', () => {
      const result = calculateEstimateTotals(100, 20, 0, true);

      expect(result.subtotal).toBe(100);
      expect(result.discountAmount).toBe(0);
      expect(result.amountAfterDiscount).toBe(100);
      expect(result.tax).toBe(20); // 20% of 100
      expect(result.total).toBe(120); // 100 + 20 (taxValue true)
    });

    it('should calculate totals with discount', () => {
      const result = calculateEstimateTotals(100, 20, 10, true);

      expect(result.subtotal).toBe(100);
      expect(result.discountAmount).toBe(10); // 10% of 100
      expect(result.amountAfterDiscount).toBe(90);
      expect(result.tax).toBe(18); // 20% of 90
      expect(result.total).toBe(108); // 90 + 18 (taxValue true)
    });

    it('should subtract tax when taxValue is false', () => {
      const result = calculateEstimateTotals(100, 20, 0, false);

      expect(result.subtotal).toBe(100);
      expect(result.tax).toBe(20);
      expect(result.total).toBe(80); // 100 - 20 (taxValue false)
    });

    it('should handle zero tax rate', () => {
      const result = calculateEstimateTotals(100, 0, 10, true);

      expect(result.subtotal).toBe(100);
      expect(result.discountAmount).toBe(10);
      expect(result.amountAfterDiscount).toBe(90);
      expect(result.tax).toBe(0);
      expect(result.total).toBe(90);
    });

    it('should handle default values', () => {
      const result = calculateEstimateTotals(100, 10);

      expect(result.subtotal).toBe(100);
      expect(result.discountAmount).toBe(0);
      expect(result.amountAfterDiscount).toBe(100);
      expect(result.tax).toBe(10);
      expect(result.total).toBe(90); // taxValue defaults to false
    });

    it('should handle decimal numbers', () => {
      const result = calculateEstimateTotals(100.5, 10, 5.5, true);

      expect(result.subtotal).toBe(100.5);
      expect(result.discountAmount).toBeCloseTo(5.5275, 4); // 100.5 * 5.5 / 100
      expect(result.amountAfterDiscount).toBeCloseTo(94.9725, 4);
      expect(result.tax).toBeCloseTo(9.49725, 4); // 10% of 94.9725
      expect(result.total).toBeCloseTo(104.46975, 4); // 94.9725 + 9.49725
    });

    it('should handle large numbers', () => {
      const result = calculateEstimateTotals(1000000, 20, 0, true);

      expect(result.subtotal).toBe(1000000);
      expect(result.tax).toBe(200000);
      expect(result.total).toBe(1200000);
    });
  });

  describe('calculateEstimateTotal', () => {
    it('should calculate totals from multiple estimates', () => {
      const estimates = [
        {
          id: '1',
          customerId: 'c1',
          userId: 'u1',
          estimateDate: '2024-01-01',
          estimateEndTime: '2024-01-31',
          currency: 'GBP',
          amountBeforeTax: 100,
          amountAfterTax: 110,
          taxRate: 10,
          taxValue: true,
          createdAt: '2024-01-01',
          isAccepted: false,
        },
        {
          id: '2',
          customerId: 'c2',
          userId: 'u2',
          estimateDate: '2024-01-02',
          estimateEndTime: '2024-01-31',
          currency: 'GBP',
          amountBeforeTax: 200,
          amountAfterTax: 220,
          taxRate: 10,
          taxValue: true,
          createdAt: '2024-01-02',
          isAccepted: false,
        },
      ];

      const result = calculateEstimateTotal(estimates);

      expect(result.totalBeforeTax).toBe(300);
      expect(result.totalAfterTax).toBe(330);
      expect(result.taxToPay).toBe(30); // 330 - 300
    });

    it('should handle empty estimates', () => {
      const result = calculateEstimateTotal([]);

      expect(result.totalBeforeTax).toBe(0);
      expect(result.totalAfterTax).toBe(0);
      expect(result.taxToPay).toBe(0);
    });

    it('should handle estimates with missing amounts', () => {
      const estimates = [
        {
          id: '1',
          customerId: 'c1',
          userId: 'u1',
          estimateDate: '2024-01-01',
          estimateEndTime: '2024-01-31',
          currency: 'GBP',
          amountBeforeTax: 0,
          amountAfterTax: 0,
          taxRate: 10,
          taxValue: true,
          createdAt: '2024-01-01',
          isAccepted: false,
        },
      ];

      const result = calculateEstimateTotal(estimates);

      expect(result.totalBeforeTax).toBe(0);
      expect(result.totalAfterTax).toBe(0);
      expect(result.taxToPay).toBe(0);
    });
  });
});