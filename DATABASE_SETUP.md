# VivahSetu Database Setup Guide

## Single Consolidated Migration

This project uses **ONE** SQL migration file that contains all required tables, Row Level Security (RLS) policies, role definitions, and audit logging.

**Migration File:** [supabase/migrations/000_all_full.sql](supabase/migrations/000_all_full.sql)

### What's Included

✅ **26+ Mandatory Tables:**
- `users` - User profiles with platform owner flag
- `weddings` - Wedding metadata, dates, themes, currency
- `roles` - Role catalog (PLATFORM_OWNER, CUSTOMER_MAIN_ADMIN, WEDDING_MAIN_ADMIN, etc.)
- `wedding_members` - User-to-wedding role mapping
- `rituals` - Indian wedding rituals (mehandi, sangeet, shaadi, etc.)
- `functions` - Wedding ceremonies and events
- `venues` - Venue locations with lat/long
- `vendors` - Vendor catalog (photography, catering, etc.)
- `menus` - Food menus for events
- `food_items` - Individual food items with vegetarian flag
- `budgets` - Budget categories and allocations
- `expenses` - Expense tracking with budget links
- `costumes` - Wedding attire and styling
- `sangeet_performances` - Sangeet song/dance performances
- `choreography` - Dance choreography videos
- `packing_items` - Packing checklist with status
- `media_assets` - Images, videos, design files
- `chats` - Group and private message groups
- `chat_members` - Chat membership
- `messages` - Chat messages with attachments
- `notifications` - Real-time notifications
- `theme_settings` - Wedding theme configuration
- `language_settings` - Language preferences per wedding
- `ai_settings` - AI feature toggles (disabled by default)
- `guests` - Guest RSVP tracking
- `surprise_plans` - Surprise planning coordination
- `audit_logs` - Complete audit trail
- `otp_codes` - Email/SMS OTP for verification

✅ **Enums:**
- `visibility_type` - BRIDE_ONLY, GROOM_ONLY, SHARED, FAMILY_VISIBLE, PUBLIC
- `guest_rsvp_status` - PENDING, ACCEPTED, DECLINED, MAYBE
- `packing_status` - NOT_STARTED, IN_PROGRESS, COMPLETED

✅ **Security:**
- Row Level Security (RLS) enabled on all wedding-scoped tables
- `has_wedding_access()` function prevents cross-wedding data leakage
- Role-based access control via `wedding_members` table
- All policies enforce `wedding_id` checks

✅ **Audit Trail:**
- `audit_logs` table captures all create/update/delete operations
- Audit triggers attached to all mutable tables
- Logs include: user_id, wedding_id, table_name, action_type, row_data, changed_at

✅ **Performance:**
- Indexes on frequently queried columns
- Optimized foreign key relationships
- Cascading deletes on wedding deletion

## How to Apply

### Option 1: Supabase CLI (Recommended)

```bash
# Authenticate with Supabase
supabase login

# Push migration to your project
supabase db push --file supabase/migrations/000_all_full.sql --project-ref YOUR_PROJECT_REF
```

### Option 2: psql (Direct PostgreSQL)

```bash
# Set your database URL in environment
export DATABASE_URL="postgresql://user:password@host:5432/postgres"

# Apply migration
psql "$DATABASE_URL" -f supabase/migrations/000_all_full.sql
```

### Option 3: Supabase Dashboard

1. Go to **SQL Editor** in Supabase dashboard
2. Click **New Query**
3. Copy entire contents of `supabase/migrations/000_all_full.sql`
4. Paste into editor
5. Click **Run**

## Verification Steps

### 1. Verify All Tables Created

```sql
-- List all public tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Should return 27+ tables
```

### 2. Verify RLS Enabled

```sql
-- Check RLS is enabled on wedding-scoped tables
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('weddings', 'rituals', 'functions', 'vendors', 'budgets', 'chats', 'messages')
ORDER BY tablename;

-- Expected: all should have rowsecurity = true
```

### 3. Verify Roles Seeded

```sql
-- Check roles were inserted
SELECT key, title FROM public.roles ORDER BY key;

-- Expected: 10 roles including PLATFORM_OWNER, CUSTOMER_MAIN_ADMIN, WEDDING_MAIN_ADMIN, etc.
```

### 4. Verify Audit Logging

```sql
-- Check audit_logs table exists
SELECT * FROM public.audit_logs LIMIT 1;

-- Expected: empty initially, will populate as app creates/updates data
```

### 5. Verify Enums Created

