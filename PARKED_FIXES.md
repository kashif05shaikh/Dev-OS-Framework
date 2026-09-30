# Parked Fixes

| ID   | File                                      | Line  | Issue                                                           | Planned Fix                                                   |
| ---- | ----------------------------------------- | ----- | --------------------------------------------------------------- | ------------------------------------------------------------- |
| P1-1 | `src/components/landing/showcase.tsx`     | 76-77 | `lvl` is possibly `undefined` and type mismatch                 | Add a fallback value or type guard for `lvl` before using it. |
| P1-2 | `src/routes/_authenticated.resume.tsx`    | 127   | `useMemo` is missing a dependency                               | Add the missing dependency array values.                      |
| P1-3 | Global                                    | N/A   | 1,500+ Prettier formatting errors                               | Run `npm run format` / `prettier --write .`                   |
| P1-4 | `package-lock.json`                       | N/A   | 3 High severity vulnerabilities in npm deps                     | Run `npm audit fix`                                           |
| P1-5 | `src/routes/_authenticated.analytics.tsx` | 140   | Goal completion calculation could divide by zero if target is 0 | Ensure target > 0 check is used everywhere.                   |
