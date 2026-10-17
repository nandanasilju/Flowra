/**
 * Extraction contract: the zod schema every AI output must pass, plus the
 * equivalent JSON response schema sent to Gemini.
 * Parsing is lenient on enums (unknown values are dropped) but strict on types and ranges.
 */
import { z } from "zod";
import { ASSOCIATED, BLEEDING, DESCRIPTORS, DETECTED_LANGUAGES, IMPACTS, LOCATIONS, RELIEF } from "../enums";
import { RED_FLAG_CODES } from "../scoring/constants";

function enumArray<T extends string>(values: readonly T[]) {
  return z
    .array(z.string())
    .nullish()
    .transform((arr) => [...new Set((arr ?? []).map((s) => s.trim().toLowerCase()))].filter((s): s is T => (values as readonly string[]).includes(s)));
}

function enumOrNull<T extends string>(values: readonly T[]) {
  return z
    .string()
    .nullish()
    .transform((s) => {
      const v = (s ?? "").trim().toLowerCase();
      return (values as readonly string[]).includes(v) ? (v as T) : null;
    });
}

export const EXTRACTABLE_FIELDS = [
  "painScore",
  "descriptors",
  "locations",
  "durationMinutes",
  "isPeriodDay",
  "bleeding",
  "functionalImpact",
  "associated",
  "medications",
] as const;
export type ExtractableField = (typeof EXTRACTABLE_FIELDS)[number];

export const ExtractionSchema = z.object({
  transcript: z.string().max(4000).default(""),
  transcriptEn: z.string().max(4000).default(""),
  languageDetected: enumOrNull(DETECTED_LANGUAGES).transform((v) => v ?? "other"),
  painScore: z
    .number()
    .min(0)
    .max(10)
    .nullish()
    .transform((v) => (v === null || v === undefined ? null : Math.round(v))),
  descriptors: enumArray(DESCRIPTORS),
  locations: enumArray(LOCATIONS),
  onsetNote: z.string().max(300).nullish().transform((v) => v ?? null),
  durationMinutes: z
    .number()
    .min(0)
    .max(60 * 24 * 7)
    .nullish()
    .transform((v) => (v === null || v === undefined ? null : Math.round(v))),
  isPeriodDay: z.boolean().nullish().transform((v) => v ?? null),
  bleeding: enumOrNull(BLEEDING),
  functionalImpact: enumOrNull(IMPACTS),
  missedActivity: z.boolean().nullish().transform((v) => v ?? null),
  bedBound: z.boolean().nullish().transform((v) => v ?? null),
  associated: enumArray(ASSOCIATED),
  medications: z
    .array(z.object({ name: z.string().trim().min(1).max(80), relief: enumOrNull(RELIEF).transform((r) => r ?? "unknown") }))
    .max(10)
    .nullish()
    .transform((m) => m ?? []),
  redFlagsMentioned: enumArray(RED_FLAG_CODES),
  confidence: z.number().min(0).max(1).nullish().transform((v) => v ?? 0.5),
  missingFields: z.array(z.string()).nullish().transform((v) => v ?? []),
});

export type Extraction = z.output<typeof ExtractionSchema>;

/** What POST /api/voice/extract returns. */
export interface ExtractResponse {
  transcript: string;
  transcriptEn: string;
  languageDetected: string;
  extracted: Extraction;
  missingFields: ExtractableField[];
  followUpQuestion: string | null;
  confidence: number;
  engine: "gemini" | "sample" | "offline";
  notice: string | null;
}

/** Gemini responseSchema (OpenAPI subset). Kept in sync with ExtractionSchema above. */
export const GEMINI_RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    transcript: { type: "STRING" },
    transcriptEn: { type: "STRING" },
    languageDetected: { type: "STRING", enum: [...DETECTED_LANGUAGES] },
    painScore: { type: "INTEGER", nullable: true },
    descriptors: { type: "ARRAY", items: { type: "STRING", enum: [...DESCRIPTORS] } },
    locations: { type: "ARRAY", items: { type: "STRING", enum: [...LOCATIONS] } },
    onsetNote: { type: "STRING", nullable: true },
    durationMinutes: { type: "INTEGER", nullable: true },
    isPeriodDay: { type: "BOOLEAN", nullable: true },
    bleeding: { type: "STRING", enum: [...BLEEDING], nullable: true },
    functionalImpact: { type: "STRING", enum: [...IMPACTS], nullable: true },
    missedActivity: { type: "BOOLEAN", nullable: true },
    bedBound: { type: "BOOLEAN", nullable: true },
    associated: { type: "ARRAY", items: { type: "STRING", enum: [...ASSOCIATED] } },
    medications: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: { name: { type: "STRING" }, relief: { type: "STRING", enum: [...RELIEF] } },
        required: ["name", "relief"],
      },
    },
    redFlagsMentioned: { type: "ARRAY", items: { type: "STRING", enum: [...RED_FLAG_CODES] } },
    confidence: { type: "NUMBER" },
    missingFields: { type: "ARRAY", items: { type: "STRING" } },
  },
  required: ["transcript", "transcriptEn", "languageDetected", "painScore", "confidence"],
} as const;
