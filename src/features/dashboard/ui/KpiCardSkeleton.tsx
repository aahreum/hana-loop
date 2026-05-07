import { Skeleton } from '@/shared/ui/skeleton';

export function KpiCardSkeleton() {
  return (
    <div className="rounded-xl bg-surface border border-border p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-9 w-9 rounded-lg" />
      </div>
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-4 w-20" />
    </div>
  );
}
