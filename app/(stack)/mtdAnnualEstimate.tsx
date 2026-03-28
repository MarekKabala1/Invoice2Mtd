/**
 * mtdAnnualEstimate.tsx
 *
 * SA103-style Self Assessment summary screen. Pure composition — delegates
 * all logic to AnnualEstimateHub component.
 *
 * Depends on: components/mtd/AnnualEstimateHub
 * Used by: app/(drawer)/(tabs)/tax.tsx (nav tile)
 */

import React from 'react';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import AnnualEstimateHub from '@/components/mtd/AnnualEstimateHub';

export default function MtdAnnualEstimateScreen() {
	return <ErrorBoundary label="Annual Estimate"><AnnualEstimateHub /></ErrorBoundary>;
}
