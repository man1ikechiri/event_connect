// src/app/attendee/speakers/page.tsx
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { Mic } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Topbar } from "@/components/layout/topbar";
import { EmptyState } from "@/components/ui/empty-state";
import { ATTENDEE_NAV_ITEMS } from "@/lib/nav-items";
import { fetchPublicNames } from "@/lib/profile-lookup";
import { heroImageFor, initialsOf } from "@/lib/utils/placeholder-images";

export const metadata: Metadata = { title: "Speakers" };

export default async function AttendeeSpeakersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: regs } = await supabase
    .from("event_attendee_registrations")
    .select("event_id")
    .eq("attendee_user_id", user.id)
    .eq("status", "activated");

  const eventIds = Array.from(
    new Set(((regs ?? []) as { event_id: string }[]).map((r) => r.event_id)),
  );

  let speakers: {
    id: string;
    name: string;
    avatar: string | null;
    sessions: { title: string; eventTitle: string }[];
  }[] = [];

  if (eventIds.length) {
    const { data: invites } = await supabase
      .from("event_speaker_invites")
      .select("speaker_user_id, session_title, event_id, events:event_id (title)")
      .in("event_id", eventIds)
      .in("status", ["accepted", "activated"]);

    const bySpeaker = new Map<string, { title: string; eventTitle: string }[]>();
    for (const inv of (invites ?? []) as {
      speaker_user_id: string;
      session_title: string | null;
      events: { title: string } | { title: string }[] | null;
    }[]) {
      const ev = Array.isArray(inv.events) ? inv.events[0] : inv.events;
      const list = bySpeaker.get(inv.speaker_user_id) ?? [];
      list.push({ title: inv.session_title || "Session title TBA", eventTitle: ev?.title ?? "" });
      bySpeaker.set(inv.speaker_user_id, list);
    }

    const names = await fetchPublicNames(supabase, Array.from(bySpeaker.keys()));
    speakers = Array.from(bySpeaker.entries()).map(([id, sessions]) => ({
      id,
      name: names.get(id)?.full_name ?? "Speaker",
      avatar: names.get(id)?.avatar_url ?? null,
      sessions,
    }));
  }

  return (
    <>
      <Topbar title="Speakers" portalLabel="Attendee portal" navItems={ATTENDEE_NAV_ITEMS} />
      <main className="mx-auto max-w-6xl px-4 py-8 md:px-8">
        <h1 className="mb-6 text-2xl font-semibold tracking-tight text-navy">
          Speakers
        </h1>
        {speakers.length === 0 ? (
          <div className="rounded-card border border-dashed border-surface-border bg-white">
            <EmptyState
              icon={Mic}
              title="No speakers to show yet"
              description="Once you're confirmed for an event, its speaker lineup will appear here."
            />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {speakers.map((s) => (
              <Link
                key={s.id}
                href={`/attendee/speakers/${s.id}`}
                className="group relative overflow-hidden rounded-card border border-surface-border bg-white transition-shadow hover:shadow-lg"
              >
                <div className="relative h-40 w-full overflow-hidden">
                  <Image
                    src={heroImageFor(s.id)}
                    alt=""
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-navy/90 via-navy/40 to-transparent" />
                  <div className="absolute bottom-3 left-3 flex items-center gap-3">
                    {s.avatar ? (
                      <Image
                        src={s.avatar}
                        alt=""
                        width={48}
                        height={48}
                        className="size-12 rounded-full ring-2 ring-white object-cover"
                      />
                    ) : (
                      <div className="flex size-12 items-center justify-center rounded-full bg-white text-sm font-semibold text-navy ring-2 ring-white">
                        {initialsOf(s.name)}
                      </div>
                    )}
                    <div className="text-white">
                      <p className="font-semibold leading-tight">{s.name}</p>
                      <p className="text-[11px] text-white/80">
                        {s.sessions.length} session{s.sessions.length === 1 ? "" : "s"}
                      </p>
                    </div>
                  </div>
                </div>
                <ul className="space-y-1 p-4">
                  {s.sessions.slice(0, 2).map((sess, i) => (
                    <li key={i} className="truncate text-xs text-navy-500">
                      <span className="font-medium text-navy">{sess.eventTitle}</span> — {sess.title}
                    </li>
                  ))}
                  {s.sessions.length > 2 && (
                    <li className="text-xs italic text-navy-400">+{s.sessions.length - 2} more</li>
                  )}
                </ul>
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  );
}