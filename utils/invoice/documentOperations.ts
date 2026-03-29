/**
 * documentOperations.ts
 *
 * Shared utility for generating sequential numeric IDs across Invoice and Estimate tables.
 * Extracted from invoiceFormOperations.ts and estimateOperations.ts which had identical logic.
 *
 * Depends on: db/config.ts
 * Used by: utils/invoice/invoiceFormOperations.ts, utils/invoice/estimateOperations.ts
 */

import { db } from '@/db/config';
import { captureException } from '@/utils/shared/sentry';

export const getNextSequentialId = async (table: any): Promise<string> => {
	try {
		const rows = await db.select().from(table);
		if (!rows || rows.length === 0) {
			return '1';
		}

		let maxNumber = 0;

		for (const row of rows) {
			const num = Number(row.id);
			if (!isNaN(num) && num > maxNumber) {
				maxNumber = num;
			}
		}

		return String(maxNumber + 1);
	} catch (error) {
		captureException(
			error instanceof Error ? error : new Error(String(error)),
			{ action: 'getting next sequential ID' }
		);
		return '1';
	}
};
