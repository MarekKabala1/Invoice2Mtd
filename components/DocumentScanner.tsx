import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Alert, Modal } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCameraScanner } from '@/hooks/useCameraScanner';
import { useTheme } from '@/context/ThemeContext';
import BaseCard from './BaseCard';
import AddTransactionAfterScan from './AddTransactionAfterScann';

interface DocumentScannerProps {
	onScanComplete?: (data: { pages: string[]; pdf?: string | null }) => void;
}

const DocumentScanner: React.FC<DocumentScannerProps> = ({ onScanComplete }) => {
	const { colors, isDark } = useTheme();
	const { scannedData, handleScan, isLoading } = useCameraScanner();
	const [scannedDataConfirmationVisibleInUi, setScannedDataConfirmationVisibleInUi] = useState(false);
	const [isAddToBudgetModalVisible, setIsAddToBudgetModalVisible] = useState(false);

	const handleScanPress = async () => {
		await handleScan();
		if (scannedData && onScanComplete) {
			onScanComplete(scannedData);
		}
	};

	useEffect(() => {
		if (scannedData) {
			setScannedDataConfirmationVisibleInUi(true);
			handleAddToBudget();
			setTimeout(() => {
				setScannedDataConfirmationVisibleInUi(false);
			}, 1000);
		}
	}, [scannedData]);

	const handleAddToBudget = () => {
		Alert.alert('Add to Budget', 'Add the scanned data to the budget?', [
			{ text: 'Cancel', style: 'cancel' },
			{ text: 'Add', style: 'destructive', onPress: () => setIsAddToBudgetModalVisible(true) },
		]);
	};

	return (
		<>
			<View className='flex gap-3'>
				<BaseCard className='p-4'>
					{scannedDataConfirmationVisibleInUi ? (
						<Text className='text-success text-center text-lg font-bold'>✓ Scan Completed</Text>
					) : (
						<TouchableOpacity onPress={handleScanPress} disabled={isLoading}>
							<View className='flex-row items-center justify-center'>
								<MaterialCommunityIcons name={isLoading ? 'loading' : 'camera-outline'} size={24} color={colors.text} className='mr-2' />
								<Text className='text-light-text dark:text-dark-text text-lg font-semibold'>{isLoading ? 'Scanning...' : 'Scan Document'}</Text>
							</View>
						</TouchableOpacity>
					)}
				</BaseCard>
				<Text className='text-xs text-center text-light-text dark:text-dark-text opacity-50'>
					*To change the save location for scanned bills, go to Settings.
				</Text>
			</View>
			<Modal visible={isAddToBudgetModalVisible} transparent={true} animationType='slide'>
				<AddTransactionAfterScan isAddToBudgetModalVisible={isAddToBudgetModalVisible} closeModal={() => setIsAddToBudgetModalVisible(false)} />
			</Modal>
		</>
	);
};

export default DocumentScanner;
