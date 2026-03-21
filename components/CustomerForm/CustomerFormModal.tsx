import React from 'react';
import {
	View,
	Text,
	TextInput,
	ScrollView,
	TouchableOpacity,
	Modal,
} from 'react-native';
import {
	Control,
	Controller,
	FieldErrors,
	UseFormHandleSubmit,
} from 'react-hook-form';
import { CustomerType } from '@/db/zodSchema';
import { useTheme } from '@/context/ThemeContext';
import { color } from '@/utils/theme';

interface CustomerFormModalProps {
	modalVisible: boolean;
	onClose: () => void;
	onSubmit: (data: CustomerType) => void;
	control: Control<CustomerType>;
	errors: FieldErrors<CustomerType>;
	isUpdateMode: boolean;
	isLoading: boolean;
	handleSubmit: UseFormHandleSubmit<CustomerType>;
}

export const CustomerFormModal: React.FC<CustomerFormModalProps> = ({
	modalVisible,
	onClose,
	onSubmit,
	control,
	errors,
	isUpdateMode,
	isLoading,
	handleSubmit,
}) => {
	const { colors } = useTheme();

	const handleFormSubmit = (data: CustomerType) => {
		onSubmit(data);
	};

	return (
		<Modal
			animationType='slide'
			transparent={true}
			visible={modalVisible}
			onRequestClose={onClose}>
			<View className='flex-1 justify-center items-center bg-light-text/30 dark:bg-dark-text/30'>
				<View className='bg-light-primary dark:bg-dark-primary w-[90%] rounded-lg p-6 max-h-[90%]'>
					<View className='flex-row w-full items-center mb-4'>
						<Text className='text-lg font-bold m-auto text-light-text dark:text-dark-text'>
							{isUpdateMode ? 'Update Customer' : 'Add Customer'}
						</Text>
						<TouchableOpacity onPress={onClose}>
							<Text className='text-light-text dark:text-dark-text text-right text-lg'>
								✕
							</Text>
						</TouchableOpacity>
					</View>

					<ScrollView className='gap-4'>
						<View>
							<Text
								className={
									errors.name
										? 'text-danger text-xs font-bold'
										: 'text-light-text dark:text-dark-text text-xs font-bold'
								}>
								Company Name
							</Text>
							<Controller
								control={control}
								name='name'
								render={({
									field: { onChange, onBlur, value },
									fieldState: { error },
								}) => (
									<TextInput
										className={
											error
												? 'border rounded-md text-danger border-danger p-2 mb-3'
												: 'border rounded-md border-light-text dark:border-dark-text p-2 mb-3 text-light-text dark:text-dark-text'
										}
										placeholder={
											errors.name ? errors.name.message : 'Enter company name'
										}
										placeholderTextColor={
											errors.name ? color.danger : colors.text
										}
										value={value}
										onChangeText={onChange}
										onBlur={onBlur}
										returnKeyType='next'
									/>
								)}
							/>
						</View>

						<View>
							<Text
								className={
									errors.address
										? 'text-danger text-xs font-bold'
										: 'text-light-text dark:text-dark-text text-xs font-bold'
								}>
								Address
							</Text>
							<Controller
								control={control}
								name='address'
								render={({
									field: { onChange, onBlur, value },
									fieldState: { error },
								}) => (
									<TextInput
										className={
											error
												? 'border rounded-md text-danger border-danger p-2 mb-3'
												: 'text-light-text dark:text-dark-text border rounded-md border-light-text dark:border-dark-text p-2 mb-3'
										}
										placeholder={
											errors.address ? errors.address.message : 'Enter address'
										}
										placeholderTextColor={
											errors.address ? color.danger : color.light.text
										}
										value={value}
										onChangeText={onChange}
										onBlur={onBlur}
										returnKeyType='next'
									/>
								)}
							/>
						</View>

						<View>
							<Text
								className={
									errors.emailAddress
										? 'text-danger text-xs font-bold'
										: 'text-light-text dark:text-dark-text text-xs font-bold'
								}>
								Email
							</Text>
							<Controller
								control={control}
								name='emailAddress'
								render={({
									field: { onChange, onBlur, value },
									fieldState: { error },
								}) => (
									<TextInput
										className={
											error
												? 'border rounded-md text-danger border-danger p-2 mb-3'
												: 'text-light-text dark:text-dark-text border rounded-md border-light-text dark:border-dark-text p-2 mb-3'
										}
										placeholder={
											errors.emailAddress
												? errors.emailAddress.message
												: 'Enter email address'
										}
										value={value}
										placeholderTextColor={
											errors.emailAddress ? color.danger : color.light.text
										}
										onChangeText={onChange}
										onBlur={onBlur}
										keyboardType='email-address'
										returnKeyType='next'
									/>
								)}
							/>
						</View>

						<View>
							<Text
								className={
									errors.phoneNumber
										? 'text-danger text-xs font-bold'
										: 'text-light-text dark:text-dark-text text-xs font-bold'
								}>
								Phone Number
							</Text>
							<Controller
								control={control}
								name='phoneNumber'
								render={({
									field: { onChange, onBlur, value },
									fieldState: { error },
								}) => (
									<TextInput
										className={
											error
												? 'border rounded-md text-danger border-danger p-2 mb-3'
												: 'text-light-text dark:text-dark-text border rounded-md border-light-text dark:border-dark-text p-2 mb-3'
										}
										placeholder={
											errors.phoneNumber
												? errors.phoneNumber.message
												: 'Enter phone number'
										}
										placeholderTextColor={
											errors.phoneNumber ? color.danger : color.light.text
										}
										value={value}
										keyboardType='phone-pad'
										onChangeText={onChange}
										onBlur={onBlur}
										returnKeyType='done'
									/>
								)}
							/>
						</View>

						<TouchableOpacity
							onPress={handleSubmit(handleFormSubmit)}
							disabled={isLoading}
							className='border border-light-text dark:border-dark-text py-2 rounded-md mt-3'>
							<Text className='text-light-text dark:text-dark-text text-center text-lg'>
								{isLoading
									? 'Saving...'
									: (isUpdateMode ? 'Update' : 'Add') + ' Customer'}
							</Text>
						</TouchableOpacity>
					</ScrollView>
				</View>
			</View>
		</Modal>
	);
};
