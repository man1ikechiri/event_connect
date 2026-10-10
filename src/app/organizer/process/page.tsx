import type { Metadata } from "next";
import Link from "next/link";
import { Info } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils/cn";
import { ShieldCheck, MessageSquareWarning } from "lucide-react";
import { QaModerationRow } from "@/app/organizer/process/qa-moderation-row";

export const metadata: Metadata = { title: "Process users" };

const TABS = [
  { key: "rf-speaker", label: "Process RFSpeaker" },
  { key: "rf-partner", label: "Process RFPartner" },
  { key: "rf-attendee", label: "Process RFAttendee" },
  { key: "qa", label: "Process Q&A" },
] as const;

export default async function ProcessUsersPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;
  const activeTab = TABS.find((t) => t.key === tab)?.key ?? "qa";

  return (
    <>
      <main className="mx-auto max-w-5xl px-4 py-8 md:px-8">
        <h1 className="mb-6 text-2xl font-semibold tracking-tight text-navy">
          Process Users
        </h1>
        <div className="mb-4 flex items-start gap-2 rounded-control bg-state-infoBg px-4 py-3 text-sm text-state-info">
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
          <p>
            "RFSpeaker / RFPartner / RFAttendee" queues below show accepted invites still awaiting activation —
            confirm this matches your intended meaning; it's flagged as an open item in the spec.
          </p>
        </div>

        <nav aria-label="Process users section" className="mb-6 flex gap-1 border-b border-surface-border overflow-x-auto">
          {TABS.map((tab) => (
            <Link
              key={tab.key}
              href={`/organizer/process?tab=${tab.key}`}
              className={cn(
                "relative shrink-0 px-4 py-3 text-sm font-medium",
                activeTab === tab.key ? "text-navy" : "text-navy-500 hover:text-navy",
              )}
            >
              {tab.label}
              {activeTab === tab.key && <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-amber" />}
            </Link>
          ))}
        </nav>

        {activeTab === "qa" ? <QaModerationPanel /> : <ReviewQueuePanel roleKey={activeTab} />}
      </main>
    </>
  );
}

async function ReviewQueuePanel({ roleKey }: { roleKey: "rf-speaker" | "rf-partner" | "rf-attendee" }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: myEventIds } = await supabase.from("events").select("id").eq("organizer_id", user.id);
  const eventIds = (myEventIds ?? []).map((e) => e.id);

  const config = {
    "rf-speaker": { table: "event_speaker_invites", userCol: "speaker_user_id", label: "speakers" },
    "rf-partner": { table: "event_partner_invites", userCol: "partner_user_id", label: "partners" },
    "rf-attendee": { table: "event_attendee_registrations", userCol: "attendee_user_id", label: "attendees" },
  }[roleKey];

  const { data: rows } =
    eventIds.length > 0
      ? await supabase
          .from(config.table)
          .select(`id, status, ${config.userCol}, users:${config.userCol} (full_name, email)`)
          .in("event_id", eventIds)
          .eq("status", "accepted")
      : { data: [] };

  if (!rows || rows.length === 0) {
    return (
      <div className="rounded-card border border-dashed border-surface-border bg-white">
        <EmptyState
          icon={ShieldCheck}
          title="Nothing pending review"
          description={`No ${config.label} are waiting on activation right now.`}
        />
      </div>
    );
  }

  return (
    <ul className="divide-y divide-surface-border overflow-hidden rounded-card border border-surface-border bg-white">
      {rows.map((row: any) => {
        const person = Array.isArray(row.users) ? row.users[0] : row.users;
        return (
          <li key={row.id} className="flex items-center justify-between px-5 py-4">
            <div>
              <p className="font-medium text-navy">{person?.full_name || person?.email}</p>
              <p className="text-sm text-navy-400">{person?.email}</p>
            </div>
            <StatusBadge status={row.status} />
          </li>
        );
      })}
    </ul>
  );
}

async function QaModerationPanel() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: myEventIds } = await supabase.from("events").select("id").eq("organizer_id", user.id);
  const eventIds = (myEventIds ?? []).map((e) => e.id);

  const { data: questions } =
    eventIds.length > 0
      ? await supabase
          .from("questions")
          .select(
            "id, body, asked_at, status, flagged, review_status, attendee:attendee_id (full_name, email), speaker:speaker_id (full_name, email), answers (body, answered_at)",
          )
          .in("event_id", eventIds)
          .order("asked_at", { ascending: false })
          .limit(50)
      : { data: [] };

  if (!questions || questions.length === 0) {
    return (
      <div className="rounded-card border border-dashed border-surface-border bg-white">
        <EmptyState
          icon={MessageSquareWarning}
          title="No questions yet"
          description="Once attendees start asking speakers questions, they'll show up here for review."
        />
      </div>
    );
  }

  return (
    <ul className="divide-y divide-surface-border overflow-hidden rounded-card border border-surface-border bg-white">
      {questions.map((q: any) => (
        <QaModerationRow key={q.id} question={q} />
      ))}
    </ul>
  );
}
