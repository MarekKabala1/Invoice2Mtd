import {
	InvoiceType,
	WorkInformationType,
	PaymentType,
	UserType,
	CustomerType,
	BankDetailsType,
} from '@/db/zodSchema';
import { getCurrencySymbol } from '@/utils/getCurrencySymbol';

interface ThemeColors {
	background?: string;
	primary?: string;
	primaryLight?: string;
	secondary?: string;
	accent?: string;
	textLight?: string;
	textDark?: string;
	danger?: string;
	mutedForeground?: string;
}

interface TemplateData {
	data: InvoiceType & {
		workItems: WorkInformationType[];
		payments: PaymentType[];
		user: UserType;
		customer: CustomerType;
		bankDetails: BankDetailsType;
		notes?: string;
		paymants?: PaymentType[];
	};
	subtotal: number;
	tax: number;
	total: number;
	remainingBalance: number;
	themeColors?: ThemeColors;
	isPreview?: boolean;
}

const defaultColors: ThemeColors = {
	background: '#fff',
	primary: '#F3EDE2',
	primaryLight: '#fcfbf8',
	secondary: '#38BDF8',
	accent: '#64748B',
	textLight: '#595f61',
	textDark: '#ede4d4',
	danger: '#EF4444',
	mutedForeground: '#64748B',
};

const customFormat = (date: Date) => {
	const day = date.getDate().toString().padStart(2, '0');
	const month = (date.getMonth() + 1).toString().padStart(2, '0');
	const year = date.getFullYear();
	return `${day}/${month}/${year}`;
};

