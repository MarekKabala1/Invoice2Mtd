/**
 * mtdQuarterlySummary.tsx
 *
 * Per-quarter summary screen. Pure composition — delegates all logic
 * to QuarterlySummaryHub component.
 *
 * Depends on: components/mtd/QuarterlySummaryHub
 * Used by: app/(drawer)/(tabs)/tax.tsx (nav tile)
 */

import React from 'react';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import QuarterlySummaryHub from '@/components/mtd/QuarterlySummaryHub';

export default function MtdQuarterlySummaryScreen() {
	return <ErrorBoundary label="Quarterly Summary"><QuarterlySummaryHub /></ErrorBoundary>;
}
