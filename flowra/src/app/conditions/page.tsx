import Link from "next/link";
import { PublicShell } from "@/components/public-shell";
import { getSessionUser } from "@/lib/auth";
import { CONDITIONS } from "@/lib/content/conditions";

export const dynamic = "force-dynamic";

export default async function ConditionsPage() {
  const user = await getSessionUser();
  return (
    <PublicShell signedIn={Boolean(user)}>
      <div className="mx-auto max-w-5xl px-4 py-12">
        <h1 className="text-3xl font-bold">Conditions library</h1>
        <p className="mt-2 max-w-2xl text-sand-600">
          Plain-language information about menstrual and reproductive health conditions, and the symptom patterns Flowra looks for. Flowra never diagnoses; only a doctor can.
        </p>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {CONDITIONS.map((c) => (
            <Link key={c.slug} href={`/conditions/${c.slug}`} className="rounded-lg border border-sand-200 bg-white p-4 shadow-sm hover:border-plum-300">
              <h2 className="font-semibold">{c.name}</h2>
              <p className="mt-1 text-sm text-sand-600">{c.short}</p>
            </Link>
          ))}
        </div>
        <h2 className="mt-12 text-xl font-bold">Symptoms and conditions at a glance</h2>
        <p className="mt-1 text-sm text-sand-600">One symptom can point to several conditions. That is why Flowra always shows overlaps.</p>
        <div className="mt-4 overflow-x-auto rounded-lg border border-sand-200 bg-white">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-sand-100">
              <tr>
                <th className="p-3">Condition</th>
                <th className="p-3">What Flowra looks for</th>
                <th className="p-3">Can overlap with</th>
              </tr>
            </thead>
            <tbody>
              {CONDITIONS.map((c) => (
                <tr key={c.slug} className="border-t border-sand-100 align-top">
                  <td className="p-3 font-semibold"><Link href={`/conditions/${c.slug}`} className="text-plum-600 underline">{c.name}</Link></td>
                  <td className="p-3">{c.howFlowraLooks}</td>
                  <td className="p-3">{c.overlapsWith.join(", ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PublicShell>
  );
}
