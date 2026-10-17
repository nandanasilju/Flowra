import { describe, expect, it } from "vitest";
import { buildCareKit } from "../kit";
import { SEED_PRODUCTS } from "../../seed/products";

describe("Care Kit builder", () => {
  it("heavy + reusable picks a large cup and overnight period underwear", () => {
    const kit = buildCareKit(SEED_PRODUCTS, { flow: "heavy", cotton: false, organic: false, reusable: true, comfort: false });
    const ids = kit.map((k) => k.productId);
    expect(ids).toContain("p08");
    expect(ids).toContain("p10");
  });

  it("light + cotton + comfort picks cotton pads and a comfort item, no night item", () => {
    const kit = buildCareKit(SEED_PRODUCTS, { flow: "light", cotton: true, organic: false, reusable: false, comfort: true });
    expect(kit.find((k) => k.role === "Night-time")).toBeUndefined();
    expect(kit.some((k) => k.role === "Comfort")).toBe(true);
    const day = kit.find((k) => k.role === "Daytime");
    expect(["p01", "p05"]).toContain(day?.productId);
  });

  it("never contains duplicates and is deterministic", () => {
    const prefs = { flow: "medium", cotton: true, organic: true, reusable: false, comfort: true } as const;
    const a = buildCareKit(SEED_PRODUCTS, prefs);
    const b = buildCareKit([...SEED_PRODUCTS].reverse(), prefs);
    expect(new Set(a.map((k) => k.productId)).size).toBe(a.length);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it("catalog has no medicines", () => {
    const text = SEED_PRODUCTS.map((p) => `${p.name} ${p.description}`).join(" ").toLowerCase();
    for (const w of ["ibuprofen", "paracetamol", "tablet", "capsule", "relief", "cure", "treat"]) expect(text.includes(w)).toBe(false);
  });
});
