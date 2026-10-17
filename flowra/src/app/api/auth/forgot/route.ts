import { z } from "zod";
import { handle, json, readJson } from "@/lib/api";
import { prisma } from "@/lib/db";
import { appUrl, sendEmail } from "@/lib/email";
import { clientIp, rateLimit } from "@/lib/ratelimit";
import { newToken } from "@/lib/tokens";

const Body = z.object({ email: z.string().trim().toLowerCase().email() });

/** Always answers the same way, so it can't be used to discover which emails have accounts. */
export const POST = handle(async (req) => {
  rateLimit(`forgot:${clientIp(req.headers)}`, 5, 15 * 60_000);
  const { email } = Body.parse(await readJson(req));
  const user = await prisma.user.findUnique({ where: { email } });
  if (user && !user.isDemo) {
    const t = newToken();
    await prisma.passwordReset.create({ data: { userId: user.id, tokenHash: t.hash, expiresAt: new Date(Date.now() + 30 * 60_000) } });
    await sendEmail(email, "Reset your Flowra password", `Hi ${user.name},\n\nReset your password here (valid for 30 minutes):\n${appUrl()}/reset-password?token=${t.token}\n\nIf you didn't ask for this, you can ignore this email.`);
  }
  return json({ ok: true, message: "If an account exists for that email, we've sent a reset link." });
});
