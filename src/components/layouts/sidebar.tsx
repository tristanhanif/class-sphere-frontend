'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ClipboardList,
  Camera,
  Users,
  School,
  Star,
  Megaphone,
  LogOut,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/store';
import { Role } from '@/types';
import { useAuth } from '@/hooks';
import { getRoleLabel } from '@/lib/formatters';

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

const studentNav: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Tugas', href: '/dashboard/tasks', icon: ClipboardList },
  { label: 'Absensi', href: '/dashboard/attendance', icon: Camera },
];

const adminNav: NavItem[] = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Tugas', href: '/admin/tasks', icon: ClipboardList },
  { label: 'Penilaian', href: '/admin/grading', icon: Star },
  { label: 'Absensi', href: '/admin/attendance', icon: Camera },
  { label: 'Pengumuman', href: '/admin/activities', icon: Megaphone },
];

const superAdminNav: NavItem[] = [
  { label: 'Dashboard', href: '/superadmin', icon: LayoutDashboard },
  { label: 'Kelola User', href: '/superadmin/users', icon: Users },
  { label: 'Kelola Kelas', href: '/superadmin/classes', icon: School },
];

export function Sidebar({ role }: { role: Role }) {
  const pathname = usePathname();
  const { sidebarOpen, setSidebarOpen } = useUIStore();
  const { user, logout } = useAuth();

  let navItems: NavItem[] = [];
  if (role === Role.SUPERADMIN) navItems = superAdminNav;
  else if (role === Role.ADMIN) navItems = adminNav;
  else navItems = studentNav;

  const roleLabel = role === Role.SUPERADMIN ? 'Super Admin' : role === Role.ADMIN ? 'Guru' : 'Murid';

  const initials = (user?.name || 'CS')
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const isRoot = (href: string) =>
    href === '/dashboard' || href === '/admin' || href === '/superadmin';

  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 flex h-full w-64 flex-col overflow-hidden bg-gradient-to-b from-[oklch(0.27_0.07_253)] via-[oklch(0.23_0.06_252)] to-[oklch(0.17_0.05_250)] text-sidebar-foreground shadow-2xl shadow-blue-950/50 transform transition-transform duration-200 ease-in-out lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Ornamen glow hidup */}
        <div className="pointer-events-none absolute -top-24 -left-16 h-72 w-72 animate-float rounded-full bg-blue-500/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-20 h-72 w-72 animate-float-slow rounded-full bg-emerald-600/20 blur-3xl" />

        {/* Brand */}
        <div className="relative px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-400 via-sky-500 to-emerald-500 shadow-lg shadow-blue-950/50 ring-1 ring-white/25">
              <img
                src="/class-sphere.png"
                alt="ClassSphere Logo"
                className="h-6 w-6 object-contain"
              />
              <span className="absolute -top-1 -right-1 h-3 w-3 animate-pulse-glow rounded-full bg-emerald-400 ring-2 ring-[oklch(0.23_0.06_252)]" />
            </div>
            <div>
              <h1 className="font-heading text-lg font-bold tracking-tight text-white">
                Class<span className="bg-gradient-to-r from-blue-300 to-emerald-300 bg-clip-text text-transparent">Sphere</span>
              </h1>
              <p className="text-[11px] font-medium tracking-wide text-sidebar-foreground/60">
                {roleLabel}
              </p>
            </div>
          </div>
        </div>

        {/* Navigasi */}
        <nav className="scrollbar-thin relative flex-1 space-y-1 overflow-y-auto px-3 py-4">
          <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
            Menu
          </p>
          {navItems.map((item) => {
            const isActive = isRoot(item.href)
              ? pathname === item.href
              : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-gradient-to-r from-blue-500/90 to-sky-500/80 text-white shadow-lg shadow-blue-950/40 ring-1 ring-white/15'
                    : 'text-sidebar-foreground/70 hover:bg-white/5 hover:text-white',
                )}
              >
                <item.icon
                  className={cn(
                    'h-[18px] w-[18px] shrink-0 transition-transform duration-200 group-hover:scale-110',
                    isActive ? 'text-white drop-shadow' : 'text-sidebar-foreground/50 group-hover:text-blue-300',
                  )}
                />
                <span className="truncate">{item.label}</span>
                {isActive && (
                  <span className="ml-auto h-1.5 w-1.5 animate-pulse-glow rounded-full bg-white" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Profil pengguna */}
        <div className="relative border-t border-white/10 p-3">
          <div className="flex items-center gap-3 rounded-xl bg-white/5 p-2.5 ring-1 ring-white/10 backdrop-blur-sm transition-colors hover:bg-white/10">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-emerald-500 text-xs font-bold text-white ring-2 ring-white/20">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">{user?.name}</p>
              <p className="truncate text-[11px] text-sidebar-foreground/60">
                {user ? getRoleLabel(user.role) : ''}
              </p>
            </div>
            <button
              onClick={logout}
              title="Keluar"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sidebar-foreground/60 transition-all hover:bg-red-500/20 hover:text-red-300"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
