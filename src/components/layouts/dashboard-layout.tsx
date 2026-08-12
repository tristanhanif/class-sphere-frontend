'use client';

import { Sidebar } from './sidebar';
import { Navbar } from './navbar';
import { useAuth } from '@/hooks';
import { Role } from '@/types';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const role = (user?.role || Role.USER) as Role;

  return (
    <div className="min-h-screen bg-background">
      {/* Dekorasi background: blob gradient halus */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 right-0 h-96 w-96 animate-float rounded-full bg-blue-300/25 blur-3xl dark:bg-blue-600/10" />
        <div className="absolute top-1/3 -left-32 h-80 w-80 animate-float-slow rounded-full bg-emerald-300/20 blur-3xl dark:bg-emerald-600/10" />
        <div className="absolute -bottom-24 right-1/4 h-72 w-72 animate-float rounded-full bg-sky-300/20 blur-3xl dark:bg-sky-600/10" />
      </div>

      <Sidebar role={role} />
      <div className="relative lg:pl-64">
        <Navbar />
        <main className="mx-auto max-w-7xl animate-fade-in p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
