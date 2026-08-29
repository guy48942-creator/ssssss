import { apiUrl } from '../apiBase';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bot, Mic, MicOff, Volume2, VolumeX, Send, X, Sparkles, Navigation,
  Loader2, MessageCircle, ChevronDown
} from 'lucide-react';
import { Database } from '../utils';
import { UserRole } from '../types';

type Props = {
  db: Database;
  role: UserRole;
  onNavigate: (tab: string) => void;
};

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  time: string;
};

const TAB_LABELS: Record<string, string> = {
  dashboard: 'لوحة التحكم',
  accounts: 'الحسابات والعملاء',
  ledger: 'دفتر القيود',
  invoice: 'الفواتير',
  reports: 'التقارير',
  'ai-control': 'تحكم الذكاء الاصطناعي',
  'sync-import': 'المزامنة والاستيراد',
  recycle: 'سلة المحذوفات',
  'activity-log': 'سجل العمليات',
  gateway: 'الإعدادات والبوابة',
  backup: 'النسخ الاحتياطي'
};

function buildSiteContext(db: Database, role: UserRole) {
  const activeAccounts = db.accounts.filter(a => a.status !== 'closed' && !a.deletedAt);
  const suppliers = activeAccounts.filter(a => a.type === 'supplier');
  const buyers = activeAccounts.filter(a => a.type === 'buyer');

  const accountBalances = activeAccounts.map(a => {
    const txs = db.transactions.filter(t => t.accountId === a.id && !t.deletedAt);
    const balance = a.openingBalance + txs.reduce((sum, t) => sum + (t.type === 'debit' ? t.amount : -t.amount), 0);
    return { name: a.name, type: a.type, currency: a.currency || 'YER', balance };
  }).slice(0, 80);

  const recentTransactions = db.transactions
    .filter(t => !t.deletedAt)
    .slice(-30)
    .map(t => ({
      date: t.date,
      description: t.description,
      type: t.type,
      amount: t.amount,
      currency: t.currency || 'YER'
    }));

  const recentInvoices = db.invoices
    .slice(-20)
    .map(i => ({
      number: i.invoiceNumber,
      date: i.date,
      total: i.total,
      currency: i.currency,
      type: i.type || 'sale'
    }));

  return {
    app: 'نظام ANAS المحاسبي المطور',
    role,
    language: 'ar',
    capabilities: [
      'لوحة تحكم ومؤشرات مالية',
      'إدارة العملاء والموردين والحسابات',
      'دفتر القيود والمعاملات اليومية',
      'فواتير المبيعات والمشتريات',
      'تقارير مالية',
      'تحكم ومساعدة بالذكاء الاصطناعي',
      'استيراد ومزامنة ونسخ احتياطي',
      'سلة محذوفات وسجل عمليات',
      'بوابة إعدادات ومراسلات',
      'آلة حاسبة وإدخال سريع',
      'PWA والعمل دون اتصال والمزامنة السحابية عند تسجيل الدخول'
    ],
    theme: {
      accentColor: db.appAccentColor,
      borderShape: db.appBorderShape,
      brandIcon: db.appBrandIcon,
      primaryCurrency: db.primaryCurrency
    },
    stats: {
      accounts: activeAccounts.length,
      suppliers: suppliers.length,
      buyers: buyers.length,
      transactions: db.transactions.filter(t => !t.deletedAt).length,
      dailyEntries: db.dailyEntries.filter(e => !e.deletedAt).length,
      invoices: db.invoices.length
    },
    accountBalances,
    recentTransactions,
    recentInvoices
  };
}

