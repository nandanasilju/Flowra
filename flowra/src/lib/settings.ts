/** User settings stored as JSON on the user row (typed + validated here). */
import { z } from "zod";

export const SettingsJsonSchema = z.object({
  reminders: z
    .object({
      periodSoon: z.boolean().default(true),
      periodSoonDays: z.number().int().min(1).max(7).default(2),
      logDaily: z.boolean().default(false),
      logTime: z.string().regex(/^\d{2}:\d{2}$/).default("21:00"),
      fertileWindow: z.boolean().default(false),
      appointments: z.boolean().default(true),
    })
    .default({}),
  calendarView: z.enum(["month", "list"]).default("month"),
  showFertility: z.boolean().default(true),
  customSymptoms: z.array(z.string().trim().min(1).max(30)).max(12).default([]),
  quickSymptoms: z.array(z.string()).max(8).default(["cramps", "bloating", "fatigue", "low_mood"]),
  wellnessGoals: z.array(z.string().trim().min(1).max(60)).max(5).default([]),
  productPrefs: z
    .object({
      flow: z.enum(["light", "medium", "heavy"]).nullable().default(null),
      cotton: z.boolean().default(false),
      organic: z.boolean().default(false),
      reusable: z.boolean().default(false),
      fragranceFree: z.boolean().default(false),
    })
    .default({}),
  dismissedProducts: z.array(z.string()).max(100).default([]),
  accessibility: z
    .object({
      largeText: z.boolean().default(false),
      reduceMotion: z.boolean().default(false),
      highContrast: z.boolean().default(false),
    })
    .default({}),
  privacy: z
    .object({
      useCloudAi: z.boolean().default(true), // voice/text extraction via Gemini
      saveTranscripts: z.boolean().default(true),
    })
    .default({}),
});

export type UserSettings = z.infer<typeof SettingsJsonSchema>;

export function parseSettings(raw: string | null | undefined): UserSettings {
  try {
    const r = SettingsJsonSchema.safeParse(raw ? JSON.parse(raw) : {});
    if (r.success) return r.data;
  } catch {
    /* fall through */
  }
  return SettingsJsonSchema.parse({});
}

/** Patches are merged onto current settings (one level deep), then the result is fully validated. */
export const SettingsPatchSchema = z.record(z.string(), z.unknown());

export function mergeSettings(current: UserSettings, patch: Record<string, unknown>): UserSettings {
  const merged: Record<string, unknown> = { ...current };
  for (const [k, v] of Object.entries(patch)) {
    const cur = (current as Record<string, unknown>)[k];
    if (v && typeof v === "object" && !Array.isArray(v) && cur && typeof cur === "object" && !Array.isArray(cur)) merged[k] = { ...(cur as object), ...(v as object) };
    else if (v !== undefined) merged[k] = v;
  }
  return SettingsJsonSchema.parse(merged);
}
