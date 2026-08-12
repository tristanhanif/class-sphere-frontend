'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { gradingSchema, GradingInput } from '@/schemas';
import { submissionsApi, tasksApi } from '@/services/api';
import axiosInstance from '@/lib/axios-instance';
import { useDebounce } from '@/hooks';
import type { Submission, PaginatedResponse } from '@/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/layouts/page-header';
import { getStatusColor, formatDateTime } from '@/lib/formatters';
import { Search, Star, Loader2, FileText, Link2, Download } from 'lucide-react';

export default function GradingPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const debouncedSearch = useDebounce(search, 500);

  const { data, isLoading } = useQuery({
    queryKey: ['submissions', { page, search: debouncedSearch, status: statusFilter }],
    queryFn: async () => {
      const res = await submissionsApi.getAll({
        page,
        limit: 10,
        search: debouncedSearch || undefined,
        status: statusFilter || undefined,
      });
      return res.data.data;
    },
  });

  const { data: tasks } = useQuery({
    queryKey: ['admin-tasks'],
    queryFn: async () => {
      const res = await tasksApi.getAll();
      return res.data.data;
    },
  });

  const gradeMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: GradingInput }) =>
      submissionsApi.grade(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ['submissions'] });
      const previous = queryClient.getQueryData<PaginatedResponse<Submission>>([
        'submissions',
        { page, search: debouncedSearch, status: statusFilter },
      ]);
      queryClient.setQueryData<PaginatedResponse<Submission>>(
        ['submissions', { page, search: debouncedSearch, status: statusFilter }],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            submissions: old.submissions.map((s) =>
              s.id === id
                ? { ...s, grade: data.grade, status: data.status, teacherFeedback: data.feedback ?? null }
                : s,
            ),
          } as PaginatedResponse<Submission>;
        },
      );
      return { previous };
    },
    onError: (err, variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['submissions', { page, search: debouncedSearch, status: statusFilter }], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors },
  } = useForm<GradingInput>({
    resolver: zodResolver(gradingSchema),
  });

  const selectedStatus = useWatch({ control, name: 'status' });

  // URL file pengumpulan: Firebase Storage (lama) atau Cloudinary (baru)
  const isFileUrl = (url: string) =>
    url.startsWith('https://storage.googleapis.com/') ||
    url.startsWith('https://res.cloudinary.com/');

  const isPdf = (url: string) => url.toLowerCase().includes('.pdf');

  const isPdfFile = (submission: Submission) =>
    !!submission.fileName?.toLowerCase().endsWith('.pdf') ||
    isPdf(submission.submissionData);

  const getFileName = (submission: Submission) => {
    if (submission.fileName) return submission.fileName;
    try {
      const segment = decodeURIComponent(
        submission.submissionData.split('/').pop() || '',
      );
      return segment.split('_').slice(1).join('_') || segment || 'file';
    } catch {
      return 'file';
    }
  };

  // Unduh file pengumpulan lewat endpoint backend (bebas masalah CORS bucket),
  // lalu simpan sebagai blob. Kalau gagal, buka file di tab baru.
  const downloadSubmissionFile = useCallback(async (submission: Submission) => {
    try {
      const res = await axiosInstance.get(`/submissions/${submission.id}/file`, {
        responseType: 'blob',
      });
      const disposition = (res.headers['content-disposition'] as string) || '';
      const match = disposition.match(/filename="?([^"]+)"?/);
      const fileName = match?.[1] || 'tugas.pdf';
      const blobUrl = URL.createObjectURL(res.data);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(blobUrl);
    } catch {
      if (submission.submissionData) {
        window.open(submission.submissionData, '_blank', 'noopener,noreferrer');
      }
    }
  }, []);

  const openGradingDialog = useCallback(
    (submission: Submission) => {
      setSelectedSubmission(submission);
      reset({
        grade: submission.grade || 0,
        status: submission.status === 'PERLU_REVISI' ? 'PERLU_REVISI' : 'SUDAH_DINILAI',
        feedback: submission.teacherFeedback || '',
      });
      setIsDialogOpen(true);
      // Auto-download hasil PDF hanya untuk pengumpulan FILE (bukan URL)
      const task = tasks?.find((t) => t.id === submission.taskId);
      const isFileSubmission =
        task?.submissionType === 'FILE' ||
        (!task && isFileUrl(submission.submissionData));
      if (isFileSubmission && isPdfFile(submission)) {
        void downloadSubmissionFile(submission);
      }
    },
    [reset, downloadSubmissionFile, tasks],
  );

  const onSubmit = (formData: GradingInput) => {
    if (!selectedSubmission) return;
    gradeMutation.mutate({
      id: selectedSubmission.id,
      data: formData,
    });
    setIsDialogOpen(false);
  };

  const getStudentName = (submission: Submission) => {
    return submission.studentName || submission.studentId.slice(0, 8) + '...';
  };

  const getTaskTitle = (taskId: string) => {
    const task = tasks?.find((t) => t.id === taskId);
    return task?.title || '-';
  };

  const selectedTask = tasks?.find((t) => t.id === selectedSubmission?.taskId);
  const submissionUrl = selectedSubmission?.submissionData || '';
  const isFileSubmission =
    !!selectedSubmission &&
    (!!selectedSubmission.fileName ||
      selectedTask?.submissionType === 'FILE' ||
      (!selectedTask && isFileUrl(submissionUrl)));
  const isPdfSubmission = !!selectedSubmission && isPdfFile(selectedSubmission);

  const filters = [
    { value: '', label: 'Semua' },
    { value: 'BELUM_DINILAI', label: 'Belum Dinilai' },
    { value: 'PERLU_REVISI', label: 'Perlu Revisi' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Penilaian Tugas"
        description="Nilai pengumpulan tugas murid"
      />

      <Card>
        <div className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari nama murid..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="h-10 pl-10"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {filters.map((f) => (
              <Button
                key={f.value}
                variant={statusFilter === f.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setStatusFilter(f.value);
                  setPage(1);
                }}
                className={
                  statusFilter === f.value
                    ? 'shadow-md shadow-blue-500/25'
                    : 'transition-colors hover:border-blue-200 hover:bg-blue-50/50 dark:hover:border-blue-500/30 dark:hover:bg-blue-500/5'
                }
              >
                {f.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="px-4 pb-4">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : !data?.submissions || data.submissions.length === 0 ? (
            <EmptyState
              icon={Star}
              title="Tidak ada data pengumpulan"
              description="Belum ada pengumpulan tugas yang perlu dinilai."
            />
          ) : (
            <>
              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-blue-500/10 via-sky-500/10 to-emerald-500/10">
                      <TableHead>Murid</TableHead>
                      <TableHead>Tugas</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Nilai</TableHead>
                      <TableHead>Kumpul</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.submissions.map((submission) => (
                      <TableRow key={submission.id}>
                        <TableCell className="font-medium">{getStudentName(submission)}</TableCell>
                        <TableCell>{getTaskTitle(submission.taskId)}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(submission.status)}>
                            {submission.status.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-semibold">
                          {submission.grade != null ? (
                            <span className="inline-flex min-w-8 items-center justify-center rounded-lg bg-emerald-100 px-2 py-0.5 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                              {submission.grade}
                            </span>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell className="text-xs">
                          {formatDateTime(submission.submittedAt)}
                          {submission.isLate && (
                            <Badge className="ml-1 bg-red-100 text-xs text-red-700 dark:bg-red-500/15 dark:text-red-300">
                              Terlambat
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openGradingDialog(submission)}
                            className="border-amber-300 bg-amber-50 text-amber-700 transition-all hover:border-amber-400 hover:bg-amber-100 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-300 dark:hover:bg-amber-500/20"
                          >
                            <Star className="mr-1 h-3.5 w-3.5" />
                            Nilai
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
                <p className="text-sm text-muted-foreground">
                  Halaman {data.page} dari {data.totalPages} · Total {data.total} pengumpulan
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Sebelumnya
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= data.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Selanjutnya
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Penilaian Tugas</DialogTitle>
            {selectedSubmission && (
              <p className="text-sm text-muted-foreground">
                {getStudentName(selectedSubmission)} · {getTaskTitle(selectedSubmission.taskId)}
              </p>
            )}
          </DialogHeader>
          {selectedSubmission && (
            <div className="rounded-xl border bg-muted/30 p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-muted-foreground">
                    Hasil Pengumpulan
                  </p>
                  <p className="truncate text-sm font-medium">
                    {isFileSubmission && selectedSubmission
                      ? getFileName(selectedSubmission)
                      : submissionUrl}
                  </p>
                </div>
                {isFileSubmission ? (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => downloadSubmissionFile(selectedSubmission)}
                    className="shrink-0"
                  >
                    {isPdfSubmission ? (
                      <>
                        <Download className="mr-1 h-3.5 w-3.5" />
                        Download PDF
                      </>
                    ) : (
                      <>
                        <FileText className="mr-1 h-3.5 w-3.5" />
                        Download File
                      </>
                    )}
                  </Button>
                ) : (
                  <a
                    href={submissionUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0"
                  >
                    <Button type="button" size="sm" variant="outline">
                      <Link2 className="mr-1 h-3.5 w-3.5" />
                      Buka URL
                    </Button>
                  </a>
                )}
              </div>
            </div>
          )}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="grade">Nilai (0-100)</Label>
              <Input
                id="grade"
                type="number"
                min={0}
                max={100}
                className="h-11"
                {...register('grade', { valueAsNumber: true })}
              />
              {errors.grade && <p className="text-sm text-red-500">{errors.grade.message}</p>}
            </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'SUDAH_DINILAI', label: 'Sudah Dinilai' },
                    { value: 'PERLU_REVISI', label: 'Perlu Revisi' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setValue('status', opt.value as GradingInput['status'], { shouldValidate: true })}
                      className={`flex items-center justify-center rounded-lg border px-3 py-2.5 text-sm transition-colors ${
                        selectedStatus === opt.value
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-input bg-background hover:bg-muted'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

            <div className="space-y-2">
              <Label htmlFor="feedback">Feedback</Label>
              <textarea
                id="feedback"
                className="flex min-h-[80px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                placeholder="Masukkan feedback untuk murid..."
                {...register('feedback')}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={gradeMutation.isPending}>
                {gradeMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  'Simpan Nilai'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
