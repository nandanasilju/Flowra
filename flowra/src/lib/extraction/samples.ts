/**
 * Canned sample voice notes for the demo. Each has a cached extraction result
 * that goes through the same zod validation + post-processing as a live AI result,
 * so "Play sample voice note" works with no microphone and no internet.
 */
export interface SampleNote {
  id: string;
  label: string;
  language: "en" | "hi" | "ml" | "mixed";
  transcript: string;
  /** Raw "AI output" exactly as Gemini would return it (validated by ExtractionSchema). */
  result: Record<string, unknown>;
}

export const SAMPLE_NOTES: SampleNote[] = [
  {
    id: "en_cramps",
    label: "English · period cramps",
    language: "en",
    transcript:
      "I've had cramps in my lower tummy since morning, about six out of ten. It's day two of my period and the flow is heavy. Took ibuprofen, it helped a little.",
    result: {
      transcript:
        "I've had cramps in my lower tummy since morning, about six out of ten. It's day two of my period and the flow is heavy. Took ibuprofen, it helped a little.",
      transcriptEn:
        "I've had cramps in my lower tummy since morning, about six out of ten. It's day two of my period and the flow is heavy. Took ibuprofen, it helped a little.",
      languageDetected: "en",
      painScore: 6,
      descriptors: ["cramping"],
      locations: ["lower_abdomen"],
      onsetNote: "Since morning",
      durationMinutes: null,
      isPeriodDay: true,
      bleeding: "heavy",
      functionalImpact: null,
      missedActivity: null,
      bedBound: null,
      associated: [],
      medications: [{ name: "Ibuprofen", relief: "partial" }],
      redFlagsMentioned: [],
      confidence: 0.92,
      missingFields: ["durationMinutes", "functionalImpact"],
    },
  },
  {
    id: "hi_back",
    label: "हिन्दी · back pain, missed work",
    language: "hi",
    transcript: "कमर और पेट के नीचे तेज़ दर्द है, 10 में से 7। पीरियड नहीं चल रहा है। आज ऑफिस से छुट्टी लेनी पड़ी।",
    result: {
      transcript: "कमर और पेट के नीचे तेज़ दर्द है, 10 में से 7। पीरियड नहीं चल रहा है। आज ऑफिस से छुट्टी लेनी पड़ी।",
      transcriptEn: "Sharp pain in my lower back and lower tummy, 7 out of 10. I'm not on my period. I had to take leave from the office today.",
      languageDetected: "hi",
      painScore: 7,
      descriptors: ["sharp"],
      locations: ["lower_back", "lower_abdomen"],
      onsetNote: null,
      durationMinutes: null,
      isPeriodDay: false,
      bleeding: null,
      functionalImpact: "severe",
      missedActivity: true,
      bedBound: null,
      associated: [],
      medications: [],
      redFlagsMentioned: [],
      confidence: 0.9,
      missingFields: ["durationMinutes", "bleeding"],
    },
  },
  {
    id: "ml_period",
    label: "മലയാളം · first day of period",
    language: "ml",
    transcript: "ആർത്തവത്തിന്റെ ആദ്യ ദിവസമാണ്. അടിവയറ്റിൽ കൊളുത്തിപ്പിടിക്കുന്ന വേദന, പത്തിൽ അഞ്ച്. രണ്ട് മണിക്കൂറായി തുടങ്ങിയിട്ട്.",
    result: {
      transcript: "ആർത്തവത്തിന്റെ ആദ്യ ദിവസമാണ്. അടിവയറ്റിൽ കൊളുത്തിപ്പിടിക്കുന്ന വേദന, പത്തിൽ അഞ്ച്. രണ്ട് മണിക്കൂറായി തുടങ്ങിയിട്ട്.",
      transcriptEn: "It's the first day of my period. Cramping pain in my lower tummy, five out of ten. It started two hours ago.",
      languageDetected: "ml",
      painScore: 5,
      descriptors: ["cramping"],
      locations: ["lower_abdomen"],
      onsetNote: "Started two hours ago",
      durationMinutes: 120,
      isPeriodDay: true,
      bleeding: null,
      functionalImpact: null,
      missedActivity: null,
      bedBound: null,
      associated: [],
      medications: [],
      redFlagsMentioned: [],
      confidence: 0.88,
      missingFields: ["bleeding", "functionalImpact"],
    },
  },
  {
    id: "mix_no_score",
    label: "Hinglish · no number (asks a follow-up)",
    language: "mixed",
    transcript: "पेट में बहुत dard है yaar, cramps और nausea भी।",
    result: {
      transcript: "पेट में बहुत dard है yaar, cramps और nausea भी।",
      transcriptEn: "My stomach hurts a lot, cramps and nausea too.",
      languageDetected: "mixed",
      painScore: null,
      descriptors: ["cramping"],
      locations: ["lower_abdomen"],
      onsetNote: null,
      durationMinutes: null,
      isPeriodDay: null,
      bleeding: null,
      functionalImpact: null,
      missedActivity: null,
      bedBound: null,
      associated: ["nausea"],
      medications: [],
      redFlagsMentioned: [],
      confidence: 0.7,
      missingFields: ["painScore", "durationMinutes", "isPeriodDay", "bleeding", "functionalImpact"],
    },
  },
  {
    id: "redflag_faint",
    label: "Demo · red-flag note (shows URGENT)",
    language: "en",
    transcript: "The pain came on suddenly, it's nine out of ten. I fainted in the bathroom and I'm soaking through a pad every hour.",
    result: {
      transcript: "The pain came on suddenly, it's nine out of ten. I fainted in the bathroom and I'm soaking through a pad every hour.",
      transcriptEn: "The pain came on suddenly, it's nine out of ten. I fainted in the bathroom and I'm soaking through a pad every hour.",
      languageDetected: "en",
      painScore: 9,
      descriptors: ["sharp"],
      locations: ["lower_abdomen"],
      onsetNote: "Sudden onset",
      durationMinutes: null,
      isPeriodDay: true,
      bleeding: "heavy",
      functionalImpact: "severe",
      missedActivity: null,
      bedBound: null,
      associated: ["fainting"],
      medications: [],
      redFlagsMentioned: ["fainting", "soaking_hourly", "sudden_severe_pain"],
      confidence: 0.93,
      missingFields: ["durationMinutes"],
    },
  },
];

export function getSample(id: string): SampleNote | undefined {
  return SAMPLE_NOTES.find((s) => s.id === id);
}

/** Lightweight list for the client (no cached results needed there). */
export const SAMPLE_MENU = SAMPLE_NOTES.map(({ id, label, language, transcript }) => ({ id, label, language, transcript }));
