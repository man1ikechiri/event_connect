//src\app\organizer\events\[eventId]\attendees\invite-attendee-form.tsx
"use client";

import { useEffect, useRef } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { UserPlus } from "lucide-react";
import { inviteAttendee, type ActionState } from "@/app/organizer/actions";
import { Field, TextInput } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

const initialState: ActionState = {};

export function InviteAttendeeForm({ eventId }: { eventId: string }) {
  const [state, formAction] = useActionState(inviteAttendee, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state.success]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <input type="hidden" name="event_id" value={eventId} />
      <Field label="Attendee email" htmlFor="attendee-email" required>
        <TextInput id="attendee-email" name="email" type="email" placeholder="attendee@example.com" required />
      </Field>
      <Field label="Organization" htmlFor="org-affiliation" hint="Optional — shown if they're part of a team.">
        <TextInput id="org-affiliation" name="organization_affiliation" placeholder="Acme Inc." />
      </Field>

      {state.error && (
        <p className="rounded-control bg-state-dangerBg px-3 py-2 text-sm text-state-danger" role="alert">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="rounded-control bg-state-successBg px-3 py-2 text-sm text-state-success" role="status">
          Registered.
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
      Register attendee
    </Button>
  );
}
