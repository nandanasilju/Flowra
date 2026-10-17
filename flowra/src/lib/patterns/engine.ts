/**
 * Flowra condition-pattern engine (knowledge-based expert system).
 *
 * Pure, deterministic TypeScript. It turns logged history into SIGNALS (e.g. "cycles longer
 * than 38 days in 2 of 4 cycles"), then matches signal combinations against clinically
 * grounded PROFILES. Output is a set of pattern cards that:
 *   - never diagnose and never show a probability or percentage;
 *   - always list overlapping conditions together;
 *   - explain exactly which logged data triggered them;
 *   - recommend a next step: keep tracking, consult, consult soon, or urgent care.
 *
 * Thresholds come from published definitions where they exist (FIGO 2018 cycle limits,
 * PBAC ≥ 100 for heavy bleeding) and are otherwise PLACEHOLDERS requiring clinician review.
 * See src/lib/patterns/profiles.ts for every rule in one place.
 */
import { addDaysYmd, buildCycles, diffDays, ymd, type Cycle, type PeriodInput } from "../cycles";
import { pbacScore, type Pbac } from "../enums";
import type { ScoringEvent } from "../scoring/engine";
import { effectiveRedFlags } from "../scoring/engine";
import { PROFILE_RULES as R } from "./profiles";

export interface DailyLogInput {
  date: string;
  flow: string | null;
  pbac: Pbac;
  mood: number | null;
  energy: number | null;
  symptoms: string[];
}

export interface PatternInput {
  periods: PeriodInput[];
  dailyLogs: DailyLogInput[];
  painEvents: ScoringEvent[];
  now?: Date;
}

export type Strength = "some" | "strong";
export type NextStep = "track" | "consult" | "consult_soon" | "urgent";
export type Specialty = "gynaecologist" | "general_physician" | "psychiatrist" | "endocrinologist";

export interface Signal {
  id: string;
  label: string;
  evidence: string;
}

export interface PatternCard {
  id: string;
  title: string;
  summary: string;
  conditions: { name: string; slug: string }[];
  strength: Strength;
  signals: Signal[];
  nextStep: NextStep;
  nextStepText: string;
  specialties: Specialty[];
  tips: string[]; // learn article slugs
  safetyNote?: string;
}

export interface PatternResult {
  cards: PatternCard[];
  signals: Record<string, Signal>;
  dataNotes: string[];
  cyclesAnalysed: number;
  daysLogged: number;
  windowDays: number;
}

const MOOD_CODES = ["low_mood", "anxiety", "irritability", "mood_swings", "tearful", "hopeless", "trouble_focusing"];
const PMS_PHYSICAL = ["bloating", "breast_tenderness", "headache", "cravings", "fatigue", "back_pain"];
const ANDROGEN_CODES: Record<string, string> = {
  acne: "acne",
  excess_hair: "extra facial or body hair",
  hair_thinning: "scalp hair thinning",
  skin_darkening: "dark skin patches",
};
const ANEMIA_CODES = ["fatigue", "dizziness", "breathless"];
const PAIN_EVENT_MAP: Record<string, string> = {
  painful_bowel: "pain_bowel",
  painful_urination: "pain_urination",
  bloating: "bloating",
  nausea: "nausea",
  vomiting: "nausea",
  headache: "headache",
  fever: "fever",
  dizziness: "dizziness",
  fainting: "dizziness",
  diarrhea: "diarrhea",
};

interface Day {
  pain: number;
  symptoms: Set<string>;
  flow: string | null;
  pbac: number;
  clotLarge: number;
  flooding: number;
  mood: number | null;
  impact: boolean;
  logged: boolean;
}

