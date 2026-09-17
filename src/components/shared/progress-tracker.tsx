import { Check } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const STAGES = ["invited", "accepted", "activated"] as const;

export function ProgressTracker({ status }: { status: string }) {
  if (status === "declined" || status === "suspended") {
    return (
      <p className="rounded-control bg-state-dangerBg px-3 py-2 text-sm capitalize text-state-danger">
        {status}
      </p>
    );
  }

  const currentIndex = STAGES.indexOf(status as (typeof STAGES)[number]);

  return (
    <ol className="flex items-center gap-2">
      {STAGES.map((stage, i) => {
        const done = i <= currentIndex;
        return (
          <li key={stage} className="flex flex-1 items-center gap-2">
            <div
              className={cn(
                "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                done ? "bg-amber text-white" : "bg-surface-muted text-navy-400",
              )}
            >
              {done ? <Check className="size-3.5" aria-hidden /> : i + 1}
            </div>
            <span className={cn("text-xs font-medium capitalize", done ? "text-navy" : "text-navy-400")}>
              {stage}
            </span>
            {i < STAGES.length - 1 && <span className="h-px flex-1 bg-surface-border" aria-hidden />}
          </li>
        );
      })}
    </ol>
  );
}
