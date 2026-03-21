import React, { useState, useEffect, useRef } from 'react';
import {
	View,
	Text,
	TextInput,
	ScrollView,
	TouchableOpacity,
	Modal,
	SafeAreaView,
	Alert,
} from 'react-native';
import { useForm, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { WebView } from 'react-native-webview';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import {
	invoiceSchema,
	workInformationSchema,
	paymentSchema,
	CustomerType,
	InvoiceType,
	PaymentType,
	WorkInformationType,
	UserType,
	BankDetailsType,
} from '@/db/zodSchema';
import {
	getInvoiceForNumber,
	getNextSequentialInvoiceId,
	getUsers,
	getUserAndBankDetails,
	handleSaveInvoice,
	handleSendInvoice,
	handleExportPdfInvoice,
	handlePreviewInvoice,
} from '@/utils/invoiceFormOperations';
import { getCustomers } from '@/utils/customerOperations';
import { InvoiceHeaderSection } from './InvoiceHeaderSection';
import { WorkItemsList } from './WorkItemsList';
import { PaymentsList } from './PaymentsList';
import { NotesSection } from './NotesSection';
import { ActionButtons } from './ActionButtons';

interface InvoiceFormProps {
	isUpdateMode?: boolean;
	invoiceData?: InvoiceType;
	workItemsData?: WorkInformationType[];
	paymentsData?: PaymentType[];
	notes?: Array<{ id: string; noteText: string }>;
}

const InvoiceForm: React.FC<InvoiceFormProps> = ({
	isUpdateMode = false,
	invoiceData,
	workItemsData,
	paymentsData,
	notes,
}) => {
	const [nextInvoiceId, setNextInvoiceId] = useState<string>();
	const [isPreviewVisible, setIsPreviewVisible] = useState(false);
	const [htmlPreview, setHtmlPreview] = useState<string>('');
	const [selectedCustomer, setSelectedCustomer] = useState<CustomerType | null>(
		null
	);
	const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
	const [customers, setCustomers] = useState<
		Array<{ label: string; value: string }>
	>([]);
	const [users, setUsers] = useState<Array<{ label: string; value: string }>>(
		[]
	);
	const [bankDetails, setBankDetails] = useState<BankDetailsType | null>(null);
	const [isNotesOpen, setIsNotesOpen] = useState(false);
	const [note, setNote] = useState('');
	const [workItemId, setWorkItemId] = useState<string>('');
	const [noteItemId, setNoteItemId] = useState<string>('');
	const [isEnabled, setIsEnabled] = useState(false);
	const [isPayed, setIsPayed] = useState(false);

	const toggleSwitch = () => {
		setIsEnabled((previousState) => !previousState);
		setValue('taxValue', !isEnabled);
	};

	const { colors } = useTheme();

	const {
		control,
		handleSubmit,
		setValue,
		watch,
		reset,
		formState: { errors },
	} = useForm<
		InvoiceType & { workItems: WorkInformationType[]; payments: PaymentType[] }
	>({
		resolver: zodResolver(
			invoiceSchema.extend({
				workItems: z.array(workInformationSchema),
				payments: z.array(paymentSchema),
			})
		),
		defaultValues: {
			id: '',
			customerId: '',
			userId: '',
			invoiceDate: new Date().toISOString(),
			dueDate: new Date().toISOString(),
			amountAfterTax: 0,
			amountBeforeTax: 0,
			taxRate: 0,
			pdfPath: '',
			createdAt: new Date().toISOString(),
			workItems: [],
			payments: [],
			taxValue: false,
			isPayed: false,
		},
	});

	const {
		fields: workFields,
		append: appendWork,
		remove: removeWork,
	} = useFieldArray({
		control,
		name: 'workItems',
	});

	const {
		fields: paymentFields,
		append: appendPayment,
		remove: removePayment,
	} = useFieldArray({
		control,
		name: 'payments',
	});

	useEffect(() => {
		if (isUpdateMode && invoiceData?.taxValue && invoiceData?.isPayed) {
			setIsEnabled(invoiceData.taxValue);
			setIsPayed(invoiceData.isPayed);
		}
		const fetchData = async () => {
			const nextId = await getNextSequentialInvoiceId();
			setNextInvoiceId(nextId);

			const customersData = await getCustomers();
			setCustomers(
				customersData.map((c: CustomerType) => ({
					label: c.name,
					value: c.id || '',
				}))
			);

			const usersData = await getUsers(false); // or adjust as needed
			setUsers(usersData);
		};

		fetchData();
	}, []);

	useEffect(() => {
		const customerId = watch('customerId');
		const userId = watch('userId');
		const isPayed = watch('isPayed');

		if (customerId) {
			const fetchCustomerDetails = async () => {
				const customer = await getCustomers();
				const found = customer.find((c: CustomerType) => c.id === customerId);
				setSelectedCustomer(found || null);
			};
			fetchCustomerDetails();
		}

		if (userId) {
			const fetchUserAndBankDetails = async () => {
				const { userDetails, bankDetails } =
					await getUserAndBankDetails(userId);
				setSelectedUser(userDetails);
				setBankDetails(bankDetails);
			};
			fetchUserAndBankDetails();
		}
	}, [watch('customerId'), watch('userId'), watch('isPayed')]);

	useEffect(() => {
		if (isUpdateMode && invoiceData) {
			setValue('id', String(invoiceData.id || ''));
			setValue('customerId', String(invoiceData.customerId || ''));
			setValue('userId', String(invoiceData.userId || ''));
			setValue(
				'invoiceDate',
				String(invoiceData.invoiceDate || new Date().toISOString())
			);
			setValue(
				'dueDate',
				String(invoiceData.dueDate || new Date().toISOString())
			);
			setValue(
				'amountBeforeTax',
				parseFloat(String(invoiceData.amountBeforeTax || '0'))
			);
			setValue(
				'amountAfterTax',
				parseFloat(String(invoiceData.amountAfterTax || '0'))
			);
			setValue('taxRate', Number(invoiceData.taxRate));
			setValue('taxValue', invoiceData.taxValue);
			setValue('currency', String(invoiceData.currency || ''));
			setValue('workItems', workItemsData || []);
			setValue('payments', paymentsData || []);
			setValue('isPayed', invoiceData.isPayed || false);

			if (workItemsData) {
				workItemsData.forEach((item) => setWorkItemId(item.id));
			}

			if (notes) {
				const notesArray = Array.isArray(notes) ? notes : [notes];
				setNote(notesArray.map((n) => n.noteText || '').join('\n'));
				setIsNotesOpen(true);
				notesArray.forEach((item) => setNoteItemId(item.id));
			}
		}
	}, [isUpdateMode, invoiceData]);

	const getDayOfWeek = (index: number): string => {
		const days = [
			'Monday',
			'Tuesday',
			'Wednesday',
			'Thursday',
			'Friday',
			'Saturday',
			'Sunday',
		];
		return days[index % 7];
	};

	const handleSave = async (
		data: InvoiceType & {
			workItems: WorkInformationType[];
			payments: PaymentType[];
		}
	): Promise<void> => {
		try {
			await handleSaveInvoice(data, isUpdateMode, note, noteItemId);
			reset();
			router.navigate('/(tabs)/invoices');
		} catch (error) {
			console.error('Error saving invoice:', error);
			if (error instanceof Error) {
				Alert.alert('Error', error.message);
			} else {
				Alert.alert('Error', 'Failed to save invoice. Please try again.');
			}
		}
	};

	const handleSend = async (
		data: InvoiceType & {
			workItems: WorkInformationType[];
			payments: PaymentType[];
		}
	): Promise<void> => {
		if (!selectedUser || !selectedCustomer || !bankDetails) {
			console.error('Missing required information.');
			return;
		}
		await handleSendInvoice(
			data,
			selectedUser,
			selectedCustomer,
			bankDetails,
			note
		);
	};

	const handleExportPdf = async (
		data: InvoiceType & {
			workItems: WorkInformationType[];
			payments: PaymentType[];
		}
	): Promise<void> => {
		if (!selectedUser || !selectedCustomer || !bankDetails) {
			console.error('Missing required information.');
			return;
		}
		await handleExportPdfInvoice(
			data,
			selectedUser,
			selectedCustomer,
			bankDetails,
			note,
			false
		);
	};

	const handlePreview = (
		data: InvoiceType & {
			workItems: WorkInformationType[];
			payments: PaymentType[];
		}
	): void => {
		if (!selectedUser || !selectedCustomer || !bankDetails) {
			console.error('Missing required information.');
			return;
		}
		const html = handlePreviewInvoice(
			data,
			selectedUser,
			selectedCustomer,
			bankDetails,
			note,
			true
		);
		setHtmlPreview(html);
		setIsPreviewVisible(true);
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

	const handleAddPayment = (): void => {
		appendPayment({
			id: '',
			invoiceId: '',
			paymentDate: '',
			amountPaid: 0,
			createdAt: new Date().toISOString(),
		});
	};

	const invoiceIdRef = useRef<TextInput>(null);
	const taxRateRef = useRef<TextInput>(null);
	const workItemRefs = useRef<(TextInput | null)[]>([]);
	const paymentRefs = useRef<(TextInput | null)[]>([]);

	return (
		<ScrollView className='flex-1 p-4 bg-light-primary dark:bg-dark-primary'>
			<SafeAreaView className=' pb-10'>
				{!isUpdateMode && (
					<Text className='text-light-text dark:text-dark-text '>{`Next invoice number : ${nextInvoiceId ? nextInvoiceId : 1}`}</Text>
				)}
				<Text className='text-lg text-light-text dark:text-dark-text font-bold mb-4'>
					Invoice Information
				</Text>
				<InvoiceHeaderSection
					control={control}
					errors={errors}
					isUpdateMode={isUpdateMode}
					users={users}
					customers={customers}
					setValue={setValue}
					toggleTaxValueSwitch={toggleSwitch}
					taxValue={isEnabled}
				/>
				<WorkItemsList
					control={control}
					errors={errors}
					workFields={workFields}
					appendWork={appendWork}
					removeWork={removeWork}
					workItemRefs={workItemRefs}
				/>
				<PaymentsList
					control={control}
					errors={errors}
					paymentFields={paymentFields}
					appendPayment={appendPayment}
					removePayment={removePayment}
					paymentRefs={paymentRefs}
				/>
				<NotesSection
					isNotesOpen={isNotesOpen}
					setIsNotesOpen={setIsNotesOpen}
					note={note}
					setNote={setNote}
				/>
				<ActionButtons
					isUpdateMode={isUpdateMode}
					onSave={handleSubmit(handleSave)}
					onSend={handleSubmit(handleSend)}
					onExportPdf={handleSubmit(handleExportPdf)}
					onPreview={handleSubmit(handlePreview)}
				/>
				<Modal visible={isPreviewVisible} animationType='slide'>
					<SafeAreaView className='flex-1 bg-light-primary dark:bg-dark-primary min-h-8'>
						<TouchableOpacity
							onPress={() => setIsPreviewVisible(false)}
							className='flex flex-row  items-center gap-1 p-1'>
							<Ionicons name='arrow-back' size={24} color={colors.text} />
							<Text className='text-xs text-light-text dark:text-dark-text'>
								Create Invoice
							</Text>
						</TouchableOpacity>
						<WebView
							originWhitelist={['*']}
							source={{ html: htmlPreview }}
							className='flex-1 w-dvw'
						/>
					</SafeAreaView>
				</Modal>
			</SafeAreaView>
		</ScrollView>
	);
};

export default InvoiceForm;
