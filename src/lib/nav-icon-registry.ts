//src\lib\nav-icon-registry.ts
import {
  LayoutDashboard,
  CalendarDays,
  Mail,
  ShieldCheck,
  User,
  Library,
  MessagesSquare,
  CalendarCheck2,
  Users,
  History,
} from "lucide-react";

export const NAV_ICONS = {
  LayoutDashboard,
  CalendarDays,
  Mail,
  ShieldCheck,
  User,
  Library,
  MessagesSquare,
  CalendarCheck2,
  Users,
  History,
} as const;

export type NavIconName = keyof typeof NAV_ICONS;