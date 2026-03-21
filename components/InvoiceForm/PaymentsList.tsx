import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { Control, Controller, UseFieldArrayReturn } from 'react-hook-form';
import { InvoiceType, PaymentType, WorkInformationType } from '@/db/zodSchema';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';

interface PaymentsListProps {
	control: Control<InvoiceType & { workItems: WorkInformationType[]; payments: PaymentType[] }>;
	errors: any;
	paymentFields: UseFieldArrayReturn<InvoiceType & { workItems: WorkInformationType[]; payments: PaymentType[] }, 'payments'>['fields'];
	appendPayment: UseFieldArrayReturn<InvoiceType & { workItems: WorkInformationType[]; payments: PaymentType[] }, 'payments'>['append'];
	removePayment: UseFieldArrayReturn<InvoiceType & { workItems: WorkInformationType[]; payments: PaymentType[] }, 'payments'>['remove'];
	paymentRefs: React.MutableRefObject<(TextInput | null)[]>;
}

export const PaymentsList: React.FC<PaymentsListProps> = ({ control, errors, paymentFields, appendPayment, removePayment, paymentRefs }) => {
	const { colors } = useTheme();

	const handleAddPayment = (): void => {
		appendPayment({
			id: '',
			invoiceId: '',
			paymentDate: '',
			amountPaid: 0,
			createdAt: new Date().toISOString(),
		});
	};

	return (
		<>
			<Text className='text-lg text-light-text dark:text-dark-text font-bold'>Payments</Text>
			<Text className='text-xs text-light-text/50 dark:text-dark-text/50 mb-2'>*Any payments will be deducted from the invoice Total</Text>
			{paymentFields.map((item, index) => (
				<React.Fragment key={item.id || index}>
					<View className='flex-row items-center justify-center mb-2 gap-2 flex-1 px-4'>
						<Controller
							control={control}
							name={`payments.${index}.paymentDate`}
							render={({ field: { onChange, value } }) => (
								<TextInput
									ref={(el) => (paymentRefs.current[index + paymentFields.length] = el)}
									className={`w-3/4 text-light-text dark:text-dark-text bg-light-card dark:bg-dark-nav p-3 text-md ${errors.payments ? 'border border-danger' : 'border-none'}`}
									placeholder='Description of Payment'
									placeholderTextColor={colors.text}
									value={value}
									onChangeText={onChange}
									keyboardType='default'
								/>
							)}
						/>
						<Controller
							control={control}
							name={`payments.${index}.amountPaid`}
							render={({ field: { onChange, value } }) => (
								<TextInput
									ref={(el) => (paymentRefs.current[index + paymentFields.length] = el)}
									className={`text-light-text dark:text-dark-text bg-light-card dark:bg-dark-nav p-3 text-md ${errors.payments ? 'border border-danger' : 'border-none'}`}
									placeholder='Unit Price'
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
							)}
						/>
						<TouchableOpacity onPress={() => removePayment(index)}>
							<Ionicons name='close-circle-outline' color={'red'} size={20} />
						</TouchableOpacity>
					</View>
				</React.Fragment>
			))}
			<TouchableOpacity onPress={handleAddPayment} className='flex-row items-center gap-2 mb-2'>
				<Ionicons name={'add-circle-outline'} size={18} color={colors.secondary} />
				<Text className='text-light-secondary dark:text-dark-secondary'>Add Payment</Text>
			</TouchableOpacity>
		</>
	);
};
