// src/components/layout/role-tabs.tsx
"use client";

import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import {
  ROLE_META,
  getActiveRoles,
  type UserRoles,
  type RoleKey,
} from "@/lib/auth/roles";

export function RoleTabs({
  roles,
  activeRole,
}: {
  roles: UserRoles;
  activeRole: RoleKey;
}) {
  const activeKeys = getActiveRoles(roles);

  // Single-role users see no tabs — they're already in their role.
  if (activeKeys.length <= 1) return null;

  return (
    <nav
      aria-label="Switch role"
      className="hidden items-center gap-0.5 rounded-full bg-surface-muted p-0.5 md:flex"
    >
      {activeKeys.map((key) => {
        const meta = ROLE_META[key];
        const isActive = key === activeRole;
        return (
          <Link
            key={key}
            href={meta.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium transition-colors",
              isActive
                ? "bg-white text-navy shadow-sm"
                : "text-navy-500 hover:text-navy",
            )}
          >
            {meta.label}
          </Link>
        );
      })}
    </nav>
  );
}