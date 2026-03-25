/**
 * mtdTaxCalc.ts
 *
 * ESTIMATES ONLY — not official HMRC calculations.
 * Update RATES_2025_26 each April when rates change.
 * Users can also update rates via Settings → Tax Rates.
 *
 * Depends on: types/mtd.ts (TaxRates, TaxEstimate)
 * Used by: db/mtdOperations.ts (refreshAnnualSummary),
 *          app/(stack)/mtdAnnualEstimate.tsx, app/(drawer)/info.tsx,
 *          app/(drawer)/settings.tsx
 */

import { TaxRates, TaxEstimate } from '@/types/mtd';

export const RATES_2025_26: TaxRates = {
  personalAllowance: 12570,
  basicRateThreshold: 50270,
  higherRateThreshold: 125140,
  basicRate: 0.20,
  higherRate: 0.40,
  additionalRate: 0.45,
  ni4LowerProfitsLimit: 12570,
  ni4UpperProfitsLimit: 50270,
  ni4LowerRate: 0.06,
  ni4UpperRate: 0.02,
  ni2WeeklyRate: 3.45,
  ni2SmallEarningsException: 12570,
};

/**
 * Parses a JSON string from appSettings into TaxRates.
 * Falls back to RATES_2025_26 if null or invalid.
 */
export function parseTaxRates(json: string | null | undefined): TaxRates {
  if (!json) return { ...RATES_2025_26 };
  try {
    const parsed = JSON.parse(json) as Partial<TaxRates>;
    // Validate all required fields exist and are numbers
    const required: (keyof TaxRates)[] = [
      'personalAllowance', 'basicRateThreshold', 'higherRateThreshold',
      'basicRate', 'higherRate', 'additionalRate',
      'ni4LowerProfitsLimit', 'ni4UpperProfitsLimit',
      'ni4LowerRate', 'ni4UpperRate',
      'ni2WeeklyRate', 'ni2SmallEarningsException',
    ];
    for (const key of required) {
      if (typeof parsed[key] !== 'number') return { ...RATES_2025_26 };
    }
    return parsed as TaxRates;
  } catch {
    return { ...RATES_2025_26 };
  }
}

/** Serializes TaxRates to a JSON string for storing in appSettings. */
export function serializeTaxRates(rates: TaxRates): string {
  return JSON.stringify(rates);
}

export const estimateTax = (
  grossIncome: number,
  totalAllowableExpenses: number,
  rates: TaxRates = RATES_2025_26
): TaxEstimate => {
  // WHY: Net profit cannot be negative. If expenses exceed income, profit is 0.
  // HMRC cannot tax a loss in this context — loss relief rules are complex and apply
  // across multiple years, so we simplify to 0 for quarterly estimates.
  const taxableProfit = Math.max(0, grossIncome - totalAllowableExpenses);

  // WHY: Personal allowance reduces taxable income pound-for-pound.
  // Limited to actual profit — can't get a tax refund for unused allowance.
  const personalAllowanceUsed = Math.min(rates.personalAllowance, taxableProfit);
  const taxableAfterAllowance = Math.max(0, taxableProfit - personalAllowanceUsed);

  // WHY: Income tax bands apply in order: basic (20%), higher (40%), additional (45%).
  // Each band only applies to income within its range, calculated as:
  // amount in band = min(remaining income, band limit - previous limit) * rate

  // Basic rate: £0 to £50,270 at 20%
  // Math.min(...) prevents counting income twice if it's also in higher band.
  const basicRateTax = Math.min(
    taxableAfterAllowance,
    rates.basicRateThreshold - rates.personalAllowance
  ) * rates.basicRate;

  // Higher rate: £50,270 to £125,140 at 40%
  // Math.max(0, ...) ensures we don't apply negative income amounts.
  const higherRateTax = Math.min(
    Math.max(0, taxableAfterAllowance - (rates.basicRateThreshold - rates.personalAllowance)),
    rates.higherRateThreshold - rates.basicRateThreshold
  ) * rates.higherRate;

  // Additional rate: above £125,140 at 45%
  const additionalRateTax = Math.max(
    0,
    taxableAfterAllowance - (rates.higherRateThreshold - rates.personalAllowance)
  ) * rates.additionalRate;

  const totalIncomeTax = basicRateTax + higherRateTax + additionalRateTax;

  // WHY: Class 4 NI is profit-based (self-employed tax), not income-based.
  // It has two bands: lower (6% on £12,570–£50,270) and upper (2% on income above £50,270).
  // Different from income tax — uses profit directly (no personal allowance deduction).

  // Class 4 NI — lower band (6% between lower and upper limits)
  const ni4LowerBand = Math.max(
    0,
    Math.min(taxableProfit, rates.ni4UpperProfitsLimit) - rates.ni4LowerProfitsLimit
  ) * rates.ni4LowerRate;

  // Class 4 NI — upper band (2% on profits above upper limit)
  const ni4UpperBand = Math.max(0, taxableProfit - rates.ni4UpperProfitsLimit) * rates.ni4UpperRate;

  const totalClass4NI = ni4LowerBand + ni4UpperBand;

  // WHY: Class 2 NI is a fixed weekly pay (£3.45/week = £179.40/year) if profits ≥ £12,570.
  // Called "small earnings exception" — no NI if profit below this threshold.
  // Calculated as weekly rate × 52 weeks, even though paid quarterly to HMRC.
  const class2NI = taxableProfit >= rates.ni2SmallEarningsException
    ? rates.ni2WeeklyRate * 52
    : 0;

  const totalNI = totalClass4NI + class2NI;
  const totalTaxAndNI = totalIncomeTax + totalNI;
  const effectiveRate = grossIncome > 0 ? (totalTaxAndNI / grossIncome) * 100 : 0;

  // WHY: Quarterly set-aside is simple: divide annual estimate by 4.
  // Users often set aside money each quarter to avoid a tax bill shock at year-end.
  const quarterlySetAside = totalTaxAndNI / 4;

  return {
    grossIncome,
    totalAllowableExpenses,
    taxableProfit,
    personalAllowanceUsed,
    taxableAfterAllowance,
    basicRateTax,
    higherRateTax,
    additionalRateTax,
    totalIncomeTax,
    ni4LowerBand,
    ni4UpperBand,
    totalClass4NI,
    class2NI,
    totalNI,
    totalTaxAndNI,
    effectiveRate,
    quarterlySetAside,
  };
};

export const projectFullYearTax = (
  currentQuarter: 1 | 2 | 3 | 4,
  incomeToDate: number,
  expensesToDate: number,
  rates: TaxRates = RATES_2025_26
): TaxEstimate => {
  const multiplier = 4 / currentQuarter;
  return estimateTax(incomeToDate * multiplier, expensesToDate * multiplier, rates);
};

export const formatGBP = (amount: number): string =>
  `£${amount.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const formatPercent = (rate: number): string =>
  `${rate.toFixed(1)}%`;
