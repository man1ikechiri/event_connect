import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Topbar } from "@/components/layout/topbar";
import { StatusBadge } from "@/components/ui/status-badge";
import { ORGANIZER_NAV_ITEMS } from "@/lib/nav-items";
import { cn } from "@/lib/utils/cn";

export const metadata: Metadata = { title: "Invites" };

const STAGES = ["invited", "accepted", "declined", "activated", "suspended"] as const;
const ROLE_TABS = [
  { key: "speakers", label: "Speakers", table: "event_speaker_invites", userCol: "speaker_user_id" },
  { key: "partners", label: "Partners", table: "event_partner_invites", userCol: "partner_user_id" },
  { key: "attendees", label: "Attendees", table: "event_attendee_registrations", userCol: "attendee_user_id" },
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

  const { data: myEventIds } = await supabase.from("events").select("id").eq("organizer_id", user.id);
  const eventIds = (myEventIds ?? []).map((e) => e.id);

  const { data: rows } =
    eventIds.length > 0
      ? await supabase
          .from(activeRole.table)
          .select(`id, status, ${activeRole.userCol}, users:${activeRole.userCol} (full_name, email)`)
          .in("event_id", eventIds)
      : { data: [] };

  const byStage = Object.fromEntries(
    STAGES.map((stage) => [stage, (rows ?? []).filter((r: any) => r.status === stage)]),
  ) as Record<(typeof STAGES)[number], any[]>;

  return (
    <>
      <Topbar title="Invites" portalLabel="Organizer portal" navItems={ORGANIZER_NAV_ITEMS} />
      <main className="mx-auto max-w-6xl px-4 py-8 md:px-8">
        <nav aria-label="Role" className="mb-6 flex gap-1 border-b border-surface-border">
          {ROLE_TABS.map((role) => (
            <Link
              key={role.key}
              href={`/organizer/invites?role=${role.key}`}
              className={cn(
                "relative px-4 py-3 text-sm font-medium",
                activeKey === role.key ? "text-navy" : "text-navy-500 hover:text-navy",
              )}
            >
              {role.label}
              {activeKey === role.key && (
                <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-amber" />
              )}
            </Link>
          ))}
        </nav>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {STAGES.map((stage) => (
            <div key={stage} className="rounded-card border border-surface-border bg-white">
              <div className="flex items-center justify-between border-b border-surface-border px-4 py-3">
                <StatusBadge status={stage} />
                <span className="text-sm font-medium text-navy-400">{byStage[stage].length}</span>
              </div>
              <ul className="max-h-96 divide-y divide-surface-border overflow-y-auto">
                {byStage[stage].length === 0 ? (
                  <li className="px-4 py-6 text-center text-xs text-navy-400">None</li>
                ) : (
                  byStage[stage].map((row) => {
                    const person = Array.isArray(row.users) ? row.users[0] : row.users;
                    return (
                      <li key={row.id} className="px-4 py-3">
                        <p className="truncate text-sm font-medium text-navy">{person?.full_name || person?.email}</p>
                        <p className="truncate text-xs text-navy-400">{person?.email}</p>
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
