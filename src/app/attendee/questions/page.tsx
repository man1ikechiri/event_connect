// src/app/attendee/questions/page.tsx
import type { Metadata } from "next";
import { MessageSquare } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Topbar } from "@/components/layout/topbar";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { relativeTime } from "@/lib/utils/dates";
import { ATTENDEE_NAV_ITEMS } from "@/lib/nav-items";

export const metadata: Metadata = { title: "My questions" };

export default async function AttendeeQuestionsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: questions } = await supabase
    .from("questions")
    .select("id, body, asked_at, status, speaker:speaker_id (full_name), answers_attendee_safe (body, answered_at)")
    .eq("attendee_id", user.id)
    .order("asked_at", { ascending: false });

  return (
    <>
      <Topbar title="My questions" portalLabel="Attendee portal" navItems={ATTENDEE_NAV_ITEMS} />
      <main className="mx-auto max-w-3xl px-4 py-8 md:px-8">
        {!questions || questions.length === 0 ? (
          <div className="rounded-card border border-dashed border-surface-border bg-white">
            <EmptyState icon={MessageSquare} title="You haven't asked anything yet" description="Questions you ask speakers stay private between you and them." />
          </div>
        ) : (
          <ul className="divide-y divide-surface-border overflow-hidden rounded-card border border-surface-border bg-white">
            {questions.map((q: any) => {
              const speaker = Array.isArray(q.speaker) ? q.speaker[0] : q.speaker;
              const answer = Array.isArray(q.answers_attendee_safe) ? q.answers_attendee_safe[0] : q.answers_attendee_safe;
              return (
                <li key={q.id} className="px-5 py-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-navy-400">
                      To {speaker?.full_name} · {relativeTime(q.asked_at)}
                    </p>
                    <StatusBadge status={q.status} kind="event" />
                  </div>
                  <p className="mt-1 text-sm text-navy">{q.body}</p>
                  {answer && (
                    <p className="mt-2 rounded-control bg-surface-muted px-3 py-2 text-sm text-navy-500">{answer.body}</p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </>
  );
}