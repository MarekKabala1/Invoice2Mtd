import { EstimateType } from '@/db/zodSchema';

export const calculateEstimateTotals = (
	amountBeforeTax: number,
	taxRate: number,
	discount: number = 0,
	taxValue: boolean = false
) => {
	const subtotal = amountBeforeTax;
	const discountAmount = subtotal * (discount / 100);
	const amountAfterDiscount = subtotal - discountAmount;
	const tax = amountAfterDiscount * (taxRate / 100);
	const total = taxValue
		? amountAfterDiscount + tax
		: amountAfterDiscount - tax;

	return {
		subtotal,
		discountAmount,
		amountAfterDiscount,
		tax,
		total,
	};
};

export const calculateEstimateTotal = (estimates: EstimateType[]) => {
	const totals = estimates.reduce(
		(acc, estimate) => ({
			totalBeforeTax: acc.totalBeforeTax + (estimate.amountBeforeTax || 0),
			totalAfterTax: acc.totalAfterTax + (estimate.amountAfterTax || 0),
		}),
		{
			totalBeforeTax: 0,
			totalAfterTax: 0,
		}
	);

	return {
		...totals,
		taxToPay: totals.totalAfterTax - totals.totalBeforeTax,
	};
};
