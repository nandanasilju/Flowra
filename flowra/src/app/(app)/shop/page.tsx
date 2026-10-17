"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/client/api";
import Link from "next/link";
import { CalendarHeart, Package, Search, ShoppingCart, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { ProductCard } from "@/components/product-card";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Input } from "@/components/ui/input";
import { useCart } from "@/lib/client/cart";
import { qk, useProducts, useRecommendations, useReminder } from "@/lib/client/hooks";
import { LoadingState as Loading } from "@/components/states";
import { LABELS, PRODUCT_CATEGORIES } from "@/lib/types";

function ShopInner() {
  const tag = useSearchParams().get("tag") ?? "";
  const recs = useRecommendations();
  const qc = useQueryClient();
  const dismiss = useMutation({
    mutationFn: (productId: string) => apiFetch("/api/products/dismiss", { method: "POST", json: { productId } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.recs }),
  });
  const [search, setSearch] = useState(tag);
  const [debounced, setDebounced] = useState("");
  const [category, setCategory] = useState("");
  const [added, setAdded] = useState<string | null>(null);
  const cart = useCart();
  const products = useProducts(debounced, category);
  const reminder = useReminder();

  useEffect(() => {
    const id = setTimeout(() => setDebounced(search.trim()), 250);
    return () => clearTimeout(id);
  }, [search]);

  useEffect(() => {
    if (!added) return;
    const id = setTimeout(() => setAdded(null), 2000);
    return () => clearTimeout(id);
  }, [added]);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Shop"
        subtitle="Period and self-care essentials"
        action={
          <Link href="/shop/cart" className="relative flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-sm" aria-label={`Cart, ${cart.count} items`}>
            <ShoppingCart className="h-5 w-5" />
            {cart.count > 0 && <span className="absolute -right-1 -top-1 rounded-full bg-teal-600 px-1.5 text-xs font-bold text-white">{cart.count}</span>}
          </Link>
        }
      />

      <p className="rounded-md bg-teal-50 p-2 text-xs text-teal-700">
        Suggestions use only your product preferences, comfort symptoms you log (like pad irritation or cramps) and your period timing. Possible health conditions are never used. Products don&apos;t treat medical problems. Sponsored and affiliate items are labelled. Your data is never sold.
      </p>

      {reminder.data?.show && (
        <div className="flex items-start gap-3 rounded-lg border border-plum-200 bg-plum-50 p-3">
          <CalendarHeart className="mt-0.5 h-5 w-5 shrink-0 text-plum-600" aria-hidden />
          <div className="flex-1 text-sm">
            <p className="font-semibold text-plum-800">Period-ready reminder</p>
            <p className="text-plum-700">
              Your next period may start in about {reminder.data.daysUntil} day{reminder.data.daysUntil === 1 ? "" : "s"}. Want to stock up?
            </p>
            <p className="mt-1 text-xs text-plum-700">Shown because you turned this on in Profile. Based only on your period dates.</p>
          </div>
        </div>
      )}

      {recs.data?.enabled && recs.data.items.length > 0 && (
        <section aria-label="Suggested for you" className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Suggested for you</h2>
            <Link href="/profile#products" className="text-xs font-semibold text-plum-600">Preferences</Link>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {recs.data.items.map(({ product, reasons }) => (
              <ProductCard key={product.id} product={product} reasons={reasons} onDismiss={() => dismiss.mutate(product.id)} onAdd={() => { cart.add(product.id); setAdded(product.name); }} />
            ))}
          </div>
        </section>
      )}
      {recs.data && !recs.data.enabled && (
        <p className="text-sm text-sand-600">Personalised suggestions are off. <Link href="/profile#products" className="font-semibold text-plum-600 underline">Turn on</Link></p>
      )}

      <div className="grid grid-cols-2 gap-2">
        <Link href="/shop/kit" className="flex min-h-12 items-center gap-2 rounded-lg border border-sand-200 bg-white p-3 text-sm font-semibold shadow-sm">
          <Sparkles className="h-5 w-5 text-plum-600" aria-hidden /> Care Kit builder
        </Link>
        <Link href="/shop/orders" className="flex min-h-12 items-center gap-2 rounded-lg border border-sand-200 bg-white p-3 text-sm font-semibold shadow-sm">
          <Package className="h-5 w-5 text-teal-600" aria-hidden /> My orders
        </Link>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sand-400" aria-hidden />
        <Input aria-label="Search products" placeholder="Search pads, cups, tea…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1" role="group" aria-label="Categories">
        <Chip selected={category === ""} onClick={() => setCategory("")}>All</Chip>
        {PRODUCT_CATEGORIES.map((c) => (
          <Chip key={c} selected={category === c} onClick={() => setCategory(c)}>
            <span className="whitespace-nowrap">{LABELS.categories[c]}</span>
          </Chip>
        ))}
      </div>

      {products.isLoading && <LoadingState label="Loading products…" />}
      {products.isError && <ErrorState message="Couldn't load products." onRetry={() => products.refetch()} />}
      {products.data && products.data.length === 0 && (
        <EmptyState title="No products found">
          <Button variant="link" onClick={() => { setSearch(""); setCategory(""); }}>Clear filters</Button>
        </EmptyState>
      )}
      {products.data && products.data.length > 0 && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {products.data.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              onAdd={() => {
                cart.add(p.id);
                setAdded(p.name);
              }}
            />
          ))}
        </div>
      )}

      <p className="text-center text-xs text-sand-600">Demo checkout: no real payments. Retailer links open the retailer&apos;s site; “Search” links show search results until a verified product link is added. No medicines are sold here.</p>

      {added && (
        <div role="status" className="fixed inset-x-4 bottom-24 z-50 mx-auto max-w-sm rounded-md bg-sand-800 p-3 text-center text-sm text-white shadow-lg">
          Added to cart
        </div>
      )}
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<Loading />}>
      <ShopInner />
    </Suspense>
  );
}
