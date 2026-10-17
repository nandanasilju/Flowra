/** MOCK checkout: no payment is taken. Prices come from the database, never the client. */
import { handle, HttpError, json, readJson } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { toOrderDTO } from "@/lib/dto";
import { OrderInputSchema } from "@/lib/types";

export const dynamic = "force-dynamic";

export const GET = handle(async () => {
  const user = await requireUser();
  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    include: { items: { include: { product: true } } },
    orderBy: { createdAt: "desc" },
  });
  return json({ orders: orders.map(toOrderDTO) });
});

export const POST = handle(async (req) => {
  const user = await requireUser();
  const { items } = OrderInputSchema.parse(await readJson(req));
  const merged = new Map<string, number>();
  for (const i of items) merged.set(i.productId, (merged.get(i.productId) ?? 0) + i.qty);

  const order = await prisma.$transaction(async (tx) => {
    const products = await tx.product.findMany({ where: { id: { in: [...merged.keys()] } } });
    if (products.length !== merged.size) throw new HttpError(400, "Some items are no longer available.");
    for (const p of products) {
      if (p.stock < (merged.get(p.id) ?? 0)) throw new HttpError(409, `Only ${p.stock} left of ${p.name}.`);
    }
    const total = products.reduce((s, p) => s + p.priceInr * (merged.get(p.id) ?? 0), 0);
    for (const p of products) {
      await tx.product.update({ where: { id: p.id }, data: { stock: { decrement: merged.get(p.id) ?? 0 } } });
    }
    return tx.order.create({
      data: {
        userId: user.id,
        status: "mock_paid",
        totalInr: total,
        items: { create: products.map((p) => ({ productId: p.id, qty: merged.get(p.id) ?? 0, priceInr: p.priceInr })) },
      },
      include: { items: { include: { product: true } } },
    });
  });
  return json({ order: toOrderDTO(order) }, 201);
});
