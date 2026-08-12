import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("relative overflow-hidden rounded-md bg-muted", className)}
      {...props}
    >
      {/* Efek shimmer bergerak */}
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-blue-200/40 to-transparent dark:via-white/10" />
    </div>
  )
}

export { Skeleton }
