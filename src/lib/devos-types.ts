import type { Tables } from "@/integrations/supabase/types";

export type Subject = Tables<"subjects">;
export type NoteFolder = Tables<"note_folders">;
export type Note = Tables<"notes">;
export type LearningFolder = Tables<"learning_folders">;
export type LearningResource = Tables<"learning_resources">;
export type Project = Tables<"projects">;
export type ProjectTask = Tables<"project_tasks">;
export type JobApplication = Tables<"job_applications">;
export type CodingProfile = Tables<"coding_profiles">;
export type Resume = Tables<"resumes">;
export type ResumeSection = Tables<"resume_sections">;
export type ResumeEntry = Tables<"resume_entries">;

export const CODING_PLATFORMS = [
  "leetcode",
  "codeforces",
  "codechef",
  "hackerrank",
  "github",
  "gfg",
  "atcoder",
  "other",
] as const;
export type CodingPlatform = (typeof CODING_PLATFORMS)[number];

export const CODING_PLATFORM_LABEL: Record<string, string> = {
  leetcode: "LeetCode",
  codeforces: "Codeforces",
  codechef: "CodeChef",
  hackerrank: "HackerRank",
  github: "GitHub",
  gfg: "GeeksforGeeks",
  atcoder: "AtCoder",
  other: "Other",
};

export const CODING_PLATFORM_COLOR: Record<string, string> = {
  leetcode: "#f59e0b",
  codeforces: "#60a5fa",
  codechef: "#a3a3a3",
  hackerrank: "#34d399",
  github: "#e5e7eb",
  gfg: "#22c55e",
  atcoder: "#f472b6",
  other: "#8b5cf6",
};

export const PROFILE_URL_TEMPLATE: Record<string, (u: string) => string> = {
  leetcode: (u) => `https://leetcode.com/u/${u}/`,
  codeforces: (u) => `https://codeforces.com/profile/${u}`,
  codechef: (u) => `https://www.codechef.com/users/${u}`,
  hackerrank: (u) => `https://www.hackerrank.com/profile/${u}`,
  github: (u) => `https://github.com/${u}`,
  gfg: (u) => `https://auth.geeksforgeeks.org/user/${u}`,
  atcoder: (u) => `https://atcoder.jp/users/${u}`,
};

/** Platforms whose stats DevOS can fetch automatically from the public APIs. */
export const SYNCABLE_PLATFORMS = ["leetcode", "codeforces", "codechef", "github"] as const;

export const RESUME_SECTION_KINDS = [
  "experience",
  "education",
  "projects",
  "skills",
  "certifications",
  "achievements",
  "custom",
] as const;
export type ResumeSectionKind = (typeof RESUME_SECTION_KINDS)[number];

export const RESUME_SECTION_LABEL: Record<string, string> = {
  experience: "Experience",
  education: "Education",
  projects: "Projects",
  skills: "Skills",
  certifications: "Certifications",
  achievements: "Achievements",
  custom: "Custom",
};

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