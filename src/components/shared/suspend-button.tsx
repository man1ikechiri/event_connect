"use client";

import { useState, useTransition } from "react";
import { Ban } from "lucide-react";
import { suspendRole } from "@/app/organizer/actions";
import { Button } from "@/components/ui/button";

export function SuspendButton({
  table,
  rowId,
  revalidatePathSlug,
}: {
  table: "event_speaker_invites" | "event_partner_invites" | "event_attendee_registrations";
  rowId: string;
  revalidatePathSlug: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-navy-500">Suspend this person for this event?</span>
        <Button
          size="sm"
          variant="danger"
          loading={pending}
          onClick={() =>
            startTransition(async () => {
              const res = await suspendRole(table, rowId, revalidatePathSlug);
              if (res?.error) setError(res.error);
              setConfirming(false);
            })
          }
        >
          Confirm
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setConfirming(false)}>
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button size="sm" variant="ghost" icon={<Ban className="size-3.5" aria-hidden />} onClick={() => setConfirming(true)}>
        Suspend
      </Button>
      {error && <span className="text-xs text-state-danger">{error}</span>}
    </div>
  );
}
