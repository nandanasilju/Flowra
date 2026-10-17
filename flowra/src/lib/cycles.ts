/**
 * Cycle engine (pure, deterministic). Builds cycles from period logs and gives
 * estimates: next period, fertile window, current cycle day and phase.
 * All predictions are ESTIMATES and are labelled that way in the UI. Not contraception.
 *
 * Reference ranges: FIGO 2018 normal limits — cycle 24–38 days, variation between
 * shortest and longest cycle ≤ 7–9 days, bleeding ≤ 8 days.
 */
export const NORMAL_CYCLE_MIN = 24;
export const NORMAL_CYCLE_MAX = 38;
export const NORMAL_VARIATION_MAX = 9;
export const NORMAL_PERIOD_MAX_DAYS = 8;
export const DEFAULT_CYCLE = 28;
export const DEFAULT_PERIOD_DAYS = 5;
const LUTEAL_DAYS = 14; // typical luteal phase used for ovulation estimates
const DAY = 86_400_000;

export interface PeriodInput {
  start: Date;
  end: Date | null;
}

export interface Cycle {
  start: string; // YYYY-MM-DD
  periodDays: number; // bleeding length (logged or default)
  periodEnd: string;
  length: number | null; // days until the next start; null for the current cycle
}

export type Phase = "period" | "follicular" | "fertile" | "luteal" | "late";

export interface CycleEstimate {
  cycles: Cycle[];
  averageLength: number;
  lengthRange: [number, number] | null;
  variation: number | null;
  averagePeriodDays: number;
  nextPeriod: { date: string; earliest: string; latest: string; daysUntil: number } | null;
  ovulation: string | null;
  fertileWindow: { start: string; end: string } | null;
  cycleDay: number | null;
  phase: Phase | null;
  lateByDays: number;
  confidence: "low" | "medium" | "high";
}

export function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function parseYmd(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDaysYmd(s: string, n: number): string {
  const d = parseYmd(s);
  d.setDate(d.getDate() + n);
  return ymd(d);
}

export function diffDays(a: string, b: string): number {
  return Math.round((parseYmd(a).getTime() - parseYmd(b).getTime()) / DAY);
}

export function buildCycles(periods: PeriodInput[]): Cycle[] {
  const sorted = [...periods].sort((a, b) => a.start.getTime() - b.start.getTime());
  return sorted.map((p, i) => {
    const start = ymd(p.start);
    const periodDays = p.end ? Math.max(1, diffDays(ymd(p.end), start) + 1) : DEFAULT_PERIOD_DAYS;
    const next = sorted[i + 1];
    return {
      start,
      periodDays,
      periodEnd: addDaysYmd(start, periodDays - 1),
      length: next ? diffDays(ymd(next.start), start) : null,
    };
  });
}

/**
 * Weighted average of the last 6 complete cycle lengths (recent cycles weigh more).
 * Implausible gaps (< 15 or > 90 days, e.g. a missed log) are ignored.
 */
export function estimateCycleLength(cycles: Cycle[], userSetting: number | null): number {
  const lengths = cycles
    .map((c) => c.length)
    .filter((l): l is number => l !== null && l >= 15 && l <= 90)
    .slice(-6);
  if (lengths.length === 0) return userSetting ?? DEFAULT_CYCLE;
  let sum = 0;
  let weight = 0;
  lengths.forEach((l, i) => {
    const w = i + 1;
    sum += l * w;
    weight += w;
  });
  return Math.round(sum / weight);
}

export function estimate(periods: PeriodInput[], userSetting: number | null, now: Date = new Date()): CycleEstimate {
  const cycles = buildCycles(periods);
  const today = ymd(now);
  const lengths = cycles.map((c) => c.length).filter((l): l is number => l !== null && l >= 15 && l <= 90).slice(-6);
  const avg = estimateCycleLength(cycles, userSetting);
  const range: [number, number] | null = lengths.length ? [Math.min(...lengths), Math.max(...lengths)] : null;
  const variation = range ? range[1] - range[0] : null;
  const periodLens = cycles.slice(-6).map((c) => c.periodDays);
  const averagePeriodDays = periodLens.length ? Math.round(periodLens.reduce((a, b) => a + b, 0) / periodLens.length) : DEFAULT_PERIOD_DAYS;
  const confidence: CycleEstimate["confidence"] =
    lengths.length >= 3 && variation !== null && variation <= 7 ? "high" : lengths.length >= 1 ? "medium" : "low";

  const last = cycles.at(-1);
  if (!last) {
    return {
      cycles, averageLength: avg, lengthRange: range, variation, averagePeriodDays,
      nextPeriod: null, ovulation: null, fertileWindow: null, cycleDay: null, phase: null, lateByDays: 0, confidence: "low",
    };
  }

  const cycleDay = diffDays(today, last.start) + 1;
  const nextDate = addDaysYmd(last.start, avg);
  const spread = variation !== null ? Math.max(2, Math.ceil(variation / 2)) : 3;
  const lateByDays = Math.max(0, diffDays(today, nextDate));
  const ovulation = addDaysYmd(nextDate, -LUTEAL_DAYS);
  const fertileWindow = { start: addDaysYmd(ovulation, -5), end: addDaysYmd(ovulation, 1) };

  let phase: Phase;
  if (cycleDay <= last.periodDays) phase = "period";
  else if (lateByDays > 0) phase = "late";
  else if (today >= fertileWindow.start && today <= fertileWindow.end) phase = "fertile";
  else if (today < fertileWindow.start) phase = "follicular";
  else phase = "luteal";

  return {
    cycles,
    averageLength: avg,
    lengthRange: range,
    variation,
    averagePeriodDays,
    nextPeriod: {
      date: nextDate,
      earliest: addDaysYmd(nextDate, -spread),
      latest: addDaysYmd(nextDate, spread),
      daysUntil: diffDays(nextDate, today),
    },
    ovulation,
    fertileWindow,
    cycleDay,
    phase,
    lateByDays,
    confidence,
  };
}

/** Predicted period and fertile days for the next N cycles (calendar shading). */
export function futureDays(est: CycleEstimate, cyclesAhead = 3): { period: Set<string>; fertile: Set<string> } {
  const period = new Set<string>();
  const fertile = new Set<string>();
  if (!est.nextPeriod) return { period, fertile };
  for (let i = 0; i < cyclesAhead; i++) {
    const start = addDaysYmd(est.nextPeriod.date, i * est.averageLength);
    for (let d = 0; d < est.averagePeriodDays; d++) period.add(addDaysYmd(start, d));
    const ov = addDaysYmd(start, -LUTEAL_DAYS);
    for (let d = -5; d <= 1; d++) fertile.add(addDaysYmd(ov, d));
  }
  return { period, fertile };
}

/** Which cycle (index) and cycle day a date belongs to, or null if before the first logged period. */
export function locateDay(cycles: Cycle[], date: string): { index: number; day: number; daysToNext: number | null } | null {
  for (let i = cycles.length - 1; i >= 0; i--) {
    if (date >= cycles[i].start) {
      const next = cycles[i + 1];
      return { index: i, day: diffDays(date, cycles[i].start) + 1, daysToNext: next ? diffDays(next.start, date) : null };
    }
  }
  return null;
}

export const PHASE_LABEL: Record<Phase, string> = {
  period: "Period",
  follicular: "Follicular phase",
  fertile: "Estimated fertile window",
  luteal: "Luteal phase",
  late: "Period expected",
};
