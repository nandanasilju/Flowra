/**
 * Demo personas (SAMPLE DATA). Deterministic: a fixed PRNG seed only varies
 * minutes, descriptors and wording; the pain scores come from fixed tables so
 * the resulting Attention Level is stable:
 *   - "anjali" → ORANGE (2 extreme episodes in the last 30 days trigger the floor)
 *   - "mild"   → GREEN
 * Dates are relative to `now`, so the demo always looks current.
 */
import type { Associated, Bleeding, Descriptor, Impact, Location, Relief } from "../enums";
import { createRng, randInt } from "./random";

export type PersonaId = "anjali" | "mild" | "riya";

export interface PersonaDailyLog {
  date: string;
  flow: string | null;
  pbac: Record<string, number>;
  mood: number | null;
  energy: number | null;
  sleepHours: number | null;
  symptoms: string[];
}

export interface PersonaEvent {
  occurredAt: Date;
  painScore: number;
  descriptors: Descriptor[];
  locations: Location[];
  onsetNote: string | null;
  durationMinutes: number | null;
  isPeriodDay: boolean | null;
  bleeding: Bleeding | null;
  functionalImpact: Impact;
  missedActivity: boolean;
  bedBound: boolean;
  associated: Associated[];
  medications: { name: string; relief: Relief }[];
  redFlags: string[];
  transcript: string;
  transcriptEn: string;
  languageDetected: string;
  source: "sample";
  confidence: number;
}

export interface PersonaData {
  id: PersonaId;
  name: string;
  avgCycleLength: number;
  events: PersonaEvent[];
  periods: { startDate: Date; endDate: Date | null }[];
  dailyLogs: PersonaDailyLog[];
}

interface Row {
  day: number; // days relative to today (negative = past)
  hour: number;
  score: number;
  period: boolean;
  bleeding?: Bleeding;
  impact?: Impact;
  missed?: boolean;
  bed?: boolean;
  med?: Relief; // ibuprofen/paracetamol relief, if taken
  loc?: Location[];
  desc?: Descriptor[];
  assoc?: Associated[];
  transcript?: { text: string; en: string; lang: string };
}

const SAMPLE_TEXT = "(Sample data)";

function at(now: Date, dayOffset: number, hour: number, minute: number): Date {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute, 0, 0);
  d.setDate(d.getDate() + dayOffset);
  return d;
}

function buildEvents(rows: Row[], now: Date, seed: number, medName: string): PersonaEvent[] {
  const rng = createRng(seed);
  const periodDescriptors: Descriptor[][] = [["cramping"], ["cramping", "throbbing"], ["cramping", "dull"]];
  return rows.map((r) => {
    const descriptors = r.desc ?? periodDescriptors[randInt(rng, 0, periodDescriptors.length - 1)];
    return {
      occurredAt: at(now, r.day, r.hour, randInt(rng, 0, 50)),
      painScore: r.score,
      descriptors,
      locations: r.loc ?? (r.period ? ["lower_abdomen"] : ["lower_back"]),
      onsetNote: null,
      durationMinutes: r.score >= 4 ? randInt(rng, 3, 12) * 15 : null,
      isPeriodDay: r.period,
      bleeding: r.bleeding ?? (r.period ? "medium" : "none"),
      functionalImpact: r.impact ?? "none",
      missedActivity: r.missed ?? false,
      bedBound: r.bed ?? false,
      associated: r.assoc ?? [],
      medications: r.med ? [{ name: medName, relief: r.med }] : [],
      redFlags: [],
      transcript: r.transcript?.text ?? SAMPLE_TEXT,
      transcriptEn: r.transcript?.en ?? SAMPLE_TEXT,
      languageDetected: r.transcript?.lang ?? "en",
      source: "sample",
      confidence: 1,
    };
  });
}

