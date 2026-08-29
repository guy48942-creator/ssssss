/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Database } from '../utils';
import { UserRole } from '../types';
import { initAuth, googleSignIn, getAccessToken, logout } from '../auth';
import type { User } from 'firebase/auth';
import {
  Settings2,
  Send,
  CheckCircle2,
  AlertCircle,
  Wifi,
  Clock,
  Trash2,
  Key,
  Globe,
  MessageSquare,
  Sparkles,
  Lock,
  Palette,
  Download,
  Cloud,
  Eye,
  EyeOff,
  Printer,
  FileText
} from 'lucide-react';

interface GatewayTabProps {
  db: Database;
  onDatabaseUpdate: () => void;
  role?: UserRole;
}

export default function GatewayTab({ db, onDatabaseUpdate, role }: GatewayTabProps) {
  // Check if modification is restricted to Admin
  const isModificationRestricted = db.restrictToAdmin && role !== 'Admin';

  // Toggle state to hide/reveal gateway API keys and URLs
  const [showSensitiveData, setShowSensitiveData] = useState(false);

  // Config state
  const [whatsappEnabled, setWhatsappEnabled] = useState(db.gatewayConfig.whatsappEnabled);
  const [smsEnabled, setSmsEnabled] = useState(db.gatewayConfig.smsEnabled);
  const [whatsappApiKey, setWhatsappApiKey] = useState(db.gatewayConfig.whatsappApiKey);
  const [smsApiKey, setSmsApiKey] = useState(db.gatewayConfig.smsApiKey);
  const [senderName, setSenderName] = useState(db.gatewayConfig.senderName);
  const [whatsappGatewayUrl, setWhatsappGatewayUrl] = useState(db.gatewayConfig.whatsappGatewayUrl);
  const [smsGatewayUrl, setSmsGatewayUrl] = useState(db.gatewayConfig.smsGatewayUrl);
  const [defaultExchangeRate, setDefaultExchangeRate] = useState(db.gatewayConfig.defaultExchangeRate || 1.0);

  // Theme & Appearance States
  const [appAccentColor, setAppAccentColor] = useState(db.appAccentColor || 'blue');
  const [appBorderShape, setAppBorderShape] = useState(db.appBorderShape || 'rounded-2xl');
  const [appBrandIcon, setAppBrandIcon] = useState(db.appBrandIcon || 'Building2');
  const [appBackgroundImage, setAppBackgroundImage] = useState(db.appBackgroundImage || '');
  const [appBackgroundOpacity, setAppBackgroundOpacity] = useState(db.appBackgroundOpacity || 5);
  const [restrictToAdminState, setRestrictToAdminState] = useState(db.restrictToAdmin);

  // PIN Lock Code state
  const [appPinCode, setAppPinCode] = useState(localStorage.getItem('smartacc_app_pin') || '');

  // Print & PDF Customizable states
  const [printCompanyName, setPrintCompanyName] = useState(db.printCompanyName);
  const [printPhone, setPrintPhone] = useState(db.printPhone);
  const [printAddress, setPrintAddress] = useState(db.printAddress);
  const [printTaxNumber, setPrintTaxNumber] = useState(db.printTaxNumber);
  const [printHeaderNote, setPrintHeaderNote] = useState(db.printHeaderNote);
  const [printFooterNote, setPrintFooterNote] = useState(db.printFooterNote);
  const [printThemeColor, setPrintThemeColor] = useState(db.printThemeColor);
  const [printShowBalance, setPrintShowBalance] = useState(db.printShowBalance);
  const [printShowSignature, setPrintShowSignature] = useState(db.printShowSignature);
  const [printShowWatermark, setPrintShowWatermark] = useState(db.printShowWatermark);
  const [printPaperSize, setPrintPaperSize] = useState(db.printPaperSize);
  const [printCompanyLogo, setPrintCompanyLogo] = useState(db.printCompanyLogo || '');
  const [cameraActive, setCameraActive] = useState(false);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [videoStream]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 300, height: 300 } });
      setVideoStream(stream);
      setCameraActive(true);
      setTimeout(() => {
        const videoEl = document.getElementById('logo_webcam_preview') as HTMLVideoElement;
        if (videoEl) {
          videoEl.srcObject = stream;
          videoEl.play().catch(err => console.error('Play video error:', err));
        }
      }, 200);
    } catch (err) {
      alert('تعذر الوصول إلى الكاميرا. يرجى التحقق من إعطاء الصلاحيات اللاحة للوصول في المتصفح.');
      console.error(err);
    }
  };

  const stopCamera = () => {
    if (videoStream) {
      videoStream.getTracks().forEach(track => track.stop());
      setVideoStream(null);
    }
    setCameraActive(false);
  };

  const capturePhoto = () => {
    const videoEl = document.getElementById('logo_webcam_preview') as HTMLVideoElement;
    if (videoEl) {
      const canvas = document.createElement('canvas');
      canvas.width = videoEl.videoWidth || 300;
      canvas.height = videoEl.videoHeight || 300;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/png');
        setPrintCompanyLogo(dataUrl);
        stopCamera();
      }
    }
  };

  // Dashboard Widget Toggles
  const [showWidgetTotalSales, setShowWidgetTotalSales] = useState(db.showWidgetTotalSales ?? true);
  const [showWidgetActiveAccounts, setShowWidgetActiveAccounts] = useState(db.showWidgetActiveAccounts ?? true);
  const [showWidgetAlerts, setShowWidgetAlerts] = useState(db.showWidgetAlerts ?? true);

  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Backup file state
  const [lastBackup, setLastBackup] = useState<string | null>(() => {
    return localStorage.getItem('smartacc_last_backup_date');
  });
  const [backupSuccess, setBackupSuccess] = useState(false);

  // Drive integration state
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isDriveUploading, setIsDriveUploading] = useState(false);
  const [driveUploadSuccess, setDriveUploadSuccess] = useState(false);

  useEffect(() => {
    const unsubscribe = initAuth(
      (u, t) => {
        setUser(u);
        setToken(t);
      },
      () => {
        setUser(null);
        setToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleDriveLogin = async () => {
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setToken(result.accessToken);
      }
    } catch (err) {
      console.error('Failed to log in to Google Drive:', err);
    }
  };

  const handleDriveLogout = async () => {
    try {
      await logout();
      setUser(null);
      setToken(null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveToDrive = async () => {
    if (isModificationRestricted) {
      alert('خطأ: تصدير النسخة الاحتياطية مقيد لمدير النظام فقط.');
      return;
    }

    if (!token) {
      alert('يرجى تسجيل الدخول أولاً لربط المساحة السحابية.');
      return;
    }

    setIsDriveUploading(true);
    try {
      const backupData = {
        accounts: db.accounts,
        transactions: db.transactions,
        dailyEntries: db.dailyEntries,
        gatewayConfig: db.gatewayConfig,
        triggeredMessages: db.triggeredMessages,
        primaryCurrency: db.primaryCurrency,
        exchangeRates: db.exchangeRates,
        appAccentColor: db.appAccentColor,
        appBorderShape: db.appBorderShape,
        appBrandIcon: db.appBrandIcon,
        restrictToAdmin: db.restrictToAdmin,
        backupVersion: 1.0,
        exportedAt: new Date().toISOString()
      };

      const jsonString = JSON.stringify(backupData, null, 2);

      const todayStr = new Date().toISOString().split('T')[0];
      const filename = `daftarplay_backup_${todayStr}.json`;

      const metadata = {
        name: filename,
        mimeType: 'application/json',
      };

      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', new Blob([jsonString], { type: 'application/json' }));

      const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: form
      });

      if (!response.ok) {
        throw new Error('Google API Error: ' + response.statusText);
      }

      const nowStr = new Date().toLocaleString('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      localStorage.setItem('smartacc_last_backup_date', nowStr);
      setLastBackup(nowStr);
      setDriveUploadSuccess(true);
      setTimeout(() => setDriveUploadSuccess(false), 4000);
    } catch (e) {
      console.error('فشل الرفع للسحابة:', e);
      alert('فشل الرفع للسحابة. قد تكون المشكلة في الاتصال بالإنترنت.');
    } finally {
      setIsDriveUploading(false);
    }
  };

  const handleCreateBackup = () => {
    if (isModificationRestricted) {
      alert('خطأ: تصدير النسخة الاحتياطية مقيد لمدير النظام فقط.');
      return;
    }
    try {
      const backupData = {
        accounts: db.accounts,
        transactions: db.transactions,
        dailyEntries: db.dailyEntries,
        gatewayConfig: db.gatewayConfig,
        triggeredMessages: db.triggeredMessages,
        primaryCurrency: db.primaryCurrency,
        exchangeRates: db.exchangeRates,
        appAccentColor: db.appAccentColor,
        appBorderShape: db.appBorderShape,
        appBrandIcon: db.appBrandIcon,
        restrictToAdmin: db.restrictToAdmin,
        backupVersion: 1.0,
        exportedAt: new Date().toISOString()
      };

      const jsonString = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const downloadAnchor = document.createElement('a');
      downloadAnchor.href = url;

      const todayStr = new Date().toISOString().split('T')[0];
      downloadAnchor.download = `daftarplay_backup_${todayStr}.json`;
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      document.body.removeChild(downloadAnchor);
      URL.revokeObjectURL(url);

      const nowStr = new Date().toLocaleString('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      localStorage.setItem('smartacc_last_backup_date', nowStr);
      setLastBackup(nowStr);
      setBackupSuccess(true);
      setTimeout(() => setBackupSuccess(false), 4000);
    } catch (e) {
      console.error('فشل تصدير النسخة الاحتياطية:', e);
    }
  };

  // Save Settings
  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (isModificationRestricted) {
      alert('خطأ: تعديل المظهر والوصول للبرنامج مقيد لمدير النظام فقط.');
      return;
    }

    db.gatewayConfig = {
      whatsappEnabled,
      smsEnabled,
      whatsappApiKey,
      smsApiKey,
      senderName,
      whatsappGatewayUrl,
      smsGatewayUrl,
      defaultExchangeRate
    };

    db.appAccentColor = appAccentColor;
    db.appBorderShape = appBorderShape;
    db.appBrandIcon = appBrandIcon;
    db.appBackgroundImage = appBackgroundImage;
    db.appBackgroundOpacity = Number(appBackgroundOpacity);
    db.restrictToAdmin = restrictToAdminState;

    if (appPinCode) {
      localStorage.setItem('smartacc_app_pin', appPinCode);
    } else {
      localStorage.removeItem('smartacc_app_pin');
    }

    // Save PDF Printable customizations
    db.printCompanyName = printCompanyName;
    db.printPhone = printPhone;
    db.printAddress = printAddress;
    db.printTaxNumber = printTaxNumber;
    db.printHeaderNote = printHeaderNote;
    db.printFooterNote = printFooterNote;
    db.printThemeColor = printThemeColor;
    db.printShowBalance = printShowBalance;
    db.printShowSignature = printShowSignature;
    db.printShowWatermark = printShowWatermark;
    db.printPaperSize = printPaperSize;
    db.printCompanyLogo = printCompanyLogo;

    db.showWidgetTotalSales = showWidgetTotalSales;
    db.showWidgetActiveAccounts = showWidgetActiveAccounts;
    db.showWidgetAlerts = showWidgetAlerts;

    db.save();
    onDatabaseUpdate();

    setAlertMsg({
      type: 'success',
      text: 'تم حفظ هوية ومظهر البرنامج بنجاح.'
    });
    setTimeout(() => setAlertMsg(null), 4000);
  };

  return (
    <div className="space-y-8" id="gateway_tab_container">

      {/* Alert banner */}
      {alertMsg && (
        <div
          id="gateway_alert_banner"
          className={`p-4 rounded-xl flex items-center gap-3 text-xs font-bold transition-all ${
            alertMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900'
              : 'bg-red-50 text-red-800 border border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900'
          }`}
        >
          {alertMsg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{alertMsg.text}</span>
        </div>
      )}

      {/* Main split grid */}
      <div className="grid grid-cols-1 gap-8" id="gateway_grid_layout">

        {/* Gateway settings controls */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6" id="gateway_settings_panel">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Settings2 size={18} className="text-blue-500" />
              <span>الإعدادات والمظهر</span>
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              قم بتهيئة الألوان والزوايا والأيقونات الخاصة بالنظام.
            </p>
          </div>

          {isModificationRestricted && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30 rounded-xl text-xs font-bold leading-relaxed shadow-xs">
              <Lock size={15} className="text-red-500 shrink-0" />
              <span>سياسة الحماية نشطة: تم تقييد تهيئة بوابات الربط وحفظ المفاتيح لمدير النظام فقط.</span>
            </div>
          )}

          <form onSubmit={handleSaveConfig} className="space-y-6 text-right border-t border-slate-50 dark:border-slate-800/50 pt-5">

            {/* Control toggles */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {/* WhatsApp Toggle */}
              <div className="p-4 border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/30 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200 block">بوابة WhatsApp الفورية</span>
                  <input
                    id="whatsapp_enabled_toggle"
                    type="checkbox"
                    disabled={isModificationRestricted}
                    checked={whatsappEnabled}
                    onChange={(e) => setWhatsappEnabled(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                  />
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  تفعيل الإرسال التلقائي لإشعار الحركة المالية وتحديثات الأرصدة عبر شبكة WhatsApp للعملاء مباشرة.
                </p>
              </div>

              {/* SMS Toggle */}
              <div className="p-4 border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/30 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200 block">بوابة الرسائل النصية القصيرة SMS</span>
                  <input
                    id="sms_enabled_toggle"
                    type="checkbox"
                    disabled={isModificationRestricted}
                    checked={smsEnabled}
                    onChange={(e) => setSmsEnabled(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                  />
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  إرسال الرسائل النصية المباشرة للهواتف لغير مستخدمي تطبيق WhatsApp بموجب اشتراك باقتك.
                </p>
              </div>

              {/* Default Exchange Rate */}
              <div className="p-4 border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/30 space-y-3">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block">سعر الصرف الافتراضي</label>
                <input
                    type="number"
                    step="any"
                    disabled={isModificationRestricted}
                    value={defaultExchangeRate}
                    onChange={(e) => setDefaultExchangeRate(Number(e.target.value))}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-100 font-mono text-left"
                    dir="ltr"
                />
              </div>
            </div>

            {/* Config Fields */}
            <div className="space-y-4">

              {/* Sender Name */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block">اسم المرسل المعرف للتنبيهات (SMS Sender ID)</label>
                <input
                  id="sender_name_input"
                  type="text"
                  required
                  disabled={isModificationRestricted}
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="SmartAcc_Alert"
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-100 font-mono text-left"
                  dir="ltr"
                />
              </div>

              {/* Privacy and Data Protection Toggle Bar */}
              <div className="flex justify-between items-center bg-indigo-50/10 dark:bg-indigo-950/10 p-3.5 rounded-2xl border border-indigo-500/10 mb-2">
                <div className="text-right space-y-0.5">
                  <span className="text-xs font-black text-slate-800 dark:text-slate-200 block">بروتوكول حماية مفاتيح وروابط الربط</span>
                  <span className="text-[10px] text-slate-400 block">إخفاء الروابط وسلاسل الاتصال السرية عن الشاشة لمنع تسرب البيانات.</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSensitiveData(!showSensitiveData)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 transition-all cursor-pointer shadow-xs"
                >
                  {showSensitiveData ? <EyeOff size={14} className="text-rose-500" /> : <Eye size={14} className="text-indigo-500" />}
                  <span>{showSensitiveData ? "إخفاء الروابط والمفاتيح" : "إظهار المفاتيح والروابط"}</span>
                </button>
              </div>

              {/* WhatsApp Config Area */}
              <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4 space-y-4">
                <h4 className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                  <Key size={13} />
                  <span>إعدادات مفاتيح ورابط بوابة WhatsApp</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-500 dark:text-slate-400 block font-bold">رابط واجهة الإرسال (API Gateway URL)</label>
                    <input
                      id="wa_gateway_url_input"
                      type={showSensitiveData ? "url" : "password"}
                      required
                      disabled={isModificationRestricted}
                      value={whatsappGatewayUrl}
                      onChange={(e) => setWhatsappGatewayUrl(e.target.value)}
                      className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-xl px-3 py-2.5 text-slate-800 dark:text-slate-100 font-mono text-left"
                      dir="ltr"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-500 dark:text-slate-400 block font-bold">مفتاح المصادقة السري (Bearer API Token)</label>
                    <input
                      id="wa_api_key_input"
                      type={showSensitiveData ? "text" : "password"}
                      required
                      disabled={isModificationRestricted}
                      value={whatsappApiKey}
                      onChange={(e) => setWhatsappApiKey(e.target.value)}
                      className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-xl px-3 py-2.5 text-slate-800 dark:text-slate-100 font-mono text-left"
                      dir="ltr"
                    />
                  </div>
                </div>
              </div>

              {/* SMS Config Area */}
              <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4 space-y-4">
                <h4 className="text-xs font-bold text-amber-500 dark:text-amber-400 flex items-center gap-1">
                  <Key size={13} />
                  <span>إعدادات مفاتيح ورابط بوابة SMS</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-500 dark:text-slate-400 block font-bold">رابط واجهة الإرسال لـ SMS</label>
                    <input
                      id="sms_gateway_url_input"
                      type={showSensitiveData ? "url" : "password"}
                      required
                      disabled={isModificationRestricted}
                      value={smsGatewayUrl}
                      onChange={(e) => setSmsGatewayUrl(e.target.value)}
                      className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-xl px-3 py-2.5 text-slate-800 dark:text-slate-100 font-mono text-left"
                      dir="ltr"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-500 dark:text-slate-400 block font-bold">مفتاح المصادقة والحساب (API Secret Token)</label>
                    <input
                      id="sms_api_key_input"
                      type={showSensitiveData ? "text" : "password"}
                      required
                      disabled={isModificationRestricted}
                      value={smsApiKey}
                      onChange={(e) => setSmsApiKey(e.target.value)}
                      className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-705 rounded-xl px-3 py-2.5 text-slate-800 dark:text-slate-100 font-mono text-left"
                      dir="ltr"
                    />
                  </div>
                </div>
              </div>

              {/* Appearance & Icon Design Customizer Section (تعديل الأيقونات والمظهر) */}
              <div className="border-t border-slate-100 dark:border-slate-800/80 pt-5 space-y-4">
                <h4 className="text-xs font-black text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5 mb-1 text-right">
                  <Palette size={14} className="text-indigo-500" />
                  <span>تخصيص أشكال البرنامج وتصميم الأيقونات (مظهر النظام)</span>
                </h4>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed text-right -mt-2">
                  تحكّم في الهوية البصرية للبرنامج وسلوك الأشكال المعتمدة عن طريق اختيار الأيقونة، نوع الزوايا، وكسوة الألوان العامة له.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                  {/* Brand Icon selection dropdown */}
                  <div className="space-y-1.5 text-right">
                    <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">أيـقونة الهوية الرئيسية</label>
                    <select
                      id="app_brand_icon_select"
                      disabled={isModificationRestricted}
                      value={appBrandIcon}
                      onChange={(e) => setAppBrandIcon(e.target.value)}
                      className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-xl px-3 py-2.5 text-slate-800 dark:text-slate-100 font-bold outline-hidden"
                    >
                      <option value="Building2">🏢 مبنى تجاري (Building)</option>
                      <option value="Briefcase">💼 حقيبة محاسبية (Briefcase)</option>
                      <option value="Coins">🪙 عملات معدنية ذهبية (Coins)</option>
                      <option value="Activity">📈 خطوط بيانية متموجة (Activity)</option>
                      <option value="Wallet">👛 محفظة مالية رقمية (Wallet)</option>
                      <option value="Landmark">🏛️ مصرف وبنك مركزي (Bank)</option>
                      <option value="Receipt">🧾 فاتورة إلكترونية (Invoice)</option>
                      <option value="Scale">⚖️ ميزان التدقيق العادل (Ledger Balance)</option>
                      <option value="Calculator">🧮 حاسبة الضريبة الفورية (Calculator)</option>
                      <option value="Award">🏆 شهادة امتثال واعتماد (Premium)</option>
                      <option value="Shield">🛡️ نظام آمن ومشفر (Secure Shield)</option>
                      <option value="Fingerprint">👣 بصمة الدخول للمحاسب (Auth Access)</option>
                      <option value="Compass">🧭 بوصلة استشارات وتخطيط (Strategy)</option>
                      <option value="Gem">💎 أرباح قياسية سنوية (Profits Jewel)</option>
                      <option value="Layers">🥞 حزم حسابات مجمعة (Multi Ledger)</option>
                      <option value="ArrowLeftRight">🔄 تسويات وتحويلات بنكية (Transfers)</option>
                    </select>
                  </div>

                  {/* Corner Roundedness shape selection dropdown */}
                  <div className="space-y-1.5 text-right">
                    <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">أشكال الحواف وزوايا الأزرار</label>
                    <select
                      id="app_border_shape_select"
                      disabled={isModificationRestricted}
                      value={appBorderShape}
                      onChange={(e) => setAppBorderShape(e.target.value)}
                      className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-xl px-3 py-2.5 text-slate-800 dark:text-slate-100 font-bold outline-hidden"
                    >
                      <option value="rounded-none">📐 كلاسيكي بزوايا حادة</option>
                      <option value="rounded-xl">⬈ زوايا ناعمة خفيفة (XL)</option>
                      <option value="rounded-2xl">⬜ زوايا دائرية عصرية (2XL)</option>
                      <option value="rounded-3xl">◯ زوايا مفرطة الدوران (3XL)</option>
                    </select>
                  </div>

                  {/* App Accent Color select */}
                  <div className="space-y-1.5 text-right">
                    <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">تدرج لون النظام المعتمد</label>
                    <select
                      id="app_accent_color_select"
                      disabled={isModificationRestricted}
                      value={appAccentColor}
                      onChange={(e) => setAppAccentColor(e.target.value)}
                      className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-xl px-3 py-2.5 text-slate-800 dark:text-slate-100 font-bold outline-hidden"
                    >
                      <option value="blue">🔵 أزرق كلاسيكي (Smart Blue)</option>
                      <option value="slate">⚫ رمادي فلكي (Cosmic Slate)</option>
                      <option value="indigo">🟣 بنفسجي رويال (Royal Indigo)</option>
                      <option value="emerald">🟢 أخضر واحة زمردية (Emerald Oasis)</option>
                      <option value="rose">🔴 أحمر روز قرمزي (Rose Crimson)</option>
                      <option value="amber">🟡 توهج عنبري وذهبي (Amber Glow)</option>
                      <option value="teal">🌊 تيل محيطي مائي (Oceanic Teal)</option>
                      <option value="orange">🍊 الغروب البرتقالي (Sunset Orange)</option>
                      <option value="violet">💜 اللافندر الهادئ (Soft Lavender)</option>
                      <option value="cyan">💎 سيان سيبراني (Cyber Cyan)</option>
                      <option value="fuchsia">🌸 فوشيا ربيعي (Bright Fuchsia)</option>
                      <option value="lime">🔋 عشبي ساطع (Neon Lime)</option>
                      <option value="sky">🌤️ سماء زرقاء صافية (Sky Blue)</option>
                      <option value="pink">🍬 مخمل وردي حلوى (Candy Pink)</option>
                      <option value="red">🔥 أحمر لهبي ناصع (Coral Red)</option>
                      <option value="yellow">👑 ذهب ملكي لامع (Royal Gold)</option>
                      <option value="stone">🪵 غامض رمادي حجري (Warm Stone)</option>
                    </select>
                  </div>

                  {/* Qat Background Image selection dropdown */}
                  <div className="space-y-1.5 text-right md:col-span-2">
                    <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">خلفية التطبيق لبيئة تجارة القات (Qat Background Wallpaper)</label>
                    <select
                      id="app_background_image_select"
                      disabled={isModificationRestricted}
                      value={appBackgroundImage}
                      onChange={(e) => setAppBackgroundImage(e.target.value)}
                      className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-xl px-3 py-2.5 text-slate-800 dark:text-slate-100 font-bold outline-hidden"
                    >
                      <option value="">🚫 بدون خلفية (افتراضي مظهر نظيف)</option>
                      <option value="/assets/images/qat_leaves_background_1782572930062.jpg">🍃 أوراق قات خضراء طازجة (Fresh Qat Leaves)</option>
                      <option value="/assets/images/qat_farm_background_1782572945221.jpg">⛰️ مدرجات مزارع القات اليمنية (Yemeni Terraces)</option>
                    </select>
                  </div>

                  {/* Qat Background Opacity select */}
                  <div className="space-y-1.5 text-right">
                    <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">درجة شفافية الخلفية</label>
                    <select
                      id="app_background_opacity_select"
                      disabled={isModificationRestricted}
                      value={appBackgroundOpacity}
                      onChange={(e) => setAppBackgroundOpacity(Number(e.target.value))}
                      className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-xl px-3 py-2.5 text-slate-800 dark:text-slate-100 font-bold outline-hidden"
                    >
                      <option value={2}>2% (خفيفة جداً وهادئة)</option>
                      <option value={5}>5% (توازن ممتاز - مستحسن)</option>
                      <option value={10}>10% (واضحة وجذابة)</option>
                      <option value={15}>15% (متوسطة)</option>
                      <option value={20}>20% (بارزة جداً)</option>
                      <option value={30}>30% (كثيفة للغاية)</option>
                    </select>
                  </div>

                </div>

                {/* Relocated admin restriction control (تغيير مكان هذا النموذج) */}
                <div className="pt-4 border-t border-dashed border-slate-100 dark:border-slate-800/80 space-y-4">
                  <div className="bg-indigo-50/50 dark:bg-indigo-950/15 border border-indigo-100/40 dark:border-indigo-900/30 p-4 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                    <div className="space-y-0.5 text-right">
                      <span className="text-xs font-black text-slate-800 dark:text-slate-200 block flex items-center gap-1">
                        <Lock size={12} className="text-indigo-600" />
                        <span>تأمين وتقييد مظهر وتصميم البرنامج لمدير النظام فقط</span>
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        عند تمكين هذا التقييد، لن يتمكن المحاسبون أو المندوبون من تغيير أشكال وتصميم البرنامج أو بوابات التراسل والـ API. هذا التقييد مخصص لحماية التصاميم والروابط ولا يقيد بيانات الإدخال أو المعاملات المالية كحلول آمنة.
                      </span>
                    </div>

                    <label className="inline-flex items-center gap-2 cursor-pointer self-start md:self-auto select-none pt-1 md:pt-0">
                      <input
                        id="restrict_to_admin_toggle"
                        type="checkbox"
                        disabled={role !== 'Admin'}
                        checked={restrictToAdminState}
                        onChange={(e) => setRestrictToAdminState(e.target.checked)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4.5 w-4.5 cursor-pointer disabled:opacity-50"
                      />
                      <span className="text-xs font-bold text-indigo-700 dark:text-indigo-400">تقييد للمدير</span>
                    </label>
                  </div>

                  {/* App Lock PIN Control */}
                  <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 p-4 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                    <div className="space-y-0.5 text-right">
                      <span className="text-xs font-black text-slate-800 dark:text-slate-200 block flex items-center gap-1">
                        <Key size={12} className="text-slate-600 dark:text-slate-400" />
                        <span>رمز المرور (PIN) لقفل التطبيق</span>
                      </span>
                      <span className="text-[10px] text-slate-400 block max-w-lg">
                        قم بتعيين رمز PIN لطلب كلمة مرور عند فتح التطبيق لأول مرة. اترك الحقل فارغاً لإلغاء القفل.
                      </span>
                    </div>

                    <div className="flex items-center gap-2 self-start md:self-auto w-full md:w-auto">
                      <input
                        type="password"
                        inputMode="numeric"
                        disabled={isModificationRestricted}
                        value={appPinCode}
                        onChange={(e) => setAppPinCode(e.target.value)}
                        placeholder="أدخل الرمز..."
                        className="text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 outline-hidden w-full md:w-32 tracking-widest font-mono text-center"
                      />
                      {appPinCode && (
                        <button
                          type="button"
                          onClick={() => setAppPinCode('')}
                          className="text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 p-2 rounded-lg"
                          title="إلغاء القفل"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>

                  {role !== 'Admin' && restrictToAdminState && (
                    <div className="mt-2 text-[10px] text-red-500 bg-red-50 dark:bg-red-950/20 p-2.5 rounded-lg border border-red-100 dark:border-red-900/30 flex items-center gap-1.5 font-bold">
                      <Lock size={11} />
                      <span>سياسة الحماية نشطة: تعديل إعدادات المظهر وبوابة الربط مقفل لمدير النظام فقط.</span>
                    </div>
                  )}
                </div>

              </div>

              {/* PDF Printing Customizer Section (تعديل مظهر وبيانات الطابعة PDF) */}
              <div className="border-t border-slate-100 dark:border-slate-800/80 pt-5 space-y-4">
                <h4 className="text-xs font-black text-blue-600 dark:text-blue-400 flex items-center gap-1.5 mb-1 text-right">
                  <Printer size={14} className="text-blue-500" />
                  <span>تخصيص مظهر ومطبوعات الطابعة والتقارير (PDF Print Settings)</span>
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-500 leading-relaxed text-right -mt-2">
                  تحكّم في البيانات المروّسة والعناوين وهوية الإيصالات، مع خيارات تخصيص الهوية والختم وحجم الورق والفوترلكشوف الحسابات المطبوعة من التطبيق.
                </p>

                {/* Logo Customization Area (تحميل أو التقاط شعار الشركة) */}
                <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 space-y-4 text-right no-print">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-700 dark:text-slate-300">شعار الشركة (Logo) للفواتير والتقارير</span>
                    {printCompanyLogo && (
                      <button
                        type="button"
                        onClick={() => setPrintCompanyLogo('')}
                        className="text-[10px] font-bold text-red-500 hover:text-red-700 flex items-center gap-1 cursor-pointer"
                      >
                        <span>حذف الشعار الحالي</span>
                      </button>
                    )}
                  </div>

                  <div className="flex flex-col md:flex-row gap-5 items-center">
                    {/* Preview / Upload dropzone */}
                    <div className="w-full md:w-1/3 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-4 bg-white dark:bg-slate-950/40 text-center min-h-[140px] relative overflow-hidden group">
                      {printCompanyLogo ? (
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <img
                            src={printCompanyLogo}
                            alt="Logo preview"
                            className="max-h-24 max-w-full object-contain rounded-lg"
                            referrerPolicy="no-referrer"
                          />
                          <span className="text-[10px] font-bold text-slate-400">معاينة الشعار المعتمد</span>
                        </div>
                      ) : (
                        <label className="cursor-pointer flex flex-col items-center justify-center space-y-1.5 w-full h-full">
                          <span className="p-2.5 bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 rounded-full group-hover:scale-105 transition-transform">
                            <Printer size={18} />
                          </span>
                          <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300">اختر شعار للرفع</span>
                          <span className="text-[9px] text-slate-400">صيغ PNG, JPG بحد أقصى 1MB</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                if (file.size > 1.5 * 1024 * 1024) {
                                  alert('حجم الملف كبير جداً! يرجى اختيار صورة أصغر من 1.5 ميجا بايت لضمان التخزين السلس.');
                                  return;
                                }
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  setPrintCompanyLogo(reader.result as string);
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>

                    {/* Camera Capture Section */}
                    <div className="w-full md:w-2/3 flex flex-col items-center md:items-start justify-center space-y-3">
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed text-right">
                        يمكنك التقاط صورة فورية لشعارك أو ختم شركتك المحمول باستخدام كاميرا جهازك أو الويب كام مباشرةً وحفظه تلقائياً كعلامة تجارية في ترويسة جميع المطبوعات والفواتير.
                      </p>

                      <div className="flex gap-2.5">
                        {!cameraActive ? (
                          <button
                            type="button"
                            disabled={isModificationRestricted}
                            onClick={startCamera}
                            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-slate-800 hover:bg-slate-700 dark:bg-slate-100 dark:hover:bg-slate-50 text-white dark:text-slate-900 rounded-xl transition-all cursor-pointer"
                          >
                            <span>التقاط من الكاميرا 📸</span>
                          </button>
                        ) : (
                          <div className="flex flex-col items-center space-y-2">
                            <div className="border-2 border-slate-300 dark:border-slate-800 rounded-xl overflow-hidden bg-black max-w-[200px] aspect-square">
                              <video
                                id="logo_webcam_preview"
                                className="w-full h-full object-cover scale-x-[-1]"
                                playsInline
                                muted
                              />
                            </div>
                            <div className="flex gap-1.5">
                              <button
                                type="button"
                                onClick={capturePhoto}
                                className="px-2.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-black rounded-lg cursor-pointer"
                              >
                                التقاط اللقطة 📸
                              </button>
                              <button
                                type="button"
                                onClick={stopCamera}
                                className="px-2.5 py-1.5 bg-red-500 hover:bg-red-600 text-white text-[10px] font-black rounded-lg cursor-pointer"
                              >
                                إلغاء
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Company/Brand Name */}
                  <div className="space-y-1.5 text-right">
                    <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">اسم الشركة / المؤسسة المطبوع</label>
                    <input
                      type="text"
                      disabled={isModificationRestricted}
                      value={printCompanyName}
                      onChange={(e) => setPrintCompanyName(e.target.value)}
                      placeholder="مؤسسة أنس المحاسبية"
                      className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-xl px-3 py-2.5 text-slate-800 dark:text-slate-100 font-bold"
                    />
                  </div>

                  {/* Print Phone */}
                  <div className="space-y-1.5 text-right">
                    <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">رقم الهاتف / الاتصال</label>
                    <input
                      type="text"
                      disabled={isModificationRestricted}
                      value={printPhone}
                      onChange={(e) => setPrintPhone(e.target.value)}
                      placeholder="+967 774928318"
                      className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-xl px-3 py-2.5 text-slate-800 dark:text-slate-100 font-bold font-mono text-left"
                      dir="ltr"
                    />
                  </div>

                  {/* Print Address */}
                  <div className="space-y-1.5 text-right">
                    <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">العنوان أو المقر الرئيسي</label>
                    <input
                      type="text"
                      disabled={isModificationRestricted}
                      value={printAddress}
                      onChange={(e) => setPrintAddress(e.target.value)}
                      placeholder="صنعاء - شارع الستين"
                      className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-xl px-3 py-2.5 text-slate-800 dark:text-slate-100 font-bold"
                    />
                  </div>

                  {/* Tax Number */}
                  <div className="space-y-1.5 text-right">
                    <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">الرقم الضريبي أو السجل التجاري</label>
                    <input
                      type="text"
                      disabled={isModificationRestricted}
                      value={printTaxNumber}
                      onChange={(e) => setPrintTaxNumber(e.target.value)}
                      placeholder="99827-Tax-YE"
                      className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-xl px-3 py-2.5 text-slate-800 dark:text-slate-100 font-bold font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Print Header template */}
                  <div className="space-y-1.5 text-right">
                    <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">ملاحظة الترويسة الرئيسية للتقرير</label>
                    <input
                      type="text"
                      disabled={isModificationRestricted}
                      value={printHeaderNote}
                      onChange={(e) => setPrintHeaderNote(e.target.value)}
                      className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-xl px-3 py-2.5 text-slate-800 dark:text-slate-100 font-bold"
                    />
                  </div>

                  {/* Print Footer note */}
                  <div className="space-y-1.5 text-right">
                    <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">ملاحظة أسفل التقرير (تذييل الفاتورة)</label>
                    <textarea
                      disabled={isModificationRestricted}
                      rows={2}
                      value={printFooterNote}
                      onChange={(e) => setPrintFooterNote(e.target.value)}
                      className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-xl px-3 py-2.5 text-slate-800 dark:text-slate-100 font-bold font-sans"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Select Print design accent color */}
                  <div className="space-y-1.5 text-right">
                    <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">لون الهوية الخاص بالفاتورة والمطبوعات (PDF Color)</label>
                    <select
                      disabled={isModificationRestricted}
                      value={printThemeColor}
                      onChange={(e) => setPrintThemeColor(e.target.value)}
                      className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-xl px-3 py-2.5 text-slate-800 dark:text-slate-100 font-bold outline-hidden"
                    >
                      <option value="indigo">💜 كحلي ملكي (Indigo Deep)</option>
                      <option value="blue">💙 أزرق أعمال (Corporate Blue)</option>
                      <option value="emerald">💚 أخضر إسلامي (Emerald Professional)</option>
                      <option value="slate">🖤 أسود رسمي مونوكروم (Formal Slate)</option>
                      <option value="red">❤️ أحمر غامق (Burgundy Red)</option>
                      <option value="amber">💛 نحاسي ذهبي (Amber Luxury)</option>
                      <option value="teal">🌊 تيل وقور (Dark Teal)</option>
                    </select>
                  </div>

                  {/* Paper size */}
                  <div className="space-y-1.5 text-right">
                    <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">حجم الورق الافتراضي</label>
                    <select
                      disabled={isModificationRestricted}
                      value={printPaperSize}
                      onChange={(e) => setPrintPaperSize(e.target.value)}
                      className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-xl px-3 py-2.5 text-slate-800 dark:text-slate-100 font-bold outline-hidden"
                    >
                      <option value="A4">📄 ورق نموزجي (A4 Standard Page)</option>
                      <option value="Thermal">📠 طابعة كاشير حرارية (80mm Thermal Receipt)</option>
                    </select>
                  </div>

                  {/* Print features options check */}
                  <div className="space-y-1 bg-slate-50 dark:bg-slate-800 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 self-end">
                    <span className="text-[10px] font-bold text-slate-400 block mb-1">خصائص وخيارات كشف الـ PDF</span>
                    <div className="flex flex-col gap-1.5 text-right">
                      <label className="flex items-center gap-2 cursor-pointer select-none text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        <input
                          type="checkbox"
                          disabled={isModificationRestricted}
                          checked={printShowBalance}
                          onChange={(e) => setPrintShowBalance(e.target.checked)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5 cursor-pointer"
                        />
                        <span>عرض رصيد الحساب الختامي</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer select-none text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        <input
                          type="checkbox"
                          disabled={isModificationRestricted}
                          checked={printShowSignature}
                          onChange={(e) => setPrintShowSignature(e.target.checked)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5 cursor-pointer"
                        />
                        <span>عرض خانة توقيع الاعتماد</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer select-none text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        <input
                          type="checkbox"
                          disabled={isModificationRestricted}
                          checked={printShowWatermark}
                          onChange={(e) => setPrintShowWatermark(e.target.checked)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5 cursor-pointer"
                        />
                        <span>علامة مائية مخصصة خلف الكشف</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dashboard Widget Customizer Section */}
              <div className="border-t border-slate-100 dark:border-slate-800/80 pt-5 space-y-4">
                <h4 className="text-xs font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 mb-1 text-right">
                  <Eye size={14} className="text-emerald-500" />
                  <span>تخصيص لوحة التحكم (Dashboard Widgets)</span>
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-500 leading-relaxed text-right -mt-2">
                  اختر الودجت والإحصائيات التي ترغب بعرضها في الشاشة الرئيسية للوحة التحكم لتخصيص مساحة عملك.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <label className="flex items-center gap-2 cursor-pointer select-none bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 p-3 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      disabled={isModificationRestricted}
                      checked={showWidgetTotalSales}
                      onChange={(e) => setShowWidgetTotalSales(e.target.checked)}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4 cursor-pointer"
                    />
                    <span>إحصائيات إجمالي المبيعات (Revenues)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer select-none bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 p-3 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      disabled={isModificationRestricted}
                      checked={showWidgetActiveAccounts}
                      onChange={(e) => setShowWidgetActiveAccounts(e.target.checked)}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4 cursor-pointer"
                    />
                    <span>أكثر الحسابات نشاطاً وملخص الديون</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer select-none bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 p-3 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      disabled={isModificationRestricted}
                      checked={showWidgetAlerts}
                      onChange={(e) => setShowWidgetAlerts(e.target.checked)}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4 cursor-pointer"
                    />
                    <span>سجل الإشعارات والتنبيهات (Alerts)</span>
                  </label>
                </div>
              </div>

            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-50 dark:border-slate-800/80" id="gateway_save_actions">
              {isModificationRestricted ? (
                <div
                  className="px-6 py-3 rounded-xl text-xs font-bold text-slate-400 bg-slate-100/85 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 flex items-center gap-1.5 cursor-not-allowed"
                  title="مغلق لمدير النظام فقط"
                >
                  <Lock size={13} className="text-slate-400" />
                  <span>تعديل وحفظ الإعدادات مقيد للمدير فقط</span>
                </div>
              ) : (
                <button
                  id="save_gateway_config_btn"
                  type="submit"
                  className="px-6 py-3 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 cursor-pointer transition-colors"
                >
                  حفظ وإقرار التغييرات للبوابة
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Backup Widget: Safe client-side JSON Backup manager */}
        <div
          className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 no-print"
          id="backup_status_widget"
        >
          <div className="flex items-start gap-3 w-full md:w-auto text-right">
            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-lg shrink-0 mt-0.5">
              <Download size={16} />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-extrabold text-slate-700 dark:text-slate-200">
                سلامة وحماية البيانات (نسخ احتياطي فوري للتحصين)
              </h4>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] text-slate-400 dark:text-slate-500 block">
                  تاريخ آخر عملية تصدير للبيانات:
                </span>
                {lastBackup ? (
                  <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20 px-2 py-0.5 rounded-md flex items-center gap-1 font-mono">
                    <Clock size={10} className="text-indigo-500" />
                    <span>{lastBackup}</span>
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 px-2 py-0.5 rounded-md">
                    لم يتم إجراء نسخ احتياطي بعد
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto mt-4 md:mt-0 justify-end">
            <div className="flex justify-end gap-3 w-full md:w-auto">
              {backupSuccess && (
                <div className="px-2.5 py-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-500/10 rounded-lg animate-pulse" id="backup_success_badge_msg">
                  ✓ تم تصدير ملف النسخة بنجاح!
                </div>
              )}
              {driveUploadSuccess && (
                <div className="px-2.5 py-1 text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20 border border-blue-500/10 rounded-lg animate-pulse">
                  ✓ تم الرفع إلى Google Drive بنجاح!
                </div>
              )}
            </div>

            <div className="flex flex-wrap md:flex-nowrap items-center w-full md:w-auto gap-3">
              {isModificationRestricted ? (
                <div
                  className="px-6 py-2.5 rounded-xl text-xs font-bold text-slate-400 bg-slate-100/85 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 flex items-center gap-1.5 cursor-not-allowed w-full md:w-auto justify-center"
                  title="مغلق لمدير النظام فقط"
                >
                  <Lock size={13} className="text-slate-400" />
                  <span>تصدير النسخة الاحتياطية مقيد للمدير</span>
                </div>
              ) : (
                <>
                  <button
                    id="trigger_json_backup_btn"
                    onClick={handleCreateBackup}
                    className="flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-extrabold text-slate-700 border border-slate-200 hover:bg-slate-50 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-800 rounded-xl shadow-xs transition-colors cursor-pointer w-full md:w-auto shrink-0"
                  >
                    <Download size={13} />
                    <span>تنزيل (JSON)</span>
                  </button>

                  {!user ? (
                    <button
                      onClick={handleDriveLogin}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 text-[11px] font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700 rounded-xl shadow-xs transition-colors cursor-pointer w-full md:w-auto"
                    >
                      <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-4 h-4">
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                        <path fill="none" d="M0 0h48v48H0z"></path>
                      </svg>
                      <span>حفظ عبر حساب جوجل</span>
                    </button>
                  ) : (
                    <div className="flex flex-col gap-1 w-full md:w-auto">
                      <button
                        onClick={handleSaveToDrive}
                        disabled={isDriveUploading}
                        className="flex items-center justify-center gap-1.5 px-6 py-2.5 text-xs font-extrabold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl shadow-xs transition-colors cursor-pointer w-full"
                      >
                        <Cloud size={13} />
                        <span>{isDriveUploading ? 'يتم الرفع...' : 'نسخ لـ Google Drive'}</span>
                      </button>
                      <button onClick={handleDriveLogout} className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-center">
                        تسجيل الخروج من ({user.email})
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
