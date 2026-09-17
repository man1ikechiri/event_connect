import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { MapPin, Video } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatEventRange } from "@/lib/utils/dates";
import { StickyMobileCta } from "@/components/layout/sticky-mobile-cta";
import { RegisterForm } from "@/app/events/[eventId]/register-form";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ eventId: string }>;
}): Promise<Metadata> {
  const { eventId } = await params;
  const supabase = await createClient();
  const { data: event } = await supabase.from("events").select("title, description").eq("id", eventId).single();
  if (!event) return { title: "Event not found" };

  return {
    title: event.title,
    description: event.description || `Register for ${event.title} on EventConnect.`,
    alternates: { canonical: `/events/${eventId}` },
  };
}

export default async function EventDetailPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const supabase = await createClient();
  const { data: event } = await supabase
    .from("events")
    .select("id, title, description, start_datetime, end_datetime, venue_label, is_virtual, capacity")
    .eq("id", eventId)
    .single();

  if (!event) notFound();

  return (
    <div className="min-h-screen bg-white pb-20 md:pb-0">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-6 py-5">
        <Link href="/events" className="text-sm text-navy-500 hover:text-navy">
          ← All events
        </Link>
      </header>

      <main className="mx-auto max-w-3xl px-6 pb-16">
        <h1 className="text-3xl font-semibold text-navy">{event.title}</h1>
        <p className="mt-2 flex items-center gap-1.5 text-navy-500">
          {event.is_virtual ? <Video className="size-4" aria-hidden /> : <MapPin className="size-4" aria-hidden />}
          {formatEventRange(event.start_datetime, event.end_datetime)} · {event.venue_label}
        </p>

        <p className="mt-6 max-w-prose text-navy-500">{event.description || "No description added yet."}</p>

        <div id="register" className="mt-8 max-w-sm rounded-card border border-surface-border bg-surface-muted p-5">
          <p className="mb-4 text-sm font-semibold text-navy">Register</p>
          <RegisterForm eventId={event.id} />
        </div>
      </main>

      <StickyMobileCta href="#register" label="Register for this event" />
    </div>
  );
}
