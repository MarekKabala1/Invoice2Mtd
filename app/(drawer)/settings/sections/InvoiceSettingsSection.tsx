/**
 * InvoiceSettingsSection.tsx
 *
 * Invoice and estimate numbering settings.
 * Shows preview of next invoice/estimate numbers.
 */

import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { SectionHeader, SettingsInputRow } from '../components';
import { AppSettingsType } from '@/db/zodSchema';

interface InvoiceSettingsSectionProps {
	formState: Partial<AppSettingsType>;
	onFieldChange: (field: keyof AppSettingsType, value: any) => void;
}

export const InvoiceSettingsSection: React.FC<InvoiceSettingsSectionProps> = ({ formState, onFieldChange }) => {
	const { colors, isDark } = useTheme();

	// WHY: Show preview of what the next invoice number will look like
	const invoiceNextNum = formState.nextInvoiceNumber ?? 1;
	const invoicePaddedNum = String(invoiceNextNum).padStart(4, '0');

	const estimateNextNum = formState.nextEstimateNumber ?? 1;
	const estimatePaddedNum = String(estimateNextNum).padStart(4, '0');

	return (
		<>
			<SectionHeader title='Invoice & Estimate Numbers' />

			<SettingsInputRow
				label='Invoice prefix'
				value={formState.invoicePrefix ?? 'INV'}
				onChangeText={(text) => onFieldChange('invoicePrefix', text)}
				placeholder='INV'
			/>

			<SettingsInputRow
				label='Next invoice number'
				value={String(invoiceNextNum)}
				onChangeText={(text) => {
					if (text === '') {
						onFieldChange('nextInvoiceNumber', 1);
					} else {
						const num = parseInt(text);
						if (!isNaN(num)) onFieldChange('nextInvoiceNumber', num);
					}
				}}
				placeholder='1'
				keyboardType='numeric'
			/>

			<View className='py-3 px-4 rounded-lg mb-1' style={{ backgroundColor: isDark ? colors.nav : colors.card }}>
				<Text className='text-xs' style={{ color: colors.noActive }}>
					Next invoice: {formState.invoicePrefix || 'INV'}-{invoicePaddedNum}
				</Text>
			</View>

			<SettingsInputRow
				label='Estimate prefix'
				value={formState.estimatePrefix ?? 'EST'}
				onChangeText={(text) => onFieldChange('estimatePrefix', text)}
				placeholder='EST'
			/>

			<SettingsInputRow
				label='Next estimate number'
				value={String(estimateNextNum)}
				onChangeText={(text) => {
					if (text === '') {
						onFieldChange('nextEstimateNumber', 1);
					} else {
						const num = parseInt(text);
						if (!isNaN(num)) onFieldChange('nextEstimateNumber', num);
					}
				}}
				placeholder='1'
				keyboardType='numeric'
			/>
		</>
	);
};
