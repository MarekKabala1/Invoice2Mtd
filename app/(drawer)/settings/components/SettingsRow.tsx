/**
 * SettingsRow.tsx
 *
 * Reusable row component for settings display.
 * Shows label, value, and optional chevron icon.
 */

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';

interface SettingsRowProps {
	label: string;
	value?: string;
	onPress?: () => void;
	showArrow?: boolean;
}

export const SettingsRow: React.FC<SettingsRowProps> = ({
	label,
	value,
	onPress,
	showArrow = true,
}) => {
	const { colors, isDark } = useTheme();

	return (
		<TouchableOpacity
			className="flex-row items-center justify-between py-3 px-4 rounded-lg mb-1"
			style={{ backgroundColor: isDark ? colors.nav : colors.card }}
			onPress={onPress}
			disabled={!onPress}
		>
			<Text className="text-sm flex-1" style={{ color: colors.text }}>
				{label}
			</Text>
			{value && (
				<Text className="text-sm mr-2" style={{ color: colors.noActive }}>
					{value}
				</Text>
			)}
			{showArrow && onPress && (
				<Ionicons name="chevron-forward" size={16} color={colors.noActive} />
			)}
		</TouchableOpacity>
	);
};
