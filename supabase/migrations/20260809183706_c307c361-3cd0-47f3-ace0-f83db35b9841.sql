ALTER TABLE public.coding_profiles
  ADD COLUMN IF NOT EXISTS submissions_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sync_status text NOT NULL DEFAULT 'idle',
  ADD COLUMN IF NOT EXISTS sync_error text;

ALTER TABLE public.coding_profiles
  ADD CONSTRAINT coding_profiles_submissions_count_nonnegative CHECK (submissions_count >= 0),
  ADD CONSTRAINT coding_profiles_sync_status_valid CHECK (sync_status IN ('idle', 'success', 'error'));

COMMENT ON COLUMN public.coding_profiles.submissions_count IS 'Total submissions reported by the platform, distinct from solved problems.';
COMMENT ON COLUMN public.coding_profiles.sync_status IS 'Last live platform sync result: idle, success, or error.';
COMMENT ON COLUMN public.coding_profiles.sync_error IS 'Safe user-facing message from the last failed platform sync.';