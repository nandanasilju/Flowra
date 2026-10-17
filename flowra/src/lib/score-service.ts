/** Server-side glue: load a user's data, run the pure engine, store snapshots. */
import { prisma } from "./db";
import { toPeriodRange, toScoringEvent } from "./dto";
import { toJson } from "./json";
import { computeScore, type ScoreResult } from "./scoring/engine";
import { WINDOW_DAYS } from "./scoring/constants";

const DAY_MS = 86_400_000;

export async function computeUserScore(userId: string, now: Date = new Date()): Promise<ScoreResult> {
  // Load a little more than the window; the engine applies the exact window itself.
  const since = new Date(now.getTime() - (WINDOW_DAYS + 2) * DAY_MS);
  const [events, periods] = await Promise.all([
    prisma.painEvent.findMany({ where: { userId, occurredAt: { gte: since, lte: now } }, orderBy: { occurredAt: "asc" } }),
    prisma.periodLog.findMany({ where: { userId, startDate: { gte: new Date(since.getTime() - 15 * DAY_MS) } } }),
  ]);
  return computeScore({ events: events.map(toScoringEvent), periods: periods.map(toPeriodRange), now });
}

export async function saveSnapshot(userId: string, r: ScoreResult): Promise<void> {
  await prisma.scoreSnapshot.create({
    data: {
      userId,
      score: r.score,
      level: r.level,
      components: toJson(r.components),
      reasons: toJson(r.reasons),
      redFlag: r.redFlag,
    },
  });
}

export async function recomputeAndSnapshot(userId: string): Promise<ScoreResult> {
  const r = await computeUserScore(userId);
  await saveSnapshot(userId, r);
  return r;
}
