import { db } from '@/db/config';
import {
	Customer,
	User,
	Estimate,
	EstimateNotes,
	EstimateTerms,
	BankDetails,
} from '@/db/schema';
import { eq } from 'drizzle-orm';
import { generateId } from './generateUuid';
import { calculateEstimateTotals } from './estimateCalculations';
import {
	CustomerType,
	EstimateType,
	EstimateNotesType,
	EstimateTermsType,
	BankDetailsType,
	UserType,
} from '@/db/zodSchema';
import { Linking } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { generateEstimateHtml } from '@/templates/estimateTemplate';
import { generateAndSaveEstimatePdf } from './pdfOperations';
import { getCustomers, getCustomerDetails } from './customerOperations';

export const getLastEstimateId = async (): Promise<string> => {
	try {
		const getEstimates = await db.select().from(Estimate);
		if (!getEstimates || getEstimates.length === 0) {
			return '0';
		}

		const sortedData = [...getEstimates].sort((a, b) => {
			const idA = a.id;
			const idB = b.id;

			const numA = Number(idA);
			const numB = Number(idB);

			if (!isNaN(numA) && !isNaN(numB)) {
				return numB - numA;
			}

			return idB.localeCompare(idA);
		});

		const mostRecentId = sortedData[0]?.id;
		if (!mostRecentId) {
			return '0';
		}
		return mostRecentId;
	} catch (error) {
		console.error('Error getting estimates:', error);
		return '0';
	}
};

export const getNextSequentialEstimateId = async (): Promise<string> => {
	try {
		const getEstimates = await db.select().from(Estimate);
		if (!getEstimates || getEstimates.length === 0) {
			return '1';
		}

		let maxNumber = 0;

		for (const estimate of getEstimates) {
			const num = Number(estimate.id);
			if (!isNaN(num) && num > maxNumber) {
				maxNumber = num;
			}
		}

		return String(maxNumber + 1);
	} catch (error) {
		console.error('Error getting next sequential estimate ID:', error);
		return '1';
	}
};

export const getUsers = async (
	isUpdateMode: boolean,
	estimateUserId?: string
): Promise<Array<{ label: string; value: string }>> => {
	try {
		const users = await db.select().from(User);
		const userOptions = users.map((user) => ({
			label: user.fullName || '',
			value: user.id,
		}));

		if (isUpdateMode && estimateUserId) {
			const selectedUser = users.find((user) => user.id === estimateUserId);
			if (selectedUser) {
				return [
					{
						label: selectedUser.fullName || '',
						value: selectedUser.id,
					},
					...userOptions.filter((option) => option.value !== estimateUserId),
				];
			}
		}

		return userOptions;
	} catch (error) {
		console.error('Error fetching users:', error);
		return [];
	}
};

export const getUserAndBankDetails = async (
	userId: string
): Promise<{
	userDetails: UserType;
	bankDetails: BankDetailsType;
}> => {
	try {
		const user = await db
			.select()
			.from(User)
			.where(eq(User.id, userId))
			.limit(1);
		const bankDetails = await db
			.select()
			.from(BankDetails)
			.where(eq(BankDetails.userId, userId))
			.limit(1);

		return {
			userDetails: user[0] as UserType,
			bankDetails: bankDetails[0] as BankDetailsType,
		};
	} catch (error) {
		console.error('Error fetching user and bank details:', error);
		throw error;
	}
};

export const handleSaveEstimate = async (
	data: EstimateType & {
		notes: EstimateNotesType[];
	},
	isUpdateMode: boolean,
	note: string,
	noteItemId?: string
): Promise<void> => {
	const { subtotal, tax, total } = calculateEstimateTotals(
		data.amountBeforeTax,
		data.taxRate,
		data.discount || 0,
		data.taxValue || false
	);

	const id = isUpdateMode
		? data.id
		: data.id && data.id.trim() !== ''
			? data.id
			: await getNextSequentialEstimateId();

	if (!isUpdateMode && data.id && data.id.trim() !== '') {
		const existingEstimate = await db
			.select()
			.from(Estimate)
			.where(eq(Estimate.id, data.id))
			.limit(1);

		if (existingEstimate.length > 0) {
			throw new Error(
				`Estimate with ID "${data.id}" already exists. Please use a different ID.`
			);
		}
	}

	const newEstimate = {
		id,
		customerId: data.customerId,
		userId: data.userId,
		estimateDate: data.estimateDate,
		estimateEndTime: data.estimateEndTime,
		currency: data.currency,
		discount: data.discount || 0,
		taxRate: data.taxRate,
		amountBeforeTax: data.amountBeforeTax,
		amountAfterTax: total,
		taxValue: data.taxValue || false,
		isAccepted: data.isAccepted || false,
	};

	try {
		if (isUpdateMode) {
			const updatedEstimate = {
				...newEstimate,
				id: data.id,
			};
			await db
				.update(Estimate)
				.set(updatedEstimate)
				.where(eq(Estimate.id, data.id));
		} else {
			await db.insert(Estimate).values(newEstimate);
		}

		await handleEstimateNotes(id, data, note, noteItemId, isUpdateMode);
	} catch (error) {
		console.error('Database error in handleSaveEstimate:', error);
		throw error;
	}
};

