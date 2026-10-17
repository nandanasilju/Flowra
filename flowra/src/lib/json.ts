/**
 * Typed JSON helpers. Arrays/objects are stored as JSON strings so the schema
 * works on both SQLite and Postgres. Parsing is defensive: bad data never crashes a page.
 */
import { z } from "zod";

export function toJson(value: unknown): string {
  return JSON.stringify(value ?? null);
}

export function parseJson<T>(raw: string | null | undefined, schema: z.ZodType<T>, fallback: T): T {
  if (!raw) return fallback;
  try {
    const result = schema.safeParse(JSON.parse(raw));
    return result.success ? result.data : fallback;
  } catch {
    return fallback;
  }
}

/** Parse a JSON array of allowed enum values, silently dropping unknown items. */
export function parseEnumArray<T extends string>(raw: string | null | undefined, allowed: readonly T[]): T[] {
  if (!raw) return [];
  try {
    const v: unknown = JSON.parse(raw);
    if (!Array.isArray(v)) return [];
    return v.filter((x): x is T => typeof x === "string" && (allowed as readonly string[]).includes(x));
  } catch {
    return [];
  }
}

export function parseStringArray(raw: string | null | undefined): string[] {
  return parseJson(raw, z.array(z.string()), []);
}
