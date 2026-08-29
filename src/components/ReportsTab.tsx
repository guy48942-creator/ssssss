import React, { useState, useMemo } from 'react';
import { Database } from '../utils';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  Clock,
  Filter,
  Printer,
  Download,
  Info,
  ChevronRight,
  RefreshCw,
  Activity,
  Award
} from 'lucide-react';

interface ReportsTabProps {
  db: Database;
}

export default function ReportsTab({ db }: ReportsTabProps) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedSubTab, setSelectedSubTab] = useState<'pl' | 'sales' | 'aging'>('pl');

  const primary = db.primaryCurrency;

  // 1. DYNAMIC PROFIT & LOSS REPORT
  const plReport = useMemo(() => {
    // Income: Sum of buyer transactions (type = debit) and generic sales entries
    // Filtered by date range
    let entries = db.dailyEntries;
    if (startDate) {
      entries = entries.filter(e => e.date >= startDate);
    }
    if (endDate) {
      entries = entries.filter(e => e.date <= endDate);
    }

    // Sales Revenue: Daily entries of type 'buyer' or generic (no link)
    const salesRevenue = entries
      .filter(e => e.accountType === undefined || e.accountType === 'buyer')
      .reduce((sum, e) => {
        const amtInPrimary = db.convertCurrency(e.total, e.currency || 'YER', primary);
        return sum + amtInPrimary;
      }, 0);

    // COGS: Daily entries linked to supplier or direct expenses / raw materials
    const cogs = entries
      .filter(e => e.accountType === 'supplier')
      .reduce((sum, e) => {
        const amtInPrimary = db.convertCurrency(e.total, e.currency || 'YER', primary);
        return sum + amtInPrimary;
      }, 0);

    // Direct Transactions outside Page 3 daily sheet (if any manual tx was posted)
    let txs = db.transactions;
    if (startDate) {
      txs = txs.filter(t => t.date >= startDate);
    }
    if (endDate) {
      txs = txs.filter(t => t.date <= endDate);
    }

    // Extra direct income / receipts not from Page 3
    const directIncome = txs
      .filter(t => t.type === 'debit' && !t.sourceEntryId && db.accounts.find(a => a.id === t.accountId)?.type === 'buyer')
      .reduce((sum, t) => {
        const amtInPrimary = db.convertCurrency(t.amount, t.currency || 'YER', primary);
        return sum + amtInPrimary;
      }, 0);

    // Extra direct supplier purchases not from Page 3
    const directExpenses = txs
      .filter(t => t.type === 'credit' && !t.sourceEntryId && db.accounts.find(a => a.id === t.accountId)?.type === 'supplier')
      .reduce((sum, t) => {
        const amtInPrimary = db.convertCurrency(t.amount, t.currency || 'YER', primary);
        return sum + amtInPrimary;
      }, 0);

    const totalIncome = salesRevenue + directIncome;
    const totalExpenses = cogs + directExpenses;
    const netProfit = totalIncome - totalExpenses;

    return {
      salesRevenue,
      directIncome,
      totalIncome,
      cogs,
      directExpenses,
      totalExpenses,
      netProfit
    };
  }, [db.dailyEntries, db.transactions, startDate, endDate, primary]);


  // 2. SALES BREAKDOWN REPORT (Grouped by Item/Service)
  const salesBreakdown = useMemo(() => {
    let entries = db.dailyEntries.filter(e => e.accountType === undefined || e.accountType === 'buyer');
    if (startDate) {
      entries = entries.filter(e => e.date >= startDate);
    }
    if (endDate) {
      entries = entries.filter(e => e.date <= endDate);
    }

    const groups: { [key: string]: { quantity: number; totalInPrimary: number; currency: string; samplePrice: number } } = {};

    entries.forEach(e => {
      const canonicalDesc = e.description.trim();
      const amtInPrimary = db.convertCurrency(e.total, e.currency || 'YER', primary);

      if (!groups[canonicalDesc]) {
        groups[canonicalDesc] = {
          quantity: 0,
          totalInPrimary: 0,
          currency: primary,
          samplePrice: e.unitPrice
        };
      }

      groups[canonicalDesc].quantity += e.quantity;
      groups[canonicalDesc].totalInPrimary += amtInPrimary;
    });

    const list = Object.keys(groups).map(name => ({
      name,
      quantity: groups[name].quantity,
      total: groups[name].totalInPrimary,
      samplePrice: groups[name].samplePrice
    }));

    // Sort by sales volume descending
    return list.sort((a, b) => b.total - a.total);
  }, [db.dailyEntries, startDate, endDate, primary]);


  // 3. RECIEVABLES DEBT AGING REPORT (For Buyers)
  const agingReport = useMemo(() => {
    const buyers = db.accounts.filter(a => a.type === 'buyer');
    const today = new Date();

    return buyers.map(buyer => {
      const balance = db.getAccountBalance(buyer.id);
      const balInPrimary = db.convertCurrency(balance, buyer.currency || 'YER', primary);

      if (balInPrimary <= 0) {
        return {
          id: buyer.id,
          name: buyer.name,
          currency: buyer.currency || 'YER',
          totalDebt: 0,
          bucket0_30: 0,
          bucket31_60: 0,
          bucket61_plus: 0
        };
      }

      // Find all outstanding buyer transactions that increase what is owed (type = debit)
      // and segment them by dates
      const debitTxs = db.transactions.filter(t => t.accountId === buyer.id && t.type === 'debit');

      let bucket0_30 = 0;
      let bucket31_60 = 0;
      let bucket61_plus = 0;

      debitTxs.forEach(tx => {
        const txDate = new Date(tx.date);
        const diffTime = Math.abs(today.getTime() - txDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const amtInPrimary = db.convertCurrency(tx.amount, tx.currency || buyer.currency || 'YER', primary);

        if (diffDays <= 30) {
          bucket0_30 += amtInPrimary;
        } else if (diffDays <= 60) {
          bucket31_60 += amtInPrimary;
        } else {
          bucket61_plus += amtInPrimary;
        }
      });

      // Special check: If opening balance is present, it is ancient, so classify in older bucket
      if (buyer.openingBalance > 0) {
        const openingInPrimary = db.convertCurrency(buyer.openingBalance, buyer.currency || 'YER', primary);
        bucket61_plus += openingInPrimary;
      }

      // Proportional tuning: if dynamic payments (credits) are registered,
      // reduce the oldest buckets first (Standard accounting practice: FIFO payment allocation)
      const credits = db.transactions.filter(t => t.accountId === buyer.id && t.type === 'credit');
      let totalReceived = credits.reduce((sum, tx) => sum + db.convertCurrency(tx.amount, tx.currency || buyer.currency || 'YER', primary), 0);

      // Deduct from oldest first
      if (totalReceived > 0) {
        if (bucket61_plus >= totalReceived) {
          bucket61_plus -= totalReceived;
          totalReceived = 0;
        } else {
          totalReceived -= bucket61_plus;
          bucket61_plus = 0;
        }
      }
      if (totalReceived > 0) {
        if (bucket31_60 >= totalReceived) {
          bucket31_60 -= totalReceived;
          totalReceived = 0;
        } else {
          totalReceived -= bucket31_60;
          bucket31_60 = 0;
        }
      }
      if (totalReceived > 0) {
        if (bucket0_30 >= totalReceived) {
          bucket0_30 -= totalReceived;
        } else {
          bucket0_30 = 0;
        }
      }

      return {
        id: buyer.id,
        name: buyer.name,
        currency: buyer.currency || 'YER',
        totalDebt: balInPrimary,
        bucket0_30,
        bucket31_60,
        bucket61_plus
      };
    }).filter(row => row.totalDebt > 0); // only show buyers with actual outstanding debts

  }, [db.accounts, db.transactions, primary]);

  // Aggregate global aging
  const totalAgingSum = useMemo(() => {
    return agingReport.reduce((acc, curr) => ({
      total: acc.total + curr.totalDebt,
      b0_30: acc.b0_30 + curr.bucket0_30,
      b31_60: acc.b31_60 + curr.bucket31_60,
      b61: acc.b61 + curr.bucket61_plus
    }), { total: 0, b0_30: 0, b31_60: 0, b61: 0 });
  }, [agingReport]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6" id="reports_main_container">

      {/* Dynamic Customizable PDF Print Header */}
      <div className="hidden print-only text-right space-y-4 border-b pb-6 mb-4 relative overflow-hidden" style={{ direction: 'rtl' }}>
        {db.printShowWatermark && (
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none rotate-12">
            <div className="text-center">
              <span className="text-5xl font-black block tracking-widest">{db.printCompanyName}</span>
              <span className="text-xl block mt-2 font-bold">تقرير وإقراد مالي رسمي</span>
            </div>
          </div>
        )}

        <div className="flex justify-between items-start">
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
            <p className="text-[10px] text-slate-500 font-bold">{db.printHeaderNote || 'قائمة التقارير المالية والتحليلية والتدقيق الشامل'}</p>
          </div>
          <div className="text-left font-mono text-[10px] text-slate-500 space-y-0.5">
            <p>رقم الهاتف: {db.printPhone}</p>
            <p>العنوان: {db.printAddress}</p>
            {db.printTaxNumber && <p>الرقم الضريبي: {db.printTaxNumber}</p>}
            <p>تاريخ الاستخراج: {new Date().toLocaleDateString('ar-SA')} | {new Date().toLocaleTimeString('ar-SA')}</p>
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
          <h2 className="text-xs font-black text-slate-800">تفاصيل وسياق التقرير المالي</h2>
          <p className="text-[11px] text-slate-600">
            التقارير التحليلية المجمعة من نظام المحاسبة وتفصيلات التدفقات. النطاق الزمني المحدد: {startDate || 'من البداية'} إلى {endDate || 'اليوم'}. العملة الموحدة: {primary}. التقرير النشط: {
              selectedSubTab === 'pl' ? 'قائمة الأرباح والخسائر الشاملة' :
              selectedSubTab === 'sales' ? 'تحليل المبيعات المفصل حسب المواد' :
              'تحليل ومطالبة فئات أعمار ديون الذمم للعملاء'
            }.
          </p>
        </div>
      </div>

      {/* Dynamic Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-xs no-print" id="reports_header_card">
        <div className="space-y-1">
          <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <BarChart3 className="text-blue-600 dark:text-blue-400" size={22} />
            <span>التقارير التحليلية المتقدمة لـ نظام ANAS المحاسبي</span>
          </h2>
          <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
            توليد لحظي لقوائم الأرباح والخسائر، وتحليل المبيعات لكل مادة على حدة، وتفصيل أعمار الديون الذمم للمشترين.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5 items-center">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Printer size={14} />
            <span>تصدير التقرير PDF</span>
          </button>
        </div>
      </div>

      {/* Date Range controls - Clean Minimalism */}
      <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl space-y-3 no-print" id="reports_filters">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400">
          <Filter size={15} />
          <span>تحديد النطاق الزمني والعملة</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <div className="space-y-1 text-right">
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400">الشهر</label>
            <input
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
              className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-100 font-mono"
            />
          </div>
          <div className="space-y-1 text-right">
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400">من تاريخ</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-100 font-mono"
            />
          </div>
          <div className="space-y-1 text-right">
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400">إلى تاريخ</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-100 font-mono"
            />
          </div>

          <div className="md:col-span-2 text-left flex justify-end items-center text-xs text-slate-400 font-mono">
            <span>العملة المعتمدة للتقارير: </span>
            <span className="font-extrabold text-blue-600 dark:text-blue-400 mr-1 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded">
              {primary} ({primary === 'YER' ? 'ريال يمني' : primary === 'YER' ? 'ريال يمني' : primary === 'USD' ? 'دولار أمريكي' : primary === 'EUR' ? 'يورو' : primary === 'AED' ? 'درهم إماراتي' : primary})
            </span>
          </div>
        </div>
      </div>

      {/* Sub tabs navigation */}
      <div className="border-b border-slate-100 dark:border-slate-800 flex gap-4 no-print" id="reports_subtabs">
        <button
          onClick={() => setSelectedSubTab('pl')}
          className={`pb-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            selectedSubTab === 'pl'
              ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          جدول الأرباح والخسائر (Profit & Loss)
        </button>
        <button
          onClick={() => setSelectedSubTab('sales')}
          className={`pb-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            selectedSubTab === 'sales'
              ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          تحليلات المبيعات وحسب السلعة
        </button>
        <button
          onClick={() => setSelectedSubTab('aging')}
          className={`pb-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            selectedSubTab === 'aging'
              ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          أعمار ديون المشترين (Aging Debt)
        </button>
      </div>

      {/* DYNAMIC SUBTABS RENDER */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm min-h-[350px]">

        {/* PROTIF & LOSS SUBTAB */}
        {selectedSubTab === 'pl' && (
          <div className="space-y-6" id="pl_report_tab">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="space-y-0.5 text-right">
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">قائمة الأرباح والخسائر الشاملة</h3>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  {startDate || 'البداية'} كحد أدنى وحتى {endDate || 'اليوم'}
                </p>
              </div>
              <span className="text-[10px] text-slate-400 block font-mono">العملة الموحدة: {primary}</span>
            </div>

            {/* Top KPI widgets */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-50 dark:bg-slate-800 p-5 rounded-2xl space-y-1 text-right">
                <span className="text-xs text-slate-400 font-medium">إجمالي الإيرادات (الدخل)</span>
                <p className="text-2xl font-bold font-mono text-emerald-500 mt-1" dir="ltr">
                  + {plReport.totalIncome.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} {primary}
                </p>
                <div className="text-[10px] text-slate-400 flex justify-between pt-2">
                  <span>من المبيعات: {plReport.salesRevenue.toLocaleString('en-US')}</span>
                  <span>مباشر: {plReport.directIncome.toLocaleString('en-US')}</span>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800 p-5 rounded-2xl space-y-1 text-right">
                <span className="text-xs text-slate-400 font-medium">إجمالي التكاليف والمشتريات</span>
                <p className="text-2xl font-bold font-mono text-red-500 mt-1" dir="ltr">
                  - {plReport.totalExpenses.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} {primary}
                </p>
                <div className="text-[10px] text-slate-400 flex justify-between pt-2">
                  <span>من الموردين: {plReport.cogs.toLocaleString('en-US')}</span>
                  <span>مباشر: {plReport.directExpenses.toLocaleString('en-US')}</span>
                </div>
              </div>

              <div className={`${plReport.netProfit >= 0 ? 'bg-emerald-500/5 hover:bg-emerald-500/10' : 'bg-red-500/5 hover:bg-red-500/10'} p-5 rounded-2xl border ${plReport.netProfit >= 0 ? 'border-emerald-500/10' : 'border-red-500/10'} space-y-1 text-right transition-colors`}>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block">صافي الربح / الخسارة التشغيلي</span>
                <p className={`text-2xl font-extrabold font-mono mt-1 ${plReport.netProfit >= 0 ? 'text-emerald-600' : 'text-red-500'}`} dir="ltr">
                  {plReport.netProfit >= 0 ? '+' : ''} {plReport.netProfit.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} {primary}
                </p>
                <div className="pt-2 text-[10px] text-slate-400 block">
                  {plReport.netProfit >= 0 ? 'أداء إيجابي ممتاز خلال هذه الفترة' : 'تحذير: نفقات أعلى من مبيعات الفترة'}
                </div>
              </div>
            </div>

            {/* P&L Statement Structure */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden mt-6">
              <div className="bg-slate-50 dark:bg-slate-800 px-4 py-3 text-right text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                هيكلية القوائم المحاسبية المطابقة لمقاييس التدقيق
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">

                <div className="px-5 py-3.5 flex justify-between items-center bg-white dark:bg-slate-900">
                  <span className="font-bold text-slate-700 dark:text-slate-400">إيرادات المبيعات والذمم الآجلة (صفحة 3)</span>
                  <span className="font-mono text-emerald-500 font-bold" dir="ltr">
                    +{plReport.salesRevenue.toLocaleString('en-US', {minimumFractionDigits: 2})} {primary}
                  </span>
                </div>

                <div className="px-5 py-3.5 flex justify-between items-center bg-white dark:bg-slate-900">
                  <span className="font-bold text-slate-700 dark:text-slate-400">إيصالات نقدية مباشرة وفوائد للحساب</span>
                  <span className="font-mono text-emerald-500 font-bold" dir="ltr">
                    +{plReport.directIncome.toLocaleString('en-US', {minimumFractionDigits: 2})} {primary}
                  </span>
                </div>

                <div className="px-5 py-3.5 flex justify-between items-center bg-slate-100/20 dark:bg-slate-800/20 font-black">
                  <span className="text-slate-800 dark:text-slate-200">إجمالي المداخيل المحققة والتشغيلية</span>
                  <span className="font-mono text-emerald-600 text-sm" dir="ltr">
                    {plReport.totalIncome.toLocaleString('en-US', {minimumFractionDigits: 2})} {primary}
                  </span>
                </div>

                <div className="px-5 py-3.5 flex justify-between items-center bg-white dark:bg-slate-900">
                  <span className="font-bold text-slate-700 dark:text-slate-400">تكلفة البضائع المبيعة وعقود التوريد (الموردين)</span>
                  <span className="font-mono text-red-500 font-bold" dir="ltr">
                    -{plReport.cogs.toLocaleString('en-US', {minimumFractionDigits: 2})} {primary}
                  </span>
                </div>

                <div className="px-5 py-3.5 flex justify-between items-center bg-white dark:bg-slate-900">
                  <span className="font-bold text-slate-700 dark:text-slate-400">مصاريف مباشرة خارج قيود الأستاذ العام</span>
                  <span className="font-mono text-red-500 font-bold" dir="ltr">
                    -{plReport.directExpenses.toLocaleString('en-US', {minimumFractionDigits: 2})} {primary}
                  </span>
                </div>

                <div className="px-5 py-3.5 flex justify-between items-center bg-slate-100/20 dark:bg-slate-800/20 font-black">
                  <span className="text-slate-800 dark:text-slate-200">إجمالي التكاليف والمصاريف التقديرية</span>
                  <span className="font-mono text-red-500 text-sm" dir="ltr">
                    {plReport.totalExpenses.toLocaleString('en-US', {minimumFractionDigits: 2})} {primary}
                  </span>
                </div>

                <div className={`px-5 py-4 flex justify-between items-center ${plReport.netProfit >= 0 ? 'bg-emerald-50/30 dark:bg-emerald-950/20' : 'bg-red-50/30 dark:bg-red-950/20'} font-black text-sm`}>
                  <span className="text-slate-800 dark:text-slate-105">صافي الأرباح (الخسائر) المستحقة:</span>
                  <span className={`font-mono text-base ${plReport.netProfit >= 0 ? 'text-emerald-600' : 'text-red-500'}`} dir="ltr">
                    {plReport.netProfit.toLocaleString('en-US', {minimumFractionDigits: 2})} {primary}
                  </span>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* SALES BREAKDOWN SUBTAB */}
        {selectedSubTab === 'sales' && (
          <div className="space-y-6" id="sales_breakdown_tab">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="space-y-0.5 text-right">
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">تحليل وتفكيك المبيعات حسب السلعة</h3>
                <p className="text-xs text-slate-400 dark:text-slate-500">مبيعات جميع المواد والخدمات من صفحة القيود اليومية</p>
              </div>
              <span className="text-[10px] text-slate-400 block font-mono">العملة الموحدة: {primary}</span>
            </div>

            {/* Table breakdown */}
            <div className="overflow-x-auto border border-slate-100 dark:border-slate-800 rounded-xl">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-3">المادة / الخدمة المباعة</th>
                    <th className="px-4 py-3 text-center">الكمية المباعة (وحدات)</th>
                    <th className="px-4 py-3 text-left">متوسط السعر التقريبي</th>
                    <th className="px-4 py-3 text-left">إجمالي قيمة المبيعات</th>
                    <th className="px-4 py-3 text-center">أهميتها وقيمتها النسبية %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-400">
                  {salesBreakdown.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-12 text-center text-slate-400">
                        لا توجد مبيعات في النطاق الزمني المحدد.
                      </td>
                    </tr>
                  ) : (
                    salesBreakdown.map((item, idx) => {
                      const overallSum = salesBreakdown.reduce((sum, i) => sum + i.total, 0);
                      const relativePct = overallSum > 0 ? (item.total / overallSum) * 100 : 0;

                      return (
                        <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="px-4 py-3.5 font-bold text-slate-800 dark:text-slate-200">{item.name}</td>
                          <td className="px-4 py-3.5 text-center font-mono">{item.quantity}</td>
                          <td className="px-4 py-3.5 text-left font-mono" dir="ltr">
                            {db.convertCurrency(item.samplePrice, 'YER', primary).toLocaleString('en-US', {maximumFractionDigits: 1})} {primary}
                          </td>
                          <td className="px-4 py-3.5 text-left font-mono font-bold text-slate-800 dark:text-slate-100" dir="ltr">
                            {item.total.toLocaleString('en-US', {minimumFractionDigits: 2})} {primary}
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <div className="flex items-center gap-2 justify-center">
                              <span className="font-mono text-[10px] w-10 text-right">{relativePct.toFixed(1)}%</span>
                              <div className="w-16 bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden shrink-0">
                                <div
                                  className="bg-blue-600 dark:bg-blue-400 h-full rounded-full"
                                  style={{ width: `${relativePct}%` }}
                                ></div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-4 bg-blue-50/40 dark:bg-slate-800 rounded-xl space-y-1.5 border border-blue-400/10 no-print">
              <span className="text-xs font-bold text-blue-700 dark:text-blue-400 block flex items-center gap-1">
                <Info size={14} />
                <span>إحصائية سريعة عن الكفاءة التشغيلية</span>
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                يصنف النظام السلع والخدمات تنازلياً حسب إجمالي المبيعات، لمساعدتك في معرفة المنتجات الأكثر تحقيقاً للأرباح وزيادة الإمدادات بها.
              </p>
            </div>
          </div>
        )}

        {/* AGING DEBT OUTSTANDING SUBTAB */}
        {selectedSubTab === 'aging' && (
          <div className="space-y-6" id="aging_debt_tab">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="space-y-0.5 text-right">
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">تقرير أعمار الديون والذمم المدينة المتأخرة</h3>
                <p className="text-xs text-slate-400 dark:text-slate-500">تصنيف المبالغ المستحقة على المشترين حسب عدد أيام التأخر</p>
              </div>
              <span className="text-[10px] text-slate-400 block font-mono">العملة الموحدة: {primary}</span>
            </div>

            {/* Top Summaries of Buckets */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-right">
              <div className="bg-slate-50 dark:bg-slate-800 p-4 border border-slate-100 dark:border-slate-800/80 rounded-xl">
                <span className="text-[10px] text-slate-400 font-bold block">إجمالي الذمم المستحقة مجمعة</span>
                <span className="text-base font-bold font-mono text-slate-800 dark:text-slate-100 block pt-1" dir="ltr">
                  {totalAgingSum.total.toLocaleString('en-US', {minimumFractionDigits: 1})} {primary}
                </span>
              </div>
              <div className="bg-emerald-500/5 p-4 border border-emerald-500/10 rounded-xl">
                <span className="text-[10px] text-emerald-600 block font-bold">1 - 30 يوم (حالي ونشط)</span>
                <span className="text-base font-bold font-mono text-emerald-600 block pt-1" dir="ltr">
                  {totalAgingSum.b0_30.toLocaleString('en-US', {minimumFractionDigits: 1})} {primary}
                </span>
              </div>
              <div className="bg-amber-500/5 p-4 border border-amber-500/10 rounded-xl">
                <span className="text-[10px] text-amber-600 block font-bold">31 - 60 يوم (متأخر يحتاج تبليغ)</span>
                <span className="text-base font-bold font-mono text-amber-600 block pt-1" dir="ltr">
                  {totalAgingSum.b31_60.toLocaleString('en-US', {minimumFractionDigits: 1})} {primary}
                </span>
              </div>
              <div className="bg-red-500/5 p-4 border border-red-500/10 rounded-xl">
                <span className="text-[10px] text-red-500 block font-bold">61+ يوم (ديون صعبة ومستعجلة)</span>
                <span className="text-base font-bold font-mono text-red-500 block pt-1" dir="ltr">
                  {totalAgingSum.b61.toLocaleString('en-US', {minimumFractionDigits: 1})} {primary}
                </span>
              </div>
            </div>

            {/* Table list */}
            <div className="overflow-x-auto border border-slate-100 dark:border-slate-800 rounded-xl mt-6">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-3">اسم المشتري / العميل المدين</th>
                    <th className="px-4 py-3 text-left">إجمالي الدين</th>
                    <th className="px-4 py-3 text-left">من 1-30 يوم</th>
                    <th className="px-4 py-3 text-left">من 31-60 يوم</th>
                    <th className="px-4 py-3 text-left">أكثر من 60 يوم</th>
                    <th className="px-4 py-3 text-center no-print">تأكيد</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-400">
                  {agingReport.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                        لا توجد ديون مستحقة للتحصيل للعملاء حالياً. ممتاز! رصيد الذمم نظيف.
                      </td>
                    </tr>
                  ) : (
                    agingReport.map((user, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-4 py-3.5 font-bold text-slate-800 dark:text-slate-300">{user.name}</td>
                        <td className="px-4 py-3.5 text-left font-mono font-bold text-slate-800 dark:text-slate-100" dir="ltr">
                          {user.totalDebt.toLocaleString('en-US', {minimumFractionDigits: 1})} {primary}
                        </td>
                        <td className="px-4 py-3.5 text-left font-mono text-emerald-600" dir="ltr">
                          {user.bucket0_30 > 0 ? `${user.bucket0_30.toLocaleString('en-US', {minimumFractionDigits: 1})} ${primary}` : '0'}
                        </td>
                        <td className="px-4 py-3.5 text-left font-mono text-amber-600" dir="ltr">
                          {user.bucket31_60 > 0 ? `${user.bucket31_60.toLocaleString('en-US', {minimumFractionDigits: 1})} ${primary}` : '0'}
                        </td>
                        <td className="px-4 py-3.5 text-left font-mono text-red-500 font-bold" dir="ltr">
                          {user.bucket61_plus > 0 ? `${user.bucket61_plus.toLocaleString('en-US', {minimumFractionDigits: 1})} ${primary}` : '0'}
                        </td>
                        <td className="px-4 py-3.5 text-center no-print">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            user.bucket61_plus > 0
                              ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'
                              : (user.bucket31_60 > 0 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700')
                          }`}>
                            {user.bucket61_plus > 0 ? 'مستعجل' : 'مستمر'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-4 bg-amber-500/5 hover:bg-amber-500/10 rounded-xl space-y-1.5 border border-amber-500/10 text-right no-print transition-colors">
              <span className="text-xs font-bold text-amber-600 block flex items-center gap-1">
                <Clock size={14} className="text-amber-500" />
                <span>إرشاد لتحسين نسبة التدفق المالي وتأصيل الديون</span>
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                يتبع هذا التقرير نظام التوزيع القديم أولاً (FIFO) لتسجيل مستردات العملاء، مما يعطيك تمثيلاً فائق الدقة لأحجام الديون العتيقة التي تزيد عن 60 يوماً وتتطلب التواصل السريع للمطالبة بالسداد.
              </p>
            </div>
          </div>
        )}

      </div>

      {/* PRINT BRANDING (Shows only in PDF printing footer) */}
      <div className="hidden print-only border-t pt-6 mt-6 text-right space-y-4" id="ledger_print_footer">
        <p className="text-[10px] text-slate-500 leading-relaxed text-center font-bold">
          {db.printFooterNote || 'تقرير معتمد ومستخرج من نظام الحسابات والتدقيق المالي.'}
        </p>

        {db.printShowSignature && (
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="border border-slate-200 rounded-xl p-4 text-center">
              <span className="text-[11px] font-black text-slate-700 block mb-8">إعداد ومراجعة مسؤول التقارير</span>
              <span className="text-[10px] text-slate-400 block border-t pt-2 border-dashed">التوقيع والخاتم: .........................</span>
            </div>
            <div className="border border-slate-200 rounded-xl p-4 text-center">
              <span className="text-[11px] font-black text-slate-700 block mb-8">اعتماد واعتماد إدارة الشؤون المالية</span>
              <span className="text-[10px] text-slate-400 block border-t pt-2 border-dashed">إمضاء الكفيل المصدق: .........................</span>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
