/**
 * addMtdTransaction.tsx
 *
 * Form screen for adding manual MTD income or expense records.
 * Pure composition — delegates all logic to AddMtdTransactionForm component.
 *
 * Depends on: components/mtd/AddMtdTransactionForm
 * Used by: app/(drawer)/(tabs)/tax.tsx (nav tile),
 *          app/(stack)/mtdQuarterlySummary.tsx (header button)
 */

import React from 'react';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import AddMtdTransactionForm from '@/components/mtd/AddMtdTransactionForm';

export default function AddMtdTransactionScreen() {
	return <ErrorBoundary label="Add MTD Record"><AddMtdTransactionForm /></ErrorBoundary>;
}
