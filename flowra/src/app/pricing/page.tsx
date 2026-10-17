import Link from "next/link";
import { Check } from "lucide-react";
import { PublicShell } from "@/components/public-shell";
import { getSessionUser } from "@/lib/auth";
import { PLANS } from "@/lib/plans";
import { UpgradeButton } from "./upgrade-button";

export const dynamic = "force-dynamic";

export default async function PricingPage() {
  const user = await getSessionUser();
  return (
    <PublicShell signedIn={Boolean(user)}>
      <div className="mx-auto max-w-4xl px-4 py-12">
        <h1 className="text-3xl font-bold">Simple, fair pricing</h1>
        <p className="mt-2 text-sand-600">Everything you need for safety and care is free, always. Plus adds depth and convenience.</p>
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {(["free", "plus"] as const).map((id) => {
            const p = PLANS[id];
            return (
              <div key={id} className={`rounded-xl border bg-white p-6 shadow-sm ${id === "plus" ? "border-plum-300 ring-2 ring-plum-200" : "border-sand-200"}`}>
                <h2 className="text-xl font-bold">{p.name}</h2>
                <p className="mt-1 text-3xl font-bold">
                  {p.priceInr === 0 ? "₹0" : `₹${p.priceInr}`}
                  <span className="text-base font-normal text-sand-600">{p.priceInr === 0 ? " forever" : " / month"}</span>
                </p>
                <ul className="mt-4 space-y-2 text-sm">
                  {p.features.map((f) => (
                    <li key={f} className="flex gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" aria-hidden /> {f}
                    </li>
                  ))}
                </ul>
                <div className="mt-6">
                  {id === "free" ? (
                    <Link href={user ? "/home" : "/welcome"} className="inline-flex h-11 w-full items-center justify-center rounded-md border border-sand-200 font-semibold hover:bg-sand-50">
                      {user ? "You have this" : "Start free"}
                    </Link>
                  ) : user ? (
                    <UpgradeButton current={user.plan} />
                  ) : (
                    <Link href="/welcome" className="inline-flex h-11 w-full items-center justify-center rounded-md bg-plum-600 font-semibold text-white hover:bg-plum-700">
                      Create an account
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <p className="mt-6 rounded-md bg-teal-50 p-3 text-sm text-teal-700">
          Payments are not live yet: during the beta, Plus is free to activate. We&apos;ll always tell you before any charge. Doctor consultation fees are paid to the clinic and shown before you book.
        </p>
        <p className="mt-3 text-sm text-sand-600">Never behind a paywall: urgent-care guidance, pattern alerts, basic reports, data export and deletion.</p>
      </div>
    </PublicShell>
  );
}
