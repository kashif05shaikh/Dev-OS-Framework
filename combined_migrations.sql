-- Migration: 20260801073456_c2afdab9-5728-4786-a265-56dc710d5adf.sql
-- shared updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  display_name TEXT,
  theme TEXT NOT NULL DEFAULT 'dark',
  accent_color TEXT NOT NULL DEFAULT 'violet',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile" ON public.profiles FOR ALL TO authenticated
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'display_name', split_part(NEW.email, '@', 1)))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- SUBJECTS
CREATE TABLE public.subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#8b5cf6',
  icon TEXT NOT NULL DEFAULT 'book',
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.subjects TO authenticated;
GRANT ALL ON public.subjects TO service_role;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own subjects" ON public.subjects FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER subjects_updated_at BEFORE UPDATE ON public.subjects
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX subjects_user_idx ON public.subjects (user_id, position);

-- NOTE FOLDERS
CREATE TABLE public.note_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects ON DELETE CASCADE,
  name TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.note_folders TO authenticated;
GRANT ALL ON public.note_folders TO service_role;
ALTER TABLE public.note_folders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own note folders" ON public.note_folders FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER note_folders_updated_at BEFORE UPDATE ON public.note_folders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX note_folders_subject_idx ON public.note_folders (subject_id, position);

-- NOTES
CREATE TABLE public.notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects ON DELETE CASCADE,
  folder_id UUID REFERENCES public.note_folders ON DELETE SET NULL,
  title TEXT NOT NULL DEFAULT 'Untitled',
  content_markdown TEXT NOT NULL DEFAULT '',
  tags TEXT[] NOT NULL DEFAULT '{}',
  pinned BOOLEAN NOT NULL DEFAULT false,
  archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notes TO authenticated;
GRANT ALL ON public.notes TO service_role;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own notes" ON public.notes FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER notes_updated_at BEFORE UPDATE ON public.notes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX notes_subject_idx ON public.notes (subject_id, folder_id);
CREATE INDEX notes_user_idx ON public.notes (user_id, updated_at DESC);

-- LEARNING FOLDERS
CREATE TABLE public.learning_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects ON DELETE CASCADE,
  name TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.learning_folders TO authenticated;
GRANT ALL ON public.learning_folders TO service_role;
ALTER TABLE public.learning_folders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own learning folders" ON public.learning_folders FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER learning_folders_updated_at BEFORE UPDATE ON public.learning_folders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX learning_folders_subject_idx ON public.learning_folders (subject_id, position);

-- LEARNING RESOURCES
CREATE TABLE public.learning_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects ON DELETE CASCADE,
  folder_id UUID REFERENCES public.learning_folders ON DELETE SET NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'article',
  url TEXT,
  description TEXT,
  favorite BOOLEAN NOT NULL DEFAULT false,
  completed BOOLEAN NOT NULL DEFAULT false,
  progress_percent INTEGER NOT NULL DEFAULT 0,
  tags TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.learning_resources TO authenticated;
GRANT ALL ON public.learning_resources TO service_role;
ALTER TABLE public.learning_resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own learning resources" ON public.learning_resources FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER learning_resources_updated_at BEFORE UPDATE ON public.learning_resources
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX learning_resources_subject_idx ON public.learning_resources (subject_id, folder_id);

-- Migration: 20260801073527_b39c4daa-34b2-4afe-b270-650cd04e57d6.sql
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- Migration: 20260801081023_8c0bb8e2-0190-43ae-a522-e62d9d5dc384.sql
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['profiles','subjects','note_folders','notes','learning_folders','learning_resources'] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS set_updated_at_%1$s ON public.%1$I', t);
    EXECUTE format('CREATE TRIGGER set_updated_at_%1$s BEFORE UPDATE ON public.%1$I FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()', t);
  END LOOP;
END $$;

-- Migration: 20260801083157_9877d290-008e-4218-8cea-a60300560369.sql
CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'idea',
  tech_stack text[] NOT NULL DEFAULT '{}'::text[],
  repo_url text,
  live_url text,
  notes text,
  pinned boolean NOT NULL DEFAULT false,
  progress_percent integer NOT NULL DEFAULT 0,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO authenticated;
