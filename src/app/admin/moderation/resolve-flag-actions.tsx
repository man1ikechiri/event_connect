"use client";

import { useTransition } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { resolveFlag } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";

export function ResolveFlagActions({ flagId }: { flagId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        loading={pending}
        icon={<CheckCircle2 className="size-3.5" aria-hidden />}
        onClick={() => startTransition(() => resolveFlag(flagId, "reviewed"))}
      >
        Mark reviewed
      </Button>
      <Button
        size="sm"
        variant="ghost"
        loading={pending}
        icon={<XCircle className="size-3.5" aria-hidden />}
        onClick={() => startTransition(() => resolveFlag(flagId, "dismissed"))}
      >
        Dismiss
      </Button>
    </div>
  );
}
