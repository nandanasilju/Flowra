/**
 * Demo catalog: 15 menstrual & girl-care products. No medicines, no medical claims.
 * Visuals are emoji on CSS gradients (no remote images). Sponsored items are labelled in the UI.
 * Tags drive the Care Kit builder: flow_light|flow_medium|flow_heavy, cotton, organic, reusable, overnight, comfort, eco.
 */
import type { ProductCategory } from "../enums";

export interface SeedProduct {
  id: string;
  name: string;
  category: ProductCategory;
  description: string;
  priceInr: number;
  emoji: string;
  tags: string[];
  sponsored: boolean;
  stock: number;
  /** Link to the retailer. Seeded as a retailer SEARCH link (linkVerified=false) until an admin
   * replaces it with a verified product-specific (or affiliate) link. */
  url: string;
  retailer: string;
  affiliate: boolean;
  linkVerified: boolean;
}

const search = (q: string) => `https://www.amazon.in/s?k=${encodeURIComponent(q)}`;

export const SEED_PRODUCTS: SeedProduct[] = [
  { id: "p01", name: "Cotton Comfort Pads – Regular (pack of 10)", category: "pads", description: "Soft cotton top layer, wings, individually wrapped.", priceInr: 149, emoji: "🌸", tags: ["cotton", "flow_light", "flow_medium", "disposable", "fragrance_free"], sponsored: false, stock: 120, url: search("cotton sanitary pads regular"), retailer: "Amazon.in (search)", affiliate: false, linkVerified: false },
  { id: "p02", name: "Organic Cotton Pads – XL (pack of 8)", category: "pads", description: "Organic cotton cover, extra length for heavier days and nights.", priceInr: 229, emoji: "🌿", tags: ["organic", "cotton", "flow_heavy", "overnight", "disposable", "fragrance_free", "sensitive"], sponsored: false, stock: 80, url: search("organic cotton sanitary pads XL"), retailer: "Amazon.in (search)", affiliate: false, linkVerified: false },
  { id: "p03", name: "Ultra-thin Day Pads (pack of 12)", category: "pads", description: "Slim, flexible pads for regular days.", priceInr: 119, emoji: "🩷", tags: ["flow_medium", "flow_light", "disposable"], sponsored: true, stock: 150, url: search("ultra thin sanitary pads"), retailer: "Amazon.in (search)", affiliate: false, linkVerified: false },
  { id: "p04", name: "Overnight Pads XXL (pack of 7)", category: "pads", description: "Longer back for lying down, wide wings.", priceInr: 189, emoji: "🌙", tags: ["flow_heavy", "overnight", "disposable"], sponsored: false, stock: 90, url: search("overnight sanitary pads XXL"), retailer: "Amazon.in (search)", affiliate: false, linkVerified: false },
  { id: "p05", name: "Organic Cotton Tampons – Regular (16)", category: "tampons", description: "Organic cotton, applicator-free.", priceInr: 199, emoji: "🌼", tags: ["organic", "cotton", "flow_light", "flow_medium", "disposable", "fragrance_free"], sponsored: false, stock: 60, url: search("organic cotton tampons regular"), retailer: "Amazon.in (search)", affiliate: false, linkVerified: false },
  { id: "p06", name: "Tampons – Super (16)", category: "tampons", description: "Higher absorbency with a smooth applicator.", priceInr: 229, emoji: "💧", tags: ["flow_heavy", "disposable"], sponsored: false, stock: 60, url: search("tampons super"), retailer: "Amazon.in (search)", affiliate: false, linkVerified: false },
  { id: "p07", name: "Menstrual Cup – Small", category: "cups", description: "Medical-grade silicone cup with a storage pouch. Reusable for years with care.", priceInr: 399, emoji: "🌷", tags: ["reusable", "flow_light", "flow_medium", "eco"], sponsored: false, stock: 40, url: search("menstrual cup small"), retailer: "Amazon.in (search)", affiliate: false, linkVerified: false },
  { id: "p08", name: "Menstrual Cup – Large", category: "cups", description: "Larger capacity silicone cup with a storage pouch.", priceInr: 449, emoji: "🌺", tags: ["reusable", "flow_heavy", "eco"], sponsored: true, stock: 40, url: search("menstrual cup large"), retailer: "Amazon.in (search)", affiliate: false, linkVerified: false },
  { id: "p09", name: "Period Underwear – Light Flow", category: "period_underwear", description: "Cotton brief with a built-in absorbent layer. Machine washable.", priceInr: 599, emoji: "🩲", tags: ["reusable", "cotton", "flow_light", "eco"], sponsored: false, stock: 50, url: search("period underwear light flow"), retailer: "Amazon.in (search)", affiliate: false, linkVerified: false },
  { id: "p10", name: "Period Underwear – Heavy / Overnight", category: "period_underwear", description: "Extra absorbent layer front to back for nights.", priceInr: 749, emoji: "🌌", tags: ["reusable", "flow_heavy", "overnight", "eco"], sponsored: false, stock: 50, url: search("period underwear heavy flow overnight"), retailer: "Amazon.in (search)", affiliate: false, linkVerified: false },
  { id: "p11", name: "Reusable Heat Bag", category: "comfort", description: "Soft-cover hot water bag with a knitted sleeve.", priceInr: 349, emoji: "🔥", tags: ["comfort", "reusable", "heat"], sponsored: false, stock: 70, url: search("hot water bag with cover"), retailer: "Amazon.in (search)", affiliate: false, linkVerified: false },
  { id: "p12", name: "Chamomile & Ginger Herbal Tea (20 bags)", category: "comfort", description: "A warm, caffeine-free blend for cosy evenings.", priceInr: 249, emoji: "🍵", tags: ["comfort", "organic", "tea"], sponsored: false, stock: 100, url: search("chamomile ginger herbal tea"), retailer: "Amazon.in (search)", affiliate: false, linkVerified: false },
  { id: "p13", name: "Cosy Socks & Eye Mask Set", category: "comfort", description: "Fleece socks and a soft eye mask for rest days.", priceInr: 299, emoji: "🧦", tags: ["comfort"], sponsored: false, stock: 60, url: search("fleece socks eye mask set"), retailer: "Amazon.in (search)", affiliate: false, linkVerified: false },
  { id: "p14", name: "Mild Fragrance-free Intimate Wash", category: "hygiene", description: "Gentle, fragrance-free wash for external use.", priceInr: 199, emoji: "🫧", tags: ["hygiene", "fragrance_free", "sensitive"], sponsored: false, stock: 80, url: search("fragrance free intimate wash"), retailer: "Amazon.in (search)", affiliate: false, linkVerified: false },
  { id: "p15", name: "Biodegradable Disposal Bags (30)", category: "hygiene", description: "Discreet bags for wrapping used pads and tampons.", priceInr: 99, emoji: "🛍️", tags: ["hygiene", "eco"], sponsored: false, stock: 200, url: search("biodegradable sanitary disposal bags"), retailer: "Amazon.in (search)", affiliate: false, linkVerified: false },
];
