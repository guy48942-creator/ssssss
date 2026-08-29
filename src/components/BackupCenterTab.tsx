import React, { useState, useEffect } from 'react';
import { Cloud, Download, Trash2, RefreshCw, HardDrive, ShieldCheck, AlertCircle, Clock, Save, FileDown } from 'lucide-react';
import { BackupService, BackupMetadata } from '../backupService';
import { Database } from '../utils';

interface BackupCenterTabProps {
  db: Database;
  authUser: any;
  onRestore: () => void;
}

export const BackupCenterTab: React.FC<BackupCenterTabProps> = ({ db, authUser, onRestore }) => {
  const [backups, setBackups] = useState<{ driveId: string, metadata: BackupMetadata }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);

  // Settings state
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(localStorage.getItem('smartacc_auto_backup') !== 'false');
  const [backupInterval, setBackupInterval] = useState(parseInt(localStorage.getItem('smartacc_backup_interval') || '48', 10));
  const [wifiOnly, setWifiOnly] = useState(localStorage.getItem('smartacc_backup_wifi_only') === 'true');
  const [keepLimit, setKeepLimit] = useState(parseInt(localStorage.getItem('smartacc_backup_keep_limit') || '10', 10));

  const backupService = authUser ? new BackupService(authUser.uid) : null;

  useEffect(() => {
    if (authUser) {
      fetchBackups();
    }
  }, [authUser]);

  useEffect(() => {
    localStorage.setItem('smartacc_auto_backup', autoBackupEnabled.toString());
    localStorage.setItem('smartacc_backup_interval', backupInterval.toString());
    localStorage.setItem('smartacc_backup_wifi_only', wifiOnly.toString());
    localStorage.setItem('smartacc_backup_keep_limit', keepLimit.toString());
  }, [autoBackupEnabled, backupInterval, wifiOnly, keepLimit]);

  const fetchBackups = async () => {
    if (!backupService) return;
    setLoading(true);
    try {
      const list = await backupService.listBackups();
      setBackups(list);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch backups');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadLog = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backups.map(b => b.metadata), null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `backup_log_${new Date().toISOString()}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleBackupNow = async () => {
    if (!backupService) return;
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    setProgress(20);
    try {
      const state = db.exportState();
      setProgress(50);
      await backupService.uploadBackup(state, 'Full');
      setProgress(100);
      setSuccessMsg('تم إنشاء النسخة الاحتياطية ورفعها بنجاح.');
      await fetchBackups();

      // Update last automatic backup time
      localStorage.setItem('smartacc_last_auto_backup_ts', Date.now().toString());
    } catch (err: any) {
      setError(err.message || 'فشل النسخ الاحتياطي');
    } finally {
      setTimeout(() => setProgress(null), 1000);
      setLoading(false);
    }
  };

  const handleRestore = async (driveId: string) => {
    if (!backupService) return;
    const confirm = window.confirm('هل أنت متأكد من استعادة هذه النسخة؟ سيتم استبدال جميع البيانات الحالية.');
    if (!confirm) return;

    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    setProgress(10);
    try {
      // 1. Create a local safety backup
      const currentState = db.exportState();
      localStorage.setItem('smartacc_safety_backup', JSON.stringify(currentState));
      setProgress(30);

      // 2. Download remote backup
      const backupData = await backupService.downloadBackup(driveId);
      setProgress(70);

      // 3. Import
      db.importState(backupData);

      // Notify parent to force re-render
      onRestore();

      setProgress(100);
      setSuccessMsg('تمت استعادة النسخة الاحتياطية بنجاح.');
    } catch (err: any) {
      setError(err.message || 'فشلت عملية الاستعادة');
    } finally {
      setTimeout(() => setProgress(null), 1000);
      setLoading(false);
    }
  };

  const handleDelete = async (driveId: string) => {
    if (!backupService) return;
    const confirm = window.confirm('هل أنت متأكد من حذف هذه النسخة الاحتياطية نهائياً؟');
    if (!confirm) return;

    setLoading(true);
    try {
      await backupService.deleteBackup(driveId);
      setSuccessMsg('تم حذف النسخة بنجاح.');
      await fetchBackups();
    } catch (err: any) {
      setError(err.message || 'فشل الحذف');
    } finally {
      setLoading(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const totalUsedSpace = backups.reduce((acc, curr) => acc + (curr.metadata.size || 0), 0);

  if (!authUser) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <ShieldCheck size={64} className="text-slate-300 mb-4" />
        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">تسجيل الدخول مطلوب</h2>
        <p className="text-slate-500 max-w-md">يرجى تسجيل الدخول باستخدام حساب جوجل للوصول إلى نظام النسخ الاحتياطي السحابي الآمن الخاص بك.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <Cloud className="text-emerald-500" />
          نظام النسخ الاحتياطي السحابي
        </h2>
        <button
          onClick={handleBackupNow}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors disabled:opacity-50"
        >
          {loading ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
          نسخ احتياطي الآن
        </button>
      </div>

      {/* Progress Bar */}
      {progress !== null && (
        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
          <div className="bg-emerald-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
        </div>
      )}

      {/* Alerts */}
      {error && (
        <div className="bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 p-4 rounded-xl flex items-center gap-3">
          <AlertCircle size={20} />
          {error}
        </div>
      )}
      {successMsg && (
        <div className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 p-4 rounded-xl flex items-center gap-3">
          <ShieldCheck size={20} />
          {successMsg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg">
              <Clock size={20} />
            </div>
            <h3 className="font-semibold text-slate-700 dark:text-slate-300">أحدث نسخة</h3>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {backups.length > 0 ? backups[0].metadata.date : 'لا يوجد'}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-lg">
              <HardDrive size={20} />
            </div>
            <h3 className="font-semibold text-slate-700 dark:text-slate-300">مساحة التخزين</h3>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {formatSize(totalUsedSpace)}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-50 dark:bg-purple-900/20 text-purple-600 rounded-lg">
              <ShieldCheck size={20} />
            </div>
            <h3 className="font-semibold text-slate-700 dark:text-slate-300">التشفير</h3>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">AES-256</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-lg">
              <RefreshCw size={20} />
            </div>
            <h3 className="font-semibold text-slate-700 dark:text-slate-300">النسخ التلقائي</h3>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {autoBackupEnabled ? `كل ${backupInterval} ساعة` : 'معطل'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg text-slate-800 dark:text-white">سجل النسخ الاحتياطية</h3>
            <div className="flex items-center gap-2">
              <button onClick={handleDownloadLog} className="text-slate-500 hover:text-blue-600" title="تحميل السجل">
                <FileDown size={18} />
              </button>
              <button onClick={fetchBackups} className="text-slate-500 hover:text-emerald-600">
                <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
            {backups.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                لا توجد نسخ احتياطية حتى الآن.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-700 border-b border-slate-100 dark:border-slate-700 text-sm text-slate-500">
                      <th className="p-4">التاريخ والوقت</th>
                      <th className="p-4">الجهاز</th>
                      <th className="p-4">الحجم</th>
                      <th className="p-4">النوع</th>
                      <th className="p-4 text-center">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {backups.map((backup) => (
                      <tr key={backup.driveId} className="hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                        <td className="p-4">
                          <div className="font-semibold text-slate-800 dark:text-slate-200" dir="ltr">{backup.metadata.date}</div>
                          <div className="text-xs text-slate-500" dir="ltr">{backup.metadata.time}</div>
                        </td>
                        <td className="p-4">
                          <div className="text-sm text-slate-700 dark:text-slate-300">{backup.metadata.deviceName}</div>
                          <div className="text-xs text-slate-500">{backup.metadata.os}</div>
                        </td>
                        <td className="p-4 text-sm text-slate-700 dark:text-slate-300">
                          {formatSize(backup.metadata.size)}
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                            backup.metadata.type === 'Full' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            {backup.metadata.type === 'Full' ? 'شامل' : 'تزايدي'}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleRestore(backup.driveId)}
                              className="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                              title="استعادة"
                            >
                              <Download size={18} />
                            </button>
                            <button
                              onClick={() => handleDelete(backup.driveId)}
                              className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              title="حذف"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-bold text-lg text-slate-800 dark:text-white">الإعدادات</h3>
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 space-y-5">

            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-slate-700 dark:text-slate-200">النسخ التلقائي</div>
                <div className="text-xs text-slate-500">يعمل في الخلفية عند توفر الإنترنت</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={autoBackupEnabled} onChange={e => setAutoBackupEnabled(e.target.checked)} />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">تكرار النسخ</div>
              <select
                value={backupInterval}
                onChange={e => setBackupInterval(parseInt(e.target.value))}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                disabled={!autoBackupEnabled}
              >
                <option value={24}>كل 24 ساعة (يومياً)</option>
                <option value={48}>كل 48 ساعة (يومين)</option>
                <option value={168}>كل أسبوع</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">فقط عبر Wi-Fi</div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={wifiOnly} onChange={e => setWifiOnly(e.target.checked)} />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">الاحتفاظ بآخر:</div>
              <select
                value={keepLimit}
                onChange={e => setKeepLimit(parseInt(e.target.value))}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                <option value={10}>10 نسخ احتياطية</option>
                <option value={20}>20 نسخة احتياطية</option>
                <option value={50}>50 نسخة احتياطية</option>
                <option value={999}>لا نهائي</option>
              </select>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-700 text-xs text-slate-500">
              ملاحظة: يتم تشفير البيانات باستخدام خوارزمية AES-256 قبل رفعها، مما يضمن سرية وأمان معلوماتك تماماً.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};