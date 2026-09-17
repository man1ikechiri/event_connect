import type { Metadata } from "next";
import Link from "next/link";
import { MapPin, Video, CalendarX } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Topbar } from "@/components/layout/topbar";
import { EmptyState } from "@/components/ui/empty-state";
import { formatEventRange } from "@/lib/utils/dates";
import { SPEAKER_NAV_ITEMS } from "@/lib/nav-items";
import { ProgressTracker } from "@/components/shared/progress-tracker";
import { RespondButtons } from "@/app/speaker/my-events/respond-buttons";

export const metadata: Metadata = { title: "My events" };

export default async function SpeakerMyEventsPage({ searchParams }: { searchParams: Promise<{ event?: string }> }) {
  const { event: eventParam } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: invites } = await supabase
    .from("event_speaker_invites")
    .select(
      "id, status, session_title, events:event_id (id, title, start_datetime, end_datetime, venue_label, is_virtual)",
    )
    .eq("speaker_user_id", user.id)
    .order("invited_at", { ascending: false });

  const mapped = (invites ?? []).map((i: any) => ({
    ...i,
    event: Array.isArray(i.events) ? i.events[0] : i.events,
  }));

  if (mapped.length === 0) {
    return (
      <>
        <Topbar title="My events" portalLabel="Speaker portal" navItems={SPEAKER_NAV_ITEMS} />
        <main className="mx-auto max-w-3xl px-4 py-8 md:px-8">
          <div className="rounded-card border border-dashed border-surface-border bg-white">
            <EmptyState icon={CalendarX} title="No events yet" description="Invites from organizers will show up here." />
          </div>
        </main>
      </>
    );
  }

  const active = mapped.find((i) => i.event.id === eventParam) ?? mapped[0];

  return (
    <>
      <Topbar title="My events" portalLabel="Speaker portal" navItems={SPEAKER_NAV_ITEMS} />
      <main className="mx-auto max-w-3xl px-4 py-8 md:px-8">
        <p className="mb-2 text-sm font-medium text-navy-500">Choose an event</p>
        <EventPicker invites={mapped} activeEventId={active.event.id} />

        <div className="rounded-card border border-surface-border bg-white p-6">
          <div className="mb-1 flex flex-wrap items-start justify-between gap-2">
            <h2 className="text-lg font-semibold text-navy">{active.event.title}</h2>
          </div>
          <p className="mb-6 flex items-center gap-1.5 text-sm text-navy-500">
            {active.event.is_virtual ? <Video className="size-3.5" aria-hidden /> : <MapPin className="size-3.5" aria-hidden />}
            {formatEventRange(active.event.start_datetime, active.event.end_datetime)} · {active.event.venue_label}
          </p>

          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-navy-400">Progress</p>
          <ProgressTracker status={active.status} />

          <div className="mt-6 border-t border-surface-border pt-6">
            {active.status === "invited" && <RespondButtons inviteId={active.id} />}
            {active.status === "accepted" && (
              <p className="text-sm text-navy-500">
                You're confirmed. Complete your{" "}
                <Link href="/speaker/profile" className="font-medium text-navy underline underline-offset-2">
                  profile
                </Link>{" "}
                and add at least one item to your{" "}
                <Link href="/speaker/content-library" className="font-medium text-navy underline underline-offset-2">
                  content library
                </Link>{" "}
                to activate.
              </p>
            )}
            {active.status === "activated" && (
              <p className="text-sm text-state-success">You're fully activated for this event.</p>
            )}
            {active.status === "suspended" && (
              <p className="text-sm text-state-danger">
                This role has been suspended by the organizer or an admin. Contact them for details.
              </p>
            )}
            {active.status === "declined" && <p className="text-sm text-navy-500">You declined this invite.</p>}
          </div>
        </div>
      </main>
    </>
  );
}

function EventPicker({ invites, activeEventId }: { invites: any[]; activeEventId: string }) {
  // Server-rendered link list beneath the select, so navigation works
  // without client JS while the select above stays visually primary.
  return (
    <div className="mb-6 flex flex-wrap gap-2">
      {invites.map((i) => (
        <Link
          key={i.event.id}
          href={`/speaker/my-events?event=${i.event.id}`}
          className={`rounded-full border px-3 py-1 text-xs font-medium ${
            i.event.id === activeEventId
              ? "border-navy bg-navy text-white"
              : "border-surface-border text-navy-500 hover:border-navy"
          }`}
        >
          {i.event.title}
        </Link>
      ))}
    </div>
  );
}
