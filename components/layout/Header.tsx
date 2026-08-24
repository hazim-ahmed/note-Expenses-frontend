'use client';

import React, { useState } from 'react';
import { LogOut, User, ShieldCheck, Sun, Moon, Menu, Edit, Save, AlertCircle, CheckCircle, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import api from '@/lib/axios';

interface HeaderProps {
  onToggleMobileMenu?: () => void;
}

export default function Header({ onToggleMobileMenu }: HeaderProps) {
  const { user, logout, refreshUser } = useAuth();
  const { theme, toggleTheme } = useTheme();

  // Profile Edit Modal State
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalSuccess, setModalSuccess] = useState('');
  const [modalError, setModalError] = useState('');

  const openProfileModal = () => {
    if (user) {
      setUsername(user.username || '');
      setFullName(user.fullName || '');
      setEmail((user as any).email || '');
      setPhone((user as any).phone || '');
    }
    setModalSuccess('');
    setModalError('');
    setIsProfileModalOpen(true);
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalSuccess('');
    setModalError('');

    if (username.trim().length < 3) {
      setModalError('اسم المستخدم يجب أن يتكون من 3 أحرف على الأقل');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await api.patch('/auth/profile', {
        username: username.trim(),
        fullName: fullName.trim(),
        email: email.trim() || null,
        phone: phone.trim() || null,
      });

      setModalSuccess(res.data?.message || 'تم تحديث اسم المستخدم والملف الشخصي بنجاح');
      await refreshUser();
      setTimeout(() => {
        setIsProfileModalOpen(false);
      }, 1200);
    } catch (err: any) {
      setModalError(err.response?.data?.message || 'تعذر تحديث بيانات الحساب أو اسم المستخدم');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 transition-colors">
        <div className="flex items-center gap-3">
          {/* Mobile Hamburger Toggle Button */}
          {onToggleMobileMenu && (
            <button
              onClick={onToggleMobileMenu}
              className="lg:hidden p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition"
              title="فتح القائمة الجانبية"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
            نظام إدارة المصروفات وسندات الصرف
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-xl transition bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
            title={theme === 'dark' ? 'التحويل للوضع الفاتح' : 'التحويل للوضع الداكن'}
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline">فاتح</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-slate-600" />
                <span className="hidden sm:inline">داكن</span>
              </>
            )}
          </button>

          {/* User Card Badge - Clickable to edit profile & username */}
          <button
            onClick={openProfileModal}
            className="flex items-center gap-2.5 bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 transition text-right group cursor-pointer"
            title="تعديل اسم المستخدم والملف الشخصي"
          >
            <div className="w-7 h-7 rounded-lg bg-blue-600 group-hover:bg-blue-700 text-white flex items-center justify-center font-bold text-xs transition">
              <User className="w-3.5 h-3.5" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight">
                  {user?.fullName || user?.username || 'المستخدم'}
                </span>
                <Edit className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition" />
              </div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                @{user?.username || ''} • {user?.roles?.[0] || 'CASHIER'}
              </span>
            </div>
          </button>

          {/* Logout Button */}
          <button
            onClick={() => logout()}
            className="flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 px-3 py-2 rounded-xl transition border border-rose-200 dark:border-rose-900/50 font-medium"
            title="تسجيل الخروج"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">خروج</span>
          </button>
        </div>
      </header>

      {/* Edit Profile & Username Modal */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-5 border border-slate-200 dark:border-slate-800 text-right">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Edit className="w-5 h-5 text-blue-600" />
                <span>تعديل الملف الشخصي واسم المستخدم</span>
              </h3>
              <button
                onClick={() => setIsProfileModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalSuccess && (
              <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs rounded-xl font-bold flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{modalSuccess}</span>
              </div>
            )}

            {modalError && (
              <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs rounded-xl font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  اسم المستخدم (Username) *
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="مثال: ahmed.accountant"
                  className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-sm font-mono font-bold text-slate-800 dark:text-slate-100 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  يُستخدم اسم المستخدم لتسجيل الدخول ويجب ألا يتكرر مع أي مستخدم آخر.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">الاسم الكامل *</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-sm font-bold text-slate-800 dark:text-slate-100 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">البريد الإلكتروني</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-sm font-semibold text-slate-800 dark:text-slate-100 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">رقم الجوال</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-sm font-semibold text-slate-800 dark:text-slate-100 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-sm transition"
                >
                  إلغاء
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 text-sm transition"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSubmitting ? 'جاري الحفظ...' : 'حفظ التغييرات'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
