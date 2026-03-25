/**
 * MTDSettingsSection.tsx
 *
 * Making Tax Digital (MTD) configuration:
 * - Enable/disable quarterly updates
 * - Auto-calculate quarters
 * - Quarter start months selector with visual month picker
 * - Quick presets (Standard UK, Calendar year)
 * - Deadline reminder days
 */

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { SectionHeader, SettingsToggleRow, SettingsInputRow } from '../components';
import { AppSettingsType } from '@/db/zodSchema';

interface MTDSettingsSectionProps {
	formState: Partial<AppSettingsType>;
	onFieldChange: (field: keyof AppSettingsType, value: any) => void;
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const MTDSettingsSection: React.FC<MTDSettingsSectionProps> = ({ formState, onFieldChange }) => {
	const { colors, isDark } = useTheme();

	const selectedMonths = (formState.quarterStartMonths ?? '1,4,7,10')
		.split(',')
		.map((m) => {
			const parsed = parseInt(m.trim());
			return isNaN(parsed) ? 0 : parsed;
		})
		.filter((m) => m > 0 && m <= 12);

	const handleMonthToggle = (monthNum: number) => {
		const updated = selectedMonths.includes(monthNum)
			? selectedMonths.filter((m) => m !== monthNum)
			: [...selectedMonths, monthNum].sort((a, b) => a - b);
		// Store clean comma-separated string without spaces
		onFieldChange('quarterStartMonths', updated.join(','));
	};

	return (
		<>
			<SectionHeader title='MTD & Tax' />

			<SettingsToggleRow
				label='MTD quarterly updates'
				value={formState.quarterlyTaxEnabled ?? true}
				onToggle={(val) => onFieldChange('quarterlyTaxEnabled', val)}
			/>

			<SettingsToggleRow
				label='Auto-calculate quarters'
				value={formState.autoCalculateQuarters ?? true}
				onToggle={(val) => onFieldChange('autoCalculateQuarters', val)}
			/>

			{/* Quarter Start Months Selector with Visual Month Picker */}
			<View className='py-3 px-4 rounded-lg mb-1' style={{ backgroundColor: isDark ? colors.nav : colors.card }}>
				<Text className='text-xs mb-2' style={{ color: colors.noActive }}>
					Quarter start months
				</Text>

				{/* Month buttons - 12-button grid showing all months */}
				<View className='flex-row gap-1 mb-2 flex-wrap'>
					{MONTH_NAMES.map((month, idx) => {
						const monthNum = idx + 1;
						const isSelected = selectedMonths.includes(monthNum);

						return (
							<TouchableOpacity
								key={month}
								className='py-2 px-3 rounded-lg flex-1'
								style={{
									backgroundColor: isSelected
										? isDark
											? 'rgba(37, 99, 235, 0.8)'
											: 'rgba(29, 78, 216, 0.8)'
										: isDark
											? 'rgba(255,255,255,0.1)'
											: 'rgba(0,0,0,0.05)',
									minWidth: '30%',
								}}
								onPress={() => handleMonthToggle(monthNum)}>
								<Text className='text-xs font-bold text-center' style={{ color: isSelected ? 'white' : colors.text }}>
									{month}
								</Text>
								<Text className='text-xs text-center' style={{ color: isSelected ? 'white' : colors.noActive }}>
									({monthNum})
								</Text>
							</TouchableOpacity>
						);
					})}
				</View>

				{/* Quick Presets */}
				<View className='flex-row gap-1'>
					<TouchableOpacity
						className='flex-1 py-2 rounded-lg items-center border'
						style={{
							backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
							borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
						}}
						onPress={() => onFieldChange('quarterStartMonths', '4,7,10,1')}>
						<Text className='text-xs font-bold' style={{ color: colors.text }}>
							Standard UK
						</Text>
					</TouchableOpacity>
					<TouchableOpacity
						className='flex-1 py-2 rounded-lg items-center border'
						style={{
							backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
							borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
						}}
						onPress={() => onFieldChange('quarterStartMonths', '1,4,7,10')}>
						<Text className='text-xs font-bold' style={{ color: colors.text }}>
							Calendar
						</Text>
					</TouchableOpacity>
				</View>
			</View>

			<SettingsInputRow
				label='Deadline reminder (days)'
				value={String(formState.quarterlyTaxReminderDays ?? 7)}
				onChangeText={(text) => {
					if (text === '') {
						onFieldChange('quarterlyTaxReminderDays', 7);
					} else {
						const num = parseInt(text);
						if (!isNaN(num)) onFieldChange('quarterlyTaxReminderDays', num);
					}
				}}
				placeholder='7'
				keyboardType='numeric'
				maxLength={3}
			/>
		</>
	);
};
