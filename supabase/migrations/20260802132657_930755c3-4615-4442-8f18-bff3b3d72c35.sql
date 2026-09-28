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