import { Skeleton } from "@/components/ui/skeleton";
import { StatSkeleton, TableSkeleton } from "@/components/shared/loading-skeletons";

export default function Loading() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-40" />
        <Skeleton className="mt-2 h-4 w-64" />
      </div>
      <StatSkeleton />
      <div className="grid gap-4 lg:grid-cols-2">
        <TableSkeleton rows={4} />
        <TableSkeleton rows={4} />
      </div>
    </div>
  );
}
