"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";

export interface TabItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
  count?: number;
}

/**
 * Section 6 calls for a "horizontal sub-menu" (Details/Speakers/Partners/
 * Attendees) rather than another layer of cards — this is that pattern,
 * reused everywhere the spec asks for tabbed navigation.
 */
export function TabMenu({ items, className }: { items: TabItem[]; className?: string }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Section navigation"
      className={cn("flex items-center gap-1 border-b border-surface-border overflow-x-auto", className)}
    >
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative flex shrink-0 items-center gap-2 px-4 py-3 text-sm font-medium transition-colors",
              active ? "text-navy" : "text-navy-500 hover:text-navy",
            )}
          >
            {item.icon}
            {item.label}
            {typeof item.count === "number" && (
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-xs",
                  active ? "bg-amber/15 text-amber-600" : "bg-surface-muted text-navy-500",
                )}
              >
                {item.count}
              </span>
            )}
            {active && <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-amber" />}
          </Link>
        );
      })}
    </nav>
  );
}
