/**
 * QuarterMonthSelector.tsx
 *
 * Visual quarter month selector with 12-month grid.
 * - Highlights selected months
 * - Enforces max 4 selections
 * - Quarter labels shown on each month tile
 *
 * Presets are handled by the FinancialYearSection, not here.
 */

import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

interface QuarterMonthSelectorProps {
	selectedMonths: number[];
	onMonthsChange: (months: number[]) => void;
	maxMonths?: number;
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const QuarterMonthSelector: React.FC<QuarterMonthSelectorProps> = ({ selectedMonths, onMonthsChange, maxMonths = 4 }) => {
	const { colors, isDark } = useTheme();

	// WHY: Sort and deduplicate selected months
	const sorted = useMemo(() => [...new Set(selectedMonths)].sort((a, b) => a - b), [selectedMonths]);

	const handleMonthToggle = (monthNum: number) => {
		if (sorted.includes(monthNum)) {
			onMonthsChange(sorted.filter((m) => m !== monthNum));
		} else {
			if (sorted.length >= maxMonths) {
				Alert.alert('Quarter months limited', `Only ${maxMonths} months can be selected`);
				return;
			}
			onMonthsChange([...sorted, monthNum].sort((a, b) => a - b));
		}
	};

	// WHY: Helper to determine which quarter(s) contain a month
	const getQuartersForMonth = (monthNum: number): string[] => {
		const quarters: string[] = [];
		if ([4, 5, 6].includes(monthNum)) quarters.push('Q1');
		if ([7, 8, 9].includes(monthNum)) quarters.push('Q2');
		if ([10, 11, 12].includes(monthNum)) quarters.push('Q3');
		if ([1, 2, 3].includes(monthNum)) quarters.push('Q4');
		return quarters;
	};

	return (
		<View>
			{/* Month Selection Grid */}
			<View className='mb-3'>
				<Text className='text-xs font-semibold mb-2' style={{ color: colors.text }}>
					Quarter Start Months ({sorted.length}/{maxMonths})
				</Text>

				<View className='flex-row gap-1 flex-wrap'>
					{MONTH_NAMES.map((month, idx) => {
						const monthNum = idx + 1;
						const isSelected = sorted.includes(monthNum);
						const quarters = getQuartersForMonth(monthNum);

						return (
							<TouchableOpacity
								key={month}
								onPress={() => handleMonthToggle(monthNum)}
								className='rounded-lg p-2'
								style={{
									backgroundColor: isSelected
										? isDark
											? 'rgba(37, 99, 235, 0.9)'
											: 'rgba(29, 78, 216, 0.9)'
										: isDark
											? 'rgba(255,255,255,0.08)'
											: 'rgba(0,0,0,0.04)',
									borderWidth: 1,
									borderColor: isSelected ? (isDark ? 'rgba(59, 130, 246, 1)' : 'rgba(29, 78, 216, 1)') : isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
									minWidth: '22.5%',
								}}>
								<Text className='text-xs font-bold text-center' style={{ color: isSelected ? 'white' : colors.text }}>
									{month}
								</Text>
								<Text className='text-xs text-center' style={{ color: isSelected ? 'rgba(255,255,255,0.8)' : colors.noActive }}>
									{quarters.join(',')}
								</Text>
							</TouchableOpacity>
						);
					})}
				</View>
			</View>

			{/* Summary */}
			{sorted.length > 0 && (
				<View className='p-3 rounded-lg' style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }}>
					<Text className='text-xs' style={{ color: colors.noActive }}>
						Selected: {sorted.map((m) => MONTH_NAMES[m - 1]).join(', ')}
					</Text>
				</View>
			)}
		</View>
	);
};
