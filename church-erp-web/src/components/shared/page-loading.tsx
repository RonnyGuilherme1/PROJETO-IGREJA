interface PageLoadingProps {
  variant?: "dashboard" | "form";
  fields?: number;
}

export function PageLoading({
  variant = "dashboard",
  fields = 6,
}: PageLoadingProps = {}) {
  if (variant === "form") {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: fields }).map((_, index) => (
            <div
              key={index}
              className="h-16 animate-pulse rounded-2xl bg-secondary/60"
            />
          ))}
        </div>

        <div className="h-28 animate-pulse rounded-2xl bg-secondary/50" />
        <div className="h-28 animate-pulse rounded-2xl bg-secondary/50" />

        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="h-10 w-full animate-pulse rounded-xl bg-secondary/60 sm:w-40" />
          <div className="h-10 w-full animate-pulse rounded-xl bg-secondary/40 sm:w-28" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="h-6 w-24 animate-pulse rounded-full bg-secondary" />
        <div className="h-10 w-64 animate-pulse rounded-2xl bg-secondary" />
        <div className="h-5 w-full max-w-2xl animate-pulse rounded-full bg-secondary/80" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_360px]">
        <div className="h-80 animate-pulse rounded-3xl border bg-white/70" />
        <div className="h-80 animate-pulse rounded-3xl border bg-white/70" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-56 animate-pulse rounded-3xl border bg-white/70"
          />
        ))}
      </div>
    </div>
  );
}
