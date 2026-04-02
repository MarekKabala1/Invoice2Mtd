import React, { useState, useEffect } from 'react';
import { TouchableOpacity, Text, View, Modal, Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';

interface PickerWithTouchableOpacityProps {
	initialValue: string;
	onValueChange: (value: string) => void;
	items: { label: string; value: string }[];
	mode?: 'dropdown' | 'button';
	isRequired?: boolean;
	errorMessage?: string;
	errorState?: boolean;
	disabled?: boolean;
}

const PickerWithTouchableOpacity: React.FC<PickerWithTouchableOpacityProps> = ({
	items,
	initialValue,
	onValueChange,
	mode = 'dropdown',
	errorState,
	errorMessage,
	disabled = false,
}) => {
	const [selectedValue, setSelectedValue] = useState<string>(initialValue);
	const [isPickerVisible, setPickerVisible] = useState<boolean>(false);
	const [selectedLabel, setSelectedLabel] = useState<string>();
	const { colors } = useTheme();

	useEffect(() => {
		setSelectedValue(initialValue);
		const initialItem = items.find((item) => item.value === initialValue);
		if (initialItem) {
			setSelectedLabel(initialItem.label);
		} else if (errorState) {
			setSelectedLabel(errorMessage);
		}
	}, [initialValue, items, errorState]);

	const togglePicker = () => {
		if (!disabled) {
			setPickerVisible(!isPickerVisible);
		}
	};

	const pickerItems = items;

	return (
		<View>
			{Platform.OS === 'ios' ? (
				<TouchableOpacity
					onPress={togglePicker}
					className='flex-row justify-between items-center border rounded-md border-light-text dark:border-dark-text p-2 h-[33px]'>
					<Text className='text-[12px] text-mutedForeground/50 dark:text-dark-text'>
						{selectedLabel || initialValue}
					</Text>
					<MaterialCommunityIcons
						name='chevron-down'
						size={12}
						color={colors.text}
					/>
				</TouchableOpacity>
			) : (
				<View>
					<Picker
						mode='dropdown'
						style={
							errorState
								? {
										color: colors.danger,
										fontSize: 8,
										borderWidth: 1,
										borderColor: colors.danger,
									}
								: {
										color: colors.text,
										fontSize: 8,
										borderWidth: 2,
										borderColor: colors.text,
										backgroundColor: colors.nav,
									}
						}
						selectedValue={selectedValue}
						onValueChange={(itemValue: string) => {
							if (!disabled) {
								setSelectedValue(itemValue);
								onValueChange(itemValue);
								const selectedItem = pickerItems.find(
									(item) => item.value === itemValue
								);
								if (selectedItem) {
									setSelectedLabel(selectedItem.label);
								}
							}
						}}>
						{pickerItems.map((item) => (
							<Picker.Item
								style={{
									padding: 0,
									backgroundColor: colors.nav,
									borderWidth: 1,
									borderColor: colors.text,
								}}
								color={colors.text}
								key={item.value}
								label={item.label}
								value={item.value}
								enabled={!disabled}
							/>
						))}
					</Picker>
				</View>
			)}

			{Platform.OS === 'ios' && (
				<Modal
					visible={isPickerVisible}
					transparent={true}
					animationType='slide'
					onRequestClose={togglePicker}>
					<View className='flex-1 justify-center items-center bg-mutedForeground/50'>
						<View className='bg-light-primary/90 dark:bg-dark-primary/90 rounded-lg w-3/4'>
							<Picker
								placeholder={initialValue}
								style={{
									textAlign: 'center',
									fontSize: 12,
									color: colors.text,
								}}
								selectedValue={selectedValue}
								onValueChange={(itemValue) => {
									if (!disabled) {
										setSelectedValue(itemValue);
										onValueChange(itemValue);
										const selectedItem = pickerItems.find(
											(item) => item.value === itemValue
										);
										if (selectedItem) {
											setSelectedLabel(selectedItem.label);
										}
										togglePicker();
									}
								}}>
								{pickerItems.map((item) => (
									<Picker.Item
										color={colors.text}
										key={item.value}
										label={item.label}
										value={item.value}
										enabled={!disabled}
									/>
								))}
							</Picker>

							<TouchableOpacity
								onPress={togglePicker}
								className='mt-4 p-2 bg-blue-600 rounded'>
								<Text className='text-light-text dark:text-dark-text text-center'>
									Close
								</Text>
							</TouchableOpacity>
						</View>
					</View>
				</Modal>
			)}
		</View>
	);
};

export default PickerWithTouchableOpacity;
