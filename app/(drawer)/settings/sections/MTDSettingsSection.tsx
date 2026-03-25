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
import { View } from 'react-native';
import { SectionHeader, SettingsToggleRow, SettingsInputRow } from '../components';
import { QuarterMonthSelector } from '../components/QuarterMonthSelector';
import { AppSettingsType } from '@/db/zodSchema';

interface MTDSettingsSectionProps {
	formState: Partial<AppSettingsType>;
	onFieldChange: (field: keyof AppSettingsType, value: string | number | boolean | undefined) => void;
}

export const MTDSettingsSection: React.FC<MTDSettingsSectionProps> = ({ formState, onFieldChange }) => {
	const selectedMonths = (formState.quarterStartMonths ?? '1,4,7,10')
		.split(',')
		.map((m) => {
			const parsed = parseInt(m.trim());
			return isNaN(parsed) ? 0 : parsed;
		})
		.filter((m) => m > 0 && m <= 12);

	const handleMonthsChange = (months: number[]) => {
		// Store clean comma-separated string without spaces
		onFieldChange('quarterStartMonths', months.join(','));
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

			{/* Quarter Month Selector — months sync from Financial Year presets */}
			<View className='py-3 px-4 rounded-lg mb-4' style={{ backgroundColor: 'transparent' }}>
				<QuarterMonthSelector
					selectedMonths={selectedMonths}
					onMonthsChange={handleMonthsChange}
					maxMonths={4}
				/>
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
