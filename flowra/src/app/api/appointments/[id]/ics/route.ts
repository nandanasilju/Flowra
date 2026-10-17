import { NextResponse } from "next/server";
import { handle, HttpError } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { appointmentIcs, ScheduleSchema } from "@/lib/doctors";

export const dynamic = "force-dynamic";

/** Download an appointment as a calendar event (with a 2-hour reminder). */
export const GET = handle(async (req) => {
  const user = await requireUser();
  const id = req.nextUrl.pathname.split("/").at(-2) ?? "";
  const a = await prisma.appointment.findFirst({ where: { id, userId: user.id }, include: { doctor: true } });
  if (!a) throw new HttpError(404, "Appointment not found.");
  const minutes = ScheduleSchema.parse(JSON.parse(a.doctor.schedule || "{}")).slotMinutes;
  const ics = appointmentIcs({
    id: a.id,
    startsAt: a.startsAt,
    minutes,
    title: `Appointment: ${a.doctor.name}`,
    location: a.mode === "online" ? "Online consultation" : `${a.doctor.clinic}, ${a.doctor.city}`,
    description: "Booked with Flowra. Bring your Flowra report.",
  });
  return new NextResponse(ics, { headers: { "Content-Type": "text/calendar; charset=utf-8", "Content-Disposition": `attachment; filename="flowra-appointment.ics"` } });
});
