//src\app\organizer\events\[eventId]\layout.tsx
import { notFound, redirect } from "next/navigation";
import { MapPin, Video } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Topbar } from "@/components/layout/topbar";
import { TabMenu } from "@/components/ui/tab-menu";
import { StatusBadge } from "@/components/ui/status-badge";
import { ORGANIZER_NAV_ITEMS } from "@/lib/nav-items";
import { formatEventRange } from "@/lib/utils/dates";

export default async function EventLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: event } = await supabase
    .from("events")
    .select("id, title, organizer_id, start_datetime, end_datetime, venue_label, is_virtual, status")
    .eq("id", eventId)
    .single();

  if (!event || event.organizer_id !== user.id) notFound();

  const base = `/organizer/events/${event.id}`;

  return (
    <>
      <Topbar title={event.title} portalLabel="Organizer portal" navItems={ORGANIZER_NAV_ITEMS} />
      <main className="mx-auto max-w-5xl px-4 py-6 md:px-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="flex items-center gap-1.5 text-sm text-navy-500">
            {event.is_virtual ? <Video className="size-3.5" aria-hidden /> : <MapPin className="size-3.5" aria-hidden />}
            {formatEventRange(event.start_datetime, event.end_datetime)} · {event.venue_label}
          </p>
          <StatusBadge status={event.status} kind="event" />
        </div>

        <TabMenu
          className="mb-6"
          items={[
            { label: "Details", href: `${base}/details` },
            { label: "Speakers", href: `${base}/speakers` },
            { label: "Partners", href: `${base}/partners` },
            { label: "Attendees", href: `${base}/attendees` },
          ]}
        />

        {children}
      </main>
    </>
  );
}
