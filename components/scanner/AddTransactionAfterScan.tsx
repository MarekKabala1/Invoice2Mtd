/**
 * AddTransactionAfterScan.tsx
 *
 * Modal for adding a transaction after scanning a receipt.
 * Now includes HMRC category picker so scanned receipts can be
 * categorised consistently with MTD records.
 *
 * Depends on: context/ThemeContext, hooks/useTransaction,
 *             db/config, db/schema, utils/generateUuid, utils/categories
 * Used by: components/DocumentScanner.tsx
 */

import { View, Text, TouchableOpacity, Modal, TextInput, Alert, ScrollView } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import PickerWithTouchableOpacity from '@/components/ui/Picker';
import { useTransaction } from '@/hooks/shared/useTransaction';
import { TransactionType } from '@/db/zodSchema';
import { generateId } from '@/utils/shared/generateUuid';
import { db } from '@/db/config';
import { Transactions } from '@/db/schema';
import React, { useState } from 'react';
import { useTheme } from '@/context/ThemeContext';
import DatePicker from '@/components/ui/DatePicker';
import { categories } from '@/utils/budget/categories';

interface AddTransactionAfterScanProps {
	isAddToBudgetModalVisible: boolean;
	closeModal: () => void;
}

const AddTransactionAfterScan = ({ closeModal }: AddTransactionAfterScanProps) => {
	const {
		control,
		handleSubmit,
		formState: { errors },
		watch,
		setValue,
		reset,
	} = useForm<TransactionType>({
		defaultValues: {
			date: new Date().toISOString(),
			type: 'EXPENSE',
			categoryId: 'other_allowable',
		},
	});

	const { users, currencies } = useTransaction();
	const { colors, isDark } = useTheme();
	const watchedType = watch('type', 'EXPENSE');
	const watchedCategory = watch('categoryId');

	const addDataToBudget = async () => {
		try {
			const data = watch();
			const id = await generateId();
			const catName = [...categories.INCOME, ...categories.EXPENSE].find(c => c.id === data.categoryId)?.name ?? 'Other';
			await db.insert(Transactions).values({
				id: id,
				amount: data.amount,
				description: catName,
				date: data.date || new Date().toISOString(),
				type: data.type || 'EXPENSE',
				categoryId: data.categoryId,
				userId: data.userId,
				currency: data.currency,
			});

			Alert.alert('Success', 'Transaction added to budget');
		} catch (error) {
			console.error('Error adding to budget:', error);
			Alert.alert('Error', 'Failed to add to budget');
		} finally {
			reset();
			closeModal();
		}
	};

	const currentCategories = watchedType === 'EXPENSE' ? categories.EXPENSE : categories.INCOME;

	return (
		<View className='flex-1 justify-center items-center' style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
			<View
				className='p-5 rounded-lg w-11/12 max-h-[90%]'
				style={{ backgroundColor: isDark ? colors.nav : colors.card }}
			>
				<ScrollView showsVerticalScrollIndicator={false}>
					<Text className='text-lg font-bold text-center mb-4' style={{ color: colors.text }}>
						Add to Budget
					</Text>

					{/* Income / Expense toggle */}
					<View className='flex-row gap-2 mb-4'>
						{['INCOME', 'EXPENSE'].map((t) => {
							const isSelected = watchedType === t;
							return (
								<TouchableOpacity
									key={t}
									onPress={() => {
										setValue('type' as any, t);
										const cats = t === 'EXPENSE' ? categories.EXPENSE : categories.INCOME;
										if (!cats.find(c => c.id === watchedCategory)) {
											setValue('categoryId' as any, cats[0]?.id ?? '');
										}
									}}
									className='flex-1 p-3 rounded-lg'
									style={{
										backgroundColor: isSelected
											? isDark
												? (t === 'INCOME' ? 'rgba(57,173,106,0.3)' : 'rgba(238,28,28,0.3)')
												: (t === 'INCOME' ? 'rgba(57,173,106,0.15)' : 'rgba(238,28,28,0.15)')
											: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
										borderWidth: isSelected ? 2 : 0,
										borderColor: isSelected
											? (t === 'INCOME' ? '#39AD6A' : '#ee1c1c')
											: 'transparent',
									}}
								>
									<Text
										className='text-center font-bold'
										style={{
											color: isSelected
												? (t === 'INCOME' ? '#39AD6A' : '#ee1c1c')
												: colors.noActive,
										}}
									>
										{t === 'INCOME' ? 'Income' : 'Expense'}
									</Text>
								</TouchableOpacity>
							);
						})}
					</View>

					{/* Category */}
					<Text className='text-sm mb-1' style={{ color: colors.noActive }}>Category</Text>
					<Controller
						control={control}
						name='categoryId'
						render={({ field: { value, onChange } }) => (
							<ScrollView
								horizontal
								showsHorizontalScrollIndicator={false}
								className='mb-4'
							>
								{currentCategories.map((cat) => (
									<TouchableOpacity
										key={cat.id}
										onPress={() => onChange(cat.id)}
										className='mr-2 px-4 py-2.5 rounded-lg'
										style={{
											backgroundColor: value === cat.id
												? isDark ? '#2563eb' : '#1d4ed8'
												: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
										}}
									>
										<Text
											className='text-sm'
											style={{ color: value === cat.id ? 'white' : colors.text }}
										>
											{cat.emoji} {cat.name}
										</Text>
									</TouchableOpacity>
								))}
							</ScrollView>
						)}
					/>

					{/* User */}
					<Text className='text-sm mb-1' style={{ color: colors.noActive }}>User</Text>
					<Controller
						control={control}
						name='userId'
						render={({ field: { onChange, value } }) => (
							<>
								<PickerWithTouchableOpacity mode='dropdown' items={users} initialValue='Add User' onValueChange={(value) => setValue('userId', value)} />
								{errors.userId && <Text className='text-xs mt-1' style={{ color: '#ee1c1c' }}>{errors.userId.message}</Text>}
							</>
						)}
					/>

					{/* Currency */}
					<Text className='text-sm mb-1 mt-3' style={{ color: colors.noActive }}>Currency</Text>
					<Controller
						control={control}
						name='currency'
						render={({ field: { value, onChange, onBlur } }) => (
							<PickerWithTouchableOpacity mode='dropdown' items={currencies} initialValue={'GBP'} onValueChange={(value) => onChange(value)} />
						)}
					/>

					{/* Date */}
					<Controller
						control={control}
						name='date'
						render={({ field: { onChange, value } }) => {
							const dateValue = typeof value === 'string' ? new Date(value) : value;
							return (
								<>
									<Text className='text-sm mb-1 mt-3' style={{ color: colors.noActive }}>Date</Text>
									<DatePicker name='' value={dateValue} onChange={(date) => onChange(date.toISOString())} />
									{errors.date && <Text className='text-xs' style={{ color: '#ee1c1c' }}>{errors.date.message}</Text>}
								</>
							);
						}}
					/>

					{/* Amount */}
					<Text className='text-sm mb-1 mt-3' style={{ color: colors.noActive }}>Amount</Text>
					<Controller
						control={control}
						name='amount'
						render={({ field: { value, onChange, onBlur } }) => (
							<TextInput
								className='rounded-lg p-3'
								style={{
									backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
									color: colors.text,
									borderWidth: 1,
									borderColor: errors.amount ? '#ee1c1c' : colors.noActive,
								}}
								keyboardType='decimal-pad'
								value={value === 0 ? '' : value?.toString()}
								onChangeText={(text) => {
									const numericValue = text.replace(/[^0-9.]/g, '');
									const parts = numericValue.split('.');
									if (parts.length > 2) return;
									onChange(numericValue);
								}}
								onBlur={onBlur}
								placeholder='0.00'
								placeholderTextColor={colors.noActive}
							/>
						)}
					/>
					{errors.amount && <Text className='text-xs mb-2' style={{ color: '#ee1c1c' }}>{errors.amount.message}</Text>}

					{/* Buttons */}
					<View className='flex-row gap-3 mt-4'>
						<TouchableOpacity
							onPress={closeModal}
							className='flex-1 py-3 rounded-lg items-center'
							style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}
						>
							<Text className='font-bold' style={{ color: colors.text }}>Cancel</Text>
						</TouchableOpacity>
						<TouchableOpacity
							onPress={handleSubmit(addDataToBudget)}
							className='flex-1 py-3 rounded-lg items-center'
							style={{ backgroundColor: isDark ? '#2563eb' : '#1d4ed8' }}
						>
							<Text className='font-bold text-white'>Add Transaction</Text>
						</TouchableOpacity>
					</View>
				</ScrollView>
			</View>
		</View>
	);
};

export default AddTransactionAfterScan;