export default function AIVoiceAssistant({ db, role, onNavigate }: Props) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [error, setError] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'مرحباً. أنا مساعد ANAS الذكي. أستطيع فهم بنية النظام وبياناته الحالية، الإجابة عن أسئلتك، إرشادك داخل الأقسام، والتحدث معك صوتياً.',
      time: new Date().toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const recognitionRef = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const supportedVoice = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, busy]);

  useEffect(() => {
    if (!open) return;
    setTimeout(() => inputRef.current?.focus(), 80);
  }, [open]);

  useEffect(() => () => {
    try { recognitionRef.current?.stop(); } catch {}
    window.speechSynthesis?.cancel();
  }, []);

  const speak = (text: string) => {
    if (!voiceEnabled || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text.replace(/[*_#`]/g, ''));
    utterance.lang = 'ar-SA';
    utterance.rate = 0.95;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  };

  const startListening = () => {
    if (!supportedVoice) {
      setError('المتصفح الحالي لا يدعم التعرف على الصوت. جرّب Chrome على Android أو سطح المكتب.');
      return;
    }
    setError('');
    try { recognitionRef.current?.stop(); } catch {}
    const Recognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new Recognition();
    recognition.lang = 'ar-SA';
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => setListening(true);
    recognition.onresult = (event: any) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0]?.transcript || '';
      }
      setInput(transcript.trim());
    };
    recognition.onerror = (event: any) => {
      setListening(false);
      setError(event?.error === 'not-allowed'
        ? 'يرجى السماح للموقع باستخدام الميكروفون.'
        : 'تعذر التقاط الصوت. حاول مرة أخرى.');
    };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopListening = () => {
    try { recognitionRef.current?.stop(); } catch {}
    setListening(false);
  };

  const navigateFromAction = (target?: string) => {
    if (target && TAB_LABELS[target]) onNavigate(target);
  };

  const send = async (textOverride?: string) => {
    const text = (textOverride ?? input).trim();
    if (!text || busy) return;
    setInput('');
    setError('');
    setBusy(true);

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      text,
      time: new Date().toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      const history = [...messages, userMessage].slice(-12).map(m => ({
        role: m.role,
        text: m.text
      }));
      const response = await fetch(apiUrl('/api/ai-chat'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history,
          siteContext: buildSiteContext(db, role)
        })
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'تعذر الاتصال بمساعد الذكاء الاصطناعي.');

      const answer = String(data.responseText || 'لم أتمكن من تكوين إجابة.');
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'assistant',
        text: answer,
        time: new Date().toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' })
      }]);
      navigateFromAction(data.action?.targetTab);
      speak(answer);
    } catch (e: any) {
      setError(e?.message || 'حدث خطأ غير متوقع.');
    } finally {
      setBusy(false);
    }
  };

  const quickPrompts = [
    'ما وضع النظام والحسابات الآن؟',
    'افتح قسم الفواتير',
    'ما أهم الأرصدة التي تحتاج متابعة؟',
    'اشرح لي كيف أستخدم دفتر القيود'
  ];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-24 left-6 z-40 w-14 h-14 rounded-2xl bg-slate-950 text-white shadow-2xl border border-white/10 flex items-center justify-center hover:scale-105 active:scale-95 transition-all no-print"
        title="مساعد ANAS الصوتي"
        aria-label="فتح مساعد ANAS الصوتي"
      >
        <span className="absolute inset-0 rounded-2xl bg-indigo-500/20 animate-pulse" />
        <Bot size={25} className="relative" />
        <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-950" />
      </button>

      {open && (
        <div className="fixed inset-0 z-[120] bg-slate-950/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-5 no-print" dir="rtl">
          <div className={`w-full ${expanded ? 'max-w-5xl' : 'max-w-2xl'} h-[92vh] sm:h-[min(760px,90vh)] bg-white dark:bg-slate-950 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col`}>
            <header className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg">
                <Sparkles size={21} />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-black text-slate-900 dark:text-white">ANAS AI Voice</h2>
                <p className="text-[10px] text-slate-400">يفهم أقسام النظام وملخص بياناتك الحالية</p>
              </div>
              <button onClick={() => setExpanded(v => !v)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800" title="توسيع">
                <ChevronDown size={18} className={expanded ? 'rotate-180' : ''} />
              </button>
              <button onClick={() => { setOpen(false); window.speechSynthesis?.cancel(); }} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800" title="إغلاق">
                <X size={18} />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/70 dark:bg-slate-900/50">
              {messages.map(m => (
                <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[88%] rounded-2xl px-4 py-3 ${m.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-tr-md'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-slate-800 rounded-tl-md shadow-sm'}`}>
                    <div className="text-sm whitespace-pre-wrap leading-7">{m.text}</div>
                    <div className={`text-[9px] mt-1 ${m.role === 'user' ? 'text-white/60' : 'text-slate-400'}`}>{m.time}</div>
                  </div>
                </div>
              ))}
              {busy && (
                <div className="flex justify-end">
                  <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl px-4 py-3 flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin text-indigo-600" />
                    <span className="text-xs text-slate-400">أحلل طلبك وبيانات النظام…</span>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            <div className="p-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
              {messages.length <= 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {quickPrompts.map(prompt => (
                    <button key={prompt} onClick={() => send(prompt)} disabled={busy}
                      className="shrink-0 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
                      {prompt}
                    </button>
                  ))}
                </div>
              )}

              {error && <div className="text-xs text-red-500 px-2">{error}</div>}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={listening ? stopListening : startListening}
                  className={`shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${listening ? 'bg-red-500 text-white animate-pulse' : 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600'}`}
                  title={listening ? 'إيقاف الاستماع' : 'التحدث مع المساعد'}
                >
                  {listening ? <MicOff size={19} /> : <Mic size={19} />}
                </button>
                <input
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') send(); }}
                  placeholder="اكتب أو تحدث… مثال: افتح التقارير"
                  className="flex-1 min-w-0 h-11 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
                <button
                  type="button"
                  onClick={() => { setVoiceEnabled(v => !v); if (voiceEnabled) window.speechSynthesis?.cancel(); }}
                  className="w-11 h-11 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center"
                  title={voiceEnabled ? 'إيقاف نطق الردود' : 'تفعيل نطق الردود'}
                >
                  {voiceEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
                </button>
                <button
                  type="button"
                  onClick={() => send()}
                  disabled={!input.trim() || busy}
                  className="w-11 h-11 rounded-2xl bg-indigo-600 disabled:opacity-40 text-white flex items-center justify-center shadow-lg"
                  title="إرسال"
                >
                  <Send size={18} />
                </button>
              </div>

              <div className="flex items-center justify-between text-[9px] text-slate-400 px-1">
                <span className="flex items-center gap-1"><MessageCircle size={11} /> محادثة نصية + صوتية</span>
                <span className="flex items-center gap-1"><Navigation size={11} /> يمكنه إرشادك للأقسام</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
