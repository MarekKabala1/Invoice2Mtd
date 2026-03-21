import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import TermsAndConditions from '@/components/TermsAndConditions';
import BaseCard from '../BaseCard';

interface EstimateTermsSectionProps {
	estimateId: string;
}

export const EstimateTermsSection: React.FC<EstimateTermsSectionProps> = ({
	estimateId,
}) => {
	const [isModalVisible, setIsModalVisible] = useState(false);
	const { colors } = useTheme();

	const handleOpenModal = () => {
		setIsModalVisible(true);
	};

	const handleCloseModal = () => {
		setIsModalVisible(false);
	};

	return (
		<>
			<View className='mb-6'>
				<TouchableOpacity
					onPress={handleOpenModal}
					className='flex-row items-center justify-between p-4 bg-light-primary dark:bg-dark-primary border border-light-text dark:border-dark-text rounded-lg'>
					<View className='flex-row items-center'>
						<Ionicons
							name='document-text-outline'
							size={24}
							color={colors.text}
							className='mr-3'
						/>
						<Text className='text-lg font-semibold text-light-text dark:text-dark-text'>
							Terms & Conditions
						</Text>
					</View>
				</TouchableOpacity>
			</View>

			<Modal
				visible={isModalVisible}
				animationType='slide'
				onRequestClose={handleCloseModal}>
				<TermsAndConditions
					isGlobal={false}
					estimateId={estimateId}
					onClose={handleCloseModal}
				/>
			</Modal>
		</>
	);
};
