import { z } from "zod";
import { handle, HttpError, json, readJson } from "@/lib/api";
import { requireConsentedUser } from "@/lib/auth";
import { userCipher } from "@/lib/crypto";
import { prisma } from "@/lib/db";
import { toAppointmentDTO } from "@/lib/dto";
import { generateSlots, PLATFORM_FEE_INR, ScheduleSchema } from "@/lib/doctors";
import { newToken } from "@/lib/tokens";

export const dynamic = "force-dynamic";

const Book = z.object({
  doctorId: z.string().min(1),
  startsAt: z.coerce.date(),
  mode: z.enum(["in_person", "online"]),
  notes: z.string().max(1000).nullable().default(null),
  shareReport: z.boolean().default(false),
  acceptPolicy: z.literal(true, { errorMap: () => ({ message: "Please accept the booking policy." }) }),
});

const Change = z.discriminatedUnion("action", [
  z.object({ action: z.literal("cancel"), id: z.string().min(1) }),
  z.object({ action: z.literal("reschedule"), id: z.string().min(1), startsAt: z.coerce.date() }),
  z.object({ action: z.literal("complete"), id: z.string().min(1) }),
]);

async function assertSlotFree(doctorId: string, startsAt: Date, ignoreId?: string) {
  const d = await prisma.doctor.findFirst({ where: { id: doctorId, active: true } });
  if (!d) throw new HttpError(404, "Doctor not found.");
  const booked = await prisma.appointment.findMany({ where: { doctorId, status: "booked", startsAt: { gte: new Date() }, id: ignoreId ? { not: ignoreId } : undefined }, select: { startsAt: true } });
  const slots = generateSlots(ScheduleSchema.parse(JSON.parse(d.schedule || "{}")), booked.map((b) => b.startsAt), new Date(), 14);
  if (!slots.some((s) => s.getTime() === startsAt.getTime())) throw new HttpError(409, "That slot is no longer available. Please pick another time.");
  return d;
}

export const GET = handle(async () => {
  const user = await requireConsentedUser();
  const list = await prisma.appointment.findMany({ where: { userId: user.id }, include: { doctor: true }, orderBy: { startsAt: "desc" } });
  const c = await userCipher(user);
  return json({ appointments: list.map((a) => toAppointmentDTO(a, c)) });
});

/** Book. Optionally create a consent-based 90-day report link for the doctor. Payment: pay at clinic (no online payment). */
export const POST = handle(async (req) => {
  const user = await requireConsentedUser();
  const body = Book.parse(await readJson(req));
  const d = await assertSlotFree(body.doctorId, body.startsAt);
  if (!d.modes.includes(body.mode)) throw new HttpError(400, "This doctor doesn't offer that consultation type.");
  const c = await userCipher(user);
  let shareToken: string | null = null;
  let shareLinkId: string | null = null;
  if (body.shareReport) {
    const t = newToken();
    const link = await prisma.shareLink.create({
      data: { userId: user.id, tokenHash: t.hash, label: `For ${d.name}`, days: 90, expiresAt: new Date(body.startsAt.getTime() + 7 * 86_400_000) },
    });
    shareToken = t.token;
    shareLinkId = link.id;
  }
  const appt = await prisma.appointment.create({
    data: { userId: user.id, doctorId: d.id, startsAt: body.startsAt, mode: body.mode, feeInr: d.feeInr, platformFeeInr: PLATFORM_FEE_INR, notes: c.encN(body.notes), shareLinkId },
    include: { doctor: true },
  });
  return json({ appointment: toAppointmentDTO(appt, c), shareToken }, 201);
});

export const PATCH = handle(async (req) => {
  const user = await requireConsentedUser();
  const body = Change.parse(await readJson(req));
  const appt = await prisma.appointment.findFirst({ where: { id: body.id, userId: user.id } });
  if (!appt) throw new HttpError(404, "Appointment not found.");
  if (body.action !== "complete" && appt.status !== "booked") throw new HttpError(409, "This appointment can no longer be changed.");
  if (body.action !== "complete" && appt.startsAt.getTime() - Date.now() < 2 * 3_600_000) throw new HttpError(409, "Changes are possible until 2 hours before the appointment. Please contact the clinic.");
  let data: { status?: string; cancelledAt?: Date; startsAt?: Date } = {};
  if (body.action === "cancel") {
    data = { status: "cancelled", cancelledAt: new Date() };
    if (appt.shareLinkId) await prisma.shareLink.updateMany({ where: { id: appt.shareLinkId, userId: user.id }, data: { revokedAt: new Date() } });
  } else if (body.action === "reschedule") {
    await assertSlotFree(appt.doctorId, body.startsAt, appt.id);
    data = { startsAt: body.startsAt };
  } else data = { status: "completed" };
  const updated = await prisma.appointment.update({ where: { id: appt.id }, data, include: { doctor: true } });
  return json({ appointment: toAppointmentDTO(updated, await userCipher(user)) });
});
