import type { LucideIcon } from "lucide-react";

export function ComingSoon({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="flex min-h-[60vh] flex-col items-center justify-center rounded-lg border border-slate-200 bg-white p-12 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#03A9F4]/10 text-[#03A9F4]">
          <Icon className="h-8 w-8" />
        </div>
        <h1 className="text-xl font-bold text-slate-900">{title}</h1>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          {description}
        </p>
        <span className="mt-5 inline-flex items-center rounded-full bg-[#F3F4F6] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Em breve
        </span>
      </div>
    </div>
  );
}
