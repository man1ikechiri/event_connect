import Link from "next/link";
import type { Metadata } from "next";
import { CalendarClock, Inbox, MessageSquare, MapPin, Video, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Topbar } from "@/components/layout/topbar";
import { EmptyState } from "@/components/ui/empty-state";
import { formatEventRange, relativeTime } from "@/lib/utils/dates";
import { SPEAKER_NAV_ITEMS } from "@/lib/nav-items";

export const metadata: Metadata = { title: "Dashboard" };

export default async function SpeakerDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const nowIso = new Date().toISOString();

  const [{ count: upcomingCount }, { count: pendingCount }, { count: newQuestionsCount }, { data: upcoming }, { data: recentQuestions }] =
    await Promise.all([
      supabase
        .from("event_speaker_invites")
        .select("id, events!inner(start_datetime)", { count: "exact", head: true })
        .eq("speaker_user_id", user.id)
        .in("status", ["accepted", "activated"])
        .gte("events.start_datetime", nowIso),
      supabase
        .from("event_speaker_invites")
        .select("id", { count: "exact", head: true })
        .eq("speaker_user_id", user.id)
        .eq("status", "invited"),
      supabase
        .from("questions")
        .select("id", { count: "exact", head: true })
        .eq("speaker_id", user.id)
        .eq("status", "pending"),
      supabase
        .from("event_speaker_invites")
        .select("id, status, session_title, events!inner(id, title, start_datetime, end_datetime, venue_label, is_virtual)")
        .eq("speaker_user_id", user.id)
        .in("status", ["accepted", "activated"])
        .gte("events.start_datetime", nowIso)
        .order("events(start_datetime)", { ascending: true })
        .limit(3),
      supabase
        .from("questions")
        .select("id, body, asked_at, status, attendee:attendee_id (full_name)")
        .eq("speaker_id", user.id)
        .order("asked_at", { ascending: false })
        .limit(4),
    ]);

  const stats = [
    { label: "Upcoming events", value: upcomingCount ?? 0, icon: CalendarClock },
    { label: "Pending invites", value: pendingCount ?? 0, icon: Inbox },
    { label: "Open questions", value: newQuestionsCount ?? 0, icon: MessageSquare },
  ];

  return (
    <>
      <Topbar title="Dashboard" portalLabel="Speaker portal" navItems={SPEAKER_NAV_ITEMS} />
      <main className="mx-auto max-w-5xl space-y-8 px-4 py-8 md:px-8">
        <section className="grid gap-3 sm:grid-cols-3">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-card border border-surface-border bg-white p-4">
              <stat.icon className="size-5 text-amber-500" aria-hidden />
              <p className="mt-3 text-2xl font-semibold text-navy">{stat.value}</p>
              <p className="text-xs font-medium uppercase tracking-wide text-navy-400">{stat.label}</p>
            </div>
          ))}
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold text-navy">Upcoming schedule</h2>
            <Link href="/speaker/my-events" className="flex items-center text-sm font-medium text-navy-500 hover:text-navy">
              My events
              <ChevronRight className="size-4" aria-hidden />
            </Link>
          </div>
          {!upcoming || upcoming.length === 0 ? (
            <div className="rounded-card border border-dashed border-surface-border bg-white">
              <EmptyState icon={CalendarClock} title="No upcoming events" description="Accepted invites with a future date will show up here." />
            </div>
          ) : (
            <ul className="divide-y divide-surface-border overflow-hidden rounded-card border border-surface-border bg-white">
              {upcoming.map((invite: any) => (
                <li key={invite.id} className="flex items-center justify-between gap-3 px-5 py-4">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-navy">{invite.events.title}</p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-sm text-navy-500">
                      {invite.events.is_virtual ? <Video className="size-3.5" aria-hidden /> : <MapPin className="size-3.5" aria-hidden />}
                      {formatEventRange(invite.events.start_datetime, invite.events.end_datetime)}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm text-navy-400">{invite.session_title || "Untitled session"}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold text-navy">Recent questions</h2>
            <Link href="/speaker/qa" className="flex items-center text-sm font-medium text-navy-500 hover:text-navy">
              Q&amp;A inbox
              <ChevronRight className="size-4" aria-hidden />
            </Link>
          </div>
          {!recentQuestions || recentQuestions.length === 0 ? (
            <div className="rounded-card border border-dashed border-surface-border bg-white">
              <EmptyState icon={MessageSquare} title="No questions yet" description="Attendee questions will appear here privately." />
            </div>
          ) : (
            <ul className="divide-y divide-surface-border overflow-hidden rounded-card border border-surface-border bg-white">
              {recentQuestions.map((q: any) => (
                <li key={q.id} className="px-5 py-4">
                  <p className="text-xs text-navy-400">
                    {q.attendee?.full_name || "Attendee"} · {relativeTime(q.asked_at)}
                  </p>
                  <p className="mt-1 truncate text-sm text-navy">{q.body}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </>
  );
}
