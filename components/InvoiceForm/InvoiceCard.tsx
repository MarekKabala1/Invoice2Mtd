import React, { useState, memo, useMemo, useCallback, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList } from 'react-native';
import {
	InvoiceType,
	WorkInformationType,
	PaymentType,
	NoteType,
	CustomerType,
	UserType,
	BankDetailsType,
} from '@/db/zodSchema';
import { useFocusEffect, useRouter } from 'expo-router';
import BaseCard from '../BaseCard';
import { getCurrencySymbol } from '@/utils/getCurrencySymbol';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import InvoiceSettingsModal from './InvoiceSettingsModal';
import { useIsInvoicePaid } from '@/hooks/useIsInvoicePaid';
import { getUserAndBankDetails } from '@/utils/invoiceFormOperations';

type InvoiceCardProps = {
	invoice: InvoiceType;
	workItems: WorkInformationType[];
	payments: PaymentType[];
	notes: NoteType[];
	customer: CustomerType;
	onAdd: boolean;
	onDelete?: (invoiceId: string) => void;
	onUpdate: (id: string, updateData?: Partial<InvoiceType>) => void;
	onSyncComplete?: () => void;
};

const InvoiceCard = ({
	invoice,
	workItems,
	payments,
	notes,
	customer,
	onDelete,
	onUpdate,
	onAdd = false,
	onSyncComplete,
}: InvoiceCardProps) => {
	const router = useRouter();
	const [expanded, setExpanded] = useState(false);
	const { colors, isDark } = useTheme();
	const [showSettings, setShowSettings] = useState(false);
	const [invoiceData, setInvoiceData] = useState<InvoiceType>(invoice);
	const [customerData, setCustomerData] = useState<CustomerType>(
		customer.id === invoice.customerId ? customer : customer
	);
	const [userData, setUserData] = useState<UserType | null>(null);
	const [bankDetails, setBankDetails] = useState<BankDetailsType | null>(null);
	const [isPayedOptimistic, setIsPayedOptimistic] = useState<boolean | null>(
		null
	);

	const { balance, taxBalance, tax } = useMemo(
		() => ({
			balance: invoice.amountBeforeTax,
			taxBalance: !invoice.taxValue
				? invoice.amountBeforeTax - invoice.amountAfterTax
				: invoice.amountAfterTax - invoice.amountBeforeTax,
			tax: invoice.taxRate,
		}),
		[invoice.amountBeforeTax, invoice.amountAfterTax, invoice.taxRate]
	);
	const isPayed =
		isPayedOptimistic !== null ? isPayedOptimistic : invoice.isPayed;

	useEffect(() => {
		useIsInvoicePaid(invoice);
	}, [isPayed, invoice]);

	const handleExpand = useCallback(() => {
		setExpanded((prev) => !prev);
	}, []);

	const handleDelete = useCallback(() => {
		onDelete?.(invoice.id!);
	}, [invoice.id, onDelete]);

	const fetchUserData = useCallback(async () => {
		try {
			const { userDetails, bankDetails } = await getUserAndBankDetails(
				invoice.userId
			);
			setUserData(userDetails);
			setBankDetails(bankDetails);
		} catch (error) {
			console.error('Error fetching user data:', error);
		}
	}, [invoice.userId]);

	useEffect(() => {
		fetchUserData();
	}, [fetchUserData]);

	return (
		<>
			<BaseCard
				className={`mb-3 ${onAdd ? 'w-[90%]' : ''}`}
				accentColor={isPayed ? undefined : (isDark ? '#9fb3c8' : '#486581')}>
				<TouchableOpacity
					onPress={handleExpand}
					onLongPress={handleDelete}
					className='flex-col justify-between items-center gap-1'>
					<View className='flex-row w-full justify-between items-center'>
						<View className='flex-1 mr-2'>
							<View className='flex-row items-center gap-2'>
								<Text className='text-lg font-bold text-light-text dark:text-dark-text'>
									Invoice # {invoice.id}
								</Text>
								<View
									className='px-2 py-0.5 rounded-full'
									style={{
										backgroundColor: isPayed
											? isDark ? '#334e68' : '#334e68'
											: isDark ? 'rgba(238,28,28,0.2)' : 'rgba(238,28,28,0.1)',
									}}
								>
									<Text
										className='text-xs font-bold'
										style={{
											color: isPayed ? '#d9e2ec' : '#ee1c1c',
										}}
									>
										{isPayed ? 'Paid' : 'Unpaid'}
									</Text>
								</View>
							</View>
							<Text className='text-xs text-light-text dark:text-dark-text'>
								Due: {new Date(invoice.dueDate).toLocaleDateString()}
							</Text>
						</View>

						<View className='flex-row items-center'>
							<Text className='font-bold text-lg text-light-text dark:text-dark-text mr-2 tabular-nums'>
								{getCurrencySymbol(invoice.currency)}
								{invoice.amountAfterTax.toFixed(2)}
							</Text>

							<TouchableOpacity
								onPress={() => {
									setShowSettings(true);
									setInvoiceData(invoice);
									setCustomerData(customer);
								}}
								className=' rounded-md p-1'>
								<MaterialCommunityIcons
									name='dots-vertical'
									size={20}
									color={colors.text}
								/>
							</TouchableOpacity>
						</View>
					</View>
					<View className='flex-row w-full justify-between'>
						<Text className='text-xs text-light-text dark:text-dark-text opacity-50 text-center'>
							* Press to expand
						</Text>
						<Text className='text-xs text-light-text dark:text-dark-text opacity-50 text-center'>
							* Long Press to delete
						</Text>
					</View>
				</TouchableOpacity>

				{expanded && (
					<View className='mt-4'>
						<View className='flex-row justify-between items-center'>
							<Text className='font-semibold text-light-text dark:text-dark-text'>
								Customer:
							</Text>
							<Text className=' text-light-text dark:text-dark-text text-xs'>
								{customer.name}
							</Text>
						</View>
						<Text className='font-semibold text-light-text dark:text-dark-text'>
							Work Items:
						</Text>
						<FlatList
							data={workItems}
							keyExtractor={(item) => item.id!}
							renderItem={({ item }) => (
								<View className='flex-row justify-between my-1'>
									<Text className='max-w-52 pl-4 text-light-text dark:text-dark-text'>
										{item.descriptionOfWork}
									</Text>
									<Text className='text-light-text dark:text-dark-text'>
										{getCurrencySymbol(invoice.currency)}
										{item.unitPrice.toFixed(2)}
									</Text>
								</View>
							)}
						/>

						<Text className='font-semibold text-light-text dark:text-dark-text'>
							Payments:
						</Text>
						<FlatList
							data={payments}
							keyExtractor={(item) => item.id!}
							renderItem={({ item }) => (
								<View className='flex-row justify-between my-1'>
									<Text className='text-light-text dark:text-dark-text pl-3'>
										{item.paymentDate}
									</Text>
									<Text className='text-light-text dark:text-dark-text'>
										{getCurrencySymbol(invoice.currency)}
										{item.amountPaid.toFixed(2)}
									</Text>
								</View>
							)}
						/>
						<View className='flex-row justify-between items-center'>
							<Text className='font-semibold text-light-text dark:text-dark-text'>
								Tax:
							</Text>
							<Text className=' text-light-text dark:text-dark-text'>
								{tax}% ({taxBalance.toFixed(2)})
							</Text>
						</View>
						<View className='flex-row justify-between items-center'>
							<Text className='font-semibold text-light-text dark:text-dark-text'>
								Balance:
							</Text>
							<Text className='font-bold text-2xl text-light-text dark:text-dark-text tabular-nums'>
								{getCurrencySymbol(invoice.currency)}
								{balance.toFixed(2)}
							</Text>
						</View>

						<Text className='font-semibold text-light-text dark:text-dark-text'>
							Notes:
						</Text>
						<FlatList
							data={notes}
							keyExtractor={(item) => item.id!}
							renderItem={({ item }) => (
								<View className='my-1'>
									<Text className='text-light-text dark:text-dark-text'>
										{item.noteText}
									</Text>
								</View>
							)}
						/>
					</View>
				)}
			</BaseCard>
			<InvoiceSettingsModal
				setShowSettings={setShowSettings}
				showSettings={showSettings}
				invoice={invoiceData}
				customer={customerData}
				user={userData!}
				onUpdate={onUpdate}
				setIsPayedOptimistic={setIsPayedOptimistic}
				workItems={workItems}
				payments={payments}
				notes={notes.map((n) => n.noteText).join('\n')}
				bankDetails={bankDetails}
				onSyncComplete={onSyncComplete}
			/>
		</>
	);
};

export default memo(InvoiceCard);
