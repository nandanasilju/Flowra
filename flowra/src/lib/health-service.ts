/** Server helpers that load a user's history and run the pure engines. */
import type { User } from "@prisma/client";
import { prisma } from "./db";
import { toPatternLog, toPeriodRange, toScoringEvent } from "./dto";
import { estimate, futureDays, ymd, addDaysYmd, type CycleEstimate } from "./cycles";
import { analysePatterns, type PatternResult } from "./patterns/engine";
import { PROFILE_RULES } from "./patterns/profiles";
import { parseSettings } from "./settings";

const DAY = 86_400_000;

export async function loadHistory(userId: string, days = PROFILE_RULES.windowDays + 60) {
  const since = new Date(Date.now() - days * DAY);
  const [periods, logs, events] = await Promise.all([
    prisma.periodLog.findMany({ where: { userId }, orderBy: { startDate: "asc" } }),
    prisma.dailyLog.findMany({ where: { userId, date: { gte: ymd(since) } }, orderBy: { date: "asc" } }),
    prisma.painEvent.findMany({ where: { userId, occurredAt: { gte: since } }, orderBy: { occurredAt: "asc" } }),
  ]);
  return { periods, logs, events };
}

export async function cycleFor(user: Pick<User, "id" | "avgCycleLength">): Promise<CycleEstimate> {
  const periods = await prisma.periodLog.findMany({ where: { userId: user.id }, orderBy: { startDate: "asc" } });
  return estimate(periods.map(toPeriodRange), user.avgCycleLength);
}

export async function patternsFor(userId: string): Promise<PatternResult> {
  const h = await loadHistory(userId);
  return analysePatterns({ periods: h.periods.map(toPeriodRange), dailyLogs: h.logs.map(toPatternLog), painEvents: h.events.map(toScoringEvent) });
}

export interface ReminderItem {
  kind: "period_soon" | "period_late" | "fertile" | "log_today" | "appointment";
  text: string;
}

/** In-app reminders that are due today (shown on Today; also used for browser notifications). */
export async function dueReminders(user: User): Promise<ReminderItem[]> {
  const s = parseSettings(user.settings);
  const est = await cycleFor(user);
  const out: ReminderItem[] = [];
  const today = ymd(new Date());
  if (s.reminders.periodSoon && est.nextPeriod && est.nextPeriod.daysUntil >= 0 && est.nextPeriod.daysUntil <= s.reminders.periodSoonDays)
    out.push({ kind: "period_soon", text: est.nextPeriod.daysUntil === 0 ? "Your period may start today (estimate)." : `Your period may start in about ${est.nextPeriod.daysUntil} day${est.nextPeriod.daysUntil === 1 ? "" : "s"} (estimate).` });
  if (est.lateByDays >= 5) out.push({ kind: "period_late", text: `Your period is ${est.lateByDays} days later than estimated. Log it when it starts, or take a pregnancy test if relevant.` });
  if (s.reminders.fertileWindow && s.showFertility && est.fertileWindow && today >= est.fertileWindow.start && today <= est.fertileWindow.end)
    out.push({ kind: "fertile", text: "You're in your estimated fertile window. This is an estimate, not contraception." });
  if (s.reminders.logDaily) {
    const logged = await prisma.dailyLog.findUnique({ where: { userId_date: { userId: user.id, date: today } } });
    if (!logged) out.push({ kind: "log_today", text: "You haven't logged today. It takes 10 seconds." });
  }
  if (s.reminders.appointments) {
    const soon = await prisma.appointment.findFirst({
      where: { userId: user.id, status: "booked", startsAt: { gte: new Date(), lte: new Date(Date.now() + 2 * DAY) } },
      include: { doctor: true },
      orderBy: { startsAt: "asc" },
    });
    if (soon) out.push({ kind: "appointment", text: `Appointment with ${soon.doctor.name} on ${soon.startsAt.toLocaleString("en-IN", { timeZone: "Asia/Kolkata", weekday: "short", hour: "numeric", minute: "2-digit" })}.` });
  }
  return out;
}

export function calendarShading(est: CycleEstimate, showFertility: boolean) {
  const f = futureDays(est, 3);
  const pastPeriod: string[] = [];
  for (const c of est.cycles) for (let d = 0; d < c.periodDays; d++) pastPeriod.push(addDaysYmd(c.start, d));
  return { predictedPeriod: [...f.period], fertile: showFertility ? [...f.fertile] : [], loggedPeriod: pastPeriod };
}
