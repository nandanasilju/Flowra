/**
 * POST /api/voice/extract
 * - multipart/form-data: audio (File, ≤ 8 MB), language, followUpCount, followUpQuestion?, browserTranscript?
 * - application/json: { text } | { sampleId }, language, followUpCount, followUpQuestion?
 *
 * PRIVACY: audio is read into memory, sent inline to the AI service for
 * extraction, and discarded when this request ends. It is never written to disk,
 * the database or logs. Nothing is saved here: saving happens only after the
 * user taps Confirm (POST /api/pain-events).
 */
import { z } from "zod";
import { handle, HttpError, json, readJson } from "@/lib/api";
import { requireConsentedUser } from "@/lib/auth";
import { LANGUAGES } from "@/lib/enums";
import { ExtractionUnavailableError, runExtraction } from "@/lib/extraction";
import { rateLimit } from "@/lib/ratelimit";
import { parseSettings } from "@/lib/settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_AUDIO_BYTES = 8 * 1024 * 1024;
const ALLOWED_AUDIO = ["audio/webm", "audio/mp4", "audio/ogg", "audio/mpeg", "audio/wav", "audio/aac", "audio/x-m4a"];

const CommonSchema = z.object({
  language: z.enum(LANGUAGES).default("en"),
  followUpCount: z.coerce.number().int().min(0).max(5).default(0),
  followUpQuestion: z.string().max(300).optional(),
});

const JsonSchema = CommonSchema.extend({
  text: z.string().trim().min(1).max(2000).optional(),
  sampleId: z.string().max(40).optional(),
}).refine((b) => Boolean(b.text) !== Boolean(b.sampleId), "Send either text or sampleId");

const FormSchema = CommonSchema.extend({
  browserTranscript: z.string().max(2000).optional(),
});

export const POST = handle(async (req) => {
  const user = await requireConsentedUser();
  rateLimit(`voice:${user.id}`, 30, 60_000);
  const cloudAi = parseSettings(user.settings).privacy.useCloudAi;
  const contentType = req.headers.get("content-type") ?? "";

  try {
    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const fields = FormSchema.parse({
        language: form.get("language") ?? undefined,
        followUpCount: form.get("followUpCount") ?? undefined,
        followUpQuestion: form.get("followUpQuestion") ?? undefined,
        browserTranscript: form.get("browserTranscript") ?? undefined,
      });
      const audio = form.get("audio");
      if (!(audio instanceof Blob) || audio.size === 0) throw new HttpError(400, "No audio received. Please try again.");
      if (audio.size > MAX_AUDIO_BYTES) throw new HttpError(413, "That recording is too long. Please keep it under a minute.");
      const mimeType = (audio.type || "audio/webm").split(";")[0].trim();
      if (!ALLOWED_AUDIO.includes(mimeType)) throw new HttpError(415, "Unsupported audio format.");
      // In-memory only.
      const base64 = Buffer.from(await audio.arrayBuffer()).toString("base64");
      const result = await runExtraction({
        audio: { base64, mimeType },
        browserTranscript: fields.browserTranscript,
        followUpQuestion: fields.followUpQuestion,
        language: fields.language,
        followUpCount: fields.followUpCount,
        cloudAi,
      });
      return json(result);
    }

    const body = JsonSchema.parse(await readJson(req));
    const result = await runExtraction({
      text: body.text,
      sampleId: body.sampleId,
      followUpQuestion: body.followUpQuestion,
      language: body.language,
      followUpCount: body.followUpCount,
      cloudAi,
    });
    return json(result);
  } catch (err) {
    if (err instanceof ExtractionUnavailableError) throw new HttpError(503, err.message);
    throw err;
  }
});
