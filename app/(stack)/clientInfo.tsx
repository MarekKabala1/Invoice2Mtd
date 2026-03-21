import React from 'react';
import CustomerForm from '@/components/CustomerForm/CustomerForm';
import { useCustomerData } from '@/hooks/useCustomerData';

const ClientInfoPage: React.FC = () => {
	const { isUpdateMode, customerData } = useCustomerData();

	return (
		<CustomerForm isUpdateMode={isUpdateMode} customerData={customerData} />
	);
};

export default ClientInfoPage;
