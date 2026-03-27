/**
 * TaxSettingsSection.tsx
 *
 * Tax-related settings: default VAT rate, tax scheme, apply by default, payment terms.
 * Includes live preview of tax calculation.
 */

import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { SectionHeader, SettingsInputRow, SettingsToggleRow } from '../components';
import { AppSettingsType } from '@/db/zodSchema';
import { formatGBP } from '@/utils/mtd/mtdTaxCalc';

interface TaxSettingsSectionProps {
	formState: Partial<AppSettingsType>;
	onFieldChange: (field: keyof AppSettingsType, value: string | number | boolean | undefined) => void;
}

export const TaxSettingsSection: React.FC<TaxSettingsSectionProps> = ({ formState, onFieldChange }) => {
	const { colors, isDark } = useTheme();
	const scheme = (formState.taxScheme ?? 'standard') as string;
	const rate = formState.defaultVatRate ?? 20;

	// WHY: Live preview helps users understand how tax calculation works
	// Shows the difference between standard (add on top) and inclusive tax
	const sampleNet = 100;
	const sampleTax = scheme === 'standard' ? (sampleNet * rate) / 100 : (sampleNet * rate) / (100 + rate);
	const sampleTotal = scheme === 'standard' ? sampleNet + sampleTax : sampleNet;

	return (
		<>
			<SectionHeader title='Tax Defaults' />

			<SettingsInputRow
				label='Default tax rate (%)'
				value={String(rate)}
				onChangeText={(text) => {
					if (text === '') {
						onFieldChange('defaultVatRate', 20);
					} else {
						const num = parseFloat(text);
						if (!isNaN(num)) onFieldChange('defaultVatRate', num);
					}
				}}
				placeholder='20'
				keyboardType='decimal-pad'
			/>

			{/* Tax scheme toggle with live preview */}
			<View className='py-3 px-4 rounded-lg mb-1' style={{ backgroundColor: isDark ? colors.nav : colors.card }}>
				<Text className='text-xs mb-2' style={{ color: colors.noActive }}>
					Tax calculation mode
				</Text>
				<View className='flex-row gap-2'>
					<TouchableOpacity
						className='flex-1 py-2 rounded-lg items-center'
						style={{
							backgroundColor:
								scheme === 'standard' ? (isDark ? 'rgba(37, 99, 235, 0.8)' : 'rgba(29, 78, 216, 0.8)') : isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
						}}
						onPress={() => onFieldChange('taxScheme', 'standard')}>
						<Text
							className='text-xs font-bold'
							style={{
								color: scheme === 'standard' ? 'white' : colors.text,
							}}>
							Add on top
						</Text>
					</TouchableOpacity>
					<TouchableOpacity
						className='flex-1 py-2 rounded-lg items-center'
						style={{
							backgroundColor:
								scheme === 'inclusive' ? (isDark ? 'rgba(37, 99, 235, 0.8)' : 'rgba(29, 78, 216, 0.8)') : isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
						}}
						onPress={() => onFieldChange('taxScheme', 'inclusive')}>
						<Text
							className='text-xs font-bold'
							style={{
								color: scheme === 'inclusive' ? 'white' : colors.text,
							}}>
							Inclusive
						</Text>
					</TouchableOpacity>
				</View>

				{/* Live preview */}
				<View
					className='mt-3 p-3 rounded-lg'
					style={{
						backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
					}}>
					<Text className='text-xs' style={{ color: colors.noActive }}>
						Invoice for {formatGBP(sampleNet)} → Tax {formatGBP(sampleTax)} → Total {formatGBP(sampleTotal)}
					</Text>
				</View>
			</View>

			<SettingsToggleRow label='Apply tax by default' value={formState.applyTaxByDefault ?? true} onToggle={(val) => onFieldChange('applyTaxByDefault', val)} />

			<SettingsInputRow
				label='Default payment terms (days)'
				value={String(formState.defaultPaymentTerms ?? 30)}
				onChangeText={(text) => {
					if (text === '') {
						onFieldChange('defaultPaymentTerms', 30);
					} else {
						const num = parseInt(text);
						if (!isNaN(num)) onFieldChange('defaultPaymentTerms', num);
					}
				}}
				placeholder='30'
				keyboardType='numeric'
			/>
		</>
	);
};
