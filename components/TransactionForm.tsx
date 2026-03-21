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
	const { colors } = useTheme();
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
		<ScrollView className='flex-1 bg-light-primary dark:bg-dark-primary p-4'>
			<View className='space-y-4 gap-2'>
				<View className='flex-row gap-2'>
					<Controller
						control={control}
						name='type'
						render={({ field: { value, onChange } }) => (
							<>
								{transactionTypes.map((t) => {
									const isSelected = value === t.id;
									return (
										<TouchableOpacity
											key={t.id}
											onPress={() => {
												onChange(t.id);
											}}
											className={`flex-1 p-3 rounded-lg bg-light-nav dark:bg-dark-nav ${isSelected ? 'border-2 border-light-text dark:border-dark-text' : ''}`}>
											<Text className='text-center text-light-text dark:text-dark-text'>{t.label}</Text>
										</TouchableOpacity>
									);
								})}
							</>
						)}
					/>
				</View>

				<View className='gap-2'>
					<Text className='text-light-text dark:text-dark-text mb-1'>Select User</Text>
					<Controller
						control={control}
						name='userId'
						render={({ field: { onChange, value } }) => (
							<>
								<PickerWithTouchableOpacity mode='dropdown' items={users} initialValue='Add User' onValueChange={(value) => setValue('userId', value)} />
								{errors.userId && <Text className='text-danger text-xs'>{errors.userId.message}</Text>}
							</>
						)}
					/>
				</View>

				<View className='gap-2'>
					<Controller
						control={control}
						name='date'
						render={({ field: { onChange, value } }) => {
							const dateValue = typeof value === 'string' ? new Date(value) : value;
							return (
								<>
									<Text className='text-dark-primary dark:text-light-primary'>Date :</Text>
									<DatePicker name='' value={dateValue} onChange={(date) => onChange(date.toISOString())} />
									{errors.date && <Text className='text-danger text-xs'>{errors.date.message}</Text>}
								</>
							);
						}}
					/>
				</View>

				<View className='gap-2'>
					<Text className='text-light-text dark:text-dark-text mb-1'>Amount</Text>
					<Controller
						control={control}
						name='amount'
						render={({ field: { value, onChange, onBlur } }) => (
							<TextInput
								className={`border rounded-lg p-2 ${errors.amount ? 'border-danger text-danger' : 'border-light-text dark:border-dark-text text-light-text dark:text-dark-text'}`}
								keyboardType='decimal-pad'
								value={value === 0 ? '' : value?.toString()}
								onChangeText={(text) => {
									const numericValue = text.replace(/[^0-9.]/g, '');
									const parts = numericValue.split('.');
									if (parts.length > 2) {
										return;
									}
									onChange(numericValue);
								}}
								onBlur={onBlur}
								placeholder='0.00'
								placeholderTextColor={colors.text}
							/>
						)}
					/>
					{errors.amount && <Text className='text-red-500 text-xs'>{errors.amount.message}</Text>}
				</View>

				<View className='gap-2'>
					<Text className='text-light-text dark:text-dark-text mb-1'>Description</Text>
					<Controller
						control={control}
						name='description'
						render={({ field: { value, onChange, onBlur } }) => (
							<TextInput
								className={`border rounded-lg p-2 ${errors.description ? 'border-danger text-danger' : 'border-light-text dark:border-dark-text text-light-text dark:text-dark-text'}`}
								maxLength={MAX_LENGTH}
								value={value}
								onChangeText={(text) => {
									onChange(text);
								}}
								onBlur={onBlur}
								placeholder='Enter description max 20 characters'
								placeholderTextColor={colors.text}
							/>
						)}
					/>
					{errors.description && <Text className='text-red-500 text-xs'>{errors.description.message}</Text>}
				</View>

				<View className='gap-2'>
					<Text className='text-light-text dark:text-dark-text mb-1'>Category</Text>
					<Controller
						control={control}
						name='categoryId'
						render={({ field: { value, onChange } }) => (
							<ScrollView className='gap-2' horizontal showsHorizontalScrollIndicator={false}>
								{(type === 'EXPENSE' ? categories.EXPENSE : categories.INCOME).map((category) => (
									<BaseCard key={category.id} className={`mr-2 ${value === category.id ? 'border-2 border-light-text dark:border-dark-text' : ''}`}>
										<TouchableOpacity
											onPress={() => {
												onChange(category.id);
											}}>
											<Text className='text-light-text dark:text-dark-text'>
												{category.name} {category.emoji}
											</Text>
										</TouchableOpacity>
									</BaseCard>
								))}
							</ScrollView>
						)}
					/>
					{errors.categoryId && <Text className='text-red-500 text-xs'>{errors.categoryId.message}</Text>}
				</View>

				<TouchableOpacity onPress={handleSubmit(onSubmit)} className='bg-light-nav dark:bg-dark-nav p-3 rounded-lg mt-4 elevation-md'>
					<Text className='text-light-text dark:text-dark-text text-center font-semibold'>{isUpdateMode ? 'Update Transaction' : 'Add Transaction'}</Text>
				</TouchableOpacity>
			</View>
		</ScrollView>
	);
};

export default TransactionForm;
