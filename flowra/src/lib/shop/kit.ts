/**
 * Care Kit builder (pure). Uses ONLY the preferences the user chooses on the
 * screen — never pain scores, levels or any health data.
 */
export type Flow = "light" | "medium" | "heavy";

export interface KitPreferences {
  flow: Flow;
  cotton: boolean;
  organic: boolean;
  reusable: boolean;
  comfort: boolean;
}

export interface KitProduct {
  id: string;
  name: string;
  category: string;
  tags: string[];
  priceInr: number;
  stock: number;
}

export interface KitItem {
  productId: string;
  qty: number;
  role: string;
  why: string;
}

function prefScore(p: KitProduct, prefs: KitPreferences): number {
  let s = 0;
  if (p.tags.includes(`flow_${prefs.flow}`)) s += 10;
  if (prefs.cotton && p.tags.includes("cotton")) s += 3;
  if (prefs.organic && p.tags.includes("organic")) s += 3;
  if (prefs.reusable && p.tags.includes("reusable")) s += 4;
  return s;
}

function matchedWords(p: KitProduct, prefs: KitPreferences): string {
  const words: string[] = [];
  if (p.tags.includes(`flow_${prefs.flow}`)) words.push(`${prefs.flow} flow`);
  if (prefs.cotton && p.tags.includes("cotton")) words.push("cotton");
  if (prefs.organic && p.tags.includes("organic")) words.push("organic");
  if (prefs.reusable && p.tags.includes("reusable")) words.push("reusable");
  return words.length ? `Matches: ${words.join(", ")}` : "Popular basic";
}

/** Highest preference score first; ties broken by price then id (deterministic). */
function best(candidates: KitProduct[], prefs: KitPreferences): KitProduct | undefined {
  return [...candidates]
    .filter((p) => p.stock > 0)
    .sort((a, b) => prefScore(b, prefs) - prefScore(a, prefs) || a.priceInr - b.priceInr || a.id.localeCompare(b.id))[0];
}

export function buildCareKit(products: KitProduct[], prefs: KitPreferences): KitItem[] {
  const items: KitItem[] = [];
  const used = new Set<string>();
  const add = (p: KitProduct | undefined, qty: number, role: string) => {
    if (!p || used.has(p.id)) return;
    used.add(p.id);
    items.push({ productId: p.id, qty, role, why: matchedWords(p, prefs) });
  };

  // 1. Main protection for the day.
  const dayCategories = prefs.reusable ? ["cups", "period_underwear"] : ["pads", "tampons"];
  const dayPick = best(
    products.filter((p) => dayCategories.includes(p.category) && !p.tags.includes("overnight")),
    prefs,
  ) ?? best(products.filter((p) => dayCategories.includes(p.category)), prefs);
  const dayQty = prefs.reusable ? 1 : prefs.flow === "heavy" ? 3 : 2;
  add(dayPick, dayQty, "Daytime");

  // 2. Night protection for medium/heavy flow.
  if (prefs.flow !== "light") {
    const nightCategories = prefs.reusable ? ["period_underwear"] : ["pads"];
    add(best(products.filter((p) => nightCategories.includes(p.category) && p.tags.includes("overnight")), prefs), 1, "Night-time");
  }

  // 3. Backup: a disposable pad when the main pick is reusable (useful while learning a cup).
  if (prefs.reusable) add(best(products.filter((p) => p.category === "pads" && !p.tags.includes("overnight")), prefs), 1, "Backup");

  // 4. Comfort items if chosen.
  if (prefs.comfort) {
    add(products.find((p) => p.id === "p11" && p.stock > 0) ?? best(products.filter((p) => p.category === "comfort"), prefs), 1, "Comfort");
    add(best(products.filter((p) => p.category === "comfort" && !used.has(p.id)), prefs), 1, "Comfort");
  }

  // 5. Hygiene basics.
  add(best(products.filter((p) => p.category === "hygiene" && (prefs.reusable ? true : p.tags.includes("eco"))), prefs), 1, "Hygiene");

  return items;
}
