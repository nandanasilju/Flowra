import { z } from "zod";
import { handle, json, readJson } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { toProductDTO } from "@/lib/dto";

export const dynamic = "force-dynamic";

export const GET = handle(async () => {
  await requireAdmin();
  const list = await prisma.product.findMany({ orderBy: { id: "asc" } });
  return json({ products: list.map(toProductDTO) });
});

const Patch = z.object({
  id: z.string().min(1),
  url: z.string().url().max(500).optional(),
  retailer: z.string().trim().max(60).optional(),
  linkVerified: z.boolean().optional(),
  affiliate: z.boolean().optional(),
  sponsored: z.boolean().optional(),
  priceInr: z.number().int().min(0).max(100000).optional(),
  stock: z.number().int().min(0).max(100000).optional(),
});

/** Replace a search link with a verified product-specific (or affiliate) link, set labels. */
export const PATCH = handle(async (req) => {
  await requireAdmin();
  const { id, ...data } = Patch.parse(await readJson(req));
  const p = await prisma.product.update({ where: { id }, data });
  return json({ product: toProductDTO(p) });
});
