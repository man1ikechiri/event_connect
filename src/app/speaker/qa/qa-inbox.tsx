//src\app\speaker\qa\qa-inbox.tsx
"use client";

import { useMemo, useState } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Send, X } from "lucide-react";
import { replyToQuestions } from "@/app/speaker/actions";
import type { ActionState } from "@/app/organizer/actions";
import { EmptyState } from "@/components/ui/empty-state";
import { TextArea } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { relativeTime } from "@/lib/utils/dates";
import { MessagesSquare } from "lucide-react";

interface Question {
  id: string;
  body: string;
  asked_at: string;
  status: "pending" | "answered";
  event_id: string;
  event_title: string;
  attendee_name: string;
}

const initialState: ActionState = {};

export function QaInbox({ questions }: { questions: Question[] }) {
  const [eventFilter, setEventFilter] = useState<string>("all");
  const [tab, setTab] = useState<"pending" | "answered">("pending");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const events = useMemo(() => {
    const map = new Map<string, string>();
    questions.forEach((q) => map.set(q.event_id, q.event_title));
    return Array.from(map, ([id, title]) => ({ id, title }));
  }, [questions]);

  const eventCounts = useMemo(() => {
    return events.map((e) => {
      const forEvent = questions.filter((q) => q.event_id === e.id);
      return {
        ...e,
        total: forEvent.length,
        answered: forEvent.filter((q) => q.status === "answered").length,
        remaining: forEvent.filter((q) => q.status === "pending").length,
      };
    });
  }, [events, questions]);

  const filtered = questions.filter((q) => {
    if (eventFilter !== "all" && q.event_id !== eventFilter) return false;
    return q.status === tab;
  });

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const selectedQuestions = questions.filter((q) => selected.has(q.id));

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="rounded-card border border-surface-border bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-surface-border p-4">
          <div className="flex gap-1">
            {(["pending", "answered"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`rounded-control px-3 py-1.5 text-sm font-medium capitalize ${
                  tab === t ? "bg-navy text-white" : "text-navy-500 hover:bg-surface-muted"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <select
            value={eventFilter}
            onChange={(e) => setEventFilter(e.target.value)}
            className="h-9 rounded-control border border-surface-border bg-white px-3 text-sm text-navy focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
          >
            <option value="all">All events</option>
            {eventCounts.map((e) => (
              <option key={e.id} value={e.id}>
                {e.title} — {e.remaining} remaining / {e.total} total
              </option>
            ))}
          </select>
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon={MessagesSquare} title="Nothing here" description="No questions match this filter right now." />
        ) : (
          <ul className="divide-y divide-surface-border">
            {filtered.map((q) => (
              <li key={q.id} className="flex items-start gap-3 px-4 py-3 hover:bg-surface-muted">
                {q.status === "pending" && (
                  <input
                    type="checkbox"
                    checked={selected.has(q.id)}
                    onChange={() => toggle(q.id)}
                    className="mt-1 rounded border-surface-border text-navy focus:ring-navy"
                    aria-label={`Select question from ${q.attendee_name}`}
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-navy">{q.body}</p>
                  <p className="mt-1 text-xs text-navy-400">
                    {q.attendee_name} · {q.event_title} · {relativeTime(q.asked_at)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <ReplyPanel selectedQuestions={selectedQuestions} onClear={() => setSelected(new Set())} />
    </div>
  );
}

function ReplyPanel({
  selectedQuestions,
  onClear,
}: {
  selectedQuestions: Question[];
  onClear: () => void;
}) {
  const [state, formAction] = useActionState(replyToQuestions, initialState);

  if (selectedQuestions.length === 0) {
    return (
      <div className="h-fit rounded-card border border-dashed border-surface-border bg-white p-5 text-center text-sm text-navy-400">
        Select one or more pending questions to reply privately. Selecting several composes one reply that's sent
        as a separate, individual answer to each attendee.
      </div>
    );
  }

  return (
    <form action={formAction} className="h-fit space-y-4 rounded-card border border-surface-border bg-white p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-navy">Reply privately</h2>
        <span className="rounded-full bg-surface-muted px-2 py-1 text-xs font-medium text-navy-500">
          {selectedQuestions.length} selected
        </span>
      </div>

      <ul className="max-h-40 space-y-2 overflow-y-auto rounded-control bg-surface-muted p-3">
        {selectedQuestions.map((q) => (
          <li key={q.id} className="text-xs text-navy-500">
            <input type="hidden" name="question_ids" value={q.id} />
            <span className="font-medium text-navy">{q.attendee_name}:</span> {q.body}
          </li>
        ))}
      </ul>

      <TextArea name="body" rows={5} placeholder="Type your private response here…" required />

      {state.error && (
        <p className="rounded-control bg-state-dangerBg px-3 py-2 text-sm text-state-danger" role="alert">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="rounded-control bg-state-successBg px-3 py-2 text-sm text-state-success" role="status">
          Sent — each attendee received their own individual reply.
        </p>
      )}

      <div className="flex gap-2">
        <SubmitButton />
        <Button type="button" variant="ghost" icon={<X className="size-4" aria-hidden />} onClick={onClear}>
          Clear selection
        </Button>
      </div>
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending} icon={!pending ? <Send className="size-4" aria-hidden /> : undefined}>
      Send reply
    </Button>
  );
}
