import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'relative flex flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border border-dashed border-blue-200/70 bg-gradient-to-b from-blue-50/60 to-transparent px-6 py-14 text-center dark:border-blue-500/20 dark:from-blue-500/5',
        className,
      )}
    >
      <div className="bg-dots pointer-events-none absolute inset-0 opacity-60" />
      <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-emerald-500 shadow-lg shadow-blue-500/25 ring-4 ring-blue-500/10">
        <Icon className="h-6 w-6 text-white" />
      </div>
      <p className="relative mt-3 text-sm font-semibold">{title}</p>
      {description && (
        <p className="relative max-w-sm text-sm text-muted-foreground">{description}</p>
      )}
      {action && <div className="relative mt-3">{action}</div>}
    </div>
  );
}
