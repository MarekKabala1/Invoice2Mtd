import React from 'react';
import { View, Text, Modal, TouchableOpacity, Alert } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CustomerType, EstimateType, UserType } from '@/db/zodSchema';
import { getCurrencySymbol } from '@/utils/getCurrencySymbol';
import { useEffect, useState } from 'react';
import { handleSendEstimate } from '@/utils/estimateOperations';

export default function EstimateSettingsModal({
	showSettings,
	setShowSettings,
	estimate,
	customer,
	onUpdate,
	setIsAcceptedOptimistic,
	user,
	notes,
	bankDetails,
}: {
	showSettings: boolean;
	setShowSettings: (show: boolean) => void;
	estimate: EstimateType;
	customer: CustomerType | undefined;
	user: UserType;
	onUpdate: (id: string, updateData?: Partial<EstimateType>) => void;
	setIsAcceptedOptimistic: (isAccepted: boolean) => void;
	notes: string;
	bankDetails: any;
}) {
	const [localEstimate, setLocalEstimate] = useState(estimate);
	const { colors } = useTheme();
	const isAccepted = localEstimate.isAccepted;

	useEffect(() => {
		setLocalEstimate(estimate);
	}, [estimate.id]);

	const handleMarkAsAccepted = async () => {
		const newAcceptedStatus = !isAccepted;
		setIsAcceptedOptimistic(newAcceptedStatus);

		setLocalEstimate((prev) => ({ ...prev, isAccepted: newAcceptedStatus }));
		setIsAcceptedOptimistic(newAcceptedStatus);
		try {
			onUpdate(estimate.id, { isAccepted: newAcceptedStatus });
		} catch (error) {
			setLocalEstimate((prev) => ({
				...prev,
				isAccepted: !newAcceptedStatus,
			}));
			setIsAcceptedOptimistic(!newAcceptedStatus);
		}
	};

	const howManyDaysUntilExpiry = () => {
		const today = new Date();
		const expiryDate = new Date(localEstimate.estimateEndTime);
		const diffTime = expiryDate.getTime() - today.getTime();
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
		return diffDays;
	};

	const handleEditEstimate = () => {
		onUpdate(estimate.id);
	};

	const handleShareEstimate = async () => {
		if (!customer || !bankDetails) {
			Alert.alert('Error', 'Missing customer or bank details.');
			return;
		}

		try {
			await handleSendEstimate(
				{ ...estimate, notes: [] },
				user,
				customer,
				bankDetails,
				notes
			);
		} catch (error: any) {
			Alert.alert('Error', error.message || 'Failed to share estimate.');
		}
	};

	const getStatusColor = () => {
		const daysUntilExpiry = howManyDaysUntilExpiry();
		if (isAccepted) return colors.success;
		if (daysUntilExpiry < 0) return colors.danger;
		if (daysUntilExpiry <= 7) return colors.text;
		return colors.text;
	};

	const getStatusText = () => {
		const daysUntilExpiry = howManyDaysUntilExpiry();
		if (isAccepted) return 'Accepted';
		if (daysUntilExpiry < 0) return 'Expired';
		if (daysUntilExpiry <= 7) return 'Expiring Soon';
		return 'Pending';
	};

	return (
		<Modal
			visible={showSettings}
			animationType='slide'
			transparent={true}
			onRequestClose={() => setShowSettings(false)}>
			<View className='flex-1 justify-end bg-light-text/30 dark:bg-dark-text/30'>
				<View className='bg-light-primary dark:bg-dark-primary w-full h-fit rounded-t-lg p-6 gap-4'>
					<View className='flex-row w-full items-center justify-between'>
						<View>
							<Text className='text-lg font-bold text-light-text dark:text-dark-text'>
								Estimate # {localEstimate.id} to {customer?.name}
							</Text>
							<Text className='text-sm' style={{ color: getStatusColor() }}>
								{getStatusText()}
							</Text>
						</View>
						<TouchableOpacity
							onPress={() => setShowSettings(false)}
							className='mb-4'>
							<MaterialCommunityIcons
								name='close'
								size={20}
								color={colors.text}
							/>
						</TouchableOpacity>
					</View>
					<View className='w-full gap-2 items-center justify-center'>
						<View className='flex-row w-full items-center justify-between border-b border-light-text/20 dark:border-dark-text/20 pb-2'>
							<View className='flex-row items-center gap-2'>
								<MaterialCommunityIcons
									name='cash-multiple'
									size={40}
									color={colors.text}
								/>
								<Text className='text-sm text-light-text dark:text-dark-text'>
									Estimate Amount
								</Text>
							</View>
							<Text className='text-sm text-light-text dark:text-dark-text'>
								{getCurrencySymbol(localEstimate.currency)}
								{localEstimate.amountAfterTax.toFixed(2)}
							</Text>
						</View>
						<View className='flex-row w-full items-center justify-between border-b border-light-text/20 dark:border-dark-text/20 pb-2'>
							<View className='flex-row items-center gap-2'>
								<MaterialCommunityIcons
									name='calendar-range'
									size={40}
									color={colors.text}
								/>
								<Text className='text-sm text-light-text dark:text-dark-text'>
									Estimate Date
								</Text>
							</View>
							<Text className='text-sm text-light-text dark:text-dark-text'>
								{new Date(localEstimate.estimateDate).toLocaleDateString()}
							</Text>
						</View>
						<View className='flex-row w-full items-center justify-between border-b border-light-text/20 dark:border-dark-text/20 pb-2'>
							<View className='flex-row items-center gap-2'>
								<MaterialCommunityIcons
									name='calendar-clock'
									size={40}
									color={colors.text}
								/>
								<Text className='text-sm text-light-text dark:text-dark-text'>
									Valid Until
								</Text>
							</View>
							<Text className='text-sm text-light-text dark:text-dark-text'>
								{new Date(localEstimate.estimateEndTime).toLocaleDateString()}
							</Text>
						</View>
						<View className='flex-row w-full items-center justify-between border-b border-light-text/20 dark:border-dark-text/20 pb-2'>
							<View className='flex-row items-center gap-2'>
								<MaterialCommunityIcons
									name='file-document'
									size={40}
									color={colors.text}
								/>
								<Text className='text-sm text-light-text dark:text-dark-text'>
									Estimate Status
								</Text>
							</View>
							<Text
								className='text-sm font-bold'
								style={{ color: getStatusColor() }}>
								{getStatusText()}
							</Text>
						</View>
						<View className='flex-row w-full items-center justify-between border-b border-light-text/20 dark:border-dark-text/20 pb-2'>
							<View className='flex-row items-center gap-2'>
								<MaterialCommunityIcons
									name='check-circle-outline'
									size={40}
									color={colors.text}
								/>
								<Text className='text-sm text-light-text dark:text-dark-text'>
									Mark as accepted
								</Text>
							</View>
							<TouchableOpacity
								onPress={handleMarkAsAccepted}
								className='flex-row items-center justify-center'>
								{isAccepted ? (
									<MaterialCommunityIcons
										name='checkbox-marked-outline'
										size={28}
										color={colors.success}
									/>
								) : (
									<MaterialCommunityIcons
										name='checkbox-blank-outline'
										size={28}
										color={colors.text}
									/>
								)}
							</TouchableOpacity>
						</View>
						<TouchableOpacity
							onPress={handleEditEstimate}
							className='flex-row w-full items-center justify-between border-b border-light-text/20 dark:border-dark-text/20 pb-2'>
							<View className='flex-row items-center gap-2'>
								<MaterialCommunityIcons
									name='pencil'
									size={40}
									color={colors.text}
								/>
								<Text className='text-sm text-light-text dark:text-dark-text'>
									Edit Estimate
								</Text>
							</View>
							<MaterialCommunityIcons
								name='chevron-right'
								size={30}
								color={colors.text}
							/>
						</TouchableOpacity>
						<TouchableOpacity
							onPress={handleShareEstimate}
							className='flex-row w-full items-center justify-between border-b border-light-text/20 dark:border-dark-text/20 pb-2'>
							<View className='flex-row items-center gap-2'>
								<MaterialCommunityIcons
									name='share-variant'
									size={40}
									color={colors.text}
								/>
								<Text className='text-sm text-light-text dark:text-dark-text'>
									Share Estimate
								</Text>
							</View>
							<MaterialCommunityIcons
								name='chevron-right'
								size={30}
								color={colors.text}
							/>
						</TouchableOpacity>
					</View>
					{!isAccepted && (
						<View className='bg-light-card dark:bg-dark-nav p-3 rounded'>
							<Text className='text-sm text-light-text dark:text-dark-text text-center'>
								{howManyDaysUntilExpiry() > 0
									? `${howManyDaysUntilExpiry()} days until expiry`
									: `Expired ${Math.abs(howManyDaysUntilExpiry())} days ago`}
							</Text>
						</View>
					)}
				</View>
			</View>
		</Modal>
	);
}
