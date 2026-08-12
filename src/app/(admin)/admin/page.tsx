'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/layouts/page-header';
import { tasksApi, submissionsApi } from '@/services/api';
import { useAuth } from '@/hooks';
import Link from 'next/link';
import {
  ClipboardList,
  Star,
  Inbox,
  PlusCircle,
  ListChecks,
  Megaphone,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const { user } = useAuth();

  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ['admin-tasks'],
    queryFn: async () => {
      const res = await tasksApi.getAll();
      return res.data.data;
    },
  });

  const { data: submissions, isLoading: subsLoading } = useQuery({
    queryKey: ['admin-submissions'],
    queryFn: async () => {
      const res = await submissionsApi.getAll({ limit: 100 });
      return res.data.data;
    },
  });

  const pendingGrading =
    submissions?.submissions?.filter((s) => s.status === 'BELUM_DINILAI').length || 0;

  const totalSubmissions = submissions?.total || 0;

  const quickActions = [
    {
      href: '/admin/tasks',
      icon: PlusCircle,
      title: 'Buat Tugas Baru',
      desc: 'Tambahkan tugas untuk murid',
      chip: 'from-blue-500 to-emerald-500 shadow-blue-500/30',
    },
    {
      href: '/admin/grading',
      icon: Star,
      title: 'Nilai Tugas',
      desc: `${pendingGrading} tugas menunggu penilaian`,
      chip: 'from-amber-500 to-orange-600 shadow-amber-500/30',
    },
    {
      href: '/admin/activities',
      icon: Megaphone,
      title: 'Buat Pengumuman',
      desc: 'Kirim pengumuman ke murid',
      chip: 'from-emerald-500 to-teal-600 shadow-emerald-500/30',
    },
  ];

  const firstName = user?.name?.split(' ')[0] || 'Bapak/Ibu';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard Guru"
        description={`Selamat datang kembali, ${user?.name}`}
      />

      {/* Hero banner gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-sky-600 to-emerald-600 p-6 text-white shadow-xl shadow-blue-500/25 sm:p-8">
        <div className="bg-dots pointer-events-none absolute inset-0 opacity-30" />
        <div className="pointer-events-none absolute -top-16 -right-16 h-56 w-56 animate-float rounded-full bg-white/15 blur-2xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="flex items-center gap-1.5 text-sm font-medium text-white/80">
              <Sparkles className="h-4 w-4" />
              Ringkasan aktivitas mengajar Anda
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
              Halo, {firstName}!
            </h2>
            <p className="mt-1 max-w-md text-sm text-white/75">
              {pendingGrading > 0
                ? `Ada ${pendingGrading} pengumpulan tugas yang menunggu dinilai. Yuk semangat!`
                : 'Semua pengumpulan tugas sudah dinilai. Kerja bagus!'}
            </p>
          </div>
          <div className="shrink-0">
            <Link
              href="/admin/grading"
              className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-5 py-3 text-sm font-semibold backdrop-blur-sm ring-1 ring-white/25 transition-all duration-300 hover:bg-white/25 hover:scale-105"
            >
              <Star className="h-4 w-4" />
              {pendingGrading > 0 ? `Nilai ${pendingGrading} Tugas` : 'Buka Penilaian'}
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Total Tugas"
          value={tasks?.length || 0}
          icon={ClipboardList}
          loading={tasksLoading}
          iconClass="bg-gradient-to-br from-blue-500 to-emerald-500 text-white shadow-lg shadow-blue-500/30"
          delay={0}
        />
        <StatCard
          label="Perlu Dinilai"
          value={pendingGrading}
          icon={Star}
          loading={subsLoading}
          hint="Segera nilai pengumpulan"
          iconClass="bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/30"
          delay={80}
        />
        <StatCard
          label="Total Pengumpulan"
          value={totalSubmissions}
          icon={Inbox}
          loading={subsLoading}
          iconClass="bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30"
          delay={160}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10">
          <CardHeader>
            <CardTitle className="text-base">Aksi Cepat</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {quickActions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="group flex items-center gap-4 rounded-xl border border-transparent bg-muted/40 p-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50/60 hover:shadow-md hover:shadow-blue-500/10 dark:hover:border-blue-500/30 dark:hover:bg-blue-500/5"
              >
                <span
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 ${action.chip}`}
                >
                  <action.icon className="h-5 w-5" />
                </span>
                <div className="flex-1">
                  <p className="text-sm font-semibold transition-colors group-hover:text-blue-700 dark:group-hover:text-blue-300">
                    {action.title}
                  </p>
                  <p className="text-xs text-muted-foreground">{action.desc}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card className="transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-emerald-500 text-white shadow-md shadow-blue-500/25">
                <ListChecks className="h-4 w-4" />
              </span>
              Tugas Terbaru
            </CardTitle>
            <Link
              href="/admin/tasks"
              className="flex items-center gap-0.5 text-xs font-medium text-blue-600 transition-colors hover:text-blue-700 hover:underline"
            >
              Lihat semua
              <ChevronRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {tasksLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-10 animate-pulse rounded-lg bg-muted" />
                ))}
              </div>
            ) : !tasks || tasks.length === 0 ? (
              <EmptyState
                icon={ClipboardList}
                title="Belum ada tugas"
                description="Buat tugas pertama Anda melalui menu Aksi Cepat."
              />
            ) : (
              <div className="space-y-2">
                {tasks.slice(0, 5).map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between rounded-xl border border-transparent bg-muted/40 p-3 transition-all duration-200 hover:border-blue-200 hover:bg-blue-50/50 dark:hover:border-blue-500/30 dark:hover:bg-blue-500/5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{task.title}</p>
                      <p className="truncate text-xs text-muted-foreground">{task.subject}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-blue-500/10 px-2.5 py-1 text-xs font-medium text-blue-600 dark:text-blue-300">
                      {task.classIds?.length || 0} kelas
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
