import { z } from "zod";
import { handle, json, readJson } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { parseSettings } from "@/lib/settings";

const Body = z.object({ productId: z.string().min(1).max(40), undo: z.boolean().default(false) });

/** Hide (or un-hide) a recommended product for this user. */
export const POST = handle(async (req) => {
  const user = await requireUser();
  const { productId, undo } = Body.parse(await readJson(req));
  const s = parseSettings(user.settings);
  const set = new Set(s.dismissedProducts);
  if (undo) set.delete(productId);
  else set.add(productId);
  await prisma.user.update({ where: { id: user.id }, data: { settings: JSON.stringify({ ...s, dismissedProducts: [...set].slice(-100) }) } });
  return json({ ok: true });
});