function plural(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`;
}

export function analysePatterns(input: PatternInput): PatternResult {
  const now = input.now ?? new Date();
  const today = ymd(now);
  const windowStart = addDaysYmd(today, -R.windowDays);
  const allCycles = buildCycles(input.periods);
  const cycles = allCycles.filter((c) => c.start >= addDaysYmd(windowStart, -45) && c.start <= today);
  const complete = cycles.filter((c): c is Cycle & { length: number } => c.length !== null);

  // ── Period days ─────────────────────────────────────────────────────
  const periodDays = new Set<string>();
  for (const c of allCycles) for (let d = 0; d < c.periodDays; d++) periodDays.add(addDaysYmd(c.start, d));
  for (const l of input.dailyLogs) if (l.flow === "light" || l.flow === "medium" || l.flow === "heavy") periodDays.add(l.date);
  for (const e of input.painEvents) if (e.isPeriodDay) periodDays.add(ymd(e.occurredAt));
  const nearPeriod = (d: string) => periodDays.has(d) || periodDays.has(addDaysYmd(d, 1)) || periodDays.has(addDaysYmd(d, -1)) || periodDays.has(addDaysYmd(d, 2)) || periodDays.has(addDaysYmd(d, -2));

  // ── Day map ─────────────────────────────────────────────────────────
  const days = new Map<string, Day>();
  const get = (d: string): Day => {
    let x = days.get(d);
    if (!x) {
      x = { pain: 0, symptoms: new Set(), flow: null, pbac: 0, clotLarge: 0, flooding: 0, mood: null, impact: false, logged: false };
      days.set(d, x);
    }
    return x;
  };
  for (const l of input.dailyLogs) {
    if (l.date < windowStart || l.date > today) continue;
    const d = get(l.date);
    d.logged = true;
    d.flow = l.flow;
    d.pbac = pbacScore(l.pbac);
    d.clotLarge = l.pbac.clotLarge ?? 0;
    d.flooding = l.pbac.flooding ?? 0;
    d.mood = l.mood;
    for (const s of l.symptoms) d.symptoms.add(s);
  }
  const redFlagDays = new Set<string>();
  for (const e of input.painEvents) {
    const key = ymd(e.occurredAt);
    if (key < windowStart || key > today) continue;
    const d = get(key);
    d.logged = true;
    d.pain = Math.max(d.pain, e.painScore);
    if (e.missedActivity || e.bedBound || e.functionalImpact === "severe") d.impact = true;
    for (const a of e.associated) if (PAIN_EVENT_MAP[a]) d.symptoms.add(PAIN_EVENT_MAP[a]);
    if (effectiveRedFlags(e).length) redFlagDays.add(key);
  }
  const loggedDays = [...days.entries()].filter(([, d]) => d.logged);
  const daysWith = (code: string, filter?: (date: string) => boolean) =>
    loggedDays.filter(([date, d]) => d.symptoms.has(code) && (!filter || filter(date))).length;

  // ── Per-cycle stats ─────────────────────────────────────────────────
  const cycleStats = cycles.map((c) => {
    let painMax = 0;
    let pbac = 0;
    let heavyDays = 0;
    let clots = 0;
    let flooding = 0;
    let impact = false;
    let bowel = false;
    let urination = false;
    for (let i = -1; i < c.periodDays + 1; i++) {
      const d = days.get(addDaysYmd(c.start, i));
      if (!d) continue;
      painMax = Math.max(painMax, d.pain);
      pbac += d.pbac;
      if (d.flow === "heavy") heavyDays++;
      clots += d.clotLarge;
      flooding += d.flooding;
      if (d.impact) impact = true;
      if (d.symptoms.has("pain_bowel")) bowel = true;
      if (d.symptoms.has("pain_urination")) urination = true;
    }
    return { cycle: c, painMax, pbac, heavyDays, clots, flooding, impact, bowel, urination };
  });

  const signals: Record<string, Signal> = {};
  const add = (id: string, label: string, evidence: string) => {
    signals[id] = { id, label, evidence };
  };

  // ── Cycle signals ───────────────────────────────────────────────────
  const longCycles = complete.filter((c) => c.length > R.cycleMax);
  const shortCycles = complete.filter((c) => c.length < R.cycleMin);
  if (longCycles.length >= R.minAbnormalCycles)
    add("long_cycles", "Cycles longer than 38 days", `${longCycles.length} of ${plural(complete.length, "cycle")} (${longCycles.map((c) => c.length).join(", ")} days)`);
  if (shortCycles.length >= R.minAbnormalCycles)
    add("short_cycles", "Cycles shorter than 24 days", `${shortCycles.length} of ${plural(complete.length, "cycle")} (${shortCycles.map((c) => c.length).join(", ")} days)`);
  if (complete.length >= 3) {
    const lens = complete.map((c) => c.length);
    const variation = Math.max(...lens) - Math.min(...lens);
    if (variation > R.variationMax) add("irregular", "Cycle length varies a lot", `Shortest ${Math.min(...lens)} vs longest ${Math.max(...lens)} days (${variation}-day difference)`);
  }
  const longPeriods = cycles.filter((c) => c.periodDays > R.periodMaxDays);
  if (longPeriods.length >= 1) add("long_periods", "Bleeding for more than 8 days", `${plural(longPeriods.length, "period")} lasted ${longPeriods.map((c) => c.periodDays).join(", ")} days`);
  const lastStart = allCycles.at(-1)?.start;
  if (lastStart) {
    const since = diffDays(today, lastStart);
    if (since >= R.amenorrheaDays) add("missed", "No period for 3 months or more", `${since} days since your last logged period`);
  }

  // ── Bleeding signals ────────────────────────────────────────────────
  const heavyCycles = cycleStats.filter((s) => s.pbac >= R.pbacHeavy || s.heavyDays >= R.heavyFlowDays || s.flooding >= 1 || s.clots >= 2);
  if (heavyCycles.length >= 1) {
    const withPbac = heavyCycles.filter((s) => s.pbac >= R.pbacHeavy);
    add(
      "heavy",
      "Heavy menstrual bleeding",
      withPbac.length
        ? `Pad-chart score of ${withPbac.map((s) => s.pbac).join(", ")} (100+ suggests heavy bleeding) in ${plural(withPbac.length, "period")}`
        : `Heavy flow, flooding or large clots in ${plural(heavyCycles.length, "period")}`,
    );
  }
  const between = loggedDays.filter(([date, d]) => (d.symptoms.has("bleeding_between_periods") || ((d.flow === "spotting" || d.flow === "light" || d.flow === "medium" || d.flow === "heavy") && !nearPeriod(date)))).length;
  if (between >= R.minBetweenBleedDays) add("between", "Bleeding between periods", `On ${plural(between, "day")} outside your period`);
  const afterSex = daysWith("bleeding_after_sex");
  if (afterSex >= 1) add("after_sex", "Bleeding after sex", `Logged on ${plural(afterSex, "day")}`);

  // ── Pain signals ────────────────────────────────────────────────────
  const painfulCycles = cycleStats.filter((s) => s.painMax >= R.periodPainMin);
  const severeCycles = cycleStats.filter((s) => s.painMax >= R.severePainMin);
  if (painfulCycles.length >= R.minPainfulCycles)
    add("period_pain", "Painful periods", `Period pain of ${R.periodPainMin}+/10 in ${painfulCycles.length} of ${plural(cycleStats.length, "cycle")}`);
  if (severeCycles.length >= R.minPainfulCycles)
    add("severe_period_pain", "Severe period pain", `Pain of ${R.severePainMin}+/10 during ${plural(severeCycles.length, "period")} (highest ${Math.max(...severeCycles.map((s) => s.painMax))}/10)`);
  const impactCycles = cycleStats.filter((s) => s.impact);
  if (impactCycles.length >= R.minPainfulCycles) add("impact", "Pain stops your usual activities", `Missed activities or stayed in bed during ${plural(impactCycles.length, "period")}`);
  const acyclical = loggedDays.filter(([date, d]) => d.pain >= R.periodPainMin && !nearPeriod(date)).length;
  if (acyclical >= R.minAcyclicalDays) add("acyclical", "Pain outside your period", `Pain of ${R.periodPainMin}+/10 on ${plural(acyclical, "day")} away from your period`);
  const pained = cycleStats.filter((s) => s.painMax > 0);
  if (pained.length >= 3) {
    const first = pained.slice(0, Math.floor(pained.length / 2));
    const last = pained.slice(Math.floor(pained.length / 2));
    const m = (a: typeof pained) => a.reduce((s, x) => s + x.painMax, 0) / a.length;
    const delta = m(last) - m(first);
    if (delta >= R.worseningDelta) add("worsening", "Period pain getting worse", `Average peak period pain rose by ${delta.toFixed(1)} points across your last ${plural(pained.length, "cycle")}`);
  }
  const sexPain = daysWith("pain_sex");
  if (sexPain >= 1) add("pain_sex", "Pain during or after sex", `Logged on ${plural(sexPain, "day")}`);
  const bowelCycles = cycleStats.filter((s) => s.bowel).length;
  const bowelDays = daysWith("pain_bowel");
  if (bowelCycles >= 1 || bowelDays >= 2) add("pain_bowel", "Pain with bowel movements", bowelCycles ? `Around ${plural(bowelCycles, "period")}` : `On ${plural(bowelDays, "day")}`);
  const urinCycles = cycleStats.filter((s) => s.urination).length;
  if (urinCycles >= 1) add("pain_urination", "Pain when peeing around your period", `During ${plural(urinCycles, "period")}`);
  const pressure = daysWith("pelvic_pressure") + daysWith("frequent_urination");
  if (pressure >= 2) add("pressure", "Pelvic pressure or peeing more often", `On ${plural(pressure, "day")}`);

  // ── Hormonal, anaemia, infection signals ────────────────────────────
  const androgenFound = Object.keys(ANDROGEN_CODES).filter((c) => daysWith(c) >= R.minSymptomDays);
  if (androgenFound.length) add("androgen", "Skin and hair changes", `Logged ${androgenFound.map((c) => ANDROGEN_CODES[c]).join(", ")}`);
  if (daysWith("weight_gain") >= 1) add("weight_gain", "Unexplained weight gain", `Logged on ${plural(daysWith("weight_gain"), "day")}`);
  const anemiaDays = loggedDays.filter(([, d]) => ANEMIA_CODES.some((c) => d.symptoms.has(c))).length;
  if (anemiaDays >= R.minSymptomDays) add("anemia_symptoms", "Tiredness, dizziness or breathlessness", `On ${plural(anemiaDays, "day")}`);
  const infectionDays = loggedDays.filter(([, d]) => d.symptoms.has("fever") && (d.pain >= 4 || d.symptoms.has("pelvic_pain")) ).length;
  const discharge = daysWith("unusual_discharge");
  if (infectionDays >= 1 && discharge >= 1) add("infection", "Fever with pelvic pain and unusual discharge", `Fever with pelvic pain on ${plural(infectionDays, "day")}; unusual discharge on ${plural(discharge, "day")}`);

  // ── Premenstrual signals (needs complete cycles with logs) ─────────
  let pmMoodCycles = 0;
  let pmSevereCycles = 0;
  let pmPhysicalCycles = 0;
  for (const c of complete) {
    const next = addDaysYmd(c.start, c.length);
    const luteal: Day[] = [];
    const follicular: Day[] = [];
    for (let i = 1; i <= R.lutealDays; i++) {
      const d = days.get(addDaysYmd(next, -i));
      if (d?.logged) luteal.push(d);
    }
    for (let i = 5; i <= 11; i++) {
      const d = days.get(addDaysYmd(c.start, i));
      if (d?.logged) follicular.push(d);
    }
    if (follicular.length === 0) continue; // can't confirm symptoms ease after the period
    const moodDay = (d: Day) => MOOD_CODES.some((m) => d.symptoms.has(m)) || (d.mood !== null && d.mood <= 2);
    const severeDay = (d: Day) => d.symptoms.has("hopeless") || (d.mood !== null && d.mood <= 1) || (moodDay(d) && d.impact);
    const physDay = (d: Day) => PMS_PHYSICAL.some((m) => d.symptoms.has(m));
    const lutMood = luteal.filter(moodDay).length;
    const folMood = follicular.filter(moodDay).length;
    if (lutMood >= 2 && folMood <= 1) {
      pmMoodCycles++;
      if (luteal.filter(severeDay).length >= 2) pmSevereCycles++;
    }
    if (luteal.filter(physDay).length >= 2 && follicular.filter(physDay).length <= 1) pmPhysicalCycles++;
  }
  if (pmMoodCycles >= R.minPmCycles) add("pm_mood", "Mood symptoms before your period", `In ${plural(pmMoodCycles, "cycle")}, easing after your period starts`);
  if (pmSevereCycles >= R.minPmCycles) add("pm_severe", "Severe mood symptoms before your period", `Very low mood or hopelessness before your period in ${plural(pmSevereCycles, "cycle")}`);
  if (pmPhysicalCycles >= R.minPmCycles) add("pm_physical", "Physical symptoms before your period", `Bloating, breast tenderness, headaches or cravings before ${plural(pmPhysicalCycles, "period")}`);

  // ── Match profiles → cards ──────────────────────────────────────────
  const has = (id: string) => Boolean(signals[id]);
  const pick = (...ids: string[]) => ids.filter(has).map((id) => signals[id]);
  const cards: PatternCard[] = [];

  // 1. Pelvic infection warning (most time-sensitive first)
  if (has("infection")) {
    cards.push({
      id: "infection",
      title: "Signs that need a doctor soon",
      summary: "Fever together with pelvic pain and unusual discharge can be a sign of an infection that needs prompt treatment.",
      conditions: [{ name: "Pelvic inflammatory disease (PID)", slug: "pid" }, { name: "Other infections", slug: "pid" }],
      strength: "strong",
      signals: pick("infection"),
      nextStep: redFlagDays.size ? "urgent" : "consult_soon",
      nextStepText: "Please see a doctor within 24 hours. If the pain is severe or you feel very unwell, seek urgent care or call 112.",
      specialties: ["gynaecologist", "general_physician"],
      tips: [],
    });
  }

  // 2. Endometriosis-linked pattern
  const endoCore = pick("severe_period_pain", "acyclical", "worsening");
  const endoSupport = pick("pain_sex", "pain_bowel", "pain_urination", "acyclical", "worsening", "impact");
  if (endoCore.length >= 1 && endoSupport.length >= 2) {
    const all = [...new Map([...endoCore, ...endoSupport].map((s) => [s.id, s])).values()];
    cards.push({
      id: "endometriosis",
      title: "Pain pattern sometimes linked with endometriosis",
      summary:
        "Your recorded symptoms may be associated with several conditions, including endometriosis and adenomyosis. These symptoms do not confirm a diagnosis, but discussing them with a gynaecologist may help you understand their cause.",
      conditions: [
        { name: "Endometriosis", slug: "endometriosis" },
        { name: "Adenomyosis", slug: "adenomyosis" },
        { name: "Secondary dysmenorrhea", slug: "dysmenorrhea" },
      ],
      strength: all.length >= 4 ? "strong" : "some",
      signals: all,
      nextStep: "consult",
      nextStepText: "Book a gynaecologist visit and take your Flowra report. Keep logging pain, bowel and urinary symptoms around your period.",
      specialties: ["gynaecologist"],
      tips: ["cramps", "doctor-visit"],
    });
  } else if (has("period_pain")) {
    // 3. Painful periods (dysmenorrhea)
    const sev = has("severe_period_pain") || has("impact");
    cards.push({
      id: "dysmenorrhea",
      title: sev ? "Period pain that affects your daily life" : "Painful periods",
      summary: sev
        ? "Severe period pain that stops your usual activities is common but not something you have to accept. A doctor can check for a cause and discuss treatment."
        : "Period cramps are common. Self-care often helps; if pain is severe, getting worse, or painkillers don't help, see a doctor.",
      conditions: [
        { name: "Primary dysmenorrhea", slug: "dysmenorrhea" },
        { name: "Secondary dysmenorrhea", slug: "dysmenorrhea" },
      ],
      strength: sev ? "strong" : "some",
      signals: pick("period_pain", "severe_period_pain", "impact"),
      nextStep: sev ? "consult" : "track",
      nextStepText: sev ? "Consider a gynaecologist visit. Bring your report showing pain levels and missed days." : "Keep tracking and try the self-care tips. See a doctor if it gets worse.",
      specialties: ["gynaecologist"],
      tips: ["cramps", "back-pain"],
    });
  }

  // 4. Heavy bleeding (+ fibroids / adenomyosis overlap) and anaemia risk
  if (has("heavy") || has("long_periods")) {
    const structural = pick("pressure", "severe_period_pain", "long_periods");
    cards.push({
      id: "heavy_bleeding",
      title: "Heavy or long periods",
      summary:
        "Heavy or prolonged bleeding has several possible causes, including fibroids, adenomyosis, polyps, hormonal changes, thyroid problems or bleeding disorders. A doctor can find the cause; many treatments exist.",
      conditions: [
        { name: "Heavy menstrual bleeding", slug: "heavy-bleeding" },
        { name: "Uterine fibroids", slug: "fibroids" },
        { name: "Adenomyosis", slug: "adenomyosis" },
      ],
      strength: (has("heavy") && structural.length >= 1) || heavyCycles.length >= 2 ? "strong" : "some",
      signals: pick("heavy", "long_periods", "pressure", "severe_period_pain"),
      nextStep: "consult",
      nextStepText: "See a gynaecologist. Using the pad chart for one more period gives the doctor a clearer picture.",
      specialties: ["gynaecologist"],
      tips: ["heavy-flow", "choosing-products"],
    });
    if (has("anemia_symptoms")) {
      cards.push({
        id: "anaemia",
        title: "Possible low iron from heavy bleeding",
        summary:
          "Heavy periods are a common cause of iron-deficiency anaemia, which can cause tiredness, dizziness and breathlessness. A simple blood test (haemoglobin and ferritin) can check this.",
        conditions: [{ name: "Iron-deficiency anaemia", slug: "anaemia" }],
        strength: "some",
        signals: pick("heavy", "long_periods", "anemia_symptoms"),
        nextStep: "consult",
        nextStepText: "Ask a doctor for a blood test. Don't start iron tablets without advice; too much iron can be harmful.",
        specialties: ["general_physician", "gynaecologist"],
        tips: ["fatigue", "nutrition"],
      });
    }
  }

  // 5. Irregular cycles / PCOS-linked pattern
  const cycleIrregular = pick("long_cycles", "irregular", "missed");
  if (cycleIrregular.length) {
    const hormonal = pick("androgen", "weight_gain");
    const pcos = hormonal.length >= 1 && (has("long_cycles") || has("irregular") || has("missed"));
    cards.push({
      id: pcos ? "pcos" : "irregular",
      title: pcos ? "Pattern often linked with PCOS" : "Irregular or infrequent cycles",
      summary: pcos
        ? "Long or irregular cycles together with acne, extra hair growth or scalp hair thinning is a pattern often linked with polycystic ovary syndrome (PCOS). Thyroid problems and other hormonal causes can look similar. Only a doctor can confirm the cause, usually with blood tests and sometimes an ultrasound."
        : "Cycles outside 24–38 days or that vary a lot can be caused by stress, weight change, thyroid problems, PCOS or other hormonal causes.",
      conditions: pcos
        ? [{ name: "Polycystic ovary syndrome (PCOS)", slug: "pcos" }, { name: "Thyroid problems", slug: "irregular-periods" }, { name: "Other hormonal causes", slug: "irregular-periods" }]
        : [{ name: "Irregular periods", slug: "irregular-periods" }, { name: "PCOS", slug: "pcos" }, { name: "Thyroid problems", slug: "irregular-periods" }],
      strength: pcos && hormonal.length + cycleIrregular.length >= 3 ? "strong" : "some",
      signals: [...cycleIrregular, ...hormonal],
      nextStep: "consult",
      nextStepText: pcos ? "See a gynaecologist or endocrinologist. Your cycle history will help them." : "Keep logging; if this continues for 3+ cycles, see a gynaecologist.",
      specialties: pcos ? ["gynaecologist", "endocrinologist"] : ["gynaecologist"],
      tips: ["acne", "nutrition"],
    });
  }

  // 6. Missed period
  if (has("missed")) {
    cards.push({
      id: "missed",
      title: "No period for 3 months",
      summary: "If there is any chance of pregnancy, take a pregnancy test first. Other common causes include stress, weight change, intense exercise, PCOS and thyroid problems.",
      conditions: [{ name: "Missed periods (amenorrhea)", slug: "irregular-periods" }],
      strength: "strong",
      signals: pick("missed"),
      nextStep: "consult",
      nextStepText: "Take a pregnancy test if relevant, then see a gynaecologist.",
      specialties: ["gynaecologist"],
      tips: [],
      safetyNote: "If you could be pregnant and have sudden one-sided pain, bleeding or feel faint, seek urgent care (112).",
    });
  }

  // 7. Abnormal bleeding (between periods / after sex / short cycles)
  const aub = pick("between", "after_sex", "short_cycles");
  if (aub.length) {
    cards.push({
      id: "abnormal_bleeding",
      title: "Unexpected bleeding",
      summary: "Bleeding between periods, after sex, or very frequent periods should be checked by a doctor. Causes range from hormonal changes and contraception to polyps or infections.",
      conditions: [{ name: "Abnormal uterine bleeding", slug: "heavy-bleeding" }],
      strength: has("after_sex") || aub.length >= 2 ? "strong" : "some",
      signals: aub,
      nextStep: has("after_sex") ? "consult_soon" : "consult",
      nextStepText: "Book a gynaecologist visit. Bleeding after sex should be checked soon.",
      specialties: ["gynaecologist"],
      tips: [],
    });
  }

  // 8. PMDD / PMS
  if (has("pm_severe")) {
    cards.push({
      id: "pmdd",
      title: "Severe mood changes before your period",
      summary:
        "Strong mood symptoms that start in the days before your period and ease once it starts, cycle after cycle, can be a sign of premenstrual dysphoric disorder (PMDD). It is treatable.",
      conditions: [{ name: "PMDD", slug: "pmdd" }, { name: "PMS", slug: "pms" }],
      strength: "strong",
      signals: pick("pm_severe", "pm_mood", "pm_physical"),
      nextStep: "consult",
      nextStepText: "Talk to a gynaecologist or a mental-health professional. Keep logging mood daily for two cycles; it helps diagnosis.",
      specialties: ["gynaecologist", "psychiatrist"],
      tips: ["mood"],
      safetyNote: "If you ever have thoughts of harming yourself, please reach out now: Tele-MANAS 14416 (free, 24×7) or call 112.",
    });
  } else if (has("pm_mood") || has("pm_physical")) {
    cards.push({
      id: "pms",
      title: "Premenstrual symptoms",
      summary: "Symptoms in the days before your period that ease once it starts are typical of premenstrual syndrome (PMS). Lifestyle changes often help.",
      conditions: [{ name: "PMS", slug: "pms" }],
      strength: has("pm_mood") && has("pm_physical") ? "strong" : "some",
      signals: pick("pm_mood", "pm_physical"),
      nextStep: "track",
      nextStepText: "Keep tracking and try the tips. See a doctor if symptoms disrupt work, study or relationships.",
      specialties: ["gynaecologist"],
      tips: ["mood", "bloating"],
    });
  }

  // ── Data notes ──────────────────────────────────────────────────────
  const dataNotes: string[] = [];
  if (allCycles.length < 2) dataNotes.push("Log at least 2 period start dates to see cycle patterns.");
  if (complete.length < 3) dataNotes.push("Pattern checks get more reliable after 3 complete cycles.");
  if (loggedDays.length < 10) dataNotes.push("Logging symptoms on more days (even 'no symptoms') makes patterns clearer.");

  return { cards, signals, dataNotes, cyclesAnalysed: complete.length, daysLogged: loggedDays.length, windowDays: R.windowDays };
}

export const NEXT_STEP_LABEL: Record<NextStep, string> = {
  track: "Keep tracking",
  consult: "Consider seeing a doctor",
  consult_soon: "See a doctor soon",
  urgent: "Seek urgent care",
};

export const SPECIALTY_LABEL: Record<Specialty, string> = {
  gynaecologist: "Gynaecologist",
  general_physician: "General physician",
  psychiatrist: "Psychiatrist / mental-health professional",
  endocrinologist: "Endocrinologist",
};
