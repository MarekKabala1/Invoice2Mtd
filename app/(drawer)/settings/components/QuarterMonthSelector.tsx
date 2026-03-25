/**
 * QuarterMonthSelector.tsx
 *
 * Visual quarter and month selector with max 4 months selection.
 * - Shows 12-month grid
 * - Highlights selected months
 * - Enforces max 4 selections
 * - Quick presets for Standard UK and Calendar year
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
const UK_QUARTERS = [4, 7, 10, 1]; // Apr, Jul, Oct, Jan
const CALENDAR_QUARTERS = [1, 4, 7, 10]; // Jan, Apr, Jul, Oct

export const QuarterMonthSelector: React.FC<QuarterMonthSelectorProps> = ({ selectedMonths, onMonthsChange, maxMonths = 4 }) => {
	const { colors, isDark } = useTheme();

	// WHY: Sort and deduplicate selected months
	const sorted = useMemo(() => [...new Set(selectedMonths)].sort((a, b) => a - b), [selectedMonths]);

	const handleMonthToggle = (monthNum: number) => {
		if (sorted.includes(monthNum)) {
			// Remove month
			onMonthsChange(sorted.filter((m) => m !== monthNum));
		} else {
			// Add month if under limit
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
					Select Quarter Start Months ({sorted.length}/{maxMonths})
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

			{/* Quick Presets */}
			<View className='mb-3'>
				<Text className='text-xs font-semibold mb-2' style={{ color: colors.text }}>
					Quick Presets
				</Text>
				<View className='gap-1'>
					<TouchableOpacity
						onPress={() => onMonthsChange(UK_QUARTERS)}
						className='py-3 px-4 rounded-lg border'
						style={{
							backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
							borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
						}}>
						<Text className='text-sm font-bold' style={{ color: colors.text }}>
							Standard UK Tax Year (Apr, Jul, Oct, Jan)
						</Text>
						<Text className='text-xs mt-1' style={{ color: colors.noActive }}>
							6 Apr – 5 Jul, 6 Jul – 5 Oct, 6 Oct – 5 Jan, 6 Jan – 5 Apr
						</Text>
					</TouchableOpacity>

					<TouchableOpacity
						onPress={() => onMonthsChange(CALENDAR_QUARTERS)}
						className='py-3 px-4 rounded-lg border'
						style={{
							backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
							borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
						}}>
						<Text className='text-sm font-bold' style={{ color: colors.text }}>
							Calendar Year (Jan, Apr, Jul, Oct)
						</Text>
						<Text className='text-xs mt-1' style={{ color: colors.noActive }}>
							1 Jan – 31 Mar, 1 Apr – 30 Jun, 1 Jul – 30 Sep, 1 Oct – 31 Dec
						</Text>
					</TouchableOpacity>
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
