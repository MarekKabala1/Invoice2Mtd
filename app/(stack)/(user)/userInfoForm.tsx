import { db } from '@/db/config';
import { User } from '@/db/schema';
import React, { useEffect, useRef, useState } from 'react';
import { View, TextInput, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { userSchema, UserType } from '@/db/zodSchema';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { generateId } from '@/utils/generateUuid';
import { eq } from 'drizzle-orm';
import { UserToUpdate } from '@/types';
import { useTheme } from '@/context/ThemeContext';

type User = z.infer<typeof userSchema>;

interface UserInfoFormProps {
	onSuccess?: () => void;
	dataToUpdate?: UserToUpdate;
	update?: boolean;
}

export default function UserInfoForm({ onSuccess, dataToUpdate, update }: UserInfoFormProps) {
	const {
		control,
		handleSubmit,
		reset,
		setValue,
		formState: { errors },
		watch,
	} = useForm<User>({
		resolver: zodResolver(userSchema),
		defaultValues: {
			id: dataToUpdate?.id || '',
			fullName: dataToUpdate?.fullName || '',
			address: dataToUpdate?.address || '',
			emailAddress: dataToUpdate?.emailAddress || '',
			phoneNumber: dataToUpdate?.phoneNumber || '',
			utrNumber: dataToUpdate?.utrNumber || '',
			ninNumber: dataToUpdate?.ninNumber || '',
		},
	});

	const { colors } = useTheme();

	const onSubmit = async (data: UserType) => {
		try {
			if (update && dataToUpdate) {
				const result = await db
					.update(User)
					.set({
						fullName: data.fullName,
						address: data.address,
						emailAddress: data.emailAddress,
						phoneNumber: data.phoneNumber,
						utrNumber: data.utrNumber,
						ninNumber: data.ninNumber,
						createdAt: data.createdAt,
					})
					.where(eq(User.id, dataToUpdate.id));

				if (result) {
					reset();
					onSuccess?.();
				} else {
					throw new Error('No rows were updated. Please check the user ID.');
				}
			} else {
				const id = await generateId();
				const formData = { ...data, id };
				const result = await db.insert(User).values(formData).returning();

				if (result) {
					reset();
					onSuccess?.();
				} else {
					throw new Error('Failed to insert new record.');
				}
			}
		} catch (err) {
			let errorMessage = 'An unexpected error occurred';

			if (err instanceof Error) {
				errorMessage = err.message;
			} else if (typeof err === 'string') {
				errorMessage = err;
			}
			alert(errorMessage);
		}
	};

	const fullNameRef = useRef<TextInput>(null);
	const addressRef = useRef<TextInput>(null);
	const emailRef = useRef<TextInput>(null);
	const phoneRef = useRef<TextInput>(null);
	const utrRef = useRef<TextInput>(null);
	const ninRef = useRef<TextInput>(null);

	useEffect(() => {
		if (dataToUpdate && update) {
			setValue('id', dataToUpdate.id);
			setValue('fullName', dataToUpdate.fullName);
			setValue('address', dataToUpdate.address);
			setValue('emailAddress', dataToUpdate.emailAddress);
			setValue('phoneNumber', dataToUpdate.phoneNumber);
			setValue('utrNumber', dataToUpdate.utrNumber);
			setValue('ninNumber', dataToUpdate.ninNumber);
		}
	}, [dataToUpdate, update]);

	// ToDo:Add validation from zod schema
	return (
		<ScrollView>
			<View>
				<Text className={errors.fullName ? 'text-danger font-bold text-xs' : 'text-xs font-bold text-light-text dark:text-dark-text'}>Full Name</Text>
				<Controller
					control={control}
					rules={{
						required: true,
					}}
					render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
						<TextInput
							className={
								error
									? 'border rounded-md text-danger border-danger p-2 mb-3 '
									: 'text-light-text dark:text-dark-text border rounded-md border-light-text dark:border-dark-text p-2 mb-3'
							}
							placeholder={errors.fullName ? errors.fullName.message : ''}
							placeholderTextColor={errors.fullName ? colors.danger : colors.text}
							value={value ?? ''}
							blurOnSubmit={true}
							onChangeText={onChange}
							onBlur={onBlur}
							ref={fullNameRef}
							onSubmitEditing={() => {
								addressRef?.current?.focus();
							}}
							returnKeyType='next'
						/>
					)}
					name='fullName'
				/>
			</View>
			<View>
				<Text className={errors.address ? 'text-danger font-bold text-xs ' : 'text-xs font-bold text-light-text dark:text-dark-text'}>Address</Text>
				<Controller
					control={control}
					rules={{
						required: true,
					}}
					render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
						<TextInput
							className={
								error
									? 'border rounded-md text-danger border-danger p-2 mb-3'
									: 'text-light-text dark:text-dark-text border rounded-md border-light-text dark:border-dark-text p-2 mb-3'
							}
							placeholder={errors.address ? errors.address.message : ''}
							placeholderTextColor={errors.address ? colors.danger : colors.text}
							value={value ?? ''}
							onChangeText={onChange}
							onBlur={onBlur}
							onSubmitEditing={() => {
								emailRef?.current?.focus();
							}}
							ref={addressRef}
							returnKeyType='next'
						/>
					)}
					name='address'
				/>
			</View>
			<View>
				<Text className={errors.emailAddress ? 'text-danger font-bold text-xs ' : 'text-xs font-bold text-light-text dark:text-dark-text'}>Email Address</Text>
				<Controller
					control={control}
					rules={{
						required: true,
						pattern: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
					}}
					render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
						<TextInput
							className={
								error
									? 'border rounded-md text-danger border-danger p-2 mb-3'
									: 'text-light-text dark:text-dark-text border rounded-md border-light-text dark:border-dark-text p-2 mb-3'
							}
							placeholder={errors.emailAddress ? errors.emailAddress.message : ''}
							placeholderTextColor={errors.emailAddress ? colors.danger : colors.text}
							inputMode='email'
							value={value ?? ''}
							onChangeText={onChange}
							onBlur={onBlur}
							onSubmitEditing={() => {
								phoneRef?.current?.focus();
							}}
							ref={emailRef}
							returnKeyType='next'
						/>
					)}
					name='emailAddress'
				/>
			</View>
			<View>
				<Text className={errors.phoneNumber ? 'text-danger font-bold text-xs ' : 'text-xs font-bold text-light-text dark:text-dark-text'}>Phone Number</Text>
				<Controller
					control={control}
					rules={{
						required: true,
					}}
					render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
						<TextInput
							className={
								error
									? 'border rounded-md text-danger border-danger p-2 mb-3'
									: 'text-light-text dark:text-dark-text border rounded-md border-light-text dark:border-dark-text p-2 mb-3'
							}
							placeholder={errors.phoneNumber ? errors.phoneNumber.message : ''}
							placeholderTextColor={errors.phoneNumber ? colors.danger : colors.text}
							value={value ?? ''}
							onChangeText={onChange}
							onBlur={onBlur}
							onSubmitEditing={() => {
								utrRef?.current?.focus();
							}}
							keyboardType='numeric'
							ref={phoneRef}
							returnKeyType='next'
						/>
					)}
					name='phoneNumber'
				/>
			</View>
			<View>
				<Text className={errors.utrNumber ? 'text-danger font-bold text-xs ' : 'text-xs font-bold text-light-text dark:text-dark-text'}>UTR Number</Text>
				<Controller
					control={control}
					render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
						<TextInput
							className={
								error
									? 'border rounded-md text-danger border-danger p-2 mb-3'
									: 'text-light-text dark:text-dark-text border rounded-md border-light-text dark:border-dark-text p-2 mb-3'
							}
							placeholder={errors.utrNumber ? errors.utrNumber.message : ''}
							placeholderTextColor={errors.utrNumber ? colors.danger : colors.text}
							value={value ?? ''}
							onChangeText={onChange}
							onBlur={onBlur}
							onSubmitEditing={() => {
								ninRef?.current?.focus();
							}}
							ref={utrRef}
							returnKeyType='next'
						/>
					)}
					name='utrNumber'
				/>
			</View>
			<View>
				<Text className={errors.ninNumber ? 'text-danger font-bold text-xs ' : 'text-xs font-bold text-light-text dark:text-dark-text'}>NIN Number</Text>
				<Controller
					control={control}
					render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
						<TextInput
							className={
								error
									? 'border rounded-md text-danger border-danger p-2 mb-3'
									: 'text-light-text dark:text-dark-text border rounded-md border-light-text dark:border-dark-text p-2 mb-3'
							}
							placeholder={errors.ninNumber ? errors.ninNumber.message : ''}
							placeholderTextColor={errors.ninNumber ? colors.danger : colors.text}
							value={value ?? ''}
							onChangeText={onChange}
							onBlur={onBlur}
							ref={ninRef}
							returnKeyType='done'
						/>
					)}
					name='ninNumber'
				/>
			</View>
			<TouchableOpacity onPress={handleSubmit(onSubmit)} className='p-2 border max-w-fit border-light-text dark:border-dark-text rounded-md mt-3 '>
				<Text className='text-light-text dark:text-dark-text text-center text-md'>{update ? 'Update' : 'Submit'}</Text>
			</TouchableOpacity>
		</ScrollView>
	);
}
