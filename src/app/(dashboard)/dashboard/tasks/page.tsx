'use client';

import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/layouts/page-header';
import { tasksApi, submissionsApi } from '@/services/api';
import { useAuth } from '@/hooks';
import { formatDate, isDeadlinePassed } from '@/lib/formatters';
import Link from 'next/link';
import { ClipboardList, CalendarClock, FileText, Link2, CheckCircle2, RefreshCcw, type LucideIcon } from 'lucide-react';

const statusConfig: Record<string, { label: string; className: string; icon?: LucideIcon }> = {
  SUDAH_DINILAI: { label: 'Sudah Dinilai', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300', icon: CheckCircle2 },
  PERLU_REVISI: { label: 'Perlu Revisi', className: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300', icon: RefreshCcw },
  DIKUMPULKAN: { label: 'Dikumpulkan', className: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300' },
};

// Warna chip per mata pelajaran (acak tapi konsisten berdasarkan nama)
const subjectColors = [
  'bg-blue-500/10 text-blue-600 ring-blue-500/20 dark:text-blue-300',
  'bg-emerald-500/10 text-emerald-600 ring-emerald-500/20 dark:text-emerald-300',
  'bg-amber-500/10 text-amber-600 ring-amber-500/20 dark:text-amber-300',
  'bg-rose-500/10 text-rose-600 ring-rose-500/20 dark:text-rose-300',
  'bg-sky-500/10 text-sky-600 ring-sky-500/20 dark:text-sky-300',
  'bg-emerald-500/10 text-emerald-600 ring-emerald-500/20 dark:text-emerald-300',
];

function subjectColor(subject: string): string {
  let hash = 0;
  for (let i = 0; i < subject.length; i++) hash = (hash * 31 + subject.charCodeAt(i)) % 997;
  return subjectColors[hash % subjectColors.length];
}

export default function TasksPage() {
  const { user } = useAuth();
  const classId = user?.classId || '';

  const { data: tasks, isLoading } = useQuery({
    queryKey: ['tasks', classId],
    queryFn: async () => {
      const res = await tasksApi.getAll(classId);
      return res.data.data;
    },
    enabled: !!classId,
  });

  const { data: submissions } = useQuery({
    queryKey: ['my-submissions'],
    queryFn: async () => {
      const res = await submissionsApi.getMy(classId);
      return res.data.data;
    },
    enabled: !!classId,
  });

  const getSubmissionStatus = (taskId: string) => {
    return submissions?.find((s) => s.taskId === taskId);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tugas"
        description="Daftar tugas yang harus dikerjakan"
      />

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-44 w-full" />
          ))}
        </div>
      ) : !tasks || tasks.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="Tidak ada tugas"
          description="Belum ada tugas untuk kelas Anda. Santai dulu!"
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {tasks.map((task) => {
            const submission = getSubmissionStatus(task.id);
            const isLate = isDeadlinePassed(task.deadline);

            let statusBadge = null;
            if (submission) {
              const status = statusConfig[submission.status] || statusConfig.DIKUMPULKAN;
              const Icon = status.icon;
              statusBadge = (
                <Badge className={status.className}>
                  {Icon && <Icon className="h-3 w-3" />}
                  {submission.status === 'SUDAH_DINILAI' ? submission.grade : status.label}
                </Badge>
              );
            } else if (isLate) {
              statusBadge = (
                <Badge className="bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300">
                  Terlambat
                </Badge>
              );
            }

            return (
              <Link key={task.id} href={`/dashboard/tasks/${task.id}`} className="h-full animate-fade-in-up">
                <Card className="group h-full overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-500/15 hover:ring-blue-200 dark:hover:ring-blue-500/30">
                  {/* Aksen gradient atas saat hover */}
                  <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-sky-500 to-emerald-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <div className="flex items-start justify-between gap-2 p-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="truncate font-semibold transition-colors group-hover:text-blue-700 dark:group-hover:text-blue-300">
                          {task.title}
                        </h3>
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${subjectColor(task.subject)}`}
                        >
                          {task.subject}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          {task.submissionType === 'URL' ? (
                            <Link2 className="h-3 w-3" />
                          ) : (
                            <FileText className="h-3 w-3" />
                          )}
                          {task.submissionType}
                        </span>
                      </div>
                    </div>
                    {statusBadge}
                  </div>
                  {task.description && (
                    <p className="line-clamp-2 px-4 pb-3 text-sm text-muted-foreground">
                      {task.description}
                    </p>
                  )}
                  <div
                    className={`mx-4 mb-4 flex items-center justify-between rounded-xl px-3 py-2 text-xs ${
                      isLate && !submission
                        ? 'bg-gradient-to-r from-red-50 to-orange-50 text-red-600 dark:bg-red-500/10 dark:from-red-500/10 dark:to-orange-500/10'
                        : 'bg-muted/50 text-muted-foreground'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <CalendarClock className="h-3.5 w-3.5" />
                      Deadline
                    </span>
                    <span className={isLate && !submission ? 'font-medium' : ''}>
                      {formatDate(task.deadline)}
                    </span>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
