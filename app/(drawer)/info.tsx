/**
 * info.tsx
 *
 * MTD reference and help screen. Pure composition — delegates all logic
 * to InfoContent component.
 *
 * Depends on: components/mtd/InfoContent
 * Used by: app/(drawer)/_layout.tsx (drawer screen)
 */

import React from 'react';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import InfoContent from '@/components/mtd/InfoContent';

export default function InfoScreen() {
	return <ErrorBoundary label="Info"><InfoContent /></ErrorBoundary>;
}
