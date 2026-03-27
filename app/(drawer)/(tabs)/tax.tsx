/**
 * tax.tsx
 *
 * Tax tab — the MTD hub screen. Shows current quarter stats, next deadline,
 * and navigation tiles to all MTD features. Reads quarterlyTaxEnabled from
 * appSettings to show enrolment state when disabled.
 *
 * Depends on: hooks/useMtdData, hooks/useMtdDeadlines, hooks/useUnpaidInvoicesForQuarter,
 *             hooks/useMtdDataAllQuarters, context/AppSettingsContext, utils/mtdDates, utils/mtdTaxCalc
 * Used by: app/(drawer)/(tabs)/_layout.tsx (tab entry)
 */

import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useAppSettings } from '@/context/AppSettingsContext';
import { useMtdData } from '@/hooks/useMtdData';
import { useMtdDeadlines } from '@/hooks/useMtdDeadlines';
import { useUnpaidInvoicesForQuarter } from '@/hooks/useUnpaidInvoicesForQuarter';
import { useMtdDataAllQuarters } from '@/hooks/useMtdDataAllQuarters';
import { currentTaxYearStart, taxYearLabel, currentTaxYear } from '@/utils/mtd/mtdDates';
import { estimateTax, formatGBP } from '@/utils/mtd/mtdTaxCalc';
import { useTaxRates } from '@/hooks/useTaxRates';
import { EXPENSE_CATEGORY_LABELS, EXPENSE_ONLY_CATEGORIES } from '@/utils/mtd/mtdCategories';
import { QuarterAggregates } from '@/types/mtd';
import { Ionicons } from '@expo/vector-icons';

