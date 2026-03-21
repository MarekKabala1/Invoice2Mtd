import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

interface ActionButtonsProps {
	isUpdateMode: boolean;
	onSave: () => void;
	onSend: () => void;
	onExportPdf: () => void;
	onPreview: () => void;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
	isUpdateMode,
	onSave,
	onSend,
	onExportPdf,
	onPreview,
}) => {
	return (
		<View className='gap-4'>
			<TouchableOpacity onPress={onSave}>
				<Text className='bg-light-secondary text-light-primary text-center p-2 rounded'>
					{isUpdateMode ? 'Update Invoice' : 'Save Invoice to Db'}
				</Text>
			</TouchableOpacity>
			<TouchableOpacity onPress={onSend}>
				<Text className='bg-success text-light-primary text-center p-2 rounded'>
					Export Invoice
				</Text>
			</TouchableOpacity>
			<TouchableOpacity onPress={onExportPdf}>
				<Text className='bg-yellow-600 text-light-primary text-center p-2 rounded'>
					Save to File
				</Text>
			</TouchableOpacity>
			<TouchableOpacity onPress={onPreview}>
				<Text className='bg-purple-600 text-light-primary text-center p-2 rounded'>
					Preview Invoice
				</Text>
			</TouchableOpacity>
		</View>
	);
};
