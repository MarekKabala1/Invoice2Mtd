import React from 'react';
import { Modal, View, Text, TouchableOpacity } from 'react-native';
import UserInfoForm from '../../app/(stack)/(user)/userInfoForm';
import { UserType } from '@/db/zodSchema';
import { useTheme } from '@/context/ThemeContext';

interface UserFormModalProps {
	visible: boolean;
	onClose: () => void;
	user: UserType | null;
	onSuccess: () => void;
}

const UserFormModal: React.FC<UserFormModalProps> = ({
	visible,
	onClose,
	user,
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
							{user ? 'Update User' : 'Add User'}
						</Text>
						<TouchableOpacity onPress={onClose}>
							<Text className='text-light-text dark:text-dark-text text-right text-lg'>
								✕
							</Text>
						</TouchableOpacity>
					</View>
					<UserInfoForm
						update={!!user}
						dataToUpdate={user ?? undefined}
						onSuccess={onSuccess}
					/>
				</View>
			</View>
		</Modal>
	);
};

export default UserFormModal;
