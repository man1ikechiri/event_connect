# EventConnect

Multi-event platform connecting Organizers, Speakers, Attendees, Partners, and Admins — built per
`eventconnect-specification.md`.

**Stack:** Next.js 14 (App Router) · TypeScript · Tailwind CSS · Supabase (Postgres + Auth + RLS) · Google OAuth +
magic-link sign-in.

---

## 1. What's implemented

| Area | Status |
|---|---|
| Schema, RLS, audited state-machine RPC | Complete (`supabase/migrations/0001_init.sql`) |
| Auth (Google OAuth + magic link) | Complete |
| Organizer portal | Complete — dashboard, events (4 sub-tabs), invites funnel, Process Users hub incl. Q&A moderation |
| Speaker portal | Complete — dashboard, profile, content library, Q&A inbox (bulk reply), My Events |
| Attendee portal | Core flows — dashboard, my events, my questions, public browse + self-registration |
| Partner portal | Core flow — aggregate-only dashboard via `partner_event_stats` RPC |
| Admin portal | Core flows — users, events, moderation, audit log |
| Site-wide requirements | Complete — see section 6 below |

**Deliberately out of scope for this pass** (all called out as Phase 2 in the spec, or open decisions):
attendee check-in, ML moderation, rich preview generation for PDF/Doc/Presentation, WebSocket notifications,
background job queue for OG/oEmbed scraping (the schema has `preview_status` ready for it), and file uploads.

**Open spec decisions this build made an assumption on** (flagged in-app where relevant, see spec Section 19):
- **Attendee entry mode**: both self-registration (`/events`) and organizer-invite write to the same
  `event_attendee_registrations` table, so either path works today.
- **"RF" in Process RFSpeaker/RFPartner/RFAttendee**: interpreted as "accepted, not yet activated" review
  queues. The Process Users page shows a banner flagging this for client confirmation.

---

## 2. Local setup

```bash
npm install
cp .env.example .env.local   # fill in the values from steps 3 and 4 below
npm run dev
```

## 3. Supabase project setup

