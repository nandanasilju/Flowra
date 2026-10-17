"use client";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { PageHeader } from "@/components/page-header";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { Badge } from "@/components/ui/badge";
import { useOrders } from "@/lib/client/hooks";
import { formatInr } from "@/lib/utils";

export default function OrdersPage() {
  const orders = useOrders();
  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="My orders" back="/shop" />
      {orders.isLoading && <LoadingState />}
      {orders.isError && <ErrorState message="Couldn't load orders." onRetry={() => orders.refetch()} />}
      {orders.data && orders.data.length === 0 && (
        <EmptyState title="No orders yet">
          <Link href="/shop" className="font-semibold text-plum-600 underline">Go to the shop</Link>
        </EmptyState>
      )}
      {orders.data?.map((o) => (
        <article key={o.id} className="rounded-lg border border-sand-200 bg-white p-3 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">{format(parseISO(o.createdAt), "d MMM yyyy, h:mm a")}</p>
            <Badge variant="teal">{o.status === "mock_paid" ? "Demo order" : o.status}</Badge>
          </div>
          <ul className="mt-2 space-y-1 text-sm">
            {o.items.map((i) => (
              <li key={i.productId} className="flex justify-between gap-2">
                <span>
                  {i.emoji} {i.name} × {i.qty}
                </span>
                <span className="tabular-nums">{formatInr(i.priceInr * i.qty)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-right font-bold">{formatInr(o.totalInr)}</p>
        </article>
      ))}
    </div>
  );
}
