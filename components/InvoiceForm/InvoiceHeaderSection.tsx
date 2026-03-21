import React from 'react';
import { View, Text, TextInput, Switch } from 'react-native';
import { Control, Controller, UseFormSetValue } from 'react-hook-form';
import { InvoiceType, WorkInformationType, PaymentType } from '@/db/zodSchema';
import PickerWithTouchableOpacity from '@/components/Picker';
import DatePicker from '@/components/DatePicker';
import { useTheme } from '@/context/ThemeContext';
import { color } from '@/utils/theme';
import TaxValueSwitch from '@/components/TaxValueSwitch';

interface InvoiceHeaderSectionProps {
	control: Control<
		InvoiceType & { workItems: WorkInformationType[]; payments: PaymentType[] }
	>;
	errors: any;
	isUpdateMode: boolean;
	users: Array<{ label: string; value: string }>;
	customers: Array<{ label: string; value: string }>;
	taxValue: boolean;
	toggleTaxValueSwitch: () => void;

	setValue: UseFormSetValue<
		InvoiceType & { workItems: WorkInformationType[]; payments: PaymentType[] }
	>;
}

export const InvoiceHeaderSection: React.FC<InvoiceHeaderSectionProps> = ({
	control,
	errors,
	isUpdateMode,
	users,
	customers,
	taxValue,
	toggleTaxValueSwitch,
	setValue,
}) => {
	const { colors, isDark } = useTheme();
	return (
		<View className='justify-between gap-5 mb-5'>
			<Controller
				control={control}
				name='id'
				render={({ field: { onChange, value } }) => (
					<>
						<TextInput
							className={`text-light-text dark:text-dark-text bg-light-card dark:bg-dark-nav p-3 text-md ${errors.id ? 'border border-danger' : 'border-none'}`}
							placeholder='Enter invoice number (e.g., INV-001, 2024-001)'
							placeholderTextColor={colors.text}
							value={value}
							onChangeText={onChange}
						/>
						{errors.id && (
							<Text className='text-danger text-xs'>{errors.id.message}</Text>
						)}
						{!isUpdateMode && (
							<Text className='text-light-text dark:text-dark-text text-xs opacity-70 mt-1'>
								Leave empty to auto-generate next number, or enter a custom
								invoice number
							</Text>
						)}
					</>
				)}
			/>
			{isUpdateMode ? (
				<View className='flex-row item-center'>
					<Text className='text-light-text dark:text-dark-text font-extrabold text-lg'>
						Name :{' '}
					</Text>
					<Text className='text-light-text dark:text-dark-text opacity-80 font-bold text-lg'>
						{users.map((user) => user.label).join(', ')}
					</Text>
				</View>
			) : (
				<Controller
					control={control}
					name='userId'
					render={({ field: { onChange, value } }) => (
						<>
							<PickerWithTouchableOpacity
								mode='dropdown'
								items={users}
								initialValue='Add User'
								onValueChange={(value) => setValue('userId', value)}
							/>
							{errors.userId && (
								<Text className='text-danger text-xs'>
									{errors.userId.message}
								</Text>
							)}
						</>
					)}
				/>
			)}
			{isUpdateMode ? (
				<View className='flex-row item-center'>
					<Text className='text-light-text dark:text-dark-text font-extrabold text-xl'>
						Customer :{' '}
					</Text>
					<Text className='text-light-text dark:text-dark-text opacity-80 font-bold text-lg'>
						{customers.map((customer) => customer.label).join(', ')}
					</Text>
				</View>
			) : (
				<Controller
					control={control}
					name='customerId'
					render={({ field: { onChange, value } }) => (
						<>
							<PickerWithTouchableOpacity
								mode='dropdown'
								items={customers}
								initialValue='Add Customer'
								onValueChange={(value) => setValue('customerId', value)}
							/>
							{errors.customerId && (
								<Text className='text-danger text-xs'>
									{errors.customerId.message}
								</Text>
							)}
						</>
					)}
				/>
			)}
			<Controller
				control={control}
				name='invoiceDate'
				render={({ field: { onChange, value } }) => {
					const dateValue = typeof value === 'string' ? new Date(value) : value;
					return (
						<>
							<DatePicker
								name='Invoice Date: '
								value={dateValue}
								onChange={(date) => onChange(date.toISOString())}
							/>
							{errors.invoiceDate && (
								<Text className='text-danger text-xs'>
									{errors.invoiceDate.message}
								</Text>
							)}
						</>
					);
				}}
			/>
			<Controller
				control={control}
				name='dueDate'
				render={({ field: { onChange, value } }) => {
					const dateValue = typeof value === 'string' ? new Date(value) : value;
					return (
						<>
							<DatePicker
								name='Due Date: '
								value={dateValue}
								onChange={(date) => onChange(date.toISOString())}
							/>
							{errors.dueDate && (
								<Text className='text-danger text-xs'>
									{errors.dueDate.message}
								</Text>
							)}
						</>
					);
				}}
			/>
			<Controller
				control={control}
				name='taxRate'
				render={({ field: { onChange, value } }) => (
					<>
						<TextInput
							className={`text-light-text dark:text-dark-text bg-light-card dark:bg-dark-nav p-3 text-md ${errors.taxRate ? 'border border-danger' : 'border-none'}`}
							placeholder='Tax Rate (%)'
							placeholderTextColor={colors.text}
							value={value === 0 ? '' : value?.toString()}
							onChangeText={(text) => onChange(Number(text))}
							keyboardType='number-pad'
						/>
						{errors.taxRate && (
							<Text className='text-danger text-xs'>
								{errors.taxRate.message}
							</Text>
						)}
					</>
				)}
			/>
			<Controller
				control={control}
				name='taxValue'
				render={({ field: { onChange, value } }) => (
					<TaxValueSwitch
						isEnabled={taxValue}
						onToggle={toggleTaxValueSwitch}
						label='Tax Calculation'
						falseText='(Subtract Tax))'
						trueText='(Add Tax)'
					/>
				)}
			/>
		</View>
	);
};
