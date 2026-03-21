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
	estimateSchema,
	estimateNotesSchema,
	CustomerType,
	EstimateType,
	EstimateNotesType,
	UserType,
	BankDetailsType,
	EstimateTermsType,
} from '@/db/zodSchema';
import {
	getUsers,
	getUserAndBankDetails,
	getLastEstimateId,
	getNextSequentialEstimateId,
	handleSaveEstimate,
	handleSendEstimate,
	handleExportPdfEstimate,
	handlePreviewEstimate,
	getEstimateTerms,
	saveEstimateTerms,
} from '@/utils/estimateOperations';
import { calculateEstimateTotals } from '@/utils/estimateCalculations';
import {
	EstimateHeaderSection,
	EstimateNotesSection,
	EstimateTermsSection,
	EstimateActionButtons,
} from './';
import TermsAndConditions from '@/components/TermsAndConditions';
import { generateEstimateHtml } from '@/templates/estimateTemplate';
import { getCustomers } from '@/utils/customerOperations';

interface EstimateFormProps {
	isUpdateMode?: boolean;
	estimateData?: EstimateType;
	notes?: Array<{ id: string; noteText: string }>;
}

const EstimateForm: React.FC<EstimateFormProps> = ({
	isUpdateMode = false,
	estimateData,
	notes,
}) => {
	const [nextEstimateId, setNextEstimateId] = useState<string>();
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
	const [note, setNote] = useState('');
	const [noteItemId, setNoteItemId] = useState<string>('');
	const [calculatedAmountAfterTax, setCalculatedAmountAfterTax] =
		useState<number>(0);
	const [isEnabled, setIsEnabled] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [globalTerms, setGlobalTerms] = useState<EstimateTermsType[]>([]);
	const [selectedTermIds, setSelectedTermIds] = useState<string[]>([]);
	const [isTermsModalVisible, setIsTermsModalVisible] = useState(false);
	const [estimateTerms, setEstimateTerms] = useState<string[]>([]);

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
	} = useForm<EstimateType & { notes: EstimateNotesType[] }>({
		resolver: zodResolver(
			estimateSchema.extend({
				notes: z.array(estimateNotesSchema),
			})
		),
		defaultValues: {
			id: '',
			customerId: '',
			userId: '',
			estimateDate: new Date().toISOString(),
			estimateEndTime: new Date().toISOString(),
			currency: 'GBP',
			discount: 0,
			taxRate: 0,
			amountBeforeTax: 0,
			amountAfterTax: 0,
			taxValue: false,
			isAccepted: false,
			notes: [],
		},
	});

	const {
		fields: noteFields,
		append: appendNote,
		remove: removeNote,
	} = useFieldArray({
		control,
		name: 'notes',
	});

	useEffect(() => {
		const fetchData = async () => {
			const nextId = await getNextSequentialEstimateId();
			setNextEstimateId(nextId);

			const customersData = await getCustomers();
			setCustomers(
				customersData.map((c: CustomerType) => ({
					label: c.name,
					value: c.id || '',
				}))
			);

			const usersData = await getUsers(false); // or adjust as needed
			setUsers(usersData);

			// Fetch global terms for new estimates
			if (!isUpdateMode) {
				const terms = await getEstimateTerms('global');
				setGlobalTerms(terms);
			}
		};

		fetchData();
	}, []);

	useEffect(() => {
		const customerId = watch('customerId');
		const userId = watch('userId');

		if (customerId) {
			const fetchCustomerDetails = async () => {
				const customers = await getCustomers();
				const found = customers.find((c: CustomerType) => c.id === customerId);
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
	}, [watch('customerId'), watch('userId')]);

	useEffect(() => {
		const amountBeforeTax = watch('amountBeforeTax') || 0;
		const taxRate = watch('taxRate') || 0;
		const discount = watch('discount') || 0;
		const taxValue = watch('taxValue') || false;

		const { total } = calculateEstimateTotals(
			amountBeforeTax,
			taxRate,
			discount,
			taxValue
		);
		setCalculatedAmountAfterTax(total);
	}, [
		watch('amountBeforeTax'),
		watch('taxRate'),
		watch('discount'),
		watch('taxValue'),
	]);

	useEffect(() => {
		if (isUpdateMode && estimateData) {
			setValue('id', String(estimateData.id || ''));
			setValue('customerId', String(estimateData.customerId || ''));
			setValue('userId', String(estimateData.userId || ''));

			const estimateDate = estimateData.estimateDate
				? new Date(estimateData.estimateDate).toISOString()
				: new Date().toISOString();
			const estimateEndTime = estimateData.estimateEndTime
				? new Date(estimateData.estimateEndTime).toISOString()
				: new Date().toISOString();

			setValue('estimateDate', estimateDate);
			setValue('estimateEndTime', estimateEndTime);

			setValue('currency', estimateData.currency || 'GBP');
			setValue('discount', estimateData.discount || 0);
			setValue('taxRate', estimateData.taxRate || 0);
			setValue('amountBeforeTax', estimateData.amountBeforeTax || 0);
			setValue('amountAfterTax', estimateData.amountAfterTax || 0);
			setValue('taxValue', estimateData.taxValue || false);
			setValue('isAccepted', estimateData.isAccepted || false);
			setIsEnabled(estimateData.taxValue || false);

			if (notes) {
				const notesArray = Array.isArray(notes) ? notes : [notes];
				setNote(notesArray.map((n) => n.noteText || '').join('\n'));
				notesArray.forEach((item) => setNoteItemId(item.id));
			}
		}
	}, [isUpdateMode, estimateData, setValue]);

	useEffect(() => {
		return () => {
			setIsPreviewVisible(false);
			setHtmlPreview('');
			setIsSaving(false);
		};
	}, []);

	const handleToggleTerm = (id: string) => {
		setSelectedTermIds((prev) =>
			prev.includes(id) ? prev.filter((tid) => tid !== id) : [...prev, id]
		);
	};

	const handleSave = async (
		data: EstimateType & {
			notes: EstimateNotesType[];
		}
	): Promise<void> => {
		if (isSaving) return;

		setIsSaving(true);
		try {
			const formData = {
				...data,
				amountAfterTax: calculatedAmountAfterTax,
			};
			await handleSaveEstimate(formData, isUpdateMode, note, noteItemId);

			// Save terms for both create and update
			const estimateIdToUse = isUpdateMode
				? String(formData.id)
				: nextEstimateId;
			if (estimateIdToUse) {
				const termsToSave =
					estimateTerms.length > 0
						? estimateTerms
						: globalTerms
								.filter((t) => selectedTermIds.includes(t.id))
								.map((t) => t.termText);
				await saveEstimateTerms(estimateIdToUse, termsToSave);
			}

			reset();
			setNote('');
			setNoteItemId('');
			setSelectedCustomer(null);
			setSelectedUser(null);
			setBankDetails(null);
			setIsPreviewVisible(false);
			setHtmlPreview('');
			setIsSaving(false);

			router.back();
		} catch (error) {
			console.error('Error saving estimate:', error);
			if (error instanceof Error) {
				Alert.alert('Error', error.message);
			} else {
				Alert.alert('Error', 'Failed to save estimate. Please try again.');
			}
		} finally {
			setIsSaving(false);
		}
	};

	const handleSend = async (
		data: EstimateType & {
			notes: EstimateNotesType[];
		}
	): Promise<void> => {
		if (!selectedUser || !selectedCustomer || !bankDetails) {
			console.error('Missing required information.');
			return;
		}
		try {
			const formData = {
				...data,
				amountAfterTax: calculatedAmountAfterTax,
			};
			await handleSendEstimate(
				formData,
				selectedUser,
				selectedCustomer,
				bankDetails,
				note
			);
		} catch (error) {
			console.error('Error sending estimate:', error);
		}
	};

	const handleExportPdf = async (
		data: EstimateType & {
			notes: EstimateNotesType[];
		}
	): Promise<void> => {
		if (!selectedUser || !selectedCustomer || !bankDetails) {
			console.error('Missing required information.');
			return;
		}
		const formData = {
			...data,
			amountAfterTax: calculatedAmountAfterTax,
		} as EstimateType;
		const terms = await getEstimateTerms(formData.id);
		await handleExportPdfEstimate(
			{
				...(formData as any),
				user: selectedUser,
				customer: selectedCustomer,
				bankDetails: bankDetails,
				notesText: note,
				terms: terms.map((t) => t.termText),
			},
			selectedUser,
			selectedCustomer,
			bankDetails,
			note,
			false
		);
	};

	const handlePreview = async (
		data: EstimateType & {
			notes: EstimateNotesType[];
		}
	): Promise<void> => {
		if (!selectedUser || !selectedCustomer || !bankDetails) {
			console.error('Missing required information.');
			return;
		}
		const formData = {
			...data,
			amountAfterTax: calculatedAmountAfterTax,
		} as EstimateType;
		let terms: string[] = [];
		if (!isUpdateMode && estimateTerms.length > 0) {
			terms = estimateTerms;
		} else {
			const dbTerms = await getEstimateTerms(formData.id);
			terms = dbTerms.map((t) => t.termText);
		}
		const html = generateEstimateHtml({
			data: {
				...(formData as any),
				user: selectedUser,
				customer: selectedCustomer,
				bankDetails: bankDetails,
				notesText: note,
				terms,
			},
			subtotal: formData.amountBeforeTax,
			tax: formData.taxRate,
			total: formData.amountAfterTax,
			isPreview: true,
		});
		setHtmlPreview(html);
		setIsPreviewVisible(true);
	};

	const handleOpenTermsModal = () => setIsTermsModalVisible(true);
	const handleCloseTermsModal = async () => {
		setIsTermsModalVisible(false);
		// Refresh global terms after modal closes
		const terms = await getEstimateTerms('global');
		setGlobalTerms(terms);
		// Also refresh estimate-specific terms
		if (nextEstimateId) {
			const estimateSpecificTerms = await getEstimateTerms(nextEstimateId);
			setEstimateTerms(estimateSpecificTerms.map((t) => t.termText));
		}
	};

	const estimateIdRef = useRef<TextInput>(null);
	const taxRateRef = useRef<TextInput>(null);

	return (
		<ScrollView className='flex-1 p-4 bg-light-primary dark:bg-dark-primary'>
			<SafeAreaView className=' pb-10'>
				{!isUpdateMode && (
					<Text className='text-light-text dark:text-dark-text '>{`Next estimate number : ${nextEstimateId ? nextEstimateId : 1}`}</Text>
				)}
				{isUpdateMode && (
					<Text className='text-light-text dark:text-dark-text text-sm mb-2'>
						Update Mode - ID: {watch('id')} | Date: {watch('estimateDate')}
					</Text>
				)}
				<Text className='text-lg text-light-text dark:text-dark-text font-bold mb-4'>
					Estimate Information
				</Text>
				<EstimateHeaderSection
					control={control}
					errors={errors}
					isUpdateMode={isUpdateMode}
					users={users}
					customers={customers}
					setValue={setValue}
					calculatedAmountAfterTax={calculatedAmountAfterTax}
					taxValue={isEnabled}
					toggleTaxValueSwitch={toggleSwitch}
				/>
				<EstimateNotesSection note={note} setNote={setNote} />
				<EstimateTermsSection
					estimateId={
						isUpdateMode && estimateData
							? String(estimateData.id)
							: nextEstimateId || ''
					}
				/>
				<EstimateActionButtons
					isUpdateMode={isUpdateMode}
					onSave={handleSubmit(handleSave)}
					onSend={handleSubmit(handleSend)}
					onExportPdf={handleSubmit(handleExportPdf)}
					onPreview={handleSubmit(handlePreview)}
					isSaving={isSaving}
				/>
				<Modal
					visible={isPreviewVisible}
					animationType='slide'
					onRequestClose={() => setIsPreviewVisible(false)}>
					<SafeAreaView className='flex-1 bg-light-primary dark:bg-dark-primary min-h-8'>
						<TouchableOpacity
							onPress={() => setIsPreviewVisible(false)}
							className='flex flex-row  items-center gap-1 p-1'>
							<Ionicons name='arrow-back' size={24} color={colors.text} />
							<Text className='text-xs text-light-text dark:text-dark-text'>
								Create Estimate
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

export default EstimateForm;
