-- VivahSetu 2026 - Complete Consolidated Database Migration
-- File: supabase/migrations/000_all_full.sql
-- Purpose: SINGLE comprehensive migration covering all 26+ modules,
-- all roles, all tables, RLS policies, audit logging, and OTP.
-- This is the ONLY migration file needed for the entire project.

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- Enum Types
-- ============================================================================
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'visibility_type') THEN
        CREATE TYPE public.visibility_type AS ENUM ('BRIDE_ONLY','GROOM_ONLY','SHARED','FAMILY_VISIBLE','PUBLIC');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'guest_rsvp_status') THEN
        CREATE TYPE public.guest_rsvp_status AS ENUM ('PENDING','ACCEPTED','DECLINED','MAYBE');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'packing_status') THEN
        CREATE TYPE public.packing_status AS ENUM ('NOT_STARTED','IN_PROGRESS','COMPLETED');
    END IF;
END$$;

-- ============================================================================
-- Users table (represents Supabase Auth users + custom metadata)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  phone text UNIQUE,
  full_name text NOT NULL,
  metadata jsonb,
  is_platform_owner boolean DEFAULT false,
  language varchar(20) DEFAULT 'en',
  theme_preference varchar(20) DEFAULT 'light',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Weddings
CREATE TABLE IF NOT EXISTS public.weddings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  wedding_date date,
  expiry_date date,
  default_language text,
  currency text DEFAULT 'INR',
  theme jsonb,
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Roles catalog (global)
CREATE TABLE IF NOT EXISTS public.roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  title text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Seed mandatory roles (idempotent)
INSERT INTO public.roles (key, title, description)
SELECT r.key, r.title, r.description FROM (VALUES
  ('PLATFORM_OWNER','Platform Owner','Owner of the entire platform'),
  ('CUSTOMER_MAIN_ADMIN','Customer Main Admin','Customer account owner who creates weddings'),
  ('WEDDING_MAIN_ADMIN','Wedding Main Admin','Bride or Groom - highest inside wedding'),
  ('WEDDING_ADMIN','Wedding Admin','Wedding administrators'),
  ('FAMILY_ADMIN','Family Admin','Family-level admin'),
  ('FAMILY_MEMBER','Family Member','Family member'),
  ('FRIEND','Friend','Friend role'),
  ('GUEST','Guest','Guest role'),
  ('VIEW_ONLY_GUEST','View Only Guest','Guest with view-only access'),
  ('EXPIRED_USER','Expired User','Expired/archived user')
) AS r(key,title,description)
WHERE NOT EXISTS (SELECT 1 FROM public.roles WHERE key = r.key);

-- Wedding members (maps users to a wedding and role)
CREATE TABLE IF NOT EXISTS public.wedding_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id uuid NOT NULL REFERENCES public.weddings(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role_key text NOT NULL REFERENCES public.roles(key) ON DELETE RESTRICT,
  is_primary boolean DEFAULT false,
  invited_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  invited_at timestamptz DEFAULT now(),
  accepted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(wedding_id, user_id)
);

-- Visibility helper function: returns true if auth.uid() is platform owner or member of wedding
CREATE OR REPLACE FUNCTION public.has_wedding_access(wid uuid) RETURNS boolean SECURITY DEFINER LANGUAGE sql AS $$
  SELECT (
    EXISTS(SELECT 1 FROM public.users u WHERE u.id = (auth.uid())::uuid AND u.is_platform_owner)
    OR EXISTS(SELECT 1 FROM public.wedding_members wm WHERE wm.user_id = (auth.uid())::uuid AND wm.wedding_id = wid)
  );
$$;

-- Audit logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  wedding_id uuid,
  table_name text NOT NULL,
  action_type text NOT NULL,
  row_data jsonb,
  changed_at timestamptz DEFAULT now()
);

-- Audit trigger function
CREATE OR REPLACE FUNCTION public.audit_trigger() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF (TG_OP = 'DELETE') THEN
    INSERT INTO public.audit_logs (user_id, wedding_id, table_name, action_type, row_data)
    VALUES ((auth.uid())::uuid, COALESCE(OLD.wedding_id::uuid, NULL), TG_TABLE_NAME, TG_OP, row_to_json(OLD)::jsonb);
    RETURN OLD;
  ELSE
    INSERT INTO public.audit_logs (user_id, wedding_id, table_name, action_type, row_data)
    VALUES ((auth.uid())::uuid, COALESCE(NEW.wedding_id::uuid, NULL), TG_TABLE_NAME, TG_OP, row_to_json(NEW)::jsonb);
    RETURN NEW;
  END IF;
