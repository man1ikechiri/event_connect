"use client";

import { useEffect, useRef } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { UserPlus } from "lucide-react";
import { invitePartner, type ActionState } from "@/app/organizer/actions";
import { Field, TextInput } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

const initialState: ActionState = {};

export function InvitePartnerForm({
  eventId,
  partnerTypes,
}: {
  eventId: string;
  partnerTypes: { id: string; label: string }[];
}) {
  const [state, formAction] = useActionState(invitePartner, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state.success]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <input type="hidden" name="event_id" value={eventId} />
      <Field label="Partner email" htmlFor="partner-email" required>
        <TextInput id="partner-email" name="email" type="email" placeholder="contact@sponsor.com" required />
      </Field>
      <Field label="Organization name" htmlFor="org-name" hint="Optional — can be added later.">
        <TextInput id="org-name" name="org_name" placeholder="TechCorp" />
      </Field>
      <Field label="Partner type" htmlFor="partner-type" required>
        <select
          id="partner-type"
          name="partner_type_id"
          required
          className="h-10 w-full rounded-control border border-surface-border bg-white px-3 text-sm text-navy focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
        >
          <option value="">Select a type…</option>
          {partnerTypes.map((type) => (
            <option key={type.id} value={type.id}>
              {type.label}
            </option>
          ))}
        </select>
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
