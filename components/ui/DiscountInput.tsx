import React from 'react';
import { View, Text, TextInput } from 'react-native';
import { Control, Controller, UseFormSetValue } from 'react-hook-form';
import { useTheme } from '@/context/ThemeContext';

interface DiscountInputProps {
	control: Control<any>;
	errors: any;
	setValue: UseFormSetValue<any>;
	fieldName?: string;
	placeholder?: string;
}

export const DiscountInput: React.FC<DiscountInputProps> = ({
	control,
	errors,
	setValue,
	fieldName = 'discount',
	placeholder = 'Discount (%)',
}) => {
	const { colors } = useTheme();

	return (
		<Controller
			control={control}
			name={fieldName}
			render={({ field: { onChange, value } }) => (
				<>
					<View className='flex-row items-center'>
						<TextInput
							className={`flex-1 text-light-text dark:text-dark-text bg-light-card dark:bg-dark-nav p-3 text-md ${errors[fieldName] ? 'border border-danger' : 'border-none'}`}
							placeholder={placeholder}
							placeholderTextColor={colors.text}
							value={value === 0 ? '' : value?.toString()}
							onChangeText={(text) => {
								const numValue = Number(text);
								if (text === '' || (numValue >= 0 && numValue <= 100)) {
									onChange(numValue);
									setValue(fieldName, numValue);
								}
							}}
							keyboardType='number-pad'
						/>
					</View>
					{errors[fieldName] && (
						<Text className='text-danger text-xs'>
							{errors[fieldName].message}
						</Text>
					)}
				</>
			)}
		/>
	);
};
