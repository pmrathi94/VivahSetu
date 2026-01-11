-- 008_create_otp_codes.sql
-- Create otp_codes table for storing one-time codes used for verification and password resets

CREATE TABLE IF NOT EXISTS public.otp_codes (
  id uuid PRIMARY KEY,
  identifier text NOT NULL,
  type text NOT NULL,
  code text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_otp_codes_identifier ON public.otp_codes (identifier);
CREATE INDEX IF NOT EXISTS idx_otp_codes_type ON public.otp_codes (type);
