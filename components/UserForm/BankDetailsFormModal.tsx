import React from 'react';
import { Modal, View, Text, TouchableOpacity } from 'react-native';
import BankDetailsForm from '../../app/(stack)/(user)/bankDetailsForm';
import { BankDetailsType } from '@/db/zodSchema';
import { useTheme } from '@/context/ThemeContext';

interface BankDetailsFormModalProps {
	visible: boolean;
	onClose: () => void;
	bankDetails: BankDetailsType | null;
	userId?: string;
	onSuccess: () => void;
}

const BankDetailsFormModal: React.FC<BankDetailsFormModalProps> = ({
	visible,
	onClose,
	bankDetails,
	onSuccess,
}) => {
	const { colors } = useTheme();
	return (
		<Modal
			animationType='slide'
			transparent={true}
			visible={visible}
			onRequestClose={onClose}>
			<View className='flex-1 justify-center items-center bg-light-text/30 dark:bg-dark-text/30'>
				<View className='bg-light-primary dark:bg-dark-primary w-[90%] rounded-lg p-6 max-h-[90%]'>
					<View className='flex-row w-full items-center mb-4'>
						<Text className='text-lg font-bold m-auto text-light-text dark:text-dark-text'>
							{bankDetails ? 'Update Bank Details' : 'Add Bank Details'}
						</Text>
						<TouchableOpacity onPress={onClose}>
							<Text className='text-light-text dark:text-dark-text text-right text-lg'>
								✕
							</Text>
						</TouchableOpacity>
					</View>
					<BankDetailsForm
						update={!!bankDetails}
						dataToUpdate={bankDetails ?? undefined}
						onSuccess={onSuccess}
					/>
				</View>
			</View>
		</Modal>
	);
};

export default BankDetailsFormModal;
