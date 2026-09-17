import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms and conditions",
  description: "The terms that govern your use of EventConnect.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <article className="mx-auto max-w-prose px-6 py-16">
      <p className="text-sm font-medium text-amber-600">Legal</p>
      <h1 className="mt-2 text-3xl font-semibold text-navy">Terms and conditions</h1>
      <p className="mt-2 text-sm text-navy-400">Last updated {new Date().toLocaleDateString("en", { year: "numeric", month: "long", day: "numeric" })}</p>

      <div className="prose-content mt-8 space-y-6 text-navy-500">
        <section>
          <h2 className="text-lg font-semibold text-navy">1. Accounts</h2>
          <p className="mt-2">
            One EventConnect account maps to one person. You may hold multiple role badges — for example,
            organizing one event while speaking at another — but you may not share your account or credentials.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-navy">2. Organizer responsibilities</h2>
          <p className="mt-2">
            Organizers are responsible for the accuracy of event details they publish and for moderating Q&amp;A
            and content within their events in good faith. Organizer accounts are subject to admin approval and
            may be suspended for misuse.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-navy">3. Content library links</h2>
          <p className="mt-2">
            Speakers are responsible for the content they link into their library. EventConnect does not host
            files in this version of the product and only stores links you provide.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-navy">4. Suspension</h2>
          <p className="mt-2">
            We may suspend a role or an account where content violates these terms, where flagged behavior is
            confirmed by an organizer or admin, or where required by law.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-navy">5. Changes</h2>
          <p className="mt-2">
            We may update these terms as the product evolves. Material changes will be communicated by email or
            in-app notification before they take effect.
          </p>
        </section>
      </div>
    </article>
  );
}
