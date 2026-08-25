'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Plus,
  CheckCircle,
  XCircle,
  Lock,
  Unlock,
  AlertCircle,
  FileText,
  Building,
  DollarSign,
  Send,
} from 'lucide-react';

export default function JournalDetailPage() {
  const params = useParams();
  const journalId = params.id;
  const queryClient = useQueryClient();
  const [actionError, setActionError] = useState('');

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
        <div className="p-8 text-center text-slate-500 font-bold">جاري تحميل تفاصيل اليومية...</div>
      </DashboardLayout>
    );
  }

  if (error || !journal) {
    return (
      <DashboardLayout>
        <div className="p-8 text-center text-rose-600 font-bold">تعذر تحميل بيانات اليومية</div>
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
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white">{journal.journalNumber}</h1>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                journal.status === 'OPEN' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' :
                journal.status === 'CLOSED' ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
              }`}>
                {journal.status === 'OPEN' ? 'مفتوحة (OPEN)' : journal.status === 'CLOSED' ? 'مغلقة (CLOSED)' : journal.status}
              </span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-bold">
              التاريخ: {new Date(journal.journalDate).toLocaleDateString('ar-SA')} | الصندوق: {journal.cashbox?.name || 'الصندوق الافتراضي'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {journal.status === 'OPEN' && (
              <Link
                href="/transactions/new"
                className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black px-4 py-2.5 rounded-xl text-sm shadow transition"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة سند جديد</span>
              </Link>
            )}

            {journal.status !== 'CLOSED' ? (
              <button
                onClick={() => closeMutation.mutate()}
                disabled={closeMutation.isPending}
                className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2.5 rounded-xl text-sm shadow transition"
              >
                <Lock className="w-4 h-4" />
                <span>{closeMutation.isPending ? 'جاري الإغلاق...' : 'إغلاق اليومية'}</span>
              </button>
            ) : (
              <button
                onClick={() => reopenMutation.mutate()}
                disabled={reopenMutation.isPending}
                className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white font-bold px-4 py-2.5 rounded-xl text-sm shadow transition"
              >
                <Unlock className="w-4 h-4" />
                <span>{reopenMutation.isPending ? 'جاري الفتح...' : 'إعادة فتح اليومية'}</span>
              </button>
            )}
          </div>
        </div>

        {actionError && (
          <div className="p-4 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-xl text-sm font-semibold flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{actionError}</span>
          </div>
        )}

        {/* Transactions Table */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 font-bold text-slate-700 dark:text-slate-200 text-sm flex items-center justify-between">
            <span>سندات الصرف في هذه اليومية ({totalCount} سند)</span>
            {unassignedCount > 0 && (
              <span className="text-xs font-black text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-3 py-1 rounded-lg border border-rose-200 dark:border-rose-800">
                يوجد {unassignedCount} سندات بدون مشروع
              </span>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-sm">
              <thead>
                <tr className="bg-slate-100/70 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300">
                  <th className="p-3">#</th>
                  <th className="p-3">رقم السند اليدوي</th>
                  <th className="p-3">الرقم المرجعي</th>
                  <th className="p-3">المستفيد</th>
                  <th className="p-3">التفاصيل والبيان</th>
                  <th className="p-3">المشروع</th>
                  <th className="p-3">طريقة الدفع</th>
                  <th className="p-3">رقم الفاتورة</th>
                  <th className="p-3">ملاحظات</th>
                  <th className="p-3">المبلغ</th>
                  <th className="p-3">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {txs.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="p-8 text-center text-slate-400 font-medium">
                      لا توجد عمليات مسجلة في هذه اليومية حتى الآن.
                    </td>
                  </tr>
                ) : (
                  txs.map((tx: any, idx: number) => (
                    <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                      <td className="p-3 font-semibold text-slate-500">{idx + 1}</td>
                      <td className="p-3 font-bold text-slate-800 dark:text-slate-200">
                        {tx.manualVoucherNumber || '-'}
                      </td>
                      <td className="p-3 font-mono text-xs font-bold text-cyan-600 dark:text-cyan-400">{tx.systemReference}</td>
                      <td className="p-3 font-semibold text-slate-700 dark:text-slate-300">{tx.beneficiary?.name || tx.beneficiaryName}</td>
                      <td className="p-3 text-slate-600 dark:text-slate-400 max-w-xs truncate">{tx.description}</td>
                      <td className="p-3 font-bold">
                        {tx.project ? (
                          <span className="text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800 text-xs">
                            {tx.project.projectName}
                          </span>
                        ) : (
                          <span className="text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2.5 py-1 rounded-lg border border-rose-200 dark:border-rose-800 text-xs">
                            غير مربوط بمشروع
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-slate-700 dark:text-slate-300 text-xs font-bold">
                        {tx.paymentMethod?.name || '-'}
                        {tx.paymentReference && (
                          <span className="block text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-1">{tx.paymentReference}</span>
                        )}
                      </td>
                      <td className="p-3 text-slate-600 dark:text-slate-400 font-mono text-xs">
                        {tx.invoiceNumber || '-'}
                      </td>
                      <td className="p-3 text-slate-600 dark:text-slate-400 text-xs max-w-[180px] truncate" title={tx.notes || ''}>
                        {tx.notes || '-'}
                      </td>
                      <td className="p-3 font-extrabold text-cyan-700 dark:text-cyan-400 text-base font-mono-num">
                        {Number(tx.amount).toLocaleString()} ر.س
                      </td>
                      <td className="p-3">
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
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Live Journal Totals Summary Footer Bar */}
        <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-xl flex flex-wrap items-center justify-between gap-6">
          <div className="flex flex-wrap items-center gap-6 sm:gap-8">
            <div>
              <span className="text-xs text-slate-400 block font-bold">عدد السندات</span>
              <span className="text-xl font-black text-slate-100 font-mono-num">{totalCount}</span>
            </div>

            <div className="h-8 w-px bg-slate-800 hidden sm:block" />

            <div>
              <span className="text-xs text-slate-400 block font-bold">إجمالي المصروفات</span>
              <span className="text-xl font-black text-amber-400 font-mono-num">{totalAmount.toLocaleString()} ر.س</span>
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
      </div>
    </DashboardLayout>
  );
}
