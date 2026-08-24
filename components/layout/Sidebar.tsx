'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  BookOpen,
  Receipt,
  FolderKanban,
  Users,
  Tags,
  FileSpreadsheet,
  ShieldCheck,
  Settings,
  User,
  Wallet,
} from 'lucide-react';

const navigationGroups = [
  {
    title: 'الرئيسية والتشغيل',
    items: [
      { name: 'لوحة المعلومات', href: '/dashboard', icon: LayoutDashboard },
      { name: 'إضافة سند صرف', href: '/transactions/new', icon: Receipt },
      { name: 'أرشيف اليوميات', href: '/journals', icon: BookOpen },
    ],
  },
  {
    title: 'التصانيف والمشاريع',
    items: [
      { name: 'المشاريع والوحدات', href: '/projects', icon: FolderKanban },
      { name: 'المستفيدون والموردون', href: '/beneficiaries', icon: Users },
      { name: 'تصنيفات المصروفات', href: '/categories', icon: Tags },
    ],
  },
  {
    title: 'التقارير والإدارة',
    items: [
      { name: 'التقارير المالية', href: '/reports', icon: FileSpreadsheet },
      { name: 'المستخدمون والصلاحيات', href: '/users', icon: ShieldCheck, adminOnly: true },
      { name: 'إعدادات النظام', href: '/settings', icon: Settings, adminOnly: true },
    ],
  },
];

interface SidebarProps {
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export default function Sidebar({ isMobileOpen = false, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const isAdmin = user?.roles?.includes('ADMIN') ?? false;

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-sm">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-sm text-slate-900 dark:text-white">نظام المصروفات</h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">إدارة اليومية والسندات</p>
          </div>
        </div>

        {/* Mobile Close Button */}
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 font-bold transition"
            title="إغلاق القائمة"
          >
            ✕
          </button>
        )}
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-3 space-y-5 overflow-y-auto">
        {navigationGroups.map((group) => {
          const visibleItems = group.items.filter((item) => !item.adminOnly || isAdmin);
          if (visibleItems.length === 0) return null;

          return (
            <div key={group.title} className="space-y-1">
              <h3 className="px-3 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                {group.title}
              </h3>
              <div className="space-y-0.5 pt-1">
                {visibleItems.map((item) => {
                  const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => onCloseMobile && onCloseMobile()}
                      className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition ${
                        isActive
                          ? 'bg-blue-600 text-white font-bold shadow-sm'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400 dark:text-slate-400'}`} />
                      <span className="truncate">{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* User Footer Card */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
        <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center">
            <User className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{user?.fullName || user?.username || 'المستخدم'}</p>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate">
              {user?.roles?.[0] || 'CASHIER'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Permanent Sidebar */}
      <aside className="hidden lg:flex w-60 bg-white dark:bg-slate-900 min-h-screen flex-col shrink-0 z-30 transition-colors">
        {sidebarContent}
      </aside>

      {/* Mobile & Tablet Slide-over Drawer Overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden animate-in fade-in duration-150">
          {/* Backdrop */}
          <div
            onClick={onCloseMobile}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
          />

          {/* Drawer Panel */}
          <aside className="fixed top-0 bottom-0 right-0 w-64 bg-white dark:bg-slate-900 z-50 shadow-xl flex flex-col animate-in slide-in-from-right duration-200">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}


