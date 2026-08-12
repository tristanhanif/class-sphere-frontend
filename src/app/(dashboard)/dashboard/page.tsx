'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { StatCard } from '@/components/ui/stat-card';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/layouts/page-header';
import { tasksApi, attendanceApi, activitiesApi } from '@/services/api';
import { useAuth } from '@/hooks';
import { formatDate, isDeadlinePassed, getTodayWIB } from '@/lib/formatters';
import Link from 'next/link';
import { ClipboardList, Camera, Megaphone, CheckCircle2, CalendarClock, ChevronRight, Sparkles } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const classId = user?.classId || '';

  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks', classId],
    queryFn: async () => {
      const res = await tasksApi.getAll(classId);
      return res.data.data;
    },
    enabled: !!classId,
  });

  const { data: attendance, isLoading: attendanceLoading } = useQuery({
    queryKey: ['my-attendance'],
    queryFn: async () => {
      const res = await attendanceApi.getMy();
      return res.data.data;
    },
  });

  const { data: activities, isLoading: activitiesLoading } = useQuery({
    queryKey: ['activities', classId],
    queryFn: async () => {
      const res = await activitiesApi.getAll(classId);
      return res.data.data;
    },
    enabled: !!classId,
  });

  const today = getTodayWIB();
  const todayAttendance = attendance?.find((a) => a.date === today);

  const upcomingTasks = tasks?.filter((t) => !isDeadlinePassed(t.deadline)) || [];
  const recentActivities = activities?.slice(0, 3) || [];

  const firstName = user?.name?.split(' ')[0] || 'Teman';

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Selamat Datang, ${user?.name}!`}
        description="Berikut ringkasan aktivitasmu hari ini"
      />

      {/* Hero banner gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-sky-600 to-emerald-600 p-6 text-white shadow-xl shadow-blue-500/25 sm:p-8">
        <div className="bg-dots pointer-events-none absolute inset-0 opacity-30" />
        <div className="pointer-events-none absolute -top-16 -right-16 h-56 w-56 animate-float rounded-full bg-white/15 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-20 left-1/3 h-48 w-48 animate-float-slow rounded-full bg-emerald-300/20 blur-2xl" />

        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="flex items-center gap-1.5 text-sm font-medium text-white/80">
              <Sparkles className="h-4 w-4" />
              {new Date().toLocaleDateString('id-ID', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
              Halo, {firstName}!
            </h2>
            <p className="mt-1 max-w-md text-sm text-white/75">
              {todayAttendance
                ? `Kamu sudah absen hari ini dengan status ${
                    todayAttendance.status === 'SAKIT' ? 'Sakit' : 'Hadir'
                  }. Semangat belajarnya!`
                : `Jangan lupa absen hari ini ya! Kamu punya ${upcomingTasks.length} tugas aktif yang menunggu.`}
            </p>
          </div>
          <div className="shrink-0">
            <Link
              href="/dashboard/attendance"
              className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-5 py-3 text-sm font-semibold backdrop-blur-sm ring-1 ring-white/25 transition-all duration-300 hover:bg-white/25 hover:scale-105"
            >
              {todayAttendance ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Lihat Status Absensi
                </>
              ) : (
                <>
                  <Camera className="h-4 w-4" />
                  Absen Sekarang
                </>
              )}
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Tugas Aktif"
          value={upcomingTasks.length}
          hint="Belum melewati deadline"
          icon={ClipboardList}
          loading={tasksLoading}
          iconClass="bg-gradient-to-br from-blue-500 to-emerald-500 text-white shadow-lg shadow-blue-500/30"
          delay={0}
        />
        <StatCard
          label="Absensi Hari Ini"
          value={
            todayAttendance ? (
              <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                {todayAttendance.status === 'SAKIT' ? 'Sakit' : 'Hadir'}
              </Badge>
            ) : (
              <Badge variant="outline" className="border-amber-300 text-amber-600 dark:border-amber-500/40 dark:text-amber-300">
                Belum Absen
              </Badge>
            )
          }
          icon={Camera}
          loading={attendanceLoading}
          iconClass="bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30"
          delay={80}
        />
        <StatCard
          label="Pengumuman"
          value={recentActivities.length}
          hint="Info terbaru dari guru"
          icon={Megaphone}
          loading={activitiesLoading}
          iconClass="bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/30"
          delay={160}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-emerald-500 text-white shadow-md shadow-blue-500/25">
                <CalendarClock className="h-4 w-4" />
              </span>
              Tugas Mendatang
            </CardTitle>
            <Link
              href="/dashboard/tasks"
              className="flex items-center gap-0.5 text-xs font-medium text-blue-600 transition-colors hover:text-blue-700 hover:underline"
            >
              Lihat semua
              <ChevronRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {tasksLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : upcomingTasks.length === 0 ? (
              <EmptyState
                icon={ClipboardList}
                title="Tidak ada tugas mendatang"
                description="Semua tugas sudah selesai dikerjakan. Mantap!"
              />
            ) : (
              <div className="space-y-2">
                {upcomingTasks.slice(0, 5).map((task) => {
                  const late = isDeadlinePassed(task.deadline);
                  return (
                    <Link
                      key={task.id}
                      href={`/dashboard/tasks/${task.id}`}
                      className="group flex items-center justify-between gap-3 rounded-xl border border-transparent bg-muted/40 p-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50/60 hover:shadow-md hover:shadow-blue-500/10 dark:hover:border-blue-500/30 dark:hover:bg-blue-500/5"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium transition-colors group-hover:text-blue-700 dark:group-hover:text-blue-300">
                          {task.title}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">{task.subject}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className={`text-xs ${late ? 'font-medium text-red-500' : 'text-muted-foreground'}`}>
                          {formatDate(task.deadline)}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/10">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-md shadow-amber-500/25">
                <Megaphone className="h-4 w-4" />
              </span>
              Pengumuman Terbaru
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activitiesLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : recentActivities.length === 0 ? (
              <EmptyState
                icon={Megaphone}
                title="Tidak ada pengumuman"
                description="Belum ada informasi baru dari guru."
              />
            ) : (
              <div className="space-y-2">
                {recentActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="group relative overflow-hidden rounded-xl border border-transparent bg-gradient-to-r from-amber-50/80 to-transparent p-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-amber-200 hover:shadow-md hover:shadow-amber-500/10 dark:from-amber-500/10 dark:hover:border-amber-500/30"
                  >
                    <div className="absolute inset-y-0 left-0 w-1 rounded-full bg-gradient-to-b from-amber-400 to-orange-500 opacity-70" />
                    <p className="pl-2 text-sm font-medium">{activity.title}</p>
                    <p className="mt-1 line-clamp-2 pl-2 text-xs text-muted-foreground">
                      {activity.description}
                    </p>
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
