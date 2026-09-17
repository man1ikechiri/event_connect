"use client";

import { useEffect, useRef } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Plus } from "lucide-react";
import { addContentItem } from "@/app/speaker/actions";
import type { ActionState } from "@/app/organizer/actions";
import { Field, TextInput } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

const initialState: ActionState = {};

export function AddContentForm({ contentTypes }: { contentTypes: { id: string; label: string }[] }) {
  const [state, formAction] = useActionState(addContentItem, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state.success]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <Field label="Type" htmlFor="content-type" required>
        <select
          id="content-type"
          name="content_type_id"
          required
          className="h-10 w-full rounded-control border border-surface-border bg-white px-3 text-sm text-navy focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
        >
          <option value="">Select a type…</option>
          {contentTypes.map((type) => (
            <option key={type.id} value={type.id}>
              {type.label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="URL" htmlFor="content-url" required>
        <TextInput id="content-url" name="url" type="url" placeholder="https://…" required />
      </Field>
      <Field label="Title / label" htmlFor="content-title" required>
        <TextInput id="content-title" name="title" placeholder="Keynote reference material" required />
      </Field>

      {state.error && (
        <p className="rounded-control bg-state-dangerBg px-3 py-2 text-sm text-state-danger" role="alert">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="rounded-control bg-state-successBg px-3 py-2 text-sm text-state-success" role="status">
          Added.
        </p>
      )}

      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending} icon={!pending ? <Plus className="size-4" aria-hidden /> : undefined}>
      Add to library
    </Button>
  );
}
