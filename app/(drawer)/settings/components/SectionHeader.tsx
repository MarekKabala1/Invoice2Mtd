/**
 * SectionHeader.tsx
 *
 * Reusable section header component.
 * Displays section title with consistent styling.
 */

import React from 'react';
import { Text } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

interface SectionHeaderProps {
	title: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ title }) => {
	const { colors } = useTheme();

	return (
		<Text className='text-xs font-bold uppercase tracking-widest mt-6 mb-3' style={{ color: colors.noActive }}>
			{title}
		</Text>
	);
};
