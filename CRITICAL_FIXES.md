# Critical Fixes

| ID | Issue | Severity | Effort | Planned Fix |
|---|---|---|---|---|
| C-1 | **Service Role Key Leak:** `VITE_SUPABASE_SERVICE_ROLE_KEY` is bundled to the client via `src/integrations/supabase/admin.ts`. | Critical | Small | Remove `VITE_SUPABASE_SERVICE_ROLE_KEY` from `.env`. Move `supabaseAdmin` usage to server-side functions only. |
| C-2 | **Missing Auth on fetchSocialProfile:** Unauthenticated scraping open to the public. | High | Small | Add `.middleware([requireSupabaseAuth])` to `fetchSocialProfile`. |
| C-3 | **Missing Rate Limiting:** External API endpoints can be spammed by bots. | High | Medium | Implement basic rate limiting or strict user-bound caching. |

---

## Detailed Analysis of `fetchSocialProfile`
**Returned Fields:** 
It returns a `SocialSnapshot` object containing: `platform`, `handle`, `url`, `display_name`, `avatar_url`, `bio`, `location`, `website`, `verified` (boolean), `followers` (number), `following` (number), and `extra` (platform-specific metadata like tech stacks, recent tweets, github repo counts, etc).

**To Whom:** 
Because it lacks auth middleware, these fields are returned to **anyone on the internet** who makes a POST request to this endpoint. This turns your backend into an open proxy scraper.

---

## Git History Secret Scan
A scan of the Git history reveals that `sb_secret_` (the Supabase Service Role key prefix) **was committed to Git** in the past (specifically in commit `11dd297`). It was present in `client.ts`, `client.server.ts`, and `auth-middleware.ts`. 

*(Note: Never print the key values here. However, because the key is in your git history, you **MUST** roll/rotate your Supabase Service Key in the Supabase Dashboard immediately, as anyone with access to the repo history can see it.)*

## VITE_ Variables Scan
A scan of `.env` shows the following `VITE_` variables:
*   `VITE_SUPABASE_PROJECT_ID` (Safe public ID)
*   `VITE_SUPABASE_PUBLISHABLE_KEY` (Safe public anon key)
*   `VITE_SUPABASE_URL` (Safe public URL)
*   `VITE_SUPABASE_SERVICE_ROLE_KEY` (**Unsafe Secret!**)
No other secret keys are exposed via `VITE_`.
