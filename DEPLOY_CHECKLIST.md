# DevOS Hub - Production Deployment Checklist

## 1. Environment Variables Configuration (Vercel)

### Client Variables (Bundled into frontend browser assets)

| Variable Name                   | Required | Secret? | Description                                                                       |
| :------------------------------ | :------: | :-----: | :-------------------------------------------------------------------------------- |
| `VITE_SUPABASE_URL`             | **YES**  |   NO    | Production Supabase project URL (e.g. `https://bppvwdbrmyvgqqgpbjqe.supabase.co`) |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | **YES**  |   NO    | Production Supabase anonymous/publishable key                                     |

> [!CAUTION]
> **Strict Client Secret Isolation**:
>
> - NEVER prefix sensitive server keys with `VITE_`.
> - Do NOT put `SUPABASE_SERVICE_ROLE_KEY` or `CONNECTOR_ENCRYPTION_KEY` under `VITE_*`. Any variable starting with `VITE_` is baked directly into client bundle files accessible via browser dev tools.

### Server-Only Variables (Runtime environment only)

| Variable Name               | Required | Secret? | Description                                                                                                        |
| :-------------------------- | :------: | :-----: | :----------------------------------------------------------------------------------------------------------------- |
| `SUPABASE_SERVICE_ROLE_KEY` | **YES**  | **YES** | Server-only admin key required for secure server functions (`createAdminClient`). Do NOT expose to client.         |
| `CONNECTOR_ENCRYPTION_KEY`  | **YES**  | **YES** | 32-character AES-GCM encryption secret for encrypting third-party OAuth access tokens before database persistence. |

---

## 2. Supabase Production Checks

### A. Row Level Security (RLS)

- [ ] Verify RLS is enabled on ALL public tables:
  - `profiles`
  - `focus_sessions`
  - `goals`
  - `habits`
  - `habit_logs`
  - `learning_tasks`
  - `resource_bookmarks`
  - `user_achievements`
  - `platform_connections`
- [ ] Verify table policies strictly enforce `auth.uid() = user_id` for SELECT, INSERT, UPDATE, and DELETE.
- [ ] Ensure `platform_connections` cannot be accessed or altered by other users or anonymous requests.

### B. Storage Buckets

- [ ] Confirm `resumes` bucket is marked **PRIVATE**.
- [ ] Confirm `avatars` bucket enforces write restrictions (`auth.uid() = (storage.foldername(name))[1]`).

### C. Authentication & Redirects

- [ ] Set **Site URL** to `https://devos-hub.vercel.app`.
- [ ] Configure allowed **Redirect URLs**:
  - `https://devos-hub.vercel.app/**`
  - `https://devos-hub.vercel.app/auth/callback`
- [ ] Ensure **Confirm email** is set to **ON** in production auth settings to prevent unverified account registrations.

---

## 3. Rollback & Disaster Recovery (Vercel)

- [ ] If a faulty deployment reaches production:
  1. Navigate to the **Deployments** tab on the Vercel Dashboard.
  2. Select the last verified healthy deployment.
  3. Click the three dots menu `...` and choose **Promote to Production**.
  4. Immediate instant traffic cutover occurs without rebuild latency.

---

## 4. Legal, Privacy & Compliance Status

- [ ] **Privacy Policy Page**: **NOT BUILT** (Pending creation of dedicated `/privacy` public route).
- [ ] **Account Deletion Flow**: **NOT BUILT** (Pending GDPR/CCPA self-serve data purging RPC and UI handler).