export const generateInvoiceHtml = ({
	data,
	subtotal,
	tax,
	total,
	themeColors,
	isPreview,
}: TemplateData): string => {
	const colors = { ...defaultColors, ...themeColors };
	return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
     :root {
            --background: ${colors.background};
            --primary: ${colors.primary};
            --primary-light: ${colors.primaryLight};
            --secondary: ${colors.secondary};
            --accent: ${colors.accent};
            --text-light: ${colors.textLight};
            --text-dark: ${colors.textDark};
            --danger: ${colors.danger};
            --muted-foreground: ${colors.mutedForeground};
        }

    ${
			isPreview
				? `
          @page {
            size: A4;
            margin: 0;
        }`
				: ''
		}
    .container {
    ${
			isPreview
				? `
            margin: 20px 0;
            padding:20px;
            background-color: var(--background);
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
            border-radius: 8px;
            `
				: `
            margin: 0;
            padding: 20mm;
            background-color: var(--background);
            min-height: 297mm;
            box-sizing: border-box;
        }
        `
		}

        body {
            background-color: var(--background);
            font-family: sans-serif;
            color: var(--text-light);
            margin: 0;
            padding: 0;
                ${
									isPreview
										? `
            width: 100%;
            min-height: 100vh;
            `
										: `
            width: 210mm;
            min-height: 297mm;
            `
								}
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 1px solid var(--text-light);
            padding-bottom: 10px;
            margin-bottom: 20px;
        }

        .invoice-title {
            font-size: 24px;
            font-weight: bold;
            color: var(--text-light);
            margin: 0 0 8px 0;
        }

        .date {
            color: var(--text-light);
            margin: 4px 0;
            font-size: 14px;
        }

        .flex-container {
            display: flex;
            flex-direction: row;
            justify-content: space-between;
            margin-bottom: 30px;
            width: 100%;
        }

        .section-title {
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 12px;
            color: var(--accent);
        }

        table {
            width: 100%;
            margin-bottom: 30px;
            border-collapse: collapse;
            background-color: var(--primary-light);
        }

        th {
            text-align: left;
            padding: 12px;
            border-bottom: 2px solid var(--text-light);
            font-size: 14px;
        }

        td {
            padding: 12px;
            font-size: 14px;
        }

        .underline {
            border-bottom: 1px solid var(--text-light);
        }

        tfoot tr {
            font-size: 14px;
            font-weight: bold;
        }

        tfoot tr:last-child {
            font-size: 16px;
        }

        .align {
            text-align: right;
        }

        .padding {
            padding-left: 1rem;
        }

        .normal {
            font-weight: normal;
        }

        .payments-section {
            margin-top: 40px;
        }

        .txt-med {
            font-size: 12px;
        }

        .txt-small {
            font-size: 10px;
        }

        .notes-container {
            padding:0 5px;
            border: 1px solid var(--text-light);
            background-color: var(--primary-light);
        }

        .notes-header {
            color: var(--text-light);
            font-size: 12px;
            font-weight: 600;
        }

        .notes-txt {
            font-size: 10px;
            color: var(--text-light);
            white-space: pre-wrap;
        }

        .bank-details {
            margin-top: 10px;
            padding: 15px;
            background-color: var(--primary-light);
            border-radius: 4px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">
                <! -- <img src="https://github.com/user-attachments/assets/1071f4fa-4cf4-4d08-978f-0267b301a4e4" width="100px" />
            </div>
            <div>
                <h1 class="invoice-title">Invoice #${data.id}</h1>
                <p class="date">Due: ${customFormat(new Date(data.dueDate))}</p>
            </div>
        </div>

        <div class="flex-container">
            <div>
                <h2 class="section-title">From:</h2>
                <div class="padding">
                    <p class="txt-small">${data.user.fullName}</p>
                    <p class="txt-small">UTR: ${data.user.utrNumber}</p>
                    <p class="txt-small">NIN: ${data.user.ninNumber}</p>
                    <p class="txt-small">${data.user.emailAddress}</p>
                    <p class="txt-small">${data.user.phoneNumber}</p>
                </div>
            </div>
            <div>
                <h2 class="section-title">To:</h2>
                <div class="padding">
                    <p class="txt-small">${data.customer.name}</p>
                    <p class="txt-small">${data.customer.emailAddress}</p>
                    <p class="txt-small">${data.customer.phoneNumber}</p>
                </div>
            </div>
        </div>

        <table>
            <thead>
                <tr>
                    <th>Item</th>
                    <th class="align">Price</th>
                </tr>
            </thead>
            <tbody>
                ${data.workItems
									.map(
										(item, index) => `
                    <tr>
                        <td class="bold txt-med">${item.date}</td>
                        <td></td>
                    </tr>
                    <tr class="underline">
                        <td class="padding txt-med">${item.descriptionOfWork}</td>
                        <td class="align txt-med">${getCurrencySymbol(data.currency)}${item.unitPrice.toFixed(2)}</td>
                    </tr>
                `
									)
									.join('')}
            </tbody>
            <tfoot>
                <tr>
                    <td>Subtotal :</td>
                    <td class="align txt-med">${getCurrencySymbol(data.currency)}${subtotal.toFixed(2)}</td>
                </tr>
                ${data.payments
									.map(
										(payment, index) => `
                    <tr>
                        <td>Payment:</td>
                        <td></td>
                    </tr>
                    <tr>
                        <td class="padding normal txt-med">${payment.paymentDate}</td>
                        <td class="align txt-med">${getCurrencySymbol(data.currency)}${payment.amountPaid.toFixed(2)}</td>
                    </tr>
                `
									)
									.join('')}
                <tr>
                    <td>Tax${data.taxValue ? `(+${data.taxRate}%)` : `(-${data.taxRate}%)`} :</td>
                    <td class="align txt-med">${getCurrencySymbol(data.currency)}${tax.toFixed(2)}</td>
                </tr>
                <tr>
                    <td>Total :</td>
                    <td class="align">${getCurrencySymbol(data.currency)}${total.toFixed(2)}</td>
                </tr>
            </tfoot>
        </table>

        ${
					data.notes
						? `
        <div class="notes-container">
            <h3 class="notes-header">Notes:</h3>
            <p class="notes-txt">${data.notes}</p>
        </div>
        `
						: ''
				}

        <div class="bank-details">
            <h2 class="section-title">Bank Details:</h2>
            <div class="padding">
                <p class="txt-small">Bank Name: ${data.bankDetails.bankName}</p>
                <p class="txt-small">Account Name: ${data.bankDetails.accountName}</p>
                <p class="txt-small">Account Number: ${data.bankDetails.accountNumber}</p>
                <p class="txt-small">Sort Code: ${data.bankDetails.sortCode}</p>
            </div>
        </div>
    </div>
</body>
</html>
    `;
};
