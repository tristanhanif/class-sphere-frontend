'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { attendanceApi } from '@/services/api';
import { useAuth, useServerTime } from '@/hooks';
import { getErrorMessage } from '@/lib/errors';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/layouts/page-header';
import { getTodayWIB } from '@/lib/formatters';

import {
  Camera,
  Check,
  X,
  Clock,
  CheckCircle2,
  Loader2,
  AlertTriangle,
} from 'lucide-react';

const ATTENDANCE_STORAGE_KEY = 'classsphere_attendance';

function getTodayAttendanceKey(today: string): string {
  return `${ATTENDANCE_STORAGE_KEY}_${today}`;
}

function hasAttendedToday(today: string): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(getTodayAttendanceKey(today)) === 'true';
}

function markAttendanceDone(today: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(getTodayAttendanceKey(today), 'true');
}

function clearAttendanceFlag(today: string): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(getTodayAttendanceKey(today));
}

export default function AttendancePage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: serverTime, isLoading: timeLoading } = useServerTime();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'HADIR' | 'SAKIT'>('HADIR');
  const [keterangan, setKeterangan] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { data: attendance, isLoading: attendanceLoading } = useQuery({
    queryKey: ['my-attendance'],
    queryFn: async () => {
      const res = await attendanceApi.getMy();
      return res.data.data;
    },
  });

  // Gunakan tanggal dari SERVER (WIB) sebagai sumber kebenaran, bukan jam lokal
  // perangkat murid (yang sering diubah-ubah), agar konsisten dengan data backend.
  const today = serverTime?.serverTime?.slice(0, 10) || getTodayWIB();
  const todayAttendance = attendance?.find((a) => a.date === today);

  // Sinkronkan flag localStorage dengan data SERVER (sumber kebenaran).
  // Jika server tidak mencatat absensi hari ini, hapus flag basi dari
  // percobaan lama yang gagal agar "Absensi berhasil!" palsu tidak muncul.
  useEffect(() => {
    if (attendanceLoading || !attendance || submitSuccess) return;
    if (todayAttendance) {
      markAttendanceDone(today);
    } else if (hasAttendedToday(today)) {
      clearAttendanceFlag(today);
    }
  }, [attendance, attendanceLoading, todayAttendance, today, submitSuccess]);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      setCameraStream(stream);
    } catch {
      setSubmitError('Tidak dapat mengakses kamera. Periksa izin kamera.');
    }
  }, []);

  useEffect(() => {
    if (!cameraStream || !videoRef.current) return;
    const video = videoRef.current;
    video.srcObject = cameraStream;
    video.play().then(() => setIsCameraReady(true)).catch(() => setIsCameraReady(true));
    return () => {
      video.srcObject = null;
    };
  }, [cameraStream]);

  const stopCamera = useCallback(() => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
      setIsCameraReady(false);
    }
  }, [cameraStream]);

  const capturePhoto = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !video.videoWidth) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `absensi_${Date.now()}.jpg`, { type: 'image/jpeg' });
        setPhotoFile(file);
        setPhotoPreview(URL.createObjectURL(blob));
        stopCamera();
      },
      'image/jpeg',
      0.85,
    );
  }, [stopCamera]);

  const retakePhoto = useCallback(() => {
    setPhotoFile(null);
    setPhotoPreview(null);
    setStatus('HADIR');
    setKeterangan('');
  }, []);

  const onSubmit = async () => {
    if (!photoFile) return;
    setIsSubmitting(true);
    setSubmitError('');
    try {
      await attendanceApi.checkIn(user?.classId || '', photoFile, status, keterangan);
      setSubmitSuccess(true);
      markAttendanceDone(today);
      queryClient.invalidateQueries({ queryKey: ['my-attendance'] });
    } catch (err) {
      setSubmitError(getErrorMessage(err, 'Gagal melakukan absensi'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Sumber kebenaran = data server. Flag localStorage hanya dipakai saat
  // query belum berhasil (offline/error) sebagai cadangan, agar murid yang
  // benar-benar sudah absen tidak disuruh absen ulang.
  const isAlreadyAttended =
    todayAttendance || submitSuccess || (!attendance && hasAttendedToday(today));

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <PageHeader
        title="Absensi"
        description="Absensi harian dengan foto bukti"
      />

      <Card className="transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-emerald-500 text-white shadow-md shadow-blue-500/25">
              <Clock className="h-4 w-4" />
            </span>
            Waktu Server
          </CardTitle>
        </CardHeader>
        <CardContent>
          {timeLoading ? (
            <Skeleton className="h-20 w-full" />
          ) : (
            <div className="space-y-3">
              <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 via-sky-600 to-emerald-600 p-4 text-center shadow-lg shadow-blue-500/20">
                <div className="bg-dots pointer-events-none absolute inset-0 opacity-30" />
                <p className="relative font-mono text-2xl font-bold tracking-tight text-white">
                  {serverTime?.serverTime || '-'}
                </p>
                <p className="relative mt-1 text-xs text-white/75">
                  Timezone: {serverTime?.timezone || 'Asia/Jakarta'}
                </p>
              </div>
              <Badge
                className={
                  serverTime?.isAttendanceOpen
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                    : 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300'
                }
              >
                {serverTime?.isAttendanceOpen
                  ? 'Jam Absensi Buka (07:00 - 15:00 WIB)'
                  : 'Jam Absensi Tutup'}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {attendanceLoading || timeLoading ? (
        <Skeleton className="h-72 w-full" />
      ) : todayAttendance ? (
        <Card className="relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/10">
          <div className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 animate-float rounded-full bg-emerald-400/15 blur-3xl" />
          <CardContent className="relative py-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30 ring-4 ring-emerald-500/15">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">Sudah Absen Hari Ini</Badge>
            {todayAttendance.keterangan && (
              <p className="mt-4 text-sm text-muted-foreground">
                Keterangan: {todayAttendance.keterangan}
              </p>
            )}
            <div className="mt-4">
              {todayAttendance.photoUrl ? (
                <Image
                  src={todayAttendance.photoUrl}
                  alt="Bukti Absensi"
                  width={640}
                  height={480}
                  unoptimized
                  className="mx-auto max-h-64 w-auto rounded-xl object-cover shadow-lg ring-1 ring-emerald-500/20"
                />
              ) : (
                <div className="mx-auto max-h-64 w-full max-w-sm rounded-xl border border-dashed p-8 text-sm text-muted-foreground">
                  Foto bukti tidak tersedia.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : !serverTime?.isAttendanceOpen ? (
        <div className="relative flex items-start gap-4 overflow-hidden rounded-xl border border-red-200 bg-gradient-to-r from-red-50 to-orange-50 p-4 text-red-800 dark:border-red-500/20 dark:from-red-500/10 dark:to-orange-500/10 dark:text-red-300">
          <div className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-red-500 to-orange-500" />
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">Waktu absensi telah habis</p>
            <p className="mt-1 text-sm opacity-80">
              Jam absensi hanya dibuka pada pukul 07:00 - 15:00 WIB.
            </p>
          </div>
        </div>
      ) : isAlreadyAttended ? (
        <Card className="relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/10">
          <div className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 animate-float rounded-full bg-emerald-400/15 blur-3xl" />
          <CardContent className="relative py-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30 ring-4 ring-emerald-500/15">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <p className="font-semibold">Absensi berhasil!</p>
            <p className="text-sm text-muted-foreground">Selamat belajar!</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-emerald-500 text-white shadow-md shadow-blue-500/25">
                <Camera className="h-4 w-4" />
              </span>
              Absen Sekarang
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {submitError && (
              <Alert variant="destructive">
                <AlertDescription>{submitError}</AlertDescription>
              </Alert>
            )}

            {cameraStream ? (
              <div className="space-y-3">
                <div className="relative overflow-hidden rounded-xl bg-black">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="h-72 w-full object-cover"
                  />
                  {!isCameraReady && (
                    <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50">
                      <Loader2 className="h-4 w-4 animate-spin text-white" />
                      <p className="text-sm text-white">Memuat kamera...</p>
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-3 flex justify-center">
                    <div className="h-1 w-16 rounded-full bg-white/70" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={stopCamera} className="flex-1">
                    <X className="h-4 w-4" /> Batal
                  </Button>
                  <Button onClick={capturePhoto} disabled={!isCameraReady} className="flex-1">
                    <Camera className="h-4 w-4" /> {isCameraReady ? 'Ambil Foto' : 'Menunggu...'}
                  </Button>
                </div>
              </div>
            ) : photoPreview ? (
              <div className="space-y-4">
                <div className="overflow-hidden rounded-xl">
                  <Image
                    src={photoPreview}
                    alt="Foto preview"
                    width={640}
                    height={480}
                    unoptimized
                    className="h-72 w-full object-cover"
                  />
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-semibold">Status</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStatus('HADIR')}
                      className={
                        status === 'HADIR'
                          ? 'border-transparent bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30 hover:bg-transparent'
                          : 'transition-all hover:border-emerald-200 hover:bg-emerald-50/50 dark:hover:border-emerald-500/30 dark:hover:bg-emerald-500/5'
                      }
                    >
                      <Check className="h-4 w-4" /> Hadir
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStatus('SAKIT')}
                      className={
                        status === 'SAKIT'
                          ? 'border-transparent bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/30 hover:bg-transparent'
                          : 'transition-all hover:border-amber-200 hover:bg-amber-50/50 dark:hover:border-amber-500/30 dark:hover:bg-amber-500/5'
                      }
                    >
                      Sakit
                    </Button>
                  </div>
                </div>

                {status === 'SAKIT' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Keterangan Sakit</label>
                    <textarea
                      placeholder="Tulis keterangan sakit..."
                      value={keterangan}
                      onChange={(e) => setKeterangan(e.target.value)}
                      rows={3}
                      className="flex min-h-[80px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                )}

                <div className="flex gap-2">
                  <Button variant="outline" onClick={retakePhoto} className="flex-1">
                    <Camera className="h-4 w-4" /> Ambil Ulang
                  </Button>
                  <Button
                    onClick={onSubmit}
                    disabled={isSubmitting || (status === 'SAKIT' && !keterangan.trim())}
                    className="flex-1"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Mengirim...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4" />
                        Kirim Absensi
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div
                className="group flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-blue-300/70 bg-gradient-to-b from-blue-50/60 to-transparent p-10 text-center transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-400 hover:shadow-lg hover:shadow-blue-500/15 dark:border-blue-500/30 dark:from-blue-500/5"
                onClick={startCamera}
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-emerald-500 text-white shadow-lg shadow-blue-500/30 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                  <Camera className="h-7 w-7" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Klik untuk mengambil foto</p>
                  <p className="text-xs text-muted-foreground">
                    Buka kamera untuk bukti absensi hari ini
                  </p>
                </div>
              </div>
            )}

            <canvas ref={canvasRef} className="hidden" />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
