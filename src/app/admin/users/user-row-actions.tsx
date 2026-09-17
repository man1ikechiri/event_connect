"use client";

import { useTransition } from "react";
import { Check, Ban } from "lucide-react";
import { approveOrganizer, suspendAccount } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";

export function UserRowActions({ userId, organizerStatus }: { userId: string; organizerStatus: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex justify-end gap-2">
      {organizerStatus === "pending" && (
        <Button
          size="sm"
          loading={pending}
          icon={<Check className="size-3.5" aria-hidden />}
          onClick={() => startTransition(() => approveOrganizer(userId))}
        >
          Approve
        </Button>
      )}
      {organizerStatus !== "suspended" && (
        <Button
          size="sm"
          variant="ghost"
          loading={pending}
          icon={<Ban className="size-3.5" aria-hidden />}
          onClick={() => startTransition(() => suspendAccount(userId))}
        >
          Suspend
        </Button>
      )}
    </div>
  );
}
