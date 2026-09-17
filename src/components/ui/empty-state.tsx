import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <Icon className="size-9 text-navy-300" strokeWidth={1.5} aria-hidden />
      <div className="space-y-1">
        <p className="font-medium text-navy">{title}</p>
        <p className="max-w-sm text-sm text-navy-500">{description}</p>
      </div>
      {action}
    </div>
  );
}
