---
name: Orval mutation variable shape
description: Mutations with path-param IDs take { id, data } not { data: { id, ... } }; id-only mutations take { id } only.
---

## Rule
For Orval mutations that operate on a resource by ID:

- **With a body:** `mutate({ id: resource.id, data: { ...fields } })`
- **ID-only (no body):** `mutate({ id: resource.id })`

**Why:** Orval generates mutation variable types as `{ id: number; data: BodyType<Input> }` (path param + body) or `{ id: number }` (path param only). The `id` is always a sibling of `data`, never nested inside it. Nesting it as `{ data: { id, ... } }` is a common mistake when the API body schema also conceptually "selects" a resource.

**Examples fixed in this codebase:**
- `useSetPrimaryResume`: `mutate({ id })` not `mutate({ data: { id } })`
- `useStopFocusSession`: `mutate({ id: activeSession.id })` not `mutate(undefined)`
- `useToggleHabitCheckin`: `mutate({ id: habit.id, data: { date } })` not `mutate({ data: { habitId, date } })`
