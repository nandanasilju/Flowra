/** Export ALL of the user's data as a JSON download (decrypted for her). */
import { NextResponse } from "next/server";
import { handle } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { userCipher } from "@/lib/crypto";
import { prisma } from "@/lib/db";
import { toAppointmentDTO, toDailyLogDTO, toMeDTO, toOrderDTO, toPainEventDTO, toPeriodDTO } from "@/lib/dto";
import { parseStringArray } from "@/lib/json";

export const dynamic = "force-dynamic";

export const GET = handle(async () => {
  const user = await requireUser();
  const c = await userCipher(user);
  const [events, logs, periods, snapshots, orders, appointments, shareLinks] = await Promise.all([
    prisma.painEvent.findMany({ where: { userId: user.id }, orderBy: { occurredAt: "asc" } }),
    prisma.dailyLog.findMany({ where: { userId: user.id }, orderBy: { date: "asc" } }),
    prisma.periodLog.findMany({ where: { userId: user.id }, orderBy: { startDate: "asc" } }),
    prisma.scoreSnapshot.findMany({ where: { userId: user.id }, orderBy: { computedAt: "asc" } }),
    prisma.order.findMany({ where: { userId: user.id }, include: { items: { include: { product: true } } } }),
    prisma.appointment.findMany({ where: { userId: user.id }, include: { doctor: true } }),
    prisma.shareLink.findMany({ where: { userId: user.id } }),
  ]);
  const data = {
    exportedAt: new Date().toISOString(),
    note: "Flowra data export. Audio is never stored, so none is included.",
    account: toMeDTO(user),
    painEvents: events.map((e) => toPainEventDTO(e, c)),
    dailyLogs: logs.map((l) => toDailyLogDTO(l, c)),
    periods: periods.map(toPeriodDTO),
    scoreSnapshots: snapshots.map((s) => ({ computedAt: s.computedAt.toISOString(), score: s.score, level: s.level, redFlag: s.redFlag, reasons: parseStringArray(s.reasons) })),
    orders: orders.map(toOrderDTO),
    appointments: appointments.map((a) => toAppointmentDTO(a, c)),
    shareLinks: shareLinks.map((l) => ({ label: l.label, days: l.days, createdAt: l.createdAt.toISOString(), expiresAt: l.expiresAt.toISOString(), revoked: Boolean(l.revokedAt), views: l.views })),
  };
  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="flowra-export-${new Date().toISOString().slice(0, 10)}.json"`,
      "Cache-Control": "no-store",
    },
  });
});
