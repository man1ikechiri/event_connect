// src/components/layout/topbar.tsx
import { Bell } from "lucide-react";
import { MobileNavTrigger } from "@/components/layout/mobile-nav";
import type { NavItem } from "@/lib/nav-items";

export function Topbar({
  title,
  portalLabel,
  navItems,
  unreadNotifications = 0,
  actions,
}: {
  title: string;
  portalLabel: string;
  navItems: NavItem[];
  unreadNotifications?: number;
  actions?: React.ReactNode;
}) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-surface-border bg-white/95 px-4 backdrop-blur md:px-8">
      <div className="flex items-center gap-3">
        <MobileNavTrigger portalLabel={portalLabel} items={navItems} />
        <h1 className="text-lg font-semibold text-navy">{title}</h1>
      </div>
      <div className="flex items-center gap-2">
        {actions}
        <button
          type="button"
          aria-label={unreadNotifications > 0 ? `Notifications, ${unreadNotifications} unread` : "Notifications"}
          className="relative rounded-full p-2 text-navy-500 transition-colors hover:bg-surface-muted hover:text-navy"
        >
          <Bell className="size-5" aria-hidden />
          {unreadNotifications > 0 && (
            <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-amber" aria-hidden />
          )}
        </button>
      </div>
    </header>
  );
}