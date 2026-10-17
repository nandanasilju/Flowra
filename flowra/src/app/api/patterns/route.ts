import { handle, json } from "@/lib/api";
import { requireConsentedUser } from "@/lib/auth";
import { patternsFor } from "@/lib/health-service";

export const dynamic = "force-dynamic";

/** Condition-pattern awareness cards (rule-based, explainable, never a diagnosis). Always free. */
export const GET = handle(async () => {
  const user = await requireConsentedUser();
  return json({ result: await patternsFor(user.id) });
});