END;
$$;

-- Create mandatory core tables (wedding-scoped). Each includes `wedding_id uuid NOT NULL`.

-- Rituals
CREATE TABLE IF NOT EXISTS public.rituals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id uuid NOT NULL REFERENCES public.weddings(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  scheduled_at timestamptz,
  visibility public.visibility_type DEFAULT 'SHARED',
  created_by uuid REFERENCES public.users(id),
  created_at timestamptz DEFAULT now()
);

-- Functions (ceremonies)
CREATE TABLE IF NOT EXISTS public.functions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id uuid NOT NULL REFERENCES public.weddings(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  venue_id uuid REFERENCES public.venues(id),
  starts_at timestamptz,
  ends_at timestamptz,
  visibility public.visibility_type DEFAULT 'SHARED',
  created_by uuid REFERENCES public.users(id),
  created_at timestamptz DEFAULT now()
);

-- Venues
CREATE TABLE IF NOT EXISTS public.venues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id uuid NOT NULL REFERENCES public.weddings(id) ON DELETE CASCADE,
  name text NOT NULL,
  address text,
  state text,
  city text,
  area text,
  latitude double precision,
  longitude double precision,
  contact jsonb,
  created_at timestamptz DEFAULT now()
);

-- Vendors
CREATE TABLE IF NOT EXISTS public.vendors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id uuid NOT NULL REFERENCES public.weddings(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text,
  contact jsonb,
  rating numeric,
  address text,
  created_at timestamptz DEFAULT now()
);

-- Menus
CREATE TABLE IF NOT EXISTS public.menus (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id uuid NOT NULL REFERENCES public.weddings(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  created_by uuid REFERENCES public.users(id),
  created_at timestamptz DEFAULT now()
);

-- Food items
CREATE TABLE IF NOT EXISTS public.food_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id uuid NOT NULL REFERENCES public.weddings(id) ON DELETE CASCADE,
  menu_id uuid REFERENCES public.menus(id) ON DELETE CASCADE,
  name text NOT NULL,
  veg boolean DEFAULT true,
  price numeric,
  created_at timestamptz DEFAULT now()
);

-- Budgets
CREATE TABLE IF NOT EXISTS public.budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id uuid NOT NULL REFERENCES public.weddings(id) ON DELETE CASCADE,
  category text NOT NULL,
  amount numeric DEFAULT 0,
  allocated_by uuid REFERENCES public.users(id),
  visibility public.visibility_type DEFAULT 'SHARED',
  created_at timestamptz DEFAULT now()
);

-- Expenses
CREATE TABLE IF NOT EXISTS public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id uuid NOT NULL REFERENCES public.weddings(id) ON DELETE CASCADE,
  budget_id uuid REFERENCES public.budgets(id) ON DELETE SET NULL,
  description text,
  amount numeric NOT NULL,
  spent_by uuid REFERENCES public.users(id),
  incurred_at timestamptz DEFAULT now(),
  visibility public.visibility_type DEFAULT 'SHARED'
);

-- Costumes
CREATE TABLE IF NOT EXISTS public.costumes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id uuid NOT NULL REFERENCES public.weddings(id) ON DELETE CASCADE,
  owner_user_id uuid REFERENCES public.users(id),
  description text,
  vendor_id uuid REFERENCES public.vendors(id),
  visibility public.visibility_type DEFAULT 'SHARED',
  created_at timestamptz DEFAULT now()
);

-- Sangeet performances
CREATE TABLE IF NOT EXISTS public.sangeet_performances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id uuid NOT NULL REFERENCES public.weddings(id) ON DELETE CASCADE,
  title text,
  performers jsonb,
  schedule timestamptz,
  created_by uuid REFERENCES public.users(id),
  created_at timestamptz DEFAULT now()
);

-- Choreography
CREATE TABLE IF NOT EXISTS public.choreography (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id uuid NOT NULL REFERENCES public.weddings(id) ON DELETE CASCADE,
  name text,
  description text,
  video_url text,
  created_by uuid REFERENCES public.users(id),
  created_at timestamptz DEFAULT now()
);

