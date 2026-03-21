# Invoice and Budget Management App 📱

Effortlessly create invoices, scan documents, manage estimates, track your budget, and send reminders—all from a single app.

---

<p float="left">
 <img src="https://github.com/user-attachments/assets/ea709b0f-9cc5-4c0b-b142-7eda63e965f4" width="32%" />
  <img src="https://github.com/user-attachments/assets/0b096446-95d1-4374-a4e0-b7726c4572a3" width="32%" />
  <img src="https://github.com/user-attachments/assets/67575461-472b-4f82-8c4a-85097725d5c5" width="32%" />

## </p>

## 🌟 Features

1. **Generate PDF Invoices**
   - Create professional, formatted PDF files for each invoice directly within the app.
2. **Save Invoices Locally**
   - Securely store invoices in local storage using SQLite, enabling easy access and offline functionality.
3. **Send Invoices via Email**
   - Streamline your invoicing process by sending invoices through email directly from the app.
4. **View Income Charts**
   - Visualize your invoicing history with interactive charts, providing insights into income trends from sent invoices.
5. **Track Budget (Income & Expenses)**
   - Manage your finances by tracking income and expenses, helping you stay on top of your budget.
6. **Document Scanning**
   - Scan receipts and documents using your device camera, save as PDF, and add scanned data directly to your budget.
7. **Estimates Management**
   - Create, send, and track estimates with support for notes, terms, discounts, and acceptance status.
8. **Reminders & Overdue Notifications**
   - Send payment reminders for overdue invoices directly to clients via email.

---

## 🛠️ Technology Stack

