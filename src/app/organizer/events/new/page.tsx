import type { Metadata } from "next";
import { Topbar } from "@/components/layout/topbar";
import { ORGANIZER_NAV_ITEMS } from "@/lib/nav-items";
import { CreateEventForm } from "@/app/organizer/events/new/create-event-form";

export const metadata: Metadata = { title: "Create event" };

export default function NewEventPage() {
  return (
    <>
      <Topbar title="Create event" portalLabel="Organizer portal" navItems={ORGANIZER_NAV_ITEMS} />
      <main className="mx-auto max-w-2xl px-4 py-8 md:px-8">
        <div className="rounded-card border border-surface-border bg-white p-6">
          <CreateEventForm />
        </div>
      </main>
    </>
  );
}
