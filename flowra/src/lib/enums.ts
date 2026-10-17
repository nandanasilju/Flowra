/**
 * Allowed values for structured pain-log fields. Dependency-free so it can be
 * shared by the scoring engine, seed generator, zod schemas and UI.
 */
export const DESCRIPTORS = ["cramping", "sharp", "stabbing", "burning", "dull", "throbbing"] as const;
export const LOCATIONS = ["lower_abdomen", "lower_back", "pelvis_left", "pelvis_right", "thighs", "rectal", "other"] as const;
export const BLEEDING = ["none", "spotting", "light", "medium", "heavy"] as const;
export const IMPACTS = ["none", "some", "severe"] as const;
export const ASSOCIATED = [
  "nausea",
  "vomiting",
  "dizziness",
  "fainting",
  "fever",
  "bloating",
  "diarrhea",
  "headache",
  "painful_urination",
  "painful_bowel",
] as const;
export const RELIEF = ["none", "partial", "full", "unknown"] as const;
export const LANGUAGES = ["en", "hi", "ml"] as const;
export const DETECTED_LANGUAGES = ["en", "hi", "ml", "mixed", "other"] as const;
export const SOURCES = ["voice", "text", "sample"] as const;
export const PRODUCT_CATEGORIES = ["pads", "tampons", "cups", "period_underwear", "comfort", "hygiene"] as const;

export type Descriptor = (typeof DESCRIPTORS)[number];
export type Location = (typeof LOCATIONS)[number];
export type Bleeding = (typeof BLEEDING)[number];
export type Impact = (typeof IMPACTS)[number];
export type Associated = (typeof ASSOCIATED)[number];
export type Relief = (typeof RELIEF)[number];
export type Language = (typeof LANGUAGES)[number];
export type DetectedLanguage = (typeof DETECTED_LANGUAGES)[number];
export type Source = (typeof SOURCES)[number];
export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export const LABELS = {
  descriptors: {
    cramping: "Cramping",
    sharp: "Sharp",
    stabbing: "Stabbing",
    burning: "Burning",
    dull: "Dull ache",
    throbbing: "Throbbing",
  } satisfies Record<Descriptor, string>,
  locations: {
    lower_abdomen: "Lower tummy",
    lower_back: "Lower back",
    pelvis_left: "Pelvis (left)",
    pelvis_right: "Pelvis (right)",
    thighs: "Thighs",
    rectal: "Back passage",
    other: "Other",
  } satisfies Record<Location, string>,
  bleeding: { none: "None", spotting: "Spotting", light: "Light", medium: "Medium", heavy: "Heavy" } satisfies Record<Bleeding, string>,
  impacts: { none: "None", some: "Some", severe: "Severe" } satisfies Record<Impact, string>,
  associated: {
    nausea: "Nausea",
    vomiting: "Vomiting",
    dizziness: "Dizziness",
    fainting: "Fainting",
    fever: "Fever",
    bloating: "Bloating",
    diarrhea: "Loose motions",
    headache: "Headache",
    painful_urination: "Pain when peeing",
    painful_bowel: "Pain with bowel movement",
  } satisfies Record<Associated, string>,
  relief: { none: "No relief", partial: "Partial", full: "Full relief", unknown: "Not sure" } satisfies Record<Relief, string>,
  languages: { en: "English", hi: "हिन्दी (Hindi)", ml: "മലയാളം (Malayalam)" } satisfies Record<Language, string>,
  categories: {
    pads: "Pads",
    tampons: "Tampons",
    cups: "Menstrual cups",
    period_underwear: "Period underwear",
    comfort: "Comfort",
    hygiene: "Hygiene",
  } satisfies Record<ProductCategory, string>,
} as const;

/* ── Daily log (Flowra) ─────────────────────────────────────────────── */

export const FLOWS = ["none", "spotting", "light", "medium", "heavy"] as const;
export type Flow = (typeof FLOWS)[number];

/** Daily symptom codes, grouped for the log screen. */
export const SYMPTOM_GROUPS = {
  pain: ["cramps", "back_pain", "pelvic_pain", "pain_bowel", "pain_urination", "pain_sex", "headache", "breast_tenderness", "pelvic_pressure"],
  digestion: ["bloating", "nausea", "diarrhea", "constipation"],
  mood: ["low_mood", "anxiety", "irritability", "mood_swings", "tearful", "hopeless", "trouble_focusing"],
  body: ["fatigue", "dizziness", "breathless", "cravings", "insomnia", "frequent_urination", "fever"],
  skin_hair: ["acne", "excess_hair", "hair_thinning", "skin_darkening", "weight_gain"],
  products: ["pad_irritation", "chafing", "itching", "unusual_discharge"],
  bleeding: ["bleeding_between_periods", "bleeding_after_sex"],
} as const;

