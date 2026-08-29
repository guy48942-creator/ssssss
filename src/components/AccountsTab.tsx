/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Database } from '../utils';
import { Account, Transaction, AccountType, UserRole } from '../types';
import { SUPPORTED_CURRENCIES, getCurrencyInfo, formatCurrency } from '../currencyUtils';
import {
  Users,
  Plus,
  Search,
  Calendar,
  MapPin,
  Phone,
  Trash2,
  Printer,
  ArrowLeftRight,
  ArrowUpLeft,
  ArrowDownRight,
  ArrowUp,
  ArrowDown,
  UserPlus,
  ArrowRight,
  Filter,
  DollarSign,
  Send,
  Bell,
  Edit,
  Lock,
  FileSpreadsheet,
  UploadCloud,
  Check,
  Eye,
  EyeOff,
  Palette,
  X
} from 'lucide-react';

const themeColors = {
  emerald: {
    borderDouble: 'border-emerald-700',
    borderLight: 'border-emerald-200',
    borderMuted: 'border-emerald-600/30',
    textDark: 'text-emerald-900',
    textPrimary: 'text-emerald-800',
    textMuted: 'text-emerald-600',
    bgLight: 'bg-emerald-50/20',
    bgBadge: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
    headerBg: 'bg-emerald-700 text-white',
    footerBorder: 'border-emerald-600/40',
    accentText: 'text-emerald-950 font-black',
  },
  indigo: {
    borderDouble: 'border-indigo-700',
    borderLight: 'border-indigo-200',
    borderMuted: 'border-indigo-600/30',
    textDark: 'text-indigo-900',
    textPrimary: 'text-indigo-800',
    textMuted: 'text-indigo-600',
    bgLight: 'bg-indigo-50/20',
    bgBadge: 'bg-indigo-100 text-indigo-800 border border-indigo-200',
    headerBg: 'bg-indigo-700 text-white',
    footerBorder: 'border-indigo-600/40',
    accentText: 'text-indigo-950 font-black',
  },
  blue: {
    borderDouble: 'border-blue-700',
    borderLight: 'border-blue-200',
    borderMuted: 'border-blue-600/30',
    textDark: 'text-blue-900',
    textPrimary: 'text-blue-800',
    textMuted: 'text-blue-600',
    bgLight: 'bg-blue-50/20',
    bgBadge: 'bg-blue-100 text-blue-800 border border-blue-200',
    headerBg: 'bg-blue-700 text-white',
    footerBorder: 'border-blue-600/40',
    accentText: 'text-blue-950 font-black',
  },
  slate: {
    borderDouble: 'border-slate-700',
    borderLight: 'border-slate-200',
    borderMuted: 'border-slate-600/30',
    textDark: 'text-slate-900',
    textPrimary: 'text-slate-800',
    textMuted: 'text-slate-600',
    bgLight: 'bg-slate-50/20',
    bgBadge: 'bg-slate-100 text-slate-800 border border-slate-200',
    headerBg: 'bg-slate-700 text-white',
    footerBorder: 'border-slate-600/40',
    accentText: 'text-slate-950 font-black',
  },
  red: {
    borderDouble: 'border-red-700',
    borderLight: 'border-red-200',
    borderMuted: 'border-red-600/30',
    textDark: 'text-red-900',
    textPrimary: 'text-red-800',
    textMuted: 'text-red-600',
    bgLight: 'bg-red-50/20',
    bgBadge: 'bg-red-100 text-red-800 border border-red-200',
    headerBg: 'bg-red-700 text-white',
    footerBorder: 'border-red-600/40',
    accentText: 'text-red-950 font-black',
  },
  amber: {
    borderDouble: 'border-amber-700',
    borderLight: 'border-amber-200',
    borderMuted: 'border-amber-600/30',
    textDark: 'text-amber-900',
    textPrimary: 'text-amber-800',
    textMuted: 'text-amber-600',
    bgLight: 'bg-amber-50/20',
    bgBadge: 'bg-amber-100 text-amber-800 border border-amber-200',
    headerBg: 'bg-amber-700 text-white',
    footerBorder: 'border-amber-600/40',
    accentText: 'text-amber-950 font-black',
  },
  teal: {
    borderDouble: 'border-teal-700',
    borderLight: 'border-teal-200',
    borderMuted: 'border-teal-600/30',
    textDark: 'text-teal-900',
    textPrimary: 'text-teal-800',
    textMuted: 'text-teal-600',
    bgLight: 'bg-teal-50/20',
    bgBadge: 'bg-teal-100 text-teal-800 border border-teal-200',
    headerBg: 'bg-teal-700 text-white',
    footerBorder: 'border-teal-600/40',
    accentText: 'text-teal-950 font-black',
  }
};

interface QatLogoProps {
  colorScheme?: 'emerald' | 'indigo' | 'blue' | 'slate' | 'red' | 'amber' | 'teal';
  customLogoUrl?: string;
}

const QatLogo = ({ colorScheme = 'emerald', customLogoUrl }: QatLogoProps) => {
  if (customLogoUrl) {
    return (
      <img
        src={customLogoUrl}
        alt="Logo"
        className="w-16 h-16 object-contain rounded-xl print:max-h-16"
        referrerPolicy="no-referrer"
      />
    );
  }

  const schemes = {
    emerald: { primary: '#16A34A', light: '#4ADE80', dark: '#15803D', bg: '#F0FDF4' },
    indigo: { primary: '#4F46E5', light: '#818CF8', dark: '#3730A3', bg: '#F5F3FF' },
    blue: { primary: '#2563EB', light: '#60A5FA', dark: '#1E40AF', bg: '#EFF6FF' },
    slate: { primary: '#475569', light: '#94A3B8', dark: '#334155', bg: '#F8FAFC' },
    red: { primary: '#DC2626', light: '#F87171', dark: '#991B1B', bg: '#FEF2F2' },
    amber: { primary: '#D97706', light: '#FBBF24', dark: '#92400E', bg: '#FFFBEB' },
    teal: { primary: '#0D9488', light: '#2DD4BF', dark: '#115E59', bg: '#F0FDFA' },
  };

  const colors = schemes[colorScheme] || schemes.emerald;

  return (
    <svg viewBox="0 0 100 100" className="w-14 h-14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="46" fill={colors.bg} stroke={colors.primary} strokeWidth="2" />
      <circle cx="50" cy="50" r="42" fill="none" stroke="#EAB308" strokeWidth="1" strokeDasharray="3 3" />
      <path d="M50 80 C 45 60, 30 50, 32 30 C 34 10, 50 15, 50 15 C 50 15, 66 10, 68 30 C 70 50, 55 60, 50 80 Z" fill={colors.primary} />
      <path d="M50 75 C 47 62, 38 55, 40 40 C 42 25, 50 28, 50 28 C 50 28, 58 25, 60 40 C 62 55, 53 62, 50 75 Z" fill={colors.light} />
      <path d="M50 80 L50 20" stroke={colors.dark} strokeWidth="1.5" />
      <path d="M50 65 Q 42 58 38 50" stroke={colors.dark} strokeWidth="1" />
      <path d="M50 65 Q 58 58 62 50" stroke={colors.dark} strokeWidth="1" />
      <path d="M50 50 Q 44 42 40 32" stroke={colors.dark} strokeWidth="1" />
      <path d="M50 50 Q 56 42 60 32" stroke={colors.dark} strokeWidth="1" />
      <path d="M50 35 Q 46 28 44 22" stroke={colors.dark} strokeWidth="1" />
      <path d="M50 35 Q 54 28 56 22" stroke={colors.dark} strokeWidth="1" />
      <rect x="42" y="55" width="16" height="5" rx="1.5" fill="#EAB308" stroke="#CA8A04" strokeWidth="1" />
      <rect x="44" y="62" width="12" height="4" rx="1" fill="#EAB308" stroke="#CA8A04" strokeWidth="1" />
    </svg>
  );
};

const getArabicDayName = (dateString: string): string => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    return days[date.getDay()];
  } catch (e) {
    return '';
  }
};

const getFormattedMonthDay = (dateString: string): string => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return `${date.getMonth() + 1}/${date.getDate()}`;
  } catch (e) {
    return '';
  }
};

interface AccountsTabProps {
  db: Database;
  selectedAccountId?: string;
  onSelectAccountId?: (id: string | undefined) => void;
  onDatabaseUpdate: () => void;
  role?: UserRole;
  onOpenQuickEntry?: (type: 'credit' | 'debit') => void;
}

