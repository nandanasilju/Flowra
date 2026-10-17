/**
 * Opt-in "period-ready reminder". Returns show=false unless the user turned on
 * personalizeShop. Uses ONLY the predicted next period date (from period logs),
 * never pain scores, levels or symptoms.
 */
import { handle, json } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { predictNextPeriod } from "@/lib/period";

export const dynamic = "force-dynamic";

const REMINDER_WINDOW_DAYS = 10;

export const GET = handle(async () => {
  const user = await requireUser();
  if (!user.personalizeShop || !user.consentAt) return json({ show: false as const });
  const periods = await prisma.periodLog.findMany({ where: { userId: user.id }, select: { startDate: true } });
  const next = predictNextPeriod(periods.map((p) => p.startDate), user.avgCycleLength);
  if (!next || next.daysUntil < 0 || next.daysUntil > REMINDER_WINDOW_DAYS) return json({ show: false as const });
  return json({ show: true as const, nextPeriodDate: next.date.toISOString(), daysUntil: next.daysUntil });
});
