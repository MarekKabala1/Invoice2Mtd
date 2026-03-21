import React from 'react';
import { View, Platform } from 'react-native';

interface BaseCardProps {
	children: React.ReactNode;
	className?: string;
}

const BaseCard: React.FC<BaseCardProps> = ({ children, className = '' }) => {
	return (
		<View
			className={`bg-light-nav dark:bg-dark-nav p-2 rounded-md active:opacity-90 ${className}`}
			style={[
				Platform.OS === 'ios'
					? {
							shadowColor: '#223',
							shadowOffset: { width: 0, height: 4 },
							shadowOpacity: 0.25,
							shadowRadius: 20,
						}
					: { borderRadius: 15, elevation: 4 },
			]}>
			{children}
		</View>
	);
};

export default BaseCard;
