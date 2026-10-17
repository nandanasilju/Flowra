import { describe, expect, it } from "vitest";
import {
  COMPONENT_MAX,
  LEVEL_THRESHOLDS,
  computeScore,
  effectiveRedFlags,
  floorFromExtremes,
  levelFromScore,
  maxLevel,
  type PeriodRange,
  type ScoringEvent,
} from "../index";
import { generatePersona } from "../../seed/personas";

const NOW = new Date(2026, 9, 16, 12, 0, 0); // 16 Oct 2026, 12:00 local

function daysAgo(d: number, hour = 12): Date {
  const r = new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate(), hour, 0, 0);
  r.setDate(r.getDate() - d);
  return r;
}

let seq = 0;
function ev(daysBack: number, painScore: number, extra: Partial<ScoringEvent> = {}): ScoringEvent {
  seq += 1;
  return {
    id: `e${String(seq).padStart(4, "0")}`,
    occurredAt: daysAgo(daysBack, extra.occurredAt ? extra.occurredAt.getHours() : 10),
    painScore,
    isPeriodDay: null,
    functionalImpact: "none",
    missedActivity: false,
    bedBound: false,
    associated: [],
    medications: [],
    redFlags: [],
    ...extra,
  };
}

function period(startDaysAgo: number, endDaysAgo: number | null): PeriodRange {
  return { start: daysAgo(startDaysAgo, 6), end: endDaysAgo === null ? null : daysAgo(endDaysAgo, 20) };
}

describe("empty data", () => {
  it("returns zero, GREEN, no baseline", () => {
    const r = computeScore({ events: [], periods: [], now: NOW });
    expect(r.score).toBe(0);
    expect(r.level).toBe("GREEN");
    expect(r.usualBand).toBeNull();
    expect(r.dataSufficiency).toBe("none");
    expect(r.extremeEvents).toEqual([]);
    expect(r.redFlag).toBe(false);
    expect(r.notes).toContain("Still learning your usual pattern");
    expect(r.reasons).toContain("No pain logged in the last 30 days.");
  });
});

describe("cold start (< 5 events)", () => {
  it("has no usual band and only absolute extreme rules apply", () => {
    // 4 events: 2,2,2,7. Relative rule would flag 7 (median 2 + 3); absolute rule must not.
    const events = [ev(10, 2), ev(9, 2), ev(8, 2), ev(7, 7)];
    const r = computeScore({ events, periods: [period(20, 16)], now: NOW });
    expect(r.dataSufficiency).toBe("learning");
    expect(r.usualBand).toBeNull();
    expect(r.extremeEvents).toHaveLength(0);
    expect(r.notes).toContain("Still learning your usual pattern");
  });

  it("still flags an absolute extreme (>= 8)", () => {
    const r = computeScore({ events: [ev(3, 8)], periods: [period(5, 1)], now: NOW });
    expect(r.extremeEvents).toHaveLength(1);
    expect(r.level).toBe("YELLOW");
  });

  it("with 5 events the baseline exists and the relative rule applies", () => {
    const events = [ev(12, 2), ev(11, 2), ev(10, 2), ev(9, 3), ev(8, 7)];
    const r = computeScore({ events, periods: [period(20, 16)], now: NOW });
    expect(r.dataSufficiency).toBe("ok");
    expect(r.usualBand).toEqual({ median: 2, q1: 2, q3: 3 });
    expect(r.extremeEvents.map((e) => e.painScore)).toEqual([7]);
  });
});

describe("level boundaries", () => {
  it.each([
    [0, "GREEN"],
    [34, "GREEN"],
    [35, "YELLOW"],
    [59, "YELLOW"],
    [60, "ORANGE"],
    [100, "ORANGE"],
  ] as const)("score %i → %s", (score, level) => {
    expect(levelFromScore(score)).toBe(level);
  });

  it("thresholds come from constants", () => {
    expect(levelFromScore(LEVEL_THRESHOLDS.YELLOW - 1)).toBe("GREEN");
    expect(levelFromScore(LEVEL_THRESHOLDS.ORANGE - 1)).toBe("YELLOW");
  });

  it("component maxima sum to 100", () => {
    const total = Object.values(COMPONENT_MAX).reduce((a, b) => a + b, 0);
    expect(total).toBe(100);
  });
});

