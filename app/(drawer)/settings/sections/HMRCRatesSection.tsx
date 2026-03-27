/**
 * HMRCRatesSection.tsx
 *
 * Tax and National Insurance rates for HMRC calculations.
 * Collapsible section showing all tax band thresholds and rates.
 * Updated annually when HMRC publishes new rates (usually April).
 */

import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { SectionHeader, SettingsInputRow } from '../components';
import { AppSettingsType } from '@/db/zodSchema';
import { RATES_2025_26, parseTaxRates, serializeTaxRates } from '@/utils/mtd/mtdTaxCalc';

interface HMRCRatesSectionProps {
	formState: Partial<AppSettingsType>;
	onFieldChange: (field: keyof AppSettingsType, value: string | number | boolean | undefined) => void;
}

export const HMRCRatesSection: React.FC<HMRCRatesSectionProps> = ({ formState, onFieldChange }) => {
	const { colors, isDark } = useTheme();
	const [showRates, setShowRates] = useState(false);

	// WHY: Parse tax rates from JSON field and allow editing
	//  If not set, use HMRC 2025-26 defaults
	const taxRates = useMemo(() => {
		if (formState.taxRatesJson) {
			return parseTaxRates(formState.taxRatesJson);
		}
		return RATES_2025_26;
	}, [formState.taxRatesJson]);

	const handleRateChange = (field: keyof typeof taxRates, value: number) => {
		const updated = { ...taxRates, [field]: value };
		onFieldChange('taxRatesJson', serializeTaxRates(updated));
	};

	return (
		<>
			<SectionHeader title='HMRC Tax Rates' />

			<TouchableOpacity
				className='py-3 px-4 rounded-lg mb-1 flex-row items-center justify-between'
				style={{ backgroundColor: isDark ? colors.nav : colors.card }}
				onPress={() => setShowRates(!showRates)}>
				<Text className='text-sm' style={{ color: colors.text }}>
					Income Tax & NI rates
				</Text>
				<Ionicons name={showRates ? 'chevron-up' : 'chevron-down'} size={16} color={colors.noActive} />
			</TouchableOpacity>

			<Text className='text-xs mb-2 px-1' style={{ color: colors.noActive }}>
				Update each April when HMRC publishes new rates. Currently set to 2025-26 defaults.
			</Text>

			{showRates && (
				<View className='gap-1 mb-2'>
					{/* Income Tax */}
					<SettingsInputRow
						label='Personal allowance (£)'
						value={String(taxRates.personalAllowance)}
						onChangeText={(v) => {
							const num = parseFloat(v);
							if (!isNaN(num)) handleRateChange('personalAllowance', num);
						}}
						keyboardType='decimal-pad'
					/>
					<SettingsInputRow
						label='Basic rate threshold (£)'
						value={String(taxRates.basicRateThreshold)}
						onChangeText={(v) => {
							const num = parseFloat(v);
							if (!isNaN(num)) handleRateChange('basicRateThreshold', num);
						}}
						keyboardType='decimal-pad'
					/>
					<SettingsInputRow
						label='Higher rate threshold (£)'
						value={String(taxRates.higherRateThreshold)}
						onChangeText={(v) => {
							const num = parseFloat(v);
							if (!isNaN(num)) handleRateChange('higherRateThreshold', num);
						}}
						keyboardType='decimal-pad'
					/>
					<SettingsInputRow
						label='Basic rate (e.g. 0.20)'
						value={String(taxRates.basicRate)}
						onChangeText={(v) => {
							const num = parseFloat(v);
							if (!isNaN(num)) handleRateChange('basicRate', num);
						}}
						keyboardType='decimal-pad'
					/>
					<SettingsInputRow
						label='Higher rate (e.g. 0.40)'
						value={String(taxRates.higherRate)}
						onChangeText={(v) => {
							const num = parseFloat(v);
							if (!isNaN(num)) handleRateChange('higherRate', num);
						}}
						keyboardType='decimal-pad'
					/>
					<SettingsInputRow
						label='Additional rate (e.g. 0.45)'
						value={String(taxRates.additionalRate)}
						onChangeText={(v) => {
							const num = parseFloat(v);
							if (!isNaN(num)) handleRateChange('additionalRate', num);
						}}
						keyboardType='decimal-pad'
					/>

					{/* National Insurance - Class 4 */}
					<SettingsInputRow
						label='Class 4 NI lower limit (£)'
						value={String(taxRates.ni4LowerProfitsLimit)}
						onChangeText={(v) => {
							const num = parseFloat(v);
							if (!isNaN(num)) handleRateChange('ni4LowerProfitsLimit', num);
						}}
						keyboardType='decimal-pad'
					/>
					<SettingsInputRow
						label='Class 4 NI upper limit (£)'
						value={String(taxRates.ni4UpperProfitsLimit)}
						onChangeText={(v) => {
							const num = parseFloat(v);
							if (!isNaN(num)) handleRateChange('ni4UpperProfitsLimit', num);
						}}
						keyboardType='decimal-pad'
					/>
					<SettingsInputRow
						label='Class 4 NI lower rate (e.g. 0.06)'
						value={String(taxRates.ni4LowerRate)}
						onChangeText={(v) => {
							const num = parseFloat(v);
							if (!isNaN(num)) handleRateChange('ni4LowerRate', num);
						}}
						keyboardType='decimal-pad'
					/>
					<SettingsInputRow
						label='Class 4 NI upper rate (e.g. 0.02)'
						value={String(taxRates.ni4UpperRate)}
						onChangeText={(v) => {
							const num = parseFloat(v);
							if (!isNaN(num)) handleRateChange('ni4UpperRate', num);
						}}
						keyboardType='decimal-pad'
					/>

					{/* National Insurance - Class 2 */}
					<SettingsInputRow
						label='Class 2 NI weekly rate (£)'
						value={String(taxRates.ni2WeeklyRate)}
						onChangeText={(v) => {
							const num = parseFloat(v);
							if (!isNaN(num)) handleRateChange('ni2WeeklyRate', num);
						}}
						keyboardType='decimal-pad'
					/>
					<SettingsInputRow
						label='Class 2 NI threshold (£)'
						value={String(taxRates.ni2SmallEarningsException)}
						onChangeText={(v) => {
							const num = parseFloat(v);
							if (!isNaN(num)) handleRateChange('ni2SmallEarningsException', num);
						}}
						keyboardType='decimal-pad'
					/>
				</View>
			)}
		</>
	);
};
