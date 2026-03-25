/**
 * SettingsInputRow.tsx
 *
 * Reusable row component with text input field.
 * Used for editable numeric or text settings.
 */

import React from 'react';
import { View, Text, TextInput } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

interface SettingsInputRowProps {
	label: string;
	value: string;
	onChangeText: (text: string) => void;
	keyboardType?: 'default' | 'numeric' | 'decimal-pad';
	maxLength?: number;
	placeholder?: string;
}

export const SettingsInputRow: React.FC<SettingsInputRowProps> = ({
	label,
	value,
	onChangeText,
	keyboardType = 'default',
	maxLength,
	placeholder,
}) => {
	const { colors, isDark } = useTheme();

	return (
		<View className="mb-1">
			<Text className="text-xs font-medium mb-2 px-4" style={{ color: colors.noActive }}>
				{label}
			</Text>
			<TextInput
				className="px-4 py-3 rounded-lg text-sm"
				style={{
					backgroundColor: isDark ? colors.nav : colors.card,
					color: colors.text,
					borderWidth: 1,
					borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
				}}
				value={value}
				onChangeText={onChangeText}
				keyboardType={keyboardType}
				maxLength={maxLength}
				placeholder={placeholder}
				placeholderTextColor={colors.noActive}
			/>
		</View>
	);
};
