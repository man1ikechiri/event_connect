// src/app/attendee/questions/questions-client.tsx
"use client";

import { useMemo, useState } from "react";
import { MessageSquare, Filter, X, ChevronDown, Flag, CheckCircle2, Clock } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { relativeTime } from "@/lib/utils/dates";
import { cn } from "@/lib/utils/cn";

export interface QuestionRow {
  id: string;
  body: string;
  asked_at: string;
  status: string;
  flagged: boolean;
  event_id: string;
  event_title: string;
  speaker_id: string;
  speaker_name: string;
  answer: { body: string; answered_at: string } | null;
}

type StatusFilter = "all" | "pending" | "answered";
type TimeFilter = "all" | "7d" | "30d";
type FlagFilter = "all" | "flagged" | "ok";
type SortOrder = "newest" | "oldest";

export function QuestionsClient({ questions }: { questions: QuestionRow[] }) {
  const [status, setStatus] = useState<StatusFilter>("all");
  const [eventId, setEventId] = useState<string>("all");
  const [time, setTime] = useState<TimeFilter>("all");
  const [flagFilter, setFlagFilter] = useState<FlagFilter>("all");
  const [sort, setSort] = useState<SortOrder>("newest");
  const [filterOpen, setFilterOpen] = useState(false);

  const events = useMemo(() => {
    const map = new Map<string, string>();
    questions.forEach((q) => map.set(q.event_id, q.event_title));
    return Array.from(map, ([id, title]) => ({ id, title }));
  }, [questions]);

  const stats = useMemo(() => {
    const answered = questions.filter((q) => q.answer).length;
    return {
      total: questions.length,
      answered,
      pending: questions.length - answered,
      flagged: questions.filter((q) => q.flagged).length,
    };
  }, [questions]);

  const filtered = useMemo(() => {
    const now = Date.now();
    const windowMs =
      time === "7d" ? 7 * 86400_000 : time === "30d" ? 30 * 86400_000 : Infinity;

    let list = questions.filter((q) => {
      if (status === "pending" && q.answer) return false;
      if (status === "answered" && !q.answer) return false;
      if (eventId !== "all" && q.event_id !== eventId) return false;
      if (time !== "all" && now - new Date(q.asked_at).getTime() > windowMs) return false;
      if (flagFilter === "flagged" && !q.flagged) return false;
      if (flagFilter === "ok" && q.flagged) return false;
      return true;
    });

    list = [...list].sort((a, b) => {
      const da = new Date(a.asked_at).getTime();
      const db = new Date(b.asked_at).getTime();
      return sort === "newest" ? db - da : da - db;
    });

    return list;
  }, [questions, status, eventId, time, flagFilter, sort]);

  const activeFilterCount =
    (status !== "all" ? 1 : 0) +
    (eventId !== "all" ? 1 : 0) +
    (time !== "all" ? 1 : 0) +
    (flagFilter !== "all" ? 1 : 0);

  function resetFilters() {
    setStatus("all");
    setEventId("all");
    setTime("all");
    setFlagFilter("all");
  }

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-8 md:px-8">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight text-navy">
        My Questions
      </h1>
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Total" value={stats.total} icon={<MessageSquare className="size-4" aria-hidden />} />
        <StatTile label="Answered" value={stats.answered} tone="success" icon={<CheckCircle2 className="size-4" aria-hidden />} />
        <StatTile label="Awaiting reply" value={stats.pending} tone="warning" icon={<Clock className="size-4" aria-hidden />} />
        <StatTile label="Flagged" value={stats.flagged} tone="danger" icon={<Flag className="size-4" aria-hidden />} />
      </section>

      <section className="rounded-card border border-surface-border bg-white">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-surface-border px-4 py-3">
          <button
            type="button"
            onClick={() => setFilterOpen((v) => !v)}
            className="flex items-center gap-2 rounded-control px-3 py-1.5 text-sm font-medium text-navy hover:bg-surface-muted"
          >
            <Filter className="size-4" aria-hidden />
            Filters
            {activeFilterCount > 0 && (
              <span className="rounded-full bg-navy px-1.5 py-0.5 text-[10px] font-semibold text-white">
                {activeFilterCount}
              </span>
            )}
            <ChevronDown className={cn("size-3.5 transition-transform", filterOpen && "rotate-180")} aria-hidden />
          </button>

          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={resetFilters}
              className="flex items-center gap-1 text-xs font-medium text-navy-500 hover:text-navy"
            >
              <X className="size-3.5" aria-hidden />
              Clear filters
            </button>
          )}
        </div>

        {filterOpen && (
          <div className="space-y-3 border-b border-surface-border p-4">
            <FilterRow label="Status">
              <Chip active={status === "all"} onClick={() => setStatus("all")}>All</Chip>
              <Chip active={status === "pending"} onClick={() => setStatus("pending")}>Unanswered</Chip>
              <Chip active={status === "answered"} onClick={() => setStatus("answered")}>Answered</Chip>
            </FilterRow>

            <FilterRow label="Event">
              <select
                value={eventId}
                onChange={(e) => setEventId(e.target.value)}
                className="h-8 rounded-control border border-surface-border bg-white px-2 text-sm text-navy focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
              >
                <option value="all">All events</option>
                {events.map((e) => (
                  <option key={e.id} value={e.id}>{e.title}</option>
                ))}
              </select>
            </FilterRow>

            <FilterRow label="Time">
              <Chip active={time === "all"} onClick={() => setTime("all")}>All time</Chip>
              <Chip active={time === "7d"} onClick={() => setTime("7d")}>Last 7 days</Chip>
              <Chip active={time === "30d"} onClick={() => setTime("30d")}>Last 30 days</Chip>
            </FilterRow>

            <FilterRow label="Flag">
              <Chip active={flagFilter === "all"} onClick={() => setFlagFilter("all")}>All</Chip>
              <Chip active={flagFilter === "ok"} onClick={() => setFlagFilter("ok")}>Okay</Chip>
              <Chip active={flagFilter === "flagged"} onClick={() => setFlagFilter("flagged")}>Flagged</Chip>
            </FilterRow>

            <FilterRow label="Sort">
              <Chip active={sort === "newest"} onClick={() => setSort("newest")}>Newest first</Chip>
              <Chip active={sort === "oldest"} onClick={() => setSort("oldest")}>Oldest first</Chip>
            </FilterRow>
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={MessageSquare}
              title={questions.length === 0 ? "You haven't asked anything yet" : "No questions match these filters"}
              description={
                questions.length === 0
                  ? "Questions you ask speakers stay private between you and them."
                  : "Try clearing some filters to see more."
              }
            />
          </div>
        ) : (
          <ul className="divide-y divide-surface-border">
            {filtered.map((q) => (
              <li key={q.id} className="px-5 py-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center rounded-full bg-surface-muted px-2 py-0.5 text-[11px] font-medium text-navy-500">
                    {q.event_title}
                  </span>
                  <span className="text-xs text-navy-400">
                    To {q.speaker_name} · {relativeTime(q.asked_at)}
                  </span>
                  {q.flagged && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-state-dangerBg px-2 py-0.5 text-[11px] font-medium text-state-danger">
                      <Flag className="size-3" aria-hidden />
                      Flagged
                    </span>
                  )}
                  <span className="ml-auto">
                    <StatusBadge status={q.answer ? "answered" : q.status} kind="event" />
                  </span>
                </div>
                <p className="mt-2 text-sm text-navy">{q.body}</p>
                {q.answer ? (
                  <div className="mt-3 rounded-control border border-surface-border bg-surface-muted px-3 py-2">
                    <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-navy-400">
                      Reply · {relativeTime(q.answer.answered_at)}
                    </p>
                    <p className="text-sm text-navy">{q.answer.body}</p>
                  </div>
                ) : (
                  <p className="mt-2 text-xs italic text-navy-400">Awaiting reply from {q.speaker_name}.</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

function StatTile({
  label,
  value,
  icon,
  tone = "default",
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  tone?: "default" | "success" | "warning" | "danger";
}) {
  const toneClasses: Record<string, string> = {
    default: "text-navy bg-surface-muted",
    success: "text-state-success bg-state-successBg",
    warning: "text-amber bg-amber-50",
    danger: "text-state-danger bg-state-dangerBg",
  };
  return (
    <div className="rounded-card border border-surface-border bg-white p-4">
      <div className="flex items-center gap-2">
        <span className={cn("flex size-7 items-center justify-center rounded-full", toneClasses[tone])}>
          {icon}
        </span>
        <p className="text-xs font-medium uppercase tracking-wide text-navy-400">{label}</p>
      </div>
      <p className="mt-2 text-2xl font-semibold text-navy">{value}</p>
    </div>
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="w-14 shrink-0 text-xs font-semibold uppercase tracking-wide text-navy-400">{label}</span>
      {children}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
        active
          ? "border-navy bg-navy text-white"
          : "border-surface-border bg-white text-navy-500 hover:border-navy-300 hover:text-navy",
      )}
    >
      {children}
    </button>
  );
}