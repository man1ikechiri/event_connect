// src/app/attendee/my-events/page.tsx
import type { Metadata } from "next";
import { CalendarCheck2, MapPin, Video } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Topbar } from "@/components/layout/topbar";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatEventRange } from "@/lib/utils/dates";
import { ATTENDEE_NAV_ITEMS } from "@/lib/nav-items";

export const metadata: Metadata = { title: "My events" };

export default async function AttendeeMyEventsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: registrations } = await supabase
    .from("event_attendee_registrations")
    .select(
      "id, status, events:event_id (id, title, start_datetime, end_datetime, venue_label, is_virtual)",
    )
    .eq("attendee_user_id", user.id)
    .order("registered_at", { ascending: false });

  return (
    <>
      <Topbar title="My events" portalLabel="Attendee portal" navItems={ATTENDEE_NAV_ITEMS} />
      <main className="mx-auto max-w-4xl px-4 py-8 md:px-8">
        {!registrations || registrations.length === 0 ? (
          <div className="rounded-card border border-dashed border-surface-border bg-white">
            <EmptyState icon={CalendarCheck2} title="No events yet" description="Registrations will appear here." />
          </div>
        ) : (
          <ul className="divide-y divide-surface-border overflow-hidden rounded-card border border-surface-border bg-white">
            {registrations.map((r: any) => (
              <li key={r.id} className="flex items-center justify-between gap-3 px-5 py-4">
                <div>
                  <p className="font-medium text-navy">{r.events.title}</p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-sm text-navy-500">
                    {r.events.is_virtual ? <Video className="size-3.5" aria-hidden /> : <MapPin className="size-3.5" aria-hidden />}
                    {formatEventRange(r.events.start_datetime, r.events.end_datetime)} · {r.events.venue_label}
                  </p>
                </div>
                <StatusBadge status={r.status} />
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}