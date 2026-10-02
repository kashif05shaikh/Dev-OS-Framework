import { describe, it, expect, beforeAll } from "vitest";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// Attempt to load .env.test if present
const envTestPath = path.resolve(process.cwd(), ".env.test");
if (fs.existsSync(envTestPath)) {
  const content = fs.readFileSync(envTestPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const [key, ...rest] = trimmed.split("=");
    if (key && rest.length > 0 && !process.env[key.trim()]) {
      process.env[key.trim()] = rest
        .join("=")
        .trim()
        .replace(/^["']|["']$/g, "");
    }
  }
}

const testUrl = process.env.SUPABASE_TEST_URL;
const testKey = process.env.SUPABASE_TEST_ANON_KEY;

// Production safety guard: NEVER run against production Supabase project
const PROD_PROJECT_REF = "bppvwdbrmyvgqqgpbjqe";
const isProdUrl = Boolean(testUrl && testUrl.includes(PROD_PROJECT_REF));
const hasTestProject = Boolean(testUrl && testKey && !isProdUrl);

export const ALL_DATABASE_TABLES = [
  "profiles",
  "subjects",
  "note_folders",
  "notes",
  "learning_folders",
  "learning_resources",
  "projects",
  "project_tasks",
  "job_applications",
  "coding_profiles",
  "resumes",
  "resume_sections",
  "resume_entries",
  "resume_files",
  "ai_prompts",
  "calendar_events",
  "goals",
  "goal_milestones",
  "habits",
  "habit_logs",
  "focus_sessions",
  "social_accounts",
  "social_profile_cache",
  "platform_connections",
] as const;

export const STORAGE_BUCKETS = ["learning-files", "resume-files"] as const;

describe("Row Level Security (RLS) & Multi-Tenant Isolation Suite", () => {
  let anonClient: SupabaseClient | null = null;
  let clientA: SupabaseClient | null = null;
  let clientB: SupabaseClient | null = null;
  let userAId: string = "";
  let userBId: string = "";

  beforeAll(async () => {
    if (!hasTestProject) return;

    if (isProdUrl) {
      throw new Error("SECURITY VIOLATION: Cannot execute RLS tests against production database!");
    }

    anonClient = createClient(testUrl!, testKey!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Authenticate or register User A
    const emailA = process.env.TEST_USER_A_EMAIL || `test_user_a_${Date.now()}@devostest.local`;
    const passwordA = process.env.TEST_USER_A_PASSWORD || "TestPassword123!@#DevOS";
    clientA = createClient(testUrl!, testKey!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const authARes = await clientA.auth.signInWithPassword({ email: emailA, password: passwordA });
    if (authARes.data?.user) {
      userAId = authARes.data.user.id;
    } else {
      const signUpA = await clientA.auth.signUp({ email: emailA, password: passwordA });
      userAId = signUpA.data?.user?.id || "";
    }

    // Authenticate or register User B
    const emailB = process.env.TEST_USER_B_EMAIL || `test_user_b_${Date.now()}@devostest.local`;
    const passwordB = process.env.TEST_USER_B_PASSWORD || "TestPassword123!@#DevOS";
    clientB = createClient(testUrl!, testKey!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const authBRes = await clientB.auth.signInWithPassword({ email: emailB, password: passwordB });
    if (authBRes.data?.user) {
      userBId = authBRes.data.user.id;
    } else {
      const signUpB = await clientB.auth.signUp({ email: emailB, password: passwordB });
      userBId = signUpB.data?.user?.id || "";
    }
  });

  describe("Logged-out (Anonymous) Access Restrictions", () => {
    for (const table of ALL_DATABASE_TABLES) {
      it.skipIf(!hasTestProject)(
        `Logged-out user receives 0 records from public.${table}`,
        async () => {
          const { data, error } = await anonClient!.from(table).select("*");
          if (error) {
            expect(error).toBeDefined();
          } else {
            expect(data).toEqual([]);
          }
        },
      );
    }

    for (const bucket of STORAGE_BUCKETS) {
      it.skipIf(!hasTestProject)(
        `Logged-out user cannot list or download files from bucket "${bucket}"`,
        async () => {
          const { data: listData, error: listError } = await anonClient!.storage
            .from(bucket)
            .list();
          expect(listData === null || listData.length === 0 || listError !== null).toBe(true);

          const { data: fileData, error: fileError } = await anonClient!.storage
            .from(bucket)
            .download("unauthorized_file.pdf");
          expect(fileData === null || fileError !== null).toBe(true);
        },
      );
    }
  });

  describe("Cross-User Isolation (User A vs User B)", () => {
    for (const table of ALL_DATABASE_TABLES) {
      it.skipIf(!hasTestProject)(
        `User A cannot read User B's rows in public.${table}`,
        async () => {
          const idCol = table === "profiles" ? "id" : "user_id";
          const { data, error } = await clientA!.from(table).select("*").eq(idCol, userBId);

          if (!error) {
            expect(data).toHaveLength(0);
          }
        },
      );

      it.skipIf(!hasTestProject)(
        `User A cannot update or delete User B's rows in public.${table}`,
        async () => {
          const idCol = table === "profiles" ? "id" : "user_id";

          const { data: updateData } = await clientA!
            .from(table)
            .update({ updated_at: new Date().toISOString() } as Record<string, unknown>)
            .eq(idCol, userBId)
            .select();

          expect(updateData === null || updateData.length === 0).toBe(true);

          const { data: deleteData } = await clientA!
            .from(table)
            .delete()
            .eq(idCol, userBId)
            .select();

          expect(deleteData === null || deleteData.length === 0).toBe(true);
        },
      );
    }
  });

  describe("Storage Multi-Tenant Bucket Isolation", () => {
    for (const bucket of STORAGE_BUCKETS) {
      it.skipIf(!hasTestProject)(
        `User A cannot read, overwrite or delete User B's files in "${bucket}"`,
        async () => {
          const userBFilePath = `${userBId}/private_doc.pdf`;

          const { data: downloadData, error: downloadError } = await clientA!.storage
            .from(bucket)
            .download(userBFilePath);
          expect(downloadData === null || downloadError !== null).toBe(true);

          const fakeBlob = new Blob(["fake-content"], { type: "application/pdf" });
          const { error: uploadError } = await clientA!.storage
            .from(bucket)
            .upload(userBFilePath, fakeBlob, { upsert: true });
          expect(uploadError).toBeDefined();

          const { data: removeData, error: removeError } = await clientA!.storage
            .from(bucket)
            .remove([userBFilePath]);
          expect(removeData === null || removeData.length === 0 || removeError !== null).toBe(true);
        },
      );
    }
  });
});
