"use client";
/** Cart kept in localStorage on this device only (it contains no health data). */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export interface CartLine {
  productId: string;
  qty: number;
}

interface CartContextValue {
  lines: CartLine[];
  count: number;
  add: (productId: string, qty?: number) => void;
  setQty: (productId: string, qty: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "flowra_cart_v1";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setLines(
            parsed.filter(
              (l): l is CartLine =>
                typeof l === "object" && l !== null && typeof (l as CartLine).productId === "string" && typeof (l as CartLine).qty === "number",
            ),
          );
        }
      }
    } catch {
      /* ignore unreadable storage */
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      /* storage may be unavailable (private mode) */
    }
  }, [lines, loaded]);

  const add = useCallback((productId: string, qty = 1) => {
    setLines((prev) => {
      const found = prev.find((l) => l.productId === productId);
      if (found) return prev.map((l) => (l.productId === productId ? { ...l, qty: Math.min(l.qty + qty, 10) } : l));
      return [...prev, { productId, qty: Math.min(qty, 10) }];
    });
  }, []);
  const setQty = useCallback((productId: string, qty: number) => {
    setLines((prev) => (qty <= 0 ? prev.filter((l) => l.productId !== productId) : prev.map((l) => (l.productId === productId ? { ...l, qty: Math.min(qty, 10) } : l))));
  }, []);
  const remove = useCallback((productId: string) => setLines((prev) => prev.filter((l) => l.productId !== productId)), []);
  const clear = useCallback(() => setLines([]), []);

  const value = useMemo(
    () => ({ lines, count: lines.reduce((s, l) => s + l.qty, 0), add, setQty, remove, clear }),
    [lines, add, setQty, remove, clear],
  );
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
