/**
 * FinancialYearSection.tsx
 *
 * Financial year configuration with quick presets.
 * - Standard UK Tax Year: 6 Apr → 5 Apr (HMRC standard)
 * - Calendar Year: 1 Jan → 31 Dec
 * - Custom: manually set start/end month+day
 *
 * Presets also update quarterStartMonths so the calendar
 * in MTDSettingsSection stays in sync.
 */

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { SectionHeader, SettingsInputRow } from '../components';
import { AppSettingsType } from '@/db/zodSchema';
import options, { FinancialYearPreset } from '@/utils/appSettingsOption';

interface FinancialYearSectionProps {
	formState: Partial<AppSettingsType>;
	onFieldChange: (field: keyof AppSettingsType, value: string | number | boolean | undefined) => void;
}

const MONTH_NAMES = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const FinancialYearSection: React.FC<FinancialYearSectionProps> = ({ formState, onFieldChange }) => {
	const { colors, isDark } = useTheme();

	const currentStartMonth = formState.financialYearStartMonth ?? 1;
	const currentStartDay = formState.financialYearStartDay ?? 1;
	const currentEndMonth = formState.financialYearEndMonth ?? 12;
	const currentEndDay = formState.financialYearEndDay ?? 31;

	// Detect which preset matches the current values
	const detectPreset = (): string => {
		for (const preset of options.financialYearPresets) {
			if (
				preset.value !== 'custom' &&
				preset.startMonth === currentStartMonth &&
				preset.startDay === currentStartDay &&
				preset.endMonth === currentEndMonth &&
				preset.endDay === currentEndDay
			) {
				return preset.value;
			}
		}
		return 'custom';
	};

	const activePreset = detectPreset();

	const handlePresetSelect = (preset: FinancialYearPreset) => {
		if (preset.value === 'custom') return;
		onFieldChange('financialYearStartMonth', preset.startMonth);
		onFieldChange('financialYearStartDay', preset.startDay);
		onFieldChange('financialYearEndMonth', preset.endMonth);
		onFieldChange('financialYearEndDay', preset.endDay);
		if (preset.quarterMonths) {
			onFieldChange('quarterStartMonths', preset.quarterMonths);
		}
	};

	return (
		<>
			<SectionHeader title='Financial Year' />

			{/* Quick Presets */}
			<View className='gap-2 mb-3'>
				{options.financialYearPresets.map((preset) => {
					const isActive = activePreset === preset.value;
					return (
						<TouchableOpacity
							key={preset.value}
							onPress={() => handlePresetSelect(preset)}
							className='py-3 px-4 rounded-lg border'
							style={{
								backgroundColor: isActive
									? isDark
										? 'rgba(37, 99, 235, 0.2)'
										: 'rgba(29, 78, 216, 0.1)'
									: isDark
										? 'rgba(255,255,255,0.05)'
										: 'rgba(0,0,0,0.02)',
								borderColor: isActive
									? isDark
										? 'rgba(59, 130, 246, 0.6)'
										: 'rgba(29, 78, 216, 0.4)'
									: isDark
										? 'rgba(255,255,255,0.1)'
										: 'rgba(0,0,0,0.08)',
							}}>
							<Text className='text-sm font-bold' style={{ color: colors.text }}>
								{preset.label}
							</Text>
							<Text className='text-xs mt-1' style={{ color: colors.noActive }}>
								{preset.description}
							</Text>
						</TouchableOpacity>
					);
				})}
			</View>

			{/* Custom inputs (always visible but editable only when Custom preset) */}
			<View className='flex-row gap-2'>
				<View className='flex-1'>
					<SettingsInputRow
						label='Start month'
						value={String(currentStartMonth)}
						onChangeText={(text) => {
							if (text === '') {
								onFieldChange('financialYearStartMonth', 1);
							} else {
								const num = parseInt(text);
								if (!isNaN(num) && num >= 1 && num <= 12) {
									onFieldChange('financialYearStartMonth', num);
								}
							}
						}}
						placeholder='1'
						keyboardType='numeric'
						maxLength={2}
					/>
				</View>
				<View className='flex-1'>
					<SettingsInputRow
						label='Start day'
						value={String(currentStartDay)}
						onChangeText={(text) => {
							if (text === '') {
								onFieldChange('financialYearStartDay', 1);
							} else {
								const num = parseInt(text);
								if (!isNaN(num) && num >= 1 && num <= 31) {
									onFieldChange('financialYearStartDay', num);
								}
							}
						}}
						placeholder='1'
						keyboardType='numeric'
						maxLength={2}
					/>
				</View>
			</View>

			<View className='flex-row gap-2'>
				<View className='flex-1'>
					<SettingsInputRow
						label='End month'
						value={String(currentEndMonth)}
						onChangeText={(text) => {
							if (text === '') {
								onFieldChange('financialYearEndMonth', 12);
							} else {
								const num = parseInt(text);
								if (!isNaN(num) && num >= 1 && num <= 12) {
									onFieldChange('financialYearEndMonth', num);
								}
							}
						}}
						placeholder='12'
						keyboardType='numeric'
						maxLength={2}
					/>
				</View>
				<View className='flex-1'>
					<SettingsInputRow
						label='End day'
						value={String(currentEndDay)}
						onChangeText={(text) => {
							if (text === '') {
								onFieldChange('financialYearEndDay', 31);
							} else {
								const num = parseInt(text);
								if (!isNaN(num) && num >= 1 && num <= 31) {
									onFieldChange('financialYearEndDay', num);
								}
							}
						}}
						placeholder='31'
						keyboardType='numeric'
						maxLength={2}
					/>
				</View>
			</View>

			{/* Current range summary */}
			<View className='px-4 py-2 mt-1'>
				<Text className='text-xs' style={{ color: colors.noActive }}>
					Financial year: {MONTH_NAMES[currentStartMonth]} {currentStartDay} → {MONTH_NAMES[currentEndMonth]} {currentEndDay}
				</Text>
			</View>
		</>
	);
};
