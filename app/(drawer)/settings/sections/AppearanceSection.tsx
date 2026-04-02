/**
 * AppearanceSection.tsx
 *
 * App appearance settings: theme selection.
 */

import React from 'react';
import { View } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { SectionHeader } from '../components';

export const AppearanceSection: React.FC = () => {
	const { colors, isDark } = useTheme();

	return (
		<>
			<SectionHeader title='Appearance' />
			<View className='py-3 px-4 rounded-lg mb-1' style={{ backgroundColor: isDark ? colors.nav : colors.card }}>
				<ThemeToggle size={24} />
			</View>
		</>
	);
};
