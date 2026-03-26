/**
 * mtdAnnualEstimate.tsx
 *
 * SA103-style Self Assessment summary screen. Aggregates all 4 quarters,
 * shows per-category expense breakdown, CIS deductions, income tax and
 * NI estimates. Designed for year-end Self Assessment preparation.
 *
 * Depends on: hooks/useMtdData.ts, utils/mtdTaxCalc.ts, utils/mtdDates.ts,
 *             utils/mtdCategories.ts, components/TaxBandBar.tsx
 * Used by: app/(drawer)/(tabs)/tax.tsx (nav tile)
 */

import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Linking } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useAppSettings } from '@/context/AppSettingsContext';
import { useMtdDataAllQuarters } from '@/hooks/useMtdDataAllQuarters';
import { currentTaxYearStart, taxYearLabel, quartersForTaxYear } from '@/utils/mtdDates';
import { estimateTax, formatGBP, formatPercent } from '@/utils/mtdTaxCalc';
import { useTaxRates } from '@/hooks/useTaxRates';
import { TaxBandBar } from '@/components/TaxBandBar';
import { Ionicons } from '@expo/vector-icons';
import { ExpenseCategory } from '@/types/mtd';
import { EXPENSE_CATEGORY_LABELS, isAllowable, EXPENSE_ONLY_CATEGORIES } from '@/utils/mtdCategories';

