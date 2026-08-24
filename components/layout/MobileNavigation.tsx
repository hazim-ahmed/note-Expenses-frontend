'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  BookOpen, 
  FolderKanban, 
  FileSpreadsheet,
  MoreHorizontal,
  Receipt,
  Users,
  Tags,
  ShieldCheck,
  Settings,
  X,
} from 'lucide-react';

export default function MobileNavigation() {
  const [mounted, setMounted] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Primary 4 tabs in bottom dock
  const navLinks = [
    { label: 'الرئيسية', href: '/dashboard', icon: LayoutDashboard },
    { label: 'اليوميات', href: '/journals', icon: BookOpen },
    { label: 'المشاريع', href: '/projects', icon: FolderKanban },
    { label: 'التقارير', href: '/reports', icon: FileSpreadsheet },
  ];

  // Secondary screens in "المزيد" menu
  const extraLinks = [
    { 
      label: 'إضافة سند صرف', 
      desc: 'تسجيل سند جديد بسرعة',
      href: '/transactions/new', 
      icon: Receipt,
    },
    { 
      label: 'المستفيدون والموردون', 
      desc: 'إدارة أطراف المعاملات',
      href: '/beneficiaries', 
      icon: Users 
    },
    { 
      label: 'تصنيفات المصروفات', 
      desc: 'تبويب البنود والمصروفات',
      href: '/categories', 
      icon: Tags 
    },
    { 
      label: 'المستخدمون والصلاحيات', 
      desc: 'إدارة الحسابات والأدوار',
      href: '/users', 
      icon: ShieldCheck 
    },
    { 
      label: 'إعدادات النظام', 
      desc: 'تخصيص الخيارات والتفضيلات',
      href: '/settings', 
      icon: Settings 
    },
  ];

  const isPrimaryActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard' || pathname === '/';
    return pathname.startsWith(href);
  };

  const isExtraActive = extraLinks.some((link) => pathname.startsWith(link.href));

  // Don't render mobile navbar on login page
  if (pathname === '/login') return null;

  return (
    <>
      {/* Bottom Sheet Modal for "المزيد" */}
      {isMoreOpen && (
        <div className="fixed inset-0 z-[120] md:hidden animate-in fade-in duration-150">
          {/* Backdrop */}
          <div 
            onClick={() => setIsMoreOpen(false)}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
          />

          {/* Sliding Card Drawer */}
          <div className="fixed bottom-0 inset-x-0 mx-auto w-full max-w-lg rounded-t-3xl border-t border-slate-200 dark:border-slate-800 p-5 z-[130] shadow-2xl bg-white dark:bg-slate-900 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-200 text-slate-900 dark:text-white">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">جميع الأقسام</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">انتقال سريع للشاشات</p>
              </div>

              <button
                onClick={() => setIsMoreOpen(false)}
                className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* List of Extra Screens */}
            <div className="space-y-1.5 mb-3">
              {extraLinks.map((item) => {
                const isActive = pathname.startsWith(item.href);
                const IconComponent = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMoreOpen(false)}
                    className={`flex items-center justify-between p-3 rounded-xl border transition ${
                      isActive
                        ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center text-blue-600 dark:text-blue-400 border border-slate-200 dark:border-slate-700">
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold block">{item.label}</span>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">{item.desc}</p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation Bar */}
      <nav className="md:hidden fixed inset-x-0 bottom-0 z-[100] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 shadow-lg px-2 py-1.5">
        <div className="flex items-center justify-around">
          {navLinks.map((link) => {
            const active = isPrimaryActive(link.href) && !isMoreOpen;
            const IconComponent = link.icon;

            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMoreOpen(false)}
                className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition ${
                  active
                    ? 'text-blue-600 dark:text-blue-400 font-bold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <IconComponent className="w-5 h-5" />
                <span className="text-[11px] mt-0.5">{link.label}</span>
              </Link>
            );
          })}

          {/* 5th Tab: "المزيد" */}
          <button
            type="button"
            onClick={() => setIsMoreOpen((prev) => !prev)}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition ${
              isMoreOpen || isExtraActive
                ? 'text-blue-600 dark:text-blue-400 font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <MoreHorizontal className="w-5 h-5" />
            <span className="text-[11px] mt-0.5">المزيد</span>
          </button>
        </div>
      </nav>
    </>
  );
}

