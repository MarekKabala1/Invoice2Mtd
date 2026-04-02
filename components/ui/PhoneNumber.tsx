import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { Linking, Alert, TouchableOpacity, Text, View } from 'react-native';

type Tphone = {
	phoneNumber: string;
	customerName: string;
};

export const PhoneNumber = ({ phoneNumber, customerName }: Tphone) => {
	const { colors } = useTheme();

	const handleCall = () => {
		Alert.alert(
			'Make Call',
			`Call ${customerName || 'this number'}?\n${phoneNumber}`,
			[
				{ text: 'Cancel', style: 'cancel' },
				{
					text: 'Call',
					onPress: () => {
						const phoneUrl = `tel:${phoneNumber}`;
						Linking.openURL(phoneUrl).catch((err) =>
							Alert.alert('Error', 'Unable to make call')
						);
					},
				},
			]
		);
	};

	return (
		<TouchableOpacity onPress={handleCall}>
			<View className='flex-row items-center '>
				<Ionicons name='call-outline' size={16} color={colors.text} />
				<Text className='text-light-text dark:text-dark-text text-sm ml-1 underline '>
					{phoneNumber}
				</Text>
			</View>
		</TouchableOpacity>
	);
};
