const DATE_FMT = new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" });
const TIME_FMT = new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit" });
const RANGE_DATE_FMT = new Intl.DateTimeFormat("en", { month: "short", day: "numeric" });

export function formatDate(iso: string) {
  return DATE_FMT.format(new Date(iso));
}

export function formatTime(iso: string) {
  return TIME_FMT.format(new Date(iso));
}

export function formatEventRange(startIso: string, endIso: string) {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const sameDay = start.toDateString() === end.toDateString();
  if (sameDay) {
    return `${DATE_FMT.format(start)} · ${TIME_FMT.format(start)}\u2013${TIME_FMT.format(end)}`;
  }
  return `${RANGE_DATE_FMT.format(start)}\u2013${DATE_FMT.format(end)}`;
}

/** Aggregate windows for the organizer dashboard stat cards (Section 4). */
// src/lib/utils/dates.ts

export interface DateRange {
  gte: string;
  lt: string;
}

export interface DashboardDateRanges {
  week: DateRange;
  month: DateRange;
  quarter: DateRange;
  year: DateRange;
}

/**
 * Returns half-open date ranges [start, end) for the current week,
 * month, quarter, and year. Both bounds are ISO strings so they can
 * be dropped straight into PostgREST's .gte() / .lt() filters.
 */
export function dashboardDateRanges(now: Date = new Date()): DashboardDateRanges {
  // Week — Sunday-start. Change `now.getDay()` offset if you want Monday.
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);

  // Month
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  // Quarter
  const q = Math.floor(now.getMonth() / 3);
  const startOfQuarter = new Date(now.getFullYear(), q * 3, 1);
  const endOfQuarter = new Date(now.getFullYear(), q * 3 + 3, 1);

  // Year
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const endOfYear = new Date(now.getFullYear() + 1, 0, 1);

  return {
    week:    { gte: startOfWeek.toISOString(),    lt: endOfWeek.toISOString() },
    month:   { gte: startOfMonth.toISOString(),   lt: endOfMonth.toISOString() },
    quarter: { gte: startOfQuarter.toISOString(), lt: endOfQuarter.toISOString() },
    year:    { gte: startOfYear.toISOString(),    lt: endOfYear.toISOString() },
  };
}

export function relativeTime(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}
