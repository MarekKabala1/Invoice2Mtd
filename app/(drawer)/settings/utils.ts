/**
 * Settings utility functions
 *
 * Provides helpers for settings management, including:
 * - Applying default values to settings objects
 * - Type-safe field access
 */

import { AppSettingsType } from '@/db/zodSchema';

/**
 * Apply default values to app settings
 * Ensures no undefined values in production
 */
export const applyDefaults = (settings: AppSettingsType | null): AppSettingsType => {
	const defaults: AppSettingsType = {
		id: settings?.id,
		userId: settings?.userId,
		defaultPaymentTerms: 30,
		defaultVatRate: 20,
		invoicePrefix: 'INV',
		nextInvoiceNumber: 1,
		estimatePrefix: 'EST',
		nextEstimateNumber: 1,
		currency: 'GBP',
		dateFormat: 'DD/MM/YYYY',
		numberFormat: 'en-GB',
		autoCalculateQuarters: true,
		quarterlyTaxEnabled: true,
		quarterStartMonths: '1,4,7,10',
		quarterlyTaxReminderDays: 7,
		financialYearStartMonth: 1,
		financialYearStartDay: 1,
		financialYearEndMonth: 12,
		financialYearEndDay: 31,
		taxScheme: 'standard',
		defaultTaxCategory: 'self-employed',
		reminderEmailEnabled: true,
		reminderDaysBeforeDue: 3,
		language: 'en-GB',
		theme: 'system',
		logoUrl: settings?.logoUrl,
		applyTaxByDefault: true,
		defaultNotes: settings?.defaultNotes,
		taxRatesJson: settings?.taxRatesJson,
		createdAt: settings?.createdAt,
		updatedAt: settings?.updatedAt,
	};

	if (!settings) return defaults;

	// Merge provided settings with defaults (settings override defaults)
	return {
		...defaults,
		...settings,
		id: settings.id, // Keep provided id if it exists
		userId: settings.userId, // Keep provided userId if it exists
	};
};

/**
 * Get a setting value with fallback to default
 */
export const getSetting = <K extends keyof AppSettingsType>(
	settings: AppSettingsType | null,
	key: K
): AppSettingsType[K] => {
	const safe = applyDefaults(settings);
	return safe[key];
};
