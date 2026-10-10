// src/app/organizer/invites/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils/cn";
import { fetchOrganizerContacts } from "@/lib/profile-lookup";

export const metadata: Metadata = { title: "Invites" };

const STAGES = ["invited", "accepted", "activated", "declined", "suspended"] as const;

const ROLE_TABS = [
  {
    key: "speakers",
    label: "Speakers",
    table: "event_speaker_invites",
    userCol: "speaker_user_id",
    extraCols: "session_title",
  },
  {
    key: "partners",
    label: "Partners",
    table: "event_partner_invites",
    userCol: "partner_user_id",
    extraCols: null,
  },
  {
    key: "attendees",
    label: "Attendees",
    table: "event_attendee_registrations",
    userCol: "attendee_user_id",
    extraCols: "organization_affiliation",
  },
] as const;

export default async function OrganizerInvitesPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const { role } = await searchParams;
  const activeKey = ROLE_TABS.find((r) => r.key === role)?.key ?? "speakers";
  const activeRole = ROLE_TABS.find((r) => r.key === activeKey)!;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: myEvents } = await supabase
    .from("events")
    .select("id, title")
    .eq("organizer_id", user.id);

  const eventIds = ((myEvents ?? []) as Array<{ id: string }>).map((e) => e.id);
  const eventTitleById = new Map<string, string>(
    ((myEvents ?? []) as Array<{ id: string; title: string }>).map((e) => [e.id, e.title]),
  );

  const selectCols = activeRole.extraCols
    ? `id, status, event_id, ${activeRole.userCol}, ${activeRole.extraCols}`
    : `id, status, event_id, ${activeRole.userCol}`;

  const { data: rows, error } =
    eventIds.length > 0
      ? await supabase.from(activeRole.table).select(selectCols).in("event_id", eventIds)
      : { data: [], error: null };

  if (error) console.error(`[invites/${activeKey}] fetch failed:`, error.message);

  const contacts = await fetchOrganizerContacts(supabase);

  const byStage: Record<(typeof STAGES)[number], any[]> = {
    invited: [],
    accepted: [],
    activated: [],
    declined: [],
    suspended: [],
  };

  for (const row of (rows ?? []) as Array<{ status: string }>) {
    const stage = row.status as (typeof STAGES)[number];
    if (stage in byStage) {
      byStage[stage].push(row);
    }
  }

  return (
    <>
      <main className="mx-auto max-w-6xl px-4 py-8 md:px-8">
        <h1 className="mb-6 text-2xl font-semibold tracking-tight text-navy">
          Invites
        </h1>
        <nav aria-label="Role" className="mb-6 flex gap-1 border-b border-surface-border">
          {ROLE_TABS.map((r) => (
            <Link
              key={r.key}
              href={`/organizer/invites?role=${r.key}`}
              className={cn(
                "relative px-4 py-3 text-sm font-medium",
                activeKey === r.key ? "text-navy" : "text-navy-500 hover:text-navy",
              )}
            >
              {r.label}
              {activeKey === r.key && (
                <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-amber" />
              )}
            </Link>
          ))}
        </nav>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {STAGES.map((stage) => (
            <div key={stage} className="flex flex-col rounded-card border border-surface-border bg-white">
              <div className="flex items-center justify-between border-b border-surface-border px-4 py-3">
                <StatusBadge status={stage} />
                <span className="text-sm font-medium text-navy-400">{byStage[stage].length}</span>
              </div>
              <ul className="max-h-128 divide-y divide-surface-border overflow-y-auto">
                {byStage[stage].length === 0 ? (
                  <li className="px-4 py-6 text-center text-xs text-navy-400">None</li>
                ) : (
                  byStage[stage].map((row: any) => {
                    const userId = row[activeRole.userCol];
                    const person = contacts.get(userId);
                    const displayName = person?.full_name ?? person?.email ?? "Unknown";
                    const eventTitle = eventTitleById.get(row.event_id);
                    const extra =
                      activeRole.key === "speakers"
                        ? row.session_title
                        : activeRole.key === "attendees"
                          ? row.organization_affiliation
                          : null;
                    return (
                      <li key={row.id} className="flex items-start gap-2.5 px-3 py-3">
                        {person?.avatar_url ? (
                          <Image
                            src={person.avatar_url}
                            alt=""
                            width={32}
                            height={32}
                            className="size-8 shrink-0 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-navy-100 text-xs font-semibold text-navy">
                            {displayName.slice(0, 1).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-navy">{displayName}</p>
                          {person?.email && displayName !== person.email && (
                            <p className="truncate text-xs text-navy-400">{person.email}</p>
                          )}
                          {eventTitle && (
                            <p className="mt-0.5 truncate text-xs text-navy-500">{eventTitle}</p>
                          )}
                          {extra && (
                            <p className="truncate text-xs text-navy-400">{extra}</p>
                          )}
                        </div>
                      </li>
                    );
                  })
                )}
              </ul>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}