import { z } from "zod";
import { handle, HttpError, json, readJson } from "@/lib/api";
import { hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { clientIp, rateLimit } from "@/lib/ratelimit";
import { hashToken } from "@/lib/tokens";

const Body = z.object({ token: z.string().min(10).max(200), password: z.string().min(8, "At least 8 characters").max(100) });

export const POST = handle(async (req) => {
  rateLimit(`reset:${clientIp(req.headers)}`, 10, 15 * 60_000);
  const { token, password } = Body.parse(await readJson(req));
  const r = await prisma.passwordReset.findUnique({ where: { tokenHash: hashToken(token) } });
  if (!r || r.usedAt || r.expiresAt < new Date()) throw new HttpError(400, "This reset link is invalid or has expired. Please request a new one.");
  await prisma.$transaction([
    prisma.user.update({ where: { id: r.userId }, data: { passwordHash: await hashPassword(password) } }),
    prisma.passwordReset.update({ where: { id: r.id }, data: { usedAt: new Date() } }),
  ]);
  return json({ ok: true });
});
