/**
 * FinancialYearSection.tsx
 *
 * Financial year configuration: start and end month/day.
 * Default: January 1 to December 31 (calendar year).
 */

import React from 'react';
import { View } from 'react-native';
import { SectionHeader, SettingsInputRow } from '../components';
import { AppSettingsType } from '@/db/zodSchema';

interface FinancialYearSectionProps {
	formState: Partial<AppSettingsType>;
	onFieldChange: (field: keyof AppSettingsType, value: any) => void;
}

export const FinancialYearSection: React.FC<FinancialYearSectionProps> = ({
	formState,
	onFieldChange,
}) => {
	return (
		<>
			<SectionHeader title="Financial Year" />

			{/* Start date: month and day */}
			<View className="flex-row gap-2">
				<View className="flex-1">
					<SettingsInputRow
						label="Start month"
						value={String(formState.financialYearStartMonth ?? 1)}
						onChangeText={(text) => {
							const num = parseInt(text);
							if (!isNaN(num) && num >= 1 && num <= 12) {
								onFieldChange('financialYearStartMonth', num);
							}
						}}
						placeholder="1"
						keyboardType="numeric"
						maxLength={2}
					/>
				</View>
				<View className="flex-1">
					<SettingsInputRow
						label="Start day"
						value={String(formState.financialYearStartDay ?? 1)}
						onChangeText={(text) => {
							const num = parseInt(text);
							if (!isNaN(num) && num >= 1 && num <= 31) {
								onFieldChange('financialYearStartDay', num);
							}
						}}
						placeholder="1"
						keyboardType="numeric"
						maxLength={2}
					/>
				</View>
			</View>

			{/* End date: month and day */}
			<View className="flex-row gap-2">
				<View className="flex-1">
					<SettingsInputRow
						label="End month"
						value={String(formState.financialYearEndMonth ?? 12)}
						onChangeText={(text) => {
							const num = parseInt(text);
							if (!isNaN(num) && num >= 1 && num <= 12) {
								onFieldChange('financialYearEndMonth', num);
							}
						}}
						placeholder="12"
						keyboardType="numeric"
						maxLength={2}
					/>
				</View>
				<View className="flex-1">
					<SettingsInputRow
						label="End day"
						value={String(formState.financialYearEndDay ?? 31)}
						onChangeText={(text) => {
							const num = parseInt(text);
							if (!isNaN(num) && num >= 1 && num <= 31) {
								onFieldChange('financialYearEndDay', num);
							}
						}}
						placeholder="31"
						keyboardType="numeric"
						maxLength={2}
					/>
				</View>
			</View>
		</>
	);
};