GRANT ALL ON public.projects TO service_role;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own projects" ON public.projects FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.project_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title text NOT NULL,
  done boolean NOT NULL DEFAULT false,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_tasks TO authenticated;
GRANT ALL ON public.project_tasks TO service_role;
ALTER TABLE public.project_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own project tasks" ON public.project_tasks FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.job_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company text NOT NULL,
  role_title text NOT NULL,
  location text,
  work_mode text NOT NULL DEFAULT 'remote',
  salary_range text,
  job_url text,
  status text NOT NULL DEFAULT 'wishlist',
  applied_on date,
  follow_up_on date,
  contact_name text,
  contact_email text,
  notes text,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.job_applications TO authenticated;
GRANT ALL ON public.job_applications TO service_role;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own job applications" ON public.job_applications FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER set_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_project_tasks_updated_at BEFORE UPDATE ON public.project_tasks FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_job_applications_updated_at BEFORE UPDATE ON public.job_applications FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_projects_user ON public.projects(user_id);
CREATE INDEX idx_project_tasks_project ON public.project_tasks(project_id);
CREATE INDEX idx_job_applications_user ON public.job_applications(user_id);

-- Migration: 20260801084919_8f335cc7-9ac2-4c1b-afd1-a35d9e7ce013.sql
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

-- Migration: 20260801092108_18508c95-ee73-44aa-a4c9-a7402d29c21a.sql
CREATE TABLE public.ai_prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'general',
  model text,
  tags text[] NOT NULL DEFAULT '{}'::text[],
  favorite boolean NOT NULL DEFAULT false,
  usage_count integer NOT NULL DEFAULT 0,
  last_used_at timestamptz,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_prompts TO authenticated;
GRANT ALL ON public.ai_prompts TO service_role;
ALTER TABLE public.ai_prompts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own ai prompts" ON public.ai_prompts FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER ai_prompts_updated_at BEFORE UPDATE ON public.ai_prompts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.calendar_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  kind text NOT NULL DEFAULT 'task',
  event_date date NOT NULL,
  start_time time,
  end_time time,
  all_day boolean NOT NULL DEFAULT true,
  color text NOT NULL DEFAULT '#8b5cf6',
  location text,
  url text,
  completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.calendar_events TO authenticated;
GRANT ALL ON public.calendar_events TO service_role;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own calendar events" ON public.calendar_events FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER calendar_events_updated_at BEFORE UPDATE ON public.calendar_events
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX calendar_events_user_date_idx ON public.calendar_events (user_id, event_date);

-- Migration: 20260801110950_91bef51d-f364-45cb-a278-77f30710b407.sql
CREATE TABLE public.goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'career',
  status text NOT NULL DEFAULT 'active',
  priority text NOT NULL DEFAULT 'medium',
  target_value numeric NOT NULL DEFAULT 100,
  current_value numeric NOT NULL DEFAULT 0,
  unit text NOT NULL DEFAULT '%',
  due_date date,
  pinned boolean NOT NULL DEFAULT false,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.goals TO authenticated;
GRANT ALL ON public.goals TO service_role;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own goals" ON public.goals FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.goal_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_id uuid NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  title text NOT NULL,
  done boolean NOT NULL DEFAULT false,
  due_date date,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.goal_milestones TO authenticated;
GRANT ALL ON public.goal_milestones TO service_role;
ALTER TABLE public.goal_milestones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own goal milestones" ON public.goal_milestones FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.habits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  icon text NOT NULL DEFAULT 'repeat',
  color text NOT NULL DEFAULT '#8b5cf6',
  frequency text NOT NULL DEFAULT 'daily',
  target_per_period integer NOT NULL DEFAULT 1,
  current_streak integer NOT NULL DEFAULT 0,
  best_streak integer NOT NULL DEFAULT 0,
  archived boolean NOT NULL DEFAULT false,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.habits TO authenticated;
