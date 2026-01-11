-- 000_all_migrations.sql
-- Runner script to apply all numbered migration files in order.
-- Usage (from repo root):
-- psql $DATABASE_URL -f supabase/migrations/000_all_migrations.sql

\i '005_complete_schema_consolidated.sql'
\i '006_complete_vivahsetu_schema.sql'
\i '007_vivahsetu_final_schema.sql'
\i '008_create_otp_codes.sql'

-- End of runner
