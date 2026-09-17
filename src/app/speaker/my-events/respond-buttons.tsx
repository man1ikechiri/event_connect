"use client";

import { useState, useTransition } from "react";
import { Check, X } from "lucide-react";
import { respondToSpeakerInvite } from "@/app/speaker/actions";
import { Button } from "@/components/ui/button";

export function RespondButtons({ inviteId }: { inviteId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        loading={pending}
        icon={<Check className="size-4" aria-hidden />}
        onClick={() => startTransition(async () => {
          const res = await respondToSpeakerInvite(inviteId, "accepted");
          if (res?.error) setError(res.error);
        })}
      >
        Accept
      </Button>
      <Button
        size="sm"
        variant="secondary"
        loading={pending}
        icon={<X className="size-4" aria-hidden />}
        onClick={() => startTransition(async () => {
          const res = await respondToSpeakerInvite(inviteId, "declined");
          if (res?.error) setError(res.error);
        })}
      >
        Decline
      </Button>
      {error && <span className="text-xs text-state-danger">{error}</span>}
    </div>
  );
}
