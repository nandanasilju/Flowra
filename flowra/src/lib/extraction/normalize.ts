/** Post-processing shared by server and client: missing fields, follow-up question, merging answers. */
import { t } from "../i18n";
import type { Language } from "../enums";
import type { ExtractableField, Extraction, ExtractResponse } from "./schema";

export const MAX_FOLLOW_UPS = 2;
export const LOW_CONFIDENCE = 0.6;

export function computeMissingFields(x: Extraction): ExtractableField[] {
  const missing: ExtractableField[] = [];
  if (x.painScore === null) missing.push("painScore");
  if (x.descriptors.length === 0) missing.push("descriptors");
  if (x.locations.length === 0) missing.push("locations");
  if (x.durationMinutes === null) missing.push("durationMinutes");
  if (x.isPeriodDay === null) missing.push("isPeriodDay");
  if (x.bleeding === null) missing.push("bleeding");
  if (x.functionalImpact === null) missing.push("functionalImpact");
  return missing;
}

export function buildResponse(
  x: Extraction,
  engine: ExtractResponse["engine"],
  language: Language,
  followUpCount: number,
  notice: string | null = null,
): ExtractResponse {
  const missingFields = computeMissingFields(x);
  const needsScore = x.painScore === null && followUpCount < MAX_FOLLOW_UPS;
  return {
    transcript: x.transcript,
    transcriptEn: x.transcriptEn,
    languageDetected: x.languageDetected,
    extracted: x,
    missingFields,
    followUpQuestion: needsScore ? t("followUpPain", language) : null,
    confidence: x.confidence,
    engine,
    notice,
  };
}

/** Merge a follow-up answer into the original extraction: only fills gaps, never overwrites. */
export function mergeExtractions(base: Extraction, answer: Extraction): Extraction {
  const union = <T>(a: T[], b: T[]): T[] => [...new Set([...a, ...b])];
  return {
    ...base,
    transcript: [base.transcript, answer.transcript].filter(Boolean).join(" · "),
    transcriptEn: [base.transcriptEn, answer.transcriptEn].filter(Boolean).join(" · "),
    painScore: base.painScore ?? answer.painScore,
    descriptors: base.descriptors.length ? base.descriptors : answer.descriptors,
    locations: base.locations.length ? base.locations : answer.locations,
    onsetNote: base.onsetNote ?? answer.onsetNote,
    durationMinutes: base.durationMinutes ?? answer.durationMinutes,
    isPeriodDay: base.isPeriodDay ?? answer.isPeriodDay,
    bleeding: base.bleeding ?? answer.bleeding,
    functionalImpact: base.functionalImpact ?? answer.functionalImpact,
    missedActivity: base.missedActivity ?? answer.missedActivity,
    bedBound: base.bedBound ?? answer.bedBound,
    associated: union(base.associated, answer.associated),
    medications: base.medications.length ? base.medications : answer.medications,
    redFlagsMentioned: union(base.redFlagsMentioned, answer.redFlagsMentioned),
    confidence: Math.min(base.confidence, answer.confidence),
  };
}
