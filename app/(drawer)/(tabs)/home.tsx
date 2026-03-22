/**
 * home.tsx
 *
 * Unified home dashboard (MASTER_PLAN Phase 5): unpaid invoices + Q net profit,
 * MTD gap banner, next deadline, recent activity, quick actions.
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

export default function Home() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { settings } = useAppSettings();
  const userId = settings?.userId ?? '';

  const {
    unpaidInvoicesTotal,
    unpaidInvoicesCount,
    currentQuarterNetProfit,
    currentQuarter,
    turnoverNotYetRecorded,
    nextDeadline,
    recentActivity,
    isLoading,
    error,
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
            {error ? (
              <Text className="text-sm mb-4 text-center" style={{ color: '#ee1c1c' }}>
                {error}
              </Text>
            ) : null}

            {/* Today at a glance — unpaid invoices + Q net profit */}
            <View className="flex-row gap-3 mb-4">
              <TouchableOpacity
                className="flex-1 rounded-lg p-4"
                style={{ backgroundColor: isDark ? colors.nav : colors.card }}
                onPress={() => router.push('/(drawer)/(tabs)/invoices')}
              >
                <Ionicons name="document-text-outline" size={24} color={isDark ? '#a5b4fc' : '#4f46e5'} />
                <Text className="text-xs mt-2" style={{ color: colors.noActive }}>
                  Unpaid invoices
                </Text>
                <Text className="text-lg font-bold tabular-nums mt-1" style={{ color: colors.text }}>
                  {unpaidInvoicesCount} · {formatGBP(unpaidInvoicesTotal)}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-1 rounded-lg p-4"
                style={{ backgroundColor: isDark ? colors.nav : colors.card }}
                onPress={() => router.push('/(drawer)/(tabs)/tax')}
              >
                <Ionicons name="calculator-outline" size={24} color={isDark ? '#a5b4fc' : '#4f46e5'} />
                <Text className="text-xs mt-2" style={{ color: colors.noActive }}>
                  Q{currentQuarter} net profit
                </Text>
                <Text
                  className="text-lg font-bold tabular-nums mt-1"
                  style={{ color: currentQuarterNetProfit >= 0 ? '#39AD6A' : '#ee1c1c' }}
                >
                  {formatGBP(currentQuarterNetProfit)}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Cross-module insight — paid invoice turnover not linked to MTD */}
            {turnoverNotYetRecorded > 0 && nextDeadline ? (
              <TouchableOpacity
                className="rounded-lg p-4 mb-4 border-l-4"
                style={{
                  backgroundColor: isDark ? 'rgba(245, 158, 11, 0.12)' : 'rgba(245, 158, 11, 0.15)',
                  borderLeftColor: '#f59e0b',
                }}
                onPress={() => router.push('/(stack)/addMtdTransaction')}
              >
                <Text className="text-sm font-bold mb-1" style={{ color: colors.text }}>
                  MTD records gap
                </Text>
                <Text className="text-xs leading-5" style={{ color: colors.text }}>
                  You have {formatGBP(turnoverNotYetRecorded)} in paid invoices not yet linked in your MTD
                  records — add them before {nextDeadline.deadlineFormatted}.
                </Text>
              </TouchableOpacity>
            ) : null}

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

            {/* Recent activity */}
            {recentActivity.length > 0 ? (
              <View className="mb-6">
                <Text
                  className="text-xs font-bold uppercase tracking-widest mb-3"
                  style={{ color: colors.noActive }}
                >
                  Recent activity
                </Text>
                {recentActivity.map((item) => {
                  const icon =
                    item.module === 'mtd' ? (
                      <Ionicons name="calculator-outline" size={20} color={colors.noActive} />
                    ) : item.module === 'budget' ? (
                      <Ionicons name="wallet-outline" size={20} color={colors.noActive} />
                    ) : (
                      <Ionicons name="document-text-outline" size={20} color={colors.noActive} />
                    );
                  return (
                    <View
                      key={item.id}
                      className="flex-row items-center gap-3 py-2.5 border-b"
                      style={{ borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }}
                    >
                      {icon}
                      <View className="flex-1">
                        <Text className="text-sm" style={{ color: colors.text }} numberOfLines={1}>
                          {item.description}
                        </Text>
                        <Text className="text-xs" style={{ color: colors.noActive }}>
                          {item.date ? String(item.date).slice(0, 10) : '—'}
                        </Text>
                      </View>
                      <Text className="text-sm font-bold tabular-nums" style={{ color: colors.text }}>
                        {formatGBP(item.amount)}
                      </Text>
                    </View>
                  );
                })}
              </View>
            ) : null}

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
