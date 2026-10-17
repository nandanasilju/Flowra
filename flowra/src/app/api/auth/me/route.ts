import { handle, json } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { toMeDTO } from "@/lib/dto";

export const dynamic = "force-dynamic";

export const GET = handle(async () => {
  const user = await requireUser();
  return json({ user: toMeDTO(user) });
});
