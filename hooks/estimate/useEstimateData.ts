import { useLocalSearchParams } from 'expo-router';
import { EstimateType, EstimateNotesType } from '@/db/zodSchema';

interface ParsedEstimateData {
	isUpdateMode: boolean;
	estimateData?: EstimateType;
	notes: Array<{ id: string; noteText: string }>;
}

export const useEstimateData = (): ParsedEstimateData => {
	const params = useLocalSearchParams();
	const isUpdateMode = params?.mode === 'update';

	const estimateData =
		typeof params.estimate === 'string'
			? JSON.parse(params.estimate)
			: params.estimate;

	let notes: Array<{ id: string; noteText: string }> = [];
	if (params.notes) {
		if (typeof params.notes === 'string') {
			try {
				notes = JSON.parse(params.notes);
			} catch {
				notes = JSON.parse(`[${params.notes}]`);
			}
		} else if (Array.isArray(params.notes)) {
			notes = params.notes.map((item) =>
				typeof item === 'string' ? JSON.parse(item) : item
			);
		}
	}

	return {
		isUpdateMode,
		estimateData,
		notes,
	};
};
