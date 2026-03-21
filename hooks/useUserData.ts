import { useLocalSearchParams } from 'expo-router';
import { UserType, BankDetailsType } from '@/db/zodSchema';

interface ParsedUserData {
	isUpdateMode: boolean;
	userData?: UserType;
	bankDetailsData?: BankDetailsType;
	type?: 'user' | 'bankDetails';
}

export const useUserData = (): ParsedUserData => {
	const params = useLocalSearchParams();
	const isUpdateMode = params?.mode === 'update';
	const type =
		typeof params.type === 'string' &&
		(params.type === 'user' || params.type === 'bankDetails')
			? params.type
			: undefined;

	let userData: UserType | undefined = undefined;
	let bankDetailsData: BankDetailsType | undefined = undefined;

	if (isUpdateMode && type === 'user') {
		userData =
			typeof params.user === 'string' ? JSON.parse(params.user) : params;
	} else if (isUpdateMode && type === 'bankDetails') {
		bankDetailsData =
			typeof params.bankDetails === 'string'
				? JSON.parse(params.bankDetails)
				: params;
	}

	return {
		isUpdateMode,
		userData,
		bankDetailsData,
		type,
	};
};
