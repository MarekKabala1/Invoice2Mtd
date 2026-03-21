/**
 * addMtdTransaction.tsx
 *
 * Form screen for adding manual MTD income or expense records.
 * Uses react-hook-form + zodResolver with newMtdTransactionSchema.
 * Falls back to the date's quarter automatically.
 *
 * Depends on: hooks/useMtdTransaction.ts, db/zodSchema.ts,
 *             utils/mtdCategories.ts, utils/mtdDates.ts
 * Used by: app/(drawer)/(tabs)/tax.tsx (nav tile),
 *          app/(stack)/mtdQuarterlySummary.tsx (header button)
 */

import React, { useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useMtdTransaction } from '@/hooks/useMtdTransaction';
import { newMtdTransactionSchema, NewMtdTransactionType } from '@/db/zodSchema';
import {
  EXPENSE_CATEGORY_LABELS,
  INCOME_CATEGORIES,
  EXPENSE_ONLY_CATEGORIES,
  isAllowable,
} from '@/utils/mtdCategories';
import { toISO, fromISO, quarterForDate } from '@/utils/mtdDates';
import { ExpenseCategory } from '@/types/mtd';
import { Picker } from '@react-native-picker/picker';
import DatePicker from '@/components/DatePicker';
import { useCameraScanner } from '@/hooks/useCameraScanner';
import { Ionicons } from '@expo/vector-icons';

