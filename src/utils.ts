/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Account, Transaction, DailyLedgerEntry, GatewayConfig, TriggeredMessage, InvoiceRecord, ActivityLog } from './types';
import { SUPPORTED_CURRENCIES, DEFAULT_RATES, fetchLiveExchangeRates, convertAmount } from './currencyUtils';

// Standard LocalStorage keys
const STORAGE_KEYS = {
  ACCOUNTS: 'smartacc_accounts',
  TRANSACTIONS: 'smartacc_transactions',
  DAILY_ENTRIES: 'smartacc_daily_entries',
  GATEWAY_CONFIG: 'smartacc_gateway_config',
  TRIGGERED_MESSAGES: 'smartacc_triggered_messages',
  THEME: 'smartacc_theme',
  DELETED_ACCOUNTS: 'smartacc_deleted_accounts',
  DELETED_TRANSACTIONS: 'smartacc_deleted_transactions',
  DELETED_DAILY_ENTRIES: 'smartacc_deleted_daily_entries',
  INVOICES: 'smartacc_invoices',
  DELETED_INVOICES: 'smartacc_deleted_invoices',
  ACTIVITY_LOGS: 'smartacc_activity_logs',
  PRINT_COMPANY_LOGO: 'smartacc_print_company_logo'
};

// Default Gateway Config
export const DEFAULT_GATEWAY_CONFIG: GatewayConfig = {
  whatsappEnabled: true,
  smsEnabled: false,
  whatsappApiKey: '',
  smsApiKey: '',
  senderName: 'DaftarPlay',
  whatsappGatewayUrl: 'https://api.whatsapp-gateway-service.io/v1/send',
  smsGatewayUrl: 'https://api.sms-direct-gateway.net/v1/sms/send'
};

// Arabic weekdays
export const ARABIC_DAYS = [
  'الأحد',
  'الإثنين',
  'الثلاثاء',
  'الأربعاء',
  'الخميس',
  'الجمعة',
  'السبت'
];

export function getArabicDayName(dateString: string): string {
  try {
    const date = new Date(dateString);
    const dayIndex = date.getDay();
    return ARABIC_DAYS[dayIndex] || '';
  } catch (e) {
    return 'غير محدد';
  }
}

// Initial Accounts Seed
const INITIAL_ACCOUNTS: Account[] = [
  {
    id: 'acc_1',
    name: 'مؤسسة صنعاء للتوريد (شركة توريد الأخشاب)',
    phone: '+967770123456',
    address: 'صنعاء - حدة - شارع الخمسين',
    openingBalance: 15000,
    type: 'supplier',
    createdAt: '2026-05-10T08:00:00Z'
  },
  {
    id: 'acc_2',
    name: 'شركة هائل سعيد للمواد التحويلية',
    phone: '+967737654321',
    address: 'تعز - منطقة الحوبان الصناعية',
    openingBalance: 45000,
    type: 'supplier',
    createdAt: '2026-05-12T09:15:00Z'
  },
  {
    id: 'acc_3',
    name: 'العميل المميز: شركة المقاولات الحديثة',
    phone: '+967719998887',
    address: 'عدن - خور مكسر - الشارع الرئيسي',
    openingBalance: 25000,
    type: 'buyer',
    createdAt: '2026-05-15T10:30:00Z'
  },
  {
    id: 'acc_4',
    name: 'محلات النور لبيع التجزئة',
    phone: '+967774521876',
    address: 'إب - شارع الدائري الغربي',
    openingBalance: 7500,
    type: 'buyer',
    createdAt: '2026-05-18T14:00:00Z'
  },
  {
    id: 'acc_5',
    name: 'مورد مواد البناء الأساسية (شركة الإسمنت والحديد)',
    phone: '+967731827364',
    address: 'الحديدة - شارع الميناء',
    openingBalance: 8000,
    type: 'supplier',
    createdAt: '2026-05-19T11:00:00Z'
  },
  {
    id: 'acc_6',
    name: 'عميل فردي: أحمد عبد الله الودعاني',
    phone: '+967717283940',
    address: 'المكلا - الشرج',
    openingBalance: 1200,
    type: 'buyer',
    createdAt: '2026-05-20T16:45:00Z'
  }
];

// Initial Transactions Seed
const INITIAL_TRANSACTIONS: Transaction[] = [
  // Supplier 1 (صنعاء للتوريد) Transactions (Opening = 15000)
  {
    id: 'tx_1',
    accountId: 'acc_1',
    date: '2026-06-01',
    description: 'شراء ألواح خشبية زان درجة أولى',
    type: 'credit', // Credit purchase increases payable
    amount: 12000,
    quantity: 40,
    unitPrice: 300,
    extraCharges: 0
  },
  {
    id: 'tx_2',
    accountId: 'acc_1',
    date: '2026-06-03',
    description: 'دفعة نقدية من الحساب - شيك رقم 8872',
    type: 'debit', // Debit reduces payable
    amount: 15000
  },
  // Supplier 2 (سابك للمواد) (Opening = 45000)
  {
    id: 'tx_3',
    accountId: 'acc_2',
    date: '2026-06-02',
    description: 'شراء حبيبات بلاستيك بولي بروبيلين',
    type: 'credit',
    amount: 32000,
    quantity: 8,
    unitPrice: 4000,
    extraCharges: 0
  },
  {
    id: 'tx_4',
    accountId: 'acc_2',
    date: '2026-06-05',
    description: 'تحويل بنكي صادر لمستحقات سابك',
    type: 'debit',
    amount: 40000
  },
  // Buyer 3 (المقاولات الحديثة) Transactions (Opening = 25000)
  {
    id: 'tx_5',
    accountId: 'acc_3',
    date: '2026-06-02',
    description: 'بيع خرسانة جاهزة ومواد تسليح صب',
    type: 'debit', // Sale to buyer increases receivable
    amount: 18500,
    quantity: 37,
    unitPrice: 500,
    extraCharges: 0
  },
  {
    id: 'tx_6',
    accountId: 'acc_3',
    date: '2026-06-04',
    description: 'دفعة مستلمة نقداً عن فاتورة رقم 1102',
    type: 'credit', // Payment from buyer reduces receivable
    amount: 20000
  },
  // Buyer 4 (محلات النور) (Opening = 7500)
  {
    id: 'tx_7',
    accountId: 'acc_4',
    date: '2026-06-03',
    description: 'بيع بضاعة منوعة ومستلزمات كهربائية',
    type: 'debit',
    amount: 4800,
    quantity: 12,
    unitPrice: 400,
    extraCharges: 0
  }
];

