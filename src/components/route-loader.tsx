'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { LoadingScreen } from '@/components/loading-screen';

type SplashPhase = 'visible' | 'fading' | 'hidden';

export function RouteLoader() {
  const pathname = usePathname();
  const [splashPhase, setSplashPhase] = useState<SplashPhase>('visible');
  const [isNavigating, setIsNavigating] = useState(false);
  const navStartRef = useRef<number | null>(null);

  // Splash screen singkat saat pertama kali membuka aplikasi.
  useEffect(() => {
    const t1 = setTimeout(() => setSplashPhase('fading'), 1100);
    return () => clearTimeout(t1);
  }, []);

  useEffect(() => {
    if (splashPhase !== 'fading') return;
    const t2 = setTimeout(() => setSplashPhase('hidden'), 500);
    return () => clearTimeout(t2);
  }, [splashPhase]);

  // Deteksi navigasi internal (klik <Link>/<a> menuju halaman lain).
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      // Abaikan klik yang tidak menavigasi di tab yang sama.
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
        return;
      }
      const target = e.target as HTMLElement | null;
      const anchor = target?.closest?.('a');
      if (!anchor || anchor.target === '_blank') return;

      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('#')) {
        return;
      }
      // Abaikan navigasi ke halaman yang sama.
      if (href === pathname || href === `${pathname}/`) return;

      navStartRef.current = Date.now();
      setIsNavigating(true);
    };

    const handlePopState = () => {
      navStartRef.current = Date.now();
      setIsNavigating(true);
    };

    document.addEventListener('click', handleClick);
    window.addEventListener('popstate', handlePopState);
    return () => {
      document.removeEventListener('click', handleClick);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [pathname]);

  // Sembunyikan overlay setelah route berubah (dengan durasi minimum agar tidak berkedip).
  useEffect(() => {
    if (!isNavigating) return;
    const elapsed = navStartRef.current ? Date.now() - navStartRef.current : 0;
    const remaining = Math.max(0, 450 - elapsed);
    const t = setTimeout(() => setIsNavigating(false), remaining);
    return () => clearTimeout(t);
  }, [pathname, isNavigating]);

  // Jaring pengaman: jangan sampai overlay macet jika navigasi dibatalkan
  // (mis. onClick dengan preventDefault) atau gagal.
  useEffect(() => {
    if (!isNavigating) return;
    const safety = setTimeout(() => setIsNavigating(false), 8000);
    return () => clearTimeout(safety);
  }, [isNavigating]);

  return (
    <>
      {splashPhase !== 'hidden' && (
        <div
          className={`fixed inset-0 z-[100] transition-opacity duration-500 ${
            splashPhase === 'fading' ? 'pointer-events-none opacity-0' : 'opacity-100'
          }`}
        >
          <LoadingScreen label="Menyiapkan ClassSphere..." />
        </div>
      )}
      {isNavigating && <LoadingScreen label="Memuat halaman..." />}
    </>
  );
}
