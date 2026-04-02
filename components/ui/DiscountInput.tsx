/**
 * DiscountInput.tsx
 *
 * Reusable discount percentage input with react-hook-form integration.
 * Clamps input to 0-100 range.
 *
 * Depends on: react, react-native, react-hook-form, @/context/ThemeContext
 * Used by: components/EstimateForm/EstimateHeaderSection.tsx
 */

import React from 'react';
import { View, Text, TextInput } from 'react-native';
import { Control, Controller, FieldValues, Path, UseFormSetValue } from 'react-hook-form';
import { useTheme } from '@/context/ThemeContext';

interface DiscountInputProps<T extends FieldValues> {
	control: Control<T>;
	errors: Partial<Record<Path<T>, { message?: string }>>;
	setValue: UseFormSetValue<T>;
	fieldName?: Path<T>;
	placeholder?: string;
}

export const DiscountInput = <T extends FieldValues>({
	control,
	errors,
	setValue,
	fieldName,
	placeholder = 'Discount (%)',
}: DiscountInputProps<T>) => {
	const { colors } = useTheme();
	const name = (fieldName ?? 'discount') as Path<T>;

	return (
		<Controller
			control={control}
			name={name}
			render={({ field: { onChange, value } }) => (
				<>
					<View className='flex-row items-center'>
						<TextInput
							className={`flex-1 text-light-text dark:text-dark-text bg-light-card dark:bg-dark-nav p-3 text-md ${errors[name] ? 'border border-danger' : 'border-none'}`}
							placeholder={placeholder}
							placeholderTextColor={colors.text}
							value={value === 0 ? '' : value?.toString()}
							onChangeText={(text) => {
								const numValue = Number(text);
								if (text === '' || (numValue >= 0 && numValue <= 100)) {
									onChange(numValue);
									setValue(name, numValue as T[Path<T>]);
								}
							}}
							keyboardType='number-pad'
						/>
					</View>
					{errors[name] && (
						<Text className='text-danger text-xs'>
							{errors[name]?.message}
						</Text>
					)}
				</>
			)}
		/>
	);
}
