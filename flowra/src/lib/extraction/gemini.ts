/**
 * Gemini call for transcription + structured extraction. Server-only:
 * the API key is read from process.env and never sent to the browser.
 * Audio is passed inline (base64) and never written to disk or the database.
 */
import { GoogleGenAI, ThinkingLevel, type Schema } from "@google/genai";
import { EXTRACTION_SYSTEM_PROMPT, followUpPrompt } from "./prompt";
import { GEMINI_RESPONSE_SCHEMA } from "./schema";

// Flash-class default. CONFIRM the current model id in Google AI Studio and set GEMINI_MODEL.
export const DEFAULT_GEMINI_MODEL = "gemini-3.8-flash";
export const AI_TIMEOUT_MS = 15000;

export function geminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim());
}

export interface GeminiInput {
  audio?: { base64: string; mimeType: string };
  text?: string;
  followUpQuestion?: string;
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("AI request timed out")), ms);
    p.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e: unknown) => {
        clearTimeout(timer);
        reject(e instanceof Error ? e : new Error("AI request failed"));
      },
    );
  });
}

/** Returns the raw JSON object produced by the model (validate it with ExtractionSchema). */
export async function callGemini(input: GeminiInput, timeoutMs: number = AI_TIMEOUT_MS): Promise<unknown> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");
  const ai = new GoogleGenAI({ apiKey });

  const parts: ({ inlineData: { mimeType: string; data: string } } | { text: string })[] = [];
  if (input.audio) parts.push({ inlineData: { mimeType: input.audio.mimeType, data: input.audio.base64 } });
  if (input.text) parts.push({ text: `Typed note:\n${input.text}` });
  if (input.followUpQuestion) parts.push({ text: followUpPrompt(input.followUpQuestion) });

  const response = await withTimeout(
    ai.models.generateContent({
      model: process.env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL,
      contents: [{ role: "user", parts }],
      config: {
        systemInstruction: EXTRACTION_SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: GEMINI_RESPONSE_SCHEMA as unknown as Schema,
        temperature: 0,
        // Field extraction needs no deep reasoning; low thinking keeps latency under AI_TIMEOUT_MS.
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      },
    }),
    timeoutMs,
  );
  const text = response.text;
  if (!text) throw new Error("Empty AI response");
  return JSON.parse(text) as unknown;
}
