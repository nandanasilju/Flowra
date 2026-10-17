/** Period helpers: average cycle length and next-period prediction (pure). */
const DAY_MS = 86_400_000;
export const DEFAULT_CYCLE_DAYS = 28;

/** Average gap between consecutive period starts (needs 2+ starts), rounded. */
export function averageCycleLength(starts: Date[]): number | null {
  if (starts.length < 2) return null;
  const sorted = [...starts].sort((a, b) => a.getTime() - b.getTime());
  const gaps: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const gap = Math.round((sorted[i].getTime() - sorted[i - 1].getTime()) / DAY_MS);
    if (gap >= 15 && gap <= 60) gaps.push(gap); // ignore implausible gaps
  }
  if (gaps.length === 0) return null;
  return Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length);
}

/**
 * Predicted next period start = last start + cycle length (user setting, else
 * computed average). Returns null with no period data.
 */
export function predictNextPeriod(starts: Date[], userCycleLength: number | null, now: Date = new Date()): { date: Date; daysUntil: number; cycleLength: number } | null {
  if (starts.length === 0) return null;
  const cycle = userCycleLength ?? averageCycleLength(starts) ?? DEFAULT_CYCLE_DAYS;
  const last = [...starts].sort((a, b) => b.getTime() - a.getTime())[0];
  let next = new Date(last.getTime() + cycle * DAY_MS);
  // If she has not logged the latest period, roll forward so the prediction is not in the past.
  let guard = 0;
  while (next.getTime() < now.getTime() - DAY_MS && guard < 12) {
    next = new Date(next.getTime() + cycle * DAY_MS);
    guard++;
  }
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfNext = new Date(next.getFullYear(), next.getMonth(), next.getDate()).getTime();
  return { date: next, daysUntil: Math.round((startOfNext - startOfToday) / DAY_MS), cycleLength: cycle };
}
