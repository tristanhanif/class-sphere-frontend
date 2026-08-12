'use client';

import { Menu, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NotificationBell } from './notification-bell';
import { useUIStore } from '@/store';
import { useAuth } from '@/hooks';
import { getRoleLabel } from '@/lib/formatters';

export function Navbar() {
  const { setSidebarOpen } = useUIStore();
  const { user, logout } = useAuth();

  const initials = (user?.name || 'CS')
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border/60 bg-background/70 px-4 backdrop-blur-xl md:px-6">
      {/* Garis gradient hidup di atas navbar */}
      <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-blue-500 via-sky-500 to-emerald-500" />
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={() => setSidebarOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </Button>

      <div className="flex-1" />

      <NotificationBell />

      <div className="h-6 w-px bg-border" />

      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-semibold leading-tight">{user?.name}</p>
          <p className="text-xs text-muted-foreground">
            {user ? getRoleLabel(user.role) : ''}
          </p>
        </div>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 via-sky-500 to-emerald-500 text-xs font-bold text-white ring-2 ring-white shadow-md shadow-blue-500/25">
          {initials}
        </div>
        <Button variant="ghost" size="icon" onClick={logout} title="Keluar">
          <LogOut className="h-[18px] w-[18px] text-muted-foreground" />
        </Button>
      </div>
    </header>
  );
}
