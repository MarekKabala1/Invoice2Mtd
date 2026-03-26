/**
 * charts.tsx
 *
 * Invoice charts screen. Shows line chart of monthly/individual invoice amounts
 * and summary totals for a selected user.
 *
 * Depends on: hooks/useChartsData, components/Picker, components/BaseCard, context/ThemeContext
 * Used by: app/(drawer)/_layout.tsx (drawer screen)
 */

import React, { useState } from 'react';
import { View, Text, Dimensions, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PickerWithTouchableOpacity from '@/components/Picker';
import { Controller, useForm } from 'react-hook-form';
import { UserType } from '@/db/zodSchema';
import { LineChart } from 'react-native-chart-kit';
import BaseCard from '@/components/BaseCard';
import { useTheme } from '@/context/ThemeContext';
import { useChartsData } from '@/hooks/useChartsData';

export default function Charts() {
	const { control, watch } = useForm<UserType>();
	const {
		userOptions,
		invoices,
		totals,
		error,
		isLoading,
		viewMode,
		setViewMode,
		selectedMonth,
		setSelectedMonth,
		availableMonths,
		chartData,
		setSelectedUserId,
		retry,
	} = useChartsData();

	const { colors, isDark } = useTheme();
	const selectedUserId = watch('id');

	// Sync form selection to hook
	if (selectedUserId) {
		setSelectedUserId(selectedUserId);
	}

	const screenWidth = Dimensions.get('window').width;
	const chartWidth = Math.max(screenWidth - 32, chartData.labels.length * 50);
	const insets = useSafeAreaInsets();

	if (error) {
		return (
			<View style={{ paddingTop: insets.top }} className='flex-1 bg-light-primary dark:bg-dark-primary p-4 w-screen justify-center items-center'>
				<Text className='text-lg text-red-500 text-center mb-4'>{error}</Text>
				<TouchableOpacity onPress={retry} className='bg-light-accent dark:bg-dark-accent p-3 rounded-lg'>
					<Text className='text-light-text dark:text-dark-text'>Retry</Text>
				</TouchableOpacity>
			</View>
		);
	}

	return (
		<View style={{ paddingTop: insets.top }} className='flex-1 bg-light-primary dark:bg-dark-primary p-4 w-screen'>
			<ScrollView>
				<View className='gap-4'>
					<Text className='text-center font-bold text-light-text dark:text-dark-text'>Pick User to display charts</Text>
					<Controller
						control={control}
						name='id'
						render={({ field: { onChange, onBlur, value } }) => (
							<PickerWithTouchableOpacity initialValue={'Select User'} onValueChange={onChange} items={userOptions} disabled={isLoading} />
						)}
					/>

					{invoices.length > 0 && (
						<>
							<View className='flex-row justify-between items-center'>
								<View className='flex-1'>
									<PickerWithTouchableOpacity initialValue={'All Months'} onValueChange={setSelectedMonth} items={availableMonths} disabled={isLoading} />
								</View>
								<View className='flex-row ml-2'>
									<TouchableOpacity
										onPress={() => setViewMode('monthly')}
										className={`px-3 py-1 ${viewMode === 'monthly' ? 'bg-light-accent dark:bg-dark-accent border border-light-accent/50 dark:border-dark-accent/50' : 'bg-light-nav dark:bg-dark-nav'}`}>
										<Text
											className={`${viewMode === 'monthly' ? 'text-light-text dark:text-dark-text font-bold' : 'text-light-text/50 dark:text-dark-text/50'}`}>
											Monthly
										</Text>
									</TouchableOpacity>
									<TouchableOpacity
										onPress={() => setViewMode('all')}
										className={`px-3 py-1 ${viewMode === 'all' ? 'bg-light-accent dark:bg-dark-accent border border-light-accent/50 dark:border-dark-accent/50' : 'bg-light-nav dark:bg-dark-nav'}`}>
										<Text className={`${viewMode === 'all' ? 'text-light-text dark:text-dark-text font-bold' : 'text-light-text/50 dark:text-dark-text/50'}`}>
											All
										</Text>
									</TouchableOpacity>
								</View>
							</View>

							<ScrollView horizontal showsHorizontalScrollIndicator={false}>
								<LineChart
									data={chartData}
									width={chartWidth}
									height={360}
									yAxisLabel='£'
									chartConfig={{
										backgroundColor: colors.nav,
										backgroundGradientFrom: colors.nav,
										backgroundGradientTo: colors.primary,
										paddingTop: 10,
										decimalPlaces: 2,
										color: (opacity = 1) => (isDark ? `rgba(222, 197, 178, ${opacity})` : `rgba(73, 62, 62, ${opacity})`),
										labelColor: (opacity = 1) => (isDark ? `rgba(222, 197, 178, ${opacity})` : `rgba(0, 0, 0, ${opacity})`),
										propsForDots: {
											r: '6',
											strokeWidth: '2',
											stroke: colors.primary,
										},
									}}
									style={{
										marginVertical: 8,
									}}
									verticalLabelRotation={90}
									xLabelsOffset={-10}
									decorator={() => {
										return chartData.datasets[0].data
											.map((value, index) => {
												if (index === 0) return null;
												return (
													<View key={index}>
														<Text
															style={{
																position: 'absolute',
																left: (chartWidth / chartData.labels.length) * index,
																top: 320 - (value / Math.max(...chartData.datasets[0].data)) * 320,
																width: 'auto',
																textAlign: 'center',
																backgroundColor: colors.textOpacity,
																color: colors.primary,
																fontSize: 10,
																padding: 3,
															}}>
															£{value}
														</Text>
													</View>
												);
											})
											.filter(Boolean);
									}}
								/>
							</ScrollView>
						</>
					)}

					<BaseCard className='rounded-sm p-2'>
						<View className='flex-row justify-between border-b border-gray-200 pb-2'>
							<Text className='font-bold text-light-text dark:text-dark-text'>Invoices Sent So Far this Year:</Text>
							<Text className='text-light-text dark:text-dark-text'>{invoices.length}</Text>
						</View>

						<View className='flex-row justify-between border-b border-gray-200 py-2'>
							<Text className='font-bold text-light-text dark:text-dark-text'>Sum Before Tax:</Text>
							<Text className='text-light-text dark:text-dark-text'>{totals.totalBeforeTax.toFixed(2)}</Text>
						</View>

						<View className='flex-row justify-between border-b border-gray-200 py-2'>
							<Text className='font-bold text-light-text dark:text-dark-text'>Sum After Tax:</Text>
							<Text className='text-light-text dark:text-dark-text'>£{totals.totalAfterTax.toFixed(2)}</Text>
						</View>

						<View className='flex-row justify-between py-2'>
							<Text className='font-bold text-light-text dark:text-dark-text'>Tax to Pay:</Text>
							<Text className='text-light-text dark:text-dark-text'>£{totals.taxToPay.toFixed(2)}</Text>
						</View>
					</BaseCard>
				</View>
			</ScrollView>
		</View>
	);
}
