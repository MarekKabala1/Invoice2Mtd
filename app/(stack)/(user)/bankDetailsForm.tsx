import { db } from '@/db/config';
import { BankDetails, User } from '@/db/schema';
import React, { useEffect, useRef, useState } from 'react';
import { View, TextInput, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { generateId } from '@/utils/generateUuid';
import PickerWithTouchableOpacity from '@/components/Picker';
import { userSchema } from '@/db/zodSchema';
import { BankDetails as BankDetailsType, User as UserType } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { BankDetailsToUpdate, BankDetailsUpdateParams } from '@/types';
import { color } from '@/utils/theme';
import { useTheme } from '@/context/ThemeContext';

const bankDetailsSchema = z.object({
	accountName: z.string().min(1, 'Account Name is required'),
	sortCode: z.string().min(1, 'Sort Code is required'),
	accountNumber: z.string().min(1, 'Account Number is required'),
	bankName: z.string().min(1, 'Bank Name is required'),
	userId: z.string().min(1, 'Select User'),
});

type BankDetailsType = z.infer<typeof bankDetailsSchema>;
type User = z.infer<typeof userSchema>;

interface BankDetailsFormProps {
	onSuccess?: () => void;
	dataToUpdate?: BankDetailsToUpdate;
	update?: boolean | null;
}

export default function BankDetailsForm({ onSuccess, dataToUpdate, update }: BankDetailsFormProps) {
	const {
		control,
		handleSubmit,
		reset,
		setValue,
		formState: { errors },
	} = useForm<BankDetailsType>({
		resolver: zodResolver(bankDetailsSchema),
		defaultValues: {
			accountName: '',
			accountNumber: '',
			bankName: '',
			sortCode: '',
			userId: '',
		},
	});

	const [userOptions, setUserOptions] = useState<Array<{ label: string; value: string }> | []>([]);

	const { colors } = useTheme();

	const onSubmit = async (data: BankDetailsType) => {
		try {
			if (update && dataToUpdate) {
				await db
					.update(BankDetails)
					.set({
						bankName: data.bankName,
						accountNumber: data.accountNumber,
						sortCode: data.sortCode,
						accountName: data.accountName,
					})
					.where(eq(BankDetails.id, dataToUpdate.id));
			} else {
				const id = await generateId();
				const formData = { ...data, id };
				await db.insert(BankDetails).values(formData).returning();
			}

			reset();
			onSuccess?.();
		} catch (err) {
			let errorMessage = 'An unexpected error occurred';

			if (err instanceof Error) {
				errorMessage = err.message;
			} else if (typeof err === 'string') {
				errorMessage = err;
			}

			alert(errorMessage);
			console.error('Error submitting data:', err);
		}
	};
	const accountNameRef = useRef<TextInput>(null);
	const sortCodeRef = useRef<TextInput>(null);
	const accountNumberRef = useRef<TextInput>(null);
	const bankNameRef = useRef<TextInput>(null);

	const getAllUsers = async () => {
		if (update) {
			const getUser = await db
				.select()
				.from(User)
				.where(eq(User.id, dataToUpdate?.userId as string));

			const options = getUser.map((user) => ({
				label: user.fullName || 'Unnamed User',
				value: user.id,
			}));
			setUserOptions(options);
		} else {
			const usersData = await db.select().from(UserType);

			const options = usersData.map((user) => ({
				label: user.fullName || 'Unknown Name',
				value: user.id,
			}));

			setUserOptions(options);
		}
	};

	useEffect(() => {
		getAllUsers();
	}, []);

	useEffect(() => {
		if (dataToUpdate && update) {
			setValue('userId', dataToUpdate.userId as string);
			setValue('accountName', dataToUpdate.accountName as string);
			setValue('sortCode', dataToUpdate.sortCode as string);
			setValue('accountNumber', dataToUpdate.accountNumber as string);
			setValue('bankName', dataToUpdate.bankName as string);
		} else {
			reset();
		}
	}, [update, dataToUpdate]);

	return (
		<ScrollView>
			{update ? (
				<View className='gap-1 mb-3'>
					<Text className='text-light-text dark:text-dark-text font-bold text-xs'>Name</Text>
					<Text className='text-light-text dark:text-dark-text opacity-80 font-bold text-lg '>{userOptions.map((user) => user.label).join(', ')}</Text>
				</View>
			) : (
				<View className='gap-1 mb-3'>
					<Text className={errors.userId ? 'text-danger font-bold text-xs' : 'text-light-text dark:text-dark-text font-bold text-xs'}>Add User </Text>
					<Controller
						control={control}
						name='userId'
						render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
							<PickerWithTouchableOpacity
								errorState={errors.userId ? true : false}
								errorMessage={'User is required'}
								initialValue={errors.userId ? (errors.userId.message as string) : ''}
								onValueChange={onChange}
								items={userOptions}
							/>
						)}
					/>
				</View>
			)}
			<View className='gap-1'>
				<Text className={errors.accountName ? 'text-danger font-bold text-xs' : 'text-light-text dark:text-dark-text font-bold text-xs'}>Account Name </Text>
				<Controller
					control={control}
					name='accountName'
					render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
						<TextInput
							className={
								error
									? 'border rounded-md text-danger border-danger p-2 mb-3'
									: 'text-light-text dark:text-dark-text border rounded-md border-light-text dark:border-dark-text p-2 mb-3'
							}
							placeholder={errors.accountName ? errors.accountName.message : ''}
							placeholderTextColor={errors.accountName ? color.danger : colors.text}
							value={value}
							onChangeText={onChange}
							onBlur={onBlur}
							ref={accountNameRef}
							onSubmitEditing={() => {
								sortCodeRef?.current?.focus();
							}}
							returnKeyType='next'
						/>
					)}
				/>
			</View>
			<View className='gap-1'>
				<Text className={errors.sortCode ? 'text-danger font-bold text-xs' : 'text-light-text dark:text-dark-text font-bold text-xs'}>Sort Code </Text>
				<Controller
					control={control}
					name='sortCode'
					render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
						<TextInput
							className={
								error
									? 'border rounded-md text-danger border-danger p-2 mb-3'
									: 'text-light-text dark:text-dark-text border rounded-md border-light-text dark:border-dark-text p-2 mb-3'
							}
							placeholder={errors.sortCode ? errors.sortCode.message : ''}
							placeholderTextColor={errors.sortCode ? color.danger : colors.text}
							value={value}
							onChangeText={onChange}
							onBlur={onBlur}
							ref={sortCodeRef}
							onSubmitEditing={() => {
								accountNumberRef?.current?.focus();
							}}
							returnKeyType='next'
						/>
					)}
				/>
			</View>
			<View className='gap-1'>
				<Text className={errors.accountNumber ? 'text-danger font-bold text-xs' : 'text-light-text dark:text-dark-text font-bold text-xs'}>
					Account Number{' '}
				</Text>
				<Controller
					control={control}
					name='accountNumber'
					render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
						<TextInput
							className={
								error
									? 'border rounded-md text-danger border-danger p-2 mb-3'
									: 'text-light-text dark:text-dark-text border rounded-md border-light-text dark:border-dark-text p-2 mb-3'
							}
							placeholder={errors.accountNumber ? errors.accountNumber.message : ''}
							placeholderTextColor={errors.accountNumber ? color.danger : colors.text}
							value={value}
							onChangeText={onChange}
							onBlur={onBlur}
							ref={accountNumberRef}
							onSubmitEditing={() => {
								bankNameRef?.current?.focus();
							}}
							returnKeyType='next'
						/>
					)}
				/>
			</View>
			<View className='gap-1'>
				<Text className={errors.bankName ? 'text-danger font-bold text-xs' : 'text-light-text dark:text-dark-text font-bold text-xs'}>Bank Name </Text>
				<Controller
					control={control}
					name='bankName'
					render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
						<TextInput
							className={
								error
									? 'border rounded-md text-danger border-danger p-2 mb-3'
									: 'text-light-text dark:text-dark-text border rounded-md border-light-text dark:border-dark-text p-2 mb-3 '
							}
							placeholder={errors.bankName ? errors.bankName.message : ''}
							placeholderTextColor={errors.bankName ? color.danger : colors.text}
							value={value}
							onChangeText={onChange}
							onBlur={onBlur}
							ref={bankNameRef}
							returnKeyType='done'
						/>
					)}
				/>
			</View>
			<TouchableOpacity onPress={handleSubmit(onSubmit)} className='p-3 mt-3 border max-w-fit border-light-text dark:border-dark-text rounded-md'>
				<Text className='text-light-text dark:text-dark-text text-center text-md'>{update ? 'Update' : 'Submit'}</Text>
			</TouchableOpacity>
		</ScrollView>
	);
}
