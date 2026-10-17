import { describe, expect, it } from "vitest";
import { analysePatterns, type DailyLogInput } from "../engine";
import { estimate, buildCycles, futureDays } from "../../cycles";
import { generatePersona, type PersonaId } from "../../seed/personas";
import type { ScoringEvent } from "../../scoring/engine";

const NOW = new Date(2026, 9, 16, 12, 0, 0);

function d(offset: number): Date {
  return new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate() + offset, 8);
}
function ds(offset: number): string {
  const x = d(offset);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
}

function persona(id: PersonaId) {
  const p = generatePersona(id, NOW);
  return analysePatterns({
    periods: p.periods.map((x) => ({ start: x.startDate, end: x.endDate })),
    dailyLogs: p.dailyLogs.map((l) => ({ ...l, pbac: l.pbac })),
    painEvents: p.events.map((e, i) => ({ ...e, id: `e${i}` })),
    now: NOW,
  });
}

function ev(offset: number, pain: number, extra: Partial<ScoringEvent> = {}): ScoringEvent {
  return {
    id: `x${offset}`, occurredAt: d(offset), painScore: pain, isPeriodDay: null, functionalImpact: "none",
    missedActivity: false, bedBound: false, associated: [], medications: [], redFlags: [], ...extra,
  };
}
function log(offset: number, l: Partial<DailyLogInput>): DailyLogInput {
  return { date: ds(offset), flow: null, pbac: {}, mood: null, energy: null, symptoms: [], ...l };
}

describe("cycle estimates", () => {
  it("builds cycles and predicts the next period as an estimate", () => {
    const periods = [-84, -56, -28].map((o) => ({ start: d(o), end: d(o + 4) }));
    const est = estimate(periods, null, NOW);
    expect(est.cycles.map((c) => c.length)).toEqual([28, 28, null]);
    expect(est.averageLength).toBe(28);
    expect(est.nextPeriod?.date).toBe(ds(0));
    expect(est.cycleDay).toBe(29);
    expect(est.confidence).toBe("medium"); // only 2 complete cycles
    expect(est.fertileWindow?.start).toBe(ds(-19));
  });

  it("weights recent cycles more", () => {
    const periods = [-100, -70, -40, -5].map((o) => ({ start: d(o), end: null }));
    // lengths 30, 30, 35 → weighted (30*1+30*2+35*3)/6 = 32.5 → 33
    expect(estimate(periods, null, NOW).averageLength).toBe(33);
  });

  it("uses the user setting with no history and marks low confidence", () => {
    const est = estimate([], 30, NOW);
    expect(est.nextPeriod).toBeNull();
    expect(est.confidence).toBe("low");
  });

  it("projects future period and fertile days", () => {
    const est = estimate([{ start: d(-10), end: d(-6) }], 28, NOW);
    const f = futureDays(est, 2);
    expect(f.period.has(ds(18))).toBe(true);
    expect(f.fertile.size).toBe(14);
  });

  it("open period uses default length", () => {
    expect(buildCycles([{ start: d(-2), end: null }])[0].periodDays).toBe(5);
  });
});

