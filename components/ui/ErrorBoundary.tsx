/**
 * ErrorBoundary.tsx
 *
 * React error boundary that catches render errors in child components
 * and shows a fallback UI instead of crashing the entire app.
 *
 * WHY: Without error boundaries, a crash in any screen kills the entire app.
 *       Each tab/section should fail gracefully with a retry option.
 *
 * Depends on: react (Component)
 * Used by: All tab screens and stack screens in app/
 */

import React, { Component, ReactNode } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { captureException } from '@/utils/shared/sentry';

interface ErrorBoundaryProps {
	children: ReactNode;
	fallback?: ReactNode;
	label?: string;
}

interface ErrorBoundaryState {
	hasError: boolean;
	error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
	state: ErrorBoundaryState = { hasError: false, error: null };

	static getDerivedStateFromError(error: Error): ErrorBoundaryState {
		return { hasError: true, error };
	}

	componentDidCatch(error: Error) {
		captureException(error, { action: `ErrorBoundary ${this.props.label ?? 'Unknown'}` });
	}

	reset = () => this.setState({ hasError: false, error: null });

	render() {
		if (this.state.hasError) {
			if (this.props.fallback) return this.props.fallback;

			return (
				<View className='flex-1 items-center justify-center p-6'>
					<Text className='text-lg font-bold text-center mb-2'>Something went wrong</Text>
					<Text className='text-sm text-center mb-4 text-gray-500'>
						{this.props.label ? `The ${this.props.label} screen` : 'This screen'} encountered an error.
					</Text>
					<TouchableOpacity onPress={this.reset} className='px-6 py-3 rounded-lg bg-blue-600'>
						<Text className='text-white font-bold'>Try Again</Text>
					</TouchableOpacity>
				</View>
			);
		}
		return this.props.children;
	}
}