export type SymptomCode = (typeof SYMPTOM_GROUPS)[keyof typeof SYMPTOM_GROUPS][number];
export const SYMPTOMS = Object.values(SYMPTOM_GROUPS).flat() as SymptomCode[];

export const SYMPTOM_LABELS: Record<SymptomCode, string> = {
  cramps: "Cramps",
  back_pain: "Lower-back pain",
  pelvic_pain: "Pelvic pain",
  pain_bowel: "Pain with bowel movements",
  pain_urination: "Pain when peeing",
  pain_sex: "Pain during or after sex",
  headache: "Headache",
  breast_tenderness: "Breast tenderness",
  pelvic_pressure: "Pelvic pressure / heaviness",
  bloating: "Bloating",
  nausea: "Nausea",
  diarrhea: "Loose motions",
  constipation: "Constipation",
  low_mood: "Low mood",
  anxiety: "Anxiety",
  irritability: "Irritability / anger",
  mood_swings: "Mood swings",
  tearful: "Tearful",
  hopeless: "Feeling hopeless",
  trouble_focusing: "Trouble focusing",
  fatigue: "Fatigue",
  dizziness: "Dizziness",
  breathless: "Breathless on light activity",
  cravings: "Food cravings",
  insomnia: "Trouble sleeping",
  frequent_urination: "Peeing more often",
  fever: "Fever",
  acne: "Acne",
  excess_hair: "Extra hair on face/body",
  hair_thinning: "Hair thinning on scalp",
  skin_darkening: "Dark skin patches (neck/armpits)",
  weight_gain: "Unexplained weight gain",
  pad_irritation: "Irritation from pad/product",
  chafing: "Chafing / rash",
  itching: "Itching",
  unusual_discharge: "Unusual discharge or smell",
  bleeding_between_periods: "Bleeding between periods",
  bleeding_after_sex: "Bleeding after sex",
};

export const SYMPTOM_GROUP_LABELS: Record<keyof typeof SYMPTOM_GROUPS, string> = {
  pain: "Pain",
  digestion: "Digestion",
  mood: "Mood",
  body: "Body",
  skin_hair: "Skin, hair & weight",
  products: "Comfort & hygiene",
  bleeding: "Unexpected bleeding",
};

/**
 * Pictorial Blood loss Assessment Chart (Higham et al., 1990). A score of 100 or more
 * per period had >80% sensitivity and specificity for heavy menstrual bleeding.
 */
export const PBAC_ITEMS = {
  padLight: { label: "Pad, lightly stained", points: 1 },
  padMedium: { label: "Pad, half soaked", points: 5 },
  padFull: { label: "Pad, fully soaked", points: 20 },
  tamponLight: { label: "Tampon, lightly stained", points: 1 },
  tamponMedium: { label: "Tampon, half soaked", points: 5 },
  tamponFull: { label: "Tampon, fully soaked", points: 10 },
  clotSmall: { label: "Small clots (coin-sized)", points: 1 },
  clotLarge: { label: "Large clots (bigger than a coin)", points: 5 },
  flooding: { label: "Flooding episodes", points: 5 },
} as const;
export type PbacKey = keyof typeof PBAC_ITEMS;
export const PBAC_KEYS = Object.keys(PBAC_ITEMS) as PbacKey[];
export const PBAC_HEAVY_THRESHOLD = 100;
export type Pbac = Partial<Record<PbacKey, number>>;

export function pbacScore(p: Pbac): number {
  return PBAC_KEYS.reduce((s, k) => s + (p[k] ?? 0) * PBAC_ITEMS[k].points, 0);
}

export const GOALS = ["track", "symptoms", "conceive", "care"] as const;
export type Goal = (typeof GOALS)[number];
export const GOAL_LABELS: Record<Goal, string> = {
  track: "Track my periods",
  symptoms: "Understand my symptoms and pain",
  conceive: "I'm trying to conceive",
  care: "Prepare for a doctor's visit",
};
