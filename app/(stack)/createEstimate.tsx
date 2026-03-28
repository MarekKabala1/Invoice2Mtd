import React from 'react';
import EstimateForm from '@/components/EstimateForm/EstimateForm';
import { useEstimateData } from '@/hooks/estimate/useEstimateData';

const EstimateFormPage: React.FC = () => {
	const { isUpdateMode, estimateData, notes } = useEstimateData();

	return <EstimateForm isUpdateMode={isUpdateMode} estimateData={estimateData} notes={notes} />;
};

export default EstimateFormPage;
