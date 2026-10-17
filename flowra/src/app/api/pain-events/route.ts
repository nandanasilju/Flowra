import { z } from "zod";
import { handle, HttpError, json, readJson } from "@/lib/api";
import { requireConsentedUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { toPainEventDTO } from "@/lib/dto";
import { userCipher, type FieldCipher } from "@/lib/crypto";
import { parseSettings } from "@/lib/settings";
import { toJson } from "@/lib/json";
import { recomputeAndSnapshot } from "@/lib/score-service";
import { PainEventInputSchema, PainEventPatchSchema, type PainEventInput } from "@/lib/types";

export const dynamic = "force-dynamic";

const ListQuery = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  limit: z.coerce.number().int().min(1).max(500).default(200),
});

function toRow(input: Partial<PainEventInput>, c: FieldCipher, keepText: boolean) {
  return {
    occurredAt: input.occurredAt,
    painScore: input.painScore,
    descriptors: input.descriptors ? toJson(input.descriptors) : undefined,
    locations: input.locations ? toJson(input.locations) : undefined,
    onsetNote: input.onsetNote === undefined ? undefined : c.encN(input.onsetNote),
    durationMinutes: input.durationMinutes,
    isPeriodDay: input.isPeriodDay,
    bleeding: input.bleeding,
    functionalImpact: input.functionalImpact,
    missedActivity: input.missedActivity,
    bedBound: input.bedBound,
    associated: input.associated ? toJson(input.associated) : undefined,
    medications: input.medications ? toJson(input.medications) : undefined,
    redFlags: input.redFlags ? toJson(input.redFlags) : undefined,
    transcript: input.transcript === undefined ? undefined : keepText ? c.enc(input.transcript) : "",
    transcriptEn: input.transcriptEn === undefined ? undefined : keepText ? c.enc(input.transcriptEn) : "",
    languageDetected: input.languageDetected,
    source: input.source,
    confidence: input.confidence,
  };
}

export const GET = handle(async (req) => {
  const user = await requireConsentedUser();
  const q = ListQuery.parse(Object.fromEntries(req.nextUrl.searchParams));
  const events = await prisma.painEvent.findMany({
    where: { userId: user.id, occurredAt: { gte: q.from, lte: q.to } },
    orderBy: { occurredAt: "desc" },
    take: q.limit,
  });
  const c = await userCipher(user);
  return json({ events: events.map((e) => toPainEventDTO(e, c)) });
});

/** Save a CONFIRMED event (the only way voice data is persisted). */
export const POST = handle(async (req) => {
  const user = await requireConsentedUser();
  const input = PainEventInputSchema.parse(await readJson(req));
  if (input.occurredAt.getTime() > Date.now() + 5 * 60 * 1000) throw new HttpError(400, "The time can't be in the future.");
  const c = await userCipher(user);
  const row = toRow(input, c, parseSettings(user.settings).privacy.saveTranscripts);
  const event = await prisma.painEvent.create({
    data: { ...row, userId: user.id, occurredAt: input.occurredAt, painScore: input.painScore },
  });
  const score = await recomputeAndSnapshot(user.id);
  return json({ event: toPainEventDTO(event, c), score }, 201);
});

export const PATCH = handle(async (req) => {
  const user = await requireConsentedUser();
  const { id, ...patch } = PainEventPatchSchema.parse(await readJson(req));
  const existing = await prisma.painEvent.findFirst({ where: { id, userId: user.id } });
  if (!existing) throw new HttpError(404, "Log not found.");
  const c = await userCipher(user);
  const event = await prisma.painEvent.update({ where: { id }, data: toRow(patch, c, parseSettings(user.settings).privacy.saveTranscripts) });
  const score = await recomputeAndSnapshot(user.id);
  return json({ event: toPainEventDTO(event, c), score });
});

export const DELETE = handle(async (req) => {
  const user = await requireConsentedUser();
  const id = z.string().min(1).parse(req.nextUrl.searchParams.get("id"));
  const { count } = await prisma.painEvent.deleteMany({ where: { id, userId: user.id } });
  if (count === 0) throw new HttpError(404, "Log not found.");
  const score = await recomputeAndSnapshot(user.id);
  return json({ ok: true, score });
});
