/** Convert Prisma rows (JSON strings) into typed DTOs and scoring inputs. */
import type { Appointment, DailyLog, Doctor, Order, OrderItem, PainEvent, PeriodLog, Product, User } from "@prisma/client";
import type { FieldCipher } from "./crypto";
import { parseSettings } from "./settings";
import { FLOWS, SYMPTOMS, PBAC_KEYS, pbacScore, type Pbac } from "./enums";
import { z } from "zod";
import { ASSOCIATED, DESCRIPTORS, LOCATIONS, PRODUCT_CATEGORIES } from "./enums";
import { parseEnumArray, parseJson, parseStringArray } from "./json";
import { RED_FLAG_CODES } from "./scoring/constants";
import type { PeriodRange, ScoringEvent } from "./scoring/engine";
import {
  MedicationSchema,
  type MeDTO,
  type OrderDTO,
  type PainEventDTO,
  type PeriodDTO,
  type ProductDTO,
} from "./types";

const BLEEDING_SET = new Set(["none", "spotting", "light", "medium", "heavy"]);
const IMPACT_SET = new Set(["none", "some", "severe"]);
const SOURCE_SET = new Set(["voice", "text", "sample"]);

/** Plaintext view for scoring (no free-text fields needed). */
function basePainEvent(e: PainEvent): Omit<PainEventDTO, "transcript" | "transcriptEn" | "onsetNote"> {
  return {
    id: e.id,
    occurredAt: e.occurredAt.toISOString(),
    painScore: e.painScore,
    descriptors: parseEnumArray(e.descriptors, DESCRIPTORS),
    locations: parseEnumArray(e.locations, LOCATIONS),
    durationMinutes: e.durationMinutes,
    isPeriodDay: e.isPeriodDay,
    bleeding: e.bleeding && BLEEDING_SET.has(e.bleeding) ? (e.bleeding as PainEventDTO["bleeding"]) : null,
    functionalImpact: IMPACT_SET.has(e.functionalImpact) ? (e.functionalImpact as PainEventDTO["functionalImpact"]) : "none",
    missedActivity: e.missedActivity,
    bedBound: e.bedBound,
    associated: parseEnumArray(e.associated, ASSOCIATED),
    medications: parseJson(e.medications, z.array(MedicationSchema), []),
    redFlags: parseEnumArray(e.redFlags, RED_FLAG_CODES),
    languageDetected: e.languageDetected,
    source: SOURCE_SET.has(e.source) ? (e.source as PainEventDTO["source"]) : "text",
    confidence: e.confidence,
    createdAt: e.createdAt.toISOString(),
  };
}

export function toPainEventDTO(e: PainEvent, cipher: FieldCipher): PainEventDTO {
  return { ...basePainEvent(e), onsetNote: cipher.decN(e.onsetNote), transcript: cipher.dec(e.transcript), transcriptEn: cipher.dec(e.transcriptEn) };
}

export function toScoringEvent(e: PainEvent): ScoringEvent {
  const d = basePainEvent(e);
  return {
    id: d.id,
    occurredAt: e.occurredAt,
    painScore: d.painScore,
    isPeriodDay: d.isPeriodDay,
    functionalImpact: d.functionalImpact,
    missedActivity: d.missedActivity,
    bedBound: d.bedBound,
    associated: d.associated,
    medications: d.medications,
    redFlags: d.redFlags,
  };
}

export function toPeriodRange(p: PeriodLog): PeriodRange {
  return { start: p.startDate, end: p.endDate };
}

export function toPeriodDTO(p: PeriodLog): PeriodDTO {
  return { id: p.id, startDate: p.startDate.toISOString(), endDate: p.endDate ? p.endDate.toISOString() : null };
}

export function toMeDTO(u: User): MeDTO {
  return {
    goal: u.goal,
    plan: u.plan === "plus" ? "plus" : "free",
    isAdmin: u.isAdmin || (process.env.ADMIN_EMAILS ?? "").split(",").map((x) => x.trim().toLowerCase()).includes(u.email.toLowerCase()),
    settings: parseSettings(u.settings),
    id: u.id,
    name: u.name,
    email: u.email,
    language: u.language === "hi" || u.language === "ml" ? u.language : "en",
    consentAt: u.consentAt ? u.consentAt.toISOString() : null,
    personalizeShop: u.personalizeShop,
    avgCycleLength: u.avgCycleLength,
    isDemo: u.isDemo,
  };
}

