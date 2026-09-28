CREATE TABLE public.coding_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform text NOT NULL DEFAULT 'leetcode',
  username text NOT NULL,
  profile_url text,
  rating integer,
  rank_label text,
  problems_solved integer NOT NULL DEFAULT 0,
  contests_attended integer NOT NULL DEFAULT 0,
  current_streak integer NOT NULL DEFAULT 0,
  max_streak integer NOT NULL DEFAULT 0,
  notes text,
  last_synced_at timestamp with time zone,
  position integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.coding_profiles TO authenticated;
GRANT ALL ON public.coding_profiles TO service_role;
ALTER TABLE public.coding_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own coding profiles" ON public.coding_profiles FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER coding_profiles_set_updated_at BEFORE UPDATE ON public.coding_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX coding_profiles_user_idx ON public.coding_profiles(user_id);

CREATE TABLE public.resumes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'My resume',
  full_name text,
  headline text,
  email text,
  phone text,
  location text,
  website_url text,
  github_url text,
  linkedin_url text,
  summary text,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.resumes TO authenticated;
GRANT ALL ON public.resumes TO service_role;
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own resumes" ON public.resumes FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER resumes_set_updated_at BEFORE UPDATE ON public.resumes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX resumes_user_idx ON public.resumes(user_id);

CREATE TABLE public.resume_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resume_id uuid NOT NULL REFERENCES public.resumes(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'custom',
  title text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.resume_sections TO authenticated;
GRANT ALL ON public.resume_sections TO service_role;
ALTER TABLE public.resume_sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own resume sections" ON public.resume_sections FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER resume_sections_set_updated_at BEFORE UPDATE ON public.resume_sections
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX resume_sections_resume_idx ON public.resume_sections(resume_id);

CREATE TABLE public.resume_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  section_id uuid NOT NULL REFERENCES public.resume_sections(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT '',
  organization text,
  location text,
  start_date text,
  end_date text,
  is_current boolean NOT NULL DEFAULT false,
  description text,
  bullets text[] NOT NULL DEFAULT '{}'::text[],
  position integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.resume_entries TO authenticated;
GRANT ALL ON public.resume_entries TO service_role;
ALTER TABLE public.resume_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own resume entries" ON public.resume_entries FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER resume_entries_set_updated_at BEFORE UPDATE ON public.resume_entries
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX resume_entries_section_idx ON public.resume_entries(section_id);