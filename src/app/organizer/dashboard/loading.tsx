import { Skeleton, SkeletonList } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="mx-auto max-w-6xl space-y-8 px-4 py-8 md:px-8">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
      <div className="rounded-card border border-surface-border bg-white">
        <SkeletonList rows={3} />
      </div>
      <div className="rounded-card border border-surface-border bg-white">
        <SkeletonList rows={3} />
      </div>
    </main>
  );
}