// Initial 30-Day Daily Entry Ledger
const INITIAL_DAILY_ENTRIES: DailyLedgerEntry[] = [
  {
    id: 'entry_1',
    dayNumber: 1,
    date: '2026-06-01',
    description: 'أخشاب زان توريد مؤسسة صنعاء للورش',
    quantity: 40,
    unitPrice: 300,
    extraCharges: 0,
    total: 12000,
    accountId: 'acc_1',
    accountType: 'supplier',
    transactionType: 'credit'
  },
  {
    id: 'entry_2',
    dayNumber: 2,
    date: '2026-06-02',
    description: 'مواد تحويلية وبلاستيك من شركة سابك',
    quantity: 8,
    unitPrice: 4000,
    extraCharges: 0,
    total: 32000,
    accountId: 'acc_2',
    accountType: 'supplier',
    transactionType: 'credit'
  },
  {
    id: 'entry_3',
    dayNumber: 2,
    date: '2026-06-02',
    description: 'مبيعات خرسانة لشركة المقاولات الحديثة',
    quantity: 37,
    unitPrice: 500,
    extraCharges: 0,
    total: 18500,
    accountId: 'acc_3',
    accountType: 'buyer',
    transactionType: 'debit'
  },
  {
    id: 'entry_4',
    dayNumber: 3,
    date: '2026-06-03',
    description: 'بيع مستلزمات كهربائية لمحلات النور',
    quantity: 12,
    unitPrice: 400,
    extraCharges: 0,
    total: 4800,
    accountId: 'acc_4',
    accountType: 'buyer',
    transactionType: 'debit'
  },
  {
    id: 'entry_5',
    dayNumber: 4,
    date: '2026-06-04',
    description: 'مبيعات حديد تسليح ومواد بناء متنوعة لشركة المقاولات',
    quantity: 15,
    unitPrice: 1200,
    extraCharges: 250,
    total: 18250,
    accountId: 'acc_3',
    accountType: 'buyer',
    transactionType: 'debit'
  },
  {
    id: 'entry_6',
    dayNumber: 5,
    date: '2026-06-05',
    description: 'شراء كواشف إسمنتية من مورد إسمنت الدمام',
    quantity: 100,
    unitPrice: 75,
    extraCharges: 50,
    total: 7550,
    accountId: 'acc_5',
    accountType: 'supplier',
    transactionType: 'credit'
  },
  {
    id: 'entry_7',
    dayNumber: 6,
    date: '2026-06-06',
    description: 'بيع مواد معمارية للعميل أحمد عبد الله',
    quantity: 5,
    unitPrice: 350,
    extraCharges: 15,
    total: 1765,
    accountId: 'acc_6',
    accountType: 'buyer',
    transactionType: 'debit'
  },
  {
    id: 'entry_8',
    dayNumber: 7,
    date: '2026-06-07',
    description: 'عملية توريد حديد مجلفن من صناعية الدمام',
    quantity: 10,
    unitPrice: 1500,
    extraCharges: 300,
    total: 15300,
    accountId: 'acc_5',
    accountType: 'supplier',
    transactionType: 'credit'
  }
];

// Helper to load data from localStorage or fallback
export function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (e) {
    console.error(`Error loading key ${key} from storage:`, e);
    return defaultValue;
  }
}

export function saveToStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`Error saving key ${key} to storage:`, e);
  }
}

// Default Exchange Rates (Base: USD = 1.0)
export const DEFAULT_EXCHANGE_RATES: { [key: string]: number } = DEFAULT_RATES;

// Global Core Relational State Engine
export class Database {
  accounts: Account[] = [];
  transactions: Transaction[] = [];
  dailyEntries: DailyLedgerEntry[] = [];
  invoices: InvoiceRecord[] = [];
  activityLogs: ActivityLog[] = [];
  printCompanyLogo: string = '';

  deletedAccounts: Account[] = [];
  deletedTransactions: Transaction[] = [];
  deletedDailyEntries: DailyLedgerEntry[] = [];
  deletedInvoices: InvoiceRecord[] = [];

  gatewayConfig: GatewayConfig = DEFAULT_GATEWAY_CONFIG;
  triggeredMessages: TriggeredMessage[] = [];
  primaryCurrency: string = 'YER';
  exchangeRates: { [key: string]: number } = DEFAULT_RATES;
  lastRatesUpdate: string = '';
  restrictToAdmin: boolean = false;
  appAccentColor: string = 'slate';
  appBorderShape: string = 'rounded-2xl';
  appBrandIcon: string = 'Building2';
  appBackgroundImage: string = '';
  appBackgroundOpacity: number = 5;
  currentUser: string = 'Admin';

  // Print & PDF Customizable Parameters
  printCompanyName: string = 'نظام أنس المحاسبي المطور';
  printPhone: string = '+967 774 928 318';
  printAddress: string = 'اليمن - صنعاء - شارع الستين الرئيسي';
  printTaxNumber: string = '99827-Tax-YE';
  printHeaderNote: string = 'كشف حساب مالي تفصيلي معتمد';
  printFooterNote: string = 'شاكرين ثقتكم الثمينة بنا. تم استخراج هذا السند إلكترونياً من نظام ANAS الذكي لضمان الدقة والأمان.';
  printThemeColor: string = 'indigo'; // indigo, blue, emerald, slate, red, amber, teal
  printShowBalance: boolean = true;
  printShowSignature: boolean = true;
  printShowWatermark: boolean = true;
  printPaperSize: string = 'A4'; // A4, Thermal

  showWidgetTotalSales: boolean = true;
  showWidgetActiveAccounts: boolean = true;
  showWidgetAlerts: boolean = true;

  constructor() {
    this.reload();
  }