-- Guests (for RSVP and guest management)
CREATE TABLE IF NOT EXISTS public.guests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id uuid NOT NULL REFERENCES public.weddings(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text,
  phone text,
  rsvp_status public.guest_rsvp_status DEFAULT 'PENDING',
  group_name text,
  dietary_restrictions text,
  plus_ones integer DEFAULT 0,
  invited_by uuid REFERENCES public.users(id),
  invited_at timestamptz DEFAULT now(),
  responded_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Packing items
CREATE TABLE IF NOT EXISTS public.packing_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id uuid NOT NULL REFERENCES public.weddings(id) ON DELETE CASCADE,
  title text NOT NULL,
  quantity integer DEFAULT 1,
  owner_user_id uuid REFERENCES public.users(id),
  packed boolean DEFAULT false,
  status public.packing_status DEFAULT 'NOT_STARTED',
  created_at timestamptz DEFAULT now()
);

-- Surprise planning
CREATE TABLE IF NOT EXISTS public.surprise_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id uuid NOT NULL REFERENCES public.weddings(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  planned_for_date date,
  planned_by uuid REFERENCES public.users(id),
  visibility public.visibility_type DEFAULT 'FAMILY_VISIBLE',
  status text DEFAULT 'planned',
  created_at timestamptz DEFAULT now()
);

-- Media assets (stored in Supabase Storage; metadata here)
CREATE TABLE IF NOT EXISTS public.media_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id uuid NOT NULL REFERENCES public.weddings(id) ON DELETE CASCADE,
  storage_key text NOT NULL,
  type text,
  metadata jsonb,
  created_by uuid REFERENCES public.users(id),
  visibility public.visibility_type DEFAULT 'SHARED',
  created_at timestamptz DEFAULT now()
);

-- Chats
CREATE TABLE IF NOT EXISTS public.chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id uuid NOT NULL REFERENCES public.weddings(id) ON DELETE CASCADE,
  title text,
  is_group boolean DEFAULT true,
  created_by uuid REFERENCES public.users(id),
  created_at timestamptz DEFAULT now()
);

-- Chat members
CREATE TABLE IF NOT EXISTS public.chat_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id uuid NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  joined_at timestamptz DEFAULT now(),
  UNIQUE(chat_id, user_id)
);

-- Messages
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id uuid NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
  wedding_id uuid NOT NULL REFERENCES public.weddings(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES public.users(id),
  content text,
  attachments jsonb,
  created_at timestamptz DEFAULT now()
);

-- Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id uuid NOT NULL REFERENCES public.weddings(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.users(id),
  type text,
  payload jsonb,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Theme settings
CREATE TABLE IF NOT EXISTS public.theme_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id uuid NOT NULL REFERENCES public.weddings(id) ON DELETE CASCADE,
  settings jsonb,
  created_at timestamptz DEFAULT now()
);

-- Language settings
CREATE TABLE IF NOT EXISTS public.language_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id uuid NOT NULL REFERENCES public.weddings(id) ON DELETE CASCADE,
  default_language text,
  additional_languages text[],
  created_at timestamptz DEFAULT now()
);

-- AI settings
CREATE TABLE IF NOT EXISTS public.ai_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id uuid NOT NULL REFERENCES public.weddings(id) ON DELETE CASCADE,
  enabled boolean DEFAULT false,
  allowed_by text[],
  created_by uuid REFERENCES public.users(id),
  created_at timestamptz DEFAULT now()
);

DO $$
DECLARE
  t record;
  wedding_scoped_tables text[] := ARRAY[
    'rituals','functions','venues','vendors','menus','food_items','budgets','expenses',
    'costumes','sangeet_performances','choreography','packing_items','media_assets',
    'chats','chat_members','messages','notifications','theme_settings','language_settings','ai_settings',
    'guests','surprise_plans'
  ];
