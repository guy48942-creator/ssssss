import React, { useState } from 'react';
import { Database } from '../utils';
import { UserRole, ActivityLog } from '../types';
import { FileText, Search, Trash2, Calendar, User, Tag, Filter, CheckCircle, Edit, Trash, RotateCcw } from 'lucide-react';

interface ActivityLogTabProps {
  db: Database;
  onDatabaseUpdate: () => void;
  role: UserRole;
  onNavigate: (tab: string) => void;
}

export default function ActivityLogTab({ db, onDatabaseUpdate, role, onNavigate }: ActivityLogTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAction, setFilterAction] = useState<string>('all');
  const [filterEntity, setFilterEntity] = useState<string>('all');
  const [filterUser, setFilterUser] = useState<string>('all');

  // Filter logs
  const filteredLogs = db.activityLogs.filter(log => {
    const matchesSearch = log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          log.username.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAction = filterAction === 'all' || log.actionType === filterAction;
    const matchesEntity = filterEntity === 'all' || log.entityType === filterEntity;
    const matchesUser = filterUser === 'all' || log.username.includes(filterUser);

    return matchesSearch && matchesAction && matchesEntity && matchesUser;
  });

  // Get list of unique users who have actions logged
  const uniqueUsers = Array.from(new Set(db.activityLogs.map(l => {
    // extract base name before parentheses if any
    const match = l.username.match(/^([^\(]+)/);
    return match ? match[1].trim() : l.username;
  })));

  const handleClearLogs = () => {
    if (role !== 'Admin') {
      alert('عذراً، تصفير سجل العمليات متاح فقط للمدير العام (Admin).');
      return;
    }

    if (confirm('هل أنت متأكد من تصفير وحذف جميع سجلات العمليات؟ لا يمكن التراجع عن هذا الإجراء.')) {
      db.activityLogs = [];
      db.logActivity(db.currentUser, 'delete', 'ledger_entry', 'all', 'تم تصفير وحذف جميع سجلات العمليات السابقة من قبل المدير العام.');
      db.save();
      onDatabaseUpdate();
    }
  };

  const getActionBadge = (actionType: ActivityLog['actionType']) => {
    switch (actionType) {
      case 'add':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400">
            <CheckCircle size={13} />
            <span>إضافة</span>
          </span>
        );
      case 'edit':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
            <Edit size={13} />
            <span>تعديل</span>
          </span>
        );
      case 'delete':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400">
            <Trash size={13} />
            <span>حذف</span>
          </span>
        );
      case 'restore':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400">
            <RotateCcw size={13} />
            <span>استعادة</span>
          </span>
        );
    }
  };

  const getEntityTypeLabel = (entityType: ActivityLog['entityType']) => {
    switch (entityType) {
      case 'account':
        return 'الحسابات';
      case 'transaction':
        return 'الحركات المالية';
      case 'ledger_entry':
        return 'قيود اليومية';
      case 'invoice':
        return 'الفواتير';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Widget */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5 mb-5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl">
              <FileText size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800 dark:text-slate-100">سجل عمليات النظام (Activity Log)</h2>
              <p className="text-sm text-slate-500 mt-1">تتبع دقيق لجميع حركات إضافة وتعديل وحذف قيود اليومية، الحركات المالية، الفواتير، والحسابات.</p>
            </div>
          </div>

          {role === 'Admin' && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigate('backup')}
                className="inline-flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:hover:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-4 py-2.5 rounded-xl font-bold text-sm transition-colors duration-150 self-start md:self-auto"
              >
                <RotateCcw size={16} />
                <span>استعادة البيانات</span>
              </button>
              <button
                onClick={handleClearLogs}
                className="inline-flex items-center gap-2 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 px-4 py-2.5 rounded-xl font-bold text-sm transition-colors duration-150 self-start md:self-auto"
              >
                <Trash2 size={16} />
                <span>تصفير السجل</span>
              </button>
            </div>
          )}
        </div>

        {/* Filters Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <span className="absolute inset-y-0 right-3 flex items-center text-slate-400">
              <Search size={16} />
            </span>
            <input
              type="text"
              placeholder="البحث عن عملية أو مستخدم..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-3 pr-10 py-2.5 bg-slate-50 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-500/10 dark:text-slate-200 text-slate-800"
            />
          </div>

          {/* Action Filter */}
          <div className="relative">
            <span className="absolute inset-y-0 right-3 flex items-center text-slate-400 pointer-events-none">
              <Filter size={15} />
            </span>
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="w-full pl-3 pr-10 py-2.5 bg-slate-50 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-500/10 dark:text-slate-200 text-slate-800 appearance-none"
            >
              <option value="all">كل العمليات (إضافة/تعديل/حذف)</option>
              <option value="add">إضافة قيد/فاتورة/حساب</option>
              <option value="edit">تعديل بيانات</option>
              <option value="delete">حذف قيود/حسابات</option>
              <option value="restore">عمليات الاستعادة</option>
            </select>
          </div>

          {/* Entity Filter */}
          <div className="relative">
            <span className="absolute inset-y-0 right-3 flex items-center text-slate-400 pointer-events-none">
              <Tag size={15} />
            </span>
            <select
              value={filterEntity}
              onChange={(e) => setFilterEntity(e.target.value)}
              className="w-full pl-3 pr-10 py-2.5 bg-slate-50 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-500/10 dark:text-slate-200 text-slate-800 appearance-none"
            >
              <option value="all">كل الأقسام</option>
              <option value="ledger_entry">دفتر اليومية / القيود</option>
              <option value="invoice">الفواتير</option>
              <option value="account">الحسابات (عملاء/موردين)</option>
              <option value="transaction">الحركات المالية المباشرة</option>
            </select>
          </div>

          {/* User Filter */}
          <div className="relative">
            <span className="absolute inset-y-0 right-3 flex items-center text-slate-400 pointer-events-none">
              <User size={15} />
            </span>
            <select
              value={filterUser}
              onChange={(e) => setFilterUser(e.target.value)}
              className="w-full pl-3 pr-10 py-2.5 bg-slate-50 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-500/10 dark:text-slate-200 text-slate-800 appearance-none"
            >
              <option value="all">كل المستخدمين والصلاحيات</option>
              {uniqueUsers.map(u => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Logs Table / List */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <FileText className="mx-auto text-slate-300 dark:text-slate-700 mb-3" size={40} />
            <p className="font-bold text-slate-700 dark:text-slate-300">لا توجد عمليات مسجلة تطابق عوامل التصفية</p>
            <p className="text-sm text-slate-400 mt-1">تأكد من إدخال نصوص بحث عامة أو تغيير خيارات التصفية.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950/50 text-slate-500 text-xs font-bold border-b border-slate-100 dark:border-slate-800">
                  <th className="p-4">التاريخ والوقت</th>
                  <th className="p-4">المستخدم / الصلاحية</th>
                  <th className="p-4">نوع العملية</th>
                  <th className="p-4">القسم</th>
                  <th className="p-4">تفاصيل الحركة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-sm">
                {filteredLogs.map((log) => {
                  const logDate = new Date(log.timestamp);
                  const formattedDate = logDate.toLocaleDateString('ar-YE', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit'
                  });
                  const formattedTime = logDate.toLocaleTimeString('ar-YE', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                  });

                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="p-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                          <Calendar size={13} className="text-slate-400" />
                          <span>{formattedDate} - {formattedTime}</span>
                        </div>
                      </td>
                      <td className="p-4 font-bold text-slate-800 dark:text-slate-200">
                        {log.username}
                      </td>
                      <td className="p-4">
                        {getActionBadge(log.actionType)}
                        {log.actionType === 'delete' && (
                          <button
                            onClick={() => onNavigate('recycle')}
                            className="mr-2 px-2 py-1 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-lg text-[10px] font-bold hover:bg-purple-100 transition-colors"
                          >
                            استعادة
                          </button>
                        )}
                      </td>
                      <td className="p-4">
                        <span className="text-xs font-bold px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded">
                          {getEntityTypeLabel(log.entityType)}
                        </span>
                      </td>
                      <td className="p-4 text-slate-700 dark:text-slate-300 font-medium max-w-md break-words leading-relaxed">
                        {log.details}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
