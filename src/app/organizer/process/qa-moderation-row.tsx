"use client";

import { useState, useTransition } from "react";
import { Flag, CheckCircle2 } from "lucide-react";
import { flagContent } from "@/app/organizer/actions";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { TextInput } from "@/components/ui/field";
import { relativeTime } from "@/lib/utils/dates";

interface Question {
  id: string;
  body: string;
  asked_at: string;
  status: "pending" | "answered";
  flagged: boolean;
  review_status: "open" | "reviewed" | "dismissed";
  attendee: { full_name: string; email: string } | { full_name: string; email: string }[] | null;
  speaker: { full_name: string; email: string } | { full_name: string; email: string }[] | null;
  answers: { body: string; answered_at: string }[] | null;
}

export function QaModerationRow({ question }: { question: Question }) {
  const [pending, startTransition] = useTransition();
  const [flagging, setFlagging] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string>();

  const attendee = Array.isArray(question.attendee) ? question.attendee[0] : question.attendee;
  const speaker = Array.isArray(question.speaker) ? question.speaker[0] : question.speaker;
  const answer = question.answers?.[0];

  return (
    <li className="px-5 py-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs text-navy-400">
            {attendee?.full_name || attendee?.email} → {speaker?.full_name || speaker?.email} ·{" "}
            {relativeTime(question.asked_at)}
          </p>
          <p className="mt-1 text-sm text-navy">{question.body}</p>
          {answer && <p className="mt-2 rounded-control bg-surface-muted px-3 py-2 text-sm text-navy-500">{answer.body}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <StatusBadge status={question.status} kind="event" />
          {question.flagged && <StatusBadge status="flagged" />}
        </div>
      </div>

      {flagging ? (
        <div className="mt-3 flex flex-col gap-2 rounded-control bg-surface-muted p-3 sm:flex-row sm:items-center">
          <TextInput
            placeholder="Reason for flagging…"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="flex-1"
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="danger"
              loading={pending}
              disabled={!reason.trim()}
              onClick={() =>
                startTransition(async () => {
                  const res = await flagContent("question", question.id, reason);
                  if (res?.error) setError(res.error);
                  setFlagging(false);
                  setReason("");
                })
              }
            >
              Confirm flag
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setFlagging(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-3 flex items-center gap-3">
          <Button size="sm" variant="ghost" icon={<Flag className="size-3.5" aria-hidden />} onClick={() => setFlagging(true)}>
            Flag content
          </Button>
          {question.flagged && (
            <span className="flex items-center gap-1 text-xs text-navy-400">
              <CheckCircle2 className="size-3.5" aria-hidden />
              Flagged for review
            </span>
          )}
          {error && <span className="text-xs text-state-danger">{error}</span>}
        </div>
      )}
    </li>
  );
}
