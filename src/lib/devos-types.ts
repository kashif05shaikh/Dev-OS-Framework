import type { Tables } from "@/integrations/supabase/types";

export type Profile = Tables<"profiles">;
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
export type AiPrompt = Tables<"ai_prompts">;
export type CalendarEvent = Tables<"calendar_events">;

export const PROMPT_CATEGORIES = [
  "general",
  "coding",
  "debugging",
  "writing",
  "learning",
  "interview",
  "system",
  "marketing",
] as const;
export type PromptCategory = (typeof PROMPT_CATEGORIES)[number];

export const PROMPT_CATEGORY_LABEL: Record<string, string> = {
  general: "General",
  coding: "Coding",
  debugging: "Debugging",
  writing: "Writing",
  learning: "Learning",
  interview: "Interview",
  system: "System",
  marketing: "Marketing",
};

export const EVENT_KINDS = [
  "task",
  "interview",
  "deadline",
  "study",
  "contest",
  "meeting",
  "reminder",
] as const;
export type EventKind = (typeof EVENT_KINDS)[number];

export const EVENT_KIND_LABEL: Record<string, string> = {
  task: "Task",
  interview: "Interview",
  deadline: "Deadline",
  study: "Study",
  contest: "Contest",
  meeting: "Meeting",
  reminder: "Reminder",
};

export const EVENT_KIND_COLOR: Record<string, string> = {
  task: "#8b5cf6",
  interview: "#fbbf24",
  deadline: "#fb7185",
  study: "#22d3ee",
  contest: "#34d399",
  meeting: "#60a5fa",
  reminder: "#a3e635",
};

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
export const SYNCABLE_PLATFORMS = [
  "leetcode",
  "codeforces",
  "codechef",
  "github",
  "hackerrank",
  "gfg",
  "atcoder",
] as const;

/** simple-icons slugs used to render each platform's real logo. */
export const CODING_PLATFORM_ICON: Record<string, string> = {
  leetcode: "leetcode",
  codeforces: "codeforces",
  codechef: "codechef",
  hackerrank: "hackerrank",
  github: "github",
  gfg: "geeksforgeeks",
};

/** GitHub tracks repositories, everyone else tracks solved problems. */
export const SOLVED_LABEL: Record<string, string> = {
  github: "Repos",
};

export const SOLVED_FIELD_LABEL: Record<string, string> = {
  github: "Public repositories",
};

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
export type Goal = Tables<"goals">;
export type GoalMilestone = Tables<"goal_milestones">;
export type Habit = Tables<"habits">;
export type HabitLog = Tables<"habit_logs">;

export const GOAL_CATEGORIES = [
  "academic",
  "coding",
  "dsa",
  "development",
  "reading",
  "exercise",
] as const;
export type GoalCategory = (typeof GOAL_CATEGORIES)[number];

export const GOAL_CATEGORY_LABEL: Record<string, string> = {
  academic: "Academic",
  coding: "Coding",
  dsa: "DSA",
  development: "Development",
  reading: "Reading",
  exercise: "Exercise",
  // legacy values kept so older goals still render a friendly label
  career: "Career",
  learning: "Learning",
  health: "Health",
  personal: "Personal",
  finance: "Finance",
};

export const GOAL_TIMEFRAMES = ["daily", "weekly", "monthly"] as const;
export type GoalTimeframe = (typeof GOAL_TIMEFRAMES)[number];
export const GOAL_TIMEFRAME_LABEL: Record<string, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
};

export const GOAL_STATUSES = ["active", "paused", "done", "dropped"] as const;
export type GoalStatus = (typeof GOAL_STATUSES)[number];

export const GOAL_STATUS_LABEL: Record<string, string> = {
  active: "Active",
  paused: "Paused",
  done: "Completed",
  dropped: "Dropped",
};

export const GOAL_PRIORITIES = ["low", "medium", "high"] as const;
export const GOAL_PRIORITY_LABEL: Record<string, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export const HABIT_FREQUENCIES = ["daily", "weekly"] as const;
export const HABIT_FREQUENCY_LABEL: Record<string, string> = {
  daily: "Daily",
  weekly: "Weekly",
};

export const HABIT_COLORS = [
  "#8b5cf6",
  "#22d3ee",
  "#34d399",
  "#fbbf24",
  "#fb7185",
  "#60a5fa",
];

export type FocusSession = Tables<"focus_sessions">;

export const FOCUS_MODES = ["focus", "short_break", "long_break"] as const;
export type FocusMode = (typeof FOCUS_MODES)[number];

export const FOCUS_MODE_LABEL: Record<string, string> = {
  focus: "Focus",
  short_break: "Short break",
  long_break: "Long break",
};

export const FOCUS_DEFAULT_MINUTES: Record<string, number> = {
  focus: 25,
  short_break: 5,
  long_break: 15,
};
