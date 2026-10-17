/**
 * Flowra Attention Score engine.
 *
 * Pure, deterministic TypeScript. No AI, no I/O, no randomness, no dependencies.
 * Given the same events, periods and `now`, it always returns the same result.
 * Every number it uses comes from ./constants.ts (PLACEHOLDER: requires clinician review).
 *
 * Reasons are plain templated sentences written here in code, never by the LLM,
 * and never use diagnostic words.
 */
import {
  COMPONENT_KEYS,
  COMPONENT_LABELS,
  COMPONENT_MAX,
  DEFAULT_PERIOD_LENGTH_DAYS,
  EXTREME_ABSOLUTE,
  EXTREME_RELATIVE_DELTA,
  EXTREME_RELATIVE_MIN,
  FLOOR_ORANGE_EXTREMES,
  FLOOR_YELLOW_EXTREMES,
  FREQUENCY_DAYS_FOR_MAX,
  FUNCTIONAL_BONUS_MAX,
  IMPACT_WEIGHTS,
  INTENSITY_PERCENTILE,
  LEVEL_INFO,
  LEVEL_ORDER,
  LEVEL_THRESHOLDS,
  MIN_EVENTS_FOR_BASELINE,
  PAIN_DAY_THRESHOLD,
  RED_FLAG_CODES,
  RED_FLAG_LABELS,
  RED_FLAG_LOOKBACK_HOURS,
  SUDDEN_SEVERE_MIN_SCORE,
  TREND_HALF_DAYS,
  TREND_MAX_DELTA,
  WINDOW_DAYS,
} from "./constants";
import type { ComponentKey, Level, RedFlagCode } from "./constants";
import { clamp, mean, median, quantile, round1 } from "./stats";

export type Impact = "none" | "some" | "severe";
export type Relief = "none" | "partial" | "full" | "unknown";

/** The minimal shape of a pain log the engine needs. */
export interface ScoringEvent {
  id: string;
  occurredAt: Date;
  painScore: number;
  isPeriodDay: boolean | null;
  functionalImpact: Impact;
  missedActivity: boolean;
  bedBound: boolean;
  associated: string[];
  medications: { name: string; relief: Relief }[];
  redFlags: string[];
}

export interface PeriodRange {
  start: Date;
  end: Date | null;
}

export interface ComponentResult {
  key: ComponentKey;
  label: string;
  points: number;
  max: number;
  detail: string;
}

export interface ExtremeEvent {
  id: string;
  occurredAt: string;
  painScore: number;
  reasons: string[];
}

export interface UsualBand {
  median: number;
  q1: number;
  q3: number;
}

export type DataSufficiency = "none" | "learning" | "ok";

export interface ScoreResult {
  score: number;
  level: Level;
  /** Level from the score alone, before floors and red-flag override. */
  baseLevel: Level;
  levelMessage: string;
  floorApplied: Level | null;
  components: Record<ComponentKey, ComponentResult>;
  reasons: string[];
  notes: string[];
  usualBand: UsualBand | null;
  extremeEvents: ExtremeEvent[];
  redFlag: boolean;
  redFlagCodes: RedFlagCode[];
  dataSufficiency: DataSufficiency;
  eventCount: number;
  painDays: number;
  windowDays: number;
  computedAt: string;
}

