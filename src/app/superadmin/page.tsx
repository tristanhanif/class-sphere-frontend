'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/layouts/page-header';
import { usersApi, classesApi } from '@/services/api';
import { useAuth } from '@/hooks';
import Link from 'next/link';
import { Users, GraduationCap, School, UserCog, ChevronRight, Sparkles } from 'lucide-react';

export default function SuperAdminDashboardPage() {
  const { user } = useAuth();

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await usersApi.getAll();
      return res.data.data;
    },
  });

  const { data: classes, isLoading: classesLoading } = useQuery({
    queryKey: ['classes'],
    queryFn: async () => {
      const res = await classesApi.getAll();
      return res.data.data;
    },
  });

  const totalStudents = users?.filter((u) => u.role === 'USER').length || 0;
  const totalTeachers = users?.filter((u) => u.role === 'ADMIN').length || 0;

  const quickActions = [
    {
      href: '/superadmin/users',
      icon: UserCog,
      title: 'Kelola Users',
      desc: 'Tambah, edit, hapus akun',
      chip: 'from-blue-500 to-emerald-500 shadow-blue-500/30',
    },
    {
      href: '/superadmin/classes',
      icon: School,
      title: 'Kelola Kelas',
      desc: 'Buat dan kelola kelas',
      chip: 'from-emerald-500 to-teal-600 shadow-emerald-500/30',
    },
  ];

  const firstName = user?.name?.split(' ')[0] || 'Admin';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard Super Admin"
        description={`Selamat datang kembali, ${user?.name}`}
      />

      {/* Hero banner gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-sky-600 to-emerald-600 p-6 text-white shadow-xl shadow-emerald-500/25 sm:p-8">
        <div className="bg-dots pointer-events-none absolute inset-0 opacity-30" />
        <div className="pointer-events-none absolute -top-16 -right-16 h-56 w-56 animate-float rounded-full bg-white/15 blur-2xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="flex items-center gap-1.5 text-sm font-medium text-white/80">
              <Sparkles className="h-4 w-4" />
              Gambaran umum sistem ClassSphere
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
              Halo, {firstName}!
            </h2>
            <p className="mt-1 max-w-md text-sm text-white/75">
              Sistem mengelola {users?.length || 0} pengguna di {classes?.length || 0} kelas.
              Semua berjalan lancar!
            </p>
          </div>
          <div className="shrink-0">
            <Link
              href="/superadmin/users"
              className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-5 py-3 text-sm font-semibold backdrop-blur-sm ring-1 ring-white/25 transition-all duration-300 hover:bg-white/25 hover:scale-105"
            >
              <UserCog className="h-4 w-4" />
              Kelola Pengguna
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Users"
          value={users?.length || 0}
          icon={Users}
          loading={usersLoading}
          iconClass="bg-gradient-to-br from-blue-500 to-emerald-500 text-white shadow-lg shadow-blue-500/30"
          delay={0}
        />
        <StatCard
          label="Murid"
          value={totalStudents}
          icon={GraduationCap}
          loading={usersLoading}
          iconClass="bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30"
          delay={70}
        />
        <StatCard
          label="Guru"
          value={totalTeachers}
          icon={UserCog}
          loading={usersLoading}
          iconClass="bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-lg shadow-sky-500/30"
          delay={140}
        />
        <StatCard
          label="Kelas"
          value={classes?.length || 0}
          icon={School}
          loading={classesLoading}
          iconClass="bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/30"
          delay={210}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/10">
          <CardHeader>
            <CardTitle className="text-base">Aksi Cepat</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {quickActions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="group flex items-center gap-4 rounded-xl border border-transparent bg-muted/40 p-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-50/60 hover:shadow-md hover:shadow-emerald-500/10 dark:hover:border-emerald-500/30 dark:hover:bg-emerald-500/5"
              >
                <span
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 ${action.chip}`}
                >
                  <action.icon className="h-5 w-5" />
                </span>
                <div className="flex-1">
                  <p className="text-sm font-semibold transition-colors group-hover:text-emerald-700 dark:group-hover:text-emerald-300">
                    {action.title}
                  </p>
                  <p className="text-xs text-muted-foreground">{action.desc}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card className="transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/10">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-md shadow-amber-500/25">
                <School className="h-4 w-4" />
              </span>
              Kelas Terbaru
            </CardTitle>
            <Link
              href="/superadmin/classes"
              className="flex items-center gap-0.5 text-xs font-medium text-blue-600 transition-colors hover:text-blue-700 hover:underline"
            >
              Lihat semua
              <ChevronRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {classesLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-10 animate-pulse rounded-lg bg-muted" />
                ))}
              </div>
            ) : !classes || classes.length === 0 ? (
              <EmptyState
                icon={School}
                title="Belum ada kelas"
                description="Buat kelas pertama melalui menu Aksi Cepat."
              />
            ) : (
              <div className="space-y-2">
                {classes.slice(0, 5).map((cls) => (
                  <div
                    key={cls.id}
                    className="flex items-center justify-between rounded-xl border border-transparent bg-muted/40 p-3 transition-all duration-200 hover:border-amber-200 hover:bg-amber-50/50 dark:hover:border-amber-500/30 dark:hover:bg-amber-500/5"
                  >
                    <span className="flex items-center gap-2 text-sm font-medium">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-sm">
                        <School className="h-4 w-4" />
                      </span>
                      {cls.name}
                    </span>
                    <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-600 dark:text-amber-300">
                      {cls.academicYear}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
