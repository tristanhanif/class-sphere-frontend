'use client';

export function LoadingScreen({ label = 'Memuat...' }: { label?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6 overflow-hidden bg-background/95 backdrop-blur-sm"
    >
      {/* Blob dekoratif ala tema biru-hijau */}
      <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 animate-float rounded-full bg-blue-500/20 blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 -right-20 h-80 w-80 animate-float-slow rounded-full bg-sky-500/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 left-1/4 h-72 w-72 animate-float rounded-full bg-emerald-500/20 blur-3xl" />

      {/* Logo dengan glow berdenyut */}
      <div className="relative">
        <div className="absolute inset-0 animate-pulse-glow rounded-2xl bg-gradient-to-br from-blue-500 to-emerald-500 opacity-40 blur-xl" />
        <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 via-sky-500 to-emerald-500 shadow-lg shadow-blue-500/30 ring-1 ring-white/20">
          <img
            src="/class-sphere.png"
            alt="ClassSphere Logo"
            className="h-10 w-10 object-contain"
          />
        </div>
        {/* Cincin spinner di sekeliling logo */}
        <div className="absolute -inset-3 animate-spin rounded-[1.6rem] border-2 border-transparent border-t-blue-500 border-r-emerald-500" style={{ animationDuration: '1.2s' }} />
      </div>

      <div className="flex flex-col items-center gap-3">
        <p className="text-xl font-bold tracking-tight">
          Class<span className="text-gradient">Sphere</span>
        </p>
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </span>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </div>
    </div>
  );
}
