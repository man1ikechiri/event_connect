// src/app/attendee/my-events/ask-question-form.tsx
"use client";

import { useState } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { MessageSquarePlus, Send } from "lucide-react";
import { askQuestion } from "@/app/attendee/actions";
import type { ActionState } from "@/app/organizer/actions";
import { TextArea } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

const initialState: ActionState = {};

export function AskQuestionForm({
  eventId,
  speakerId,
  speakerName,
}: {
  eventId: string;
  speakerId: string;
  speakerName: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(askQuestion, initialState);

  if (!open) {
    return (
      <Button
        size="sm"
        variant="ghost"
        icon={<MessageSquarePlus className="size-3.5" aria-hidden />}
        onClick={() => setOpen(true)}
      >
        Ask a question
      </Button>
    );
  }

  return (
    <form action={formAction} className="mt-2 space-y-2 rounded-control bg-surface-muted p-3">
      <input type="hidden" name="event_id" value={eventId} />
      <input type="hidden" name="speaker_id" value={speakerId} />
      <TextArea name="body" rows={3} placeholder={`Ask ${speakerName} a question…`} required />
      {state.error && <p className="text-xs text-state-danger">{state.error}</p>}
      {state.success && <p className="text-xs text-state-success">Sent privately.</p>}
      <div className="flex gap-2">
        <SubmitButton />
        <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" loading={pending} icon={!pending ? <Send className="size-3.5" aria-hidden /> : undefined}>
      Send
    </Button>
  );
}