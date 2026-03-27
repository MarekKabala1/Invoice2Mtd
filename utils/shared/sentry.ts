/**
 * sentry.ts
 *
 * Sentry error reporting initialization and utilities.
 * Captures unhandled exceptions and provides context for debugging production issues.
 *
 * WHY: Production error tracking helps identify bugs that users encounter but
 * don't report. Provides stack traces, user context, and breadcrumb trails.
 * Disabled in development to avoid noise during testing.
 *
 * Depends on: @sentry/react-native
 * Used by: app/_layout.tsx (initialization), throughout app for event capture
 */

import * as Sentry from '@sentry/react-native';

/**
 * Initialize Sentry for error tracking and performance monitoring.
 * Should be called once in app entry point (_layout.tsx) before any other code.
 *
 * @param dsn - Sentry DSN (project ID). Can be empty string to disable.
 */
export const initSentry = (dsn: string = '') => {
	if (!dsn) return; // Skip if no DSN provided (disabled for this deployment)

	Sentry.init({
		dsn,
		// WHY: Development env has lots of false positives during debugging.
		// Only send errors from production builds.
		environment: __DEV__ ? 'development' : 'production',
		// Capture only 10% of transactions to avoid quota overuse.
		// Important: don't log all transactions in high-volume apps.
		tracesSampleRate: __DEV__ ? 0 : 0.1,
		// WHY: Ignore common, non-fatal errors that don't need reporting.
		// Keep Sentry focused on real issues users report.
		ignoreErrors: [
			'Network request failed',
			'Request timeout',
			'NETWORK_ERROR',
		],
	});
};

/**
 * Capture an exception and send to Sentry with context.
 *
 * @param error - The error to capture
 * @param context - Additional context (user ID, screen name, etc)
 */
export const captureException = (error: Error, context?: Record<string, any>) => {
	if (__DEV__) {
		console.error('Captured exception:', error, context);
		return;
	}

	Sentry.captureException(error, context ? { contexts: { custom: context } } : undefined);
};

/**
 * Capture a message (e.g., "User clicked X button").
 * Useful for tracking user actions that led to errors.
 *
 * @param message - Message to capture
 * @param level - Severity: 'info', 'warning', 'error'
 */
export const captureMessage = (message: string, level: 'info' | 'warning' | 'error' = 'info') => {
	if (__DEV__) {
		console.log(`[${level.toUpperCase()}] ${message}`);
		return;
	}

	Sentry.captureMessage(message, level);
};

/**
 * Add breadcrumb to track user actions leading up to an error.
 * Breadcrumbs help diagnose issues by showing what the user did.
 *
 * @param message - Action description (e.g., "Saved invoice")
 * @param data - Additional data about the action
 */
export const addBreadcrumb = (message: string, data?: Record<string, any>) => {
	Sentry.captureMessage(message, 'info');

	if (!__DEV__) {
		Sentry.addBreadcrumb({
			message,
			data,
			timestamp: Date.now() / 1000,
		});
	}
};

/**
 * Set user context for error reports.
 * After calling this, all Sentry events will be tagged with this user.
 *
 * @param userId - The logged-in user's ID
 * @param email - User email (optional, for identification)
 */
export const setUserContext = (userId: string, email?: string) => {
	Sentry.setUser({
		id: userId,
		email,
	});
};

/**
 * Clear user context (e.g., on logout).
 */
export const clearUserContext = () => {
	Sentry.setUser(null);
};
