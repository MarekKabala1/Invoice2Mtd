import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { Linking, Alert, TouchableOpacity, Text, View } from 'react-native';

type TEmail = {
	email: string;
	customerName: string;
};

export const EmailAddress = ({ email, customerName }: TEmail) => {
	const { colors } = useTheme();

	const handleEmail = () => {
		Alert.alert('Send E-mail', `Send e-mail to ${customerName} on ${email}`, [
			{ text: 'Cancel', style: 'cancel' },
			{
				text: 'Send',
				onPress: () => {
					const emailUrl = `mailto:${email}`;

					Linking.canOpenURL(emailUrl)
						.then((supported) => {
							if (supported) {
								return Linking.openURL(emailUrl);
							} else {
								Alert.alert('Error', 'Email is not supported on this device');
							}
						})
						.catch((err) => console.error('Error opening email app:', err));
				},
			},
		]);
	};

	return (
		<TouchableOpacity onPress={handleEmail}>
			<View className='flex-row items-center'>
				<Ionicons name='mail-outline' size={16} color={colors.text} />
				<Text className='text-light-text dark:text-dark-text text-sm ml-1 underline'>
					{email}
				</Text>
			</View>
		</TouchableOpacity>
	);
};
