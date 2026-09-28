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