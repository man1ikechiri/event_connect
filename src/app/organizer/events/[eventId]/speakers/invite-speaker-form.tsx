//src\app\organizer\events\[eventId]\speakers\invite-speaker-form.tsx
"use client";

import { useEffect, useRef } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { UserPlus } from "lucide-react";
import { inviteSpeaker, type ActionState } from "@/app/organizer/actions";
import { Field, TextInput } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

const initialState: ActionState = {};

export function InviteSpeakerForm({ eventId }: { eventId: string }) {
  const [state, formAction] = useActionState(inviteSpeaker, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state.success]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <input type="hidden" name="event_id" value={eventId} />
      <Field label="Speaker email" htmlFor="speaker-email" required>
        <TextInput id="speaker-email" name="email" type="email" placeholder="speaker@example.com" required />
      </Field>
      <Field label="Session / topic title" htmlFor="session-title" hint="Optional — can be added later.">
        <TextInput id="session-title" name="session_title" placeholder="The Future of Global Markets" />
      </Field>

      {state.error && (
        <p className="rounded-control bg-state-dangerBg px-3 py-2 text-sm text-state-danger" role="alert">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="rounded-control bg-state-successBg px-3 py-2 text-sm text-state-success" role="status">
          Invite sent.
        </p>
      )}

      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending} icon={!pending ? <UserPlus className="size-4" aria-hidden /> : undefined}>
      Send invite
    </Button>
  );
}
