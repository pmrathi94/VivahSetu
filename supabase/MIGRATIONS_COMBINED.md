



# VivahSetu 2026 - Database Migration

## Single Consolidated Migration

This project uses **ONE** consolidated migration file:

**File:** [supabase/migrations/000_all_full.sql](migrations/000_all_full.sql)

This file contains:
- All 26+ mandatory tables (users, weddings, roles, wedding_members, rituals, functions, venues, vendors, menus, budgets, expenses, chats, messages, media_assets, packing_items, guests, surprise_plans, audit_logs, otp_codes, etc.)
- All visibility types and enums (BRIDE_ONLY, GROOM_ONLY, SHARED, FAMILY_VISIBLE, PUBLIC, etc.)
- Complete Row Level Security (RLS) policies for all tables
- Role definitions and seeding (PLATFORM_OWNER, CUSTOMER_MAIN_ADMIN, WEDDING_MAIN_ADMIN, etc.)
- Wedding access control via `has_wedding_access()` function
- Audit logging triggers for all mutable tables
- Performance indexes on frequently accessed columns
- OTP codes table for password reset and email verification

## How to Apply

### Option 1: Using Supabase CLI (Recommended)

```bash
supabase db push --file supabase/migrations/000_all_full.sql --project-ref YOUR_PROJECT_REF
```

### Option 2: Using psql

```bash
psql "$DATABASE_URL" -f supabase/migrations/000_all_full.sql
```

### Option 3: Supabase Dashboard

1. Go to SQL Editor
2. Copy contents of `000_all_full.sql`
3. Paste and run

## Verification Steps

After applying the migration, verify the following:

```bash
# 1. Check that all tables exist
psql "$DATABASE_URL" -c "\dt public.*"

# 2. Verify RLS is enabled on wedding-scoped tables
psql "$DATABASE_URL" -c "SELECT schemaname, tablename FROM pg_tables WHERE schemaname='public' AND tablename IN ('weddings','rituals','functions','vendors','budgets','expenses','chats','messages');"

# 3. Check roles table was seeded
psql "$DATABASE_URL" -c "SELECT * FROM public.roles;"

# 4. Verify audit_logs table exists
psql "$DATABASE_URL" -c "SELECT * FROM public.audit_logs LIMIT 1;"
```

## Key Design Features

### Multi-Tenancy
- Every wedding-scoped table includes `wedding_id uuid NOT NULL`
- RLS prevents cross-wedding access automatically
- `has_wedding_access()` function validates user access before returning data

### Role-Based Access Control
- Roles are stored in `public.roles` with key/title pairs
- User role assignment happens via `public.wedding_members` table
- Policies enforce role-based visibility

### Audit Trail
- `public.audit_logs` captures all create/update/delete actions
- Triggers log: user_id, wedding_id, table_name, action_type, row_data, changed_at
- Enables compliance and debugging

### Visibility Flags
- Every sensitive table includes visibility enum: BRIDE_ONLY, GROOM_ONLY, SHARED, FAMILY_VISIBLE, PUBLIC
- Default is SHARED; Bride/Groom can toggle to private
- Application enforces visibility in queries

## Important Notes

- **Never modify** table structure or RLS policies after initial deployment
- **Always backup** before applying migrations to production
- **Schema changes** after this migration require data migration scripts
- Use Supabase Realtime subscriptions for live updates
- IndexedDB on frontend for offline caching

---

**Last Updated:** January 2026

