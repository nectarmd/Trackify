export default function Loading() {
  return (
    <div className="mx-auto max-w-5xl space-y-4 p-6">
      <div className="h-16 animate-pulse rounded-lg border border-slate-200 bg-white" />
      <div className="h-10 w-1/3 animate-pulse rounded-lg bg-slate-200" />
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-14 animate-pulse rounded-lg border border-slate-200 bg-white"
          />
        ))}
      </div>
    </div>
  );
}
