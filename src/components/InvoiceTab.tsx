import React, { useState, useMemo, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Database } from '../utils';
import { UserRole } from '../types';
import {
  Printer,
  Plus,
  Trash2,
  FileText,
  Settings,
  Building2,
  Phone,
  MapPin,
  FileCheck,
  Upload,
  File,
  Download,
  Eye,
  Archive,
  ShoppingCart,
  DollarSign,
  AlertCircle,
  X,
  Search,
  CheckCircle,
  Clock,
  User,
  Paperclip,
  TrendingDown,
  TrendingUp,
  Image as ImageIcon,
  Palette
} from 'lucide-react';

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  day?: string;
  dateString?: string;
  additions?: number;
}

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

interface InvoiceTabProps {
  db: Database;
  onDatabaseUpdate: () => void;
  role: UserRole;
}

export default function InvoiceTab({ db, onDatabaseUpdate, role }: InvoiceTabProps) {
  // Navigation sub-tabs inside invoices page
  const [activeSubTab, setActiveSubTab] = useState<'create' | 'archive'>('create');

  // Invoice configuration
  const [invoiceType, setInvoiceType] = useState<'sale' | 'purchase'>('sale');
  const [customerName, setCustomerName] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [invoiceNumber, setInvoiceNumber] = useState(`INV-${Math.floor(1000 + Math.random() * 9000)}`);

  const [items, setItems] = useState<InvoiceItem[]>([
    {
      id: '1',
      description: '',
      quantity: 1,
      unitPrice: 0,
      day: getArabicDayName(new Date().toISOString().split('T')[0]),
      dateString: getFormattedMonthDay(new Date().toISOString().split('T')[0]),
      additions: 0
    }
  ]);

  // File Upload states (اضف الملف للفواتير)
  const [attachmentName, setAttachmentName] = useState('');
  const [attachmentData, setAttachmentData] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Print settings state
  const [showPrintSettings, setShowPrintSettings] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [printCompanyName, setPrintCompanyName] = useState(db.printCompanyName || '');
  const [printPhone, setPrintPhone] = useState(db.printPhone || '');
  const [printAddress, setPrintAddress] = useState(db.printAddress || '');
  const [printTaxNumber, setPrintTaxNumber] = useState(db.printTaxNumber || '');
  const [printThemeColor, setPrintThemeColor] = useState(db.printThemeColor || 'indigo');
  const [invoiceNotes, setInvoiceNotes] = useState('');

  const activeTheme = themeColors[printThemeColor as keyof typeof themeColors || 'emerald'];

  // Archive & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [archiveFilterType, setArchiveFilterType] = useState<'all' | 'sale' | 'purchase'>('all');
  const [selectedPreviewInvoice, setSelectedPreviewInvoice] = useState<any | null>(null);

  // Handle invoice type change (Sale vs Purchase)
  const handleInvoiceTypeChange = (type: 'sale' | 'purchase') => {
    setInvoiceType(type);
    setCustomerName('');
    setSelectedAccountId('');
    // Auto generate proper prefix
    const prefix = type === 'sale' ? 'INV' : 'PUR';
    setInvoiceNumber(`${prefix}-${Math.floor(1000 + Math.random() * 9000)}`);
  };

  // Filter accounts based on selected type
  const filteredAccounts = useMemo(() => {
    return db.accounts.filter(a => invoiceType === 'sale' ? a.type === 'buyer' : a.type === 'supplier');
  }, [db.accounts, invoiceType]);

  // File loading helper (Base64)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    processFile(file);
  };

  const processFile = (file: File | undefined) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("⚠️ حجم الملف كبير جداً! الحد الأقصى المسموح به هو 5 ميجابايت.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      setAttachmentData(event.target?.result as string);
      setAttachmentName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    processFile(file);
  };

  const removeAttachment = () => {
    setAttachmentName('');
    setAttachmentData('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const savePrintSettings = () => {
    db.printCompanyName = printCompanyName;
    db.printPhone = printPhone;
    db.printAddress = printAddress;
    db.printTaxNumber = printTaxNumber;
    db.printThemeColor = printThemeColor;
    db.save();
    onDatabaseUpdate();
    setShowPrintSettings(false);
  };

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        id: Math.random().toString(),
        description: '',
        quantity: 1,
        unitPrice: 0,
        day: getArabicDayName(invoiceDate),
        dateString: getFormattedMonthDay(invoiceDate),
        additions: 0
      }
    ]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const handleItemChange = (id: string, field: keyof InvoiceItem, value: any) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const totals = useMemo(() => {
    const totalCount = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
    const totalAdditions = items.reduce((sum, item) => sum + (Number(item.additions) || 0), 0);
    const total = items.reduce((sum, item) => sum + ((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0)) + (Number(item.additions) || 0), 0);
    return { total, totalCount, totalAdditions };
  }, [items]);

  const handleSaveInvoice = () => {
    if (!customerName.trim()) {
      alert('⚠️ الرجاء إدخال اسم العميل أو المورد أولاً.');
      return;
    }

    // Filter out completely blank or unedited rows to prevent calculation and printing errors
    const filteredItems = items.filter(item => {
      const hasDesc = item.description && item.description.trim() !== '';
      const hasQty = (Number(item.quantity) || 0) > 0;
      const hasPrice = (Number(item.unitPrice) || 0) > 0;
      const hasAdditions = (Number(item.additions) || 0) > 0;
      return hasDesc || hasQty || hasPrice || hasAdditions;
    });

    if (filteredItems.length === 0) {
      alert('⚠️ الرجاء إضافة صنف واحد على الأقل وتعبئة تفاصيله.');
      return;
    }

    if (filteredItems.some(item => !item.description || !item.description.trim())) {
      alert('⚠️ الرجاء ملء تفاصيل وصنف البضاعة لكل سطر قمت بتعبئته.');
      return;
    }

    if (filteredItems.some(item => (Number(item.quantity) || 0) <= 0)) {
      alert('⚠️ الرجاء التأكد من صحة الكميات والأسعار (يجب أن تكون الكمية أكبر من الصفر لكل صنف).');
      return;
    }

    const finalTotal = filteredItems.reduce((sum, item) => sum + ((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0)) + (Number(item.additions) || 0), 0);

    // 1. Save Invoice Record
    const newInvoice = db.addInvoice({
      invoiceNumber,
      date: invoiceDate,
      accountId: selectedAccountId || '',
      notes: invoiceNotes,
      items: filteredItems,
      total: finalTotal,
      currency: db.primaryCurrency,
      attachmentName: attachmentName || undefined,
      attachmentData: attachmentData || undefined,
      type: invoiceType
    });

    // 2. Create Ledger Transaction if account is selected
    if (selectedAccountId) {
      const isPurchase = invoiceType === 'purchase';
      db.addTransaction({
        accountId: selectedAccountId,
        date: invoiceDate,
        description: isPurchase ? `فاتورة مشتريات رقم ${invoiceNumber}` : `فاتورة مبيعات رقم ${invoiceNumber}`,
        type: isPurchase ? 'credit' : 'debit', // Credit for supplier invoices, Debit for customer sales
        amount: finalTotal,
        currency: db.primaryCurrency
      }, true);
    }

    onDatabaseUpdate();
    alert(`✅ تم حفظ الفاتورة بنجاح!\nنوع الفاتورة: ${invoiceType === 'sale' ? 'مبيعات عميل' : 'مشتريات مورد'}` +
      (selectedAccountId ? ' وتم ترحيلها وقيدها في حساب العميل/المورد بنجاح.' : ' (فاتورة نقدية عامة)'));

    // Reset Form
    setCustomerName('');
    setSelectedAccountId('');
    setInvoiceNotes('');
    setAttachmentName('');
    setAttachmentData('');
    setItems([{
      id: '1',
      description: '',
      quantity: 1,
      unitPrice: 0,
      day: getArabicDayName(invoiceDate),
      dateString: getFormattedMonthDay(invoiceDate),
      additions: 0
    }]);

    const prefix = invoiceType === 'sale' ? 'INV' : 'PUR';
    setInvoiceNumber(`${prefix}-${Math.floor(1000 + Math.random() * 9000)}`);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    if (items.length === 0) {
      alert('لا توجد عناصر في الفاتورة لتصديرها');
      return;
    }

    const data = items.map((item, index) => ({
      'م': index + 1,
      'البيان': item.description,
      'الكمية': item.quantity,
      'سعر الوحدة': item.unitPrice,
      'المجموع': (item.quantity * item.unitPrice) + (item.additions || 0)
    }));

    // Add totals row
    data.push({
      'م': 'الإجمالي الكلي',
      'البيان': '',
      'الكمية': '',
      'سعر الوحدة': '',
      'المجموع': totals.total
    } as any);

    const ws = XLSX.utils.json_to_sheet(data);
    const wscols = [
      {wch: 5},   // م
      {wch: 40},  // البيان
      {wch: 10},  // الكمية
      {wch: 15},  // السعر
      {wch: 15},  // المجموع
    ];
    ws['!cols'] = wscols;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "تفاصيل الفاتورة");
    XLSX.writeFile(wb, `فاتورة_${invoiceNumber}_${customerName}.xlsx`);
  };

  // Lookup helper for Account names
  const getAccountName = (accountId: string, backupName: string = 'نقدي عام') => {
    const acc = db.accounts.find(a => a.id === accountId);
    return acc ? acc.name : backupName;
  };

  // Filtered list of invoices in archive
  const filteredInvoices = useMemo(() => {
    return db.invoices.filter(inv => {
      const accName = getAccountName(inv.accountId).toLowerCase();
      const num = inv.invoiceNumber.toLowerCase();
      const query = searchQuery.toLowerCase();
      const matchesSearch = accName.includes(query) || num.includes(query) || (inv.notes && inv.notes.toLowerCase().includes(query));

      const invType = inv.type || 'sale'; // Default legacy to sale
      const matchesType = archiveFilterType === 'all' || invType === archiveFilterType;

      return matchesSearch && matchesType;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [db.invoices, searchQuery, archiveFilterType, db.accounts]);

  const handleOpenPreview = (invoice: any) => {
    setSelectedPreviewInvoice(invoice);
  };

  const handleDeleteInvoice = (id: string) => {
    if (confirm('هل أنت متأكد من رغبتك في حذف هذه الفاتورة؟ سيتم إلغاء القيود المالية المرتبطة بها في الدفتر.')) {
      db.deleteInvoice(id);
      onDatabaseUpdate();
      alert('تم حذف الفاتورة ونقلها للمحذوفات بنجاح.');
    }
  };

  return (
    <div className="space-y-6" id="invoice_main_container">

      {/* Sub-Tabs Selector - No Print */}
      <div className={`flex items-center justify-between bg-white dark:bg-slate-900 p-2.5 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-xs print:hidden`}>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveSubTab('create')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all duration-200 cursor-pointer ${
              activeSubTab === 'create'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Plus size={15} />
            إنشاء فاتورة جديدة
          </button>
          <button
            onClick={() => setActiveSubTab('archive')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all duration-200 cursor-pointer ${
              activeSubTab === 'archive'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Archive size={15} />
            أرشيف الفواتير والمرفقات
            {db.invoices.length > 0 && (
              <span className="bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-mono text-[10px] px-1.5 py-0.5 rounded-full">
                {db.invoices.length}
              </span>
            )}
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 font-semibold px-2">
          <FileText size={14} className="text-indigo-500" />
          <span>إدارة متكاملة للفواتير والموردين والملفات</span>
        </div>
      </div>

      {activeSubTab === 'create' ? (
        <div className={showPrintPreview ? 'no-print' : ''}>
          {/* Header Controls - No Print */}
          <div className="no-print bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <FileText className="text-indigo-600" />
                  تجهيز وتدوين فاتورة جديدة
                </h2>
                <p className="text-sm text-slate-500 mt-1">تعبئة البيانات، ربط الحسابات المبيعات أو المشتريات، وإرفاق المستندات المصورة</p>
              </div>
              <div className="flex flex-wrap gap-2.5 w-full md:w-auto">
                <button
                  onClick={() => setShowPrintSettings(!showPrintSettings)}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                >
                  <Settings size={15} />
                  إعدادات الترويسة
                </button>
                <button
                  onClick={handleSaveInvoice}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition-colors shadow-md cursor-pointer"
                >
                  حفظ وتوثيق الفاتورة
                </button>
                <button
                  onClick={() => setShowPrintPreview(true)}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-xs transition-colors shadow-md cursor-pointer"
                >
                  <Eye size={15} />
                  معاينة الطباعة
                </button>
                <button
                  onClick={handlePrint}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs transition-colors shadow-md cursor-pointer"
                >
                  <Printer size={15} />
                  طباعة مباشرة
                </button>
                <button
                  onClick={handleExportExcel}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition-colors shadow-md cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                  تصدير Excel
                </button>
              </div>
            </div>

            {/* Print Settings Drawer */}
            {showPrintSettings && (
              <div className="mt-6 p-5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4 animate-in fade-in slide-in-from-top-2">
                <h3 className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2 text-xs">
                  <Printer size={15} className="text-indigo-500" />
                  إعدادات ترويسة الطباعة
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500 block">اسم الشركة / المؤسسة</label>
                    <div className="relative">
                      <Building2 size={14} className="absolute right-3 top-2.5 text-slate-400" />
                      <input
                        type="text"
                        value={printCompanyName}
                        onChange={(e) => setPrintCompanyName(e.target.value)}
                        className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg pr-9 pl-3 py-2 text-slate-800 dark:text-slate-100 font-bold outline-hidden"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500 block">رقم الهاتف</label>
                    <div className="relative">
                      <Phone size={14} className="absolute right-3 top-2.5 text-slate-400" />
                      <input
                        type="text"
                        value={printPhone}
                        onChange={(e) => setPrintPhone(e.target.value)}
                        className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg pr-9 pl-3 py-2 text-slate-800 dark:text-slate-100 font-bold outline-hidden"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500 block">العنوان</label>
                    <div className="relative">
                      <MapPin size={14} className="absolute right-3 top-2.5 text-slate-400" />
                      <input
                        type="text"
                        value={printAddress}
                        onChange={(e) => setPrintAddress(e.target.value)}
                        className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg pr-9 pl-3 py-2 text-slate-800 dark:text-slate-100 font-bold outline-hidden"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500 block">الرقم الضريبي / الترخيص</label>
                    <div className="relative">
                      <FileCheck size={14} className="absolute right-3 top-2.5 text-slate-400" />
                      <input
                        type="text"
                        value={printTaxNumber}
                        onChange={(e) => setPrintTaxNumber(e.target.value)}
                        className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg pr-9 pl-3 py-2 text-slate-800 dark:text-slate-100 font-bold outline-hidden"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500 block">لون السند المطبوع</label>
                    <div className="relative">
                      <Palette size={14} className="absolute right-3 top-2.5 text-slate-400" />
                      <select
                        value={printThemeColor}
                        onChange={(e) => setPrintThemeColor(e.target.value as any)}
                        className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg pr-9 pl-3 py-2 text-slate-800 dark:text-slate-100 font-bold outline-hidden appearance-none cursor-pointer"
                      >
                        <option value="emerald">أخضر زمردي (Emerald)</option>
                        <option value="indigo">أزرق نيلي (Indigo)</option>
                        <option value="blue">أزرق ملكي (Blue)</option>
                        <option value="slate">رمادي كلاسيك (Slate)</option>
                        <option value="red">أحمر قاني (Red)</option>
                        <option value="amber">أصفر كهرماني (Amber)</option>
                        <option value="teal">أخضر فيروزي (Teal)</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <button
                    onClick={savePrintSettings}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs transition-colors cursor-pointer"
                  >
                    حفظ إعدادات الطباعة
                  </button>
                </div>
              </div>
            )}

            {/* Invoice Input Form */}
            <div className="mt-8 space-y-6 print:hidden">

              {/* Type Switcher for Invoice (الموردين والعملاء) */}
              <div className="bg-slate-100/60 dark:bg-slate-800/60 p-1 rounded-2xl flex max-w-md gap-1">
                <button
                  type="button"
                  onClick={() => handleInvoiceTypeChange('sale')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    invoiceType === 'sale'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <TrendingUp size={14} />
                  فاتورة مبيعات (للعملاء)
                </button>
                <button
                  type="button"
                  onClick={() => handleInvoiceTypeChange('purchase')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    invoiceType === 'purchase'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <TrendingDown size={14} />
                  فاتورة مشتريات (للموردين)
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Dynamically Filtered Account Select list depending on Invoice Type */}
                <div className="space-y-1.5 relative">
                  <label className="text-xs font-black text-slate-700 dark:text-slate-300">
                    {invoiceType === 'sale' ? 'اسم العميل المشتري' : 'اسم المورد البائع'}
                  </label>
                  <div className="relative">
                    <User size={14} className="absolute right-3.5 top-3.5 text-slate-400" />
                    <input
                      type="text"
                      list="dynamic-invoice-accounts-list"
                      value={customerName}
                      onChange={(e) => {
                        setCustomerName(e.target.value);
                        const matchedAcc = db.accounts.find(a => a.name === e.target.value);
                        setSelectedAccountId(matchedAcc ? matchedAcc.id : '');
                      }}
                      placeholder={invoiceType === 'sale' ? "اختر العميل المشتري..." : "اختر المورد..."}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-xl pr-10 pl-4 py-2.5 text-xs text-slate-800 dark:text-slate-100 font-bold focus:ring-2 focus:ring-indigo-500/20 outline-hidden"
                    />
                  </div>
                  <datalist id="dynamic-invoice-accounts-list">
                    {filteredAccounts.map(acc => (
                      <option key={acc.id} value={acc.name} />
                    ))}
                  </datalist>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-700 dark:text-slate-300">تاريخ المعاملة</label>
                  <input
                    type="date"
                    value={invoiceDate}
                    onChange={(e) => {
                      const newDate = e.target.value;
                      setInvoiceDate(newDate);
                      setItems(prev => {
                        if (prev.length === 1 && !prev[0].description) {
                          return [{
                            ...prev[0],
                            day: getArabicDayName(newDate),
                            dateString: getFormattedMonthDay(newDate)
                          }];
                        }
                        return prev;
                      });
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-xl px-4 py-2.5 text-xs text-slate-800 dark:text-slate-100 font-bold focus:ring-2 focus:ring-indigo-500/20 outline-hidden"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-700 dark:text-slate-300">رقم الفاتورة المرجعي</label>
                  <input
                    type="text"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-xl px-4 py-2.5 text-xs text-slate-800 dark:text-slate-100 font-bold focus:ring-2 focus:ring-indigo-500/20 outline-hidden"
                  />
                </div>
              </div>

              {/* File Attachment Upload area (اضف الملف للفواتير) */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Paperclip size={13} className="text-indigo-500" />
                  إرفاق ملف أو مستند مصوّر مع الفاتورة (أوراق القات، إيصالات، عقود)
                </label>

                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-2xl p-5 flex flex-col items-center justify-center transition-all ${
                    isDragging
                      ? 'border-indigo-500 bg-indigo-500/5'
                      : 'border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-800/10'
                  }`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*,application/pdf"
                    className="hidden"
                    id="invoice-file-upload-input"
                  />

                  {attachmentData ? (
                    <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-100/80 dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
                      <div className="flex items-center gap-3">
                        {attachmentData.startsWith('data:image/') ? (
                          <div className="w-16 h-16 rounded-lg overflow-hidden border border-slate-300 bg-white flex items-center justify-center shrink-0">
                            <img src={attachmentData} alt="Attached Preview" className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-16 h-16 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center shrink-0">
                            <File size={24} />
                          </div>
                        )}
                        <div className="text-right">
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-1">{attachmentName}</p>
                          <p className="text-[10px] text-slate-400 mt-1">تم التحميل والربط بنجاح (المرفق نشط)</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const newWindow = window.open();
                            if (newWindow) {
                              newWindow.document.write(`<img src="${attachmentData}" style="max-width:100%; height:auto;" />`);
                            }
                          }}
                          className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                        >
                          عرض بالحجم الكامل
                        </button>
                        <button
                          type="button"
                          onClick={removeAttachment}
                          className="p-1.5 text-red-500 hover:text-red-700 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-all cursor-pointer"
                          title="حذف المرفق"
                        >
                          <X size={15} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center space-y-2 py-3 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                      <Upload className="mx-auto text-slate-400 dark:text-slate-600" size={32} />
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">قم بسحب وإفلات الملف هنا، أو انقر للتصفح</p>
                      <p className="text-[10px] text-slate-400">يدعم الصور (JPG، PNG) والمستندات بحد أقصى 5 ميجابايت</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 dark:text-slate-300">ملاحظات الفاتورة أو شروط السداد (تظهر في تذييل الطباعة)</label>
                <textarea
                  value={invoiceNotes}
                  onChange={(e) => setInvoiceNotes(e.target.value)}
                  placeholder="مثال: يرجى سداد المبلغ خلال 3 أيام، أو تدوين أرقام ربطات القات وخصائص الطبخة..."
                  rows={2}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-xl px-4 py-2.5 text-xs text-slate-800 dark:text-slate-100 font-bold focus:ring-2 focus:ring-indigo-500/20 outline-hidden"
                />
              </div>

              {/* Items Table */}
              <div className="border border-slate-200 dark:border-slate-700/60 rounded-2xl overflow-hidden overflow-x-auto">
                <table className="w-full text-right border-collapse min-w-[800px]">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 text-xs font-black border-b border-slate-100 dark:border-slate-800">
                    <tr>
                      <th className="p-3.5 w-24 text-center">اليوم</th>
                      <th className="p-3.5 w-24 text-center">التاريخ</th>
                      <th className="p-3.5">الصنف / تفاصيل البضاعة</th>
                      <th className="p-3.5 w-24 text-center">العدد (الكمية)</th>
                      <th className="p-3.5 w-28 text-center">السعر</th>
                      <th className="p-3.5 w-28 text-center">الزيادات</th>
                      <th className="p-3.5 w-32 text-left font-sans">الإجمالي الفرعي ({db.primaryCurrency})</th>
                      <th className="p-3.5 w-12 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/40 dark:divide-slate-800">
                    {items.map((item) => (
                      <tr key={item.id} className="bg-white dark:bg-slate-900 hover:bg-slate-50/40 dark:hover:bg-slate-800/10">
                        {/* Day */}
                        <td className="p-2">
                          <input
                            type="text"
                            placeholder="السبت"
                            value={item.day || ''}
                            onChange={(e) => handleItemChange(item.id, 'day', e.target.value)}
                            className="w-full text-center bg-transparent border-0 focus:ring-0 outline-hidden px-1 py-1 text-xs font-bold text-slate-800 dark:text-slate-100"
                          />
                        </td>
                        {/* Date */}
                        <td className="p-2">
                          <input
                            type="text"
                            placeholder="4/15"
                            value={item.dateString || ''}
                            onChange={(e) => handleItemChange(item.id, 'dateString', e.target.value)}
                            className="w-full text-center bg-transparent border-0 focus:ring-0 outline-hidden px-1 py-1 text-xs font-bold text-slate-800 dark:text-slate-100"
                          />
                        </td>
                        {/* Description */}
                        <td className="p-2">
                          <datalist id="qat_invoice_item_names">
                            <option value="شوالة قات بلوط قطوف" />
                            <option value="علاقة قات بلوط سوبر" />
                            <option value="ربطة قات لوزي" />
                            <option value="سلة قات نقفة جودة عالية" />
                            <option value="حزمة قات ارحبي" />
                            <option value="كرتون لوز مصفى" />
                          </datalist>
                          <input
                            type="text"
                            list="qat_invoice_item_names"
                            value={item.description}
                            onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                            placeholder="اسم صنف القات أو البضاعة المشتراة/المبيعة"
                            className="w-full bg-transparent border-0 focus:ring-0 outline-hidden px-2.5 py-1 text-xs text-slate-800 dark:text-slate-100 font-bold"
                          />
                        </td>
                        {/* Quantity */}
                        <td className="p-2">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={item.quantity || ''}
                            onChange={(e) => handleItemChange(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                            className="w-full text-center bg-transparent border-0 focus:ring-0 outline-hidden px-1 py-1 text-xs font-mono font-bold text-slate-800 dark:text-slate-100"
                          />
                        </td>
                        {/* Unit Price */}
                        <td className="p-2">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={item.unitPrice || ''}
                            onChange={(e) => handleItemChange(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                            className="w-full text-center bg-transparent border-0 focus:ring-0 outline-hidden px-1 py-1 text-xs font-mono font-bold text-slate-800 dark:text-slate-100"
                          />
                        </td>
                        {/* Additions */}
                        <td className="p-2">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={item.additions || ''}
                            onChange={(e) => handleItemChange(item.id, 'additions', parseFloat(e.target.value) || 0)}
                            className="w-full text-center bg-transparent border-0 focus:ring-0 outline-hidden px-1 py-1 text-xs font-mono font-bold text-slate-800 dark:text-slate-100"
                          />
                        </td>
                        {/* Row Subtotal */}
                        <td className="p-2 text-left font-bold text-slate-700 dark:text-slate-200 font-mono text-xs pl-4">
                          {(((item.quantity || 0) * (item.unitPrice || 0)) + (item.additions || 0)).toLocaleString('en-US', {minimumFractionDigits: 1})}
                        </td>
                        {/* Remove Action */}
                        <td className="p-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.id)}
                            disabled={items.length <= 1}
                            className="text-slate-400 hover:text-red-600 dark:hover:text-red-500 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 cursor-pointer"
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="p-4 bg-slate-50 dark:bg-slate-800/30 flex flex-col sm:flex-row gap-4 justify-between items-center border-t border-slate-200/40 dark:border-slate-800">
                  <button
                    onClick={handleAddItem}
                    className="flex items-center gap-2 px-4 py-2 text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/40 rounded-xl text-xs font-black transition-colors cursor-pointer"
                  >
                    <Plus size={14} />
                    إضافة سطر جديد (يوم/معاملة)
                  </button>
                  <div className="flex flex-wrap items-center gap-4 text-xs font-black text-slate-800 dark:text-slate-100">
                    <div>
                      العدد الإجمالي: <span className="font-mono text-indigo-600 dark:text-indigo-400 text-sm">{totals.totalCount.toLocaleString('en-US')}</span>
                    </div>
                    {totals.totalAdditions > 0 && (
                      <div>
                        إجمالي الزيادات: <span className="font-mono text-amber-600 dark:text-amber-400 text-sm">{totals.totalAdditions.toLocaleString('en-US', {minimumFractionDigits: 1})}</span>
                      </div>
                    )}
                    <div className="border-r border-slate-200 dark:border-slate-700 h-5 hidden sm:block"></div>
                    <div>
                      إجمالي الفاتورة: <span className="font-mono text-emerald-600 dark:text-emerald-400 text-base">
                        {totals.total.toLocaleString('en-US', {minimumFractionDigits: 1})} {db.primaryCurrency}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Printable Invoice Area (Hidden on screen, visible on print) */}
          <div className="hidden print-only bg-white p-6 font-sans relative text-slate-900" style={{ direction: 'rtl', minHeight: '297mm' }}>
            {/* Elegant Double Border to match paper ledger style */}
            <div className={`border-4 border-double ${activeTheme.borderDouble} p-6 h-full flex flex-col justify-between`}>

              <div>
                {/* Traditional Invoice Header block */}
                <div className={`border-b-2 ${activeTheme.borderLight} pb-4 mb-6 flex justify-between items-center`}>
                  <div className="text-right space-y-1 w-1/3">
                    <p className="text-xs font-bold text-slate-700">تلفون: <span className="font-mono text-xs">{printPhone || '777xxxxxx'}</span></p>
                    <p className="text-xs font-bold text-slate-700">العنوان: <span className="text-xs">{printAddress || 'اليمن - صنعاء / عمران'}</span></p>
                    {printTaxNumber && <p className="text-[10px] text-slate-400 font-bold">الرقم الضريبي: <span className="font-mono">{printTaxNumber}</span></p>}
                  </div>

                  <div className="flex flex-col items-center justify-center text-center w-1/3">
                    <QatLogo colorScheme={printThemeColor as any} customLogoUrl={db.printCompanyLogo} />
                    <h1 className={`text-xl font-black ${activeTheme.textDark} tracking-wide mt-1.5`}>
                      {printCompanyName || 'محلات أبو أنس لتجارة وتسويق القات'}
                    </h1>
                    <span className="text-[10px] text-slate-500 font-black tracking-widest mt-0.5">
                      تصدير - تسويق - تجارة عامة
                    </span>
                  </div>

                  <div className="text-left space-y-1 w-1/3 flex flex-col items-end">
                    <span className={`px-4 py-1 text-sm font-black rounded-lg ${invoiceType === 'sale' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-rose-100 text-rose-800 border border-rose-200'}`}>
                      {invoiceType === 'sale' ? 'فاتورة مبيعات' : 'فاتورة مشتريات'}
                    </span>
                    <p className="text-xs font-bold text-slate-700 mt-2">رقم الفاتورة: <span className="font-mono text-sm text-slate-900">{invoiceNumber}</span></p>
                    <p className="text-xs font-bold text-slate-700">التاريخ الكلي: <span className="font-mono text-xs text-slate-900">{invoiceDate}</span></p>
                  </div>
                </div>

                {/* Client / Supplier details in physical ledger box */}
                <div className={`grid grid-cols-2 gap-4 mb-6 border ${activeTheme.borderLight} rounded-xl p-4 ${activeTheme.bgLight}`}>
                  <div>
                    <span className="text-xs text-slate-500 block font-bold">مطلوب من السيد / الأخ:</span>
                    <span className={`text-base font-black ${activeTheme.textDark}`}>{customerName || 'زبون نقدي عام'}</span>
                  </div>
                  <div className="text-left self-center">
                    <span className="text-xs text-slate-500 block font-bold">العملة المعتمدة:</span>
                    <span className="text-sm font-bold text-slate-800">{db.primaryCurrency === 'YER' ? 'ريال يمني' : db.primaryCurrency === 'SAR' ? 'ريال سعودي' : db.primaryCurrency === 'USD' ? 'دولار أمريكي' : db.primaryCurrency}</span>
                  </div>
                </div>

                {/* Ledger Items Table - Matching the photo columns */}
                <table className={`w-full text-right border-collapse border-2 ${activeTheme.borderDouble} text-xs`}>
                  <thead>
                    <tr className={`${activeTheme.headerBg} font-black text-center border-b-2 ${activeTheme.borderDouble}`}>
                      <th className="p-2.5 border-l border-white/20 w-16 text-center">اليوم</th>
                      <th className="p-2.5 border-l border-white/20 w-16 text-center">التاريخ</th>
                      <th className="p-2.5 border-l border-white/20 text-right">تفاصيل البضاعة والقات</th>
                      <th className="p-2.5 border-l border-white/20 w-16 text-center">العدد</th>
                      <th className="p-2.5 border-l border-white/20 w-20 text-center">السعر</th>
                      <th className="p-2.5 border-l border-white/20 w-20 text-center">الزيادات</th>
                      <th className="p-2.5 w-24 text-left">الإجمالي الفرعي</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => (
                      <tr key={item.id} className={`border-b ${activeTheme.borderMuted} even:bg-slate-50/50 hover:bg-slate-100/30`}>
                        {/* Day */}
                        <td className={`p-2.5 border-l ${activeTheme.borderMuted} text-center font-bold text-slate-700`}>
                          {item.day || getArabicDayName(invoiceDate) || '—'}
                        </td>
                        {/* Date */}
                        <td className={`p-2.5 border-l ${activeTheme.borderMuted} text-center font-bold text-slate-500`}>
                          {item.dateString || getFormattedMonthDay(invoiceDate) || '—'}
                        </td>
                        {/* Description */}
                        <td className={`p-2.5 border-l ${activeTheme.borderMuted} text-right font-black text-slate-800`}>
                          {item.description || '—'}
                        </td>
                        {/* Quantity */}
                        <td className={`p-2.5 border-l ${activeTheme.borderMuted} text-center font-mono font-bold text-slate-800`}>
                          {item.quantity || 0}
                        </td>
                        {/* Unit Price */}
                        <td className={`p-2.5 border-l ${activeTheme.borderMuted} text-center font-mono font-bold text-slate-800`}>
                          {(item.unitPrice || 0).toLocaleString('en-US', { minimumFractionDigits: 1 })}
                        </td>
                        {/* Additions */}
                        <td className={`p-2.5 border-l ${activeTheme.borderMuted} text-center font-mono font-bold text-slate-800`}>
                          {(item.additions || 0).toLocaleString('en-US', { minimumFractionDigits: 1 })}
                        </td>
                        {/* Subtotal */}
                        <td className="p-2.5 text-left font-mono font-black text-slate-900">
                          {(((item.quantity || 0) * (item.unitPrice || 0)) + (item.additions || 0)).toLocaleString('en-US', { minimumFractionDigits: 1 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Ledger Totals and Statistics Summary */}
                <div className="grid grid-cols-2 gap-4 mt-5 items-start">
                  {/* Left Column (Calculations) */}
                  <div className={`space-y-1.5 border ${activeTheme.borderLight} rounded-xl p-3.5 ${activeTheme.bgLight} text-xs font-bold`}>
                    <div className="flex justify-between">
                      <span className="text-slate-600">إجمالي كمية السطور (العدد):</span>
                      <span className="font-mono text-slate-900">{totals.totalCount}</span>
                    </div>
                    {totals.totalAdditions > 0 && (
                      <div className="flex justify-between">
                        <span className="text-slate-600">إجمالي الزيادات والعمولات:</span>
                        <span className="font-mono text-amber-700">{totals.totalAdditions.toLocaleString('en-US', { minimumFractionDigits: 1 })} {db.primaryCurrency}</span>
                      </div>
                    )}
                    <div className={`border-t ${activeTheme.borderLight} pt-2 mt-1 flex justify-between text-sm font-black`}>
                      <span className={activeTheme.textDark}>الإجمالي الكلي النهائي:</span>
                      <span className={`font-mono text-base ${activeTheme.textDark}`}>{totals.total.toLocaleString('en-US', { minimumFractionDigits: 1 })} {db.primaryCurrency}</span>
                    </div>
                  </div>

                  {/* Right Column (Notes) */}
                  <div className="text-right h-full">
                    {invoiceNotes ? (
                      <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/50 text-[11px] h-full flex flex-col justify-between">
                        <div>
                          <h4 className="font-bold text-slate-800 border-b border-slate-300 pb-1 mb-1.5 flex items-center gap-1.5">📝 ملاحظات السند:</h4>
                          <p className="whitespace-pre-wrap text-slate-600 leading-relaxed font-medium">{invoiceNotes}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="border border-dashed border-slate-200 rounded-xl p-3.5 flex items-center justify-center h-full text-[10px] text-slate-400 min-h-[100px]">
                        لا توجد ملاحظات إضافية مسجلة على هذه الفاتورة.
                      </div>
                    )}
                  </div>
                </div>

                {/* Print Attachment if available */}
                {attachmentData && attachmentData.startsWith('data:image/') && (
                  <div className="mt-8 break-before-page border-t-2 border-dashed border-slate-200 pt-6">
                    <h4 className="font-bold text-slate-800 mb-2 text-xs">📂 صورة الملف المرفق بالفاتورة:</h4>
                    <div className="border border-slate-300 rounded-xl p-1 bg-white flex justify-center">
                      <img src={attachmentData} alt="Attached Document" className="max-h-[380px] object-contain" />
                    </div>
                  </div>
                )}
              </div>

              {/* Signature and Handshake Footer section */}
              <div className={`mt-12 pt-6 border-t ${activeTheme.footerBorder} flex justify-between items-center text-xs`}>
                <div className="text-right space-y-1">
                  <p className="text-slate-500 font-bold">المستخدم الحالي: <span className="text-slate-700 font-black">{role === 'Admin' ? 'المدير العام (مسؤول)' : role === 'Accountant' ? 'المحاسب المعتمد' : role === 'Salesperson' ? 'المندوب / الموزع' : 'المحاسب المالي'}</span></p>
                  <p className="text-slate-400 text-[10px]">استخرج آلياً بواسطة نظام أنس المحاسبي المطور للقات</p>
                </div>
                <div className="flex gap-16">
                  <div className="text-center w-28">
                    <p className="font-bold text-slate-800">توقيع المستلم</p>
                    <div className="border-b border-dashed border-slate-400 h-8 mt-2"></div>
                  </div>
                  <div className="text-center w-28">
                    <p className="font-bold text-slate-800">توقيع المحاسب</p>
                    <div className="border-b border-dashed border-slate-400 h-8 mt-2"></div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      ) : (
        /* Invoices Archive tab (أرشيف الفواتير والمرفقات) */
        <div className="no-print bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Archive className="text-indigo-600" />
                دفتر أرشيف الفواتير والملفات المرفقة
              </h2>
              <p className="text-xs text-slate-500">مراجعة الفواتير السابقة، استعراض المرفقات والصور، والطباعة وإدارة الديون</p>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex gap-1 text-[11px] font-black">
                <button
                  onClick={() => setArchiveFilterType('all')}
                  className={`px-3 py-1.5 rounded-lg cursor-pointer ${archiveFilterType === 'all' ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-xs' : 'text-slate-500'}`}
                >
                  الكل
                </button>
                <button
                  onClick={() => setArchiveFilterType('sale')}
                  className={`px-3 py-1.5 rounded-lg text-emerald-600 dark:text-emerald-400 cursor-pointer ${archiveFilterType === 'sale' ? 'bg-white dark:bg-slate-700 shadow-xs' : 'text-slate-500'}`}
                >
                  مبيعات
                </button>
                <button
                  onClick={() => setArchiveFilterType('purchase')}
                  className={`px-3 py-1.5 rounded-lg text-rose-600 dark:text-rose-400 cursor-pointer ${archiveFilterType === 'purchase' ? 'bg-white dark:bg-slate-700 shadow-xs' : 'text-slate-500'}`}
                >
                  مشتريات
                </button>
              </div>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="absolute right-3.5 top-3.5 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="ابحث برقم الفاتورة، اسم العميل، اسم المورد، أو الملاحظات..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-xl pr-10 pl-4 py-2.5 text-xs text-slate-800 dark:text-slate-100 font-bold focus:ring-2 focus:ring-indigo-500/20 outline-hidden"
            />
          </div>

          {/* Invoices List Table */}
          {filteredInvoices.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/20 rounded-2xl border border-slate-200/40 dark:border-slate-800 space-y-2">
              <AlertCircle size={32} className="mx-auto text-slate-400" />
              <p className="text-xs font-bold text-slate-600 dark:text-slate-400">لا توجد فواتير مطابقة لخيارات البحث الحالية</p>
              <p className="text-[10px] text-slate-400">ابدأ بإنشاء أول فاتورة وقيدها في السجل اليومي المالي</p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-200/40 dark:border-slate-800 rounded-2xl">
              <table className="w-full text-right border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 text-xs font-black border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="p-3.5 text-center">نوع الفاتورة</th>
                    <th className="p-3.5">الرقم المرجعي</th>
                    <th className="p-3.5">التاريخ</th>
                    <th className="p-3.5">الطرف المستفيد / العميل</th>
                    <th className="p-3.5 text-center">عدد الأصناف</th>
                    <th className="p-3.5 text-left font-sans">القيمة الكلية ({db.primaryCurrency})</th>
                    <th className="p-3.5 text-center">الملف المرفق</th>
                    <th className="p-3.5 text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/40 dark:divide-slate-800 text-xs">
                  {filteredInvoices.map((inv) => {
                    const hasAttachment = !!inv.attachmentData;
                    const isPurchase = inv.type === 'purchase';

                    return (
                      <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 bg-white dark:bg-slate-900 transition-all font-semibold text-slate-700 dark:text-slate-200">

                        {/* Type cell */}
                        <td className="p-3 text-center whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black ${
                            isPurchase
                              ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                              : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          }`}>
                            {isPurchase ? <TrendingDown size={10} /> : <TrendingUp size={10} />}
                            {isPurchase ? 'مشتريات مورد' : 'مبيعات عميل'}
                          </span>
                        </td>

                        {/* Ref Code */}
                        <td className="p-3 font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                          {inv.invoiceNumber}
                        </td>

                        {/* Date */}
                        <td className="p-3 text-slate-500 whitespace-nowrap">
                          {inv.date}
                        </td>

                        {/* Party */}
                        <td className="p-3 font-bold text-slate-800 dark:text-slate-100 max-w-[200px] truncate">
                          {getAccountName(inv.accountId, 'نقدي عام')}
                        </td>

                        {/* Items count */}
                        <td className="p-3 text-center font-mono text-slate-500">
                          {inv.items?.length || 0}
                        </td>

                        {/* Total Amount */}
                        <td className="p-3 text-left font-mono font-black text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                          {inv.total.toLocaleString('en-US', {minimumFractionDigits: 1})}
                        </td>

                        {/* Attachment status */}
                        <td className="p-3 text-center whitespace-nowrap">
                          {hasAttachment ? (
                            <span
                              onClick={() => handleOpenPreview(inv)}
                              className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-lg text-[10px] font-bold cursor-pointer transition-all border border-indigo-500/15"
                              title={inv.attachmentName}
                            >
                              <Paperclip size={10} />
                              <span>مرفق نشط</span>
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[10px]">-</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="p-3 text-center whitespace-nowrap space-x-1.5">
                          <button
                            onClick={() => handleOpenPreview(inv)}
                            className="p-1.5 text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-lg transition-all cursor-pointer inline-flex items-center justify-center"
                            title="معاينة وطباعة"
                          >
                            <Eye size={14} />
                          </button>

                          {role !== 'Salesperson' && (
                            <button
                              onClick={() => handleDeleteInvoice(inv.id)}
                              className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-all cursor-pointer inline-flex items-center justify-center"
                              title="حذف الفاتورة"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Complete Interactive Preview & Print Modal */}
      {selectedPreviewInvoice && (
        <div className="fixed inset-0 z-50 overflow-y-auto no-print flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden" dir="rtl">

            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-4 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="text-indigo-600" size={18} />
                <h3 className="font-bold text-slate-800 dark:text-slate-100">
                  تفاصيل الفاتورة الرسمية: <span className="font-mono text-indigo-600 dark:text-indigo-400">{selectedPreviewInvoice.invoiceNumber}</span>
                </h3>
              </div>
              <button
                onClick={() => setSelectedPreviewInvoice(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">

              {/* Type tag & Summary card */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/40 dark:border-slate-800">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400">تاريخ إصدار الفاتورة</p>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-100">{selectedPreviewInvoice.date}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400">
                    {selectedPreviewInvoice.type === 'purchase' ? 'المورد (الدائن)' : 'العميل (المدين)'}
                  </p>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                    {getAccountName(selectedPreviewInvoice.accountId, 'نقدي عام')}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400">إجمالي المبلغ المقيد</p>
                  <p className="text-sm font-black text-indigo-600 dark:text-indigo-400 font-mono">
                    {selectedPreviewInvoice.total.toLocaleString('en-US', {minimumFractionDigits: 1})} {selectedPreviewInvoice.currency || db.primaryCurrency}
                  </p>
                </div>
                <div>
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black ${
                    selectedPreviewInvoice.type === 'purchase'
                      ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                      : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  }`}>
                    {selectedPreviewInvoice.type === 'purchase' ? 'فاتورة مشتريات' : 'فاتورة مبيعات'}
                  </span>
                </div>
              </div>

              {/* Items details table */}
              <div className="border border-slate-200/40 dark:border-slate-800 rounded-2xl overflow-hidden overflow-x-auto">
                <table className="w-full text-right border-collapse min-w-[700px]">
                  <thead className="bg-slate-50 dark:bg-slate-800/30 text-slate-600 dark:text-slate-300 text-xs font-black border-b border-slate-100 dark:border-slate-800">
                    <tr>
                      <th className="p-3 w-20 text-center">اليوم</th>
                      <th className="p-3 w-20 text-center">التاريخ</th>
                      <th className="p-3">تفاصيل البضاعة</th>
                      <th className="p-3 w-20 text-center">العدد</th>
                      <th className="p-3 w-24 text-center">السعر</th>
                      <th className="p-3 w-24 text-center">الزيادات</th>
                      <th className="p-3 w-28 text-left">الإجمالي الفرعي</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/40 dark:divide-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200">
                    {selectedPreviewInvoice.items?.map((item: any) => (
                      <tr key={item.id} className="bg-white dark:bg-slate-900">
                        <td className="p-3 text-center">{item.day || '—'}</td>
                        <td className="p-3 text-center">{item.dateString || '—'}</td>
                        <td className="p-3">{item.description}</td>
                        <td className="p-3 text-center font-mono">{item.quantity}</td>
                        <td className="p-3 text-center font-mono">
                          {(item.unitPrice || 0).toLocaleString('en-US', {minimumFractionDigits: 1})}
                        </td>
                        <td className="p-3 text-center font-mono">
                          {(item.additions || 0).toLocaleString('en-US', {minimumFractionDigits: 1})}
                        </td>
                        <td className="p-3 text-left font-mono font-black text-indigo-600 dark:text-indigo-400">
                          {(((item.quantity || 0) * (item.unitPrice || 0)) + (item.additions || 0)).toLocaleString('en-US', {minimumFractionDigits: 1})}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Notes block if any */}
              {selectedPreviewInvoice.notes && (
                <div className="bg-slate-50 dark:bg-slate-800/30 p-4 rounded-xl border border-slate-200/40 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
                  <p className="font-black text-slate-700 dark:text-slate-200 mb-1">ملاحظات الفاتورة:</p>
                  <p className="whitespace-pre-wrap font-medium">{selectedPreviewInvoice.notes}</p>
                </div>
              )}

              {/* File Attachment Viewer inside modal (اضف الملف للفواتير) */}
              {selectedPreviewInvoice.attachmentData ? (
                <div className="space-y-3 pt-2">
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5">
                    <ImageIcon size={14} className="text-indigo-500" />
                    المستند المرفق بهذه الفاتورة:
                  </h4>

                  {selectedPreviewInvoice.attachmentData.startsWith('data:image/') ? (
                    <div className="border border-slate-200 dark:border-slate-700/60 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-950 p-2 max-w-lg mx-auto flex items-center justify-center shadow-xs">
                      <img
                        src={selectedPreviewInvoice.attachmentData}
                        alt="Attached Document"
                        className="max-h-72 object-contain rounded-xl hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 bg-indigo-500/5 border border-indigo-500/10 p-4 rounded-2xl max-w-md">
                      <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center shrink-0">
                        <File size={20} />
                      </div>
                      <div className="text-right flex-1">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{selectedPreviewInvoice.attachmentName || 'ملف مستند'}</p>
                        <p className="text-[10px] text-slate-400 mt-1">تنسيق ملف غير مدعوم للمعالجة المباشرة بالمتصفح</p>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-center">
                    <a
                      href={selectedPreviewInvoice.attachmentData}
                      download={selectedPreviewInvoice.attachmentName || `attachment_${selectedPreviewInvoice.invoiceNumber}.png`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer"
                    >
                      <Download size={13} />
                      تنزيل المرفق الأصلي للجهاز
                    </a>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-slate-400 text-[11px] font-semibold">
                  🚫 لا يوجد ملف مرفق مع هذه الفاتورة.
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex justify-between gap-3">
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    // Set all active states for print
                    setInvoiceNumber(selectedPreviewInvoice.invoiceNumber);
                    setInvoiceDate(selectedPreviewInvoice.date);
                    setInvoiceNotes(selectedPreviewInvoice.notes || '');
                    setItems(selectedPreviewInvoice.items);
                    setInvoiceType(selectedPreviewInvoice.type || 'sale');
                    setCustomerName(getAccountName(selectedPreviewInvoice.accountId, 'نقدي عام'));
                    setSelectedAccountId(selectedPreviewInvoice.accountId);
                    setAttachmentName(selectedPreviewInvoice.attachmentName || '');
                    setAttachmentData(selectedPreviewInvoice.attachmentData || '');

                    // Open print preview
                    setActiveSubTab('create');
                    setSelectedPreviewInvoice(null);
                    setShowPrintPreview(true);
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-xs transition-colors cursor-pointer shadow-md"
                >
                  <Eye size={15} />
                  معاينة الطباعة
                </button>

                <button
                  onClick={() => {
                    // Print logic for archival view:
                    // Temporarily load this invoice info as active to print
                    setInvoiceNumber(selectedPreviewInvoice.invoiceNumber);
                    setInvoiceDate(selectedPreviewInvoice.date);
                    setInvoiceNotes(selectedPreviewInvoice.notes || '');
                    setItems(selectedPreviewInvoice.items);
                    setInvoiceType(selectedPreviewInvoice.type || 'sale');
                    setCustomerName(getAccountName(selectedPreviewInvoice.accountId, 'نقدي عام'));
                    setSelectedAccountId(selectedPreviewInvoice.accountId);
                    setAttachmentName(selectedPreviewInvoice.attachmentName || '');
                    setAttachmentData(selectedPreviewInvoice.attachmentData || '');

                    // Open print drawer for visibility & open print prompt
                    setActiveSubTab('create');
                    setSelectedPreviewInvoice(null);
                    setTimeout(() => {
                      window.print();
                    }, 400);
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs transition-colors cursor-pointer shadow-md"
                >
                  <Printer size={15} />
                  طباعة مباشرة
                </button>
              </div>

              <button
                onClick={() => setSelectedPreviewInvoice(null)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs transition-colors cursor-pointer"
              >
                إغلاق
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Comprehensive Print Preview Modal (معاينة تنسيق الطباعة النهائي) */}
      {showPrintPreview && (
        <div className="fixed inset-0 z-50 overflow-y-auto print-modal-overlay flex flex-col bg-slate-900/90 backdrop-blur-xs animate-in fade-in duration-200" dir="rtl">
          {/* Top Control Bar */}
          <div className="sticky top-0 z-10 w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3 shadow-md flex flex-col md:flex-row items-center justify-between gap-4 no-print">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl">
                <Eye size={18} />
              </div>
              <div>
                <h3 className="font-black text-slate-800 dark:text-slate-100 text-sm">
                  معاينة تنسيق الفاتورة النهائي المخصص للطباعة
                </h3>
                <p className="text-[10px] text-slate-400 font-bold mt-0.5">رقم السند المولد: {invoiceNumber} | التاريخ: {invoiceDate}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Live Theme Swapper */}
              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200/60 dark:border-slate-700">
                <Palette size={13} className="text-slate-500" />
                <span className="text-[11px] font-black text-slate-600 dark:text-slate-300">لون السند المطبوع:</span>
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
                className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs transition-colors shadow-md cursor-pointer"
              >
                <Printer size={15} />
                بدء الطباعة الآن
              </button>

              <button
                onClick={handleExportExcel}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition-colors shadow-md cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                تصدير Excel
              </button>

              {/* Close Modal Preview */}
              <button
                onClick={() => setShowPrintPreview(false)}
                className="flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
              >
                <X size={15} />
                إغلاق المعاينة
              </button>
            </div>
          </div>

          {/* Interactive Screen Container representing paper flow */}
          <div className="flex-1 overflow-x-auto p-4 md:p-8 bg-slate-900/50 flex justify-center items-start print-modal-content">
            <div className="print-document w-full max-w-[210mm] bg-white text-slate-900 p-8 shadow-2xl rounded-xs border border-slate-200 my-4 select-text relative animate-in zoom-in-95 duration-200 mx-auto" style={{ minHeight: '297mm', direction: 'rtl' }}>
              {/* Elegant Double Border to match paper ledger style */}
              <div className={`print-border-wrapper border-4 border-double ${activeTheme.borderDouble} p-6 min-h-[265mm] flex flex-col justify-between`}>

                <div>
                  {/* Traditional Invoice Header block */}
                  <div className={`border-b-2 ${activeTheme.borderLight} pb-4 mb-6 flex justify-between items-center`}>
                    <div className="text-right space-y-1 w-1/3">
                      <p className="text-xs font-bold text-slate-700">تلفون: <span className="font-mono text-xs">{printPhone || '777xxxxxx'}</span></p>
                      <p className="text-xs font-bold text-slate-700">العنوان: <span className="text-xs">{printAddress || 'اليمن - صنعاء / عمران'}</span></p>
                      {printTaxNumber && <p className="text-[10px] text-slate-400 font-bold">الرقم الضريبي: <span className="font-mono">{printTaxNumber}</span></p>}
                    </div>

                    <div className="flex flex-col items-center justify-center text-center w-1/3">
                      <QatLogo colorScheme={printThemeColor as any} customLogoUrl={db.printCompanyLogo} />
                      <h1 className={`text-xl font-black ${activeTheme.textDark} mt-1.5`}>
                        {printCompanyName || 'محلات أبو أنس لتجارة وتسويق القات'}
                      </h1>
                      <span className="text-[10px] text-slate-500 font-black tracking-widest mt-0.5">
                        تصدير - تسويق - تجارة عامة
                      </span>
                    </div>

                    <div className="text-left space-y-1 w-1/3 flex flex-col items-end">
                      <span className={`px-4 py-1 text-sm font-black rounded-lg ${invoiceType === 'sale' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-rose-100 text-rose-800 border border-rose-200'}`}>
                        {invoiceType === 'sale' ? 'فاتورة مبيعات' : 'فاتورة مشتريات'}
                      </span>
                      <p className="text-xs font-bold text-slate-700 mt-2">رقم الفاتورة: <span className="font-mono text-sm text-slate-900">{invoiceNumber}</span></p>
                      <p className="text-xs font-bold text-slate-700">التاريخ الكلي: <span className="font-mono text-xs text-slate-900">{invoiceDate}</span></p>
                    </div>
                  </div>

                  {/* Client / Supplier details in physical ledger box */}
                  <div className={`grid grid-cols-2 gap-4 mb-6 border ${activeTheme.borderLight} rounded-xl p-4 ${activeTheme.bgLight}`}>
                    <div>
                      <span className="text-xs text-slate-500 block font-bold">مطلوب من السيد / الأخ:</span>
                      <span className={`text-base font-black ${activeTheme.textDark}`}>{customerName || 'زبون نقدي عام'}</span>
                    </div>
                    <div className="text-left self-center">
                      <span className="text-xs text-slate-500 block font-bold">العملة المعتمدة:</span>
                      <span className="text-sm font-bold text-slate-800">{db.primaryCurrency === 'YER' ? 'ريال يمني' : db.primaryCurrency === 'SAR' ? 'ريال سعودي' : db.primaryCurrency === 'USD' ? 'دولار أمريكي' : db.primaryCurrency}</span>
                    </div>
                  </div>

                  {/* Ledger Items Table - Matching the photo columns */}
                  <table className={`w-full text-right border-collapse border-2 ${activeTheme.borderDouble} text-xs`}>
                    <thead>
                      <tr className={`${activeTheme.headerBg} font-black text-center border-b-2 ${activeTheme.borderDouble}`}>
                        <th className="p-2.5 border-l border-white/20 w-16 text-center">اليوم</th>
                        <th className="p-2.5 border-l border-white/20 w-16 text-center">التاريخ</th>
                        <th className="p-2.5 border-l border-white/20 text-right">تفاصيل البضاعة والقات</th>
                        <th className="p-2.5 border-l border-white/20 w-16 text-center">العدد</th>
                        <th className="p-2.5 border-l border-white/20 w-20 text-center">السعر</th>
                        <th className="p-2.5 border-l border-white/20 w-20 text-center">الزيادات</th>
                        <th className="p-2.5 w-24 text-left">الإجمالي الفرعي</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item) => (
                        <tr key={item.id} className={`border-b ${activeTheme.borderMuted} even:bg-slate-50/50 hover:bg-slate-100/30`}>
                          {/* Day */}
                          <td className={`p-2.5 border-l ${activeTheme.borderMuted} text-center font-bold text-slate-700`}>
                            {item.day || getArabicDayName(invoiceDate) || '—'}
                          </td>
                          {/* Date */}
                          <td className={`p-2.5 border-l ${activeTheme.borderMuted} text-center font-bold text-slate-500`}>
                            {item.dateString || getFormattedMonthDay(invoiceDate) || '—'}
                          </td>
                          {/* Description */}
                          <td className={`p-2.5 border-l ${activeTheme.borderMuted} text-right font-black text-slate-800`}>
                            {item.description || '—'}
                          </td>
                          {/* Quantity */}
                          <td className={`p-2.5 border-l ${activeTheme.borderMuted} text-center font-mono font-bold text-slate-800`}>
                            {item.quantity || 0}
                          </td>
                          {/* Unit Price */}
                          <td className={`p-2.5 border-l ${activeTheme.borderMuted} text-center font-mono font-bold text-slate-800`}>
                            {(item.unitPrice || 0).toLocaleString('en-US', { minimumFractionDigits: 1 })}
                          </td>
                          {/* Additions */}
                          <td className={`p-2.5 border-l ${activeTheme.borderMuted} text-center font-mono font-bold text-slate-800`}>
                            {(item.additions || 0).toLocaleString('en-US', { minimumFractionDigits: 1 })}
                          </td>
                          {/* Subtotal */}
                          <td className="p-2.5 text-left font-mono font-black text-slate-900">
                            {(((item.quantity || 0) * (item.unitPrice || 0)) + (item.additions || 0)).toLocaleString('en-US', { minimumFractionDigits: 1 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Ledger Totals and Statistics Summary */}
                  <div className="grid grid-cols-2 gap-4 mt-5 items-start">
                    {/* Left Column (Calculations) */}
                    <div className={`space-y-1.5 border ${activeTheme.borderLight} rounded-xl p-3.5 ${activeTheme.bgLight} text-xs font-bold`}>
                      <div className="flex justify-between">
                        <span className="text-slate-600">إجمالي كمية السطور (العدد):</span>
                        <span className="font-mono text-slate-900">{totals.totalCount}</span>
                      </div>
                      {totals.totalAdditions > 0 && (
                        <div className="flex justify-between">
                          <span className="text-slate-600">إجمالي الزيادات والعمولات:</span>
                          <span className="font-mono text-amber-700">{totals.totalAdditions.toLocaleString('en-US', { minimumFractionDigits: 1 })} {db.primaryCurrency}</span>
                        </div>
                      )}
                      <div className={`border-t ${activeTheme.borderLight} pt-2 mt-1 flex justify-between text-sm font-black`}>
                        <span className={activeTheme.textDark}>الإجمالي الكلي النهائي:</span>
                        <span className={`font-mono text-base ${activeTheme.textDark}`}>{totals.total.toLocaleString('en-US', { minimumFractionDigits: 1 })} {db.primaryCurrency}</span>
                      </div>
                    </div>

                    {/* Right Column (Notes) */}
                    <div className="text-right h-full">
                      {invoiceNotes ? (
                        <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/50 text-[11px] h-full flex flex-col justify-between">
                          <div>
                            <h4 className="font-bold text-slate-800 border-b border-slate-300 pb-1 mb-1.5 flex items-center gap-1.5">📝 ملاحظات السند:</h4>
                            <p className="whitespace-pre-wrap text-slate-600 leading-relaxed font-medium">{invoiceNotes}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="border border-dashed border-slate-200 rounded-xl p-3.5 flex items-center justify-center h-full text-[10px] text-slate-400 min-h-[100px]">
                          لا توجد ملاحظات إضافية مسجلة على هذه الفاتورة.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Print Attachment if available */}
                  {attachmentData && attachmentData.startsWith('data:image/') && (
                    <div className="mt-8 border-t-2 border-dashed border-slate-200 pt-6">
                      <h4 className="font-bold text-slate-800 mb-2 text-xs">📂 صورة الملف المرفق بالفاتورة:</h4>
                      <div className="border border-slate-300 rounded-xl p-1 bg-white flex justify-center">
                        <img src={attachmentData} alt="Attached Document" className="max-h-[380px] object-contain" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Signature and Handshake Footer section */}
                <div className={`mt-12 pt-6 border-t ${activeTheme.footerBorder} flex justify-between items-center text-xs`}>
                  <div className="text-right space-y-1">
                    <p className="text-slate-500 font-bold">المستخدم الحالي: <span className="text-slate-700 font-black">{role === 'Admin' ? 'المدير العام (مسؤول)' : role === 'Accountant' ? 'المحاسب المعتمد' : role === 'Salesperson' ? 'المندوب / الموزع' : 'المحاسب المالي'}</span></p>
                    <p className="text-slate-400 text-[10px]">استخرج آلياً بواسطة نظام أنس المحاسبي المطور للقات</p>
                  </div>
                  <div className="flex gap-16">
                    <div className="text-center w-28">
                      <p className="font-bold text-slate-800">توقيع المستلم</p>
                      <div className="border-b border-dashed border-slate-400 h-8 mt-2"></div>
                    </div>
                    <div className="text-center w-28">
                      <p className="font-bold text-slate-800">توقيع المحاسب</p>
                      <div className="border-b border-dashed border-slate-400 h-8 mt-2"></div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
