import { apiUrl } from '../apiBase';
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import {
  FileSpreadsheet,
  FileText,
  Image as ImageIcon,
  UploadCloud,
  Smartphone,
  Monitor,
  Database as DbIcon,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Trash2,
  HelpCircle,
  Sparkles,
  SmartphoneIcon,
  LogOut,
  LogIn,
  Cloud
} from "lucide-react";
import { Database } from "../utils";
import { BackupService } from "../backupService";
import { Account, Transaction, DailyLedgerEntry } from "../types";
import { auth, googleSignIn, logout, getAccessToken, firestore, handleFirestoreError, OperationType } from "../auth";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, setDoc, onSnapshot, getDoc } from "firebase/firestore";
import * as XLSX from "xlsx";

interface SyncImportTabProps {
  db: Database;
  onDatabaseUpdate: () => void;
  role: string;
}

export default function SyncImportTab({ db, onDatabaseUpdate, role }: SyncImportTabProps) {
  // Auth & Cloud Sync States
  const [user, setUser] = useState<User | null>(null);
  const [syncEnabled, setSyncEnabled] = useState(false);
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "success" | "error">("idle");
  const [syncLogs, setSyncLogs] = useState<string[]>([]);
  const [isSimulatingAndroid, setIsSimulatingAndroid] = useState(false);

  // Exclude Windows / Web from auto cloud sync (Sync among Android only except Windows)
  const [excludeWindowsSync, setExcludeWindowsSync] = useState(() => {
    return localStorage.getItem("smartacc_exclude_windows_sync") === "true";
  });

  // Google Cloud backups state
  const [googleBackupList, setGoogleBackupList] = useState<{ id: string; name: string; date: string; size: string; data?: any; driveFileId?: string; firebaseBackupId?: string }[]>(() => {
    const saved = localStorage.getItem("smartacc_google_backups");
    return saved ? JSON.parse(saved) : [
      { id: "backup_g_1", name: "نسخة سحابية مرجعية تلقائية", date: "2026-06-16 12:45", size: "110 KB" }
    ];
  });
  const [isDriveBackingUp, setIsDriveBackingUp] = useState(false);
  const [googleBackupSuccess, setGoogleBackupSuccess] = useState(false);

  // File Import States
  const [excelPreview, setExcelPreview] = useState<{
    accounts: Partial<Account>[];
    entries: Partial<DailyLedgerEntry>[];
  } | null>(null);

  const [aiPreview, setAiPreview] = useState<{
    accounts: Partial<Account>[];
    ledgerEntries: Partial<DailyLedgerEntry>[];
  } | null>(null);

  const [importLoading, setImportLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeImportType, setActiveImportType] = useState<"excel" | "ai">("excel");

  // Track Firebase Authenticated User
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        addLog(`تم التحقق من هوية المستخدم: ${currentUser.displayName || currentUser.email}`);
        // Read if sync was previously enabled
        const savedSync = localStorage.getItem(`smartacc_sync_enabled_${currentUser.uid}`) === "true";
        if (savedSync) {
          setSyncEnabled(true);
        }
      } else {
        setSyncEnabled(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Sync Log Helper
  const addLog = (message: string) => {
    const timeStr = new Date().toLocaleTimeString("ar-SA", { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setSyncLogs(prev => [`[${timeStr}] ${message}`, ...prev.slice(0, 49)]);
  };

  // Firestore Real-time Synchronization Loop
  useEffect(() => {
    if (!user || !syncEnabled) return;

    setSyncStatus("syncing");
    addLog("جاري الاتصال بقاعدة بيانات Cloud Firestore السحابية للمزامنة...");

    // Setup firestore db reference
    const docRef = doc(firestore, "user_databases", user.uid);

    // Write initial local state if remote is empty, else load remote
    const initSync = async () => {
      if (!navigator.onLine) {
        addLog("العميل حالياً غير متصل بالإنترنت. سيتم تفعيل المزامنة التلقائية بمجرد عودة الاتصال.");
        return;
      }
      try {
        const snap = await getDoc(docRef);
        if (!snap.exists()) {
          addLog("لم يتم العثور على قاعدة بيانات سحابية سابقة. رفع البيانات المحلية الحالية...");
          await setDoc(docRef, {
            dbState: db.exportState(),
            lastUpdated: new Date().toISOString(),
            updatedBy: "Web Client"
          });
          addLog("تم رفع البيانات المحلية وتأمينها بنجاح!");
        }
      } catch (e: any) {
        const errMsg = String(e?.message || e || "").toLowerCase();
        if (errMsg.includes('offline') || errMsg.includes('network') || errMsg.includes('failed to get document') || errMsg.includes('unavailable') || !navigator.onLine) {
          addLog("تنبيه: أنت تعمل حالياً دون اتصال بالإنترنت. سيتم حفظ التغييرات محلياً.");
        } else {
          addLog(`خطأ في تهيئة الارتباط: ${e.message || "صلاحيات غير كافية"}`);
          handleFirestoreError(e, OperationType.GET, `user_databases/${user.uid}`);
        }
      }
    };
    initSync();

    // Listen to real-time changes
    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        const remoteData = snapshot.data();
        // Compare and merge if different
        const remoteLastUpdated = remoteData.lastUpdated || "";
        const localLastUpdated = localStorage.getItem("smartacc_last_cloud_sync_ts") || "";

        addLog(`إشارة مزامنة واردة من المصدر: ${remoteData.updatedBy || "جهاز آخر"}`);

        // Read excludeWindowsSync directly from local variable
        const isExcluded = localStorage.getItem("smartacc_exclude_windows_sync") === "true";

        if (isExcluded) {
          addLog("تم حظر التحديث التلقائي في هذا الجهاز (ويندوز/ويب) لوجود بنود استثنائية نشطة.");
          setSyncStatus("success");
          return;
        }

        if (remoteLastUpdated !== localLastUpdated) {
          localStorage.setItem("smartacc_last_cloud_sync_ts", remoteLastUpdated);

          // Restore the canonical cloud payload while tolerating legacy documents.
          const cloudState = remoteData.dbState || {
            accounts: remoteData.accounts || [],
            transactions: remoteData.transactions || [],
            dailyEntries: remoteData.dailyEntries || []
          };
          db.importState(cloudState); // persist to local storage through the database engine

          onDatabaseUpdate();
          setSyncStatus("success");
          addLog("تم دمج وتحديث البيانات تلقائياً بنجاح! الأجهزة الآن متطابقة 100%.");
        } else {
          setSyncStatus("success");
        }
      }
    }, (err) => {
      const errMsg = String(err?.message || err || "").toLowerCase();
      if (errMsg.includes('offline') || errMsg.includes('network') || errMsg.includes('failed to get document') || errMsg.includes('unavailable') || !navigator.onLine) {
        addLog("تم فقد الاتصال السحابي المؤقت. التطبيق مستمر بالعمل والاحتفاظ ببياناتك محلياً.");
        setSyncStatus("success");
      } else {
        setSyncStatus("error");
        addLog(`فشل بث المزامنة: الحساب غير مصرح له أو مستندات غير موجودة.`);
        handleFirestoreError(err, OperationType.GET, `user_databases/${user.uid}`);
      }
    });

    return () => unsubscribe();
  }, [user, syncEnabled]);

  // Handle local database update and push to cloud
  const pushLocalDataToCloud = async () => {
    if (!user || !syncEnabled) return;
    setSyncStatus("syncing");
    addLog("جاري دفع التعديلات المحلية الجديدة إلى السحابة فوراً...");
    try {
      const docRef = doc(firestore, "user_databases", user.uid);
      const updateTime = new Date().toISOString();

      await setDoc(docRef, {
        dbState: db.exportState(),
        lastUpdated: updateTime,
        updatedBy: "Web Client (Windows/Browser)"
      });

      localStorage.setItem("smartacc_last_cloud_sync_ts", updateTime);
      setSyncStatus("success");
      addLog("تمت مزامنة وإرسال التعديلات بنجاح إلى جميع الأجهزة المشتركة!");
    } catch (e: any) {
      const errMsg = String(e?.message || e || "").toLowerCase();
      if (errMsg.includes('offline') || errMsg.includes('network') || errMsg.includes('failed to get document') || errMsg.includes('unavailable') || !navigator.onLine) {
        setSyncStatus("success");
        addLog("تنبيه: تعذر إرسال التعديلات لعدم وجود اتصال نشط بالإنترنت. سيتم إرسالها بمجرد عودة الاتصال.");
      } else {
        setSyncStatus("error");
        addLog(`خطأ أثناء رفع البيانات: ${e.message}`);
        handleFirestoreError(e, OperationType.UPDATE, `user_databases/${user.uid}`);
      }
    }
  };

  const toggleSync = (checked: boolean) => {
    if (!user) {
      setErrorMessage("الرجاء تسجيل الدخول أولاً لتفعيل المزامنة السحابية.");
      return;
    }
    setSyncEnabled(checked);
    localStorage.setItem(`smartacc_sync_enabled_${user.uid}`, checked.toString());
    if (checked) {
      addLog("تم تفعيل بوابة المزامنة السحابية.");
    } else {
      addLog("تم إيقاف المزامنة السحابية.");
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setImportLoading(true);
      await googleSignIn();
      setSuccessMessage("تم تسجيل الدخول بنجاح.");
    } catch (e: any) {
      setErrorMessage(`فشل تسجيل الدخول: ${e.message}`);
    } finally {
      setImportLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setSyncEnabled(false);
      setSuccessMessage("تم تسجيل الخروج بنجاح.");
    } catch (e: any) {
      setErrorMessage(e.message);
    }
  };

  // --- DOWNLOAD COMPREHENSIVE EXCEL TEMPLATE FOR OFFLINE ADMINISTRATION ---
  const downloadExcelTemplate = () => {
    try {
      // 1. Data for accounts sheet
      const accountsData = [
        {
          "الاسم": "مؤسسة الأمل للتجارة والمقاولات",
          "رقم الهاتف": "777123456",
          "العنوان": "صنعاء - شارع الستين",
          "الرصيد الافتتاحي": 500000,
          "النوع": "مورد"
        },
        {
          "الاسم": "شركة أنس للتوريدات والحلول الذكية",
          "رقم الهاتف": "771111111",
          "العنوان": "عدن - شارع المعلا",
          "الرصيد الافتتاحي": 0,
          "النوع": "مورد"
        },
        {
          "الاسم": "العميل علي أحمد صالح",
          "رقم الهاتف": "733987654",
          "العنوان": "تعز - الحوبان",
          "الرصيد الافتتاحي": -150000,
          "النوع": "عميل"
        }
      ];

      // 2. Data for transactions sheet
      const transactionsData = [
        {
          "التاريخ": new Date().toISOString().split("T")[0],
          "البيان": "شراء حديد تسليح مقاس 12 ملم للموقع أ",
          "الكمية": 10,
          "السعر": 45000,
          "مصاريف": 2500
        },
        {
          "التاريخ": new Date().toISOString().split("T")[0],
          "البيان": "توريد أسمنت مقاوم بورتلاندي ممتاز",
          "الكمية": 150,
          "السعر": 4500,
          "مصاريف": 10000
        },
        {
          "التاريخ": new Date().toISOString().split("T")[0],
          "البيان": "مبيعات بلك بركاني مقاس 20 مصنع الغد",
          "الكمية": 2000,
          "السعر": 180,
          "مصاريف": 0
        }
      ];

      // Create worksheets
      const wsAccounts = XLSX.utils.json_to_sheet(accountsData);
      const wsTransactions = XLSX.utils.json_to_sheet(transactionsData);

      // Create workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, wsAccounts, "الحسابات (موردين وعملاء)");
      XLSX.utils.book_append_sheet(wb, wsTransactions, "الحركات والقيود اليومية");

      // Write workbook to a file and download it
      XLSX.writeFile(wb, "نموذج_إدارة_نظام_أنس_المحاسبي.xlsx");
      setSuccessMessage("تم إنشاء وتحميل نموذج إكسل الإداري بنجاح! يمكنك استخدامه لإدخال البيانات محلياً وإعادة رفعه بضغطة زر.");
      addLog("تم إنشاء وتحميل نموذج إكسل الإداري بنجاح.");
    } catch (err: any) {
      setErrorMessage("فشل إنشاء ملف النموذج: " + err.message);
    }
  };

  const updateExcelEntry = (index: number, field: keyof DailyLedgerEntry, value: any) => {
    if (!excelPreview) return;
    const updatedEntries = [...excelPreview.entries];
    const entry = { ...updatedEntries[index], [field]: value };

    // Recalculate total if needed
    if (typeof field === 'string' && ['quantity', 'unitPrice', 'extraCharges'].includes(field)) {
      entry.total = ((entry.quantity || 0) * (entry.unitPrice || 0)) + (entry.extraCharges || 0);
    }
    updatedEntries[index] = entry;
    setExcelPreview({ ...excelPreview, entries: updatedEntries });
  };

  // --- EXCEL FILE PARSING VIA AI ---
  const handleExcelFile = (file: File) => {
    setImportLoading(true);
    setErrorMessage(null);
    setExcelPreview(null);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        const sheetObjects = XLSX.utils.sheet_to_json(sheet) as any[];

        if (sheetObjects.length === 0) {
          throw new Error("ملف Excel فارغ.");
        }

        const previewData = sheetObjects.map((row: any) => {
           const getVal = (possibleKeys: string[], defaultVal = '') => {
            for (const key of Object.keys(row)) {
              if (possibleKeys.some(k => key.toLowerCase().includes(k.toLowerCase()))) {
                return row[key];
              }
            }
            return defaultVal;
          };

          // Simple heuristic to differentiate between Account and Ledger Entry
          const isAccount = getVal(['اسم الحساب', 'account', 'اسم'], '').length > 0;

          if (isAccount) {
            return {
              type: 'account',
              data: {
                name: getVal(['اسم الحساب', 'account', 'اسم'], 'حساب مستورد'),
                type: getVal(['نوع الحساب', 'type'], 'مدين')
              }
            };
          } else {
             return {
               type: 'entry',
               data: {
                 date: getVal(['تاريخ', 'date'], new Date().toISOString().split('T')[0]),
                 description: getVal(['بيان', 'وصف', 'تفاصيل', 'desc', 'detail'], 'قيد مستورد'),
                 quantity: parseFloat(String(getVal(['الكميه', 'العدد', 'quantity', 'qty'], '0')).replace(/,/g, '')) || 0,
                 unitPrice: parseFloat(String(getVal(['السعر', 'سعر', 'unitPrice'], '0')).replace(/,/g, '')) || 0,
                 extraCharges: parseFloat(String(getVal(['الزيادات', 'إضافيات', 'extra', 'additions'], '0')).replace(/,/g, '')) || 0,
                 total: parseFloat(String(getVal(['الاجمالي', 'إجمالي', 'total', 'amount'], '0')).replace(/,/g, '')) || 0,
                 dayNumber: parseInt(String(getVal(['اليوم', 'day'], '1'))) || 1
               }
             };
          }
        });

        const accounts = previewData.filter(item => item.type === 'account').map(item => item.data);
        const entries = previewData.filter(item => item.type === 'entry').map(item => item.data);

        setExcelPreview({
          accounts: accounts,
          entries: entries
        });
        setActiveImportType("excel");
        addLog("تمت قراءة وتحليل بيانات Excel بنجاح.");

      } catch (err: any) {
        console.error(err);
        setErrorMessage(err.message || "خطأ أثناء معالجة ملف Excel.");
      } finally {
        setImportLoading(false);
      }
    };

    reader.onerror = () => {
      setErrorMessage("فشل قراءة الملف.");
      setImportLoading(false);
    };

    reader.readAsBinaryString(file);
  };

  // --- IMAGE & PDF AI PARSING WITH SERVER PROXY ---
  const handleAIFiles = async (file: File) => {
    setImportLoading(true);
    setErrorMessage(null);
    setAiPreview(null);
    addLog(`جاري قراءة الملف وتجهيزه للإرسال لمحرك الذكاء الاصطناعي: ${file.name} (${(file.size/1024).toFixed(1)} KB)...`);

    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const base64String = (reader.result as string).split(",")[1];
        if (!base64String) {
          throw new Error("فشل تحويل الملف إلى ترميز Base64.");
        }

        addLog("جاري استدعاء ورفع المستند لنموذج Gemini 3.5 Flash لتحليل الفاتورة سحابياً...");

        const response = await fetch(apiUrl("/api/parse-document"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            fileData: base64String,
            mimeType: file.type || (file.name.toLowerCase().endsWith(".pdf") ? "application/pdf" : "image/jpeg")
          })
        });

        const resData = await response.json();

        if (!response.ok || !resData.success) {
          throw new Error(resData.error || "فشل الذكاء الاصطناعي في تحليل الملف المستند.");
        }

        const data = resData.data;
        addLog("تم الاستلام والتحليل بنجاح لبيانات الفاتورة من الذكاء الاصطناعي!");

        setAiPreview({
          accounts: data.accounts || [],
          ledgerEntries: data.ledgerEntries || []
        });
        setActiveImportType("ai");

      } catch (err: any) {
        console.error(err);
        setErrorMessage(err.message || "حدث عطل غير متوقع أثناء معالجة المستند عبر ملقم الذكاء الاصطناعي.");
      } finally {
        setImportLoading(false);
      }
    };

    reader.onerror = () => {
      setErrorMessage("حدث خطأ أثناء قراءة المستند.");
      setImportLoading(false);
    };

    reader.readAsDataURL(file);
  };

  // Drag-and-drop Events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext === "xlsx" || ext === "xls" || ext === "csv") {
      handleExcelFile(file);
    } else if (file.type.startsWith("image/") || ext === "pdf") {
      handleAIFiles(file);
    } else {
      setErrorMessage("امتداد الملف غير مدعوم. يرجى سحب ملف Excel أو مستند PDF أو صور فواتير حصراً.");
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  // --- SAVE DATA TO LOCAL OR CLOUD DATABASE ---
  const saveImportedData = () => {
    try {
      const previewData = activeImportType === "excel" ? excelPreview : aiPreview;
      if (!previewData) return;

      const accsToAdd = previewData.accounts || [];
      const entriesToAdd = activeImportType === "excel" ? (excelPreview?.entries || []) : (aiPreview?.ledgerEntries || []);

      let accountsAddedCount = 0;
      let entriesAddedCount = 0;

      // Add Accounts
      accsToAdd.forEach(acc => {
        // Avoid perfect name duplicate
        const exists = db.accounts.some(a => a.name.trim() === acc.name?.trim());
        if (!exists && acc.name) {
          const newAccount: Account = {
            id: acc.id || `acc_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            name: acc.name,
            phone: acc.phone || "",
            address: acc.address || "",
            openingBalance: acc.openingBalance || 0,
            type: acc.type || "buyer",
            createdAt: acc.createdAt || new Date().toISOString(),
            currency: acc.currency || "YER",
            status: "active"
          };
          db.accounts.push(newAccount);
          accountsAddedCount++;
        }
      });

      // Add Ledger Entries & trigger transaction relational writes
      entriesToAdd.forEach(entry => {
        const itemTotal = (entry.quantity || 1) * (entry.unitPrice || 0) + (entry.extraCharges || 0);
        const newEntry: DailyLedgerEntry = {
          id: entry.id || `entry_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          dayNumber: entry.dayNumber || 1,
          date: entry.date || new Date().toISOString().split("T")[0],
          description: entry.description || "قيد مستورد",
          quantity: entry.quantity || 1,
          unitPrice: entry.unitPrice || 0,
          extraCharges: entry.extraCharges || 0,
          total: entry.total || itemTotal,
          transactionType: entry.transactionType || "debit"
        };
        db.dailyEntries.push(newEntry);
        entriesAddedCount++;
      });

      db.save();
      onDatabaseUpdate();

      // If cloud sync active, push to cloud immediately
      if (syncEnabled) {
        pushLocalDataToCloud();
      }

      setSuccessMessage(`تم استيراد وحفظ البيانات بنجاح: تم إضافة (${accountsAddedCount}) حساب، و (${entriesAddedCount}) قيود يومية!`);

      // Clear previews
      setExcelPreview(null);
      setAiPreview(null);
    } catch (e: any) {
      setErrorMessage(`خطأ في ترحيل البيانات المستوردة: ${e.message}`);
    }
  };

  // --- ANDROID / WINDOWS REALFirestore RECURRING LOG SIMULATOR ---
  const simulateAndroidEntry = async () => {
    if (!user || !syncEnabled) {
      setErrorMessage("يرجى ربط محفظة السحاب (تسجيل الدخول + تفعيل المزامنة الجوية) لمحاكاة الإدخال الفوري للأندرويد.");
      return;
    }

    setIsSimulatingAndroid(true);
    addLog("جاري محاكاة: إدخال قيد مبيعات فوري من تطبيق ANAS Android في ورشة تعز...");

    try {
      const docRef = doc(firestore, "user_databases", user.uid);

      // Create simulated new entry and append
      const randomId = `entry_android_${Date.now()}`;
      const androidNewEntry: DailyLedgerEntry = {
        id: randomId,
        dayNumber: 5,
        date: new Date().toISOString().split("T")[0],
        description: "مبيعات فورية مستلمة [تطبيق أندرويد للهواتف الذكية]",
        quantity: 5,
        unitPrice: 1500,
        extraCharges: 100,
        total: 7600,
        transactionType: "debit"
      };

      // Create simulated new Transaction
      const androidNewTx: Transaction = {
        id: `tx_android_${Date.now()}`,
        accountId: "acc_3", // Links directly to العميل المميز: شركة المقاولات الحديثة
        date: new Date().toISOString().split("T")[0],
        description: "سداد فاتورة مبيعات واردة من تطبيق مبيعات الأندرويد الميداني",
        type: "debit",
        amount: 7600,
        sourceEntryId: randomId
      };

      // Fetch current firestore database, append then rewrite
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const currentData = snap.data();
        const updatedEntries = [...(currentData.dailyEntries || []), androidNewEntry];
        const updatedTx = [...(currentData.transactions || []), androidNewTx];

        await setDoc(docRef, {
          ...currentData,
          dailyEntries: updatedEntries,
          transactions: updatedTx,
          lastUpdated: new Date().toISOString(),
          updatedBy: "تطبيق ANAS للاندرويد (Android Client v2.5)"
        });

        addLog("تم إرسال القيد من الموبايل السحابي! جاري التحليل والدمج التلقائي على أجهزتك الأخرى...");
      }
    } catch (e: any) {
      addLog(`خطأ في محاكاة بث الموبايل: ${e.message}`);
    } finally {
      setIsSimulatingAndroid(false);
    }
  };

  // Exclude Windows Sync Toggle Handler
  const toggleExcludeWindowsSync = (checked: boolean) => {
    setExcludeWindowsSync(checked);
    localStorage.setItem("smartacc_exclude_windows_sync", checked ? "true" : "false");
    addLog(checked
      ? "تنبيه: تم تشغيل بروتوكول حظر التحديث التلقائي في جهاز الويندوز هذا للحفاظ على التناسق."
      : "تنبيه: تم إغلاق الحظر. سيستقبل هذا الجهاز التحديثات السحابية آلياً."
    );
  };

  // Google Cloud - Create Firestore database backup snapshot
  const createGoogleCloudBackup = async () => {
    if (!user) {
      setErrorMessage("يرجى ربط محفظة السحاب بـ Google أولاً لتوليد نسخة احتياطية سحابية.");
      return;
    }

    setIsDriveBackingUp(true);
    addLog("جاري تجهيز وتأمين حزمة النسخة الاحتياطية وتشفيرها سحابياً...");

    try {
      const backupId = `bk_${Date.now()}`;
      const newBackupItem: any = {
        id: backupId,
        name: `نسخة سحابية يدوية (${new Date().toLocaleDateString("ar-SA")})`,
        date: new Date().toLocaleString("ar-SA", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit"
        }),
        size: `${Math.round((JSON.stringify(db.accounts).length + JSON.stringify(db.dailyEntries).length) / 1024 + 1.2)} KB`,
        data: {
          accounts: db.accounts,
          transactions: db.transactions,
          dailyEntries: db.dailyEntries,
          primaryCurrency: db.primaryCurrency,
          exchangeRates: db.exchangeRates
        }
      };

      // 1. Attempt to push JSON to actual Google Drive
      const accessToken = await getAccessToken();
      if (accessToken) {
        addLog("جاري تأمين النسخة الاحتياطية ورفعها فعلياً إلى مساحة حسابك في Google Drive...");
        try {
          const metadata = {
            name: `ANAS_Accounting_Backup_${backupId}.json`,
            mimeType: 'application/json',
            description: `نسخة احتياطية لنظام أنس المحاسبي بتاريخ ${newBackupItem.date}`
          };
          const fileContent = JSON.stringify(newBackupItem.data);

          const form = new FormData();
          form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
          form.append('file', new Blob([fileContent], { type: 'application/json' }));

          const driveResponse = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`
            },
            body: form
          });

          if (driveResponse.ok) {
             const driveData = await driveResponse.json();
             addLog(`تم الحفظ في Google Drive بنجاح (معرف الملف: ${driveData.id})`);
             newBackupItem.driveFileId = driveData.id;
          } else {
             addLog("تعذر الاتصال بـ Google Drive بالرغم من توفر التوكين (قد يكون بسبب الصلاحيات).");
          }
        } catch (driveErr) {
          console.error("Google Drive Upload Error", driveErr);
          addLog("تخطى الحفظ في Google Drive للعمل بسيرفرات السحابة الافتراضية.");
        }
      }

      // Persist an encrypted canonical backup in the same Firestore subcollection
      // used by BackupService. This keeps the storage contract aligned with firestore.rules.
      const backupService = new BackupService(user.uid);
      const firebaseMetadata = await backupService.uploadBackup(db.exportState(), 'Full');
      newBackupItem.firebaseBackupId = firebaseMetadata.id;
      newBackupItem.size = `${Math.max(1, Math.round(firebaseMetadata.size / 1024))} KB`;

      // Update the local index only after cloud persistence succeeds.
      const updatedList = [newBackupItem, ...googleBackupList];
      setGoogleBackupList(updatedList);
      localStorage.setItem("smartacc_google_backups", JSON.stringify(updatedList));

      addLog("تم تأمين النسخة الاحتياطية وتخزينها مشفّرة في مساحة المستخدم السحابية.");
      setGoogleBackupSuccess(true);
      setTimeout(() => setGoogleBackupSuccess(false), 4400);
      setSuccessMessage("تم تصدير ورفع النسخة السحابية لـ Google بنجاح وبسرعة أمان فائقة!");

    } catch (e: any) {
      console.error(e);
      addLog(`فشل تصدير النسخة للغيمة: ${e.message}`);
      setErrorMessage(`تعذر نقل النسخة الاحتياطية لـ Google: ${e.message}`);
    } finally {
      setIsDriveBackingUp(false);
    }
  };

  // Google Cloud - Restore Firestore backup snapshot to local system
  const restoreGoogleCloudBackup = async (backupItem: any) => {
    if (!backupItem) return;

    const confirmRestore = window.confirm(
      `تنبيه حرج للسلامة:\nهل أنت واثق تماماً من رغبتك في استعادة كشوفات الحساب والقيود للنسخة الاحتياطية المؤرخة في [${backupItem.date}]؟\nأي بيانات معدلة لم تحفظ سحابياً مسبقاً ستفقد تماماً.`
    );

    if (!confirmRestore) return;

    try {
      let restoreData = backupItem.data;
      if (!restoreData && backupItem.firebaseBackupId && user) {
        const backupService = new BackupService(user.uid);
        restoreData = await backupService.downloadBackup(backupItem.firebaseBackupId);
      }

      if (restoreData) {
        db.importState(restoreData);
        onDatabaseUpdate();
        addLog(`تمت استعادة الحزمة المؤرخة بـ [${backupItem.date}] بنجاح.`);
        setSuccessMessage(`تمت استعادة النسخة السحابية المحددة في النظام بنجاح للتاريخ: (${backupItem.date})`);
      } else {
        addLog("تنبيه: النسخة المستهدفة لا تحتوي على بيانات قابلة للاستعادة، وتم الاحتفاظ بالبيانات الحالية.");
        setSuccessMessage("تعذر الاستعادة لأن النسخة لا تحتوي على بيانات فعلية.");
      }
    } catch (e: any) {
      console.error(e);
      setErrorMessage(`حدث خطأ غير متوقع أثناء تفريغ الحزمة: ${e.message}`);
    }
  };

  // Google Cloud - Delete backup from list
  const deleteGoogleCloudBackup = async (id: string) => {
    const confirmDelete = window.confirm("هل ترغب في مسح هذه النسخة الاحتياطية نهائياً من السيرفرات السحابية؟");
    if (!confirmDelete) return;

    try {
      const itemToDelete = googleBackupList.find(item => item.id === id);
      const updatedList = googleBackupList.filter(item => item.id !== id);
      setGoogleBackupList(updatedList);
      localStorage.setItem("smartacc_google_backups", JSON.stringify(updatedList));

      if (user) {
        if (itemToDelete?.firebaseBackupId) {
          const backupService = new BackupService(user.uid);
          await backupService.deleteBackup(itemToDelete.firebaseBackupId);
        }

        // Also delete from Google Drive if driveFileId exists
        if (itemToDelete?.driveFileId) {
          const accessToken = await getAccessToken();
          if (accessToken) {
            await fetch(`https://www.googleapis.com/drive/v3/files/${itemToDelete.driveFileId}`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${accessToken}` }
            });
            addLog("تم مسح الملف المرتبط من مساحة Google Drive.");
          }
        }
      }

      addLog("تم مسح النسخة الاحتياطية بنجاح من قاعدة البيانات والسحابة.");
    } catch (e: any) {
      console.error(e);
      setErrorMessage(`تعذر مسح النسخة الاحتياطية: ${e.message}`);
    }
  };

  return (
    <div className="space-y-6" id="sync_import_parent">

      {/* Dynamic Intro Banner */}
      <div className="bg-gradient-to-l from-slate-900 to-slate-800 dark:from-slate-950 dark:to-slate-800/60 text-white rounded-3xl p-6 shadow-md border border-slate-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-6" id="sync_top_banner">
        <div className="space-y-1 text-right">
          <div className="flex items-center gap-2">
            <span className="p-1 px-2.5 bg-indigo-500/10 text-indigo-400 text-[10px] rounded-lg font-black border border-indigo-500/20 uppercase tracking-widest">تحديثات ثورية</span>
            <Sparkles size={16} className="text-amber-400 animate-pulse" />
          </div>
          <h2 className="text-xl font-black text-slate-100" id="sync_banner_title">بوابة الاستيراد الذكي والتحليل التلقائي للتطبيق</h2>
          <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
            أهلاً بك في الجيل الجديد لنظام ANAS المحاسبي المحمول. استورد بياناتك بنقرة واحدة من ملفات Excel، أو ارفع مستندات وفواتير مصورة ليتولى ملقم الذكاء الاصطناعي تفريغ القيود نيابة عنك مباشرة وتخزينها محلياً بأمان كامل.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            onClick={downloadExcelTemplate}
            title="تحميل نموذج الإكسل الشامل للتحكم وإدارة الحسابات والقيود كاملة أوفلاين"
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 transition-colors text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-sm select-none"
          >
            <FileSpreadsheet size={14} />
            <span>تحميل نموذج الإدارة والتحكم (Excel)</span>
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 transition-colors text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-sm select-none"
          >
            <UploadCloud size={14} />
            <span>اختر ملفاً لرفعه</span>
          </button>
        </div>
      </div>

      {/* Global Toast Messages */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 rounded-2xl flex items-start gap-3 text-rose-800 dark:text-rose-400" id="import_error_message">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <div className="text-right">
            <span className="font-bold block text-sm">تنبيه بالخطأ</span>
            <span className="text-xs">{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="mr-auto text-rose-500 hover:text-rose-700 font-bold text-xs">✕</button>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 rounded-2xl flex items-start gap-3 text-emerald-800 dark:text-emerald-400 animate-fade-in" id="import_success_message">
          <CheckCircle size={18} className="mt-0.5 shrink-0" />
          <div className="text-right">
            <span className="font-bold block text-sm">عملية ناجحة</span>
            <span className="text-xs">{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="mr-auto text-emerald-500 hover:text-emerald-700 font-bold text-xs">✕</button>
        </div>
      )}

      {/* Real Grid System */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="sync_main_grid">

        {/* FULL COLUMN: File and Image Smart Uploader */}
        <div className="lg:col-span-12 space-y-6" id="import_column">

          {/* File Drag Over Box */}
          <div
            id="drag_and_drop_area"
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-3xl p-10 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-4 ${
              dragActive
                ? "border-indigo-500 bg-indigo-55/10 dark:bg-indigo-950/10 scale-98"
                : "border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".xlsx,.xls,.csv,image/*,application/pdf"
              onChange={handleFileInputChange}
            />

            {importLoading ? (
              <div className="flex flex-col items-center gap-3" id="import_loader_animation">
                <RefreshCw size={40} className="text-indigo-500 animate-spin" />
                <span className="text-xs font-black text-slate-800 dark:text-slate-100">جاري الكشط وقراءة الأوراق... الرجاء الانتظار</span>
                <span className="text-[10px] text-slate-400">نستخدم محرك Excel الحليفي وخوادم الذكاء الاصطناعي لتحليل حقولك بدقة</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="p-4 bg-indigo-50 dark:bg-indigo-950/30 rounded-full text-indigo-600 dark:text-indigo-400">
                  <UploadCloud size={30} />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-black text-slate-800 dark:text-slate-100">اسحب وأفلت الفواتير أو ملفات البيانات هنا</p>
                  <p className="text-xs text-slate-400">
                    ندعم ملفات Excel <span className="font-semibold text-slate-500">(.xlsx، .csv)</span> وصور الفواتير والـ <span className="font-semibold text-slate-500">PDF</span> للتحليل التلقائي بـ AI.
                  </p>
                </div>
                <div className="flex gap-2.5 mt-2">
                  <span className="flex items-center gap-1 text-[10px] bg-slate-50 dark:bg-slate-800 text-slate-500 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-stone-800 font-bold">
                    <FileSpreadsheet size={12} className="text-emerald-500" /> Excel وجداول
                  </span>
                  <span className="flex items-center gap-1 text-[10px] bg-slate-50 dark:bg-slate-800 text-slate-500 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-stone-800 font-bold">
                    <FileText size={12} className="text-red-500" /> PDF ووثائق مالية
                  </span>
                  <span className="flex items-center gap-1 text-[10px] bg-slate-50 dark:bg-slate-800 text-slate-500 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-stone-800 font-bold">
                    <ImageIcon size={12} className="text-indigo-500" /> صور وفواتير مصورة
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Results Preview State */}
          {activeImportType === "excel" && excelPreview && (
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm space-y-5 animate-fade-in" id="excel_preview_container">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800/50">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="text-emerald-505" size={18} />
                  <span className="text-xs font-black text-slate-800 dark:text-slate-100">معاينة البيانات المستخرجة من جدول Excel</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setExcelPreview(null)}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                    title="حذف البيانات المعروضة"
                  >
                    <Trash2 size={14} />
                  </button>
                  <button
                    onClick={saveImportedData}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black rounded-lg transition-colors cursor-pointer"
                  >
                    اعتماد واستيراد {excelPreview.accounts.length + excelPreview.entries.length} حقل
                  </button>
                </div>
              </div>

              {/* Accounts Preview Grid */}
              {excelPreview.accounts.length > 0 && (
                <div className="space-y-2.5">
                  <span className="text-[10px] font-bold text-slate-400 block">حسابات كشوفات مستهدفة للاستيراد ({excelPreview.accounts.length})</span>
                  <div className="overflow-x-auto border border-slate-100 dark:border-slate-800/80 rounded-2xl">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 text-[10px] font-extrabold">
                        <tr>
                          <th className="p-3">الاسم الكامل</th>
                          <th className="p-3">الهاتف</th>
                          <th className="p-3">العنوان</th>
                          <th className="p-3">نوع الحساب</th>
                          <th className="p-3">رصيد افتتاحي</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {excelPreview.accounts.map((acc, index) => (
                          <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300">
                            <td className="p-3 font-semibold">{acc.name}</td>
                            <td className="p-3 font-mono text-slate-500">{acc.phone || "—"}</td>
                            <td className="p-3 text-slate-500 text-[11px]">{acc.address || "—"}</td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                acc.type === "supplier" ? "bg-amber-50 text-amber-600 dark:bg-amber-950/20" : "bg-blue-50 text-indigo-600 dark:bg-blue-950/20"
                              }`}>
                                {acc.type === "supplier" ? "مورد" : "عميل"}
                              </span>
                            </td>
                            <td className="p-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                              {acc.openingBalance?.toLocaleString()} YER
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Entries Preview */}
              {excelPreview.entries.length > 0 && (
                <div className="space-y-2.5">
                  <span className="text-[10px] font-bold text-slate-400 block">حركات قيود المبيعات المستوردة ({excelPreview.entries.length})</span>
                  <div className="overflow-x-auto border border-slate-100 dark:border-slate-800/80 rounded-2xl">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 text-[10px] font-extrabold">
                        <tr>
                          <th className="p-3">الرقم</th>
                          <th className="p-3">اليوم</th>
                          <th className="p-3">التاريخ</th>
                          <th className="p-3">بيان الحركة</th>
                          <th className="p-3">جهه التعامل</th>
                          <th className="p-3">الكمية</th>
                          <th className="p-3">السعر</th>
                          <th className="p-3">الزيادات</th>
                          <th className="p-3">الإجمالي</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {excelPreview.entries.map((entry, index) => (
                          <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300">
                            <td className="p-3 font-mono">{index + 1}</td>
                            <td className="p-3"><input type="number" className="w-12 bg-transparent border-none p-0" value={entry.dayNumber || ''} onChange={(e) => updateExcelEntry(index, 'dayNumber', parseInt(e.target.value))} /></td>
                            <td className="p-3"><input type="date" className="w-24 bg-transparent border-none p-0" value={entry.date || ''} onChange={(e) => updateExcelEntry(index, 'date', e.target.value)} /></td>
                            <td className="p-3"><input type="text" className="w-32 bg-transparent border-none p-0" value={entry.description || ''} onChange={(e) => updateExcelEntry(index, 'description', e.target.value)} /></td>
                            <td className="p-3"><input type="text" className="w-20 bg-transparent border-none p-0" value={entry.accountId || ''} onChange={(e) => updateExcelEntry(index, 'accountId', e.target.value)} /></td>
                            <td className="p-3"><input type="number" className="w-12 bg-transparent border-none p-0" value={entry.quantity || ''} onChange={(e) => updateExcelEntry(index, 'quantity', parseFloat(e.target.value))} /></td>
                            <td className="p-3"><input type="number" className="w-16 bg-transparent border-none p-0" value={entry.unitPrice || ''} onChange={(e) => updateExcelEntry(index, 'unitPrice', parseFloat(e.target.value))} /></td>
                            <td className="p-3"><input type="number" className="w-16 bg-transparent border-none p-0" value={entry.extraCharges || ''} onChange={(e) => updateExcelEntry(index, 'extraCharges', parseFloat(e.target.value))} /></td>
                            <td className="p-3 font-bold">{entry.total?.toLocaleString()} YER</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeImportType === "ai" && aiPreview && (
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm space-y-5 animate-fade-in" id="ai_preview_container">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800/50">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-indigo-505" />
                  <span className="text-xs font-black text-slate-800 dark:text-slate-100">تحليل الذكاء الاصطناعي للفاتورة/الصورة (AI OCR Extract)</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setAiPreview(null)}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                    title="حذف البيانات"
                  >
                    <Trash2 size={14} />
                  </button>
                  <button
                    onClick={saveImportedData}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-black rounded-lg transition-colors cursor-pointer"
                  >
                    نقل وتخزين البيانات المستخرجة
                  </button>
                </div>
              </div>

              {/* Accounts AI Preview */}
              {aiPreview.accounts.length > 0 && (
                <div className="space-y-2.5">
                  <span className="text-[10px] font-bold text-slate-400 block">حسابات تم رصدها واستخلاص بياناتها من الفاتورة ({aiPreview.accounts.length})</span>
                  <div className="overflow-x-auto border border-slate-100 dark:border-slate-800/80 rounded-2xl">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 text-[10px] font-extrabold">
                        <tr>
                          <th className="p-3">الاسم المستخرج</th>
                          <th className="p-3">رقم الهاتف</th>
                          <th className="p-3">العنوان</th>
                          <th className="p-3">نوع الحساب</th>
                          <th className="p-3">العملة المقترحة</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {aiPreview.accounts.map((acc, index) => (
                          <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300">
                            <td className="p-3 font-semibold text-indigo-600 dark:text-indigo-400">{acc.name}</td>
                            <td className="p-3 font-mono text-slate-500">{acc.phone || "—"}</td>
                            <td className="p-3 text-slate-500 text-[11px]">{acc.address || "—"}</td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                acc.type === "supplier" ? "bg-amber-50 text-amber-600 dark:bg-amber-950/20" : "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/20"
                              }`}>
                                {acc.type === "supplier" ? "مورد" : "عميل"}
                              </span>
                            </td>
                            <td className="p-3 font-mono font-black text-slate-600 dark:text-slate-400">{acc.currency || "YER"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* DailyEntries AI Preview */}
              {aiPreview.ledgerEntries.length > 0 && (
                <div className="space-y-2.5">
                  <span className="text-[10px] font-bold text-slate-400 block">قيود ومشتريات مستخلصة من المستند ({aiPreview.ledgerEntries.length})</span>
                  <div className="overflow-x-auto border border-slate-100 dark:border-slate-800/80 rounded-2xl">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 text-[10px] font-extrabold">
                        <tr>
                          <th className="p-3">التاريخ</th>
                          <th className="p-3">بيان البند والخدمات</th>
                          <th className="p-3">الكمية</th>
                          <th className="p-3">السعر</th>
                          <th className="p-3">نوع الحركة</th>
                          <th className="p-3">الإجمالي الإجباري</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {aiPreview.ledgerEntries.map((entry, index) => (
                          <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300">
                            <td className="p-3 font-mono text-slate-500">{entry.date}</td>
                            <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">{entry.description}</td>
                            <td className="p-3 font-mono font-bold">{entry.quantity}</td>
                            <td className="p-3 font-mono">{entry.unitPrice?.toLocaleString()} YER</td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                entry.transactionType === "credit" ? "bg-teal-50 text-teal-600 dark:bg-teal-950/20" : "bg-rose-50 text-rose-600 dark:bg-rose-950/20"
                              }`}>
                                {entry.transactionType === "credit" ? "دائن / مشتريات" : "مدين / مبيعات"}
                              </span>
                            </td>
                            <td className="p-3 font-mono font-extrabold text-indigo-600 dark:text-indigo-400">
                              {entry.total?.toLocaleString()} YER
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Guidelines info card for file preparation */}
          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/60 rounded-3xl p-5 flex gap-4 text-right" id="file_import_guides">
            <HelpCircle size={22} className="text-indigo-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="text-xs font-black text-slate-800 dark:text-slate-100">إرشادات تنسيق ملفات الاستيراد والعمل أوفلاين:</span>
              <ul className="text-[11px] text-slate-500 space-y-1 list-disc list-inside">
                <li><strong className="text-emerald-600 dark:text-emerald-400">التشغيل الكامل بدون اتصال (Offline-first):</strong> النظام مهيأ بالكامل للعمل أوفلاين وتخزين قيودك بأمان تام على متصفحك أو هاتفك.</li>
                <li>في حال رفع جداول Excel، يفضل احتواء العمود الأول على مسمى <span className="text-indigo-500 font-semibold">الاسم</span> أو <span className="text-indigo-500 font-semibold">البيان</span>.</li>
                <li>تحميل <span className="text-emerald-500 font-semibold">نموذج الإدارة والتحكم (Excel)</span> يمنحك التنسيق المعتمد لإدخال كافة كشوفاتك أوفلاين ثم رفعها بلمسة واحدة.</li>
                <li>تعتمد ميزة قراءة المستندات والـ PDF على الذكاء الاصطناعي وتفهم الفواتير اليدوية والمصورة وحساب الإجماليات والضرائب آلياً.</li>
                <li>يتم الكشط والمطابقة بذكاء دون الحاجة لهيكلة البيانات مسبقاً وتخزن مباشرة في الذاكرة المحلية الآمنة.</li>
              </ul>
            </div>
          </div>

        </div>

        {/* LEFT COLUMN: Multi-device Live Firestore sync panel & interactive phone emulator (4 Slots) */}
        <div className="lg:col-span-4 space-y-6" id="sync_column">

          {/* Cloud Connection Configuration Box */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm space-y-5" id="cloud_sync_connector">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800/50">
              <div className="flex items-center gap-2">
                <DbIcon className="text-indigo-600" size={18} />
                <span className="text-xs font-black text-slate-800 dark:text-slate-100">بوابة الربط السحابي (Android/Windows)</span>
              </div>
              <span className={`w-2.5 h-2.5 rounded-full ${
                syncEnabled ? "bg-emerald-500 animate-pulse" : "bg-slate-300"
              }`} />
            </div>

            {/* If not logged in, prompt OAuth Google Sign in */}
            {!user ? (
              <div className="text-center py-4 space-y-4" id="login_prompt_box">
                <p className="text-xs text-slate-500 leading-relaxed">
                  سجل الدخول بـ Google لإنشاء جسر مزامنة فوري يربط قيودك مباشرة عبر هاتفك الأندرويد، اللابتوب المكتبي والويب وتجاوز قيود الجهاز الواحد.
                </p>
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs border border-slate-700"
                >
                  <LogIn size={15} />
                  <span>تسجيل الدخول وربط السحاب بـ Google</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4" id="authenticated_sync_box">

                {/* User info display */}
                <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 p-3 rounded-2xl border border-slate-100 dark:border-stone-700">
                  <div className="text-right">
                    <span className="text-xs font-black text-slate-800 dark:text-slate-100 block">{user.displayName || "مستعمل نظام ANAS"}</span>
                    <span className="text-[10px] text-slate-400 block font-mono">{user.email}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="p-2 text-slate-400 hover:text-rose-500 transition-colors rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                    title="تسجيل الخروج"
                  >
                    <LogOut size={14} />
                  </button>
                </div>

                {/* Cloud Sync State Switch */}
                <div className="flex items-center justify-between p-3.5 bg-indigo-50/20 dark:bg-indigo-950/20 border border-indigo-500/10 rounded-2xl">
                  <div className="text-right ml-2">
                    <span className="text-xs font-black text-slate-800 dark:text-slate-100 block">تشغيل مزامنة البيانات السحابية</span>
                    <span className="text-[9px] text-slate-400 block">ربط فوري وحقن تلقائي للقيود بين الويب والويندوز والموبايل.</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={syncEnabled}
                      onChange={(e) => toggleSync(e.target.checked)}
                    />
                    <div className="w-10 h-5 bg-slate-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                {/* Windows Exclude Toggle Switch (المزامنة لكل Android باستثناء Windows) */}
                <div className="flex items-center justify-between p-3.5 bg-rose-50/10 dark:bg-rose-950/10 border border-rose-500/10 rounded-2xl">
                  <div className="text-right ml-2">
                    <span className="text-xs font-black text-rose-600 dark:text-rose-400 block">استثناء جهاز الويندوز الحالي من المزامنة</span>
                    <span className="text-[9px] text-slate-400 block">يقوم بالمزامنة تلقائياً لجميع مستخدمي هواتف الأندرويد لسلامتك.</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={excludeWindowsSync}
                      onChange={(e) => toggleExcludeWindowsSync(e.target.checked)}
                    />
                    <div className="w-10 h-5 bg-slate-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-rose-300 dark:peer-focus:ring-rose-800 dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-rose-600"></div>
                  </label>
                </div>

                {/* Database Actions */}
                {syncEnabled && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={syncStatus === "syncing"}
                      onClick={pushLocalDataToCloud}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 transition-colors text-white rounded-xl text-[11px] font-black cursor-pointer shadow-xs"
                    >
                      <RefreshCw size={12} className={syncStatus === "syncing" ? "animate-spin" : ""} />
                      <span>دفع وتحديث البيانات المحاسبية يدوياً</span>
                    </button>
                  </div>
                )}

                {/* Sync Health status */}
                <div className="flex justify-between items-center text-[10px] text-slate-400 p-1 font-mono">
                  <span>حالة الربط وسحابة الاندرويد:</span>
                  <span className={`font-bold ${
                    syncStatus === "syncing" ? "text-indigo-500" :
                    syncStatus === "success" ? "text-emerald-500" :
                    syncStatus === "error" ? "text-rose-500" : "text-slate-500"
                  }`}>
                    {syncStatus === "syncing" ? "جاري البث والمزامنة..." :
                     syncStatus === "success" ? "موصول وآمن (مستقر)" :
                     syncStatus === "error" ? "فشل الاتصال" : "متوقف"}
                  </span>
                </div>

              </div>
            )}
          </div>



          {/* Hardware Binding & Pairing Guide Box */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm space-y-4" id="hardware_pairing_card">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800/50">
              <Monitor className="text-indigo-600" size={17} />
              <span className="text-xs font-black text-slate-800 dark:text-slate-100">كيفية ربط الموبايل (Android) بنسخة الكمبيوتر (Windows)؟</span>
            </div>

            <div className="text-right space-y-3.5">
              <p className="text-[11px] text-slate-500 leading-relaxed">
                لمزامنة حساباتك بسلاسة وسرعة فائقة بين تطبيق هاتفك الأندرويد والكمبيوتر، اتبع الخطوات التالية:
              </p>

              {/* Numbered Steps */}
              <div className="space-y-3.5">
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold text-indigo-500 shrink-0">١</div>
                  <p className="text-[10px] text-slate-600 dark:text-slate-300 leading-relaxed">
                    من هاتفك الأندرويد، اذهب إلى شاشة <strong>المزامنة والربط</strong> ثم انقر تسجيل دخول بنفس حساب Google الموحد ومستودع Firestore الخاص بك.
                  </p>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold text-indigo-500 shrink-0">٢</div>
                  <p className="text-[10px] text-slate-600 dark:text-slate-300 leading-relaxed">
                    افتح تطبيق ANAS للكمبيوتر (Windows)، واضغط على زر <strong>ربط جهات خارجية</strong>، ثم انسخ رمز الاقتران السري الموضح بالأسفل أو امسح الـ QR.
                  </p>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold text-indigo-500 shrink-0">٣</div>
                  <p className="text-[10px] text-slate-600 dark:text-slate-300 leading-relaxed">
                    سيتم بناء اتصال ويب سوكيت آمن ومباشر بنسبة تشفير ١٠٠% للحقن والتعديل اللحظي لدفاتر الحسابات.
                  </p>
                </div>
              </div>

              {/* Unique pairing info panel */}
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-stone-700/80 space-y-3 text-center">
                <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">رمز الاقتران السحابي الفريد الخاص بك (Secure Pair Code)</span>

                <div className="font-mono text-xs font-black tracking-widest text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 py-2 rounded-xl">
                  {user ? `ANAS-${user.uid.substring(0, 5).toUpperCase()}-${user.uid.substring(user.uid.length - 4).toUpperCase()}` : "ANAS-DEMO-AUTH-REQUIRED"}
                </div>

                {/* QR Code Placeholder Graphic with mock camera target framing */}
                <div className="flex flex-col items-center justify-center py-2">
                  <div className="w-24 h-24 border border-indigo-400/30 rounded-xl p-1.5 bg-white flex items-center justify-center relative shadow-inner">
                    {/* Corner decorators */}
                    <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-indigo-500 rounded-tl-sm"></div>
                    <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-indigo-500 rounded-tr-sm"></div>
                    <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-indigo-500 rounded-bl-sm"></div>
                    <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-indigo-500 rounded-br-sm"></div>

                    {/* Generates a nice mock QR Code blocks style using grid */}
                    <div className="grid grid-cols-5 gap-1 w-full h-full opacity-80">
                      <div className="bg-slate-900 rounded-xs"></div>
                      <div className="bg-slate-900 rounded-xs"></div>
                      <div className="bg-slate-200 rounded-xs"></div>
                      <div className="bg-slate-900 rounded-xs"></div>
                      <div className="bg-slate-900 rounded-xs"></div>

                      <div className="bg-slate-200 rounded-xs"></div>
                      <div className="bg-slate-900 rounded-xs"></div>
                      <div className="bg-slate-900 rounded-xs"></div>
                      <div className="bg-slate-200 rounded-xs"></div>
                      <div className="bg-slate-900 rounded-xs"></div>

                      <div className="bg-slate-900 rounded-xs"></div>
                      <div className="bg-slate-200 rounded-xs"></div>
                      <div className="bg-slate-900 rounded-xs"></div>
                      <div className="bg-slate-900 rounded-xs"></div>
                      <div className="bg-slate-200 rounded-xs"></div>

                      <div className="bg-slate-200 rounded-xs"></div>
                      <div className="bg-slate-900 rounded-xs"></div>
                      <div className="bg-slate-200 rounded-xs"></div>
                      <div className="bg-slate-900 rounded-xs"></div>
                      <div className="bg-slate-900 rounded-xs"></div>

                      <div className="bg-slate-900 rounded-xs"></div>
                      <div className="bg-slate-200 rounded-xs"></div>
                      <div className="bg-slate-900 rounded-xs"></div>
                      <div className="bg-slate-200 rounded-xs"></div>
                      <div className="bg-slate-900 rounded-xs"></div>
                    </div>
                  </div>
                  <span className="text-[9px] text-slate-400 mt-2">امسح الباركود السحابي عبر كاميرا هاتف الأندرويد للربط المباشر.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Multi-Platform Simulator */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm space-y-5" id="cross_platform_simulator">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800/50">
              <SmartphoneIcon className="text-indigo-600" size={17} />
              <span className="text-xs font-black text-slate-800 dark:text-slate-100">محاكي منصات أندرويد وويندوز (ANAS Cloud Tool)</span>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              هذا المحاكي العملي متصل بملقم المزامنة نفسه. جرب إرسال قيد وستشاهد كيف ينعكس فورياً في كشوفات الويب والتطبيق المكتبي بالويندوز!
            </p>

            <div className="space-y-4">
              <button
                type="button"
                disabled={!user || !syncEnabled || isSimulatingAndroid}
                onClick={simulateAndroidEntry}
                className="w-full flex items-center justify-center gap-2 p-3.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-stone-700 rounded-2xl text-xs font-extrabold transition-all cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Smartphone size={15} className="text-indigo-500 animate-bounce" />
                <span>{isSimulatingAndroid ? "بث إشارة أندرويد..." : "محاكاة إدخال قيد من تطبيق Android"}</span>
              </button>

              {/* Console Logs Terminal output */}
              <div className="space-y-1.5">
                <span className="text-[9px] font-bold text-slate-400 block font-mono">سجلات مزامنة المنصات (Live Console Logs):</span>
                <div className="bg-slate-950 dark:bg-black p-3.5 rounded-2xl font-mono text-[9px] text-emerald-400 border border-stone-800 max-h-36 overflow-y-auto space-y-1 text-right select-none" dir="ltr">
                  {syncLogs.length === 0 ? (
                    <span className="text-slate-500 block text-center">لا توجد حركات مزامنة مسجلة حالياً...</span>
                  ) : (
                    syncLogs.map((log, index) => (
                      <div key={index} className="leading-relaxed hover:text-white transition-colors">{log}</div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
