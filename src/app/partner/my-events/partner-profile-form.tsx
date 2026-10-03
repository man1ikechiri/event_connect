// src/app/partner/my-events/partner-profile-form.tsx
"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { updatePartnerProfile } from "@/app/partner/actions";
import type { ActionState } from "@/app/organizer/actions";
import { Field, TextInput } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

const initialState: ActionState = {};

export function PartnerProfileForm({
  inviteId,
  defaults,
}: {
  inviteId: string;
  defaults: { org_name: string; logo_url: string; contact_email: string };
}) {
  const [state, formAction] = useActionState(updatePartnerProfile, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="invite_id" value={inviteId} />
      <Field label="Organization name" htmlFor={`org-name-${inviteId}`} required>
        <TextInput id={`org-name-${inviteId}`} name="org_name" defaultValue={defaults.org_name} placeholder="TechCorp" required />
      </Field>
      <Field label="Logo URL" htmlFor={`logo-${inviteId}`} required hint="A direct link to your logo image.">
        <TextInput
          id={`logo-${inviteId}`}
          name="logo_url"
          type="url"
          defaultValue={defaults.logo_url}
          placeholder="https://…/logo.png"
          required
        />
      </Field>
      <Field label="Contact email" htmlFor={`contact-${inviteId}`} required>
        <TextInput
          id={`contact-${inviteId}`}
          name="contact_email"
          type="email"
          defaultValue={defaults.contact_email}
          placeholder="contact@yourcompany.com"
          required
        />
      </Field>

      {state.error && (
        <p className="rounded-control bg-state-dangerBg px-3 py-2 text-sm text-state-danger" role="alert">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="rounded-control bg-state-successBg px-3 py-2 text-sm text-state-success" role="status">
          Saved. Once all three fields are complete, this invite activates automatically.
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
      Save partner profile
    </Button>
  );
}