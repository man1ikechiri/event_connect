import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "How EventConnect collects, uses, and protects your personal data.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-prose px-6 py-16">
      <p className="text-sm font-medium text-amber-600">Legal</p>
      <h1 className="mt-2 text-3xl font-semibold text-navy">Privacy policy</h1>
      <p className="mt-2 text-sm text-navy-400">Last updated {new Date().toLocaleDateString("en", { year: "numeric", month: "long", day: "numeric" })}</p>

      <div className="prose-content mt-8 space-y-6 text-navy-500">
        <section>
          <h2 className="text-lg font-semibold text-navy">1. What we collect</h2>
          <p className="mt-2">
            When you create an account we collect your name, email address, and, if you provide it, phone number.
            Organizers additionally see event-scoped data for the roles you hold — for example, a speaker's session
            title, or an attendee's registration status.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-navy">2. Private questions and answers</h2>
          <p className="mt-2">
            Questions you ask a speaker are visible only to you, that speaker, the organizer of the event (for
            moderation), and platform administrators. They are never shown to other attendees.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-navy">3. Partner access</h2>
          <p className="mt-2">
            Partners (sponsors, vendors, volunteers, media, and hospitality contacts) only ever receive aggregate
            counts of invited and confirmed attendees. They cannot access individual attendee names or contact
            details, and this is enforced at the database layer, not only in the interface.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-navy">4. Your rights</h2>
          <p className="mt-2">
            You can request a copy of your data or ask us to delete your account by contacting the event's
            organizer or platform support. We process these requests in line with applicable data protection law,
            including Kenya's Data Protection Act where relevant.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-navy">5. Retention</h2>
          <p className="mt-2">
            We retain event and account data for as long as your account is active, or as required to meet legal
            obligations, resolve disputes, and enforce our agreements.
          </p>
        </section>
      </div>
    </article>
  );
}