export default function MtdAnnualEstimateScreen() {
	const { colors, isDark } = useTheme();
	const { settings } = useAppSettings();
	const userId = settings?.userId ?? '';
	const rates = useTaxRates();
	const [showAllExpenses, setShowAllExpenses] = useState(false);

	const startYear = currentTaxYearStart();
	const tyLabel = taxYearLabel(startYear);
	const quarters = quartersForTaxYear(startYear);


	// Fetch data for all 4 quarters via consolidated hook
	const { allQuarters, isLoading, error: anyError, q1, q2, q3, q4 } = useMtdDataAllQuarters(tyLabel, userId);

	// Aggregate all quarters — actual figures + per-category breakdown + CIS
	const totals = useMemo(() => {
		let actualTurnover = 0;
		let totalCisDeducted = 0;
		let quartersWithData = 0;

		// Per-category sums for SA103 breakdown
		const categoryTotals = {} as Record<ExpenseCategory, number>;
		for (const cat of EXPENSE_ONLY_CATEGORIES) {
			categoryTotals[cat] = 0;
		}

		for (const q of allQuarters) {
			if (q.aggregates) {
				actualTurnover += q.aggregates.totalTurnover;
				totalCisDeducted += q.aggregates.cisDeducted;
				for (const cat of EXPENSE_ONLY_CATEGORIES) {
					categoryTotals[cat] += (q.aggregates[cat as keyof typeof q.aggregates] as number) ?? 0;
				}
				if (q.aggregates.totalTurnover > 0 || q.aggregates.totalAllowableExpenses > 0) {
					quartersWithData++;
				}
			}
		}

		// Compute actual totals
		const allowableCategories = EXPENSE_ONLY_CATEGORIES.filter((c) => isAllowable(c));
		const disallowableCategories = EXPENSE_ONLY_CATEGORIES.filter((c) => !isAllowable(c));
		const totalAllowable = allowableCategories
			.reduce((sum: number, c: ExpenseCategory) => sum + (categoryTotals[c] || 0), 0);
		const totalDisallowable = disallowableCategories
			.reduce((sum: number, c: ExpenseCategory) => sum + (categoryTotals[c] || 0), 0);
		const actualNetProfit = actualTurnover - totalAllowable;

		// Projected annual for tax calculation
		const elapsedFraction = quartersWithData > 0 ? quartersWithData / 4 : 0;
		const projectedTurnover = elapsedFraction > 0 ? actualTurnover / elapsedFraction : 0;
		const projectedExpenses = elapsedFraction > 0 ? totalAllowable / elapsedFraction : 0;

		return {
			actualTurnover,
			totalCisDeducted,
			totalAllowable,
			totalDisallowable,
			actualNetProfit,
			categoryTotals,
			projectedTurnover,
			projectedExpenses,
			quartersWithData,
		};
	}, [q1.aggregates, q2.aggregates, q3.aggregates, q4.aggregates]);

	// Tax estimate from projected annual figures
	const taxEstimate = useMemo(() => {
		if (totals.quartersWithData === 0) return null;
		return estimateTax(totals.projectedTurnover, totals.projectedExpenses, rates);
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
					{anyError}
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

	const projectedNetProfit = totals.projectedTurnover - totals.projectedExpenses;

	// Split expense categories into allowable and disallowable
	const allowableCategories = EXPENSE_ONLY_CATEGORIES.filter((c) => isAllowable(c));
	const disallowableCategories = EXPENSE_ONLY_CATEGORIES.filter((c) => !isAllowable(c));

	// Filter to non-zero categories for compact view
	const nonZeroAllowable = allowableCategories.filter((c) => (totals.categoryTotals[c] || 0) > 0);
	const nonZeroDisallowable = disallowableCategories.filter((c) => (totals.categoryTotals[c] || 0) > 0);
	const hasAnyDisallowable = totals.totalDisallowable > 0;

	const cardBg = { backgroundColor: isDark ? colors.nav : colors.card };
	const dividerStyle = { borderTopWidth: 1, borderTopColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' };

	return (
		<ScrollView className='flex-1' style={{ backgroundColor: colors.primary }} contentContainerStyle={{ padding: 20 }}>

			{/* Projection warning */}
			{totals.quartersWithData < 4 && (
				<View className='rounded-lg p-3 mb-4 flex-row items-center' style={{ backgroundColor: isDark ? 'rgba(245,158,11,0.2)' : 'rgba(245,158,11,0.1)' }}>
					<Ionicons name='warning-outline' size={20} color={colors.warning} />
					<Text className='text-xs ml-2 flex-1' style={{ color: colors.warning }}>
						Based on {formatGBP(totals.actualNetProfit)} profit in {totals.quartersWithData} of 4 quarters. Projected annual: {formatGBP(projectedNetProfit)}.
					</Text>
				</View>
			)}

			{/* ════════════════════════════════════════════════════════════════
			    SECTION 1: INCOME (SA103 Turnover)
			    ════════════════════════════════════════════════════════════════ */}
			<View className='rounded-lg p-4 mb-4' style={cardBg}>
				<Text className='text-xs font-bold uppercase tracking-widest mb-3' style={{ color: colors.noActive }}>
					Income — {totals.quartersWithData} of 4 quarters
				</Text>
				<View className='flex-row justify-between py-1'>
					<Text className='text-sm' style={{ color: colors.text }}>
						Total turnover (before tax)
					</Text>
					<Text className='text-sm font-bold tabular-nums' style={{ color: colors.text }}>
						{formatGBP(totals.actualTurnover)}
					</Text>
				</View>
				{totals.totalCisDeducted > 0 && (
					<View className='flex-row justify-between py-1'>
						<Text className='text-sm' style={{ color: colors.text }}>
							CIS tax deducted at source
						</Text>
						<Text className='text-sm font-bold tabular-nums' style={{ color: colors.warning }}>
							-{formatGBP(totals.totalCisDeducted)}
						</Text>
					</View>
				)}
				<View className='flex-row justify-between py-1'>
					<Text className='text-sm' style={{ color: colors.text }}>
						Amount received (after CIS)
					</Text>
					<Text className='text-sm font-bold tabular-nums' style={{ color: colors.success }}>
						{formatGBP(totals.actualTurnover - totals.totalCisDeducted)}
					</Text>
				</View>
			</View>

			{/* ════════════════════════════════════════════════════════════════
			    SECTION 2: ALLOWABLE EXPENSES (SA103 breakdown)
			    ════════════════════════════════════════════════════════════════ */}
			<View className='rounded-lg p-4 mb-4' style={cardBg}>
				<Text className='text-xs font-bold uppercase tracking-widest mb-3' style={{ color: colors.noActive }}>
					Allowable Expenses (SA103)
				</Text>

				{(showAllExpenses ? allowableCategories : nonZeroAllowable).map((cat) => (
					<View key={cat} className='flex-row justify-between py-1'>
						<Text className='text-sm flex-1 mr-2' style={{ color: colors.text }}>
							{EXPENSE_CATEGORY_LABELS[cat]}
						</Text>
						<Text className='text-sm tabular-nums' style={{ color: colors.text }}>
							{formatGBP(totals.categoryTotals[cat] || 0)}
						</Text>
					</View>
				))}

				{/* Toggle show all */}
				{nonZeroAllowable.length > 0 && nonZeroAllowable.length < allowableCategories.length && (
					<TouchableOpacity onPress={() => setShowAllExpenses(!showAllExpenses)} className='mt-2 py-1'>
						<Text className='text-xs font-bold' style={{ color: colors.secondary }}>
							{showAllExpenses ? 'Show non-zero only' : `Show all ${allowableCategories.length} categories`}
						</Text>
					</TouchableOpacity>
				)}

				{/* Disallowable expenses */}
				{hasAnyDisallowable && (
					<>
						<View className='mt-3 mb-2' style={dividerStyle} />
						<Text className='text-xs font-bold uppercase tracking-widest mb-2' style={{ color: colors.warning }}>
							Disallowable (not deducted)
						</Text>
						{(showAllExpenses ? disallowableCategories : nonZeroDisallowable).map((cat) => (
							<View key={cat} className='flex-row justify-between py-1'>
								<Text className='text-sm flex-1 mr-2' style={{ color: colors.noActive }}>
									{EXPENSE_CATEGORY_LABELS[cat]}
								</Text>
								<Text className='text-sm tabular-nums' style={{ color: colors.noActive }}>
									{formatGBP(totals.categoryTotals[cat] || 0)}
								</Text>
							</View>
						))}
					</>
				)}

				{/* Totals */}
				<View className='mt-3 pt-2' style={dividerStyle}>
					<View className='flex-row justify-between py-1'>
						<Text className='text-sm font-bold' style={{ color: colors.text }}>
							Total allowable expenses
						</Text>
						<Text className='text-sm font-bold tabular-nums' style={{ color: colors.text }}>
							{formatGBP(totals.totalAllowable)}
						</Text>
					</View>
					<View className='flex-row justify-between items-center pt-2'>
						<Text className='text-base font-bold' style={{ color: colors.text }}>
							Net Profit
						</Text>
						<Text className='text-xl font-bold tabular-nums' style={{ color: totals.actualNetProfit >= 0 ? colors.success : colors.danger }}>
							{formatGBP(totals.actualNetProfit)}
						</Text>
					</View>
				</View>
			</View>

			{/* ════════════════════════════════════════════════════════════════
			    SECTION 3: TAX ESTIMATE (projected annual)
			    ════════════════════════════════════════════════════════════════ */}
			{taxEstimate && (
				<View className='rounded-lg p-4 mb-4' style={cardBg}>
					<Text className='text-xs font-bold uppercase tracking-widest mb-3' style={{ color: colors.noActive }}>
						Tax Estimate {totals.quartersWithData < 4 ? '(projected annual)' : ''}
					</Text>

					{/* Amount before tax */}
					<View className='flex-row justify-between py-1'>
						<Text className='text-sm' style={{ color: colors.text }}>
							Turnover (amount before tax)
						</Text>
						<Text className='text-sm font-bold tabular-nums' style={{ color: colors.text }}>
							{formatGBP(taxEstimate.taxableProfit)}
						</Text>
					</View>

					{/* Personal allowance */}
					<View className='flex-row justify-between py-1'>
						<Text className='text-sm' style={{ color: colors.text }}>
							Personal allowance
						</Text>
						<Text className='text-sm tabular-nums' style={{ color: colors.text }}>
							-{formatGBP(taxEstimate.personalAllowanceUsed)}
						</Text>
					</View>

					{/* Taxable after allowance */}
					<View className='flex-row justify-between py-1'>
						<Text className='text-sm' style={{ color: colors.text }}>
							Taxable after allowance
						</Text>
						<Text className='text-sm font-bold tabular-nums' style={{ color: colors.text }}>
							{formatGBP(taxEstimate.taxableAfterAllowance)}
						</Text>
					</View>

					{/* Income tax bands */}
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

					{/* Total income tax */}
					<View className='flex-row justify-between items-center pt-2 mt-2' style={dividerStyle}>
						<Text className='text-sm font-bold' style={{ color: colors.text }}>
							Total Income Tax
						</Text>
						<Text className='text-base font-bold tabular-nums' style={{ color: colors.text }}>
							{formatGBP(taxEstimate.totalIncomeTax)}
						</Text>
					</View>
				</View>
			)}

			{/* TaxBandBar — uses projected figures to match tax estimate */}
			{taxEstimate && projectedNetProfit > 0 && (
				<TaxBandBar netProfit={projectedNetProfit} totalTurnover={totals.projectedTurnover} taxRates={rates} isDark={isDark} colors={colors} />
			)}

			{/* ════════════════════════════════════════════════════════════════
			    SECTION 4: NATIONAL INSURANCE
			    ════════════════════════════════════════════════════════════════ */}
			{taxEstimate && (
				<View className='rounded-lg p-4 mb-4' style={cardBg}>
					<Text className='text-xs font-bold uppercase tracking-widest mb-3' style={{ color: colors.noActive }}>
						National Insurance
					</Text>

					{/* Class 2 NI */}
					<View className='flex-row justify-between py-1'>
						<View className='flex-1 mr-2'>
							<Text className='text-sm' style={{ color: colors.text }}>
								Class 2 NI
							</Text>
							<Text className='text-xs' style={{ color: colors.noActive }}>
								{taxEstimate.taxableProfit >= 6725
									? 'Treated as paid (free) — protects State Pension'
									: 'Voluntary: £3.45/week to protect pension record'}
							</Text>
						</View>
						<Text className='text-sm font-bold tabular-nums' style={{ color: colors.text }}>
							£0.00
						</Text>
					</View>

					{/* Class 4 NI */}
					{taxEstimate.ni4LowerBand > 0 && (
						<View className='flex-row justify-between py-1'>
							<Text className='text-sm' style={{ color: colors.text }}>
								Class 4 lower (6% on £12,570–£50,270)
							</Text>
							<Text className='text-sm tabular-nums' style={{ color: colors.text }}>
								{formatGBP(taxEstimate.ni4LowerBand)}
							</Text>
						</View>
					)}
					{taxEstimate.ni4UpperBand > 0 && (
						<View className='flex-row justify-between py-1'>
							<Text className='text-sm' style={{ color: colors.text }}>
								Class 4 upper (2% above £50,270)
							</Text>
							<Text className='text-sm tabular-nums' style={{ color: colors.text }}>
								{formatGBP(taxEstimate.ni4UpperBand)}
							</Text>
						</View>
					)}
					{taxEstimate.ni4LowerBand === 0 && taxEstimate.ni4UpperBand === 0 && (
						<View className='flex-row justify-between py-1'>
							<Text className='text-sm' style={{ color: colors.text }}>
								Class 4 NI (6% on profits £12,570–£50,270)
							</Text>
							<Text className='text-sm tabular-nums' style={{ color: colors.text }}>
								£0.00
							</Text>
						</View>
					)}

					{/* Total NI */}
					<View className='flex-row justify-between items-center pt-2 mt-2' style={dividerStyle}>
						<Text className='text-sm font-bold' style={{ color: colors.text }}>
							Total NI payable
						</Text>
						<Text className='text-base font-bold tabular-nums' style={{ color: colors.text }}>
							{formatGBP(taxEstimate.totalNI)}
						</Text>
					</View>
				</View>
			)}

			{/* ════════════════════════════════════════════════════════════════
			    SECTION 5: CIS DEDUCTIONS & AMOUNT OWED
			    ════════════════════════════════════════════════════════════════ */}
			{taxEstimate && (
				<View className='rounded-lg p-4 mb-4' style={cardBg}>
					<Text className='text-xs font-bold uppercase tracking-widest mb-3' style={{ color: colors.noActive }}>
						Tax Summary
					</Text>

					{/* Total tax + NI */}
					<View className='flex-row justify-between py-1'>
						<Text className='text-sm' style={{ color: colors.text }}>
							Total tax + NI liability
						</Text>
						<Text className='text-sm font-bold tabular-nums' style={{ color: colors.text }}>
							{formatGBP(taxEstimate.totalTaxAndNI)}
						</Text>
					</View>

					{/* CIS already deducted */}
					{totals.totalCisDeducted > 0 && (
						<View className='flex-row justify-between py-1'>
							<Text className='text-sm' style={{ color: colors.text }}>
								CIS already deducted by contractor
							</Text>
							<Text className='text-sm font-bold tabular-nums' style={{ color: colors.success }}>
								-{formatGBP(totals.totalCisDeducted)}
							</Text>
						</View>
					)}

					{/* Amount still owed */}
					<View className='flex-row justify-between items-center pt-2 mt-2' style={dividerStyle}>
						<Text className='text-sm font-bold' style={{ color: colors.text }}>
							{taxEstimate.totalTaxAndNI - totals.totalCisDeducted > 0 ? 'Amount still owed to HMRC' : 'Refund expected from HMRC'}
						</Text>
						<Text className='text-xl font-bold tabular-nums' style={{ color: taxEstimate.totalTaxAndNI - totals.totalCisDeducted > 0 ? colors.danger : colors.success }}>
							{formatGBP(Math.abs(taxEstimate.totalTaxAndNI - totals.totalCisDeducted))}
						</Text>
					</View>

					{/* Effective rate and set aside */}
					<View className='flex-row justify-between py-1 mt-2'>
						<Text className='text-xs' style={{ color: colors.noActive }}>
							Effective rate: {formatPercent(taxEstimate.effectiveRate)}
						</Text>
						<Text className='text-xs' style={{ color: colors.noActive }}>
							Set aside: {formatGBP(taxEstimate.quarterlySetAside)}/quarter
						</Text>
					</View>
				</View>
			)}

			{/* ════════════════════════════════════════════════════════════════
			    SECTION 6: KEY DATES
			    ════════════════════════════════════════════════════════════════ */}
			<View className='rounded-lg p-4 mb-4' style={cardBg}>
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
			<View className='rounded-lg p-4 mb-4' style={cardBg}>
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
