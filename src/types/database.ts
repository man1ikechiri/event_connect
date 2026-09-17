// Minimal hand-written types matching supabase/migrations/0001_init.sql.
// Run `npm run db:types` once your Supabase project is live to replace
// this with the fully generated version (keeps every column/enum in sync).

export type RoleStatus = "invited" | "accepted" | "declined" | "activated" | "suspended";
export type EventStatus = "planned" | "live" | "completed" | "cancelled";
export type QuestionStatus = "pending" | "answered";
export type ReviewStatus = "open" | "reviewed" | "dismissed";

export interface UsersRow {
  id: string;
  email: string;
  phone: string | null;
  full_name: string;
  avatar_url: string | null;
  is_admin: boolean;
  organizer_status: "none" | "pending" | "approved" | "suspended";
  created_at: string;
  updated_at: string;
}

export interface EventsRow {
  id: string;
  organizer_id: string;
  title: string;
  description: string;
  venue_label: string;
  is_virtual: boolean;
  virtual_link: string | null;
  start_datetime: string;
  end_datetime: string;
  capacity: number | null;
  status: EventStatus;
  status_override: EventStatus | null;
  created_at: string;
  updated_at: string;
}

export interface SpeakerProfilesRow {
  user_id: string;
  professional_title: string;
  company: string;
  linkedin_url: string | null;
  personal_website_url: string | null;
  updated_at: string;
}

export interface EventSpeakerInvitesRow {
  id: string;
  event_id: string;
  speaker_user_id: string;
  session_title: string;
  status: RoleStatus;
  invited_at: string;
  responded_at: string | null;
  activated_at: string | null;
  suspended_at: string | null;
  suspended_by: string | null;
}

export interface EventPartnerInvitesRow {
  id: string;
  event_id: string;
  partner_user_id: string;
  partner_type_id: string;
  org_name: string;
  logo_url: string | null;
  contact_email: string | null;
  status: RoleStatus;
  invited_at: string;
  responded_at: string | null;
  activated_at: string | null;
  suspended_at: string | null;
  suspended_by: string | null;
}

export interface EventAttendeeRegistrationsRow {
  id: string;
  event_id: string;
  attendee_user_id: string;
  organization_affiliation: string | null;
  status: RoleStatus;
  invited_by: string | null;
  registered_at: string;
  responded_at: string | null;
  activated_at: string | null;
  suspended_at: string | null;
  suspended_by: string | null;
}

export interface ContentTypesRow {
  id: string;
  slug: string;
  label: string;
  supports_rich_preview: boolean;
  sort_order: number;
}

export interface ContentLibraryItemsRow {
  id: string;
  speaker_id: string;
  content_type_id: string;
  url: string;
  title: string;
  thumbnail_url: string | null;
  preview_status: "pending" | "ready" | "failed";
  added_at: string;
}

export interface QuestionsRow {
  id: string;
  event_id: string;
  attendee_id: string;
  speaker_id: string;
  body: string;
  asked_at: string;
  status: QuestionStatus;
  flagged: boolean;
  flagged_reason: string | null;
  flagged_by: string | null;
  review_status: ReviewStatus;
}

export interface AnswersRow {
  id: string;
  question_id: string;
  speaker_id: string;
  body: string;
  answered_at: string;
  bulk_group_id: string | null;
}

export interface PartnerTypesRow {
  id: string;
  slug: string;
  label: string;
  sort_order: number;
}

export interface NotificationsRow {
  id: string;
  user_id: string;
  type: string;
  payload: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
}

export interface AuditLogRow {
  id: string;
  actor_user_id: string | null;
  action_type: string;
  target_type: string;
  target_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

// Generic shape so `@supabase/ssr` clients can be typed without needing
// the full generated schema for every table right away.
export interface Database {
  public: {
    Tables: {
      users: { Row: UsersRow; Insert: Partial<UsersRow>; Update: Partial<UsersRow> };
      events: { Row: EventsRow; Insert: Partial<EventsRow>; Update: Partial<EventsRow> };
      speaker_profiles: {
        Row: SpeakerProfilesRow;
        Insert: Partial<SpeakerProfilesRow>;
        Update: Partial<SpeakerProfilesRow>;
      };
      event_speaker_invites: {
        Row: EventSpeakerInvitesRow;
        Insert: Partial<EventSpeakerInvitesRow>;
        Update: Partial<EventSpeakerInvitesRow>;
      };
      event_partner_invites: {
        Row: EventPartnerInvitesRow;
        Insert: Partial<EventPartnerInvitesRow>;
        Update: Partial<EventPartnerInvitesRow>;
      };
      event_attendee_registrations: {
        Row: EventAttendeeRegistrationsRow;
        Insert: Partial<EventAttendeeRegistrationsRow>;
        Update: Partial<EventAttendeeRegistrationsRow>;
      };
      content_types: {
        Row: ContentTypesRow;
        Insert: Partial<ContentTypesRow>;
        Update: Partial<ContentTypesRow>;
      };
      content_library_items: {
        Row: ContentLibraryItemsRow;
        Insert: Partial<ContentLibraryItemsRow>;
        Update: Partial<ContentLibraryItemsRow>;
      };
      questions: { Row: QuestionsRow; Insert: Partial<QuestionsRow>; Update: Partial<QuestionsRow> };
      answers: { Row: AnswersRow; Insert: Partial<AnswersRow>; Update: Partial<AnswersRow> };
      partner_types: {
        Row: PartnerTypesRow;
        Insert: Partial<PartnerTypesRow>;
        Update: Partial<PartnerTypesRow>;
      };
      notifications: {
        Row: NotificationsRow;
        Insert: Partial<NotificationsRow>;
        Update: Partial<NotificationsRow>;
      };
      audit_log: { Row: AuditLogRow; Insert: Partial<AuditLogRow>; Update: Partial<AuditLogRow> };
    };
    Views: {
      answers_attendee_safe: {
        Row: Omit<AnswersRow, "bulk_group_id">;
      };
    };
    Functions: {
      transition_role_status: {
        Args: {
          p_table: string;
          p_row_id: string;
          p_new_status: RoleStatus;
          p_actor: string;
        };
        Returns: void;
      };
      partner_event_stats: {
        Args: { p_event_id: string };
        Returns: { invited_count: number; confirmed_count: number }[];
      };
      event_effective_status: {
        Args: { e: EventsRow };
        Returns: EventStatus;
      };
      lookup_user_id_by_email: {
        Args: { p_email: string };
        Returns: string;
      };
    };
  };
}