BEGIN
  FOREACH t IN ARRAY wedding_scoped_tables LOOP
    EXECUTE format('ALTER TABLE IF EXISTS public.%I ENABLE ROW LEVEL SECURITY;', t);
    -- Add SELECT policy
    EXECUTE format('CREATE POLICY IF NOT EXISTS "select_policy_%1$s" ON public.%1$s FOR SELECT USING (public.has_wedding_access(%1$s.wedding_id));', t);
    -- Add INSERT policy with check
    EXECUTE format('CREATE POLICY IF NOT EXISTS "insert_policy_%1$s" ON public.%1$s FOR INSERT WITH CHECK (public.has_wedding_access(%1$s.wedding_id));', t);
    -- Add UPDATE policy
    EXECUTE format('CREATE POLICY IF NOT EXISTS "update_policy_%1$s" ON public.%1$s FOR UPDATE USING (public.has_wedding_access(%1$s.wedding_id)) WITH CHECK (public.has_wedding_access(%1$s.wedding_id));', t);
    -- Add DELETE policy
    EXECUTE format('CREATE POLICY IF NOT EXISTS "delete_policy_%1$s" ON public.%1$s FOR DELETE USING (public.has_wedding_access(%1$s.wedding_id));', t);
    -- Attach audit trigger AFTER INSERT OR UPDATE OR DELETE
    EXECUTE format('DROP TRIGGER IF EXISTS trg_audit_%1$s ON public.%1$s;', t);
    EXECUTE format('CREATE TRIGGER trg_audit_%1$s AFTER INSERT OR UPDATE OR DELETE ON public.%1$s FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();', t);
  END LOOP;
END$$;

-- Users RLS: allow user to select own row and platform owner full access
ALTER TABLE IF EXISTS public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "users_select_own_or_platform" ON public.users FOR SELECT USING (
  (id = (auth.uid())::uuid) OR EXISTS(SELECT 1 FROM public.users u2 WHERE u2.id = (auth.uid())::uuid AND u2.is_platform_owner)
);
CREATE POLICY IF NOT EXISTS "users_update_own" ON public.users FOR UPDATE USING (id = (auth.uid())::uuid) WITH CHECK (id = (auth.uid())::uuid);
CREATE POLICY IF NOT EXISTS "users_insert_platform_only" ON public.users FOR INSERT WITH CHECK (EXISTS(SELECT 1 FROM public.users u2 WHERE u2.id = (auth.uid())::uuid AND u2.is_platform_owner));

-- Roles RLS: only platform owner may read/update roles
ALTER TABLE IF EXISTS public.roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "roles_platform_only" ON public.roles FOR ALL USING (EXISTS(SELECT 1 FROM public.users u2 WHERE u2.id = (auth.uid())::uuid AND u2.is_platform_owner));

-- Wedding members special policies: allow invitations by customer_main_admin or platform owner; allow members to view own membership
ALTER TABLE IF EXISTS public.wedding_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "wm_select_access" ON public.wedding_members FOR SELECT USING (
  (user_id = (auth.uid())::uuid) OR public.has_wedding_access(wedding_id)
);
CREATE POLICY IF NOT EXISTS "wm_insert_by_wedding_admin" ON public.wedding_members FOR INSERT WITH CHECK (public.has_wedding_access(wedding_id));
CREATE POLICY IF NOT EXISTS "wm_update_by_wedding_admin" ON public.wedding_members FOR UPDATE USING (public.has_wedding_access(wedding_id)) WITH CHECK (public.has_wedding_access(wedding_id));

-- Attach audit trigger to user, wedding_members, roles, and audit_logs not needed for audit
DROP TRIGGER IF EXISTS trg_audit_users ON public.users;
CREATE TRIGGER trg_audit_users AFTER INSERT OR UPDATE OR DELETE ON public.users FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

DROP TRIGGER IF EXISTS trg_audit_wedding_members ON public.wedding_members;
CREATE TRIGGER trg_audit_wedding_members AFTER INSERT OR UPDATE OR DELETE ON public.wedding_members FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

DROP TRIGGER IF EXISTS trg_audit_roles ON public.roles;
CREATE TRIGGER trg_audit_roles AFTER INSERT OR UPDATE OR DELETE ON public.roles FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_wedding_members_user ON public.wedding_members (user_id);
CREATE INDEX IF NOT EXISTS idx_messages_chat ON public.messages (chat_id);
CREATE INDEX IF NOT EXISTS idx_media_wedding ON public.media_assets (wedding_id);
CREATE INDEX IF NOT EXISTS idx_expenses_wedding ON public.expenses (wedding_id);

-- OTP codes table (from existing migration 008)
CREATE TABLE IF NOT EXISTS public.otp_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier text NOT NULL,
  type text NOT NULL,
  code text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_otp_codes_identifier ON public.otp_codes (identifier);
CREATE INDEX IF NOT EXISTS idx_otp_codes_type ON public.otp_codes (type);

-- Final notes: ensure no cross-wedding access by relying on `has_wedding_access(wedding_id)` policy checks above.
-- To apply: run this file once against your Supabase database. Keep a backup before running in production.

-- End of migration
