'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import Link from 'next/link';
import { Plus, Calendar, DollarSign, ListOrdered, Lock, Unlock, Edit2, Trash2, FileText, CheckCircle2, X } from 'lucide-react';

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const [editingTx, setEditingTx] = useState<any>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editVoucher, setEditVoucher] = useState('');

  // Fetch today's summary & auto journal status
  const { data: todaySummary, isLoading: summaryLoading } = useQuery({
    queryKey: ['today-overview'],
    queryFn: async () => {
      const res = await api.get('/today');
      return res.data?.data || null;
    },
  });

  // Fetch today's transactions
  const { data: transactionsRaw } = useQuery({
    queryKey: ['today-transactions'],
    queryFn: async () => {
      const res = await api.get('/today/transactions');
      return res.data?.data || [];
    },
  });

  const transactions = Array.isArray(transactionsRaw) ? transactionsRaw : [];

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: any }) => {
      const res = await api.patch(`/today/transactions/${id}`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['today-overview'] });
      queryClient.invalidateQueries({ queryKey: ['today-transactions'] });
      setEditingTx(null);
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'تعذر تعديل المصروف');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await api.delete(`/today/transactions/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['today-overview'] });
      queryClient.invalidateQueries({ queryKey: ['today-transactions'] });
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'تعذر حذف المصروف');
    },
  });

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTx) return;
    updateMutation.mutate({
      id: editingTx.id,
      payload: {
        amount: parseFloat(editAmount),
        description: editDescription,
        manualVoucherNumber: editVoucher || null,
      },
    });
  };

  // Add Expense Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCustomBeneficiary, setIsCustomBeneficiary] = useState(false);
  const [newBeneficiaryName, setNewBeneficiaryName] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newBeneficiaryId, setNewBeneficiaryId] = useState('');
  const [newCategoryId, setNewCategoryId] = useState('');
  const [newProjectId, setNewProjectId] = useState('');
  const [newVoucher, setNewVoucher] = useState('');
  const [newInvoice, setNewInvoice] = useState('');
  const [addError, setAddError] = useState('');

  // Master data for quick add
  const { data: beneficiaries = [] } = useQuery({
    queryKey: ['beneficiaries'],
    queryFn: async () => (await api.get('/beneficiaries')).data?.data || [],
    enabled: isAddModalOpen,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => (await api.get('/expense-categories')).data?.data || [],
    enabled: isAddModalOpen,
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects', true],
    queryFn: async () => (await api.get('/projects', { params: { activeOnly: true } })).data?.data || [],
    enabled: isAddModalOpen,
  });

  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post('/today/transactions', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['today-overview'] });
      queryClient.invalidateQueries({ queryKey: ['today-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['beneficiaries'] });
      setIsAddModalOpen(false);
      setNewAmount('');
      setNewDescription('');
      setNewBeneficiaryId('');
      setNewBeneficiaryName('');
      setIsCustomBeneficiary(false);
      setNewCategoryId('');
      setNewProjectId('');
      setNewVoucher('');
      setNewInvoice('');
      setAddError('');
    },
    onError: (err: any) => {
      setAddError(err.response?.data?.message || 'تعذر إضافة المصروف');
    },
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAddError('');

    if (isCustomBeneficiary) {
      if (!newBeneficiaryName.trim()) {
        setAddError('يرجى إدخال اسم المستفيد');
        return;
      }
    } else {
      if (!newBeneficiaryId) {
        setAddError('يرجى اختيار المستفيد من القائمة');
        return;
      }
    }

    if (!newCategoryId) {
      setAddError('يرجى اختيار نوع المصروف');
      return;
    }
    if (!newAmount || parseFloat(newAmount) <= 0) {
      setAddError('يرجى إدخال مبلغ أكبر من صفر');
      return;
    }
    if (!newDescription.trim()) {
      setAddError('يرجى إدخال البيان / التفاصيل');
      return;
    }

    createMutation.mutate({
      beneficiaryId: isCustomBeneficiary ? null : parseInt(newBeneficiaryId, 10),
      beneficiaryName: isCustomBeneficiary ? newBeneficiaryName.trim() : null,
      categoryId: parseInt(newCategoryId, 10),
      projectId: newProjectId ? parseInt(newProjectId, 10) : null,
      amount: parseFloat(newAmount),
      description: newDescription.trim(),
      manualVoucherNumber: newVoucher.trim() || null,
      invoiceNumber: newInvoice.trim() || null,
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-12">
        {/* Simple & Clean Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                لوحة اليومية والمصروفات
              </h1>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                todaySummary?.status === 'OPEN'
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                  : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
              }`}>
                {todaySummary?.status === 'OPEN' ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                <span>{todaySummary?.status === 'OPEN' ? 'اليومية مفتوحة' : 'اليومية مغلقة'}</span>
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>التاريخ: {todaySummary?.systemDate || '...'}</span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span>رقم اليومية: <strong className="text-slate-700 dark:text-slate-200 font-mono">{todaySummary?.journalNumber || '...'}</strong></span>
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-xl shadow-sm transition text-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة مصروف سريع</span>
            </button>

            <Link
              href="/transactions/new"
              className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold px-4 py-2.5 rounded-xl transition text-sm border border-slate-200 dark:border-slate-700"
            >
              <FileText className="w-4 h-4 text-slate-500" />
              <span>سند صرف كامل</span>
            </Link>
          </div>
        </div>

        {/* Clean & Simple Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">إجمالي مصروفات اليوم</span>
              <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white font-mono">
                {(todaySummary?.totalAmount || 0).toLocaleString()} <span className="text-sm font-normal text-slate-500">ر.س</span>
              </div>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>محدّث تلقائياً</span>
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-900/40">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">عدد سندات اليوم</span>
              <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white font-mono">
                {todaySummary?.transactionsCount || 0} <span className="text-sm font-normal text-slate-500">سند</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                ضمن اليومية الحالية
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center border border-slate-200 dark:border-slate-700">
              <ListOrdered className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Clean & Legible Transactions Table */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-base text-slate-900 dark:text-white">جدول المصروفات المسجلة اليوم</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">قائمة بجميع السندات المدخلة في اليومية</p>
            </div>
            <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-3 py-1 rounded-lg font-mono">
              {transactions.length} عمليات
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300">
                  <th className="p-3.5">رقم السند</th>
                  <th className="p-3.5">المستفيد</th>
                  <th className="p-3.5">البيان والتفاصيل</th>
                  <th className="p-3.5">المشروع</th>
                  <th className="p-3.5">رقم الفاتورة</th>
                  <th className="p-3.5">المبلغ</th>
                  <th className="p-3.5">الوقت</th>
                  <th className="p-3.5 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-10 text-center text-slate-500 dark:text-slate-400 text-sm">
                      لا توجد مصروفات مسجلة اليوم حتى الآن. اضغط على "+ إضافة مصروف سريع" لإضافة أول سند.
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx: any) => (
                    <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                      <td className="p-3.5 font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {tx.manualVoucherNumber || '-'}
                      </td>
                      <td className="p-3.5 font-semibold text-slate-900 dark:text-white">
                        {tx.beneficiary?.name}
                      </td>
                      <td className="p-3.5 text-slate-600 dark:text-slate-300 text-xs">
                        {tx.description}
                      </td>
                      <td className="p-3.5">
                        {tx.project ? (
                          <span className="bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 px-2.5 py-0.5 rounded-md text-xs font-medium border border-blue-100 dark:border-blue-900/40">
                            {tx.project.projectName}
                          </span>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500 text-xs">مصروف عام</span>
                        )}
                      </td>
                      <td className="p-3.5 font-mono text-xs text-slate-500 dark:text-slate-400">
                        {tx.invoiceNumber || '-'}
                      </td>
                      <td className="p-3.5 font-mono font-bold text-slate-900 dark:text-white text-sm">
                        {Number(tx.amount).toLocaleString()} <span className="text-xs font-normal text-slate-500">ر.س</span>
                      </td>
                      <td className="p-3.5 text-xs text-slate-500 dark:text-slate-400 font-mono">
                        {new Date(tx.createdAt).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="p-3.5 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              setEditingTx(tx);
                              setEditAmount(tx.amount.toString());
                              setEditDescription(tx.description);
                              setEditVoucher(tx.manualVoucherNumber || '');
                            }}
                            className="p-1.5 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                            title="تعديل"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => {
                              if (confirm('هل أنت متأكد من حذف هذا المصروف؟')) {
                                deleteMutation.mutate(tx.id);
                              }
                            }}
                            className="p-1.5 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"
                            title="حذف"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Add Modal */}
        {isAddModalOpen && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
            <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl p-6 shadow-xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <Plus className="w-5 h-5 text-blue-600" />
                  <span>إضافة مصروف جديد سريع</span>
                </h3>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {addError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs rounded-xl font-medium">
                  {addError}
                </div>
              )}

              <form onSubmit={handleAddSubmit} className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">المستفيد *</label>
                      <button
                        type="button"
                        onClick={() => {
                          setIsCustomBeneficiary(!isCustomBeneficiary);
                          setNewBeneficiaryId('');
                          setNewBeneficiaryName('');
                        }}
                        className="text-[11px] text-blue-600 hover:underline font-semibold"
                      >
                        {isCustomBeneficiary ? 'من القائمة' : '+ اسم جديد'}
                      </button>
                    </div>

                    {isCustomBeneficiary ? (
                      <input
                        type="text"
                        required
                        value={newBeneficiaryName}
                        onChange={(e) => setNewBeneficiaryName(e.target.value)}
                        placeholder="اسم المستفيد..."
                        className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium bg-white dark:bg-slate-950 outline-none focus:border-blue-500"
                      />
                    ) : (
                      <select
                        required
                        value={newBeneficiaryId}
                        onChange={(e) => setNewBeneficiaryId(e.target.value)}
                        className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium bg-white dark:bg-slate-950 outline-none focus:border-blue-500"
                      >
                        <option value="">اختر المستفيد...</option>
                        {beneficiaries.map((b: any) => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">نوع المصروف *</label>
                    <select
                      required
                      value={newCategoryId}
                      onChange={(e) => setNewCategoryId(e.target.value)}
                      className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium bg-white dark:bg-slate-950 outline-none focus:border-blue-500"
                    >
                      <option value="">اختر نوع المصروف...</option>
                      {categories.map((c: any) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">المشروع (اختياري)</label>
                    <select
                      value={newProjectId}
                      onChange={(e) => setNewProjectId(e.target.value)}
                      className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium bg-white dark:bg-slate-950 outline-none focus:border-blue-500"
                    >
                      <option value="">مصروف عام / بدون مشروع</option>
                      {projects.map((p: any) => (
                        <option key={p.id} value={p.id}>{p.projectName}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">المبلغ (ر.س) *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={newAmount}
                      onChange={(e) => setNewAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold bg-white dark:bg-slate-950 outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">البيان / التفاصيل *</label>
                  <input
                    type="text"
                    required
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="سبب المصروف..."
                    className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium bg-white dark:bg-slate-950 outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">رقم السند اليدوي (اختياري)</label>
                    <input
                      type="text"
                      value={newVoucher}
                      onChange={(e) => setNewVoucher(e.target.value)}
                      placeholder="مثال: 1001"
                      className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium bg-white dark:bg-slate-950 outline-none focus:border-blue-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">رقم الفاتورة (اختياري)</label>
                    <input
                      type="text"
                      value={newInvoice}
                      onChange={(e) => setNewInvoice(e.target.value)}
                      placeholder="مثال: INV-100"
                      className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium bg-white dark:bg-slate-950 outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2.5 pt-2">
                  <button
                    type="submit"
                    disabled={createMutation.isPending}
                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition"
                  >
                    {createMutation.isPending ? 'جاري الحفظ...' : 'حفظ المصروف'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-sm transition border border-slate-200 dark:border-slate-700"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {editingTx && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl p-6 shadow-xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="font-bold text-base text-slate-900 dark:text-white">تعديل مصروف</h3>
                <button onClick={() => setEditingTx(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">المبلغ (ر.س) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-sm font-bold font-mono outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">التفاصيل *</label>
                  <input
                    type="text"
                    required
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-sm font-medium outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">رقم السند اليدوي</label>
                  <input
                    type="text"
                    value={editVoucher}
                    onChange={(e) => setEditVoucher(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-sm font-medium font-mono outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center gap-2.5 pt-2">
                  <button
                    type="submit"
                    disabled={updateMutation.isPending}
                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition"
                  >
                    حفظ التعديلات
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditingTx(null)}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-sm transition border border-slate-200 dark:border-slate-700"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
