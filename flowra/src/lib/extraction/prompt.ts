/** The extraction system prompt (the LLM only transcribes and extracts; it never scores or advises). */
export const EXTRACTION_SYSTEM_PROMPT = `You extract structured pain-log data from a spoken or typed note, which may be in English, Hindi, Malayalam or a mix. Transcribe in the original script and also give an English translation. Extract ONLY what the user explicitly says. Use null for anything not mentioned; never guess, never invent a pain score. Map descriptions to the allowed enums. If the user gives words but no number, estimate painScore only from clear wording and lower the confidence value. List any danger signs she mentions (fainting, soaking through a pad every hour, fever with pelvic pain, sudden very severe pain, unstoppable vomiting) in redFlagsMentioned. Return only JSON matching the schema.

Field notes:
- languageDetected: "en", "hi", "ml", "mixed" (more than one language) or "other".
- redFlagsMentioned codes: fainting, soaking_hourly, fever_with_pain, sudden_severe_pain, persistent_vomiting.
- functionalImpact: "none" (normal day), "some" (had to slow down), "severe" (could not do usual activities). null if not mentioned.
- missedActivity: true only if she says she missed college/work/school/plans. bedBound: true only if she says she is stuck in bed / lying down all day.
- isPeriodDay: true if she says she is on her period, false if she says she is not, otherwise null.
- medications: names exactly as said; relief "none" | "partial" | "full" | "unknown".
- confidence: 0-1, how sure you are of the extraction overall.
- missingFields: names of fields among painScore, descriptors, locations, durationMinutes, isPeriodDay, bleeding, functionalImpact that were not mentioned.
- Do not add advice, diagnoses or condition names anywhere.`;

export function followUpPrompt(question: string): string {
  return `This note is a short answer to the follow-up question: "${question}". Extract only what the answer says.`;
}
