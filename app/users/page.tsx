'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import Link from 'next/link';
import { Plus, Search, ShieldCheck, Edit, Eye, Power, KeyRound, AlertCircle, CheckCircle, X, Save } from 'lucide-react';

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  // Password reset modal
  const [resetModalUser, setResetModalUser] = useState<any>(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const [resetError, setResetError] = useState('');

  // Quick edit user modal
  const [editModalUser, setEditModalUser] = useState<any>(null);
  const [editUsername, setEditUsername] = useState('');
  const [editFullName, setEditFullName] = useState('');
  const [editEmployeeNumber, setEditEmployeeNumber] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editSuccessMsg, setEditSuccessMsg] = useState('');
  const [editErrorMsg, setEditErrorMsg] = useState('');

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users', search, statusFilter, roleFilter],
    queryFn: async () => {
      const res = await api.get('/users', { params: { search, status: statusFilter, roleName: roleFilter } });
      return res.data.data;
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const res = await api.patch(`/users/${id}/status`, { isActive });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'تعذر تغيير حالة المستخدم');
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ id, newPassword }: { id: number; newPassword: string }) => {
      const res = await api.post(`/users/${id}/reset-password`, { newPassword });
      return res.data;
    },
    onSuccess: () => {
      setResetMessage('تم إعادة تعيين كلمة المرور بنجاح');
      setResetError('');
      setNewPassword('');
    },
    onError: (err: any) => {
      setResetError(err.response?.data?.message || 'تعذر إعادة تعيين كلمة المرور');
    },
  });

  const quickUpdateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: any }) => {
      const res = await api.patch(`/users/${id}`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setEditSuccessMsg('تم تعديل بيانات المستخدم بنجاح');
      setEditErrorMsg('');
      setTimeout(() => {
        setEditModalUser(null);
        setEditSuccessMsg('');
      }, 1000);
    },
    onError: (err: any) => {
      setEditErrorMsg(err.response?.data?.message || 'تعذر تعديل بيانات المستخدم');
    },
  });

  const handleOpenEdit = (u: any) => {
    setEditModalUser(u);
    setEditUsername(u.username || '');
    setEditFullName(u.fullName || '');
    setEditEmployeeNumber(u.employeeNumber || '');
    setEditEmail(u.email || '');
    setEditPhone(u.phone || '');
    setEditSuccessMsg('');
    setEditErrorMsg('');
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModalUser) return;
    setEditErrorMsg('');

    if (!editUsername.trim()) {
      setEditErrorMsg('اسم المستخدم مطلوب');
      return;
    }
    if (!editFullName.trim()) {
      setEditErrorMsg('الاسم الكامل مطلوب');
      return;
    }

    quickUpdateMutation.mutate({
      id: editModalUser.id,
      payload: {
        username: editUsername.trim(),
        fullName: editFullName.trim(),
        employeeNumber: editEmployeeNumber.trim() || null,
        email: editEmail.trim() || null,
        phone: editPhone.trim() || null,
      },
    });
  };

  const handleResetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setResetMessage('');
    setResetError('');
    if (!newPassword || newPassword.length < 6) {
      setResetError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }
    resetPasswordMutation.mutate({ id: resetModalUser.id, newPassword });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-emerald-600" />
              <span>إدارة المستخدمين والصلاحيات (Users & Roles)</span>
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">عرض وتعديل حسابات المستخدمين وأسماء المستخدمين والأدوار</p>
          </div>

          <Link
            href="/users/new"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-xl shadow-sm text-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة مستخدم جديد</span>
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="البحث بالاسم، اسم المستخدم، رقم الموظف..."
              className="w-full !pr-10 !pl-4 !py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-3">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="p-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white"
            >
              <option value="">جميع الأدوار</option>
              <option value="ADMIN">ADMIN (مدير نظام)</option>
              <option value="CASHIER">CASHIER (أمين صندوق)</option>
              <option value="ACCOUNTANT">ACCOUNTANT (محاسب)</option>
              <option value="MANAGER">MANAGER (مدير اعتمادات)</option>
              <option value="VIEWER">VIEWER (مستعرض)</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="p-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white"
            >
              <option value="">جميع الحالات</option>
              <option value="ACTIVE">نشط (ACTIVE)</option>
              <option value="INACTIVE">معطل (INACTIVE)</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <table className="w-full text-right border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300">
                <th className="p-3.5">رقم الموظف</th>
                <th className="p-3.5">اسم المستخدم</th>
                <th className="p-3.5">الاسم الكامل</th>
                <th className="p-3.5">البريد/الجوال</th>
                <th className="p-3.5">الأدوار</th>
                <th className="p-3.5">الحالة</th>
                <th className="p-3.5 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {users.map((u: any) => (
                <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                  <td className="p-3.5 font-mono text-xs font-bold text-blue-600 dark:text-blue-400">{u.employeeNumber || '-'}</td>
                  <td className="p-3.5 font-mono font-bold text-slate-900 dark:text-white">@{u.username}</td>
                  <td className="p-3.5 font-bold text-slate-800 dark:text-slate-200">{u.fullName}</td>
                  <td className="p-3.5 text-xs text-slate-500 dark:text-slate-400">{u.email || u.phone || '-'}</td>
                  <td className="p-3.5">
                    <div className="flex flex-wrap gap-1">
                      {u.roles?.map((r: string) => (
                        <span key={r} className="bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-semibold px-2 py-0.5 rounded text-xs border border-blue-100 dark:border-blue-900/40">
                          {r}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="p-3.5">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      u.isActive ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                    }`}>
                      {u.isActive ? 'نشط' : 'معطل'}
                    </span>
                  </td>
                  <td className="p-3.5 text-center">
                    <div className="inline-flex items-center gap-1.5">
                      <Link
                        href={`/users/${u.id}`}
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                        title="عرض التفاصيل"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>

                      <button
                        onClick={() => handleOpenEdit(u)}
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                        title="تعديل اسم المستخدم والبيانات"
                      >
                        <Edit className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => setResetModalUser(u)}
                        className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg transition"
                        title="إعادة تعيين كلمة المرور"
                      >
                        <KeyRound className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => toggleStatusMutation.mutate({ id: u.id, isActive: !u.isActive })}
                        className={`p-1.5 rounded-lg transition ${
                          u.isActive
                            ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                            : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                        }`}
                        title={u.isActive ? 'تعطيل الحساب' : 'تفعيل الحساب'}
                      >
                        <Power className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Quick Edit User Modal */}
        {editModalUser && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
            <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl p-6 shadow-xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <Edit className="w-5 h-5 text-blue-600" />
                  <span>تعديل حساب المستخدم ({editModalUser.fullName})</span>
                </h3>
                <button
                  onClick={() => setEditModalUser(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {editSuccessMsg && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs rounded-xl font-semibold flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span>{editSuccessMsg}</span>
                </div>
              )}

              {editErrorMsg && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs rounded-xl font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{editErrorMsg}</span>
                </div>
              )}

              <form onSubmit={handleEditSubmit} className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">اسم المستخدم (Username) *</label>
                    <input
                      type="text"
                      required
                      value={editUsername}
                      onChange={(e) => setEditUsername(e.target.value)}
                      placeholder="اسم المستخدم..."
                      className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-sm font-mono font-bold outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">الاسم الكامل *</label>
                    <input
                      type="text"
                      required
                      value={editFullName}
                      onChange={(e) => setEditFullName(e.target.value)}
                      placeholder="الاسم الكامل..."
                      className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-sm font-bold outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">الرقم الوظيفي</label>
                    <input
                      type="text"
                      value={editEmployeeNumber}
                      onChange={(e) => setEditEmployeeNumber(e.target.value)}
                      placeholder="EMP-100"
                      className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-sm font-mono outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">البريد الإلكتروني</label>
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      placeholder="user@example.com"
                      className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-sm outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">رقم الجوال</label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="05xxxxxxxx"
                    className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-sm outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center gap-2.5 pt-2">
                  <button
                    type="submit"
                    disabled={quickUpdateMutation.isPending}
                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>{quickUpdateMutation.isPending ? 'جاري الحفظ...' : 'حفظ التعديلات'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditModalUser(null)}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-sm transition"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Reset Password Modal */}
        {resetModalUser && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl p-6 shadow-xl space-y-4 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  تعيين كلمة المرور ({resetModalUser.fullName})
                </h3>
                <button
                  onClick={() => {
                    setResetModalUser(null);
                    setResetMessage('');
                    setResetError('');
                  }}
                  className="p-1 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {resetMessage && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs rounded-xl font-semibold">
                  {resetMessage}
                </div>
              )}

              {resetError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs rounded-xl font-semibold">
                  {resetError}
                </div>
              )}

              <form onSubmit={handleResetSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">كلمة المرور الجديدة *</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-sm font-mono outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center gap-2.5 pt-2">
                  <button
                    type="submit"
                    disabled={resetPasswordMutation.isPending}
                    className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-sm transition"
                  >
                    تأكيد تعيين كلمة السر
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setResetModalUser(null);
                      setResetMessage('');
                      setResetError('');
                    }}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-sm transition"
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
