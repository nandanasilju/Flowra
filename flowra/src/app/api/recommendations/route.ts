import { handle, json } from "@/lib/api";
import { requireConsentedUser } from "@/lib/auth";
import { ymd } from "@/lib/cycles";
import { prisma } from "@/lib/db";
import { toProductDTO } from "@/lib/dto";
import { SYMPTOMS } from "@/lib/enums";
import { cycleFor } from "@/lib/health-service";
import { parseEnumArray } from "@/lib/json";
import { parseSettings } from "@/lib/settings";
import { recommend } from "@/lib/shop/recommend";

export const dynamic = "force-dynamic";

/**
 * Personalised products. Uses preferences, comfort symptoms and cycle timing only.
 * Never uses condition-pattern cards. Off when the user turns personalisation off.
 */
export const GET = handle(async () => {
  const user = await requireConsentedUser();
  const s = parseSettings(user.settings);
  if (!user.personalizeShop) return json({ enabled: false, items: [] });
  const since = ymd(new Date(Date.now() - 60 * 86_400_000));
  const [logs, products, est] = await Promise.all([
    prisma.dailyLog.findMany({ where: { userId: user.id, date: { gte: since } }, select: { symptoms: true, flow: true } }),
    prisma.product.findMany({ orderBy: { id: "asc" } }),
    cycleFor(user),
  ]);
  const dtos = products.map(toProductDTO);
  const recs = recommend({
    products: dtos,
    prefs: s.productPrefs,
    recentSymptoms: logs.flatMap((l) => parseEnumArray(l.symptoms, SYMPTOMS)),
    daysUntilPeriod: est.nextPeriod?.daysUntil ?? null,
    heavyFlowLogged: logs.filter((l) => l.flow === "heavy").length >= 2,
    dismissed: s.dismissedProducts,
  });
  const byId = new Map(dtos.map((p) => [p.id, p] as const));
  return json({ enabled: true, items: recs.flatMap((r) => (byId.get(r.productId) ? [{ product: byId.get(r.productId), reasons: r.reasons }] : [])) });
});
