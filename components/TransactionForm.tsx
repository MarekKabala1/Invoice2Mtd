/**
 * TransactionForm.tsx
 *
 * Budget transaction form. Styled consistently with MTD addMtdTransaction
 * screen — same input styling, toggle colours, and submit button.
 *
 * Depends on: context/ThemeContext, db/zodSchema, utils/categories,
 *             hooks/useTransaction
 * Used by: app/(stack)/addTransaction.tsx
 */

import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { categories } from '@/utils/categories';
import BaseCard from '@/components/BaseCard';
import { transactionSchema, TransactionType } from '@/db/zodSchema';
import PickerWithTouchableOpacity from '@/components/Picker';
import { useTheme } from '@/context/ThemeContext';
import DatePicker from '@/components/DatePicker';
import { useTransaction } from '@/hooks/useTransaction';
import { handleSaveTransaction } from '@/utils/transactionOperations';

const transactionTypes = [
	{ id: 'EXPENSE', label: 'Expense' },
	{ id: 'INCOME', label: 'Income' },
];

interface TransactionFormProps {
	isUpdateMode?: boolean;
	transactionData?: TransactionType;
}

const TransactionForm: React.FC<TransactionFormProps> = ({ isUpdateMode = false, transactionData }) => {
	const { users } = useTransaction();
	const { colors, isDark } = useTheme();
	const MAX_LENGTH = 20;

	const {
		control,
		handleSubmit,
		formState: { errors },
		watch,
		setValue,
		reset,
	} = useForm<TransactionType>({
		defaultValues: {
			type: transactionData?.type || 'EXPENSE',
			amount: transactionData?.amount || ('' as unknown as number),
			description: transactionData?.description || '',
			categoryId: transactionData?.categoryId || '',
			userId: transactionData?.userId || '',
			date: transactionData?.date || new Date().toISOString(),
			currency: 'GBP',
		},
	});

	const type = watch('type', 'EXPENSE');

	const onSubmit = async (data: TransactionType) => {
		await handleSaveTransaction(data, isUpdateMode, transactionData);
		reset();
	};

	return (
		<ScrollView
			className='flex-1 p-4'
			style={{ backgroundColor: colors.primary }}
		>
			<View className='gap-4'>
				{/* Income / Expense toggle */}
				<Controller
					control={control}
					name='type'
					render={({ field: { value, onChange } }) => (
						<View className='flex-row gap-2'>
							{transactionTypes.map((t) => {
								const isSelected = value === t.id;
								return (
									<TouchableOpacity
										key={t.id}
										onPress={() => onChange(t.id)}
										className='flex-1 p-3 rounded-lg'
										style={{
											backgroundColor: isSelected
												? isDark
													? (t.id === 'INCOME' ? 'rgba(57,173,106,0.3)' : 'rgba(238,28,28,0.3)')
													: (t.id === 'INCOME' ? 'rgba(57,173,106,0.15)' : 'rgba(238,28,28,0.15)')
												: isDark ? colors.nav : colors.card,
											borderWidth: isSelected ? 2 : 0,
											borderColor: isSelected
												? (t.id === 'INCOME' ? '#39AD6A' : '#ee1c1c')
												: 'transparent',
										}}
									>
										<Text
											className='text-center font-bold'
											style={{
												color: isSelected
													? (t.id === 'INCOME' ? '#39AD6A' : '#ee1c1c')
													: colors.noActive,
											}}
										>
											{t.label}
										</Text>
									</TouchableOpacity>
								);
							})}
						</View>
					)}
				/>

				{/* User picker */}
				<View className='gap-1'>
					<Text className='text-sm' style={{ color: colors.noActive }}>Select User</Text>
					<Controller
						control={control}
						name='userId'
						render={({ field: { onChange, value } }) => (
							<>
								<PickerWithTouchableOpacity mode='dropdown' items={users} initialValue='Add User' onValueChange={(value) => setValue('userId', value)} />
								{errors.userId && <Text className='text-xs' style={{ color: '#ee1c1c' }}>{errors.userId.message}</Text>}
							</>
						)}
					/>
				</View>

				{/* Date */}
				<View className='gap-1'>
					<Controller
						control={control}
						name='date'
						render={({ field: { onChange, value } }) => {
							const dateValue = typeof value === 'string' ? new Date(value) : value;
							return (
								<>
									<Text className='text-sm' style={{ color: colors.noActive }}>Date</Text>
									<DatePicker name='' value={dateValue} onChange={(date) => onChange(date.toISOString())} />
									{errors.date && <Text className='text-xs' style={{ color: '#ee1c1c' }}>{errors.date.message}</Text>}
								</>
							);
						}}
					/>
				</View>

				{/* Amount */}
				<View className='gap-1'>
					<Text className='text-sm' style={{ color: colors.noActive }}>Amount</Text>
					<Controller
						control={control}
						name='amount'
						render={({ field: { value, onChange, onBlur } }) => (
							<TextInput
								className='rounded-lg p-3'
								style={{
									backgroundColor: isDark ? colors.nav : colors.card,
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
					{errors.amount && <Text className='text-xs' style={{ color: '#ee1c1c' }}>{errors.amount.message}</Text>}
				</View>

				{/* Description */}
				<View className='gap-1'>
					<Text className='text-sm' style={{ color: colors.noActive }}>Description</Text>
					<Controller
						control={control}
						name='description'
						render={({ field: { value, onChange, onBlur } }) => (
							<TextInput
								className='rounded-lg p-3'
								style={{
									backgroundColor: isDark ? colors.nav : colors.card,
									color: colors.text,
									borderWidth: 1,
									borderColor: errors.description ? '#ee1c1c' : colors.noActive,
								}}
								maxLength={MAX_LENGTH}
								value={value}
								onChangeText={onChange}
								onBlur={onBlur}
								placeholder='Enter description max 20 characters'
								placeholderTextColor={colors.noActive}
							/>
						)}
					/>
					{errors.description && <Text className='text-xs' style={{ color: '#ee1c1c' }}>{errors.description.message}</Text>}
				</View>

				{/* Category */}
				<View className='gap-1'>
					<Text className='text-sm' style={{ color: colors.noActive }}>Category</Text>
					<Controller
						control={control}
						name='categoryId'
						render={({ field: { value, onChange } }) => (
							<ScrollView className='gap-2' horizontal showsHorizontalScrollIndicator={false}>
								{(type === 'EXPENSE' ? categories.EXPENSE : categories.INCOME).map((category) => (
									<TouchableOpacity
										key={category.id}
										onPress={() => onChange(category.id)}
										className='mr-2 px-4 py-2.5 rounded-lg'
										style={{
											backgroundColor: value === category.id
												? isDark ? '#4f46e5' : '#4338ca'
												: isDark ? colors.nav : colors.card,
										}}
									>
										<Text
											className='text-sm font-bold'
											style={{ color: value === category.id ? 'white' : colors.text }}
										>
											{category.name} {category.emoji}
										</Text>
									</TouchableOpacity>
								))}
							</ScrollView>
						)}
					/>
					{errors.categoryId && <Text className='text-xs' style={{ color: '#ee1c1c' }}>{errors.categoryId.message}</Text>}
				</View>

				{/* Submit */}
				<TouchableOpacity
					onPress={handleSubmit(onSubmit)}
					className='p-4 rounded-lg mt-2'
					style={{ backgroundColor: isDark ? '#4f46e5' : '#4338ca' }}
				>
					<Text className='text-center font-bold text-white text-base'>
						{isUpdateMode ? 'Update Transaction' : 'Add Transaction'}
					</Text>
				</TouchableOpacity>
			</View>
		</ScrollView>
	);
};

export default TransactionForm;
