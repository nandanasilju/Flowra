/**
 * Period-discomfort education and self-care tips. Safe, practical guidance only:
 * no promises to cure, no medicine doses. Requires clinician review before production.
 * `triggers` = logged symptom codes that make an article show up as a personalised tip.
 * `productTags` = product tags that are genuinely useful for this topic (shown, never pushed).
 */
import type { Reference } from "./conditions";

export interface Article {
  slug: string;
  title: string;
  category: "Pain" | "Body" | "Mood" | "Skin & comfort" | "Products & hygiene" | "Everyday life" | "Care";
  summary: string;
  explanation: string;
  tryThis: string[];
  precautions: string[];
  seeDoctor: string[];
  references: Reference[];
  triggers: string[];
  productTags: string[];
}

const MED_NOTE =
  "Over-the-counter painkillers can help some people, but they are not safe for everyone (for example with stomach ulcers, asthma that worsens with these medicines, kidney problems, pregnancy, or other medicines). Ask a pharmacist or doctor before taking them, and always follow the label.";

export const ARTICLES: Article[] = [
  {
    slug: "cramps",
    title: "Period cramps",
    category: "Pain",
    summary: "Why cramps happen and what can ease them.",
    explanation: "During your period, the womb contracts to shed its lining, driven by chemicals called prostaglandins. This can cause cramping in the lower tummy that may spread to the back and thighs.",
    tryThis: ["Apply gentle heat (a hot-water bag or heat pad) to your lower tummy or back", "Light movement such as walking, stretching or yoga", "A warm bath or shower", "Gentle tummy massage in circular motions", "Rest when you need to; track which days are worst"],
    precautions: [MED_NOTE, "Wrap heat packs in cloth and don't sleep on them, to avoid burns."],
    seeDoctor: ["Pain stops you going to school, college or work", "Pain is getting worse each cycle", "Painkillers don't help", "Pain outside your period or during sex", "Sudden severe pain or fever (urgent)"],
    references: [{ label: "NHS: Period pain", url: "https://www.nhs.uk/conditions/period-pain/" }],
    triggers: ["cramps", "pelvic_pain"],
    productTags: ["heat"],
  },
  {
    slug: "back-pain",
    title: "Lower-back pain during periods",
    category: "Pain",
    summary: "Easing period-related back ache.",
    explanation: "Period pain often spreads to the lower back because the same nerves supply the womb and back.",
    tryThis: ["Heat on the lower back", "Gentle stretches such as child's pose or knee-to-chest", "Supportive sitting posture and short walks", "Sleeping on your side with a pillow between your knees"],
    precautions: [MED_NOTE],
    seeDoctor: ["Back pain with fever, numbness or weakness in the legs", "Back pain that continues outside your period"],
    references: [{ label: "NHS: Period pain", url: "https://www.nhs.uk/conditions/period-pain/" }],
    triggers: ["back_pain"],
    productTags: ["heat"],
  },
  {
    slug: "bloating",
    title: "Bloating and digestive changes",
    category: "Body",
    summary: "Why your tummy feels different around your period.",
    explanation: "Hormone changes before and during your period can cause water retention, bloating, constipation or loose motions.",
    tryThis: ["Drink enough water through the day", "Smaller, regular meals; limit very salty and fried food", "Fibre from fruit, vegetables and whole grains", "Gentle movement after meals"],
    precautions: ["Avoid laxatives or water tablets unless a doctor advises them."],
    seeDoctor: ["Bloating that lasts most days of the month", "Weight loss you can't explain", "Blood in your stool", "Severe pain with bowel movements (log it in Flowra)"],
    references: [{ label: "NHS: PMS", url: "https://www.nhs.uk/conditions/pre-menstrual-syndrome/" }],
    triggers: ["bloating", "constipation", "diarrhea", "nausea"],
    productTags: ["tea"],
  },
  {
    slug: "fatigue",
    title: "Fatigue and low energy",
    category: "Body",
    summary: "Feeling tired around your period, and when to check iron.",
    explanation: "Tiredness is common around periods. If your periods are heavy, low iron is a common cause of ongoing tiredness.",
    tryThis: ["Keep a regular sleep time", "Eat iron-rich foods (leafy greens, lentils, chana, jaggery, eggs, meat) with vitamin C", "Short walks or light exercise", "Plan lighter tasks on your heaviest days"],
    precautions: ["Don't start iron tablets without advice; too much iron can be harmful."],
    seeDoctor: ["Tiredness with dizziness or breathlessness", "Heavy periods (ask for a haemoglobin test)", "Tiredness lasting more than a few weeks"],
    references: [{ label: "NHS: Iron deficiency anaemia", url: "https://www.nhs.uk/conditions/iron-deficiency-anaemia/" }],
    triggers: ["fatigue", "dizziness", "breathless"],
    productTags: [],
  },
  {
    slug: "mood",
    title: "Mood changes and irritability",
    category: "Mood",
    summary: "Understanding premenstrual mood changes.",
    explanation: "Hormone changes in the second half of the cycle can affect mood. Noticing the pattern helps you plan, and helps a doctor if symptoms are severe.",
    tryThis: ["Log mood daily for 2 cycles to see your pattern", "Regular sleep, movement and meals", "Plan demanding tasks for other weeks when you can", "Talk to someone you trust", "Breathing exercises or short walks when tense"],
    precautions: ["If mood symptoms are severe or last all month, speak to a doctor; it may not be hormonal."],
    seeDoctor: ["Mood changes affect work, study or relationships", "Feeling hopeless before your period", "Thoughts of self-harm: call Tele-MANAS 14416 or 112 now"],
    references: [{ label: "NHS: PMS and PMDD", url: "https://www.nhs.uk/conditions/pre-menstrual-syndrome/" }],
    triggers: ["low_mood", "anxiety", "irritability", "mood_swings", "tearful", "hopeless"],
    productTags: [],
  },
  {
    slug: "headache",
    title: "Period headaches",
    category: "Body",
    summary: "Headaches linked to your cycle.",
    explanation: "Falling oestrogen just before a period can trigger headaches or migraines in some people.",
    tryThis: ["Stay hydrated and don't skip meals", "Regular sleep", "Rest in a dark, quiet room", "Track headaches against your cycle in Flowra"],
    precautions: [MED_NOTE],
    seeDoctor: ["Sudden, severe headache (urgent)", "Headache with vision changes, weakness or confusion (urgent)", "Headaches getting more frequent"],
    references: [{ label: "NHS: PMS", url: "https://www.nhs.uk/conditions/pre-menstrual-syndrome/" }],
    triggers: ["headache"],
    productTags: [],
  },
  {
    slug: "acne",
    title: "Period acne and skin changes",
    category: "Skin & comfort",
    summary: "Breakouts around your period and when they may mean more.",
    explanation: "Many people get spots before their period due to hormone changes. Persistent acne together with irregular periods or extra hair growth can be linked to hormonal conditions such as PCOS.",
    tryThis: ["Wash your face twice a day with a gentle cleanser", "Don't squeeze spots", "Use non-comedogenic (won't block pores) products", "Change pillow covers often"],
    precautions: ["Check with a doctor or pharmacist before using strong acne treatments, especially if you could be pregnant."],
    seeDoctor: ["Acne with irregular periods or extra hair growth", "Painful, deep or scarring acne"],
    references: [{ label: "NHS: PMOS (formerly PCOS)", url: "https://www.nhs.uk/conditions/polyendocrine-metabolic-ovarian-syndrome-pmos/" }],
    triggers: ["acne", "excess_hair", "hair_thinning", "skin_darkening"],
    productTags: [],
  },
  {
    slug: "pad-irritation",
    title: "Pad rash, chafing and irritation",
    category: "Skin & comfort",
    summary: "Why pads can irritate skin and what to try.",
    explanation: "Irritation can come from friction, trapped moisture, or contact with fragrances or materials in some products.",
    tryThis: ["Change pads every 4–6 hours, or sooner if damp", "Try fragrance-free products or a soft cotton top layer", "Wear breathable cotton underwear", "Keep the area clean with water and pat dry", "Consider alternatives such as a menstrual cup or period underwear"],
    precautions: ["Avoid scented washes, sprays or wipes on the vulva.", "Don't use creams on broken skin without advice."],
    seeDoctor: ["Rash that doesn't improve after changing products", "Blisters, sores, or severe itching", "Unusual discharge or smell", "Fever"],
    references: [{ label: "NHS: Periods", url: "https://www.nhs.uk/conditions/periods/" }],
    triggers: ["pad_irritation", "chafing", "itching"],
    productTags: ["fragrance_free", "cotton", "sensitive"],
  },
  {
    slug: "hygiene",
    title: "Hygiene during your period",
    category: "Products & hygiene",
    summary: "Simple, safe hygiene habits.",
    explanation: "The vagina cleans itself. Simple hygiene keeps you comfortable without upsetting its natural balance.",
    tryThis: ["Wash the outside (vulva) with plain water or a mild, unscented wash", "Wash hands before and after changing products", "Change pads every 4–6 hours and tampons at least every 4–8 hours", "Wrap used products before disposal"],
    precautions: ["Don't douche or wash inside the vagina.", "Never leave a tampon in for more than 8 hours (risk of toxic shock syndrome)."],
    seeDoctor: ["Unusual discharge, smell, itching or burning", "High fever, rash and feeling faint while using a tampon (urgent)"],
    references: [{ label: "NHS: Periods", url: "https://www.nhs.uk/conditions/periods/" }],
    triggers: ["unusual_discharge", "itching"],
    productTags: ["hygiene"],
  },
  {
    slug: "choosing-products",
    title: "Choosing and changing menstrual products",
    category: "Products & hygiene",
    summary: "Pads, tampons, cups and period underwear compared.",
    explanation: "The right product depends on your flow, comfort, budget and lifestyle. Many people use more than one type.",
    tryThis: ["Pads: easy to use; choose absorbency to match flow", "Tampons: change every 4–8 hours; use the lowest absorbency you need", "Menstrual cups: reusable, can be worn up to 12 hours; practise insertion at home", "Period underwear: reusable, comfortable for light days or as backup"],
    precautions: ["Follow the instructions for each product.", "Sterilise cups as instructed between periods."],
    seeDoctor: ["Needing to change every 1–2 hours (could be heavy bleeding)"],
    references: [{ label: "NHS: Periods", url: "https://www.nhs.uk/conditions/periods/" }],
    triggers: [],
    productTags: ["reusable", "flow_light", "flow_medium", "flow_heavy"],
  },
  {
    slug: "heavy-flow",
    title: "Managing heavy flow",
    category: "Products & hygiene",
    summary: "Staying comfortable on heavy days, and when it's too heavy.",
    explanation: "Heavy periods are common but can be a sign of a treatable condition. Using the pad chart in Flowra gives a doctor useful information.",
    tryThis: ["Use overnight or high-absorbency products on heavy days", "Carry spare products and a change of underwear", "Use Flowra's pad chart for one full period", "Eat iron-rich foods"],
    precautions: ["Heavy bleeding can lower iron; don't ignore tiredness or dizziness."],
    seeDoctor: ["Changing products every 1–2 hours", "Clots bigger than a coin", "Periods longer than 8 days", "Soaking a pad every hour for 2+ hours (urgent)"],
    references: [{ label: "NHS: Heavy periods", url: "https://www.nhs.uk/conditions/heavy-periods/" }],
    triggers: [],
    productTags: ["flow_heavy", "overnight"],
  },
  {
    slug: "nutrition",
    title: "Sleep, hydration, movement and food",
    category: "Everyday life",
    summary: "Everyday habits that support your cycle.",
    explanation: "Regular sleep, meals and movement can ease many period symptoms and help cycles stay regular.",
    tryThis: ["7–9 hours of sleep at regular times", "Water through the day", "Balanced meals with iron, protein and fibre", "Regular moderate exercise", "Limit very sugary drinks and excess caffeine before your period"],
    precautions: ["Very low weight, extreme dieting or over-exercising can stop periods."],
    seeDoctor: ["Periods stop for 3 months", "Big changes in weight without trying"],
    references: [{ label: "NHS: Irregular periods", url: "https://www.nhs.uk/symptoms/irregular-periods/" }],
    triggers: ["insomnia", "cravings", "weight_gain"],
    productTags: ["tea"],
  },
  {
    slug: "on-the-go",
    title: "Periods at school, college, work and while travelling",
    category: "Everyday life",
    summary: "Practical tips for busy days.",
    explanation: "A little planning, using Flowra's predictions, makes busy days easier.",
    tryThis: ["Check your predicted dates before trips or exams", "Keep a small kit: products, wipes, disposal bags, spare underwear", "Wear dark or comfortable clothes on heavy days", "Ask about period-friendly policies at your institution or workplace"],
    precautions: ["Predictions are estimates; carry supplies a few days early."],
    seeDoctor: ["Pain or bleeding regularly makes you miss school, college or work"],
    references: [{ label: "NHS: Periods", url: "https://www.nhs.uk/conditions/periods/" }],
    triggers: [],
    productTags: ["hygiene", "flow_medium"],
  },
  {
    slug: "doctor-visit",
    title: "Preparing for a doctor's visit",
    category: "Care",
    summary: "How to make sure you're heard.",
    explanation: "Doctors rely on your history. A clear record of your pain, bleeding and symptoms over time makes it easier to get the right tests.",
    tryThis: ["Download your Flowra report and bring it", "Write down your top 3 concerns", "Say how symptoms affect your life (missed days, sleep)", "Ask: 'What could be causing this, and what tests would help?'", "If you feel dismissed, you can ask for a second opinion"],
    precautions: [],
    seeDoctor: [],
    references: [{ label: "WHO: Endometriosis", url: "https://www.who.int/news-room/fact-sheets/detail/endometriosis" }],
    triggers: [],
    productTags: [],
  },
];

export function getArticle(slug: string): Article | undefined {
  return ARTICLES.find((a) => a.slug === slug);
}

/** Articles relevant to the symptoms logged recently (most-matched first, max n). */
export function tipsForSymptoms(symptoms: string[], n = 3): Article[] {
  const set = new Set(symptoms);
  return ARTICLES.map((a) => ({ a, hits: a.triggers.filter((t) => set.has(t)).length }))
    .filter((x) => x.hits > 0)
    .sort((x, y) => y.hits - x.hits || x.a.slug.localeCompare(y.a.slug))
    .slice(0, n)
    .map((x) => x.a);
}
