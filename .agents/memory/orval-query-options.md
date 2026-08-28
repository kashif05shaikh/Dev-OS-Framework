---
name: Orval query-options enabled pattern
description: How to correctly pass enabled/conditional query options in Orval-generated React Query hooks in this stack.
---

## Rule
When conditionally enabling an Orval-generated query hook, cast the options object with `as any`:

```ts
useListThing(params, { query: { enabled: !!id } as any })
```

**Why:** Orval generates hooks whose second argument is `{ query?: UseQueryOptions<...> }`. TanStack Query v5's `UseQueryOptions` requires a `queryKey` field, but Orval fills that in internally. The public type doesn't reflect this, so passing `{ enabled: ... }` alone fails the TypeScript check. The cast is safe — Orval merges the queryKey at runtime.

**How to apply:** Any time a page/component passes `{ query: { enabled: ... } }` to a generated hook, add `as any` to the `{ enabled: ... }` object. Do not modify the generated file.
