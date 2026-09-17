import { Skeleton, SkeletonList } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="mx-auto max-w-5xl space-y-8 px-4 py-8 md:px-8">
      <div className="grid gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <div className="rounded-card border border-surface-border bg-white">
        <SkeletonList rows={3} />
      </div>
    </main>
  );
}