/** Anjali, 21 (sample persona). Periods every 28 days, rising menstrual pain, ibuprofen mostly partial relief. */
const ANJALI_ROWS: Row[] = [
  // quiet days
  { day: -57, hour: 18, score: 2, period: false, desc: ["dull"] },
  { day: -55, hour: 9, score: 2, period: false, desc: ["dull"] },
  // cycle 1 period (-50 … -46)
  { day: -50, hour: 8, score: 6, period: true, bleeding: "heavy", impact: "some", med: "partial" },
  { day: -50, hour: 21, score: 8, period: true, bleeding: "heavy", impact: "some", missed: true, med: "partial", desc: ["cramping", "stabbing"] },
  { day: -49, hour: 10, score: 6, period: true, bleeding: "heavy", impact: "some", med: "partial" },
  { day: -48, hour: 14, score: 5, period: true, bleeding: "medium", impact: "some" },
  { day: -47, hour: 11, score: 4, period: true, bleeding: "light" },
  { day: -46, hour: 16, score: 3, period: true, bleeding: "spotting" },
  // outside period
  { day: -40, hour: 19, score: 4, period: false, loc: ["lower_back"], desc: ["dull"] },
  { day: -36, hour: 13, score: 2, period: false, desc: ["dull"] },
  { day: -33, hour: 17, score: 5, period: false, impact: "some", loc: ["pelvis_left"], desc: ["sharp"] },
  { day: -28, hour: 20, score: 3, period: false, desc: ["dull"], assoc: ["bloating"] },
  // cycle 2 period (-22 … -18): a little stronger
  { day: -22, hour: 7, score: 7, period: true, bleeding: "heavy", impact: "some", med: "partial", assoc: ["nausea"] },
  {
    day: -22,
    hour: 22,
    score: 9,
    period: true,
    bleeding: "heavy",
    impact: "severe",
    missed: true,
    bed: true,
    med: "none",
    desc: ["cramping", "stabbing"],
    assoc: ["nausea"],
    transcript: {
      text: "വയറിന്റെ താഴെ ഭയങ്കര വേദന, പത്തിൽ ഒൻപത് ആണ്. ഇന്ന് കോളേജിൽ പോകാൻ പറ്റിയില്ല, കിടക്കുകയാണ്. ഐബുപ്രോഫെൻ കഴിച്ചിട്ടും മാറുന്നില്ല.",
      en: "Terrible pain in my lower tummy, it's 9 out of 10. I couldn't go to college today, I'm lying down. I took ibuprofen but it isn't going away.",
      lang: "ml",
    },
  },
  {
    day: -21,
    hour: 9,
    score: 8,
    period: true,
    bleeding: "heavy",
    impact: "some",
    missed: true,
    med: "partial",
    transcript: {
      text: "आज भी पेट में बहुत cramps हैं, around 8 out of 10. Ibuprofen से थोड़ा ही आराम मिला, class miss करनी पड़ी।",
      en: "Today too there are lots of cramps in my tummy, around 8 out of 10. Ibuprofen gave only a little relief, I had to miss class.",
      lang: "mixed",
    },
  },
  { day: -21, hour: 19, score: 7, period: true, bleeding: "heavy", impact: "some", med: "partial" },
  { day: -20, hour: 12, score: 6, period: true, bleeding: "medium", impact: "some", med: "full" },
  { day: -19, hour: 15, score: 5, period: true, bleeding: "medium" },
  { day: -18, hour: 10, score: 4, period: true, bleeding: "light" },
  // outside period, recent
  { day: -12, hour: 18, score: 5, period: false, impact: "some", loc: ["pelvis_right"], desc: ["sharp"] },
  { day: -9, hour: 8, score: 2, period: false, desc: ["dull"] },
  { day: -6, hour: 21, score: 4, period: false, loc: ["lower_back"], desc: ["dull"] },
  { day: -3, hour: 14, score: 3, period: false, desc: ["dull"], assoc: ["bloating"] },
  { day: -1, hour: 20, score: 3, period: false, desc: ["dull"] },
];

/** Mild persona: light period pain, medicine helps, nothing outside the period. */
const MILD_ROWS: Row[] = [
  { day: -50, hour: 9, score: 4, period: true, impact: "some" },
  { day: -49, hour: 11, score: 3, period: true },
  { day: -48, hour: 15, score: 3, period: true, bleeding: "light" },
  { day: -35, hour: 18, score: 1, period: false, desc: ["dull"], loc: ["lower_abdomen"] },
  { day: -22, hour: 8, score: 5, period: true, impact: "some", med: "full" },
  { day: -21, hour: 13, score: 4, period: true },
  { day: -20, hour: 17, score: 3, period: true, bleeding: "light" },
  { day: -19, hour: 10, score: 2, period: true, bleeding: "spotting" },
  { day: -10, hour: 19, score: 2, period: false, desc: ["dull"], loc: ["lower_abdomen"] },
  { day: -4, hour: 12, score: 1, period: false, desc: ["dull"], loc: ["lower_abdomen"] },
];

function periodsFor(now: Date, starts: number[] = [-78, -50, -22], length = 5): { startDate: Date; endDate: Date | null }[] {
  return starts.map((s) => ({ startDate: at(now, s, 7, 0), endDate: at(now, s + length - 1, 20, 0) }));
}

