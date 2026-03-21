import React, { useEffect, useRef } from 'react';
import { Stack, Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, Platform } from 'react-native';
import Animated, {
	interpolate,
	useAnimatedStyle,
	useSharedValue,
	withSpring,
	withTiming,
} from 'react-native-reanimated';
import { color } from '@/utils/theme';
import { useTheme } from '@/context/ThemeContext';
import ThemeToggle from '@/components/ThemeToggle';

const AnimatedTabLabel = ({
	focused,
	children,
}: {
	focused: boolean;
	children: React.ReactNode;
}) => {
	const [width, setWidth] = React.useState(0);
	const animatedWidth = useSharedValue(0);
	const scale = useSharedValue(1);
	const { colors } = useTheme();

	useEffect(() => {
		if (focused) {
			scale.value = withSpring(1.1, { damping: 10, stiffness: 100 });
			animatedWidth.value = withSpring(width, {
				damping: 15,
				stiffness: 90,
			});
		} else {
			scale.value = withSpring(1, { damping: 10, stiffness: 100 });
			animatedWidth.value = withTiming(0, { duration: 200 });
		}
	}, [focused, width]);

	const underlineStyle = useAnimatedStyle(() => ({
		height: 2,
		backgroundColor: colors.text,
		width: animatedWidth.value,
		position: 'absolute',
		bottom: -2,
		left: 0,
		right: 0,
		alignSelf: 'center',
		opacity: interpolate(animatedWidth.value, [0, width], [0, 1]),
	}));

	const labelStyle = useAnimatedStyle(() => ({
		transform: [{ scale: scale.value }],
		color: focused ? colors.text : colors.noActive,
	}));

	return (
		<View style={{ position: 'relative', alignItems: 'center' }}>
			<Animated.Text
				onLayout={({ nativeEvent }) => {
					setWidth(nativeEvent.layout.width);
				}}
				style={[
					{
						fontSize: 10,
						marginBottom: 4,
					},
					labelStyle,
				]}>
				{children}
			</Animated.Text>
			<Animated.View style={underlineStyle} />
		</View>
	);
};

const AnimatedIcons = ({
	focused,
	children,
}: {
	focused: boolean;
	children: any;
}) => {
	const scale = useSharedValue(1);
	const { colors } = useTheme();

	useEffect(() => {
		scale.value = withSpring(focused ? 1.1 : 1, {
			damping: 15,
			stiffness: 120,
			mass: 1,
		});
	}, [scale, focused]);

	const animatedIconStyle = useAnimatedStyle(() => {
		const scaleValue = interpolate(scale.value, [1, 1.1], [1, 1.3]);
		return {
			transform: [{ scale: scaleValue }],
			color: focused ? colors.text : colors.noActive,
		};
	});

	return <Animated.View style={animatedIconStyle}>{children}</Animated.View>;
};

export default function TabsLayout() {
	const { colors } = useTheme();
	return (
		<Tabs
			screenOptions={{
				headerStyle: { backgroundColor: colors.primary },
				headerTintColor: colors.noActive,
				headerTitleStyle: { fontWeight: 'bold' },
				tabBarStyle: Platform.select({
					android: {
						position: 'relative',
						bottom: 10,
						backgroundColor: colors.nav,
						height: 80,
						margin: 10,
						paddingBottom: 15,
						paddingTop: 15,
						borderRadius: 20,
						elevation: 10,
						borderColor: 'transparent',
					},
					ios: {
						position: 'relative',
						bottom: 15,
						backgroundColor: colors.nav,
						height: 80,
						margin: 10,
						paddingBottom: 10,
						paddingTop: 10,
						borderRadius: 20,
						shadowColor: colors.primary,
						shadowOffset: { width: 5, height: 5 },
						shadowOpacity: 0.3,
						shadowRadius: 10,
						justifyContent: 'center',
						alignItems: 'center',
						borderColor: 'transparent',
					},
				}),

				tabBarActiveTintColor: colors.text,
				tabBarInactiveTintColor: colors.noActive,
				headerTitleAlign: 'center',
				tabBarHideOnKeyboard: true,
				headerShown: false,
				tabBarLabel: ({ focused, children }) => (
					<AnimatedTabLabel focused={focused}>{children}</AnimatedTabLabel>
				),
			}}>
			<Tabs.Screen
				name='home'
				options={{
					title: 'Home',
					tabBarIcon: ({ focused }) =>
						focused ? (
							<AnimatedIcons focused={focused}>
								<Ionicons name='home' size={24} color={colors.text} />
							</AnimatedIcons>
						) : (
							<AnimatedIcons focused={focused}>
								<Ionicons
									name='home-outline'
									size={24}
									color={colors.noActive}
								/>
							</AnimatedIcons>
						),
				}}
			/>
			<Tabs.Screen
				name='invoices'
				options={{
					title: 'Invoices',
					tabBarIcon: ({ focused }) =>
						focused ? (
							<AnimatedIcons focused={focused}>
								<Ionicons
									name='document'
									size={24}
									color={colors.text}
									style={{ transform: [{ scale: 1.2 }] }}
								/>
							</AnimatedIcons>
						) : (
							<AnimatedIcons focused={focused}>
								<Ionicons
									name='document-outline'
									size={24}
									color={colors.noActive}
								/>
							</AnimatedIcons>
						),
				}}
			/>

			<Tabs.Screen
				name='charts'
				options={{
					title: 'Charts',
					tabBarIcon: ({ focused }) =>
						focused ? (
							<AnimatedIcons focused={focused}>
								<Ionicons
									name='bar-chart'
									size={24}
									color={colors.text}
									style={{ transform: [{ scale: 1.2 }] }}
								/>
							</AnimatedIcons>
						) : (
							<AnimatedIcons focused={focused}>
								<Ionicons
									name='bar-chart-outline'
									size={24}
									color={colors.noActive}
								/>
							</AnimatedIcons>
						),
				}}
			/>
			<Tabs.Screen
				name='budget'
				options={{
					title: 'Budget',
					tabBarIcon: ({ focused }) =>
						focused ? (
							<AnimatedIcons focused={focused}>
								<Ionicons
									name='wallet'
									size={24}
									color={colors.text}
									style={{ transform: [{ scale: 1.2 }] }}
								/>
							</AnimatedIcons>
						) : (
							<AnimatedIcons focused={focused}>
								<Ionicons
									name='wallet-outline'
									size={24}
									color={colors.noActive}
								/>
							</AnimatedIcons>
						),
				}}
			/>
			<Tabs.Screen
				name='scanner'
				options={{
					title: 'Scanner',
					tabBarIcon: ({ focused }) =>
						focused ? (
							<AnimatedIcons focused={focused}>
								<Ionicons
									name='scan-circle-sharp'
									size={24}
									color={colors.text}
									style={{ transform: [{ scale: 1.2 }] }}
								/>
							</AnimatedIcons>
						) : (
							<AnimatedIcons focused={focused}>
								<Ionicons
									name='scan-circle-outline'
									size={24}
									color={colors.noActive}
								/>
							</AnimatedIcons>
						),
				}}
			/>
		</Tabs>
	);
}
