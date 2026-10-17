import { handle, json } from "@/lib/api";
import { requireConsentedUser } from "@/lib/auth";
import { computeUserScore } from "@/lib/score-service";

export const dynamic = "force-dynamic";

/** Live score from the deterministic engine (no AI involved). */
export const GET = handle(async () => {
  const user = await requireConsentedUser();
  const score = await computeUserScore(user.id);
  return json({ score });
});
