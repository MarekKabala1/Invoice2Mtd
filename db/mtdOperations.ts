/**
 * mtdOperations.ts
 *
 * Aggregation module: re-exports all MTD database operations from specialized modules.
 *
 * WHY: Split from monolithic 450+ lines into three focused modules by concern:
 * - mtdTransactionOps.ts: MtdTransactions CRUD and quarter calculation
 * - mtdQuarterlySummaryOps.ts: Quarterly aggregation and summary operations
 * - mtdAnnualSummaryOps.ts: Annual summary operations
 *
 * Public API: All exports below should be used by hooks and screens.
 *
 * Depends on: db/mtdTransactionOps.ts, db/mtdQuarterlySummaryOps.ts, db/mtdAnnualSummaryOps.ts
 * Used by: hooks/useMtdData.ts, screens, and other db operations
 */

// Transaction operations
export {
	addMtdTransaction,
	getMtdTransactions,
	getPaidInvoiceTurnoverMissingMtd,
	deleteMtdTransaction,
} from './mtdTransactionOps';

// Quarterly summary operations
export { aggregateQuarter, refreshQuarterlySummary, getQuarterlySummaries } from './mtdQuarterlySummaryOps';

// Annual summary operations
export { refreshAnnualSummary, getAnnualSummary, refreshCurrentYear } from './mtdAnnualSummaryOps';
