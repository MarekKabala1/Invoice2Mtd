import React from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface ActionButtonsProps {
	isUpdateMode: boolean;
	onSave: () => void;
	onSend: () => void;
	onExportPdf: () => void;
	onPreview: () => void;
}

const btnShadow = {
	ios: {
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.25,
		shadowRadius: 4,
	},
	android: { elevation: 4 },
};

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
				style={{
					backgroundColor: isDark ? '#4f46e5' : '#4338ca',
					...(Platform.OS === 'ios' ? btnShadow.ios : btnShadow.android),
				}}
			>
				<MaterialCommunityIcons name="content-save" size={20} color="white" />
				<Text className='text-white font-bold text-base'>
					{isUpdateMode ? 'Update Invoice' : 'Save Invoice'}
				</Text>
			</TouchableOpacity>

			{/* Row: Preview and Export PDF */}
			<View className='flex-row gap-3'>
				<TouchableOpacity
					onPress={onPreview}
					className='flex-1 p-3 rounded-lg flex-row items-center justify-center gap-2'
					style={{
						backgroundColor: isDark ? colors.nav : colors.card,
						...(Platform.OS === 'ios' ? btnShadow.ios : btnShadow.android),
					}}
				>
					<MaterialCommunityIcons name="eye-outline" size={18} color={colors.text} />
					<Text className='font-bold text-sm' style={{ color: colors.text }}>
						Preview
					</Text>
				</TouchableOpacity>
				<TouchableOpacity
					onPress={onExportPdf}
					className='flex-1 p-3 rounded-lg flex-row items-center justify-center gap-2'
					style={{
						backgroundColor: isDark ? '#7c3aed' : '#6d28d9',
						...(Platform.OS === 'ios' ? btnShadow.ios : btnShadow.android),
					}}
				>
					<MaterialCommunityIcons name="file-pdf-box" size={18} color="white" />
					<Text className='font-bold text-white text-sm'>
						Save PDF
					</Text>
				</TouchableOpacity>
			</View>

			{/* Send button — green */}
			<TouchableOpacity
				onPress={onSend}
				className='p-4 rounded-lg flex-row items-center justify-center gap-2'
				style={{
					backgroundColor: '#39AD6A',
					...(Platform.OS === 'ios' ? btnShadow.ios : btnShadow.android),
				}}
			>
				<MaterialCommunityIcons name="send" size={20} color="white" />
				<Text className='text-white font-bold text-base'>
					Export Invoice
				</Text>
			</TouchableOpacity>
		</View>
	);
};
