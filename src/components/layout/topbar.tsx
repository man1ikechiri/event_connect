// src/components/layout/topbar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { MobileNavTrigger } from "@/components/layout/mobile-nav";
import { UserMenu } from "@/components/layout/user-menu";
import { cn } from "@/lib/utils/cn";
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
  const pathname = usePathname();
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
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 md:gap-4 md:px-8">
        <div className="md:hidden">
          <MobileNavTrigger portalLabel={portalLabel} items={navItems} />
        </div>

        <Link href="/" className="flex shrink-0 items-center gap-2">
          <span className="inline-block size-2.5 rounded-full bg-amber" aria-hidden />
          <span className="text-sm font-semibold tracking-tight text-navy">
            OurEvents<span className="text-navy-400">.rsvp</span>
          </span>
        </Link>

        <span className="hidden rounded-full bg-surface-muted px-2.5 py-0.5 text-xs font-medium text-navy-500 md:inline-block">
          {portalLabel}
        </span>

        <nav className="hidden flex-1 items-center gap-1 md:flex">
          {navItems.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative rounded-control px-3 py-1.5 text-sm font-medium transition-colors",
                  active ? "text-navy" : "text-navy-500 hover:text-navy",
                )}
              >
                {item.label}
                {active && (
                  <span
                    className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-amber"
                    aria-hidden
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2 md:ml-0">
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

      <h1 className="sr-only">{title}</h1>
    </header>
  );
}