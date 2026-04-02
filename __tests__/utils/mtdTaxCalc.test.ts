/**
 * mtdTaxCalc.test.ts
 *
 * Tests for income tax and NI estimation calculations.
 * Pure utility tests — no mocking needed.
 *
 * Depends on: utils/mtdTaxCalc.ts
 */

import {
  estimateTax,
  projectFullYearTax,
  formatGBP,
  formatPercent,
  RATES_2025_26,
} from '@/utils/mtd/mtdTaxCalc';

describe('mtdTaxCalc', () => {
  // ─── estimateTax ─────────────────────────────────────────────────────────

  describe('estimateTax', () => {
    it('returns all zeros for zero income', () => {
      const result = estimateTax(0, 0);
      expect(result.totalIncomeTax).toBe(0);
      expect(result.totalNI).toBe(0);
      expect(result.totalTaxAndNI).toBe(0);
    });

    it('calculates correctly below personal allowance', () => {
      const result = estimateTax(10000, 0);
      // £10,000 profit, below £12,570 personal allowance
      expect(result.taxableProfit).toBe(10000);
      expect(result.totalIncomeTax).toBe(0);
      // No Class 4 NI below lower limit
      expect(result.totalClass4NI).toBe(0);
      // No Class 2 NI below small earnings exception
      expect(result.class2NI).toBe(0);
    });

    it('calculates basic rate tax correctly', () => {
      const result = estimateTax(20000, 0);
      // Taxable profit: £20,000
      // Personal allowance used: £12,570
      // Taxable after allowance: £20,000 - £12,570 = £7,430
      // Basic rate: £7,430 × 20% = £1,486
      expect(result.taxableAfterAllowance).toBe(7430);
      expect(result.basicRateTax).toBeCloseTo(1486, 0);
      expect(result.higherRateTax).toBe(0);
      expect(result.additionalRateTax).toBe(0);
    });

    it('calculates Class 2 NI at threshold', () => {
      const result = estimateTax(12570, 0);
      // Exactly at NI small earnings exception threshold
      expect(result.class2NI).toBe(RATES_2025_26.ni2WeeklyRate * 52);
    });

    it('does not charge Class 2 NI below threshold', () => {
      const result = estimateTax(12569, 0);
      expect(result.class2NI).toBe(0);
    });

    it('calculates higher rate tax correctly', () => {
      const result = estimateTax(60000, 0);
      // Taxable profit: £60,000
      // Personal allowance: £12,570
      // Taxable after allowance: £47,430
      // Basic rate band: £50,270 - £12,570 = £37,700 → taxed at 20%
      // Higher rate band: £47,430 - £37,700 = £9,730 → taxed at 40%
      expect(result.basicRateTax).toBeCloseTo(37700 * 0.2, 0);
      expect(result.higherRateTax).toBeCloseTo(9730 * 0.4, 0);
      expect(result.additionalRateTax).toBe(0);
    });

    it('calculates Class 4 NI correctly', () => {
      const result = estimateTax(30000, 0);
      // Lower band: min(£30,000, £50,270) - £12,570 = £17,430 × 6% = £1,045.80
      expect(result.ni4LowerBand).toBeCloseTo(17430 * 0.06, 2);
      // No upper band
      expect(result.ni4UpperBand).toBe(0);
    });

    it('calculates Class 4 NI upper band for high profits', () => {
      const result = estimateTax(60000, 0);
      // Lower: £50,270 - £12,570 = £37,700 × 6% = £2,262
      // Upper: £60,000 - £50,270 = £9,730 × 2% = £194.60
      expect(result.ni4LowerBand).toBeCloseTo(37700 * 0.06, 2);
      expect(result.ni4UpperBand).toBeCloseTo(9730 * 0.02, 2);
    });

    it('deducts expenses from income', () => {
      const result = estimateTax(30000, 5000);
      expect(result.taxableProfit).toBe(25000);
    });

    it('calculates effective rate', () => {
      const result = estimateTax(50000, 0);
      expect(result.effectiveRate).toBeGreaterThan(0);
      expect(result.effectiveRate).toBeLessThan(100);
    });

    it('calculates quarterly set aside', () => {
      const result = estimateTax(50000, 0);
      expect(result.quarterlySetAside).toBeCloseTo(result.totalTaxAndNI / 4, 2);
    });
  });

  // ─── projectFullYearTax ──────────────────────────────────────────────────

  describe('projectFullYearTax', () => {
    it('multiplies Q1 figures by 4', () => {
      const result = projectFullYearTax(1, 5000, 1000);
      const direct = estimateTax(20000, 4000);
      expect(result.taxableProfit).toBeCloseTo(direct.taxableProfit, 0);
      expect(result.totalIncomeTax).toBeCloseTo(direct.totalIncomeTax, 0);
    });

    it('multiplies Q2 figures by 2', () => {
      const result = projectFullYearTax(2, 10000, 2000);
      const direct = estimateTax(20000, 4000);
      expect(result.taxableProfit).toBeCloseTo(direct.taxableProfit, 0);
    });

    it('Q4 projection equals direct calculation', () => {
      const result = projectFullYearTax(4, 20000, 4000);
      const direct = estimateTax(20000, 4000);
      expect(result.totalTaxAndNI).toBeCloseTo(direct.totalTaxAndNI, 2);
    });
  });

  // ─── formatGBP ───────────────────────────────────────────────────────────

  describe('formatGBP', () => {
    it('formats with pound sign and 2 decimal places', () => {
      expect(formatGBP(1234.5)).toBe('£1,234.50');
    });

    it('formats zero correctly', () => {
      expect(formatGBP(0)).toBe('£0.00');
    });

    it('formats large numbers with commas', () => {
      expect(formatGBP(1000000)).toBe('£1,000,000.00');
    });

    it('formats negative numbers', () => {
      expect(formatGBP(-500)).toBe('£-500.00');
    });
  });

  // ─── formatPercent ───────────────────────────────────────────────────────

  describe('formatPercent', () => {
    it('formats with one decimal place', () => {
      expect(formatPercent(15.5)).toBe('15.5%');
    });

    it('rounds to one decimal place', () => {
      expect(formatPercent(15.55)).toBe('15.6%');
    });
  });

  // ─── RATES_2025_26 ──────────────────────────────────────────────────────

  describe('RATES_2025_26', () => {
    it('has correct personal allowance', () => {
      expect(RATES_2025_26.personalAllowance).toBe(12570);
    });

    it('has correct basic rate threshold', () => {
      expect(RATES_2025_26.basicRateThreshold).toBe(50270);
    });

    it('has correct higher rate threshold', () => {
      expect(RATES_2025_26.higherRateThreshold).toBe(125140);
    });

    it('has correct Class 2 NI weekly rate', () => {
      expect(RATES_2025_26.ni2WeeklyRate).toBe(3.45);
    });
  });
});