function dayStr(now: Date, offset: number): string {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * Daily logs (flow, pad chart, mood, symptoms) around each period, plus some ordinary days,
 * so cycle-phase patterns (premenstrual mood, heavy bleeding, skin changes) can be shown.
 */
function buildDailyLogs(
  now: Date,
  starts: number[],
  opts: { heavy: boolean; periodSymptoms: string[]; lutealSymptoms: string[]; lutealMood: number; everyday: string[]; periodLength: number; extraDays?: number[] },
): PersonaDailyLog[] {
  const logs = new Map<string, PersonaDailyLog>();
  const put = (offset: number, l: Omit<PersonaDailyLog, "date">) => {
    if (offset > 0) return;
    logs.set(dayStr(now, offset), { date: dayStr(now, offset), ...l });
  };
  const sorted = [...starts].sort((a, b) => a - b);
  sorted.forEach((s, idx) => {
    for (let d = 0; d < opts.periodLength; d++) {
      const heavyDay = opts.heavy && d < 2;
      put(s + d, {
        flow: heavyDay ? "heavy" : d < 3 ? "medium" : "light",
        pbac: heavyDay ? (d === 0 ? { padFull: 3, padMedium: 2, clotLarge: 1 } : { padFull: 2, padMedium: 2, flooding: 1 }) : d < 3 ? { padMedium: 3 } : { padLight: 2 },
        mood: d === 0 ? 2 : 3,
        energy: heavyDay ? 1 : 2,
        sleepHours: 6.5,
        symptoms: d < 2 ? opts.periodSymptoms : opts.everyday,
      });
    }
    for (const f of [6, 9]) put(s + f, { flow: "none", pbac: {}, mood: 4, energy: 4, sleepHours: 7.5, symptoms: opts.everyday });
    const next = sorted[idx + 1];
    if (next !== undefined) {
      for (let i = 1; i <= 4; i++) put(next - i, { flow: "none", pbac: {}, mood: opts.lutealMood, energy: 2, sleepHours: 6, symptoms: [...opts.lutealSymptoms, ...opts.everyday] });
    }
  });
  for (const e of opts.extraDays ?? []) if (!logs.has(dayStr(now, e))) put(e, { flow: "none", pbac: {}, mood: 3, energy: 3, sleepHours: 7, symptoms: opts.everyday });
  return [...logs.values()].sort((a, b) => a.date.localeCompare(b.date));
}

/** Riya (sample): long, irregular cycles with acne and extra hair growth (PCOS-linked pattern). */
const RIYA_ROWS: Row[] = [
  { day: -125, hour: 10, score: 3, period: true },
  { day: -82, hour: 12, score: 4, period: true, impact: "some" },
  { day: -60, hour: 18, score: 2, period: false, desc: ["dull"] },
  { day: -40, hour: 9, score: 3, period: true },
  { day: -15, hour: 20, score: 2, period: false, desc: ["dull"] },
];

export function generatePersona(id: PersonaId, now: Date = new Date()): PersonaData {
  if (id === "anjali") {
    const starts = [-78, -50, -22];
    return {
      id,
      name: "Anjali (sample)",
      avgCycleLength: 28,
      events: buildEvents(ANJALI_ROWS, now, 20261016, "Ibuprofen"),
      periods: periodsFor(now, starts),
      dailyLogs: buildDailyLogs(now, starts, {
        heavy: true,
        periodSymptoms: ["cramps", "back_pain", "pain_bowel", "fatigue", "dizziness"],
        lutealSymptoms: ["bloating", "irritability", "breast_tenderness"],
        lutealMood: 2,
        everyday: ["fatigue"],
        periodLength: 5,
        extraDays: [-35, -30, -14, -10, -5, -2],
      }),
    };
  }
  if (id === "riya") {
    const starts = [-168, -125, -82, -40];
    return {
      id,
      name: "Riya (sample, PCOS-linked pattern)",
      avgCycleLength: 43,
      events: buildEvents(RIYA_ROWS, now, 99, "Paracetamol"),
      periods: periodsFor(now, starts, 6),
      dailyLogs: buildDailyLogs(now, starts, {
        heavy: false,
        periodSymptoms: ["cramps", "acne"],
        lutealSymptoms: ["acne"],
        lutealMood: 3,
        everyday: ["acne", "excess_hair"],
        periodLength: 6,
        extraDays: [-100, -70, -55, -30, -20, -12, -6, -3],
      }).map((l, i) => (i === 3 ? { ...l, symptoms: [...l.symptoms, "weight_gain", "hair_thinning"] } : i === 9 ? { ...l, symptoms: [...l.symptoms, "hair_thinning"] } : l)),
    };
  }
  const starts = [-78, -50, -22];
  return {
    id,
    name: "Meera (sample, mild)",
    avgCycleLength: 28,
    events: buildEvents(MILD_ROWS, now, 7, "Paracetamol"),
    periods: periodsFor(now, starts),
    dailyLogs: buildDailyLogs(now, starts, {
      heavy: false,
      periodSymptoms: ["cramps"],
      lutealSymptoms: [],
      lutealMood: 4,
      everyday: [],
      periodLength: 4,
      extraDays: [-30, -10, -4],
    }),
  };
}
