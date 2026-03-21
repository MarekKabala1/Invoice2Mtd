import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { AppSettingsType } from '@/db/zodSchema';
import { getAppSettingsFromDb, updateAppSettingsInDb, insertAppSettingsInDb, deleteAppSettingsInDb } from '@/utils/settingsOperations';

type AppSettingsContextType = {
	settings: AppSettingsType | null;
	refresh: () => Promise<void>;
	update: (values: Partial<AppSettingsType>) => Promise<void>;
};

const AppSettingsContext = createContext<AppSettingsContextType | undefined>(undefined);

export function AppSettingsProvider({ children }: { children: ReactNode }) {
	const [settings, setSettings] = useState<AppSettingsType | null>(null);

	const loadSettings = async () => {
		const settings = await getAppSettingsFromDb();
		setSettings(settings);
	};

	const refresh = async () => {
		await loadSettings();
	};

	const update = async (values: Partial<AppSettingsType>) => {
		if (!settings || typeof settings.id !== 'number') {
			await insertAppSettingsInDb(values);
			await loadSettings();
			return;
		}
		await updateAppSettingsInDb(settings.id, values);
		await loadSettings();
	};

	useEffect(() => {
		loadSettings();
	}, []);

	return <AppSettingsContext.Provider value={{ settings, refresh, update }}>{children}</AppSettingsContext.Provider>;
}

export function useAppSettings(): AppSettingsContextType {
	const ctx = useContext(AppSettingsContext);
	if (!ctx) throw new Error('useAppSettings must be used within AppSettingsProvider');
	return ctx;
}