export default function AccountsTab({
  db,
  selectedAccountId,
  onSelectAccountId,
  onDatabaseUpdate,
  role,
  onOpenQuickEntry
}: AccountsTabProps) {
  // Check if modification is restricted to Admin only
  const isModificationRestricted = false;

  // Tabs "الموردين" vs "العملاء"
  const [activeType, setActiveType] = useState<AccountType>('buyer');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCompactPrint, setIsCompactPrint] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [printThemeColor, setPrintThemeColor] = useState(db.printThemeColor || 'emerald');

  // Advanced search/filters state
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<'all' | 'buyer' | 'supplier'>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'all' | 'active' | 'closed'>('all');

  // Force activeType to 'buyer' if user is a Salesperson
  useEffect(() => {
    if (role === 'Salesperson') {
      setActiveType('buyer');
    }
  }, [role]);

  // Ledgers State
  const [selectedAcc, setSelectedAcc] = useState<Account | undefined>(undefined);
  const [txSearchQuery, setTxSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Column visibility state (customizable) for Account Transaction table
  const [visibleColumns, setVisibleColumns] = useState<{
    txIndex: boolean;
    txDay: boolean;
    txDate: boolean;
    txDesc: boolean;
    txQty: boolean;
    txPrice: boolean;
    txExtra: boolean;
    txTotal: boolean;
    txType: boolean;
    txBalance: boolean;
  }>(() => {
    try {
      const saved = localStorage.getItem('smartacc_account_ledger_visible_cols');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          txIndex: parsed.txIndex ?? true,
          txDay: parsed.txDay ?? true,
          txDate: parsed.txDate ?? true,
          txDesc: parsed.txDesc ?? true,
          txQty: parsed.txQty ?? true,
          txPrice: parsed.txPrice ?? true,
          txExtra: parsed.txExtra ?? true,
          txTotal: parsed.txTotal ?? true,
          txType: parsed.txType ?? true,
          txBalance: parsed.txBalance ?? true
        };
      }
    } catch (e) {
      // Ignored
    }
    return {
      txIndex: true,
      txDay: true,
      txDate: true,
      txDesc: true,
      txQty: true,
      txPrice: true,
      txExtra: true,
      txTotal: true,
      txType: true,
      txBalance: true
    };
  });

  const toggleColumn = (key: keyof typeof visibleColumns) => {
    const updated = { ...visibleColumns, [key]: !visibleColumns[key] };
    setVisibleColumns(updated);
    try {
      localStorage.setItem('smartacc_account_ledger_visible_cols', JSON.stringify(updated));
    } catch (e) {}
  };

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTxModal, setShowTxModal] = useState(false);
  const [ledgerViewMode, setLedgerViewMode] = useState<'detailed' | 'monthly'>('detailed');

  // Create Account Form Fields
  const [newName, setNewName] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<'SA' | 'YE'>('SA');
  const [newPhone, setNewPhone] = useState('+967');
  const [newAddress, setNewAddress] = useState('');
  const [newOpeningBalance, setNewOpeningBalance] = useState<number>(0);
  const [newCurrency, setNewCurrency] = useState('YER');
  const [newStatus, setNewStatus] = useState<'active' | 'closed'>('active');
  const [newNotificationsEnabled, setNewNotificationsEnabled] = useState(true);

  // Edit Account Form Fields
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editOpeningBalance, setEditOpeningBalance] = useState<number>(0);
  const [editCurrency, setEditCurrency] = useState('YER');
  const [editStatus, setEditStatus] = useState<'active' | 'closed'>('active');
  const [editNotificationsEnabled, setEditNotificationsEnabled] = useState(true);

  const openEditModal = () => {
    if (isModificationRestricted && role !== 'Admin') {
      alert('خطأ: التعديلات والعمليات مقيدة لمدير النظام فقط بموجب سياسة الحماية الحالية.');
      return;
    }
    if (selectedAcc) {
      setEditName(selectedAcc.name);
      setEditPhone(selectedAcc.phone);
      setEditAddress(selectedAcc.address);
      setEditOpeningBalance(selectedAcc.openingBalance);
      setEditCurrency(selectedAcc.currency || 'YER');
      setEditStatus(selectedAcc.status || 'active');
      setEditNotificationsEnabled(selectedAcc.notificationsEnabled ?? true);
      setShowEditModal(true);
    }
  };

  const handleEditAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAcc) return;

    const updatedAcc = {
      ...selectedAcc,
      name: editName,
      phone: editPhone,
      address: editAddress,
      openingBalance: editOpeningBalance,
      currency: editCurrency,
      status: editStatus,
      notificationsEnabled: editNotificationsEnabled
    };

    db.updateAccount(updatedAcc);
    setSelectedAcc(updatedAcc);
    onDatabaseUpdate();
    setShowEditModal(false);
  };

  // Add Transaction Form Fields
  const [txType, setTxType] = useState<'debit' | 'credit'>('debit');
  const [txAmount, setTxAmount] = useState<number>(0);
  const [txDate, setTxDate] = useState(new Date().toISOString().split('T')[0]);
  const [txDescription, setTxDescription] = useState('');
  const [txCurrency, setTxCurrency] = useState('YER');
  const [txQuantity, setTxQuantity] = useState<number | ''>('');
  const [txUnitPrice, setTxUnitPrice] = useState<number | ''>('');
  const [txExtraCharges, setTxExtraCharges] = useState<number | ''>('');
  const [txDayNumber, setTxDayNumber] = useState<number | ''>('');

  // Live total calculation for adding a transaction: (العدد * السعر) = الاجمالي
  useEffect(() => {
    if (txQuantity !== '' && txUnitPrice !== '') {
      const calculated = (Number(txQuantity) * Number(txUnitPrice));
      setTxAmount(calculated);
    }
  }, [txQuantity, txUnitPrice]);

  // Edit Transaction Form Fields (تعديل بيانات الجدول)
  const [showEditTxModal, setShowEditTxModal] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [editTxDate, setEditTxDate] = useState('');
  const [editTxDescription, setEditTxDescription] = useState('');
  const [editTxType, setEditTxType] = useState<'debit' | 'credit'>('debit');
  const [editTxAmount, setEditTxAmount] = useState<number>(0);
  const [editTxCurrency, setEditTxCurrency] = useState('YER');
  const [editTxQuantity, setEditTxQuantity] = useState<number | undefined>(undefined);
  const [editTxUnitPrice, setEditTxUnitPrice] = useState<number | undefined>(undefined);
  const [editTxExtraCharges, setEditTxExtraCharges] = useState<number | undefined>(undefined);
  const [editTxDayNumber, setEditTxDayNumber] = useState<number | undefined>(undefined);

  // Live total calculation for editing a transaction
  useEffect(() => {
    if (editTxQuantity !== undefined && editTxUnitPrice !== undefined) {
      const calculated = (Number(editTxQuantity) * Number(editTxUnitPrice));
      setEditTxAmount(calculated);
    }
  }, [editTxQuantity, editTxUnitPrice]);

  // Import Excel & PDF Form Fields (استيراد ملفات)
  const [showImportModal, setShowImportModal] = useState(false);
  const [importType, setImportType] = useState<'excel' | 'pdf'>('excel');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [pdfTextData, setPdfTextData] = useState('');
  const [parsedPreviewRows, setParsedPreviewRows] = useState<any[]>([]);

  const handleOpenEditTxModal = (tx: Transaction) => {
    if (isModificationRestricted) {
      alert('خطأ: التعديلات والعمليات مقيدة لمدير النظام فقط بموجب سياسة الحماية الحالية.');
      return;
    }
    setEditingTx(tx);
    setEditTxDate(tx.date || new Date().toISOString().split('T')[0]);
    setEditTxDescription(tx.description || '');
    setEditTxType(tx.type || 'debit');
    setEditTxAmount(tx.amount || 0);
    setEditTxCurrency(tx.currency || selectedAcc?.currency || 'YER');
    setEditTxQuantity(tx.quantity);
    setEditTxUnitPrice(tx.unitPrice);
    setEditTxExtraCharges(tx.extraCharges);
    setEditTxDayNumber(tx.dayNumber);
    setShowEditTxModal(true);
  };

  const handleSaveEditTx = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTx) return;

    let finalAmount = Number(editTxAmount);
    if (editTxQuantity !== undefined && editTxUnitPrice !== undefined) {
      finalAmount = (Number(editTxQuantity) * Number(editTxUnitPrice));
    }

    const updatedTx: Transaction = {
      ...editingTx,
      date: editTxDate,
      description: editTxDescription,
      type: editTxType,
      amount: finalAmount,
      currency: editTxCurrency,
      quantity: editTxQuantity ? Number(editTxQuantity) : undefined,
      unitPrice: editTxUnitPrice ? Number(editTxUnitPrice) : undefined,
      extraCharges: editTxExtraCharges ? Number(editTxExtraCharges) : undefined,
      dayNumber: editTxDayNumber ? Number(editTxDayNumber) : undefined,
    };

    db.updateTransaction(updatedTx);
    onDatabaseUpdate();
    setShowEditTxModal(false);
    setEditingTx(null);
  };

  const parsePdfText = (text: string) => {
    setPdfTextData(text);
    const lines = text.split('\n');
    const rows: any[] = [];

    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) return;

      // Try to parse Arabic dates like 2026-06-03 or slashed dates
      const dateMatch = trimmed.match(/(\d{4}[-/]\d{1,2}[-/]\d{1,2})|(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/);
      const date = dateMatch ? dateMatch[0] : new Date().toISOString().split('T')[0];

      let content = trimmed.replace(date || '', '').trim();

      // Look for credit / debit keywords
      let txType: 'debit' | 'credit' = 'debit';
      if (content.includes('دائن') || content.includes('له') || content.includes('credit') || content.includes('تسديد') || content.includes('-') || content.includes('خصم')) {
        txType = 'credit';
      } else if (content.includes('مدين') || content.includes('عليه') || content.includes('debit') || content.includes('+') || content.includes('إضافة')) {
        txType = 'debit';
      }

      // Extract numbers (supporting currency symbols & commas)
      const numberMatches = content.match(/[-+]?\d{1,3}(,\d{3})*(\.\d+)?|\d+(\.\d+)?/g);
      let amount = 0;
      if (numberMatches) {
        const numbers = numberMatches
          .map(n => parseFloat(n.replace(/,/g, '')))
          .filter(num => !isNaN(num) && num > 0);

        if (numbers.length > 0) {
          amount = Math.max(...numbers);
        }
      }

      // Clean up description
      let description = content;
      if (numberMatches) {
        numberMatches.forEach(num => {
          description = description.replace(num, '');
        });
      }
      description = description
        .replace(/دائن|له|مدين|عليه|credit|debit|خصم|إضافة/g, '')
        .replace(/\s+/g, ' ')
        .trim();

      if (!description) {
        description = 'قيد مالي مستورد';
      }

      rows.push({
        date,
        description,
        amount: isNaN(amount) ? 0 : amount,
        type: txType
      });
    });

    setParsedPreviewRows(rows);
  };

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFile(file);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const { read, utils } = await import('xlsx');
        const bstr = evt.target?.result;
        const wb = read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];

        const sheetObjects = utils.sheet_to_json(ws) as any[];

        const previewRows = sheetObjects.map((row: any) => {
          const getVal = (possibleKeys: string[], defaultVal = '') => {
            for (const key of Object.keys(row)) {
              if (possibleKeys.some(k => key.toLowerCase().includes(k.toLowerCase()))) {
                return row[key];
              }
            }
            return defaultVal;
          };

          const dateVal = getVal(['تاريخ', 'date'], new Date().toISOString().split('T')[0]);
          const descVal = getVal(['بيان', 'وصف', 'تفاصيل', 'desc', 'detail', 'item'], 'قيد مستورد');
          let amountVal = parseFloat(String(getVal(['مبلغ', 'قيمة', 'amount', 'val', 'price'], '0')).replace(/,/g, ''));
          const debitVal = parseFloat(String(getVal(['مدين', 'debit'], '0')).replace(/,/g, ''));
          const creditVal = parseFloat(String(getVal(['دائن', 'credit'], '0')).replace(/,/g, ''));

          let txType: 'debit' | 'credit' = 'debit';
          if (creditVal > 0) {
            txType = 'credit';
            amountVal = creditVal;
          } else if (debitVal > 0) {
            txType = 'debit';
            amountVal = debitVal;
          } else {
            const typeStr = String(getVal(['نوع', 'type'], 'مدين')).trim();
            if (typeStr.includes('دائن') || typeStr.includes('credit') || typeStr.includes('خصم') || typeStr.includes('-') || typeStr.includes('له')) {
              txType = 'credit';
            }
          }

          let dateFinal = '';
          if (typeof dateVal === 'number') {
            // Excel serial date to YYYY-MM-DD
            const dateObj = new Date((dateVal - 25569) * 86400 * 1000);
            dateFinal = dateObj.toISOString().split('T')[0];
          } else {
            dateFinal = String(dateVal).split(' ')[0];
          }

          return {
            date: dateFinal,
            description: String(descVal),
            amount: isNaN(amountVal) ? 0 : Math.abs(amountVal),
            type: txType
          };
        });

        setParsedPreviewRows(previewRows);
      } catch (err) {
        console.error(err);
        alert('حدث خطأ أثناء قراءة ملف الإكسل. يرجى تجربة ملف آخر.');
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleSaveImportedRows = () => {
    if (!selectedAcc) return;
    if (parsedPreviewRows.length === 0) {
      alert('لا توجد بيانات مستخرجة صالحة للاستيراد.');
      return;
    }

    parsedPreviewRows.forEach(row => {
      db.addTransaction({
        accountId: selectedAcc.id,
        date: row.date,
        description: row.description,
        type: row.type,
        amount: row.amount,
        currency: selectedAcc.currency || 'YER'
      });
    });

    onDatabaseUpdate();
    setShowImportModal(false);
    setParsedPreviewRows([]);
    setImportFile(null);
    setPdfTextData('');
    alert(`تم بنجاح حصر واستيراد عدد (${parsedPreviewRows.length}) قيود مالية لحساب ${selectedAcc.name}!`);
  };

  // Set default transaction currency when selected account changes
  useEffect(() => {
    if (selectedAcc) {
      setTxCurrency(selectedAcc.currency || 'YER');
    }
  }, [selectedAcc]);

  // Sync selected account detail ref when state changes or parent triggers selection
  useEffect(() => {
    if (selectedAccountId) {
      const found = db.accounts.find(a => a.id === selectedAccountId);
      if (found) {
        setSelectedAcc(found);
        setActiveType(found.type);
      }
    } else {
      setSelectedAcc(undefined);
    }
  }, [selectedAccountId, db.accounts]);

  // High Speed search / filtering for accounts
  const filteredAccounts = useMemo(() => {
    return db.accounts.filter(acc => {
      // 1. Role restrictions: Salesperson can only view buyers.
      if (role === 'Salesperson' && acc.type !== 'buyer') {
        return false;
      }

      // 2. Type Filter (if not 'all', it matches selected, otherwise matches activeType)
      let matchesType = false;
      if (showAdvancedFilters) {
        if (selectedTypeFilter === 'all') {
          matchesType = true;
        } else {
          matchesType = acc.type === selectedTypeFilter;
        }
      } else {
        const actualActiveType = role === 'Salesperson' ? 'buyer' : activeType;
        matchesType = acc.type === actualActiveType;
      }

      // 3. Status filter
      let matchesStatus = true;
      if (selectedStatusFilter !== 'all') {
        const accStatus = acc.status || 'active';
        matchesStatus = accStatus === selectedStatusFilter;
      }

      // 4. Search text matches
      const matchesSearch =
        acc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        acc.phone.includes(searchQuery) ||
        acc.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        acc.id.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesType && matchesStatus && matchesSearch;
    });
  }, [db.accounts, activeType, searchQuery, role, showAdvancedFilters, selectedTypeFilter, selectedStatusFilter]);

  // Statement Ledger calculations for selected account
  const ledgerTransactions = useMemo(() => {
    if (!selectedAcc) return [];

    let list = db.transactions.filter(tx => tx.accountId === selectedAcc.id);

    // High-speed search within ledger
    if (txSearchQuery) {
      const lowerQ = txSearchQuery.toLowerCase();
      list = list.filter(tx =>
        tx.description.toLowerCase().includes(lowerQ) ||
        tx.amount.toString().includes(lowerQ) ||
        tx.date.includes(lowerQ)
      );
    }

    // Date filtering (ignore if compact printing full account)
    if (!isCompactPrint) {
      if (startDate) {
        list = list.filter(tx => tx.date >= startDate);
      }
      if (endDate) {
        list = list.filter(tx => tx.date <= endDate);
      }
    }

    // Sort chronologically (oldest first for statement ledger flow)
    return list.sort((a, b) => a.date.localeCompare(b.date));
  }, [db.transactions, selectedAcc, txSearchQuery, startDate, endDate, isCompactPrint]);

  // Calculate Running Balance list for Ledger Statement
  const statementRows = useMemo(() => {
    if (!selectedAcc) return [];

    let runningBalance = selectedAcc.openingBalance;

    return ledgerTransactions.map(tx => {
      // Calculate how this transaction impacts the running balance
      if (selectedAcc.type === 'supplier') {
        // Supplier (Payables): Credit (+ purchases/debts) increases balance; Debit (- payments) decreases balance.
        if (tx.type === 'credit') {
          runningBalance += tx.amount;
        } else {
          runningBalance -= tx.amount;
        }
      } else {
        // Buyer (Receivables): Debit (+ sales/receivables) increases balance; Credit (- payments received) decreases balance.
        if (tx.type === 'debit') {
          runningBalance += tx.amount;
        } else {
          runningBalance -= tx.amount;
        }
      }

      return {
        ...tx,
        balanceAfter: runningBalance
      };
    });
  }, [selectedAcc, ledgerTransactions]);

  const statementTotals = useMemo(() => {
    let debitTotal = 0;
    let creditTotal = 0;

    statementRows.forEach(tx => {
      if (tx.type === 'debit') {
        debitTotal += tx.amount;
      } else {
        creditTotal += tx.amount;
      }
    });

    return { debitTotal, creditTotal };
  }, [statementRows]);

  const monthlySummaryRows = useMemo(() => {
    if (!selectedAcc) return [];

    let runningBalance = selectedAcc.openingBalance;
    const monthsMap = new Map<string, { monthStr: string, debit: number, credit: number, net: number, balanceAfter: number }>();

    ledgerTransactions.forEach(tx => {
      const monthStr = tx.date.substring(0, 7);
      if (!monthsMap.has(monthStr)) {
        monthsMap.set(monthStr, { monthStr, debit: 0, credit: 0, net: 0, balanceAfter: 0 });
      }
      const entry = monthsMap.get(monthStr)!;

      let amountImpact = 0;
      if (selectedAcc.type === 'supplier') {
        if (tx.type === 'credit') {
          entry.credit += tx.amount;
          amountImpact = tx.amount;
        } else {
          entry.debit += tx.amount;
          amountImpact = -tx.amount;
        }
      } else {
        if (tx.type === 'debit') {
          entry.debit += tx.amount;
          amountImpact = tx.amount;
        } else {
          entry.credit += tx.amount;
          amountImpact = -tx.amount;
        }
      }
      entry.net += amountImpact;
      runningBalance += amountImpact;
      entry.balanceAfter = runningBalance;
    });

    return Array.from(monthsMap.values());
  }, [selectedAcc, ledgerTransactions]);

  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (isModificationRestricted) {
      alert('خطأ: التعديلات والعمليات مقيدة لمدير النظام فقط بموجب سياسة الحماية الحالية.');
      return;
    }
    if (!newName.trim() || !newPhone.trim()) {
      alert('الرجاء إدخال اسم الحساب ورقم الهاتف بالكامل');
      return;
    }

    const created = db.addAccount({
      name: newName,
      phone: newPhone,
      address: newAddress,
      openingBalance: Number(newOpeningBalance) || 0,
      type: role === 'Salesperson' ? 'buyer' : activeType,
      currency: newCurrency,
      status: newStatus,
      notificationsEnabled: newNotificationsEnabled
    });

    onDatabaseUpdate();
    setSelectedAcc(created);
    if (onSelectAccountId) onSelectAccountId(created.id);

    // Reset Form
    setNewName('');
    setSelectedCountry('SA');
    setNewPhone('+967');
    setNewAddress('');
    setNewOpeningBalance(0);
    setNewCurrency('YER');
    setNewStatus('active');
    setShowCreateModal(false);
  };

  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (isModificationRestricted) {
      alert('خطأ: إضافة الحركات والقيود مقيدة لمدير النظام فقط.');
      return;
    }
    if (!selectedAcc) return;
    if (txAmount <= 0 || !txDescription.trim()) {
      alert('الرجاء تعبئة قيمة ومثبت الحركة أولاً');
      return;
    }

    db.addTransaction({
      accountId: selectedAcc.id,
      date: txDate,
      description: txDescription,
      type: txType,
      amount: Number(txAmount),
      currency: txCurrency || selectedAcc.currency || 'YER',
      quantity: txQuantity !== '' ? Number(txQuantity) : undefined,
      unitPrice: txUnitPrice !== '' ? Number(txUnitPrice) : undefined,
      extraCharges: txExtraCharges !== '' ? Number(txExtraCharges) : undefined,
      dayNumber: txDayNumber !== '' ? Number(txDayNumber) : undefined
    });

    onDatabaseUpdate();

    // Reset
    setTxAmount(0);
    setTxDescription('');
    setTxQuantity('');
    setTxUnitPrice('');
    setTxExtraCharges('');
    setTxDayNumber('');
    setShowTxModal(false);
  };

  const handleDeleteAccount = (id: string) => {
    if (isModificationRestricted) {
      alert('خطأ: حذف الحسابات والجداول مقيد لمدير النظام فقط.');
      return;
    }
    if (confirm('هل أنت متأكد من حذف هذا الحساب نهائياً؟ سيتم حذف جميع القيود وكشوفات الحساب التابعة له!')) {
      db.deleteAccount(id);
      onDatabaseUpdate();
      setSelectedAcc(undefined);
      if (onSelectAccountId) onSelectAccountId(undefined);
    }
  };

  const handleDeleteTransaction = (id: string) => {
    if (isModificationRestricted) {
      alert('خطأ: حذف الحركات والقيود مقيد لمدير النظام فقط.');
      return;
    }
    if (confirm('هل أنت متأكد من حذف هذا القيد من كشف الحساب؟')) {
      db.deleteTransaction(id);
      onDatabaseUpdate();
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCompactPrint = () => {
    setIsCompactPrint(true);
    setTimeout(() => {
      window.print();
      setIsCompactPrint(false);
    }, 100);
  };

  const handleExportExcel = () => {
    if (!selectedAcc || statementRows.length === 0) return;
    const data = statementRows.map(row => {
      const isDebit = row.type === 'debit';
      const isCredit = row.type === 'credit';
      return {
        'تاريخ الحركة': row.date,
        'البيان والتفاصيل': row.description,
        'الكمية': row.quantity || '',
        'سعر الوحدة': row.unitPrice || '',
        'إضافي/خصم': row.extraCharges || '',
        'مدين (عليه)': isDebit ? row.amount : '',
        'دائن (له)': isCredit ? row.amount : '',
        'الرصيد التراكمي': row.balanceAfter,
        'نوع القيد': isDebit ? 'مدين' : 'دائن',
      };
    });

    // Add totals row
    data.push({
      'تاريخ الحركة': 'المجموع الإجمالي',
      'البيان والتفاصيل': '',
      'الكمية': '',
      'سعر الوحدة': '',
      'إضافي/خصم': '',
      'مدين (عليه)': statementTotals.debitTotal,
      'دائن (له)': statementTotals.creditTotal,
      'الرصيد التراكمي': statementRows[statementRows.length - 1].balanceAfter,
      'نوع القيد': ''
    } as any);

    const ws = XLSX.utils.json_to_sheet(data);

    // Set column widths
    const wscols = [
      {wch: 15}, // تاريخ
      {wch: 40}, // بيان
      {wch: 10}, // كمية
      {wch: 12}, // سعر
      {wch: 12}, // إضافي
      {wch: 15}, // مدين
      {wch: 15}, // دائن
      {wch: 15}, // رصيد
      {wch: 15}, // نوع القيد
    ];
    ws['!cols'] = wscols;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "كشف حساب");
    XLSX.writeFile(wb, `كشف_حساب_${selectedAcc.name.replace(/\s+/g, '_')}.xlsx`);
  };

  return (
    <div className="space-y-6" id="accounts_tab_wrapper">
      {/* Advanced Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100/85 dark:border-slate-800/80 rounded-2xl p-4 shadow-[0_8px_30px_rgb(0,0,0,0.02)] no-print">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <input
              type="text"
              placeholder="بحث متقدم في الحسابات: اسم الحساب، رقم الهاتف، أو رقم الحساب..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-4 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 transition-shadow outline-none dark:text-slate-200"
              dir="rtl"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="accounts_tab_container">

      {/* RIGHT COLUMN (In RTL, this is first): Account Lists (Span 4) */}
      <div className={`lg:col-span-5 xl:col-span-4 bg-white dark:bg-slate-900 border border-slate-100/85 dark:border-slate-800/80 rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-6 print:hidden`} id="accounts_list_area">

        {/* Isolated Tabs & Create Account Button */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center">
          <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex gap-1 flex-1 sm:flex-initial">
            <button
              id="set_buyers_tab"
              onClick={() => {
                setActiveType('buyer');
                setSelectedAcc(undefined);
                if (onSelectAccountId) onSelectAccountId(undefined);
              }}
              className={`flex-1 sm:flex-initial text-center px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeType === 'buyer' ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              العملاء والمشترين
            </button>
            <button
              id="set_suppliers_tab"
              onClick={() => {
                setActiveType('supplier');
                setSelectedAcc(undefined);
                if (onSelectAccountId) onSelectAccountId(undefined);
              }}
              className={`flex-1 sm:flex-initial text-center px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeType === 'supplier' ? 'bg-white dark:bg-slate-800 text-amber-500 dark:text-amber-400 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              الموردين والأعمال
            </button>
          </div>

          <div className="flex gap-2">
            {onOpenQuickEntry && (
              <>
                <button
                  onClick={() => onOpenQuickEntry('debit')}
                  className="flex items-center justify-center gap-1 px-2.5 py-2 bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-400 rounded-xl transition-colors cursor-pointer text-[10px] font-bold"
                  title="اسحب مبلغ دين"
                >
                  <ArrowDown size={14} className="stroke-[2.5]" />
                  <span className="hidden sm:inline">آجل ديون</span>
                </button>
                <button
                  onClick={() => onOpenQuickEntry('credit')}
                  className="flex items-center justify-center gap-1 px-2.5 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 dark:text-emerald-400 rounded-xl transition-colors cursor-pointer text-[10px] font-bold"
                  title="تسديد مبلغ"
                >
                  <ArrowUp size={14} className="stroke-[2.5]" />
                  <span className="hidden sm:inline">تسديد مبلغ</span>
                </button>
              </>
            )}
            <button
              id="open_create_account_modal"
              onClick={() => {
                if (isModificationRestricted) {
                  alert('خطأ: إضافة الحسابات والجداول مقيدة لمدير النظام فقط بموجب سياسة الحماية الحالية.');
                } else {
                  setShowCreateModal(true);
                }
              }}
              className={`flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-white rounded-xl shadow-xs transition-colors cursor-pointer ${
                isModificationRestricted
                  ? 'bg-slate-400 dark:bg-slate-700 cursor-not-allowed opacity-75'
                  : activeType === 'supplier'
                    ? 'bg-amber-500 hover:bg-amber-600'
                    : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isModificationRestricted ? <Lock size={15} /> : <UserPlus size={16} />}
              <span>حساب جديد</span>
            </button>
          </div>
        </div>

        {/* Simple Search */}
        <div className="relative">
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            id="account_search_input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="البحث بالاسم أو رقم الهاتف..."
            className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pr-10 pl-4 py-3 text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* List of Accounts */}
        <div className="space-y-3 overflow-y-auto max-h-[500px] pr-1" id="account_cards_list">
          {filteredAccounts.length === 0 ? (
            <div className="text-center py-12 text-slate-400 space-y-2">
              <Users size={36} className="mx-auto opacity-50" />
              <p className="text-xs">لم يتم العثور على أي حسابات تطابق البحث المحدد</p>
            </div>
          ) : (
            filteredAccounts.map((acc) => {
              const balance = db.getAccountBalance(acc.id);
              const isActive = selectedAcc?.id === acc.id;
              const isClosed = acc.status === 'closed';

              return (
                <div
                  key={acc.id}
                  id={`acc_card_${acc.id}`}
                  onClick={() => {
                    setSelectedAcc(acc);
                    if (onSelectAccountId) onSelectAccountId(acc.id);
                  }}
                  className={`p-4 rounded-xl border transition-all cursor-pointer relative group ${
                    isActive
                      ? 'bg-blue-50/20 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900 shadow-xs shadow-blue-500/5'
                      : isClosed
                        ? 'bg-slate-100/50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800/80 opacity-70'
                        : 'bg-slate-50/50 dark:bg-slate-800/30 border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-1 text-right flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate max-w-[150px]" title={acc.name}>
                          {acc.name}
                        </h4>
                        {isClosed && (
                          <span className="px-1.5 py-0.5 rounded-md text-[8px] font-black bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400">مغلق</span>
                        )}
                        {!isClosed && acc.status === 'active' && showAdvancedFilters && (
                          <span className="px-1.5 py-0.5 rounded-md text-[8px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">نشط</span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 dark:text-slate-500">
                        <Phone size={10} />
                        <span dir="ltr">{acc.phone}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 dark:text-slate-400 truncate">
                        <MapPin size={10} />
                        <span>{acc.address || 'عنوان غير مسجل'}</span>
                      </div>
                    </div>

                    <div className="text-left space-y-1 pr-2 shrink-0">
                      <span className="text-[10px] text-slate-400 block">الرصيد الحالي</span>
                      <span className={`text-xs font-bold font-mono block ${balance > 0 ? (acc.type === 'supplier' ? 'text-amber-500' : 'text-red-500') : 'text-emerald-500'}`} dir="ltr">
                        {balance.toLocaleString('ar-SA')} {acc.currency || 'YER'}
                      </span>
                      <span className="text-[9px] text-slate-400 block">
                        {balance > 0 ? (acc.type === 'supplier' ? 'ديون مستحقة لهم' : 'ديون مستحقة عليه') : 'مسدد / مقدم'}
                      </span>
                    </div>
                  </div>

                  <button
                    id={`delete_acc_btn_${acc.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteAccount(acc.id);
                    }}
                    className="absolute bottom-2 left-2 p-1.5 opacity-0 group-hover:opacity-100 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-all"
                    title="حذف الحساب بالكامل"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* LEFT COLUMN (Span 8): Dedicated Statement of Account / Ledger */}
      <div className={`lg:col-span-7 xl:col-span-8 bg-white dark:bg-slate-900 border border-slate-100/85 dark:border-slate-800/80 rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col justify-between ${showPrintPreview ? 'no-print' : ''}`} id="ledger_view_area">
        {!selectedAcc ? (
          /* Blank state */
          <div className="flex-1 flex flex-col items-center justify-center py-20 text-center space-y-4" id="ledger_blank_state">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 rounded-full">
              <ArrowLeftRight size={44} />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-700 dark:text-slate-400">كشف حساب تفصيلي (الأستاذ العام)</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm leading-relaxed">
                الرجاء تحديد واختيار حساب مورد أو عميل من القائمة لفتح كشف الحساب والبحث والطباعة المباشرة لملف الـ PDF وتدقيق القيود المالية.
              </p>
            </div>
          </div>
        ) : (
          /* Ledger Active view */
          <div className="space-y-6" id="ledger_content_wrapper">

            {/* Ledger Header (Beautiful, printable branding) */}
            <div className="border-b border-slate-100 dark:border-slate-800/65 pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 no-print" id="ledger_print_header">
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${selectedAcc.type === 'supplier' ? 'bg-amber-100/60 text-amber-700 dark:bg-amber-950 dark:text-amber-400' : 'bg-blue-100/60 text-blue-700 dark:bg-blue-950 dark:text-blue-400'}`}>
                    {selectedAcc.type === 'supplier' ? 'قسم الموردين' : 'قسم العملاء والمبيعات'}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${(selectedAcc.status || 'active') === 'closed' ? 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'}`}>
                    {(selectedAcc.status || 'active') === 'closed' ? 'مغلق (مجمد)' : 'نشط'}
                  </span>
                  <span className="text-xs text-slate-400 dark:text-slate-500 font-mono" id="print_ledger_uuid">ID: {selectedAcc.id}</span>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{selectedAcc.name}</h3>
                  {role !== 'Salesperson' && (
                    <button
                      id="toggle_account_status_btn"
                      type="button"
                      onClick={() => {
                        if (isModificationRestricted) {
                          alert('خطأ: تعديل حالة الملفات المالية مقيد لمدير النظام فقط.');
                          return;
                        }
                        const nextStatus: 'active' | 'closed' = (selectedAcc.status || 'active') === 'closed' ? 'active' : 'closed';
                        const updated = { ...selectedAcc, status: nextStatus };
                        db.updateAccount(updated);
                        setSelectedAcc(updated);
                        onDatabaseUpdate();
                      }}
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer no-print ${
                        isModificationRestricted
                          ? 'text-slate-400 bg-slate-100/50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-700 cursor-not-allowed'
                          : 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900 border-indigo-200/20 dark:border-indigo-800'
                      }`}
                    >
                      {isModificationRestricted ? '🔒 الحالة محصنة للمدير ' : `تغيير الحالة إلى ${(selectedAcc.status || 'active') === 'closed' ? 'نشط' : 'مغلق'}`}
                    </button>
                  )}
                </div>

                {/* Contact Card Row */}
                <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1.5" dir="ltr">
                    <Phone size={13} className="text-slate-400" />
                    <span>{selectedAcc.phone}</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin size={13} className="text-slate-400" />
                    <span>{selectedAcc.address || 'العنوان غير محدد'}</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar size={13} className="text-slate-400" />
                    <span>تاريخ التسجيل: {new Date(selectedAcc.createdAt).toLocaleDateString('ar-SA')}</span>
                  </span>
                </div>
              </div>

              {/* Action buttons (Print, Filter, Quick Entry) */}
              <div className="flex flex-wrap gap-2.5 items-center no-print">
                {role === 'Salesperson' ? (
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg">قراءة فقط للحساب</span>
                ) : isModificationRestricted ? (
                  <button
                    id="open_quick_tx_modal_restricted"
                    onClick={() => alert('خطأ: تأصيل القيود المالية محمي لمدير النظام فقط بموجب سياسة الحماية النشطة.')}
                    className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100/80 dark:bg-slate-800/40 px-3.5 py-2.5 rounded-xl cursor-not-allowed border border-slate-200/40 dark:border-slate-700"
                  >
                    <Lock size={15} className="text-slate-400" />
                    <span>قيد مالي (محمي للمدير)</span>
                  </button>
                ) : (
                  <button
                    id="open_quick_tx_modal"
                    onClick={() => setShowTxModal(true)}
                    className={`flex items-center gap-1.5 text-xs font-bold text-white px-3.5 py-2.5 rounded-xl cursor-pointer ${selectedAcc.type === 'supplier' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-blue-600 hover:bg-blue-700'}`}
                  >
                    <Plus size={16} />
                    <span>تأصيل قيد مالي</span>
                  </button>
                )}
                {role !== 'Salesperson' && (
                  <>
                    <button
                      id="open_edit_account_modal"
                      onClick={openEditModal}
                      className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 px-3.5 py-2.5 rounded-xl transition-all cursor-pointer"
                    >
                      <Edit size={16} />
                      <span>تعديل بيانات الحساب</span>
                    </button>

                    <button
                      id="open_import_data_modal"
                      onClick={() => setShowImportModal(true)}
                      className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-950/30 px-3.5 py-2.5 rounded-xl transition-all cursor-pointer"
                    >
                      <FileSpreadsheet size={16} />
                      <span>استيراد قيود (Excel / PDF)</span>
                    </button>
                  </>
                )}
                <button
                  id="open_ledger_print_preview"
                  onClick={() => setShowPrintPreview(true)}
                  className="flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-400 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/30 dark:hover:bg-amber-900/40 px-3.5 py-2.5 rounded-xl transition-all cursor-pointer border border-amber-200/50 dark:border-amber-800/30"
                >
                  <Eye size={16} />
                  <span>معاينة الطباعة</span>
                </button>

                <button
                  id="print_full_ledger_compact"
                  onClick={handleCompactPrint}
                  className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/30 dark:hover:bg-indigo-900/40 px-3.5 py-2.5 rounded-xl transition-all cursor-pointer border border-indigo-200/50 dark:border-indigo-800/30"
                >
                  <Printer size={16} />
                  <span>طبع الحساب كامل في صفحة واحدة</span>
                </button>

                <button
                  id="print_ledger_pdf"
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 px-3.5 py-2.5 rounded-xl transition-all cursor-pointer"
                >
                  <Printer size={16} />
                  <span>تصدير كشف PDF / طباعة</span>
                </button>

                <button
                  id="export_ledger_excel"
                  onClick={handleExportExcel}
                  className="flex items-center gap-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-3.5 py-2.5 rounded-xl transition-all cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                  <span>تصدير Excel</span>
                </button>
              </div>
            </div>

            {/* Dynamic Custom PDF Print Layout */}
            {isCompactPrint && (
              <style dangerouslySetInnerHTML={{__html: `
                @media print {
                  @page {
                    size: auto;
                    margin: 5mm;
                  }
                  body {
                    zoom: 0.7;
                  }
                  .print-only {
                    page-break-inside: avoid;
                  }
                  table {
                    page-break-inside: auto;
                  }
                  tr {
                    page-break-inside: avoid;
                    page-break-after: auto;
                  }
                  thead {
                    display: table-header-group;
                  }
                  tfoot {
                    display: table-footer-group;
                  }
                }
              `}} />
            )}

            <div className="hidden print-only text-right space-y-4 border-b pb-6 mb-4 relative overflow-hidden" style={{ direction: 'rtl' }}>
              {/* Optional Watermark background */}
              {db.printShowWatermark && (
                <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none rotate-12">
                  <div className="text-center">
                    <span className="text-5xl font-black block tracking-widest">{db.printCompanyName}</span>
                    <span className="text-xl block mt-2">نظام محاسبي معتمد ومدقق وآمن</span>
                  </div>
                </div>
              )}

              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <QatLogo colorScheme={db.printThemeColor as any} customLogoUrl={db.printCompanyLogo} />
                  <div className="space-y-1">
                    <h1 className={`text-2xl font-black ${
                      db.printThemeColor === 'indigo' ? 'text-indigo-700' :
                      db.printThemeColor === 'blue' ? 'text-blue-700' :
                      db.printThemeColor === 'emerald' ? 'text-emerald-700' :
                      db.printThemeColor === 'slate' ? 'text-slate-800' :
                      db.printThemeColor === 'red' ? 'text-red-700' :
                      db.printThemeColor === 'amber' ? 'text-amber-700' :
                      db.printThemeColor === 'teal' ? 'text-teal-700' : 'text-slate-800'
                    }`}>
                      {db.printCompanyName || 'نظام أنس المحاسبي المطور'}
                    </h1>
                    <p className="text-[10px] text-slate-500 font-bold">{db.printHeaderNote || 'كشف حساب مالي تفصيلي معتمد'}</p>
                  </div>
                </div>
                <div className="text-left font-mono text-[10px] text-slate-500 space-y-0.5">
                  <p>رقم الهاتف: {db.printPhone}</p>
                  <p>العنوان: {db.printAddress}</p>
                  {db.printTaxNumber && <p>الرقم الضريبي: {db.printTaxNumber}</p>}
                  <p>تاريخ الطباعة: {new Date().toLocaleDateString('ar-SA')} | الساعة: {new Date().toLocaleTimeString('ar-SA')}</p>
                </div>
              </div>

              <div className={`p-4 rounded-xl space-y-1 border ${
                db.printThemeColor === 'indigo' ? 'bg-indigo-50/40 border-indigo-100' :
                db.printThemeColor === 'blue' ? 'bg-blue-50/40 border-blue-100' :
                db.printThemeColor === 'emerald' ? 'bg-emerald-50/40 border-emerald-100' :
                db.printThemeColor === 'slate' ? 'bg-slate-50/70 border-slate-200' :
                db.printThemeColor === 'red' ? 'bg-red-50/40 border-red-100' :
                db.printThemeColor === 'amber' ? 'bg-amber-50/40 border-amber-100' :
                db.printThemeColor === 'teal' ? 'bg-teal-50/40 border-teal-100' : 'bg-slate-50 border-slate-200'
              }`}>
                <h2 className="text-sm font-black text-slate-800">بيانات كشف حساب: {selectedAcc.name}</h2>
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                  <p>هاتف العميل: {selectedAcc.phone || 'غير مسجل'}</p>
                  <p>العنوان: {selectedAcc.address || 'غير محدد في الحساب'}</p>
                  <p>العملة المعتمدة للكشف: {selectedAcc.currency}</p>
                  <p>نوع الحساب: {selectedAcc.type === 'supplier' ? 'مورد معتمد' : 'عميل تجاري'}</p>
                </div>
              </div>
            </div>

            {/* Quick Balance Cards on Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 no-print" id="ledger_balance_cards">
              <div className="p-4 border border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/30 rounded-xl flex flex-col justify-between">
                <span className="text-[11px] text-slate-400 block font-medium">الرصيد الافتتاحي (نقطة الأساس):</span>
                <span className="text-base font-bold font-mono tracking-tight text-slate-700 dark:text-slate-300 mt-1" dir="ltr">
                  {selectedAcc.openingBalance.toLocaleString('ar-SA')} {selectedAcc.currency || 'YER'}
                </span>
              </div>

              <div className="p-4 border border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/30 rounded-xl flex flex-col justify-between">
                <span className="text-[11px] text-slate-400 block font-medium">
                  {selectedAcc.type === 'supplier' ? 'إجمالي المشتريات والديون المحتسبة:' : 'إجمالي المبيعات والذمم الصادرة:'}
                </span>
                <span className="text-base font-bold font-mono tracking-tight text-red-500 mt-1" dir="ltr">
                  {db.getAccountTotals(selectedAcc.id).debit.toLocaleString('ar-SA')} {selectedAcc.currency || 'YER'} (مدين)
                </span>
              </div>

              <div className="p-4 border border-blue-100/50 dark:border-blue-900/40 bg-blue-50/5 dark:bg-blue-950/5 rounded-xl flex flex-col justify-between">
                <span className="text-[11px] text-blue-600 dark:text-blue-400 block font-bold">الرصيد الصافي المتبقي حالياً:</span>
                <span className="text-lg font-extrabold font-mono tracking-tight text-slate-800 dark:text-slate-100 mt-1" dir="ltr">
                  {db.getAccountBalance(selectedAcc.id).toLocaleString('ar-SA')} {selectedAcc.currency || 'YER'}
                </span>
                <span className="text-[10px] text-slate-400 block">
                  {db.getAccountBalance(selectedAcc.id) > 0
                    ? (selectedAcc.type === 'supplier' ? 'مطلوب السداد للمورد' : 'مطلوب السداد من العميل')
                    : 'مسوى ومسدد بالكامل'}
                </span>
              </div>
            </div>

            {/* View Mode Toggle */}
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-fit no-print">
              <button
                onClick={() => setLedgerViewMode('detailed')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  ledgerViewMode === 'detailed'
                    ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
                }`}
              >
                كشف حساب تفصيلي
              </button>
              <button
                onClick={() => setLedgerViewMode('monthly')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  ledgerViewMode === 'monthly'
                    ? 'bg-white dark:bg-slate-800 text-amber-500 dark:text-amber-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
                }`}
              >
                ملخص شهري مجمع
              </button>
            </div>

            {/* High-Speed Search inside the Statement (No Print in this row) */}
            <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl space-y-4 no-print" id="ledger_filters">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400">
                <Filter size={15} />
                <span>فلاتر وتصفية سريعة للحركات</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input
                    id="ledger_search_input"
                    type="text"
                    value={txSearchQuery}
                    onChange={(e) => setTxSearchQuery(e.target.value)}
                    placeholder="البحث بالبيان أو القيمة..."
                    className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-lg pr-9 pl-3 py-2 text-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <input
                    id="ledger_month_input"
                    type="month"
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val) {
                        const [year, month] = val.split('-');
                        const firstDay = `${year}-${month}-01`;
                        const lastDay = new Date(Number(year), Number(month), 0).toISOString().split('T')[0];
                        setStartDate(firstDay);
                        setEndDate(lastDay);
                      } else {
                        setStartDate('');
                        setEndDate('');
                      }
                    }}
                    title="تصفية حسب الشهر"
                    className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <input
                    id="ledger_start_date_input"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    placeholder="من تاريخ"
                    className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <input
                    id="ledger_end_date_input"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    placeholder="إلى تاريخ"
                    className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>
            </div>

            {/* Table Column Customizer Controls */}
            <div className="no-print bg-slate-50/60 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 p-3 rounded-xl flex flex-wrap items-center justify-between gap-3 text-right mb-3" id="account_ledger_cols_toggle_bar">
              <div className="flex items-center gap-1.5">
                <Eye size={14} className="text-blue-500" />
                <span className="text-xs font-black text-slate-700 dark:text-slate-300">تخصيص أعمدة كشف الحساب (إظهار/إخفاء):</span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5" dir="rtl">
                <button
                  type="button"
                  onClick={() => toggleColumn('txIndex')}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all flex items-center gap-1 cursor-pointer ${
                    visibleColumns.txIndex
                      ? 'bg-blue-500/10 border-blue-200 text-blue-600 dark:border-blue-900/40 dark:text-blue-400'
                      : 'bg-slate-50 dark:bg-slate-900 border-slate-200 text-slate-400 dark:border-slate-800 dark:text-slate-500'
                  }`}
                >
                  {visibleColumns.txIndex ? <Eye size={10} /> : <EyeOff size={10} />}
                  <span>الرقم</span>
                </button>
                <button
                  type="button"
                  onClick={() => toggleColumn('txDay')}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all flex items-center gap-1 cursor-pointer ${
                    visibleColumns.txDay
                      ? 'bg-blue-500/10 border-blue-200 text-blue-600 dark:border-blue-900/40 dark:text-blue-400'
                      : 'bg-slate-50 dark:bg-slate-900 border-slate-200 text-slate-400 dark:border-slate-800 dark:text-slate-500'
                  }`}
                >
                  {visibleColumns.txDay ? <Eye size={10} /> : <EyeOff size={10} />}
                  <span>اليوم</span>
                </button>
                <button
                  type="button"
                  onClick={() => toggleColumn('txDate')}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all flex items-center gap-1 cursor-pointer ${
                    visibleColumns.txDate
                      ? 'bg-blue-500/10 border-blue-200 text-blue-600 dark:border-blue-900/40 dark:text-blue-400'
                      : 'bg-slate-50 dark:bg-slate-900 border-slate-200 text-slate-400 dark:border-slate-800 dark:text-slate-500'
                  }`}
                >
                  {visibleColumns.txDate ? <Eye size={10} /> : <EyeOff size={10} />}
                  <span>التاريخ</span>
                </button>
                <button
                  type="button"
                  onClick={() => toggleColumn('txDesc')}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all flex items-center gap-1 cursor-pointer ${
                    visibleColumns.txDesc
                      ? 'bg-blue-500/10 border-blue-200 text-blue-600 dark:border-blue-900/40 dark:text-blue-400'
                      : 'bg-slate-50 dark:bg-slate-900 border-slate-200 text-slate-400 dark:border-slate-800 dark:text-slate-500'
                  }`}
                >
                  {visibleColumns.txDesc ? <Eye size={10} /> : <EyeOff size={10} />}
                  <span>التفاصيل والبيان</span>
                </button>
                <button
                  type="button"
                  onClick={() => toggleColumn('txQty')}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all flex items-center gap-1 cursor-pointer ${
                    visibleColumns.txQty
                      ? 'bg-blue-500/10 border-blue-200 text-blue-600 dark:border-blue-900/40 dark:text-blue-400'
                      : 'bg-slate-50 dark:bg-slate-900 border-slate-200 text-slate-400 dark:border-slate-800 dark:text-slate-500'
                  }`}
                >
                  {visibleColumns.txQty ? <Eye size={10} /> : <EyeOff size={10} />}
                  <span>الكمية</span>
                </button>
                <button
                  type="button"
                  onClick={() => toggleColumn('txPrice')}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all flex items-center gap-1 cursor-pointer ${
                    visibleColumns.txPrice
                      ? 'bg-blue-500/10 border-blue-200 text-blue-600 dark:border-blue-900/40 dark:text-blue-400'
                      : 'bg-slate-50 dark:bg-slate-900 border-slate-200 text-slate-400 dark:border-slate-800 dark:text-slate-500'
                  }`}
                >
                  {visibleColumns.txPrice ? <Eye size={10} /> : <EyeOff size={10} />}
                  <span>السعر</span>
                </button>
                <button
                  type="button"
                  onClick={() => toggleColumn('txExtra')}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all flex items-center gap-1 cursor-pointer ${
                    visibleColumns.txExtra
                      ? 'bg-blue-500/10 border-blue-200 text-blue-600 dark:border-blue-900/40 dark:text-blue-400'
                      : 'bg-slate-50 dark:bg-slate-900 border-slate-200 text-slate-400 dark:border-slate-800 dark:text-slate-500'
                  }`}
                >
                  {visibleColumns.txExtra ? <Eye size={10} /> : <EyeOff size={10} />}
                  <span>الزيادات</span>
                </button>
                <button
                  type="button"
                  onClick={() => toggleColumn('txTotal')}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all flex items-center gap-1 cursor-pointer ${
                    visibleColumns.txTotal
                      ? 'bg-blue-500/10 border-blue-200 text-blue-600 dark:border-blue-900/40 dark:text-blue-400'
                      : 'bg-slate-50 dark:bg-slate-900 border-slate-200 text-slate-400 dark:border-slate-800 dark:text-slate-500'
                  }`}
                >
                  {visibleColumns.txTotal ? <Eye size={10} /> : <EyeOff size={10} />}
                  <span>الإجمالي</span>
                </button>
                <button
                  type="button"
                  onClick={() => toggleColumn('txType')}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all flex items-center gap-1 cursor-pointer ${
                    visibleColumns.txType
                      ? 'bg-blue-500/10 border-blue-200 text-blue-600 dark:border-blue-900/40 dark:text-blue-300'
                      : 'bg-slate-50 dark:bg-slate-900 border-slate-200 text-slate-400 dark:border-slate-800 dark:text-slate-500'
                  }`}
                >
                  {visibleColumns.txType ? <Eye size={10} /> : <EyeOff size={10} />}
                  <span>نوع الحركة</span>
                </button>
                <button
                  type="button"
                  onClick={() => toggleColumn('txBalance')}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all flex items-center gap-1 cursor-pointer ${
                    visibleColumns.txBalance
                      ? 'bg-blue-500/10 border-blue-200 text-blue-600 dark:border-blue-900/40 dark:text-blue-400'
                      : 'bg-slate-50 dark:bg-slate-900 border-slate-200 text-slate-400 dark:border-slate-800 dark:text-slate-500'
                  }`}
                >
                  {visibleColumns.txBalance ? <Eye size={10} /> : <EyeOff size={10} />}
                  <span>الرصيد</span>
                </button>
              </div>
            </div>

            {/* Ledger Transactions Entries table */}
            <div className="overflow-x-auto border border-slate-100 dark:border-slate-800 rounded-xl" id="ledger_table_area">
              {ledgerViewMode === 'monthly' ? (
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 uppercase font-bold text-[11px] border-b border-slate-100 dark:border-slate-800">
                    <tr>
                      <th className="px-3 py-3.5 text-right">الشهر</th>
                      <th className="px-3 py-3.5 text-left text-amber-600 dark:text-amber-500">إجمالي مدين (+)</th>
                      <th className="px-3 py-3.5 text-left text-emerald-600 dark:text-emerald-500">إجمالي دائن (-)</th>
                      <th className="px-3 py-3.5 text-left">صافي الحركة الشهري</th>
                      <th className="px-3 py-3.5 text-left bg-slate-100/50 dark:bg-slate-800/40">الرصيد التراكمي في نهاية الشهر</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                    {monthlySummaryRows.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-12 text-center text-slate-400">
                          لا توجد حركات مالية لعرض الملخص الشهري.
                        </td>
                      </tr>
                    ) : (
                      monthlySummaryRows.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="px-3 py-3.5 font-bold text-slate-800 dark:text-slate-100 font-mono text-base">{row.monthStr}</td>
                          <td className="px-3 py-3.5 text-left font-mono font-medium text-amber-600 dark:text-amber-500" dir="ltr">
                            {row.debit > 0 ? `${row.debit.toLocaleString('en-US')} ${selectedAcc.currency || 'YER'}` : '—'}
                          </td>
                          <td className="px-3 py-3.5 text-left font-mono font-medium text-emerald-600 dark:text-emerald-500" dir="ltr">
                            {row.credit > 0 ? `${row.credit.toLocaleString('en-US')} ${selectedAcc.currency || 'YER'}` : '—'}
                          </td>
                          <td className="px-3 py-3.5 text-left font-mono font-bold" dir="ltr">
                            <span className={row.net > 0 ? 'text-amber-600 dark:text-amber-500' : row.net < 0 ? 'text-emerald-600 dark:text-emerald-500' : 'text-slate-400'}>
                              {row.net !== 0 ? `${row.net > 0 ? '+' : ''}${row.net.toLocaleString('en-US')} ${selectedAcc.currency || 'YER'}` : '—'}
                            </span>
                          </td>
                          <td className="px-3 py-3.5 text-left font-mono font-black text-slate-900 dark:text-white bg-slate-50/60 dark:bg-slate-800/40" dir="ltr">
                            {row.balanceAfter.toLocaleString('en-US', {minimumFractionDigits: 1})} {selectedAcc.currency || 'YER'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {monthlySummaryRows.length > 0 && (
                    <tfoot className="bg-slate-50 dark:bg-slate-800/80 font-bold border-t border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100">
                      <tr>
                        <td className="px-3 py-4 text-right text-sm">الإجمالي الكلي:</td>
                        <td className="px-3 py-4 text-left font-mono text-amber-600 dark:text-amber-500" dir="ltr">
                          {statementTotals.debitTotal.toLocaleString('en-US')} {selectedAcc.currency || 'YER'}
                        </td>
                        <td className="px-3 py-4 text-left font-mono text-emerald-600 dark:text-emerald-500" dir="ltr">
                          {statementTotals.creditTotal.toLocaleString('en-US')} {selectedAcc.currency || 'YER'}
                        </td>
                        <td className="px-3 py-4 text-left font-mono" dir="ltr">
                          {(statementTotals.debitTotal - statementTotals.creditTotal).toLocaleString('en-US')} {selectedAcc.currency || 'YER'}
                        </td>
                        <td className="px-3 py-4 text-left font-mono bg-slate-100/50 dark:bg-slate-800/40 text-blue-600 dark:text-blue-400" dir="ltr">
                          {statementRows[statementRows.length - 1].balanceAfter.toLocaleString('en-US', {minimumFractionDigits: 1})} {selectedAcc.currency || 'YER'}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              ) : (
                <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 uppercase font-bold text-[11px] border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    {visibleColumns.txIndex && <th className="px-3 py-3.5 text-right">الرقم</th>}
                    {visibleColumns.txDay && <th className="px-3 py-3.5 text-right">اليوم</th>}
                    {visibleColumns.txDate && <th className="px-3 py-3.5 text-right">التاريخ</th>}
                    {visibleColumns.txDesc && <th className="px-3 py-3.5 text-right">التفاصيل والبيان</th>}
                    {visibleColumns.txQty && <th className="px-3 py-3.5 text-center">الكمية أو العدد</th>}
                    {visibleColumns.txPrice && <th className="px-3 py-3.5 text-left">السعر</th>}
                    {visibleColumns.txExtra && <th className="px-3 py-3.5 text-left">الزيادات</th>}
                    {visibleColumns.txTotal && <th className="px-3 py-3.5 text-left">الإجمالي</th>}
                    {visibleColumns.txType && <th className="px-3 py-3.5 text-center">نوع الحركة</th>}
                    {visibleColumns.txBalance && <th className="px-3 py-3.5 text-left bg-slate-100/50 dark:bg-slate-800/40">الرصيد بعد الحركة</th>}
                    {role !== 'Salesperson' && !isModificationRestricted && <th className="px-3 py-3.5 text-center no-print animate-pulse">إجراءات</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {statementRows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={
                          (visibleColumns.txIndex ? 1 : 0) +
                          (visibleColumns.txDay ? 1 : 0) +
                          (visibleColumns.txDate ? 1 : 0) +
                          (visibleColumns.txDesc ? 1 : 0) +
                          (visibleColumns.txQty ? 1 : 0) +
                          (visibleColumns.txPrice ? 1 : 0) +
                          (visibleColumns.txExtra ? 1 : 0) +
                          (visibleColumns.txTotal ? 1 : 0) +
                          (visibleColumns.txType ? 1 : 0) +
                          (visibleColumns.txBalance ? 1 : 0) +
                          (role !== 'Salesperson' && !isModificationRestricted ? 1 : 0)
                        }
                        className="px-4 py-12 text-center text-slate-400"
                      >
                        لا توجد قيود مسجلة تطابق محددات التصفية والبحث في كشف الحساب الحالي.
                      </td>
                    </tr>
                  ) : (
                    statementRows.map((tx, idx) => {
                      const isDebit = tx.type === 'debit';
                      const txCurr = tx.currency || selectedAcc.currency || 'YER';

                      // Safely fetch day of week name in Arabic
                      let dayName = '-';
                      if (tx.date) {
                        try {
                          const dateObj = new Date(tx.date);
                          if (!isNaN(dateObj.getTime())) {
                            dayName = dateObj.toLocaleDateString('ar-SA', { weekday: 'long' });
                          }
                        } catch (e) {
                          dayName = '-';
                        }
                      }

                      // Destructure price items or fallback
                      const quantityVal = tx.quantity !== undefined && tx.quantity !== null ? tx.quantity : 1;
                      const unitPriceVal = tx.unitPrice !== undefined && tx.unitPrice !== null ? tx.unitPrice : tx.amount;
                      const extraChargesVal = tx.extraCharges !== undefined && tx.extraCharges !== null ? tx.extraCharges : 0;

                      return (
                        <tr key={tx.id} id={`tx_row_${tx.id}`} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                          {visibleColumns.txIndex && <td className="px-3 py-3.5 text-[10px] text-slate-400 font-mono">#{idx+1}</td>}
                          {visibleColumns.txDay && <td className="px-3 py-3.5 font-bold text-slate-600 dark:text-slate-300">{dayName}</td>}
                          {visibleColumns.txDate && <td className="px-3 py-3.5 font-mono text-slate-500 whitespace-nowrap">{tx.date}</td>}
                          {visibleColumns.txDesc && (
                            <td className="px-3 py-3.5">
                              <span className="font-medium block text-slate-800 dark:text-slate-100">{tx.description}</span>
                            </td>
                          )}
                          {visibleColumns.txQty && (
                            <td className="px-3 py-3.5 text-center font-mono font-bold text-slate-700 dark:text-slate-200">
                              {tx.quantity !== undefined ? tx.quantity.toLocaleString('ar-SA') : '—'}
                            </td>
                          )}
                          {visibleColumns.txPrice && (
                            <td className="px-3 py-3.5 text-left font-mono font-medium text-slate-600 dark:text-slate-400" dir="ltr">
                              {tx.unitPrice !== undefined ? `${tx.unitPrice.toLocaleString('en-US')} ${txCurr}` : '—'}
                            </td>
                          )}
                          {visibleColumns.txExtra && (
                            <td className="px-3 py-3.5 text-left font-mono font-medium text-amber-600 dark:text-amber-400" dir="ltr">
                              {tx.extraCharges !== undefined && tx.extraCharges > 0 ? `+${tx.extraCharges.toLocaleString('en-US')} ${txCurr}` : '—'}
                            </td>
                          )}
                          {visibleColumns.txTotal && (
                            <td className="px-3 py-3.5 text-left font-mono font-extrabold text-slate-900 dark:text-white" dir="ltr">
                              {tx.amount.toLocaleString('en-US', {minimumFractionDigits: 1})} {txCurr}
                            </td>
                          )}
                          {visibleColumns.txType && (
                            <td className="px-3 py-3.5 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                isDebit
                                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
                                  : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                              }`}>
                                {isDebit ? 'مدين +' : 'دائن -'}
                              </span>
                            </td>
                          )}
                          {visibleColumns.txBalance && (
                            <td className="px-3 py-3.5 text-left font-mono font-bold text-slate-800 dark:text-slate-100 bg-slate-50/60 dark:bg-slate-800/40" dir="ltr">
                              {tx.balanceAfter.toLocaleString('en-US', {minimumFractionDigits: 1})} {selectedAcc.currency || 'YER'}
                            </td>
                          )}
                          {role !== 'Salesperson' && !isModificationRestricted && (
                            <td className="px-3 py-3.5 text-center no-print">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  id={`edit_tx_btn_${tx.id}`}
                                  onClick={() => handleOpenEditTxModal(tx)}
                                  className="text-blue-500 hover:text-blue-700 bg-blue-50 dark:bg-blue-950/20 p-2 rounded-lg transition-colors cursor-pointer"
                                  title="تعديل القيد المالي"
                                >
                                  <Edit size={12} />
                                </button>
                                <button
                                  id={`delete_tx_btn_${tx.id}`}
                                  onClick={() => handleDeleteTransaction(tx.id)}
                                  className="text-red-500 hover:text-red-700 bg-red-50 dark:bg-red-950/20 p-2 rounded-lg transition-colors cursor-pointer"
                                  title="حذف القيد"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
                {statementRows.length > 0 && (
                  <tfoot className="bg-slate-50 dark:bg-slate-800/80 font-bold border-t border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100">
                    <tr>
                      <td colSpan={
                        (visibleColumns.txIndex ? 1 : 0) +
                        (visibleColumns.txDay ? 1 : 0) +
                        (visibleColumns.txDate ? 1 : 0) +
                        (visibleColumns.txDesc ? 1 : 0)
                      } className="px-4 py-4 text-left">الإجمالي الكلي:</td>

                      {visibleColumns.txQty && <td className="px-3 py-4 text-center">-</td>}
                      {visibleColumns.txPrice && <td className="px-3 py-4 text-center">-</td>}
                      {visibleColumns.txExtra && <td className="px-3 py-4 text-left text-amber-600">-</td>}
                      {visibleColumns.txTotal && (
                        <td className="px-3 py-4 text-left font-mono">
                          <div className="flex flex-col gap-1 text-[11px]">
                            <span className="text-amber-600 dark:text-amber-500">مدين: {statementTotals.debitTotal.toLocaleString('en-US', {minimumFractionDigits: 1})}</span>
                            <span className="text-emerald-600 dark:text-emerald-500">دائن: {statementTotals.creditTotal.toLocaleString('en-US', {minimumFractionDigits: 1})}</span>
                          </div>
                        </td>
                      )}

                      {visibleColumns.txType && <td className="px-3 py-4 text-center">-</td>}
                      {visibleColumns.txBalance && <td className="px-3 py-4 text-left bg-slate-100/50 dark:bg-slate-800/40 text-blue-600 dark:text-blue-400 font-mono">
                        {statementRows[statementRows.length - 1].balanceAfter.toLocaleString('en-US', {minimumFractionDigits: 1})} {selectedAcc.currency || 'YER'}
                      </td>}
                      {role !== 'Salesperson' && !isModificationRestricted && <td className="px-3 py-4 no-print"></td>}
                    </tr>
                  </tfoot>
                )}
              </table>
              )}
            </div>

            {/* Printable Footnote Branding */}
            <div className="hidden print-only border-t pt-6 mt-6 text-right space-y-4" id="ledger_print_footer">
              <p className="text-[10px] text-slate-500 leading-relaxed text-center font-bold">
                {db.printFooterNote || 'كشف مالي إلكتروني معتمد بنظام أنس'}
              </p>

              {db.printShowSignature && (
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="border border-slate-200 rounded-xl p-4 text-center">
                    <span className="text-[11px] font-black text-slate-700 block mb-8">إقراد واعتماد المحاسب / المدقق</span>
                    <span className="text-[10px] text-slate-400 block border-t pt-2 border-dashed">التوقيع والخاتم: .........................</span>
                  </div>
                  <div className="border border-slate-200 rounded-xl p-4 text-center">
                    <span className="text-[11px] font-black text-slate-700 block mb-8">مصادقة إدارة الحسابات المعتمدة</span>
                    <span className="text-[10px] text-slate-400 block border-t pt-2 border-dashed">التوقيع والخاتم: .........................</span>
                  </div>
                </div>
              )}
            </div>

            {/* Invoices Log */}
            {!isCompactPrint && db.invoices.filter(inv => inv.accountId === selectedAcc.id).length > 0 && (
              <div className="mt-8 no-print space-y-4">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-2">سجل الفواتير</h3>
                <div className="space-y-3">
                  {db.invoices.filter(inv => inv.accountId === selectedAcc.id).map(invoice => (
                    <div key={invoice.id} className="bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700/50 rounded-xl p-4 flex justify-between items-center">
                      <div className="space-y-1 text-right">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">فاتورة رقم: {invoice.invoiceNumber}</span>
                        <span className="text-[10px] text-slate-500 block">التاريخ: {invoice.date}</span>
                        {invoice.notes && <span className="text-[10px] text-slate-400 block truncate max-w-[200px]">{invoice.notes}</span>}
                      </div>
                      <span className="text-sm font-mono font-bold text-emerald-600 dark:text-emerald-400" dir="ltr">
                        {invoice.total.toLocaleString()} {invoice.currency}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}
      </div>

      {/* Comprehensive Print Preview Modal for Account Ledger */}
      {showPrintPreview && selectedAcc && (
        <div className="fixed inset-0 z-50 overflow-y-auto print-modal-overlay flex flex-col bg-slate-900/95 backdrop-blur-xs animate-in fade-in duration-200" dir="rtl">
          {/* Top Control Bar */}
          <div className="sticky top-0 z-10 w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 shadow-md flex flex-col md:flex-row items-center justify-between gap-4 no-print">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl">
                <Eye size={20} />
              </div>
              <div>
                <h3 className="font-black text-slate-800 dark:text-slate-100 text-sm md:text-base">
                  معاينة كشف الحساب النهائي المخصص للطباعة
                </h3>
                <p className="text-[10px] md:text-xs text-slate-400 font-bold mt-0.5">الحساب: {selectedAcc.name} | تاريخ الطباعة: {new Date().toLocaleDateString('ar-SA')}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Live Theme Swapper */}
              <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3.5 py-2 rounded-xl border border-slate-200/60 dark:border-slate-700">
                <Palette size={14} className="text-slate-500" />
                <span className="text-xs font-black text-slate-600 dark:text-slate-300">لون الكشف المطبوع:</span>
                <select
                  value={printThemeColor}
                  onChange={(e) => {
                    const newColor = e.target.value;
                    setPrintThemeColor(newColor);
                    db.printThemeColor = newColor;
                    db.save();
                    onDatabaseUpdate();
                  }}
                  className="bg-transparent text-xs text-slate-800 dark:text-slate-100 font-bold outline-hidden cursor-pointer"
                >
                  <option value="emerald">أخضر زمردي</option>
                  <option value="indigo">أزرق نيلي</option>
                  <option value="blue">أزرق ملكي</option>
                  <option value="slate">رمادي كلاسيك</option>
                  <option value="red">أحمر قاني</option>
                  <option value="amber">أصفر كهرماني</option>
                  <option value="teal">أخضر فيروزي</option>
                </select>
              </div>

              {/* Start System Print Dialog */}
              <button
                onClick={() => window.print()}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs transition-colors shadow-md cursor-pointer"
              >
                <Printer size={15} />
                بدء الطباعة الآن
              </button>

              {/* Close Modal Preview */}
              <button
                onClick={() => setShowPrintPreview(false)}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
              >
                <X size={15} />
                إغلاق المعاينة
              </button>
            </div>
          </div>

          {/* Interactive Screen Container representing paper flow */}
          <div className="flex-1 overflow-x-auto p-4 md:p-8 bg-slate-950/40 flex justify-center items-start print-modal-content">
            <div className="print-document w-full max-w-[210mm] bg-white text-slate-900 p-8 shadow-2xl rounded-xs border border-slate-200 my-4 select-text relative animate-in zoom-in-95 duration-200 mx-auto" style={{ minHeight: '297mm', direction: 'rtl' }}>

              {/* Optional Watermark background */}
              {db.printShowWatermark && (
                <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] pointer-events-none select-none rotate-12">
                  <div className="text-center">
                    <span className="text-6xl font-black block tracking-widest">{db.printCompanyName || 'نظام أنس المحاسبي'}</span>
                    <span className="text-xl block mt-2 font-bold">كشف حساب رسمي معتمد</span>
                  </div>
                </div>
              )}

              {/* Elegant Double Border */}
              <div className={`print-border-wrapper border-4 border-double ${themeColors[printThemeColor as keyof typeof themeColors]?.borderDouble || 'border-emerald-700'} p-6 min-h-[265mm] flex flex-col justify-between relative z-10`}>

                <div>
                  {/* Traditional Statement Header block */}
                  <div className={`border-b-2 ${themeColors[printThemeColor as keyof typeof themeColors]?.borderLight || 'border-emerald-200'} pb-4 mb-6 flex justify-between items-center`}>
                    <div className="text-right space-y-1 w-1/3">
                      <p className="text-xs font-bold text-slate-700">تلفون: <span className="font-mono text-xs">{db.printPhone || '777xxxxxx'}</span></p>
                      <p className="text-xs font-bold text-slate-700">العنوان: <span className="text-xs">{db.printAddress || 'اليمن - صنعاء'}</span></p>
                      {db.printTaxNumber && <p className="text-[10px] text-slate-400 font-bold">الرقم الضريبي: <span className="font-mono">{db.printTaxNumber}</span></p>}
                    </div>

                    <div className="flex flex-col items-center justify-center text-center w-1/3">
                      <QatLogo colorScheme={printThemeColor as any} customLogoUrl={db.printCompanyLogo} />
                      <h1 className={`text-xl font-black ${themeColors[printThemeColor as keyof typeof themeColors]?.textDark || 'text-emerald-900'} mt-1.5`}>
                        {db.printCompanyName || 'نظام أنس المحاسبي المطور'}
                      </h1>
                      <span className="text-[10px] text-slate-500 font-black tracking-widest mt-0.5">
                        {db.printHeaderNote || 'كشف حساب مالي تفصيلي معتمد'}
                      </span>
                    </div>

                    <div className="text-left space-y-1 w-1/3 flex flex-col items-end">
                      <span className={`px-4 py-1 text-sm font-black rounded-lg ${selectedAcc.type === 'supplier' ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-blue-100 text-blue-800 border border-blue-200'}`}>
                        {selectedAcc.type === 'supplier' ? 'قسم الموردين' : 'قسم العملاء والمبيعات'}
                      </span>
                      <p className="text-xs font-bold text-slate-700 mt-2">رقم الحساب: <span className="font-mono text-xs text-slate-900">{selectedAcc.id}</span></p>
                      <p className="text-xs font-bold text-slate-700">تاريخ الاستخراج: <span className="font-mono text-xs text-slate-900">{new Date().toLocaleDateString('ar-SA')}</span></p>
                    </div>
                  </div>

                  {/* Customer / Supplier details in physical ledger box */}
                  <div className={`grid grid-cols-2 gap-4 mb-6 border ${themeColors[printThemeColor as keyof typeof themeColors]?.borderLight || 'border-emerald-200'} rounded-xl p-4 ${themeColors[printThemeColor as keyof typeof themeColors]?.bgLight || 'bg-emerald-50/20'}`}>
                    <div>
                      <span className="text-xs text-slate-500 block font-bold">كشف حساب السيد / الأخ:</span>
                      <span className={`text-base font-black ${themeColors[printThemeColor as keyof typeof themeColors]?.textDark || 'text-emerald-900'}`}>{selectedAcc.name}</span>
                    </div>
                    <div className="text-left self-center">
                      <span className="text-xs text-slate-500 block font-bold">العملة المعتمدة للكشف:</span>
                      <span className="text-sm font-bold text-slate-800">{selectedAcc.currency}</span>
                    </div>
                  </div>

                  {/* Balance Summary Cards */}
                  <div className="grid grid-cols-4 gap-4 mb-6">
                    <div className="p-3 border border-slate-200 rounded-xl bg-slate-50 text-right">
                      <span className="text-[10px] text-slate-400 block font-bold">الرصيد الافتتاحي:</span>
                      <span className="text-xs font-extrabold font-mono tracking-tight text-slate-700 mt-1 block">
                        {selectedAcc.openingBalance.toLocaleString('ar-SA')} {selectedAcc.currency}
                      </span>
                    </div>
                    <div className="p-3 border border-slate-200 rounded-xl bg-slate-50 text-right">
                      <span className="text-[10px] text-slate-400 block font-bold">إجمالي مدين (+):</span>
                      <span className="text-xs font-extrabold font-mono tracking-tight text-amber-600 mt-1 block">
                        {statementTotals.debitTotal.toLocaleString('ar-SA')} {selectedAcc.currency}
                      </span>
                    </div>
                    <div className="p-3 border border-slate-200 rounded-xl bg-slate-50 text-right">
                      <span className="text-[10px] text-slate-400 block font-bold">إجمالي دائن (-):</span>
                      <span className="text-xs font-extrabold font-mono tracking-tight text-emerald-600 mt-1 block">
                        {statementTotals.creditTotal.toLocaleString('ar-SA')} {selectedAcc.currency}
                      </span>
                    </div>
                    <div className={`p-3 border rounded-xl text-right ${themeColors[printThemeColor as keyof typeof themeColors]?.bgLight || 'bg-emerald-50/20'} ${themeColors[printThemeColor as keyof typeof themeColors]?.borderLight || 'border-emerald-200'}`}>
                      <span className="text-[10px] text-slate-500 block font-black">الرصيد الصافي المتبقي:</span>
                      <span className={`text-sm font-black font-mono tracking-tight mt-1 block ${themeColors[printThemeColor as keyof typeof themeColors]?.textDark || 'text-emerald-900'}`}>
                        {db.getAccountBalance(selectedAcc.id).toLocaleString('ar-SA')} {selectedAcc.currency}
                      </span>
                    </div>
                  </div>

                  {/* Table Block */}
                  {ledgerViewMode === 'monthly' ? (
                    <table className={`w-full text-right border-collapse border-2 ${themeColors[printThemeColor as keyof typeof themeColors]?.borderDouble || 'border-emerald-700'} text-[11px]`}>
                      <thead>
                        <tr className={`${themeColors[printThemeColor as keyof typeof themeColors]?.headerBg || 'bg-emerald-700 text-white'} font-black text-center border-b-2 ${themeColors[printThemeColor as keyof typeof themeColors]?.borderDouble || 'border-emerald-700'}`}>
                          <th className="p-2 border-l border-white/20 text-right">الشهر</th>
                          <th className="p-2 border-l border-white/20 w-32 text-center">إجمالي مدين (+)</th>
                          <th className="p-2 border-l border-white/20 w-32 text-center">إجمالي دائن (-)</th>
                          <th className="p-2 border-l border-white/20 w-36 text-center">صافي الحركة الشهري</th>
                          <th className="p-2 w-44 text-left">الرصيد التراكمي النهائي</th>
                        </tr>
                      </thead>
                      <tbody>
                        {monthlySummaryRows.map((row, idx) => (
                          <tr key={idx} className="border-b border-slate-200 even:bg-slate-50/50">
                            <td className="p-2.5 border-l border-slate-200 font-bold text-slate-800 font-mono text-xs">{row.monthStr}</td>
                            <td className="p-2.5 border-l border-slate-200 text-center font-mono font-bold text-amber-700">
                              {row.debit > 0 ? row.debit.toLocaleString('en-US') : '—'}
                            </td>
                            <td className="p-2.5 border-l border-slate-200 text-center font-mono font-bold text-emerald-700">
                              {row.credit > 0 ? row.credit.toLocaleString('en-US') : '—'}
                            </td>
                            <td className="p-2.5 border-l border-slate-200 text-center font-mono font-black">
                              <span className={row.net > 0 ? 'text-amber-700' : row.net < 0 ? 'text-emerald-700' : 'text-slate-400'}>
                                {row.net !== 0 ? `${row.net > 0 ? '+' : ''}${row.net.toLocaleString('en-US')}` : '—'}
                              </span>
                            </td>
                            <td className="p-2.5 text-left font-mono font-black text-slate-900 bg-slate-50">
                              {row.balanceAfter.toLocaleString('en-US', {minimumFractionDigits: 1})} {selectedAcc.currency}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <table className={`w-full text-right border-collapse border-2 ${themeColors[printThemeColor as keyof typeof themeColors]?.borderDouble || 'border-emerald-700'} text-[10px]`}>
                      <thead>
                        <tr className={`${themeColors[printThemeColor as keyof typeof themeColors]?.headerBg || 'bg-emerald-700 text-white'} font-black text-center border-b-2 ${themeColors[printThemeColor as keyof typeof themeColors]?.borderDouble || 'border-emerald-700'}`}>
                          {visibleColumns.txIndex && <th className="p-2 border-l border-white/20 w-12 text-center">الرقم</th>}
                          {visibleColumns.txDay && <th className="p-2 border-l border-white/20 w-16 text-center">اليوم</th>}
                          {visibleColumns.txDate && <th className="p-2 border-l border-white/20 w-24 text-center">التاريخ</th>}
                          {visibleColumns.txDesc && <th className="p-2 border-l border-white/20 text-right">تفاصيل الحركة والبيان</th>}
                          {visibleColumns.txQty && <th className="p-2 border-l border-white/20 w-14 text-center">العدد</th>}
                          {visibleColumns.txPrice && <th className="p-2 border-l border-white/20 w-20 text-center">السعر</th>}
                          {visibleColumns.txExtra && <th className="p-2 border-l border-white/20 w-16 text-center">الزيادات</th>}
                          {visibleColumns.txTotal && <th className="p-2 border-l border-white/20 w-24 text-left">المبلغ</th>}
                          {visibleColumns.txType && <th className="p-2 border-l border-white/20 w-16 text-center">الحركة</th>}
                          {visibleColumns.txBalance && <th className="p-2 w-28 text-left bg-black/5">الرصيد التراكمي</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {statementRows.map((tx, idx) => {
                          const isDebit = tx.type === 'debit';

                          // Safely fetch day of week name in Arabic
                          let dayName = '-';
                          if (tx.date) {
                            try {
                              const dateObj = new Date(tx.date);
                              if (!isNaN(dateObj.getTime())) {
                                dayName = dateObj.toLocaleDateString('ar-SA', { weekday: 'long' });
                              }
                            } catch (e) {
                              dayName = '-';
                            }
                          }

                          return (
                            <tr key={tx.id} className="border-b border-slate-200 even:bg-slate-50/30 hover:bg-slate-100/20">
                              {visibleColumns.txIndex && <td className="p-2 border-l border-slate-200 text-center font-mono font-bold text-slate-400">#{idx+1}</td>}
                              {visibleColumns.txDay && <td className="p-2 border-l border-slate-200 text-center font-bold text-slate-600">{dayName}</td>}
                              {visibleColumns.txDate && <td className="p-2 border-l border-slate-200 text-center font-mono text-slate-500">{tx.date}</td>}
                              {visibleColumns.txDesc && <td className="p-2 border-l border-slate-200 text-right font-black text-slate-800 leading-tight">{tx.description}</td>}
                              {visibleColumns.txQty && <td className="p-2 border-l border-slate-200 text-center font-mono font-bold">{tx.quantity !== undefined ? tx.quantity : '—'}</td>}
                              {visibleColumns.txPrice && <td className="p-2 border-l border-slate-200 text-center font-mono font-bold">{tx.unitPrice !== undefined ? tx.unitPrice.toLocaleString() : '—'}</td>}
                              {visibleColumns.txExtra && <td className="p-2 border-l border-slate-200 text-center font-mono font-bold text-amber-700">{tx.extraCharges && tx.extraCharges > 0 ? `+${tx.extraCharges.toLocaleString()}` : '—'}</td>}
                              {visibleColumns.txTotal && <td className="p-2 border-l border-slate-200 text-left font-mono font-black text-slate-900">{tx.amount.toLocaleString('en-US', {minimumFractionDigits: 1})}</td>}
                              {visibleColumns.txType && (
                                <td className="p-2 border-l border-slate-200 text-center">
                                  <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${isDebit ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                                    {isDebit ? 'مدين +' : 'دائن -'}
                                  </span>
                                </td>
                              )}
                              {visibleColumns.txBalance && <td className="p-2 text-left font-mono font-black text-slate-800 bg-slate-50">{tx.balanceAfter.toLocaleString('en-US', {minimumFractionDigits: 1})}</td>}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* Printable Footnote and signatures */}
                <div className="mt-8 border-t border-slate-200 pt-6 flex flex-col space-y-4">
                  <p className="text-[10px] text-slate-500 leading-relaxed text-center font-bold">
                    {db.printFooterNote || 'كشف مالي إلكتروني معتمد بنظام أنس'}
                  </p>

                  {db.printShowSignature && (
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <div className="border border-slate-200 rounded-xl p-3 text-center">
                        <span className="text-[10px] font-black text-slate-700 block mb-6">إقراد واعتماد المحاسب / المدقق</span>
                        <span className="text-[9px] text-slate-400 block border-t pt-1.5 border-dashed">التوقيع والخاتم: .........................</span>
                      </div>
                      <div className="border border-slate-200 rounded-xl p-3 text-center">
                        <span className="text-[10px] font-black text-slate-700 block mb-6">مصادقة وإقرار صاحب الحساب ({selectedAcc.name})</span>
                        <span className="text-[9px] text-slate-400 block border-t pt-1.5 border-dashed">التوقيع والخاتم: .........................</span>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: Create Account Form Popup */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 no-print" id="create_account_modal">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-xl space-y-6 text-right">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">إضافة حساب جديد ({activeType === 'supplier' ? 'مورد' : 'عميل'})</h3>
              <button
                id="close_create_modal_btn"
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAccount} className="space-y-4 text-right">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block">الاسم الكامل للحساب *</label>
                <input
                  id="new_account_name"
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="مثال: شركة الجزيرة للتجارة"
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block">رقم الهاتف الجوال *</label>
                <input
                  id="new_account_phone"
                  type="tel"
                  required
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="مثال: +967501234567"
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-left font-mono"
                  dir="ltr"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block">العنوان أو المقر</label>
                <input
                  id="new_account_address"
                  type="text"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  placeholder="صنعاء"
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block">الرصيد الافتتاحي</label>
                <input
                  id="new_account_opening_balance"
                  type="number"
                  value={newOpeningBalance}
                  onChange={(e) => setNewOpeningBalance(Number(e.target.value))}
                  placeholder="0.00"
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block pb-1 border-b border-slate-100 dark:border-slate-800">التنبيهات والرسائل التلقائية</label>
                <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-xl px-4 py-3">
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    تفعيل إرسال إشعارات التحديث والأرصدة لهذا الحساب عبر بوابات WhatsApp / SMS
                  </span>
                  <input
                    type="checkbox"
                    checked={newNotificationsEnabled}
                    onChange={(e) => setNewNotificationsEnabled(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block font-bold">عملة الحساب</label>
                  <select
                    id="new_account_currency"
                    value={newCurrency}
                    onChange={(e) => setNewCurrency(e.target.value)}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-100 font-bold cursor-pointer"
                  >
                    {SUPPORTED_CURRENCIES.map(c => (
                      <option key={c.code} value={c.code}>
                        {c.flag} {c.nameAr} ({c.symbolAr} - {c.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block font-bold">الحالة الافتتاحية للملف المالي</label>
                  <select
                    id="new_account_status"
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as 'active' | 'closed')}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-100 font-bold cursor-pointer"
                  >
                    <option value="active">نشط (مفتوح وجاهز للمعاملات اليومية)</option>
                    <option value="closed">مغلق (مجمد مؤقتاً)</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2.5 pt-4">
                <button
                  id="submit_create_account"
                  type="submit"
                  className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold text-white cursor-pointer transition-colors ${activeType === 'supplier' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-blue-600 hover:bg-blue-700'}`}
                >
                  حفظ وتسجيل الحساب
                </button>
                <button
                  id="cancel_create_account"
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-3 px-4 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  تراجع
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Account Modal */}
      {showEditModal && selectedAcc && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto no-print" id="edit_account_modal">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-xl space-y-6 text-right my-auto">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">تعديل بيانات الحساب</h3>
              <button
                id="close_edit_modal_btn"
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditAccount} className="space-y-4 text-right">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block">الاسم الكامل للحساب *</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block">رقم الهاتف الجوال *</label>
                <input
                  type="tel"
                  required
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-left font-mono"
                  dir="ltr"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block">العنوان أو المقر</label>
                <input
                  type="text"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block">الرصيد الافتتاحي</label>
                <input
                  type="number"
                  value={editOpeningBalance}
                  onChange={(e) => setEditOpeningBalance(Number(e.target.value))}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block pb-1 border-b border-slate-100 dark:border-slate-800">التنبيهات والرسائل التلقائية</label>
                <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-xl px-4 py-3">
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    تفعيل إرسال إشعارات التحديث والأرصدة لهذا الحساب عبر بوابات WhatsApp / SMS
                  </span>
                  <input
                    type="checkbox"
                    checked={editNotificationsEnabled}
                    onChange={(e) => setEditNotificationsEnabled(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block font-bold">العملة الافتراضية</label>
                  <select
                    value={editCurrency}
                    onChange={(e) => setEditCurrency(e.target.value)}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-100 font-bold cursor-pointer"
                  >
                    {SUPPORTED_CURRENCIES.map(c => (
                      <option key={c.code} value={c.code}>
                        {c.flag} {c.nameAr} ({c.symbolAr} - {c.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block font-bold">حالة الملف المالي</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as 'active' | 'closed')}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-100 font-bold cursor-pointer"
                  >
                    <option value="active">نشط (مفتوح المعاملات)</option>
                    <option value="closed">مغلق (مجمد مؤقتاً)</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2.5 pt-4">
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 cursor-pointer transition-colors"
                >
                  حفظ التعديلات
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 py-3 px-4 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  تراجع
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Add Transaction Popup Form */}
      {showTxModal && selectedAcc && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 no-print" id="quick_tx_modal">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-xl space-y-6 text-right">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="space-y-0.5">
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">تأصيل معالجة قيد مالي</h3>
                <p className="text-[10px] text-slate-400 dark:text-slate-500">حساب: {selectedAcc.name}</p>
              </div>
              <button
                id="close_tx_modal_btn"
                onClick={() => setShowTxModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddTransaction} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <button
                  id="type_debit_btn"
                  type="button"
                  onClick={() => setTxType('debit')}
                  className={`p-3 rounded-xl text-xs font-bold border transition-all ${
                    txType === 'debit'
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-600'
                      : 'bg-slate-50 border-slate-100 text-slate-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'
                  }`}
                >
                  مدين (إضافة ذمة مبيعات)
                </button>
                <button
                  id="type_credit_btn"
                  type="button"
                  onClick={() => setTxType('credit')}
                  className={`p-3 rounded-xl text-xs font-bold border transition-all ${
                    txType === 'credit'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600'
                      : 'bg-slate-50 border-slate-100 text-slate-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'
                  }`}
                >
                  دائن (مدفوعات ومستردات)
                </button>
              </div>

              {/* Expected Entry Number */}
              <div className="bg-blue-500/5 dark:bg-blue-500/10 border border-blue-200/40 dark:border-blue-900/40 rounded-xl px-3 py-2 text-xs flex justify-between items-center font-bold">
                <span className="text-slate-500 dark:text-slate-400">رقم القيد المتوقع (الرقم):</span>
                <span className="text-blue-600 dark:text-blue-400 font-mono text-xs">#{ledgerTransactions.length + 1}</span>
              </div>

              {/* Day & Date Fields */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block">رقم اليوم (اليوم) *</label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    required
                    value={txDayNumber}
                    onChange={(e) => setTxDayNumber(e.target.value !== '' ? Number(e.target.value) : '')}
                    placeholder="مثال: 5"
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono text-center"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block">التاريخ المعني *</label>
                  <input
                    id="tx_date_input"
                    type="date"
                    required
                    value={txDate}
                    onChange={(e) => setTxDate(e.target.value)}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-center font-mono"
                  />
                </div>
              </div>

              {/* Quantity, Unit Price and Extra Charges Fields */}
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">العدد (الكمية) *</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    value={txQuantity}
                    onChange={(e) => setTxQuantity(e.target.value !== '' ? Number(e.target.value) : '')}
                    placeholder="1"
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-xl px-3 py-3 text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono text-center"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">السعر المنفرد *</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    value={txUnitPrice}
                    onChange={(e) => setTxUnitPrice(e.target.value !== '' ? Number(e.target.value) : '')}
                    placeholder="0"
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-xl px-3 py-3 text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono text-center"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">الزيادة +</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={txExtraCharges}
                    onChange={(e) => setTxExtraCharges(e.target.value !== '' ? Number(e.target.value) : '')}
                    placeholder="0"
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-xl px-3 py-3 text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono text-center"
                  />
                </div>
              </div>

              {/* Automatic Total amount calculation display */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block">الإجمالي المالي التلقائي (العدد × السعر) *</label>
                <div className="flex gap-2">
                  <input
                    id="tx_amount_input"
                    type="number"
                    required
                    min="0"
                    step="any"
                    value={txAmount || ''}
                    onChange={(e) => setTxAmount(Number(e.target.value))}
                    placeholder="0.00"
                    className="flex-1 text-xs bg-blue-500/5 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/60 rounded-xl px-4 py-3 text-blue-600 dark:text-blue-400 font-extrabold focus:outline-hidden font-mono"
                    title="يتم احتسابه تلقائياً من المعادلة الحسابية: العدد * السعر"
                  />
                  <select
                    value={txCurrency}
                    onChange={(e) => setTxCurrency(e.target.value)}
                    className="w-32 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-xl px-2 py-3 text-slate-800 dark:text-slate-100 font-bold"
                  >
                    {SUPPORTED_CURRENCIES.map(c => (
                      <option key={c.code} value={c.code}>
                        {c.flag} {c.code}
                      </option>
                    ))}
                  </select>
                </div>
                {txAmount > 0 && txCurrency !== (selectedAcc.currency || 'YER') && (
                  <p className="text-[11px] text-blue-600 dark:text-blue-400 font-medium mt-1">
                    يعادل في حساب العميل ({selectedAcc.currency}): <strong>{db.convertCurrency(txAmount, txCurrency, selectedAcc.currency).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {getCurrencyInfo(selectedAcc.currency).symbolAr}</strong>
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block">البيان والشرح للتأصيل *</label>
                <textarea
                  id="tx_description_textarea"
                  required
                  value={txDescription}
                  onChange={(e) => setTxDescription(e.target.value)}
                  placeholder="مثال: فاتورة مبيعات بضائع نقدية طبقاً لأمر الصرف"
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500 h-20"
                />
              </div>

              {/* Alert note about instant transmission triggered message */}
              <div className="p-3.5 bg-emerald-500/5 border border-emerald-500/10 rounded-xl flex gap-2.5 items-start">
                <div className="p-1.5 bg-emerald-500/10 text-emerald-600 rounded-lg shrink-0">
                  <Bell size={16} />
                </div>
                <div className="space-y-0.5">
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-400 block">ميزة البث الفوري للمستند</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block leading-relaxed">
                    سيقوم النظام بإرسال بلاغ فوري تلقائي في الخلفية إلى {selectedAcc.phone} عن طريق البوابة النشطة لإعلام الحساب بالقيد.
                  </span>
                </div>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  id="submit_quick_tx"
                  type="submit"
                  className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold text-white cursor-pointer transition-colors ${selectedAcc.type === 'supplier' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-blue-600 hover:bg-blue-700'}`}
                >
                  ترحيل القيد المالي والتبليغ
                </button>
                <button
                  id="cancel_quick_tx"
                  type="button"
                  onClick={() => setShowTxModal(false)}
                  className="flex-1 py-3 px-4 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  إلغاء القيد
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditTxModal && editingTx && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 no-print" id="edit_tx_modal">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-xl space-y-6 text-right">
            <div className="flex justify-between items-center border-b pb-4 border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">تعديل قيد مالي في كشف الحساب</h3>
              <button onClick={() => { setShowEditTxModal(false); setEditingTx(null); }} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <Check size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEditTx} className="space-y-4 text-right">
              {/* Day & Date Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block">رقم اليوم (اليوم) *</label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={editTxDayNumber !== undefined ? editTxDayNumber : ''}
                    onChange={(e) => setEditTxDayNumber(e.target.value !== '' ? Number(e.target.value) : undefined)}
                    placeholder="مثال: 5"
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono text-center"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block">تاريخ القيد *</label>
                  <input
                    type="date"
                    required
                    value={editTxDate}
                    onChange={(e) => setEditTxDate(e.target.value)}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-center font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block">نوع الحركة *</label>
                <select
                  value={editTxType}
                  onChange={(e) => setEditTxType(e.target.value as 'debit' | 'credit')}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-bold"
                >
                  <option value="debit">مدين (سحب مالي / استحقاق لنا)</option>
                  <option value="credit">دائن (دفعة مالية / توريد منا)</option>
                </select>
              </div>

              {/* Quantity, Unit Price and Extra Charges Fields */}
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">العدد (الكمية) *</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={editTxQuantity !== undefined ? editTxQuantity : ''}
                    onChange={(e) => setEditTxQuantity(e.target.value !== '' ? Number(e.target.value) : undefined)}
                    placeholder="1"
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-xl px-3 py-3 text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono text-center"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">السعر المنفرد *</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={editTxUnitPrice !== undefined ? editTxUnitPrice : ''}
                    onChange={(e) => setEditTxUnitPrice(e.target.value !== '' ? Number(e.target.value) : undefined)}
                    placeholder="0"
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-xl px-3 py-3 text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono text-center"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">الزيادة +</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={editTxExtraCharges !== undefined ? editTxExtraCharges : ''}
                    onChange={(e) => setEditTxExtraCharges(e.target.value !== '' ? Number(e.target.value) : undefined)}
                    placeholder="0"
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-xl px-3 py-3 text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono text-center"
                  />
                </div>
              </div>

              {/* Automatic Total amount calculation display */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block">المبلغ الإجمالي *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="any"
                    value={editTxAmount || ''}
                    onChange={(e) => setEditTxAmount(Number(e.target.value))}
                    className="w-full text-xs bg-blue-500/5 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/60 rounded-xl px-4 py-3 text-blue-600 dark:text-blue-400 font-extrabold focus:outline-hidden font-mono text-center"
                    title="يتم احتسابه تلقائياً من المعادلة الحسابية: العدد * السعر"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block">العملة *</label>
                  <select
                    value={editTxCurrency}
                    onChange={(e) => setEditTxCurrency(e.target.value)}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-bold"
                  >
                    {SUPPORTED_CURRENCIES.map(c => (
                      <option key={c.code} value={c.code}>
                        {c.flag} {c.nameAr} ({c.symbolAr} - {c.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block">البيان والشرح *</label>
                <textarea
                  required
                  value={editTxDescription}
                  onChange={(e) => setEditTxDescription(e.target.value)}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500 h-20"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  حفظ التعديلات
                </button>
                <button
                  type="button"
                  onClick={() => { setShowEditTxModal(false); setEditingTx(null); }}
                  className="flex-1 py-3 px-4 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  إلغاء التعديل
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showImportModal && selectedAcc && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 no-print" id="import_data_modal">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl w-full max-w-3xl p-6 shadow-xl space-y-6 text-right max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-4 border-slate-100 dark:border-slate-800">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 text-right">استيراد كشف قيود مالية لحساب العميل</h3>
                <p className="text-[10px] text-slate-400 text-right">الحساب الهدف: {selectedAcc.name} ({selectedAcc.currency || 'YER'})</p>
              </div>
              <button
                onClick={() => { setShowImportModal(false); setParsedPreviewRows([]); setImportFile(null); setPdfTextData(''); }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                ✕
              </button>
            </div>

            {/* Selector Tab for Excel vs PDF */}
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl gap-2">
              <button
                type="button"
                onClick={() => { setImportType('excel'); setParsedPreviewRows([]); }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${importType === 'excel' ? 'bg-white dark:bg-slate-800 text-emerald-600' : 'text-slate-500 hover:text-slate-700'}`}
              >
                استيراد من إكسل (Excel / CSV)
              </button>
              <button
                type="button"
                onClick={() => { setImportType('pdf'); setParsedPreviewRows([]); }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${importType === 'pdf' ? 'bg-white dark:bg-slate-800 text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
              >
                استخراج من كشف PDF (نسخ ولصق)
              </button>
            </div>

            {importType === 'excel' ? (
              <div className="space-y-4">
                <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-8 hover:border-emerald-500 transition-colors text-center relative bg-slate-50/50 dark:bg-slate-800/30">
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleExcelUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="flex flex-col items-center gap-2">
                    <UploadCloud size={32} className="text-slate-400 dark:text-slate-500" />
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-200">اسحب ملف الإكسل هنا أو اضغط للتصفح</p>
                    <p className="text-[10px] text-slate-400">يدعم صيغ Excel (.xlsx, .xls) وصيغة CSV المجدولة</p>
                    {importFile && (
                      <span className="mt-2 text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/25 px-3 py-1 rounded-lg">
                        📂 ملف محمل: {importFile.name}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-right">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 block text-right">الصق نص كشف الحساب من ملف PDF الخاص بك هنا:</label>
                  <textarea
                    value={pdfTextData}
                    onChange={(e) => parsePdfText(e.target.value)}
                    placeholder={'مثال: الصق أسطر الجدول بالتنسيق التالي:\n2026-06-03  مبيعات أخشاب زان  15000  مدين\n2026-06-05  تسديد من الحساب  5000  دائن'}
                    className="w-full h-36 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-100 font-mono focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-right"
                  />
                  <p className="text-[10px] text-slate-400 leading-relaxed text-right">
                    * يقوم المصنف الذكي الملحق بتحليل النص المستخرج سطرًا بسطر واستخراج التواريخ والمبالغ وحالة الحركة وتفاصيل العملية تلقائيًا لتفادي الإدخال اليدوي المجهد!
                  </p>
                </div>
              </div>
            )}

            {/* Preview of rows to import */}
            {parsedPreviewRows.length > 0 && (
              <div className="space-y-4 border-t pt-4 border-slate-100 dark:border-slate-800 text-right">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">🔍 معاينة القيود المستخرجة قبل الاستيراد ({parsedPreviewRows.length} قيود):</span>
                </div>

                <div className="overflow-x-auto max-h-56 border border-slate-100 dark:border-slate-800 rounded-xl">
                  <table className="w-full text-right text-[11px]">
                    <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-bold border-b border-slate-100 dark:border-slate-800">
                      <tr>
                        <th className="px-3 py-2 text-right">التاريخ</th>
                        <th className="px-3 py-2 text-right">البيان</th>
                        <th className="px-3 py-2 text-center font-bold">النوع</th>
                        <th className="px-3 py-2 text-left font-bold">المبلغ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                      {parsedPreviewRows.map((row, i) => (
                        <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="px-3 py-2">{row.date}</td>
                          <td className="px-3 py-2 text-slate-800 dark:text-slate-200">{row.description}</td>
                          <td className="px-3 py-2 text-center text-[10px]">
                            <span className={`px-2 py-0.5 rounded-full font-bold ${row.type === 'debit' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'}`}>
                              {row.type === 'debit' ? 'مدين +' : 'دائن -'}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-left font-bold">{row.amount.toLocaleString()} {selectedAcc.currency || 'YER'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={handleSaveImportedRows}
                    className="flex-1 py-3 px-4 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Check size={16} />
                    <span>ترحيل وحفظ القيود المستخرجة المعتمدة ({parsedPreviewRows.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setParsedPreviewRows([]); setImportFile(null); setPdfTextData(''); }}
                    className="py-3 px-6 rounded-xl text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-colors cursor-pointer"
                  >
                    إعادة تصفير الاستيراد
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
    </div>
  );
}
