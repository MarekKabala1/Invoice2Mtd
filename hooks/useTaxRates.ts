/**
 * useTaxRates.ts
 *
 * Reads the current HMRC tax rates from appSettings. Falls back to
 * RATES_2025_26 if no custom rates are saved.
 *
 * Depends on: context/AppSettingsContext.tsx, utils/mtdTaxCalc.ts
 * Used by: app/(drawer)/(tabs)/tax.tsx, app/(stack)/mtdQuarterlySummary.tsx,
 *          app/(stack)/mtdAnnualEstimate.tsx, app/(drawer)/info.tsx,
 *          db/mtdOperations.ts (via passing rates parameter)
 */

import { useAppSettings } from '@/context/AppSettingsContext';
import { parseTaxRates, RATES_2025_26 } from '@/utils/mtdTaxCalc';
import { TaxRates } from '@/types/mtd';

export function useTaxRates(): TaxRates {
  const { settings } = useAppSettings();
  return parseTaxRates(settings?.taxRatesJson);
}

/**
 * Non-hook version for use outside React components (e.g. in db operations).
 * Takes the raw JSON string from appSettings.
 */
export function getTaxRatesFromJson(taxRatesJson: string | null | undefined): TaxRates {
  return parseTaxRates(taxRatesJson);
}