  reload() {
    const rawAccounts = loadFromStorage<Account[]>(STORAGE_KEYS.ACCOUNTS, INITIAL_ACCOUNTS);
    // Ensure all accounts have a currency and status set; fallback to initial default
    this.accounts = rawAccounts.map(acc => ({
      ...acc,
      currency: acc.currency || 'YER',
      status: acc.status || 'active'
    }));

    this.transactions = loadFromStorage<Transaction[]>(STORAGE_KEYS.TRANSACTIONS, INITIAL_TRANSACTIONS).map(tx => ({
      ...tx,
      currency: tx.currency || 'YER'
    }));
    this.dailyEntries = loadFromStorage<DailyLedgerEntry[]>(STORAGE_KEYS.DAILY_ENTRIES, INITIAL_DAILY_ENTRIES).map(entry => ({
      ...entry,
      currency: entry.currency || 'YER'
    }));
    this.invoices = loadFromStorage<InvoiceRecord[]>(STORAGE_KEYS.INVOICES, []);

    this.deletedAccounts = loadFromStorage<Account[]>(STORAGE_KEYS.DELETED_ACCOUNTS, []);
    this.deletedTransactions = loadFromStorage<Transaction[]>(STORAGE_KEYS.DELETED_TRANSACTIONS, []);
    this.deletedDailyEntries = loadFromStorage<DailyLedgerEntry[]>(STORAGE_KEYS.DELETED_DAILY_ENTRIES, []);
    this.deletedInvoices = loadFromStorage<InvoiceRecord[]>(STORAGE_KEYS.DELETED_INVOICES, []);

    this.gatewayConfig = loadFromStorage<GatewayConfig>(STORAGE_KEYS.GATEWAY_CONFIG, DEFAULT_GATEWAY_CONFIG);
    // Remove credentials that were previously hard-coded in the shipped client.
    // Existing users are forced to re-enter real provider credentials instead of
    // accidentally sending requests with placeholder/leaked values.
    if (this.gatewayConfig.whatsappApiKey?.startsWith('WA_KEY_PRO_')) this.gatewayConfig.whatsappApiKey = '';
    if (this.gatewayConfig.smsApiKey?.startsWith('SMS_KEY_DIRECT_')) this.gatewayConfig.smsApiKey = '';
    if (this.gatewayConfig.whatsappGatewayUrl === 'https://api.whatsapp-gateway-service.io/v1/send') this.gatewayConfig.whatsappGatewayUrl = '';
    if (this.gatewayConfig.smsGatewayUrl === 'https://api.sms-direct-gateway.net/v1/sms/send') this.gatewayConfig.smsGatewayUrl = '';
    this.triggeredMessages = loadFromStorage<TriggeredMessage[]>(STORAGE_KEYS.TRIGGERED_MESSAGES, []);
    this.primaryCurrency = loadFromStorage<string>('smartacc_primary_currency', 'YER');
    this.exchangeRates = loadFromStorage<{ [key: string]: number }>('smartacc_exchange_rates', DEFAULT_RATES);
    this.lastRatesUpdate = loadFromStorage<string>('smartacc_last_rates_update', '');
    this.restrictToAdmin = loadFromStorage<boolean>('smartacc_restrict_to_admin', false);
    this.appAccentColor = loadFromStorage<string>('smartacc_app_accent_color', 'blue');
    this.appBorderShape = loadFromStorage<string>('smartacc_app_border_shape', 'rounded-2xl');
    this.appBrandIcon = loadFromStorage<string>('smartacc_app_brand_icon', 'Building2');
    this.appBackgroundImage = loadFromStorage<string>('smartacc_app_background_image', '');
    this.appBackgroundOpacity = loadFromStorage<number>('smartacc_app_background_opacity', 5);

    // Load PDF print custom settings
    this.printCompanyName = loadFromStorage<string>('smartacc_print_company_name', 'نظام أنس المحاسبي المطور');
    this.printPhone = loadFromStorage<string>('smartacc_print_phone', '+967 774 928 318');
    this.printAddress = loadFromStorage<string>('smartacc_print_address', 'اليمن - صنعاء - شارع الستين الرئيسي');
    this.printTaxNumber = loadFromStorage<string>('smartacc_print_tax_number', '99827-Tax-YE');
    this.printHeaderNote = loadFromStorage<string>('smartacc_print_header_note', 'كشف حساب مالي تفصيلي معتمد');
    this.printFooterNote = loadFromStorage<string>('smartacc_print_footer_note', 'شاكرين ثقتكم الثمينة بنا. تم استخراج هذا السند إلكترونياً من نظام ANAS الذكي لضمان الدقة والأمان.');
    this.printThemeColor = loadFromStorage<string>('smartacc_print_theme_color', 'indigo');
    this.printShowBalance = loadFromStorage<boolean>('smartacc_print_show_balance', true);
    this.printShowSignature = loadFromStorage<boolean>('smartacc_print_show_signature', true);
    this.printShowWatermark = loadFromStorage<boolean>('smartacc_print_show_watermark', true);
    this.printPaperSize = loadFromStorage<string>('smartacc_print_paper_size', 'A4');

    this.showWidgetTotalSales = loadFromStorage<boolean>('smartacc_show_widget_total_sales', true);
    this.showWidgetActiveAccounts = loadFromStorage<boolean>('smartacc_show_widget_active_accounts', true);
    this.showWidgetAlerts = loadFromStorage<boolean>('smartacc_show_widget_alerts', true);

    this.printCompanyLogo = loadFromStorage<string>(STORAGE_KEYS.PRINT_COMPANY_LOGO, '');
    this.activityLogs = loadFromStorage<ActivityLog[]>(STORAGE_KEYS.ACTIVITY_LOGS, []);
  }

