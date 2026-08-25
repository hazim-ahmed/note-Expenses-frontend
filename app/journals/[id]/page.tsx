'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { downloadFile, exportClientExcel, openPdfInNewTab } from '@/lib/download';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Plus,
  Lock,
  Unlock,
  AlertCircle,
  FileSpreadsheet,
  Printer,
  Download,
  Loader2,
} from 'lucide-react';

export default function JournalDetailPage() {
  const params = useParams();
  const journalId = params.id;
  const queryClient = useQueryClient();
  const [actionError, setActionError] = useState('');
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const handleExportExcel = async () => {
    try {
      setIsExportingExcel(true);
      await downloadFile(`/journals/${journalId}/export/excel`, `Journal_${journal?.journalNumber || journalId}.xlsx`);
    } catch {
      // Fallback في حال تعذر الوصول للباك إند
      if (journal && Array.isArray(journal.transactions)) {
        const headers = [
          'م',
          'الرقم المرجعي',
          'رقم السند',
          'دفتر السند',
          'التاريخ',
          'المستفيد',
          'المشروع',
          'نوع الدفع',
          'مرجع الدفع',
          'رقم الفاتورة',
          'التفاصيل',
          'ملاحظات',
          'المبلغ (ر.س)'
        ];
        const rows = journal.transactions.map((tx: any, idx: number) => [
          idx + 1,
          tx.systemReference || '-',
          tx.manualVoucherNumber || '-',
          tx.voucherBookNumber || '-',
          tx.voucherDate ? new Date(tx.voucherDate).toLocaleDateString('ar-SA') : '-',
          tx.beneficiary?.name || '-',
          tx.project ? `${tx.project.projectName} ${tx.projectUnit ? `(وحدة ${tx.projectUnit.unitNumber})` : ''}` : 'غير مربوط',
          tx.paymentMethod?.name || 'نقدي',
          tx.paymentReference || '-',
          tx.invoiceNumber || '-',
          tx.description || '-',
          tx.notes || '-',
          Number(tx.amount) || 0,
        ]);
        const total = journal.transactions.reduce((sum: number, tx: any) => sum + (Number(tx.amount) || 0), 0);
        rows.push(['الإجمالي العام', '', '', '', '', '', '', '', '', '', '', '', total]);
        
        exportClientExcel(
          `جدول المصروفات اليومية - ${journal.journalNumber || journalId}`,
          headers,
          rows,
          `Journal_${journal.journalNumber || journalId}.csv`
        );
      } else {
        alert('لا توجد بيانات متاحة للتصدير');
      }
    } finally {
      setIsExportingExcel(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      setIsExportingPdf(true);
      await downloadFile(`/journals/${journalId}/export/pdf`, `Journal_${journal?.journalNumber || journalId}.pdf`);
    } catch {
      // Fallback للطباعة المباشرة من المتصفح في حال تعذر الاتصال
      window.print();
    } finally {
      setIsExportingPdf(false);
    }
  };

  const { data: journal, isLoading, error } = useQuery({
    queryKey: ['journal', journalId],
    queryFn: async () => {
      const res = await api.get(`/journals/${journalId}`);
      return res.data.data;
    },
  });

  const closeMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/journals/${journalId}/close`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal', journalId] });
      setActionError('');
    },
    onError: (err: any) => {
      setActionError(err.response?.data?.message || 'تعذر إغلاق اليومية');
    },
  });

  const reopenMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/journals/${journalId}/reopen`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal', journalId] });
      setActionError('');
    },
    onError: (err: any) => {
      setActionError(err.response?.data?.message || 'تعذر إعادة فتح اليومية');
    },
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="p-8 text-center text-slate-400 font-bold">جاري تحميل تفاصيل اليومية...</div>
      </DashboardLayout>
    );
  }

  if (error || !journal) {
    return (
      <DashboardLayout>
        <div className="p-8 text-center text-rose-500 font-bold">تعذر تحميل بيانات اليومية</div>
      </DashboardLayout>
    );
  }

  const txs = Array.isArray(journal.transactions) ? journal.transactions : [];
  const totalAmount = txs.reduce((sum: number, tx: any) => sum + (parseFloat(tx.amount) || 0), 0);
  const totalCount = txs.length;
  const unassignedCount = txs.filter((tx: any) => !tx.projectId).length;

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-28">
        {/* Header Info & Action Controls */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl flex flex-wrap items-center justify-between gap-4 print:hidden">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white font-mono-num">{journal.journalNumber}</h1>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                journal.status === 'OPEN'
                  ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 dark:border dark:border-emerald-800/60'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 dark:border dark:border-slate-700'
              }`}>
                {journal.status === 'OPEN' ? 'مفتوحة' : 'مغلقة'}
              </span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-bold">
              التاريخ: {new Date(journal.journalDate).toLocaleDateString('ar-SA')} | الصندوق: {journal.cashbox?.name || 'الصندوق الافتراضي'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleExportExcel}
              disabled={isExportingExcel}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3.5 py-2.5 rounded-xl text-sm shadow-sm transition disabled:opacity-50"
              title="تصدير بيانات اليومية إلى ملف Excel"
            >
              {isExportingExcel ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileSpreadsheet className="w-4 h-4" />
              )}
              <span>إكسل Excel</span>
            </button>

            <button
              onClick={handleExportPDF}
              disabled={isExportingPdf}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold px-3.5 py-2.5 rounded-xl text-sm shadow-sm border border-slate-700 dark:border-slate-600 transition disabled:opacity-50"
              title="تصدير أو طباعة اليومية بصيغة PDF مع خانات التوقيع والاعتماد"
            >
              {isExportingPdf ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Printer className="w-4 h-4" />
              )}
              <span>طباعة PDF</span>
            </button>

            {journal.status === 'OPEN' && (
              <Link
                href="/transactions/new"
                className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 dark:bg-gradient-to-r dark:from-cyan-600 dark:to-blue-600 text-white font-bold px-4 py-2.5 rounded-xl text-sm shadow-lg shadow-cyan-600/20 transition"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة سند جديد</span>
              </Link>
            )}

            {journal.status !== 'CLOSED' ? (
              <button
                onClick={() => closeMutation.mutate()}
                disabled={closeMutation.isPending}
                className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-bold px-4 py-2.5 rounded-xl text-sm shadow transition"
              >
                <Lock className="w-4 h-4" />
                <span>{closeMutation.isPending ? 'جاري الإغلاق...' : 'إغلاق اليومية'}</span>
              </button>
            ) : (
              <button
                onClick={() => reopenMutation.mutate()}
                disabled={reopenMutation.isPending}
                className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-bold px-4 py-2.5 rounded-xl text-sm shadow transition"
              >
                <Unlock className="w-4 h-4" />
                <span>{reopenMutation.isPending ? 'جاري الفتح...' : 'إعادة فتح اليومية'}</span>
              </button>
            )}
          </div>
        </div>

        {/* الترويسة المحاسبية الرسمية للطباعة (تظهر فقط عند الطباعة أو التصدير) */}
        <div className="hidden print:block mb-4 border-b-2 border-slate-800 pb-3">
          <div className="flex items-start justify-between mb-3">
            <div className="text-right w-1/3">
              <h2 className="text-xs font-bold text-slate-900">نظام إدارة المصروفات وسندات الصرف</h2>
              <span className="text-[10px] text-slate-600 block">إدارة الشؤون المالية والحسابات العامة</span>
            </div>
            <div className="text-center w-1/3">
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">« دفتر المصروفات »</h1>
              <span className="text-[11px] font-semibold text-slate-700 block">
                {journal.status === 'CLOSED' ? 'سجل اليومية العامة المعتمدة' : 'سجل اليومية العامة - قيد المراجعة'}
              </span>
            </div>
            <div className="text-left w-1/3 text-[10px] text-slate-600 space-y-0.5">
              <div><strong>رقم الكشف:</strong> <span className="font-mono">{journal.journalNumber || journalId}</span></div>
              <div><strong>تاريخ التقرير:</strong> {new Date(journal.journalDate).toLocaleDateString('ar-SA')}</div>
              <div><strong>وقت الإنشاء:</strong> {new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}</div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-0 border border-slate-300 bg-slate-50 text-[11px] text-slate-800">
            <div className="p-2 border-l border-slate-300"><strong>عدد المصروفات:</strong> <span className="font-mono font-bold">{totalCount} سند</span></div>
            <div className="p-2 border-l border-slate-300"><strong>إجمالي قيمة المصروفات:</strong> <span className="font-mono font-bold text-slate-900">{totalAmount.toLocaleString()} ر.س</span></div>
            <div className="p-2 border-l border-slate-300"><strong>تاريخ بداية الفترة:</strong> {new Date(journal.journalDate).toLocaleDateString('ar-SA')}</div>
            <div className="p-2"><strong>الصندوق المالي:</strong> {journal.cashbox?.name || 'الصندوق الرئيسي'}</div>
          </div>
        </div>

        {/* Action Error Banner */}
        {actionError && (
          <div className="p-4 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-xl text-sm font-semibold flex items-center gap-3 print:hidden">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{actionError}</span>
          </div>
        )}

        {/* Transactions Table */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl overflow-hidden print:border-none print:shadow-none print:rounded-none">
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 font-bold text-slate-700 dark:text-slate-200 text-sm flex items-center justify-between print:hidden">
            <span>سندات الصرف في هذه اليومية ({totalCount} سند)</span>
            {unassignedCount > 0 && (
              <span className="text-xs font-black text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-3 py-1 rounded-lg border border-rose-200 dark:border-rose-800/60 print:hidden">
                يوجد {unassignedCount} سندات بدون مشروع
              </span>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-sm print:text-[10px]">
              <thead>
                <tr className="bg-slate-800 dark:bg-slate-800 text-white border-b border-slate-300 text-xs font-bold print:bg-[#1F2937] print:text-white">
                  <th className="p-2.5 text-center w-10">#</th>
                  <th className="p-2.5 text-center">تاريخ المصروف</th>
                  <th className="p-2.5">بيان المصروف</th>
                  <th className="p-2.5">المستفيد</th>
                  <th className="p-2.5">التصنيف</th>
                  <th className="p-2.5">مركز التكلفة (المشروع)</th>
                  <th className="p-2.5 text-center">رقم السند</th>
                  <th className="p-2.5 text-center">رقم الفاتورة</th>
                  <th className="p-2.5 text-left font-mono">المبلغ</th>
                  <th className="p-2.5">الملاحظات</th>
                  <th className="p-2.5 print:hidden">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80">
                {txs.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="p-8 text-center text-slate-500 font-bold text-base">
                      لا توجد مصروفات خلال الفترة المحددة
                    </td>
                  </tr>
                ) : (
                  <>
                    {txs.map((tx: any, idx: number) => (
                      <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 print:even:bg-[#F8FAFC]">
                        <td className="p-2.5 text-center font-mono text-slate-500">{idx + 1}</td>
                        <td className="p-2.5 text-center font-mono text-xs">{new Date(tx.createdAt || journal.journalDate).toLocaleDateString('ar-SA')}</td>
                        <td className="p-2.5 font-medium text-slate-800 dark:text-slate-200 max-w-xs">{tx.description || '—'}</td>
                        <td className="p-2.5 font-semibold text-slate-700 dark:text-slate-300">{tx.beneficiary?.name || tx.beneficiaryName || '—'}</td>
                        <td className="p-2.5 text-xs text-slate-600 dark:text-slate-400">{tx.category?.name || '—'}</td>
                        <td className="p-2.5 font-semibold text-xs">
                          {tx.project ? (
                            <span className="text-slate-800 dark:text-cyan-300 print:text-slate-800">
                              {tx.project.projectName}
                            </span>
                          ) : (
                            <span className="text-rose-600 print:text-slate-500">
                              —
                            </span>
                          )}
                        </td>
                        <td className="p-2.5 text-center font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                          {tx.manualVoucherNumber || tx.systemReference || '—'}
                        </td>
                        <td className="p-2.5 text-center font-mono text-xs text-slate-600 dark:text-slate-400">
                          {tx.invoiceNumber || '—'}
                        </td>
                        <td className="p-2.5 font-bold text-slate-900 dark:text-cyan-400 text-left font-mono whitespace-nowrap">
                          {Number(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ر.س
                        </td>
                        <td className="p-2.5 text-slate-500 dark:text-slate-400 text-xs max-w-[150px]" title={tx.notes || ''}>
                          {tx.notes || '—'}
                        </td>
                        <td className="p-2.5 print:hidden">
                          {!tx.projectId && (
                            <Link
                              href={`/unassigned-projects?txId=${tx.id}`}
                              className="text-xs bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 font-bold px-2.5 py-1 rounded-lg border border-rose-300 dark:border-rose-700"
                            >
                              ربط بمشروع
                            </Link>
                          )}
                        </td>
                      </tr>
                    ))}
                    {/* صف الإجمالي الكلي للجدول */}
                    <tr className="bg-slate-100 dark:bg-slate-800/90 font-bold text-slate-900 dark:text-white border-t-2 border-slate-800 print:bg-[#EEF2F6]">
                      <td colSpan={8} className="p-3 text-center font-extrabold text-sm">الإجمالي الكلي</td>
                      <td className="p-3 font-extrabold text-sm text-left font-mono whitespace-nowrap">
                        {totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ر.س
                      </td>
                      <td colSpan={2}></td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Live Journal Totals Summary Footer Bar */}
        <div className="bg-slate-900 dark:bg-[#070d19] text-white p-5 rounded-2xl border border-slate-800 dark:border-slate-800/80 shadow-xl flex flex-wrap items-center justify-between gap-6">
          <div className="flex flex-wrap items-center gap-6 sm:gap-8">
            <div>
              <span className="text-xs text-slate-400 block font-bold">عدد السندات</span>
              <span className="text-xl font-black text-slate-100 font-mono-num">{totalCount}</span>
            </div>

            <div className="h-8 w-px bg-slate-800 hidden sm:block" />

            <div>
              <span className="text-xs text-slate-400 block font-bold">إجمالي المصروفات</span>
              <span className="text-xl font-black text-cyan-400 font-mono-num">{totalAmount.toLocaleString()} ر.س</span>
            </div>

            <div className="h-8 w-px bg-slate-800 hidden sm:block" />

            <div>
              <span className="text-xs text-slate-400 block font-bold">سندات بدون مشروع</span>
              <span className={`text-xl font-black font-mono-num ${unassignedCount > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {unassignedCount}
              </span>
            </div>
          </div>
        </div>

        {/* قسم التواقيع والاعتمادات الرسمية الثلاثية للطباعة والمحاسبة */}
        <div className="signatures-section hidden print:flex items-start justify-between pt-10 px-6 mt-6 border-t border-slate-300">
          <div className="text-center w-52 space-y-8">
            <span className="font-extrabold text-xs text-slate-800 block">إعداد: أمين الصندوق / المنظم</span>
            <div className="border-t border-slate-700 pt-1">
              <span className="text-[11px] text-slate-600 block">الاسم: ...................................</span>
              <span className="text-[11px] text-slate-600 block mt-1">التوقيع: .................................</span>
            </div>
          </div>

          <div className="text-center w-52 space-y-8">
            <span className="font-extrabold text-xs text-slate-800 block">تدقيق: المشرف المالي / المراجع</span>
            <div className="border-t border-slate-700 pt-1">
              <span className="text-[11px] text-slate-600 block">الاسم: ...................................</span>
              <span className="text-[11px] text-slate-600 block mt-1">التوقيع: .................................</span>
            </div>
          </div>

          <div className="text-center w-52 space-y-8">
            <span className="font-extrabold text-xs text-slate-800 block">اعتماد: المدير العام / الإدارة</span>
            <div className="border-t border-slate-700 pt-1">
              <span className="text-[11px] text-slate-600 block">الاعتماد: ..............................</span>
              <span className="text-[11px] text-slate-600 block mt-1">التاريخ والختم: [ &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; ]</span>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
