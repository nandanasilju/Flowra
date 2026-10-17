"use client";
import { ExternalLink, Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LABELS, type ProductDTO } from "@/lib/types";
import { formatInr } from "@/lib/utils";

const GRADIENTS: Record<ProductDTO["category"], string> = {
  pads: "from-plum-50 to-plum-100",
  tampons: "from-teal-50 to-teal-100",
  cups: "from-pink-50 to-plum-100",
  period_underwear: "from-sand-100 to-plum-50",
  comfort: "from-amber-50 to-orange-100",
  hygiene: "from-teal-50 to-sand-100",
};

/** Product tile with an emoji visual on a CSS gradient (no remote images). */
export function ProductVisual({ product, size = "md" }: { product: Pick<ProductDTO, "emoji" | "category">; size?: "sm" | "md" }) {
  return (
    <div className={`flex items-center justify-center rounded-md bg-gradient-to-br ${GRADIENTS[product.category]} ${size === "sm" ? "h-12 w-12 text-2xl" : "h-24 text-5xl"}`} aria-hidden>
      {product.emoji}
    </div>
  );
}

export function RetailerLink({ product }: { product: ProductDTO }) {
  if (!product.url) return null;
  return (
    <a
      href={product.url}
      target="_blank"
      rel={`noopener noreferrer${product.affiliate ? " sponsored" : ""}`}
      className="inline-flex items-center gap-1 text-xs font-semibold text-plum-600 underline"
    >
      <ExternalLink className="h-3 w-3" aria-hidden />
      {product.linkVerified ? `Buy on ${product.retailer}` : `Search on ${product.retailer.replace(" (search)", "")}`}
    </a>
  );
}

export function ProductCard({ product, onAdd, reasons, onDismiss }: { product: ProductDTO; onAdd: () => void; reasons?: string[]; onDismiss?: () => void }) {
  const out = product.stock <= 0;
  return (
    <article className="flex flex-col gap-2 rounded-lg border border-sand-200 bg-white p-2.5 shadow-sm">
      <div className="relative">
        <ProductVisual product={product} />
        <div className="absolute left-1.5 top-1.5 flex gap-1">
          {product.sponsored && <Badge variant="sponsored">Sponsored</Badge>}
          {product.affiliate && <Badge variant="neutral">Affiliate link</Badge>}
        </div>
        {onDismiss && (
          <button type="button" onClick={onDismiss} aria-label={`Hide ${product.name}`} className="absolute right-1 top-1 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-sand-600 hover:bg-white">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <p className="text-xs text-sand-600">{LABELS.categories[product.category]}</p>
      <h3 className="line-clamp-2 text-sm font-semibold leading-snug">{product.name}</h3>
      <p className="line-clamp-2 text-xs text-sand-600">{product.description}</p>
      {reasons && reasons.length > 0 && (
        <ul className="rounded bg-teal-50 p-1.5 text-[11px] text-teal-700">
          {reasons.slice(0, 2).map((r) => <li key={r}>• {r}</li>)}
        </ul>
      )}
      <RetailerLink product={product} />
      <div className="mt-auto flex items-center justify-between gap-2">
        <span className="font-bold">{formatInr(product.priceInr)}</span>
        <Button size="sm" variant="teal" onClick={onAdd} disabled={out} aria-label={`Add ${product.name} to cart`}>
          {out ? "Out of stock" : <><Plus /> Add</>}
        </Button>
      </div>
    </article>
  );
}