- [**React Native**](https://reactnative.dev/docs/getting-started)
- [**Expo**](https://docs.expo.dev/)
- [**Drizzle ORM**](https://orm.drizzle.team/docs/overview)
- [**SQLite**](https://www.sqlite.org/docs.html)
- [**React Hook Form**](https://react-hook-form.com/get-started)
- [**React Native Chart Kit**](https://github.com/indiespirit/react-native-chart-kit)
- [**Tailwind CSS**](https://tailwindcss.com/docs)
- [**ML Kit Document Scanner**](https://github.com/infinitered/react-native-mlkit-document-scanner)

---

## 🚀 Getting Started (Run on Your Own Machine)

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or newer recommended)
- [Yarn](https://classic.yarnpkg.com/lang/en/) or [npm](https://www.npmjs.com/)
- [Expo CLI](https://docs.expo.dev/get-started/installation/) (`npm install -g expo-cli`)
- [Git](https://git-scm.com/)

### Installation

1. **Clone the repository:**

   ```sh
   git clone https://github.com/your-username/invoiceApp.git
   cd invoiceApp
   ```

2. **Install dependencies:**

   ```sh
   npm install
   # or
   yarn install
   ```

3. **Start the Expo development server:**

   ```sh
   npm start
   # or
   yarn start
   # or
   expo start
   ```

4. **Run on your device:**
   - Use the Expo Go app (iOS/Android) to scan the QR code.
   - Or run on an emulator/simulator with:
     ```sh
     npm run android
     npm run ios
     ```

### Notes

- The app uses SQLite for local storage; no extra setup is required.
- For document scanning, camera permissions are required.
- For iOS, you may need a Mac with Xcode for simulator support.

---

## 📁 App Structure

```
invoiceApp/
├── app/
│   ├── (tabs)/
│   │   ├── home.tsx            # Main dashboard
│   │   ├── charts.tsx          # Financial analytics
│   │   ├── budget.tsx          # Budget tab
│   │   ├── invoices.tsx        # Invoice listing
│   │   └── scanner.tsx         # Document scanner
│   ├── (stack)/
│   │   ├── clientInfo.tsx      # Client management
│   │   ├── addTransaction.tsx  # Add income/expense
│   │   ├── createInvoice.tsx   # Invoice creation
│   │   ├── createEstimate.tsx  # Estimate creation
│   │   ├── termsAndConditions.tsx # Terms for invoices/estimates
│   │   └── (user)/
│   │       ├── userInfo.tsx        # User profile
│   │       ├── bankDetailsForm.tsx # User bank details
│   │       └── userInfoForm.tsx    # User info form
│   ├── index.tsx               # App entry point
│   └── _layout.tsx             # Main layout
├── components/
│   ├── InvoiceForm/            # Invoice form components
│   ├── EstimateForm/           # Estimate form components
│   ├── CustomerForm/           # Customer form components
│   ├── UserForm/               # User form components
│   ├── BaseCard.tsx            # Card UI component
│   ├── DocumentScanner.tsx     # Document scanner UI
│   ├── AddToBudgetModal.tsx    # Modal for adding to budget
│   ├── TransactionForm.tsx     # Transaction form
│   └── ThemeToggle.tsx         # Light/dark theme toggle
├── context/
│   ├── InvoiceContext.tsx      # Invoice state/context
│   └── ThemeContext.tsx        # Theme state/context
├── db/
│   ├── config.ts               # DB config
│   ├── schema.ts               # DB schema
│   ├── zodSchema.ts            # Zod validation schemas
│   ├── invoiceOperations.ts    # Invoice DB operations
│   └── queries.ts              # DB queries
├── drizzle/
│   ├── migrations.js           # DB migrations
│   ├── 0000_Sqlite_init.sql    # Initial schema
│   └── meta/                   # Migration metadata
├── hooks/
│   ├── useAddInvoiceToBudget.ts    # Add invoice to budget
│   ├── useBudgetData.ts            # Budget data hook
│   ├── useCameraScanner.ts         # Camera scanner logic
│   ├── useCustomerData.ts          # Customer data hook
│   ├── useEstimateData.ts          # Estimate data hook
│   ├── useInvoiceData.ts           # Invoice data hook
│   ├── useIsInvoicePaid.ts         # Invoice paid status
│   ├── useTransaction.ts           # Transaction logic
│   └── useUserData.ts              # User data hook
├── utils/
│   ├── categories.ts           # Budget categories
│   ├── customerOperations.ts   # Customer logic
│   ├── emailOperations.ts      # Email logic
│   ├── estimateCalculations.ts # Estimate calculations
│   ├── estimateOperations.ts   # Estimate logic
│   ├── generateUuid.ts         # UUID generator
│   ├── getCurrencySymbol.ts    # Currency helpers
│   ├── invoiceCalculations.ts  # Invoice calculations
│   ├── invoiceFormOperations.ts# Invoice form logic
│   ├── invoiceGrouping.ts      # Invoice grouping
│   ├── pdfOperations.ts        # PDF generation
│   ├── permissions.ts          # Permissions helpers
│   ├── textHelpers.ts          # Text utilities
│   ├── theme.ts                # Theme helpers
│   ├── transactionCalculation.ts # Transaction calculations
│   └── transactionOperations.ts  # Transaction logic
├── templates/
│   ├── emailRemaiderTemplate.ts # Email reminder template
│   ├── estimateTemplate.ts      # Estimate PDF template
│   └── invoiceTemplate.ts       # Invoice PDF template
├── types/
│   └── index.ts                 # Shared TypeScript types
├── assets/                      # Images, fonts, currency data
├── global.css                   # Global styles
├── tailwind.config.ts           # Tailwind CSS config
├── package.json                 # Project dependencies
├── tsconfig.json                # TypeScript config
└── README.md                    # Project documentation
```

## 🚧 Work in Progress

- **Sync Engine for Database Synchronization**
  - Real-time sync between local and remote databases for cross-device consistency.
- **Advanced Reminders**
  - Automated overdue invoice reminders and estimate expiry notifications.
- **Enhanced Scanning**
  - Improved OCR and auto-categorization for scanned receipts.
- **UI/UX Improvements**
  - More customization options and accessibility enhancements.
- **Multi-language Support**
  - Add support for additional languages.

More features are coming soon!
