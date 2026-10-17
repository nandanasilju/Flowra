/**
 * Product recommendations (pure). Inputs are ONLY:
 *   - preferences the user chose (flow, cotton, organic, reusable, fragrance-free);
 *   - comfort-related symptoms she logged (irritation, cramps, back pain, bloating);
 *   - cycle timing (period expected soon) and her logged flow.
 * Pattern cards / possible conditions are NEVER an input, and sponsored/affiliate status
 * never affects ranking. Every recommendation carries the reasons it was shown.
 */
export interface RecProduct {
  id: string;
  name: string;
  category: string;
  tags: string[];
  priceInr: number;
  stock: number;
  sponsored: boolean;
}

export interface RecPrefs {
  flow: "light" | "medium" | "heavy" | null;
  cotton: boolean;
  organic: boolean;
  reusable: boolean;
  fragranceFree: boolean;
}

export interface RecInput {
  products: RecProduct[];
  prefs: RecPrefs;
  recentSymptoms: string[];
  daysUntilPeriod: number | null;
  heavyFlowLogged: boolean;
  dismissed: string[];
  limit?: number;
}

export interface Recommendation {
  productId: string;
  reasons: string[];
}

const COMFORT_RULES: { symptoms: string[]; tags: string[]; reason: string }[] = [
  { symptoms: ["pad_irritation", "chafing", "itching"], tags: ["fragrance_free", "sensitive", "cotton"], reason: "You logged irritation: fragrance-free or soft cotton options may be gentler" },
  { symptoms: ["pad_irritation", "chafing"], tags: ["reusable"], reason: "An alternative to pads, since you logged pad irritation" },
  { symptoms: ["cramps", "back_pain", "pelvic_pain"], tags: ["heat"], reason: "You logged cramps or back pain: heat may ease them" },
  { symptoms: ["bloating", "insomnia"], tags: ["tea"], reason: "A warm, caffeine-free drink for bloating or rest" },
];

export function recommend(input: RecInput): Recommendation[] {
  const sym = new Set(input.recentSymptoms);
  const dismissed = new Set(input.dismissed);
  const scored = input.products
    .filter((p) => p.stock > 0 && !dismissed.has(p.id))
    .map((p) => {
      let score = 0;
      const reasons: string[] = [];
      for (const rule of COMFORT_RULES) {
        if (rule.symptoms.some((s) => sym.has(s)) && rule.tags.some((t) => p.tags.includes(t))) {
          score += 10;
          reasons.push(rule.reason);
        }
      }
      const flow = input.prefs.flow ?? (input.heavyFlowLogged ? "heavy" : null);
      if (flow && p.tags.includes(`flow_${flow}`)) {
        score += 4;
        reasons.push(input.prefs.flow ? `Matches your ${flow} flow` : "Suits the heavy flow you logged");
      }
      const pref: [boolean, string, string][] = [
        [input.prefs.cotton, "cotton", "cotton"],
        [input.prefs.organic, "organic", "organic"],
        [input.prefs.reusable, "reusable", "reusable"],
        [input.prefs.fragranceFree, "fragrance_free", "fragrance-free"],
      ];
      const matched = pref.filter(([on, tag]) => on && p.tags.includes(tag)).map(([, , word]) => word);
      if (matched.length) {
        score += 3 * matched.length;
        reasons.push(`Matches your preference: ${matched.join(", ")}`);
      }
      if (input.daysUntilPeriod !== null && input.daysUntilPeriod >= 0 && input.daysUntilPeriod <= 5 && ["pads", "tampons", "cups", "period_underwear"].includes(p.category) && score > 0) {
        score += 2;
        reasons.push(`Your period is expected in about ${input.daysUntilPeriod} day${input.daysUntilPeriod === 1 ? "" : "s"}`);
      }
      return { p, score, reasons };
    })
    .filter((x) => x.score > 0)
    // Deterministic, commission-blind ordering: relevance, then price, then id.
    .sort((a, b) => b.score - a.score || a.p.priceInr - b.p.priceInr || a.p.id.localeCompare(b.p.id));
  return scored.slice(0, input.limit ?? 6).map((x) => ({ productId: x.p.id, reasons: x.reasons }));
}
