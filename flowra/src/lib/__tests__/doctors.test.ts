import { describe, expect, it } from "vitest";
import { generateSlots, rankDoctors, istDate } from "../doctors";

const FROM = new Date("2026-10-16T03:00:00Z"); // Fri 16 Oct, 08:30 IST

describe("doctor slots", () => {
  it("generates IST slots on working days only, after the lead time", () => {
    const slots = generateSlots({ days: [1, 2, 3, 4, 5], start: "10:00", end: "12:00", slotMinutes: 30 }, [], FROM, 3);
    // Fri: 4 slots; Sat/Sun skipped
    expect(slots.length).toBe(4);
    expect(slots[0].toISOString()).toBe("2026-10-16T04:30:00.000Z");
    expect(istDate(slots[0])).toBe("2026-10-16");
  });
  it("removes booked slots", () => {
    const booked = [new Date("2026-10-16T04:30:00.000Z")];
    const slots = generateSlots({ days: [5], start: "10:00", end: "11:00", slotMinutes: 30 }, booked, FROM, 1);
    expect(slots.map((s) => s.toISOString())).toEqual(["2026-10-16T05:00:00.000Z"]);
  });
});

describe("doctor ranking", () => {
  it("ranks by specialty, verification, availability, experience; never by fee", () => {
    const docs = [
      { id: "a", specialty: "dermatologist", verified: true, experienceYears: 20, nextSlot: new Date(1), feeInr: 100 },
      { id: "b", specialty: "gynaecologist", verified: false, experienceYears: 5, nextSlot: new Date(1), feeInr: 2000 },
      { id: "c", specialty: "gynaecologist", verified: true, experienceYears: 3, nextSlot: new Date(5), feeInr: 5000 },
      { id: "d", specialty: "gynaecologist", verified: true, experienceYears: 10, nextSlot: new Date(2), feeInr: 100 },
    ];
    expect(rankDoctors(docs, "gynaecologist").map((d) => d.id)).toEqual(["d", "c", "b", "a"]);
  });
});

import { mergeSettings, parseSettings } from "../settings";

describe("settings merge", () => {
  it("patches one nested field without resetting others", () => {
    const cur = parseSettings(JSON.stringify({ privacy: { useCloudAi: true, saveTranscripts: false } }));
    const next = mergeSettings(cur, { privacy: { useCloudAi: false } });
    expect(next.privacy).toEqual({ useCloudAi: false, saveTranscripts: false });
    expect(next.reminders.periodSoon).toBe(true);
  });
  it("rejects invalid values", () => {
    let threw = false;
    try {
      mergeSettings(parseSettings("{}"), { reminders: { periodSoonDays: 99 } });
    } catch {
      threw = true;
    }
    expect(threw).toBe(true);
  });
});
