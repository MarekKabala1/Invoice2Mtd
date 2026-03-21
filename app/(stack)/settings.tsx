import React, { useEffect, useState } from 'react';
import AppSettingsForm from '@/components/AppSettingsForm';
import { AppSettingsType } from '@/db/zodSchema';
import { View } from 'react-native';
import { useAppSettings } from '@/context/AppSettingsContext';
import NoSettingsMessage from '@/components/NoSettingsMessage';
import { deleteAppSettingsInDb } from '@/utils/settingsOperations';

export default function SettingsScreen() {
	const { settings, refresh } = useAppSettings();
	const [showNoSettingsMsg, setShowNoSettingsMsg] = useState(false);

	useEffect(() => {
		setShowNoSettingsMsg(settings === null);
	}, [settings]);

	const handleSubmit = (values: AppSettingsType) => {};

	const handleDelete = async () => {
		if (settings && typeof settings.id === 'number') {
			await deleteAppSettingsInDb(settings.id);
			await refresh();
		}
	};

	return (
		<View className='flex-1 bg-light-primary dark:bg-dark-primary'>
			{showNoSettingsMsg && <NoSettingsMessage />}
			<AppSettingsForm initialValues={settings || {}} onSubmit={handleSubmit} isSaved={!!settings} onDelete={settings ? handleDelete : undefined} />
		</View>
	);
}
