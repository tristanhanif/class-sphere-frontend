'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { userSchema, UserInput } from '@/schemas';
import { usersApi, classesApi } from '@/services/api';
import { getErrorMessage } from '@/lib/errors';
import { Card } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/layouts/page-header';
import { getRoleLabel } from '@/lib/formatters';
import { Plus, Trash2, Users, Loader2, Search } from 'lucide-react';

export default function SuperAdminUsersPage() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState('');
  const [search, setSearch] = useState('');

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await usersApi.getAll();
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
    mutationFn: (data: UserInput) => usersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsDialogOpen(false);
      setCreateError('');
      setCreateSuccess('User berhasil dibuat');
      setTimeout(() => setCreateSuccess(''), 4000);
    },
    onError: (err) => {
      setCreateError(getErrorMessage(err, 'Gagal membuat user'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => usersApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<UserInput>({
    resolver: zodResolver(userSchema),
    defaultValues: { role: 'USER' },
  });

  const selectedRole = useWatch({ control, name: 'role' });

  const onSubmit = (data: UserInput) => {
    createMutation.mutate(data);
  };

  const roleBadgeColor = (role: string) => {
    switch (role) {
      case 'SUPERADMIN':
        return 'bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300';
      case 'ADMIN':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300';
      default:
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300';
    }
  };

  const className = (classId?: string | null) =>
    classes?.find((c) => c.id === classId)?.name || classId || '-';

  const filteredUsers = (users || []).filter((u) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      u.name?.toLowerCase().includes(q) ||
      u.identifier?.toLowerCase().includes(q)
    );
  });

  const initials = (name: string) =>
    name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kelola Users"
        description="Tambah, edit, dan hapus akun pengguna"
        action={
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger className={buttonVariants()}>
              <Plus className="h-4 w-4" />
              Tambah User
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Tambah User Baru</DialogTitle>
              </DialogHeader>
              {createError && (
                <Alert variant="destructive">
                  <AlertDescription>{createError}</AlertDescription>
                </Alert>
              )}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="identifier">Identifier (NIK/NIS/NIP)</Label>
                  <Input id="identifier" className="h-11" placeholder="Contoh: 20230001" {...register('identifier')} />
                  {errors.identifier && <p className="text-sm text-red-500">{errors.identifier.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Nama Lengkap</Label>
                  <Input id="name" className="h-11" placeholder="Nama lengkap pengguna" {...register('name')} />
                  {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    className="h-11"
                    placeholder="Minimal 6 karakter"
                    {...register('password')}
                  />
                  {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label>Role</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'USER', label: 'Murid' },
                      { value: 'ADMIN', label: 'Guru' },
                      { value: 'SUPERADMIN', label: 'Super Admin' },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setValue('role', opt.value as UserInput['role'], { shouldValidate: true })}
                        className={`rounded-lg border px-3 py-2.5 text-sm transition-colors ${
                          selectedRole === opt.value
                            ? 'border-primary bg-primary/5 text-primary'
                            : 'border-input bg-background hover:bg-muted'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {selectedRole === 'USER' && (
                  <div className="space-y-2">
                    <Label>Kelas</Label>
                    <select
                      className="flex h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                      {...register('classId')}
                    >
                      <option value="">Pilih Kelas</option>
                      {classes?.map((cls) => (
                        <option key={cls.id} value={cls.id}>
                          {cls.name} ({cls.academicYear})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

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
                      'Buat User'
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {createSuccess && (
        <Alert>
          <AlertDescription>{createSuccess}</AlertDescription>
        </Alert>
      )}

      <Card>
        <div className="border-b p-4">
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari nama atau identifier..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 pl-10"
            />
          </div>
        </div>
        <div className="p-4">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : filteredUsers.length === 0 ? (
            <EmptyState
              icon={Users}
              title="Tidak ada pengguna"
              description="Tidak ada data yang cocok dengan pencarian."
            />
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                    <TableRow className="bg-gradient-to-r from-blue-500/10 via-sky-500/10 to-emerald-500/10">
                      <TableHead>Pengguna</TableHead>
                      <TableHead>Identifier</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Kelas</TableHead>
                      <TableHead>Password Baru</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <span
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${
                              user.role === 'SUPERADMIN'
                                ? 'bg-gradient-to-br from-teal-500 to-emerald-600'
                                : user.role === 'ADMIN'
                                ? 'bg-gradient-to-br from-blue-500 to-sky-600'
                                : 'bg-gradient-to-br from-emerald-500 to-teal-600'
                            }`}
                          >
                            {initials(user.name || '?')}
                          </span>
                          <span className="font-medium">{user.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{user.identifier}</TableCell>
                      <TableCell>
                        <Badge className={roleBadgeColor(user.role)}>{getRoleLabel(user.role)}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">{className(user.classId)}</TableCell>
                      <TableCell>
                        {user.isFirstLogin ? (
                          <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                            Belum Diubah
                          </Badge>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (confirm(`Hapus user ${user.name}?`)) {
                              deleteMutation.mutate(user.id);
                            }
                          }}
                          title="Hapus user"
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
