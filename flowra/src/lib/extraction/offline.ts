/**
 * Offline keyword extractor (no AI). Used when GEMINI_API_KEY is not set or the
 * AI call fails, so typed notes and follow-up answers still work in an offline demo.
 * Deliberately simple and marked low-confidence; the user confirms every field.
 */
import type { Associated, Descriptor, Location } from "../enums";
import type { RedFlagCode } from "../scoring/constants";
import { ExtractionSchema, type Extraction } from "./schema";

const has = (text: string, words: string[]) => words.some((w) => text.includes(w));

const NUMBER_WORDS: Record<string, number> = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  "शून्य": 0, "एक": 1, "दो": 2, "तीन": 3, "चार": 4, "पांच": 5, "पाँच": 5, "छह": 6, "छः": 6, "सात": 7, "आठ": 8, "नौ": 9, "दस": 10,
  "പൂജ്യം": 0, "ഒന്ന്": 1, "രണ്ട്": 2, "മൂന്ന്": 3, "നാല്": 4, "അഞ്ച്": 5, "ആറ്": 6, "ഏഴ്": 7, "എട്ട്": 8, "ഒൻപത്": 9, "ഒമ്പത്": 9, "പത്ത്": 10,
};

function detectLanguage(text: string): Extraction["languageDetected"] {
  const deva = /[ऀ-ॿ]/.test(text);
  const mal = /[ഀ-ൿ]/.test(text);
  const latin = /[a-zA-Z]{3,}/.test(text);
  const count = [deva, mal, latin].filter(Boolean).length;
  if (count > 1) return "mixed";
  if (deva) return "hi";
  if (mal) return "ml";
  return "en";
}

function findPainScore(text: string): number | null {
  // "7/10", "7 out of 10", "10 में से 7", "പത്തിൽ 7"
  const patterns = [
    /\b(10|[0-9])\s*(?:\/|out of|of)\s*10\b/,
    /10\s*(?:में से|मे से)\s*(10|[0-9])/,
    /(?:പത്തിൽ|10ൽ|10 ൽ)\s*(10|[0-9])/,
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m) return Number(m[1]);
  }
  // Number words next to "out of ten" / "पत्तिल" etc.
  for (const [word, n] of Object.entries(NUMBER_WORDS)) {
    if (new RegExp(`(?:^|[\\s,])${word}(?:\\s+out of (?:ten|10)|\\s*$)`).test(text)) return n;
    if (text.includes(`പത്തിൽ ${word}`) || text.includes(`दस में से ${word}`) || text.includes(`10 में से ${word}`)) return n;
  }
  // A lone number answer, e.g. "6" or "around 6".
  const lone = text.trim().match(/^(?:about|around|maybe|लगभग|ഏകദേശം)?\s*(10|[0-9])\s*[.!]?$/);
  if (lone) return Number(lone[1]);
  return null;
}

