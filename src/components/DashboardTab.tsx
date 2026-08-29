/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Database } from '../utils';
import {
  TrendingUp,
  Users,
  ArrowDownLeft,
  ArrowUpRight,
  DollarSign,
  Calendar,
  ChevronLeft,
  Truck,
  ShoppingBag,
  Bell,
  Zap,
  AlertCircle
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

interface DashboardTabProps {
  db: Database;
  onNavigateToTab: (tab: string) => void;
  onSelectAccount?: (accountId: string) => void;
  onOpenQuickEntry?: () => void;
}

export default function DashboardTab({ db, onNavigateToTab, onSelectAccount, onOpenQuickEntry }: DashboardTabProps) {
  const revenues = db.getRevenues();
  const suppliersSum = db.getSuppliersSummary();
  const buyersSum = db.getBuyersSummary();
  const trendData = db.getRevenueTrends();

  // Highlighted quick metrics for sales and cash flow
  const kpis = [
    {
      id: 'daily',
      title: 'مبيعات اليوم',
      subtitle: 'الفترة الحالية (اليوم)',
      value: `${revenues.daily.toLocaleString('ar-SA')} ${db.primaryCurrency || 'YER'}`,
      icon: DollarSign,
      color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
      badge: 'محدث تلقائياً'
    },
    {
      id: 'weekly',
      title: 'مبيعات الأسبوع الحالي',
      subtitle: 'آخر 7 أيام عمل',
      value: `${revenues.weekly.toLocaleString('ar-SA')} ${db.primaryCurrency || 'YER'}`,
      icon: Calendar,
      color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
      badge: 'تراكمي'
    },
    {
      id: 'monthly',
      title: 'مبيعات الشهر الحالي',
      subtitle: 'مبيعات شهر يونية 2026',
      value: `${revenues.monthly.toLocaleString('ar-SA')} ${db.primaryCurrency || 'YER'}`,
      icon: TrendingUp,
      color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
      badge: 'الهدف الشهري'
    }
  ];

  return (
    <div className="space-y-8" id="dashboard_tab_container">
      {/* Dynamic Revenues Widgets Grid */}
      {db.showWidgetTotalSales && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="revenue_kpi_grid">
          {kpis.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <div
                key={kpi.id}
                id={`kpi_card_${kpi.id}`}
                className="group card-3d rounded-2xl p-6 relative overflow-hidden cursor-pointer interactive-tap"
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-1.5 font-sans">
                    <span className="text-xs font-semibold text-slate-400 dark:text-slate-400 block">{kpi.title}</span>
                    <span className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight block font-mono" dir="ltr">
                      {kpi.value}
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 block">{kpi.subtitle}</span>
                  </div>
                  <div className={`p-2.5 rounded-xl ${kpi.color} icon-bounce group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                    <Icon size={20} className="stroke-[1.8]" />
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-50 dark:border-slate-800/40 flex justify-between items-center text-[11px] text-slate-400">
                  <span className="font-medium">الحالة</span>
                  <span className="px-2 py-0.5 rounded-full bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-500 text-[10px] font-bold">
                    {kpi.badge}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Quick Actions Row */}
      <div className="flex gap-4 items-center">
        {onOpenQuickEntry && (
          <button
            onClick={onOpenQuickEntry}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-4 rounded-2xl font-bold shadow-md hover:shadow-lg transition-all"
          >
            <Zap size={20} className="fill-white/20" />
            <span>إضافة قيد مالي (دائن ومدين)</span>
          </button>
        )}
      </div>

      {/* Main Analysis Section: Trend Chart & Account Summaries */}
      <div className="grid grid-cols-1 gap-8" id="main_dashboard_layout">

        {/* Revenue Trend Area Chart */}
        {db.showWidgetTotalSales && (
          <div className="bg-white dark:bg-slate-900 border border-slate-100/80 dark:border-slate-800/80 rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-6" id="revenue_trend_section">
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">منحنى اتجاهات مبيعات اليومية</h3>
                <p className="text-xs text-slate-400 dark:text-slate-500">مخطط بياني لتطور المبيعات اليومية وإيرادات الذمم</p>
              </div>
              <button
                id="goto_ledger_btn"
                onClick={() => onNavigateToTab('ledger')}
                className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline font-medium"
              >
                عرض جدول القيود <ChevronLeft size={16} />
              </button>
            </div>

            <div className="h-[300px] w-full" id="revenue_chart_container">
              <ResponsiveContainer width="99%" height="100%" minHeight={300} minWidth={100}>
                <AreaChart
                  data={trendData}
                  margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    stroke="#94a3b8"
                    fontSize={11}
                    tickMargin={8}
                  />
                  <YAxis
                    orientation="right"
                    tickLine={false}
                    axisLine={false}
                    stroke="#94a3b8"
                    fontSize={11}
                  />
                  <Tooltip
                    contentStyle={{
                      direction: 'rtl',
                      textAlign: 'right',
                      backgroundColor: '#1e293b',
                      borderRadius: '8px',
                      border: 'none',
                      color: '#fff'
                    }}
                    itemStyle={{ color: '#34d399' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="المبيعات اليومية"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorSales)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

      </div>

      {/* Account Balance Summaries (Suppliers & Buyers lists) */}
      {db.showWidgetActiveAccounts && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8" id="accounting_summaries_grid">

        {/* SUPPLIER SUMMARY CARD */}
        <div className="group card-3d rounded-2xl p-6 flex flex-col justify-between" id="suppliers_summary_card">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-500/10 text-amber-600 rounded-lg icon-bounce group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                  <Truck size={18} className="stroke-[1.8]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">حسابات الموردين (المشتريات)</h3>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">إجمالي الديون والذمم الدائنة المستحقة للموردين</p>
                </div>
              </div>
              <button
                id="goto_suppliers_tab_btn"
                onClick={() => onNavigateToTab('accounts')}
                className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:text-blue-700 transition-colors cursor-pointer interactive-tap px-2.5 py-1 bg-blue-50/50 hover:bg-blue-50 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg"
              >
                إدارة
              </button>
            </div>

            {/* Total Payables Indicator */}
            <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-xl" id="total_payables_indicator">
              <span className="text-xs text-slate-500 dark:text-slate-400 block">إجمالي الديون المستحقة للموردين علينا:</span>
              <span className="text-2xl font-bold text-amber-600 dark:text-amber-400 block tracking-tight font-mono mt-1 text-left" dir="ltr">
                {suppliersSum.totalPayables.toLocaleString('ar-SA')} {db.primaryCurrency || 'YER'}
              </span>
            </div>

            {/* Recent Purchases List */}
            <div className="space-y-3" id="recent_purchases_list">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block">أحدث فواتير المشتريات الآجلة:</span>
              {suppliersSum.recentPurchases.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center bg-slate-50 dark:bg-slate-800/30 rounded-xl">لا توجد حركات شراء حديثة</p>
              ) : (
                <div className="space-y-2">
                  {suppliersSum.recentPurchases.map((purchase) => (
                    <div
                      key={purchase.id}
                      className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors cursor-pointer"
                      onClick={() => {
                        const originalTx = db.transactions.find(tx => tx.id === purchase.id);
                        if (originalTx && onSelectAccount) {
                          onSelectAccount(originalTx.accountId);
                          onNavigateToTab('accounts');
                        }
                      }}
                    >
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">{purchase.accountName}</span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 block">{purchase.description} • {purchase.date}</span>
                      </div>
                      <span className="text-xs font-mono font-bold text-red-600 dark:text-red-400 text-left" dir="ltr">
                        +{purchase.amount.toLocaleString('ar-SA')} {db.primaryCurrency || 'YER'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* BUYER SUMMARY CARD */}
        <div className="group card-3d rounded-2xl p-6 flex flex-col justify-between" id="buyers_summary_card">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-lg icon-bounce group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                  <ShoppingBag size={18} className="stroke-[1.8]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">حسابات العملاء (المبيعات)</h3>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">إجمالي مستحقاتنا على المشترين والذمم المدينة لتسديدها</p>
                </div>
              </div>
              <button
                id="goto_buyers_tab_btn"
                onClick={() => onNavigateToTab('accounts')}
                className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:text-blue-700 transition-colors cursor-pointer interactive-tap px-2.5 py-1 bg-blue-50/50 hover:bg-blue-50 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg"
              >
                إدارة
              </button>
            </div>

            {/* Total Receivables Indicator */}
            <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl" id="total_receivables_indicator">
              <span className="text-xs text-slate-500 dark:text-slate-400 block">إجمالي أموالنا المستحقة في ذمة المشترين:</span>
              <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 block tracking-tight font-mono mt-1 text-left" dir="ltr">
                {buyersSum.totalReceivables.toLocaleString('ar-SA')} {db.primaryCurrency || 'YER'}
              </span>
            </div>

            {/* Recent Sales List */}
            <div className="space-y-3" id="recent_sales_list">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block">أحدث فواتير المبيعات الآجلة:</span>
              {buyersSum.recentSales.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center bg-slate-50 dark:bg-slate-800/30 rounded-xl">لا توجد حركات بيع حديثة</p>
              ) : (
                <div className="space-y-2">
                  {buyersSum.recentSales.map((sale) => (
                    <div
                      key={sale.id}
                      className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors cursor-pointer"
                      onClick={() => {
                        const originalTx = db.transactions.find(tx => tx.id === sale.id);
                        if (originalTx && onSelectAccount) {
                          onSelectAccount(originalTx.accountId);
                          onNavigateToTab('accounts');
                        }
                      }}
                    >
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">{sale.accountName}</span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 block">{sale.description} • {sale.date}</span>
                      </div>
                      <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 text-left" dir="ltr">
                        +{sale.amount.toLocaleString('ar-SA')} {db.primaryCurrency || 'YER'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
      )}

      {/* Alerts Widget */}
      {db.showWidgetAlerts && db.triggeredMessages.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-100/80 dark:border-slate-800/80 rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-500/10 text-blue-600 rounded-lg">
                <AlertCircle size={18} className="stroke-[1.8]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">سجل الإشعارات والتنبيهات الحديثة</h3>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">آخر رسائل الواتساب والـ SMS المرسلة للعملاء</p>
              </div>
            </div>
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
            {db.triggeredMessages.slice(0, 5).map((msg) => (
              <div key={msg.id} className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700/50 rounded-xl">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{msg.recipientName}</span>
                  <span className="text-[10px] text-slate-400 font-mono" dir="ltr">{new Date(msg.timestamp).toLocaleString()}</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{msg.text}</p>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">{msg.channel}</span>
                  <span className={`text-[10px] font-bold ${msg.status === 'success' ? 'text-emerald-500' : 'text-red-500'}`}>
                    {msg.status === 'success' ? '✓ مرسلة' : '✗ فشل'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
