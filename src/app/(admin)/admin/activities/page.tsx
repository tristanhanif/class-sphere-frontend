'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { activitySchema, ActivityInput } from '@/schemas';
import { activitiesApi, classesApi } from '@/services/api';
import { getErrorMessage } from '@/lib/errors';
import { Card } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/layouts/page-header';
import { formatRelativeTime } from '@/lib/formatters';
import { Plus, Trash2, Megaphone, Loader2 } from 'lucide-react';

export default function AdminActivitiesPage() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [createError, setCreateError] = useState('');

  const { data: activities, isLoading } = useQuery({
    queryKey: ['activities'],
    queryFn: async () => {
      const res = await activitiesApi.getAll();
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
    mutationFn: (data: ActivityInput) => activitiesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      setIsDialogOpen(false);
      setCreateError('');
    },
    onError: (err) => {
      setCreateError(getErrorMessage(err, 'Gagal membuat pengumuman'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => activitiesApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<ActivityInput>({
    resolver: zodResolver(activitySchema),
    defaultValues: { targetClassIds: [] },
  });

  const selectedClassIds = useWatch({ control, name: 'targetClassIds' }) || [];

  const toggleClass = (classId: string) => {
    const current = selectedClassIds as string[];
    if (current.includes(classId)) {
      setValue('targetClassIds', current.filter((id) => id !== classId), { shouldValidate: true });
    } else {
      setValue('targetClassIds', [...current, classId], { shouldValidate: true });
    }
  };

  const onSubmit = (data: ActivityInput) => {
    createMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pengumuman / Kegiatan"
        description="Buat pengumuman untuk murid"
        action={
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger className={buttonVariants()}>
              <Plus className="h-4 w-4" />
              Buat Pengumuman
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Pengumuman Baru</DialogTitle>
              </DialogHeader>
              {createError && (
                <Alert variant="destructive">
                  <AlertDescription>{createError}</AlertDescription>
                </Alert>
              )}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Judul</Label>
                  <Input id="title" className="h-11" placeholder="Contoh: Libur sekolah" {...register('title')} />
                  {errors.title && <p className="text-sm text-red-500">{errors.title.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Deskripsi</Label>
                  <textarea
                    id="description"
                    className="flex min-h-[80px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    placeholder="Tulis isi pengumuman..."
                    {...register('description')}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Kelas Target</Label>
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
                  {errors.targetClassIds && (
                    <p className="text-sm text-red-500">{errors.targetClassIds.message}</p>
                  )}
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
                      'Buat Pengumuman'
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
      ) : !activities || activities.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="Belum ada pengumuman"
          description='Klik tombol "Buat Pengumuman" untuk mengirim informasi ke murid.'
        />
      ) : (
        <div className="space-y-3">
          {activities.map((activity) => (
            <Card key={activity.id} className="group overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-amber-500/10">
              <div className="h-1 w-full bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <div className="flex items-start justify-between gap-4 p-4">
                <div className="flex min-w-0 flex-1 gap-4">
                  <div className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/25 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6 sm:flex">
                    <Megaphone className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold transition-colors group-hover:text-amber-700 dark:group-hover:text-amber-300">
                      {activity.title}
                    </h3>
                    {activity.description && (
                      <p className="mt-1 text-sm text-muted-foreground">{activity.description}</p>
                    )}
                    <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="rounded-full bg-amber-500/10 px-2 py-0.5 font-medium text-amber-600 dark:text-amber-300">
                        {formatRelativeTime(activity.createdAt)}
                      </span>
                      {activity.targetClassIds?.length > 0 && (
                        <span className="rounded-full bg-blue-500/10 px-2 py-0.5 font-medium text-blue-600 dark:text-blue-300">
                          {activity.targetClassIds.length} kelas
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    if (confirm('Hapus pengumuman ini?')) {
                      deleteMutation.mutate(activity.id);
                    }
                  }}
                  title="Hapus pengumuman"
                  className="transition-colors hover:bg-red-500/10 hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
