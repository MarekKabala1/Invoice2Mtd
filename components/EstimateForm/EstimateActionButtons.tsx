import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

interface EstimateActionButtonsProps {
	isUpdateMode: boolean;
	onSave: () => void;
	onSend: () => void;
	onExportPdf: () => void;
	onPreview: () => void;
	isSaving?: boolean;
}

export const EstimateActionButtons: React.FC<EstimateActionButtonsProps> = ({
	isUpdateMode,
	onSave,
	onSend,
	onExportPdf,
	onPreview,
	isSaving = false,
}) => {
	return (
		<View className='gap-4'>
			<TouchableOpacity
				onPress={onSave}
				disabled={isSaving}
				className='bg-light-secondary dark:bg-dark-secondary rounded-lg overflow-hidden'
				activeOpacity={0.7}>
				<Text className='text-light-primary dark:text-dark-primary text-center p-3 font-medium'>
					{isSaving
						? 'Saving...'
						: isUpdateMode
							? 'Update Estimate'
							: 'Save Estimate to Db'}
				</Text>
			</TouchableOpacity>
			<TouchableOpacity
				onPress={onSend}
				className='bg-green-600 dark:bg-green-700 rounded-lg overflow-hidden'
				activeOpacity={0.7}>
				<Text className='text-white text-center p-3 font-medium'>
					Export Estimate
				</Text>
			</TouchableOpacity>
			<TouchableOpacity
				onPress={onExportPdf}
				className='bg-yellow-600 dark:bg-yellow-700 rounded-lg overflow-hidden'
				activeOpacity={0.7}>
				<Text className='text-white text-center p-3 font-medium'>
					Save to File
				</Text>
			</TouchableOpacity>
			<TouchableOpacity
				onPress={onPreview}
				className='bg-purple-600 dark:bg-purple-700 rounded-lg overflow-hidden'
				activeOpacity={0.7}>
				<Text className='text-white text-center p-3 font-medium'>
					Preview Estimate
				</Text>
			</TouchableOpacity>
		</View>
	);
};
