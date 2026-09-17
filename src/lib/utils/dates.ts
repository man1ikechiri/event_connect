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
export function dashboardDateRanges(now = new Date()) {
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const dayOfWeek = (startOfDay.getDay() + 6) % 7; // Monday = 0
  const startOfWeek = new Date(startOfDay);
  startOfWeek.setDate(startOfDay.getDate() - dayOfWeek);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfQuarter = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  return {
    week: startOfWeek.toISOString(),
    month: startOfMonth.toISOString(),
    quarter: startOfQuarter.toISOString(),
    year: startOfYear.toISOString(),
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
