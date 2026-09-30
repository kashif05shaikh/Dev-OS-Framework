# DevOS Security & Code Audit Report

## 1. Security Audit Findings

### Critical
* **Supabase Service Key Leak:** The `VITE_SUPABASE_SERVICE_ROLE_KEY` is exposed to the browser. The `supabaseAdmin` client (`src/integrations/supabase/admin.ts`) uses this key and is imported directly into client-side React code in `src/routes/_authenticated.learning.tsx` (lines 134, 855, 886) and `src/routes/_authenticated.resume.tsx` (lines 75, 99, 198, 235). This allows anyone inspecting the network or bundle to bypass RLS and delete or steal the entire database.
* **Committed Secrets in Git History:** Commit `11dd297` contains commits of `sb_secret_` across multiple files. The key must be rotated in the Supabase Dashboard.

### High
* **Missing Auth Middleware (Unauthenticated Proxy):** `fetchSocialProfile` in `src/lib/social.functions.ts` lacks `.middleware([requireSupabaseAuth])`. Unauthenticated users can spam this endpoint, using your Vercel server as an open proxy scraper.
* **Missing Rate Limiting:** External API calls (Codeforces, LeetCode, CodeChef) have no rate limits. Attackers can spam these endpoints and get your server IP permanently banned.
* **Query Cache Not Cleared on Sign-Out:** `src/hooks/use-auth.tsx` does not clear TanStack Query cache (`queryClient.clear()`) on `signOut()`. On shared computers, private user data (notes, goals, jobs, resume entries) remains in client memory.

### Medium
* **Raw Database & Secret Leaks in Toast Errors:** `describeError` in `src/lib/devos-queries.ts` falls back to returning raw error strings. If a database or connection error occurs, raw strings (potentially containing DB URLs or tokens) are shown to users.
* **Timezone Streak Drift:** `src/lib/coding-activity.ts` uses UTC `toISOString().slice(0, 10)` for streak calculations. Users in non-UTC timezones can lose active streaks or have activity attributed to the wrong calendar day.
* **Unauthenticated Contests API:** `getUpcomingContests` in `src/lib/contests.functions.ts` lacks auth and rate limiting.

### Low
* **Unclamped Negative Goal Percentages:** `src/routes/_authenticated.dashboard.tsx` line 896 returns negative percentages if target is negative.
* **Dead Code / Unused Secrets:** `GEMINI_API_KEY` in `.env` is unused (AI workspace is currently an external link launcher).

---

## 2. Code & UX Audit Findings

### High
* **Timer Logic Errors:** The Focus Timer (`src/routes/_authenticated.focus.tsx`) uses `setInterval` and stores remaining time entirely in browser memory (`useState`). If the user refreshes the page, their timer vanishes. Furthermore, background tabs throttle `setInterval`, so the timer loses time.
* **Resume Data Loss:** In the resume manager (`src/routes/_authenticated.resume.tsx`), the Edit Dialog stores title and notes locally. Accidental clicks outside the modal dismiss it and permanently discard input without confirmation.