export default function TaxScreen() {
	const { colors, isDark } = useTheme();
	const router = useRouter();
	const { settings, update } = useAppSettings();

	const userId = settings?.userId ?? '';
	const isEnabled = settings?.quarterlyTaxEnabled ?? true;
	const autoCalc = settings?.autoCalculateQuarters ?? true;

	const startYear = currentTaxYearStart();
	const tyLabel = taxYearLabel(startYear);
	const ty = currentTaxYear();

	// Determine current quarter
	const currentQuarter = useMemo(() => {
		const today = new Date();
		const qs = ty.quarters;
		const todayISO = today.toISOString().slice(0, 10);
		for (const q of qs) {
			if (todayISO >= q.periodStart && todayISO <= q.periodEnd) {
				return q;
			}
		}
		return qs[0]; // fallback
	}, [ty]);

	const { aggregates, isLoading, refresh } = useMtdData({
		taxYear: tyLabel,
		quarter: currentQuarter.quarter,
		userId,
	});

	const { unpaidCount, unpaidTotal } = useUnpaidInvoicesForQuarter();
	const { nextDeadline } = useMtdDeadlines(2);
	const rates = useTaxRates();

	// Yearly turnover — fetch all 4 quarters via consolidated hook
	const { yearlyTurnover } = useMtdDataAllQuarters(tyLabel, userId);

	// Tax estimate for current quarter
	const taxEstimate = useMemo(() => {
		if (!aggregates) return null;
		return estimateTax(aggregates.totalTurnover, aggregates.totalAllowableExpenses, rates);
	}, [aggregates, rates]);

	// Top 3 expense categories
	const topExpenses = useMemo(() => {
		if (!aggregates) return [];
		return EXPENSE_ONLY_CATEGORIES.map((cat) => ({
			category: cat,
			label: EXPENSE_CATEGORY_LABELS[cat],
			amount: aggregates[cat as keyof QuarterAggregates] as number,
		}))
			.filter((e) => e.amount > 0)
			.sort((a, b) => b.amount - a.amount)
			.slice(0, 3);
	}, [aggregates]);

	// Enrolment state
	if (!isEnabled) {
		return (
			<ScrollView className='flex-1' style={{ backgroundColor: colors.primary }} contentContainerStyle={{ padding: 20, flexGrow: 1, justifyContent: 'center' }}>
				<View className='items-center'>
					<Ionicons name='calculator-outline' size={64} color={colors.noActive} />
					<Text className='text-xl font-bold mt-4 text-center' style={{ color: colors.text }}>
						Making Tax Digital
					</Text>
					<Text className='text-sm mt-2 text-center' style={{ color: colors.noActive }}>
						Enable MTD quarterly updates to track your income tax obligations.
					</Text>
					<View className='mt-6 p-4 rounded-lg' style={{ backgroundColor: isDark ? colors.nav : colors.card }}>
						<Text className='text-sm mb-2' style={{ color: colors.text }}>
							Required if your qualifying income is over:
						</Text>
						<Text className='text-xs' style={{ color: colors.noActive }}>
							£50,000 from April 2026{'\n'}
							£30,000 from April 2027{'\n'}
							£20,000 from April 2028
						</Text>
					</View>
					<TouchableOpacity
						className='mt-6 px-8 py-4 rounded-lg'
						style={{ backgroundColor: isDark ? '#2563eb' : '#1d4ed8' }}
						onPress={() => update({ quarterlyTaxEnabled: true })}>
						<Text className='text-white font-bold text-base'>Enable MTD</Text>
					</TouchableOpacity>
				</View>
			</ScrollView>
		);
	}

	// Main MTD hub
	return (
		<ScrollView className='flex-1' style={{ backgroundColor: colors.primary }}>
			{/* Header — mtd-accent-600 full-bleed */}
			<View className='px-5 pt-6 pb-8' style={{ backgroundColor: isDark ? '#1e3a8a' : '#2563eb' }}>
				<View className='flex-row items-center justify-between'>
					<Text className='text-2xl font-bold text-white'>Tax</Text>
					<View className='px-3 py-1 rounded-full' style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.15)' }}>
						<Text className='text-xs font-bold' style={{ color: isDark ? '#c7d2fe' : '#e0e7ff' }}>
							{tyLabel}
						</Text>
					</View>
				</View>
				<Text className='text-sm mt-1' style={{ color: 'rgba(255,255,255,0.8)' }}>
					{currentQuarter.label}
				</Text>

				{/* Quarter and Year turnover */}
				<View className='flex-row gap-4 mt-4'>
					<View className='flex-1'>
						<Text className='text-xs' style={{ color: 'rgba(255,255,255,0.6)' }}>
							Quarter turnover
						</Text>
						<Text className='text-xl font-bold text-white tabular-nums mt-1'>{formatGBP(aggregates?.totalTurnover ?? 0)}</Text>
					</View>
					<View className='flex-1'>
						<Text className='text-xs' style={{ color: 'rgba(255,255,255,0.6)' }}>
							Year turnover
						</Text>
						<Text className='text-xl font-bold text-white tabular-nums mt-1'>{formatGBP(yearlyTurnover)}</Text>
					</View>
				</View>
			</View>

			<View className='px-5 py-4 gap-4'>
				{/* Loading state */}
				{isLoading ? (
					<View className='py-8 items-center'>
						<ActivityIndicator size='large' color={colors.text} />
					</View>
				) : (
					<>
						{/* Unpaid invoices banner */}
						{unpaidCount > 0 && (
							<TouchableOpacity
								className='rounded-lg p-3 mb-2 flex-row items-center gap-2'
								style={{ backgroundColor: isDark ? 'rgba(238,28,28,0.15)' : 'rgba(238,28,28,0.08)' }}
								onPress={() => router.push('/(drawer)/(tabs)/invoices')}>
								<Ionicons name='alert-circle-outline' size={20} color='#ee1c1c' />
								<View className='flex-1'>
									<Text className='text-sm font-bold' style={{ color: '#ee1c1c' }}>
										{unpaidCount} unpaid invoice{unpaidCount > 1 ? 's' : ''}
									</Text>
									<Text className='text-xs' style={{ color: isDark ? '#fca5a5' : '#991b1b' }}>
										Total: {formatGBP(unpaidTotal)} — not yet in MTD records
									</Text>
								</View>
								<Ionicons name='chevron-forward' size={16} color='#ee1c1c' />
							</TouchableOpacity>
						)}

						{/* Quick stats row */}
						<View className='flex-row gap-3'>
							<View className='flex-1 rounded-lg p-4' style={{ backgroundColor: isDark ? colors.nav : colors.card }}>
								<Text className='text-xs' style={{ color: colors.noActive }}>
									Net profit
								</Text>
								<Text className='text-xl font-bold mt-1 tabular-nums' style={{ color: (aggregates?.netProfit ?? 0) >= 0 ? '#39AD6A' : '#ee1c1c' }}>
									{formatGBP(aggregates?.netProfit ?? 0)}
								</Text>
							</View>
							<View className='flex-1 rounded-lg p-4' style={{ backgroundColor: isDark ? colors.nav : colors.card }}>
								<Text className='text-xs' style={{ color: colors.noActive }}>
									Est. quarterly tax
								</Text>
								<Text className='text-xl font-bold mt-1 tabular-nums' style={{ color: colors.text }}>
									{taxEstimate ? formatGBP(taxEstimate.quarterlySetAside) : formatGBP(0)}
								</Text>
							</View>
						</View>

						{/* Next deadline card */}
						{nextDeadline && (
							<TouchableOpacity
								className='rounded-lg p-4'
								style={{ backgroundColor: isDark ? colors.nav : colors.card }}
								onPress={() => router.push('/(stack)/mtdDeadlines')}>
								<View className='flex-row items-center justify-between'>
									<View className='flex-1'>
										<Text className='text-xs' style={{ color: colors.noActive }}>
											Next deadline
										</Text>
										<Text className='text-sm font-bold mt-1' style={{ color: colors.text }}>
											{nextDeadline.label}
										</Text>
										<Text className='text-xs mt-1' style={{ color: colors.noActive }}>
											{nextDeadline.deadlineFormatted}
										</Text>
									</View>
									<View className='items-end'>
										<Ionicons
											name='time-outline'
											size={24}
											color={nextDeadline.status === 'overdue' ? '#ee1c1c' : nextDeadline.status === 'urgent' ? '#f59e0b' : colors.noActive}
										/>
										<Text
											className='text-xs font-bold mt-1'
											style={{
												color: nextDeadline.status === 'overdue' ? '#ee1c1c' : nextDeadline.status === 'urgent' ? '#f59e0b' : colors.noActive,
											}}>
											{nextDeadline.daysUntil < 0
												? `${Math.abs(nextDeadline.daysUntil)}d overdue`
												: nextDeadline.daysUntil === 0
													? 'Today'
													: `${nextDeadline.daysUntil}d`}
										</Text>
									</View>
								</View>
							</TouchableOpacity>
						)}

						{/* Navigation tiles */}
						<View className='flex-row flex-wrap gap-3'>
							<TouchableOpacity
								className='w-[47%] rounded-lg p-4 items-center'
								style={{ backgroundColor: isDark ? colors.nav : colors.card }}
								onPress={() => router.push('/(stack)/addMtdTransaction')}>
								<Ionicons name='add-circle-outline' size={32} color={isDark ? '#93c5fd' : '#2563eb'} />
								<Text className='text-sm font-bold mt-2' style={{ color: colors.text }}>
									Add Record
								</Text>
							</TouchableOpacity>

							<TouchableOpacity
								className='w-[47%] rounded-lg p-4 items-center'
								style={{ backgroundColor: isDark ? colors.nav : colors.card }}
								onPress={() => router.push('/(stack)/mtdQuarterlySummary')}>
								<Ionicons name='bar-chart-outline' size={32} color={isDark ? '#93c5fd' : '#2563eb'} />
								<Text className='text-sm font-bold mt-2' style={{ color: colors.text }}>
									Quarter Detail
								</Text>
							</TouchableOpacity>

							<TouchableOpacity
								className='w-[47%] rounded-lg p-4 items-center'
								style={{ backgroundColor: isDark ? colors.nav : colors.card }}
								onPress={() => router.push('/(stack)/mtdAnnualEstimate')}>
								<Ionicons name='calculator-outline' size={32} color={isDark ? '#93c5fd' : '#2563eb'} />
								<Text className='text-sm font-bold mt-2' style={{ color: colors.text }}>
									Annual Estimate
								</Text>
							</TouchableOpacity>

							<TouchableOpacity
								className='w-[47%] rounded-lg p-4 items-center'
								style={{ backgroundColor: isDark ? colors.nav : colors.card }}
								onPress={() => router.push('/(stack)/mtdDeadlines')}>
								<Ionicons name='calendar-outline' size={32} color={isDark ? '#93c5fd' : '#2563eb'} />
								<Text className='text-sm font-bold mt-2' style={{ color: colors.text }}>
									All Deadlines
								</Text>
							</TouchableOpacity>
						</View>

						{/* Mini expense breakdown */}
						{topExpenses.length > 0 && (
							<View className='rounded-lg p-4 mb-20' style={{ backgroundColor: isDark ? colors.nav : colors.card }}>
								<Text className='text-xs font-bold uppercase tracking-widest mb-3' style={{ color: colors.noActive }}>
									Top Expenses This Quarter
								</Text>
								{topExpenses.map((exp) => (
									<View
										key={exp.category}
										className='flex-row justify-between items-center py-2'
										style={{
											borderBottomWidth: exp !== topExpenses[topExpenses.length - 1] ? 1 : 0,
											borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
										}}>
										<Text className='text-sm flex-1' style={{ color: colors.text }}>
											{exp.label}
										</Text>
										<Text className='text-sm font-bold tabular-nums' style={{ color: colors.text }}>
											{formatGBP(exp.amount)}
										</Text>
									</View>
								))}
							</View>
						)}

						{/* Refresh button when auto-calc is off */}
						{!autoCalc && (
							<TouchableOpacity className='rounded-lg p-3 items-center ' style={{ backgroundColor: isDark ? colors.nav : colors.card }} onPress={refresh}>
								<View className='flex-row items-center gap-2'>
									<Ionicons name='refresh-outline' size={20} color={colors.text} />
									<Text className='text-sm font-bold' style={{ color: colors.text }}>
										Refresh Data
									</Text>
								</View>
							</TouchableOpacity>
						)}
					</>
				)}
			</View>
		</ScrollView>
	);
}
