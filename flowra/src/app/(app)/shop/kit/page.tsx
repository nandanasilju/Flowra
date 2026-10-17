"use client";
import type { ProductDTO } from "@/lib/types";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingCart } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { ProductVisual } from "@/components/product-card";
import { ErrorState, LoadingState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { useCart } from "@/lib/client/cart";
import { useProducts } from "@/lib/client/hooks";
import { buildCareKit, type Flow, type KitPreferences } from "@/lib/shop/kit";
import { formatInr } from "@/lib/utils";

const FLOWS: { value: Flow; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "medium", label: "Medium" },
  { value: "heavy", label: "Heavy" },
];

const PREFS: { key: Exclude<keyof KitPreferences, "flow">; label: string }[] = [
  { key: "cotton", label: "Cotton" },
  { key: "organic", label: "Organic" },
  { key: "reusable", label: "Reusable" },
  { key: "comfort", label: "Add comfort items" },
];

export default function CareKitPage() {
  const router = useRouter();
  const cart = useCart();
  const products = useProducts("", "");
  const [prefs, setPrefs] = useState<KitPreferences>({ flow: "medium", cotton: true, organic: false, reusable: false, comfort: true });

  const kit = useMemo(() => (products.data ? buildCareKit(products.data, prefs) : []), [products.data, prefs]);
  const byId = new Map<string, ProductDTO>((products.data ?? []).map((p: ProductDTO) => [p.id, p] as const));
  const total = kit.reduce((s, k) => s + (byId.get(k.productId)?.priceInr ?? 0) * k.qty, 0);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Care Kit builder" subtitle="Tell us what you like; we suggest a kit." back="/shop" />
      <p className="rounded-md bg-teal-50 p-2 text-xs text-teal-700">Uses only the choices below. Your pain logs are never used for product suggestions.</p>

      <Card>
        <CardContent className="flex flex-col gap-3 pt-4">
          <div>
            <p className="mb-2 text-sm font-semibold">Your usual flow</p>
            <div className="flex gap-2" role="radiogroup" aria-label="Flow">
              {FLOWS.map((f) => (
                <Chip key={f.value} selected={prefs.flow === f.value} onClick={() => setPrefs((p) => ({ ...p, flow: f.value }))}>
                  {f.label}
                </Chip>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold">Preferences</p>
            <div className="flex flex-wrap gap-2">
              {PREFS.map((p) => (
                <Chip key={p.key} selected={prefs[p.key]} onClick={() => setPrefs((s) => ({ ...s, [p.key]: !s[p.key] }))}>
                  {p.label}
                </Chip>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {products.isLoading && <LoadingState />}
      {products.isError && <ErrorState message="Couldn't load products." onRetry={() => products.refetch()} />}
      {products.data && (
        <section aria-label="Suggested kit" className="flex flex-col gap-2">
          <h2 className="font-semibold">Your suggested kit</h2>
          {kit.map((k) => {
            const p = byId.get(k.productId);
            if (!p) return null;
            return (
              <div key={k.productId} className="flex items-center gap-3 rounded-lg border border-sand-200 bg-white p-2.5">
                <ProductVisual product={p} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase text-plum-600">{k.role}</p>
                  <p className="line-clamp-2 text-sm font-semibold">{p.name}</p>
                  <p className="text-xs text-sand-600">{k.why}{p.sponsored ? " · Sponsored" : ""}</p>
                </div>
                <p className="text-sm font-semibold tabular-nums">
                  {k.qty} × {formatInr(p.priceInr)}
                </p>
              </div>
            );
          })}
          <div className="flex items-center justify-between rounded-lg bg-white p-3 font-bold">
            <span>Kit total</span>
            <span>{formatInr(total)}</span>
          </div>
          <Button
            size="lg"
            disabled={kit.length === 0}
            onClick={() => {
              for (const k of kit) cart.add(k.productId, k.qty);
              router.push("/shop/cart");
            }}
          >
            <ShoppingCart /> Add kit to cart
          </Button>
          <Link href="/shop" className="text-center text-sm font-semibold text-plum-600 underline">Browse everything instead</Link>
        </section>
      )}
    </div>
  );
}
