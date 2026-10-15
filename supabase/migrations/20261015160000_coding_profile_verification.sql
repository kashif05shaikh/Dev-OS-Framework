-- Migration: Coding Profiles Verification & Anti-Fake Data Protection
-- 1. Add verified_at column to coding_profiles
-- 2. Deduplicate existing duplicate profiles per (user_id, platform)
-- 3. Enforce 1 profile per platform per user via UNIQUE constraint
-- 4. Enforce 1 account per handle across users via partial UNIQUE index
-- 5. Create verification_challenges table with RLS and expiry

-- 1. Add verified_at timestamp column (NULL means unverified)
ALTER TABLE public.coding_profiles
  ADD COLUMN IF NOT EXISTS verified_at timestamp with time zone DEFAULT NULL;

COMMENT ON COLUMN public.coding_profiles.verified_at IS
  'Timestamp when platform ownership was verified via challenge code. NULL means unverified.';

-- 2. Deduplicate existing duplicate rows per (user_id, platform)
-- Keeps the row with the most recent last_synced_at (or oldest created_at if neither was synced), deleting all other duplicate rows.
DELETE FROM public.coding_profiles
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id, platform) id
  FROM public.coding_profiles
  ORDER BY user_id, platform, last_synced_at DESC NULLS LAST, created_at ASC
);

-- 3. Enforce strictly at most ONE profile per platform per user
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'coding_profiles_user_platform_uniq'
  ) THEN
    ALTER TABLE public.coding_profiles
      ADD CONSTRAINT coding_profiles_user_platform_uniq UNIQUE (user_id, platform);
  END IF;
END $$;

-- 4. Cross-account handle uniqueness for verified profiles:
-- Once a handle is verified by one user, no other user can verify the same handle on that platform.
CREATE UNIQUE INDEX IF NOT EXISTS coding_profiles_platform_handle_verified_idx
  ON public.coding_profiles (platform, lower(username))
  WHERE verified_at IS NOT NULL;

-- 5. Verification challenges table for temporary 15-minute challenge codes
CREATE TABLE IF NOT EXISTS public.verification_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform text NOT NULL,
  handle text NOT NULL,
  challenge_code text NOT NULL,
  attempts integer NOT NULL DEFAULT 0,
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT verification_challenges_user_platform_uniq UNIQUE (user_id, platform)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.verification_challenges TO authenticated;
GRANT ALL ON public.verification_challenges TO service_role;

ALTER TABLE public.verification_challenges ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'verification_challenges' AND policyname = 'own verification challenges'
  ) THEN
    CREATE POLICY "own verification challenges" ON public.verification_challenges
      FOR ALL TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS verification_challenges_user_idx
  ON public.verification_challenges(user_id);

-- 6. Lock verified_at against direct client manipulation
CREATE OR REPLACE FUNCTION public.lock_coding_profile_verification()
RETURNS trigger AS $$
BEGIN
  -- If invoked by an authenticated client (bypassed by service_role)
  IF auth.role() = 'authenticated' THEN
    IF NEW.verified_at IS NOT NULL AND (OLD IS NULL OR OLD.verified_at IS DISTINCT FROM NEW.verified_at) THEN
      RAISE EXCEPTION 'verified_at cannot be set directly; ownership verification is required';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS coding_profiles_lock_verification ON public.coding_profiles;
CREATE TRIGGER coding_profiles_lock_verification
  BEFORE INSERT OR UPDATE ON public.coding_profiles
  FOR EACH ROW EXECUTE FUNCTION public.lock_coding_profile_verification();

