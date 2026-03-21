import { View, Text, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import PickerWithTouchableOpacity from './Picker';
import { useTransaction } from '@/hooks/useTransaction';
import { TransactionType } from '@/db/zodSchema';
import { generateId } from '@/utils/generateUuid';
import { db } from '@/db/config';
import { Transactions } from '@/db/schema';
import React from 'react';
import { useTheme } from '@/context/ThemeContext';
import DatePicker from './DatePicker';

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
		},
	});

	const { users, currencies } = useTransaction();
	const { colors } = useTheme();

	const addDataToBudget = async () => {
		try {
			const data = watch();
			const id = await generateId();
			const categoryId = 'work_expenses';
			await db.insert(Transactions).values({
				id: id,
				amount: data.amount,
				description: `Work Expenses`,
				date: data.date || new Date().toISOString(),
				type: 'EXPENSE',
				categoryId: categoryId,
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

	return (
		<View className='flex-1 justify-center items-center  bg-light-text/30 dark:bg-dark-text/30'>
			<View className='bg-light-primary dark:bg-dark-primary p-4 rounded-lg w-11/12'>
				<Text className='text-light-text dark:text-dark-text text-center font-semibold'>Add to Budget</Text>
				<View className='gap-2'>
					<Text className='text-light-text dark:text-dark-text pt-3 text-sm'>Select User</Text>
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
					<Text className='text-light-text dark:text-dark-text text-sm pt-3'>Currency</Text>
					<Controller
						control={control}
						name='currency'
						render={({ field: { value, onChange, onBlur } }) => (
							<PickerWithTouchableOpacity mode='dropdown' items={currencies} initialValue={'GBP'} onValueChange={(value) => onChange(value)} />
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
									<Text className='text-light-text dark:text-dark-text text-sm pt-3'>Date</Text>
									<DatePicker name='' value={dateValue} onChange={(date) => onChange(date.toISOString())} />
									{errors.date && <Text className='text-danger text-xs'>{errors.date.message}</Text>}
								</>
							);
						}}
					/>
				</View>
				<View className='gap-2'>
					<Text className='text-light-text dark:text-dark-text text-sm pt-3'>Amount</Text>
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
				<View className='gap-2 flex-row justify-between'>
					<TouchableOpacity className='bg-danger p-3 rounded-lg mt-4 elevation-md' onPress={closeModal}>
						<Text className='text-light-text dark:text-dark-text text-center font-semibold'>Cancel</Text>
					</TouchableOpacity>
					<TouchableOpacity onPress={handleSubmit(addDataToBudget)} className='bg-light-nav dark:bg-dark-nav p-3 rounded-lg mt-4 elevation-md'>
						<Text className='text-light-text dark:text-dark-text text-center font-semibold'>Add Transaction</Text>
					</TouchableOpacity>
				</View>
			</View>
		</View>
	);
};

export default AddTransactionAfterScan;
