/**
 * home.tsx
 *
 * Unified home dashboard. Shows invoicing and MTD data together with
 * cross-module insights. Quick actions for the three most common tasks.
 *
 * Depends on: hooks/useHomeInsights.ts, context/AppSettingsContext.tsx,
 *             context/ThemeContext.tsx
 * Used by: app/(drawer)/(tabs)/_layout.tsx (tab entry)
 */

import React from 'react';
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { useAppSettings } from '@/context/AppSettingsContext';
import { useHomeInsights } from '@/hooks/useHomeInsights';
import { formatGBP } from '@/utils/mtdTaxCalc';
import ThemeToggle from '@/components/ThemeToggle';

export default function Home() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { settings } = useAppSettings();
  const userId = settings?.userId ?? '';

  const {
    currentQuarterTurnover,
    currentQuarterNetProfit,
    nextDeadline,
    isLoading,
  } = useHomeInsights(userId);

  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: colors.primary, paddingTop: insets.top }}
    >
      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {/* Header */}
        <View className="w-full items-end py-3">
          <ThemeToggle size={30} />
        </View>

        <Text
          className="text-2xl font-bold mb-6 text-center"
          style={{ color: colors.text }}
        >
          Invoice2Mtd
        </Text>

        {isLoading ? (
          <View className="py-12 items-center">
            <ActivityIndicator size="large" color={colors.text} />
          </View>
        ) : (
          <>
            {/* Today at a glance */}
            <View className="flex-row gap-3 mb-4">
              <TouchableOpacity
                className="flex-1 rounded-lg p-4"
                style={{ backgroundColor: isDark ? colors.nav : colors.card }}
                onPress={() => router.push('/(drawer)/(tabs)/invoices')}
              >
                <Ionicons name="document-text-outline" size={24} color={isDark ? '#a5b4fc' : '#4f46e5'} />
                <Text className="text-xs mt-2" style={{ color: colors.noActive }}>
                  Q{nextDeadline ? 'Quarter' : '—'} turnover
                </Text>
                <Text className="text-lg font-bold tabular-nums mt-1" style={{ color: colors.text }}>
                  {formatGBP(currentQuarterTurnover)}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-1 rounded-lg p-4"
                style={{ backgroundColor: isDark ? colors.nav : colors.card }}
                onPress={() => router.push('/(drawer)/(tabs)/tax')}
              >
                <Ionicons name="calculator-outline" size={24} color={isDark ? '#a5b4fc' : '#4f46e5'} />
                <Text className="text-xs mt-2" style={{ color: colors.noActive }}>
                  Net profit
                </Text>
                <Text
                  className="text-lg font-bold tabular-nums mt-1"
                  style={{ color: currentQuarterNetProfit >= 0 ? '#39AD6A' : '#ee1c1c' }}
                >
                  {formatGBP(currentQuarterNetProfit)}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Next deadline row */}
            {nextDeadline && (
              <TouchableOpacity
                className="rounded-lg p-4 mb-4 flex-row items-center justify-between"
                style={{ backgroundColor: isDark ? colors.nav : colors.card }}
                onPress={() => router.push('/(stack)/mtdDeadlines')}
              >
                <View className="flex-row items-center gap-3 flex-1">
                  <Ionicons
                    name="time-outline"
                    size={20}
                    color={
                      nextDeadline.status === 'overdue'
                        ? '#ee1c1c'
                        : nextDeadline.status === 'urgent'
                          ? '#f59e0b'
                          : colors.noActive
                    }
                  />
                  <View className="flex-1">
                    <Text className="text-xs" style={{ color: colors.noActive }}>
                      Next MTD deadline
                    </Text>
                    <Text className="text-sm font-bold" style={{ color: colors.text }}>
                      {nextDeadline.label}
                    </Text>
                  </View>
                </View>
                <Text
                  className="text-xs font-bold"
                  style={{
                    color:
                      nextDeadline.status === 'overdue'
                        ? '#ee1c1c'
                        : nextDeadline.status === 'urgent'
                          ? '#f59e0b'
                          : colors.noActive,
                  }}
                >
                  {nextDeadline.daysUntil < 0
                    ? `${Math.abs(nextDeadline.daysUntil)}d overdue`
                    : nextDeadline.daysUntil === 0
                      ? 'Today'
                      : `${nextDeadline.daysUntil}d`}
                </Text>
              </TouchableOpacity>
            )}

            {/* Quick actions row */}
            <Text
              className="text-xs font-bold uppercase tracking-widest mb-3"
              style={{ color: colors.noActive }}
            >
              Quick Actions
            </Text>
            <View className="flex-row gap-3 mb-6">
              <TouchableOpacity
                className="flex-1 rounded-lg p-4 items-center"
                style={{ backgroundColor: isDark ? colors.nav : colors.card }}
                onPress={() => router.push('/(stack)/createInvoice')}
              >
                <Ionicons name="add-circle-outline" size={28} color={isDark ? '#a5b4fc' : '#4f46e5'} />
                <Text className="text-xs font-bold mt-2 text-center" style={{ color: colors.text }}>
                  New Invoice
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-1 rounded-lg p-4 items-center"
                style={{ backgroundColor: isDark ? colors.nav : colors.card }}
                onPress={() => router.push('/(stack)/addMtdTransaction')}
              >
                <Ionicons name="receipt-outline" size={28} color={isDark ? '#a5b4fc' : '#4f46e5'} />
                <Text className="text-xs font-bold mt-2 text-center" style={{ color: colors.text }}>
                  Add MTD Record
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-1 rounded-lg p-4 items-center"
                style={{ backgroundColor: isDark ? colors.nav : colors.card }}
                onPress={() => router.push('/(stack)/createEstimate')}
              >
                <Ionicons name="document-outline" size={28} color={isDark ? '#a5b4fc' : '#4f46e5'} />
                <Text className="text-xs font-bold mt-2 text-center" style={{ color: colors.text }}>
                  New Estimate
                </Text>
              </TouchableOpacity>
            </View>

            {/* Existing navigation cards */}
            <TouchableOpacity
              className="rounded-lg p-4 mb-3 flex-row items-center gap-4"
              style={{ backgroundColor: isDark ? colors.nav : colors.card }}
              onPress={() => router.push('/(stack)/clientInfo')}
            >
              <View
                className="rounded-xl p-3"
                style={{ backgroundColor: isDark ? colors.primary : colors.text }}
              >
                <Ionicons name="business-outline" size={28} color={isDark ? colors.text : '#f1fcfa'} />
              </View>
              <View className="flex-1">
                <Text className="text-base font-bold" style={{ color: colors.text }}>
                  Client Information
                </Text>
                <Text className="text-xs" style={{ color: colors.noActive }}>
                  Manage client details
                </Text>
              </View>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