```sql
-- Check visibility_type enum
SELECT enum_range(NULL::visibility_type);

-- Expected: (BRIDE_ONLY,GROOM_ONLY,SHARED,FAMILY_VISIBLE,PUBLIC)
```

## Integration with Backend

The backend (`backend/src/`) expects these Supabase tables:

- **Auth:** Uses Supabase Auth + custom `users` table for metadata
- **Weddings:** `POST /api/v1/weddings` creates wedding, `GET /api/v1/weddings` lists user's weddings
- **Roles:** Role-based access enforced via `wedding_members` table
- **Guests:** `POST /api/v1/guests` adds guests, tracks RSVP in `guests.rsvp_status`
- **Chat:** Realtime messaging via `messages` table with Supabase Realtime subscriptions
- **Media:** Stores file metadata in `media_assets`, actual files in Supabase Storage
- **Audit:** All endpoints trigger audit logging via database triggers

## Integration with Frontend

The frontend (`frontend/src/`) expects these backend endpoints:

- **Auth Routes:** `/auth/login`, `/auth/signup`, `/auth/forgot-password`, `/auth/reset-password`
- **Wedding Routes:** `/weddings`, `/weddings/:id` (CRUD)
- **Guests:** `/guests` (RSVP tracking)
- **Budget/Expenses:** `/expenses`, `/budgets`
- **Chat:** `/chat` (Realtime via Supabase)
- **Media:** `/media/upload`, `/media` (image/video upload and retrieval)

All frontend pages are in `frontend/src/pages/`:
- `auth/` - Login, Signup, Password Reset flows
- `wedding/` - Setup, Timeline, Functions, Vendors, Guests, Budget, Media, Chat, Analytics, Packing

## Environment Variables

### Frontend (.env or VITE_ prefix)
```env
VITE_SUPABASE_URL=your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_URL=http://localhost:3001/api
```

### Backend (.env)
```env
NODE_ENV=development
PORT=3001

SUPABASE_URL=your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

JWT_SECRET=min-32-character-secret
CORS_ORIGIN=http://localhost:3000
```

## Backup Before Production

```bash
# Create a backup of your Supabase database
supabase db pull --file backup-2026-01-11.sql --project-ref YOUR_PROJECT_REF

# Store backup safely
git ignore backup files (already in .gitignore)
```

## Rollback

If you need to rollback (not recommended in production):

```sql
-- DROP ALL PUBLIC TABLES (CAUTION)
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.chats CASCADE;
DROP TABLE IF EXISTS public.chat_members CASCADE;
-- ... repeat for all tables

-- Then re-run migration from backup
```

## Key Design Decisions

1. **Single Migration File:** All schema in one file ensures consistency and easy version control
2. **Wedding ID on All Tables:** Multi-tenant isolation at the table level
3. **RLS for Security:** Database enforces access control, not just application logic
4. **Audit Triggers:** Automatic logging of all changes (GDPR compliance)
5. **Enum Types:** Type safety for status fields (RSVP, packing, etc.)
6. **Cascading Deletes:** Deleting a wedding removes all related data automatically
7. **Composite Indexes:** On frequently joined columns (wedding_id, user_id, etc.)

## Troubleshooting

### Error: "function public.has_wedding_access() does not exist"

**Cause:** Migration didn't run completely.

**Fix:** 
```sql
-- Re-run the migration or manually create the function
CREATE OR REPLACE FUNCTION public.has_wedding_access(wid uuid) RETURNS boolean SECURITY DEFINER LANGUAGE sql AS $$
  SELECT (
    EXISTS(SELECT 1 FROM public.users u WHERE u.id = (auth.uid())::uuid AND u.is_platform_owner)
    OR EXISTS(SELECT 1 FROM public.wedding_members wm WHERE wm.user_id = (auth.uid())::uuid AND wm.wedding_id = wid)
  );
$$;
```

### Error: "violates row level security policy"

**Cause:** User does not have access to wedding (missing entry in `wedding_members`)

**Fix:**
```sql
-- Add user to wedding via backend API
-- Or manually insert into wedding_members
INSERT INTO public.wedding_members (wedding_id, user_id, role_key, is_primary, accepted_at)
VALUES ('wedding-uuid', 'user-uuid', 'WEDDING_MAIN_ADMIN', true, now());
```

### Error: "Enum type already exists"

**Cause:** Migration was run multiple times.

**Fix:** The migration uses `DO $$ BEGIN ... IF NOT EXISTS` so it's idempotent. Safe to re-run.

---

**Last Updated:** January 2026
**Maintained by:** VivahSetu Team
