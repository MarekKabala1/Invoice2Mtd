import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { Control, Controller, UseFieldArrayReturn } from 'react-hook-form';
import { InvoiceType, WorkInformationType, PaymentType } from '@/db/zodSchema';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';

interface WorkItemsListProps {
	control: Control<InvoiceType & { workItems: WorkInformationType[]; payments: PaymentType[] }>;
	errors: any;
	workFields: UseFieldArrayReturn<InvoiceType & { workItems: WorkInformationType[]; payments: PaymentType[] }, 'workItems'>['fields'];
	appendWork: UseFieldArrayReturn<InvoiceType & { workItems: WorkInformationType[]; payments: PaymentType[] }, 'workItems'>['append'];
	removeWork: UseFieldArrayReturn<InvoiceType & { workItems: WorkInformationType[]; payments: PaymentType[] }, 'workItems'>['remove'];
	workItemRefs: React.MutableRefObject<(TextInput | null)[]>;
}

export const WorkItemsList: React.FC<WorkItemsListProps> = ({ control, errors, workFields, appendWork, removeWork, workItemRefs }) => {
	const { colors } = useTheme();

	const getDayOfWeek = (index: number): string => {
		const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
		return days[index % 7];
	};

	const handleAddWorkItem = (): void => {
		const newIndex = workFields.length;
		const dayOfWeek = getDayOfWeek(newIndex);
		appendWork({
			id: '',
			descriptionOfWork: '',
			unitPrice: 0,
			date: dayOfWeek,
			invoiceId: '',
			totalToPayMinusTax: 0,
		});
	};

	return (
		<>
			<Text className='text-lg text-light-text dark:text-dark-text font-bold mb-2'>Work Items</Text>
			{workFields.map((item, index) => (
				<React.Fragment key={item.id || index}>
					<Controller
						control={control}
						name={`workItems.${index}.date`}
						render={({ field: { value } }) => <Text className='text-sm font-bold mb-2 text-light-text dark:text-dark-text'>{value}</Text>}
					/>
					<View className='flex-row items-center justify-center mb-2 gap-2 flex-1 px-4'>
						<Controller
							control={control}
							name={`workItems.${index}.descriptionOfWork`}
							render={({ field: { onChange, value } }) => (
								<TextInput
									ref={(el) => (workItemRefs.current[index] = el)}
									className={`w-3/4 text-light-text dark:text-dark-text bg-light-card dark:bg-dark-nav p-2 text-md ${errors.workItems ? 'border border-danger' : 'border-none'}`}
									multiline={true}
									numberOfLines={2}
									placeholder='Description of Work'
									placeholderTextColor={colors.text}
									value={value}
									onChangeText={onChange}
								/>
							)}
						/>
						<Controller
							control={control}
							name={`workItems.${index}.unitPrice`}
							render={({ field: { onChange, value } }) => (
								<TextInput
									ref={(el) => (workItemRefs.current[index + workFields.length] = el)}
									className={`text-light-text dark:text-dark-text bg-light-card dark:bg-dark-nav p-3 text-md ${errors.workItems ? 'border border-danger' : 'border-none'}`}
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
						{errors.workItems && <Text className='text-red-500 text-xs'>{errors.workItems.message}</Text>}
						<TouchableOpacity onPress={() => removeWork(index)}>
							<Ionicons name='close-circle-outline' color={'red'} size={20} />
						</TouchableOpacity>
					</View>
				</React.Fragment>
			))}
			<TouchableOpacity onPress={handleAddWorkItem} className='flex-row items-center gap-2 mb-2'>
				<Ionicons name={'add-circle-outline'} size={18} color={colors.secondary} />
				<Text className='text-light-secondary dark:text-dark-secondary'>Add Work Item</Text>
			</TouchableOpacity>
		</>
	);
};
