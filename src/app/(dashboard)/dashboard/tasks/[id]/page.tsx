'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { taskSubmissionSchema } from '@/schemas';
import { tasksApi, submissionsApi } from '@/services/api';
import { useAuth } from '@/hooks';
import { getErrorMessage } from '@/lib/errors';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate, isDeadlinePassed } from '@/lib/formatters';
import { useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  CalendarClock,
  FileText,
  Link2,
  Upload,
  CheckCircle2,
  RefreshCcw,
  Loader2,
  MessageSquare,
} from 'lucide-react';

const statusLabel: Record<string, { label: string; className: string }> = {
  SUDAH_DINILAI: { label: 'Sudah Dinilai', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' },
  PERLU_REVISI: { label: 'Perlu Revisi', className: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300' },
  BELUM_DINILAI: { label: 'Dikumpulkan', className: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300' },
};

interface SubmissionFormValues {
  type: 'URL' | 'FILE';
  url?: string;
  file?: FileList;
}

const submissionResolver = zodResolver(taskSubmissionSchema) as Resolver<SubmissionFormValues>;

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params.id as string;
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const { data: task, isLoading } = useQuery({
    queryKey: ['task', taskId],
    queryFn: async () => {
      const res = await tasksApi.getOne(taskId);
      return res.data.data;
    },
  });

  const { data: existingSubmission } = useQuery({
    queryKey: ['my-submission', taskId],
    queryFn: async () => {
      const res = await submissionsApi.getMy(user?.classId || undefined);
      const submissions = res.data.data;
      return submissions.find((s) => s.taskId === taskId) || null;
    },
    enabled: !!user?.classId,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SubmissionFormValues>({
    resolver: submissionResolver,
    defaultValues: { type: task?.submissionType || 'URL' },
  });

  const onSubmit = async (data: SubmissionFormValues) => {
    setIsSubmitting(true);
    setSubmitError('');
    setUploadProgress(0);

    try {
      if (data.type === 'URL') {
        await submissionsApi.submit(taskId, user?.classId || '', data.url ?? '');
      } else {
        const file = data.file?.[0];
        if (!file) return;
        const progressInterval = setInterval(() => {
          setUploadProgress((prev) => Math.min(prev + 10, 90));
        }, 200);

        await submissionsApi.submit(taskId, user?.classId || '', '', file);

        clearInterval(progressInterval);
        setUploadProgress(100);
      }

      setSubmitSuccess(true);
      queryClient.invalidateQueries({ queryKey: ['my-submission', taskId] });
      queryClient.invalidateQueries({ queryKey: ['my-submissions'] });
    } catch (err) {
      setSubmitError(getErrorMessage(err, 'Gagal mengumpulkan tugas'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!task) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Tugas tidak ditemukan</AlertDescription>
      </Alert>
    );
  }

  const isLate = isDeadlinePassed(task.deadline);
  const isAlreadySubmitted = !!existingSubmission;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Kembali
      </button>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">{task.title}</h1>
            <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
              {task.subject}
            </Badge>
          </div>
          <div className="mt-2 h-1 w-12 rounded-full bg-gradient-to-r from-blue-500 via-sky-500 to-emerald-500" />
          <p className="mt-2 text-sm text-muted-foreground">
            Tipe pengumpulan: {task.submissionType}
          </p>
        </div>
        {isAlreadySubmitted && existingSubmission.status && (
          <Badge className={statusLabel[existingSubmission.status]?.className}>
            {statusLabel[existingSubmission.status]?.label}
          </Badge>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Detail Tugas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {task.description && (
            <p className="text-sm leading-relaxed text-foreground/80">{task.description}</p>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-xl bg-muted/40 p-3 ring-1 ring-transparent transition-all hover:ring-blue-200 dark:hover:ring-blue-500/30">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-emerald-500 text-white shadow-md shadow-blue-500/25">
                {task.submissionType === 'URL' ? (
                  <Link2 className="h-4 w-4" />
                ) : (
                  <FileText className="h-4 w-4" />
                )}
              </span>
              <div>
                <p className="text-xs text-muted-foreground">Tipe Pengumpulan</p>
                <p className="text-sm font-medium">{task.submissionType}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-muted/40 p-3 ring-1 ring-transparent transition-all hover:ring-amber-200 dark:hover:ring-amber-500/30">
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-lg shadow-md ${
                  isLate && !isAlreadySubmitted
                    ? 'bg-gradient-to-br from-red-500 to-orange-600 text-white shadow-red-500/25'
                    : 'bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-amber-500/25'
                }`}
              >
                <CalendarClock className="h-4 w-4" />
              </span>
              <div>
                <p className="text-xs text-muted-foreground">Deadline</p>
                <p className={`text-sm font-medium ${isLate && !isAlreadySubmitted ? 'text-red-500' : ''}`}>
                  {formatDate(task.deadline)}
                </p>
              </div>
            </div>
          </div>
          {isLate && !isAlreadySubmitted && (
            <Alert variant="destructive">
              <AlertDescription>
                Deadline tugas ini sudah terlewati. Pengumpulan tetap diterima dengan status terlambat.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {isAlreadySubmitted ? (
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              Pengumpulan Anda
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {existingSubmission.grade != null && (
              <div className="relative flex items-center gap-4 overflow-hidden rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 p-4 shadow-lg shadow-emerald-500/20">
                <div className="bg-dots pointer-events-none absolute inset-0 opacity-30" />
                <span className="relative text-sm font-medium text-white/90">Nilai Anda</span>
                <span className="relative text-3xl font-bold text-white">
                  {existingSubmission.grade}
                </span>
              </div>
            )}
            {existingSubmission.teacherFeedback && (
              <div className="rounded-lg border p-4">
                <p className="flex items-center gap-2 text-sm font-medium">
                  <MessageSquare className="h-4 w-4 text-blue-500" />
                  Feedback Guru
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {existingSubmission.teacherFeedback}
                </p>
              </div>
            )}
            {existingSubmission.isLate && (
              <Badge variant="outline" className="border-red-300 text-red-600">
                Terlambat
              </Badge>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Upload className="h-4 w-4 text-blue-500" />
              Kumpulkan Tugas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {submitSuccess ? (
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30 ring-4 ring-emerald-500/15">
                  <CheckCircle2 className="h-7 w-7" />
                </div>
                <div>
                  <p className="font-semibold">Tugas berhasil dikumpulkan! 🎉</p>
                  <p className="text-sm text-muted-foreground">Tetap pantau status penilaianmu.</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {submitError && (
                  <Alert variant="destructive">
                    <AlertDescription>{submitError}</AlertDescription>
                  </Alert>
                )}

                {task.submissionType === 'URL' ? (
                  <div className="space-y-2">
                    <Label htmlFor="url">URL Pengumpulan</Label>
                    <Input
                      id="url"
                      placeholder="https://..."
                      className="h-11"
                      {...register('url')}
                    />
                    {errors.url && (
                      <p className="text-sm text-red-500">{errors.url.message}</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="file">File (PDF, DOCX, ZIP - Maks 5MB)</Label>
                    <div className="flex items-center gap-3">
                      <Input
                        id="file"
                        type="file"
                        accept=".pdf,.docx,.zip"
                        className="h-11"
                        {...register('file')}
                      />
                    </div>
                    {errors.file && (
                      <p className="text-sm text-red-500">{errors.file.message}</p>
                    )}
                  </div>
                )}

                {isSubmitting && (
                  <div className="space-y-2">
                    <Progress value={uploadProgress} className="h-2" />
                    <p className="text-center text-xs text-muted-foreground">
                      {uploadProgress < 100 ? 'Mengunggah...' : 'Selesai!'}
                    </p>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto"
                  size="lg"
                  variant={isLate ? 'secondary' : 'default'}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Mengumpulkan...
                    </>
                  ) : isLate ? (
                    <>
                      <RefreshCcw className="h-4 w-4" />
                      Kumpulkan (Terlambat)
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      Kumpulkan Tugas
                    </>
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