export interface ScoreInput {
  events: ScoringEvent[];
  periods: PeriodRange[];
  now?: Date;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Calendar day key in the runtime's local time zone. */
export function dayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`;
}

function isRedFlagCode(v: string): v is RedFlagCode {
  return (RED_FLAG_CODES as readonly string[]).includes(v);
}

/**
 * Red flags for one event: flags the user confirmed, plus deterministic rules
 * on structured fields (fainting / fever reported as associated symptoms).
 * "Sudden very severe pain" only counts when painScore >= SUDDEN_SEVERE_MIN_SCORE.
 */
export function effectiveRedFlags(e: ScoringEvent): RedFlagCode[] {
  const set = new Set<RedFlagCode>();
  for (const f of e.redFlags) {
    if (!isRedFlagCode(f)) continue;
    if (f === "sudden_severe_pain" && e.painScore < SUDDEN_SEVERE_MIN_SCORE) continue;
    set.add(f);
  }
  if (e.associated.includes("fainting")) set.add("fainting");
  if (e.associated.includes("fever") && e.painScore > 0) set.add("fever_with_pain");
  return RED_FLAG_CODES.filter((c) => set.has(c));
}

/** All calendar days covered by logged periods (open periods assume DEFAULT_PERIOD_LENGTH_DAYS, never past today). */
export function periodDayKeys(periods: PeriodRange[], now: Date): Set<string> {
  const keys = new Set<string>();
  const today = startOfDay(now);
  for (const p of periods) {
    const start = startOfDay(p.start);
    let end = p.end ? startOfDay(p.end) : addDays(start, DEFAULT_PERIOD_LENGTH_DAYS - 1);
    if (!p.end && end > today) end = today;
    if (end < start) end = start;
    for (let d = start; d <= end; d = addDays(d, 1)) keys.add(dayKey(d));
  }
  return keys;
}

/** Why (if at all) an event is an extreme episode. Empty array = not extreme. */
export function extremeReasons(e: ScoringEvent, baselineMedian: number | null): string[] {
  const reasons: string[] = [];
  if (e.painScore >= EXTREME_ABSOLUTE) reasons.push(`Pain of ${e.painScore}/10`);
  if (
    baselineMedian !== null &&
    e.painScore >= baselineMedian + EXTREME_RELATIVE_DELTA &&
    e.painScore >= EXTREME_RELATIVE_MIN
  ) {
    reasons.push("Much stronger than your usual level");
  }
  if (effectiveRedFlags(e).length > 0) reasons.push("A danger sign was mentioned");
  return reasons;
}

export function levelFromScore(score: number): Level {
  if (score >= LEVEL_THRESHOLDS.ORANGE) return "ORANGE";
  if (score >= LEVEL_THRESHOLDS.YELLOW) return "YELLOW";
  return "GREEN";
}

export function maxLevel(a: Level, b: Level): Level {
  return LEVEL_ORDER.indexOf(a) >= LEVEL_ORDER.indexOf(b) ? a : b;
}

/** Floor from the number of extreme episodes in the window (null = no floor). */
export function floorFromExtremes(count: number): Level | null {
  if (count >= FLOOR_ORANGE_EXTREMES) return "ORANGE";
  if (count >= FLOOR_YELLOW_EXTREMES) return "YELLOW";
  return null;
}

export function computeScore(input: ScoreInput): ScoreResult {
  const now = input.now ?? new Date();
  const nowMs = now.getTime();
  const windowStartMs = nowMs - WINDOW_DAYS * DAY_MS;

  const inWindow = input.events
    .filter((e) => {
      const t = e.occurredAt.getTime();
      return t >= windowStartMs && t <= nowMs;
    })
    .sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime() || a.id.localeCompare(b.id));

  const n = inWindow.length;
  const scores = inWindow.map((e) => e.painScore);
  const notes: string[] = [];
  const reasons: string[] = [];

  // ── Usual band (personal baseline) ─────────────────────────────────────
  const dataSufficiency: DataSufficiency = n === 0 ? "none" : n < MIN_EVENTS_FOR_BASELINE ? "learning" : "ok";
  const usualBand: UsualBand | null =
    n >= MIN_EVENTS_FOR_BASELINE
      ? { median: round1(median(scores)), q1: round1(quantile(scores, 0.25)), q3: round1(quantile(scores, 0.75)) }
      : null;
  if (dataSufficiency !== "ok") notes.push("Still learning your usual pattern");

  // ── Day bucketing ──────────────────────────────────────────────────────
  const dayMax = new Map<string, number>();
  const dayHasPeriodFlag = new Set<string>();
  for (const e of inWindow) {
    const k = dayKey(e.occurredAt);
    dayMax.set(k, Math.max(dayMax.get(k) ?? 0, e.painScore));
    if (e.isPeriodDay === true) dayHasPeriodFlag.add(k);
  }
  const painDayKeys = [...dayMax.entries()].filter(([, v]) => v >= PAIN_DAY_THRESHOLD).map(([k]) => k);
  const painDays = painDayKeys.length;

  // ── Intensity ──────────────────────────────────────────────────────────
  const p90 = n > 0 ? quantile(scores, INTENSITY_PERCENTILE) : 0;
  const intensity = (p90 / 10) * COMPONENT_MAX.intensity;

  // ── Frequency ──────────────────────────────────────────────────────────
  const frequency = Math.min(painDays / FREQUENCY_DAYS_FOR_MAX, 1) * COMPONENT_MAX.frequency;

  // ── Functional impact ──────────────────────────────────────────────────
  const disruptive = inWindow.filter((e) => e.missedActivity || e.bedBound);
  const impactAvg = n > 0 ? mean(inWindow.map((e) => IMPACT_WEIGHTS[e.functionalImpact])) : 0;
  const bonus = n > 0 ? (disruptive.length / n) * FUNCTIONAL_BONUS_MAX : 0;
  const functional = Math.min(impactAvg * COMPONENT_MAX.functional + bonus, COMPONENT_MAX.functional);
  const affectedCount = inWindow.filter((e) => e.functionalImpact !== "none").length;

  // ── Pain outside period ────────────────────────────────────────────────
  const periodKeys = periodDayKeys(input.periods, now);
  const hasPeriodData = input.periods.length > 0 || inWindow.some((e) => e.isPeriodDay !== null);
  let outsidePeriod = 0;
  let outsideDays = 0;
  if (!hasPeriodData) {
    notes.push("Log your period dates for a fuller picture");
  } else if (painDays > 0) {
    outsideDays = painDayKeys.filter((k) => !periodKeys.has(k) && !dayHasPeriodFlag.has(k)).length;
    outsidePeriod = (outsideDays / painDays) * COMPONENT_MAX.outsidePeriod;
  }

  // ── Trend ──────────────────────────────────────────────────────────────
  const recentStart = nowMs - TREND_HALF_DAYS * DAY_MS;
  const prevStart = nowMs - 2 * TREND_HALF_DAYS * DAY_MS;
  const recent = inWindow.filter((e) => e.occurredAt.getTime() >= recentStart).map((e) => e.painScore);
  const previous = inWindow
    .filter((e) => e.occurredAt.getTime() >= prevStart && e.occurredAt.getTime() < recentStart)
    .map((e) => e.painScore);
  const trendDelta = recent.length > 0 && previous.length > 0 ? mean(recent) - mean(previous) : null;
  const trend =
    trendDelta !== null && trendDelta > 0 ? Math.min(trendDelta / TREND_MAX_DELTA, 1) * COMPONENT_MAX.trend : 0;

  // ── Medicine not helping ───────────────────────────────────────────────
  const withMeds = inWindow.filter((e) => e.medications.length > 0);
  const lowRelief = withMeds.filter((e) => e.medications.some((m) => m.relief === "none" || m.relief === "partial"));
  const medication = withMeds.length > 0 ? (lowRelief.length / withMeds.length) * COMPONENT_MAX.medication : 0;

  // ── Assemble components ────────────────────────────────────────────────
  const raw: Record<ComponentKey, number> = { intensity, frequency, functional, outsidePeriod, trend, medication };
  const details: Record<ComponentKey, string> = {
    intensity: n > 0 ? `Your strongest pains (top 10%) were about ${round1(p90)} out of 10.` : "No pain logged yet.",
    frequency: `${plural(painDays, "pain day", "pain days")} (4+ out of 10) in the last ${WINDOW_DAYS} days; ${FREQUENCY_DAYS_FOR_MAX}+ gives full points.`,
    functional:
      n > 0
        ? `Pain affected your day in ${affectedCount} of ${n} logs; it stopped your usual activities ${plural(disruptive.length, "time", "times")}.`
        : "No pain logged yet.",
    outsidePeriod: !hasPeriodData
      ? "No period dates yet, so this part is not counted."
      : `${outsideDays} of ${plural(painDays, "pain day", "pain days")} were outside your period.`,
    trend:
      trendDelta === null
        ? "Not enough logs in both of the last two 2-week blocks to compare."
        : `Average pain in the last 2 weeks vs the 2 weeks before: ${trendDelta >= 0 ? "+" : ""}${round1(trendDelta)} points.`,
    medication:
      withMeds.length > 0
        ? `Medicine gave partial or no relief in ${lowRelief.length} of ${plural(withMeds.length, "log", "logs")} where you took it.`
        : "No medicine logged.",
  };
  const components = {} as Record<ComponentKey, ComponentResult>;
  for (const key of COMPONENT_KEYS) {
    components[key] = {
      key,
      label: COMPONENT_LABELS[key],
      points: round1(clamp(raw[key], 0, COMPONENT_MAX[key])),
      max: COMPONENT_MAX[key],
      detail: details[key],
    };
  }
  const score = Math.round(clamp(COMPONENT_KEYS.reduce((s, k) => s + components[k].points, 0), 0, 100));

  // ── Extreme episodes & floors ──────────────────────────────────────────
  const baselineMedian = usualBand ? usualBand.median : null;
  const extremeEvents: ExtremeEvent[] = [];
  for (const e of inWindow) {
    const r = extremeReasons(e, baselineMedian);
    if (r.length > 0) extremeEvents.push({ id: e.id, occurredAt: e.occurredAt.toISOString(), painScore: e.painScore, reasons: r });
  }
  const baseLevel = levelFromScore(score);
  const floor = floorFromExtremes(extremeEvents.length);
  let level: Level = floor ? maxLevel(baseLevel, floor) : baseLevel;
  const floorApplied = floor && level !== baseLevel ? floor : null;

  // ── Red-flag override (any event in the last 48 h) ─────────────────────
  const redFlagSince = nowMs - RED_FLAG_LOOKBACK_HOURS * 60 * 60 * 1000;
  const recentFlags = new Set<RedFlagCode>();
  for (const e of input.events) {
    const t = e.occurredAt.getTime();
    if (t >= redFlagSince && t <= nowMs) for (const f of effectiveRedFlags(e)) recentFlags.add(f);
  }
  const redFlagCodes = RED_FLAG_CODES.filter((c) => recentFlags.has(c));
  const redFlag = redFlagCodes.length > 0;
  if (redFlag) level = "URGENT";

  // ── Templated reasons (code-written, non-diagnostic) ───────────────────
  if (redFlag) {
    reasons.push(
      `In the last ${RED_FLAG_LOOKBACK_HOURS} hours you mentioned: ${redFlagCodes.map((c) => RED_FLAG_LABELS[c].toLowerCase()).join("; ")}.`,
    );
  }
  if (n === 0) {
    reasons.push(`No pain logged in the last ${WINDOW_DAYS} days.`);
  } else {
    reasons.push(`You logged pain on ${plural(painDays, "day", "days")} in the last ${WINDOW_DAYS} days (4+ out of 10).`);
    reasons.push(`Your strongest pains (top 10%) reached about ${round1(p90)} out of 10.`);
    if (disruptive.length > 0) {
      reasons.push(`Pain stopped your usual activities or kept you in bed ${plural(disruptive.length, "time", "times")}.`);
    }
    if (hasPeriodData && outsideDays > 0) {
      reasons.push(`${outsideDays} of your ${plural(painDays, "pain day", "pain days")} were outside your period.`);
    }
    if (trendDelta !== null && Math.abs(trendDelta) >= 0.5) {
      reasons.push(
        trendDelta > 0
          ? `Your average pain in the last 2 weeks is ${round1(trendDelta)} points higher than the 2 weeks before.`
          : `Your average pain in the last 2 weeks is ${round1(-trendDelta)} points lower than the 2 weeks before.`,
      );
    }
    if (lowRelief.length > 0) {
      reasons.push(`Medicine gave only partial or no relief in ${lowRelief.length} of ${plural(withMeds.length, "log", "logs")} where you took it.`);
    }
    if (extremeEvents.length > 0) {
      reasons.push(`${plural(extremeEvents.length, "episode was", "episodes were")} much stronger than usual.`);
    }
    if (floorApplied) {
      reasons.push(
        `Because of ${plural(extremeEvents.length, "extreme episode", "extreme episodes")}, the level is at least ${LEVEL_INFO[floorApplied].title}.`,
      );
    }
  }

  return {
    score,
    level,
    baseLevel,
    levelMessage: LEVEL_INFO[level].message,
    floorApplied,
    components,
    reasons,
    notes,
    usualBand,
    extremeEvents,
    redFlag,
    redFlagCodes,
    dataSufficiency,
    eventCount: n,
    painDays,
    windowDays: WINDOW_DAYS,
    computedAt: now.toISOString(),
  };
}
