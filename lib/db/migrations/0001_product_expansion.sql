-- Additive DevOS product expansion. Safe to run on an existing database.
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS company_logo_url text;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS application_url text;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS job_description text;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS deadline date;

ALTER TABLE resumes ADD COLUMN IF NOT EXISTS file_name text;
ALTER TABLE resumes ADD COLUMN IF NOT EXISTS file_url text;
ALTER TABLE resumes ADD COLUMN IF NOT EXISTS file_mime_type text;

CREATE TABLE IF NOT EXISTS resume_versions (
  id serial PRIMARY KEY,
  user_id text NOT NULL,
  resume_id integer NOT NULL,
  version_name text NOT NULL,
  content_text text,
  change_summary text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS resume_versions_user_resume_idx ON resume_versions (user_id, resume_id, created_at DESC);

ALTER TABLE prompts ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}';
ALTER TABLE topics ADD COLUMN IF NOT EXISTS favorite boolean NOT NULL DEFAULT false;

ALTER TABLE dev_tool_connections ADD COLUMN IF NOT EXISTS connection_email text;
ALTER TABLE dev_tool_connections ADD COLUMN IF NOT EXISTS auth_method text NOT NULL DEFAULT 'token';

ALTER TABLE social_links ADD COLUMN IF NOT EXISTS following integer;
ALTER TABLE social_links ADD COLUMN IF NOT EXISTS bio text;

ALTER TABLE focus_sessions ADD COLUMN IF NOT EXISTS mode text NOT NULL DEFAULT 'stopwatch';
ALTER TABLE focus_sessions ADD COLUMN IF NOT EXISTS target_minutes integer;
ALTER TABLE focus_sessions ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE focus_sessions ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}';
ALTER TABLE focus_sessions ADD COLUMN IF NOT EXISTS distraction_count integer NOT NULL DEFAULT 0;

ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS source_type text;
ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS source_id integer;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preferences jsonb;

CREATE TABLE IF NOT EXISTS tracked_goals (
  id serial PRIMARY KEY,
  user_id text NOT NULL,
  title text NOT NULL,
  category text NOT NULL DEFAULT 'custom',
  timeframe text NOT NULL DEFAULT 'weekly',
  target_value integer NOT NULL DEFAULT 1,
  current_value integer NOT NULL DEFAULT 0,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS tracked_goals_user_position_idx ON tracked_goals (user_id, position);
