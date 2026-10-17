import { handle, json } from "@/lib/api";
import { requireConsentedUser } from "@/lib/auth";
import { calendarShading, cycleFor } from "@/lib/health-service";
import { parseSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

/** Cycle estimates (all values are estimates) + calendar shading. */
export const GET = handle(async () => {
  const user = await requireConsentedUser();
  const est = await cycleFor(user);
  const s = parseSettings(user.settings);
  const showFertility = s.showFertility;
  return json({
    estimate: { ...est, ovulation: showFertility ? est.ovulation : null, fertileWindow: showFertility ? est.fertileWindow : null },
    shading: calendarShading(est, showFertility),
  });
});