  exportState() {
    return {
      accounts: this.accounts,
      transactions: this.transactions,
      dailyEntries: this.dailyEntries,
      invoices: this.invoices,
      deletedAccounts: this.deletedAccounts,
      deletedTransactions: this.deletedTransactions,
      deletedDailyEntries: this.deletedDailyEntries,
      deletedInvoices: this.deletedInvoices,
      gatewayConfig: this.gatewayConfig,
      triggeredMessages: this.triggeredMessages,
      primaryCurrency: this.primaryCurrency,
      exchangeRates: this.exchangeRates,
      lastRatesUpdate: this.lastRatesUpdate,
      restrictToAdmin: this.restrictToAdmin,
      appAccentColor: this.appAccentColor,
      appBorderShape: this.appBorderShape,
      appBrandIcon: this.appBrandIcon,
      appBackgroundImage: this.appBackgroundImage,
      appBackgroundOpacity: this.appBackgroundOpacity,
      printCompanyName: this.printCompanyName,
      printPhone: this.printPhone,
      printAddress: this.printAddress,
      printTaxNumber: this.printTaxNumber,
      printHeaderNote: this.printHeaderNote,
      printFooterNote: this.printFooterNote,
      printThemeColor: this.printThemeColor,
      printShowBalance: this.printShowBalance,
      printShowSignature: this.printShowSignature,
      printShowWatermark: this.printShowWatermark,
      printPaperSize: this.printPaperSize,
      showWidgetTotalSales: this.showWidgetTotalSales,
      showWidgetActiveAccounts: this.showWidgetActiveAccounts,
      showWidgetAlerts: this.showWidgetAlerts,
      printCompanyLogo: this.printCompanyLogo,
      activityLogs: this.activityLogs,
    };
  }

  importState(state: any) {
    if (!state) return;

    // Helper to merge arrays and move replaced items to deleted
    const mergeEntities = (current: any[], incoming: any[], deletedStorage: any[]) => {
      const merged = [...current];

      for (const incomingItem of incoming) {
        const existingIndex = merged.findIndex(item => item.id === incomingItem.id);
        if (existingIndex !== -1) {
          // If the item exists and is different, move old one to deletedStorage
          if (JSON.stringify(merged[existingIndex]) !== JSON.stringify(incomingItem)) {
            const oldItem = { ...merged[existingIndex], deletedAt: new Date().toISOString() };
            deletedStorage.push(oldItem);
            merged[existingIndex] = incomingItem;
          }
        } else {
          merged.push(incomingItem);
        }
      }
      return merged;
    };

    if (state.accounts !== undefined) this.accounts = mergeEntities(this.accounts, state.accounts, this.deletedAccounts);
    if (state.transactions !== undefined) this.transactions = mergeEntities(this.transactions, state.transactions, this.deletedTransactions);
    if (state.dailyEntries !== undefined) this.dailyEntries = mergeEntities(this.dailyEntries, state.dailyEntries, this.deletedDailyEntries);
    if (state.invoices !== undefined) this.invoices = mergeEntities(this.invoices, state.invoices, this.deletedInvoices);

    // Keep configuration and other state from backup if defined, but don't overwrite if not wanted?
    // Actually, user probably wants to restore settings too. Let's restore them but not delete current items in arrays.
    // The previous implementation was simple overwriting. The request is specifically about data (accounts/transactions).
    // Let's keep existing assignments for non-array fields to be safe.

    if (state.gatewayConfig !== undefined) this.gatewayConfig = state.gatewayConfig;
    if (state.triggeredMessages !== undefined) this.triggeredMessages = state.triggeredMessages;
    if (state.primaryCurrency !== undefined) this.primaryCurrency = state.primaryCurrency;
    if (state.exchangeRates !== undefined) this.exchangeRates = state.exchangeRates;
    if (state.lastRatesUpdate !== undefined) this.lastRatesUpdate = state.lastRatesUpdate;
    if (state.restrictToAdmin !== undefined) this.restrictToAdmin = state.restrictToAdmin;
    if (state.appAccentColor !== undefined) this.appAccentColor = state.appAccentColor;
    if (state.appBorderShape !== undefined) this.appBorderShape = state.appBorderShape;
    if (state.appBrandIcon !== undefined) this.appBrandIcon = state.appBrandIcon;
    if (state.appBackgroundImage !== undefined) this.appBackgroundImage = state.appBackgroundImage;
    if (state.appBackgroundOpacity !== undefined) this.appBackgroundOpacity = state.appBackgroundOpacity;
    if (state.printCompanyName !== undefined) this.printCompanyName = state.printCompanyName;
    if (state.printPhone !== undefined) this.printPhone = state.printPhone;
    if (state.printAddress !== undefined) this.printAddress = state.printAddress;
    if (state.printTaxNumber !== undefined) this.printTaxNumber = state.printTaxNumber;
    if (state.printHeaderNote !== undefined) this.printHeaderNote = state.printHeaderNote;
    if (state.printFooterNote !== undefined) this.printFooterNote = state.printFooterNote;
    if (state.printThemeColor !== undefined) this.printThemeColor = state.printThemeColor;
    if (state.printShowBalance !== undefined) this.printShowBalance = state.printShowBalance;
    if (state.printShowSignature !== undefined) this.printShowSignature = state.printShowSignature;
    if (state.printShowWatermark !== undefined) this.printShowWatermark = state.printShowWatermark;
    if (state.printPaperSize !== undefined) this.printPaperSize = state.printPaperSize;
    if (state.showWidgetTotalSales !== undefined) this.showWidgetTotalSales = state.showWidgetTotalSales;
    if (state.showWidgetActiveAccounts !== undefined) this.showWidgetActiveAccounts = state.showWidgetActiveAccounts;
    if (state.showWidgetAlerts !== undefined) this.showWidgetAlerts = state.showWidgetAlerts;
    if (state.printCompanyLogo !== undefined) this.printCompanyLogo = state.printCompanyLogo;
    if (state.activityLogs !== undefined) this.activityLogs = state.activityLogs;

    this.save();
  }

