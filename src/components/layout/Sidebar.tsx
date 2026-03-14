'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Target,
  LayoutGrid,
  ClipboardList,
  LogIn,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/objectives', label: 'OKR Tree', icon: Target },
  { href: '/okr', label: 'OKR Chi tiết', icon: LayoutGrid },
  { href: '/action-plan', label: 'Kế hoạch tháng', icon: ClipboardList },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isAdmin, logout } = useAuth();

  return (
    <aside className={cn(
      "w-56 border-r flex flex-col min-h-screen fixed left-0 top-0 z-30 transition-colors duration-300",
      isAdmin 
        ? "bg-slate-50/50 border-blue-200/60 shadow-[4px_0_24px_-12px_rgba(37,99,235,0.1)]" 
        : "bg-white border-gray-200"
    )}>
      {/* Brand & Admin Banner */}
      <div className="relative overflow-hidden">
        {isAdmin && (
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 h-1.5 w-full" />
        )}
        
        <div className={cn(
          "px-5 py-6 border-b transition-colors",
          isAdmin ? "border-blue-100 bg-blue-50/30" : "border-gray-100"
        )}>
          <div className="flex items-center gap-2.5">
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm transition-transform duration-300",
              isAdmin ? "bg-gradient-to-br from-blue-600 to-indigo-700 rotate-[-4deg] scale-110" : "bg-blue-600"
            )}>
              <span className="text-white text-xs font-bold">OK</span>
            </div>
            <div>
              <h1 className="text-sm font-black text-gray-900 leading-none tracking-tight">
                OKR Board
              </h1>
              <p className="text-[10px] text-gray-400 mt-1 font-medium italic">
                {isAdmin ? 'Admin Workspace' : 'Công nghệ và vận hành 2026'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-3 mb-3">Menu</p>
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                active
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
              )}
            >
              <Icon size={16} className={active ? 'text-white' : 'text-gray-400'} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-gray-100 space-y-3">
        {/* Role badge */}
        <div className="flex items-center gap-2">
          <span className={cn(
            'text-[10px] font-bold px-2 py-0.5 rounded-full',
            isAdmin
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-500'
          )}>
            {isAdmin ? 'ADMIN' : 'CHỈ XEM'}
          </span>
        </div>

        {/* Login / Logout */}
        {isAdmin ? (
          <button
            onClick={logout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all duration-150"
          >
            <LogOut size={15} className="text-gray-400" />
            Đăng xuất
          </button>
        ) : (
          <Link
            href="/login"
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-all duration-150"
          >
            <LogIn size={15} className="text-gray-400" />
            Đăng nhập
          </Link>
        )}

        <div className="flex items-center gap-2.5 px-1">
          <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
            <span className="text-gray-600 text-[10px] font-bold">HG</span>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-700 leading-none">Công nghệ và vận hành</p>
            <p className="text-[10px] text-gray-400 mt-0.5">© 2026</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
