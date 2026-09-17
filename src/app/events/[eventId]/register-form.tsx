"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { registerForEvent } from "@/app/attendee/actions";
import type { ActionState } from "@/app/organizer/actions";
import { Field, TextInput } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

const initialState: ActionState = {};

export function RegisterForm({ eventId }: { eventId: string }) {
  const [state, formAction] = useActionState(registerForEvent, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="event_id" value={eventId} />
      <Field label="Organization" htmlFor="org" hint="Optional — shown if you're attending as part of a team.">
        <TextInput id="org" name="organization_affiliation" placeholder="Acme Inc." />
      </Field>

      {state.error && (
        <p className="rounded-control bg-state-dangerBg px-3 py-2 text-sm text-state-danger" role="alert">
          {state.error}
        </p>
      )}

      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending} className="w-full">
      Register for this event
    </Button>
  );
}
