/**
 * SettingsToggleRow.tsx
 *
 * Reusable row component with a toggle switch.
 * Used for boolean settings.
 */

import React from 'react';
import { View, Text, Switch } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

interface SettingsToggleRowProps {
	label: string;
	value: boolean;
	onToggle: (val: boolean) => void;
}

export const SettingsToggleRow: React.FC<SettingsToggleRowProps> = ({ label, value, onToggle }) => {
	const { colors, isDark } = useTheme();

	return (
		<View className='flex-row items-center justify-between py-3 px-4 rounded-lg mb-1' style={{ backgroundColor: isDark ? colors.nav : colors.card }}>
			<Text className='text-sm flex-1' style={{ color: colors.text }}>
				{label}
			</Text>
			<Switch
				value={value}
				onValueChange={onToggle}
				trackColor={{
					false: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
					true: colors.success,
				}}
				thumbColor={value ? 'white' : isDark ? colors.text : colors.noActive}
			/>
		</View>
	);
};
