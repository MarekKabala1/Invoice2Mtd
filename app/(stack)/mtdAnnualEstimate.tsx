/**
 * mtdAnnualEstimate.tsx
 *
 * Full-year tax estimate screen. Aggregates all 4 quarters, shows income &
 * profit summary, tax band bar (SVG), income tax breakdown, NI breakdown,
 * and the annual summary card with total tax and NI.
 *
 * Depends on: hooks/useMtdData.ts, utils/mtdTaxCalc.ts, utils/mtdDates.ts,
 *             utils/mtdCategories.ts, components/TaxBandBar.tsx
 * Used by: app/(drawer)/(tabs)/tax.tsx (nav tile)
 */

import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Linking } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useAppSettings } from '@/context/AppSettingsContext';
import { useMtdData } from '@/hooks/useMtdData';
import { currentTaxYearStart, taxYearLabel, quartersForTaxYear } from '@/utils/mtdDates';
import { estimateTax, projectFullYearTax, formatGBP, formatPercent } from '@/utils/mtdTaxCalc';
import { useTaxRates } from '@/hooks/useTaxRates';
import { TaxBandBar } from '@/components/TaxBandBar';
import { Ionicons } from '@expo/vector-icons';

export default function MtdAnnualEstimateScreen() {
	const { colors, isDark } = useTheme();
	const { settings } = useAppSettings();
	const userId = settings?.userId ?? '';
	const rates = useTaxRates();

	const startYear = currentTaxYearStart();
	const tyLabel = taxYearLabel(startYear);
	const quarters = quartersForTaxYear(startYear);

	// Fetch data for all 4 quarters
	const q1 = useMtdData({ taxYear: tyLabel, quarter: 1, userId });
	const q2 = useMtdData({ taxYear: tyLabel, quarter: 2, userId });
	const q3 = useMtdData({ taxYear: tyLabel, quarter: 3, userId });
	const q4 = useMtdData({ taxYear: tyLabel, quarter: 4, userId });

	const allQuarters = [q1, q2, q3, q4];
	const isLoading = allQuarters.some((q) => q.isLoading);
	const anyError = allQuarters.find((q) => q.error);

	// Aggregate all quarters
	const totals = useMemo(() => {
		let totalTurnover = 0;
		let totalExpenses = 0;
		let quartersWithData = 0;

		for (const q of allQuarters) {
			if (q.aggregates) {
				totalTurnover += q.aggregates.totalTurnover;
				totalExpenses += q.aggregates.totalAllowableExpenses;
				if (q.aggregates.totalTurnover > 0 || q.aggregates.totalAllowableExpenses > 0) {
					quartersWithData++;
				}
			}
		}

		return { totalTurnover, totalExpenses, quartersWithData };
	}, [q1.aggregates, q2.aggregates, q3.aggregates, q4.aggregates]);

	// Calculate tax estimate
	const taxEstimate = useMemo(() => {
		if (totals.quartersWithData === 0) return null;
		if (totals.quartersWithData === 4) {
			return estimateTax(totals.totalTurnover, totals.totalExpenses, rates);
		}
		// Project from partial data
		return projectFullYearTax(totals.quartersWithData as 1 | 2 | 3 | 4, totals.totalTurnover, totals.totalExpenses, rates);
	}, [totals, rates]);

	if (isLoading) {
		return (
			<View className='flex-1 items-center justify-center' style={{ backgroundColor: colors.primary }}>
				<ActivityIndicator size='large' color={colors.text} />
			</View>
		);
	}

	if (anyError) {
		return (
			<View className='flex-1 items-center justify-center px-6' style={{ backgroundColor: colors.primary }}>
				<Text className='text-base text-center mb-4' style={{ color: colors.danger }}>
					{anyError.error}
				</Text>
			</View>
		);
	}

	if (totals.quartersWithData === 0) {
		return (
			<ScrollView
				className='flex-1'
				style={{ backgroundColor: colors.primary }}
				contentContainerStyle={{ padding: 20, alignItems: 'center', justifyContent: 'center', flexGrow: 1 }}>
				<Ionicons name='calculator-outline' size={64} color={colors.noActive} />
				<Text className='text-xl font-bold mt-4' style={{ color: colors.text }}>
					No data yet
				</Text>
				<Text className='text-sm mt-2 text-center' style={{ color: colors.noActive }}>
					Add income and expense records through the Tax tab to build your annual estimate.
				</Text>
			</ScrollView>
		);
	}

	const netProfit = totals.totalTurnover - totals.totalExpenses;

	return (
		<ScrollView className='flex-1' style={{ backgroundColor: colors.primary }} contentContainerStyle={{ padding: 20 }}>
			{/* Projection warning */}
			{totals.quartersWithData < 4 && (
					<View className='rounded-lg p-3 mb-4 flex-row items-center' style={{ backgroundColor: isDark ? 'rgba(245,158,11,0.2)' : 'rgba(245,158,11,0.1)' }}>
					<Ionicons name='warning-outline' size={20} color={colors.warning} />
					<Text className='text-xs ml-2 flex-1' style={{ color: colors.warning }}>
						Projection based on {totals.quartersWithData} quarter{totals.quartersWithData > 1 ? 's' : ''} of data. Actual annual figures may differ.
					</Text>
				</View>
			)}

			{/* Income & Profit card */}
			<View className='rounded-lg p-4 mb-4' style={{ backgroundColor: isDark ? colors.nav : colors.card }}>
				<Text className='text-xs font-bold uppercase tracking-widest mb-3' style={{ color: colors.noActive }}>
					Income & Profit
				</Text>
				<View className='flex-row justify-between py-1'>
					<Text className='text-sm' style={{ color: colors.text }}>
						Total turnover
					</Text>
					<Text className='text-sm font-bold tabular-nums' style={{ color: colors.text }}>
						{formatGBP(totals.totalTurnover)}
					</Text>
				</View>
				<View className='flex-row justify-between py-1'>
					<Text className='text-sm' style={{ color: colors.text }}>
						Allowable expenses
					</Text>
					<Text className='text-sm tabular-nums' style={{ color: colors.text }}>
						{formatGBP(totals.totalExpenses)}
					</Text>
				</View>
				<View
					className='flex-row justify-between items-center pt-2 mt-2'
					style={{ borderTopWidth: 1, borderTopColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
					<Text className='text-base font-bold' style={{ color: colors.text }}>
						Net Profit
					</Text>
					<Text className='text-xl font-bold tabular-nums' style={{ color: netProfit >= 0 ? colors.success : colors.danger }}>
						{formatGBP(netProfit)}
					</Text>
				</View>
			</View>

			{/* Tax Band Bar Visualization */}
			{taxEstimate && netProfit > 0 && (
				<TaxBandBar netProfit={netProfit} totalTurnover={totals.totalTurnover} taxRates={rates} isDark={isDark} colors={colors} />
			)}

			{/* Income Tax card */}
			{taxEstimate && (
				<View className='rounded-lg p-4 mb-4' style={{ backgroundColor: isDark ? colors.nav : colors.card }}>
					<Text className='text-xs font-bold uppercase tracking-widest mb-3' style={{ color: colors.noActive }}>
						Income Tax
					</Text>
					<View className='flex-row justify-between py-1'>
						<Text className='text-sm' style={{ color: colors.text }}>
							Taxable profit
						</Text>
						<Text className='text-sm tabular-nums' style={{ color: colors.text }}>
							{formatGBP(taxEstimate.taxableProfit)}
						</Text>
					</View>
					<View className='flex-row justify-between py-1'>
						<Text className='text-sm' style={{ color: colors.text }}>
							Personal allowance
						</Text>
						<Text className='text-sm tabular-nums' style={{ color: colors.text }}>
							-{formatGBP(taxEstimate.personalAllowanceUsed)}
						</Text>
					</View>
					{taxEstimate.basicRateTax > 0 && (
						<View className='flex-row justify-between py-1'>
							<Text className='text-sm' style={{ color: colors.text }}>
								Basic rate (20%)
							</Text>
							<Text className='text-sm tabular-nums' style={{ color: colors.text }}>
								{formatGBP(taxEstimate.basicRateTax)}
							</Text>
						</View>
					)}
					{taxEstimate.higherRateTax > 0 && (
						<View className='flex-row justify-between py-1'>
							<Text className='text-sm' style={{ color: colors.text }}>
								Higher rate (40%)
							</Text>
							<Text className='text-sm tabular-nums' style={{ color: colors.text }}>
								{formatGBP(taxEstimate.higherRateTax)}
							</Text>
						</View>
					)}
					<View
						className='flex-row justify-between items-center pt-2 mt-2'
						style={{ borderTopWidth: 1, borderTopColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
						<Text className='text-sm font-bold' style={{ color: colors.text }}>
							Total Income Tax
						</Text>
						<Text className='text-base font-bold tabular-nums' style={{ color: colors.text }}>
							{formatGBP(taxEstimate.totalIncomeTax)}
						</Text>
					</View>
				</View>
			)}

			{/* NI card */}
			{taxEstimate && (
				<View className='rounded-lg p-4 mb-4' style={{ backgroundColor: isDark ? colors.nav : colors.card }}>
					<Text className='text-xs font-bold uppercase tracking-widest mb-3' style={{ color: colors.noActive }}>
						National Insurance
					</Text>
					{taxEstimate.class2NI > 0 && (
						<View className='flex-row justify-between py-1'>
							<Text className='text-sm' style={{ color: colors.text }}>
								Class 2 (£3.45/week)
							</Text>
							<Text className='text-sm tabular-nums' style={{ color: colors.text }}>
								{formatGBP(taxEstimate.class2NI)}
							</Text>
						</View>
					)}
					{taxEstimate.ni4LowerBand > 0 && (
						<View className='flex-row justify-between py-1'>
							<Text className='text-sm' style={{ color: colors.text }}>
								Class 4 lower (6%)
							</Text>
							<Text className='text-sm tabular-nums' style={{ color: colors.text }}>
								{formatGBP(taxEstimate.ni4LowerBand)}
							</Text>
						</View>
					)}
					{taxEstimate.ni4UpperBand > 0 && (
						<View className='flex-row justify-between py-1'>
							<Text className='text-sm' style={{ color: colors.text }}>
								Class 4 upper (2%)
							</Text>
							<Text className='text-sm tabular-nums' style={{ color: colors.text }}>
								{formatGBP(taxEstimate.ni4UpperBand)}
							</Text>
						</View>
					)}
					<View
						className='flex-row justify-between items-center pt-2 mt-2'
						style={{ borderTopWidth: 1, borderTopColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
						<Text className='text-sm font-bold' style={{ color: colors.text }}>
							Total NI
						</Text>
						<Text className='text-base font-bold tabular-nums' style={{ color: colors.text }}>
							{formatGBP(taxEstimate.totalNI)}
						</Text>
					</View>
				</View>
			)}

			{/* Summary card — the hero */}
			{taxEstimate && (
				<View className='rounded-lg p-6 mb-4' style={{ backgroundColor: isDark ? '#1e3a8a' : '#1d4ed8' }}>
					<Text className='text-xs font-bold uppercase tracking-widest mb-3' style={{ color: 'rgba(255,255,255,0.7)' }}>
						Annual Summary
					</Text>
					<Text className='text-4xl font-bold text-white tabular-nums'>{formatGBP(taxEstimate.totalTaxAndNI)}</Text>
					<Text className='text-sm mt-2' style={{ color: 'rgba(255,255,255,0.8)' }}>
						Effective rate: {formatPercent(taxEstimate.effectiveRate)}
					</Text>
					<Text className='text-sm' style={{ color: 'rgba(255,255,255,0.8)' }}>
						Set aside: {formatGBP(taxEstimate.quarterlySetAside)}/quarter
					</Text>
				</View>
			)}

			{/* Key dates */}
			<View className='rounded-lg p-4 mb-4' style={{ backgroundColor: isDark ? colors.nav : colors.card }}>
				<Text className='text-xs font-bold uppercase tracking-widest mb-3' style={{ color: colors.noActive }}>
					Key Dates
				</Text>
				{quarters.map((q) => (
					<View key={q.quarter} className='flex-row justify-between py-1'>
						<Text className='text-sm' style={{ color: colors.text }}>
							{q.label}
						</Text>
						<Text className='text-sm' style={{ color: colors.noActive }}>
							Due {q.submissionDeadline}
						</Text>
					</View>
				))}
			</View>

			{/* Disclaimer */}
			<View className='rounded-lg p-4 mb-4' style={{ backgroundColor: isDark ? colors.nav : colors.card }}>
				<Text className='text-xs' style={{ color: colors.noActive }}>
					ESTIMATES ONLY — not official HMRC calculations. Update rates each April. Consult an accountant for actual tax filing.
				</Text>
				<TouchableOpacity className='mt-2' onPress={() => Linking.openURL('https://www.gov.uk/government/collections/making-tax-digital-for-income-tax')}>
					<Text className='text-xs font-bold' style={{ color: isDark ? '#93c5fd' : '#2563eb' }}>
						GOV.UK — Making Tax Digital
					</Text>
				</TouchableOpacity>
			</View>
		</ScrollView>
	);
}