1. Create a project at [supabase.com](https://supabase.com/dashboard).
2. **Project Settings → API** — copy the `Project URL` and `anon public` key into `.env.local` as
   `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Copy the `service_role` key into
   `SUPABASE_SERVICE_ROLE_KEY` (server-only, never expose to the client).
3. Run the schema migration:
   ```bash
   npx supabase login
   npx supabase link --project-ref YOUR-PROJECT-REF
   npx supabase db push
   ```
   or paste the contents of `supabase/migrations/0001_init.sql` directly into the Supabase SQL Editor and run it.
4. **Authentication → URL Configuration** — set:
   - Site URL: `http://localhost:3000` (swap for your production domain at deploy time)
   - Redirect URLs: `http://localhost:3000/auth/callback` (add your production callback URL too)
5. **Authentication → Email templates** — the magic-link template works out of the box; customize the sender
   name/branding under **Authentication → Providers → Email → SMTP Settings** whenever you're ready to move off
   Supabase's shared sender for production volume.

## 4. Google OAuth setup (Google Cloud Console → Supabase)

1. Go to [Google Cloud Console](https://console.cloud.google.com/) and create (or select) a project.
2. **APIs & Services → OAuth consent screen**
   - User type: External (unless you're restricting to a Workspace org).
   - Fill in app name ("EventConnect"), support email, and developer contact.
   - Scopes: the defaults (`email`, `profile`, `openid`) are sufficient — no extra scopes needed.
   - Add yourself as a test user while the app is in "Testing" mode; publish later to allow any Google account.
3. **APIs & Services → Credentials → Create Credentials → OAuth client ID**
   - Application type: **Web application**.
   - Authorized JavaScript origins: `http://localhost:3000` and your production domain.
   - Authorized redirect URIs: use the callback URL Supabase gives you — it's under **Supabase Dashboard →
     Authentication → Providers → Google** once you open that panel, formatted as:
     `https://YOUR-PROJECT-REF.supabase.co/auth/v1/callback`
   - Save, then copy the generated **Client ID** and **Client Secret**.
4. Back in **Supabase Dashboard → Authentication → Providers → Google**:
   - Toggle it on.
   - Paste the Client ID and Client Secret from step 3.
   - Save.
5. That's it — no client-side Google SDK, no separate Firebase project. `supabase.auth.signInWithOAuth({
   provider: "google" })` (already wired up in `src/app/login/login-form.tsx`) handles the redirect dance, and
   the trigger in the migration (`handle_new_auth_user`) auto-provisions the matching `public.users` row on
   first sign-in — via Google or magic link, either way.

## 5. Seeding your first admin + organizer

New accounts land with `is_admin = false` and `organizer_status = 'none'`. To bootstrap:

```sql
-- After signing in once via the app (so the auth.users/public.users row exists):
update public.users set is_admin = true where email = 'you@yourcompany.com';
update public.users set organizer_status = 'approved' where email = 'organizer@yourcompany.com';
```

## 6. Site-wide requirements checklist

| Requirement | Where |
|---|---|
| Custom 404 | `src/app/not-found.tsx` |
| CTA above the fold | `src/app/page.tsx` hero |
| Meta title/description per page | Every `page.tsx` exports `metadata`; root layout sets the `%s · EventConnect` template |
| Open Graph image | `src/app/opengraph-image.tsx` (generated, no binary asset) |
| Favicon | `src/app/icon.tsx` (generated) |
| robots.txt | `src/app/robots.ts` |
| sitemap.xml | `src/app/sitemap.ts` |
| Alt text on images | Speaker avatars in `speakers/page.tsx` set descriptive `alt` |
| Mobile breakpoints | Sidebar collapses to `MobileNavTrigger` under `md:`; tables scroll horizontally |
| Sticky mobile CTA | `src/components/layout/sticky-mobile-cta.tsx` on marketing + event pages |
| Loading states | `loading.tsx` per route + `Skeleton`/`SkeletonList` components |
| Form error states | `Field`/`TextInput`/`TextArea` components; every server action returns `{ error }` |
| Thank-you page | `src/app/thank-you/page.tsx` (parameterized, reused across flows) |
| Privacy policy | `src/app/privacy/page.tsx` |
| Terms & conditions | `src/app/terms/page.tsx` |
| Cookie banner | `src/components/layout/cookie-banner.tsx` |
| Compressed images | `next.config.mjs` enables AVIF/WebP via `next/image` for all remote Supabase Storage images |

## 7. Architecture notes

- **RBAC lives in the database**, not just the UI. Every table has RLS policies keyed off `auth.uid()` via
  `SECURITY DEFINER` helper functions (`is_admin`, `is_organizer_of_event`, etc.) — see the bottom half of
  `0001_init.sql`. A compromised or buggy client can't read data it shouldn't.
- **State transitions are atomic and audited** through the `transition_role_status()` Postgres function — it
  validates the legal transition, writes the new status, and inserts an `audit_log` row in one transaction.
  Every "accept/decline/suspend" action in the app calls this RPC rather than updating the status column
  directly.
- **Partner data is aggregate-only at the query layer**, not just hidden in the UI — `partner_event_stats()` is
  a `SECURITY DEFINER` function that returns counts and re-checks `is_partner_on_event()` internally, so there's
  no code path (buggy or malicious) that lets a partner's client fetch attendee rows.
- **Speaker activation is automatic**, computed after profile saves and content-library additions
  (`maybeActivateSpeakerInvites` in `src/app/speaker/actions.ts`), matching Section 5/7 of the spec exactly.

## 8. Next steps toward the full 2-week build

1. Wire a background job (Supabase Edge Function + `pg_cron`, or a queue like Inngest/Trigger.dev) to resolve
   YouTube oEmbed and Open Graph previews for `content_library_items` where `preview_status = 'pending'`.
2. Build out the attendee content feed (data model and RLS already support it — `content_library_items` is
   readable by any attendee `activated` on an event where the speaker also has an invite).
3. Decide and confirm the two open items in Section 19 of the spec (attendee entry mode, "RF" meaning) with the
   client, then remove the in-app banner on the Process Users page.
4. Add automated tests around the RLS policies (`supabase test db` or pgTAP) before this goes to production —
   RLS bugs are the highest-blast-radius kind of bug in this architecture.
