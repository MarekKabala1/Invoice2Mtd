import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';

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
	const { colors, isDark } = useTheme();

	return (
		<View className='gap-3 mt-4'>
			{/* Save button — primary */}
			<TouchableOpacity
				onPress={onSave}
				className='p-4 rounded-lg flex-row items-center justify-center gap-2'
				style={{ backgroundColor: isDark ? '#4f46e5' : '#4338ca' }}
			>
				<MaterialCommunityIcons name="content-save" size={20} color="white" />
				<Text className='text-white font-bold text-base'>
					{isUpdateMode ? 'Update Invoice' : 'Save Invoice'}
				</Text>
			</TouchableOpacity>

			{/* Row: Preview and Export */}
			<View className='flex-row gap-3'>
				<TouchableOpacity
					onPress={onPreview}
					className='flex-1 p-3 rounded-lg flex-row items-center justify-center gap-2'
					style={{ backgroundColor: isDark ? colors.nav : colors.card }}
				>
					<MaterialCommunityIcons name="eye-outline" size={18} color={colors.text} />
					<Text className='font-bold text-sm' style={{ color: colors.text }}>
						Preview
					</Text>
				</TouchableOpacity>
				<TouchableOpacity
					onPress={onExportPdf}
					className='flex-1 p-3 rounded-lg flex-row items-center justify-center gap-2'
					style={{ backgroundColor: isDark ? colors.nav : colors.card }}
				>
					<MaterialCommunityIcons name="file-pdf-box" size={18} color={colors.text} />
					<Text className='font-bold text-sm' style={{ color: colors.text }}>
						Save PDF
					</Text>
				</TouchableOpacity>
			</View>

			{/* Send button — green */}
			<TouchableOpacity
				onPress={onSend}
				className='p-4 rounded-lg flex-row items-center justify-center gap-2'
				style={{ backgroundColor: '#39AD6A' }}
			>
				<MaterialCommunityIcons name="send" size={20} color="white" />
				<Text className='text-white font-bold text-base'>
					Export Invoice
				</Text>
			</TouchableOpacity>
		</View>
	);
};
