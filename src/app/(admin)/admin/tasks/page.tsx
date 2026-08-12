'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { taskSchema, TaskInput } from '@/schemas';
import { tasksApi, classesApi } from '@/services/api';
import { getErrorMessage } from '@/lib/errors';
import { Card } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/layouts/page-header';
import { formatDate, isDeadlinePassed } from '@/lib/formatters';
import { Plus, Trash2, ClipboardList, FileText, Link2, Loader2, CalendarClock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminTasksPage() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [createError, setCreateError] = useState('');

  const { data: tasks, isLoading } = useQuery({
    queryKey: ['admin-tasks'],
    queryFn: async () => {
      const res = await tasksApi.getAll();
      return res.data.data;
    },
  });

  const { data: classes } = useQuery({
    queryKey: ['classes'],
    queryFn: async () => {
      const res = await classesApi.getAll();
      return res.data.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: TaskInput) => {
      const response = await tasksApi.create(data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tasks'] });
      setIsDialogOpen(false);
      setCreateError('');
    },
    onError: (err) => {
      setCreateError(getErrorMessage(err, 'Gagal membuat tugas'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => tasksApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tasks'] });
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<TaskInput>({
    resolver: zodResolver(taskSchema),
    defaultValues: { classIds: [], submissionType: 'FILE' },
  });

  const selectedClassIds = useWatch({ control, name: 'classIds' }) || [];
  const submissionType = useWatch({ control, name: 'submissionType' });

  const toggleClass = (classId: string) => {
    const current = selectedClassIds as string[];
    if (current.includes(classId)) {
      setValue('classIds', current.filter((id) => id !== classId), { shouldValidate: true });
    } else {
      setValue('classIds', [...current, classId], { shouldValidate: true });
    }
  };

  const onSubmit = (data: TaskInput) => {
    const dataToSubmit = {
      ...data,
      deadline:
        data.deadline.includes('T') && !data.deadline.match(/T\d{2}:\d{2}:\d{2}/)
          ? data.deadline + ':00'
          : data.deadline,
    };
    createMutation.mutate(dataToSubmit);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kelola Tugas"
        description="Buat dan kelola tugas untuk murid"
        action={
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger className={buttonVariants()}>
              <Plus className="h-4 w-4" />
              Buat Tugas
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Buat Tugas Baru</DialogTitle>
              </DialogHeader>
              {createError && (
                <Alert variant="destructive">
                  <AlertDescription>{createError}</AlertDescription>
                </Alert>
              )}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Judul Tugas</Label>
                  <Input id="title" className="h-11" placeholder="Contoh: Latihan soal bab 3" {...register('title')} />
                  {errors.title && <p className="text-sm text-red-500">{errors.title.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Deskripsi</Label>
                  <textarea
                    id="description"
                    className="flex min-h-[80px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    placeholder="Jelaskan detail tugas..."
                    {...register('description')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Mata Pelajaran</Label>
                  <Input id="subject" className="h-11" placeholder="Contoh: Matematika" {...register('subject')} />
                  {errors.subject && <p className="text-sm text-red-500">{errors.subject.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label>Kelas</Label>
                  <div className="space-y-2 rounded-lg border p-3">
                    {classes?.map((cls) => (
                      <label key={cls.id} className="flex cursor-pointer items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedClassIds.includes(cls.id)}
                          onChange={() => toggleClass(cls.id)}
                          className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
                        />
                        <span className="text-sm">{cls.name}</span>
                        <span className="ml-auto text-xs text-muted-foreground">{cls.academicYear}</span>
                      </label>
                    ))}
                  </div>
                  {errors.classIds && <p className="text-sm text-red-500">{errors.classIds.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deadline">Deadline</Label>
                  <Input id="deadline" type="datetime-local" className="h-11" {...register('deadline')} />
                  {errors.deadline && <p className="text-sm text-red-500">{errors.deadline.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label>Tipe Pengumpulan</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setValue('submissionType', 'FILE')}
                      className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm transition-colors ${
                        submissionType === 'FILE'
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-input bg-background hover:bg-muted'
                      }`}
                    >
                      <FileText className="h-4 w-4" />
                      File
                    </button>
                    <button
                      type="button"
                      onClick={() => setValue('submissionType', 'URL')}
                      className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm transition-colors ${
                        submissionType === 'URL'
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-input bg-background hover:bg-muted'
                      }`}
                    >
                      <Link2 className="h-4 w-4" />
                      URL
                    </button>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Batal
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Membuat...
                      </>
                    ) : (
                      'Buat Tugas'
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : !tasks || tasks.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="Belum ada tugas"
          description='Klik tombol "Buat Tugas" untuk membuat tugas pertama Anda.'
        />
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => {
            const isLate = isDeadlinePassed(task.deadline);
            return (
              <Card key={task.id} className="group overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/10">
                <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-sky-500 to-emerald-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <div className="flex items-center justify-between gap-4 p-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold transition-colors group-hover:text-blue-700 dark:group-hover:text-blue-300">
                        {task.title}
                      </h3>
                      {isLate && (
                        <Badge className="bg-red-100 text-xs text-red-700 dark:bg-red-500/15 dark:text-red-300">
                          Deadline lewat
                        </Badge>
                      )}
                      <span className="flex items-center gap-1 rounded-full bg-muted/60 px-2 py-0.5 text-xs text-muted-foreground">
                        {task.submissionType === 'URL' ? (
                          <Link2 className="h-3 w-3" />
                        ) : (
                          <FileText className="h-3 w-3" />
                        )}
                        {task.submissionType}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-sm text-muted-foreground">
                      <span className="font-medium text-foreground/80">{task.subject}</span> ·{' '}
                      {task.classIds?.length || 0} kelas
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="hidden items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-600 dark:text-amber-300 sm:flex">
                      <CalendarClock className="h-3.5 w-3.5" />
                      {formatDate(task.deadline)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (confirm('Hapus tugas ini?')) {
                          deleteMutation.mutate(task.id);
                        }
                      }}
                      title="Hapus tugas"
                      className="transition-colors hover:bg-red-500/10 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