describe("pattern engine", () => {
  it("returns no cards and helpful notes for empty data", () => {
    const r = analysePatterns({ periods: [], dailyLogs: [], painEvents: [], now: NOW });
    expect(r.cards).toEqual([]);
    expect(r.dataNotes.length).toBeGreaterThan(0);
  });

  it("flags long cycles + skin/hair changes as a PCOS-linked pattern", () => {
    const r = persona("riya");
    const card = r.cards.find((c) => c.id === "pcos");
    expect(card).toBeDefined();
    expect(card?.strength).toBe("strong");
    expect(card?.conditions.map((c) => c.slug)).toContain("pcos");
  });

  it("flags the endometriosis-linked pattern, heavy bleeding and anaemia for Anjali", () => {
    const ids = persona("anjali").cards.map((c) => c.id);
    expect(ids).toContain("endometriosis");
    expect(ids).toContain("heavy_bleeding");
    expect(ids).toContain("anaemia");
    expect(ids).not.toContain("pcos");
  });

  it("mild persona has no consult-level cards", () => {
    const r = persona("mild");
    expect(r.cards.every((c) => c.nextStep === "track")).toBe(true);
  });

  it("never outputs percentages or diagnostic certainty", () => {
    for (const id of ["anjali", "riya", "mild"] as const) {
      const text = JSON.stringify(persona(id).cards);
      expect(/\d+\s?%/.test(text)).toBe(false);
      expect(/you have /i.test(text)).toBe(false);
    }
  });

  it("always lists overlapping conditions on condition cards", () => {
    const cards = [...persona("anjali").cards, ...persona("riya").cards].filter((c) => ["endometriosis", "heavy_bleeding", "pcos", "irregular", "dysmenorrhea"].includes(c.id));
    expect(cards.length).toBeGreaterThanOrEqual(3);
    for (const c of cards) expect(c.conditions.length).toBeGreaterThanOrEqual(2);
  });

  it("detects PBAC ≥ 100 as heavy bleeding", () => {
    const periods = [-60, -30].map((o) => ({ start: d(o), end: d(o + 4) }));
    const logs = [log(-30, { flow: "heavy", pbac: { padFull: 4, padMedium: 5 } })]; // 80 + 25 = 105
    const r = analysePatterns({ periods, dailyLogs: logs, painEvents: [], now: NOW });
    expect(r.signals.heavy?.evidence).toContain("105");
  });

  it("detects severe premenstrual mood that eases after the period (PMDD pattern)", () => {
    const starts = [-90, -62, -34, -6];
    const periods = starts.map((o) => ({ start: d(o), end: d(o + 4) }));
    const logs: DailyLogInput[] = [];
    for (let i = 0; i < 3; i++) {
      const s = starts[i];
      const next = starts[i + 1];
      logs.push(log(s + 7, { mood: 4 }), log(s + 9, { mood: 4 }));
      for (const k of [1, 2, 3]) logs.push(log(next - k, { mood: 1, symptoms: ["hopeless", "anxiety"] }));
    }
    const r = analysePatterns({ periods, dailyLogs: logs, painEvents: [], now: NOW });
    const card = r.cards.find((c) => c.id === "pmdd");
    expect(card?.specialties).toContain("psychiatrist");
    expect(card?.safetyNote).toContain("14416");
  });

  it("does not flag PMS when mood symptoms are present all month", () => {
    const starts = [-90, -62, -34, -6];
    const periods = starts.map((o) => ({ start: d(o), end: d(o + 4) }));
    const logs: DailyLogInput[] = [];
    for (let o = -88; o < 0; o += 2) logs.push(log(o, { mood: 2, symptoms: ["low_mood"] }));
    const r = analysePatterns({ periods, dailyLogs: logs, painEvents: [], now: NOW });
    expect(r.cards.find((c) => c.id === "pms" || c.id === "pmdd")).toBeUndefined();
  });

  it("flags 90+ days without a period", () => {
    const r = analysePatterns({ periods: [{ start: d(-130), end: d(-126) }, { start: d(-100), end: d(-96) }], dailyLogs: [], painEvents: [], now: NOW });
    expect(r.cards.find((c) => c.id === "missed")?.safetyNote).toContain("112");
  });

  it("flags bleeding after sex for a prompt visit", () => {
    const r = analysePatterns({ periods: [{ start: d(-20), end: d(-16) }], dailyLogs: [log(-5, { symptoms: ["bleeding_after_sex"] })], painEvents: [], now: NOW });
    expect(r.cards.find((c) => c.id === "abnormal_bleeding")?.nextStep).toBe("consult_soon");
  });

  it("flags fever + pelvic pain + discharge as needing a doctor soon", () => {
    const r = analysePatterns({
      periods: [{ start: d(-20), end: d(-16) }],
      dailyLogs: [log(-1, { symptoms: ["fever", "pelvic_pain", "unusual_discharge"] })],
      painEvents: [ev(-1, 6)],
      now: NOW,
    });
    expect(r.cards[0].id).toBe("infection");
  });

  it("is deterministic", () => {
    expect(JSON.stringify(persona("anjali"))).toBe(JSON.stringify(persona("anjali")));
  });
});
