---
name: OpenAPI date-vs-Drizzle mismatch
description: Codegen coerces format:date OpenAPI fields to JS Date; Drizzle date-only columns use string mode — convert at the route boundary.
---

## Rule
Any route that writes a date-only column (not a timestamp) must call `toDateOnlyString(value)` from `artifacts/api-server/src/lib/dateOnly.ts` before insert/update.

**Why:** Orval/Zod coerces `format: date` fields in the OpenAPI schema into JS `Date` objects. But Drizzle date-only columns (`date(..., { mode: "string" })`) expect a `"YYYY-MM-DD"` string. Passing a `Date` object causes a silent type error or runtime insert failure.

**Affected columns:** `topics.deadline`, `projects.deadline`, `dailyGoals.date`, `dailyTasks.date`, `habitCheckins.date`.

**Timestamp columns** (`scheduledAt`, `startAt`, `endAt`) are fine as native `Date` — those Drizzle columns accept `Date` objects directly.

**How to apply:** On every create/update path that touches a date-only column, wrap the incoming value: `toDateOnlyString(body.deadline)`.
