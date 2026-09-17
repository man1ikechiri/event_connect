"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { updateSpeakerProfile } from "@/app/speaker/actions";
import type { ActionState } from "@/app/organizer/actions";
import { Field, TextInput } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

const initialState: ActionState = {};

export function SpeakerProfileForm({
  defaults,
}: {
  defaults: {
    full_name: string;
    email: string;
    phone: string;
    professional_title: string;
    company: string;
    linkedin_url: string;
    personal_website_url: string;
  };
}) {
  const [state, formAction] = useActionState(updateSpeakerProfile, initialState);

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" htmlFor="full_name" required>
          <TextInput id="full_name" name="full_name" defaultValue={defaults.full_name} required />
        </Field>
        <Field label="Email" htmlFor="email" hint="Managed via sign-in — contact support to change.">
          <TextInput id="email" name="email" defaultValue={defaults.email} disabled />
        </Field>
      </div>

      <Field label="Phone" htmlFor="phone">
        <TextInput id="phone" name="phone" type="tel" defaultValue={defaults.phone} placeholder="+254 7xx xxx xxx" />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Professional title" htmlFor="professional_title" required>
          <TextInput
            id="professional_title"
            name="professional_title"
            defaultValue={defaults.professional_title}
            placeholder="Chief Data Scientist"
            required
          />
        </Field>
        <Field label="Company" htmlFor="company" required>
          <TextInput id="company" name="company" defaultValue={defaults.company} placeholder="TechNova Dynamics" required />
        </Field>
      </div>

      <Field label="LinkedIn URL" htmlFor="linkedin_url">
        <TextInput
          id="linkedin_url"
          name="linkedin_url"
          type="url"
          defaultValue={defaults.linkedin_url}
          placeholder="https://linkedin.com/in/…"
        />
      </Field>

      <Field label="Personal website" htmlFor="personal_website_url" hint="Optional.">
        <TextInput
          id="personal_website_url"
          name="personal_website_url"
          type="url"
          defaultValue={defaults.personal_website_url}
          placeholder="https://…"
        />
      </Field>

      {state.error && (
        <p className="rounded-control bg-state-dangerBg px-3 py-2 text-sm text-state-danger" role="alert">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="rounded-control bg-state-successBg px-3 py-2 text-sm text-state-success" role="status">
          Profile saved. Invites you've accepted will activate automatically once your content library has at
          least one item.
        </p>
      )}

      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending}>
      Save changes
    </Button>
  );
}
