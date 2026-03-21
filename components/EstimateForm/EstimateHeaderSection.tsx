import React from 'react';
import { View, Text, TextInput } from 'react-native';
import { Control, Controller, UseFormSetValue } from 'react-hook-form';
import { EstimateType, EstimateNotesType } from '@/db/zodSchema';
import PickerWithTouchableOpacity from '@/components/Picker';
import DatePicker from '@/components/DatePicker';
import { DiscountInput } from '@/components/DiscountInput';
import TaxValueSwitch from '@/components/TaxValueSwitch';
import { useTheme } from '@/context/ThemeContext';
import currencyData from '@/assets/currency.json';

interface EstimateHeaderSectionProps {
	control: Control<EstimateType & { notes: EstimateNotesType[] }>;
	errors: any;
	isUpdateMode: boolean;
	users: Array<{ label: string; value: string }>;
	customers: Array<{ label: string; value: string }>;
	setValue: UseFormSetValue<EstimateType & { notes: EstimateNotesType[] }>;
	calculatedAmountAfterTax?: number;
	taxValue: boolean;
	toggleTaxValueSwitch: () => void;
}

export const EstimateHeaderSection: React.FC<EstimateHeaderSectionProps> = ({
	control,
	errors,
	isUpdateMode,
	users,
	customers,
	setValue,
	calculatedAmountAfterTax,
	taxValue,
	toggleTaxValueSwitch,
}) => {
	const { colors } = useTheme();

	const currencyOptions = currencyData.map((currency) => ({
		label: currency.currencyName,
		value: currency.currencyCode,
	}));

	return (
		<View className='justify-between gap-5 mb-5'>
			<Controller
				control={control}
				name='id'
				render={({ field: { onChange, value } }) => (
					<>
						<TextInput
							className={`text-light-text dark:text-dark-text bg-light-card dark:bg-dark-nav p-3 text-md ${errors.id ? 'border border-danger' : 'border-none'}`}
							placeholder='Enter estimate number (e.g., EST-001, 2024-001)'
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
								estimate number
							</Text>
						)}
					</>
				)}
			/>
			{isUpdateMode ? (
				<Controller
					control={control}
					name='userId'
					render={({ field: { value } }) => {
						const selectedUser = users.find((user) => user.value === value);
						return (
							<View className='flex-row item-center'>
								<Text className='text-light-text dark:text-dark-text font-extrabold text-lg'>
									Name :{' '}
								</Text>
								<Text className='text-light-text dark:text-dark-text opacity-80 font-bold text-lg'>
									{selectedUser?.label || 'Unknown'}
								</Text>
							</View>
						);
					}}
				/>
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
				<Controller
					control={control}
					name='customerId'
					render={({ field: { value } }) => {
						const selectedCustomer = customers.find(
							(customer) => customer.value === value
						);
						return (
							<View className='flex-row item-center'>
								<Text className='text-light-text dark:text-dark-text font-extrabold text-xl'>
									Customer :{' '}
								</Text>
								<Text className='text-light-text dark:text-dark-text opacity-80 font-bold text-lg'>
									{selectedCustomer?.label || 'Unknown'}
								</Text>
							</View>
						);
					}}
				/>
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
				name='estimateDate'
				render={({ field: { onChange, value } }) => {
					const dateValue = typeof value === 'string' ? new Date(value) : value;
					return (
						<>
							<DatePicker
								name='Estimate Date: '
								value={dateValue}
								onChange={(date) => onChange(date.toISOString())}
							/>
							{errors.estimateDate && (
								<Text className='text-danger text-xs'>
									{errors.estimateDate.message}
								</Text>
							)}
						</>
					);
				}}
			/>
			<Controller
				control={control}
				name='estimateEndTime'
				render={({ field: { onChange, value } }) => {
					const dateValue = typeof value === 'string' ? new Date(value) : value;
					return (
						<>
							<DatePicker
								name='Estimate End Time: '
								value={dateValue}
								onChange={(date) => onChange(date.toISOString())}
							/>
							{errors.estimateEndTime && (
								<Text className='text-danger text-xs'>
									{errors.estimateEndTime.message}
								</Text>
							)}
						</>
					);
				}}
			/>
			<Controller
				control={control}
				name='currency'
				render={({ field: { onChange, value } }) => (
					<>
						<PickerWithTouchableOpacity
							mode='dropdown'
							items={currencyOptions}
							initialValue={value || 'Select Currency'}
							onValueChange={(value) => setValue('currency', value)}
						/>
						{errors.currency && (
							<Text className='text-danger text-xs'>
								{errors.currency.message}
							</Text>
						)}
					</>
				)}
			/>
			<DiscountInput
				control={control}
				errors={errors}
				setValue={setValue}
				fieldName='discount'
				placeholder='Discount (%)'
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
							onChangeText={(text) => {
								if (/^[0-9]*\.?[0-9]*$/.test(text) || text === '') {
									if (text === '' || text === '.') {
										onChange(0);
									} else if (text.endsWith('.')) {
										onChange(text);
									} else {
										onChange(parseFloat(text));
									}
								}
							}}
							keyboardType='decimal-pad'
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
						falseText='(Subtract Tax)'
						trueText='(Add Tax)'
					/>
				)}
			/>
			<Controller
				control={control}
				name='amountBeforeTax'
				render={({ field: { onChange, value } }) => (
					<>
						<TextInput
							className={`text-light-text dark:text-dark-text bg-light-card dark:bg-dark-nav p-3 text-md ${errors.amountBeforeTax ? 'border border-danger' : 'border-none'}`}
							placeholder='Amount Before Tax'
							placeholderTextColor={colors.text}
							value={value === 0 ? '' : value?.toString()}
							onChangeText={(text) => {
								if (/^[0-9]*\.?[0-9]*$/.test(text) || text === '') {
									if (text === '' || text === '.') {
										onChange(0);
									} else if (text.endsWith('.')) {
										onChange(text);
									} else {
										onChange(parseFloat(text));
									}
								}
							}}
							keyboardType='decimal-pad'
						/>
						{errors.amountBeforeTax && (
							<Text className='text-danger text-xs'>
								{errors.amountBeforeTax.message}
							</Text>
						)}
					</>
				)}
			/>
			{calculatedAmountAfterTax !== undefined && (
				<View className='bg-light-card dark:bg-dark-nav p-3 rounded'>
					<Text className='text-light-text dark:text-dark-text text-sm opacity-70'>
						Amount After Tax:
					</Text>
					<Text className='text-light-text dark:text-dark-text text-lg font-bold'>
						{calculatedAmountAfterTax.toFixed(2)}
					</Text>
				</View>
			)}
		</View>
	);
};
