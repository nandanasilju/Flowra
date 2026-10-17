import { handle, json } from "@/lib/api";
import { requireConsentedUser } from "@/lib/auth";
import { ARTICLES, getArticle, tipsForSymptoms } from "@/lib/content/learn";
import { prisma } from "@/lib/db";
import { parseEnumArray } from "@/lib/json";
import { SYMPTOMS } from "@/lib/enums";
import { ymd } from "@/lib/cycles";
import { patternsFor } from "@/lib/health-service";

export const dynamic = "force-dynamic";

/** Personalised tips: articles matching symptoms logged in the last 30 days, plus pattern-card tips. */
export const GET = handle(async () => {
  const user = await requireConsentedUser();
  const since = ymd(new Date(Date.now() - 30 * 86_400_000));
  const logs = await prisma.dailyLog.findMany({ where: { userId: user.id, date: { gte: since } }, select: { symptoms: true } });
  const symptoms = logs.flatMap((l) => parseEnumArray(l.symptoms, SYMPTOMS));
  const fromSymptoms = tipsForSymptoms(symptoms, 4);
  const p = await patternsFor(user.id);
  const fromPatterns = p.cards.flatMap((c) => c.tips).map(getArticle).filter((a): a is (typeof ARTICLES)[number] => Boolean(a));
  const seen = new Set<string>();
  const tips = [...fromSymptoms, ...fromPatterns].filter((a) => (seen.has(a.slug) ? false : (seen.add(a.slug), true))).slice(0, 4);
  return json({ tips: tips.map((a) => ({ slug: a.slug, title: a.title, summary: a.summary, because: a.triggers.filter((t) => (symptoms as string[]).includes(t)) })) });
});
