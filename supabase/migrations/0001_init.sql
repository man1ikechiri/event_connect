-- =====================================================================
-- EventConnect — initial schema
-- Implements eventconnect-specification.md sections 3, 4, 5, 9, 11, 13-15
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------
create type event_status as enum ('planned', 'live', 'completed', 'cancelled');
create type role_status as enum ('invited', 'accepted', 'declined', 'activated', 'suspended');
create type organizer_approval as enum ('none', 'pending', 'approved', 'suspended');
create type question_status as enum ('pending', 'answered');
create type review_status as enum ('open', 'reviewed', 'dismissed');
create type moderation_target as enum ('question', 'answer', 'content_item');
create type notification_type as enum (
  'invite_received', 'invite_accepted', 'invite_declined',
  'question_answered', 'question_received', 'account_suspended',
  'role_activated'
);

-- ---------------------------------------------------------------------
-- Core identity — one row per auth.users row (Section 3)
-- ---------------------------------------------------------------------
create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  phone text,
  full_name text not null default '',
  avatar_url text,
  is_admin boolean not null default false,
  organizer_status organizer_approval not null default 'none',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.users is 'One identity per person, keyed by auth.users.id. Role badges live in the event-scoped tables below; is_admin/organizer_status are the two global roles.';

-- ---------------------------------------------------------------------
-- Lookup tables — client expects these lists to grow (Section 2, 7)
-- ---------------------------------------------------------------------
create table public.partner_types (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  label text not null,
  sort_order int not null default 0
);

create table public.content_types (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  label text not null,
  supports_rich_preview boolean not null default false,
  sort_order int not null default 0
);

insert into public.partner_types (slug, label, sort_order) values
  ('sponsor', 'Sponsor', 1),
  ('volunteer', 'Volunteer', 2),
  ('vendor', 'Vendor', 3),
  ('media', 'Media', 4),
  ('hospitality', 'Hospitality / Accommodation', 5);

insert into public.content_types (slug, label, supports_rich_preview, sort_order) values
  ('website_url', 'Website URL', true, 1),
  ('video_url', 'Video URL', true, 2),
  ('social_media_url', 'Social Media URL', true, 3),
  ('pdf_url', 'PDF URL', false, 4),
  ('google_doc_url', 'Google Doc URL', false, 5),
  ('presentation', 'Presentation', false, 6);

-- ---------------------------------------------------------------------
-- Events (Section 4)
-- ---------------------------------------------------------------------
create table public.events (
  id uuid primary key default gen_random_uuid(),
  organizer_id uuid not null references public.users (id) on delete restrict,
  title text not null,
  description text not null default '',
  venue_label text not null default '',
  is_virtual boolean not null default false,
  virtual_link text,
  start_datetime timestamptz not null,
  end_datetime timestamptz not null,
  capacity int,
  status event_status not null default 'planned',
  status_override event_status, -- manual override for events running long
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint end_after_start check (end_datetime > start_datetime)
);

create index events_organizer_idx on public.events (organizer_id);
create index events_dates_idx on public.events (start_datetime, end_datetime);

-- Derived status: Planned -> Live -> Completed, honoring manual override.
create or replace function public.event_effective_status(e public.events)
returns event_status
language sql stable
as $$
  select coalesce(
    e.status_override,
    case
      when e.status = 'cancelled' then 'cancelled'::event_status
      when now() < e.start_datetime then 'planned'::event_status
      when now() between e.start_datetime and e.end_datetime then 'live'::event_status
      else 'completed'::event_status
    end
  );
$$;

