/**
 * Extraction orchestrator: sample → Gemini → offline fallback.
 * Every path ends in ExtractionSchema (zod) validation and the same post-processing.
 */
import type { Language } from "../enums";
import { callGemini, geminiConfigured } from "./gemini";
import { buildResponse } from "./normalize";
import { offlineExtract } from "./offline";
import { getSample } from "./samples";
import { ExtractionSchema, type ExtractResponse } from "./schema";

export class ExtractionUnavailableError extends Error {}

export interface ExtractionRequest {
  audio?: { base64: string; mimeType: string };
  text?: string;
  sampleId?: string;
  browserTranscript?: string;
  followUpQuestion?: string;
  language: Language;
  followUpCount: number;
  /** User privacy setting: false = never send her note to the cloud AI; use on-server keyword extraction only. */
  cloudAi?: boolean;
}

export async function runExtraction(req: ExtractionRequest): Promise<ExtractResponse> {
  if (req.sampleId) {
    const sample = getSample(req.sampleId);
    if (!sample) throw new ExtractionUnavailableError("Unknown sample");
    const x = ExtractionSchema.parse(sample.result);
    return buildResponse(x, "sample", req.language, req.followUpCount, "Sample voice note: cached result (works offline).");
  }

  let notice: string | null = null;
  if (req.cloudAi === false) {
    notice = "Cloud AI is turned off in your privacy settings, so we used on-server keyword matching. Please check every field.";
  } else if (geminiConfigured()) {
    try {
      const raw = await callGemini({ audio: req.audio, text: req.text, followUpQuestion: req.followUpQuestion });
      const parsed = ExtractionSchema.safeParse(raw);
      if (parsed.success) return buildResponse(parsed.data, "gemini", req.language, req.followUpCount);
      notice = "The AI answer didn't pass our checks, so we used basic keyword matching. Please check every field.";
    } catch (err) {
      // Log only the error message (never the note or audio) so misconfigured keys/models are visible.
      console.warn("[extraction] Gemini call failed:", err instanceof Error ? err.message.slice(0, 300) : String(err));
      notice = "The AI service didn't respond in time, so we used basic keyword matching. Please check every field.";
    }
  } else if (!notice) {
    notice = "AI service not configured: using basic keyword matching. Please check every field.";
  }

  const fallbackText = req.text?.trim() || req.browserTranscript?.trim();
  if (fallbackText) {
    return buildResponse(offlineExtract(fallbackText), "offline", req.language, req.followUpCount, notice);
  }
  throw new ExtractionUnavailableError(
    "We couldn't process the voice note right now. Please type what you said instead; nothing has been saved.",
  );
}
