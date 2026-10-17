import { NextResponse } from "next/server";
import { handle, HttpError } from "@/lib/api";
import { requireConsentedUser } from "@/lib/auth";
import { addDaysYmd } from "@/lib/cycles";
import { periodIcs } from "@/lib/doctors";
import { cycleFor } from "@/lib/health-service";
import { isPlus } from "@/lib/plans";

export const dynamic = "force-dynamic";

/** Predicted periods for the next 6 cycles as an .ics calendar file (Plus). */
export const GET = handle(async () => {
  const user = await requireConsentedUser();
  if (!isPlus(user.plan)) throw new HttpError(402, "Calendar export is part of Flowra Plus.");
  const est = await cycleFor(user);
  if (!est.nextPeriod) throw new HttpError(400, "Log at least one period first.");
  const dates = Array.from({ length: 6 }, (_, i) => ({ start: addDaysYmd(est.nextPeriod!.date, i * est.averageLength), days: est.averagePeriodDays }));
  return new NextResponse(periodIcs(dates), { headers: { "Content-Type": "text/calendar; charset=utf-8", "Content-Disposition": `attachment; filename="flowra-periods.ics"` } });
});
