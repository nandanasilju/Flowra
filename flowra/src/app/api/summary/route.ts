import { handle, HttpError, json } from "@/lib/api";
import { requireConsentedUser } from "@/lib/auth";
import { isPlus } from "@/lib/plans";
import { buildReport } from "@/lib/report-service";
import { SummaryQuerySchema } from "@/lib/types";

export const dynamic = "force-dynamic";

/** Doctor report. 30 days is free; 60/90 days is part of Plus. */
export const GET = handle(async (req) => {
  const user = await requireConsentedUser();
  const { days } = SummaryQuerySchema.parse(Object.fromEntries(req.nextUrl.searchParams));
  if (days > 30 && !isPlus(user.plan)) throw new HttpError(402, "60 and 90-day reports are part of Flowra Plus.");
  return json({ report: await buildReport(user, days) });
});