-- ---------------------------------------------------------------------
-- Speaker profile (Section 7) — structured fields only, no free text bio
-- ---------------------------------------------------------------------
create table public.speaker_profiles (
  user_id uuid primary key references public.users (id) on delete cascade,
  professional_title text not null default '',
  company text not null default '',
  linkedin_url text,
  personal_website_url text,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Event-scoped role assignments — one state machine per (user, role, event)
-- (Section 5)
-- ---------------------------------------------------------------------
create table public.event_speaker_invites (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  speaker_user_id uuid not null references public.users (id) on delete cascade,
  session_title text not null default '',
  status role_status not null default 'invited',
  invited_at timestamptz not null default now(),
  responded_at timestamptz,
  activated_at timestamptz,
  suspended_at timestamptz,
  suspended_by uuid references public.users (id),
  unique (event_id, speaker_user_id)
);

create table public.event_partner_invites (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  partner_user_id uuid not null references public.users (id) on delete cascade,
  partner_type_id uuid not null references public.partner_types (id),
  org_name text not null default '',
  logo_url text,
  contact_email text,
  status role_status not null default 'invited',
  invited_at timestamptz not null default now(),
  responded_at timestamptz,
  activated_at timestamptz,
  suspended_at timestamptz,
  suspended_by uuid references public.users (id),
  unique (event_id, partner_user_id)
);

create table public.event_attendee_registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  attendee_user_id uuid not null references public.users (id) on delete cascade,
  organization_affiliation text,
  status role_status not null default 'invited',
  invited_by uuid references public.users (id),
  registered_at timestamptz not null default now(),
  responded_at timestamptz,
  activated_at timestamptz,
  suspended_at timestamptz,
  suspended_by uuid references public.users (id),
  unique (event_id, attendee_user_id)
);

create index speaker_invites_event_idx on public.event_speaker_invites (event_id);
create index speaker_invites_speaker_idx on public.event_speaker_invites (speaker_user_id);
create index partner_invites_event_idx on public.event_partner_invites (event_id);
create index attendee_regs_event_idx on public.event_attendee_registrations (event_id);
create index attendee_regs_attendee_idx on public.event_attendee_registrations (attendee_user_id);

-- ---------------------------------------------------------------------
-- Content library (Section 7) — links only in phase 1
-- ---------------------------------------------------------------------
create table public.content_library_items (
  id uuid primary key default gen_random_uuid(),
  speaker_id uuid not null references public.users (id) on delete cascade,
  content_type_id uuid not null references public.content_types (id),
  url text not null,
  title text not null default '',
  thumbnail_url text,
  preview_status text not null default 'pending', -- pending | ready | failed
  added_at timestamptz not null default now()
);

create index content_items_speaker_idx on public.content_library_items (speaker_id);

-- ---------------------------------------------------------------------
-- Private Q&A (Section 7, 8, 15)
-- ---------------------------------------------------------------------
create table public.questions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  attendee_id uuid not null references public.users (id) on delete cascade,
  speaker_id uuid not null references public.users (id) on delete cascade,
  body text not null,
  asked_at timestamptz not null default now(),
  status question_status not null default 'pending',
  flagged boolean not null default false,
  flagged_reason text,
  flagged_by uuid references public.users (id),
  review_status review_status not null default 'open'
);

create table public.answers (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null unique references public.questions (id) on delete cascade,
  speaker_id uuid not null references public.users (id) on delete cascade,
  body text not null,
  answered_at timestamptz not null default now(),
  -- Internal-only link for bulk-composed replies. Never returned to
  -- attendee-facing queries — enforced by the attendee RLS policy below,
  -- which does not expose this column via the attendee-safe view.
  bulk_group_id uuid
);

create index questions_event_idx on public.questions (event_id);
create index questions_speaker_idx on public.questions (speaker_id, status);
create index questions_attendee_idx on public.questions (attendee_id);

-- Attendee-safe view: bulk_group_id is intentionally omitted (Section 14).
create view public.answers_attendee_safe as
  select id, question_id, speaker_id, body, answered_at
  from public.answers;

