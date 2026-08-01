import type { Tables } from "@/integrations/supabase/types";

export type Subject = Tables<"subjects">;
export type NoteFolder = Tables<"note_folders">;
export type Note = Tables<"notes">;
export type LearningFolder = Tables<"learning_folders">;
export type LearningResource = Tables<"learning_resources">;

export const RESOURCE_TYPES = [
  "youtube",
  "docs",
  "pdf",
  "course",
  "github",
  "article",
  "website",
  "blog",
] as const;

export type ResourceType = (typeof RESOURCE_TYPES)[number];

export const RESOURCE_TYPE_LABEL: Record<string, string> = {
  youtube: "YouTube",
  docs: "Docs",
  pdf: "PDF",
  course: "Course",
  github: "GitHub",
  article: "Article",
  website: "Website",
  blog: "Blog",
};

export const SUBJECT_COLORS = [
  "#8b5cf6",
  "#22d3ee",
  "#34d399",
  "#fbbf24",
  "#fb7185",
  "#60a5fa",
  "#f472b6",
  "#a3e635",
];