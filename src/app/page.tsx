import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Mic, Users, HandHeart, ShieldCheck, MessageSquareLock, Link2 } from "lucide-react";
import { StickyMobileCta } from "@/components/layout/sticky-mobile-cta";

export const metadata: Metadata = {
  title: "Run every side of your event, in one place",
  description:
    "EventConnect connects organizers, speakers, attendees, and partners around a single event — invites, content, private Q&A, and moderation, all in one platform.",
  alternates: { canonical: "/" },
};

const ROLES = [
  {
    icon: Users,
    label: "Organizers",
    copy: "Invite speakers and partners, track every invite through five stages, and moderate Q&A from one queue.",
  },
  {
    icon: Mic,
    label: "Speakers",
    copy: "Build a structured profile, link your content library, and answer attendee questions privately — one by one or in bulk.",
  },
  {
    icon: MessageSquareLock,
    label: "Attendees",
    copy: "Register, see every speaker's content in one feed, and ask questions that only the speaker can see.",
  },
  {
    icon: HandHeart,
    label: "Partners",
    copy: "See aggregate registration numbers and the speaker lineup — no individual attendee data, ever.",
  },
];

const STEPS = [
  { n: "1", label: "Organizer creates the event", copy: "Set the date, venue or virtual link, and capacity." },
  { n: "2", label: "Invite by email", copy: "Speakers and partners accept, then activate by completing their profile." },
  { n: "3", label: "Attendees register", copy: "They see the schedule and every speaker's shared content." },
  { n: "4", label: "Questions stay private", copy: "Each attendee's question is visible only to them and the speaker." },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <span className="text-lg font-semibold text-navy">EventConnect</span>
        <nav className="flex items-center gap-6 text-sm font-medium text-navy-500">
          <a href="#roles" className="hidden hover:text-navy sm:inline">
            Who it's for
          </a>
          <a href="#how-it-works" className="hidden hover:text-navy sm:inline">
            How it works
          </a>
          <Link href="/login" className="rounded-control border border-navy px-4 py-2 text-navy hover:bg-navy/5">
            Sign in
          </Link>
        </nav>
      </header>

      {/* Hero — CTA above the fold */}
      <section className="mx-auto grid max-w-6xl gap-10 px-6 pb-16 pt-8 md:grid-cols-2 md:items-center md:pb-24 md:pt-16">
        <div>
          <h1 className="text-4xl font-semibold leading-tight text-navy md:text-5xl">
            Every role in your event, working from the same source of truth.
          </h1>
          <p className="mt-5 max-w-md text-lg text-navy-500">
            EventConnect replaces the spreadsheet-and-email shuffle between organizers, speakers, attendees, and
            partners with one platform — built for events that run more than once.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/login"
              className="inline-flex h-12 items-center gap-2 rounded-control bg-amber px-6 text-sm font-semibold text-white hover:bg-amber-500"
            >
              Start organizing
              <ArrowRight className="size-4" aria-hidden />
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex h-12 items-center rounded-control border border-navy px-6 text-sm font-semibold text-navy hover:bg-navy/5"
            >
              See how it works
            </a>
          </div>
          <p className="mt-4 flex items-center gap-1.5 text-sm text-navy-400">
            <ShieldCheck className="size-4" aria-hidden />
            No passwords — sign in with a magic link or Google.
          </p>
        </div>

        <div className="rounded-card border border-surface-border bg-surface-muted p-6">
          <p className="mb-4 text-sm font-medium uppercase tracking-wide text-navy-400">Invited &gt; Accepted &gt; Activated</p>
          <ol className="space-y-3">
            {["Invited", "Accepted", "Activated"].map((label, i) => (
              <li key={label} className="flex items-center gap-3 rounded-control bg-white p-3 shadow-ambient">
                <span className="flex size-7 items-center justify-center rounded-full bg-navy text-xs font-semibold text-white">
                  {i + 1}
                </span>
                <span className="text-sm font-medium text-navy">{label}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Roles */}
      <section id="roles" className="border-t border-surface-border bg-surface-muted py-16">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-2xl font-semibold text-navy">Built around five real jobs, not one big login</h2>
          <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {ROLES.map((role) => (
              <div key={role.label} className="flex flex-col gap-2">
                <role.icon className="size-6 text-amber-500" strokeWidth={1.75} aria-hidden />
                <p className="font-medium text-navy">{role.label}</p>
                <p className="text-sm text-navy-500">{role.copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works — a genuine sequence, so numbering is warranted */}
      <section id="how-it-works" className="py-16">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-2xl font-semibold text-navy">From invite to first question, in four steps</h2>
          <ol className="mt-8 grid gap-6 md:grid-cols-4">
            {STEPS.map((step) => (
              <li key={step.n} className="border-t-2 border-navy pt-4">
                <span className="text-sm font-semibold text-amber-600">Step {step.n}</span>
                <p className="mt-1 font-medium text-navy">{step.label}</p>
                <p className="mt-1 text-sm text-navy-500">{step.copy}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="border-t border-surface-border bg-navy py-16 text-white">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-4 px-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Ready to run your first event on EventConnect?</h2>
            <p className="mt-2 flex items-center gap-1.5 text-navy-200">
              <Link2 className="size-4" aria-hidden />
              Organizer accounts are approved before they can invite speakers or partners.
            </p>
          </div>
          <Link
            href="/login"
            className="inline-flex h-12 shrink-0 items-center gap-2 rounded-control bg-amber px-6 text-sm font-semibold text-navy hover:bg-amber-300"
          >
            Get started
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      </section>

      <footer className="border-t border-surface-border py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 text-sm text-navy-400 sm:flex-row">
          <p>© {new Date().getFullYear()} EventConnect.</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-navy">
              Privacy policy
            </Link>
            <Link href="/terms" className="hover:text-navy">
              Terms &amp; conditions
            </Link>
          </div>
        </div>
      </footer>

      <StickyMobileCta href="/login" label="Start organizing" />
      {/* Bottom padding so the sticky CTA never covers the footer links on mobile */}
      <div className="h-16 md:hidden" aria-hidden />
    </div>
  );
}
