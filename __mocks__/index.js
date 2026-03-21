// Mock database configuration
const mockDb = {
  select: jest.fn().mockReturnThis(),
  from: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  values: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  set: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  returning: jest.fn().mockResolvedValue([]),
  limit: jest.fn().mockReturnThis(),
};

// Mock the database instance
jest.mock('@/db/config', () => ({
  db: mockDb,
}));

// Mock database schema
jest.mock('@/db/schema', () => ({
  Customer: {
    id: 'id',
    name: 'name',
    address: 'address',
    emailAddress: 'emailAddress',
    phoneNumber: 'phoneNumber',
    createdAt: 'createdAt',
  },
  Invoice: {
    id: 'id',
    customerId: 'customerId',
    userId: 'userId',
    invoiceDate: 'invoiceDate',
    dueDate: 'dueDate',
    amountAfterTax: 'amountAfterTax',
    amountBeforeTax: 'amountBeforeTax',
    taxRate: 'taxRate',
    taxValue: 'taxValue',
    createdAt: 'createdAt',
    isPayed: 'isPayed',
  },
  User: {
    id: 'id',
    fullName: 'fullName',
    address: 'address',
    emailAddress: 'emailAddress',
    phoneNumber: 'phoneNumber',
    utrNumber: 'utrNumber',
    ninNumber: 'ninNumber',
    createdAt: 'createdAt',
  },
  BankDetails: {
    id: 'id',
    userId: 'userId',
    accountName: 'accountName',
    sortCode: 'sortCode',
    accountNumber: 'accountNumber',
    bankName: 'bankName',
    createdAt: 'createdAt',
  },
  WorkInformation: {
    id: 'id',
    invoiceId: 'invoiceId',
    description: 'description',
    unitPrice: 'unitPrice',
    quantity: 'quantity',
    createdAt: 'createdAt',
  },
  Payment: {
    id: 'id',
    invoiceId: 'invoiceId',
    amountPaid: 'amountPaid',
    paymentDate: 'paymentDate',
    createdAt: 'createdAt',
  },
  Note: {
    id: 'id',
    invoiceId: 'invoiceId',
    text: 'text',
    createdAt: 'createdAt',
  },
}));

// Mock drizzle-orm
jest.mock('drizzle-orm', () => ({
  eq: jest.fn((field, value) => ({ field, value })),
  and: jest.fn(),
  or: jest.fn(),
  asc: jest.fn(),
  desc: jest.fn(),
}));

// Mock zustand stores
jest.mock('@/store/invoiceStore', () => ({
  useInvoiceStore: jest.fn(),
}));

jest.mock('@/store/transactionStore', () => ({
  useTransactionStore: jest.fn(),
}));

jest.mock('@/store/authStore', () => ({
  useAuthStore: jest.fn(),
}));

jest.mock('@/store/userStore', () => ({
  useUserStore: jest.fn(),
}));

// Mock expo-router
jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    canGoBack: jest.fn(() => true),
  },
  useLocalSearchParams: jest.fn(() => ({})),
  useGlobalSearchParams: jest.fn(() => ({})),
  useSegments: jest.fn(() => []),
  usePathname: jest.fn(() => '/'),
  Link: 'Link',
  Stack: {
    Screen: 'Screen',
  },
  Tabs: {
    Screen: 'Screen',
  },
}));

// Mock context providers
jest.mock('@/context/ThemeContext', () => ({
  useTheme: jest.fn(() => ({
    colors: {
      primary: '#007AFF',
      background: '#FFFFFF',
      text: '#000000',
      card: '#FFFFFF',
      border: '#C7C7CC',
      notification: '#FF3B30',
    },
    isDark: false,
    setColorScheme: jest.fn(),
  })),
  ThemeProvider: 'ThemeProvider',
}));

jest.mock('@/context/AppSettingsContext', () => ({
  useAppSettings: jest.fn(() => ({
    currency: 'USD',
    taxRate: 0.2,
    setCurrency: jest.fn(),
    setTaxRate: jest.fn(),
  })),
  AppSettingsProvider: 'AppSettingsProvider',
}));

jest.mock('@/context/InvoiceContext', () => ({
  useInvoiceContext: jest.fn(() => ({
    selectedInvoice: null,
    setSelectedInvoice: jest.fn(),
  })),
  InvoiceProvider: 'InvoiceProvider',
}));

// Mock react-hook-form
jest.mock('react-hook-form', () => ({
  useForm: jest.fn(() => ({
    control: {},
    handleSubmit: jest.fn((cb) => cb),
    formState: { errors: {}, isValid: true },
    reset: jest.fn(),
    watch: jest.fn(),
    setValue: jest.fn(),
    getValues: jest.fn(),
  })),
  useFieldArray: jest.fn(() => ({
    fields: [],
    append: jest.fn(),
    remove: jest.fn(),
    move: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
  })),
  Controller: 'Controller',
  FormProvider: 'FormProvider',
}));

// Mock zod
jest.mock('zod', () => ({
  z: {
    object: jest.fn(() => ({
      parse: jest.fn(),
      safeParse: jest.fn(),
      shape: {},
    })),
    string: jest.fn(() => ({
      min: jest.fn().mockReturnThis(),
      max: jest.fn().mockReturnThis(),
      email: jest.fn().mockReturnThis(),
      regex: jest.fn().mockReturnThis(),
      optional: jest.fn().mockReturnThis(),
    })),
    number: jest.fn(() => ({
      min: jest.fn().mockReturnThis(),
      max: jest.fn().mockReturnThis(),
      optional: jest.fn().mockReturnThis(),
    })),
    boolean: jest.fn(() => ({
      optional: jest.fn().mockReturnThis(),
    })),
    array: jest.fn(() => ({
      min: jest.fn().mockReturnThis(),
      max: jest.fn().mockReturnThis(),
    })),
    enum: jest.fn(() => ({
      optional: jest.fn().mockReturnThis(),
    })),
  },
}));

// Mock @hookform/resolvers
jest.mock('@hookform/resolvers', () => ({
  zodResolver: jest.fn(() => ({})),
}));

// Export mock for use in tests
export { mockDb };