export function offlineExtract(input: string): Extraction {
  const raw = input.trim();
  const text = raw.toLowerCase();

  const descriptors: Descriptor[] = [];
  if (has(text, ["cramp", "ऐंठन", "मरोड़", "मरोड", "കൊളുത്ത", "പിടുത്ത"])) descriptors.push("cramping");
  if (has(text, ["sharp", "तेज़ दर्द", "तीखा"])) descriptors.push("sharp");
  if (has(text, ["stab", "चुभ", "കുത്ത"])) descriptors.push("stabbing");
  if (has(text, ["burn", "जलन", "പുകച്ചിൽ", "എരിച്ചിൽ"])) descriptors.push("burning");
  if (has(text, ["dull", "ache", "हल्का दर्द", "മന്ദമായ"])) descriptors.push("dull");
  if (has(text, ["throb", "धड़क", "വിങ്ങ"])) descriptors.push("throbbing");

  const locations: Location[] = [];
  if (has(text, ["lower tummy", "lower abdomen", "stomach", "tummy", "belly", "पेट", "വയറ"])) locations.push("lower_abdomen");
  if (has(text, ["back", "कमर", "पीठ", "നടുവ", "മുതുക"])) locations.push("lower_back");
  if (has(text, ["left side", "बाईं", "बायीं", "ഇടത്"])) locations.push("pelvis_left");
  if (has(text, ["right side", "दाईं", "दायीं", "വലത്"])) locations.push("pelvis_right");
  if (has(text, ["thigh", "legs", "जांघ", "जाँघ", "തുട", "കാല്"])) locations.push("thighs");

  const associated: Associated[] = [];
  if (has(text, ["nause", "queasy", "मतली", "जी मिचला", "ഓക്കാന"])) associated.push("nausea");
  if (has(text, ["vomit", "throw up", "threw up", "उल्टी", "ഛർദ്ദ", "ഛര്‍ദ്ദ"])) associated.push("vomiting");
  if (has(text, ["dizz", "चक्कर", "തലകറക്ക"])) associated.push("dizziness");
  if (has(text, ["faint", "passed out", "black out", "blacked out", "बेहोश", "ബോധം"])) associated.push("fainting");
  if (has(text, ["fever", "बुखार", "പനി"])) associated.push("fever");
  if (has(text, ["bloat", "पेट फूल", "ഗ്യാസ്", "വീർ"])) associated.push("bloating");
  if (has(text, ["diarr", "loose motion", "दस्त", "വയറിളക"])) associated.push("diarrhea");
  if (has(text, ["headache", "सिरदर्द", "सिर दर्द", "തലവേദന"])) associated.push("headache");

  const medNames = ["ibuprofen", "paracetamol", "meftal", "dolo", "crocin", "combiflam", "aspirin", "mefenamic"];
  const medsFound = medNames.filter((m) => text.includes(m));
  if (has(text, ["ഐബുപ്രോഫെൻ"]) && !medsFound.includes("ibuprofen")) medsFound.push("ibuprofen");
  if (has(text, ["पैरासिटामोल", "പാരസെറ്റമോൾ"]) && !medsFound.includes("paracetamol")) medsFound.push("paracetamol");
  let relief: "none" | "partial" | "full" | "unknown" = "unknown";
  if (has(text, ["didn't help", "did not help", "no relief", "not helping", "no use", "कोई आराम नहीं", "आराम नहीं", "മാറുന്നില്ല", "കുറയുന്നില്ല"])) relief = "none";
  else if (has(text, ["little", "bit", "slightly", "partly", "थोड़ा", "थोडा", "കുറച്ച്"])) relief = "partial";
  else if (has(text, ["helped", "went away", "better now", "आराम मिला", "മാറി"])) relief = "full";
  const medications = medsFound.map((m) => ({ name: m.charAt(0).toUpperCase() + m.slice(1), relief }));

  let isPeriodDay: boolean | null = null;
  if (has(text, ["not on my period", "no period", "पीरियड नहीं", "പീരിയഡ് അല്ല"])) isPeriodDay = false;
  else if (has(text, ["period", "पीरियड", "मासिक", "माहवारी", "ആർത്തവ", "പീരിയഡ്", "മെൻസസ്"])) isPeriodDay = true;

  let bleeding: Extraction["bleeding"] = null;
  if (has(text, ["heavy flow", "flow is heavy", "bleeding heavily", "heavy bleeding", "bleeding a lot", "soaking", "ज़्यादा ब्लीडिंग", "बहुत ब्लीडिंग", "കൂടുതൽ ബ്ലീഡിംഗ്"])) bleeding = "heavy";
  else if (has(text, ["spotting", "स्पॉटिंग"])) bleeding = "spotting";
  else if (has(text, ["light flow", "light bleeding"])) bleeding = "light";

  const bedBound = has(text, ["in bed", "lying down", "can't get up", "cannot get up", "बिस्तर", "लेटी", "കിടക്കുക", "കിടന്നു"]);
  const missedActivity = has(text, ["missed", "couldn't go", "could not go", "skip", "leave from", "छुट्टी", "miss कर", "नहीं जा पाई", "പോകാൻ പറ്റിയില്ല", "ലീവ്"]);
  let functionalImpact: Extraction["functionalImpact"] = null;
  if (bedBound || missedActivity) functionalImpact = "severe";
  else if (has(text, ["slow down", "hard to focus", "difficult to work", "mushkil", "मुश्किल", "ബുദ്ധിമുട്ട്"])) functionalImpact = "some";

  const painScore = findPainScore(text);
  let durationMinutes: number | null = null;
  const hrs = text.match(/(\d{1,2})\s*(?:hours|hour|hrs|घंटे|घंटा|മണിക്കൂർ)/);
  const mins = text.match(/(\d{1,3})\s*(?:minutes|mins|मिनट|മിനിറ്റ്)/);
  if (hrs) durationMinutes = Number(hrs[1]) * 60;
  else if (mins) durationMinutes = Number(mins[1]);

  const redFlags: RedFlagCode[] = [];
  if (associated.includes("fainting")) redFlags.push("fainting");
  if (has(text, ["every hour", "each hour", "हर घंटे", "ഓരോ മണിക്കൂറിലും"]) && has(text, ["pad", "tampon", "पैड", "പാഡ്"])) redFlags.push("soaking_hourly");
  if (associated.includes("fever")) redFlags.push("fever_with_pain");
  if (has(text, ["sudden", "suddenly", "अचानक", "പെട്ടെന്ന്"]) && painScore !== null && painScore >= 9) redFlags.push("sudden_severe_pain");
  if (associated.includes("vomiting") && has(text, ["won't stop", "not stopping", "can't stop", "keeps vomiting", "नहीं रुक", "रुक नहीं", "നിൽക്കുന്നില്ല"])) redFlags.push("persistent_vomiting");

  const lang = detectLanguage(raw);
  return ExtractionSchema.parse({
    transcript: raw,
    transcriptEn: lang === "en" ? raw : "",
    languageDetected: lang,
    painScore,
    descriptors,
    locations,
    onsetNote: has(text, ["sudden", "अचानक", "പെട്ടെന്ന്"]) ? "Sudden onset mentioned" : null,
    durationMinutes,
    isPeriodDay,
    bleeding,
    functionalImpact,
    missedActivity: missedActivity || null,
    bedBound: bedBound || null,
    associated,
    medications,
    redFlagsMentioned: redFlags,
    confidence: 0.45,
    missingFields: [],
  });
}
