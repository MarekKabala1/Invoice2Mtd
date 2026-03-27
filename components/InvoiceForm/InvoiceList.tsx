/**
 * InvoiceList.tsx
 *
 * Main invoice list component. Shows sectioned invoices grouped by financial
 * year and quarter, with filtering, selection, and add-to-budget functionality.
 *
 * Depends on: hooks/useInvoiceListData, hooks/useAddInvoiceToBudget,
 *             components/InvoiceCard, components/AddToBudgetModal, utils/invoiceSync
 * Used by: app/(drawer)/(tabs)/invoices.tsx
 */

import React, { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import { View, Text, SectionList, TouchableOpacity, Alert, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import InvoiceCard from './InvoiceCard';
import { InvoiceType } from '@/db/zodSchema';
import { InvoiceForUpdate } from '@/types';
import { useTheme } from '@/context/ThemeContext';
import { useAppSettings } from '@/context/AppSettingsContext';
import { useAddInvoiceToBudget } from '@/hooks/useAddInvoiceToBudget';
import { useInvoiceListData } from '@/hooks/useInvoiceListData';
import { deleteInvoiceFull, findLinkedRecordsForInvoice } from '@/utils/invoice/invoiceSync';
import AddToBudgetModal from '../AddToBudgetModal';
import InvoiceEstimateSwitcher from '@/components/InvoiceEstimateSwitcher';
import EstimateList from '../EstimateForm/EstimateList';
import { db } from '@/db/config';
import { Invoice } from '@/db/schema';
import { eq } from 'drizzle-orm';

export default function InvoiceList() {
	const { memoizedInvoices, sectionedInvoices, error, setError, isLoading, loadData } = useInvoiceListData();
	const [filterCustomer, setFilterCustomer] = useState<string>('');
	const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
	const [addInvoiceToBudget, setAddInvoiceToBudget] = useState(false);
	const [activeTab, setActiveTab] = useState<'invoices' | 'estimates'>('invoices');
	const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

	const { isCategoryModalVisible, selectedCategory, showCategoryModal, hideCategoryModal, setSelectedCategory, handleAddInvoicesToBudget, incomeCategories } =
		useAddInvoiceToBudget();

	const router = useRouter();
	const { colors, isDark } = useTheme();

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

	const filteredInvoices = useMemo(() => {
		if (filterCustomer === '') return memoizedInvoices;
		return memoizedInvoices.filter((invoice) =>
			invoice.customer.name.toLowerCase().includes(filterCustomer.toLowerCase()),
		);
	}, [memoizedInvoices, filterCustomer]);

	const filteredSections = useMemo(() => {
		if (filterCustomer === '') return sectionedInvoices;
		return sectionedInvoices.map((section) => ({
			...section,
			data: section.data.filter((invoice) =>
				invoice.customer.name.toLowerCase().includes(filterCustomer.toLowerCase()),
			),
		})).filter((section) => section.data.length > 0);
	}, [sectionedInvoices, filterCustomer]);

	const { settings } = useAppSettings();

	const unpaidInvoicesCount = useMemo(() => {
		return filteredInvoices.filter((invoice) => !invoice.isPayed).length;
	}, [filteredInvoices]);

	const unpaidInvoicesTotal = useMemo(() => {
		return filteredInvoices.filter((invoice) => !invoice.isPayed).reduce((sum, invoice) => sum + invoice.amountAfterTax, 0);
	}, [filteredInvoices]);

	const hasInitialized = useRef(false);

	useEffect(() => {
		if (sectionedInvoices.length > 0 && !hasInitialized.current) {
			hasInitialized.current = true;
			const allSectionKeys = new Set(sectionedInvoices.map((section) => section.key));
			setCollapsedSections(allSectionKeys);
		}
	}, [sectionedInvoices]);

	const handleAddToBudget = useCallback(async () => {
		const selectedInvoiceDetails = filteredInvoices.filter((invoice) => selectedInvoices.includes(invoice.id));
		await handleAddInvoicesToBudget(selectedInvoiceDetails);
		setSelectedInvoices([]);
		await loadData();
	}, [filteredInvoices, selectedInvoices, handleAddInvoicesToBudget, loadData]);

	const handleToggleInvoiceSelection = useCallback((invoiceId: string) => {
		setSelectedInvoices((prev) => (prev.includes(invoiceId) ? prev.filter((id) => id !== invoiceId) : [...prev, invoiceId]));
	}, []);

	const handleDeleteInvoice = useCallback(
		async (invoiceId: string) => {
			try {
				const linked = await findLinkedRecordsForInvoice(invoiceId);
				const warnings: string[] = [];
				if (linked.hasLinkedBudget) warnings.push('linked budget entry');
				if (linked.hasLinkedMtd) warnings.push('linked MTD record');
				const warningText = warnings.length > 0 ? `\n\nThis will also delete: ${warnings.join(', ')}.` : '';

				Alert.alert('Delete Invoice', `Are you sure you want to delete this invoice?${warningText}`, [
					{ text: 'Cancel', style: 'cancel' },
					{
						text: 'Delete',
						style: 'destructive',
						onPress: async () => {
							await deleteInvoiceFull(invoiceId);
							await loadData();
						},
					},
				]);
			} catch (err) {
				console.error('Error deleting invoice:', err);
				Alert.alert('Error', 'Failed to delete invoice. Please try again.');
			}
		},
		[loadData],
	);

	const handleUpdateInvoice = useCallback(
		async (invoiceId: string, updateData?: Partial<InvoiceType>) => {
			if (updateData) {
				await db.update(Invoice).set(updateData).where(eq(Invoice.id, invoiceId));
				await loadData();
			} else {
				const invoice = filteredInvoices.find((inv) => inv.id === invoiceId);
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
		[router, loadData, filteredInvoices],
	);

	const renderSectionHeader = ({ section }: any) => {
		const isCollapsed = collapsedSections.has(section.key);

		return (
			<TouchableOpacity
				onPress={() => toggleSection(section.key)}
				className='py-3 px-3 mb-2 rounded-lg'
				style={{
					backgroundColor: isDark ? colors.nav : colors.card,
					shadowColor: '#000',
					shadowOffset: { width: 0, height: 2 },
					shadowOpacity: 0.15,
					shadowRadius: 6,
					elevation: 3,
				}}>
				<View className='flex-row justify-between items-center'>
					<View className='flex-1'>
						<View className='flex-row items-center'>
							<Text className='text-xl font-bold' style={{ color: isDark ? '#93c5fd' : '#486581' }}>
								{section.title}
							</Text>
							{section.hasUnpaid && (
								<View className='ml-2 rounded-full px-2 py-0.5' style={{ backgroundColor: '#ee1c1c' }}>
									<Text className='text-white text-xs font-bold'>{section.unpaidCount} Unpaid</Text>
								</View>
							)}
						</View>
						<Text className='text-sm font-semibold mt-1' style={{ color: colors.text }}>
							{section.subtitle} ({section.data.length} invoice{section.data.length !== 1 ? 's' : ''})
						</Text>
					</View>
					<Ionicons name={isCollapsed ? 'chevron-down' : 'chevron-up'} size={24} color={colors.noActive} />
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
					onSyncComplete={loadData}
				/>
			</View>
		);
	};

	const ListHeaderComponent = () => (
		<>
			<View className='flex-row justify-between p-4'>
				{activeTab === 'invoices' ? (
					<TouchableOpacity onPress={() => router.push('/(stack)/createInvoice')} className='flex-row gap-1 items-center'>
						<View>
							<Ionicons name='add-circle-outline' size={24} color={colors.text} />
						</View>
						<Text className='text-light-text dark:text-dark-text text-xs font-bold'>Create Invoice</Text>
					</TouchableOpacity>
				) : (
					<TouchableOpacity onPress={() => router.push('/(stack)/createEstimate')} className='flex-row gap-1 items-center'>
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
					<TouchableOpacity onPress={() => router.push('/(stack)/createEstimate')} className='flex-row gap-1 items-center'>
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
				sections={filteredSections}
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
