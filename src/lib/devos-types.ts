import type { Tables } from "@/integrations/supabase/types";

export type Subject = Tables<"subjects">;
export type NoteFolder = Tables<"note_folders">;
export type Note = Tables<"notes">;
export type LearningFolder = Tables<"learning_folders">;
export type LearningResource = Tables<"learning_resources">;
export type Project = Tables<"projects">;
export type ProjectTask = Tables<"project_tasks">;
export type JobApplication = Tables<"job_applications">;

export const PROJECT_STATUSES = ["idea", "building", "paused", "shipped", "archived"] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const PROJECT_STATUS_LABEL: Record<string, string> = {
  idea: "Idea",
  building: "Building",
  paused: "Paused",
  shipped: "Shipped",
  archived: "Archived",
};

export const JOB_STATUSES = [
  "wishlist",
  "applied",
  "interview",
  "offer",
  "rejected",
  "ghosted",
] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];

export const JOB_STATUS_LABEL: Record<string, string> = {
  wishlist: "Wishlist",
  applied: "Applied",
  interview: "Interview",
  offer: "Offer",
  rejected: "Rejected",
  ghosted: "Ghosted",
};

export const WORK_MODES = ["remote", "hybrid", "onsite"] as const;
export const WORK_MODE_LABEL: Record<string, string> = {
  remote: "Remote",
  hybrid: "Hybrid",
  onsite: "On-site",
};

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