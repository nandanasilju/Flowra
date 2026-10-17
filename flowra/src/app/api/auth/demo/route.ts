/**
 * "Try demo account": creates a fresh, isolated demo user pre-loaded with the
 * Anjali sample persona, so several people can demo at once without clashing.
 * Consent is NOT pre-accepted, so the demo shows the consent screen first.
 */
import { randomBytes } from "crypto";
import { handle, json } from "@/lib/api";
import { hashPassword, setSessionCookie } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { toMeDTO } from "@/lib/dto";
import { applyPersona, upsertProducts, upsertSampleDoctors } from "@/lib/seed/apply";
import { userCipher } from "@/lib/crypto";
import { clientIp, rateLimit } from "@/lib/ratelimit";

export const POST = handle(async (req) => {
  rateLimit(`demo:${clientIp(req.headers)}`, 10, 60 * 60_000);
  const suffix = randomBytes(4).toString("hex");
  const user = await prisma.user.create({
    data: {
      email: `demo-${suffix}@demo.flowra.local`,
      name: "Anjali (sample)",
      passwordHash: await hashPassword(randomBytes(16).toString("hex")),
      isDemo: true,
    },
  });
  await applyPersona(prisma, user.id, "anjali", await userCipher(user));
  if ((await prisma.product.count()) === 0) await upsertProducts(prisma);
  if ((await prisma.doctor.count()) === 0 && process.env.SHOW_SAMPLE_DOCTORS !== "false") await upsertSampleDoctors(prisma);
  const res = json({ user: toMeDTO(user) }, 201);
  setSessionCookie(res, user.id);
  return res;
});
