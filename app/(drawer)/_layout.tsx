/**
 * (drawer)/_layout.tsx
 *
 * Drawer navigator layout. Wraps all screens that appear in the left-slide
 * drawer: (tabs), settings, info, charts. Providers (Theme, AppSettings)
 * remain in the root _layout.tsx — this file only declares routes.
 *
 * Depends on: components/DrawerContent.tsx (custom drawer content)
 * Used by: app/_layout.tsx (root Stack references this segment)
 */

import { Drawer } from 'expo-router/drawer';
import { DrawerToggleButton } from '@react-navigation/drawer';
import DrawerContent from '@/components/DrawerContent';
import { useTheme } from '@/context/ThemeContext';
import ThemeToggle from '@/components/ThemeToggle';
import { View } from 'react-native';

export default function DrawerLayout() {
  const { colors, isDark } = useTheme();

  return (
    <Drawer
      drawerContent={(props) => <DrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: 'bold' },
        headerTitleAlign: 'center',
        drawerStyle: {
          width: 300,
        },
      }}
    >
      <Drawer.Screen
        name="(tabs)"
        options={{
          drawerLabel: 'Home',
          headerShown: false,
        }}
      />
      <Drawer.Screen
        name="settings"
        options={{
          drawerLabel: 'Settings',
          title: 'Settings',
          headerShown: true,
          headerLeft: () => (
            <View className="ml-2">
              <DrawerToggleButton tintColor={colors.text} />
            </View>
          ),
          headerRight: () => (
            <View className="mr-3">
              <ThemeToggle size={24} />
            </View>
          ),
        }}
      />
      <Drawer.Screen
        name="info"
        options={{
          drawerLabel: 'MTD Info',
          title: 'MTD Info',
          headerShown: true,
          headerLeft: () => (
            <View className="ml-2">
              <DrawerToggleButton tintColor={colors.text} />
            </View>
          ),
          headerRight: () => (
            <View className="mr-3">
              <ThemeToggle size={24} />
            </View>
          ),
        }}
      />
      <Drawer.Screen
        name="charts"
        options={{
          drawerLabel: 'Charts & Analytics',
          title: 'Charts & Analytics',
          headerShown: true,
          headerLeft: () => (
            <View className="ml-2">
              <DrawerToggleButton tintColor={colors.text} />
            </View>
          ),
          headerRight: () => (
            <View className="mr-3">
              <ThemeToggle size={24} />
            </View>
          ),
        }}
      />
    </Drawer>
  );
}
