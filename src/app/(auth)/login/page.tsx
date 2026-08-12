'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, LoginInput } from '@/schemas';
import { authApi } from '@/services/api';
import { useAuthStore } from '@/store';
import { getErrorMessage } from '@/lib/errors';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ClipboardList,
  Camera,
  ShieldCheck,
  Loader2,
  Eye,
  EyeOff,
  Sparkles,
} from 'lucide-react';

const features = [
  {
    icon: ClipboardList,
    title: 'Manajemen Tugas',
    desc: 'Pantau tugas, deadline, dan nilai secara terpusat.',
    chip: 'bg-blue-500/15 text-blue-300 ring-blue-400/30',
  },
  {
    icon: Camera,
    title: 'Absensi Foto',
    desc: 'Absensi harian dengan bukti foto untuk akurasi data.',
    chip: 'bg-emerald-500/15 text-emerald-300 ring-emerald-400/30',
  },
  {
    icon: ShieldCheck,
    title: 'Peran Terpisah',
    desc: 'Akses berbeda untuk murid, guru, dan super admin.',
    chip: 'bg-amber-500/15 text-amber-300 ring-amber-400/30',
  },
];

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true);
    setError('');
    try {
      const response = await authApi.login(data.identifier, data.password);
      const { token, user } = response.data.data;
      login(user, token);

      if (user.isFirstLogin) {
        router.push('/reset-password');
        return;
      }

      if (user.role === 'SUPERADMIN') {
        router.push('/superadmin');
      } else if (user.role === 'ADMIN') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      setError(getErrorMessage(err, 'Login gagal'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-[oklch(0.27_0.07_253)] via-[oklch(0.21_0.06_252)] to-[oklch(0.16_0.05_250)] lg:flex lg:flex-col lg:justify-between lg:p-12">
        {/* Orbs animasi */}
        <div className="pointer-events-none absolute -top-32 -left-32 h-[28rem] w-[28rem] animate-float rounded-full bg-blue-500/30 blur-3xl" />
        <div className="pointer-events-none absolute top-1/3 -right-24 h-96 w-96 animate-float-slow rounded-full bg-emerald-600/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 left-1/4 h-80 w-80 animate-float rounded-full bg-sky-500/25 blur-3xl" />
        <div className="bg-dots pointer-events-none absolute inset-0 opacity-40" />

        <div className="relative flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-400 via-sky-500 to-emerald-500 shadow-lg shadow-blue-950/50 ring-1 ring-white/20">
            <img
              src="/class-sphere.png"
              alt="ClassSphere Logo"
              className="h-7 w-7 object-contain"
            />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              Class<span className="bg-gradient-to-r from-blue-300 to-emerald-300 bg-clip-text text-transparent">Sphere</span>
            </h1>
            <p className="text-xs text-white/60">Sistem Informasi Manajemen Tugas & Absensi</p>
          </div>
        </div>

        <div className="relative space-y-8">
          <h2 className="max-w-md text-4xl font-bold leading-tight tracking-tight text-white">
            Kelola tugas & absensi sekolah jadi lebih{' '}
            <span className="animate-gradient-x bg-gradient-to-r from-blue-300 via-sky-300 to-emerald-300 bg-clip-text text-transparent">
              mudah & seru
            </span>
          </h2>

          <div className="space-y-4">
            {features.map((f) => (
              <div
                key={f.title}
                className="group flex items-start gap-4 rounded-2xl p-3 transition-all duration-300 hover:bg-white/5 hover:pl-5"
              >
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 backdrop-blur-sm transition-transform duration-300 group-hover:scale-110 ${f.chip}`}
                >
                  <f.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-white">{f.title}</p>
                  <p className="text-sm text-white/60">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="relative flex items-center gap-1.5 text-xs text-white/40">
          <Sparkles className="h-3.5 w-3.5" />
          © {new Date().getFullYear()} ClassSphere. Dibuat untuk dunia pendidikan.
        </p>
      </div>

      {/* Form panel */}
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-12 sm:px-6">
        <div className="pointer-events-none absolute -top-24 right-0 h-72 w-72 animate-float rounded-full bg-blue-200/40 blur-3xl dark:bg-blue-600/10" />
        <div className="pointer-events-none absolute bottom-0 -left-24 h-72 w-72 animate-float-slow rounded-full bg-emerald-200/40 blur-3xl dark:bg-emerald-600/10" />

        <div className="relative w-full max-w-sm animate-fade-in-up">
          <div className="mb-8 flex flex-col items-center text-center lg:hidden">
          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 via-sky-500 to-emerald-500 shadow-lg shadow-blue-500/30">
            <img
              src="/class-sphere.png"
              alt="ClassSphere Logo"
              className="h-9 w-9 object-contain"
            />
            </div>
            <h1 className="mt-4 text-2xl font-bold tracking-tight">
              Class<span className="text-gradient">Sphere</span>
            </h1>
            <p className="text-sm text-muted-foreground">
              Sistem Informasi Manajemen Tugas & Absensi
            </p>
          </div>

          <div className="hidden lg:mb-8">
            <h2 className="text-2xl font-bold tracking-tight">
              Selamat datang kembali{' '}
              <span className="inline-block animate-pulse-glow"></span>
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Masuk menggunakan akun yang telah disediakan sekolah Anda.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {error && (
              <Alert variant="destructive" className="py-3">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="identifier">NIK / NIS / NIP</Label>
              <Input
                id="identifier"
                placeholder="Masukkan identifier Anda"
                className="h-11 px-3.5 shadow-sm transition-shadow focus-visible:shadow-md focus-visible:shadow-blue-500/10"
                autoComplete="username"
                {...register('identifier')}
              />
              {errors.identifier && (
                <p className="text-sm text-red-500">{errors.identifier.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Masukkan password"
                  className="h-11 px-3.5 pr-11 shadow-sm transition-shadow focus-visible:shadow-md focus-visible:shadow-blue-500/10"
                  autoComplete="current-password"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                  title={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="h-11 w-full text-base shadow-lg shadow-blue-500/30"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Masuk...
                </>
              ) : (
                'Masuk'
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
