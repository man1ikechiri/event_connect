import type { Metadata } from "next";
import { requestOrganizerAccess } from "@/app/onboarding/actions";
import { CalendarPlus, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Get started",
  description: "Request organizer access or wait for an event invite.",
  robots: { index: false, follow: false },
};

export default function OnboardingPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-8 px-6 py-16 text-center">
      <div>
        <h1 className="text-2xl font-semibold text-navy">You're signed in — now what?</h1>
        <p className="mt-2 text-navy-500">
          You don't have an active role yet. Either an organizer invites you to speak, partner, or attend an
          event, or you can request organizer access yourself.
        </p>
      </div>

      <div className="grid w-full gap-4 sm:grid-cols-2">
        <div className="rounded-card border border-surface-border bg-white p-5 text-left">
          <Mail className="size-5 text-amber-500" aria-hidden />
          <p className="mt-2 font-medium text-navy">Waiting on an invite?</p>
          <p className="mt-1 text-sm text-navy-500">
            Check the inbox for the email address you signed in with — invites arrive there.
          </p>
        </div>
        <form action={requestOrganizerAccess} className="rounded-card border border-surface-border bg-white p-5 text-left">
          <CalendarPlus className="size-5 text-amber-500" aria-hidden />
          <p className="mt-2 font-medium text-navy">Want to organize events?</p>
          <p className="mt-1 text-sm text-navy-500">Request organizer access — an admin reviews every request.</p>
          <Button type="submit" size="sm" className="mt-3">
            Request access
          </Button>
        </form>
      </div>
    </div>
  );
}
