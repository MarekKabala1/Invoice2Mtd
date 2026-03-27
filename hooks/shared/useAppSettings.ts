/**
 * useAppSettings.ts
 *
 * Single source for appSettings reads/writes. Every screen that reads
 * settings uses this hook — never read appSettings directly in a screen.
 *
 * Depends on: context/AppSettingsContext
 * Used by: app/(drawer)/settings.tsx, app/(stack)/createInvoice.tsx,
 *          app/(drawer)/(tabs)/tax.tsx, app/(stack)/addMtdTransaction.tsx
 */

import { useAppSettings as useContextSettings } from '@/context/AppSettingsContext';
import { AppSettingsType } from '@/db/zodSchema';

export function useAppSettings() {
  const ctx = useContextSettings();

  return {
    settings: ctx.settings,
    isLoading: ctx.settings === null,
    error: null as string | null,
    updateSettings: ctx.update,
    refresh: ctx.refresh,
  };
}
