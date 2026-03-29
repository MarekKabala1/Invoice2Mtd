import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { AppSettingsType } from '@/db/zodSchema';
import { getAppSettingsFromDb, updateAppSettingsInDb, insertAppSettingsInDb } from '@/utils/settings/settingsOperations';

type AppSettingsContextType = {
	settings: AppSettingsType | null;
	selectedUserId: string | null;
	refresh: () => Promise<void>;
	loadUserSettings: (userId: string) => Promise<void>;
	update: (values: Partial<AppSettingsType>) => Promise<void>;
};

const AppSettingsContext = createContext<AppSettingsContextType | undefined>(undefined);

export function AppSettingsProvider({ children }: { children: ReactNode }) {
	const [settings, setSettings] = useState<AppSettingsType | null>(null);
	const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

	const loadSettings = async (userId?: string) => {
		try {
			const existing = await getAppSettingsFromDb(userId);
			if (existing) {
				setSettings(existing);
				if (userId) setSelectedUserId(userId);
			} else {
				// First run — create default settings row with userId if provided
				const valuesObj: Partial<AppSettingsType> = {};
				if (userId) valuesObj.userId = userId;
				await insertAppSettingsInDb(valuesObj);
				const created = await getAppSettingsFromDb(userId);
				setSettings(created);
				if (userId) setSelectedUserId(userId);
			}
		} catch {
			// Database may not be ready yet (before migrations)
			setSettings(null);
		}
	};

	const refresh = async () => {
		await loadSettings(selectedUserId ?? undefined);
	};

	const loadUserSettings = async (userId: string) => {
		await loadSettings(userId);
	};

	const update = async (values: Partial<AppSettingsType>) => {
		if (!settings || typeof settings.id !== 'number') {
			const valuesObj: Partial<AppSettingsType> = { ...values };
			if (selectedUserId) valuesObj.userId = selectedUserId;
			await insertAppSettingsInDb(valuesObj);
			await loadSettings(selectedUserId ?? undefined);
			return;
		}
		await updateAppSettingsInDb(settings.id, values);
		await loadSettings(selectedUserId ?? undefined);
	};

	useEffect(() => {
		loadSettings();
	}, []);

	return <AppSettingsContext.Provider value={{ settings, selectedUserId, refresh, loadUserSettings, update }}>{children}</AppSettingsContext.Provider>;
}

export function useAppSettings(): AppSettingsContextType {
	const ctx = useContext(AppSettingsContext);
	if (!ctx) throw new Error('useAppSettings must be used within AppSettingsProvider');
	return ctx;
}
