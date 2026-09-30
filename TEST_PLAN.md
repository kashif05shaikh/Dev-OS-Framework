# Test Plan for DevOS

## Testing Stack

- **Unit & Component Tests:** Vitest + React Testing Library + jsdom
- **End-to-End (E2E) Tests:** Playwright
- **Required Installs:** `npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom @playwright/test @vitest/coverage-v8`

## Testing Setup Instructions (WARNING)

**DO NOT RUN DATABASE TESTS AGAINST PRODUCTION.**
To test Row Level Security (RLS) safely, we need a separate test Supabase project.

1. Create a new empty project in Supabase called `DevOS-Test`.
2. Apply all files in `supabase/migrations/` to it.
3. Update `.env.test` with `VITE_SUPABASE_URL` and anon key for the test project.
4. Run RLS tests only against this staging project.

## Coverage Map

### Database Tables (RLS)

| Table                                                | Description                     | Test File                                       |
| ---------------------------------------------------- | ------------------------------- | ----------------------------------------------- |
| `profiles`, `social_accounts`, `coding_profiles`     | User identity & linked accounts | `tests/database/rls.test.ts` (Requires test DB) |
| `goals`, `goal_milestones`, `focus_sessions`         | Productivity data               | `tests/database/rls.test.ts` (Requires test DB) |
| `projects`, `project_tasks`, `job_applications`      | Career & Work data              | `tests/database/rls.test.ts` (Requires test DB) |
| `resumes`, `resume_entries`, `resume_files`          | Resume builder data             | `tests/database/rls.test.ts` (Requires test DB) |
| `storage.objects` (`resume-files`, `learning-files`) | Storage buckets                 | `tests/database/rls.test.ts` (Requires test DB) |

### Server Functions (`createServerFn`)

| Function                | File                                      | Test File                                                     |
| ----------------------- | ----------------------------------------- | ------------------------------------------------------------- |
| `fetchSocialProfile`    | `src/lib/social.functions.ts`             | `tests/server/server.test.ts`, `tests/server/privacy.test.ts` |
| `getUpcomingContests`   | `src/lib/contests.functions.ts`           | `tests/server/social.mock.test.ts`                            |
| `listCodingConnections` | `src/lib/coding-connections.functions.ts` | `tests/server/access-control.test.ts`                         |
| `disconnectPlatform`    | `src/lib/coding-connections.functions.ts` | `tests/server/access-control.test.ts`                         |
| `fetchCodingStats`      | `src/lib/coding-profiles.functions.ts`    | `tests/server/coding-stats.test.ts`                           |
| `openStoredFile`        | `src/routes/_authenticated.learning.tsx`  | `tests/server/server.test.ts`                                 |

### Frontend Routes & Components

| Route / Component            | Focus                                  | Test File                              |
| ---------------------------- | -------------------------------------- | -------------------------------------- |
| `/_authenticated/goals`      | Target 0, completion calculation       | `tests/components/components.test.tsx` |
| `/_authenticated/focus`      | Timer state, reload / background drift | `tests/components/components.test.tsx` |
| `/_authenticated/resume`     | File uploader, popup discard           | `tests/components/components.test.tsx` |
| `src/components/states.tsx`  | Loading, Error, Empty states           | `tests/components/states.test.tsx`     |
| `src/lib/coding-activity.ts` | Timezones, streak calculation          | `tests/unit/timezone-date.test.ts`     |
| `src/lib/utils.ts`           | `cn`, formatting                       | `tests/unit/lib.test.ts`               |
