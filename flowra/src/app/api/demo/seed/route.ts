/** POST /api/demo/seed?persona=anjali|mild : replaces THIS user's logs with sample data. */
import { z } from "zod";
import { handle, json } from "@/lib/api";
import { requireConsentedUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { recomputeAndSnapshot } from "@/lib/score-service";
import { applyPersona, upsertProducts, upsertSampleDoctors } from "@/lib/seed/apply";
import { userCipher } from "@/lib/crypto";

export const POST = handle(async (req) => {
  const user = await requireConsentedUser();
  const persona = z.enum(["anjali", "mild", "riya"]).parse(req.nextUrl.searchParams.get("persona") ?? "anjali");
  await applyPersona(prisma, user.id, persona, await userCipher(user));
  if ((await prisma.product.count()) === 0) await upsertProducts(prisma);
  if ((await prisma.doctor.count()) === 0 && process.env.SHOW_SAMPLE_DOCTORS !== "false") await upsertSampleDoctors(prisma);
  const score = await recomputeAndSnapshot(user.id);
  return json({ ok: true, persona, score });
});
