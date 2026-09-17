import { cn } from "@/lib/utils/cn";

type Tone = "success" | "warning" | "danger" | "info" | "neutral";

const TONE_CLASSES: Record<Tone, string> = {
  success: "bg-state-successBg text-state-success",
  warning: "bg-state-warningBg text-state-warning",
  danger: "bg-state-dangerBg text-state-danger",
  info: "bg-state-infoBg text-state-info",
  neutral: "bg-surface-muted text-navy-500 border border-surface-border",
};

const ROLE_STATUS_TONE: Record<string, Tone> = {
  invited: "warning",
  accepted: "info",
  declined: "danger",
  activated: "success",
  suspended: "danger",
};

const EVENT_STATUS_TONE: Record<string, Tone> = {
  planned: "info",
  live: "success",
  completed: "neutral",
  cancelled: "danger",
};

export function StatusBadge({
  status,
  kind = "role",
  className,
}: {
  status: string;
  kind?: "role" | "event";
  className?: string;
}) {
  const tone = (kind === "role" ? ROLE_STATUS_TONE : EVENT_STATUS_TONE)[status] ?? "neutral";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold capitalize",
        TONE_CLASSES[tone],
        className,
      )}
    >
      {status}
    </span>
  );
}