GRANT ALL ON public.habits TO service_role;
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own habits" ON public.habits FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.habit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  habit_id uuid NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  log_date date NOT NULL DEFAULT current_date,
  count integer NOT NULL DEFAULT 1,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (habit_id, log_date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.habit_logs TO authenticated;
GRANT ALL ON public.habit_logs TO service_role;
ALTER TABLE public.habit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own habit logs" ON public.habit_logs FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER goals_updated_at BEFORE UPDATE ON public.goals FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER goal_milestones_updated_at BEFORE UPDATE ON public.goal_milestones FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER habits_updated_at BEFORE UPDATE ON public.habits FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER habit_logs_updated_at BEFORE UPDATE ON public.habit_logs FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX goals_user_idx ON public.goals(user_id);
CREATE INDEX goal_milestones_goal_idx ON public.goal_milestones(goal_id);
CREATE INDEX habits_user_idx ON public.habits(user_id);
CREATE INDEX habit_logs_habit_date_idx ON public.habit_logs(habit_id, log_date DESC);

-- Migration: 20260801111850_94a8ccba-ec7b-47b8-ae7d-b65dfe4bd698.sql
CREATE TABLE public.focus_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mode text NOT NULL DEFAULT 'focus',
  label text,
  planned_minutes integer NOT NULL DEFAULT 25,
  actual_seconds integer NOT NULL DEFAULT 0,
  completed boolean NOT NULL DEFAULT false,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.focus_sessions TO authenticated;
GRANT ALL ON public.focus_sessions TO service_role;
ALTER TABLE public.focus_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own focus sessions" ON public.focus_sessions FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER focus_sessions_updated_at BEFORE UPDATE ON public.focus_sessions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX focus_sessions_user_started_idx ON public.focus_sessions(user_id, started_at DESC);

-- Migration: 20260801113425_c43be0e8-5585-4768-89b5-41a4539f9d3b.sql
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS timeframe text NOT NULL DEFAULT 'monthly';

-- Migration: 20260801121959_f98b6fb3-bd42-4072-a4e9-8c23eda1e5a7.sql
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

-- Migration: 20260802132657_930755c3-4615-4442-8f18-bff3b3d72c35.sql
ALTER TABLE public.learning_resources
  ADD COLUMN IF NOT EXISTS file_path text,
  ADD COLUMN IF NOT EXISTS file_name text,
  ADD COLUMN IF NOT EXISTS file_size bigint;

CREATE POLICY "Users read own learning files"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'learning-files' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users upload own learning files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'learning-files' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users update own learning files"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'learning-files' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'learning-files' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users delete own learning files"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'learning-files' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Migration: 20260809180543_b634da93-7116-4532-a6b6-995bbac67c19.sql
ALTER TABLE public.coding_profiles ADD COLUMN IF NOT EXISTS activity jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Migration: 20260809183706_c307c361-3cd0-47f3-ace0-f83db35b9841.sql
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

-- Migration: 20260809185631_e19d1e93-e69b-4720-bfb3-3a5ccaf0413b.sql
CREATE TABLE public.platform_connections (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform text NOT NULL,
  handle text,
  platform_user_id text,
  secret_ciphertext text,
  status text NOT NULL DEFAULT 'disconnected',
  last_error text,
  connected_at timestamp with time zone,
  expires_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, platform)
);

GRANT ALL ON public.platform_connections TO service_role;

ALTER TABLE public.platform_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No direct client access to platform connections"
ON public.platform_connections
FOR ALL
TO authenticated
USING (false)
WITH CHECK (false);

CREATE TRIGGER platform_connections_updated_at
BEFORE UPDATE ON public.platform_connections
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Migration: 20260810053035_69908089-6a7d-4250-8a43-019242fd3c35.sql
ALTER TABLE public.coding_profiles ADD COLUMN IF NOT EXISTS max_rating integer;

-- Migration: 20260824161444_d0f503bd-5cdb-49be-b00b-ea895de6941e.sql
CREATE TABLE IF NOT EXISTS public.resume_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL DEFAULT 'My resume',
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.resume_files TO authenticated;
GRANT ALL ON public.resume_files TO service_role;
ALTER TABLE public.resume_files ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage their own resume files" ON public.resume_files;
CREATE POLICY "Users manage their own resume files" ON public.resume_files FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Migration: 20260824161535_bcc788e3-0abe-4a80-b5d8-3bbca32f3e6d.sql
CREATE POLICY "Users read own resume files" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'resume-files' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users upload own resume files" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'resume-files' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users update own resume files" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'resume-files' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users delete own resume files" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'resume-files' AND auth.uid()::text = (storage.foldername(name))[1]);