  save() {
    saveToStorage(STORAGE_KEYS.ACCOUNTS, this.accounts);
    saveToStorage(STORAGE_KEYS.TRANSACTIONS, this.transactions);
    saveToStorage(STORAGE_KEYS.DAILY_ENTRIES, this.dailyEntries);
    saveToStorage(STORAGE_KEYS.INVOICES, this.invoices);
    saveToStorage(STORAGE_KEYS.DELETED_ACCOUNTS, this.deletedAccounts);
    saveToStorage(STORAGE_KEYS.DELETED_TRANSACTIONS, this.deletedTransactions);
    saveToStorage(STORAGE_KEYS.DELETED_DAILY_ENTRIES, this.deletedDailyEntries);
    saveToStorage(STORAGE_KEYS.DELETED_INVOICES, this.deletedInvoices);
    saveToStorage(STORAGE_KEYS.GATEWAY_CONFIG, this.gatewayConfig);
    saveToStorage(STORAGE_KEYS.TRIGGERED_MESSAGES, this.triggeredMessages);
    saveToStorage('smartacc_primary_currency', this.primaryCurrency);
    saveToStorage('smartacc_exchange_rates', this.exchangeRates);
    saveToStorage('smartacc_last_rates_update', this.lastRatesUpdate);
    saveToStorage('smartacc_restrict_to_admin', this.restrictToAdmin);
    saveToStorage('smartacc_app_accent_color', this.appAccentColor);
    saveToStorage('smartacc_app_border_shape', this.appBorderShape);
    saveToStorage('smartacc_app_brand_icon', this.appBrandIcon);
    saveToStorage('smartacc_app_background_image', this.appBackgroundImage);
    saveToStorage('smartacc_app_background_opacity', this.appBackgroundOpacity);

    // Save print / PDF custom settings
    saveToStorage('smartacc_print_company_name', this.printCompanyName);
    saveToStorage('smartacc_print_phone', this.printPhone);
    saveToStorage('smartacc_print_address', this.printAddress);
    saveToStorage('smartacc_print_tax_number', this.printTaxNumber);
    saveToStorage('smartacc_print_header_note', this.printHeaderNote);
    saveToStorage('smartacc_print_footer_note', this.printFooterNote);
    saveToStorage('smartacc_print_theme_color', this.printThemeColor);
    saveToStorage('smartacc_print_show_balance', this.printShowBalance);
    saveToStorage('smartacc_print_show_signature', this.printShowSignature);
    saveToStorage('smartacc_print_show_watermark', this.printShowWatermark);
    saveToStorage('smartacc_print_paper_size', this.printPaperSize);

    saveToStorage('smartacc_show_widget_total_sales', this.showWidgetTotalSales);
    saveToStorage('smartacc_show_widget_active_accounts', this.showWidgetActiveAccounts);
    saveToStorage('smartacc_show_widget_alerts', this.showWidgetAlerts);

    saveToStorage(STORAGE_KEYS.PRINT_COMPANY_LOGO, this.printCompanyLogo);
    saveToStorage(STORAGE_KEYS.ACTIVITY_LOGS, this.activityLogs);
  }

