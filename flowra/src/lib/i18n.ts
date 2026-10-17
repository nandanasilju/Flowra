/**
 * Small UI string table for the voice flow and key screens in English, Hindi and Malayalam.
 * (Other screens are English-only in this version; see README roadmap.)
 */
import type { Language } from "./enums";

const STRINGS = {
  followUpPain: {
    en: "From 0 to 10, how strong is the pain right now?",
    hi: "0 से 10 तक, अभी दर्द कितना तेज़ है?",
    ml: "0 മുതൽ 10 വരെ, ഇപ്പോൾ വേദന എത്ര കഠിനമാണ്?",
  },
  tapToSpeak: {
    en: "Tap and tell me about the pain",
    hi: "टैप करें और दर्द के बारे में बताएं",
    ml: "ടാപ്പ് ചെയ്ത് വേദനയെക്കുറിച്ച് പറയൂ",
  },
  listening: { en: "Listening… tap to stop", hi: "सुन रही हूँ… रोकने के लिए टैप करें", ml: "കേൾക്കുന്നു… നിർത്താൻ ടാപ്പ് ചെയ്യൂ" },
  speakHint: {
    en: "e.g. “Cramps in my lower tummy, about 6 out of 10, took ibuprofen.”",
    hi: "जैसे: “पेट के नीचे ऐंठन है, 10 में से 6, ibuprofen ली।”",
    ml: "ഉദാ: “അടിവയറ്റിൽ കൊളുത്തിപ്പിടിക്കുന്ന വേദന, പത്തിൽ ആറ്, ഐബുപ്രോഫെൻ കഴിച്ചു.”",
  },
  typeInstead: { en: "Type instead", hi: "टाइप करें", ml: "ടൈപ്പ് ചെയ്യൂ" },
  greeting: { en: "How are you feeling?", hi: "आप कैसा महसूस कर रही हैं?", ml: "എങ്ങനെയുണ്ട്?" },
} as const satisfies Record<string, Record<Language, string>>;

export type StringKey = keyof typeof STRINGS;

export function t(key: StringKey, lang: Language | string | null | undefined): string {
  const l: Language = lang === "hi" || lang === "ml" ? lang : "en";
  return STRINGS[key][l];
}

/** BCP-47 tags for Web Speech APIs. */
export function speechLang(lang: Language | string | null | undefined): string {
  return lang === "hi" ? "hi-IN" : lang === "ml" ? "ml-IN" : "en-IN";
}
