import { queryOptions } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import type {
  LearningFolder,
  LearningResource,
  Note,
  NoteFolder,
  Subject,
} from "@/lib/devos-types";

function unwrap<T>(result: { data: T | null; error: { message: string } | null }): T {
  if (result.error) throw new Error(result.error.message);
  return (result.data ?? []) as T;
}

export const subjectsQuery = () =>
  queryOptions({
    queryKey: ["subjects"],
    queryFn: async (): Promise<Subject[]> =>
      unwrap(
        await supabase
          .from("subjects")
          .select("*")
          .order("position", { ascending: true })
          .order("created_at", { ascending: true }),
      ),
  });

export const noteFoldersQuery = () =>
  queryOptions({
    queryKey: ["note_folders"],
    queryFn: async (): Promise<NoteFolder[]> =>
      unwrap(
        await supabase
          .from("note_folders")
          .select("*")
          .order("position", { ascending: true })
          .order("created_at", { ascending: true }),
      ),
  });

export const notesQuery = () =>
  queryOptions({
    queryKey: ["notes"],
    queryFn: async (): Promise<Note[]> =>
      unwrap(
        await supabase
          .from("notes")
          .select("*")
          .order("pinned", { ascending: false })
          .order("updated_at", { ascending: false }),
      ),
  });

export const learningFoldersQuery = () =>
  queryOptions({
    queryKey: ["learning_folders"],
    queryFn: async (): Promise<LearningFolder[]> =>
      unwrap(
        await supabase
          .from("learning_folders")
          .select("*")
          .order("position", { ascending: true })
          .order("created_at", { ascending: true }),
      ),
  });

export const learningResourcesQuery = () =>
  queryOptions({
    queryKey: ["learning_resources"],
    queryFn: async (): Promise<LearningResource[]> =>
      unwrap(
        await supabase
          .from("learning_resources")
          .select("*")
          .order("created_at", { ascending: false }),
      ),
  });

export async function requireUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("You are signed out. Sign in again to continue.");
  return data.user.id;
}