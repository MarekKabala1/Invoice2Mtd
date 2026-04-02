# Invoice2Mtd

A unified invoicing and Making Tax Digital (MTD) for Income Tax app for UK sole traders.

---

## What This App Does

Invoice2Mtd combines invoicing, estimates, budget tracking, document scanning, and HMRC Making Tax Digital compliance into a single app. MTD reads income from your paid invoices and expenses from your budget tracker automatically — you never enter the same data twice.

---

## Features

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
9. **Making Tax Digital (MTD) — NEW**
   - Quarterly income tax estimates pulled automatically from your paid invoices and budget expenses.
   - Deadline tracker with urgency-aware alerts for each MTD submission.
   - Annual tax estimate with income tax and National Insurance projections.
   - Manual MTD records for cash payments or items not captured elsewhere.

---

## Technology Stack

- [**React Native**](https://reactnative.dev/docs/getting-started) 0.74
- [**Expo**](https://docs.expo.dev/) SDK 51
- [**Expo Router**](https://expo.github.io/router/docs/) ~3.5.24 — file-system routing with drawer navigator
- [**TypeScript**](https://www.typescriptlang.org/) ~5.3.3
- [**Drizzle ORM**](https://orm.drizzle.team/docs/overview) ^0.33.0
- [**SQLite**](https://www.sqlite.org/docs.html) via expo-sqlite ~14.0.6
- [**NativeWind**](https://www.nativewind.dev/) ^4.0.1 — Tailwind CSS for React Native
- [**React Hook Form**](https://react-hook-form.com/get-started) ^7.53.0
- [**Zod**](https://zod.dev/) ^3.23.8 — schema validation
- [**date-fns**](https://date-fns.org/) ^4.1.0 — date utilities
- [**React Native Chart Kit**](https://github.com/indiespirit/react-native-chart-kit)
- [**ML Kit Document Scanner**](https://github.com/infinitered/react-native-mlkit-document-scanner)

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or newer)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- [Git](https://git-scm.com/)

### Installation

1. **Clone the repository:**

   ```sh
   git clone git@github.com:MarekKabala1/Invoice2Mtd.git
   cd Invoice2Mtd
   ```

2. **Install dependencies:**

   ```sh
   npm install
   ```

3. **Start the Expo development server:**

   ```sh
   npx expo start
   ```

4. **Run on your device:**
   - Use the Expo Go app (iOS/Android) to scan the QR code.
   - Or run on an emulator/simulator:
     ```sh
     npm run android
     npm run ios
     ```

### Development Commands

```bash
# Type check — run before every commit
npx tsc --noEmit

# Run all tests
npm test

# Generate database migrations (after db/schema.ts changes)
npx drizzle-kit generate

# Lint
npm run lint
```

---

## App Structure

```
app/
├── (drawer)/                    Drawer navigator (slides from left)
│   ├── (tabs)/                  Bottom tab navigator
│   │   ├── home.tsx             Unified dashboard
│   │   ├── invoices.tsx         Invoice listing & estimates
│   │   ├── tax.tsx              MTD tax hub
│   │   ├── budget.tsx           Income/expense tracker
│   │   └── scanner.tsx          Document scanner
│   ├── settings.tsx             All app settings (8 sections)
│   ├── info.tsx                 MTD reference & help
│   └── charts.tsx               Charts & analytics
├── (stack)/                     Push screens from tabs
│   ├── createInvoice.tsx        Invoice creation
│   ├── createEstimate.tsx       Estimate creation
│   ├── addTransaction.tsx       Budget transaction
│   ├── addMtdTransaction.tsx    MTD income/expense record
│   ├── mtdQuarterlySummary.tsx  Quarter-by-quarter breakdown
│   ├── mtdAnnualEstimate.tsx    Full-year tax estimate
│   ├── mtdDeadlines.tsx         Deadline tracker
│   ├── clientInfo.tsx           Client management
│   └── termsAndConditions.tsx   Terms for documents
│   └── (user)/
│       ├── userInfo.tsx         User profile
│       ├── userInfoForm.tsx     User info editing
│       └── bankDetailsForm.tsx  Bank details editing
├── _layout.tsx                  Root Stack + providers
└── index.tsx                    App entry point

components/                      Reusable UI components
├── InvoiceForm/                 Invoice form components
├── EstimateForm/                Estimate form components
├── CustomerForm/                Customer form components
├── UserForm/                    User form components
├── DrawerContent.tsx            Custom drawer navigation
├── BaseCard.tsx                 Card UI component
├── DocumentScanner.tsx          Scanner UI
├── AddToBudgetModal.tsx         Budget modal
├── TransactionForm.tsx          Transaction form
└── ThemeToggle.tsx              Light/dark toggle

context/                         React Context providers
├── AppSettingsContext.tsx        App settings state
├── InvoiceContext.tsx            Invoice state
└── ThemeContext.tsx              Theme state

db/                              Database layer
├── config.ts                    DB config (exports db)
├── schema.ts                    All tables (User, Invoice, MTD, etc.)
├── zodSchema.ts                 Zod validation schemas
├── invoiceOperations.ts         Invoice DB operations
├── queries.ts                   General queries
└── mtdOperations.ts             MTD DB operations

hooks/                           Custom React hooks
├── useAppSettings.ts            App settings hook
├── useMtdData.ts                MTD aggregated data
├── useMtdDeadlines.ts           MTD deadline computation
├── useMtdTransaction.ts         MTD add/delete transactions
├── useHomeInsights.ts           Cross-module home data
├── useInvoiceData.ts            Invoice data
├── useBudgetData.ts             Budget data
├── useCustomerData.ts           Customer data
├── useEstimateData.ts           Estimate data
├── useTransaction.ts            Transaction actions
├── useUserData.ts               User data
├── useCameraScanner.ts          Camera scanner
├── useIsInvoicePaid.ts          Invoice paid status
└── useAddInvoiceToBudget.ts     Invoice-to-budget

utils/                           Pure utility functions
├── mtdDates.ts                  UK tax year & quarter dates
├── mtdTaxCalc.ts                Tax & NI estimation
├── mtdCategories.ts             HMRC category labels & mapping
├── categories.ts                Budget categories
├── generateUuid.ts              UUID generator
├── getCurrencySymbol.ts         Currency helpers
├── theme.ts                     Theme color tokens
├── invoiceCalculations.ts       Invoice calculations
├── estimateCalculations.ts      Estimate calculations
├── invoiceFormOperations.ts     Invoice form logic
├── pdfOperations.ts             PDF generation
└── ... (more)

types/                           TypeScript type definitions
├── index.ts                     Existing app types
└── mtd.ts                       MTD-specific types

templates/                       PDF document templates
├── invoiceTemplate.ts           Invoice PDF template
├── estimateTemplate.ts          Estimate PDF template
└── emailRemaiderTemplate.ts     Email reminder template
```

---

## Notes

- The app uses SQLite for local storage — no server setup required.
- For document scanning, camera permissions are required.
- No new npm packages are added. The drawer uses expo-router's built-in Drawer component.

---

## Branch Strategy

| Branch | Purpose |
|--------|---------|
| `main` | Clean mirror of upstream invoiceApp |
| `featureBranch` | All development — phases 1–7 |
| `feature/hmrc-api` | Future: HMRC submission layer |

---

## License

Private project.
