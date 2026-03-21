import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import { Platform, Alert } from 'react-native';
import { generateInvoiceHtml } from '@/templates/invoiceTemplate';
import {
	InvoiceType,
	UserType,
	CustomerType,
	BankDetailsType,
	WorkInformationType,
	PaymentType,
} from '@/db/zodSchema';
import { generateEstimateHtml } from '@/templates/estimateTemplate';
import { EstimateType, EstimateNotesType } from '@/db/zodSchema';
import {
	requestMediaLibraryPermission,
	getOrCreateInvoiceStorageDirectory,
	getOrCreateEstimateStorageDirectory,
	resetInvoiceStorageDirectory,
	resetEstimateStorageDirectory,
} from './permissions';

type GeneratePdfParams = {
	data: InvoiceType & {
		workItems: WorkInformationType[];
		payments: PaymentType[];
		user: UserType;
		customer: CustomerType;
		bankDetails: BankDetailsType;
		notes: string;
	};
	tax: number;
	subtotal: number;
	total: number;
	remainingBalance: number;
};

export const generateAndSavePdf = async (params: GeneratePdfParams) => {
	try {
		if (!(await requestMediaLibraryPermission())) {
			return false;
		}

		const html = generateInvoiceHtml(params);
		const filename = `Invoice_${params.data.id}_${params.data.invoiceDate.toString().split('T')[0]}.pdf`;

		const { uri: tempUri } = await Print.printToFileAsync({
			html,
			base64: false,
		});

		if (Platform.OS === 'android') {
			await handleAndroidInvoicePdfSave(tempUri, filename);
		} else {
			await handleIosPdfSave(html, filename);
		}

		await cleanupTempFile(tempUri);

		Alert.alert(
			'Success',
			Platform.OS === 'android'
				? 'PDF has been saved to your selected folder'
				: 'PDF has been shared'
		);

		return true;
	} catch (error) {
		console.error('Error generating or saving PDF:', error);
		Alert.alert(
			'Error',
			`Failed to generate or save PDF: ${error instanceof Error ? error.message : 'Unknown error'}`
		);
		return false;
	}
};

const handleAndroidInvoicePdfSave = async (tempUri: string, filename: string) => {
	try {
		const directoryUri = await getOrCreateInvoiceStorageDirectory();

		if (!directoryUri) {
			return;
		}

		const base64 = await FileSystem.readAsStringAsync(tempUri, {
			encoding: FileSystem.EncodingType.Base64,
		});

		const fileUri = await FileSystem.StorageAccessFramework.createFileAsync(
			directoryUri,
			filename,
			'application/pdf'
		);

		await FileSystem.writeAsStringAsync(fileUri, base64, {
			encoding: FileSystem.EncodingType.Base64,
		});
	} catch (error) {
		console.error('Error saving invoice PDF on Android:', error);
		if (error instanceof Error && error.message.includes('Permission denied')) {
			await resetInvoiceStorageDirectory();
		} else {
			throw error;
		}
	}
};

const handleAndroidEstimatePdfSave = async (tempUri: string, filename: string) => {
	try {
		const directoryUri = await getOrCreateEstimateStorageDirectory();

		if (!directoryUri) {
			return;
		}

		const base64 = await FileSystem.readAsStringAsync(tempUri, {
			encoding: FileSystem.EncodingType.Base64,
		});

		const fileUri = await FileSystem.StorageAccessFramework.createFileAsync(
			directoryUri,
			filename,
			'application/pdf'
		);

		await FileSystem.writeAsStringAsync(fileUri, base64, {
			encoding: FileSystem.EncodingType.Base64,
		});
	} catch (error) {
		console.error('Error saving estimate PDF on Android:', error);
		if (error instanceof Error && error.message.includes('Permission denied')) {
			await resetEstimateStorageDirectory();
		} else {
			throw error;
		}
	}
};

const handleIosPdfSave = async (html: string, filename: string) => {
	const { uri } = await Print.printToFileAsync({ html });
	const pdfPath = `${FileSystem.cacheDirectory}${filename}`;

	await FileSystem.copyAsync({
		from: uri,
		to: pdfPath,
	});

	const isSharingAvailable = await Sharing.isAvailableAsync();

	if (isSharingAvailable) {
		await Sharing.shareAsync(pdfPath, {
			mimeType: 'application/pdf',
			dialogTitle: 'Share Invoice PDF',
			UTI: 'com.adobe.pdf',
		});
	}

	await FileSystem.deleteAsync(uri, { idempotent: true });
	await FileSystem.deleteAsync(pdfPath, { idempotent: true });
};

const cleanupTempFile = async (tempUri: string) => {
	try {
		await FileSystem.deleteAsync(tempUri, { idempotent: true });
	} catch (error) {
		console.error('Error cleaning up temp file:', error);
	}
};

export const resetStoredDirectoryPermissions = resetInvoiceStorageDirectory;

type GenerateEstimatePdfParams = {
	data: EstimateType & {
		notes: EstimateNotesType[];
		user: UserType;
		customer: CustomerType;
		bankDetails: BankDetailsType;
		notesText?: string;
		terms?: string[];
	};
	tax: number;
	subtotal: number;
	total: number;
};

export const generateAndSaveEstimatePdf = async (
	params: GenerateEstimatePdfParams
) => {
	try {
		if (!(await requestMediaLibraryPermission())) {
			return false;
		}

		const html = generateEstimateHtml(params);
		const filename = `Estimate_${params.data.id}_${params.data.estimateDate.toString().split('T')[0]}.pdf`;

		const { uri: tempUri } = await Print.printToFileAsync({
			html,
			base64: false,
		});

		if (Platform.OS === 'android') {
			await handleAndroidEstimatePdfSave(tempUri, filename);
		} else {
			await handleIosEstimatePdfSave(html, filename);
		}

		await cleanupTempFile(tempUri);

		Alert.alert(
			'Success',
			Platform.OS === 'android'
				? 'PDF has been saved to your selected folder'
				: 'PDF has been shared'
		);

		return true;
	} catch (error) {
		console.error('Error generating or saving Estimate PDF:', error);
		Alert.alert(
			'Error',
			`Failed to generate or save Estimate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`
		);
		return false;
	}
};

const handleIosEstimatePdfSave = async (html: string, filename: string) => {
	const { uri } = await Print.printToFileAsync({ html });
	const pdfPath = `${FileSystem.cacheDirectory}${filename}`;

	await FileSystem.copyAsync({
		from: uri,
		to: pdfPath,
	});

	const isSharingAvailable = await Sharing.isAvailableAsync();

	if (isSharingAvailable) {
		await Sharing.shareAsync(pdfPath, {
			mimeType: 'application/pdf',
			dialogTitle: 'Share Estimate PDF',
			UTI: 'com.adobe.pdf',
		});
	}

	await FileSystem.deleteAsync(uri, { idempotent: true });
	await FileSystem.deleteAsync(pdfPath, { idempotent: true });
};

export const resetInvoiceStorage = resetInvoiceStorageDirectory;
export const resetEstimateStorage = resetEstimateStorageDirectory;
export const getInvoiceStorageLocation = async () => {
	return await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
};
export const getEstimateStorageLocation = async () => {
	return await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
};