export function toProductDTO(p: Product): ProductDTO {
  const cat = (PRODUCT_CATEGORIES as readonly string[]).includes(p.category) ? (p.category as ProductDTO["category"]) : "hygiene";
  return {
    id: p.id,
    name: p.name,
    category: cat,
    description: p.description,
    priceInr: p.priceInr,
    emoji: p.emoji,
    tags: parseStringArray(p.tags),
    sponsored: p.sponsored,
    affiliate: p.affiliate,
    url: p.url,
    retailer: p.retailer,
    linkVerified: p.linkVerified,
    stock: p.stock,
  };
}

export function toOrderDTO(o: Order & { items: (OrderItem & { product: Product })[] }): OrderDTO {
  return {
    id: o.id,
    status: o.status,
    totalInr: o.totalInr,
    createdAt: o.createdAt.toISOString(),
    items: o.items.map((i) => ({ productId: i.productId, name: i.product.name, emoji: i.product.emoji, qty: i.qty, priceInr: i.priceInr })),
  };
}

export interface DailyLogDTO {
  date: string;
  flow: (typeof FLOWS)[number] | null;
  pbac: Pbac;
  pbacScore: number;
  mood: number | null;
  energy: number | null;
  sleepHours: number | null;
  symptoms: string[];
  custom: string[];
  notes: string | null;
}

export function parsePbac(raw: string): Pbac {
  try {
    const v: unknown = JSON.parse(raw);
    if (!v || typeof v !== "object") return {};
    const out: Pbac = {};
    for (const k of PBAC_KEYS) {
      const n = (v as Record<string, unknown>)[k];
      if (typeof n === "number" && n >= 0 && n <= 50) out[k] = Math.round(n);
    }
    return out;
  } catch {
    return {};
  }
}

export function toDailyLogDTO(l: DailyLog, cipher: FieldCipher | null): DailyLogDTO {
  const pbac = parsePbac(l.pbac);
  return {
    date: l.date,
    flow: l.flow && (FLOWS as readonly string[]).includes(l.flow) ? (l.flow as DailyLogDTO["flow"]) : null,
    pbac,
    pbacScore: pbacScore(pbac),
    mood: l.mood,
    energy: l.energy,
    sleepHours: l.sleepHours,
    symptoms: parseEnumArray(l.symptoms, SYMPTOMS),
    custom: parseStringArray(l.custom),
    notes: cipher ? cipher.decN(l.notes) : null,
  };
}

/** Input shape for the pattern engine. */
export function toPatternLog(l: DailyLog): { date: string; flow: string | null; pbac: Pbac; mood: number | null; energy: number | null; symptoms: string[] } {
  return { date: l.date, flow: l.flow, pbac: parsePbac(l.pbac), mood: l.mood, energy: l.energy, symptoms: parseEnumArray(l.symptoms, SYMPTOMS) };
}

export interface DoctorDTO {
  id: string;
  name: string;
  specialty: string;
  qualifications: string;
  experienceYears: number;
  city: string;
  clinic: string;
  languages: string[];
  modes: string[];
  feeInr: number;
  bio: string;
  verified: boolean;
  isSample: boolean;
  nextSlot: string | null;
}

export function toDoctorDTO(d: Doctor, nextSlot: Date | null): DoctorDTO {
  return {
    id: d.id,
    name: d.name,
    specialty: d.specialty,
    qualifications: d.qualifications,
    experienceYears: d.experienceYears,
    city: d.city,
    clinic: d.clinic,
    languages: parseStringArray(d.languages),
    modes: parseStringArray(d.modes),
    feeInr: d.feeInr,
    bio: d.bio,
    verified: d.verified,
    isSample: d.isSample,
    nextSlot: nextSlot ? nextSlot.toISOString() : null,
  };
}

export interface AppointmentDTO {
  id: string;
  doctorId: string;
  doctorName: string;
  specialty: string;
  clinic: string;
  city: string;
  isSampleDoctor: boolean;
  startsAt: string;
  mode: string;
  status: string;
  feeInr: number;
  platformFeeInr: number;
  notes: string | null;
  reportShared: boolean;
}

export function toAppointmentDTO(a: Appointment & { doctor: Doctor }, cipher: FieldCipher): AppointmentDTO {
  return {
    id: a.id,
    doctorId: a.doctorId,
    doctorName: a.doctor.name,
    specialty: a.doctor.specialty,
    clinic: a.doctor.clinic,
    city: a.doctor.city,
    isSampleDoctor: a.doctor.isSample,
    startsAt: a.startsAt.toISOString(),
    mode: a.mode,
    status: a.status,
    feeInr: a.feeInr,
    platformFeeInr: a.platformFeeInr,
    notes: cipher.decN(a.notes),
    reportShared: Boolean(a.shareLinkId),
  };
}
