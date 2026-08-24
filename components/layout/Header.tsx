'use client';

import React from 'react';
import { LogOut, User, ShieldCheck, Sun, Moon, Menu } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

interface HeaderProps {
  onToggleMobileMenu?: () => void;
}

export default function Header({ onToggleMobileMenu }: HeaderProps) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
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

        {/* User Card Badge */}
        <div className="flex items-center gap-2.5 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
            <User className="w-3.5 h-3.5" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight">
              {user?.fullName || user?.username || 'المستخدم'}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">
              {user?.roles?.[0] || 'CASHIER'}
            </span>
          </div>
        </div>

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
  );
}
