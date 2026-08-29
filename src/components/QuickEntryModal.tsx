import React, { useState, useEffect } from 'react';
import { X, Plus, FileText, CheckCircle2, Coins } from 'lucide-react';
import type { Database } from '../utils';
import { SUPPORTED_CURRENCIES, getCurrencyInfo } from '../currencyUtils';

interface QuickEntryModalProps {
  db: Database;
  isOpen: boolean;
  onClose: () => void;
  onDatabaseUpdate: () => void;
  defaultType?: 'debit' | 'credit';
}

export default function QuickEntryModal({ db, isOpen, onClose, onDatabaseUpdate, defaultType }: QuickEntryModalProps) {
  // Form State
  const [dayNumber, setDayNumber] = useState<number>(1);
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState<number | ''>('');
  const [unitPrice, setUnitPrice] = useState<number | ''>('');
  const [extraCharges, setExtraCharges] = useState<number | ''>('');
  const [accountId, setAccountId] = useState<string>('');
  const [currency, setCurrency] = useState<string>(db.primaryCurrency || 'YER');
  const [showSuccess, setShowSuccess] = useState(false);

  // Set the next available day when the modal opens
  useEffect(() => {
    if (isOpen) {
      const days = db.dailyEntries.map(e => e.dayNumber);
      let nextDay = 1;
      if (days.length > 0) {
        const maxDay = Math.max(...days);
        nextDay = maxDay < 30 ? maxDay + 1 : 30;
      }
      setDayNumber(nextDay);
      // Reset form
      setDescription('');
      setQuantity('');
      setUnitPrice('');
      setExtraCharges('');

      // Auto-set account id based on defaultType
      if (defaultType === 'debit') {
        const firstCustomer = db.accounts.find(a => a.type === 'buyer');
        setAccountId(firstCustomer ? firstCustomer.id : '');
      } else if (defaultType === 'credit') {
        const firstSupplier = db.accounts.find(a => a.type === 'supplier');
        setAccountId(firstSupplier ? firstSupplier.id : '');
      } else {
        setAccountId('');
      }

      setCurrency(db.primaryCurrency || 'YER');
      setShowSuccess(false);
    }
  }, [isOpen, db.dailyEntries, db.primaryCurrency, defaultType, db.accounts]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      alert('الرجاء إدخال تفاصيل أو اسم المادة للعملية');
      return;
    }

    const calculatedTotal = (Number(quantity) * Number(unitPrice));
    const linkedAcc = db.accounts.find(a => a.id === accountId);

    db.addDailyLedgerEntry({
      dayNumber: Number(dayNumber),
      date,
      description,
      quantity: Number(quantity),
      unitPrice: Number(unitPrice),
      extraCharges: Number(extraCharges),
      total: calculatedTotal,
      accountId: accountId || undefined,
      accountType: linkedAcc?.type || undefined,
      transactionType: accountId ? (linkedAcc?.type === 'supplier' ? 'credit' : 'debit') : undefined,
      currency
    });

    onDatabaseUpdate();
    setShowSuccess(true);

    // Close modal after success animation
    setTimeout(() => {
      onClose();
      setShowSuccess(false);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden" dir="rtl">
        {/* Header */}
        <div className="flex justify-between items-center px-5 py-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-xl ${
              defaultType === 'debit'
                ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                : defaultType === 'credit'
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
            }`}>
              <FileText size={18} />
            </div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100">
              {defaultType === 'debit'
                ? 'إدخال اسحب مبلغ دين'
                : defaultType === 'credit'
                  ? 'إدخال تسديد مبلغ'
                  : 'إدخال قيد سريع'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 p-2 rounded-xl transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        {showSuccess ? (
          <div className="p-10 flex flex-col items-center justify-center text-center space-y-3 animate-in zoom-in-95">
            <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500 rounded-full flex items-center justify-center mb-2">
              <CheckCircle2 size={32} />
            </div>
            <h4 className="text-xl font-bold text-slate-800 dark:text-slate-100">تم حفظ القيد بنجاح!</h4>
            <p className="text-sm text-slate-500">تم ترحيل البيانات إلى دفتر اليومية.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">اليوم (1 - 30)</label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  required
                  value={dayNumber}
                  onChange={(e) => setDayNumber(Number(e.target.value))}
                  className="w-full text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-xl px-3 py-2.5 text-slate-800 dark:text-slate-100 font-mono focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">التاريخ</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-xl px-3 py-2.5 text-slate-800 dark:text-slate-100 font-mono focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">البيان / تفاصيل السلعة والمباع *</label>
              <datalist id="quick_item_names">
                <option value="بلوط" />
                <option value="نقفه" />
                <option value="لوز" />
                <option value="جوز" />
                <option value="كاجو" />
              </datalist>
              <input
                type="text"
                required
                list="quick_item_names"
                placeholder="مثال: بلوط أو نقفه"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-xl px-3.5 py-2.5 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">الكمية</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-xl px-3 py-2.5 text-slate-800 dark:text-slate-100 font-mono focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">سعر المفرد</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-xl px-3 py-2.5 text-slate-800 dark:text-slate-100 font-mono focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">العملة</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-xl px-2.5 py-2.5 text-slate-800 dark:text-slate-100 font-bold focus:ring-2 focus:ring-indigo-500/20"
                >
                  {SUPPORTED_CURRENCIES.map(c => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.code} ({c.symbolAr})
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">الإجمالي</label>
                <div className="w-full text-sm bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-500/20 rounded-xl px-3 py-2.5 font-mono text-emerald-700 dark:text-emerald-400 font-bold">
                  {((Number(quantity || 0) * Number(unitPrice || 0))).toLocaleString('en-US', {minimumFractionDigits: 1})} {getCurrencyInfo(currency).symbolAr}
                </div>
              </div>
            </div>

            {currency !== (db.primaryCurrency || 'YER') && Number(quantity || 0) * Number(unitPrice || 0) > 0 && (
              <div className="p-2.5 bg-blue-50/70 dark:bg-blue-950/20 rounded-xl text-xs text-blue-700 dark:text-blue-300 font-medium flex items-center justify-between border border-blue-200/60 dark:border-blue-900/40">
                <span>المعادل بالعملة الرئيسية ({db.primaryCurrency}):</span>
                <span className="font-bold font-mono">
                  {db.convertCurrency(Number(quantity || 0) * Number(unitPrice || 0), currency, db.primaryCurrency).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {getCurrencyInfo(db.primaryCurrency).symbolAr}
                </span>
              </div>
            )}

            <div className="space-y-1.5 pt-2">
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
                {defaultType === 'debit'
                  ? 'ربط القيد بحساب العميل (مدين)'
                  : defaultType === 'credit'
                    ? 'ربط القيد بحساب المورد (دائن)'
                    : 'ربط القيد بحساب (اختياري)'}
              </label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full text-sm bg-blue-50/50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/50 rounded-xl px-3 py-2.5 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/20"
              >
                {!defaultType && <option value="">-- مسودة مستقلة لا تؤثر على الأرصدة --</option>}
                {db.accounts
                  .filter(acc => {
                    if (defaultType === 'debit') return acc.type === 'buyer';
                    if (defaultType === 'credit') return acc.type === 'supplier';
                    return true;
                  })
                  .map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({acc.type === 'supplier' ? 'مورد' : 'عميل'})
                    </option>
                  ))
                }
              </select>
            </div>

            <div className="pt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/30 rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Plus size={16} />
                <span>إضافة القيد الفوري</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