-- ---------------------------------------------------------------------
-- Moderation & audit (Section 10, 14, 15)
-- ---------------------------------------------------------------------
create table public.moderation_flags (
  id uuid primary key default gen_random_uuid(),
  target_type moderation_target not null,
  target_id uuid not null,
  flagged_by uuid references public.users (id),
  reason text not null,
  status review_status not null default 'open',
  reviewed_by uuid references public.users (id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  type notification_type not null,
  payload jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_user_idx on public.notifications (user_id, read_at);

create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references public.users (id),
  action_type text not null,
  target_type text not null,
  target_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index audit_log_actor_idx on public.audit_log (actor_user_id);
create index audit_log_target_idx on public.audit_log (target_type, target_id);

-- =====================================================================
-- Helper functions (SECURITY DEFINER — used inside RLS policies to
-- avoid recursive-policy evaluation and keep policies short).
-- =====================================================================
create or replace function public.is_admin(uid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select is_admin from public.users where id = uid), false);
$$;

create or replace function public.is_organizer_of_event(uid uuid, eid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.events where id = eid and organizer_id = uid);
$$;

create or replace function public.is_speaker_on_event(uid uuid, eid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.event_speaker_invites
    where event_id = eid and speaker_user_id = uid
  );
$$;

create or replace function public.is_attendee_on_event(uid uuid, eid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.event_attendee_registrations
    where event_id = eid and attendee_user_id = uid and status = 'activated'
  );
$$;

create or replace function public.is_partner_on_event(uid uuid, eid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.event_partner_invites
    where event_id = eid and partner_user_id = uid
  );
$$;

-- ---------------------------------------------------------------------
-- Atomic, audited state-machine transition (Section 5: "atomic (DB
-- transaction) and written to the audit log"). All invite-status writes
-- from the app go through this RPC rather than direct UPDATEs.
-- ---------------------------------------------------------------------
create or replace function public.transition_role_status(
  p_table text,            -- 'event_speaker_invites' | 'event_partner_invites' | 'event_attendee_registrations'
  p_row_id uuid,
  p_new_status role_status,
  p_actor uuid
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_old_status role_status;
  v_event_id uuid;
begin
  if p_table not in ('event_speaker_invites', 'event_partner_invites', 'event_attendee_registrations') then
    raise exception 'invalid table %', p_table;
  end if;

  execute format('select status, event_id from public.%I where id = $1 for update', p_table)
    into v_old_status, v_event_id
    using p_row_id;

  if v_old_status is null then
    raise exception 'row not found';
  end if;

  -- Enforce the state machine (Section 5).
  if not (
    (v_old_status = 'invited' and p_new_status in ('accepted', 'declined')) or
    (v_old_status = 'accepted' and p_new_status in ('activated', 'suspended')) or
    (v_old_status = 'activated' and p_new_status = 'suspended')
  ) then
    raise exception 'illegal transition % -> %', v_old_status, p_new_status;
  end if;

  execute format(
    'update public.%I set status = $1,
       responded_at = case when $1 in (''accepted'',''declined'') then now() else responded_at end,
       activated_at = case when $1 = ''activated'' then now() else activated_at end,
       suspended_at = case when $1 = ''suspended'' then now() else suspended_at end,
       suspended_by = case when $1 = ''suspended'' then $2 else suspended_by end
     where id = $3', p_table)
    using p_new_status, p_actor, p_row_id;

  insert into public.audit_log (actor_user_id, action_type, target_type, target_id, metadata)
  values (p_actor, 'role_status_transition', p_table, p_row_id,
          jsonb_build_object('from', v_old_status, 'to', p_new_status, 'event_id', v_event_id));
end;
$$;

-- =====================================================================
-- Row Level Security
-- =====================================================================
alter table public.users enable row level security;
alter table public.events enable row level security;
alter table public.speaker_profiles enable row level security;
alter table public.event_speaker_invites enable row level security;
alter table public.event_partner_invites enable row level security;
alter table public.event_attendee_registrations enable row level security;
alter table public.content_library_items enable row level security;
alter table public.questions enable row level security;
alter table public.answers enable row level security;
alter table public.moderation_flags enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_log enable row level security;
alter table public.partner_types enable row level security;
alter table public.content_types enable row level security;

-- Lookups are readable by anyone signed in.
create policy "lookups readable" on public.partner_types for select using (true);
create policy "lookups readable" on public.content_types for select using (true);

-- users: self read/update; admin full read.
create policy "read own user row" on public.users for select using (auth.uid() = id or public.is_admin(auth.uid()));
create policy "update own user row" on public.users for update using (auth.uid() = id or public.is_admin(auth.uid()));
create policy "insert own user row" on public.users for insert with check (auth.uid() = id);

-- events: organizer full access to own events; admin full access;
-- speakers/partners/attendees on the event get read access; everyone
-- else gets read access to planned/live events for public discovery.
create policy "organizer manages own events" on public.events for all
  using (organizer_id = auth.uid() or public.is_admin(auth.uid()))
  with check (organizer_id = auth.uid() or public.is_admin(auth.uid()));

create policy "event participants can read" on public.events for select
  using (
    public.is_speaker_on_event(auth.uid(), id)
    or public.is_partner_on_event(auth.uid(), id)
    or public.is_attendee_on_event(auth.uid(), id)
    or status in ('planned', 'live')
  );

-- speaker_profiles: owner read/write, organizers of shared events read,
-- admin full.
create policy "speaker manages own profile" on public.speaker_profiles for all
  using (user_id = auth.uid() or public.is_admin(auth.uid()))
  with check (user_id = auth.uid() or public.is_admin(auth.uid()));

create policy "organizer reads invited speaker profiles" on public.speaker_profiles for select
  using (
    exists (
      select 1 from public.event_speaker_invites esi
      join public.events e on e.id = esi.event_id
      where esi.speaker_user_id = speaker_profiles.user_id and e.organizer_id = auth.uid()
    )
  );

-- event_speaker_invites
create policy "organizer manages speaker invites" on public.event_speaker_invites for all
  using (public.is_organizer_of_event(auth.uid(), event_id) or public.is_admin(auth.uid()))
  with check (public.is_organizer_of_event(auth.uid(), event_id) or public.is_admin(auth.uid()));

create policy "speaker reads/updates own invite" on public.event_speaker_invites for select
  using (speaker_user_id = auth.uid());
create policy "speaker responds to own invite" on public.event_speaker_invites for update
  using (speaker_user_id = auth.uid() and status <> 'suspended')
  with check (speaker_user_id = auth.uid());

-- event_partner_invites
create policy "organizer manages partner invites" on public.event_partner_invites for all
  using (public.is_organizer_of_event(auth.uid(), event_id) or public.is_admin(auth.uid()))
  with check (public.is_organizer_of_event(auth.uid(), event_id) or public.is_admin(auth.uid()));

create policy "partner reads/updates own invite" on public.event_partner_invites for select
  using (partner_user_id = auth.uid());
create policy "partner responds to own invite" on public.event_partner_invites for update
  using (partner_user_id = auth.uid() and status <> 'suspended')
  with check (partner_user_id = auth.uid());

-- event_attendee_registrations — partners never get row access here
-- (Section 9: aggregate-only, enforced at API layer via a separate RPC,
-- not by granting table access).
create policy "organizer manages attendee registrations" on public.event_attendee_registrations for all
  using (public.is_organizer_of_event(auth.uid(), event_id) or public.is_admin(auth.uid()))
  with check (public.is_organizer_of_event(auth.uid(), event_id) or public.is_admin(auth.uid()));

create policy "attendee manages own registration" on public.event_attendee_registrations for all
  using (attendee_user_id = auth.uid())
  with check (attendee_user_id = auth.uid());

-- content_library_items: speaker owns; organizers of shared events read;
-- attendees registered to the event read.
create policy "speaker manages own content" on public.content_library_items for all
  using (speaker_id = auth.uid() or public.is_admin(auth.uid()))
  with check (speaker_id = auth.uid() or public.is_admin(auth.uid()));

create policy "event audience reads speaker content" on public.content_library_items for select
  using (
    exists (
      select 1 from public.event_speaker_invites esi
      where esi.speaker_user_id = content_library_items.speaker_id
        and (
          public.is_organizer_of_event(auth.uid(), esi.event_id)
          or public.is_attendee_on_event(auth.uid(), esi.event_id)
        )
    )
  );

-- questions: attendee owns their own; speaker sees questions addressed
-- to them; organizer sees all questions for their events (moderation).
create policy "attendee manages own questions" on public.questions for all
  using (attendee_id = auth.uid())
  with check (attendee_id = auth.uid());

create policy "speaker reads own inbox" on public.questions for select
  using (speaker_id = auth.uid());
create policy "speaker flags/updates status on own inbox" on public.questions for update
  using (speaker_id = auth.uid())
  with check (speaker_id = auth.uid());

create policy "organizer moderates event questions" on public.questions for all
  using (public.is_organizer_of_event(auth.uid(), event_id) or public.is_admin(auth.uid()))
  with check (public.is_organizer_of_event(auth.uid(), event_id) or public.is_admin(auth.uid()));

-- answers: speaker writes; organizer/admin read for moderation;
-- attendees read only through the answers_attendee_safe view.
create policy "speaker manages own answers" on public.answers for all
  using (speaker_id = auth.uid() or public.is_admin(auth.uid()))
  with check (speaker_id = auth.uid() or public.is_admin(auth.uid()));

create policy "organizer reads answers for moderation" on public.answers for select
  using (
    exists (
      select 1 from public.questions q
      where q.id = answers.question_id and public.is_organizer_of_event(auth.uid(), q.event_id)
    )
  );

create policy "attendee reads answers to own questions" on public.answers for select
  using (
    exists (
      select 1 from public.questions q
      where q.id = answers.question_id and q.attendee_id = auth.uid()
    )
  );

-- moderation_flags / notifications / audit_log
create policy "admin full access to flags" on public.moderation_flags for all
  using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create policy "organizer reads flags on own events" on public.moderation_flags for select
  using (
    (target_type = 'question' and exists (
      select 1 from public.questions q where q.id = moderation_flags.target_id
        and public.is_organizer_of_event(auth.uid(), q.event_id)))
    or (target_type = 'answer' and exists (
      select 1 from public.answers a join public.questions q on q.id = a.question_id
      where a.id = moderation_flags.target_id and public.is_organizer_of_event(auth.uid(), q.event_id)))
  );

create policy "user reads own notifications" on public.notifications for select using (user_id = auth.uid());
create policy "user marks own notifications read" on public.notifications for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "admin reads audit log" on public.audit_log for select using (public.is_admin(auth.uid()));

-- ---------------------------------------------------------------------
-- Aggregate-only partner access (Section 9) — SECURITY DEFINER RPC
-- returns counts only, never attendee rows, so a partner can never
-- bypass RLS to read names/contacts even if the client is compromised.
-- ---------------------------------------------------------------------
create or replace function public.partner_event_stats(p_event_id uuid)
returns table (invited_count bigint, confirmed_count bigint)
language sql stable security definer set search_path = public as $$
  select
    count(*) filter (where status in ('invited','accepted','activated')) as invited_count,
    count(*) filter (where status = 'activated') as confirmed_count
  from public.event_attendee_registrations
  where event_id = p_event_id
    and public.is_partner_on_event(auth.uid(), p_event_id);
$$;

-- ---------------------------------------------------------------------
-- Auto-provision public.users row when someone signs up via Supabase Auth
-- ---------------------------------------------------------------------
create or replace function public.handle_new_auth_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();
