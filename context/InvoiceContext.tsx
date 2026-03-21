import React, { createContext, useState, useContext } from 'react';

interface Invoice {
	id: string;
	customerName: string;
	amount: number;
	dueDate: Date;
}

interface InvoiceContextType {
	invoices: Invoice[];
	addInvoice: (invoice: Invoice) => void;
	removeInvoice: (id: string) => void;
}

const InvoiceContext = createContext<InvoiceContextType | undefined>(undefined);

export const useInvoice = () => {
	const context = useContext(InvoiceContext);
	if (!context) {
		throw new Error('useInvoice must be used within an InvoiceProvider');
	}
	return context;
};

export const InvoiceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const [invoices, setInvoices] = useState<Invoice[]>([]);

	const addInvoice = (invoice: Invoice) => {
		setInvoices([...invoices, invoice]);
	};

	const removeInvoice = (id: string) => {
		setInvoices(invoices.filter((invoice) => invoice.id !== id));
	};

	return <InvoiceContext.Provider value={{ invoices, addInvoice, removeInvoice }}>{children}</InvoiceContext.Provider>;
};