describe("floor rules", () => {
  it("0 extremes → no floor, 1 → YELLOW, 2+ → ORANGE", () => {
    expect(floorFromExtremes(0)).toBeNull();
    expect(floorFromExtremes(1)).toBe("YELLOW");
    expect(floorFromExtremes(2)).toBe("ORANGE");
    expect(floorFromExtremes(5)).toBe("ORANGE");
  });

  it("one extreme lifts a GREEN score to YELLOW", () => {
    const r = computeScore({ events: [ev(20, 8)], periods: [period(21, 17)], now: NOW });
    expect(r.baseLevel).toBe("GREEN");
    expect(r.level).toBe("YELLOW");
    expect(r.floorApplied).toBe("YELLOW");
  });

  it("two extremes lift to ORANGE", () => {
    const r = computeScore({ events: [ev(20, 8), ev(10, 9)], periods: [period(21, 17)], now: NOW });
    expect(r.extremeEvents).toHaveLength(2);
    expect(r.level).toBe("ORANGE");
  });

  it("floors never lower a level", () => {
    expect(maxLevel("ORANGE", "YELLOW")).toBe("ORANGE");
  });
});

describe("red-flag override", () => {
  it("a red flag within 48h beats a low score", () => {
    const events = [ev(1, 2, { redFlags: ["fainting"] })];
    const r = computeScore({ events, periods: [period(5, 1)], now: NOW });
    expect(r.score).toBeLessThan(LEVEL_THRESHOLDS.YELLOW);
    expect(r.level).toBe("URGENT");
    expect(r.redFlag).toBe(true);
    expect(r.redFlagCodes).toEqual(["fainting"]);
    expect(r.levelMessage).toContain("112");
  });

  it("a red flag older than 48h does not trigger URGENT", () => {
    const r = computeScore({ events: [ev(3, 2, { redFlags: ["fainting"] })], periods: [period(5, 1)], now: NOW });
    expect(r.level).not.toBe("URGENT");
    expect(r.redFlag).toBe(false);
  });

  it("fainting or fever reported as associated symptoms are red flags", () => {
    expect(effectiveRedFlags(ev(0, 5, { associated: ["fainting"] }))).toEqual(["fainting"]);
    expect(effectiveRedFlags(ev(0, 5, { associated: ["fever"] }))).toEqual(["fever_with_pain"]);
  });

  it("sudden severe pain only counts at 9+", () => {
    expect(effectiveRedFlags(ev(0, 7, { redFlags: ["sudden_severe_pain"] }))).toEqual([]);
    expect(effectiveRedFlags(ev(0, 9, { redFlags: ["sudden_severe_pain"] }))).toEqual(["sudden_severe_pain"]);
  });

  it("ignores unknown red-flag codes", () => {
    expect(effectiveRedFlags(ev(0, 5, { redFlags: ["made_up"] }))).toEqual([]);
  });
});

describe("flat series", () => {
  it("steady mild pain is GREEN with a tight band and no extremes", () => {
    const events = Array.from({ length: 10 }, (_, i) => ev(i + 1, 3, { isPeriodDay: true }));
    const r = computeScore({ events, periods: [], now: NOW });
    expect(r.usualBand).toEqual({ median: 3, q1: 3, q3: 3 });
    expect(r.extremeEvents).toHaveLength(0);
    expect(r.components.trend.points).toBe(0);
    expect(r.level).toBe("GREEN");
  });
});

describe("no period data", () => {
  it("scores outside-period as 0 and adds a note", () => {
    const events = [ev(5, 6), ev(4, 6), ev(3, 6), ev(2, 6), ev(1, 6)];
    const r = computeScore({ events, periods: [], now: NOW });
    expect(r.components.outsidePeriod.points).toBe(0);
    expect(r.notes).toContain("Log your period dates for a fuller picture");
  });

  it("counts pain outside logged periods", () => {
    const events = [ev(10, 6), ev(9, 6), ev(3, 6), ev(2, 6)];
    const r = computeScore({ events, periods: [period(10, 9)], now: NOW });
    // 4 pain days, 2 outside → half of 15
    expect(r.components.outsidePeriod.points).toBe(7.5);
  });

  it("an open period assumes the default length", () => {
    const events = [ev(4, 6), ev(1, 6)];
    const r = computeScore({ events, periods: [period(4, null)], now: NOW });
    expect(r.components.outsidePeriod.points).toBe(0);
  });
});

