'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { attendanceApi, classesApi, usersApi } from '@/services/api';
import { useServerTime } from '@/hooks';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/layouts/page-header';
import { formatDateTime } from '@/lib/formatters';
import { Download, Camera, CalendarDays, School } from 'lucide-react';

export default function AdminAttendancePage() {
  const [selectedClassId, setSelectedClassId] = useState('');
  // Tanggal default diambil dari waktu server (WIB), bukan jam lokal perangkat,
  // agar sinkron dengan tanggal yang tersimpan di database. Hanya diisi SEKALI;
  // guru tetap bisa mengosongkan tanggal untuk melihat "Semua Tanggal".
  const [selectedDate, setSelectedDate] = useState('');
  const hasDateBeenSet = useRef(false);

  const { data: serverTime } = useServerTime();

  useEffect(() => {
    if (!hasDateBeenSet.current && serverTime?.serverTime) {
      hasDateBeenSet.current = true;
      setSelectedDate(serverTime.serverTime.slice(0, 10));
    }
  }, [serverTime]);

  const { data: classes } = useQuery({
    queryKey: ['classes'],
    queryFn: async () => {
      const res = await classesApi.getAll();
      return res.data.data;
    },
  });

  const { data: attendances, isLoading, error } = useQuery({
    queryKey: ['admin-attendance', selectedClassId, selectedDate],
    queryFn: async () => {
      const res = await attendanceApi.getAll(selectedClassId || undefined, selectedDate || undefined);
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

  const getStudentName = (studentId: string) => {
    const student = users?.find((u) => u.id === studentId);
    return student?.name || studentId.slice(0, 8);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rekap Absensi"
        description="Lihat data absensi murid"
      />

      <Card>
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-end">
          <div className="space-y-2">
            <label className="flex items-center gap-1.5 text-sm font-medium">
              <School className="h-4 w-4 text-muted-foreground" />
              Kelas
            </label>
            <select
              className="flex h-10 w-full min-w-48 rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 sm:w-56"
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
            >
              <option value="">Semua Kelas</option>
              {classes?.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="flex items-center gap-1.5 text-sm font-medium">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              Tanggal
            </label>
            <Input
              type="date"
              className="h-10 w-full sm:w-48"
              value={selectedDate}
              onChange={(e) => {
                hasDateBeenSet.current = true;
                setSelectedDate(e.target.value);
              }}
              placeholder="Semua Tanggal"
            />
          </div>
        </div>

        <div className="px-4 pb-4">
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>Gagal memuat data absensi</AlertDescription>
            </Alert>
          ) : isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : !attendances || attendances.length === 0 ? (
            <EmptyState
              icon={Camera}
              title="Tidak ada data absensi"
              description="Belum ada murid yang melakukan absensi untuk filter ini."
            />
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                    <TableRow className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-blue-500/10">
                      <TableHead>Murid</TableHead>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Keterangan</TableHead>
                      <TableHead>Waktu</TableHead>
                      <TableHead className="text-right">Foto</TableHead>
                    </TableRow>
                  </TableHeader>
                <TableBody>
                  {attendances.map((att) => (
                    <TableRow key={att.id}>
                      <TableCell className="font-medium">{getStudentName(att.studentId)}</TableCell>
                      <TableCell>{att.date}</TableCell>
                      <TableCell>
                        <Badge
                          className={
                            att.status === 'SAKIT'
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300'
                              : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                          }
                        >
                          {att.status === 'SAKIT' ? '🤒 Sakit' : '✅ Hadir'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {att.keterangan || '-'}
                      </TableCell>
                      <TableCell className="text-xs">{formatDateTime(att.submittedAt)}</TableCell>
                      <TableCell className="text-right">
                        {att.photoUrl ? (
                          <a href={att.photoUrl} target="_blank" rel="noopener noreferrer">
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-blue-300 bg-blue-50 text-blue-700 transition-all hover:border-blue-400 hover:bg-blue-100 dark:border-blue-500/40 dark:bg-blue-500/10 dark:text-blue-300 dark:hover:bg-blue-500/20"
                            >
                              <Download className="h-3 w-3" />
                              Lihat
                            </Button>
                          </a>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
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
