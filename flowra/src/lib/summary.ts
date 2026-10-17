/** Doctor-summary aggregation (pure). Uses the same engine helpers as the score. */
import { MIN_EVENTS_FOR_BASELINE, PAIN_DAY_THRESHOLD, RED_FLAG_LABELS, type RedFlagCode } from "./scoring/constants";
import { dayKey, effectiveRedFlags, extremeReasons, periodDayKeys, type PeriodRange, type ScoringEvent } from "./scoring/engine";
import { median, round1 } from "./scoring/stats";

export interface SummaryResult {
  days: number;
  from: string;
  to: string;
  eventCount: number;
  painDays: number;
  avgPain: number | null;
  maxPain: number | null;
  extremeEpisodes: { id: string; occurredAt: string; painScore: number; reasons: string[] }[];
  outsidePeriodShare: number | null; // 0..1, null without period data
  periodsLogged: number;
  missedActivityCount: number;
  bedBoundCount: number;
  medications: { name: string; timesTaken: number; none: number; partial: number; full: number; unknown: number }[];
  redFlags: { code: RedFlagCode; label: string; count: number }[];
  daily: { date: string; maxPain: number | null; period: boolean }[];
}

const DAY_MS = 86_400_000;

export function buildSummary(events: ScoringEvent[], periods: PeriodRange[], days: number, now: Date = new Date()): SummaryResult {
  const fromMs = now.getTime() - days * DAY_MS;
  const inRange = events.filter((e) => e.occurredAt.getTime() >= fromMs && e.occurredAt.getTime() <= now.getTime());
  const scores = inRange.map((e) => e.painScore);
  const baseline = inRange.length >= MIN_EVENTS_FOR_BASELINE ? median(scores) : null;

  const dayMax = new Map<string, number>();
  const flaggedPeriodDays = new Set<string>();
  for (const e of inRange) {
    const k = dayKey(e.occurredAt);
    dayMax.set(k, Math.max(dayMax.get(k) ?? 0, e.painScore));
    if (e.isPeriodDay === true) flaggedPeriodDays.add(k);
  }
  const periodKeys = periodDayKeys(periods, now);
  const painDayKeys = [...dayMax.entries()].filter(([, v]) => v >= PAIN_DAY_THRESHOLD).map(([k]) => k);
  const hasPeriodData = periods.length > 0 || inRange.some((e) => e.isPeriodDay !== null);
  const outside = painDayKeys.filter((k) => !periodKeys.has(k) && !flaggedPeriodDays.has(k)).length;

  const meds = new Map<string, SummaryResult["medications"][number]>();
  for (const e of inRange) {
    for (const m of e.medications) {
      const key = m.name.trim().toLowerCase();
      const row = meds.get(key) ?? { name: m.name.trim(), timesTaken: 0, none: 0, partial: 0, full: 0, unknown: 0 };
      row.timesTaken++;
      row[m.relief]++;
      meds.set(key, row);
    }
  }

  const flagCounts = new Map<RedFlagCode, number>();
  for (const e of inRange) for (const f of effectiveRedFlags(e)) flagCounts.set(f, (flagCounts.get(f) ?? 0) + 1);

  const daily: SummaryResult["daily"] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i, 12);
    const k = dayKey(d);
    daily.push({ date: k, maxPain: dayMax.has(k) ? (dayMax.get(k) as number) : null, period: periodKeys.has(k) || flaggedPeriodDays.has(k) });
  }

  return {
    days,
    from: new Date(fromMs).toISOString(),
    to: now.toISOString(),
    eventCount: inRange.length,
    painDays: painDayKeys.length,
    avgPain: scores.length ? round1(scores.reduce((a, b) => a + b, 0) / scores.length) : null,
    maxPain: scores.length ? Math.max(...scores) : null,
    extremeEpisodes: inRange
      .map((e) => ({ id: e.id, occurredAt: e.occurredAt.toISOString(), painScore: e.painScore, reasons: extremeReasons(e, baseline) }))
      .filter((x) => x.reasons.length > 0),
    outsidePeriodShare: hasPeriodData && painDayKeys.length > 0 ? outside / painDayKeys.length : hasPeriodData ? 0 : null,
    periodsLogged: periods.filter((p) => p.start.getTime() >= fromMs - 10 * DAY_MS).length,
    missedActivityCount: inRange.filter((e) => e.missedActivity).length,
    bedBoundCount: inRange.filter((e) => e.bedBound).length,
    medications: [...meds.values()].sort((a, b) => b.timesTaken - a.timesTaken),
    redFlags: [...flagCounts.entries()].map(([code, count]) => ({ code, label: RED_FLAG_LABELS[code], count })).sort((a, b) => b.count - a.count),
    daily,
  };
}
