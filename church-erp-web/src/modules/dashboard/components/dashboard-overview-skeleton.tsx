export function DashboardOverviewSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="h-6 w-24 animate-pulse rounded-full bg-secondary" />
        <div className="h-10 w-72 animate-pulse rounded-2xl bg-secondary" />
        <div className="h-5 w-full max-w-2xl animate-pulse rounded-full bg-secondary/80" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="h-40 animate-pulse rounded-3xl border bg-white/70"
          />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="h-[380px] animate-pulse rounded-3xl border bg-white/70" />
        <div className="h-[380px] animate-pulse rounded-3xl border bg-white/70" />
      </div>
    </div>
  );
}
