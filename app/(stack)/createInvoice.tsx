import React from 'react';
import InvoiceForm from '@/components/InvoiceForm/InvoiceForm';
import { useInvoiceData } from '@/hooks/useInvoiceData';

const InvoiceFormPage: React.FC = () => {
	const { isUpdateMode, invoiceData, workItemsData, paymentsData, notes } = useInvoiceData();

	return <InvoiceForm isUpdateMode={isUpdateMode} invoiceData={invoiceData} workItemsData={workItemsData} paymentsData={paymentsData} notes={notes} />;
};

export default InvoiceFormPage;
