import { Linking } from 'react-native';
import { emailReminderTemplate } from '@/templates/emailRemaiderTemplate';
import {
	getUserAndBankDetails,
	getCustomerDetails,
	getUsers,
} from './invoiceFormOperations';
import { InvoiceType, CustomerType, UserType } from '@/db/zodSchema';
import { convertHtmlToText } from './textHelpers';

export const sendPaymentReminder = async (
	invoice: InvoiceType,
	customer: CustomerType,
	user: UserType
): Promise<'success'> => {
	const customerDetails = await getCustomerDetails(invoice.customerId);
	if (!customerDetails || !customerDetails.emailAddress) {
		throw new Error('Customer does not have an email address.');
	}
	const { userDetails, bankDetails } = await getUserAndBankDetails(
		invoice.userId
	);
	if (!userDetails) {
		throw new Error('User details are missing for this invoice.');
	}
	if (!bankDetails) {
		throw new Error('Bank details are missing for this user.');
	}

	const html = emailReminderTemplate(
		invoice,
		customerDetails.name,
		bankDetails,
		userDetails
	);

	const subject = `Payment Reminder: Invoice #${invoice.id} is overdue`;
	const body = convertHtmlToText(html);

	const mailtoUrl = `mailto:${customerDetails.emailAddress}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

	try {
		const supported = await Linking.canOpenURL(mailtoUrl);
		if (supported) {
			await Linking.openURL(mailtoUrl);
			return 'success';
		} else {
			throw new Error(
				'No email app is available. Please install an email app like Gmail.'
			);
		}
	} catch (error) {
		throw new Error(
			'Failed to open email app. Please install an email app like Gmail.'
		);
	}
};
