import { BankDetailsType, InvoiceType, UserType } from '@/db/zodSchema';

export const emailReminderTemplate = (
	invoice: InvoiceType,
	clientName: string,
	bankDetails: BankDetailsType,
	userDetails: UserType
) => {
	const daysOverdue = Math.floor(
		(new Date().getTime() - new Date(invoice.dueDate).getTime()) /
			(1000 * 60 * 60 * 24)
	);

	return `
<html>
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Payment Reminder</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.4; color: #333; margin: 0; padding: 0; background-color: #f5f5f5;">
	<div style="max-width: 600px; margin: 0 auto; padding: 15px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
		<div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 15px;">
			<h2 style="margin: 0; color: #2c3e50; font-size: 22px;">Payment Reminder - Invoice Overdue</h2>
		</div>

		<p style="margin: 10px 0; color: #333;">Dear ${clientName || 'Valued Client'},</p>

		<p style="margin: 10px 0; color: #333;">We hope this message finds you well. This is a friendly reminder that your payment for the following invoice is now overdue:</p>

		<div style="background-color: #fff3cd; padding: 12px; border-radius: 5px; margin: 15px 0; border: 1px solid #ffeaa7;">
			<p style="margin: 0 0 8px 0; font-weight: bold; color: #333;">Invoice Details:</p>
			<p style="margin: 3px 0; color: #333;">• Invoice Number: <strong>${invoice.id}</strong></p>
			<p style="margin: 3px 0; color: #333;">• Due Date: <strong>${new Date(invoice.dueDate).toLocaleDateString()}</strong></p>
			<p style="margin: 3px 0; color: #333;">• Amount Due: <span style="font-size: 1.1em; font-weight: bold; color: #2c3e50;">${invoice.currency || '$'}${invoice.amountAfterTax}</span></p>
			<p style="margin: 3px 0; color: #dc3545; font-weight: bold;">• Days Overdue: ${daysOverdue} days</p>
		</div>

		<p style="margin: 10px 0; color: #333;">We understand that oversights can happen, and we would appreciate your prompt attention to this matter. Please arrange payment at your earliest convenience to avoid any potential service interruptions.</p>

		<p style="margin: 10px 0; font-weight: bold; color: #333;">Payment Instructions:</p>

		<div style="background-color: #f8f9fa; padding: 12px; border-radius: 5px; margin: 15px 0; border: 1px solid #dee2e6;">
			<p style="margin: 0 0 8px 0; font-weight: bold; color: #333;">Bank Transfer Details:</p>
			<p style="margin: 3px 0; color: #333;">• Account Name: ${bankDetails.accountName}</p>
			<p style="margin: 3px 0; color: #333;">• Account Number: ${bankDetails.accountNumber}</p>
			<p style="margin: 3px 0; color: #333;">• Sort Code: ${bankDetails.sortCode}</p>
			<p style="margin: 3px 0; color: #333;">• Bank Name: ${bankDetails.bankName}</p>
			<p style="margin: 3px 0; color: #333; font-weight: bold;">• Reference: ${clientName}-${invoice.id}</p>
		</div>

		<p style="margin: 10px 0; color: #333;">If you have already processed this payment, please disregard this notice. However, if you have any questions about this invoice or need to discuss payment arrangements, please don't hesitate to contact us immediately.</p>

		<p style="margin: 10px 0; color: #333;">We value our business relationship and look forward to resolving this matter promptly.</p>

		<p style="margin: 5px 0; color: #333;">
			Best regards,<br>
			${userDetails.fullName || 'Your Name'}<br>
			${userDetails.emailAddress || 'your@email.com'}<br>
			${userDetails.phoneNumber || 'Phone Number'}
		</p>

		<div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #eee;">
			<p style="margin: 0; font-size: 0.9em; color: #666; font-style: italic;">This is an automated reminder. Please contact us if you believe this notice was sent in error.</p>
		</div>
	</div>
</body>
</html>
	`;
};
