# Custom Hooks Documentation

This directory contains reusable custom React hooks for the Invoice & Budget Management App. Each hook encapsulates a specific piece of logic or data-fetching pattern to keep your components clean and focused.

## Overview of Available Hooks

| Hook Name             | Purpose                                                         |
| --------------------- | --------------------------------------------------------------- |
| useAddInvoiceToBudget | Add invoices as income transactions to the budget.              |
| useBudgetData         | Fetch, filter, and manage budget/transaction data.              |
| useCameraScanner      | Integrate document scanning and manage scanned data.            |
| useCustomerData       | Parse and provide customer data from navigation params.         |
| useEstimateData       | Parse and provide estimate data and notes from navigation.      |
| useInvoiceData        | Parse and provide invoice data, work items, payments, notes.    |
| useIsInvoicePaid      | Determine if an invoice is marked as paid.                      |
| useTransaction        | Fetch users and available currencies for transactions.          |
| useUserData           | Parse and provide user and bank details from navigation params. |

---

## useAddInvoiceToBudget

A custom hook that provides functionality to add invoices to the budget as income transactions.

### Usage

```typescript
import { useAddInvoiceToBudget } from '@/hooks/useAddInvoiceToBudget';
import AddToBudgetModal from '@/components/AddToBudgetModal';

const MyComponent = () => {
  const {
    isCategoryModalVisible,
    selectedCategory,
    showCategoryModal,
    hideCategoryModal,
    setSelectedCategory,
    handleAddInvoicesToBudget,
    incomeCategories,
  } = useAddInvoiceToBudget();

  const handleAddToBudget = async (invoices: InvoiceForUpdate[]) => {
    await handleAddInvoicesToBudget(invoices);
    // Additional logic after adding to budget
  };

  return (
    <>
      <TouchableOpacity onPress={showCategoryModal}>
        <Text>Add to Budget</Text>
      </TouchableOpacity>

      <AddToBudgetModal
        isVisible={isCategoryModalVisible}
        onClose={hideCategoryModal}
        onConfirm={() => handleAddToBudget(selectedInvoices)}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        incomeCategories={incomeCategories}
      />
    </>
  );
};
```

### Returns

- isCategoryModalVisible, selectedCategory, showCategoryModal, hideCategoryModal, setSelectedCategory, handleAddInvoicesToBudget, incomeCategories

---

## useBudgetData

Fetch, filter, and manage budget/transaction data, including monthly and overall balances.

### Usage

```typescript
import { useBudgetData } from '@/hooks/useBudgetData';
const { transactions, monthlyBalance, handlePreviousMonth, handleNextMonth } =
	useBudgetData();
```

### Returns

- transactions, allTransactions, monthlyBalance, overallBalance, totalIncomeForTheMonth, totalExpensesForTheMonth, handlePreviousMonth, handleNextMonth, deleteTransaction, filterTransaction, handleFilterChange, openSearch, handleToday, etc.

---

## useCameraScanner

Integrate document scanning and manage scanned data (PDFs, images) from the device camera.

### Usage

```typescript
import { useCameraScanner } from '@/hooks/useCameraScanner';
const { scannedData, handleScan, isLoading } = useCameraScanner();
```

### Returns

- isCameraOpen, scannedData, handleScan, isLoading, resetScanDirectory, directoryUri

---

## useCustomerData

Parse and provide customer data from navigation parameters (e.g., for forms or updates).

### Usage

```typescript
import { useCustomerData } from '@/hooks/useCustomerData';
const { isUpdateMode, customerData } = useCustomerData();
```

### Returns

- isUpdateMode, customerData

---

## useEstimateData

Parse and provide estimate data and notes from navigation parameters.

### Usage

```typescript
import { useEstimateData } from '@/hooks/useEstimateData';
const { isUpdateMode, estimateData, notes } = useEstimateData();
```

### Returns

- isUpdateMode, estimateData, notes

---

## useInvoiceData

Parse and provide invoice data, work items, payments, and notes from navigation parameters.

### Usage

```typescript
import { useInvoiceData } from '@/hooks/useInvoiceData';
const { isUpdateMode, invoiceData, workItemsData, paymentsData, notes } =
	useInvoiceData();
```

### Returns

- isUpdateMode, invoiceData, workItemsData, paymentsData, notes

---

## useIsInvoicePaid

Determine if an invoice is marked as paid.

### Usage

```typescript
import { useIsInvoicePaid } from '@/hooks/useIsInvoicePaid';
const { isPayed } = useIsInvoicePaid(invoiceData);
```

### Returns

- isPayed

---

## useTransaction

Fetch users and available currencies for transactions.

### Usage

```typescript
import { useTransaction } from '@/hooks/useTransaction';
const { users, currencies } = useTransaction();
```

### Returns

- users, currencies

---

## useUserData

Parse and provide user and bank details from navigation parameters.

### Usage

```typescript
import { useUserData } from '@/hooks/useUserData';
const { isUpdateMode, userData, bankDetailsData, type } = useUserData();
```

### Returns

- isUpdateMode, userData, bankDetailsData, type
