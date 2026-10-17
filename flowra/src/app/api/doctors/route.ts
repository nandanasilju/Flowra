import { z } from "zod";
import { handle, json } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { Doctor } from "@prisma/client";
import { toDoctorDTO } from "@/lib/dto";
import { generateSlots, rankDoctors, ScheduleSchema, SPECIALTIES } from "@/lib/doctors";

export const dynamic = "force-dynamic";

const Query = z.object({
  q: z.string().trim().max(60).optional(),
  city: z.string().trim().max(40).optional(),
  specialty: z.enum(SPECIALTIES).optional(),
  mode: z.enum(["in_person", "online"]).optional(),
  maxFee: z.coerce.number().int().min(0).max(100000).optional(),
});

/** Search doctors. Ranked by specialty match, verification, availability and experience — never by fees or commission. */
export const GET = handle(async (req) => {
  await requireUser();
  const q = Query.parse(Object.fromEntries(req.nextUrl.searchParams));
  const showSamples = process.env.SHOW_SAMPLE_DOCTORS !== "false";
  const doctors = await prisma.doctor.findMany({
    where: { active: true, isSample: showSamples ? undefined : false, feeInr: q.maxFee ? { lte: q.maxFee } : undefined },
  });
  const now = new Date();
  const booked = await prisma.appointment.findMany({ where: { status: "booked", startsAt: { gte: now } }, select: { doctorId: true, startsAt: true } });
  const term = q.q?.toLowerCase();
  const city = q.city?.toLowerCase();
  type Row = { d: Doctor; id: string; specialty: string; verified: boolean; experienceYears: number; nextSlot: Date | null };
  const rows: Row[] = doctors
    .filter((d: Doctor) => (!term || `${d.name} ${d.clinic} ${d.bio} ${d.qualifications}`.toLowerCase().includes(term)) && (!city || d.city.toLowerCase().includes(city) || (city === "online" && d.modes.includes("online"))))
    .filter((d: Doctor) => !q.mode || d.modes.includes(q.mode))
    .map((d: Doctor): Row => {
      const schedule = ScheduleSchema.parse(JSON.parse(d.schedule || "{}"));
      const slots = generateSlots(schedule, booked.filter((b) => b.doctorId === d.id).map((b) => b.startsAt), now, 14);
      return { d, id: d.id, specialty: d.specialty, verified: d.verified, experienceYears: d.experienceYears, nextSlot: slots[0] ?? null };
    });
  const ranked = rankDoctors(rows, q.specialty);
  return json({ doctors: ranked.map((r) => toDoctorDTO(r.d, r.nextSlot)) });
});
