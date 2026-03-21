import { useLocalSearchParams } from 'expo-router';
import { CustomerType } from '@/db/zodSchema';

interface ParsedCustomerData {
	isUpdateMode: boolean;
	customerData?: CustomerType;
}

export const useCustomerData = (): ParsedCustomerData => {
	const params = useLocalSearchParams();
	const isUpdateMode = params?.mode === 'update';

	const customerData =
		typeof params.customer === 'string'
			? JSON.parse(params.customer)
			: params.customer;

	return {
		isUpdateMode,
		customerData,
	};
};
