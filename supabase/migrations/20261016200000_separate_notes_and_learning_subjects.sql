-- Migration: Decouple Notes subjects and Learning Hub subjects so they work completely independently.
-- This tags subjects as either 'notes' or 'learning' in public.subjects (using the existing icon column).

-- 1. Tag subjects that only have learning resources / learning folders as 'learning'
UPDATE public.subjects
SET icon = 'learning', updated_at = now()
WHERE (icon IS NULL OR icon = 'book' OR icon = '')
  AND id IN (
    SELECT subject_id FROM public.learning_resources
    UNION
    SELECT subject_id FROM public.learning_folders
  )
  AND id NOT IN (
    SELECT subject_id FROM public.notes
    UNION
    SELECT subject_id FROM public.note_folders
  );

-- 2. Tag subjects that only have notes / note folders as 'notes'
UPDATE public.subjects
SET icon = 'notes', updated_at = now()
WHERE (icon IS NULL OR icon = 'book' OR icon = '')
  AND id IN (
    SELECT subject_id FROM public.notes
    UNION
    SELECT subject_id FROM public.note_folders
  )
  AND id NOT IN (
    SELECT subject_id FROM public.learning_resources
    UNION
    SELECT subject_id FROM public.learning_folders
  );

-- 3. Decouple subjects that have BOTH notes AND learning resources:
-- Create a new subject for learning, migrate learning_resources and learning_folders to it,
-- and set the original subject icon to 'notes'.
DO $$
DECLARE
  r RECORD;
  new_subj_id UUID;
BEGIN
  FOR r IN (
    SELECT s.id, s.user_id, s.name, s.color, s.position
    FROM public.subjects s
    WHERE (s.id IN (SELECT subject_id FROM public.notes UNION SELECT subject_id FROM public.note_folders))
      AND (s.id IN (SELECT subject_id FROM public.learning_resources UNION SELECT subject_id FROM public.learning_folders))
  ) LOOP
    new_subj_id := gen_random_uuid();
    INSERT INTO public.subjects (id, user_id, name, color, icon, position)
    VALUES (new_subj_id, r.user_id, r.name, r.color, 'learning', r.position);

    UPDATE public.learning_resources SET subject_id = new_subj_id WHERE subject_id = r.id;
    UPDATE public.learning_folders SET subject_id = new_subj_id WHERE subject_id = r.id;

    UPDATE public.subjects SET icon = 'notes', updated_at = now() WHERE id = r.id;
  END LOOP;
END $$;

-- 4. Tag remaining empty subjects (no notes, no learning resources) to 'learning' so they don't clutter Notes
UPDATE public.subjects
SET icon = 'learning', updated_at = now()
WHERE (icon IS NULL OR icon = 'book' OR icon = '')
  AND id NOT IN (
    SELECT subject_id FROM public.notes
    UNION
    SELECT subject_id FROM public.note_folders
  );
