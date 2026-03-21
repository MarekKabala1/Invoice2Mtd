import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { db } from '@/db/config';
import { Estimate, Customer, User, EstimateNotes } from '@/db/schema';
import { eq } from 'drizzle-orm';
import {
	EstimateType,
	CustomerType,
	UserType,
	EstimateNotesType,
} from '@/db/zodSchema';
import BaseCard from '../BaseCard';
import EstimateSettingsModal from './EstimateSettingsModal';
import { getUserAndBankDetails } from '@/utils/estimateOperations';

interface EstimateWithDetails {
	id: string;
	customerId: string;
	userId: string;
	estimateDate: string;
	estimateEndTime: string;
	currency: string;
	discount: number;
	taxRate: number;
	amountBeforeTax: number;
	amountAfterTax: number;
	taxValue: boolean;
	isAccepted: boolean;
	customer: CustomerType;
	user: UserType;
	notes: EstimateNotesType[];
}

const EstimateList: React.FC = () => {
	const [estimates, setEstimates] = useState<EstimateWithDetails[]>([]);
	const [showSettings, setShowSettings] = useState(false);
	const [selectedEstimate, setSelectedEstimate] =
		useState<EstimateWithDetails | null>(null);
	const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
	const [selectedBankDetails, setSelectedBankDetails] = useState<any>(null);
	const { colors } = useTheme();

	useFocusEffect(
		React.useCallback(() => {
			fetchEstimates();
		}, [])
	);

	const fetchEstimates = async () => {
		try {
			const estimatesData = await db.select().from(Estimate);
			const estimatesWithDetails = await Promise.all(
				estimatesData.map(async (estimate) => {
					const customer = await db
						.select()
						.from(Customer)
						.where(eq(Customer.id, estimate.customerId || ''))
						.limit(1);
					const user = await db
						.select()
						.from(User)
						.where(eq(User.id, estimate.userId || ''))
						.limit(1);
					const notes = await db
						.select()
						.from(EstimateNotes)
						.where(eq(EstimateNotes.estimateId, estimate.id));

					return {
						id: estimate.id,
						customerId: estimate.customerId || '',
						userId: estimate.userId || '',
						estimateDate: estimate.estimateDate || '',
						estimateEndTime: estimate.estimateEndTime || '',
						currency: estimate.currency || 'GBP',
						discount: estimate.discount || 0,
						taxRate: estimate.taxRate || 0,
						amountBeforeTax: estimate.amountBeforeTax || 0,
						amountAfterTax: estimate.amountAfterTax || 0,
						taxValue: estimate.taxValue || false,
						isAccepted: estimate.isAccepted || false,
						customer: customer[0] as CustomerType,
						user: user[0] as UserType,
						notes: notes.map((note) => ({
							id: note.id,
							estimateId: note.estimateId || '',
							noteDate: note.noteDate || '',
							noteText: note.noteText || '',
							createdAt: note.createdAt || '',
						})),
					};
				})
			);

			setEstimates(estimatesWithDetails);
		} catch (error) {
			console.error('Error fetching estimates:', error);
		}
	};

	const handleSettingsPress = async (estimate: EstimateWithDetails) => {
		setSelectedEstimate(estimate);

		try {
			const { userDetails, bankDetails } = await getUserAndBankDetails(
				estimate.userId
			);
			setSelectedUser(userDetails);
			setSelectedBankDetails(bankDetails);
		} catch (error) {
			console.error('Error fetching user and bank details:', error);
		}

		setShowSettings(true);
	};

	const handleUpdateEstimate = async (
		id: string,
		updateData?: Partial<EstimateType>
	) => {
		if (updateData) {
			await db.update(Estimate).set(updateData).where(eq(Estimate.id, id));
		} else {
			const estimate = estimates.find((e) => e.id === id);
			if (estimate) {
				setShowSettings(false);
				router.push({
					pathname: '/(stack)/createEstimate',
					params: {
						mode: 'update',
						estimateId: estimate.id,
						estimate: JSON.stringify({
							id: estimate.id,
							customerId: estimate.customerId,
							userId: estimate.userId,
							estimateDate: estimate.estimateDate,
							estimateEndTime: estimate.estimateEndTime,
							currency: estimate.currency,
							discount: estimate.discount,
							taxRate: estimate.taxRate,
							amountBeforeTax: estimate.amountBeforeTax,
							amountAfterTax: estimate.amountAfterTax,
							taxValue: estimate.taxValue,
							isAccepted: estimate.isAccepted,
						}),
						notes: JSON.stringify(estimate.notes),
					},
				});
			}
		}
	};

	const handleDeleteEstimate = async (estimateId: string) => {
		Alert.alert(
			'Delete Estimate',
			'Are you sure you want to delete this estimate? This action cannot be undone.',
			[
				{ text: 'Cancel', style: 'cancel' },
				{
					text: 'Delete',
					style: 'destructive',
					onPress: async () => {
						try {
							await db.transaction(async (tx) => {
								await Promise.all([
									tx
										.delete(EstimateNotes)
										.where(eq(EstimateNotes.estimateId, estimateId)),
									tx.delete(Estimate).where(eq(Estimate.id, estimateId)),
								]);
							});
							await fetchEstimates();
						} catch (error) {
							console.error('Error deleting estimate:', error);
							Alert.alert(
								'Error',
								'Failed to delete estimate. Please try again.'
							);
						}
					},
				},
			]
		);
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString();
	};

	const getStatusColor = (estimate: EstimateWithDetails) => {
		const today = new Date();
		const expiryDate = new Date(estimate.estimateEndTime);
		const diffTime = expiryDate.getTime() - today.getTime();
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

		if (estimate.isAccepted) return colors.success;
		if (diffDays < 0) return colors.danger;
		if (diffDays <= 7) return colors.textOpacity;
		return colors.text;
	};

	const getStatusText = (estimate: EstimateWithDetails) => {
		const today = new Date();
		const expiryDate = new Date(estimate.estimateEndTime);
		const diffTime = expiryDate.getTime() - today.getTime();
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

		if (estimate.isAccepted) return 'Accepted';
		if (diffDays < 0) return 'Expired';
		if (diffDays <= 7) return 'Expiring Soon';
		return 'Pending';
	};

	return (
		<ScrollView className='flex-1 bg-light-primary dark:bg-dark-primary w-full'>
			<View className='p-4'>
				{estimates.length === 0 ? (
					<View className='flex-1 justify-center items-center py-8'>
						<Text className='text-light-text dark:text-dark-text text-lg mb-2'>
							No estimates found
						</Text>
						<Text className='text-light-text dark:text-dark-text opacity-70'>
							Create your estimate
						</Text>
					</View>
				) : (
					<View className='space-y-3 gap-2'>
						{estimates.map((estimate) => (
							<BaseCard key={estimate.id}>
								<TouchableOpacity
									onLongPress={() => handleDeleteEstimate(estimate.id)}
									className='flex-row justify-between items-start'>
									<View className='flex-1'>
										<View className='flex-row justify-between items-start mb-2'>
											<Text className='text-lg font-semibold text-light-text dark:text-dark-text'>
												Estimate #{estimate.id}
											</Text>
											<Text className='text-sm text-light-text dark:text-dark-text opacity-70'>
												{formatDate(estimate.estimateDate)}
											</Text>
										</View>
										<Text className='text-light-text dark:text-dark-text mb-1'>
											Customer: {estimate.customer?.name || 'Unknown'}
										</Text>
										<Text className='text-light-text dark:text-dark-text mb-2'>
											Amount: {estimate.currency}{' '}
											{estimate.amountAfterTax?.toFixed(2) || '0.00'}
										</Text>
										<View className='flex-row justify-between items-center'>
											<Text className='text-xs text-light-text dark:text-dark-text opacity-70'>
												Valid until: {formatDate(estimate.estimateEndTime)}
											</Text>
											<Text
												className='text-xs font-bold'
												style={{ color: getStatusColor(estimate) }}>
												{getStatusText(estimate)}
											</Text>
										</View>
									</View>
									<TouchableOpacity
										onPress={() => handleSettingsPress(estimate)}
										className='p-2'>
										<Ionicons
											name='ellipsis-vertical'
											size={20}
											color={colors.text}
										/>
									</TouchableOpacity>
								</TouchableOpacity>
							</BaseCard>
						))}
					</View>
				)}
			</View>
			{selectedEstimate && selectedUser && (
				<EstimateSettingsModal
					showSettings={showSettings}
					setShowSettings={setShowSettings}
					estimate={selectedEstimate}
					customer={selectedEstimate.customer}
					onUpdate={handleUpdateEstimate}
					setIsAcceptedOptimistic={() => {}}
					user={selectedUser}
					notes={selectedEstimate.notes.map((n) => n.noteText).join('\n')}
					bankDetails={selectedBankDetails}
				/>
			)}
		</ScrollView>
	);
};

export default EstimateList;