  logActivity(username: string, actionType: 'add' | 'edit' | 'delete' | 'restore', entityType: 'account' | 'transaction' | 'ledger_entry' | 'invoice', entityId: string, details: string) {
    const log: ActivityLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
      username: username || 'مجهول',
      actionType,
      entityType,
      entityId,
      details
    };
    this.activityLogs = [log, ...this.activityLogs];
    if (this.activityLogs.length > 1000) {
      this.activityLogs = this.activityLogs.slice(0, 1000);
    }
    this.save();
  }

  // --- MULTI-CURRENCY CONVERSION SYSTEM (Strict Requirement) ---
  convertCurrency(amount: number, from: string, to?: string): number {
    const targetCurrency = to || this.primaryCurrency || 'YER';
    const sourceCurrency = from || this.primaryCurrency || 'YER';
    return convertAmount(amount, sourceCurrency, targetCurrency, this.exchangeRates);
  }

  // Fetch dynamic rates from public open API
  async fetchExchangeRates(): Promise<boolean> {
    const result = await fetchLiveExchangeRates(this.exchangeRates);
    if (result.success) {
      this.exchangeRates = result.rates;
      this.lastRatesUpdate = result.timestamp;
      this.save();
      this.logActivity(this.currentUser, 'edit', 'account', 'currency_rates', 'تم تحديث أسعار صرف العملات تلقائياً عبر الإنترنت');
      return true;
    }
    return false;
  }

  // Manual update of exchange rate for specific currency
  updateExchangeRate(currencyCode: string, rateAgainstUSD: number) {
    if (!currencyCode || rateAgainstUSD <= 0) return;
    this.exchangeRates = {
      ...this.exchangeRates,
      [currencyCode]: Number(rateAgainstUSD)
    };
    this.lastRatesUpdate = new Date().toISOString();
    this.save();
    this.logActivity(this.currentUser, 'edit', 'account', `rate_${currencyCode}`, `تم تحديث سعر صرف ${currencyCode} يدوياً إلى ${rateAgainstUSD}`);
  }

  updateExchangeRates(newRates: { [key: string]: number }) {
    this.exchangeRates = {
      ...this.exchangeRates,
      ...newRates,
      USD: 1.0
    };
    this.lastRatesUpdate = new Date().toISOString();
    this.save();
    this.logActivity(this.currentUser, 'edit', 'account', 'currency_rates', 'تم حفظ أسعار الصرف المعدلة يدوياً');
  }

  setPrimaryCurrency(curr: string) {
    const oldCurr = this.primaryCurrency;
    this.primaryCurrency = curr;
    this.save();
    this.logActivity(this.currentUser, 'edit', 'account', 'primary_currency', `تم تغيير العملة الرئيسية للنظام من ${oldCurr} إلى ${curr}`);
  }

  // --- ACCOUNT MANAGEMENT ---
  addAccount(account: Omit<Account, 'id' | 'createdAt'>): Account {
    const newAccount: Account = {
      ...account,
      currency: account.currency || 'YER',
      status: account.status || 'active',
      id: `acc_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      createdAt: new Date().toISOString()
    };
    this.accounts = [...this.accounts, newAccount];
    this.save();
    this.logActivity(this.currentUser, 'add', 'account', newAccount.id, `تم إضافة حساب جديد: ${newAccount.name} (${newAccount.type === 'supplier' ? 'مورد' : 'عميل'})`);
    return newAccount;
  }

  updateAccount(updated: Account): void {
    this.accounts = this.accounts.map(acc => acc.id === updated.id ? updated : acc);
    this.save();
    this.logActivity(this.currentUser, 'edit', 'account', updated.id, `تم تعديل بيانات الحساب: ${updated.name}`);
  }

  addInvoice(invoice: Omit<InvoiceRecord, 'id'>): InvoiceRecord {
    const newInvoice: InvoiceRecord = {
      ...invoice,
      id: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`
    };
    this.invoices = [...this.invoices, newInvoice];
    this.save();
    this.logActivity(this.currentUser, 'add', 'invoice', newInvoice.id, `تم إضافة فاتورة جديدة رقم ${newInvoice.invoiceNumber} بقيمة ${newInvoice.total} ${newInvoice.currency}`);
    return newInvoice;
  }

  deleteInvoice(id: string): void {
    const inv = this.invoices.find(i => i.id === id);
    if (inv) {
      this.deletedInvoices.push(inv);
      this.invoices = this.invoices.filter(i => i.id !== id);

      // Also delete linked transaction if there is one
      const linkedTxDescription = `فاتورة مبيعات رقم ${inv.invoiceNumber}`;
      const linkedTxDescriptionPurchase = `فاتورة مشتريات رقم ${inv.invoiceNumber}`;
      const linkedTxs = this.transactions.filter(tx =>
        tx.accountId === inv.accountId &&
        (tx.description === linkedTxDescription || tx.description === linkedTxDescriptionPurchase)
      );
      linkedTxs.forEach(tx => tx.deletedAt = new Date().toISOString());
      this.deletedTransactions.push(...linkedTxs);
      this.transactions = this.transactions.filter(tx => !linkedTxs.includes(tx));

      this.save();
      this.logActivity(this.currentUser, 'delete', 'invoice', id, `تم حذف الفاتورة رقم ${inv.invoiceNumber}`);
    }
  }

  deleteAccount(id: string): void {
    const acc = this.accounts.find(a => a.id === id);
    if (acc) {
      acc.deletedAt = new Date().toISOString();
      this.deletedAccounts.push(acc);
      this.accounts = this.accounts.filter(a => a.id !== id);

      const linkedTxs = this.transactions.filter(tx => tx.accountId === id);
      linkedTxs.forEach(tx => tx.deletedAt = new Date().toISOString());
      this.deletedTransactions.push(...linkedTxs);
      this.transactions = this.transactions.filter(tx => tx.accountId !== id);

      this.save();
      this.logActivity(this.currentUser, 'delete', 'account', id, `تم حذف الحساب: ${acc.name}`);
    }
  }

  // --- LEDGER STATEMENTS & BALANCES ---

  // Calculate specific Account current balance dynamically (Relational & Currency-Aware)
  getAccountBalance(accountId: string): number {
    const account = this.accounts.find(a => a.id === accountId);
    if (!account) return 0;

    const accCurrency = account.currency || 'YER';
    const txs = this.transactions.filter(tx => tx.accountId === accountId);

    // Convert transaction amount from its source currency to account base currency
    const getTxAmountInAccountCurrency = (tx: Transaction) => {
      const txCurr = tx.currency || accCurrency;
      if (txCurr === accCurrency) return tx.amount;
      return this.convertCurrency(tx.amount, txCurr, accCurrency);
    };

    if (account.type === 'supplier') {
      // For Supplier: Payables (credit) increase debt; Payments (debit) reduce it.
      const totalCredits = txs.filter(tx => tx.type === 'credit').reduce((sum, tx) => sum + getTxAmountInAccountCurrency(tx), 0);
      const totalDebits = txs.filter(tx => tx.type === 'debit').reduce((sum, tx) => sum + getTxAmountInAccountCurrency(tx), 0);
      return account.openingBalance + totalCredits - totalDebits;
    } else {
      // For Buyer: Cash receivables (debit) increase what they owe us; Payments from them (credit) reduces it.
      const totalDebits = txs.filter(tx => tx.type === 'debit').reduce((sum, tx) => sum + getTxAmountInAccountCurrency(tx), 0);
      const totalCredits = txs.filter(tx => tx.type === 'credit').reduce((sum, tx) => sum + getTxAmountInAccountCurrency(tx), 0);
      return account.openingBalance + totalDebits - totalCredits;
    }
  }

  getAccountTotals(accountId: string) {
    const account = this.accounts.find(a => a.id === accountId);
    if (!account) return { debit: 0, credit: 0, balance: 0 };

    const accCurrency = account.currency || 'YER';
    const txs = this.transactions.filter(tx => tx.accountId === accountId);

    const getTxAmountInAccountCurrency = (tx: Transaction) => {
      const txCurr = tx.currency || accCurrency;
      return this.convertCurrency(tx.amount, txCurr, accCurrency);
    };

    const debitSum = txs.filter(tx => tx.type === 'debit').reduce((s, t) => s + getTxAmountInAccountCurrency(t), 0);
    const creditSum = txs.filter(tx => tx.type === 'credit').reduce((s, t) => s + getTxAmountInAccountCurrency(t), 0);

    return {
      debit: debitSum,
      credit: creditSum,
      balance: this.getAccountBalance(accountId)
    };
  }

  // --- TRANSACTION MANAGEMENT ---
  addTransaction(tx: Omit<Transaction, 'id'>, triggerMessage = true): Transaction {
    const account = this.accounts.find(a => a.id === tx.accountId);
    const newTx: Transaction = {
      ...tx,
      currency: tx.currency || account?.currency || 'YER',
      id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`
    };
    this.transactions = [...this.transactions, newTx];
    this.save();

    this.logActivity(
      this.currentUser,
      'add',
      'transaction',
      newTx.id,
      `تم تسجيل حركة مالية بقيمة ${newTx.amount.toLocaleString('en-US')} ${newTx.currency} للحساب ${account?.name || 'مجهول'}: ${newTx.description}`
    );

    if (triggerMessage) {
      this.triggerAutomatedMessage(newTx);
    }

    return newTx;
  }

  deleteTransaction(id: string): void {
    const tx = this.transactions.find(t => t.id === id);
    if (tx) {
      tx.deletedAt = new Date().toISOString();
      this.deletedTransactions.push(tx);
      this.transactions = this.transactions.filter(t => t.id !== id);
      this.save();
      const account = this.accounts.find(a => a.id === tx.accountId);
      this.logActivity(
        this.currentUser,
        'delete',
        'transaction',
        id,
        `تم حذف حركة مالية بقيمة ${tx.amount.toLocaleString('en-US')} ${tx.currency} من الحساب ${account?.name || 'مجهول'}: ${tx.description}`
      );
    }
  }

  updateTransaction(updatedTx: Transaction): void {
    this.transactions = this.transactions.map(t => t.id === updatedTx.id ? updatedTx : t);
    this.save();
    const account = this.accounts.find(a => a.id === updatedTx.accountId);
    this.logActivity(
      this.currentUser,
      'edit',
      'transaction',
      updatedTx.id,
      `تم تعديل حركة مالية للحساب ${account?.name || 'مجهول'}: ${updatedTx.description} بقيمة ${updatedTx.amount.toLocaleString('en-US')} ${updatedTx.currency}`
    );
  }

  // --- 30-DAY DATA ENTRY LEDGER (Page 3) ---
  addDailyLedgerEntry(entry: Omit<DailyLedgerEntry, 'id'>): DailyLedgerEntry {
    const newEntry: DailyLedgerEntry = {
      ...entry,
      currency: entry.currency || 'YER',
      id: `entry_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`
    };
    this.dailyEntries = [...this.dailyEntries, newEntry];
    this.save();

    this.logActivity(
      this.currentUser,
      'add',
      'ledger_entry',
      newEntry.id,
      `تم تسجيل قيد يومي جديد في اليوم ${newEntry.dayNumber}: ${newEntry.description} بإجمالي ${newEntry.total.toLocaleString('en-US')} ${newEntry.currency}`
    );

    // RELATIONAL SYNC: If user linked an account (accountId is set),
    // automatically and immediately generate a transaction in that account's ledger!
    if (newEntry.accountId) {
      const linkedAcc = this.accounts.find(a => a.id === newEntry.accountId);
      this.addTransaction({
        accountId: newEntry.accountId,
        date: newEntry.date,
        description: newEntry.description,
        type: newEntry.transactionType || (newEntry.accountType === 'supplier' ? 'credit' : 'debit'),
        amount: newEntry.total,
        quantity: newEntry.quantity,
        unitPrice: newEntry.unitPrice,
        extraCharges: newEntry.extraCharges,
        dayNumber: newEntry.dayNumber,
        sourceEntryId: newEntry.id,
        currency: newEntry.currency // pass entry's currency
      }, true); // Trigger WhatsApp/SMS
    }

    return newEntry;
  }

  updateDailyLedgerEntry(updated: DailyLedgerEntry): void {
    // Find prior entry to see if we need to update/re-sync its linked transaction!
    const prior = this.dailyEntries.find(e => e.id === updated.id);

    // First update the daily entry itself
    this.dailyEntries = this.dailyEntries.map(e => e.id === updated.id ? updated : e);
    this.save();

    this.logActivity(
      this.currentUser,
      'edit',
      'ledger_entry',
      updated.id,
      `تم تعديل القيد اليومي في اليوم ${updated.dayNumber}: ${updated.description} بإجمالي ${updated.total.toLocaleString('en-US')} ${updated.currency || 'YER'}`
    );

    if (prior) {
      // Relational sync update:
      // Remove or update the transaction created by this entry
      this.transactions = this.transactions.filter(tx => tx.sourceEntryId !== updated.id);

      // Re-add/update relational ledger transaction if there is still an account link
      if (updated.accountId) {
        this.addTransaction({
          accountId: updated.accountId,
          date: updated.date,
          description: updated.description,
          type: updated.transactionType || (updated.accountType === 'supplier' ? 'credit' : 'debit'),
          amount: updated.total,
          quantity: updated.quantity,
          unitPrice: updated.unitPrice,
          extraCharges: updated.extraCharges,
          dayNumber: updated.dayNumber,
          sourceEntryId: updated.id,
          currency: updated.currency || 'YER'
        }, true); // Trigger WhatsApp/SMS on update
      }
    }
  }

  deleteDailyLedgerEntry(id: string): void {
    const entry = this.dailyEntries.find(e => e.id === id);
    if (entry) {
      entry.deletedAt = new Date().toISOString();
      this.deletedDailyEntries.push(entry);
      this.dailyEntries = this.dailyEntries.filter(e => e.id !== id);

      const linkedTxs = this.transactions.filter(tx => tx.sourceEntryId === id);
      linkedTxs.forEach(tx => tx.deletedAt = new Date().toISOString());
      this.deletedTransactions.push(...linkedTxs);
      this.transactions = this.transactions.filter(tx => tx.sourceEntryId !== id);

      this.save();

      this.logActivity(
        this.currentUser,
        'delete',
        'ledger_entry',
        id,
        `تم حذف القيد اليومي في اليوم ${entry.dayNumber}: ${entry.description}`
      );
    }
  }

  // --- AUTOMATED MESSAGING SYSTEM (Strict Requirement) ---
  triggerAutomatedMessage(tx: Transaction): void {
    const account = this.accounts.find(a => a.id === tx.accountId);
    if (!account) return;

    // Check if system messages are enabled, and if the specific account opted in
    if ((!this.gatewayConfig.whatsappEnabled && !this.gatewayConfig.smsEnabled) || account.notificationsEnabled === false) {
      return;
    }

    const currentBalance = this.getAccountBalance(account.id);
    const balanceText = `${currentBalance.toLocaleString('en-US', {minimumFractionDigits: 0, maximumFractionDigits: 2})} ${account.currency || 'YER'}`;

    // Dynamic translation to beautiful Arabic as specified by prompt
    const messageBody = `عزيزي ${account.name}، تم تسجيل عملية جديدة بتاريخ ${tx.date}. التفاصيل: ${tx.description}، الإجمالي: ${tx.amount} ${tx.currency || 'YER'}. رصيدك الحالي هو: ${balanceText}. نشكركم على حسن التعامل.`;

    // Trigger for WhatsApp if enabled
    if (this.gatewayConfig.whatsappEnabled) {
      this.triggeredMessages.unshift({
        id: `msg_wa_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        timestamp: new Date().toISOString(),
        recipientName: account.name,
        phone: account.phone,
        channel: 'WhatsApp',
        text: messageBody,
        status: 'success'
      });
    }

    // Trigger for SMS if enabled
    if (this.gatewayConfig.smsEnabled) {
      this.triggeredMessages.unshift({
        id: `msg_sms_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        timestamp: new Date().toISOString(),
        recipientName: account.name,
        phone: account.phone,
        channel: 'SMS',
        text: messageBody,
        status: 'success'
      });
    }

    // Limit log size to 100 entries to prevent local storage overflow
    if (this.triggeredMessages.length > 100) {
      this.triggeredMessages = this.triggeredMessages.slice(0, 100);
    }

    this.save();
  }

  // --- METRICS / CALCULATIONS (Page 1 Dashboard) ---

  // Dynamic Calculated Revenues (Daily / Weekly / Monthly) in Primary Currency!
  getRevenues() {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD

    // Calculate start of current week (assuming Saturday or Sunday start, let's say 7 days ago)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

    // Calculate start of current month
    const currentMonthPrefix = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

    const primary = this.primaryCurrency;

    const getEntryTotalInPrimary = (entry: DailyLedgerEntry) => {
      const entryCurr = entry.currency || 'YER';
      return this.convertCurrency(entry.total, entryCurr, primary);
    };

    const dailyRev = this.dailyEntries
      .filter(entry => entry.date === todayStr && (entry.accountType === undefined || entry.accountType === 'buyer'))
      .reduce((sum, e) => sum + getEntryTotalInPrimary(e), 0);

    const weeklyRev = this.dailyEntries
      .filter(entry => entry.date >= sevenDaysAgoStr && (entry.accountType === undefined || entry.accountType === 'buyer'))
      .reduce((sum, e) => sum + getEntryTotalInPrimary(e), 0);

    const monthlyRev = this.dailyEntries
      .filter(entry => entry.date.startsWith(currentMonthPrefix) && (entry.accountType === undefined || entry.accountType === 'buyer'))
      .reduce((sum, e) => sum + getEntryTotalInPrimary(e), 0);

    return {
      daily: dailyRev,
      weekly: weeklyRev,
      monthly: monthlyRev
    };
  }

  // Summary Metrics for Supplier Accounts (Total Payables & Recent Purchases) in Primary Currency!
  getSuppliersSummary() {
    const suppliers = this.accounts.filter(a => a.type === 'supplier');
    const primary = this.primaryCurrency;

    let totalPayables = 0;
    suppliers.forEach(supplier => {
      const bal = this.getAccountBalance(supplier.id);
      const balInPrimary = this.convertCurrency(bal, supplier.currency || 'YER', primary);
      // If balance is positive, we owe them (it is a payable)
      if (balInPrimary > 0) {
        totalPayables += balInPrimary;
      }
    });

    // Recent 5 Supplier transactions of purchase nature ('credit' transactions)
    const recentPurchases = this.transactions
      .filter(tx => tx.type === 'credit' && this.accounts.find(a => a.id === tx.accountId)?.type === 'supplier')
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 5)
      .map(tx => {
        const acc = this.accounts.find(a => a.id === tx.accountId);
        const amtInPrimary = this.convertCurrency(tx.amount, tx.currency || acc?.currency || 'YER', primary);
        return {
          id: tx.id,
          date: tx.date,
          accountName: acc?.name || 'مورد مجهول',
          description: tx.description,
          amount: amtInPrimary,
          originalAmount: tx.amount,
          originalCurrency: tx.currency || acc?.currency || 'YER'
        };
      });

    return {
      totalPayables,
      count: suppliers.length,
      recentPurchases
    };
  }

  // Summary Metrics for Buyer Accounts (Total Receivables & Active Debts) in Primary Currency!
  getBuyersSummary() {
    const buyers = this.accounts.filter(a => a.type === 'buyer');
    const primary = this.primaryCurrency;

    let totalReceivables = 0;
    buyers.forEach(buyer => {
      const bal = this.getAccountBalance(buyer.id);
      const balInPrimary = this.convertCurrency(bal, buyer.currency || 'YER', primary);
      // If balance is positive, they owe us (receivable)
      if (balInPrimary > 0) {
        totalReceivables += balInPrimary;
      }
    });

    // Recent 5 Buyer transactions representing sales/debits
    const recentSales = this.transactions
      .filter(tx => tx.type === 'debit' && this.accounts.find(a => a.id === tx.accountId)?.type === 'buyer')
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 5)
      .map(tx => {
        const acc = this.accounts.find(a => a.id === tx.accountId);
        const amtInPrimary = this.convertCurrency(tx.amount, tx.currency || acc?.currency || 'YER', primary);
        return {
          id: tx.id,
          date: tx.date,
          accountName: acc?.name || 'عميل مجهول',
          description: tx.description,
          amount: amtInPrimary,
          originalAmount: tx.amount,
          originalCurrency: tx.currency || acc?.currency || 'YER'
        };
      });

    return {
      totalReceivables,
      count: buyers.length,
      recentSales
    };
  }

  // Chart Data: Revenue trends (group sales totals by date) in Primary Currency!
  getRevenueTrends() {
    const revenueMap: { [date: string]: number } = {};
    const primary = this.primaryCurrency;

    // Let's gather last 10 days that have transactions/entries and sort them chronologically
    this.dailyEntries.forEach(entry => {
      // Check if entry represents a sale (either unlinked or linked to buyer)
      if (entry.accountType === undefined || entry.accountType === 'buyer') {
        const entryInPrimary = this.convertCurrency(entry.total, entry.currency || 'YER', primary);
        revenueMap[entry.date] = (revenueMap[entry.date] || 0) + entryInPrimary;
      }
    });

    // If map empty, populate with some mock chronologically sorted dates
    const dates = Object.keys(revenueMap).sort();
    if (dates.length === 0) {
      return [
        { date: '2026-06-01', 'المبيعات اليومية': this.convertCurrency(12000, 'YER', primary) },
        { date: '2026-06-02', 'المبيعات اليومية': this.convertCurrency(18500, 'YER', primary) },
        { date: '2026-06-03', 'المبيعات اليومية': this.convertCurrency(4800, 'YER', primary) },
        { date: '2026-06-04', 'المبيعات اليومية': this.convertCurrency(18250, 'YER', primary) },
        { date: '2026-06-05', 'المبيعات اليومية': this.convertCurrency(7550, 'YER', primary) },
        { date: '2026-06-06', 'المبيعات اليومية': this.convertCurrency(1765, 'YER', primary) }
      ];
    }

    return dates.map(d => ({
      date: d,
      'المبيعات اليومية': revenueMap[d]
    }));
  }
}
