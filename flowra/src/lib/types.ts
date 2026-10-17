/**
 * Shared zod schemas and DTO types (API inputs, pain events, settings).
 */
import { z } from "zod";
import {
  ASSOCIATED,
  BLEEDING,
  DESCRIPTORS,
  DETECTED_LANGUAGES,
  IMPACTS,
  LANGUAGES,
  LOCATIONS,
  PRODUCT_CATEGORIES,
  RELIEF,
  SOURCES,
} from "./enums";
import { RED_FLAG_CODES } from "./scoring/constants";
import type { Level, RedFlagCode } from "./scoring/constants";
import type { ScoreResult } from "./scoring/engine";

export * from "./enums";
export { RED_FLAG_CODES, RED_FLAG_LABELS } from "./scoring/constants";
export type { Level, RedFlagCode } from "./scoring/constants";

export const MedicationSchema = z.object({
  name: z.string().trim().min(1).max(80),
  relief: z.enum(RELIEF),
});
export type Medication = z.infer<typeof MedicationSchema>;

/** Body for creating / editing a pain event (what the Confirm card sends). */
export const PainEventInputSchema = z.object({
  occurredAt: z.coerce.date(),
  painScore: z.number().int().min(0).max(10),
  descriptors: z.array(z.enum(DESCRIPTORS)).max(DESCRIPTORS.length).default([]),
  locations: z.array(z.enum(LOCATIONS)).max(LOCATIONS.length).default([]),
  onsetNote: z.string().max(300).nullable().default(null),
  durationMinutes: z.number().int().min(0).max(60 * 24 * 7).nullable().default(null),
  isPeriodDay: z.boolean().nullable().default(null),
  bleeding: z.enum(BLEEDING).nullable().default(null),
  functionalImpact: z.enum(IMPACTS).default("none"),
  missedActivity: z.boolean().default(false),
  bedBound: z.boolean().default(false),
  associated: z.array(z.enum(ASSOCIATED)).max(ASSOCIATED.length).default([]),
  medications: z.array(MedicationSchema).max(10).default([]),
  redFlags: z.array(z.enum(RED_FLAG_CODES)).max(RED_FLAG_CODES.length).default([]),
  transcript: z.string().max(4000).default(""),
  transcriptEn: z.string().max(4000).default(""),
  languageDetected: z.enum(DETECTED_LANGUAGES).default("en"),
  source: z.enum(SOURCES).default("text"),
  confidence: z.number().min(0).max(1).default(1),
});
export type PainEventInput = z.infer<typeof PainEventInputSchema>;
export type PainEventFormValues = z.input<typeof PainEventInputSchema>;

export const PainEventPatchSchema = PainEventInputSchema.partial().extend({ id: z.string().min(1) });

export interface PainEventDTO {
  id: string;
  occurredAt: string;
  painScore: number;
  descriptors: (typeof DESCRIPTORS)[number][];
  locations: (typeof LOCATIONS)[number][];
  onsetNote: string | null;
  durationMinutes: number | null;
  isPeriodDay: boolean | null;
  bleeding: (typeof BLEEDING)[number] | null;
  functionalImpact: (typeof IMPACTS)[number];
  missedActivity: boolean;
  bedBound: boolean;
  associated: (typeof ASSOCIATED)[number][];
  medications: Medication[];
  redFlags: RedFlagCode[];
  transcript: string;
  transcriptEn: string;
  languageDetected: string;
  source: (typeof SOURCES)[number];
  confidence: number;
  createdAt: string;
}

export interface PeriodDTO {
  id: string;
  startDate: string;
  endDate: string | null;
}

export const PeriodActionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("start"), date: z.coerce.date() }),
  z.object({ action: z.literal("end"), date: z.coerce.date() }),
  z.object({ action: z.literal("delete"), id: z.string().min(1) }),
]);

export const RegisterSchema = z.object({
  name: z.string().trim().min(1, "Please enter your name").max(60),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(8, "At least 8 characters").max(100),
});
export const LoginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(1, "Enter your password").max(100),
});

export const SettingsSchema = z.object({
  name: z.string().trim().min(1).max(60).optional(),
  language: z.enum(LANGUAGES).optional(),
  personalizeShop: z.boolean().optional(),
  avgCycleLength: z.number().int().min(15).max(60).nullable().optional(),
  consent: z.literal(true).optional(),
  goal: z.enum(["track", "symptoms", "conceive", "care"]).optional(),
});

export interface MeDTO {
  goal: string;
  plan: "free" | "plus";
  isAdmin: boolean;
  settings: import("./settings").UserSettings;
  id: string;
  name: string;
  email: string;
  language: (typeof LANGUAGES)[number];
  consentAt: string | null;
  personalizeShop: boolean;
  avgCycleLength: number | null;
  isDemo: boolean;
}

export interface ScoreDTO extends ScoreResult {
  level: Level;
}

export const ProductQuerySchema = z.object({
  q: z.string().trim().max(60).optional(),
  category: z.enum(PRODUCT_CATEGORIES).optional(),
});

export interface ProductDTO {
  id: string;
  name: string;
  category: (typeof PRODUCT_CATEGORIES)[number];
  description: string;
  priceInr: number;
  emoji: string;
  tags: string[];
  sponsored: boolean;
  affiliate: boolean;
  url: string;
  retailer: string;
  linkVerified: boolean;
  stock: number;
}

export const OrderInputSchema = z.object({
  items: z
    .array(z.object({ productId: z.string().min(1), qty: z.number().int().min(1).max(10) }))
    .min(1, "Your cart is empty")
    .max(30),
});

export interface OrderDTO {
  id: string;
  status: string;
  totalInr: number;
  createdAt: string;
  items: { productId: string; name: string; emoji: string; qty: number; priceInr: number }[];
}

export const SummaryQuerySchema = z.object({
  days: z.coerce.number().refine((d) => d === 30 || d === 60 || d === 90, "days must be 30, 60 or 90").default(30),
});

export const DailyLogInputSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  flow: z.enum(["none", "spotting", "light", "medium", "heavy"]).nullable().default(null),
  pbac: z
    .object({
      padLight: z.number().int().min(0).max(50).optional(),
      padMedium: z.number().int().min(0).max(50).optional(),
      padFull: z.number().int().min(0).max(50).optional(),
      tamponLight: z.number().int().min(0).max(50).optional(),
      tamponMedium: z.number().int().min(0).max(50).optional(),
      tamponFull: z.number().int().min(0).max(50).optional(),
      clotSmall: z.number().int().min(0).max(50).optional(),
      clotLarge: z.number().int().min(0).max(50).optional(),
      flooding: z.number().int().min(0).max(50).optional(),
    })
    .default({}),
  mood: z.number().int().min(1).max(5).nullable().default(null),
  energy: z.number().int().min(1).max(5).nullable().default(null),
  sleepHours: z.number().min(0).max(24).nullable().default(null),
  symptoms: z.array(z.string().max(40)).max(60).default([]),
  custom: z.array(z.string().trim().min(1).max(30)).max(12).default([]),
  notes: z.string().max(2000).nullable().default(null),
});
export type DailyLogInput = z.infer<typeof DailyLogInputSchema>;
