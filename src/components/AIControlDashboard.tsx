import { apiUrl } from '../apiBase';
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import {
  Cpu,
  Sparkles,
  ListTodo,
  Send,
  CheckCircle,
  Settings,
  Palette,
  ShieldAlert,
  Loader2,
  HelpCircle,
  HelpCircleIcon,
  TrendingUp,
  CalendarDays,
  User as UserIcon,
  BellRing
} from "lucide-react";
import { Database } from "../utils";
import { Account, DailyLedgerEntry } from "../types";

function SalesPatternAnalyzer({ db }: { db: Database }) {
  const recommendations = useMemo(() => {
    // A buyer with a negative balance is a debtor.
    const customers = db.accounts.filter(a => a.type === 'buyer' && db.getAccountBalance(a.id) < 0);
    const recs: { account: Account; suggestion: string; daysUntil: number }[] = [];

    customers.forEach(customer => {
      // Find all payment entries from this customer (credit reduces debt)
      const payments = db.dailyEntries.filter(
        e => e.accountId === customer.id && e.transactionType === 'credit'
      ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      if (payments.length > 0) {
        // Simple analysis: finding average days between payments or most common day of month
        const daysOfMonth = payments.map(p => new Date(p.date).getDate());

        // Find most frequent payment day
        const dayCounts = daysOfMonth.reduce((acc, day) => {
          acc[day] = (acc[day] || 0) + 1;
          return acc;
        }, {} as Record<number, number>);

        let bestDay = 1;
        let maxCount = 0;
        for (const [day, count] of Object.entries(dayCounts)) {
          if (count > maxCount) {
            maxCount = count;
            bestDay = parseInt(day);
          }
        }

        const today = new Date();
        const currentDay = today.getDate();
        let daysUntil = bestDay - currentDay;

        if (daysUntil < 0) {
          // It's for next month
          const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
          daysUntil = daysInMonth - currentDay + bestDay;
        }

        let suggestion = '';
        if (daysUntil <= 3) {
          suggestion = `العميل يسدد عادة يوم ${bestDay} من الشهر. الوقت مثالي لإرسال عرض ترويجي الآن (متبقي ${daysUntil} يوم)!`;
        } else {
          suggestion = `العميل يسدد عادة يوم ${bestDay} من الشهر. يفضل إرسال العروض بعد ${daysUntil - 2} أيام.`;
        }

        recs.push({ account: customer, suggestion, daysUntil });
      }
    });

    return recs.sort((a, b) => a.daysUntil - b.daysUntil);
  }, [db.dailyEntries, db.accounts]);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100/90 dark:border-slate-800/80 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-5">
      <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800/50">
        <TrendingUp size={18} className="text-emerald-500" />
        <h3 className="text-sm font-black text-slate-800 dark:text-slate-100">تحليل أنماط المبيعات ومواعيد السداد الذكية</h3>
      </div>

      <p className="text-[11px] text-slate-500 dark:text-slate-400">
        يقوم محرك الذكاء الاصطناعي بتحليل التواريخ السابقة لسداد العملاء المدينين، ويقترح أفضل الأوقات لإرسال عروض ترويجية لتحفيزهم على السداد أو الشراء مجدداً.
      </p>

      {recommendations.length === 0 ? (
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/50 text-center">
          <p className="text-xs text-slate-500 font-bold">لا توجد بيانات كافية أو مدينون للتحليل حالياً.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recommendations.map((rec, idx) => (
            <div key={idx} className="bg-indigo-50/30 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 rounded-2xl p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <div className="bg-white dark:bg-slate-800 p-1.5 rounded-lg border border-slate-100 dark:border-slate-700">
                    <UserIcon size={14} className="text-slate-500" />
                  </div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{rec.account.name}</span>
                </div>
                <div className={`px-2 py-1 rounded-md text-[10px] font-bold flex items-center gap-1 ${
                  rec.daysUntil <= 3
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                    : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
                }`}>
                  <BellRing size={10} />
                  <span>{rec.daysUntil <= 3 ? 'وقت مثالي' : 'مجدول'}</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed bg-white/50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-white dark:border-slate-800">
                {rec.suggestion}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface AIControlDashboardProps {
  db: Database;
  onDatabaseUpdate: () => void;
  role: string;
}

export default function AIControlDashboard({ db, onDatabaseUpdate, role }: AIControlDashboardProps) {
  // Delegations state
  const [executiveMode, setExecutiveMode] = useState(true);
  const [delegateTheme, setDelegateTheme] = useState(true);
  const [delegateConstraints, setDelegateConstraints] = useState(true);
  const [delegateData, setDelegateData] = useState(true);

  // Command panel state
  const [userCommand, setUserCommand] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(
    "مرحباً بك! أنا المدير التنفيذي المدعم بالذكاء الاصطناعي لنظام ANAS المحاسبي المحمول. تم تفويضي بامتيازات التعديل الكاملة للمظهر والبيانات. اكتب طلبك هنا وسأقوم بمواءمة المظهر وتحديث الحسابات فوراً."
  );
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const sampleCommands = [
    "عدل مظهر وتصميم التطبيق ليكون بلون الزمرد الأخضر Emerald الفاخر وحواف دائرية أنيقة جداً ومريحة للعين مع أيقونة جوهرة كشعار",
    "تولى تصحيح وتنسيق أرقام الهواتف اليتيمة في الحسابات لتلتزم بالصيغة الدولية فتح الخط اليمني +967",
    "اضبط مظهر النظام ليكون باللون البرتقالي الدافئ Orange وحواف حادة كلاسيكية كالتطبيقات المكتبية المرموقة",
    "تأكد من أن جميع الحسابات تمتلك عمود عملة محدد ولا توجد حقول فارغة وهمية"
  ];

  const handleExecuteAICommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userCommand.trim() || isProcessing) return;

    setIsProcessing(true);
    setStatusMessage(null);
    setAiResponse(null);

    try {
      // Setup payload matching backend route requirements
      const response = await fetch(apiUrl("/api/ai-control"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: userCommand,
          currentTheme: {
            accentColor: db.appAccentColor || "blue",
            borderShape: db.appBorderShape || "rounded-2xl",
            brandIcon: db.appBrandIcon || "Building2"
          },
          database: {
            accounts: db.accounts,
            dailyEntries: db.dailyEntries
          }
        })
      });

      const resData = await response.json();
      if (!response.ok || !resData.success) {
        throw new Error(resData.error || "فشل الذكاء الاصطناعي في إتمام وتأويل الأمر.");
      }

      // Apply dynamic layout themes changes if returned
      if (resData.themeUpdated && delegateTheme) {
        if (resData.themeUpdated.accentColor) {
          db.appAccentColor = resData.themeUpdated.accentColor;
        }
        if (resData.themeUpdated.borderShape) {
          db.appBorderShape = resData.themeUpdated.borderShape;
        }
        if (resData.themeUpdated.brandIcon) {
          db.appBrandIcon = resData.themeUpdated.brandIcon;
        }
      }

      // Apply dynamic data updates if returned and permitted
      if (resData.databaseUpdated && delegateData) {
        if (resData.databaseUpdated.accounts && resData.databaseUpdated.accounts.length > 0) {
          db.accounts = resData.databaseUpdated.accounts;
        }
        if (resData.databaseUpdated.dailyEntries && resData.databaseUpdated.dailyEntries.length > 0) {
          db.dailyEntries = resData.databaseUpdated.dailyEntries;
        }
      }

      // Commit changes immediately and refresh parent UI state
      db.save();
      onDatabaseUpdate();

      setAiResponse(resData.responseText);
      setUserCommand("");
      setStatusMessage("تم تطبيق التعديلات المرئية وتحديث الحسابات بنجاح لحظياً!");

    } catch (err: any) {
      console.error(err);
      setAiResponse(`عذرًا، حدث خطأ أثناء تنفيذ الأمر الإداري: ${err.message || "خطأ اتصال"}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6" id="ai_dashboard_tab_parent">

      {/* Intro Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100/90 dark:border-slate-800/80 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col md:flex-row justify-between items-start md:items-center gap-6" id="ai_dashboard_header">
        <div className="space-y-1.5 text-right">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-505"></span>
            </span>
            <span className="p-1 px-2.5 bg-indigo-500/10 text-indigo-500 text-[10px] rounded-lg font-black border border-indigo-500/10 dark:border-indigo-500/20 uppercase tracking-widest">إدارة متطورة</span>
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-1.5">
            <Cpu size={19} className="text-indigo-600 dark:text-indigo-400" />
            <span>لوحة تفويض وذكاء النظام AI Control Dashboard</span>
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
            هنا يمكنك تفعيل نموذج المدير التنفيذي وتفويض الصلاحيات الكاملة للذكاء الاصطناعي للتحكم بمظهر التطبيق، وتنسيق كشوف الحسابات ومراجعتها آلياً وتعديل الأيقونات دون الحاجة لتدخلك البرمجي المباشر.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="ai_content_grid">

        {/* RIGHT BOX: Delegations Settings (4 Slots) */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-100/90 dark:border-slate-800/80 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-6" id="ai_delegations_config">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800/50">
            <Settings size={16} className="text-indigo-600" />
            <span className="text-xs font-black text-slate-800 dark:text-slate-100">وثيقة تفويض صلاحيات المدير</span>
          </div>

          {/* Master mode Switch */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-stone-700 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-900 dark:text-white">تفويض المدير التنفيذي الذكي</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={executiveMode}
                  onChange={(e) => setExecutiveMode(e.target.checked)}
                />
                <div className="w-9 h-5 bg-slate-200 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-600"></div>
              </label>
            </div>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              عند إيقاف هذا الخيار، سيتم سحب الصلاحيات من محرك الـ AI بالكامل وتحويل التطبيق للوضع اليدوي التقليدي.
            </p>
          </div>

          {/* Individual toggles */}
          <div className="space-y-4">
            <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">بنود وصلاحيات التفويض الفردية:</span>

            {/* 1. Theme Control */}
            <div className="flex items-start justify-between p-3.5 bg-slate-50/40 dark:bg-slate-800/20 rounded-xl border border-slate-200/40 dark:border-slate-800/40">
              <div className="text-right ml-2 space-y-0.5">
                <span className="text-xs font-black text-slate-800 dark:text-slate-200 block">إدارة وتعديل السمة والمطهر</span>
                <span className="text-[9px] text-slate-400 block">يسمح لـ AI باختيار ألوان النوافذ، الأيقونات وشحنة الانحدار المرئي.</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer mt-1">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  disabled={!executiveMode}
                  checked={delegateTheme}
                  onChange={(e) => setDelegateTheme(e.target.checked)}
                />
                <div className="w-8 h-4 bg-slate-200 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            {/* 2. Data Optimization */}
            <div className="flex items-start justify-between p-3.5 bg-slate-50/40 dark:bg-slate-800/20 rounded-xl border border-slate-200/40 dark:border-slate-800/40">
              <div className="text-right ml-2 space-y-0.5">
                <span className="text-xs font-black text-slate-800 dark:text-slate-200 block">تنظيف وحراسة الحسابات والجداول</span>
                <span className="text-[9px] text-slate-400 block">يسمح لـ AI بإعادة تنسيق القيود وتصحيح الحقول والمخرجات آلياً لسلامة الكشوفات.</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer mt-1">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  disabled={!executiveMode}
                  checked={delegateData}
                  onChange={(e) => setDelegateData(e.target.checked)}
                />
                <div className="w-8 h-4 bg-slate-200 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            {/* 3. Safety Limits & Constraints */}
            <div className="flex items-start justify-between p-3.5 bg-slate-50/40 dark:bg-slate-800/20 rounded-xl border border-slate-200/40 dark:border-slate-800/40">
              <div className="text-right ml-2 space-y-0.5">
                <span className="text-xs font-black text-slate-800 dark:text-slate-200 block">ضبط القيود الائتمانية والعملات</span>
                <span className="text-[9px] text-slate-400 block">يسمح لـ AI بتقنين سقف ائتماني و تجميد العملاء المتخلفين عن السداد تلقائياً.</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer mt-1">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  disabled={!executiveMode}
                  checked={delegateConstraints}
                  onChange={(e) => setDelegateConstraints(e.target.checked)}
                />
                <div className="w-8 h-4 bg-slate-200 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>
          </div>

          <div className="bg-amber-50/45 dark:bg-amber-950/10 border border-amber-500/10 p-4 rounded-2xl flex gap-3 text-right text-amber-800 dark:text-amber-400 font-medium">
            <ShieldAlert size={18} className="shrink-0 mt-0.5" />
            <span className="text-[10px] leading-relaxed">
              انتبه: التعديل الذي يقوم به المدير التنفيذي للذكاء الاصطناعي يسري مفعوله فورياً على التخزين المحلي والنسخ الاحتياطي في حال تشغيل بوابة المزامنة الجوية.
            </span>
          </div>
        </div>

        {/* LEFT BOX: Interactive Command Center Prompt (8 slots) */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-100/95 dark:border-slate-800/80 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-6 flex flex-col" id="ai_command_panel">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800/50 justify-between">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-indigo-600" />
              <span className="text-xs font-black text-slate-800 dark:text-slate-100">بوابة التوجيهات والأوامر التنفيذية الفورية</span>
            </div>
            <span className="text-[10px] font-bold text-slate-400 bg-slate-50 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-100 dark:border-stone-700">
              Gemini 3.5 Flash
            </span>
          </div>

          {/* Prompt text area Form */}
          <form onSubmit={handleExecuteAICommand} className="space-y-4">
            <div className="relative">
              <textarea
                disabled={!executiveMode || isProcessing}
                value={userCommand}
                onChange={(e) => setUserCommand(e.target.value)}
                placeholder="اكتب توجيهاتك هنا... (مثال: 'اجعل المظهر باللون الذهبي الدافئ' أو 'أريد تعديل أسماء الحسابات لتزيل المسافات المكررة')"
                className="w-full h-28 bg-slate-50 border border-slate-200 rounded-2xl p-4 pr-4 pl-12 text-xs text-right text-slate-800 dark:bg-slate-950 dark:border-slate-800 dark:text-white dark:placeholder-slate-600 focus:outline-hidden focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-800 resize-none leading-relaxed"
              ></textarea>
              <button
                type="submit"
                disabled={!executiveMode || isProcessing || !userCommand.trim()}
                className="absolute left-3.5 bottom-4 p-2.5 bg-indigo-600 hover:bg-indigo-700 transition-colors text-white rounded-xl cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                title="إرسال التوجيه للتنفيذ"
              >
                {isProcessing ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
              </button>
            </div>
          </form>

          {/* AI Response Display Block */}
          <div className="flex-1 flex flex-col justify-start rounded-2xl bg-indigo-50/20 dark:bg-indigo-950/25 border border-indigo-500/10 p-5 space-y-4" id="ai_response_box">
            <div className="flex items-center gap-1.5 pb-2 border-b border-indigo-500/10">
              <Cpu size={14} className="text-indigo-500 shrink-0" />
              <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
                بروتوكول واستجابة الاستشارة الذكية (Executive Decision Output):
              </span>
            </div>

            {isProcessing ? (
              <div className="flex flex-col items-center justify-center py-6 gap-3 text-slate-400" id="ai_processing_output">
                <Loader2 size={24} className="animate-spin text-indigo-500" />
                <span className="text-[11px] font-black animate-pulse">جاري الاستدعاء ومزامنة التغييرات وحفظ الجداول...</span>
              </div>
            ) : (
              <div className="space-y-4">
                {aiResponse && (
                  <p className="text-xs text-slate-700 dark:text-slate-400 leading-relaxed text-right font-medium">
                    {aiResponse}
                  </p>
                )}
                {statusMessage && (
                  <div className="flex items-center gap-1.5 text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-500/10 px-3 py-2 rounded-xl">
                    <CheckCircle size={12} />
                    <span>{statusMessage}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick recommendations / templates */}
          <div className="space-y-2.5" id="ai_quick_pills">
            <div className="flex items-center gap-1.5">
              <HelpCircle size={13} className="text-slate-500" />
              <span className="text-[10px] font-extrabold text-slate-400 block">أوامر وتوجيهات مقترحة للتجربة الحرة:</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {sampleCommands.map((cmd, idx) => (
                <button
                  key={idx}
                  type="button"
                  disabled={!executiveMode || isProcessing}
                  onClick={() => setUserCommand(cmd)}
                  className="p-3 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl text-[10px] leading-relaxed text-right font-bold transition-all border border-slate-200/40 dark:bg-slate-950 dark:hover:bg-slate-800 dark:text-slate-400 dark:border-slate-800 max-h-16 overflow-hidden cursor-pointer select-none"
                >
                  {cmd}
                </button>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* Sales Pattern Analyzer Component */}
      <SalesPatternAnalyzer db={db} />

    </div>
  );
}
