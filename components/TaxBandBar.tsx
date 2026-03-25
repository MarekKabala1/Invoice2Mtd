/**
 * TaxBandBar.tsx
 *
 * Visualizes income distribution across tax bands with an SVG bar.
 * Shows: Personal allowance (green), Basic rate (blue), Higher rate (amber).
 *
 * WHY: Visual representation helps users understand how their income is taxed
 * at different rates. Used in annual estimate screens to show tax burden.
 *
 * Depends on: types/mtd.ts (TaxRates), context/ThemeContext.tsx
 * Used by: app/(stack)/mtdAnnualEstimate.tsx
 */

import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { TaxRates } from '@/types/mtd';
import { lightColors } from '@/utils/theme';

interface TaxBandBarProps {
	netProfit: number;
	totalTurnover: number;
	taxRates: TaxRates;
	isDark: boolean;
	colors: typeof lightColors;
}

export const TaxBandBar: React.FC<TaxBandBarProps> = ({ netProfit, totalTurnover, taxRates, isDark, colors }) => {
	// WHY: Use total turnover as scale reference (not net profit).
	// This keeps the bar consistent across different expense scenarios.
	// Two businesses with same turnover but different expenses show the same bar width.
	const barWidth = 300;
	const barHeight = 24;
	const maxAmount = Math.max(totalTurnover, 1);

	// WHY: Calculate pixel widths for each tax band based on profit distribution.
	// Personal allowance: exempt from tax (green segment)
	// Basic rate: £0-£50k at 20% (blue segment)
	// Higher rate: >£50k at 40% (amber segment)

	// Personal allowance segment: capped at actual profit
	const paWidth = (taxRates.personalAllowance / maxAmount) * barWidth;

	// Basic rate segment: from allowance to basic threshold, or end of profit if less
	const basicWidth = Math.max(0, (Math.min(netProfit, taxRates.basicRateThreshold) - taxRates.personalAllowance) / maxAmount) * barWidth;

	// Higher rate segment: from basic threshold to higher threshold, or end of profit if less
	const higherWidth = Math.max(0, (Math.min(netProfit, taxRates.higherRateThreshold) - taxRates.basicRateThreshold) / maxAmount) * barWidth;

	return (
		<View className='rounded-lg p-4' style={{ backgroundColor: isDark ? colors.nav : colors.card }}>
			<Text className='text-xs font-bold uppercase tracking-widest mb-3' style={{ color: colors.noActive }}>
				Tax Bands
			</Text>

			{/* SVG Tax Band Bar */}
			<Svg width='100%' height={barHeight + 40}>
				{/* Personal allowance segment (green) */}
				<Rect x={0} y={0} width={Math.min(paWidth, barWidth)} height={barHeight} rx={barHeight / 2} ry={barHeight / 2} fill='#39AD6A' />

				{/* Basic rate segment (blue) */}
				{basicWidth > 0 && <Rect x={paWidth} y={0} width={Math.min(basicWidth, barWidth - paWidth)} height={barHeight} fill={isDark ? '#a5b4fc' : '#4f46e5'} />}

				{/* Higher rate segment (amber) */}
				{higherWidth > 0 && (
					<Rect
						x={paWidth + basicWidth}
						y={0}
						width={Math.min(higherWidth, barWidth - paWidth - basicWidth)}
						height={barHeight}
						rx={higherWidth >= barWidth - paWidth - basicWidth ? barHeight / 2 : 0}
						ry={higherWidth >= barWidth - paWidth - basicWidth ? barHeight / 2 : 0}
						fill='#f59e0b'
					/>
				)}
			</Svg>

			{/* Legend */}
			<View className='flex-row flex-wrap gap-4 mt-2'>
				<View className='flex-row items-center gap-1'>
					<View
						style={{
							width: 12,
							height: 12,
							borderRadius: 2,
							backgroundColor: '#39AD6A',
						}}
					/>
					<Text className='text-xs' style={{ color: colors.noActive }}>
						Personal allowance (£{taxRates.personalAllowance.toLocaleString()})
					</Text>
				</View>

				<View className='flex-row items-center gap-1'>
					<View
						style={{
							width: 12,
							height: 12,
							borderRadius: 2,
							backgroundColor: isDark ? '#a5b4fc' : '#4f46e5',
						}}
					/>
					<Text className='text-xs' style={{ color: colors.noActive }}>
						Basic rate (20%)
					</Text>
				</View>

				<View className='flex-row items-center gap-1'>
					<View
						style={{
							width: 12,
							height: 12,
							borderRadius: 2,
							backgroundColor: '#f59e0b',
						}}
					/>
					<Text className='text-xs' style={{ color: colors.noActive }}>
						Higher rate (40%)
					</Text>
				</View>
			</View>
		</View>
	);
};
