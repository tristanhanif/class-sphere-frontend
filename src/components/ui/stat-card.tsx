import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  icon: LucideIcon;
  hint?: string;
  iconClass?: string;
  loading?: boolean;
  delay?: number;
}

const defaultIconClass =
  'bg-gradient-to-br from-blue-500 to-emerald-500 text-white shadow-lg shadow-blue-500/30';

export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  iconClass,
  loading,
  delay = 0,
}: StatCardProps) {
  return (
    <Card
      className="group animate-fade-in-up relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-500/10"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Aksen gradient di pojok kiri atas */}
      <div className="pointer-events-none absolute -top-10 -right-10 h-24 w-24 rounded-full bg-gradient-to-br from-blue-400/10 to-emerald-400/10 blur-2xl transition-opacity duration-300 group-hover:opacity-100" />
      <CardContent className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-muted-foreground">{label}</p>
          {loading ? (
            <div className="mt-1 h-8 w-16 animate-pulse rounded-md bg-muted" />
          ) : (
            <div className="mt-1 text-2xl font-bold tracking-tight">{value}</div>
          )}
          {hint && <p className="mt-1 truncate text-xs text-muted-foreground">{hint}</p>}
        </div>
        <div
          className={cn(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3',
            iconClass || defaultIconClass,
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}
