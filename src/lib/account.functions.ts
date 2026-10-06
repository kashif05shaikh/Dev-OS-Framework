import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { checkUserRateLimit } from "@/lib/rate-limit.server";
import { z } from "zod";

export const deleteAccountFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(z.object({ confirm: z.literal("DELETE") }))
  .handler(async ({ context: { userId } }) => {
    // 1. Rate limiting (max 3 attempts per hour to delete account for safety)
    const { success } = await checkUserRateLimit(userId, "delete_account", 3, 3600);
    if (!success) {
      throw new Error("Too many attempts. Please try again later.");
    }

    // 2. Delete Storage Objects
    // Using supabaseAdmin to bypass RLS and delete all user files
    const buckets = ["resume-files", "learning-files"];
    for (const bucket of buckets) {
      try {
        const { data: files } = await supabaseAdmin.storage.from(bucket).list(userId);
        if (files && files.length > 0) {
          const paths = files.map((f) => `${userId}/${f.name}`);
          await supabaseAdmin.storage.from(bucket).remove(paths);
        }
      } catch (err) {
        console.error(`Failed to list/delete files in ${bucket} for ${userId}`, err);
      }
    }

    // 3. Delete user data explicitly (to avoid foreign key errors if CASCADE is missing)
    // Ordered to respect potential foreign keys (child tables first)
    const tables = [
      "goal_milestones",
      "goals",
      "habit_logs",
      "habits",
      "job_applications",
      "learning_resources",
      "learning_folders",
      "notes",
      "note_folders",
      "project_tasks",
      "projects",
      "resume_files",
      "resume_sections",
      "resume_entries",
      "resumes",
      "focus_sessions",
      "calendar_events",
      "coding_profiles",
      "platform_connections",
      "social_profile_cache",
      "social_accounts",
      "ai_prompts",
      "subjects",
      "profiles",
    ];

    for (const table of tables) {
      try {
        // Not all tables have 'user_id', profiles has 'id', etc. Let's handle them gracefully
        if (table === "profiles") {
          await supabaseAdmin.from(table).delete().eq("id", userId);
        } else {
          await supabaseAdmin.from(table as any).delete().eq("user_id", userId);
        }
      } catch (err) {
        console.error(`Failed to delete from ${table} for ${userId}`, err);
      }
    }

    // 4. Finally, delete the user from Supabase Auth
    // This removes API keys/sessions and prevents future logins
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) {
      console.error(`Failed to delete auth user ${userId}:`, error);
      throw new Error("Failed to fully delete account. Please contact support.");
    }

    return { success: true };
  });
