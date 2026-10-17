import { z } from "zod";
import { handle, HttpError, json, readJson } from "@/lib/api";
import { requireConsentedUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isPlus } from "@/lib/plans";
import { newToken } from "@/lib/tokens";

export const dynamic = "force-dynamic";

const Create = z.object({
  label: z.string().trim().min(1).max(60),
  days: z.union([z.literal(30), z.literal(60), z.literal(90)]).default(30),
  validDays: z.number().int().min(1).max(30).default(7),
  consent: z.literal(true, { errorMap: () => ({ message: "Please confirm you want to share your report." }) }),
});

export const GET = handle(async () => {
  const user = await requireConsentedUser();
  const links = await prisma.shareLink.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 30 });
  return json({
    links: links.map((l) => ({ id: l.id, label: l.label, days: l.days, expiresAt: l.expiresAt.toISOString(), revoked: Boolean(l.revokedAt), views: l.views, createdAt: l.createdAt.toISOString() })),
  });
});

/** Create a read-only, expiring report link. The token is shown once; only its hash is stored. */
export const POST = handle(async (req) => {
  const user = await requireConsentedUser();
  const body = Create.parse(await readJson(req));
  if (body.days > 30 && !isPlus(user.plan)) throw new HttpError(402, "60 and 90-day shared reports are part of Flowra Plus.");
  const t = newToken();
  await prisma.shareLink.create({ data: { userId: user.id, tokenHash: t.hash, label: body.label, days: body.days, expiresAt: new Date(Date.now() + body.validDays * 86_400_000) } });
  return json({ token: t.token }, 201);
});

export const DELETE = handle(async (req) => {
  const user = await requireConsentedUser();
  const id = z.string().min(1).parse(req.nextUrl.searchParams.get("id"));
  await prisma.shareLink.updateMany({ where: { id, userId: user.id }, data: { revokedAt: new Date() } });
  return json({ ok: true });
});
