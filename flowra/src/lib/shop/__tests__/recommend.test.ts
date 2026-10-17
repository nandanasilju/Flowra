import { describe, expect, it } from "vitest";
import { recommend, type RecPrefs } from "../recommend";
import { SEED_PRODUCTS } from "../../seed/products";

const none: RecPrefs = { flow: null, cotton: false, organic: false, reusable: false, fragranceFree: false };
const base = { products: SEED_PRODUCTS, prefs: none, recentSymptoms: [] as string[], daysUntilPeriod: null, heavyFlowLogged: false, dismissed: [] as string[] };

describe("product recommendations", () => {
  it("returns nothing without preferences or symptoms", () => {
    expect(recommend(base)).toEqual([]);
  });
  it("suggests fragrance-free/cotton options for pad irritation, with reasons", () => {
    const r = recommend({ ...base, recentSymptoms: ["pad_irritation"] });
    expect(r.length).toBeGreaterThan(0);
    expect(r[0].reasons.join(" ")).toContain("irritation");
  });
  it("suggests heat for cramps", () => {
    const r = recommend({ ...base, recentSymptoms: ["cramps"] });
    expect(r.map((x) => x.productId)).toContain("p11");
  });
  it("respects dismissed products", () => {
    const r = recommend({ ...base, recentSymptoms: ["cramps"], dismissed: ["p11"] });
    expect(r.map((x) => x.productId)).not.toContain("p11");
  });
  it("ignores sponsored status when ranking", () => {
    const flip = SEED_PRODUCTS.map((p) => ({ ...p, sponsored: !p.sponsored }));
    const a = recommend({ ...base, prefs: { ...none, flow: "medium" } });
    const b = recommend({ ...base, products: flip, prefs: { ...none, flow: "medium" } });
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
});
