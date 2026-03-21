/**
 * mtdQuarterlySummary.tsx
 *
 * Per-quarter summary screen. Horizontal Q1-Q4 tabs show income, allowable
 * expenses (per HMRC category), disallowable expenses, net profit, and a
 * quarterly tax estimate. Shows individual MTD transactions with delete.
 *
 * Depends on: hooks/useMtdData.ts, hooks/useMtdTransaction.ts,
 *             utils/mtdCategories.ts, utils/mtdTaxCalc.ts, db/mtdOperations.ts
 * Used by: app/(drawer)/(tabs)/tax.tsx (nav tile)
 */

import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useAppSettings } from '@/context/AppSettingsContext';
import { useMtdData } from '@/hooks/useMtdData';
import { EXPENSE_CATEGORY_LABELS, isAllowable } from '@/utils/mtdCategories';
import { currentTaxYearStart, taxYearLabel } from '@/utils/mtdDates';
import { estimateTax, formatGBP } from '@/utils/mtdTaxCalc';
import { useTaxRates } from '@/hooks/useTaxRates';
import { ExpenseCategory, EXPENSE_CATEGORIES } from '@/types/mtd';
import { getMtdTransactions } from '@/db/mtdOperations';
import { Ionicons } from '@expo/vector-icons';
import { deleteMtdTransactionSync } from '@/utils/invoiceSync';

const QUARTERS: Array<{ num: 1 | 2 | 3 | 4; label: string }> = [
  { num: 1, label: 'Q1' },
  { num: 2, label: 'Q2' },
  { num: 3, label: 'Q3' },
  { num: 4, label: 'Q4' },
];

export default function MtdQuarterlySummaryScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { settings } = useAppSettings();
  const userId = settings?.userId ?? '';
  const rates = useTaxRates();

  const startYear = currentTaxYearStart();

  // Use taxYear from params if provided (from deadlines), otherwise current year
  const tyLabel = params.taxYear ? (params.taxYear as string) : taxYearLabel(startYear);

  // Pre-select quarter if passed via navigation params (from deadlines)
  const initialQuarter = (() => {
    const q = parseInt(params.quarter as string);
    return q >= 1 && q <= 4 ? (q as 1 | 2 | 3 | 4) : 1;
  })();

  const [selectedQuarter, setSelectedQuarter] = useState<1 | 2 | 3 | 4>(initialQuarter);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [txLoading, setTxLoading] = useState(false);

  const { aggregates, isLoading, error, refresh } = useMtdData({
    taxYear: tyLabel,
    quarter: selectedQuarter,
    userId,
  });
  // Fetch individual MTD transactions for the selected quarter
  const fetchTransactions = useCallback(async () => {
    setTxLoading(true);
    try {
      const txns = await getMtdTransactions(tyLabel, selectedQuarter);
      setTransactions(txns);
    } catch (err) {
      console.error('Failed to fetch MTD transactions:', err);
    } finally {
      setTxLoading(false);
    }
  }, [tyLabel, selectedQuarter]);

  useFocusEffect(
    useCallback(() => {
      fetchTransactions();
    }, [fetchTransactions])
  );

  // Delete MTD record — cascades to budget + invoice via sync service
  const handleDelete = (tx: any) => {
    Alert.alert(
      'Delete Record',
      `Delete "${tx.description}" (${formatGBP(tx.amount)})?` +
      (tx.transactionId ? '\n\nLinked budget entry will also be deleted.' : '') +
      (tx.invoiceId ? '\n\nLinked invoice will be marked as unpaid.' : ''),
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMtdTransactionSync(tx.id);
              fetchTransactions();
              refresh();
            } catch (err) {
              Alert.alert('Error', 'Failed to delete record');
            }
          },
        },
      ]
    );
  };

  // Build expense rows from aggregates
  const expenseRows = useMemo(() => {
    if (!aggregates) return [];
    return EXPENSE_CATEGORIES.filter((cat) => cat !== 'turnover').map((cat) => ({
      category: cat,
      label: EXPENSE_CATEGORY_LABELS[cat],
      amount: (aggregates as any)[cat] as number,
      allowable: isAllowable(cat),
    }));
  }, [aggregates]);

  const allowableRows = expenseRows.filter((r) => r.allowable);
  const disallowableRows = expenseRows.filter((r) => !r.allowable);

  // Quarterly tax estimate
  const taxEstimate = useMemo(() => {
    if (!aggregates) return null;
    return estimateTax(aggregates.totalTurnover, aggregates.totalAllowableExpenses, rates);
  }, [aggregates, rates]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: colors.primary }}>
        <ActivityIndicator size="large" color={colors.text} />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center px-6" style={{ backgroundColor: colors.primary }}>
        <Text className="text-base text-center mb-4" style={{ color: '#ee1c1c' }}>
          {error}
        </Text>
        <TouchableOpacity
          className="px-6 py-3 rounded-lg"
          style={{ backgroundColor: isDark ? colors.nav : colors.card }}
          onPress={refresh}
        >
          <Text style={{ color: colors.text }}>Try again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1"
      style={{ backgroundColor: colors.primary }}
      contentContainerStyle={{ padding: 20 }}
    >
      {/* Quarter tabs */}
      <View className="flex-row gap-2 mb-4">
        {QUARTERS.map((q) => {
          const isSelected = selectedQuarter === q.num;
          return (
            <TouchableOpacity
              key={q.num}
              className="flex-1 py-2 rounded-lg items-center"
              style={{
                backgroundColor: isSelected
                  ? isDark ? '#4f46e5' : '#4338ca'
                  : isDark ? colors.nav : colors.card,
              }}
              onPress={() => setSelectedQuarter(q.num)}
            >
              <Text
                className="font-bold text-sm"
                style={{ color: isSelected ? 'white' : colors.text }}
              >
                {q.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Period info */}
      {aggregates && (
        <View
          className="rounded-lg p-4 mb-4"
          style={{ backgroundColor: isDark ? colors.nav : colors.card }}
        >
          <Text className="text-sm" style={{ color: colors.noActive }}>
            Tax year {tyLabel}
          </Text>
          <Text className="text-xs mt-1" style={{ color: colors.noActive }}>
            {QUARTERS[selectedQuarter - 1].label} period
          </Text>
        </View>
      )}

      {!aggregates || (aggregates.totalTurnover === 0 && aggregates.totalAllowableExpenses === 0) ? (
        <View className="items-center py-8">
          <Ionicons name="document-text-outline" size={48} color={colors.noActive} />
          <Text className="text-lg font-bold mt-4" style={{ color: colors.text }}>
            No data for Q{selectedQuarter}
          </Text>
          <Text className="text-sm mt-2 text-center" style={{ color: colors.noActive }}>
            Add income or expense records, or mark invoices as paid to see data here.
          </Text>
          <TouchableOpacity
            className="mt-4 px-6 py-3 rounded-lg"
            style={{ backgroundColor: isDark ? '#4f46e5' : '#4338ca' }}
            onPress={() => router.push('/(stack)/addMtdTransaction')}
          >
            <Text className="text-white font-bold">Add Record</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* Income card */}
          <View
            className="rounded-lg p-4 mb-4 border-l-4"
            style={{
              backgroundColor: isDark ? colors.nav : colors.card,
              borderLeftColor: '#39AD6A',
            }}
          >
            <Text className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#39AD6A' }}>
              Income
            </Text>
            <View className="flex-row justify-between items-center">
              <Text className="text-sm" style={{ color: colors.text }}>
                Total turnover
              </Text>
              <Text className="text-lg font-bold tabular-nums" style={{ color: colors.text }}>
                {formatGBP(aggregates.totalTurnover)}
              </Text>
            </View>
            {/* Source breakdown */}
            {aggregates.sources.invoiceTurnover > 0 && (
              <Text className="text-xs mt-2" style={{ color: colors.noActive }}>
                From invoices: {formatGBP(aggregates.sources.invoiceTurnover)}
              </Text>
            )}
            {aggregates.sources.manualTurnover > 0 && (
              <Text className="text-xs" style={{ color: colors.noActive }}>
                Manual records: {formatGBP(aggregates.sources.manualTurnover)}
              </Text>
            )}
          </View>

          {/* Allowable expenses card */}
          <View
            className="rounded-lg p-4 mb-4 border-l-4"
            style={{
              backgroundColor: isDark ? colors.nav : colors.card,
              borderLeftColor: isDark ? '#a5b4fc' : '#4f46e5',
            }}
          >
            <Text
              className="text-xs font-bold uppercase tracking-widest mb-2"
              style={{ color: isDark ? '#a5b4fc' : '#4f46e5' }}
            >
              Allowable Expenses
            </Text>
            {allowableRows.map((row) => (
              <View
                key={row.category}
                className="flex-row justify-between items-center py-1"
                style={{ opacity: row.amount === 0 ? 0.4 : 1 }}
              >
                <Text className="text-sm flex-1" style={{ color: colors.text }}>
                  {row.label}
                </Text>
                <Text className="text-sm tabular-nums" style={{ color: colors.text }}>
                  {formatGBP(row.amount)}
                </Text>
              </View>
            ))}
            <View className="flex-row justify-between items-center pt-2 mt-2" style={{ borderTopWidth: 1, borderTopColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
              <Text className="text-sm font-bold" style={{ color: colors.text }}>
                Total allowable
              </Text>
              <Text className="text-sm font-bold tabular-nums" style={{ color: colors.text }}>
                {formatGBP(aggregates.totalAllowableExpenses)}
              </Text>
            </View>
          </View>

          {/* Disallowable expenses card */}
          {disallowableRows.some((r) => r.amount > 0) && (
            <View
              className="rounded-lg p-4 mb-4 border-l-4"
              style={{
                backgroundColor: isDark ? colors.nav : colors.card,
                borderLeftColor: '#f59e0b',
              }}
            >
              <Text className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#f59e0b' }}>
                Disallowable Expenses
              </Text>
              <Text className="text-xs mb-2" style={{ color: colors.noActive }}>
                Tracked but not deducted from taxable profit
              </Text>
              {disallowableRows.map((row) => (
                <View
                  key={row.category}
                  className="flex-row justify-between items-center py-1"
                  style={{ opacity: row.amount === 0 ? 0.4 : 1 }}
                >
                  <Text className="text-sm flex-1" style={{ color: colors.text }}>
                    {row.label}
                  </Text>
                  <Text className="text-sm tabular-nums" style={{ color: colors.text }}>
                    {formatGBP(row.amount)}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Net profit */}
          <View
            className="rounded-lg p-4 mb-4"
            style={{ backgroundColor: isDark ? colors.nav : colors.card }}
          >
            <View className="flex-row justify-between items-center">
              <Text className="text-base font-bold" style={{ color: colors.text }}>
                Net Profit
              </Text>
              <Text
                className="text-xl font-bold tabular-nums"
                style={{ color: aggregates.netProfit >= 0 ? '#39AD6A' : '#ee1c1c' }}
              >
                {formatGBP(aggregates.netProfit)}
              </Text>
            </View>
          </View>

          {/* Quarterly tax estimate */}
          {taxEstimate && (
            <View
              className="rounded-lg p-4 mb-4"
              style={{ backgroundColor: isDark ? colors.nav : colors.card }}
            >
              <Text className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: colors.noActive }}>
                Quarterly Tax Estimate
              </Text>
              <View className="flex-row justify-between py-1">
                <Text className="text-sm" style={{ color: colors.text }}>Income Tax</Text>
                <Text className="text-sm tabular-nums" style={{ color: colors.text }}>
                  {formatGBP(taxEstimate.totalIncomeTax)}
                </Text>
              </View>
              <View className="flex-row justify-between py-1">
                <Text className="text-sm" style={{ color: colors.text }}>National Insurance</Text>
                <Text className="text-sm tabular-nums" style={{ color: colors.text }}>
                  {formatGBP(taxEstimate.totalNI)}
                </Text>
              </View>
              <View className="flex-row justify-between items-center pt-2 mt-2" style={{ borderTopWidth: 1, borderTopColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
                <Text className="text-sm font-bold" style={{ color: colors.text }}>
                  Est. to set aside
                </Text>
                <Text className="text-lg font-bold tabular-nums" style={{ color: colors.text }}>
                  {formatGBP(taxEstimate.quarterlySetAside)}
                </Text>
              </View>
              <Text className="text-xs mt-2" style={{ color: colors.noActive }}>
                ESTIMATES ONLY — not official HMRC calculations.
              </Text>
            </View>
          )}

          {/* Add record button */}
          <TouchableOpacity
            className="p-4 rounded-lg items-center"
            style={{ backgroundColor: isDark ? '#4f46e5' : '#4338ca' }}
            onPress={() => router.push('/(stack)/addMtdTransaction')}
          >
            <Text className="text-white font-bold">Add Record to Q{selectedQuarter}</Text>
          </TouchableOpacity>

          {/* Transaction list */}
          {transactions.length > 0 && (
            <View className="mt-4">
              <Text
                className="text-xs font-bold uppercase tracking-widest mb-3"
                style={{ color: colors.noActive }}
              >
                Records ({transactions.length})
              </Text>
              {txLoading ? (
                <ActivityIndicator size="small" color={colors.text} />
              ) : (
                transactions.map((tx) => (
                  <View
                    key={tx.id}
                    className="flex-row items-center justify-between p-3 rounded-lg mb-2 border-l-4"
                    style={{
                      backgroundColor: isDark ? colors.nav : colors.card,
                      borderLeftColor: tx.type === 'income' ? '#39AD6A' : '#ee1c1c',
                    }}
                  >
                    <View className="flex-1 mr-3">
                      <Text className="text-sm font-bold" style={{ color: colors.text }}>
                        {tx.description}
                      </Text>
                      <Text className="text-xs" style={{ color: colors.noActive }}>
                        {tx.date} · {EXPENSE_CATEGORY_LABELS[tx.category as ExpenseCategory] ?? tx.category}
                      </Text>
                    </View>
                    <View className="flex-row items-center gap-3">
                      <Text
                        className="text-sm font-bold tabular-nums"
                        style={{ color: tx.type === 'income' ? '#39AD6A' : '#ee1c1c' }}
                      >
                        {tx.type === 'income' ? '+' : '-'}{formatGBP(tx.amount)}
                      </Text>
                      <TouchableOpacity onPress={() => handleDelete(tx)}>
                        <Ionicons name="trash-outline" size={18} color="#ee1c1c" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}
