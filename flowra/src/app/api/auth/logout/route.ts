import { handle, json } from "@/lib/api";
import { clearSessionCookie } from "@/lib/auth";

export const POST = handle(async () => {
  const res = json({ ok: true });
  clearSessionCookie(res);
  return res;
});
