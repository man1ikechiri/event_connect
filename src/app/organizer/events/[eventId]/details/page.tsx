import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Event details" };

export default async function EventDetailsPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const supabase = await createClient();
  const { data: event } = await supabase
    .from("events")
    .select("title, description, venue_label, is_virtual, virtual_link, capacity, status, start_datetime, end_datetime")
    .eq("id", eventId)
    .single();

  if (!event) return null;

  const rows: { label: string; value: string }[] = [
    { label: "Description", value: event.description || "No description added yet." },
    { label: "Venue / location", value: event.is_virtual ? event.virtual_link || "Virtual — link not set" : event.venue_label },
    { label: "Capacity", value: event.capacity ? `${event.capacity} attendees` : "No cap set" },
    { label: "Status", value: event.status },
  ];

  return (
    <div className="rounded-card border border-surface-border bg-white">
      <dl className="divide-y divide-surface-border">
        {rows.map((row) => (
          <div key={row.label} className="grid gap-1 px-5 py-4 sm:grid-cols-[160px_1fr] sm:gap-4">
            <dt className="text-sm font-medium text-navy-400">{row.label}</dt>
            <dd className="text-sm text-navy">{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
