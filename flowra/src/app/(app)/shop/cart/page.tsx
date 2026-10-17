"use client";
import type { ProductDTO } from "@/lib/types";
import { useState } from "react";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Loader2, Minus, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { ProductVisual } from "@/components/product-card";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiFetch, errorMessage } from "@/lib/client/api";
import { useCart } from "@/lib/client/cart";
import { qk, useProducts } from "@/lib/client/hooks";
import type { OrderDTO } from "@/lib/types";
import { formatInr } from "@/lib/utils";

export default function CartPage() {
  const cart = useCart();
  const qc = useQueryClient();
  const products = useProducts("", "");
  const [placed, setPlaced] = useState<OrderDTO | null>(null);

  const byId = new Map<string, ProductDTO>((products.data ?? []).map((p: ProductDTO) => [p.id, p] as const));
  const lines = cart.lines.filter((l) => byId.has(l.productId));
  const total = lines.reduce((s, l) => s + (byId.get(l.productId)?.priceInr ?? 0) * l.qty, 0);

  const checkout = useMutation({
    mutationFn: () => apiFetch<{ order: OrderDTO }>("/api/orders", { method: "POST", json: { items: lines.map((l) => ({ productId: l.productId, qty: l.qty })) } }),
    onSuccess: async (res) => {
      setPlaced(res.order);
      cart.clear();
      await Promise.all([qc.invalidateQueries({ queryKey: qk.orders }), qc.invalidateQueries({ queryKey: ["products"] })]);
    },
  });

  if (placed) {
    return (
      <div className="flex flex-col items-center gap-3 py-10 text-center">
        <CheckCircle2 className="h-14 w-14 text-teal-600" aria-hidden />
        <h1 className="text-xl font-bold">Order placed (demo)</h1>
        <p className="text-sand-600">
          {formatInr(placed.totalInr)} · {placed.items.reduce((s, i) => s + i.qty, 0)} items. No payment was taken: this is a demo checkout.
        </p>
        <div className="flex gap-2">
          <Link href="/shop/orders" className="font-semibold text-plum-600 underline">View orders</Link>
          <Link href="/shop" className="font-semibold text-plum-600 underline">Keep shopping</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Cart" back="/shop" />
      {products.isLoading && <LoadingState />}
      {products.isError && <ErrorState message="Couldn't load products." onRetry={() => products.refetch()} />}
      {products.data && lines.length === 0 && (
        <EmptyState title="Your cart is empty">
          <Link href="/shop" className="font-semibold text-plum-600 underline">Browse the shop</Link> or try the <Link href="/shop/kit" className="font-semibold text-plum-600 underline">Care Kit builder</Link>.
        </EmptyState>
      )}
      {lines.length > 0 && (
        <>
          <ul className="flex flex-col gap-2">
            {lines.map((l) => {
              const p = byId.get(l.productId);
              if (!p) return null;
              return (
                <li key={l.productId} className="flex items-center gap-3 rounded-lg border border-sand-200 bg-white p-2.5">
                  <ProductVisual product={p} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm font-semibold">{p.name}</p>
                    <p className="text-sm text-sand-600">
                      {formatInr(p.priceInr)} {p.sponsored && <Badge variant="sponsored">Sponsored</Badge>}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="icon" aria-label="Decrease" onClick={() => cart.setQty(l.productId, l.qty - 1)}>
                      {l.qty === 1 ? <Trash2 /> : <Minus />}
                    </Button>
                    <span className="w-6 text-center font-semibold tabular-nums" aria-label="Quantity">{l.qty}</span>
                    <Button variant="outline" size="icon" aria-label="Increase" onClick={() => cart.setQty(l.productId, l.qty + 1)} disabled={l.qty >= 10}>
                      <Plus />
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="rounded-lg border border-sand-200 bg-white p-3">
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span>{formatInr(total)}</span>
            </div>
            <p className="mt-1 text-xs text-sand-600">Delivery and taxes are not calculated in this demo.</p>
          </div>
          {checkout.isError && <p role="alert" className="rounded-md bg-red-50 p-2 text-sm text-red-800">{errorMessage(checkout.error)}</p>}
          <Button size="lg" onClick={() => checkout.mutate()} disabled={checkout.isPending}>
            {checkout.isPending && <Loader2 className="animate-spin" />} Demo checkout: place order (no payment)
          </Button>
        </>
      )}
    </div>
  );
}
