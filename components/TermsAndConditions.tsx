import React, { useState, useEffect } from 'react';
import {
	View,
	Text,
	SafeAreaView,
	TouchableOpacity,
	TextInput,
	Alert,
	ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { db } from '@/db/config';
import { EstimateTerms } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { generateId } from '@/utils/generateUuid';
import BaseCard from './BaseCard';
import {
	getEstimateTerms,
	saveEstimateTerms,
} from '@/utils/estimateOperations';
import { EstimateTermsType } from '@/db/zodSchema';

interface TermsAndConditionsProps {
	isGlobal?: boolean;
	estimateId?: string;
	onClose?: () => void;
}
interface TermsAndConditionsType extends Omit<EstimateTermsType, 'estimateId'> {
	id: string;
	termText: string;
}

type ExpandedState = { id: string; mode: 'view' | 'edit' } | null;

const TermsAndConditions: React.FC<TermsAndConditionsProps> = ({
	isGlobal = true,
	estimateId,
	onClose,
}) => {
	const [terms, setTerms] = useState<TermsAndConditionsType[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [expanded, setExpanded] = useState<ExpandedState>(null);
	const { colors } = useTheme();
	const [globalTerms, setGlobalTerms] = useState<EstimateTermsType[]>([]);

	useEffect(() => {
		loadTerms();
		if (!isGlobal) {
			getEstimateTerms('global').then(setGlobalTerms);
		}
	}, []);

	const loadTerms = async () => {
		const targetId = isGlobal ? 'global' : estimateId;
		if (!targetId) return;
		const existingTerms = await db
			.select()
			.from(EstimateTerms)
			.where(eq(EstimateTerms.estimateId, targetId));
		setTerms(
			existingTerms.map((term) => ({
				id: term.id,
				termText: term.termText || '',
			}))
		);
	};

	const handleAddTerm = async () => {
		setIsLoading(true);
		try {
			const termId = await generateId();
			const targetId = isGlobal ? 'global' : estimateId;
			if (!targetId) return;
			await db.insert(EstimateTerms).values({
				id: termId,
				estimateId: targetId,
				termText: '',
			});
			await loadTerms();
			// Open the new term in edit mode
			setExpanded({ id: termId, mode: 'edit' });
		} finally {
			setIsLoading(false);
		}
	};

	const handleUpdateTerm = async (id: string, value: string) => {
		setTerms((prev) =>
			prev.map((t) => (t.id === id ? { ...t, termText: value } : t))
		);
		await db
			.update(EstimateTerms)
			.set({ termText: value })
			.where(eq(EstimateTerms.id, id));
	};

	const handleLongPressDelete = (id: string) => {
		Alert.alert('Delete Term', 'Are you sure you want to delete this term?', [
			{ text: 'Cancel', style: 'cancel' },
			{ text: 'Delete', style: 'destructive', onPress: () => deleteTerm(id) },
		]);
	};

	const deleteTerm = async (id: string) => {
		await db.delete(EstimateTerms).where(eq(EstimateTerms.id, id));
		await loadTerms();
		if (expanded && expanded.id === id) setExpanded(null);
	};

	const handleClose = () => {
		if (isLoading) return;
		if (onClose) {
			onClose();
		} else {
			router.back();
		}
	};

	const handleAddGlobalTermToEstimate = async (termText: string) => {
		if (!estimateId) return;
		if (terms.some((t) => t.termText === termText)) return;
		await saveEstimateTerms(estimateId, [
			...terms.map((t) => t.termText),
			termText,
		]);
		await loadTerms();
	};

	const title = isGlobal ? 'Terms & Conditions' : 'Estimate Terms & Conditions';

	return (
		<SafeAreaView className='flex-1 bg-light-primary dark:bg-dark-primary'>
			<View className='flex-1 p-4'>
				<View className='flex-row items-center mb-6 gap-2'>
					{!isGlobal && (
						<TouchableOpacity onPress={handleClose}>
							<Ionicons
								name='arrow-back'
								size={24}
								color={colors.text}
								onPress={handleClose}
							/>
						</TouchableOpacity>
					)}
					<Text className='text-2xl font-bold text-light-text dark:text-dark-text'>
						{title}
					</Text>
				</View>
				{!isGlobal && globalTerms.length > 0 && (
					<View className='mb-4'>
						<Text className='text-lg font-semibold text-light-text dark:text-dark-text mb-2'>
							Add from predefined Terms & Conditions
						</Text>
						{globalTerms.map((term, idx) => (
							<View key={term.id} className='flex-row items-center mb-2'>
								<Text className='flex-1 text-light-text dark:text-dark-text'>
									{idx + 1}.{' '}
									{term.termText.length > 60
										? term.termText.slice(0, 60) + '...'
										: term.termText}
								</Text>
								<TouchableOpacity
									onPress={() => handleAddGlobalTermToEstimate(term.termText)}
									disabled={terms.some((t) => t.termText === term.termText)}
									className={`ml-2 px-3 py-1 rounded ${terms.some((t) => t.termText === term.termText) ? 'bg-gray-300' : 'bg-primary'}`}>
									<Text className='text-white'>Add</Text>
								</TouchableOpacity>
							</View>
						))}
					</View>
				)}
				<ScrollView className='flex-1'>
					{terms.map((term, index) => {
						const isExpanded = expanded && expanded.id === term.id;
						const isEdit = isExpanded && expanded.mode === 'edit';
						const isView = isExpanded && expanded.mode === 'view';
						const preview =
							term.termText.split('\n')[0].slice(0, 50) +
							(term.termText.length > 50 ? '...' : '');
						return (
							<BaseCard key={term.id} className='mb-4'>
								<View className='flex-row items-center mb-2 justify-between'>
									<Text className='text-sm font-semibold text-light-text dark:text-dark-text mr-2'>
										Term {index + 1}
									</Text>
									{!isGlobal && (
										<TouchableOpacity
											onPress={() => handleLongPressDelete(term.id)}>
											<Ionicons
												name='trash-outline'
												size={20}
												color={colors.text}
											/>
										</TouchableOpacity>
									)}
								</View>
								<TouchableOpacity
									onLongPress={() => handleLongPressDelete(term.id)}
									activeOpacity={0.8}>
									{isEdit ? (
										<TextInput
											value={term.termText}
											onChangeText={(value) => handleUpdateTerm(term.id, value)}
											placeholder='Enter term text...'
											multiline
											numberOfLines={4}
											className='border border-light-text/20 dark:border-dark-text/20 rounded-lg p-3 text-light-text dark:text-dark-text bg-light- dark:bg-dark-primary'
											placeholderTextColor={colors.text + '80'}
											editable={true}
										/>
									) : isView ? (
										<Text className='text-light-text dark:text-dark-text'>
											{term.termText}
										</Text>
									) : (
										<View className='flex-col'>
											<Text className='text-light-text dark:text-dark-text'>
												{preview}
											</Text>
											<View className='flex-row justify-end gap-2'>
												<TouchableOpacity
													onPress={() =>
														setExpanded({ id: term.id, mode: 'view' })
													}
													className='flex-row items-center bg-primary px-3 py-2 rounded-lg'>
													<Ionicons
														name='eye-outline'
														size={16}
														color={colors.text}
													/>
													<Text className='text-light-text dark:text-dark-text ml-1 text-sm font-medium'>
														View
													</Text>
												</TouchableOpacity>
												<TouchableOpacity
													onPress={() =>
														setExpanded({ id: term.id, mode: 'edit' })
													}
													className='flex-row items-center text-light-text dark:text-dark-text px-3 py-2 rounded-lg'>
													<Ionicons
														name='create-outline'
														size={16}
														color={colors.text}
													/>
													<Text className=' text-light-text dark:text-dark-text ml-1 text-sm font-medium'>
														Edit
													</Text>
												</TouchableOpacity>
											</View>
										</View>
									)}
									{isExpanded && (
										<TouchableOpacity
											onPress={() => setExpanded(null)}
											className='mt-2 flex-row items-center justify-end'>
											<Ionicons name='close' size={18} color={colors.text} />
											<Text className='ml-1 text-light-text dark:text-dark-text text-xs'>
												Close
											</Text>
										</TouchableOpacity>
									)}
								</TouchableOpacity>
							</BaseCard>
						);
					})}
				</ScrollView>
				<TouchableOpacity
					onPress={handleAddTerm}
					disabled={isLoading}
					className='flex-row items-center justify-center p-4 border border-dashed border-light-text/30 dark:border-dark-text/30 rounded-lg mt-4'>
					<Ionicons name='add-circle-outline' size={20} color={colors.text} />
					<Text className='text-light-text dark:text-dark-text ml-2'>
						Add Another Term
					</Text>
				</TouchableOpacity>
			</View>
		</SafeAreaView>
	);
};

export default TermsAndConditions;
