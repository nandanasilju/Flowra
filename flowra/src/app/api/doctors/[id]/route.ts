import { handle, HttpError, json } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { toDoctorDTO } from "@/lib/dto";
import { CANCEL_POLICY, generateSlots, PLATFORM_FEE_INR, ScheduleSchema } from "@/lib/doctors";

export const dynamic = "force-dynamic";

/** Doctor profile + open slots for the next 14 days. */
export const GET = handle(async (req) => {
  await requireUser();
  const id = req.nextUrl.pathname.split("/").at(-1) ?? "";
  const d = await prisma.doctor.findFirst({ where: { id, active: true } });
  if (!d || (d.isSample && process.env.SHOW_SAMPLE_DOCTORS === "false")) throw new HttpError(404, "Doctor not found.");
  const now = new Date();
  const booked = await prisma.appointment.findMany({ where: { doctorId: d.id, status: "booked", startsAt: { gte: now } }, select: { startsAt: true } });
  const slots = generateSlots(ScheduleSchema.parse(JSON.parse(d.schedule || "{}")), booked.map((b) => b.startsAt), now, 14);
  return json({ doctor: toDoctorDTO(d, slots[0] ?? null), slots: slots.map((s) => s.toISOString()), platformFeeInr: PLATFORM_FEE_INR, cancelPolicy: CANCEL_POLICY });
});