export default function AddMtdTransactionScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const { addTransaction, isLoading } = useMtdTransaction();
  const { scannedData, handleScan, isLoading: isScanning } = useCameraScanner();

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<NewMtdTransactionType>({
    resolver: zodResolver(newMtdTransactionSchema),
    defaultValues: {
      date: toISO(new Date()),
      description: '',
      amount: undefined as unknown as number,
      type: 'expense',
      category: 'turnover',
    },
  });

  const watchedType = watch('type');
  const watchedDate = watch('date');

  // Compute quarter info from the selected date
  const quarterInfo = useMemo(() => {
    if (!watchedDate) return null;
    try {
      const date = new Date(watchedDate);
      const q = quarterForDate(date);
      return { quarter: q.quarter, label: q.label, taxYear: q.taxYear };
    } catch {
      return null;
    }
  }, [watchedDate]);

  // Categories shown in picker depend on income/expense toggle
  const pickerCategories = useMemo(() => {
    if (watchedType === 'income') {
      return INCOME_CATEGORIES.map((cat) => ({
        label: EXPENSE_CATEGORY_LABELS[cat],
        value: cat,
      }));
    }
    return EXPENSE_ONLY_CATEGORIES.map((cat) => ({
      label: EXPENSE_CATEGORY_LABELS[cat],
      value: cat,
    }));
  }, [watchedType]);

  const onSubmit = async (data: NewMtdTransactionType) => {
    try {
      // Add quarter/year prefix to description for easy identification
      const qLabel = quarterInfo ? `[Q${quarterInfo.quarter} ${quarterInfo.taxYear}] ` : '';
      const enrichedData = {
        ...data,
        description: `${qLabel}${data.description}`,
      };
      await addTransaction(enrichedData);
      Alert.alert('Saved', `Saved to Q${quarterInfo?.quarter} ${quarterInfo?.taxYear}`);
      router.back();
    } catch {
      // Error is already handled in the hook via Alert.alert
    }
  };

  return (
    <ScrollView
      className="flex-1"
      style={{ backgroundColor: colors.primary }}
      contentContainerStyle={{ padding: 20 }}
    >
      <View className="gap-4">
        {/* Income / Expense toggle */}
        <Controller
          control={control}
          name="type"
          render={({ field: { value, onChange } }) => (
            <View className="flex-row gap-2">
              <TouchableOpacity
                className="flex-1 p-3 rounded-lg"
                style={{
                  backgroundColor:
                    value === 'income'
                      ? isDark
                        ? 'rgba(57,173,106,0.3)'
                        : 'rgba(57,173,106,0.15)'
                      : isDark
                        ? colors.nav
                        : colors.card,
                  borderWidth: value === 'income' ? 2 : 0,
                  borderColor: value === 'income' ? '#39AD6A' : 'transparent',
                }}
                onPress={() => {
                  onChange('income');
                  setValue('category', 'turnover');
                }}
              >
                <Text
                  className="text-center font-bold"
                  style={{
                    color: value === 'income' ? '#39AD6A' : colors.noActive,
                  }}
                >
                  Income
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 p-3 rounded-lg"
                style={{
                  backgroundColor:
                    value === 'expense'
                      ? isDark
                        ? 'rgba(238,28,28,0.3)'
                        : 'rgba(238,28,28,0.15)'
                      : isDark
                        ? colors.nav
                        : colors.card,
                  borderWidth: value === 'expense' ? 2 : 0,
                  borderColor: value === 'expense' ? '#ee1c1c' : 'transparent',
                }}
                onPress={() => {
                  onChange('expense');
                  setValue('category', 'costOfGoodsAllowable');
                }}
              >
                <Text
                  className="text-center font-bold"
                  style={{
                    color: value === 'expense' ? '#ee1c1c' : colors.noActive,
                  }}
                >
                  Expense
                </Text>
              </TouchableOpacity>
            </View>
          )}
        />

        {/* Date */}
        <View className="gap-1">
          <Text className="text-sm" style={{ color: colors.noActive }}>
            Date
          </Text>
          <Controller
            control={control}
            name="date"
            render={({ field: { value, onChange } }) => (
              <View>
                <DatePicker
                  name=""
                  value={value ? new Date(value) : new Date()}
                  onChange={(date) => onChange(toISO(date))}
                />
                {errors.date && (
                  <Text className="text-xs mt-1" style={{ color: '#ee1c1c' }}>
                    {errors.date.message}
                  </Text>
                )}
              </View>
            )}
          />
          {/* Quarter helper pill badge */}
          {quarterInfo && (
            <View
              className="self-start px-3 py-1 rounded-full mt-1"
              style={{
                backgroundColor: isDark
                  ? 'rgba(99,102,241,0.2)'
                  : 'rgba(99,102,241,0.1)',
              }}
            >
              <Text
                className="text-xs"
                style={{ color: isDark ? '#a5b4fc' : '#4f46e5' }}
              >
                This falls in Q{quarterInfo.quarter} — {quarterInfo.label}
              </Text>
            </View>
          )}
        </View>

        {/* Amount */}
        <View className="gap-1">
          <Text className="text-sm" style={{ color: colors.noActive }}>
            Amount
          </Text>
          <Controller
            control={control}
            name="amount"
            render={({ field: { value, onChange, onBlur } }) => (
              <TextInput
                className="rounded-lg p-3"
                style={{
                  backgroundColor: isDark ? colors.nav : colors.card,
                  color: colors.text,
                  borderWidth: 1,
                  borderColor: errors.amount ? '#ee1c1c' : colors.noActive,
                }}
                keyboardType="decimal-pad"
                value={value?.toString() ?? ''}
                onChangeText={(text) => {
                  const cleaned = text.replace(/[^0-9.]/g, '');
                  const num = parseFloat(cleaned);
                  onChange(isNaN(num) ? (undefined as unknown as number) : num);
                }}
                onBlur={onBlur}
                placeholder="0.00"
                placeholderTextColor={colors.noActive}
              />
            )}
          />
          {errors.amount && (
            <Text className="text-xs" style={{ color: '#ee1c1c' }}>
              {errors.amount.message}
            </Text>
          )}
        </View>

        {/* Description */}
        <View className="gap-1">
          <Text className="text-sm" style={{ color: colors.noActive }}>
            Description
          </Text>
          <Controller
            control={control}
            name="description"
            render={({ field: { value, onChange, onBlur } }) => (
              <TextInput
                className="rounded-lg p-3"
                style={{
                  backgroundColor: isDark ? colors.nav : colors.card,
                  color: colors.text,
                  borderWidth: 1,
                  borderColor: errors.description ? '#ee1c1c' : colors.noActive,
                }}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="e.g. Office supplies"
                placeholderTextColor={colors.noActive}
              />
            )}
          />
          {errors.description && (
            <Text className="text-xs" style={{ color: '#ee1c1c' }}>
              {errors.description.message}
            </Text>
          )}
        </View>

        {/* Category picker */}
        <View className="gap-1">
          <Text className="text-sm" style={{ color: colors.noActive }}>
            HMRC Category
          </Text>
          <Controller
            control={control}
            name="category"
            render={({ field: { value, onChange } }) => (
              <View
                className="rounded-lg overflow-hidden"
                style={{
                  backgroundColor: isDark ? colors.nav : colors.card,
                  borderWidth: 1,
                  borderColor: colors.noActive,
                }}
              >
                <Picker
                  selectedValue={value}
                  onValueChange={(val) => onChange(val as ExpenseCategory)}
                  dropdownIconColor={colors.text}
                  style={{ color: colors.text }}
                >
                  {pickerCategories.map((cat) => (
                    <Picker.Item
                      key={cat.value}
                      label={cat.label}
                      value={cat.value}
                    />
                  ))}
                </Picker>
              </View>
            )}
          />
          {errors.category && (
            <Text className="text-xs" style={{ color: '#ee1c1c' }}>
              {errors.category.message}
            </Text>
          )}
        </View>

        {/* Notes (optional) */}
        <View className="gap-1">
          <Text className="text-sm" style={{ color: colors.noActive }}>
            Notes (optional)
          </Text>
          <Controller
            control={control}
            name="notes"
            render={({ field: { value, onChange, onBlur } }) => (
              <TextInput
                className="rounded-lg p-3"
                style={{
                  backgroundColor: isDark ? colors.nav : colors.card,
                  color: colors.text,
                  borderWidth: 1,
                  borderColor: colors.noActive,
                  minHeight: 80,
                  textAlignVertical: 'top',
                }}
                value={value ?? ''}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="Additional notes"
                placeholderTextColor={colors.noActive}
                multiline
              />
            )}
          />
        </View>

        {/* Receipt ref (optional) */}
        <View className="gap-1">
          <Text className="text-sm" style={{ color: colors.noActive }}>
            Receipt reference (optional)
          </Text>
          <Controller
            control={control}
            name="receiptRef"
            render={({ field: { value, onChange, onBlur } }) => (
              <TextInput
                className="rounded-lg p-3"
                style={{
                  backgroundColor: isDark ? colors.nav : colors.card,
                  color: colors.text,
                  borderWidth: 1,
                  borderColor: colors.noActive,
                }}
                value={value ?? ''}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="e.g. Receipt #123"
                placeholderTextColor={colors.noActive}
              />
            )}
          />
        </View>

        {/* Scan receipt button */}
        <TouchableOpacity
          className="p-4 rounded-lg flex-row items-center justify-center gap-2"
          style={{
            backgroundColor: isDark ? colors.nav : colors.card,
            borderWidth: 1,
            borderColor: isDark ? '#4f46e5' : '#4338ca',
          }}
          onPress={() => handleScan()}
          disabled={isScanning}
        >
          <Ionicons
            name={isScanning ? 'hourglass-outline' : 'scan-outline'}
            size={20}
            color={isDark ? '#a5b4fc' : '#4f46e5'}
          />
          <Text
            className="font-bold text-sm"
            style={{ color: isDark ? '#a5b4fc' : '#4f46e5' }}
          >
            {isScanning ? 'Scanning...' : scannedData ? 'Receipt scanned' : 'Scan Receipt'}
          </Text>
        </TouchableOpacity>

        {/* Submit */}
        <TouchableOpacity
          className="p-4 rounded-lg mt-2"
          style={{
            backgroundColor: isDark ? '#4f46e5' : '#4338ca',
            opacity: isLoading ? 0.6 : 1,
          }}
          onPress={handleSubmit(onSubmit)}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-center font-bold text-white text-base">
              Save Record
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
