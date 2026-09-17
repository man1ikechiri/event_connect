// src/components/layout/sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { NAV_ICONS } from "@/lib/nav-icon-registry";
import type { NavItem } from "@/lib/nav-items";

export function Sidebar({
  portalLabel,
  items,
  footer,
}: {
  portalLabel: string;
  items: NavItem[];
  footer?: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 hidden h-screen w-64 flex-col bg-navy py-6 md:flex">
      <Link href="/" className="mb-8 flex items-center gap-2 px-6">
        <div className="flex size-8 items-center justify-center rounded-control bg-amber text-navy">
          <CalendarDays className="size-4" aria-hidden />
        </div>
        <div>
          <p className="text-base font-semibold leading-tight text-white">EventConnect</p>
          <p className="text-xs text-navy-200">{portalLabel}</p>
        </div>
      </Link>

      <nav className="flex-1 space-y-1 px-3" aria-label="Primary">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = NAV_ICONS[item.icon];
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-control px-3 py-2.5 text-sm font-medium transition-colors",
                active ? "bg-amber text-navy" : "text-navy-100 hover:bg-white/5 hover:text-white",
              )}
            >
              <Icon className="size-[18px]" aria-hidden />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {footer && <div className="mt-auto px-3 pt-4">{footer}</div>}
    </aside>
  );
}