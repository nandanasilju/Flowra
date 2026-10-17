import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicShell } from "@/components/public-shell";
import { getSessionUser } from "@/lib/auth";
import { getCondition } from "@/lib/content/conditions";

export const dynamic = "force-dynamic";

export default async function ConditionPage({ params }: { params: { slug: string } }) {
  const c = getCondition(params.slug);
  if (!c) notFound();
  const user = await getSessionUser();
  return (
    <PublicShell signedIn={Boolean(user)}>
      <article className="mx-auto max-w-3xl px-4 py-12">
        <Link href="/conditions" className="text-sm font-semibold text-plum-600">← Conditions</Link>
        <h1 className="mt-4 text-3xl font-bold">{c.name}</h1>
        <p className="mt-3">{c.about}</p>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <section className="rounded-lg border border-sand-200 bg-white p-5">
            <h2 className="font-semibold">Common signs</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">{c.commonSigns.map((s) => <li key={s}>{s}</li>)}</ul>
          </section>
          <section className="rounded-lg border border-sand-200 bg-white p-5">
            <h2 className="font-semibold">A doctor may</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">{c.doctorMayDo.map((s) => <li key={s}>{s}</li>)}</ul>
          </section>
        </div>
        <section className="mt-4 rounded-lg bg-plum-50 p-5 text-sm">
          <h2 className="font-semibold text-plum-800">How Flowra looks for this pattern</h2>
          <p className="mt-1 text-plum-800">{c.howFlowraLooks}</p>
          <p className="mt-2 text-plum-700">Can overlap with: {c.overlapsWith.join(", ")}. A pattern is a reason to talk to a doctor, not a diagnosis.</p>
        </section>
        {c.urgent.length > 0 && (
          <section className="mt-4 rounded-lg border border-red-200 bg-red-50 p-5 text-sm text-red-900">
            <h2 className="font-semibold">Get urgent care if</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5">{c.urgent.map((s) => <li key={s}>{s}</li>)}</ul>
            <a href="tel:112" className="mt-3 inline-flex h-10 items-center rounded-md bg-level-urgent px-4 font-semibold text-white">Call 112</a>
          </section>
        )}
        <div className="mt-6 flex flex-wrap gap-2">
          <Link href={user ? "/doctors" : "/welcome"} className="inline-flex h-11 items-center rounded-md bg-plum-600 px-4 font-semibold text-white">Find a doctor</Link>
          <Link href={user ? "/care" : "/welcome"} className="inline-flex h-11 items-center rounded-md border border-sand-200 bg-white px-4 font-semibold">Check my patterns</Link>
        </div>
        <section className="mt-8 text-sm">
          <h2 className="font-semibold">References</h2>
          <ul className="mt-1 space-y-1">
            {c.references.map((r) => (
              <li key={r.url}><a href={r.url} target="_blank" rel="noopener noreferrer" className="text-plum-600 underline">{r.label}</a></li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-sand-600">Educational content, awaiting clinician review. Not medical advice.</p>
        </section>
      </article>
    </PublicShell>
  );
}