const handleEstimateNotes = async (
	id: string,
	data: EstimateType,
	note: string,
	noteItemId?: string,
	isUpdateMode?: boolean
): Promise<void> => {
	if (isUpdateMode && noteItemId) {
		await db
			.update(EstimateNotes)
			.set({
				noteText: note,
				noteDate: data.estimateDate,
			})
			.where(eq(EstimateNotes.id, noteItemId));
	} else {
		const noteId = await generateId();
		const estimateNote = {
			id: noteId,
			estimateId: id,
			noteDate: data.estimateDate,
			noteText: note,
		};
		await db.insert(EstimateNotes).values(estimateNote);
	}
};

export const handleSendEstimate = async (
	data: EstimateType & {
		notes: EstimateNotesType[];
	},
	selectedUser: UserType,
	selectedCustomer: CustomerType,
	bankDetails: BankDetailsType,
	note: string
): Promise<void> => {
	const { subtotal, tax, total } = calculateEstimateTotals(
		data.amountBeforeTax,
		data.taxRate,
		data.discount || 0,
		data.taxValue || false
	);

	const html = generateEstimateHtml({
		data: {
			...data,
			user: selectedUser,
			customer: selectedCustomer,
			bankDetails: bankDetails,
			notesText: note,
			notes: data.notes,
		},
		tax,
		subtotal,
		total,
	});

	try {
		const { uri } = await Print.printToFileAsync({ html });

		const isAvailable = await Sharing.isAvailableAsync();
		if (isAvailable) {
			const estimateDate = new Date(data.estimateDate).toLocaleDateString();
			const fileName = `Estimate_${data.id}_${estimateDate.replace(/\//g, '-')}.pdf`;
			const newUri = `${FileSystem.documentDirectory}${fileName}`;

			await FileSystem.moveAsync({
				from: uri,
				to: newUri,
			});

			await Sharing.shareAsync(newUri, {
				mimeType: 'application/pdf',
				dialogTitle: `Share Estimate ${data.id}`,
			});
		} else {
			throw new Error('Sharing is not available on this device.');
		}
	} catch (error) {
		console.error('Error generating or sharing PDF:', error);
		throw error;
	}
};

export const handleExportPdfEstimate = async (
	data: EstimateType & {
		notes: EstimateNotesType[];
	},
	selectedUser: UserType,
	selectedCustomer: CustomerType,
	bankDetails: BankDetailsType,
	note: string,
	isPreview: boolean
): Promise<void> => {
	const { subtotal, tax, total } = calculateEstimateTotals(
		data.amountBeforeTax,
		data.taxRate,
		data.discount || 0,
		data.taxValue || false
	);

	await generateAndSaveEstimatePdf({
		data: {
			...data,
			user: selectedUser,
			customer: selectedCustomer,
			bankDetails: bankDetails,
			notesText: note,
		},
		tax,
		subtotal,
		total,
	});
};

export const handlePreviewEstimate = (
	data: EstimateType & {
		notes: EstimateNotesType[];
	},
	selectedUser: UserType,
	selectedCustomer: CustomerType,
	bankDetails: BankDetailsType,
	note: string,
	isPreview: boolean
): string => {
	const { subtotal, tax, total } = calculateEstimateTotals(
		data.amountBeforeTax,
		data.taxRate,
		data.discount || 0,
		data.taxValue || false
	);

	return generateEstimateHtml({
		data: {
			...data,
			user: selectedUser,
			customer: selectedCustomer,
			bankDetails: bankDetails,
			notesText: note,
			notes: data.notes,
		},
		subtotal,
		tax,
		total,
		isPreview,
	});
};

export const getEstimateTerms = async (
	estimateId: string
): Promise<EstimateTermsType[]> => {
	try {
		const terms = await db
			.select()
			.from(EstimateTerms)
			.where(eq(EstimateTerms.estimateId, estimateId));

		return terms.map((term) => ({
			id: term.id,
			estimateId: term.estimateId || '',
			termText: term.termText || '',
			createdAt: term.createdAt || '',
		}));
	} catch (error) {
		console.error('Error fetching estimate terms:', error);
		return [];
	}
};

export const saveEstimateTerms = async (
	estimateId: string,
	terms: string[]
): Promise<void> => {
	try {
		await db.transaction(async (tx) => {
			await tx
				.delete(EstimateTerms)
				.where(eq(EstimateTerms.estimateId, estimateId));

			for (const termText of terms) {
				if (termText.trim()) {
					const termId = await generateId();
					await tx.insert(EstimateTerms).values({
						id: termId,
						estimateId,
						termText: termText.trim(),
					});
				}
			}
		});
	} catch (error) {
		console.error('Error saving estimate terms:', error);
		throw error;
	}
};

export const deleteEstimateTerms = async (
	estimateId: string
): Promise<void> => {
	try {
		await db
			.delete(EstimateTerms)
			.where(eq(EstimateTerms.estimateId, estimateId));
	} catch (error) {
		console.error('Error deleting estimate terms:', error);
		throw error;
	}
};
