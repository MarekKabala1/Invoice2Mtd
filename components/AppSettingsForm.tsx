import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { appSettingsSchema, AppSettingsType } from '@/db/zodSchema';
import { useTheme } from '@/context/ThemeContext';
import { useAppSettings } from '@/context/AppSettingsContext';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import Picker from './Picker';
import BaseCard from './BaseCard';
import options from '@/utils/appSettingsOption';
import { getReorderedQuarters } from '@/utils/yearQuarters';
import {
	getInvoiceStorageDirectory,
	getEstimateStorageDirectory,
	getBillStorageDirectory,
	requestInvoiceStorageDirectory,
	requestEstimateStorageDirectory,
	requestBillStorageDirectory,
	resetInvoiceStorageDirectory,
	resetEstimateStorageDirectory,
	resetBillStorageDirectory,
} from '@/utils/permissions';

export default function AppSettingsForm({
	initialValues,
	onSubmit,
	onDelete,
	isSaved,
}: {
	initialValues?: Partial<AppSettingsType>;
	onSubmit: (values: AppSettingsType) => void;
	onDelete?: () => void;
	isSaved?: boolean;
}) {
	const { colors } = useTheme();
	const {
		control,
		setValue,
		handleSubmit,
		watch,
		formState: { errors },
	} = useForm<AppSettingsType>({
		resolver: zodResolver(appSettingsSchema),
		defaultValues: initialValues,
	});

	const iconColor = colors.text;
	const [quarterOptions, setQuarterOptions] = useState(options.quarters);
	const [invoiceStorageLocation, setInvoiceStorageLocation] = useState<string | null>(null);
	const [estimateStorageLocation, setEstimateStorageLocation] = useState<string | null>(null);
	const [billStorageLocation, setBillStorageLocation] = useState<string | null>(null);

	const { update } = useAppSettings();

	useEffect(() => {
		loadStorageLocations();
	}, []);

	const loadStorageLocations = async () => {
		const invoiceLocation = await getInvoiceStorageDirectory();
		const estimateLocation = await getEstimateStorageDirectory();
		const billLocation = await getBillStorageDirectory();
		setInvoiceStorageLocation(invoiceLocation);
		setEstimateStorageLocation(estimateLocation);
		setBillStorageLocation(billLocation);
	};

	const handleChangeInvoiceStorage = async () => {
		if (Platform.OS !== 'android') {
			Alert.alert('Info', 'This feature is only available on Android. On iOS, PDFs are shared directly.');
			return;
		}
		const newLocation = await requestInvoiceStorageDirectory();
		if (newLocation) {
			setInvoiceStorageLocation(newLocation);
			Alert.alert('Success', 'Invoice storage location updated successfully.');
		}
	};

	const handleChangeEstimateStorage = async () => {
		if (Platform.OS !== 'android') {
			Alert.alert('Info', 'This feature is only available on Android. On iOS, PDFs are shared directly.');
			return;
		}
		const newLocation = await requestEstimateStorageDirectory();
		if (newLocation) {
			setEstimateStorageLocation(newLocation);
			Alert.alert('Success', 'Estimate storage location updated successfully.');
		}
	};

	const handleChangeBillStorage = async () => {
		if (Platform.OS !== 'android') {
			Alert.alert('Info', 'This feature is only available on Android. On iOS, PDFs are shared directly.');
			return;
		}
		const newLocation = await requestBillStorageDirectory();
		if (newLocation) {
			setBillStorageLocation(newLocation);
			Alert.alert('Success', 'Bill storage location updated successfully.');
		}
	};

	const handleResetInvoiceStorage = async () => {
		Alert.alert(
			'Reset Invoice Storage',
			'Are you sure you want to reset the invoice storage location? You will be prompted to select a new location next time you save an invoice.',
			[
				{ text: 'Cancel', style: 'cancel' },
				{
					text: 'Reset',
					style: 'destructive',
					onPress: async () => {
						await resetInvoiceStorageDirectory();
						setInvoiceStorageLocation(null);
					},
				},
			]
		);
	};

	const handleResetEstimateStorage = async () => {
		Alert.alert(
			'Reset Estimate Storage',
			'Are you sure you want to reset the estimate storage location? You will be prompted to select a new location next time you save an estimate.',
			[
				{ text: 'Cancel', style: 'cancel' },
				{
					text: 'Reset',
					style: 'destructive',
					onPress: async () => {
						await resetEstimateStorageDirectory();
						setEstimateStorageLocation(null);
					},
				},
			]
		);
	};

	const handleResetBillStorage = async () => {
		Alert.alert(
			'Reset Bill Storage',
			'Are you sure you want to reset the bill storage location? You will be prompted to select a new location next time you scan a bill.',
			[
				{ text: 'Cancel', style: 'cancel' },
				{
					text: 'Reset',
					style: 'destructive',
					onPress: async () => {
						await resetBillStorageDirectory();
						setBillStorageLocation(null);
					},
				},
			]
		);
	};

	const formatStoragePath = (uri: string | null) => {
		if (!uri) return 'Not set (will prompt when saving)';
		// Extract a readable name from the URI
		const parts = uri.split('/');
		return parts[parts.length - 1] || uri;
	};
	const handleFormSubmit = async (values: AppSettingsType) => {
		await update(values);
		onSubmit(values);
	};

	const handleQuarterChange = (val: string) => {
		setValue('quarterStartMonths', val);
		setQuarterOptions(getReorderedQuarters(val));
	};

	return (
		<ScrollView className='flex-1 p-4  bg-light-primary dark:bg-dark-primary'>
			<View className='gap-6'>
				<BaseCard>
					<View className='flex-row items-center gap-2 mb-1'>
						<FontAwesome5 name='calendar-alt' size={20} color={iconColor} />
						<Text className='text-lg font-bold text-light-text dark:text-dark-text'>Financial Year</Text>
					</View>
					<View className='flex-col gap-2'>
						<View className='flex-row gap-2 items-center'>
							<Text className='text-light-text dark:text-dark-text'>Start:</Text>
							<View style={{ flex: 1 }}>
								<Controller
									control={control}
									name='financialYearStartMonth'
									render={({ field }) => (
										<Picker
											items={options.months}
											onValueChange={(val) => field.onChange(Number(val))}
											initialValue={field.value ? String(field.value) : '1'}
										/>
									)}
								/>
							</View>
							<View style={{ flex: 1 }}>
								<Controller
									control={control}
									name='financialYearStartDay'
									render={({ field }) => (
										<Picker items={options.days} onValueChange={(val) => field.onChange(Number(val))} initialValue={field.value ? String(field.value) : '1'} />
									)}
								/>
							</View>
						</View>
						<View className='flex-row gap-2 items-center'>
							<Text className='text-light-text dark:text-dark-text'>End:</Text>
							<View style={{ flex: 1 }}>
								<Controller
									control={control}
									name='financialYearEndMonth'
									render={({ field }) => (
										<Picker
											items={options.months}
											onValueChange={(val) => field.onChange(Number(val))}
											initialValue={field.value ? String(field.value) : '12'}
										/>
									)}
								/>
							</View>
							<View style={{ flex: 1 }}>
								<Controller
									control={control}
									name='financialYearEndDay'
									render={({ field }) => (
										<Picker items={options.days} onValueChange={(val) => field.onChange(Number(val))} initialValue={field.value ? String(field.value) : '31'} />
									)}
								/>
							</View>
						</View>
					</View>
				</BaseCard>
				<BaseCard>
					<View className='flex-row items-center gap-2 mb-1'>
						<MaterialCommunityIcons name='calendar-range' size={20} color={iconColor} />
						<Text className='text-lg font-bold text-light-text dark:text-dark-text'>Quarters</Text>
					</View>
					<Controller
						control={control}
						name='quarterStartMonths'
						render={({ field }) => <Picker items={quarterOptions} onValueChange={handleQuarterChange} initialValue={field.value || quarterOptions[0].value} />}
					/>
					<Text className='text-xs text-light-text dark:text-dark-text mt-2'>
						The selected quarter will be treated as the first quarter of your financial year.
					</Text>
				</BaseCard>
				<BaseCard>
					<View className='flex-row items-center gap-2 mb-1'>
						<FontAwesome5 name='cogs' size={20} color={iconColor} />
						<Text className='text-lg font-bold text-light-text dark:text-dark-text'>General Settings</Text>
					</View>
					<View className='gap-2'>
						<Controller
							control={control}
							name='currency'
							render={({ field }) => <Picker items={options.currency} onValueChange={field.onChange} initialValue={field.value || options.currency[0].value} />}
						/>
						<Controller
							control={control}
							name='dateFormat'
							render={({ field }) => (
								<Picker items={options.dateFormat} onValueChange={field.onChange} initialValue={field.value || options.dateFormat[0].value} />
							)}
						/>
						<Controller
							control={control}
							name='numberFormat'
							render={({ field }) => (
								<Picker items={options.numberFormat} onValueChange={field.onChange} initialValue={field.value || options.numberFormat[0].value} />
							)}
						/>
						<Controller
							control={control}
							name='language'
							render={({ field }) => <Picker items={options.language} onValueChange={field.onChange} initialValue={field.value || options.language[0].value} />}
						/>
						<Controller
							control={control}
							name='theme'
							render={({ field }) => <Picker items={options.theme} onValueChange={field.onChange} initialValue={field.value || options.theme[0].value} />}
						/>
					</View>
				</BaseCard>
				<BaseCard>
					<View className='flex-row items-center gap-2 mb-1'>
						<FontAwesome5 name='sliders-h' size={20} color={iconColor} />
						<Text className='text-lg font-bold text-light-text dark:text-dark-text'>Invoice & Estimate Defaults</Text>
					</View>
					<View className='gap-2'>
						<Controller
							control={control}
							name='defaultPaymentTerms'
							render={({ field }) => (
								<TextInput
									className='border border-light-text dark:border-dark-text rounded px-3 py-2 text-light-text dark:text-dark-text'
									value={field.value?.toString() || ''}
									onChangeText={(text) => field.onChange(Number(text))}
									keyboardType='numeric'
									autoCapitalize='none'
									placeholderTextColor={colors.text}
									placeholder='Default Payment Terms (days)'
								/>
							)}
						/>
						<Controller
							control={control}
							name='defaultVatRate'
							render={({ field }) => (
								<TextInput
									className='border border-light-text dark:border-dark-text rounded px-3 py-2 text-light-text dark:text-dark-text'
									value={field.value?.toString() || ''}
									onChangeText={(text) => field.onChange(Number(text))}
									keyboardType='numeric'
									autoCapitalize='none'
									placeholderTextColor={colors.text}
									placeholder='Default VAT Rate (%)'
								/>
							)}
						/>
						<Controller
							control={control}
							name='invoicePrefix'
							render={({ field }) => (
								<TextInput
									className='border border-light-text dark:border-dark-text rounded px-3 py-2 text-light-text dark:text-dark-text'
									value={field.value || ''}
									onChangeText={field.onChange}
									autoCapitalize='characters'
									placeholderTextColor={colors.text}
									placeholder='Invoice Prefix'
								/>
							)}
						/>
						<Controller
							control={control}
							name='nextInvoiceNumber'
							render={({ field }) => (
								<TextInput
									className='border border-light-text dark:border-dark-text rounded px-3 py-2 text-light-text dark:text-dark-text'
									value={field.value?.toString() || ''}
									onChangeText={(text) => field.onChange(Number(text))}
									keyboardType='numeric'
									autoCapitalize='none'
									placeholderTextColor={colors.text}
									placeholder='Next Invoice Number'
								/>
							)}
						/>
						<Controller
							control={control}
							name='estimatePrefix'
							render={({ field }) => (
								<TextInput
									className='border border-light-text dark:border-dark-text rounded px-3 py-2 text-light-text dark:text-dark-text'
									value={field.value || ''}
									onChangeText={field.onChange}
									autoCapitalize='characters'
									placeholderTextColor={colors.text}
									placeholder='Estimate Prefix'
								/>
							)}
						/>
						<Controller
							control={control}
							name='nextEstimateNumber'
							render={({ field }) => (
								<TextInput
									className='border border-light-text dark:border-dark-text rounded px-3 py-2 text-light-text dark:text-dark-text'
									value={field.value?.toString() || ''}
									onChangeText={(text) => field.onChange(Number(text))}
									keyboardType='numeric'
									autoCapitalize='none'
									placeholderTextColor={colors.text}
									placeholder='Next Estimate Number'
								/>
							)}
						/>
						<Controller
							control={control}
							name='logoUrl'
							render={({ field }) => (
								<TextInput
									className='border border-light-text dark:border-dark-text rounded px-3 py-2 text-light-text dark:text-dark-text'
									value={field.value || ''}
									onChangeText={field.onChange}
									autoCapitalize='none'
									placeholderTextColor={colors.text}
									placeholder='Logo URL'
								/>
							)}
						/>
					</View>
				</BaseCard>
				<BaseCard>
					<View className='flex-row items-center gap-2 mb-1'>
						<FontAwesome5 name='bell' size={20} color={iconColor} />
						<Text className='text-lg font-bold text-light-text dark:text-dark-text'>Reminders & Tax</Text>
					</View>
					<View className='gap-2'>
						<Controller
							control={control}
							name='reminderEmailEnabled'
							render={({ field }) => (
								<TouchableOpacity
									className={`px-4 py-2 rounded ${field.value ? 'bg-light-accent dark:bg-dark-accent' : 'bg-light-nav dark:bg-dark-nav'}`}
									onPress={() => field.onChange(!field.value)}>
									<Text className='text-light-text dark:text-dark-text'>{field.value ? 'Email Reminders On' : 'Email Reminders Off'}</Text>
								</TouchableOpacity>
							)}
						/>
						<Controller
							control={control}
							name='reminderDaysBeforeDue'
							render={({ field }) => (
								<TextInput
									className='border border-light-text dark:border-dark-text rounded px-3 py-2 text-light-text dark:text-dark-text'
									value={field.value?.toString() || ''}
									onChangeText={(text) => field.onChange(Number(text))}
									keyboardType='numeric'
									autoCapitalize='none'
									placeholderTextColor={colors.text}
									placeholder='Days before due date'
								/>
							)}
						/>
						<Controller
							control={control}
							name='taxScheme'
							render={({ field }) => (
								<Picker items={options.taxScheme} onValueChange={field.onChange} initialValue={field.value || options.taxScheme[0].value} />
							)}
						/>
						<Controller
							control={control}
							name='defaultTaxCategory'
							render={({ field }) => (
								<Picker items={options.defaultTaxCategory} onValueChange={field.onChange} initialValue={field.value || options.defaultTaxCategory[0].value} />
							)}
						/>
					</View>
				</BaseCard>
				<BaseCard>
					<View className='flex-row items-center gap-2 mb-1'>
						<FontAwesome5 name='calendar-check' size={20} color={iconColor} />
						<Text className='text-lg font-bold text-light-text dark:text-dark-text'>Quarters & Automation</Text>
					</View>
					<View className='gap-2'>
						<Controller
							control={control}
							name='autoCalculateQuarters'
							render={({ field }) => (
								<TouchableOpacity
									className={`px-4 py-2 rounded ${field.value ? 'bg-light-accent dark:bg-dark-accent' : 'bg-light-nav dark:bg-dark-nav'}`}
									onPress={() => field.onChange(!field.value)}>
									<Text className='text-light-text dark:text-dark-text'>{field.value ? 'Auto Calculate Quarters On' : 'Auto Calculate Quarters Off'}</Text>
								</TouchableOpacity>
							)}
						/>
						<Controller
							control={control}
							name='quarterlyTaxEnabled'
							render={({ field }) => (
								<TouchableOpacity
									className={`px-4 py-2 rounded ${field.value ? 'bg-light-accent dark:bg-dark-accent' : 'bg-light-nav dark:bg-dark-nav'}`}
									onPress={() => field.onChange(!field.value)}>
									<Text className='text-light-text dark:text-dark-text'>{field.value ? 'Quarterly Tax Enabled' : 'Quarterly Tax Disabled'}</Text>
								</TouchableOpacity>
							)}
						/>
						<Controller
							control={control}
							name='quarterlyTaxReminderDays'
							render={({ field }) => (
								<TextInput
									className='border border-light-text dark:border-dark-text rounded px-3 py-2 text-light-text dark:text-dark-text'
									value={field.value?.toString() || ''}
									onChangeText={(text) => field.onChange(Number(text))}
									keyboardType='numeric'
									autoCapitalize='none'
									placeholderTextColor={colors.text}
									placeholder='Quarterly Tax Reminder Days'
								/>
							)}
						/>
					</View>
				</BaseCard>
				{Platform.OS === 'android' && (
					<BaseCard>
						<View className='flex-row items-center gap-2 mb-1'>
							<MaterialCommunityIcons name='folder-text' size={20} color={iconColor} />
							<Text className='text-lg font-bold text-light-text dark:text-dark-text'>PDF Save Locations</Text>
						</View>
						<View className='gap-4'>
							<View className='gap-2'>
								<Text className='text-sm font-medium text-light-text dark:text-dark-text'>Invoice Save Location</Text>
								<Text className='text-xs text-light-text dark:text-dark-text opacity-70'>
									{formatStoragePath(invoiceStorageLocation)}
								</Text>
								<View className='flex-row gap-2'>
									<TouchableOpacity
										className='flex-1 bg-light-accent dark:bg-dark-accent py-2 rounded'
										onPress={handleChangeInvoiceStorage}>
										<Text className='text-center text-light-text dark:text-dark-text text-sm font-medium'>
											{invoiceStorageLocation ? 'Change Location' : 'Set Location'}
										</Text>
									</TouchableOpacity>
									{invoiceStorageLocation && (
										<TouchableOpacity
											className='bg-light-nav dark:bg-dark-nav py-2 px-3 rounded border border-light-text dark:border-dark-text'
											onPress={handleResetInvoiceStorage}>
											<MaterialCommunityIcons name='refresh' size={18} color={iconColor} />
										</TouchableOpacity>
									)}
								</View>
							</View>
							<View className='h-px bg-light-text dark:bg-dark-text opacity-20' />
							<View className='gap-2'>
								<Text className='text-sm font-medium text-light-text dark:text-dark-text'>Estimate Save Location</Text>
								<Text className='text-xs text-light-text dark:text-dark-text opacity-70'>
									{formatStoragePath(estimateStorageLocation)}
								</Text>
								<View className='flex-row gap-2'>
									<TouchableOpacity
										className='flex-1 bg-light-accent dark:bg-dark-accent py-2 rounded'
										onPress={handleChangeEstimateStorage}>
										<Text className='text-center text-light-text dark:text-dark-text text-sm font-medium'>
											{estimateStorageLocation ? 'Change Location' : 'Set Location'}
										</Text>
									</TouchableOpacity>
									{estimateStorageLocation && (
										<TouchableOpacity
											className='bg-light-nav dark:bg-dark-nav py-2 px-3 rounded border border-light-text dark:border-dark-text'
											onPress={handleResetEstimateStorage}>
											<MaterialCommunityIcons name='refresh' size={18} color={iconColor} />
										</TouchableOpacity>
									)}
								</View>
						</View>
						<View className='h-px bg-light-text dark:bg-dark-text opacity-20' />
							<View className='gap-2'>
								<Text className='text-sm font-medium text-light-text dark:text-dark-text'>Bill (Scanner) Save Location</Text>
								<Text className='text-xs text-light-text dark:text-dark-text opacity-70'>
									{formatStoragePath(billStorageLocation)}
								</Text>
								<View className='flex-row gap-2'>
									<TouchableOpacity
										className='flex-1 bg-light-accent dark:bg-dark-accent py-2 rounded'
										onPress={handleChangeBillStorage}>
										<Text className='text-center text-light-text dark:text-dark-text text-sm font-medium'>
											{billStorageLocation ? 'Change Location' : 'Set Location'}
										</Text>
									</TouchableOpacity>
									{billStorageLocation && (
										<TouchableOpacity
											className='bg-light-nav dark:bg-dark-nav py-2 px-3 rounded border border-light-text dark:border-dark-text'
											onPress={handleResetBillStorage}>
											<MaterialCommunityIcons name='refresh' size={18} color={iconColor} />
										</TouchableOpacity>
									)}
								</View>
							</View>
							<Text className='text-xs text-light-text dark:text-dark-text opacity-60 mt-1'>
								You can set different save locations for invoices, estimates, and scanned bills. Each time you save a PDF, it will be saved to the configured folder.
							</Text>
						</View>
					</BaseCard>
				)}
				<View className='flex-row gap-3 mt-2'>
					<TouchableOpacity className='flex-1 bg-light-accent dark:bg-dark-accent py-3 rounded pb-4' onPress={handleSubmit(handleFormSubmit)}>
						<Text className='text-center text-light-text dark:text-dark-text font-bold'>{isSaved ? 'Update Settings' : 'Save Settings'}</Text>
					</TouchableOpacity>
					{isSaved && onDelete && (
						<TouchableOpacity className='flex-1 bg-danger dark:bg-danger py-3 rounded pb-4' onPress={onDelete}>
							<Text className='text-center text-dark-text font-bold'>Delete</Text>
						</TouchableOpacity>
					)}
				</View>
				<View className='h-10' />
			</View>
		</ScrollView>
	);
}
