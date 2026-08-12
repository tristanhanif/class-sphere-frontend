'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { classSchema, ClassInput } from '@/schemas';
import { classesApi, usersApi } from '@/services/api';
import { getErrorMessage } from '@/lib/errors';
import { Card } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/layouts/page-header';
import { Plus, Trash2, School, Loader2, Users } from 'lucide-react';

export default function SuperAdminClassesPage() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [createError, setCreateError] = useState('');

  const { data: classes, isLoading } = useQuery({
    queryKey: ['classes'],
    queryFn: async () => {
      const res = await classesApi.getAll();
      return res.data.data;
    },
  });

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await usersApi.getAll('USER');
      return res.data.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: ClassInput) => classesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      setIsDialogOpen(false);
      setCreateError('');
    },
    onError: (err) => {
      setCreateError(getErrorMessage(err, 'Gagal membuat kelas'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => classesApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ClassInput>({
    resolver: zodResolver(classSchema),
  });

  const onSubmit = (data: ClassInput) => {
    createMutation.mutate(data);
  };

  const studentCount = (classId: string) =>
    users?.filter((u) => u.classId === classId).length || 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kelola Kelas"
        description="Buat dan kelola data kelas"
        action={
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger className={buttonVariants()}>
              <Plus className="h-4 w-4" />
              Tambah Kelas
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Tambah Kelas Baru</DialogTitle>
              </DialogHeader>
              {createError && (
                <Alert variant="destructive">
                  <AlertDescription>{createError}</AlertDescription>
                </Alert>
              )}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nama Kelas</Label>
                  <Input id="name" className="h-11" placeholder="Contoh: 12 IPA 1" {...register('name')} />
                  {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="academicYear">Tahun Ajaran</Label>
                  <Input
                    id="academicYear"
                    className="h-11"
                    placeholder="Contoh: 2025/2026"
                    {...register('academicYear')}
                  />
                  {errors.academicYear && (
                    <p className="text-sm text-red-500">{errors.academicYear.message}</p>
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
                      'Buat Kelas'
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <Card>
        <div className="p-4">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : !classes || classes.length === 0 ? (
            <EmptyState
              icon={School}
              title="Belum ada kelas"
              description='Klik tombol "Tambah Kelas" untuk membuat kelas pertama.'
            />
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                    <TableRow className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-amber-500/10">
                      <TableHead>Nama Kelas</TableHead>
                      <TableHead>Tahun Ajaran</TableHead>
                      <TableHead>Jumlah Murid</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                <TableBody>
                  {classes.map((cls) => (
                    <TableRow key={cls.id}>
                      <TableCell>
                        <span className="flex items-center gap-3 font-medium">
                          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/25">
                            <School className="h-4 w-4" />
                          </span>
                          {cls.name}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-600 dark:text-amber-300">
                          {cls.academicYear}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Users className="h-3.5 w-3.5" />
                          {studentCount(cls.id)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (confirm(`Hapus kelas ${cls.name}?`)) {
                              deleteMutation.mutate(cls.id);
                            }
                          }}
                          title="Hapus kelas"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
