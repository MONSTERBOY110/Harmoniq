import { Skeleton } from "@/components/ui/skeleton";

export default function AppLoading() {
  return (
    <div className="space-y-8" aria-busy="true" aria-label="Loading">
      <div className="space-y-3">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-9 w-72" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-72 rounded-[10px]" />
        <Skeleton className="h-72 rounded-[10px]" />
      </div>
      <Skeleton className="h-16 rounded-[10px]" />
    </div>
  );
}
