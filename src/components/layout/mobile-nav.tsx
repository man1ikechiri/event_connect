// src/components/layout/mobile-nav.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { NAV_ICONS } from "@/lib/nav-icon-registry";
import type { NavItem } from "@/lib/nav-items";

export function MobileNavTrigger({ portalLabel, items }: { portalLabel: string; items: NavItem[] }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open navigation menu"
        className="rounded-control p-2 text-navy hover:bg-surface-muted"
      >
        <Menu className="size-5" aria-hidden />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-navy/40" onClick={() => setOpen(false)} aria-hidden />
          <nav
            aria-label="Mobile navigation"
            className="relative flex h-full w-72 flex-col bg-navy py-6 text-white shadow-xl"
          >
            <div className="mb-6 flex items-center justify-between px-5">
              <div>
                <p className="font-semibold">EventConnect</p>
                <p className="text-xs text-navy-200">{portalLabel}</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close navigation menu"
                className="rounded-control p-1.5 hover:bg-white/10"
              >
                <X className="size-5" aria-hidden />
              </button>
            </div>
            <div className="space-y-1 px-3">
              {items.map((item) => {
                const Icon = NAV_ICONS[item.icon];
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-control px-3 py-2.5 text-sm font-medium",
                      active ? "bg-amber text-navy" : "text-navy-100 hover:bg-white/5",
                    )}
                  >
                    <Icon className="size-[18px]" aria-hidden />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>
      )}
    </div>
  );
}