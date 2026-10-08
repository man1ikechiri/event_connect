// src/lib/nav-items.ts
import type { NavIconName } from "@/lib/nav-icon-registry";
import type { RoleKey } from "@/lib/auth/roles";

export interface NavItem {
  label: string;
  href: string;
  icon: NavIconName;
}

export const ORGANIZER_NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/organizer/dashboard", icon: "LayoutDashboard" },
  { label: "Events", href: "/organizer/events", icon: "CalendarDays" },
  { label: "Invites", href: "/organizer/invites", icon: "Mail" },
  { label: "Process users", href: "/organizer/process", icon: "ShieldCheck" },
];

export const SPEAKER_NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/speaker/dashboard", icon: "LayoutDashboard" },
  { label: "Profile", href: "/speaker/profile", icon: "User" },
  { label: "Content library", href: "/speaker/content-library", icon: "Library" },
  { label: "Q&A inbox", href: "/speaker/qa", icon: "MessagesSquare" },
  { label: "My events", href: "/speaker/my-events", icon: "CalendarCheck2" },
];

export const ATTENDEE_NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/attendee/dashboard", icon: "LayoutDashboard" },
  { label: "My events", href: "/attendee/my-events", icon: "CalendarCheck2" },
  { label: "Speakers", href: "/attendee/speakers", icon: "User" },
  { label: "My questions", href: "/attendee/questions", icon: "MessagesSquare" },
];

export const PARTNER_NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/partner/dashboard", icon: "LayoutDashboard" },
];

export const ADMIN_NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/admin/dashboard", icon: "LayoutDashboard" },
  { label: "Users", href: "/admin/users", icon: "Users" },
  { label: "Events", href: "/admin/events", icon: "CalendarDays" },
  { label: "Moderation", href: "/admin/moderation", icon: "ShieldCheck" },
  { label: "Audit log", href: "/admin/audit-log", icon: "History" },
];

// ---------------------------------------------------------------------------
// Role → nav items map. Used by PortalShell to pick the correct sidebar
// navigation based on the currently active role. Admin is intentionally
// absent — admin keeps its own dedicated layout without role tabs.
// ---------------------------------------------------------------------------
export const NAV_ITEMS_BY_ROLE: Record<RoleKey, NavItem[]> = {
  organizer: ORGANIZER_NAV_ITEMS,
  attendee: ATTENDEE_NAV_ITEMS,
  speaker: SPEAKER_NAV_ITEMS,
  partner: PARTNER_NAV_ITEMS,
};