"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { createEvent, type ActionState } from "@/app/organizer/actions";
import { Field, TextInput, TextArea } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

const initialState: ActionState = {};

export function CreateEventForm() {
  const [state, formAction] = useActionState(createEvent, initialState);

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <Field label="Event title" htmlFor="title" required>
        <TextInput id="title" name="title" placeholder="Global Investor Summit 2026" required />
      </Field>

      <Field label="Description" htmlFor="description" hint="Shown to speakers, partners, and attendees.">
        <TextArea id="description" name="description" rows={4} placeholder="What is this event about?" />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Starts" htmlFor="start_datetime" required>
          <TextInput id="start_datetime" name="start_datetime" type="datetime-local" required />
        </Field>
        <Field label="Ends" htmlFor="end_datetime" required>
          <TextInput id="end_datetime" name="end_datetime" type="datetime-local" required />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Venue or link label" htmlFor="venue_label" required hint="e.g. 'Moscone Center, SF' or 'Zoom webinar'.">
          <TextInput id="venue_label" name="venue_label" placeholder="Venue name or 'Virtual'" required />
        </Field>
        <Field label="Capacity" htmlFor="capacity" hint="Optional — leave blank for no cap.">
          <TextInput id="capacity" name="capacity" type="number" min={1} placeholder="500" />
        </Field>
      </div>

      <label className="flex items-center gap-2 text-sm text-navy-500">
        <input type="checkbox" name="is_virtual" value="true" className="rounded border-surface-border text-navy" />
        This event is virtual
      </label>

      <Field label="Virtual link" htmlFor="virtual_link" hint="Only needed for virtual or hybrid events.">
        <TextInput id="virtual_link" name="virtual_link" type="url" placeholder="https://zoom.us/..." />
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
    <Button type="submit" loading={pending} className="w-full sm:w-auto">
      Create event
    </Button>
  );
}
