// src/app/attendee/dashboard/page.tsx
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { CalendarCheck2, Library, ChevronRight, ExternalLink, MessageSquare, CheckCircle2, Sparkles, Mic, Clock,} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Topbar } from "@/components/layout/topbar";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatEventRange, relativeTime } from "@/lib/utils/dates";
import { ATTENDEE_NAV_ITEMS } from "@/lib/nav-items";
import { fetchPublicNames } from "@/lib/profile-lookup";
import { heroImageFor, initialsOf } from "@/lib/utils/placeholder-images";
import { HeroBanner } from "@/components/layout/hero-banner";

export const metadata: Metadata = { title: "Dashboard" };

export default async function AttendeeDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: me }, { data: registrations }, { count: questionCount }] = await Promise.all([
    supabase.from("users").select("full_name, avatar_url").eq("id", user.id).maybeSingle(),
    supabase
      .from("event_attendee_registrations")
      .select("id, status, events:event_id (id, title, start_datetime, end_datetime, venue_label, is_virtual)")
      .eq("attendee_user_id", user.id)
      .order("registered_at", { ascending: false }),
    supabase
      .from("questions")
      .select("id", { count: "exact", head: true })
      .eq("attendee_id", user.id),
  ]);

  const mapped = (registrations ?? []).map((r: any) => ({
    ...r,
    event: Array.isArray(r.events) ? r.events[0] : r.events,
  }));

  const activatedEventIds = mapped
    .filter((r) => r.status === "activated" && r.event)
    .map((r) => r.event.id);

  const now = Date.now();
  const upcoming = mapped
    .filter((r) => r.event && new Date(r.event.start_datetime).getTime() > now)
    .sort((a, b) => new Date(a.event.start_datetime).getTime() - new Date(b.event.start_datetime).getTime())
    .slice(0, 3);

  // ---- Content feed ----------------------------------------------------
  let feedItems: any[] = [];
  if (activatedEventIds.length) {
    const { data, error } = await supabase
      .from("content_library_items")
      .select(
        "id, title, url, thumbnail_url, preview_status, added_at, event_id, speaker_id, content_types:content_type_id (slug, label), events:event_id (title)",
      )
      .in("event_id", activatedEventIds)
      .order("added_at", { ascending: false })
      .limit(9);

    if (error) console.error("[attendee/dashboard] content feed fetch failed:", error.message);
    feedItems = data ?? [];
  }

  const contentSpeakerNames = await fetchPublicNames(
    supabase,
    feedItems.map((i) => i.speaker_id),
  );

  // ---- Speaker spotlight ----------------------------------------------
  let spotlight: { id: string; name: string; avatar: string | null; session_title: string | null; event_id: string }[] = [];
  if (activatedEventIds.length) {
    const { data: invites } = await supabase
      .from("event_speaker_invites")
      .select("event_id, speaker_user_id, session_title, status")
      .in("event_id", activatedEventIds)
      .in("status", ["accepted", "activated"]);

    const unique = new Map<string, { id: string; session_title: string | null; event_id: string }>();
    for (const inv of (invites ?? []) as { event_id: string; speaker_user_id: string; session_title: string | null }[]) {
      if (!unique.has(inv.speaker_user_id)) {
        unique.set(inv.speaker_user_id, {
          id: inv.speaker_user_id,
          session_title: inv.session_title,
          event_id: inv.event_id,
        });
      }
    }
    const picked = Array.from(unique.values()).slice(0, 3);
    const names = await fetchPublicNames(supabase, picked.map((p) => p.id));
    spotlight = picked.map((p) => ({
      ...p,
      name: names.get(p.id)?.full_name ?? "Speaker",
      avatar: names.get(p.id)?.avatar_url ?? null,
    }));
  }

  const stats = {
    registered: mapped.length,
    activated: mapped.filter((r) => r.status === "activated").length,
    questions: questionCount ?? 0,
    contentItems: feedItems.length,
  };

  const greetingName = (me as { full_name: string | null } | null)?.full_name?.split(" ")[0] ?? "there";

  return (
    <>
      <Topbar title="Dashboard" portalLabel="Attendee portal" navItems={ATTENDEE_NAV_ITEMS} />
      <HeroBanner src="/images/hero-banner.png" />
      <main className="mx-auto max-w-6xl space-y-8 px-4 py-8 md:px-8">
        {/* Welcome header --------------------------------------------------- */}
        <section className="flex flex-wrap items-center gap-4 rounded-card border border-surface-border bg-gradient-to-br from-navy to-navy-500 p-6 text-white">
          {(me as { avatar_url: string | null } | null)?.avatar_url ? (
            <Image
              src={(me as { avatar_url: string | null } | null)?.avatar_url ?? ""}
              alt=""
              width={64}
              height={64}
              className="size-16 shrink-0 rounded-full ring-4 ring-white/20 object-cover"
            />
          ) : (
            <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-white/20 text-xl font-semibold ring-4 ring-white/20">
              {initialsOf((me as { full_name: string | null } | null)?.full_name)}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-wider text-white/70">Welcome back</p>
            <h1 className="text-2xl font-semibold">Hi, {greetingName}</h1>
            <p className="mt-0.5 text-sm text-white/80">
              You&apos;re registered for {stats.registered} event{stats.registered === 1 ? "" : "s"}
              {stats.activated > 0 && ` · ${stats.activated} confirmed`}
            </p>
          </div>
        </section>

        {/* Stats ----------------------------------------------------------- */}
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Registered" value={stats.registered} icon={<CalendarCheck2 className="size-4" aria-hidden />} />
          <StatCard label="Confirmed" value={stats.activated} tone="success" icon={<CheckCircle2 className="size-4" aria-hidden />} />
          <StatCard label="Questions" value={stats.questions} tone="accent" icon={<MessageSquare className="size-4" aria-hidden />} />
          <StatCard label="Resources" value={stats.contentItems} icon={<Library className="size-4" aria-hidden />} />
        </section>

        {/* Upcoming events ------------------------------------------------- */}
        {upcoming.length > 0 && (
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold text-navy">Coming up</h2>
              <Link
                href="/attendee/my-events"
                className="flex items-center text-sm font-medium text-navy-500 hover:text-navy"
              >
                View all
                <ChevronRight className="size-4" aria-hidden />
              </Link>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {upcoming.map((r, i) => {
                const days = Math.ceil((new Date(r.event.start_datetime).getTime() - now) / 86400_000);
                return (
                  <div key={r.id} className="group relative overflow-hidden rounded-card border border-surface-border bg-white">
                    <div className="relative h-28 w-full overflow-hidden">
                      <Image
                        src={heroImageFor(r.event.id)}
                        alt=""
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        priority= {i === 0}
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-navy/80 via-navy/20 to-transparent" />
                      <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-semibold text-navy">
                        <Clock className="size-3" aria-hidden />
                        in {days}d
                      </span>
                    </div>
                    <div className="p-4">
                      <p className="truncate font-medium text-navy">{r.event.title}</p>
                      <p className="mt-0.5 truncate text-xs text-navy-500">
                        {formatEventRange(r.event.start_datetime, r.event.end_datetime)}
                      </p>
                      <div className="mt-2">
                        <StatusBadge status={r.status} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Speaker spotlight ---------------------------------------------- */}
        {spotlight.length > 0 && (
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-base font-semibold text-navy">
                <Sparkles className="size-4 text-amber" aria-hidden />
                Speakers you&apos;ll meet
              </h2>
              <Link
                href="/attendee/speakers"
                className="flex items-center text-sm font-medium text-navy-500 hover:text-navy"
              >
                See all
                <ChevronRight className="size-4" aria-hidden />
              </Link>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {spotlight.map((s, i) => (
                <Link
                  key={s.id}
                  href={`/attendee/speakers/${s.id}`}
                  className="group relative overflow-hidden rounded-card border border-surface-border bg-white"
                >
                  <div className="relative h-32 w-full overflow-hidden">
                    <Image
                      src={heroImageFor(s.id)}
                      alt=""
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      priority= {i === 0}
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-navy/80 to-transparent" />
                    <div className="absolute bottom-3 left-3 flex items-center gap-2">
                      {s.avatar ? (
                        <Image
                          src={s.avatar}
                          alt=""
                          width={40}
                          height={40}
                          className="size-10 rounded-full ring-2 ring-white object-cover"
                        />
                      ) : (
                        <div className="flex size-10 items-center justify-center rounded-full bg-white text-xs font-semibold text-navy ring-2 ring-white">
                          {initialsOf(s.name)}
                        </div>
                      )}
                      <div className="text-white">
                        <p className="text-sm font-semibold leading-tight">{s.name}</p>
                        <p className="text-[11px] text-white/80">View profile</p>
                      </div>
                    </div>
                  </div>
                  {s.session_title && (
                    <p className="truncate px-4 py-3 text-xs text-navy-500">{s.session_title}</p>
                  )}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Content feed ---------------------------------------------------- */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-base font-semibold text-navy">
              <Library className="size-4 text-amber" aria-hidden />
              Content feed
            </h2>
          </div>

          {feedItems.length === 0 ? (
            <div className="rounded-card border border-dashed border-surface-border bg-white">
              <EmptyState
                icon={Library}
                title="Nothing shared yet"
                description="Speaker content for the events you're attending will appear here as soon as it's posted."
              />
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {feedItems.map((item, i) => {
                const type = Array.isArray(item.content_types) ? item.content_types[0] : item.content_types;
                const event = Array.isArray(item.events) ? item.events[0] : item.events;
                const speakerName = contentSpeakerNames.get(item.speaker_id)?.full_name ?? "A speaker";
                return (
                  <a
                    key={item.id}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex flex-col overflow-hidden rounded-card border border-surface-border bg-white transition-shadow hover:shadow-md"
                  >
                    <div className="relative h-36 w-full overflow-hidden bg-surface-muted">
                      {item.thumbnail_url ? (
                        <Image
                          src={item.thumbnail_url}
                          alt=""
                          fill
                          sizes="(max-width: 768px) 100vw, 33vw"
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <Image
                          src={heroImageFor(item.id)}
                          alt=""
                          fill
                          sizes="(max-width: 768px) 100vw, 33vw"
                          priority= {i === 0}
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      )}
                      {type?.label && (
                        <span className="absolute left-3 top-3 inline-flex items-center rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-semibold text-navy">
                          {type.label}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col p-4">
                      <p className="line-clamp-2 font-medium text-navy group-hover:underline">
                        {item.title}
                        <ExternalLink className="ml-1 inline size-3 text-navy-400" aria-hidden />
                      </p>
                      <p className="mt-1 text-xs text-navy-400">
                        {speakerName}
                        {event?.title ? ` · ${event.title}` : ""}
                        {item.added_at ? ` · ${relativeTime(item.added_at)}` : ""}
                      </p>
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

function StatCard({
  label,
  value,
  icon,
  tone = "default",
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  tone?: "default" | "success" | "accent";
}) {
  const toneClasses: Record<string, string> = {
    default: "text-navy bg-surface-muted",
    success: "text-state-success bg-state-successBg",
    accent: "text-amber bg-amber-50",
  };
  return (
    <div className="rounded-card border border-surface-border bg-white p-4">
      <div className="flex items-center gap-2">
        <span className={`flex size-7 items-center justify-center rounded-full ${toneClasses[tone]}`}>
          {icon}
        </span>
        <p className="text-xs font-medium uppercase tracking-wide text-navy-400">{label}</p>
      </div>
      <p className="mt-2 text-2xl font-semibold text-navy">{value}</p>
    </div>
  );
}