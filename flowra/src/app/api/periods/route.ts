import { handle, HttpError, json, readJson } from "@/lib/api";
import { requireConsentedUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { toPeriodDTO } from "@/lib/dto";
import { averageCycleLength, predictNextPeriod } from "@/lib/period";
import { recomputeAndSnapshot } from "@/lib/score-service";
import { PeriodActionSchema } from "@/lib/types";

export const dynamic = "force-dynamic";

export const GET = handle(async () => {
  const user = await requireConsentedUser();
  const periods = await prisma.periodLog.findMany({ where: { userId: user.id }, orderBy: { startDate: "desc" }, take: 24 });
  const starts = periods.map((p) => p.startDate);
  const next = predictNextPeriod(starts, user.avgCycleLength);
  return json({
    periods: periods.map(toPeriodDTO),
    averageCycleLength: averageCycleLength(starts),
    nextPeriod: next ? { date: next.date.toISOString(), daysUntil: next.daysUntil, cycleLength: next.cycleLength } : null,
  });
});

/** { action: "start", date } | { action: "end", date } | { action: "delete", id } */
export const POST = handle(async (req) => {
  const user = await requireConsentedUser();
  const body = PeriodActionSchema.parse(await readJson(req));

  if (body.action === "start") {
    const day = new Date(body.date);
    const open = await prisma.periodLog.findFirst({ where: { userId: user.id, endDate: null }, orderBy: { startDate: "desc" } });
    if (open && Math.abs(open.startDate.getTime() - day.getTime()) < 10 * 86_400_000) {
      throw new HttpError(409, "A period is already in progress. Log its end first.");
    }
    await prisma.periodLog.create({ data: { userId: user.id, startDate: day } });
  } else if (body.action === "end") {
    const open = await prisma.periodLog.findFirst({
      where: { userId: user.id, endDate: null, startDate: { lte: body.date } },
      orderBy: { startDate: "desc" },
    });
    if (!open) throw new HttpError(404, "No open period to end. Log a start date first.");
    await prisma.periodLog.update({ where: { id: open.id }, data: { endDate: body.date } });
  } else {
    const { count } = await prisma.periodLog.deleteMany({ where: { id: body.id, userId: user.id } });
    if (count === 0) throw new HttpError(404, "Period not found.");
  }

  // Keep the computed average cycle length on the user (used by the opt-in reminder).
  const starts = (await prisma.periodLog.findMany({ where: { userId: user.id }, select: { startDate: true } })).map((p) => p.startDate);
  const avg = averageCycleLength(starts);
  if (avg) await prisma.user.update({ where: { id: user.id }, data: { avgCycleLength: avg } });

  const score = await recomputeAndSnapshot(user.id);
  return json({ ok: true, score });
});
