// src/app/attendee/speakers/[id]/page.tsx
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, ExternalLink, Mic, Library } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Topbar } from "@/components/layout/topbar";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ATTENDEE_NAV_ITEMS } from "@/lib/nav-items";
import { fetchPublicNames } from "@/lib/profile-lookup";
import { heroImageFor, initialsOf } from "@/lib/utils/placeholder-images";
import { AskQuestionForm } from "@/app/attendee/my-events/ask-question-form";
import { formatEventRange } from "@/lib/utils/dates";

export const metadata: Metadata = { title: "Speaker profile" };

export default async function SpeakerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: speakerId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Gate: only show speakers on events where THIS attendee is activated.
  const { data: myRegs } = await supabase
    .from("event_attendee_registrations")
    .select("event_id")
    .eq("attendee_user_id", user.id)
    .eq("status", "activated");

  const myEventIds = Array.from(new Set((myRegs ?? []).map((r: { event_id: string }) => r.event_id)));
  if (myEventIds.length === 0) notFound();

  const { data: invites } = await supabase
    .from("event_speaker_invites")
    .select("id, session_title, event_id, status, events:event_id (id, title, start_datetime, end_datetime, venue_label)")
    .eq("speaker_user_id", speakerId)
    .in("event_id", myEventIds)
    .in("status", ["accepted", "activated"]);

  if (!invites || invites.length === 0) notFound();

  const names = await fetchPublicNames(supabase, [speakerId]);
  const speaker = names.get(speakerId);
  const displayName = speaker?.full_name ?? "Speaker";

  const { data: content } = await supabase
    .from("content_library_items")
    .select("id, title, url, thumbnail_url, content_types:content_type_id (label), events:event_id (title)")
    .eq("speaker_id", speakerId)
    .in("event_id", myEventIds)
    .order("added_at", { ascending: false })
    .limit(12);

  return (
    <>
      <Topbar title={displayName} portalLabel="Attendee portal" navItems={ATTENDEE_NAV_ITEMS} />
      <main className="mx-auto max-w-4xl space-y-8 px-4 py-8 md:px-8">
        <Link
          href="/attendee/speakers"
          className="inline-flex items-center gap-1 text-sm font-medium text-navy-500 hover:text-navy"
        >
          <ArrowLeft className="size-4" aria-hidden />
          All speakers
        </Link>

        {/* Hero ------------------------------------------------------------ */}
        <section className="relative overflow-hidden rounded-card border border-surface-border">
          <div className="relative h-48 w-full md:h-64">
            <Image
              src={heroImageFor(speakerId)}
              alt=""
              fill
              sizes="100vw"
              priority
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/60 to-transparent" />
          </div>
          <div className="relative -mt-12 flex flex-wrap items-end gap-4 px-6 pb-6">
            {speaker?.avatar_url ? (
              <Image
                src={speaker.avatar_url}
                alt=""
                width={96}
                height={96}
                className="size-24 shrink-0 rounded-full ring-4 ring-white object-cover"
              />
            ) : (
              <div className="flex size-24 shrink-0 items-center justify-center rounded-full bg-white text-2xl font-semibold text-navy ring-4 ring-white">
                {initialsOf(displayName)}
              </div>
            )}
            <div className="min-w-0 flex-1 pb-1">
              <h1 className="text-2xl font-semibold text-white drop-shadow">{displayName}</h1>
              <p className="mt-0.5 text-sm text-white/80">
                Speaking at {invites.length} session{invites.length === 1 ? "" : "s"} you&apos;re attending
              </p>
            </div>
          </div>
        </section>

        {/* Sessions -------------------------------------------------------- */}
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-navy">
            <Mic className="size-4 text-amber" aria-hidden />
            Sessions
          </h2>
          <ul className="space-y-3">
            {invites.map((inv: any) => {
              const ev = Array.isArray(inv.events) ? inv.events[0] : inv.events;
              return (
                <li key={inv.id} className="rounded-card border border-surface-border bg-white p-5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-navy">{inv.session_title || "Session title TBA"}</p>
                      {ev && (
                        <p className="mt-0.5 text-xs text-navy-500">
                          {ev.title} · {formatEventRange(ev.start_datetime, ev.end_datetime)} · {ev.venue_label}
                        </p>
                      )}
                    </div>
                    <StatusBadge status={inv.status} />
                  </div>
                  <div className="mt-4 border-t border-surface-border pt-4">
                    <AskQuestionForm
                      eventId={ev?.id ?? ""}
                      speakerId={speakerId}
                      speakerName={displayName}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Content --------------------------------------------------------- */}
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-navy">
            <Library className="size-4 text-amber" aria-hidden />
            Shared resources
          </h2>
          {!content || content.length === 0 ? (
            <div className="rounded-card border border-dashed border-surface-border bg-white">
              <EmptyState
                icon={Library}
                title="No content shared yet"
                description="This speaker hasn't posted any resources for your events."
              />
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {content.map((item: any) => {
                const type = Array.isArray(item.content_types) ? item.content_types[0] : item.content_types;
                const ev = Array.isArray(item.events) ? item.events[0] : item.events;
                return (
                  <a
                    key={item.id}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex flex-col overflow-hidden rounded-card border border-surface-border bg-white transition-shadow hover:shadow-md"
                  >
                    <div className="relative h-32 w-full overflow-hidden bg-surface-muted">
                      <Image
                        src={item.thumbnail_url || heroImageFor(item.id)}
                        alt=""
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      {type?.label && (
                        <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-semibold text-navy">
                          {type.label}
                        </span>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="line-clamp-2 text-sm font-medium text-navy group-hover:underline">
                        {item.title}
                        <ExternalLink className="ml-1 inline size-3 text-navy-400" aria-hidden />
                      </p>
                      {ev?.title && <p className="mt-0.5 truncate text-xs text-navy-400">{ev.title}</p>}
                    </div>
                  </a>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </>
  );
}