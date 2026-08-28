/**
 * Generated Zod schemas coerce OpenAPI `format: date` fields into JS Date
 * objects, but the matching Drizzle columns use `date(..., { mode: "string" })`
 * (calendar dates, no timezone). Convert at the route boundary so inserts/
 * updates always pass a plain YYYY-MM-DD string to the DB layer.
 */
export function toDateOnlyString(value: Date | null | undefined): string | null | undefined {
  if (value === null || value === undefined) return value;
  return value.toISOString().slice(0, 10);
}
