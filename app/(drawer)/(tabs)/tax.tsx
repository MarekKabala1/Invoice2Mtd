/**
 * tax.tsx
 *
 * Tax tab — the MTD hub screen. Pure composition — delegates all logic
 * to TaxHub component.
 *
 * Depends on: components/mtd/TaxHub
 * Used by: app/(drawer)/(tabs)/_layout.tsx (tab entry)
 */

import React from 'react';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import TaxHub from '@/components/mtd/TaxHub';

export default function TaxScreen() {
	return <ErrorBoundary label="Tax"><TaxHub /></ErrorBoundary>;
}
