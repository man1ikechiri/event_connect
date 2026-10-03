// src/app/attendee/my-events/respond-buttons.tsx
"use client";

import { useState, useTransition } from "react";
import { Check, X } from "lucide-react";
import { respondToAttendeeInvite } from "@/app/attendee/actions";
import { Button } from "@/components/ui/button";

export function AttendeeRespondButtons({ registrationId }: { registrationId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        loading={pending}
        icon={<Check className="size-4" aria-hidden />}
        onClick={() =>
          startTransition(async () => {
            const res = await respondToAttendeeInvite(registrationId, "accepted");
            if (res?.error) setError(res.error);
          })
        }
      >
        Accept
      </Button>
      <Button
        size="sm"
        variant="secondary"
        loading={pending}
        icon={<X className="size-4" aria-hidden />}
        onClick={() =>
          startTransition(async () => {
            const res = await respondToAttendeeInvite(registrationId, "declined");
            if (res?.error) setError(res.error);
          })
        }
      >
        Decline
      </Button>
      {error && <span className="text-xs text-state-danger">{error}</span>}
    </div>
  );
}