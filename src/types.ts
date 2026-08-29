/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type AccountType = 'supplier' | 'buyer';

export type UserRole = 'Admin' | 'Accountant' | 'Salesperson';

export interface Account {
  id: string;
  name: string;
  phone: string;     // With country code, e.g., +967XXXXX
  address: string;
  openingBalance: number; // Opening balance in the account's specific currency
  type: AccountType;
  createdAt: string;
  currency?: string;  // Account specific currency (e.g. YER, USD, EUR, AED, YER)
  status?: 'active' | 'closed'; // Status of account: active or closed
  notificationsEnabled?: boolean; // Opt-in or opt-out of notifications
  deletedAt?: string;
}

export interface Transaction {
  id: string;
  accountId: string;  // Relational link to Account
  date: string;
  description: string;
  type: 'debit' | 'credit'; // 'debit' (payments/receivables increase), 'credit' (purchases/debts decrease)
  amount: number;     // Amount in the account/transaction's currency
  quantity?: number;
  unitPrice?: number;
  extraCharges?: number;
  dayNumber?: number;     // Day number (e.g. 1 to 30)
  sourceEntryId?: string; // Links back to Page 3 daily ledger entry if created from there
  currency?: string;      // Transaction currency
  exchangeRate?: number;  // Exchange rate to primary currency at the time
  deletedAt?: string;
}

export interface DailyLedgerEntry {
  id: string;
  dayNumber: number;      // 1 to 30
  date: string;          // Calendar picker
  description: string;   // Transaction details / item name
  quantity: number;
  unitPrice: number;
  extraCharges: number;
  total: number;         // Formula: (Quantity * Unit Price) + Extra Charges
  accountId?: string;    // Selected linked Account (relational update)
  accountType?: AccountType; // To track if linked account was supplier or buyer
  transactionType?: 'debit' | 'credit'; // Whether to record as Debit or Credit in the account ledger
  currency?: string;      // Currency of the ledger entry
  deletedAt?: string;
}

export interface GatewayConfig {
  whatsappEnabled: boolean;
  smsEnabled: boolean;
  whatsappApiKey: string;
  smsApiKey: string;
  senderName: string;
  whatsappGatewayUrl: string;
  smsGatewayUrl: string;
  defaultExchangeRate?: number;
}

export interface TriggeredMessage {
  id: string;
  timestamp: string;
  recipientName: string;
  phone: string;
  channel: 'WhatsApp' | 'SMS';
  text: string;
  status: 'success' | 'failed' | 'pending';
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  day?: string;
  dateString?: string;
  additions?: number;
}

export interface InvoiceRecord {
  id: string;
  invoiceNumber: string;
  date: string;
  accountId: string;
  notes: string;
  items: InvoiceItem[];
  total: number;
  currency: string;
  attachmentName?: string;
  attachmentData?: string;
  type?: 'sale' | 'purchase';
}

export interface ExchangeRates {
  [currencyCode: string]: number; // Conversion factor, relative to USD or relative to base
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  username: string;
  actionType: 'add' | 'edit' | 'delete' | 'restore';
  entityType: 'account' | 'transaction' | 'ledger_entry' | 'invoice';
  entityId: string;
  details: string;
}
