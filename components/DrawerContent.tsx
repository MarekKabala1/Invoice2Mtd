/**
 * DrawerContent.tsx
 *
 * Custom drawer content component. Renders app name, user info,
 * navigation items (Home, Settings, Info, Charts), theme toggle,
 * and app version.
 *
 * Depends on: context/ThemeContext, utils/theme, expo-constants,
 *             @react-navigation/drawer
 * Used by: app/(drawer)/_layout.tsx (drawerContent prop)
 */

import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { DrawerContentComponentProps } from '@react-navigation/drawer';
import { usePathname, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useTheme } from '@/context/ThemeContext';
import ThemeToggle from '@/components/ThemeToggle';

interface DrawerItem {
  label: string;
  route: string;
  icon: string;
}

const DRAWER_ITEMS: DrawerItem[] = [
  { label: 'Home', route: '/(drawer)/(tabs)/home', icon: 'home-outline' },
  { label: 'Settings', route: '/(drawer)/settings', icon: 'settings-outline' },
  { label: 'Info', route: '/(drawer)/info', icon: 'information-circle-outline' },
  { label: 'Charts & Analytics', route: '/(drawer)/charts', icon: 'bar-chart-outline' },
];

export default function DrawerContent(props: DrawerContentComponentProps) {
  const { colors, isDark } = useTheme();
  const pathname = usePathname();
  const version = Constants.expoConfig?.version ?? '1.0.0';

  const isActive = (route: string): boolean => {
    if (route === '/(drawer)/(tabs)/home') {
      return pathname.includes('(tabs)');
    }
    return pathname.includes(route.split('/').pop() ?? '');
  };

  return (
    <View className="flex-1" style={{ backgroundColor: isDark ? colors.nav : colors.card }}>
      <ScrollView
        contentContainerStyle={{ paddingTop: 0, flexGrow: 1 }}
        style={{ backgroundColor: isDark ? colors.nav : colors.card }}
      >
        {/* Header */}
        <View
          className="px-5 pb-4 pt-8"
          style={{ backgroundColor: isDark ? colors.primary : colors.text }}
        >
          <Text className="text-lg font-bold text-white">Invoice2Mtd</Text>
          <Text className="mt-1 text-xs text-white opacity-70">
            Invoicing &amp; Making Tax Digital
          </Text>
        </View>

        {/* Navigation items */}
        <View className="mt-4 px-3">
          {DRAWER_ITEMS.map((item) => {
            const focused = isActive(item.route);
            return (
              <TouchableOpacity
                key={item.label}
                className="flex-row items-center rounded-lg px-3 py-3"
                style={{
                  backgroundColor: focused
                    ? isDark
                      ? 'rgba(255,255,255,0.1)'
                      : 'rgba(0,0,0,0.05)'
                    : 'transparent',
                }}
                onPress={() => {
                  props.navigation.closeDrawer();
                  router.push(item.route as any);
                }}
              >
                <Ionicons
                  name={item.icon as any}
                  size={22}
                  color={focused ? colors.text : colors.noActive}
                />
                <Text
                  className="ml-3 text-sm"
                  style={{
                    color: focused ? colors.text : colors.noActive,
                    fontWeight: focused ? 'bold' : 'normal',
                  }}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Footer */}
      <View className="border-t px-5 py-4" style={{ borderColor: colors.border }}>
        <View className="flex-row items-center justify-between">
          <ThemeToggle size={24} />
          <Text className="text-xs" style={{ color: colors.noActive }}>
            v{version}
          </Text>
        </View>
      </View>
    </View>
  );
}
