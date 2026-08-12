import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, description, action, className }: PageHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      <div className="relative">
        <h1 className="font-heading text-2xl font-bold tracking-tight">{title}</h1>
        <div className="mt-2 h-1 w-12 rounded-full bg-gradient-to-r from-blue-500 via-sky-500 to-emerald-500" />
        {description && (
          <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
