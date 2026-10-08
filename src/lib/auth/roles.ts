// src/lib/auth/roles.ts

export const ROLE_ORDER = ["organizer", "attendee", "speaker", "partner"] as const;
export type RoleKey = (typeof ROLE_ORDER)[number];

export interface UserRoles {
  isAttendee: boolean;
  isOrganizer: boolean;
  isSpeaker: boolean;
  isPartner: boolean;
  isAdmin: boolean;
}

export const ROLE_META: Record<
  RoleKey,
  { label: string; href: string; portalLabel: string }
> = {
  organizer: {
    label: "Organizer",
    href: "/organizer/dashboard",
    portalLabel: "Organizer portal",
  },
  attendee: {
    label: "Attendee",
    href: "/attendee/dashboard",
    portalLabel: "Attendee portal",
  },
  speaker: {
    label: "Speaker",
    href: "/speaker/dashboard",
    portalLabel: "Speaker portal",
  },
  partner: {
    label: "Partner",
    href: "/partner/dashboard",
    portalLabel: "Partner portal",
  },
};

export function getActiveRoles(roles: UserRoles): RoleKey[] {
  return ROLE_ORDER.filter((key) => {
    switch (key) {
      case "organizer":
        return roles.isOrganizer;
      case "attendee":
        return roles.isAttendee;
      case "speaker":
        return roles.isSpeaker;
      case "partner":
        return roles.isPartner;
    }
  });
}

export function roleFromPath(pathname: string): RoleKey | null {
  for (const key of ROLE_ORDER) {
    if (pathname === `/${key}` || pathname.startsWith(`/${key}/`)) return key;
  }
  return null;
}

/** Where to send a signed-in user based on what they can do. */
export function getPrimaryDashboard(roles: UserRoles): string {
  const active = getActiveRoles(roles);
  if (active.length === 0) return "/onboarding";
  if (active.length === 1) return ROLE_META[active[0]!].href;
  return "/dashboard";
}