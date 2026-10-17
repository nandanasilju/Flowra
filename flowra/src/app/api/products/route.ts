/**
 * Product catalog. Deliberately takes NO health data as input: results depend
 * only on the search text and category chosen by the user.
 */
import { handle, json } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { toProductDTO } from "@/lib/dto";
import { ProductQuerySchema } from "@/lib/types";

export const dynamic = "force-dynamic";

export const GET = handle(async (req) => {
  await requireUser();
  const q = ProductQuerySchema.parse(Object.fromEntries(req.nextUrl.searchParams));
  const products = await prisma.product.findMany({ where: { category: q.category }, orderBy: { id: "asc" } });
  const term = q.q?.toLowerCase();
  const list = products
    .map(toProductDTO)
    .filter((p) => !term || `${p.name} ${p.description} ${p.tags.join(" ")}`.toLowerCase().includes(term));
  return json({ products: list });
});
