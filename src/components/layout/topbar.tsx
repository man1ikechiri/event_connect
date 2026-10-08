// src/components/layout/topbar.tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { MobileNavTrigger } from "@/components/layout/mobile-nav";
import { UserMenu } from "@/components/layout/user-menu";
import { RoleTabs } from "@/components/layout/role-tabs";
import { cn } from "@/lib/utils/cn";
import { useCurrentUser } from "@/components/layout/user-context";
import type { NavItem } from "@/lib/nav-items";
import type { RoleKey } from "@/lib/auth/roles";

export function Topbar({
  activeRole,
  portalLabel,
  navItems,
  title,
  unreadNotifications = 0,
  actions,
  showRoleTabs = true,
}: {
  activeRole: RoleKey;
  portalLabel: string;
  navItems: NavItem[];
  title?: string;
  unreadNotifications?: number;
  actions?: React.ReactNode;
  showRoleTabs?: boolean;
}) {
  const user = useCurrentUser();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full border-b transition-all duration-300",
        scrolled
          ? "border-surface-border bg-white/85 shadow-sm backdrop-blur-md"
          : "border-transparent bg-white/70 backdrop-blur-sm",
      )}
    >
      <div className="flex h-16 items-center gap-3 px-4 md:gap-4 md:px-8">
        <div className="md:hidden">
          <MobileNavTrigger portalLabel={portalLabel} items={navItems} />
        </div>

        <Link href="/dashboard" className="flex shrink-0 items-center gap-2">
          <span className="inline-block size-2.5 rounded-full bg-amber" aria-hidden />
          <span className="text-sm font-semibold tracking-tight text-navy">
            OurEvents<span className="text-navy-400">.rsvp</span>
          </span>
        </Link>

        {showRoleTabs && user && (
          <RoleTabs roles={user.roles} activeRole={activeRole} />
        )}

        <div className="ml-auto flex items-center gap-2">
          {actions}
          <button
            type="button"
            aria-label={
              unreadNotifications > 0
                ? `Notifications, ${unreadNotifications} unread`
                : "Notifications"
            }
            className="relative rounded-full p-2 text-navy-500 transition-colors hover:bg-surface-muted hover:text-navy"
          >
            <Bell className="size-5" aria-hidden />
            {unreadNotifications > 0 && (
              <span
                className="absolute right-1.5 top-1.5 size-2 rounded-full bg-amber"
                aria-hidden
              />
            )}
          </button>
          <UserMenu />
        </div>
      </div>

      {title && <h1 className="sr-only">{title}</h1>}
    </header>
  );
}