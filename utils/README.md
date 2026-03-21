# Utils Directory

This directory contains utility modules for the Invoice & Budget Management App. Each file provides focused, reusable logic for calculations, data formatting, database operations, and more. Duplicate code has been consolidated—each utility function now has a single, canonical implementation.

## Overview

- **categories.ts**: Defines income and expense categories, helpers for category lookup and emoji.
  - `categories`, `getCategoryById`, `getCategoryEmoji`
- **customerOperations.ts**: Customer CRUD operations and data fetching.
  - `getCustomers`, `getCustomerDetails`, `handleSaveCustomer`, `handleDeleteCustomer`
- **emailOperations.ts**: Email sending and reminder logic.
  - `sendPaymentReminder`
- **estimateCalculations.ts**: Estimate total and tax calculations.
  - `calculateEstimateTotals`, `calculateEstimateTotal`
- **estimateOperations.ts**: Estimate CRUD, PDF, and sharing logic.
  - `handleSaveEstimate`, `handleSendEstimate`, `handleExportPdfEstimate`, `handlePreviewEstimate`, `getEstimateTerms`, `saveEstimateTerms`, `deleteEstimateTerms`, `getUserAndBankDetails`, `getNextSequentialEstimateId`, `getLastEstimateId`
- **generateUuid.ts**: UUID generation.
  - `generateId`
- **getCurrencySymbol.ts**: Currency symbol lookup.
  - `getCurrencySymbol`
- **invoiceCalculations.ts**: Invoice total, tax, and monthly calculations.
  - `calculateInvoiceWorkItemTotals`, `calculateInvoiceTotal`, `calculateMonthlyTotals`
- **invoiceFormOperations.ts**: Invoice CRUD, PDF, and sharing logic.
  - `handleSaveInvoice`, `handleSendInvoice`, `handleExportPdfInvoice`, `handlePreviewInvoice`, `getUserAndBankDetails`, `getNextSequentialInvoiceId`, `getInvoiceForNumber`
- **invoiceGrouping.ts**: Group invoices by month/year.
  - `groupInvoicesByMonth`
- **pdfOperations.ts**: PDF generation and saving for invoices and estimates.
  - `generateAndSavePdf`, `generateAndSaveEstimatePdf`, `resetStoredDirectoryPermissions`
- **permissions.ts**: Media library and storage permissions helpers.
  - `requestMediaLibraryPermission`, `getOrCreateStorageDirectory`, `resetStorageDirectory`
- **textHelpers.ts**: HTML-to-text conversion and text utilities.
  - `convertHtmlToText`
- **theme.ts**: Color and theme definitions.
  - `color`, `lightColors`, `darkColors`
- **transactionCalculation.ts**: Transaction income/expense/balance calculations.
  - `calculateTotals`
- **transactionOperations.ts**: Transaction CRUD and validation logic.
  - `validateTransactionData`, `handleSaveTransaction`
