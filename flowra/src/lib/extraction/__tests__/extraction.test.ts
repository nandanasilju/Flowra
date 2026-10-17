import { describe, expect, it } from "vitest";
import { ExtractionSchema } from "../schema";
import { buildResponse, computeMissingFields, mergeExtractions, MAX_FOLLOW_UPS } from "../normalize";
import { offlineExtract } from "../offline";
import { SAMPLE_NOTES } from "../samples";

const base = {
  transcript: "x",
  transcriptEn: "x",
  languageDetected: "en",
  painScore: 6,
  confidence: 0.9,
};

describe("ExtractionSchema (AI output validator)", () => {
  it("accepts a minimal valid object and fills defaults", () => {
    const x = ExtractionSchema.parse(base);
    expect(x.descriptors).toEqual([]);
    expect(x.medications).toEqual([]);
    expect(x.bleeding).toBeNull();
    expect(x.isPeriodDay).toBeNull();
  });

  it("drops unknown enum values instead of failing", () => {
    const x = ExtractionSchema.parse({ ...base, descriptors: ["cramping", "spicy"], locations: ["moon", "lower_back"], bleeding: "torrential" });
    expect(x.descriptors).toEqual(["cramping"]);
    expect(x.locations).toEqual(["lower_back"]);
    expect(x.bleeding).toBeNull();
  });

  it("rejects out-of-range pain scores", () => {
    expect(ExtractionSchema.safeParse({ ...base, painScore: 14 }).success).toBe(false);
    expect(ExtractionSchema.safeParse({ ...base, painScore: -1 }).success).toBe(false);
  });

  it("rounds fractional pain scores and keeps null", () => {
    expect(ExtractionSchema.parse({ ...base, painScore: 6.6 }).painScore).toBe(7);
    expect(ExtractionSchema.parse({ ...base, painScore: null }).painScore).toBeNull();
  });

  it("keeps only known red-flag codes", () => {
    const x = ExtractionSchema.parse({ ...base, redFlagsMentioned: ["fainting", "spontaneous_combustion"] });
    expect(x.redFlagsMentioned).toEqual(["fainting"]);
  });

  it("defaults medication relief to unknown", () => {
    const x = ExtractionSchema.parse({ ...base, medications: [{ name: "Ibuprofen", relief: "magic" }] });
    expect(x.medications).toEqual([{ name: "Ibuprofen", relief: "unknown" }]);
  });

  it("rejects wrong types", () => {
    expect(ExtractionSchema.safeParse({ ...base, painScore: "six" }).success).toBe(false);
    expect(ExtractionSchema.safeParse({ ...base, isPeriodDay: "yes" }).success).toBe(false);
  });

  it("every cached sample passes validation", () => {
    for (const s of SAMPLE_NOTES) expect(ExtractionSchema.safeParse(s.result).success).toBe(true);
  });
});

describe("post-processing", () => {
  it("asks the follow-up only when the pain score is missing, at most twice", () => {
    const noScore = ExtractionSchema.parse({ ...base, painScore: null });
    expect(buildResponse(noScore, "gemini", "en", 0).followUpQuestion).toBe("From 0 to 10, how strong is the pain right now?");
    expect(buildResponse(noScore, "gemini", "hi", 1).followUpQuestion).toContain("0 से 10");
    expect(buildResponse(noScore, "gemini", "en", MAX_FOLLOW_UPS).followUpQuestion).toBeNull();
    expect(buildResponse(ExtractionSchema.parse(base), "gemini", "en", 0).followUpQuestion).toBeNull();
  });

  it("lists missing fields", () => {
    const missing = computeMissingFields(ExtractionSchema.parse({ ...base, painScore: null }));
    expect(missing).toContain("painScore");
    expect(missing).toContain("locations");
  });

  it("merging a follow-up answer only fills gaps", () => {
    const first = ExtractionSchema.parse({ ...base, painScore: null, descriptors: ["cramping"] });
    const answer = ExtractionSchema.parse({ ...base, transcript: "6", painScore: 6, descriptors: ["sharp"] });
    const merged = mergeExtractions(first, answer);
    expect(merged.painScore).toBe(6);
    expect(merged.descriptors).toEqual(["cramping"]);
  });
});

describe("offline keyword extractor", () => {
  it("handles English", () => {
    const x = offlineExtract("Cramps in my lower tummy, 7 out of 10, took ibuprofen but it didn't help. I'm on my period.");
    expect(x.painScore).toBe(7);
    expect(x.descriptors).toContain("cramping");
    expect(x.locations).toContain("lower_abdomen");
    expect(x.isPeriodDay).toBe(true);
    expect(x.medications).toEqual([{ name: "Ibuprofen", relief: "none" }]);
  });

  it("handles Hindi digits", () => {
    const x = offlineExtract("कमर में दर्द है, 10 में से 6");
    expect(x.painScore).toBe(6);
    expect(x.locations).toContain("lower_back");
    expect(x.languageDetected).toBe("hi");
  });

  it("handles a lone number follow-up answer", () => {
    expect(offlineExtract("6").painScore).toBe(6);
  });

  it("detects danger signs", () => {
    const x = offlineExtract("I fainted and I'm soaking a pad every hour");
    expect(x.redFlagsMentioned).toContain("fainting");
    expect(x.redFlagsMentioned).toContain("soaking_hourly");
  });

  it("never invents a pain score", () => {
    expect(offlineExtract("my back hurts").painScore).toBeNull();
  });
});
