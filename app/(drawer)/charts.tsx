/**
 * charts.tsx
 *
 * Invoice charts screen. Pure composition — delegates all logic
 * to ChartsHub component.
 *
 * Depends on: components/mtd/ChartsHub
 * Used by: app/(drawer)/_layout.tsx (drawer screen)
 */

import React from 'react';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import ChartsHub from '@/components/mtd/ChartsHub';

export default function Charts() {
	return <ErrorBoundary label="Charts"><ChartsHub /></ErrorBoundary>;
}
