import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { View, Text, SectionList, TouchableOpacity, Alert, TextInput } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import InvoiceCard from './InvoiceCard';
import { Invoice, Payment, Note, WorkInformation, Customer } from '@/db/schema';
import { db } from '@/db/config';
import { InvoiceType, WorkInformationType, PaymentType, NoteType, CustomerType } from '@/db/zodSchema';
import { InvoiceForUpdate } from '@/types';
import { eq } from 'drizzle-orm';
import { useTheme } from '@/context/ThemeContext';
import ThemeToggle from '../ThemeToggle';
import { groupInvoicesByFinancialYearAndQuarter } from '@/utils/invoiceFinancialGrouping';
import { useAppSettings } from '@/context/AppSettingsContext';
import { useAddInvoiceToBudget } from '@/hooks/useAddInvoiceToBudget';
import AddToBudgetModal from '../AddToBudgetModal';
import InvoiceEstimateSwitcher from '@/components/InvoiceEstimateSwitcher';
import { EstimateList } from '../EstimateForm';

export default function InvoiceList() {
	const [data, setData] = useState<{
		invoices: InvoiceType[];
		payments: PaymentType[];
		notes: NoteType[];
		workItems: WorkInformationType[];
		customers: CustomerType[];
	}>({
		invoices: [],
		payments: [],
		notes: [],
		workItems: [],
		customers: [],
	});
	const [error, setError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [filterCustomer, setFilterCustomer] = useState<string>('');
	const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
	const [addInvoiceToBudget, setAddInvoiceToBudget] = useState(false);
	const [activeTab, setActiveTab] = useState<'invoices' | 'estimates'>('invoices');
	const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

	const { isCategoryModalVisible, selectedCategory, showCategoryModal, hideCategoryModal, setSelectedCategory, handleAddInvoicesToBudget, incomeCategories } =
		useAddInvoiceToBudget();

	const router = useRouter();
	const { colors } = useTheme();

	const toggleSection = useCallback((sectionKey: string) => {
		setCollapsedSections((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(sectionKey)) {
				newSet.delete(sectionKey);
			} else {
				newSet.add(sectionKey);
			}
			return newSet;
		});
	}, []);

	const loadData = useCallback(async () => {
		setIsLoading(true);
		try {
			const [invoicesData, paymentsData, notesData, workItemsData, customersData] = await Promise.all([
				db.select().from(Invoice),
				db.select().from(Payment),
				db.select().from(Note),
				db.select().from(WorkInformation),
				db.select().from(Customer),
			]);

			setData({
				invoices: invoicesData.map((invoice) => ({
					...invoice,
					userId: invoice?.userId!,
					customerId: invoice.customerId!,
					invoiceDate: invoice.invoiceDate!,
					dueDate: invoice.dueDate!,
					amountAfterTax: invoice.amountAfterTax!,
					amountBeforeTax: invoice.amountBeforeTax!,
					taxRate: invoice.taxRate!,
					pdfPath: invoice.pdfPath!,
					createdAt: invoice.createdAt!,
					currency: 'GBP',
					taxValue: invoice.taxValue!,
					isPayed: invoice.isPayed!,
					discount: invoice.discount!,
				})),
				payments: paymentsData.map((payment) => ({
					...payment,
					invoiceId: payment.invoiceId ?? '',
					paymentDate: payment.paymentDate ?? '',
					amountPaid: payment.amountPaid ?? 0,
					createdAt: payment.createdAt ?? '',
				})),
				notes: notesData.map((note) => ({
					...note,
					invoiceId: note.invoiceId!,
					noteDate: note.noteDate!,
					noteText: note.noteText ?? 'No text',
					createdAt: note.createdAt!,
				})),
				workItems: workItemsData.map((workItem) => ({
					...workItem,
					invoiceId: workItem.invoiceId ?? '',
					descriptionOfWork: workItem.descriptionOfWork ?? 'No description',
					unitPrice: workItem.unitPrice ?? 0,
					date: workItem.date ?? '',
					totalToPayMinusTax: workItem.totalToPayMinusTax ?? 0,
					createdAt: workItem.createdAt ?? '',
				})),
				customers: customersData.map((customer) => ({
					...customer,
					emailAddress: customer.emailAddress ?? '',
					name: customer.name ?? '',
					id: customer.id,
					address: customer.address ?? undefined,
					phoneNumber: customer.phoneNumber ?? undefined,
					createdAt: customer.createdAt ?? '',
				})),
			});
		} catch (error) {
			console.error('Error loading data:', error);
			setError('Failed to load data');
		} finally {
			setIsLoading(false);
		}
	}, []);

	useFocusEffect(
		useCallback(() => {
			loadData();
		}, [loadData])
	);

	const memoizedInvoices = useMemo(() => {
		return data.invoices
			.map((invoice) => {
				const invoicePayments = data.payments.filter((p) => p.invoiceId === invoice.id);
				const invoiceNotes = data.notes.filter((n) => n.invoiceId === invoice.id);
				const invoiceWorkItems = data.workItems.filter((w) => w.invoiceId === invoice.id);
				const customer = data.customers.find((c) => c.id === invoice.customerId) || {
					name: 'Unknown',
					emailAddress: 'unknown@example.com',
					id: invoice.customerId,
				};

				return {
					...invoice,
					payments: invoicePayments,
					notes: invoiceNotes,
					workItems: invoiceWorkItems,
					customer,
				} as InvoiceForUpdate;
			})
			.filter((invoice) => filterCustomer === '' || invoice.customer.name.toLowerCase().includes(filterCustomer.toLowerCase()));
	}, [data, filterCustomer]);

	const { settings } = useAppSettings();

	const unpaidInvoicesCount = useMemo(() => {
		return memoizedInvoices.filter((invoice) => !invoice.isPayed).length;
	}, [memoizedInvoices]);

	const unpaidInvoicesTotal = useMemo(() => {
		return memoizedInvoices.filter((invoice) => !invoice.isPayed).reduce((sum, invoice) => sum + invoice.amountAfterTax, 0);
	}, [memoizedInvoices]);

	const sectionedInvoices = useMemo(() => {
		if (!settings) return [];
		const grouped = groupInvoicesByFinancialYearAndQuarter(memoizedInvoices, settings);

		const sections: Array<{
			title: string;
			subtitle: string;
			data: InvoiceForUpdate[];
			key: string;
			hasUnpaid: boolean;
			unpaidCount: number;
		}> = [];

		grouped.forEach((yearGroup) => {
			yearGroup.quarters.forEach((quarter) => {
				const sectionKey = `${yearGroup.yearLabel}-${quarter.quarterLabel}`;
				const unpaidInvoices = quarter.invoices.filter((invoice) => !invoice.isPayed);
				const hasUnpaid = unpaidInvoices.length > 0;
				sections.push({
					title: yearGroup.yearLabel,
					subtitle: quarter.quarterLabel,
					data: quarter.invoices,
					key: sectionKey,
					hasUnpaid,
					unpaidCount: unpaidInvoices.length,
				});
			});
		});

		return sections;
	}, [memoizedInvoices, settings]);

	useEffect(() => {
		if (sectionedInvoices.length > 0) {
			const allSectionKeys = new Set(sectionedInvoices.map((section) => section.key));
			setCollapsedSections(allSectionKeys);
		}
	}, [sectionedInvoices]);

	const handleAddToBudget = useCallback(async () => {
		const selectedInvoiceDetails = memoizedInvoices.filter((invoice) => selectedInvoices.includes(invoice.id));
		await handleAddInvoicesToBudget(selectedInvoiceDetails);
		setSelectedInvoices([]);
		await loadData();
	}, [memoizedInvoices, selectedInvoices, handleAddInvoicesToBudget, loadData]);

	const handleToggleInvoiceSelection = useCallback((invoiceId: string) => {
		setSelectedInvoices((prev) => (prev.includes(invoiceId) ? prev.filter((id) => id !== invoiceId) : [...prev, invoiceId]));
	}, []);

	const handleDeleteInvoice = useCallback(
		async (invoiceId: string) => {
			try {
				await db.transaction(async (tx) => {
					await Promise.all([
						tx.delete(WorkInformation).where(eq(WorkInformation.invoiceId, invoiceId)),
						tx.delete(Payment).where(eq(Payment.invoiceId, invoiceId)),
						tx.delete(Note).where(eq(Note.invoiceId, invoiceId)),
						tx.delete(Invoice).where(eq(Invoice.id, invoiceId)),
					]);
				});
				await loadData();
			} catch (error) {
				console.error('Error deleting invoice:', error);
				Alert.alert('Error', 'Failed to delete invoice. Please try again.');
			}
		},
		[loadData]
	);

	const handleUpdateInvoice = useCallback(
		async (invoiceId: string, updateData?: Partial<InvoiceType>) => {
			if (updateData) {
				await db.update(Invoice).set(updateData).where(eq(Invoice.id, invoiceId));
				await loadData();
			} else {
				const invoice = memoizedInvoices.find((inv) => inv.id === invoiceId);
				if (!invoice) return;

				await loadData();
				router.push({
					pathname: '/createInvoice',
					params: {
						mode: 'update',
						invoiceId: invoice.id,
						invoice: JSON.stringify(invoice),
						workItems: JSON.stringify(invoice.workItems),
						notes: JSON.stringify(invoice.notes),
						payments: JSON.stringify(invoice.payments),
					},
				});
			}
		},
		[router, loadData, memoizedInvoices]
	);

	const renderSectionHeader = ({ section }: any) => {
		const isCollapsed = collapsedSections.has(section.key);

		return (
			<TouchableOpacity onPress={() => toggleSection(section.key)} className='bg-light-nav dark:bg-dark-nav py-3 px-2 mb-2 rounded-md'>
				<View className='flex-row justify-between items-center'>
					<View className='flex-1'>
						<View className='flex-row items-center'>
							<Text className='text-xl font-bold text-light-accent dark:text-dark-accent'>{section.title}</Text>
							{section.hasUnpaid && (
								<View className='ml-2 bg-danger rounded-full px-2 py-0.5'>
									<Text className='text-white text-xs font-bold'>{section.unpaidCount} Unpaid</Text>
								</View>
							)}
						</View>
						<Text className='text-sm font-semibold text-light-text dark:text-dark-text mt-1'>
							{section.subtitle} ({section.data.length} invoice{section.data.length !== 1 ? 's' : ''})
						</Text>
					</View>
					<Ionicons name={isCollapsed ? 'chevron-down' : 'chevron-up'} size={24} color={colors.text} />
				</View>
			</TouchableOpacity>
		);
	};

	const renderInvoiceItem = ({ item, section }: { item: InvoiceForUpdate; section: any }) => {
		const isCollapsed = collapsedSections.has(section.key);

		if (isCollapsed) {
			return null;
		}

		return (
			<View className='px-4'>
				{addInvoiceToBudget && (
					<TouchableOpacity onPress={() => handleToggleInvoiceSelection(item.id)} className='flex-row items-center p-2 bg-light-nav dark:bg-dark-nav mb-1'>
						<Ionicons
							name={selectedInvoices.includes(item.id) ? 'checkbox' : 'square-outline'}
							size={24}
							color={selectedInvoices.includes(item.id) ? colors.success : colors.text}
						/>
						<Text className='ml-2 text-light-text dark:text-dark-text text-xs'>{selectedInvoices.includes(item.id) ? 'Selected' : 'Select for budget'}</Text>
					</TouchableOpacity>
				)}
				<InvoiceCard
					invoice={item}
					workItems={item.workItems}
					payments={item.payments}
					notes={item.notes}
					customer={item.customer}
					onAdd={false}
					onDelete={handleDeleteInvoice}
					onUpdate={(id: string, updateData?: Partial<InvoiceType>) => handleUpdateInvoice(id, updateData)}
				/>
			</View>
		);
	};

	const ListHeaderComponent = () => (
		<>
			<View className='flex-row justify-between p-4'>
				<ThemeToggle size={24} />
				{activeTab === 'invoices' ? (
					<TouchableOpacity onPress={() => router.push('/createInvoice')} className='flex-row gap-1 items-center'>
						<View>
							<Ionicons name='add-circle-outline' size={24} color={colors.text} />
						</View>
						<Text className='text-light-text dark:text-dark-text text-xs font-bold'>Create Invoice</Text>
					</TouchableOpacity>
				) : (
					<TouchableOpacity onPress={() => router.push('/createEstimate')} className='flex-row gap-1 items-center'>
						<View>
							<Ionicons name='add-circle-outline' size={24} color={colors.text} />
						</View>
						<Text className='text-light-text dark:text-dark-text text-xs font-bold'>Create Estimate</Text>
					</TouchableOpacity>
				)}
			</View>

			<View className='px-4 pb-2'>
				<TextInput
					placeholder='Filter by Customer Name'
					value={filterCustomer}
					onChangeText={setFilterCustomer}
					className='bg-light-nav dark:bg-dark-nav p-2 text-light-text dark:text-dark-text'
					placeholderTextColor='gray'
				/>
			</View>

			<InvoiceEstimateSwitcher activeTab={activeTab} setActiveTab={setActiveTab} />

			{activeTab === 'invoices' && (
				<>
					{unpaidInvoicesCount > 0 && (
						<View className='mx-4 mb-2 p-3 bg-danger/10 border border-danger rounded-md'>
							<View className='flex-row items-center justify-between'>
								<View className='flex-row items-center'>
									<Ionicons name='warning' size={20} color={colors.danger} />
									<Text className='ml-2 font-bold text-danger'>
										{unpaidInvoicesCount} Unpaid Invoice{unpaidInvoicesCount !== 1 ? 's' : ''}
									</Text>
								</View>
								<Text className='font-bold text-danger'>£{unpaidInvoicesTotal.toFixed(2)}</Text>
							</View>
						</View>
					)}

					<View className='flex-row justify-between items-center p-2'>
						<Text className='text-sm font-bold text-light-text dark:text-dark-text'>Invoices</Text>
						<TouchableOpacity onPress={() => setAddInvoiceToBudget(!addInvoiceToBudget)} className='flex-row gap-1 items-center'>
							<View>
								<Ionicons name='add-circle-outline' size={24} color={colors.text} />
							</View>
							<Text className='font-bold text-light-text dark:text-dark-text text-xs'>Add to budget</Text>
						</TouchableOpacity>
					</View>

					{selectedInvoices.length > 0 && (
						<TouchableOpacity onPress={showCategoryModal} className='bg-success p-3 m-4 rounded-md flex-row items-center justify-center'>
							<Ionicons name='add-circle' size={24} color='white' />
							<Text className='text-white font-bold ml-2 text-xs'>Add {selectedInvoices.length} Invoice(s) to Budget</Text>
						</TouchableOpacity>
					)}
				</>
			)}
		</>
	);

	if (error) {
		return (
			<View className='flex-1 justify-center items-center bg-light-primary dark:bg-dark-primary'>
				<Text style={{ color: colors.danger }}>{error}</Text>
			</View>
		);
	}

	if (activeTab === 'estimates') {
		return (
			<View className='flex-1 bg-light-primary dark:bg-dark-primary'>
				<View className='flex-row justify-between p-4'>
					<ThemeToggle size={24} />
					<TouchableOpacity onPress={() => router.push('/createEstimate')} className='flex-row gap-1 items-center'>
						<View>
							<Ionicons name='add-circle-outline' size={24} color={colors.text} />
						</View>
						<Text className='text-light-text dark:text-dark-text text-xs font-bold'>Create Estimate</Text>
					</TouchableOpacity>
				</View>
				<InvoiceEstimateSwitcher activeTab={activeTab} setActiveTab={setActiveTab} />
				<EstimateList />
			</View>
		);
	}

	return (
		<View className='flex-1 px-2 bg-light-primary dark:bg-dark-primary'>
			<AddToBudgetModal
				isVisible={isCategoryModalVisible}
				onClose={hideCategoryModal}
				onConfirm={handleAddToBudget}
				selectedCategory={selectedCategory}
				onSelectCategory={setSelectedCategory}
				incomeCategories={incomeCategories}
			/>

			<SectionList
				sections={sectionedInvoices}
				keyExtractor={(item) => item.id}
				renderItem={renderInvoiceItem}
				renderSectionHeader={renderSectionHeader}
				ListHeaderComponent={ListHeaderComponent}
				ListEmptyComponent={
					<View className='flex-1 justify-center items-center p-8'>
						<Text className='text-light-text dark:text-dark-text'>{isLoading ? 'Loading...' : 'No invoices found'}</Text>
					</View>
				}
				contentContainerStyle={{ paddingHorizontal: 4 }}
				stickySectionHeadersEnabled={false}
			/>
		</View>
	);
}
