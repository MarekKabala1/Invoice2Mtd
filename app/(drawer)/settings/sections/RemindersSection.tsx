/**
 * RemindersSection.tsx
 *
 * Reminder preferences for invoice payment and MTD deadlines.
 */

import React from 'react';
import { SectionHeader, SettingsToggleRow, SettingsInputRow } from '../components';
import { AppSettingsType } from '@/db/zodSchema';

interface RemindersSectionProps {
	formState: Partial<AppSettingsType>;
	onFieldChange: (field: keyof AppSettingsType, value: any) => void;
}

export const RemindersSection: React.FC<RemindersSectionProps> = ({
	formState,
	onFieldChange,
}) => {
	return (
		<>
			<SectionHeader title="Reminders" />

			<SettingsToggleRow
				label="Invoice payment reminders"
				value={formState.reminderEmailEnabled ?? true}
				onToggle={(val) => onFieldChange('reminderEmailEnabled', val)}
			/>

			<SettingsInputRow
				label="Remind days before due"
				value={String(formState.reminderDaysBeforeDue ?? 3)}
				onChangeText={(text) => {
					const num = parseInt(text);
					if (!isNaN(num)) onFieldChange('reminderDaysBeforeDue', num);
				}}
				placeholder="3"
				keyboardType="decimal-pad"
				maxLength={3}
			/>
		</>
	);
};
