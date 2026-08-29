import React, { useState } from 'react';
import { Database } from '../utils';
import { UserRole } from '../types';
import { Trash2, RefreshCcw, FileX, ArchiveRestore, AlertTriangle } from 'lucide-react';

interface RecycleBinTabProps {
  db: Database;
  onDatabaseUpdate: () => void;
  role: UserRole;
}

export default function RecycleBinTab({ db, onDatabaseUpdate, role }: RecycleBinTabProps) {
  const [activeTab, setActiveTab] = useState<'accounts' | 'transactions' | 'entries'>('accounts');

  if (role === 'Salesperson') {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">عذراً، لا تملك صلاحية الوصول</h2>
        <p className="text-slate-500">هذه الصفحة مخصصة للمدراء والمحاسبين فقط.</p>
      </div>
    );
  }

  const handleRestoreAccount = (id: string) => {
    const accIndex = db.deletedAccounts.findIndex(a => a.id === id);
    if (accIndex > -1) {
      const acc = db.deletedAccounts[accIndex];
      acc.deletedAt = undefined;
      db.accounts.push(acc);
      db.deletedAccounts.splice(accIndex, 1);

      // Restore linked transactions automatically
      const linkedTxs = db.deletedTransactions.filter(tx => tx.accountId === id);
      linkedTxs.forEach(tx => {
        tx.deletedAt = undefined;
        db.transactions.push(tx);
      });
      db.deletedTransactions = db.deletedTransactions.filter(tx => tx.accountId !== id);

      db.logActivity(db.currentUser, 'restore', 'account', id, `تم استعادة الحساب المحذوف: ${acc.name}`);
      db.save();
      onDatabaseUpdate();
    }
  };

  const handleRestoreTransaction = (id: string) => {
    const txIndex = db.deletedTransactions.findIndex(t => t.id === id);
    if (txIndex > -1) {
      const tx = db.deletedTransactions[txIndex];
      // Make sure account exists
      if (!db.accounts.some(a => a.id === tx.accountId)) {
        alert("لا يمكن استعادة هذه العملية لأن الحساب المرتبط بها لا يزال محذوفاً. يرجى استعادة الحساب أولاً.");
        return;
      }
      tx.deletedAt = undefined;
      db.transactions.push(tx);
      db.deletedTransactions.splice(txIndex, 1);

      const account = db.accounts.find(a => a.id === tx.accountId);
      db.logActivity(db.currentUser, 'restore', 'transaction', id, `تم استعادة الحركة المالية بقيمة ${tx.amount} من الحساب ${account?.name || 'مجهول'}: ${tx.description}`);
      db.save();
      onDatabaseUpdate();
    }
  };

  const handleRestoreEntry = (id: string) => {
    const entryIndex = db.deletedDailyEntries.findIndex(e => e.id === id);
    if (entryIndex > -1) {
      const entry = db.deletedDailyEntries[entryIndex];
      entry.deletedAt = undefined;
      db.dailyEntries.push(entry);
      db.deletedDailyEntries.splice(entryIndex, 1);

      // Restore linked transactions automatically
      const linkedTxs = db.deletedTransactions.filter(tx => tx.sourceEntryId === id);
      linkedTxs.forEach(tx => {
        tx.deletedAt = undefined;
        db.transactions.push(tx);
      });
      db.deletedTransactions = db.deletedTransactions.filter(tx => tx.sourceEntryId !== id);

      db.logActivity(db.currentUser, 'restore', 'ledger_entry', id, `تم استعادة القيد اليومي لليوم ${entry.dayNumber}: ${entry.description}`);
      db.save();
      onDatabaseUpdate();
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-5 mb-5">
          <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-xl">
            <Trash2 size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 dark:text-slate-100">سلة المحذوفات</h2>
            <p className="text-sm text-slate-500 mt-1">يمكنك استعادة الحسابات أو العمليات التي تم حذفها عن طريق الخطأ.</p>
          </div>
        </div>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('accounts')}
            className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${
              activeTab === 'accounts'
                ? 'bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            الحسابات المحذوفة ({db.deletedAccounts.length})
          </button>
          <button
            onClick={() => setActiveTab('entries')}
            className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${
              activeTab === 'entries'
                ? 'bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            قيود الدفتر ({db.deletedDailyEntries.length})
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${
              activeTab === 'transactions'
                ? 'bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            العمليات المباشرة ({db.deletedTransactions.filter(t => !t.sourceEntryId).length})
          </button>
        </div>

        {activeTab === 'accounts' && (
          <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
            {db.deletedAccounts.length === 0 ? (
              <div className="p-8 text-center text-slate-500">سلة المحذوفات فارغة</div>
            ) : (
              <table className="w-full text-right text-sm">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  <tr>
                    <th className="p-3">اسم الحساب</th>
                    <th className="p-3">النوع</th>
                    <th className="p-3">تاريخ الحذف</th>
                    <th className="p-3 text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {db.deletedAccounts.map(acc => (
                    <tr key={acc.id} className="bg-white dark:bg-slate-900">
                      <td className="p-3 font-bold">{acc.name}</td>
                      <td className="p-3">{acc.type === 'supplier' ? 'مورد' : 'عميل'}</td>
                      <td className="p-3 text-slate-500" dir="ltr">{acc.deletedAt ? new Date(acc.deletedAt).toLocaleString('ar-SA') : '-'}</td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => handleRestoreAccount(acc.id)}
                          className="px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1.5"
                        >
                          <ArchiveRestore size={14} />
                          استعادة
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === 'entries' && (
          <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
            {db.deletedDailyEntries.length === 0 ? (
              <div className="p-8 text-center text-slate-500">سلة المحذوفات فارغة</div>
            ) : (
              <table className="w-full text-right text-sm">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  <tr>
                    <th className="p-3">التاريخ</th>
                    <th className="p-3">البيان</th>
                    <th className="p-3">الإجمالي</th>
                    <th className="p-3">تاريخ الحذف</th>
                    <th className="p-3 text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {db.deletedDailyEntries.map(entry => (
                    <tr key={entry.id} className="bg-white dark:bg-slate-900">
                      <td className="p-3">{entry.date}</td>
                      <td className="p-3 font-bold">{entry.description}</td>
                      <td className="p-3 font-mono">{entry.total.toLocaleString()}</td>
                      <td className="p-3 text-slate-500" dir="ltr">{entry.deletedAt ? new Date(entry.deletedAt).toLocaleString('ar-SA') : '-'}</td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => handleRestoreEntry(entry.id)}
                          className="px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1.5"
                        >
                          <ArchiveRestore size={14} />
                          استعادة
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
            <div className="bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 p-3 text-xs flex items-center gap-2">
              <AlertTriangle size={14} />
              <span>هنا تظهر العمليات التي تم حذفها مباشرة، أما العمليات المرتبطة بقيود الدفتر فتستعاد من خلال استعادة القيد نفسه.</span>
            </div>
            {db.deletedTransactions.filter(t => !t.sourceEntryId).length === 0 ? (
              <div className="p-8 text-center text-slate-500">سلة المحذوفات فارغة</div>
            ) : (
              <table className="w-full text-right text-sm">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  <tr>
                    <th className="p-3">التاريخ</th>
                    <th className="p-3">البيان</th>
                    <th className="p-3">المبلغ</th>
                    <th className="p-3">تاريخ الحذف</th>
                    <th className="p-3 text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {db.deletedTransactions.filter(t => !t.sourceEntryId).map(tx => (
                    <tr key={tx.id} className="bg-white dark:bg-slate-900">
                      <td className="p-3">{tx.date}</td>
                      <td className="p-3 font-bold">{tx.description}</td>
                      <td className="p-3 font-mono">{tx.amount.toLocaleString()}</td>
                      <td className="p-3 text-slate-500" dir="ltr">{tx.deletedAt ? new Date(tx.deletedAt).toLocaleString('ar-SA') : '-'}</td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => handleRestoreTransaction(tx.id)}
                          className="px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1.5"
                        >
                          <ArchiveRestore size={14} />
                          استعادة
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
