/**
 * Doctor discovery and slot generation (pure helpers).
 * Ranking never uses fees or commission: it uses specialty match, verification,
 * soonest availability and experience only. All appointment times are in IST (UTC+05:30).
 */
import { z } from "zod";

export const SPECIALTIES = ["gynaecologist", "endocrinologist", "general_physician", "psychiatrist", "dermatologist"] as const;
export type SpecialtyCode = (typeof SPECIALTIES)[number];
export const SPECIALTY_NAMES: Record<SpecialtyCode, string> = {
  gynaecologist: "Gynaecologist",
  endocrinologist: "Endocrinologist",
  general_physician: "General physician",
  psychiatrist: "Psychiatrist",
  dermatologist: "Dermatologist",
};
export const MODES = ["in_person", "online"] as const;
export type Mode = (typeof MODES)[number];

/** Flat booking fee shown up front (assumption to validate; may be waived). */
export const PLATFORM_FEE_INR = 29;
export const CANCEL_POLICY = "Free cancellation or rescheduling up to 2 hours before the appointment.";

export const ScheduleSchema = z.object({
  days: z.array(z.number().int().min(0).max(6)).default([1, 2, 3, 4, 5, 6]),
  start: z.string().regex(/^\d{2}:\d{2}$/).default("10:00"),
  end: z.string().regex(/^\d{2}:\d{2}$/).default("17:00"),
  slotMinutes: z.number().int().min(10).max(120).default(30),
});
export type Schedule = z.infer<typeof ScheduleSchema>;

const IST_OFFSET_MIN = 330;

/** YYYY-MM-DD of a moment in IST. */
export function istDate(d: Date): string {
  return new Date(d.getTime() + IST_OFFSET_MIN * 60_000).toISOString().slice(0, 10);
}

/** Day of week (0=Sun) of an IST calendar date. */
function istWeekday(date: string): number {
  return new Date(`${date}T12:00:00+05:30`).getUTCDay();
}

export function generateSlots(schedule: Schedule, booked: Date[], from: Date, days = 14, leadMinutes = 60): Date[] {
  const taken = new Set(booked.map((b) => b.getTime()));
  const out: Date[] = [];
  const earliest = from.getTime() + leadMinutes * 60_000;
  const [sh, sm] = schedule.start.split(":").map(Number);
  const [eh, em] = schedule.end.split(":").map(Number);
  for (let i = 0; i < days; i++) {
    const date = istDate(new Date(from.getTime() + i * 86_400_000));
    if (!schedule.days.includes(istWeekday(date))) continue;
    for (let m = sh * 60 + sm; m + schedule.slotMinutes <= eh * 60 + em; m += schedule.slotMinutes) {
      const hh = String(Math.floor(m / 60)).padStart(2, "0");
      const mm = String(m % 60).padStart(2, "0");
      const t = new Date(`${date}T${hh}:${mm}:00+05:30`);
      if (t.getTime() >= earliest && !taken.has(t.getTime())) out.push(t);
    }
  }
  return out;
}

export function formatIst(d: Date): string {
  return d.toLocaleString("en-IN", { timeZone: "Asia/Kolkata", weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
}

export interface RankableDoctor {
  id: string;
  specialty: string;
  verified: boolean;
  experienceYears: number;
  nextSlot: Date | null;
}

export function rankDoctors<T extends RankableDoctor>(doctors: T[], wantedSpecialty?: string): T[] {
  return [...doctors].sort((a, b) => {
    const sa = wantedSpecialty && a.specialty === wantedSpecialty ? 0 : 1;
    const sb = wantedSpecialty && b.specialty === wantedSpecialty ? 0 : 1;
    if (sa !== sb) return sa - sb;
    if (a.verified !== b.verified) return a.verified ? -1 : 1;
    const ta = a.nextSlot ? a.nextSlot.getTime() : Infinity;
    const tb = b.nextSlot ? b.nextSlot.getTime() : Infinity;
    if (ta !== tb) return ta - tb;
    if (a.experienceYears !== b.experienceYears) return b.experienceYears - a.experienceYears;
    return a.id.localeCompare(b.id);
  });
}

/** iCalendar file for an appointment (works with Google Calendar, Apple Calendar, Outlook). */
export function appointmentIcs(a: { id: string; startsAt: Date; minutes: number; title: string; location: string; description: string }): string {
  const f = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const end = new Date(a.startsAt.getTime() + a.minutes * 60_000);
  const esc = (s: string) => s.replace(/[\\,;]/g, (m) => `\\${m}`).replace(/\n/g, "\\n");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Flowra//Appointments//EN",
    "BEGIN:VEVENT",
    `UID:${a.id}@flowra`,
    `DTSTAMP:${f(new Date())}`,
    `DTSTART:${f(a.startsAt)}`,
    `DTEND:${f(end)}`,
    `SUMMARY:${esc(a.title)}`,
    `LOCATION:${esc(a.location)}`,
    `DESCRIPTION:${esc(a.description)}`,
    "BEGIN:VALARM",
    "TRIGGER:-PT2H",
    "ACTION:DISPLAY",
    "DESCRIPTION:Appointment reminder",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

/** iCalendar file with predicted period dates as all-day events. */
export function periodIcs(dates: { start: string; days: number }[]): string {
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Flowra//Cycle//EN"];
  dates.forEach((p, i) => {
    const s = p.start.replace(/-/g, "");
    const endD = new Date(`${p.start}T00:00:00Z`);
    endD.setUTCDate(endD.getUTCDate() + p.days);
    lines.push("BEGIN:VEVENT", `UID:period-${p.start}-${i}@flowra`, `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")}`, `DTSTART;VALUE=DATE:${s}`, `DTEND;VALUE=DATE:${endD.toISOString().slice(0, 10).replace(/-/g, "")}`, "SUMMARY:Period expected (Flowra estimate)", "BEGIN:VALARM", "TRIGGER:-P2D", "ACTION:DISPLAY", "DESCRIPTION:Period expected in 2 days", "END:VALARM", "END:VEVENT");
  });
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}
