/** Builds the doctor report (used by /summary and by consent-based share links). */
import type { User } from "@prisma/client";
import { userCipher } from "./crypto";
import { prisma } from "./db";
import { toPatternLog, toPeriodRange, toScoringEvent } from "./dto";
import { estimate, type CycleEstimate } from "./cycles";
import { analysePatterns, type PatternCard } from "./patterns/engine";
import { computeScore, type ScoreResult } from "./scoring/engine";
import { buildSummary, type SummaryResult } from "./summary";
import { pbacScore } from "./enums";
import { parseEnumArray } from "./json";
import { SYMPTOMS, SYMPTOM_LABELS, type SymptomCode } from "./enums";
import { parsePbac } from "./dto";

export interface Report {
  patientName: string;
  generatedAt: string;
  summary: SummaryResult;
  score: ScoreResult;
  cycle: Pick<CycleEstimate, "averageLength" | "lengthRange" | "variation" | "averagePeriodDays" | "confidence"> & { cycles: { start: string; length: number | null; periodDays: number; pbac: number | null }[] };
  patterns: PatternCard[];
  topSymptoms: { code: string; label: string; days: number }[];
  quotes: { date: string; text: string; english: string }[];
  questions: string[];
}

const DAY = 86_400_000;

/** Code-written questions for the doctor, derived from pattern cards (no AI). */
function questionsFor(cards: PatternCard[]): string[] {
  const q: string[] = [];
  for (const c of cards) {
    if (c.id === "endometriosis") q.push("My pain is severe and also happens outside my period. Could we look into endometriosis or adenomyosis, and what tests would help?");
    if (c.id === "dysmenorrhea") q.push("My period pain stops my usual activities. What could be causing it, and what treatment options do I have?");
    if (c.id === "heavy_bleeding") q.push("My periods are heavy (pad-chart score of 100+). Could we check the cause, and my haemoglobin?");
    if (c.id === "anaemia") q.push("I feel tired and dizzy with heavy periods. Could I have a blood test for anaemia?");
    if (c.id === "pcos") q.push("My cycles are long and I have skin or hair changes. Could we check for PCOS or thyroid problems?");
    if (c.id === "irregular") q.push("My cycles are irregular. What tests would help find out why?");
    if (c.id === "pmdd") q.push("My mood becomes very low before every period. Could this be PMDD, and what can help?");
    if (c.id === "pms") q.push("I have symptoms before my period most months. What can I do to manage them?");
    if (c.id === "missed") q.push("I haven't had a period for 3 months. What could be the cause?");
    if (c.id === "abnormal_bleeding") q.push("I've had bleeding between periods or after sex. Should this be checked?");
  }
  return [...new Set(q)].slice(0, 4);
}

export async function buildReport(user: User, days: number): Promise<Report> {
  const now = new Date();
  const since = new Date(now.getTime() - Math.max(days, 200) * DAY);
  const [events, periods, logs] = await Promise.all([
    prisma.painEvent.findMany({ where: { userId: user.id, occurredAt: { gte: since } }, orderBy: { occurredAt: "asc" } }),
    prisma.periodLog.findMany({ where: { userId: user.id }, orderBy: { startDate: "asc" } }),
    prisma.dailyLog.findMany({ where: { userId: user.id, date: { gte: since.toISOString().slice(0, 10) } }, orderBy: { date: "asc" } }),
  ]);
  const scoring = events.map(toScoringEvent);
  const ranges = periods.map(toPeriodRange);
  const summary = buildSummary(scoring, ranges, days, now);
  const score = computeScore({ events: scoring, periods: ranges, now });
  const est = estimate(ranges, user.avgCycleLength, now);
  const patterns = analysePatterns({ periods: ranges, dailyLogs: logs.map(toPatternLog), painEvents: scoring, now });

  const fromDate = new Date(now.getTime() - days * DAY).toISOString().slice(0, 10);
  const inRange = logs.filter((l) => l.date >= fromDate);
  const counts = new Map<string, number>();
  for (const l of inRange) for (const s of parseEnumArray(l.symptoms, SYMPTOMS)) counts.set(s, (counts.get(s) ?? 0) + 1);
  const topSymptoms = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([code, n]) => ({ code, label: SYMPTOM_LABELS[code as SymptomCode], days: n }));

  const pbacByStart = new Map<string, number>();
  for (const c of est.cycles) {
    let total = 0;
    let any = false;
    for (const l of logs) {
      if (l.date >= c.start && l.date <= c.periodEnd) {
        const v = pbacScore(parsePbac(l.pbac));
        if (v > 0) any = true;
        total += v;
      }
    }
    if (any) pbacByStart.set(c.start, total);
  }

  const c = await userCipher(user);
  const quotes = events
    .filter((e) => e.occurredAt.getTime() >= now.getTime() - days * DAY && e.transcript)
    .map((e) => ({ date: e.occurredAt.toISOString(), text: c.dec(e.transcript), english: c.dec(e.transcriptEn) }))
    .filter((q) => q.text && q.text !== "(Sample data)" && q.text !== "[could not decrypt]")
    .slice(-3);

  return {
    patientName: user.name,
    generatedAt: now.toISOString(),
    summary,
    score,
    cycle: {
      averageLength: est.averageLength,
      lengthRange: est.lengthRange,
      variation: est.variation,
      averagePeriodDays: est.averagePeriodDays,
      confidence: est.confidence,
      cycles: est.cycles.slice(-6).map((x) => ({ start: x.start, length: x.length, periodDays: x.periodDays, pbac: pbacByStart.get(x.start) ?? null })),
    },
    patterns: patterns.cards,
    topSymptoms,
    quotes,
    questions: questionsFor(patterns.cards),
  };
}
