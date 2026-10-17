import { z } from "zod";
import { handle, json, readJson } from "@/lib/api";
import { requireConsentedUser } from "@/lib/auth";
import { userCipher } from "@/lib/crypto";
import { prisma } from "@/lib/db";
import { toDailyLogDTO } from "@/lib/dto";
import { SYMPTOMS } from "@/lib/enums";
import { toJson } from "@/lib/json";
import { DailyLogInputSchema } from "@/lib/types";

export const dynamic = "force-dynamic";

const Range = z.object({ from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional() });

export const GET = handle(async (req) => {
  const user = await requireConsentedUser();
  const q = Range.parse(Object.fromEntries(req.nextUrl.searchParams));
  const logs = await prisma.dailyLog.findMany({ where: { userId: user.id, date: { gte: q.from, lte: q.to } }, orderBy: { date: "desc" }, take: 400 });
  const c = await userCipher(user);
  return json({ logs: logs.map((l) => toDailyLogDTO(l, c)) });
});

/** Upsert the log for one day. */
export const POST = handle(async (req) => {
  const user = await requireConsentedUser();
  const input = DailyLogInputSchema.parse(await readJson(req));
  const c = await userCipher(user);
  const known = new Set<string>(SYMPTOMS);
  const data = {
    flow: input.flow,
    pbac: toJson(input.pbac),
    mood: input.mood,
    energy: input.energy,
    sleepHours: input.sleepHours,
    symptoms: toJson([...new Set(input.symptoms.filter((s) => known.has(s)))]),
    custom: toJson(input.custom),
    notes: c.encN(input.notes),
  };
  const log = await prisma.dailyLog.upsert({
    where: { userId_date: { userId: user.id, date: input.date } },
    create: { userId: user.id, date: input.date, ...data },
    update: data,
  });
  return json({ log: toDailyLogDTO(log, c) });
});

export const DELETE = handle(async (req) => {
  const user = await requireConsentedUser();
  const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).parse(req.nextUrl.searchParams.get("date"));
  await prisma.dailyLog.deleteMany({ where: { userId: user.id, date } });
  return json({ ok: true });
});