describe("trend", () => {
  it("rising pain adds trend points (capped at +3)", () => {
    const events = [ev(20, 2), ev(18, 2), ev(5, 5), ev(3, 5)];
    const r = computeScore({ events, periods: [period(25, 21)], now: NOW });
    expect(r.components.trend.points).toBe(10);
    expect(r.reasons.some((s) => s.includes("higher than the 2 weeks before"))).toBe(true);
  });

  it("a partial rise is scaled", () => {
    const events = [ev(20, 3), ev(5, 4.5)];
    const r = computeScore({ events, periods: [period(25, 21)], now: NOW });
    expect(r.components.trend.points).toBe(5);
  });

  it("falling pain gives 0 trend points", () => {
    const events = [ev(20, 6), ev(18, 6), ev(5, 2), ev(3, 2)];
    const r = computeScore({ events, periods: [period(25, 21)], now: NOW });
    expect(r.components.trend.points).toBe(0);
    expect(r.reasons.some((s) => s.includes("lower than the 2 weeks before"))).toBe(true);
  });
});

describe("components", () => {
  it("functional impact includes a capped bonus", () => {
    const events = [ev(3, 6, { functionalImpact: "severe", bedBound: true }), ev(2, 6, { functionalImpact: "severe", missedActivity: true })];
    const r = computeScore({ events, periods: [period(3, 1)], now: NOW });
    expect(r.components.functional.points).toBe(20);
  });

  it("medicine-not-helping uses events where medicine was taken", () => {
    const events = [
      ev(3, 5, { medications: [{ name: "Ibuprofen", relief: "partial" }] }),
      ev(2, 5, { medications: [{ name: "Ibuprofen", relief: "full" }] }),
      ev(1, 5),
    ];
    const r = computeScore({ events, periods: [period(3, 1)], now: NOW });
    expect(r.components.medication.points).toBe(5);
  });

  it("frequency saturates at 15 pain days", () => {
    const events = Array.from({ length: 20 }, (_, i) => ev(i + 1, 4));
    const r = computeScore({ events, periods: [], now: NOW });
    expect(r.components.frequency.points).toBe(20);
  });

  it("ignores events outside the 30-day window", () => {
    const r = computeScore({ events: [ev(40, 9)], periods: [], now: NOW });
    expect(r.eventCount).toBe(0);
    expect(r.extremeEvents).toHaveLength(0);
  });

  it("never uses diagnostic words in reasons", () => {
    const events = [ev(5, 9, { medications: [{ name: "x", relief: "none" }], missedActivity: true }), ev(3, 8)];
    const r = computeScore({ events, periods: [period(6, 4)], now: NOW });
    const text = [...r.reasons, ...Object.values(r.components).map((c) => c.detail)].join(" ").toLowerCase();
    for (const word of ["endometriosis", "diagnos", "disease", "disorder", "pcos", "cyst", "infection"]) {
      expect(text.includes(word)).toBe(false);
    }
  });
});

describe("determinism", () => {
  it("same input → identical output, regardless of event order", () => {
    const events = [ev(12, 4), ev(6, 7, { functionalImpact: "some" }), ev(2, 3), ev(9, 8), ev(1, 5)];
    const a = computeScore({ events, periods: [period(9, 5)], now: NOW });
    const b = computeScore({ events: [...events].reverse(), periods: [period(9, 5)], now: NOW });
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
});

describe("demo personas", () => {
  const toScoring = (id: "anjali" | "mild") => {
    const p = generatePersona(id, NOW);
    return computeScore({
      events: p.events.map((e, i) => ({ ...e, id: `p${i}` })),
      periods: p.periods.map((x) => ({ start: x.startDate, end: x.endDate })),
      now: NOW,
    });
  };

  it("Anjali produces ORANGE", () => {
    const r = toScoring("anjali");
    expect(r.level).toBe("ORANGE");
    expect(r.extremeEvents.length).toBeGreaterThanOrEqual(2);
    expect(r.redFlag).toBe(false);
  });

  it("mild persona produces GREEN", () => {
    const r = toScoring("mild");
    expect(r.level).toBe("GREEN");
    expect(r.extremeEvents).toHaveLength(0);
  });

  it("personas are deterministic", () => {
    expect(JSON.stringify(generatePersona("anjali", NOW))).toBe(JSON.stringify(generatePersona("anjali", NOW)));
  });
});
