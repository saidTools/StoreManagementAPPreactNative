# ShopManager

A full offline-first React Native (Expo) shop management app for Algerian retail shops. Manages inventory, sales, purchases, customers, debts, expenses, and reports — all 100% on-device with no internet required.

## Features

- **Dashboard** — Today's stats (revenue, profit, transactions, low stock), recent sales, top products chart
- **Inventory** — Product CRUD, barcode scanning, stock adjustments, category filters, low stock alerts
- **Point of Sale (POS)** — Cart with discounts (fixed/%), barcode scanning, cash/debt payment, receipt printing (PDF and thermal text)
- **Customers** — Customer list, debt tracking, credit limits, purchase history, loyalty points, WhatsApp debt reminders
- **Sales History** — Search/filter sales, view details, share invoice (WhatsApp text, PDF), reprint receipt, process returns
- **Reports** — Revenue/profit/expense by day/week/month, bar charts, top products, debt summary, export report
- **Suppliers & Purchase Orders** — Supplier CRUD, purchase orders with auto-restock, cancel to reverse stock
- **Settings** — Shop info, currency, subscription plan, **language (English/Arabic with RTL)**, CSV import/export (products & customers), JSON backup/restore, low-stock notifications, reset data

## Tech Stack

- **Framework:** Expo SDK 56, TypeScript, Expo Router (file-based routing)
- **State:** Zustand stores + expo-sqlite (100% offline)
- **UI:** Custom theme with iOS-style colors, custom components
- **Printing:** expo-print (PDF), expo-sharing (thermal text)
- **Charts:** react-native-gifted-charts
- **Monetization:** Freemium subscription gate (Free: 50 products/30 invoices, Basic: 500, Pro: unlimited)

## Getting Started

```bash
# Install dependencies
npm install

# Start the dev server
npx expo start
```

Scan the QR code with Expo Go (Android/iOS) or press `a` for Android emulator.

## Build APK

```bash
npx expo prebuild
cd android
./gradlew assembleDebug
```

## Project Structure

```
app/                  # Expo Router screens (tabs + settings)
components/           # Reusable UI components & forms
constants/            # Theme, categories, subscription plans
db/                   # SQLite database layer (CRUD per entity)
hooks/                # Custom React hooks
i18n/                 # English + Arabic translations
store/                # Zustand state stores
types/                # TypeScript interfaces
utils/                # Helpers: currency/date format, invoice gen, print, CSV, export, notifications, subscription
```

## License

MIT
