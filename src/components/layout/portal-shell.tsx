// src/components/layout/portal-shell.tsx
import { Topbar } from "@/components/layout/topbar";
import { Sidebar } from "@/components/layout/sidebar";
import { NAV_ITEMS_BY_ROLE } from "@/lib/nav-items";
import { ROLE_META, type RoleKey } from "@/lib/auth/roles";

export function PortalShell({
  activeRole,
  children,
}: {
  activeRole: RoleKey;
  children: React.ReactNode;
}) {
  const navItems = NAV_ITEMS_BY_ROLE[activeRole];
  const portalLabel = ROLE_META[activeRole].portalLabel;

  return (
    <div className="min-h-screen bg-surface-muted">
      <Sidebar portalLabel={portalLabel} items={navItems} />
      <div className="md:pl-64">
        <Topbar activeRole={activeRole} portalLabel={portalLabel} navItems={navItems} />
        {children}
      </div>
    </div>
  );
}