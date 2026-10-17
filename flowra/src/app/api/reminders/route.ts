import { handle, json } from "@/lib/api";
import { requireConsentedUser } from "@/lib/auth";
import { dueReminders } from "@/lib/health-service";

export const dynamic = "force-dynamic";

export const GET = handle(async () => {
  const user = await requireConsentedUser();
  return json({ reminders: await dueReminders(user) });
});
