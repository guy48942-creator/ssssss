/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Coins,
  RefreshCw,
  Check,
  Edit3,
  RotateCcw,
  ArrowRightLeft,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Clock
} from 'lucide-react';
import type { Database } from '../utils';
import {
  SUPPORTED_CURRENCIES,
  DEFAULT_RATES,
  getCurrencyInfo,
  formatCurrency,
  convertAmount,
  CurrencyConfig
} from '../currencyUtils';

interface CurrencyModalProps {
  db: Database;
  isOpen: boolean;
  onClose: () => void;
  onDatabaseUpdate: () => void;
}

export default function CurrencyModal({ db, isOpen, onClose, onDatabaseUpdate }: CurrencyModalProps) {
  const [selectedPrimary, setSelectedPrimary] = useState<string>(db.primaryCurrency || 'YER');
  const [rates, setRates] = useState<{ [key: string]: number }>({ ...DEFAULT_RATES, ...db.exchangeRates });
  const [editingRates, setEditingRates] = useState<{ [key: string]: string }>({});
  const [isFetching, setIsFetching] = useState(false);
  const [fetchStatus, setFetchStatus] = useState<{ success: boolean; message: string } | null>(null);

  // Quick Converter state
  const [converterAmount, setConverterAmount] = useState<number>(100);
  const [converterFrom, setConverterFrom] = useState<string>(db.primaryCurrency || 'USD');
  const [converterTo, setConverterTo] = useState<string>(db.primaryCurrency === 'SAR' ? 'YER' : 'SAR');

  useEffect(() => {
    if (isOpen) {
      setSelectedPrimary(db.primaryCurrency || 'YER');
      setRates({ ...DEFAULT_RATES, ...db.exchangeRates });

      const initialEditing: { [key: string]: string } = {};
      SUPPORTED_CURRENCIES.forEach(c => {
        initialEditing[c.code] = (db.exchangeRates[c.code] || c.defaultRate).toString();
      });
      setEditingRates(initialEditing);
      setFetchStatus(null);
    }
  }, [isOpen, db.primaryCurrency, db.exchangeRates]);

  if (!isOpen) return null;

  const handleFetchRates = async () => {
    setIsFetching(true);
    setFetchStatus(null);
    try {
      const success = await db.fetchExchangeRates();
      if (success) {
        setRates({ ...db.exchangeRates });
        const updatedEditing: { [key: string]: string } = {};
        SUPPORTED_CURRENCIES.forEach(c => {
          updatedEditing[c.code] = (db.exchangeRates[c.code] || c.defaultRate).toString();
        });
        setEditingRates(updatedEditing);
        setFetchStatus({ success: true, message: 'تم تحديث أسعار الصرف بنجاح من المزود المالي' });
        onDatabaseUpdate();
      } else {
        setFetchStatus({ success: false, message: 'تعذر جلب الأسعار المحدثة، تم الإبقاء على الأسعار السابقة' });
      }
    } catch {
      setFetchStatus({ success: false, message: 'حدث خطأ أثناء الاتصال بمزود أسعار الصرف' });
    } finally {
      setIsFetching(false);
    }
  };

  const handleRateChange = (code: string, val: string) => {
    setEditingRates(prev => ({ ...prev, [code]: val }));
  };

  const handleSaveAll = () => {
    // Validate and build new rates
    const newRates: { [key: string]: number } = { ...rates };
    Object.keys(editingRates).forEach(code => {
      const num = parseFloat(editingRates[code]);
      if (!isNaN(num) && num > 0) {
        newRates[code] = num;
      }
    });

    db.updateExchangeRates(newRates);
    if (selectedPrimary !== db.primaryCurrency) {
      db.setPrimaryCurrency(selectedPrimary);
    }

    onDatabaseUpdate();
    setFetchStatus({ success: true, message: 'تم حفظ كافة إعدادات وأسعار العملات بنجاح' });
    setTimeout(() => {
      onClose();
    }, 800);
  };

  const handleResetToDefaults = () => {
    if (window.confirm('هل تريد استعادة أسعار الصرف الافتراضية؟')) {
      db.updateExchangeRates(DEFAULT_RATES);
      setRates({ ...DEFAULT_RATES });
      const updatedEditing: { [key: string]: string } = {};
      SUPPORTED_CURRENCIES.forEach(c => {
        updatedEditing[c.code] = c.defaultRate.toString();
      });
      setEditingRates(updatedEditing);
      onDatabaseUpdate();
      setFetchStatus({ success: true, message: 'تمت استعادة أسعار الصرف الافتراضية بنجاح' });
    }
  };

  const primaryInfo = getCurrencyInfo(selectedPrimary);
  const convertedValue = convertAmount(converterAmount, converterFrom, converterTo, rates);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 dark:bg-black/70 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
      <div
        className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6"
        dir="rtl"
        id="currency_manager_modal"
      >
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <Coins className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                إدارة العملات وأسعار الصرف المتعددة
                <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300">
                  متوافق مع المعايير المحاسبية
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                تحديد العملة الرئيسية للنظام، جلب أسعار الصرف الحية، وتعديل الأسعار يدوياً
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">

          {/* Alert / Feedback message */}
          {fetchStatus && (
            <div className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium ${
              fetchStatus.success
                ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50'
                : 'bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800/50'
            }`}>
              {fetchStatus.success ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
              <span>{fetchStatus.message}</span>
            </div>
          )}

          {/* 1. Primary Currency Selector */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-slate-50/50 dark:from-slate-800/60 dark:to-slate-800/60 border border-blue-100 dark:border-slate-700">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <label className="text-sm font-bold text-slate-800 dark:text-slate-200 block mb-1">
                  العملة الأساسية للنظام (Primary Currency)
                </label>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md">
                  سيتم توحيد وحساب إجمالي المبيعات، الأرباح، ديون العملاء، وميزان المراجعة بهذه العملة تلقائياً.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={selectedPrimary}
                  onChange={(e) => setSelectedPrimary(e.target.value)}
                  className="px-4 py-2.5 bg-white dark:bg-slate-900 border-2 border-blue-500/30 dark:border-blue-400/30 focus:border-blue-500 rounded-xl text-slate-800 dark:text-slate-100 font-bold text-sm shadow-sm outline-none cursor-pointer"
                >
                  {SUPPORTED_CURRENCIES.map(curr => (
                    <option key={curr.code} value={curr.code}>
                      {curr.flag} {curr.nameAr} ({curr.symbolAr} - {curr.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-blue-100/60 dark:border-slate-700/60 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                العملة المعتمدة حالياً في التقارير: <strong className="text-slate-800 dark:text-slate-200 font-bold">{primaryInfo.flag} {primaryInfo.nameAr} ({primaryInfo.symbolAr})</strong>
              </span>
              {db.lastRatesUpdate && (
                <span className="flex items-center gap-1 text-[11px] text-slate-400">
                  <Clock className="w-3.5 h-3.5" />
                  آخر تحديث للأسعار: {new Date(db.lastRatesUpdate).toLocaleDateString('ar-SA')} {new Date(db.lastRatesUpdate).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>
          </div>

          {/* 2. Interactive Instant Currency Converter */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <ArrowRightLeft className="w-4 h-4 text-blue-500" />
                محول العملات الفوري السريع (حسب الأسعار الحالية)
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-7 gap-2.5 items-center">
              <div className="sm:col-span-2">
                <label className="text-[11px] text-slate-500 font-medium block mb-1">المبلغ</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={converterAmount}
                  onChange={(e) => setConverterAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 font-bold text-sm text-left font-mono outline-none"
                  placeholder="0.00"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-[11px] text-slate-500 font-medium block mb-1">من عملة</label>
                <select
                  value={converterFrom}
                  onChange={(e) => setConverterFrom(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 font-medium text-xs outline-none"
                >
                  {SUPPORTED_CURRENCIES.map(curr => (
                    <option key={curr.code} value={curr.code}>
                      {curr.flag} {curr.nameAr} ({curr.symbolAr})
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-1 flex items-center justify-center pt-4">
                <button
                  type="button"
                  onClick={() => {
                    const temp = converterFrom;
                    setConverterFrom(converterTo);
                    setConverterTo(temp);
                  }}
                  className="p-2 rounded-xl bg-slate-200/80 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition-colors"
                  title="تبديل العملات"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                </button>
              </div>

              <div className="sm:col-span-2">
                <label className="text-[11px] text-slate-500 font-medium block mb-1">إلى عملة</label>
                <select
                  value={converterTo}
                  onChange={(e) => setConverterTo(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 font-medium text-xs outline-none"
                >
                  {SUPPORTED_CURRENCIES.map(curr => (
                    <option key={curr.code} value={curr.code}>
                      {curr.flag} {curr.nameAr} ({curr.symbolAr})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-3 p-3 bg-white dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <span className="text-xs text-slate-500">النتيجة المحسوبة:</span>
              <span className="text-base font-black text-emerald-600 dark:text-emerald-400 font-mono" dir="ltr">
                {convertedValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {getCurrencyInfo(converterTo).symbolAr}
              </span>
            </div>
          </div>

          {/* 3. Exchange Rates Table & Actions */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  جدول أسعار الصرف (مقابل 1 دولار أمريكي USD)
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  يمكنك تعديل أي سعر يدوياً لتناسب أسعار السوق المحلي أو تحديثها آلياً عبر الإنترنت
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleFetchRates}
                  disabled={isFetching}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 border border-blue-200 dark:border-blue-800 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
                  <span>{isFetching ? 'جاري الجلب...' : 'تحديث الأسعار حياً'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleResetToDefaults}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-xs font-medium transition-all"
                  title="استعادة الافتراضيات"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>استعادة</span>
                </button>
              </div>
            </div>

            {/* Table Container */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
              <div className="max-h-64 overflow-y-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 sticky top-0 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold">
                    <tr>
                      <th className="py-2.5 px-4">العملة</th>
                      <th className="py-2.5 px-3">الرمز</th>
                      <th className="py-2.5 px-3">السعر مقابل (1 USD)</th>
                      <th className="py-2.5 px-3">المعادل للعملة الأساسية ({primaryInfo.symbolAr})</th>
                      <th className="py-2.5 px-3 text-center">التحكم اليدوي</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-900">
                    {SUPPORTED_CURRENCIES.map(currency => {
                      const isCurrentPrimary = currency.code === selectedPrimary;
                      const rawRate = editingRates[currency.code] !== undefined ? editingRates[currency.code] : (rates[currency.code] || currency.defaultRate).toString();
                      const numRate = parseFloat(rawRate) || currency.defaultRate;

                      // Calculate equivalent for 1 unit of this currency in selected Primary
                      const equivInPrimary = convertAmount(1, currency.code, selectedPrimary, { ...rates, [currency.code]: numRate });

                      return (
                        <tr key={currency.code} className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                          isCurrentPrimary ? 'bg-blue-50/30 dark:bg-blue-950/20' : ''
                        }`}>
                          <td className="py-2.5 px-4 font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                            <span className="text-base">{currency.flag}</span>
                            <div>
                              <span>{currency.nameAr}</span>
                              <span className="text-[10px] text-slate-400 font-mono block">{currency.code}</span>
                            </div>
                            {isCurrentPrimary && (
                              <span className="text-[10px] bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded font-bold">
                                أساسية
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 font-bold text-slate-600 dark:text-slate-300">
                            {currency.symbolAr}
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-1 max-w-[140px]">
                              <input
                                type="number"
                                min="0.0001"
                                step="any"
                                value={editingRates[currency.code] ?? (rates[currency.code] || currency.defaultRate)}
                                onChange={(e) => handleRateChange(currency.code, e.target.value)}
                                className="w-full px-2.5 py-1 text-left font-mono font-bold bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-lg focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 outline-none text-xs"
                              />
                            </div>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-300 text-xs" dir="ltr">
                            1 {currency.code} ≈ {equivInPrimary.toLocaleString('en-US', { maximumFractionDigits: 3 })} {primaryInfo.symbolAr}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => setSelectedPrimary(currency.code)}
                              disabled={isCurrentPrimary}
                              className={`text-[11px] px-2 py-1 rounded-lg font-medium transition-all ${
                                isCurrentPrimary
                                  ? 'text-slate-400 cursor-default'
                                  : 'text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30'
                              }`}
                            >
                              {isCurrentPrimary ? 'الأساسية' : 'تعيين كأساسية'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
          <div className="text-xs text-slate-500 flex items-center gap-1">
            <HelpCircle className="w-4 h-4 text-slate-400" />
            <span>يتم تطبيق الأسعار فورا على التقارير وحساب الأرصدة التلقائي</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-xs font-bold transition-colors"
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={handleSaveAll}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 hover:shadow-blue-500/30 transition-all flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>حفظ وتطبيق التغييرات</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
