'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { resetPasswordSchema, ResetPasswordInput } from '@/schemas';
import { authApi } from '@/services/api';
import { useAuth } from '@/hooks';
import { getErrorMessage } from '@/lib/errors';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Eye, EyeOff, ShieldCheck } from 'lucide-react';

export default function ResetPasswordPage() {
  const { user, logout } = useAuth();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordInput) => {
    setIsLoading(true);
    setError('');
    setSuccess('');
    try {
      await authApi.resetPassword(data.oldPassword, data.newPassword);
      setSuccess('Password berhasil diubah. Silakan login kembali.');
      setTimeout(() => {
        logout();
      }, 2000);
    } catch (err) {
      setError(getErrorMessage(err, 'Gagal mengubah password'));
    } finally {
      setIsLoading(false);
    }
  };

  const passwordInput = (show: boolean) => (show ? 'text' : 'password');

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-12 sm:px-6">
      <div className="pointer-events-none absolute -top-24 right-0 h-72 w-72 animate-float rounded-full bg-blue-200/40 blur-3xl dark:bg-blue-600/10" />
      <div className="pointer-events-none absolute bottom-0 -left-24 h-72 w-72 animate-float-slow rounded-full bg-emerald-200/40 blur-3xl dark:bg-emerald-600/10" />
      <Card className="relative w-full max-w-md animate-fade-in-up shadow-xl shadow-blue-500/10 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/15">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 via-sky-500 to-emerald-500 shadow-lg shadow-blue-500/30">
            <ShieldCheck className="h-6 w-6 text-white" />
          </div>
          <CardTitle className="text-xl">Ubah Password</CardTitle>
          <CardDescription>
            Selamat datang, {user?.name}! Silakan ubah password Anda sebelum melanjutkan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {success && (
              <Alert>
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="oldPassword">Password Lama</Label>
              <div className="relative">
                <Input
                  id="oldPassword"
                  type={passwordInput(showOld)}
                  placeholder="Masukkan password lama"
                  className="h-11 pr-11"
                  {...register('oldPassword')}
                />
                <button
                  type="button"
                  onClick={() => setShowOld((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showOld ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.oldPassword && (
                <p className="text-sm text-red-500">{errors.oldPassword.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">Password Baru</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={passwordInput(showNew)}
                  placeholder="Minimal 6 karakter"
                  className="h-11 pr-11"
                  {...register('newPassword')}
                />
                <button
                  type="button"
                  onClick={() => setShowNew((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.newPassword && (
                <p className="text-sm text-red-500">{errors.newPassword.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Konfirmasi Password Baru</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={passwordInput(showConfirm)}
                  placeholder="Ulangi password baru"
                  className="h-11 pr-11"
                  {...register('confirmPassword')}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
              )}
            </div>

            <Button type="submit" className="h-11 w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Mengubah...
                </>
              ) : (
                'Ubah Password'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
