CREATE TABLE public.social_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform text NOT NULL,
  username text NOT NULL DEFAULT '',
  profile_url text,
  connected boolean NOT NULL DEFAULT true,
  auto_sync boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'connected',
  last_error text,
  last_synced timestamptz,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, platform)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.social_accounts TO authenticated;
GRANT ALL ON public.social_accounts TO service_role;
ALTER TABLE public.social_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their own social accounts"
  ON public.social_accounts FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER social_accounts_updated_at BEFORE UPDATE ON public.social_accounts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.social_profile_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform text NOT NULL,
  handle text,
  display_name text,
  avatar_url text,
  bio text,
  location text,
  website text,
  verified boolean,
  followers integer,
  following integer,
  posts integer,
  joined_at timestamptz,
  extra_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, platform)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.social_profile_cache TO authenticated;
GRANT ALL ON public.social_profile_cache TO service_role;
ALTER TABLE public.social_profile_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their own social profile cache"
  ON public.social_profile_cache FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER social_profile_cache_updated_at BEFORE UPDATE ON public.social_profile_cache
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();